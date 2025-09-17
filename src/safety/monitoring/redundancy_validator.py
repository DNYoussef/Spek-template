"""
RedundancyValidator - Multi-Level Redundancy Verification
=========================================================

Validates and tests system redundancy to ensure resilience and fault tolerance.
Provides comprehensive redundancy testing and validation reporting.
"""

from lib.shared.utilities import get_logger
logger = get_logger(__name__)

        # Redundancy groups
        self._redundancy_groups: Dict[str, RedundancyGroup] = {}
        self._validation_states: Dict[str, ValidationState] = {}

        # Metrics
        self.metrics = RedundancyMetrics()

        # Validation results
        self._validation_history: List[ValidationResult] = []
        self._active_validations: Set[str] = set()

        # Threading
        self._executor = ThreadPoolExecutor(
            max_workers=config.get('max_concurrent_validations', 5),
            thread_name_prefix='RedundancyValidator'
        )

        # Locks
        self._validation_lock = threading.RLock()

        # Configuration
        self._validation_timeout = config.get('validation_timeout_seconds', 300)
        self._health_check_timeout = config.get('health_check_timeout_seconds', 10)
        self._failover_test_enabled = config.get('enable_failover_testing', True)

        self.logger.info("RedundancyValidator initialized")

    def register_redundancy_group(self, group: RedundancyGroup):
        """
        Register a redundancy group for validation.

        Args:
            group: Redundancy group configuration
        """
        with self._validation_lock:
            self._redundancy_groups[group.group_name] = group
            self._validation_states[group.group_name] = ValidationState.IDLE

        self.logger.info(
            "Registered redundancy group: %s (type: %s, level: %s, nodes: %d)",
            group.group_name,
            group.redundancy_type.value,
            group.required_level.name,
            len(group.nodes)
        )

    def validate_redundancy(self, group_name: Optional[str] = None) -> Dict[str, ValidationResult]:
        """
        Validate redundancy for a specific group or all groups.

        Args:
            group_name: Specific group to validate, or None for all

        Returns:
            Dict mapping group names to validation results
        """
        if group_name:
            if group_name not in self._redundancy_groups:
                self.logger.error("Unknown redundancy group: %s", group_name)
                return {}
            groups_to_validate = [group_name]
        else:
            groups_to_validate = list(self._redundancy_groups.keys())

        results = {}

        for group_name in groups_to_validate:
            with self._validation_lock:
                if group_name in self._active_validations:
                    self.logger.warning("Validation already running for %s", group_name)
                    continue

                self._active_validations.add(group_name)
                self._validation_states[group_name] = ValidationState.RUNNING

            try:
                result = self._validate_single_group(group_name)
                results[group_name] = result
                self._validation_history.append(result)

                # Update metrics
                self._update_metrics(result)

            finally:
                with self._validation_lock:
                    self._active_validations.discard(group_name)
                    self._validation_states[group_name] = ValidationState.COMPLETED

        return results

    def test_failover_scenarios(self, group_name: str, node_failure_count: int = 1) -> ValidationResult:
        """
        Test failover scenarios by simulating node failures.

        Args:
            group_name: Name of the redundancy group to test
            node_failure_count: Number of nodes to simulate failure for

        Returns:
            Validation result with failover testing details
        """
        if not self._failover_test_enabled:
            self.logger.warning("Failover testing is disabled")
            return ValidationResult(
                group_name=group_name,
                validation_time=datetime.utcnow(),
                success=False,
                redundancy_level_achieved=RedundancyLevel.NONE,
                active_nodes=0,
                failed_nodes=0,
                issues_found=["Failover testing disabled"]
            )

        if group_name not in self._redundancy_groups:
            self.logger.error("Unknown redundancy group: %s", group_name)
            return ValidationResult(
                group_name=group_name,
                validation_time=datetime.utcnow(),
                success=False,
                redundancy_level_achieved=RedundancyLevel.NONE,
                active_nodes=0,
                failed_nodes=0,
                issues_found=["Group not found"]
            )

        group = self._redundancy_groups[group_name]

        self.logger.info(
            "Starting failover test for %s (simulating %d node failures)",
            group_name, node_failure_count
        )

        start_time = time.time()

        try:
            # Step 1: Get baseline health
            baseline_result = self._validate_single_group(group_name)

            if not baseline_result.success:
                return ValidationResult(
                    group_name=group_name,
                    validation_time=datetime.utcnow(),
                    success=False,
                    redundancy_level_achieved=RedundancyLevel.NONE,
                    active_nodes=baseline_result.active_nodes,
                    failed_nodes=baseline_result.failed_nodes,
                    issues_found=["Baseline validation failed"] + baseline_result.issues_found
                )

            # Step 2: Select nodes to simulate failure
            active_nodes = [node for node in group.nodes if node.is_active]
            if len(active_nodes) <= node_failure_count:
                return ValidationResult(
                    group_name=group_name,
                    validation_time=datetime.utcnow(),
                    success=False,
                    redundancy_level_achieved=RedundancyLevel.NONE,
                    active_nodes=len(active_nodes),
                    failed_nodes=0,
                    issues_found=["Insufficient nodes for failover test"]
                )

            # Select nodes to fail (avoid primary if possible)
            nodes_to_fail = self._select_nodes_for_failure(active_nodes, node_failure_count)

            # Step 3: Simulate failures
            original_states = {}
            for node in nodes_to_fail:
                original_states[node.node_id] = node.is_active
                node.is_active = False
                self.logger.info("Simulated failure for node: %s", node.node_id)

            # Step 4: Wait for failover detection
            time.sleep(2)  # Allow time for detection

            # Step 5: Validate system still functions
            failover_result = self._validate_single_group(group_name)
            failover_time = time.time() - start_time

            # Step 6: Restore original states
            for node in nodes_to_fail:
                node.is_active = original_states[node.node_id]
                self.logger.info("Restored node: %s", node.node_id)

            # Step 7: Validate recovery
            time.sleep(1)  # Allow time for recovery
            recovery_result = self._validate_single_group(group_name)

            # Analyze results
            success = (
                failover_result.success and
                recovery_result.success and
                failover_result.active_nodes >= group.min_active_nodes
            )

            issues = []
            recommendations = []

            if not failover_result.success:
                issues.append("System failed during simulated node failures")

            if not recovery_result.success:
                issues.append("System failed to recover after restoring nodes")

            if failover_time > 60:  # Failover should be quick
                issues.append(f"Failover time {failover_time:.2f}s exceeds 60s threshold")
                recommendations.append("Consider reducing failover detection time")

            if failover_result.active_nodes < group.min_active_nodes:
                issues.append("Active nodes fell below minimum requirement")
                recommendations.append("Increase redundancy level or improve node reliability")

            return ValidationResult(
                group_name=group_name,
                validation_time=datetime.utcnow(),
                success=success,
                redundancy_level_achieved=self._calculate_redundancy_level(failover_result.active_nodes, len(group.nodes)),
                active_nodes=failover_result.active_nodes,
                failed_nodes=node_failure_count,
                failover_time_seconds=failover_time,
                issues_found=issues,
                recommendations=recommendations
            )

        except Exception as e:
            self.logger.error("Failover test error for %s: %s", group_name, e)
            return ValidationResult(
                group_name=group_name,
                validation_time=datetime.utcnow(),
                success=False,
                redundancy_level_achieved=RedundancyLevel.NONE,
                active_nodes=0,
                failed_nodes=0,
                issues_found=[f"Test execution error: {str(e)}"]
            )

    def get_redundancy_report(self) -> Dict[str, Any]:
        """
        Generate comprehensive redundancy report.

        Returns:
            Dict containing detailed redundancy status and recommendations
        """
        report = {
            'timestamp': datetime.utcnow(),
            'overall_status': 'healthy',
            'groups': {},
            'summary': {
                'total_groups': len(self._redundancy_groups),
                'healthy_groups': 0,
                'degraded_groups': 0,
                'failed_groups': 0,
                'total_nodes': 0,
                'active_nodes': 0,
                'failed_nodes': 0
            },
            'metrics': {
                'total_validations': self.metrics.total_validations,
                'success_rate': 0.0,
                'average_failover_time': self.metrics.average_failover_time,
                'fault_tolerance_score': self.metrics.fault_tolerance_score
            },
            'recommendations': []
        }

        # Validate all groups
        validation_results = self.validate_redundancy()

        # Analyze each group
        for group_name, group in self._redundancy_groups.items():
            result = validation_results.get(group_name)

            if result:
                group_status = {
                    'status': 'healthy' if result.success else 'failed',
                    'redundancy_type': group.redundancy_type.value,
                    'required_level': group.required_level.name,
                    'achieved_level': result.redundancy_level_achieved.name,
                    'total_nodes': len(group.nodes),
                    'active_nodes': result.active_nodes,
                    'failed_nodes': result.failed_nodes,
                    'last_validation': result.validation_time,
                    'issues': result.issues_found,
                    'recommendations': result.recommendations
                }

                report['groups'][group_name] = group_status

                # Update summary
                report['summary']['total_nodes'] += len(group.nodes)
                report['summary']['active_nodes'] += result.active_nodes
                report['summary']['failed_nodes'] += result.failed_nodes

                if result.success:
                    report['summary']['healthy_groups'] += 1
                elif result.active_nodes >= group.min_active_nodes:
                    report['summary']['degraded_groups'] += 1
                    if report['overall_status'] == 'healthy':
                        report['overall_status'] = 'degraded'
                else:
                    report['summary']['failed_groups'] += 1
                    report['overall_status'] = 'failed'

                # Collect recommendations
                report['recommendations'].extend(result.recommendations)

        # Calculate metrics
        if self.metrics.total_validations > 0:
            report['metrics']['success_rate'] = (
                self.metrics.successful_validations / self.metrics.total_validations
            )

        # Remove duplicate recommendations
        report['recommendations'] = list(set(report['recommendations']))

        return report

    def _validate_single_group(self, group_name: str) -> ValidationResult:
        """Validate a single redundancy group."""
        group = self._redundancy_groups[group_name]
        validation_time = datetime.utcnow()

        self.logger.info("Validating redundancy group: %s", group_name)

        # Perform health checks on all nodes
        active_nodes = 0
        failed_nodes = 0
        issues = []

        for node in group.nodes:
            try:
                is_healthy = self._check_node_health(node)
                node.last_health_check = validation_time

                if is_healthy:
                    if not node.is_active:
                        node.is_active = True
                        node.consecutive_failures = 0
                    active_nodes += 1
                else:
                    if node.is_active:
                        node.is_active = False
                    node.consecutive_failures += 1
                    failed_nodes += 1
                    issues.append(f"Node {node.node_id} health check failed")

            except Exception as e:
                self.logger.error("Health check error for node %s: %s", node.node_id, e)
                node.is_active = False
                node.consecutive_failures += 1
                failed_nodes += 1
                issues.append(f"Node {node.node_id} health check error: {str(e)}")

        # Calculate achieved redundancy level
        redundancy_level = self._calculate_redundancy_level(active_nodes, len(group.nodes))

        # Validate minimum requirements
        success = (
            active_nodes >= group.min_active_nodes and
            failed_nodes <= group.max_failure_tolerance and
            redundancy_level.value >= group.required_level.value
        )

        # Run custom validation checks
        for validation_check in group.validation_checks:
            try:
                if not validation_check():
                    success = False
                    issues.append("Custom validation check failed")
            except Exception as e:
                success = False
                issues.append(f"Custom validation error: {str(e)}")

        # Generate recommendations
        recommendations = self._generate_recommendations(group, active_nodes, failed_nodes, redundancy_level)

        return ValidationResult(
            group_name=group_name,
            validation_time=validation_time,
            success=success,
            redundancy_level_achieved=redundancy_level,
            active_nodes=active_nodes,
            failed_nodes=failed_nodes,
            issues_found=issues,
            recommendations=recommendations
        )

    def _check_node_health(self, node: RedundantNode) -> bool:
        """Check the health of a single node."""
        if not node.health_check_url:
            # No health check URL, assume healthy if marked active
            return node.is_active

        try:
            import requests
            response = requests.get(
                node.health_check_url,
                timeout=self._health_check_timeout
            )
            return response.status_code == 200
        except Exception:
            return False

    def _calculate_redundancy_level(self, active_nodes: int, total_nodes: int) -> RedundancyLevel:
        """Calculate the achieved redundancy level."""
        if active_nodes <= 1:
            return RedundancyLevel.NONE
        elif active_nodes == 2:
            return RedundancyLevel.SINGLE
        elif active_nodes == 3:
            return RedundancyLevel.DOUBLE
        elif active_nodes >= 4:
            return RedundancyLevel.TRIPLE
        else:
            return RedundancyLevel.NONE

    def _select_nodes_for_failure(self, nodes: List[RedundantNode], count: int) -> List[RedundantNode]:
        """Select nodes to simulate failure, avoiding primary nodes when possible."""
        # Separate primary and non-primary nodes
        primary_nodes = [n for n in nodes if n.is_primary]
        non_primary_nodes = [n for n in nodes if not n.is_primary]

        selected = []

        # First, select non-primary nodes
        if len(non_primary_nodes) >= count:
            selected = random.sample(non_primary_nodes, count)
        else:
            # Select all non-primary nodes, then add primary nodes
            selected = non_primary_nodes.copy()
            remaining_count = count - len(selected)
            if remaining_count > 0 and primary_nodes:
                selected.extend(random.sample(primary_nodes, min(remaining_count, len(primary_nodes))))

        return selected

    def _generate_recommendations(self, group: RedundancyGroup, active_nodes: int,
                                failed_nodes: int, redundancy_level: RedundancyLevel) -> List[str]:
        """Generate recommendations based on validation results."""
        recommendations = []

        if active_nodes < group.min_active_nodes:
            recommendations.append("Increase number of active nodes to meet minimum requirements")

        if failed_nodes > group.max_failure_tolerance:
            recommendations.append("Address failed nodes to improve fault tolerance")

        if redundancy_level.value < group.required_level.value:
            recommendations.append("Add more nodes to achieve required redundancy level")

        if len(group.nodes) < 3:
            recommendations.append("Consider adding more nodes for better resilience")

        if not any(node.is_primary for node in group.nodes):
            recommendations.append("Designate a primary node for better failover management")

        return recommendations

    def _update_metrics(self, result: ValidationResult):
        """Update system metrics with validation result."""
        self.metrics.total_validations += 1

        if result.success:
            self.metrics.successful_validations += 1
        else:
            self.metrics.failed_validations += 1

        if result.failover_time_seconds:
            if self.metrics.average_failover_time == 0:
                self.metrics.average_failover_time = result.failover_time_seconds
            else:
                # Running average
                total_failovers = len([r for r in self._validation_history
                                    if r.failover_time_seconds is not None])
                self.metrics.average_failover_time = (
                    (self.metrics.average_failover_time * (total_failovers - 1) +
                     result.failover_time_seconds) / total_failovers
                )

            if result.failover_time_seconds > self.metrics.worst_case_failover_time:
                self.metrics.worst_case_failover_time = result.failover_time_seconds

        # Calculate fault tolerance score (0-100)
        if self.metrics.total_validations > 0:
            self.metrics.fault_tolerance_score = (
                (self.metrics.successful_validations / self.metrics.total_validations) * 100
            )

    def shutdown(self):
        """Shutdown the redundancy validator."""
        self.logger.info("Shutting down RedundancyValidator")
        self._executor.shutdown(wait=True)