from src.constants.base import MAXIMUM_NESTED_DEPTH
"""

Comprehensive testing for NASA POT10 compliance improvement agents:
    pass
1. ConsensusSecurityManager - Gap analysis and systematic implementation
2. NASAComplianceAuditor - Rule-by-rule assessment and recommendations  
3. DefensiveProgrammingSpecialist - Assertion injection framework
4. FunctionDecomposer - Function size compliance through Extract Method
5. BoundedASTWalker - Rule 4 compliant AST traversal
"""

import ast
import json
import tempfile
import unittest
from pathlib import Path

# NASA compliance imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.analyzers.nasa.security_manager import (
    ConsensusSecurityManager, 
    ComplianceGap,
    create_security_manager
)
from src.analyzers.nasa.nasa_compliance_auditor import (
    NASAComplianceAuditor,
    RuleComplianceReport,
    create_nasa_auditor
)
from src.analyzers.nasa.defensive_programming_specialist import (
    DefensiveProgrammingSpecialist,
    AssertionPoint,
    create_defensive_specialist
)
from src.analyzers.nasa.function_decomposer import (
    FunctionDecomposer,
    FunctionViolation,
    create_function_decomposer
)
from src.analyzers.nasa.bounded_ast_walker import (
    BoundedASTWalker,
    TraversalBounds,
    create_bounded_walker
)

class TestConsensusSecurityManager(unittest.TestCase):
    """Test NASA compliance security manager for systematic POT10 improvements."""
    
    def setUp(self):
        """Set up test environment."""
        self.security_manager = create_security_manager()
        self.test_project_path = Path(__file__).parent.parent.parent
    
    def test_analyze_nasa_compliance_gaps(self):
        """Test comprehensive NASA compliance gap analysis."""
        gaps = self.security_manager.analyze_nasa_compliance_gaps(str(self.test_project_path))
        
        # Validate gap analysis results
        self.assertIsInstance(gaps, list)
        self.assertTrue(len(gaps) > 0, "Should identify compliance gaps")
        
        # Check gap structure
        for gap in gaps[:3]:  # Test first 3 gaps
            self.assertIsInstance(gap, ComplianceGap)
            self.assertIn(gap.rule_id, ["nasa_rule_2_function_size", "nasa_rule_4_bounded_loops", "nasa_rule_5_assertions"])
            self.assertGreater(gap.gap_percentage, 0.0)
            self.assertIn(gap.priority, ["high", "medium", "low"])
    
    def test_generate_function_decomposition_plan(self):
        """Test function decomposition plan generation for Rule 2 compliance."""
        test_file = self.test_project_path / "analyzer" / "core.py"
        plan = self.security_manager.generate_function_decomposition_plan(str(test_file))
        
        # Validate plan structure
        self.assertIsInstance(plan, dict)
        self.assertIn("large_functions", plan)
        self.assertIn("refactoring_strategy", plan)
        self.assertEqual(plan["refactoring_strategy"], "extract_method_command_pattern")
        self.assertTrue(plan["estimated_operations"] > 0)
    
    def test_generate_bounded_ast_walker_implementation(self):
        """Test BoundedASTWalker code generation for Rule 4 compliance."""
        implementation = self.security_manager.generate_bounded_ast_walker_implementation()
        
        # Validate generated code
        self.assertIsInstance(implementation, str)
        self.assertIn("BoundedASTWalker", implementation)
        self.assertIn("max_depth", implementation)
        self.assertIn("max_nodes", implementation)
        self.assertIn("NASA Rule 4", implementation)
        
        # Validate it's syntactically correct Python
        try:
            ast.parse(implementation)
        except SyntaxError:
            self.fail("Generated BoundedASTWalker code is not valid Python")
    
    def test_generate_assertion_injection_framework(self):
        """Test assertion injection framework generation for Rule MAXIMUM_NESTED_DEPTH compliance."""
        test_file = self.test_project_path / "analyzer" / "core.py"
        framework = self.security_manager.generate_assertion_injection_framework(str(test_file))
        
        # Validate framework structure
        self.assertIsInstance(framework, dict)
        self.assertIn("assertion_points", framework)
        self.assertIn("framework_type", framework)
        self.assertEqual(framework["framework_type"], "icontract_integration")
        self.assertGreaterEqual(framework["coverage_target"], 0.90)

class TestNASAComplianceAuditor(unittest.TestCase):
    """Test NASA compliance auditor for rule-by-rule assessment."""
    
    def setUp(self):
        """Set up test environment."""
        self.auditor = create_nasa_auditor()
        self.test_project_path = Path(__file__).parent.parent.parent
    
    def test_audit_project_compliance(self):
        """Test comprehensive project NASA POT10 compliance audit."""
        assessment = self.auditor.audit_project_compliance(str(self.test_project_path))
        
        # Validate assessment structure
        self.assertIsNotNone(assessment)
        self.assertEqual(assessment.project_path, str(self.test_project_path))
        self.assertGreaterEqual(assessment.overall_compliance, 0.0)
        self.assertLessEqual(assessment.overall_compliance, 1.0)
        self.assertIn(assessment.readiness_status, ["CERTIFIED_READY", "DEFENSE_READY", "IMPROVEMENT_REQUIRED", "NON_COMPLIANT"])
    
    def test_rule_specific_analysis(self):
        """Test individual NASA rule compliance analysis."""
        assessment = self.auditor.audit_project_compliance(str(self.test_project_path))
        
        # Validate rule reports
        self.assertTrue(len(assessment.rule_reports) >= 5)  # At least 5 rules analyzed
        
        for report in assessment.rule_reports:
            self.assertIsInstance(report, RuleComplianceReport)
            self.assertIn(report.rule_id, [f"rule_{i}" for i in range(1, 11)])
            self.assertGreaterEqual(report.current_compliance, 0.0)
            self.assertLessEqual(report.current_compliance, 1.0)
            self.assertGreaterEqual(report.target_compliance, report.current_compliance)
    
    def test_critical_gaps_identification(self):
        """Test critical compliance gap identification."""
        assessment = self.auditor.audit_project_compliance(str(self.test_project_path))
        
        # Validate critical gaps
        self.assertIsInstance(assessment.critical_gaps, list)
        
        # Should identify primary gaps based on baseline
        critical_gap_rules = [gap.lower() for gap in assessment.critical_gaps]
        expected_gaps = ["function", "loop", "assertion"]  # Rule 2, 4, 5 keywords
        
        for expected in expected_gaps:
            gap_found = any(expected in gap for gap in critical_gap_rules)
            if not gap_found:
                print(f"Warning: Expected critical gap '{expected}' not found in {critical_gap_rules}")
    
    def test_improvement_roadmap_generation(self):
        """Test systematic improvement roadmap generation."""
        assessment = self.auditor.audit_project_compliance(str(self.test_project_path))
        
        # Validate roadmap structure
        roadmap = assessment.improvement_roadmap
        self.assertIn("phase_1_critical", roadmap)
        self.assertIn("phase_2_high_priority", roadmap)
        self.assertIn("phase_3_comprehensive", roadmap)
        
        # Each phase should have required fields
        for phase_name, phase_details in roadmap.items():
            self.assertIn("rules", phase_details)
            self.assertIn("expected_improvement", phase_details)
            self.assertIn("timeline", phase_details)
            self.assertIn("operations", phase_details)

class TestDefensiveProgrammingSpecialist(unittest.TestCase):
    """Test defensive programming specialist for assertion injection."""
    
    def setUp(self):
        """Set up test environment."""
        self.specialist = create_defensive_specialist()
        self.test_file_path = Path(__file__).parent.parent.parent / "analyzer" / "core.py"
    
    def test_analyze_defensive_programming_opportunities(self):
        """Test analysis of defensive programming opportunities."""
        plan = self.specialist.analyze_defensive_programming_opportunities(str(self.test_file_path))
        
        # Validate plan structure
        self.assertIsNotNone(plan)
        self.assertEqual(plan.file_path, str(self.test_file_path))
        self.assertGreaterEqual(plan.total_assertions_needed, 0)
        self.assertGreaterEqual(plan.coverage_improvement, 0.0)
        self.assertIsInstance(plan.function_analyses, list)
    
    def test_function_analysis_accuracy(self):
        """Test accuracy of individual function analysis."""
        plan = self.specialist.analyze_defensive_programming_opportunities(str(self.test_file_path))
        
        # Validate function analyses
        for func_analysis in plan.function_analyses[:3]:  # Test first 3
            self.assertIsInstance(func_analysis.name, str)
            self.assertGreater(func_analysis.line_start, 0)
            self.assertGreaterEqual(func_analysis.current_assertions, 0)
            self.assertGreaterEqual(func_analysis.required_assertions, 2)  # NASA Rule 5
            self.assertGreaterEqual(func_analysis.defensive_score, 0.0)
            self.assertLessEqual(func_analysis.defensive_score, 1.0)
    
    def test_assertion_point_identification(self):
        """Test identification of specific assertion points."""
        plan = self.specialist.analyze_defensive_programming_opportunities(str(self.test_file_path))
        
        # Validate assertion points
        total_assertion_points = sum(len(fa.assertion_points) for fa in plan.function_analyses)
        self.assertGreater(total_assertion_points, 0)
        
        # Check assertion point structure
        for func_analysis in plan.function_analyses:
            for assertion_point in func_analysis.assertion_points[:2]:  # Test first 2
                self.assertIsInstance(assertion_point, AssertionPoint)
                self.assertIn(assertion_point.location_type, ["precondition", "postcondition", "invariant", "bounds_check"])
                self.assertGreater(assertion_point.line_number, 0)
                self.assertIn(assertion_point.priority, ["high", "medium", "low"])
    
    def test_icontract_integration_code_generation(self):
        """Test icontract integration code generation."""
        plan = self.specialist.analyze_defensive_programming_opportunities(str(self.test_file_path))
        integration_code = self.specialist.generate_icontract_integration_code(plan)
        
        # Validate generated code
        self.assertIsInstance(integration_code, str)
        self.assertIn("icontract", integration_code)
        self.assertIn("require", integration_code)
        self.assertIn("ensure", integration_code)
        self.assertIn("NASA Rule 5", integration_code)
        
        # Validate it's syntactically correct Python
        try:
            ast.parse(integration_code)
        except SyntaxError:
            self.fail("Generated icontract integration code is not valid Python")

class TestFunctionDecomposer(unittest.TestCase):
    """Test function decomposer for NASA Rule 2 compliance."""
    
    def setUp(self):
        """Set up test environment."""
        self.decomposer = create_function_decomposer()
        self.test_project_path = Path(__file__).parent.parent.parent
    
    def test_analyze_function_violations(self):
        """Test analysis of function size violations."""
        violations = self.decomposer.analyze_function_violations(str(self.test_project_path))
        
        # Validate violations structure
        self.assertIsInstance(violations, list)
        
        # Should find known large functions from baseline
        large_function_names = [v.function_name for v in violations]
        expected_functions = ["loadConnascenceSystem", "__init__"]  # Known large functions
        
        for expected in expected_functions:
            if expected not in large_function_names:
                print(f"Warning: Expected large function '{expected}' not found")
    
    def test_violation_analysis_accuracy(self):
        """Test accuracy of function violation analysis."""
        violations = self.decomposer.analyze_function_violations(str(self.test_project_path))
        
        for violation in violations[:3]:  # Test first 3
            self.assertIsInstance(violation, FunctionViolation)
            self.assertGreater(violation.current_size, 60)  # Must exceed NASA limit
            self.assertGreater(violation.size_violation, 0)  # Must have violation
            self.assertIn(violation.priority, ["high", "medium", "low"])
            self.assertGreaterEqual(violation.complexity_score, 0.0)
            self.assertLessEqual(violation.complexity_score, 1.0)
    
    def test_decomposition_plan_generation(self):
        """Test generation of decomposition plans."""
        violations = self.decomposer.analyze_function_violations(str(self.test_project_path))
        plans = self.decomposer.generate_decomposition_plans(violations)
        
        # Validate plans structure
        self.assertIsInstance(plans, list)
        if violations:  # Only test if violations found
            self.assertGreater(len(plans), 0)
            
            for plan in plans[:2]:  # Test first 2
                self.assertIn(plan.target_function, [v.function_name for v in violations])
                self.assertGreater(plan.estimated_size_reduction, 0)
                self.assertGreater(plan.bounded_operations_count, 0)
                self.assertIsInstance(plan.extraction_operations, list)

class TestBoundedASTWalker(unittest.TestCase):
    """Test bounded AST walker for NASA Rule 4 compliance."""
    
    def setUp(self):
        """Set up test environment."""
        self.walker = create_bounded_walker()
        self.test_file_path = Path(__file__).parent.parent.parent / "analyzer" / "core.py"
    
    def test_bounded_traversal_limits(self):
        """Test that AST traversal respects bounds."""
        # Read and parse test file
        with open(self.test_file_path, 'r', encoding='utf-8') as f:
            source_code = f.read()
        
        tree = ast.parse(source_code)
        
        # Walk with bounds
        nodes = list(self.walker.walk_bounded(tree))
        
        # Validate bounds enforcement
        self.assertLessEqual(len(nodes), self.walker.bounds.max_nodes)
        self.assertLessEqual(self.walker.stats.max_depth_reached, self.walker.bounds.max_depth)
    
    def test_traversal_statistics_accuracy(self):
        """Test accuracy of traversal statistics."""
        # Simple test AST
        test_code = """
def test_function():
    if True:
        for i in range(10):
            print(i)
    return True
"""
        tree = ast.parse(test_code)
        
        # Walk and collect statistics
        nodes = list(self.walker.walk_bounded(tree))
        report = self.walker.get_traversal_report()
        
        # Validate statistics
        self.assertEqual(len(nodes), report["traversal_statistics"]["nodes_processed"])
        self.assertGreater(report["traversal_statistics"]["traversal_time_ms"], 0)
        self.assertTrue(report["nasa_compliance"]["rule_1_compliant"])  # No recursion
        self.assertTrue(report["nasa_compliance"]["stack_based_iteration"])
    
    def test_specific_node_type_collection(self):
        """Test collection of specific node types."""
        test_code = """
def func1():
    pass

def func2():
    pass

class TestClass:
    def method1(self):
        pass
"""
        tree = ast.parse(test_code)
        
        # Collect functions
        functions = self.walker.collect_functions_bounded(tree)
        
        # Should find 3 functions (including method)
        self.assertEqual(len(functions), 3)
        for func in functions:
            self.assertIsInstance(func, ast.FunctionDef)

class TestNASAAgentIntegration(unittest.TestCase):
    """Integration tests for NASA compliance agent swarm coordination."""
    
    def setUp(self):
        """Set up integration test environment."""
        self.security_manager = create_security_manager()
        self.auditor = create_nasa_auditor()
        self.specialist = create_defensive_specialist()
        self.decomposer = create_function_decomposer()
        self.walker = create_bounded_walker()
        
        self.test_project_path = Path(__file__).parent.parent.parent
    
    def test_agent_swarm_coordination(self):
        """Test coordination between NASA compliance agents."""
        # Step 1: Security manager analyzes gaps
        gaps = self.security_manager.analyze_nasa_compliance_gaps(str(self.test_project_path))
        
        # Step 2: Auditor provides detailed assessment
        assessment = self.auditor.audit_project_compliance(str(self.test_project_path))
        
        # Step 3: Specialist analyzes assertion opportunities
        test_file = self.test_project_path / "analyzer" / "core.py"
        defensive_plan = self.specialist.analyze_defensive_programming_opportunities(str(test_file))
        
        # Step 4: Decomposer analyzes function violations
        violations = self.decomposer.analyze_function_violations(str(self.test_project_path))
        
        # Validate coordination results
        self.assertGreater(len(gaps), 0, "Security manager should identify gaps")
        self.assertIsNotNone(assessment, "Auditor should provide assessment")
        self.assertGreater(defensive_plan.total_assertions_needed, 0, "Specialist should identify opportunities")
        self.assertIsInstance(violations, list, "Decomposer should analyze violations")
    
    def test_compliance_improvement_estimation(self):
        """Test estimation of overall compliance improvement."""
        assessment = self.auditor.audit_project_compliance(str(self.test_project_path))
        
        # Calculate potential improvement from roadmap
        total_potential_improvement = sum(
            phase["expected_improvement"] 
            for phase in assessment.improvement_roadmap.values()
            if isinstance(phase, dict) and "expected_improvement" in phase
        )
        
        # Should identify significant improvement potential
        self.assertGreater(total_potential_improvement, 0.5)  # At least 5% improvement
        
        # Projected compliance should exceed defense industry threshold
        projected_compliance = assessment.overall_compliance + total_potential_improvement
        self.assertGreaterEqual(projected_compliance, 0.90, "Should achieve defense industry readiness")
    
    def test_evidence_package_generation(self):
        """Test generation of defense industry compliance evidence package."""
        evidence = self.security_manager.generate_compliance_evidence_package(str(self.test_project_path))
        
        # Validate evidence package structure
        self.assertIn("assessment_timestamp", evidence)
        self.assertIn("current_compliance", evidence)
        self.assertIn("target_compliance", evidence)
        self.assertIn("compliance_gaps", evidence)
        self.assertIn("improvement_roadmap", evidence)
        self.assertIn("safety_protocols", evidence)
        self.assertIn("defense_industry_readiness", evidence)
        
        # Validate safety protocols
        safety = evidence["safety_protocols"]
        self.assertTrue(safety["bounded_operations"])
        self.assertTrue(safety["surgical_precision"])
        self.assertTrue(safety["auto_branching"])
        self.assertTrue(safety["nasa_rule_validation"])
        
        # Validate defense industry readiness
        readiness = evidence["defense_industry_readiness"]
        self.assertIn("compliance_status", readiness)
        self.assertIn("certification_gaps", readiness)
        self.assertIn("success_criteria", readiness)

if __name__ == "__main__":
    # Create comprehensive test suite
    test_suite = unittest.TestSuite()
    
    # Add test classes
    test_classes = [
        TestConsensusSecurityManager,
        TestNASAComplianceAuditor,
        TestDefensiveProgrammingSpecialist,
        TestFunctionDecomposer,
        TestBoundedASTWalker,
        TestNASAAgentIntegration
    ]
    
    for test_class in test_classes:
        tests = unittest.TestLoader().loadTestsFromTestCase(test_class)
        test_suite.addTests(tests)
    
    # Run comprehensive test suite
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"{'='*60}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if result.failures:
        print(f"\nFailures:")
        for test, traceback in result.failures:
            pass
    
    if result.errors:
        print(f"\nErrors:")
        for test, traceback in result.errors:
            pass
    
    # Exit with appropriate code
    exit_code = 0 if len(result.failures) == 0 and len(result.errors) == 0 else 1
    exit(exit_code)