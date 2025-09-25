from src.constants.base import API_TIMEOUT_SECONDS, MAXIMUM_NESTED_DEPTH, MAXIMUM_RETRY_ATTEMPTS

import asyncio
import json
import time
import subprocess
import sys
from pathlib import Path

class Phase3DistributedContextTester:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent
        self.test_results = {
            'timestamp': time.time(),
            'tests': [],
            'summary': {
                'total': 0,
                'passed': 0,
                'failed': 0,
                'success_rate': 0
            }
        }

    def log_test(self, name, status, details=None):
        """Log test result"""
        test_result = {
            'name': name,
            'status': status,
            'timestamp': time.time(),
            'details': details or {}
        }
        self.test_results['tests'].append(test_result)
        self.test_results['summary']['total'] += 1

        if status == 'PASSED':
            self.test_results['summary']['passed'] += 1
            print(f"PASS {name}")
        else:
            self.test_results['summary']['failed'] += 1
            print(f"FAIL {name}: {details.get('error', 'Unknown error')}")

    def run_node_test(self, test_code, timeout=API_TIMEOUT_SECONDS):
        """Run JavaScript test code in Node.js"""
        try:
            # Create temporary test file
            test_file = self.project_root / 'temp_test.js'

            # Add required imports and setup - fix Windows path handling
            project_root_posix = str(self.project_root).replace('\\', '/')
            full_test_code = f"""
const path = require('path');
const fs = require('fs');

// Mock missing dependencies for testing
global.console = console;

// Set working directory with fallback
try {{
    process.chdir('{project_root_posix}');
}} catch (error) {{
    console.warn('Failed to change directory:', error.message);
}}

async function runTest() {{
    try {{
        {test_code}
        return {{ success: true }};
    }} catch (error) {{
        return {{
            success: false,
            error: error.message,
            stack: error.stack
        }};
    }}
}}

runTest().then(result => {{
    console.log(JSON.stringify(result));
    process.exit(result.success ? 0 : 1);
}}).catch(error => {{
    console.log(JSON.stringify({{
        success: false,
        error: error.message,
        stack: error.stack
    }}));
    process.exit(1);
}});
"""

            # Write test file
            with open(test_file, 'w') as f:
                f.write(full_test_code)

            # Run test
            result = subprocess.run(
                ['node', str(test_file)],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=self.project_root
            )

            # Clean up
            if test_file.exists():
                test_file.unlink()

            if result.returncode == 0:
                try:
                    output = json.loads(result.stdout.strip())
                    return output
                except json.JSONDecodeError:
                    return {
                        'success': True,
                        'output': result.stdout
                    }
            else:
                try:
                    output = json.loads(result.stdout.strip())
                    return output
                except json.JSONDecodeError:
                    return {
                        'success': False,
                        'error': result.stderr or result.stdout,
                        'returncode': result.returncode
                    }

        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': f'Test timed out after {timeout} seconds'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def test_intelligent_context_pruner(self):
        """Test IntelligentContextPruner functionality"""
        test_code = """
        const { IntelligentContextPruner } = require('./src/context/IntelligentContextPruner');

        // Test 1: Basic instantiation
        const pruner = new IntelligentContextPruner(1024 * 1024); // 1MB
        console.log('Pruner instantiated successfully');

        // Test 2: Add context with validation
        await pruner.addContext('test1', { data: 'test data' }, 'development', 0.8);
        console.log('Context added successfully');

        // Test 3: Get context
        const retrieved = pruner.getContext('test1');
        if (!retrieved || retrieved.data !== 'test data') {
            throw new Error('Context retrieval failed');
        }
        console.log('Context retrieved successfully');

        // Test 4: Get metrics
        const metrics = pruner.getMetrics();
        if (!metrics || typeof metrics.totalEntries !== 'number') {
            throw new Error('Metrics generation failed');
        }
        console.log('Metrics generated successfully');

        // Test 5: Semantic drift detection
        const drift = await pruner.detectSemanticDrift();
        if (!drift || typeof drift.driftScore !== 'number') {
            throw new Error('Drift detection failed');
        }
        console.log('Drift detection working');
        """

        result = self.run_node_test(test_code)

        if result['success']:
            self.log_test('IntelligentContextPruner Basic Functionality', 'PASSED')
        else:
            self.log_test('IntelligentContextPruner Basic Functionality', 'FAILED', {
                'error': result.get('error', 'Unknown error'),
                'details': 'Failed to instantiate or use IntelligentContextPruner'
            })

    def test_semantic_drift_detector(self):
        """Test SemanticDriftDetector functionality"""
        test_code = """
        const { SemanticDriftDetector } = require('./src/context/SemanticDriftDetector');

        // Test 1: Basic instantiation
        const detector = new SemanticDriftDetector();
        console.log('Drift detector instantiated successfully');

        // Test 2: Capture snapshots
        const snapshot1 = await detector.captureSnapshot({ content: 'test 1' }, 'development');
        const snapshot2 = await detector.captureSnapshot({ content: 'test 2' }, 'development');
        console.log('Snapshots captured successfully');

        // Test 3: Detect drift
        const driftAnalysis = await detector.detectDrift();
        if (!driftAnalysis || !driftAnalysis.metrics || !driftAnalysis.patterns) {
            throw new Error('Drift analysis failed');
        }
        console.log('Drift analysis completed');

        // Test 4: Adaptive thresholds
        const threshold = detector.getThreshold('velocity');
        if (!threshold || typeof threshold.current !== 'number') {
            throw new Error('Threshold retrieval failed');
        }
        console.log('Threshold system working');

        // Test 5: Status check
        const status = detector.getStatus();
        if (!status || typeof status.snapshots !== 'number') {
            throw new Error('Status check failed');
        }
        console.log('Status check working');
        """

        result = self.run_node_test(test_code)

        if result['success']:
            self.log_test('SemanticDriftDetector Basic Functionality', 'PASSED')
        else:
            self.log_test('SemanticDriftDetector Basic Functionality', 'FAILED', {
                'error': result.get('error', 'Unknown error'),
                'details': 'Failed to instantiate or use SemanticDriftDetector'
            })

    def test_adaptive_threshold_manager(self):
        """Test AdaptiveThresholdManager functionality"""
        test_code = """
        const { AdaptiveThresholdManager } = require('./src/context/AdaptiveThresholdManager');

        // Test 1: Basic instantiation
        const manager = new AdaptiveThresholdManager();
        console.log('Threshold manager instantiated successfully');

        // Test 2: Get threshold
        const threshold = manager.getThreshold('context_degradation');
        if (typeof threshold !== 'number') {
            throw new Error('Threshold retrieval failed');
        }
        console.log('Threshold retrieval working');

        // Test MAXIMUM_RETRY_ATTEMPTS: Set threshold
        const setResult = manager.setThreshold('context_degradation', 0.2, 'Test override');
        if (!setResult) {
            throw new Error('Threshold setting failed');
        }
        console.log('Threshold setting working');

        // Test 4: Update system conditions
        manager.updateSystemConditions({
            load: 0.5,
            errorRate: 0.2,
            responseTime: 1500,
            throughput: 120,
            memoryUsage: 0.65,
            degradationRate: 0.8
        });
        console.log('System conditions update working');

        // Test MAXIMUM_NESTED_DEPTH: Get statistics
        const stats = manager.getThresholdStatistics();
        if (!stats || typeof stats !== 'object') {
            throw new Error('Statistics generation failed');
        }
        console.log('Statistics generation working');
        """

        result = self.run_node_test(test_code)

        if result['success']:
            self.log_test('AdaptiveThresholdManager Basic Functionality', 'PASSED')
        else:
            self.log_test('AdaptiveThresholdManager Basic Functionality', 'FAILED', {
                'error': result.get('error', 'Unknown error'),
                'details': 'Failed to instantiate or use AdaptiveThresholdManager'
            })

    def test_swarm_queen_distributed_context(self):
        """Test SwarmQueen distributed context features"""
        test_code = """
        // Mock dependencies for SwarmQueen testing
        const mockPrincess = {
            initialize: async () => {},
            setModel: async () => {},
            addMCPServer: async () => {},
            setMaxContextSize: () => {},
            setPruner: async () => {},
            executeTask: async () => ({ result: 'mock' }),
            getHealth: async () => ({ status: 'healthy' }),
            getContextIntegrity: async () => 0.95,
            getContextUsage: async () => 0.7,
            isHealthy: () => true,
            getSharedContext: async () => ({}),
            restoreContext: async () => {}
        };

        // Mock all required classes
        global.HivePrincess = class {
            constructor() { return mockPrincess; }
        };
        global.CoordinationPrincess = class {
            constructor() { return mockPrincess; }
        };
        global.PrincessConsensus = class {
            constructor() {}
            async propose() { return { id: 'test' }; }
            getMetrics() { return { successRate: 0.95, byzantineNodes: [] }; }
            on() {}
        };
        global.ContextRouter = class {
            constructor() {}
            async routeContext() { return { targetPrincesses: ['development'] }; }
            on() {}
            shutdown() {}
        };
        global.CrossHiveProtocol = class {
            constructor() {}
            async sendMessage() {}
            getMetrics() { return { messagesSent: 100 }; }
            on() {}
            shutdown() {}
        };
        global.ContextDNA = class {
            generateFingerprint() { return 'mock-fingerprint'; }
        };
        global.ContextValidator = class {
            async validateContext() { return { valid: true, errors: [] }; }
        };
        global.DegradationMonitor = class {
            async calculateDegradation() { return 0.5; }
            getMetrics() { return { averageDegradation: 0.8 }; }
            async initiateRecovery() {}
            on() {}
        };
        global.GitHubProjectIntegration = class {
            async connect() {}
            async getProcessTruth() { return {}; }
        };

        const { SwarmQueen } = require('./src/swarm/hierarchy/SwarmQueen');

        // Test 1: Basic instantiation
        const queen = new SwarmQueen();
        console.log('SwarmQueen instantiated successfully');

        // Test 2: Initialize (should work with mocked dependencies)
        await queen.initialize();
        console.log('SwarmQueen initialized successfully');

        // Test 3: Get distributed context status
        const contextStatus = queen.getDistributedContextStatus();
        if (!contextStatus || !contextStatus.queen || !contextStatus.optimization) {
            throw new Error('Distributed context status failed');
        }
        console.log('Distributed context status working');

        // Test 4: Get metrics with distributed context
        const metrics = queen.getMetrics();
        if (!metrics || !metrics.distributedContext) {
            throw new Error('Distributed context metrics failed');
        }
        console.log('Distributed context metrics working');

        // Test 5: Execute task with distributed context
        const task = await queen.executeTask(
            'Test distributed context task',
            { test: 'data' },
            { priority: 'medium' }
        );
        if (!task || task.status !== 'completed') {
            throw new Error('Task execution with distributed context failed');
        }
        console.log('Task execution with distributed context working');
        """

        result = self.run_node_test(test_code, timeout=45)

        if result['success']:
            self.log_test('SwarmQueen Distributed Context Features', 'PASSED')
        else:
            self.log_test('SwarmQueen Distributed Context Features', 'FAILED', {
                'error': result.get('error', 'Unknown error'),
                'details': 'Failed to test SwarmQueen distributed context features'
            })

    def test_integration_all_components(self):
        """Test integration of all Phase MAXIMUM_RETRY_ATTEMPTS components together"""
        test_code = """
        const { IntelligentContextPruner } = require('./src/context/IntelligentContextPruner');
        const { SemanticDriftDetector } = require('./src/context/SemanticDriftDetector');
        const { AdaptiveThresholdManager } = require('./src/context/AdaptiveThresholdManager');

        // Test integration workflow
        console.log('Starting integration test...');

        // 1. Create components
        const pruner = new IntelligentContextPruner(2048);
        const detector = new SemanticDriftDetector();
        const thresholds = new AdaptiveThresholdManager();
        console.log('All components created');

        // 2. Add contexts to pruner
        await pruner.addContext('ctx1', { type: 'user', action: 'login' }, 'security', 0.9);
        await pruner.addContext('ctx2', { type: 'system', action: 'backup' }, 'infrastructure', 0.7);
        console.log('Contexts added to pruner');

        // 3. Capture snapshots in detector
        await detector.captureSnapshot({ type: 'user', action: 'login' }, 'security');
        await detector.captureSnapshot({ type: 'system', action: 'backup' }, 'infrastructure');
        console.log('Snapshots captured in detector');

        // 4. Get drift metrics
        const driftAnalysis = await detector.detectDrift();
        console.log('Drift analysis completed');

        // 5. Update thresholds based on system state
        thresholds.updateSystemConditions({
            load: 0.6,
            errorRate: 0.3,
            responseTime: 1800,
            throughput: 95,
            memoryUsage: 0.72,
            degradationRate: driftAnalysis.metrics.velocity || 0.1
        });
        console.log('Thresholds updated');

        // 6. Verify all components are working together
        const prunerMetrics = pruner.getMetrics();
        const detectorStatus = detector.getStatus();
        const thresholdStats = thresholds.getThresholdStatistics();

        if (!prunerMetrics.totalEntries || !detectorStatus.snapshots || !thresholdStats) {
            throw new Error('Integration verification failed');
        }

        console.log('Integration test completed successfully');
        console.log(`Pruner entries: ${prunerMetrics.totalEntries}`);
        console.log(`Detector snapshots: ${detectorStatus.snapshots}`);
        console.log(`Threshold adaptations: ${Object.keys(thresholdStats).length}`);
        """

        result = self.run_node_test(test_code, timeout=60)

        if result['success']:
            self.log_test('Phase 3 Component Integration', 'PASSED')
        else:
            self.log_test('Phase MAXIMUM_RETRY_ATTEMPTS Component Integration', 'FAILED', {
                'error': result.get('error', 'Unknown error'),
                'details': 'Failed to integrate all Phase MAXIMUM_RETRY_ATTEMPTS components'
            })

    def test_error_handling_and_validation(self):
        """Test error handling and input validation"""
        test_code = """
        const { IntelligentContextPruner } = require('./src/context/IntelligentContextPruner');
        const { SemanticDriftDetector } = require('./src/context/SemanticDriftDetector');
        const { AdaptiveThresholdManager } = require('./src/context/AdaptiveThresholdManager');

        console.log('Testing error handling...');

        // Test IntelligentContextPruner error handling
        const pruner = new IntelligentContextPruner(1024);

        try {
            await pruner.addContext('', { data: 'test' }, 'domain', 0.5);
            throw new Error('Should have failed with empty ID');
        } catch (error) {
            if (!error.message.includes('Invalid context ID')) {
                throw new Error('Wrong error for empty ID');
            }
        }
        console.log('Pruner ID validation working');

        try {
            await pruner.addContext('test', { data: 'test' }, '', 0.5);
            throw new Error('Should have failed with empty domain');
        } catch (error) {
            if (!error.message.includes('Invalid domain')) {
                throw new Error('Wrong error for empty domain');
            }
        }
        console.log('Pruner domain validation working');

        // Test SemanticDriftDetector error handling
        const detector = new SemanticDriftDetector();

        try {
            await detector.captureSnapshot({ data: 'test' }, '');
            throw new Error('Should have failed with empty domain');
        } catch (error) {
            if (!error.message.includes('Invalid domain')) {
                throw new Error('Wrong error for empty domain');
            }
        }
        console.log('Detector domain validation working');

        // Test AdaptiveThresholdManager error handling
        const manager = new AdaptiveThresholdManager();

        const nullResult = manager.getThreshold('');
        if (nullResult !== null) {
            throw new Error('Should return null for empty threshold name');
        }
        console.log('Threshold manager validation working');

        const invalidSet = manager.setThreshold('context_degradation', NaN);
        if (invalidSet !== false) {
            throw new Error('Should return false for invalid threshold value');
        }
        console.log('Threshold setting validation working');

        console.log('All error handling tests passed');
        """

        result = self.run_node_test(test_code)

        if result['success']:
            self.log_test('Error Handling and Validation', 'PASSED')
        else:
            self.log_test('Error Handling and Validation', 'FAILED', {
                'error': result.get('error', 'Unknown error'),
                'details': 'Error handling or validation not working correctly'
            })

    def run_all_tests(self):
        """Run all Phase 3 distributed context tests"""
        print("=" * 60)

        # Check Node.js availability
        try:
            subprocess.run(['node', '--version'], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False

        # Run all tests
        test_methods = [
            self.test_intelligent_context_pruner,
            self.test_semantic_drift_detector,
            self.test_adaptive_threshold_manager,
            self.test_swarm_queen_distributed_context,
            self.test_integration_all_components,
            self.test_error_handling_and_validation
        ]

        for test_method in test_methods:
            try:
                test_method()
            except Exception as e:
                self.log_test(f'{test_method.__name__}', 'FAILED', {
                    'error': str(e),
                    'details': 'Test method execution failed'
                })

        # Calculate final success rate
        total = self.test_results['summary']['total']
        passed = self.test_results['summary']['passed']
        self.test_results['summary']['success_rate'] = (passed / total * 100) if total > 0 else 0

        # Print summary
        print("\n" + "=" * 60)
        print(f"Passed: {passed}")

        # Save results
        results_file = self.project_root / '.claude' / '.artifacts' / 'phase3-integration-test-results.json'
        results_file.parent.mkdir(parents=True, exist_ok=True)

        with open(results_file, 'w') as f:
            json.dump(self.test_results, f, indent=2)

        print(f"\nDetailed results saved to: {results_file}")

        # Determine overall success
        success_threshold = 85.0
        if self.test_results['summary']['success_rate'] >= success_threshold:
            return True
        else:
            return False

if __name__ == '__main__':
    tester = Phase3DistributedContextTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)