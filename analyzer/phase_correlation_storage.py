from src.constants.base import API_TIMEOUT_SECONDS, DAYS_RETENTION_PERIOD

"""
Advanced persistent storage system for cross-phase memory correlations with 
intelligent indexing, performance optimization, and NASA POT10 Rule DAYS_RETENTION_PERIOD compliance.

"""
Features:
- High-performance SQLite storage with WAL mode
- Intelligent indexing and query optimization
- Thread-safe operations with connection pooling
- Memory-bounded operations with cleanup strategies
- Cross-phase learning pattern analysis
- Performance correlation tracking with validation
- Backup and recovery mechanisms
"""

import asyncio
import json
import sqlite3
import threading
import time
import logging
logger = logging.getLogger(__name__)

class ConnectionPool:
    """Thread-safe SQLite connection pool for high-performance operations."""
    
    def __init__(self, database_path: str, pool_size: int = 5):
        """Initialize connection pool."""
        self.database_path = database_path
        self.pool_size = pool_size
        self.connections: List[sqlite3.Connection] = []
        self.available_connections: List[bool] = []
        self.pool_lock = threading.RLock()
        
        # Initialize connections
        self._initialize_pool()
    
    def _initialize_pool(self) -> None:
        """Initialize the connection pool."""
        with self.pool_lock:
            for _ in range(self.pool_size):
                conn = sqlite3.connect(
                    self.database_path,
                    timeout=API_TIMEOUT_SECONDS.0,
                    check_same_thread=False
                )
                
                # Enable WAL mode for better concurrency
                conn.execute("PRAGMA journal_mode=WAL")
                conn.execute("PRAGMA synchronous=NORMAL")
                conn.execute("PRAGMA cache_size=10000")  # 10MB cache
                conn.execute("PRAGMA temp_store=MEMORY")
                
                self.connections.append(conn)
                self.available_connections.append(True)
    
    @contextmanager
    def get_connection(self):
        """Get connection from pool."""
        connection = None
        connection_index = -1
        
        # Acquire connection from pool
        with self.pool_lock:
            for i, available in enumerate(self.available_connections):
                if available:
                    self.available_connections[i] = False
                    connection = self.connections[i]
                    connection_index = i
                    break
        
        if connection is None:
            # Pool exhausted - create temporary connection
            logger.warning("Connection pool exhausted, creating temporary connection")
            connection = sqlite3.connect(
                self.database_path,
                timeout=API_TIMEOUT_SECONDS.0,
                check_same_thread=False
            )
        
        try:
            yield connection
        finally:
            # Return connection to pool
            if connection_index >= 0:
                with self.pool_lock:
                    self.available_connections[connection_index] = True
            else:
                # Close temporary connection
                connection.close()
    
    def close_all(self) -> None:
        """Close all connections in pool."""
        with self.pool_lock:
            for conn in self.connections:
                conn.close()
            self.connections.clear()
            self.available_connections.clear()

class QueryOptimizer:
    """Query optimization and caching system."""
    
    def __init__(self):
        """Initialize query optimizer."""
        self.query_cache: Dict[str, Any] = {}
        self.query_performance: Dict[str, List[float]] = defaultdict(list)
        self.cache_lock = threading.RLock()
        self.max_cache_size = 1000
    
    def get_cached_result(self, query_hash: str) -> Optional[Any]:
        """Get cached query result."""
        with self.cache_lock:
            return self.query_cache.get(query_hash)
    
    def cache_result(self, query_hash: str, result: Any) -> None:
        """Cache query result."""
        with self.cache_lock:
            if len(self.query_cache) >= self.max_cache_size:
                # Remove oldest entries (simple FIFO)
                oldest_keys = list(self.query_cache.keys())[:100]
                for key in oldest_keys:
                    del self.query_cache[key]
            
            self.query_cache[query_hash] = result
    
    def record_query_performance(self, query_type: str, execution_time: float) -> None:
        """Record query performance for optimization."""
        with self.cache_lock:
            self.query_performance[query_type].append(execution_time)
            
            # Keep bounded history
            if len(self.query_performance[query_type]) > 100:
                self.query_performance[query_type] = self.query_performance[query_type][-50:]
    
    def get_performance_stats(self) -> Dict[str, Dict[str, float]]:
        """Get query performance statistics."""
        stats = {}
        
        with self.cache_lock:
            for query_type, times in self.query_performance.items():
                if times:
                    stats[query_type] = {
                        "avg_time_ms": statistics.mean(times),
                        "min_time_ms": min(times),
                        "max_time_ms": max(times),
                        "total_executions": len(times)
                    }
        
        return stats

class PhaseCorrelationStorage:
    """Advanced persistent storage for cross-phase memory correlations."""
    
    def __init__(self, 
                storage_path: Optional[str] = None,
                enable_compression: bool = True,
                backup_enabled: bool = True):
        """Initialize phase correlation storage."""
        self.storage_path = storage_path or "analyzer/phase_correlation_storage.db"
        self.enable_compression = enable_compression
        self.backup_enabled = backup_enabled
        
        # Ensure storage directory exists
        self._ensure_storage_path()
        
        # Initialize connection pool
        self.connection_pool = ConnectionPool(self.storage_path, pool_size=5)
        
        # Query optimization
        self.query_optimizer = QueryOptimizer()
        
        # Initialize database schema
        self._init_database_schema()
        
        # In-memory caches for performance
        self.correlation_cache: Dict[str, List[MemoryCorrelation]] = defaultdict(list)
        self.performance_cache: Dict[str, List[PerformanceCorrelation]] = defaultdict(list)
        self.cache_lock = threading.RLock()
        
        # Storage statistics
        self.storage_stats = {
            "correlations_stored": 0,
            "performance_metrics_stored": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "compression_ratio": 0.0,
            "last_backup": 0.0
        }
        
        # Background maintenance task
        self.maintenance_task: Optional[asyncio.Task] = None
        self.maintenance_interval = 1800  # 30 minutes
        
        logger.info(f"Phase Correlation Storage initialized: {self.storage_path}")
    
    def _ensure_storage_path(self) -> None:
        """Ensure storage directory exists."""
        storage_dir = Path(self.storage_path).parent
        storage_dir.mkdir(parents=True, exist_ok=True)
    
    def _init_database_schema(self) -> None:
        """Initialize comprehensive database schema."""
        schema_queries = [
            # Phase correlations table
            """
            CREATE TABLE IF NOT EXISTS phase_correlations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_phase TEXT NOT NULL,
                target_phase TEXT NOT NULL,
                correlation_type TEXT NOT NULL,
                correlation_strength REAL NOT NULL,
                metadata TEXT NOT NULL,
                timestamp REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            
            # Performance correlations table
            """
            CREATE TABLE IF NOT EXISTS performance_correlations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phase TEXT NOT NULL,
                metric_name TEXT NOT NULL,
                baseline_value REAL NOT NULL,
                current_value REAL NOT NULL,
                improvement_percentage REAL NOT NULL,
                correlation_factors TEXT NOT NULL,
                measurement_timestamp REAL NOT NULL,
                validation_status TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            
            # Memory entries table for cross-phase storage
            """
            CREATE TABLE IF NOT EXISTS memory_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phase_id TEXT NOT NULL,
                entry_id TEXT NOT NULL,
                entry_type TEXT NOT NULL,
                content_data TEXT NOT NULL,
                access_count INTEGER DEFAULT 0,
                last_access REAL NOT NULL,
                created_at REAL NOT NULL,
                ttl_seconds INTEGER,
                tags TEXT,
                UNIQUE(phase_id, entry_id)
            )
            """,
            
            # Learning patterns table
            """
            CREATE TABLE IF NOT EXISTS learning_patterns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pattern_key TEXT UNIQUE NOT NULL,
                pattern_type TEXT NOT NULL,
                pattern_strength REAL NOT NULL,
                usage_count INTEGER DEFAULT 1,
                success_rate REAL DEFAULT 1.0,
                last_used REAL NOT NULL,
                pattern_data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            
            # Storage statistics table
            """
            CREATE TABLE IF NOT EXISTS storage_statistics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                stat_name TEXT NOT NULL,
                stat_value REAL NOT NULL,
                timestamp REAL NOT NULL
            )
            """
        ]
        
        # Create indexes for query optimization
        index_queries = [
            "CREATE INDEX IF NOT EXISTS idx_phase_correlations_source ON phase_correlations(source_phase)",
            "CREATE INDEX IF NOT EXISTS idx_phase_correlations_target ON phase_correlations(target_phase)",
            "CREATE INDEX IF NOT EXISTS idx_phase_correlations_type ON phase_correlations(correlation_type)",
            "CREATE INDEX IF NOT EXISTS idx_phase_correlations_timestamp ON phase_correlations(timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_performance_correlations_phase ON performance_correlations(phase)",
            "CREATE INDEX IF NOT EXISTS idx_performance_correlations_metric ON performance_correlations(metric_name)",
            "CREATE INDEX IF NOT EXISTS idx_performance_correlations_validation ON performance_correlations(validation_status)",
            "CREATE INDEX IF NOT EXISTS idx_memory_entries_phase ON memory_entries(phase_id)",
            "CREATE INDEX IF NOT EXISTS idx_memory_entries_type ON memory_entries(entry_type)",
            "CREATE INDEX IF NOT EXISTS idx_memory_entries_access ON memory_entries(last_access)",
            "CREATE INDEX IF NOT EXISTS idx_learning_patterns_type ON learning_patterns(pattern_type)",
            "CREATE INDEX IF NOT EXISTS idx_learning_patterns_strength ON learning_patterns(pattern_strength)",
        ]
        
        with self.connection_pool.get_connection() as conn:
            # Create tables
            for query in schema_queries:
                conn.execute(query)
            
            # Create indexes
            for query in index_queries:
                conn.execute(query)
            
            conn.commit()
        
        logger.info("Database schema initialized with optimization indexes")
    
    def store_correlation(self, correlation: MemoryCorrelation) -> bool:
        """Store memory correlation with compression and caching."""
        try:
            start_time = time.time()
            
            # Prepare data
            metadata_json = json.dumps(correlation.metadata)
            if self.enable_compression and len(metadata_json) > 1000:
                # Compress large metadata
                metadata_json = gzip.compress(metadata_json.encode()).decode('latin-1')
            
            # Store in database
            with self.connection_pool.get_connection() as conn:
                conn.execute("""
                    INSERT INTO phase_correlations 
                    (source_phase, target_phase, correlation_type, 
                    correlation_strength, metadata, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    correlation.source_phase,
                    correlation.target_phase,
                    correlation.correlation_type,
                    correlation.correlation_strength,
                    metadata_json,
                    correlation.timestamp
                ))
                conn.commit()
            
            # Update cache
            cache_key = f"{correlation.source_phase}-{correlation.target_phase}"
            with self.cache_lock:
                self.correlation_cache[cache_key].append(correlation)
                
                # Limit cache size per key
                if len(self.correlation_cache[cache_key]) > 100:
                    self.correlation_cache[cache_key] = self.correlation_cache[cache_key][-50:]
            
            # Update statistics
            self.storage_stats["correlations_stored"] += 1
            
            # Record performance
            execution_time = (time.time() - start_time) * 1000
            self.query_optimizer.record_query_performance("store_correlation", execution_time)
            
            logger.debug(f"Stored correlation: {correlation.source_phase} -> {correlation.target_phase}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store correlation: {e}")
            return False
    
    def store_performance_correlation(self, perf_corr: PerformanceCorrelation) -> bool:
        """Store performance correlation with validation."""
        try:
            start_time = time.time()
            
            # Validate performance correlation data
            if not self._validate_performance_correlation(perf_corr):
                logger.warning(f"Performance correlation validation failed: {perf_corr.phase}.{perf_corr.metric_name}")
                return False
            
            # Store in database
            with self.connection_pool.get_connection() as conn:
                conn.execute("""
                    INSERT INTO performance_correlations 
                    (phase, metric_name, baseline_value, current_value,
                    improvement_percentage, correlation_factors, 
                    measurement_timestamp, validation_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    perf_corr.phase,
                    perf_corr.metric_name,
                    perf_corr.baseline_value,
                    perf_corr.current_value,
                    perf_corr.improvement_percentage,
                    json.dumps(perf_corr.correlation_factors),
                    perf_corr.measurement_timestamp,
                    perf_corr.validation_status
                ))
                conn.commit()
            
            # Update cache
            with self.cache_lock:
                self.performance_cache[perf_corr.phase].append(perf_corr)
                
                # Limit cache size
                if len(self.performance_cache[perf_corr.phase]) > 100:
                    self.performance_cache[perf_corr.phase] = self.performance_cache[perf_corr.phase][-50:]
            
            # Update statistics
            self.storage_stats["performance_metrics_stored"] += 1
            
            # Record performance
            execution_time = (time.time() - start_time) * 1000
            self.query_optimizer.record_query_performance("store_performance_correlation", execution_time)
            
            logger.debug(f"Stored performance correlation: {perf_corr.phase}.{perf_corr.metric_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store performance correlation: {e}")
            return False
    
    def store_memory_entry(self, entry: PhaseMemoryEntry) -> bool:
        """Store memory entry with cross-phase accessibility."""
        if not UNIFIED_MODEL_AVAILABLE:
            logger.warning("Unified model not available - cannot store memory entry")
            return False
        
        try:
            start_time = time.time()
            
            # Serialize entry content
            content_json = json.dumps(entry.content)
            if self.enable_compression and len(content_json) > 2000:
                content_json = gzip.compress(content_json.encode()).decode('latin-1')
            
            # Store in database
            with self.connection_pool.get_connection() as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO memory_entries 
                    (phase_id, entry_id, entry_type, content_data,
                    access_count, last_access, created_at, ttl_seconds, tags)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    entry.phase_id,
                    entry.entry_id,
                    entry.entry_type,
                    content_json,
                    entry.access_count,
                    entry.last_access,
                    entry.created_at,
                    entry.ttl_seconds,
                    json.dumps(list(entry.tags)) if entry.tags else "[]"
                ))
                conn.commit()
            
            # Record performance
            execution_time = (time.time() - start_time) * 1000
            self.query_optimizer.record_query_performance("store_memory_entry", execution_time)
            
            logger.debug(f"Stored memory entry: {entry.phase_id}:{entry.entry_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store memory entry: {e}")
            return False
    
    def _validate_performance_correlation(self, perf_corr: PerformanceCorrelation) -> bool:
        """Validate performance correlation data for quality assurance."""
        # Basic data validation
        if not perf_corr.phase or not perf_corr.metric_name:
            return False
        
        if perf_corr.baseline_value < 0 or perf_corr.current_value < 0:
            return False
        
        # Validate improvement percentage calculation
        if perf_corr.baseline_value != 0:
            expected_improvement = ((perf_corr.current_value - perf_corr.baseline_value) / perf_corr.baseline_value) * 100
            if abs(expected_improvement - perf_corr.improvement_percentage) > 0.1:
                logger.warning(f"Improvement percentage mismatch: expected {expected_improvement:.2f}, got {perf_corr.improvement_percentage:.2f}")
                return False
        
        # Check for unrealistic improvements (potential theater detection)
        if abs(perf_corr.improvement_percentage) > 1000:  # 1000% improvement threshold
            logger.warning(f"Unrealistic improvement detected: {perf_corr.improvement_percentage:.2f}%")
            return False
        
        return True
    
    def get_correlations_by_phase(self, phase: str, use_cache: bool = True) -> List[MemoryCorrelation]:
        """Get correlations involving a specific phase with intelligent caching."""
        # Check cache first
        if use_cache:
            cached_result = self._get_cached_correlations(phase)
            if cached_result:
                self.storage_stats["cache_hits"] += 1
                return cached_result
        
        self.storage_stats["cache_misses"] += 1
        start_time = time.time()
        correlations = []
        
        try:
            with self.connection_pool.get_connection() as conn:
                cursor = conn.execute("""
                    SELECT source_phase, target_phase, correlation_type,
                            correlation_strength, metadata, timestamp
                    FROM phase_correlations 
                    WHERE source_phase = ? OR target_phase = ?
                    ORDER BY correlation_strength DESC, timestamp DESC
                    LIMIT 1000
                """, (phase, phase))
                
                for row in cursor.fetchall():
                    # Decompress metadata if needed
                    metadata_str = row[4]
                    try:
                        # Try to decompress
                        if len(metadata_str) > 0 and metadata_str[0] not in '{["':
                            metadata_str = gzip.decompress(metadata_str.encode('latin-1')).decode()
                        metadata = json.loads(metadata_str)
                    except:
                        metadata = {}
                    
                    correlation = MemoryCorrelation(
                        source_phase=row[0],
                        target_phase=row[1],
                        correlation_type=row[2],
                        correlation_strength=row[3],
                        metadata=metadata,
                        timestamp=row[5]
                    )
                    correlations.append(correlation)
            
            # Update cache
            if use_cache:
                self._cache_correlations(phase, correlations)
        
        except Exception as e:
            logger.error(f"Failed to get correlations for phase {phase}: {e}")
        
        # Record performance
        execution_time = (time.time() - start_time) * 1000
        self.query_optimizer.record_query_performance("get_correlations_by_phase", execution_time)
        
        return correlations
    
    def get_performance_trends(self, 
                                phase: Optional[str] = None,
                                metric_name: Optional[str] = None,
                                validation_status: Optional[str] = None) -> List[PerformanceCorrelation]:
        """Get performance trends with advanced filtering."""
        start_time = time.time()
        trends = []
        
        # Build dynamic query
        where_clauses = []
        params = []
        
        if phase:
            where_clauses.append("phase = ?")
            params.append(phase)
        
        if metric_name:
            where_clauses.append("metric_name = ?")
            params.append(metric_name)
        
        if validation_status:
            where_clauses.append("validation_status = ?")
            params.append(validation_status)
        
        where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
        
        try:
            with self.connection_pool.get_connection() as conn:
                cursor = conn.execute(f"""
                    SELECT phase, metric_name, baseline_value, current_value,
                            improvement_percentage, correlation_factors,
                            measurement_timestamp, validation_status
                    FROM performance_correlations 
                    WHERE {where_sql}
                    ORDER BY measurement_timestamp DESC
                    LIMIT 1000
                """, params)
                
                for row in cursor.fetchall():
                    trend = PerformanceCorrelation(
                        phase=row[0],
                        metric_name=row[1],
                        baseline_value=row[2],
                        current_value=row[3],
                        improvement_percentage=row[4],
                        correlation_factors=json.loads(row[5]),
                        measurement_timestamp=row[6],
                        validation_status=row[7]
                    )
                    trends.append(trend)
        
        except Exception as e:
            logger.error(f"Failed to get performance trends: {e}")
        
        # Record performance
        execution_time = (time.time() - start_time) * 1000
        self.query_optimizer.record_query_performance("get_performance_trends", execution_time)
        
        return trends
    
    def store_learning_pattern(self, 
                                pattern_key: str,
                                pattern_type: str,
                                pattern_strength: float,
                                pattern_data: Dict[str, Any]) -> bool:
        """Store learning pattern for cross-phase knowledge transfer."""
        try:
            pattern_data_json = json.dumps(pattern_data)
            current_time = time.time()
            
            with self.connection_pool.get_connection() as conn:
                # Check if pattern exists
                cursor = conn.execute("SELECT usage_count, success_rate FROM learning_patterns WHERE pattern_key = ?", (pattern_key,))
                existing = cursor.fetchone()
                
                if existing:
                    # Update existing pattern
                    usage_count = existing[0] + 1
                    # Update success rate using weighted average
                    new_success_rate = (existing[1] * existing[0] + pattern_strength) / usage_count
                    
                    conn.execute("""
                        UPDATE learning_patterns 
                        SET pattern_strength = ?, usage_count = ?, 
                            success_rate = ?, last_used = ?, pattern_data = ?
                        WHERE pattern_key = ?
                    """, (pattern_strength, usage_count, new_success_rate, current_time, pattern_data_json, pattern_key))
                else:
                    # Insert new pattern
                    conn.execute("""
                        INSERT INTO learning_patterns 
                        (pattern_key, pattern_type, pattern_strength, 
                        usage_count, success_rate, last_used, pattern_data)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (pattern_key, pattern_type, pattern_strength, 1, pattern_strength, current_time, pattern_data_json))
                
                conn.commit()
            
            logger.debug(f"Stored learning pattern: {pattern_key}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store learning pattern: {e}")
            return False
    
    def get_learning_patterns_by_type(self, pattern_type: str, min_strength: float = 0.0) -> List[Dict[str, Any]]:
        """Get learning patterns by type with strength filtering."""
        patterns = []
        
        try:
            with self.connection_pool.get_connection() as conn:
                cursor = conn.execute("""
                    SELECT pattern_key, pattern_strength, usage_count, 
                            success_rate, last_used, pattern_data
                    FROM learning_patterns 
                    WHERE pattern_type = ? AND pattern_strength >= ?
                    ORDER BY pattern_strength DESC, usage_count DESC
                """, (pattern_type, min_strength))
                
                for row in cursor.fetchall():
                    pattern_data = json.loads(row[5])
                    patterns.append({
                        "pattern_key": row[0],
                        "pattern_strength": row[1],
                        "usage_count": row[2],
                        "success_rate": row[3],
                        "last_used": row[4],
                        "pattern_data": pattern_data
                    })
        
        except Exception as e:
            logger.error(f"Failed to get learning patterns: {e}")
        
        return patterns
    
    def _get_cached_correlations(self, phase: str) -> Optional[List[MemoryCorrelation]]:
        """Get cached correlations for a phase."""
        with self.cache_lock:
            for cache_key, correlations in self.correlation_cache.items():
                if phase in cache_key:
                    return correlations
        return None
    
    def _cache_correlations(self, phase: str, correlations: List[MemoryCorrelation]) -> None:
        """Cache correlations for a phase."""
        cache_key = f"phase-{phase}"
        
        with self.cache_lock:
            self.correlation_cache[cache_key] = correlations
            
            # Limit total cache size
            if len(self.correlation_cache) > 50:
                # Remove oldest cache entries
                oldest_key = min(self.correlation_cache.keys())
                del self.correlation_cache[oldest_key]
    
    async def start_maintenance_tasks(self) -> None:
        """Start background maintenance tasks."""
        if self.maintenance_task and not self.maintenance_task.done():
            logger.warning("Maintenance tasks already running")
            return
        
        self.maintenance_task = asyncio.create_task(self._maintenance_loop())
        logger.info("Started storage maintenance tasks")
    
    async def stop_maintenance_tasks(self) -> None:
        """Stop background maintenance tasks."""
        if self.maintenance_task:
            self.maintenance_task.cancel()
            try:
                await self.maintenance_task
            except asyncio.CancelledError:
                pass
            self.maintenance_task = None
        
        logger.info("Stopped storage maintenance tasks")
    
    async def _maintenance_loop(self) -> None:
        """Background maintenance loop."""
        while True:
            try:
                await asyncio.sleep(self.maintenance_interval)
                
                # Perform maintenance operations
                maintenance_results = await self._perform_maintenance()
                
                if maintenance_results["operations_performed"] > 0:
                    logger.info(f"Maintenance completed: {maintenance_results}")
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in maintenance loop: {e}")
    
    async def _perform_maintenance(self) -> Dict[str, Any]:
        """Perform storage maintenance operations."""
        results = {
            "operations_performed": 0,
            "entries_cleaned": 0,
            "vacuum_performed": False,
            "backup_created": False
        }
        
        current_time = time.time()
        
        # Cleanup old entries
        cleanup_count = await self._cleanup_old_entries()
        results["entries_cleaned"] = cleanup_count
        results["operations_performed"] += 1
        
        # Vacuum database if needed (weekly)
        if current_time - self.storage_stats.get("last_vacuum", 0) > 604800:  # 7 days
            await self._vacuum_database()
            results["vacuum_performed"] = True
            results["operations_performed"] += 1
            self.storage_stats["last_vacuum"] = current_time
        
        # Create backup if enabled and needed (daily)
        if (self.backup_enabled and 
            current_time - self.storage_stats.get("last_backup", 0) > 86400):  # 24 hours
            backup_created = await self._create_backup()
            results["backup_created"] = backup_created
            results["operations_performed"] += 1
            
            if backup_created:
                self.storage_stats["last_backup"] = current_time
        
        return results
    
    async def _cleanup_old_entries(self) -> int:
        """Clean up old entries to maintain bounded storage."""
        cleanup_count = 0
        cutoff_time = time.time() - (30 * 24 * 3600)  # 30 days
        
        cleanup_queries = [
            ("phase_correlations", "timestamp", cutoff_time),
            ("performance_correlations", "measurement_timestamp", cutoff_time),
            ("memory_entries", "created_at", cutoff_time),
            ("learning_patterns", "last_used", time.time() - (90 * 24 * 3600))  # 90 days for patterns
        ]
        
        try:
            with self.connection_pool.get_connection() as conn:
                for table, time_column, cutoff in cleanup_queries:
                    cursor = conn.execute(f"DELETE FROM {table} WHERE {time_column} < ?", (cutoff,))
                    cleanup_count += cursor.rowcount
                
                conn.commit()
            
            # Clear caches after cleanup
            with self.cache_lock:
                self.correlation_cache.clear()
                self.performance_cache.clear()
            
            logger.info(f"Cleaned up {cleanup_count} old entries")
            
        except Exception as e:
            logger.error(f"Failed to cleanup old entries: {e}")
        
        return cleanup_count
    
    async def _vacuum_database(self) -> bool:
        """Vacuum database to optimize storage and performance."""
        try:
            with self.connection_pool.get_connection() as conn:
                conn.execute("VACUUM")
                conn.execute("ANALYZE")
            
            logger.info("Database vacuum completed")
            return True
            
        except Exception as e:
            logger.error(f"Failed to vacuum database: {e}")
            return False
    
    async def _create_backup(self) -> bool:
        """Create database backup."""
        if not self.backup_enabled:
            return False
        
        try:
            backup_path = f"{self.storage_path}.backup.{int(time.time())}"
            shutil.copy2(self.storage_path, backup_path)
            
            # Keep only last 7 backups
            backup_dir = Path(self.storage_path).parent
            backup_files = sorted([f for f in backup_dir.glob(f"{Path(self.storage_path).name}.backup.*")])
            
            if len(backup_files) > 7:
                for old_backup in backup_files[:-7]:
                    old_backup.unlink()
            
            logger.info(f"Database backup created: {backup_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create backup: {e}")
            return False
    
    def get_storage_statistics(self) -> Dict[str, Any]:
        """Get comprehensive storage statistics."""
        stats = self.storage_stats.copy()
        
        # Add query performance stats
        stats["query_performance"] = self.query_optimizer.get_performance_stats()
        
        # Add database size info
        try:
            db_path = Path(self.storage_path)
            if db_path.exists():
                stats["database_size_mb"] = db_path.stat().st_size / (1024 * 1024)
        except:
            stats["database_size_mb"] = 0
        
        # Add connection pool stats
        stats["connection_pool_size"] = self.connection_pool.pool_size
        
        # Calculate cache hit rate
        total_requests = stats["cache_hits"] + stats["cache_misses"]
        stats["cache_hit_rate"] = (stats["cache_hits"] / total_requests * 100) if total_requests > 0 else 0
        
        return stats
    
    def shutdown(self) -> None:
        """Shutdown storage system and cleanup resources."""
        logger.info("Shutting down Phase Correlation Storage...")
        
        # Stop maintenance tasks
        if self.maintenance_task:
            self.maintenance_task.cancel()
        
        # Close connection pool
        self.connection_pool.close_all()
        
        logger.info("Phase Correlation Storage shutdown completed")

# Global storage instance
_global_storage: Optional[PhaseCorrelationStorage] = None
_storage_lock = threading.Lock()

def get_global_storage() -> PhaseCorrelationStorage:
    """Get or create global phase correlation storage."""
    global _global_storage
    
    with _storage_lock:
        if _global_storage is None:
            _global_storage = PhaseCorrelationStorage()
    
    return _global_storage

async def initialize_storage_system(config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Initialize the storage system with optional configuration."""
    config = config or {}
    
    storage = PhaseCorrelationStorage(
        storage_path=config.get("storage_path"),
        enable_compression=config.get("enable_compression", True),
        backup_enabled=config.get("backup_enabled", True)
    )
    
    # Start maintenance tasks
    await storage.start_maintenance_tasks()
    
    return {
        "status": "initialized",
        "storage_path": storage.storage_path,
        "compression_enabled": storage.enable_compression,
        "backup_enabled": storage.backup_enabled,
        "connection_pool_size": storage.connection_pool.pool_size
    }