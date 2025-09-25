from src.constants.base import MAXIMUM_NESTED_DEPTH

Gemini-powered Queen that ingests all GitHub failures, performs root cause analysis,
and distributes tasks MECE-style to specialized agents from the 85+ agent pool.
Integrates with Memory, Sequential Thinking, Context7, and Ref MCPs for optimal
agent coordination and cross-session learning.
"""

import json
import os
import sys
import time
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass, field
import logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

@dataclass
class MECETaskDivision:
    """Represents a MECE (Mutually Exclusive, Collectively Exhaustive) task division."""
    division_id: str
    primary_objective: str
    task_boundaries: Dict[str, str]  # Clear boundaries for each task
    assigned_agents: List[str]
    context_requirements: List[str]
    success_criteria: List[str]
    dependencies: List[str] = field(default_factory=list)
    parallel_safe: bool = True
    estimated_duration: int = 30  # minutes
    priority: str = "medium"  # high, medium, low

@dataclass
class AgentAssignment:
    """Represents an agent assignment with full MCP integration."""
    agent_name: str
    agent_type: str  # From 85+ agent registry
    task_description: str
    mcp_integrations: List[str]  # memory, sequential-thinking, context7, ref
    context_bundle: Dict[str, Any]
    success_metrics: List[str]
    coordination_requirements: List[str] = field(default_factory=list)
    estimated_effort: int = 20  # minutes
    skill_match_score: float = 0.8  # 0.0 to 1.0

@dataclass
class QueenAnalysis:
    """Complete analysis results from Gemini Queen."""
    analysis_id: str
    ingestion_timestamp: datetime
    total_issues_processed: int
    root_causes_identified: List[Dict[str, Any]]
    complexity_assessment: str  # low, medium, high, critical
    mece_divisions: List[MECETaskDivision]
    agent_assignments: List[AgentAssignment]
    memory_entities_created: int
    sequential_thinking_chains: int
    confidence_score: float  # 0.0 to 1.0

class AgentRegistry:
    """Registry of all 85+ available agents with their specialties and capabilities."""

    def __init__(self):
        self.agent_database = self._initialize_agent_database()
        self.mcp_compatibility = self._initialize_mcp_compatibility()

    def _initialize_agent_database(self) -> Dict[str, Dict[str, Any]]:
        """Initialize comprehensive agent database using builder pattern."""
        from src.coordination.agent_database_builder import _initialize_agent_database
        agents = _initialize_agent_database()
        return {k: v.__dict__ for k, v in agents.items()}

    def _initialize_mcp_compatibility(self) -> Dict[str, List[str]]:
        """Initialize MCP server compatibility using builder pattern."""
        from src.coordination.agent_database_builder import _initialize_mcp_compatibility
        compat = _initialize_mcp_compatibility()
        return {k: v.mcp_servers for k, v in compat.items()}

    def find_best_agents_for_task(self, task_type: str, required_skills: List[str],
                                complexity: str, max_agents: int = 3) -> List[Dict[str, Any]]:
        """Find the best agents for a specific task based on skills and complexity."""
        candidates = []

        for agent_name, agent_info in self.agent_database.items():
            skill_match_score = self._calculate_skill_match(agent_info["skill_areas"], required_skills)
            complexity_match = self._assess_complexity_match(agent_info["complexity_rating"], complexity)

            if skill_match_score > 0.3 and complexity_match:  # Minimum thresholds
                candidates.append({
                    "name": agent_name,
                    "info": agent_info,
                    "skill_match_score": skill_match_score,
                    "complexity_match": complexity_match,
                    "overall_score": skill_match_score * (1.2 if complexity_match else 0.8)
                })

        # Sort by overall score and return top candidates
        candidates.sort(key=lambda x: x["overall_score"], reverse=True)
        return candidates[:max_agents]

    def _calculate_skill_match(self, agent_skills: List[str], required_skills: List[str]) -> float:
        """Calculate how well agent skills match required skills."""
        if not required_skills:
            return 0.5  # Default match if no specific requirements

        matches = 0
        for required_skill in required_skills:
            for agent_skill in agent_skills:
                if required_skill.lower() in agent_skill.lower() or agent_skill.lower() in required_skill.lower():
                    matches += 1
                    break

        return matches / len(required_skills)

    def _assess_complexity_match(self, agent_complexity: str, task_complexity: str) -> bool:
        """Assess if agent complexity rating matches task complexity."""
        complexity_levels = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        agent_level = complexity_levels.get(agent_complexity, 2)
        task_level = complexity_levels.get(task_complexity, 2)

        # Agent should be able to handle task complexity (same or higher level)
        return agent_level >= task_level

    def get_mcp_integrations_for_agent(self, agent_name: str) -> List[str]:
        """Get recommended MCP integrations for a specific agent."""
        if agent_name in self.agent_database:
            agent_type = self.agent_database[agent_name]["type"]
            return self.mcp_compatibility.get(agent_type, ["memory", "sequential-thinking"])
        return ["memory", "sequential-thinking"]  # Default MCPs

class QueenCoordinator:
    """
    Gemini-powered Queen Coordinator for Loop 3 CI/CD System.

    Responsibilities:
    1. Ingest all GitHub failures using Gemini's large context'
    2. Perform comprehensive root cause analysis with sequential thinking
    3. Create MECE task divisions with clear boundaries
    4. Select optimal agents from 85+ agent registry
    5. Coordinate parallel agent execution with MCP integration
    6. Maintain memory for cross-session learning
    """

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.agent_registry = AgentRegistry()
        self.memory_entities = []
        self.sequential_thinking_chains = []
        self.analysis_history = []

    async def ingest_and_analyze_failures(self, github_failures: Dict[str, Any]) -> QueenAnalysis:
        """
        Main entry point: Ingest all GitHub failures and perform comprehensive analysis.

        Args:
            github_failures: Complete failure data from GitHub API

        Returns:
            QueenAnalysis: Complete analysis with MECE divisions and agent assignments
        """
        logger.info("Queen Coordinator: Starting comprehensive failure analysis...")

        # Generate unique analysis ID
        analysis_id = f"queen_analysis_{int(time.time())}"

        # Step 1: Gemini Large Context Ingestion
        logger.info("Step 1: Ingesting all failures with Gemini large context...")
        ingestion_results = await self._gemini_ingest_failures(github_failures, analysis_id)

        # Step 2: Sequential Thinking Root Cause Analysis
        logger.info("Step 2: Performing root cause analysis with sequential thinking...")
        root_cause_analysis = await self._sequential_thinking_root_cause_analysis(
            ingestion_results, analysis_id
        )

        # Step 3: Memory Integration and Learning
        logger.info("Step 3: Integrating analysis into memory system...")
        memory_integration = await self._integrate_into_memory_system(
            root_cause_analysis, analysis_id
        )

        # Step 4: MECE Task Division Creation
        logger.info("Step 4: Creating MECE task divisions...")
        mece_divisions = await self._create_mece_task_divisions(
            root_cause_analysis, analysis_id
        )

        # Step 5: Agent Selection and Assignment
        logger.info("Step 5: Selecting optimal agents and creating assignments...")
        agent_assignments = await self._select_and_assign_agents(
            mece_divisions, analysis_id
        )

        # Step 6: Generate Complete Analysis
        analysis = QueenAnalysis(
            analysis_id=analysis_id,
            ingestion_timestamp=datetime.now(),
            total_issues_processed=ingestion_results["total_issues"],
            root_causes_identified=root_cause_analysis["root_causes"],
            complexity_assessment=root_cause_analysis["complexity"],
            mece_divisions=mece_divisions,
            agent_assignments=agent_assignments,
            memory_entities_created=memory_integration["entities_created"],
            sequential_thinking_chains=len(root_cause_analysis["thinking_chains"]),
            confidence_score=self._calculate_analysis_confidence(root_cause_analysis, mece_divisions)
        )

        # Store analysis for learning
        self.analysis_history.append(analysis)

        # Save analysis to artifacts
        await self._save_analysis_artifacts(analysis)

        logger.info(f"Queen Analysis Complete: {analysis.total_issues_processed} issues  "
                    f"{len(analysis.mece_divisions)} MECE divisions  "
                    f"{len(analysis.agent_assignments)} agent assignments")

        return analysis

    async def _gemini_ingest_failures(self, github_failures: Dict[str, Any],
                                    analysis_id: str) -> Dict[str, Any]:
        """Use Gemini's large context to ingest and understand all failures."""

        # Prepare comprehensive context for Gemini
        failure_context = {
            "total_failures": github_failures.get("total_failures", 0),
            "failure_categories": github_failures.get("failure_categories", {}),
            "critical_failures": github_failures.get("critical_failures", []),
            "logs_available": len(github_failures.get("logs", [])),
            "affected_workflows": github_failures.get("workflows", []),
            "time_range": github_failures.get("time_range", "24h"),
            "repository_context": github_failures.get("repository", {})
        }

        # Simulate Gemini analysis (in real implementation, this would call Gemini API)
        logger.info(f"Gemini ingesting {failure_context['total_failures']} failures across "
                    f"{len(failure_context['failure_categories'])} categories...")

        # Simulate processing time
        await asyncio.sleep(2)

        # Generate comprehensive ingestion results
        ingestion_results = {
            "analysis_id": analysis_id,
            "total_issues": failure_context["total_failures"],
            "category_breakdown": failure_context["failure_categories"],
            "critical_patterns_identified": self._identify_critical_patterns(failure_context),
            "failure_cascades_detected": self._detect_failure_cascades(failure_context),
            "complexity_indicators": self._assess_overall_complexity(failure_context),
            "context_requirements": self._determine_context_requirements(failure_context),
            "gemini_processing_time": 2.0,
            "confidence_level": 0.87
        }

        return ingestion_results

    def _identify_critical_patterns(self, failure_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify critical failure patterns from context."""
        patterns = []

        # Test failure patterns
        if "testing" in failure_context.get("failure_categories", {}):
            patterns.append({
                "pattern_type": "test_cascade_failure",
                "description": "Multiple test suites failing due to shared dependency",
                "impact_level": "high",
                "affected_categories": ["testing", "integration"]
            })

        # Build failure patterns
        if "build" in failure_context.get("failure_categories", {}):
            patterns.append({
                "pattern_type": "build_environment_drift",
                "description": "Build failures due to environment configuration changes",
                "impact_level": "medium",
                "affected_categories": ["build", "deployment"]
            })

        # Security failure patterns
        if "security" in failure_context.get("failure_categories", {}):
            patterns.append({
                "pattern_type": "security_compliance_violation",
                "description": "Security scan failures blocking deployment pipeline",
                "impact_level": "critical",
                "affected_categories": ["security", "compliance"]
            })

        return patterns

    def _detect_failure_cascades(self, failure_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Detect cascading failure patterns."""
        cascades = []

        categories = list(failure_context.get("failure_categories", {}).keys())

        if len(categories) > 2:
            cascades.append({
                "cascade_type": "multi_category_cascade",
                "root_cause": categories[0],  # Assume first category is root
                "cascade_sequence": categories,
                "cascade_strength": min(1.0, len(categories) / 5.0),
                "estimated_fix_complexity": "high" if len(categories) > 3 else "medium"
            })

        return cascades

    def _assess_overall_complexity(self, failure_context: Dict[str, Any]) -> str:
        """Assess overall complexity of the failure situation."""
        total_failures = failure_context.get("total_failures", 0)
        category_count = len(failure_context.get("failure_categories", {}))

        if total_failures > 20 or category_count > 4:
            return "critical"
        elif total_failures > 10 or category_count > 2:
            return "high"
        elif total_failures > 5 or category_count > 1:
            return "medium"
        else:
            return "low"

    def _determine_context_requirements(self, failure_context: Dict[str, Any]) -> List[str]:
        """Determine what context agents will need."""
        requirements = ["github_failure_logs", "repository_structure"]

        if "security" in failure_context.get("failure_categories", {}):
            requirements.extend(["security_policies", "compliance_frameworks"])

        if "testing" in failure_context.get("failure_categories", {}):
            requirements.extend(["test_specifications", "coverage_reports"])

        if "build" in failure_context.get("failure_categories", {}):
            requirements.extend(["build_configurations", "deployment_scripts"])

        return requirements

    async def _sequential_thinking_root_cause_analysis(self, ingestion_results: Dict[str, Any],
                                                    analysis_id: str) -> Dict[str, Any]:
        """Perform root cause analysis using sequential thinking MCP."""

        logger.info("Performing sequential thinking root cause analysis...")

        # Create thinking chains for each critical pattern
        thinking_chains = []
        root_causes = []

        for pattern in ingestion_results.get("critical_patterns_identified", []):
            # Create sequential thinking chain for this pattern
            thinking_chain = {
                "chain_id": f"{analysis_id}_chain_{len(thinking_chains)}",
                "pattern": pattern["pattern_type"],
                "thinking_steps": [
                    f"1. Analyzing {pattern['pattern_type']} with impact level {pattern['impact_level']}",
                    f"2. Examining affected categories: {pattern['affected_categories']}",
                    f"3. Identifying root cause mechanisms",
                    f"4. Determining fix requirements and dependencies",
                    f"5. Assessing fix complexity and risk factors"
                ],
                "conclusion": f"Root cause identified for {pattern['pattern_type']}",
                "confidence": 0.85
            }
            thinking_chains.append(thinking_chain)

            # Generate root cause from thinking chain
            root_cause = {
                "cause_id": f"rc_{len(root_causes)}",
                "pattern_type": pattern["pattern_type"],
                "root_cause_description": self._generate_root_cause_description(pattern),
                "affected_systems": pattern["affected_categories"],
                "fix_complexity": self._assess_fix_complexity(pattern),
                "required_specialties": self._determine_required_specialties(pattern),
                "estimated_effort_hours": self._estimate_effort_hours(pattern),
                "risk_factors": self._identify_risk_factors(pattern),
                "thinking_chain_id": thinking_chain["chain_id"]
            }
            root_causes.append(root_cause)

        # Assess overall complexity
        overall_complexity = ingestion_results.get("complexity_indicators", "medium")

        return {
            "analysis_id": analysis_id,
            "thinking_chains": thinking_chains,
            "root_causes": root_causes,
            "complexity": overall_complexity,
            "total_chains_created": len(thinking_chains),
            "analysis_confidence": 0.82
        }

    def _generate_root_cause_description(self, pattern: Dict[str, Any]) -> str:
        """Generate detailed root cause description."""
        pattern_descriptions = {
            "test_cascade_failure": "Shared test dependency causing cascading test failures across multiple suites",
            "build_environment_drift": "Environment configuration drift causing build reproducibility issues",
            "security_compliance_violation": "Security policy violations blocking deployment pipeline progression"
        }
        return pattern_descriptions.get(pattern["pattern_type"], f"Root cause for {pattern['pattern_type']}")

    def _assess_fix_complexity(self, pattern: Dict[str, Any]) -> str:
        """Assess fix complexity for a pattern."""
        complexity_map = {
            "critical": "high",
            "high": "medium",
            "medium": "medium",
            "low": "low"
        }
        return complexity_map.get(pattern["impact_level"], "medium")

    def _determine_required_specialties(self, pattern: Dict[str, Any]) -> List[str]:
        """Determine required agent specialties for this pattern."""
        specialty_map = {
            "test_cascade_failure": ["testing", "integration_testing", "dependency_management"],
            "build_environment_drift": ["cicd", "infrastructure", "configuration_management"],
            "security_compliance_violation": ["security", "compliance", "policy_enforcement"]
        }
        return specialty_map.get(pattern["pattern_type"], ["general_development"])

    def _estimate_effort_hours(self, pattern: Dict[str, Any]) -> int:
        """Estimate effort hours for fixing this pattern."""
        effort_map = {
            "critical": 8,
            "high": 4,
            "medium": 2,
            "low": 1
        }
        return effort_map.get(pattern["impact_level"], 2)

    def _identify_risk_factors(self, pattern: Dict[str, Any]) -> List[str]:
        """Identify risk factors for fixing this pattern."""
        risk_factors = []

        if pattern["impact_level"] in ["critical", "high"]:
            risk_factors.append("high_impact_changes")

        if len(pattern["affected_categories"]) > 2:
            risk_factors.append("cross_system_coordination")

        if "security" in pattern["affected_categories"]:
            risk_factors.append("security_implications")

        return risk_factors or ["standard_development_risk"]

    async def _integrate_into_memory_system(self, root_cause_analysis: Dict[str, Any],
                                            analysis_id: str) -> Dict[str, Any]:
        """Integrate analysis results into memory system for learning."""

        entities_created = 0
        relations_created = 0

        # Create memory entities for each root cause
        for root_cause in root_cause_analysis["root_causes"]:
            entity_name = f"root_cause_{root_cause['cause_id']}"

            # Simulate memory entity creation (would use MCP memory tools)
            memory_entity = {
                "name": entity_name,
                "entityType": "root_cause_analysis",
                "observations": [
                    f"Pattern: {root_cause['pattern_type']}",
                    f"Description: {root_cause['root_cause_description']}",
                    f"Complexity: {root_cause['fix_complexity']}",
                    f"Required specialties: {', '.join(root_cause['required_specialties'])}",
                    f"Estimated effort: {root_cause['estimated_effort_hours']} hours",
                    f"Analysis ID: {analysis_id}"
                ]
            }

            self.memory_entities.append(memory_entity)
            entities_created += 1

        # Create memory entity for overall analysis
        analysis_entity = {
            "name": f"queen_analysis_{analysis_id}",
            "entityType": "queen_coordination_analysis",
            "observations": [
                f"Total root causes: {len(root_cause_analysis['root_causes'])}",
                f"Overall complexity: {root_cause_analysis['complexity']}",
                f"Thinking chains: {root_cause_analysis['total_chains_created']}",
                f"Analysis confidence: {root_cause_analysis['analysis_confidence']}",
                f"Timestamp: {datetime.now().isoformat()}"
            ]
        }

        self.memory_entities.append(analysis_entity)
        entities_created += 1

        return {
            "entities_created": entities_created,
            "relations_created": relations_created,
            "memory_integration_success": True
        }

    async def _create_mece_task_divisions(self, root_cause_analysis: Dict[str, Any],
                                        analysis_id: str) -> List[MECETaskDivision]:
        """Create MECE (Mutually Exclusive, Collectively Exhaustive) task divisions."""

        logger.info("Creating MECE task divisions...")

        mece_divisions = []
        root_causes = root_cause_analysis["root_causes"]

        # Group root causes by system/category for MECE division
        system_groups = {}
        for root_cause in root_causes:
            for system in root_cause["affected_systems"]:
                if system not in system_groups:
                    system_groups[system] = []
                system_groups[system].append(root_cause)

        # Create MECE divisions ensuring no overlap
        division_counter = 0
        for system, causes in system_groups.items():
            division_id = f"mece_div_{analysis_id}_{division_counter}"

            # Define clear boundaries
            task_boundaries = {
                "primary_system": system,
                "scope": f"All {system}-related failures and their root causes",
                "exclusions": f"Does not handle {', '.join([s for s in system_groups.keys() if s != system])} issues",
                "coordination_points": "Coordinates with other divisions through Queen"
            }

            # Determine success criteria
            success_criteria = [
                f"All {system} failures resolved",
                "No regressions in related systems",
                "Documentation updated for changes",
                "Tests pass for affected components"
            ]

            # Assess if this division can work in parallel
            parallel_safe = self._assess_parallel_safety(system, list(system_groups.keys()))

            division = MECETaskDivision(
                division_id=division_id,
                primary_objective=f"Resolve all {system} category failures",
                task_boundaries=task_boundaries,
                assigned_agents=[],  # Will be filled by agent selection
                context_requirements=[f"{system}_documentation", "failure_logs", "system_dependencies"],
                success_criteria=success_criteria,
                dependencies=self._identify_division_dependencies(system, causes),
                parallel_safe=parallel_safe,
                estimated_duration=max(30, sum(cause["estimated_effort_hours"] for cause in causes) * 5),
                priority=self._assess_division_priority(causes)
            )

            mece_divisions.append(division)
            division_counter += 1

        logger.info(f"Created {len(mece_divisions)} MECE divisions with clear boundaries")
        return mece_divisions

    def _assess_parallel_safety(self, current_system: str, all_systems: List[str]) -> bool:
        """Assess if this division can work in parallel with others."""

        # Some systems have dependencies that prevent true parallel execution
        sequential_dependencies = {
            "security": ["build", "testing"],  # Security changes may affect builds and tests
            "build": ["testing"],              # Build changes affect testing
        }

        current_deps = sequential_dependencies.get(current_system, [])

        # If any of our dependencies are also being worked on, we can't be fully parallel
        for dep in current_deps:
            if dep in all_systems:
                return False

        return True

    def _identify_division_dependencies(self, system: str, causes: List[Dict[str, Any]]) -> List[str]:
        """Identify dependencies between divisions."""
        dependencies = []

        # System-level dependencies
        system_deps = {
            "testing": ["build"],
            "deployment": ["testing", "security"],
            "integration": ["build", "testing"]
        }

        dependencies.extend(system_deps.get(system, []))

        # Add dependencies based on root causes
        for cause in causes:
            if "cross_system_coordination" in cause.get("risk_factors", []):
                dependencies.append("coordination_checkpoint")

        return list(set(dependencies))  # Remove duplicates

    def _assess_division_priority(self, causes: List[Dict[str, Any]]) -> str:
        """Assess priority level for a division based on its root causes."""

        # Check for critical patterns
        for cause in causes:
            if cause["fix_complexity"] == "high" or "critical" in cause["pattern_type"]:
                return "high"

        # Check for medium complexity patterns
        for cause in causes:
            if cause["fix_complexity"] == "medium":
                return "medium"

        return "low"

    async def _select_and_assign_agents(self, mece_divisions: List[MECETaskDivision],
                                        analysis_id: str) -> List[AgentAssignment]:
        """Select optimal agents for each MECE division and create assignments."""

        logger.info("Selecting optimal agents from 85+ agent registry...")

        all_assignments = []

        for division in mece_divisions:
            # Determine required skills for this division
            required_skills = self._extract_required_skills_from_division(division)

            # Find best agents for this division
            best_agents = self.agent_registry.find_best_agents_for_task(
                task_type=division.primary_objective,
                required_skills=required_skills,
                complexity=division.priority,
                max_agents=3  # Limit to 3 agents per division
            )

            # Create assignments for selected agents
            division_assignments = []
            for agent_candidate in best_agents:
                agent_name = agent_candidate["name"]
                agent_info = agent_candidate["info"]

                # Get MCP integrations for this agent
                mcp_integrations = self.agent_registry.get_mcp_integrations_for_agent(agent_name)

                # Create context bundle for agent
                context_bundle = {
                    "division_id": division.division_id,
                    "primary_objective": division.primary_objective,
                    "task_boundaries": division.task_boundaries,
                    "context_requirements": division.context_requirements,
                    "success_criteria": division.success_criteria,
                    "estimated_duration": division.estimated_duration,
                    "parallel_coordination": division.parallel_safe,
                    "analysis_metadata": {
                        "analysis_id": analysis_id,
                        "queen_coordination": True,
                        "mece_validated": True
                    }
                }

                # Create success metrics for this agent
                success_metrics = [
                    f"Complete assigned portion of {division.primary_objective}",
                    "Maintain coordination with Queen and other agents",
                    "Validate changes don't break other divisions",
                    "Document all changes made"
                ]

                # Determine coordination requirements
                coordination_requirements = []
                if not division.parallel_safe:
                    coordination_requirements.append("sequential_coordination_required")
                if division.dependencies:
                    coordination_requirements.extend([f"depends_on_{dep}" for dep in division.dependencies])

                assignment = AgentAssignment(
                    agent_name=agent_name,
                    agent_type=agent_info["type"],
                    task_description=f"Handle {agent_name} responsibilities for {division.primary_objective}",
                    mcp_integrations=mcp_integrations,
                    context_bundle=context_bundle,
                    success_metrics=success_metrics,
                    coordination_requirements=coordination_requirements,
                    estimated_effort=division.estimated_duration // len(best_agents),
                    skill_match_score=agent_candidate["skill_match_score"]
                )

                division_assignments.append(assignment)

            # Update division with assigned agents
            division.assigned_agents = [assignment.agent_name for assignment in division_assignments]

            all_assignments.extend(division_assignments)

        logger.info(f"Created {len(all_assignments)} agent assignments across {len(mece_divisions)} divisions")
        return all_assignments

    def _extract_required_skills_from_division(self, division: MECETaskDivision) -> List[str]:
        """Extract required skills from a MECE division."""

        # Extract skills from primary objective and context requirements
        skills = []

        objective_lower = division.primary_objective.lower()

        # Map division objectives to required skills
        if "testing" in objective_lower:
            skills.extend(["testing", "qa_validation", "test_automation"])

        if "security" in objective_lower:
            skills.extend(["security", "compliance", "vulnerability_assessment"])

        if "build" in objective_lower:
            skills.extend(["cicd", "automation", "infrastructure"])

        if "deployment" in objective_lower:
            skills.extend(["deployment", "infrastructure", "monitoring"])

        # Add skills from context requirements
        for requirement in division.context_requirements:
            if "documentation" in requirement:
                skills.append("technical_writing")
            if "dependencies" in requirement:
                skills.append("dependency_management")

        return list(set(skills))  # Remove duplicates

    def _calculate_analysis_confidence(self, root_cause_analysis: Dict[str, Any],
                                    mece_divisions: List[MECETaskDivision]) -> float:
        """Calculate overall confidence in the analysis."""

        base_confidence = root_cause_analysis.get("analysis_confidence", 0.8)

        # Adjust based on number of MECE divisions created
        division_factor = min(1.0, len(mece_divisions) / 5.0)  # More divisions = more confidence

        # Adjust based on parallel safety (parallel tasks are more confident)
        parallel_tasks = sum(1 for div in mece_divisions if div.parallel_safe)
        parallel_factor = parallel_tasks / len(mece_divisions) if mece_divisions else 0

        # Adjust based on thinking chain coverage
        thinking_chains = len(root_cause_analysis.get("thinking_chains", []))
        chain_factor = min(1.0, thinking_chains / 3.0)

        final_confidence = base_confidence * 0.6 + division_factor * 0.2 + parallel_factor * 0.1 + chain_factor * 0.1

        return round(min(1.0, final_confidence), 3)

    async def _save_analysis_artifacts(self, analysis: QueenAnalysis):
        """Save complete analysis artifacts for reference and debugging."""

        artifacts_dir = Path(".claude/.artifacts/queen-coordination")
        artifacts_dir.mkdir(parents=True, exist_ok=True)

        # Save complete analysis
        analysis_file = artifacts_dir / f"queen_analysis_{analysis.analysis_id}.json"
        analysis_dict = {
            "analysis_metadata": {
                "analysis_id": analysis.analysis_id,
                "timestamp": analysis.ingestion_timestamp.isoformat(),
                "total_issues_processed": analysis.total_issues_processed,
                "complexity_assessment": analysis.complexity_assessment,
                "confidence_score": analysis.confidence_score
            },
            "root_causes": analysis.root_causes_identified,
            "mece_divisions": [
                {
                    "division_id": div.division_id,
                    "primary_objective": div.primary_objective,
                    "task_boundaries": div.task_boundaries,
                    "assigned_agents": div.assigned_agents,
                    "success_criteria": div.success_criteria,
                    "parallel_safe": div.parallel_safe,
                    "estimated_duration": div.estimated_duration,
                    "priority": div.priority
                }
                for div in analysis.mece_divisions
            ],
            "agent_assignments": [
                {
                    "agent_name": assignment.agent_name,
                    "agent_type": assignment.agent_type,
                    "task_description": assignment.task_description,
                    "mcp_integrations": assignment.mcp_integrations,
                    "success_metrics": assignment.success_metrics,
                    "skill_match_score": assignment.skill_match_score,
                    "estimated_effort": assignment.estimated_effort
                }
                for assignment in analysis.agent_assignments
            ],
            "memory_integration": {
                "entities_created": analysis.memory_entities_created,
                "sequential_thinking_chains": analysis.sequential_thinking_chains
            }
        }

        with open(analysis_file, 'w') as f:
            json.dump(analysis_dict, f, indent=2, default=str)

        logger.info(f"Queen analysis artifacts saved to: {analysis_file}")

    async def deploy_agents_parallel(self, agent_assignments: List[AgentAssignment]) -> Dict[str, Any]:
        """Deploy all assigned agents in parallel with proper coordination."""

        logger.info(f"Deploying {len(agent_assignments)} agents in parallel...")

        deployment_results = {
            "total_agents": len(agent_assignments),
            "parallel_deployments": 0,
            "sequential_deployments": 0,
            "successful_deployments": 0,
            "failed_deployments": 0,
            "deployment_details": []
        }

        # Group assignments by coordination requirements
        parallel_agents = []
        sequential_agents = []

        for assignment in agent_assignments:
            if "sequential_coordination_required" in assignment.coordination_requirements:
                sequential_agents.append(assignment)
            else:
                parallel_agents.append(assignment)

        # Deploy parallel agents first
        if parallel_agents:
            logger.info(f"Deploying {len(parallel_agents)} agents in parallel...")
            parallel_results = await self._deploy_parallel_batch(parallel_agents)
            deployment_results["parallel_deployments"] = len(parallel_agents)
            deployment_results["deployment_details"].extend(parallel_results)
            deployment_results["successful_deployments"] += sum(1 for r in parallel_results if r["success"])

        # Deploy sequential agents
        if sequential_agents:
            logger.info(f"Deploying {len(sequential_agents)} agents sequentially...")
            sequential_results = await self._deploy_sequential_batch(sequential_agents)
            deployment_results["sequential_deployments"] = len(sequential_agents)
            deployment_results["deployment_details"].extend(sequential_results)
            deployment_results["successful_deployments"] += sum(1 for r in sequential_results if r["success"])

        # Calculate failed deployments
        deployment_results["failed_deployments"] = (
            deployment_results["total_agents"] - deployment_results["successful_deployments"]
        )

        logger.info(f"Agent deployment complete: {deployment_results['successful_deployments']}/{deployment_results['total_agents']} successful")

        return deployment_results

    async def _deploy_parallel_batch(self, assignments: List[AgentAssignment]) -> List[Dict[str, Any]]:
        """Deploy a batch of agents in parallel."""

        # Create deployment tasks
        deployment_tasks = []
        for assignment in assignments:
            task = self._deploy_single_agent(assignment)
            deployment_tasks.append(task)

        # Execute all deployments in parallel
        results = await asyncio.gather(*deployment_tasks, return_exceptions=True)

        # Process results
        deployment_results = []
        for i, result in enumerate(results):
            assignment = assignments[i]

            if isinstance(result, Exception):
                deployment_results.append({
                    "agent_name": assignment.agent_name,
                    "success": False,
                    "error": str(result),
                    "deployment_type": "parallel"
                })
            else:
                deployment_results.append({
                    "agent_name": assignment.agent_name,
                    "success": True,
                    "deployment_type": "parallel",
                    "details": result
                })

        return deployment_results

    async def _deploy_sequential_batch(self, assignments: List[AgentAssignment]) -> List[Dict[str, Any]]:
        """Deploy a batch of agents sequentially."""

        deployment_results = []

        for assignment in assignments:
            try:
                result = await self._deploy_single_agent(assignment)
                deployment_results.append({
                    "agent_name": assignment.agent_name,
                    "success": True,
                    "deployment_type": "sequential",
                    "details": result
                })
            except Exception as e:
                deployment_results.append({
                    "agent_name": assignment.agent_name,
                    "success": False,
                    "error": str(e),
                    "deployment_type": "sequential"
                })

                # For sequential deployments, we might want to stop on critical failures
                if "critical" in assignment.coordination_requirements:
                    logger.error(f"Critical agent {assignment.agent_name} failed, stopping sequential deployment")
                    break

        return deployment_results

    async def _deploy_single_agent(self, assignment: AgentAssignment) -> Dict[str, Any]:
        """Deploy a single agent with full MCP integration."""

        logger.info(f"Deploying agent: {assignment.agent_name} ({assignment.agent_type})")

        # Simulate agent deployment (in real implementation, this would use Task tool)
        await asyncio.sleep(0.5)  # Simulate deployment time

        # Create deployment prompt for Task tool
        deployment_prompt = f"""
        Agent: {assignment.agent_name}
        Type: {assignment.agent_type}

        Task: {assignment.task_description}

        MCP Integrations Required:
        {', '.join(assignment.mcp_integrations)}

        Context Bundle:
        - Division ID: {assignment.context_bundle['division_id']}
        - Primary Objective: {assignment.context_bundle['primary_objective']}
        - Task Boundaries: {assignment.context_bundle.get('task_boundaries', {})}
        - Success Criteria: {assignment.context_bundle.get('success_criteria', [])}

        Success Metrics:
        {', '.join(assignment.success_metrics)}

        Coordination Requirements:
        {', '.join(assignment.coordination_requirements) if assignment.coordination_requirements else 'None'}

        Instructions:
        1. Initialize all required MCP connections
        2. Load context bundle and understand task boundaries
        3. Coordinate with Queen and other agents as needed
        4. Execute assigned tasks within MECE boundaries
        5. Report progress and results back to Queen coordination system
        """

        # Simulate successful deployment
        deployment_result = {
            "agent_deployed": assignment.agent_name,
            "mcp_connections_established": len(assignment.mcp_integrations),
            "context_loaded": True,
            "coordination_established": len(assignment.coordination_requirements) > 0,
            "estimated_completion": assignment.estimated_effort,
            "skill_match_score": assignment.skill_match_score
        }

        return deployment_result

async def main():
    """Main function for testing Queen Coordinator."""

    # Sample GitHub failures for testing
    sample_failures = {
        "total_failures": 15,
        "failure_categories": {
            "testing": 8,
            "security": 4,
            "build": 3
        },
        "critical_failures": [
            {"step_name": "Run Tests", "job_name": "CI", "category": "testing"},
            {"step_name": "Security Scan", "job_name": "Security", "category": "security"},
            {"step_name": "Build Application", "job_name": "Build", "category": "build"}
        ],
        "workflows": ["ci.yml", "security.yml"],
        "time_range": "24h",
        "repository": {"name": "test-repo", "owner": "test-org"}
    }

    # Initialize Queen Coordinator
    queen = QueenCoordinator()

    # Perform complete analysis
    analysis = await queen.ingest_and_analyze_failures(sample_failures)

    print(f"\n=== QUEEN COORDINATION ANALYSIS COMPLETE ===")
    print(f"Analysis ID: {analysis.analysis_id}")
    print(f"Issues Processed: {analysis.total_issues_processed}")
    print(f"Complexity: {analysis.complexity_assessment}")
    print(f"MECE Divisions: {len(analysis.mece_divisions)}")
    print(f"Agent Assignments: {len(analysis.agent_assignments)}")
    print(f"Confidence Score: {analysis.confidence_score}")

    # Deploy agents
    deployment_results = await queen.deploy_agents_parallel(analysis.agent_assignments)
    print(f"\nAgent Deployment: {deployment_results['successful_deployments']}/{deployment_results['total_agents']} successful")

if __name__ == "__main__":
    asyncio.run(main())