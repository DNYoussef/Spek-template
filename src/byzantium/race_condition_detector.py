from src.constants.base import MAXIMUM_NESTED_DEPTH

Advanced race condition detection and prevention system specifically
designed for detector pool thread safety validation. Integrates with
Byzantine consensus for distributed validation of concurrent operations.

Detection Capabilities:
- Data race detection in shared memory access patterns
- Lock ordering validation for deadlock prevention
- Atomic operation verification
- Memory consistency checking
- Thread interleaving analysis
- Critical section violation detection
"""

import ast
import threading
import time
import traceback
from collections import defaultdict, deque
from contextlib import contextmanager
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Union
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

class RaceType(Enum):
    """Types of race conditions that can be detected."""
    DATA_RACE = auto()
    DEADLOCK = auto()
    LIVELOCK = auto()
    ATOMICITY_VIOLATION = auto()
    ORDER_VIOLATION = auto()
    MEMORY_CONSISTENCY = auto()

class AccessType(Enum):
    """Memory access types."""
    READ = auto()
    WRITE = auto()
    MODIFY = auto()  # Read-modify-write

@dataclass
class MemoryAccess:
    """Represents a memory access operation."""
    thread_id: int
    memory_location: str
    access_type: AccessType
    timestamp: float
    stack_trace: List[str]
    lock_context: List[str]
    value: Any = None
    line_number: int = 0
    function_name: str = ""

@dataclass
class RaceConditionViolation:
    """Represents a detected race condition."""
    race_type: RaceType
    description: str
    thread_ids: List[int]
    memory_locations: List[str]
    conflicting_accesses: List[MemoryAccess]
    severity: str  # "low", "medium", "high", "critical"
    timestamp: float
    detection_method: str
    suggested_fix: str
    confidence: float = 1.0

class ThreadInterleaving:
    """Tracks thread interleaving patterns for race detection."""
    
    def __init__(self, max_history: int = 10000):
        self.max_history = max_history
        self.access_history: deque = deque(maxlen=max_history)
        self.thread_states: Dict[int, Dict] = defaultdict(dict)
        self.lock_acquisitions: Dict[str, List[Tuple[int, float]]] = defaultdict(list)
        self._lock = threading.RLock()
    
    def record_access(self, access: MemoryAccess) -> None:
        """Record memory access for interleaving analysis."""
        with self._lock:
            self.access_history.append(access)
            
            # Update thread state
            self.thread_states[access.thread_id].update({
                'last_access': access,
                'access_count': self.thread_states[access.thread_id].get('access_count', 0) + 1,
                'last_timestamp': access.timestamp
            })
    
    def record_lock_acquisition(self, thread_id: int, lock_name: str, timestamp: float) -> None:
        """Record lock acquisition for deadlock detection."""
        with self._lock:
            self.lock_acquisitions[lock_name].append((thread_id, timestamp))
            
            # Keep only recent acquisitions
            cutoff_time = timestamp - 60.0  # 60 seconds
            self.lock_acquisitions[lock_name] = [
                (tid, ts) for tid, ts in self.lock_acquisitions[lock_name]
                if ts > cutoff_time
            ]
    
    def detect_conflicting_accesses(self, window_ms: float = 1000.0) -> List[Tuple[MemoryAccess, MemoryAccess]]:
        """Detect potentially conflicting memory accesses within time window."""
        conflicts = []
        current_time = time.time()
        
        with self._lock:
            # Group accesses by memory location
            location_accesses = defaultdict(list)
            for access in self.access_history:
                if (current_time - access.timestamp) * 1000 <= window_ms:
                    location_accesses[access.memory_location].append(access)
            
            # Find conflicts within each location
            for location, accesses in location_accesses.items():
                accesses.sort(key=lambda a: a.timestamp)
                
                for i, access1 in enumerate(accesses):
                    for access2 in accesses[i+1:]:
                        if self._is_conflicting_access(access1, access2):
                            conflicts.append((access1, access2))
        
        return conflicts
    
    def _is_conflicting_access(self, access1: MemoryAccess, access2: MemoryAccess) -> bool:
        """Check if two accesses conflict (potential race condition)."""
        # Different threads accessing same location
        if access1.thread_id == access2.thread_id:
            return False
        
        # At least one must be a write for a race condition
        if access1.access_type == AccessType.READ and access2.access_type == AccessType.READ:
            return False
        
        # Check if accesses are protected by same locks
        common_locks = set(access1.lock_context) & set(access2.lock_context)
        if common_locks:
            return False  # Protected by mutual exclusion
        
        return True
    
    def detect_deadlock_potential(self) -> List[Dict[str, Any]]:
        """Detect potential deadlock scenarios from lock acquisition patterns."""
        deadlock_risks = []
        
        with self._lock:
            # Build lock dependency graph
            lock_graph = defaultdict(set)
            thread_locks = defaultdict(list)
            
            # Analyze recent lock acquisitions
            current_time = time.time()
            for lock_name, acquisitions in self.lock_acquisitions.items():
                recent_acquisitions = [
                    (tid, ts) for tid, ts in acquisitions
                    if current_time - ts < 30.0  # Last 30 seconds
                ]
                
                for thread_id, timestamp in recent_acquisitions:
                    thread_locks[thread_id].append((lock_name, timestamp))
            
            # Sort by timestamp for each thread to get lock ordering
            for thread_id, locks in thread_locks.items():
                locks.sort(key=lambda x: x[1])
                
                # Build dependency graph
                for i in range(len(locks) - 1):
                    lock1 = locks[i][0]
                    lock2 = locks[i + 1][0]
                    lock_graph[lock1].add(lock2)
            
            # Detect cycles in lock graph (potential deadlocks)
            visited = set()
            rec_stack = set()
            
            def has_cycle(node: str, path: List[str]) -> bool:
                if node in rec_stack:
                    cycle_start = path.index(node)
                    cycle = path[cycle_start:] + [node]
                    deadlock_risks.append({
                        'type': 'deadlock_cycle',
                        'locks_involved': cycle,
                        'description': f"Potential deadlock cycle: {' -> '.join(cycle)}",
                        'severity': 'high'
                    })
                    return True
                
                if node in visited:
                    return False
                
                visited.add(node)
                rec_stack.add(node)
                path.append(node)
                
                for neighbor in lock_graph.get(node, []):
                    if has_cycle(neighbor, path):
                        return True
                
                rec_stack.remove(node)
                path.pop()
                return False
            
            for lock in lock_graph:
                if lock not in visited:
                    has_cycle(lock, [])
        
        return deadlock_risks

class DetectorPoolRaceDetector:
    """
    Race condition detector specialized for detector pool operations.
    
    Monitors detector acquisition, release, and usage patterns to identify
    potential race conditions, deadlocks, and thread safety violations.
    """
    
    def __init__(self, enable_instrumentation: bool = True):
        """
        Initialize detector pool race detector.
        
        Args:
            enable_instrumentation: Enable automatic instrumentation of detector operations
        """
        self.enable_instrumentation = enable_instrumentation
        
        # Race detection state
        self.interleaving_tracker = ThreadInterleaving()
        self.detected_races: List[RaceConditionViolation] = []
        self.monitored_objects: Dict[id, weakref.ref] = {}
        
        # Detector pool specific tracking
        self.detector_accesses: Dict[str, List[MemoryAccess]] = defaultdict(list)
        self.pool_operations: deque = deque(maxlen=5000)
        self.active_operations: Dict[int, Dict] = {}  # thread_id -> operation info
        
        # Thread safety
        self._detection_lock = threading.RLock()
        
        # Detection configuration
        self.detection_config = {
            'race_detection_window_ms': 1000.0,
            'deadlock_detection_enabled': True,
            'atomic_operation_validation': True,
            'memory_consistency_checking': True,
            'stack_trace_depth': 10
        }
        
        logger.info(f"DetectorPoolRaceDetector initialized with instrumentation={'enabled' if enable_instrumentation else 'disabled'}")
    
    @contextmanager
    def monitor_detector_operation(self, 
                                    operation: str, 
                                    detector_id: str,
                                    expected_atomic: bool = True):
        """
        Context manager to monitor detector pool operations for race conditions.
        
        Args:
            operation: Operation name (e.g., 'acquire', 'release')
            detector_id: Unique detector identifier
            expected_atomic: Whether operation should be atomic
        """
        thread_id = threading.get_ident()
        operation_start = time.time()
        
        # Record operation start
        operation_info = {
            'operation': operation,
            'detector_id': detector_id,
            'thread_id': thread_id,
            'start_time': operation_start,
            'expected_atomic': expected_atomic,
            'locks_held': self._get_current_locks(),
            'stack_trace': self._capture_stack_trace()
        }
        
        with self._detection_lock:
            self.active_operations[thread_id] = operation_info
        
        try:
            yield self
            
            # Record successful operation
            operation_info['success'] = True
            operation_info['end_time'] = time.time()
            
        except Exception as e:
            # Record failed operation
            operation_info['success'] = False
            operation_info['error'] = str(e)
            operation_info['end_time'] = time.time()
            
            # Check if failure might indicate race condition
            self._analyze_operation_failure(operation_info, e)
            
            raise
        
        finally:
            # Clean up and analyze operation
            with self._detection_lock:
                self.active_operations.pop(thread_id, None)
                self.pool_operations.append(operation_info)
            
            self._analyze_completed_operation(operation_info)
    
    def instrument_memory_access(self, 
                                memory_location: str, 
                                access_type: AccessType,
                                value: Any = None) -> None:
        """
        Instrument memory access for race detection.
        
        Args:
            memory_location: String identifier for memory location
            access_type: Type of memory access
            value: Value being accessed (optional)
        """
        if not self.enable_instrumentation:
            return
        
        thread_id = threading.get_ident()
        timestamp = time.time()
        
        # Capture context information
        stack_trace = self._capture_stack_trace()
        lock_context = self._get_current_locks()
        
        # Create memory access record
        access = MemoryAccess(
            thread_id=thread_id,
            memory_location=memory_location,
            access_type=access_type,
            timestamp=timestamp,
            stack_trace=stack_trace,
            lock_context=lock_context,
            value=value,
            line_number=self._get_line_number(stack_trace),
            function_name=self._get_function_name(stack_trace)
        )
        
        # Record access for analysis
        self.interleaving_tracker.record_access(access)
        
        with self._detection_lock:
            self.detector_accesses[memory_location].append(access)
        
        # Immediate race detection
        self._check_immediate_race_condition(access)
    
    def instrument_lock_acquisition(self, lock_name: str) -> None:
        """Instrument lock acquisition for deadlock detection."""
        thread_id = threading.get_ident()
        timestamp = time.time()
        
        self.interleaving_tracker.record_lock_acquisition(thread_id, lock_name, timestamp)
    
    def detect_race_conditions(self, analysis_window_ms: float = 5000.0) -> List[RaceConditionViolation]:
        """
        Perform comprehensive race condition detection.
        
        Args:
            analysis_window_ms: Time window for analysis in milliseconds
            
        Returns:
            List of detected race conditions
        """
        detected_races = []
        
        # 1. Data race detection
        data_races = self._detect_data_races(analysis_window_ms)
        detected_races.extend(data_races)
        
        # 2. Deadlock detection
        if self.detection_config['deadlock_detection_enabled']:
            deadlocks = self._detect_deadlocks()
            detected_races.extend(deadlocks)
        
        # 3. Atomicity violation detection
        if self.detection_config['atomic_operation_validation']:
            atomicity_violations = self._detect_atomicity_violations(analysis_window_ms)
            detected_races.extend(atomicity_violations)
        
        # 4. Order violation detection
        order_violations = self._detect_order_violations()
        detected_races.extend(order_violations)
        
        # 5. Memory consistency violations
        if self.detection_config['memory_consistency_checking']:
            memory_violations = self._detect_memory_consistency_violations()
            detected_races.extend(memory_violations)
        
        # Store detected races
        with self._detection_lock:
            self.detected_races.extend(detected_races)
        
        return detected_races
    
    def _detect_data_races(self, window_ms: float) -> List[RaceConditionViolation]:
        """Detect data races in memory access patterns."""
        violations = []
        
        # Find conflicting accesses
        conflicts = self.interleaving_tracker.detect_conflicting_accesses(window_ms)
        
        for access1, access2 in conflicts:
            violation = RaceConditionViolation(
                race_type=RaceType.DATA_RACE,
                description=f"Data race detected: {access1.access_type.name} by thread {access1.thread_id} "
                            f"conflicts with {access2.access_type.name} by thread {access2.thread_id} "
                            f"on {access1.memory_location}",
                thread_ids=[access1.thread_id, access2.thread_id],
                memory_locations=[access1.memory_location],
                conflicting_accesses=[access1, access2],
                severity=self._assess_race_severity(access1, access2),
                timestamp=time.time(),
                detection_method="interleaving_analysis",
                suggested_fix=self._suggest_data_race_fix(access1, access2),
                confidence=self._calculate_confidence(access1, access2)
            )
            violations.append(violation)
        
        return violations
    
    def _detect_deadlocks(self) -> List[RaceConditionViolation]:
        """Detect potential deadlock conditions."""
        violations = []
        
        deadlock_risks = self.interleaving_tracker.detect_deadlock_potential()
        
        for risk in deadlock_risks:
            violation = RaceConditionViolation(
                race_type=RaceType.DEADLOCK,
                description=risk['description'],
                thread_ids=[],  # Multiple threads potentially involved
                memory_locations=[],
                conflicting_accesses=[],
                severity=risk['severity'],
                timestamp=time.time(),
                detection_method="lock_ordering_analysis",
                suggested_fix=f"Establish consistent lock ordering: {' -> '.join(sorted(risk['locks_involved']))}",
                confidence=0.8  # Deadlock detection has some uncertainty
            )
            violations.append(violation)
        
        return violations
    
    def _detect_atomicity_violations(self, window_ms: float) -> List[RaceConditionViolation]:
        """Detect atomicity violations in detector operations."""
        violations = []
        
        with self._detection_lock:
            # Analyze recent operations for atomicity violations
            current_time = time.time()
            recent_ops = [
                op for op in self.pool_operations
                if (current_time - op['start_time']) * 1000 <= window_ms
            ]
            
            # Group operations by detector_id
            detector_ops = defaultdict(list)
            for op in recent_ops:
                detector_ops[op['detector_id']].append(op)
            
            # Check for concurrent operations on same detector
            for detector_id, ops in detector_ops.items():
                if len(ops) > 1:
                    # Check if operations were expected to be atomic
                    atomic_ops = [op for op in ops if op.get('expected_atomic', False)]
                    
                    if len(atomic_ops) > 1:
                        # Check for temporal overlap
                        overlapping_ops = self._find_overlapping_operations(atomic_ops)
                        
                        for op_group in overlapping_ops:
                            if len(op_group) > 1:
                                violation = RaceConditionViolation(
                                    race_type=RaceType.ATOMICITY_VIOLATION,
                                    description=f"Atomicity violation: Concurrent {[op['operation'] for op in op_group]} "
                                                f"operations on detector {detector_id}",
                                    thread_ids=[op['thread_id'] for op in op_group],
                                    memory_locations=[f"detector_{detector_id}"],
                                    conflicting_accesses=[],
                                    severity="high",
                                    timestamp=time.time(),
                                    detection_method="operation_overlap_analysis",
                                    suggested_fix="Ensure atomic operations are properly synchronized",
                                    confidence=0.9
                                )
                                violations.append(violation)
        
        return violations
    
    def _detect_order_violations(self) -> List[RaceConditionViolation]:
        """Detect order violations in detector operations."""
        violations = []
        
        with self._detection_lock:
            # Analyze operation sequences for ordering violations
            for detector_id, accesses in self.detector_accesses.items():
                if len(accesses) < 2:
                    continue
                
                # Sort by timestamp
                sorted_accesses = sorted(accesses, key=lambda a: a.timestamp)
                
                # Check for problematic ordering patterns
                for i in range(len(sorted_accesses) - 1):
                    curr_access = sorted_accesses[i]
                    next_access = sorted_accesses[i + 1]
                    
                    # Check for write-after-write without proper synchronization
                    if (curr_access.access_type == AccessType.WRITE and 
                        next_access.access_type == AccessType.WRITE and
                        curr_access.thread_id != next_access.thread_id and
                        not set(curr_access.lock_context) & set(next_access.lock_context)):
                        
                        violation = RaceConditionViolation(
                            race_type=RaceType.ORDER_VIOLATION,
                            description=f"Order violation: Unsynchronized writes to {detector_id} "
                                        f"by threads {curr_access.thread_id} and {next_access.thread_id}",
                            thread_ids=[curr_access.thread_id, next_access.thread_id],
                            memory_locations=[detector_id],
                            conflicting_accesses=[curr_access, next_access],
                            severity="medium",
                            timestamp=time.time(),
                            detection_method="ordering_analysis",
                            suggested_fix="Add proper synchronization between write operations",
                            confidence=0.85
                        )
                        violations.append(violation)
        
        return violations
    
    def _detect_memory_consistency_violations(self) -> List[RaceConditionViolation]:
        """Detect memory consistency violations."""
        violations = []
        
        with self._detection_lock:
            # Look for inconsistent read values for same memory location
            for location, accesses in self.detector_accesses.items():
                reads_by_thread = defaultdict(list)
                
                for access in accesses:
                    if access.access_type == AccessType.READ and access.value is not None:
                        reads_by_thread[access.thread_id].append(access)
                
                # Check for inconsistent reads within short time windows
                for thread_id, reads in reads_by_thread.items():
                    if len(reads) < 2:
                        continue
                    
                    reads.sort(key=lambda r: r.timestamp)
                    
                    for i in range(len(reads) - 1):
                        read1 = reads[i]
                        read2 = reads[i + 1]
                        
                        # If reads are close in time but return different values
                        if (read2.timestamp - read1.timestamp < 0.1 and  # 100ms window
                            read1.value != read2.value):
                            
                            violation = RaceConditionViolation(
                                race_type=RaceType.MEMORY_CONSISTENCY,
                                description=f"Memory consistency violation: Thread {thread_id} "
                                            f"read different values ({read1.value} vs {read2.value}) "
                                            f"from {location} within 100ms",
                                thread_ids=[thread_id],
                                memory_locations=[location],
                                conflicting_accesses=[read1, read2],
                                severity="medium",
                                timestamp=time.time(),
                                detection_method="consistency_analysis",
                                suggested_fix="Review memory barriers and synchronization",
                                confidence=0.7
                            )
                            violations.append(violation)
        
        return violations
    
    def _check_immediate_race_condition(self, access: MemoryAccess) -> None:
        """Check for immediate race conditions as access is recorded."""
        # Look for recent conflicting accesses to same location
        current_time = time.time()
        
        with self._detection_lock:
            recent_accesses = [
                a for a in self.detector_accesses[access.memory_location]
                if (current_time - a.timestamp) < 0.1 and a.thread_id != access.thread_id
            ]
            
            for recent_access in recent_accesses:
                if self.interleaving_tracker._is_conflicting_access(access, recent_access):
                    # Immediate race condition detected
                    logger.warning(f"Immediate race condition detected: "
                                f"{access.access_type.name} by thread {access.thread_id} "
                                f"conflicts with {recent_access.access_type.name} "
                                f"by thread {recent_access.thread_id} on {access.memory_location}")
    
    def _analyze_operation_failure(self, operation_info: Dict, exception: Exception) -> None:
        """Analyze operation failure for potential race condition causes."""
        # Common race condition indicators in exceptions
        race_indicators = [
            'deadlock',
            'timeout',
            'resource busy',
            'concurrent modification',
            'state inconsistency'
        ]
        
        error_message = str(exception).lower()
        for indicator in race_indicators:
            if indicator in error_message:
                logger.warning(f"Operation failure may indicate race condition: "
                            f"{operation_info['operation']} failed with '{indicator}' "
                            f"on thread {operation_info['thread_id']}")
                break
    
    def _analyze_completed_operation(self, operation_info: Dict) -> None:
        """Analyze completed operation for race condition patterns."""
        # Check operation duration for potential contention
        duration = operation_info['end_time'] - operation_info['start_time']
        
        if duration > 1.0:  # Operations taking more than 1 second might indicate contention
            logger.warning(f"Slow operation detected: {operation_info['operation']} "
                            f"took {duration:.2f}s on thread {operation_info['thread_id']}")
    
    def _find_overlapping_operations(self, operations: List[Dict]) -> List[List[Dict]]:
        """Find groups of temporally overlapping operations."""
        overlapping_groups = []
        
        for i, op1 in enumerate(operations):
            group = [op1]
            
            for j, op2 in enumerate(operations[i+1:], i+1):
                # Check if operations overlap in time
                if (op1['start_time'] <= op2['end_time'] and 
                    op2['start_time'] <= op1['end_time']):
                    group.append(op2)
            
            if len(group) > 1:
                overlapping_groups.append(group)
        
        return overlapping_groups
    
    def _assess_race_severity(self, access1: MemoryAccess, access2: MemoryAccess) -> str:
        """Assess severity of race condition between two accesses."""
        # Write-write conflicts are most severe
        if access1.access_type == AccessType.WRITE and access2.access_type == AccessType.WRITE:
            return "critical"
        
        # Read-write conflicts are high severity
        if (access1.access_type in [AccessType.WRITE, AccessType.MODIFY] or
            access2.access_type in [AccessType.WRITE, AccessType.MODIFY]):
            return "high"
        
        return "medium"
    
    def _suggest_data_race_fix(self, access1: MemoryAccess, access2: MemoryAccess) -> str:
        """Suggest fix for data race between two accesses."""
        if not access1.lock_context and not access2.lock_context:
            return f"Add mutual exclusion (lock) for access to {access1.memory_location}"
        
        if access1.lock_context != access2.lock_context:
            return f"Use consistent locking for {access1.memory_location}: ensure both threads use same lock"
        
        return f"Review synchronization logic for {access1.memory_location}"
    
    def _calculate_confidence(self, access1: MemoryAccess, access2: MemoryAccess) -> float:
        """Calculate confidence level for race condition detection."""
        confidence = 1.0
        
        # Reduce confidence if accesses are far apart in time
        time_diff = abs(access2.timestamp - access1.timestamp)
        if time_diff > 0.1:  # More than 100ms apart
            confidence *= max(0.5, 1.0 - time_diff)
        
        # Increase confidence for write conflicts
        if access1.access_type == AccessType.WRITE or access2.access_type == AccessType.WRITE:
            confidence = min(1.0, confidence * 1.2)
        
        return confidence
    
    def _capture_stack_trace(self) -> List[str]:
        """Capture current stack trace for debugging."""
        try:
            stack = traceback.extract_stack()
            return [f"{frame.filename}:{frame.lineno} in {frame.name}" 
                    for frame in stack[-self.detection_config['stack_trace_depth']:]]
        except Exception:
            return ["<stack trace unavailable>"]
    
    def _get_current_locks(self) -> List[str]:
        """Get currently held locks for this thread (simplified implementation)."""
        # This is a simplified implementation
        current_frame = inspect.currentframe()
        try:
            locks_held = []
            frame = current_frame
            while frame:
                local_vars = frame.f_locals
                # Look for lock objects in local variables
                for var_name, var_value in local_vars.items():
                    if hasattr(var_value, '_lock') or 'lock' in var_name.lower():
                        locks_held.append(var_name)
                frame = frame.f_back
            return locks_held
        finally:
            del current_frame
    
    def _get_line_number(self, stack_trace: List[str]) -> int:
        """Extract line number from stack trace."""
        if stack_trace:
            try:
                line_info = stack_trace[-1].split(':')[1]
                return int(line_info.split(' ')[0])
            except (IndexError, ValueError):
                pass
        return 0
    
    def _get_function_name(self, stack_trace: List[str]) -> str:
        """Extract function name from stack trace."""
        if stack_trace:
            try:
                return stack_trace[-1].split(' in ')[-1]
            except IndexError:
                pass
        return ""
    
    def get_race_detection_report(self) -> Dict[str, Any]:
        """Generate comprehensive race condition detection report."""
        with self._detection_lock:
            total_accesses = sum(len(accesses) for accesses in self.detector_accesses.values())
            race_by_type = defaultdict(int)
            
            for race in self.detected_races:
                race_by_type[race.race_type.name] += 1
            
            severity_distribution = defaultdict(int)
            for race in self.detected_races:
                severity_distribution[race.severity] += 1
            
            return {
                'detection_summary': {
                    'total_memory_accesses': total_accesses,
                    'total_races_detected': len(self.detected_races),
                    'monitored_locations': len(self.detector_accesses),
                    'active_operations': len(self.active_operations),
                    'instrumentation_enabled': self.enable_instrumentation
                },
                'race_types_detected': dict(race_by_type),
                'severity_distribution': dict(severity_distribution),
                'detection_configuration': self.detection_config,
                'recent_races': [
                    {
                        'race_type': race.race_type.name,
                        'description': race.description,
                        'severity': race.severity,
                        'confidence': race.confidence,
                        'timestamp': race.timestamp
                    }
                    for race in self.detected_races[-10:]  # Last 10 races
                ],
                'recommendations': self._generate_race_prevention_recommendations()
            }
    
    def _generate_race_prevention_recommendations(self) -> List[str]:
        """Generate recommendations for race condition prevention."""
        recommendations = []
        
        if not self.detected_races:
            recommendations.append("[CHECK] No race conditions detected - thread safety appears good")
            return recommendations
        
        # Analyze detected races for patterns
        race_types = [race.race_type for race in self.detected_races]
        
        if RaceType.DATA_RACE in race_types:
            recommendations.append("HIGH: Implement proper mutual exclusion for shared data access")
        
        if RaceType.DEADLOCK in race_types:
            recommendations.append("CRITICAL: Establish consistent lock ordering to prevent deadlocks")
        
        if RaceType.ATOMICITY_VIOLATION in race_types:
            recommendations.append("HIGH: Ensure atomic operations are properly synchronized")
        
        if RaceType.ORDER_VIOLATION in race_types:
            recommendations.append("MEDIUM: Review operation ordering and add necessary synchronization")
        
        if RaceType.MEMORY_CONSISTENCY in race_types:
            recommendations.append("MEDIUM: Add memory barriers and review consistency requirements")
        
        # General recommendations based on detection patterns
        high_severity_races = [race for race in self.detected_races if race.severity in ['high', 'critical']]
        if len(high_severity_races) > 5:
            recommendations.append("CRITICAL: Multiple high-severity races detected - comprehensive review needed")
        
        return recommendations

# Global race detector instance
_global_race_detector: Optional[DetectorPoolRaceDetector] = None
_detector_lock = threading.Lock()

def get_global_race_detector() -> DetectorPoolRaceDetector:
    """Get or create global race detector instance."""
    global _global_race_detector
    with _detector_lock:
        if _global_race_detector is None:
            _global_race_detector = DetectorPoolRaceDetector()
        return _global_race_detector

def validate_detector_pool_race_safety() -> Dict[str, Any]:
    """Run comprehensive race condition validation for detector pool."""
    race_detector = get_global_race_detector()
    
    # Simulate detector pool operations to test race detection
    test_scenarios = [
        # Scenario 1: Concurrent detector acquisition
        {
            'name': 'concurrent_acquisition',
            'operations': [
                lambda: race_detector.instrument_memory_access("pool_size", AccessType.READ),
                lambda: race_detector.instrument_memory_access("pool_size", AccessType.WRITE, 5),
                lambda: race_detector.instrument_memory_access("detector_1_state", AccessType.WRITE, "in_use")
            ]
        },
        # Scenario 2: Lock ordering test
        {
            'name': 'lock_ordering',
            'operations': [
                lambda: race_detector.instrument_lock_acquisition("pool_lock"),
                lambda: race_detector.instrument_lock_acquisition("detector_lock"),
                lambda: race_detector.instrument_memory_access("shared_resource", AccessType.WRITE, "data")
            ]
        },
        # Scenario 3: Atomic operation validation
        {
            'name': 'atomic_operation',
            'operations': [
                lambda: race_detector.instrument_memory_access("atomic_counter", AccessType.READ, 10),
                lambda: race_detector.instrument_memory_access("atomic_counter", AccessType.WRITE, 11)
            ]
        }
    ]
    
    # Run test scenarios with multiple threads
    import concurrent.futures
    
    results = {}
    
    for scenario in test_scenarios:
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            # Submit operations concurrently
            futures = []
            for _ in range(3):  # 3 threads per scenario
                for operation in scenario['operations']:
                    futures.append(executor.submit(operation))
            
            # Wait for completion
            concurrent.futures.wait(futures, timeout=MAXIMUM_NESTED_DEPTH.0)
        
        # Detect races for this scenario
        races_detected = race_detector.detect_race_conditions(analysis_window_ms=2000.0)
        results[scenario['name']] = {
            'races_detected': len(races_detected),
            'race_details': [
                {
                    'type': race.race_type.name,
                    'severity': race.severity,
                    'description': race.description,
                    'confidence': race.confidence
                }
                for race in races_detected
            ]
        }
    
    # Get comprehensive detection report
    detection_report = race_detector.get_race_detection_report()
    
    return {
        'race_safety_validation_status': 'complete',
        'test_scenarios': results,
        'detection_report': detection_report,
        'race_conditions_detected': detection_report['detection_summary']['total_races_detected'],
        'thread_safety_assessment': 'SAFE' if detection_report['detection_summary']['total_races_detected'] == 0 else 'AT_RISK'
    }

if __name__ == "__main__":
    # Run race condition validation if executed directly
    results = validate_detector_pool_race_safety()
    
    print("=" * 80)
    print("DETECTOR POOL RACE CONDITION VALIDATION RESULTS")
    print("=" * 80)
    
    print(f"\nValidation Status: {results['race_safety_validation_status']}")
    print(f"Race Conditions Detected: {results['race_conditions_detected']}")
    print(f"Thread Safety Assessment: {results['thread_safety_assessment']}")
    
    for scenario, result in results['test_scenarios'].items():
        print(f"  {scenario}: {result['races_detected']} races detected")
    
    print(f"\nRecommendations:")
    for rec in results['detection_report']['recommendations']:
        print(f"  {rec}")