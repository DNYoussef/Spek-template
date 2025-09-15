# Workflow Cascade Dependency Diagram

```mermaid
graph TD
    architecture_analysis["Architecture Analysis"]
    codeql_analysis["CodeQL Analysis"]
    compliance_automation["Automated Compliance Validation"]
    mece_duplication_analysis["MECE Duplication Analysis"]
    monitoring_dashboard["Workflow Health Monitoring Dashboard"]
    nasa_pot10_fix["NASA POT10 Compliance Fix"]
    performance_monitoring["Performance Monitoring"]
    quality_gate_enforcer["Quality Gate Enforcer (Push Protection)"]
    quality_gates["Quality Gates (Enhanced)"]
    quality_orchestrator_parallel["Quality Analysis Orchestrator"]
    quality_orchestrator["Quality Analysis Orchestrator"]
    rollback_automation["Automated Rollback & Circuit Breaker"]
    security_orchestrator["Security Quality Gate Orchestrator"]
    security_pipeline["Security Pipeline (Standardized)"]
    self_dogfooding["Self-Dogfooding Analysis"]
    setup_branch_protection["Setup Branch Protection"]
    vscode_extension_ci["VS Code Extension CI/CD Pipeline"]
    config\performance_optimization["config\performance-optimization.yml"]
    config\security_hardening["config\security-hardening.yml"]
    config_performance_optimization[["config/performance-optimization.yml (MISSING)"]]
    style config_performance_optimization fill:#ff6666,stroke:#333,stroke-width:2px
    god_object_detection[["god-object-detection.yml (MISSING)"]]
    style god_object_detection fill:#ff6666,stroke:#333,stroke-width:2px
    dfars_compliance[["dfars-compliance.yml (MISSING)"]]
    style dfars_compliance fill:#ff6666,stroke:#333,stroke-width:2px
    failure_recovery[["failure-recovery.yml (MISSING)"]]
    style failure_recovery fill:#ff6666,stroke:#333,stroke-width:2px
    six_sigma_metrics[["six-sigma-metrics.yml (MISSING)"]]
    style six_sigma_metrics fill:#ff6666,stroke:#333,stroke-width:2px
    validate_artifacts[["validate-artifacts.yml (MISSING)"]]
    style validate_artifacts fill:#ff6666,stroke:#333,stroke-width:2px
    integration_tests[["integration-tests.yml (MISSING)"]]
    style integration_tests fill:#ff6666,stroke:#333,stroke-width:2px
    production_gate[["production-gate.yml (MISSING)"]]
    style production_gate fill:#ff6666,stroke:#333,stroke-width:2px
    closed_loop_automation[["closed-loop-automation.yml (MISSING)"]]
    style closed_loop_automation fill:#ff6666,stroke:#333,stroke-width:2px
    performance_benchmarks[["performance-benchmarks.yml (MISSING)"]]
    style performance_benchmarks fill:#ff6666,stroke:#333,stroke-width:2px
    nasa_pot10_compliance[["nasa-pot10-compliance.yml (MISSING)"]]
    style nasa_pot10_compliance fill:#ff6666,stroke:#333,stroke-width:2px
    intelligent_retry[["intelligent-retry.yml (MISSING)"]]
    style intelligent_retry fill:#ff6666,stroke:#333,stroke-width:2px
    enhanced_quality_gates[["enhanced-quality-gates.yml (MISSING)"]]
    style enhanced_quality_gates fill:#ff6666,stroke:#333,stroke-width:2px
    defense_industry_certification[["defense-industry-certification.yml (MISSING)"]]
    style defense_industry_certification fill:#ff6666,stroke:#333,stroke-width:2px
    connascence_quality_gates[["connascence-quality-gates.yml (MISSING)"]]
    style connascence_quality_gates fill:#ff6666,stroke:#333,stroke-width:2px
    unit_tests[["unit-tests.yml (MISSING)"]]
    style unit_tests fill:#ff6666,stroke:#333,stroke-width:2px
    auto_repair[["auto-repair.yml (MISSING)"]]
    style auto_repair fill:#ff6666,stroke:#333,stroke-width:2px
    load_testing[["load-testing.yml (MISSING)"]]
    style load_testing fill:#ff6666,stroke:#333,stroke-width:2px
    defense_integration_orchestrator[["defense-integration-orchestrator.yml (MISSING)"]]
    style defense_integration_orchestrator fill:#ff6666,stroke:#333,stroke-width:2px
    cmmc_validation[["cmmc-validation.yml (MISSING)"]]
    style cmmc_validation fill:#ff6666,stroke:#333,stroke-width:2px
    cyclomatic_complexity[["cyclomatic-complexity.yml (MISSING)"]]
    style cyclomatic_complexity fill:#ff6666,stroke:#333,stroke-width:2px
    audit_reporting_system[["audit-reporting-system.yml (MISSING)"]]
    style audit_reporting_system fill:#ff6666,stroke:#333,stroke-width:2px
    config_security_hardening[["config/security-hardening.yml (MISSING)"]]
    style config_security_hardening fill:#ff6666,stroke:#333,stroke-width:2px
    connascence_analysis[["connascence-analysis.yml (MISSING)"]]
    style connascence_analysis fill:#ff6666,stroke:#333,stroke-width:2px
    integration_validation[["integration-validation.yml (MISSING)"]]
    style integration_validation fill:#ff6666,stroke:#333,stroke-width:2px
    resource_monitoring[["resource-monitoring.yml (MISSING)"]]
    style resource_monitoring fill:#ff6666,stroke:#333,stroke-width:2px
    nasa_pot10_validation[["nasa-pot10-validation.yml (MISSING)"]]
    style nasa_pot10_validation fill:#ff6666,stroke:#333,stroke-width:2px
    stress_testing[["stress-testing.yml (MISSING)"]]
    style stress_testing fill:#ff6666,stroke:#333,stroke-width:2px
    cascade_prevention[["cascade-prevention.yml (MISSING)"]]
    style cascade_prevention fill:#ff6666,stroke:#333,stroke-width:2px
    itar_compliance[["itar-compliance.yml (MISSING)"]]
    style itar_compliance fill:#ff6666,stroke:#333,stroke-width:2px
    quality_gate_validation[["quality-gate-validation.yml (MISSING)"]]
    style quality_gate_validation fill:#ff6666,stroke:#333,stroke-width:2px
    cache_optimization[["cache-optimization.yml (MISSING)"]]
    style cache_optimization fill:#ff6666,stroke:#333,stroke-width:2px
    workflow_dependencies[["workflow-dependencies.yml (MISSING)"]]
    style workflow_dependencies fill:#ff6666,stroke:#333,stroke-width:2px
    nasa_compliance_check[["nasa-compliance-check.yml (MISSING)"]]
    style nasa_compliance_check fill:#ff6666,stroke:#333,stroke-width:2px
    connascence_core_analysis[["connascence-core-analysis.yml (MISSING)"]]
    style connascence_core_analysis fill:#ff6666,stroke:#333,stroke-width:2px
    e2e_tests[["e2e-tests.yml (MISSING)"]]
    style e2e_tests fill:#ff6666,stroke:#333,stroke-width:2px
    compliance_validation --> compliance_automation
    quality_analyses --> quality_orchestrator_parallel
    circuit_breaker_analysis --> rollback_automation
    circuit_breaker_analysis --> rollback_automation
    execute_rollback --> rollback_automation
    security_gate_validation --> security_orchestrator
    codeql_analysis --> security_orchestrator
    security_gate_validation --> security_orchestrator
    security_analysis --> security_pipeline
    validate --> vscode_extension_ci
    test --> vscode_extension_ci
    validate --> vscode_extension_ci
    build --> vscode_extension_ci
    validate --> vscode_extension_ci
    test --> vscode_extension_ci
    build --> vscode_extension_ci
    security_scan --> vscode_extension_ci
    performance_test --> vscode_extension_ci
    nasa_compliance_validation --> vscode_extension_ci
    enterprise_validation --> vscode_extension_ci
    enterprise_validation --> vscode_extension_ci
    nasa_compliance_validation --> vscode_extension_ci
```
