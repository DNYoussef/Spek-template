/**
 * Enterprise Compliance Automation Example
 * 
 * Demonstrates complete Enterprise Compliance Automation Agent deployment
 * with all framework engines, real-time monitoring, and Phase 3 integration.
 */

const EnterpriseComplianceAgent = require('../automation/enterprise-compliance-agent');
const Phase3IntegrationManager = require('../integration/phase3-integration');

async function demonstrateEnterpriseCompliance() {
  console.log('[ROCKET] Starting Enterprise Compliance Automation Demo');
  console.log('=' .repeat(60));

  try {
    // Initialize Enterprise Compliance Agent
    console.log('\n[CLIPBOARD] 1. Initializing Enterprise Compliance Agent...');
    const complianceAgent = new EnterpriseComplianceAgent({
      performanceOverheadLimit: 0.003, // 0.3% budget
      auditRetentionDays: 90,
      nasaPOT10Target: 95,
      realTimeMonitoring: true,
      automatedRemediation: true,
      evidencePackaging: true
    });

    await complianceAgent.initialize();

    // Initialize Phase 3 Integration
    console.log('\n 2. Initializing Phase 3 Integration...');
    const phase3Integration = new Phase3IntegrationManager({
      enterpriseConfigPath: 'enterprise_config.yaml',
      integrationMode: 'bidirectional',
      syncInterval: 300000 // 5 minutes
    });

    await phase3Integration.initialize();

    // Integrate compliance agent with Phase 3 system
    console.log('\n[WRENCH] 3. Integrating systems...');
    await phase3Integration.integrateWithComplianceAgent(complianceAgent);

    // Demonstrate comprehensive compliance assessment
    console.log('\n[CHART] 4. Executing comprehensive compliance assessment...');
    const assessmentOptions = {
      frameworks: ['SOC2', 'ISO27001', 'NIST-SSDF'],
      assessmentType: 'comprehensive',
      includeRealTimeMonitoring: true,
      generateAuditTrail: true
    };

    const assessmentResults = await complianceAgent.executeComplianceAssessment(assessmentOptions);
    
    console.log('\n[OK] Assessment Results Summary:');
    console.log(`   SOC2 Compliance: ${assessmentResults.frameworks.soc2.compliance.percentage}%`);
    console.log(`   ISO27001 Compliance: ${assessmentResults.frameworks.iso27001.compliance.percentage}%`);
    console.log(`   NIST-SSDF Alignment: ${assessmentResults.frameworks.nistSSWF.compliance.percentage}%`);
    console.log(`   Overall Score: ${assessmentResults.correlation.overallAlignment}%`);
    
    // Demonstrate real-time monitoring
    console.log('\n 5. Starting real-time compliance monitoring...');
    await complianceAgent.complianceMonitor.start();

    // Wait for some monitoring cycles
    console.log('\n  6. Monitoring compliance for 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Get current monitoring metrics
    const monitoringMetrics = await complianceAgent.complianceMonitor.getCurrentMetrics();
    console.log('\n[TREND] Real-time Monitoring Metrics:');
    console.log(`   Monitoring Active: ${monitoringMetrics.monitoring.active}`);
    console.log(`   Operations Count: ${monitoringMetrics.monitoring.operationCount}`);
    console.log(`   Alert Queue Size: ${monitoringMetrics.alerts.queueSize}`);
    console.log(`   Performance Impact: ${monitoringMetrics.performance.impact}`);

    // Demonstrate compliance dashboard
    console.log('\n  7. Generating compliance dashboard...');
    const dashboard = await complianceAgent.generateComplianceDashboard();
    
    console.log('\n[CHART] Compliance Dashboard:');
    console.log(`   Overall Status: ${dashboard.overallStatus.overallCompliance}%`);
    console.log(`   SOC2 Status: ${dashboard.frameworkStatus.soc2.status}`);
    console.log(`   ISO27001 Status: ${dashboard.frameworkStatus.iso27001.status}`);
    console.log(`   NIST-SSDF Status: ${dashboard.frameworkStatus.nistSSWF.status}`);
    console.log(`   Critical Findings: ${dashboard.criticalFindings.length}`);
    console.log(`   Performance Overhead: ${dashboard.performanceMetrics.totalOverhead * 100}%`);

    // Demonstrate Phase 3 integration status
    console.log('\n[CYCLE] 8. Checking Phase 3 integration status...');
    const integrationStatus = phase3Integration.getIntegrationStatus();
    
    console.log('\n Integration Status:');
    console.log(`   Configuration Loaded: ${integrationStatus.configuration.loaded}`);
    console.log(`   Phase 3 Evidence Items: ${integrationStatus.phase3Evidence.discovered}`);
    console.log(`   Sync Mode: ${integrationStatus.synchronization.mode}`);
    console.log(`   Successful Syncs: ${integrationStatus.synchronization.metrics.successfulSyncs}`);
    console.log(`   NASA POT10 Compliance: ${integrationStatus.performance.nasaPOT10Compliance.current}%`);

    // Demonstrate automated remediation
    console.log('\n[WRENCH] 9. Testing automated remediation...');
    const testAlert = {
      id: 'test_alert_001',
      type: 'soc2_compliance_critical',
      severity: 'critical',
      framework: 'soc2',
      description: 'Test critical compliance alert for remediation demo',
      timestamp: new Date().toISOString()
    };

    await complianceAgent.handleComplianceAlert(testAlert);
    console.log(`   [OK] Remediation triggered for alert: ${testAlert.id}`);

    // Final performance validation
    console.log('\n[TARGET] 10. Final performance validation...');
    const finalPerformance = complianceAgent.calculatePerformanceOverhead();
    
    console.log('\n[LIGHTNING] Performance Validation:');
    console.log(`   Memory Overhead: ${(finalPerformance.memoryOverhead * 100).toFixed(3)}%`);
    console.log(`   Time Overhead: ${(finalPerformance.timeOverhead * 100).toFixed(3)}%`);
    console.log(`   Total Overhead: ${(finalPerformance.totalOverhead * 100).toFixed(3)}%`);
    console.log(`   Budget Compliant: ${finalPerformance.budgetCompliant ? '[OK] YES' : '[FAIL] NO'}`);
    console.log(`   Budget Limit: 0.300%`);

    // Stop monitoring
    console.log('\n 11. Stopping monitoring and cleanup...');
    await complianceAgent.complianceMonitor.stop();
    await complianceAgent.shutdown();

    console.log('\n Enterprise Compliance Automation Demo Complete!');
    console.log('=' .repeat(60));
    
    return {
      success: true,
      assessmentResults,
      monitoringMetrics,
      dashboard,
      integrationStatus,
      performance: finalPerformance
    };

  } catch (error) {
    console.error('\n[FAIL] Demo failed:', error.message);
    console.error(error.stack);
    return { success: false, error: error.message };
  }
}

// Run demo if called directly
if (require.main === module) {
  demonstrateEnterpriseCompliance()
    .then(result => {
      if (result.success) {
        console.log('\n[OK] Demo completed successfully');
        process.exit(0);
      } else {
        console.log('\n[FAIL] Demo failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = {
  demonstrateEnterpriseCompliance
};