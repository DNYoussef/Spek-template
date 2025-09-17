"""
Automated Artifact Workflow Orchestrator - Phase 3 Artifact Generation
=====================================================================

Orchestrates automated artifact generation workflows integrated with analyzer system.
Feature flag controlled with zero breaking changes to existing functionality.
"""

import os
import json
from lib.shared.utilities import get_logger
logger = get_logger(__name__)
        
        # Workflow storage
        self.workflows: Dict[str, WorkflowDefinition] = {}
        self.executions: Dict[str, WorkflowExecution] = {}
        self.triggers: Dict[str, Callable] = {}
        
        # Initialize built-in workflows
        self._initialize_builtin_workflows()
        self._initialize_action_handlers()
    
    def is_enabled(self) -> bool:
        """Check if workflow automation is enabled"""
        return ENABLE_WORKFLOW_AUTOMATION
    
    def is_trigger_processing_enabled(self) -> bool:
        """Check if trigger processing is enabled"""
        return ENABLE_TRIGGER_PROCESSING
    
    def is_quality_gates_enabled(self) -> bool:
        """Check if quality gates are enabled"""
        return ENABLE_QUALITY_GATES
    
    def register_workflow(self, workflow: WorkflowDefinition) -> bool:
        """Register a new workflow definition"""
        if not self.is_enabled():
            self.logger.warning("Workflow automation disabled")
            return False
        
        try:
            self.workflows[workflow.workflow_id] = workflow
            self.logger.info(f"Workflow registered: {workflow.name}")
            return True
        except Exception as e:
            self.logger.error(f"Error registering workflow: {e}")
            return False
    
    def create_workflow(self, workflow_type: str, parameters: Optional[Dict[str, Any]] = None) -> Optional[WorkflowDefinition]:
        """Create a workflow from predefined templates"""
        if not self.is_enabled():
            return None
        
        try:
            if workflow_type == "compliance_audit":
                return self._create_compliance_audit_workflow(parameters or {})
            elif workflow_type == "security_assessment":
                return self._create_security_assessment_workflow(parameters or {})
            elif workflow_type == "release_preparation":
                return self._create_release_preparation_workflow(parameters or {})
            elif workflow_type == "continuous_monitoring":
                return self._create_continuous_monitoring_workflow(parameters or {})
            else:
                self.logger.warning(f"Unknown workflow type: {workflow_type}")
                return None
        except Exception as e:
            self.logger.error(f"Error creating workflow: {e}")
            return None
    
    def execute_workflow(self, workflow_id: str, trigger_context: Dict[str, Any]) -> Optional[str]:
        """Execute a workflow and return execution ID"""
        if not self.is_enabled():
            return None
        
        try:
            if workflow_id not in self.workflows:
                self.logger.error(f"Workflow not found: {workflow_id}")
                return None
            
            # Create execution instance
            execution_id = str(uuid.uuid4())
            execution = WorkflowExecution(
                execution_id=execution_id,
                workflow_id=workflow_id,
                status=WorkflowStatus.PENDING,
                trigger_context=trigger_context,
                start_time=datetime.now().isoformat()
            )
            
            self.executions[execution_id] = execution
            
            # Start execution
            asyncio.create_task(self._execute_workflow_async(execution))
            
            self.logger.info(f"Workflow execution started: {execution_id}")
            return execution_id
            
        except Exception as e:
            self.logger.error(f"Error executing workflow: {e}")
            return None
    
    def get_workflow_status(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Get current workflow execution status"""
        if execution_id not in self.executions:
            return None
        
        execution = self.executions[execution_id]
        return {
            "execution_id": execution_id,
            "workflow_id": execution.workflow_id,
            "status": execution.status.value,
            "current_step": execution.current_step,
            "completed_steps": execution.completed_steps,
            "failed_steps": execution.failed_steps,
            "start_time": execution.start_time,
            "end_time": execution.end_time,
            "artifacts_generated": execution.artifacts_generated
        }
    
    def get_workflow_results(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Get workflow execution results"""
        if execution_id not in self.executions:
            return None
        
        execution = self.executions[execution_id]
        workflow = self.workflows[execution.workflow_id]
        
        results = {
            "execution_summary": asdict(execution),
            "workflow_definition": asdict(workflow),
            "artifacts": self._collect_execution_artifacts(execution),
            "quality_metrics": execution.quality_gate_results,
            "performance_metrics": execution.metrics
        }
        
        # Save results
        output_file = self.output_dir / f"execution_{execution_id}_results.json"
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        return results
    
    async def _execute_workflow_async(self, execution: WorkflowExecution):
        """Execute workflow asynchronously"""
        try:
            execution.status = WorkflowStatus.RUNNING
            workflow = self.workflows[execution.workflow_id]
            
            self.logger.info(f"Starting workflow execution: {execution.execution_id}")
            
            # Execute steps in dependency order
            for step in workflow.steps:
                if not await self._can_execute_step(step, execution):
                    continue
                
                execution.current_step = step.step_id
                step.status = WorkflowStatus.RUNNING
                step.start_time = datetime.now().isoformat()
                
                try:
                    # Execute step
                    result = await self._execute_step(step, execution)
                    
                    if result:
                        step.status = WorkflowStatus.COMPLETED
                        step.output = result
                        execution.completed_steps.append(step.step_id)
                        
                        # Check quality gates after step completion
                        if self.is_quality_gates_enabled():
                            gate_result = await self._check_quality_gates(step, execution, workflow)
                            execution.quality_gate_results[step.step_id] = gate_result
                            
                            if not gate_result.get('passed', True):
                                self.logger.warning(f"Quality gate failed for step: {step.step_id}")
                                # Continue execution but log the failure
                    else:
                        step.status = WorkflowStatus.FAILED
                        execution.failed_steps.append(step.step_id)
                        
                except Exception as e:
                    step.status = WorkflowStatus.FAILED
                    step.error_message = str(e)
                    execution.failed_steps.append(step.step_id)
                    self.logger.error(f"Step failed: {step.step_id} - {e}")
                
                finally:
                    step.end_time = datetime.now().isoformat()
            
            # Complete execution
            execution.status = WorkflowStatus.COMPLETED if not execution.failed_steps else WorkflowStatus.FAILED
            execution.end_time = datetime.now().isoformat()
            execution.current_step = None
            
            # Calculate metrics
            execution.metrics = self._calculate_execution_metrics(execution, workflow)
            
            # Send notifications
            await self._send_notifications(execution, workflow)
            
            self.logger.info(f"Workflow execution completed: {execution.execution_id}")
            
        except Exception as e:
            execution.status = WorkflowStatus.FAILED
            execution.end_time = datetime.now().isoformat()
            self.logger.error(f"Workflow execution failed: {execution.execution_id} - {e}")
    
    async def _can_execute_step(self, step: WorkflowStep, execution: WorkflowExecution) -> bool:
        """Check if step dependencies are satisfied"""
        for dependency in step.dependencies:
            if dependency not in execution.completed_steps:
                return False
        return True
    
    async def _execute_step(self, step: WorkflowStep, execution: WorkflowExecution) -> Optional[Dict[str, Any]]:
        """Execute a workflow step"""
        action_handler = self.action_handlers.get(step.action)
        if not action_handler:
            self.logger.error(f"Unknown action: {step.action}")
            return None
        
        try:
            # Merge step parameters with execution context
            context = {
                **execution.trigger_context,
                **step.parameters,
                "execution_id": execution.execution_id,
                "step_id": step.step_id
            }
            
            result = await action_handler(context)
            return result
            
        except Exception as e:
            self.logger.error(f"Action execution failed: {step.action} - {e}")
            return None
    
    async def _check_quality_gates(self, step: WorkflowStep, execution: WorkflowExecution, workflow: WorkflowDefinition) -> Dict[str, Any]:
        """Check quality gates for a step"""
        gate_results = {"passed": True, "checks": []}
        
        for gate in workflow.quality_gates:
            if gate.get("step_id") == step.step_id or gate.get("global", False):
                check_result = await self._evaluate_quality_gate(gate, step.output, execution)
                gate_results["checks"].append(check_result)
                
                if not check_result.get("passed", True):
                    gate_results["passed"] = False
        
        return gate_results
    
    async def _evaluate_quality_gate(self, gate: Dict[str, Any], step_output: Dict[str, Any], execution: WorkflowExecution) -> Dict[str, Any]:
        """Evaluate a specific quality gate"""
        gate_type = gate.get("type", "threshold")
        
        if gate_type == "threshold":
            metric_name = gate.get("metric")
            threshold = gate.get("threshold")
            operator = gate.get("operator", ">=")
            
            actual_value = step_output.get(metric_name, 0)
            
            if operator == ">=":
                passed = actual_value >= threshold
            elif operator == "<=":
                passed = actual_value <= threshold
            elif operator == "==":
                passed = actual_value == threshold
            else:
                passed = False
            
            return {
                "gate_id": gate.get("id", "unknown"),
                "type": gate_type,
                "metric": metric_name,
                "expected": f"{operator} {threshold}",
                "actual": actual_value,
                "passed": passed
            }
        
        return {"passed": True, "type": "unknown"}
    
    def _calculate_execution_metrics(self, execution: WorkflowExecution, workflow: WorkflowDefinition) -> Dict[str, Any]:
        """Calculate execution performance metrics"""
        start_time = datetime.fromisoformat(execution.start_time)
        end_time = datetime.fromisoformat(execution.end_time) if execution.end_time else datetime.now()
        
        total_duration = (end_time - start_time).total_seconds()
        
        return {
            "total_duration_seconds": total_duration,
            "steps_total": len(workflow.steps),
            "steps_completed": len(execution.completed_steps),
            "steps_failed": len(execution.failed_steps),
            "success_rate": len(execution.completed_steps) / len(workflow.steps) if workflow.steps else 0,
            "artifacts_generated": len(execution.artifacts_generated),
            "quality_gates_passed": sum(1 for result in execution.quality_gate_results.values() if result.get("passed", False))
        }
    
    async def _send_notifications(self, execution: WorkflowExecution, workflow: WorkflowDefinition):
        """Send workflow completion notifications"""
        notifications = workflow.notifications
        
        if notifications.get("on_completion") and execution.status == WorkflowStatus.COMPLETED:
            self.logger.info(f"Workflow completed successfully: {workflow.name}")
        
        if notifications.get("on_failure") and execution.status == WorkflowStatus.FAILED:
            self.logger.error(f"Workflow failed: {workflow.name}")
    
    def _collect_execution_artifacts(self, execution: WorkflowExecution) -> List[str]:
        """Collect all artifacts generated during execution"""
        artifacts = []
        
        # Collect from workflow output directory
        execution_dir = self.output_dir / f"execution_{execution.execution_id}"
        if execution_dir.exists():
            artifacts.extend([str(f) for f in execution_dir.rglob("*") if f.is_file()])
        
        return artifacts
    
    def _initialize_builtin_workflows(self):
        """Initialize built-in workflow templates"""
        # Compliance audit workflow
        compliance_workflow = self._create_compliance_audit_workflow()
        if compliance_workflow:
            self.workflows[compliance_workflow.workflow_id] = compliance_workflow
        
        # Security assessment workflow
        security_workflow = self._create_security_assessment_workflow()
        if security_workflow:
            self.workflows[security_workflow.workflow_id] = security_workflow
    
    def _create_compliance_audit_workflow(self, parameters: Optional[Dict[str, Any]] = None) -> WorkflowDefinition:
        """Create compliance audit workflow"""
        params = parameters or {}
        
        return WorkflowDefinition(
            workflow_id="compliance_audit_v1",
            name="Comprehensive Compliance Audit",
            description="Generate comprehensive compliance evidence across all frameworks",
            trigger_type=TriggerType.MANUAL,
            steps=[
                WorkflowStep(
                    step_id="collect_analysis_data",
                    name="Collect Analysis Data",
                    action="run_analyzer",
                    parameters={"scope": "full_analysis"}
                ),
                WorkflowStep(
                    step_id="generate_soc2_evidence",
                    name="Generate SOC2 Evidence",
                    action="generate_soc2_evidence",
                    dependencies=["collect_analysis_data"],
                    parameters={"framework": "soc2_type2"}
                ),
                WorkflowStep(
                    step_id="generate_iso27001_matrix",
                    name="Generate ISO27001 Matrix",
                    action="generate_iso27001_matrix",
                    dependencies=["collect_analysis_data"],
                    parameters={"framework": "iso27001_2022"}
                ),
                WorkflowStep(
                    step_id="generate_nist_ssdf_alignment",
                    name="Generate NIST SSDF Alignment",
                    action="generate_nist_ssdf_alignment",
                    dependencies=["collect_analysis_data"],
                    parameters={"framework": "nist_ssdf_v1_1"}
                ),
                WorkflowStep(
                    step_id="package_audit_evidence",
                    name="Package Audit Evidence",
                    action="package_compliance_evidence",
                    dependencies=["generate_soc2_evidence", "generate_iso27001_matrix", "generate_nist_ssdf_alignment"]
                )
            ],
            quality_gates=[
                {
                    "id": "compliance_threshold",
                    "step_id": "package_audit_evidence",
                    "type": "threshold",
                    "metric": "overall_compliance_score",
                    "threshold": 85.0,
                    "operator": ">="
                }
            ],
            notifications={
                "on_completion": True,
                "on_failure": True
            }
        )
    
    def _create_security_assessment_workflow(self, parameters: Optional[Dict[str, Any]] = None) -> WorkflowDefinition:
        """Create security assessment workflow"""
        return WorkflowDefinition(
            workflow_id="security_assessment_v1",
            name="Comprehensive Security Assessment",
            description="Perform comprehensive security analysis and generate artifacts",
            trigger_type=TriggerType.SCHEDULED,
            steps=[
                WorkflowStep(
                    step_id="vulnerability_scan",
                    name="Vulnerability Scan",
                    action="run_security_scan",
                    parameters={"scan_type": "comprehensive"}
                ),
                WorkflowStep(
                    step_id="generate_sbom",
                    name="Generate SBOM",
                    action="generate_sbom",
                    dependencies=["vulnerability_scan"]
                ),
                WorkflowStep(
                    step_id="generate_slsa_provenance",
                    name="Generate SLSA Provenance",
                    action="generate_slsa_provenance",
                    dependencies=["vulnerability_scan"]
                ),
                WorkflowStep(
                    step_id="security_report",
                    name="Generate Security Report",
                    action="generate_security_report",
                    dependencies=["generate_sbom", "generate_slsa_provenance"]
                )
            ]
        )
    
    def _create_release_preparation_workflow(self, parameters: Optional[Dict[str, Any]] = None) -> WorkflowDefinition:
        """Create release preparation workflow"""
        return WorkflowDefinition(
            workflow_id="release_preparation_v1",
            name="Release Preparation",
            description="Prepare all artifacts for release",
            trigger_type=TriggerType.MILESTONE,
            steps=[
                WorkflowStep(
                    step_id="final_quality_check",
                    name="Final Quality Check",
                    action="run_quality_gates"
                ),
                WorkflowStep(
                    step_id="generate_six_sigma_report",
                    name="Generate Six Sigma Report",
                    action="generate_six_sigma_report",
                    dependencies=["final_quality_check"]
                ),
                WorkflowStep(
                    step_id="package_release_artifacts",
                    name="Package Release Artifacts", 
                    action="package_release_artifacts",
                    dependencies=["generate_six_sigma_report"]
                )
            ]
        )
    
    def _create_continuous_monitoring_workflow(self, parameters: Optional[Dict[str, Any]] = None) -> WorkflowDefinition:
        """Create continuous monitoring workflow"""
        return WorkflowDefinition(
            workflow_id="continuous_monitoring_v1",
            name="Continuous Quality Monitoring",
            description="Continuous quality and compliance monitoring",
            trigger_type=TriggerType.SCHEDULED,
            steps=[
                WorkflowStep(
                    step_id="collect_metrics",
                    name="Collect Quality Metrics",
                    action="collect_quality_metrics"
                ),
                WorkflowStep(
                    step_id="trend_analysis",
                    name="Trend Analysis",
                    action="analyze_quality_trends",
                    dependencies=["collect_metrics"]
                ),
                WorkflowStep(
                    step_id="alert_on_degradation",
                    name="Alert on Quality Degradation",
                    action="check_quality_degradation",
                    dependencies=["trend_analysis"]
                )
            ]
        )
    
    def _initialize_action_handlers(self):
        """Initialize action handlers for workflow steps"""
        self.action_handlers = {
            "run_analyzer": self._run_analyzer_action,
            "generate_soc2_evidence": self._generate_soc2_evidence_action,
            "generate_iso27001_matrix": self._generate_iso27001_matrix_action,
            "generate_nist_ssdf_alignment": self._generate_nist_ssdf_alignment_action,
            "package_compliance_evidence": self._package_compliance_evidence_action,
            "generate_sbom": self._generate_sbom_action,
            "generate_slsa_provenance": self._generate_slsa_provenance_action,
            "generate_six_sigma_report": self._generate_six_sigma_report_action,
            "run_security_scan": self._run_security_scan_action,
            "run_quality_gates": self._run_quality_gates_action,
            "collect_quality_metrics": self._collect_quality_metrics_action,
            "analyze_quality_trends": self._analyze_quality_trends_action,
            "check_quality_degradation": self._check_quality_degradation_action
        }
    
    # Action handlers (mock implementations for Phase 3)
    async def _run_analyzer_action(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Run analyzer action"""
        self.logger.info("Running analyzer...")
        return {"status": "completed", "violations_found": 0, "nasa_compliance": 95.2}
    
    async def _generate_soc2_evidence_action(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate SOC2 evidence action"""
        self.logger.info("Generating SOC2 evidence...")
        return {"status": "completed", "controls_assessed": 25, "compliant_controls": 23}
    
    async def _generate_iso27001_matrix_action(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate ISO27001 matrix action"""
        self.logger.info("Generating ISO27001 matrix...")
        return {"status": "completed", "controls_assessed": 114, "implementation_level": "level_3"}
    
    async def _generate_nist_ssdf_alignment_action(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate NIST SSDF alignment action"""
        self.logger.info("Generating NIST SSDF alignment...")
        return {"status": "completed", "practices_assessed": 20, "maturity_level": "defined"}
    
    async def _package_compliance_evidence_action(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Package compliance evidence action"""
        self.logger.info("Packaging compliance evidence...")
        return {"status": "completed", "overall_compliance_score": 92.5}
    
    async def _generate_sbom_action(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate SBOM action"""
        self.logger.info("Generating SBOM...")
        return {"status": "completed", "packages_analyzed": 150, "vulnerabilities_found": 2}
    
    async def _generate_slsa_provenance_action(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate SLSA provenance action"""
        self.logger.info("Generating SLSA provenance...")
        return {"status": "completed", "attestation_signed": True, "slsa_level": 3}
    
    async def _generate_six_sigma_report_action(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate Six Sigma report action"""
        self.logger.info("Generating Six Sigma report...")
        return {"status": "completed", "sigma_level": 4.2, "dpmo": 3200}
    
    async def _run_security_scan_action(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Run security scan action"""
        self.logger.info("Running security scan...")
        return {"status": "completed", "critical_issues": 0, "high_issues": 1}
    
    async def _run_quality_gates_action(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Run quality gates action"""
        self.logger.info("Running quality gates...")
        return {"status": "completed", "gates_passed": 8, "gates_total": 8}
    
    async def _collect_quality_metrics_action(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Collect quality metrics action"""
        self.logger.info("Collecting quality metrics...")
        return {"status": "completed", "metrics_collected": 25}
    
    async def _analyze_quality_trends_action(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze quality trends action"""
        self.logger.info("Analyzing quality trends...")
        return {"status": "completed", "trend": "improving", "trend_score": 0.15}
    
    async def _check_quality_degradation_action(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Check quality degradation action"""
        self.logger.info("Checking quality degradation...")
        return {"status": "completed", "degradation_detected": False}

# Integration functions for existing analyzer
def create_artifact_workflow(workflow_type: str, parameters: Optional[Dict[str, Any]] = None) -> Optional[str]:
    """Integration function for creating artifact workflows"""
    if not ENABLE_WORKFLOW_AUTOMATION:
        return None
    
    orchestrator = WorkflowOrchestrator()
    workflow = orchestrator.create_workflow(workflow_type, parameters)
    
    if workflow:
        orchestrator.register_workflow(workflow)
        return workflow.workflow_id
    return None

def execute_artifact_workflow(workflow_id: str, trigger_context: Dict[str, Any]) -> Optional[str]:
    """Integration function for executing artifact workflows"""
    if not ENABLE_WORKFLOW_AUTOMATION:
        return None
    
    orchestrator = WorkflowOrchestrator()
    return orchestrator.execute_workflow(workflow_id, trigger_context)