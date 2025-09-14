#!/usr/bin/env node
/**
 * Six Sigma Configuration Validator
 * Validates Six Sigma configuration files and ensures workflow compatibility
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    bold: '\x1b[1m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
    bold: (msg) => console.log(`${colors.bold}${msg}${colors.reset}`)
};

class SixSigmaConfigValidator {
    constructor(configPath = '.six-sigma-config') {
        this.configPath = configPath;
        this.errors = [];
        this.warnings = [];
        this.validationResults = {
            config: false,
            environments: false,
            components: false,
            workflow: false,
            overall: false
        };
    }

    /**
     * Main validation entry point
     */
    async validate() {
        log.bold('[TARGET] Six Sigma Configuration Validation');
        console.log('=====================================\n');

        try {
            await this.validateBaseConfiguration();
            await this.validateEnvironmentConfigurations();
            await this.validateSixSigmaComponents();
            await this.validateWorkflowIntegration();

            this.generateValidationReport();

            if (this.errors.length === 0) {
                this.validationResults.overall = true;
                log.success('[OK] All validations passed');
                process.exit(0);
            } else {
                log.error(`[FAIL] Validation failed with ${this.errors.length} errors`);
                process.exit(1);
            }
        } catch (error) {
            log.error(`Validation failed: ${error.message}`);
            process.exit(1);
        }
    }

    /**
     * Validate base Six Sigma configuration
     */
    async validateBaseConfiguration() {
        log.info('Validating base configuration');

        const configFile = path.join(this.configPath, 'config.json');

        if (!fs.existsSync(configFile)) {
            this.errors.push('Base configuration file not found: config.json');
            return;
        }

        try {
            const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));

            // Validate required fields
            const requiredFields = [
                'targetSigma', 'dpmoThreshold', 'rtyThreshold',
                'performanceThreshold', 'ctqSpecifications'
            ];

            for (const field of requiredFields) {
                if (!(field in config)) {
                    this.errors.push(`Missing required field: ${field}`);
                }
            }

            // Validate ranges
            if (config.targetSigma < 1.0 || config.targetSigma > 6.0) {
                this.errors.push('targetSigma must be between 1.0 and 6.0');
            }

            if (config.dpmoThreshold < 0 || config.dpmoThreshold > 1000000) {
                this.errors.push('dpmoThreshold must be between 0 and 1,000,000');
            }

            if (config.rtyThreshold < 0 || config.rtyThreshold > 100) {
                this.errors.push('rtyThreshold must be between 0 and 100');
            }

            if (config.performanceThreshold < 0 || config.performanceThreshold > 100) {
                this.errors.push('performanceThreshold must be between 0 and 100');
            }

            // Validate CTQ specifications
            if (config.ctqSpecifications) {
                const totalWeight = Object.values(config.ctqSpecifications)
                    .reduce((sum, ctq) => sum + (ctq.weight || 0), 0);

                if (Math.abs(totalWeight - 1.0) > 0.01) {
                    this.warnings.push(`CTQ weights sum to ${totalWeight.toFixed(2)}, should sum to 1.0`);
                }

                for (const [ctqName, ctqSpec] of Object.entries(config.ctqSpecifications)) {
                    this.validateCTQSpecification(ctqName, ctqSpec);
                }
            }

            // Validate sigma level consistency
            const expectedDPMO = this.sigmaLevelToDPMO(config.targetSigma);
            if (Math.abs(config.dpmoThreshold - expectedDPMO) > expectedDPMO * 0.1) {
                this.warnings.push(
                    `DPMO threshold ${config.dpmoThreshold} doesn't match target sigma ${config.targetSigma} ` +
                    `(expected ~${expectedDPMO})`
                );
            }

            this.validationResults.config = this.errors.length === 0;

            if (this.validationResults.config) {
                log.success('Base configuration valid');
            }

        } catch (error) {
            this.errors.push(`Invalid JSON in config.json: ${error.message}`);
        }
    }

    /**
     * Validate environment-specific configurations
     */
    async validateEnvironmentConfigurations() {
        log.info('Validating environment configurations');

        const environments = ['development', 'staging', 'production'];
        let validEnvironments = 0;

        for (const env of environments) {
            const envFile = path.join(this.configPath, `${env}.json`);

            if (fs.existsSync(envFile)) {
                try {
                    const envConfig = JSON.parse(fs.readFileSync(envFile, 'utf8'));

                    // Validate environment-specific settings
                    if (envConfig.extends && envConfig.extends !== './config.json') {
                        this.warnings.push(`${env}.json extends ${envConfig.extends}, ensure base config exists`);
                    }

                    // Validate progressive strictness (dev < staging < prod)
                    if (env === 'production') {
                        if (envConfig.targetSigma < 4.5) {
                            this.warnings.push('Production target sigma should be  4.5');
                        }
                        if (envConfig.dpmoThreshold > 1500) {
                            this.warnings.push('Production DPMO threshold should be  1500');
                        }
                    }

                    validEnvironments++;
                    log.success(`Environment ${env} configuration valid`);

                } catch (error) {
                    this.errors.push(`Invalid JSON in ${env}.json: ${error.message}`);
                }
            } else {
                this.warnings.push(`Environment configuration missing: ${env}.json`);
            }
        }

        this.validationResults.environments = validEnvironments >= 2; // At least dev and prod
    }

    /**
     * Validate Six Sigma component files
     */
    async validateSixSigmaComponents() {
        log.info('Validating Six Sigma components');

        const components = [
            'analyzer/enterprise/sixsigma/dpmo-calculator.js',
            'analyzer/enterprise/sixsigma/spc-chart-generator.js',
            'analyzer/enterprise/sixsigma/performance-monitor.js',
            'src/domains/quality-gates/metrics/SixSigmaMetrics.ts'
        ];

        let validComponents = 0;

        for (const component of components) {
            if (fs.existsSync(component)) {
                // Basic syntax validation
                try {
                    const content = fs.readFileSync(component, 'utf8');

                    // Check for key classes/exports
                    if (component.includes('dpmo-calculator.js')) {
                        if (!content.includes('class DPMOCalculator') && !content.includes('DPMOCalculator')) {
                            this.errors.push('DPMOCalculator class not found in dpmo-calculator.js');
                        }
                    } else if (component.includes('spc-chart-generator.js')) {
                        if (!content.includes('class SPCChartGenerator') && !content.includes('SPCChartGenerator')) {
                            this.errors.push('SPCChartGenerator class not found in spc-chart-generator.js');
                        }
                    } else if (component.includes('performance-monitor.js')) {
                        if (!content.includes('class PerformanceMonitor') && !content.includes('PerformanceMonitor')) {
                            this.errors.push('PerformanceMonitor class not found in performance-monitor.js');
                        }
                    } else if (component.includes('SixSigmaMetrics.ts')) {
                        if (!content.includes('class SixSigmaMetrics') && !content.includes('export class SixSigmaMetrics')) {
                            this.errors.push('SixSigmaMetrics class not found in SixSigmaMetrics.ts');
                        }
                    }

                    validComponents++;
                    log.success(`Component found: ${component}`);

                } catch (error) {
                    this.errors.push(`Error reading component ${component}: ${error.message}`);
                }
            } else {
                this.errors.push(`Missing Six Sigma component: ${component}`);
            }
        }

        this.validationResults.components = validComponents === components.length;
    }

    /**
     * Validate workflow integration
     */
    async validateWorkflowIntegration() {
        log.info('Validating workflow integration');

        const workflowFile = '.github/workflows/six-sigma-metrics.yml';

        if (!fs.existsSync(workflowFile)) {
            this.errors.push('Six Sigma workflow not found: .github/workflows/six-sigma-metrics.yml');
            return;
        }

        try {
            const workflowContent = fs.readFileSync(workflowFile, 'utf8');

            // Validate key workflow elements
            const requiredElements = [
                'setup-six-sigma-environment',
                'calculate-dpmo-metrics',
                'generate-spc-charts',
                'aggregate-six-sigma-results'
            ];

            for (const element of requiredElements) {
                if (!workflowContent.includes(element)) {
                    this.errors.push(`Missing workflow job: ${element}`);
                }
            }

            // Validate environment variables
            const requiredEnvVars = [
                'DPMO_TARGET', 'RTY_TARGET', 'EXECUTION_TIME_LIMIT', 'PERFORMANCE_OVERHEAD_LIMIT'
            ];

            for (const envVar of requiredEnvVars) {
                if (!workflowContent.includes(envVar)) {
                    this.warnings.push(`Missing environment variable: ${envVar}`);
                }
            }

            // Validate matrix strategy
            if (!workflowContent.includes('matrix:') || !workflowContent.includes('analysis-type:')) {
                this.warnings.push('Matrix strategy for parallel DPMO calculation not found');
            }

            // Validate performance constraints
            if (!workflowContent.includes('timeout-minutes')) {
                this.warnings.push('Job timeout constraints not found');
            }

            this.validationResults.workflow = true;
            log.success('Workflow integration validated');

        } catch (error) {
            this.errors.push(`Error reading workflow file: ${error.message}`);
        }
    }

    /**
     * Validate individual CTQ specification
     */
    validateCTQSpecification(name, spec) {
        if (!spec.weight || spec.weight < 0 || spec.weight > 1) {
            this.errors.push(`CTQ ${name}: weight must be between 0 and 1`);
        }

        if (typeof spec.target !== 'number') {
            this.errors.push(`CTQ ${name}: target must be a number`);
        }

        if (spec.upperLimit !== undefined && spec.lowerLimit !== undefined) {
            if (spec.upperLimit <= spec.lowerLimit) {
                this.errors.push(`CTQ ${name}: upperLimit must be greater than lowerLimit`);
            }

            if (spec.target < spec.lowerLimit || spec.target > spec.upperLimit) {
                this.warnings.push(`CTQ ${name}: target ${spec.target} is outside limits [${spec.lowerLimit}, ${spec.upperLimit}]`);
            }
        }

        const validCategories = ['quality', 'security', 'performance', 'compliance'];
        if (spec.category && !validCategories.includes(spec.category)) {
            this.warnings.push(`CTQ ${name}: invalid category '${spec.category}', should be one of: ${validCategories.join(', ')}`);
        }
    }

    /**
     * Convert sigma level to approximate DPMO
     */
    sigmaLevelToDPMO(sigma) {
        const sigmaLevels = [
            { sigma: 6.0, dpmo: 3.4 },
            { sigma: 5.5, dpmo: 32 },
            { sigma: 5.0, dpmo: 233 },
            { sigma: 4.5, dpmo: 1350 },
            { sigma: 4.0, dpmo: 6210 },
            { sigma: 3.5, dpmo: 22750 },
            { sigma: 3.0, dpmo: 66807 },
            { sigma: 2.5, dpmo: 158655 },
            { sigma: 2.0, dpmo: 308538 }
        ];

        // Find closest sigma level
        let closest = sigmaLevels[sigmaLevels.length - 1];
        for (const level of sigmaLevels) {
            if (sigma >= level.sigma) {
                closest = level;
                break;
            }
        }

        return closest.dpmo;
    }

    /**
     * Generate comprehensive validation report
     */
    generateValidationReport() {
        log.bold('\n[CLIPBOARD] Validation Report');
        console.log('==================\n');

        // Summary
        console.log('[CHART] Summary:');
        console.log(`   [OK] Passed: ${Object.values(this.validationResults).filter(Boolean).length}/5`);
        console.log(`   [FAIL] Errors: ${this.errors.length}`);
        console.log(`   [WARN]  Warnings: ${this.warnings.length}\n`);

        // Detailed results
        console.log('[CLIPBOARD] Detailed Results:');
        console.log(`   Base Configuration: ${this.validationResults.config ? '[OK]' : '[FAIL]'}`);
        console.log(`   Environment Configs: ${this.validationResults.environments ? '[OK]' : '[FAIL]'}`);
        console.log(`   Six Sigma Components: ${this.validationResults.components ? '[OK]' : '[FAIL]'}`);
        console.log(`   Workflow Integration: ${this.validationResults.workflow ? '[OK]' : '[FAIL]'}\n`);

        // Errors
        if (this.errors.length > 0) {
            console.log('[FAIL] Errors:');
            this.errors.forEach((error, i) => {
                console.log(`   ${i + 1}. ${error}`);
            });
            console.log();
        }

        // Warnings
        if (this.warnings.length > 0) {
            console.log('[WARN]  Warnings:');
            this.warnings.forEach((warning, i) => {
                console.log(`   ${i + 1}. ${warning}`);
            });
            console.log();
        }

        // Recommendations
        this.generateRecommendations();
    }

    /**
     * Generate improvement recommendations
     */
    generateRecommendations() {
        const recommendations = [];

        if (!this.validationResults.config) {
            recommendations.push('Fix base configuration errors before proceeding');
        }

        if (!this.validationResults.environments) {
            recommendations.push('Create environment-specific configurations for dev, staging, and production');
        }

        if (!this.validationResults.components) {
            recommendations.push('Install missing Six Sigma components using the setup script');
        }

        if (!this.validationResults.workflow) {
            recommendations.push('Update or create the Six Sigma GitHub Actions workflow');
        }

        if (this.warnings.length > 0) {
            recommendations.push('Address warnings to optimize Six Sigma performance');
        }

        if (recommendations.length > 0) {
            console.log('[BULB] Recommendations:');
            recommendations.forEach((rec, i) => {
                console.log(`   ${i + 1}. ${rec}`);
            });
            console.log();
        }

        // Next steps
        console.log('[ROCKET] Next Steps:');
        if (this.validationResults.overall) {
            console.log('   1. Run Six Sigma workflow to test integration');
            console.log('   2. Monitor initial metrics and adjust thresholds');
            console.log('   3. Establish quality baselines');
            console.log('   4. Train team on Six Sigma processes');
        } else {
            console.log('   1. Fix validation errors');
            console.log('   2. Re-run validation');
            console.log('   3. Test Six Sigma workflow');
            console.log('   4. Establish quality baselines');
        }
        console.log();
    }

    /**
     * Create sample configuration (utility method)
     */
    static createSampleConfig(outputPath = '.six-sigma-config') {
        log.info('Creating sample Six Sigma configuration');

        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
        }

        const sampleConfig = {
            version: "1.0.0",
            targetSigma: 4.5,
            dpmoThreshold: 1500,
            rtyThreshold: 99.8,
            performanceThreshold: 1.2,
            executionTimeLimit: 120000,
            enableSPCCharts: true,
            enablePerformanceMonitoring: true,
            enableRealTimeDashboard: true,
            ctqSpecifications: {
                codeQuality: {
                    weight: 0.25,
                    target: 90,
                    upperLimit: 100,
                    lowerLimit: 80,
                    category: "quality"
                },
                testCoverage: {
                    weight: 0.20,
                    target: 90,
                    upperLimit: 100,
                    lowerLimit: 85,
                    category: "quality"
                },
                securityScore: {
                    weight: 0.20,
                    target: 95,
                    upperLimit: 100,
                    lowerLimit: 90,
                    category: "security"
                },
                performanceScore: {
                    weight: 0.20,
                    target: 200,
                    upperLimit: 500,
                    lowerLimit: 100,
                    category: "performance"
                },
                complianceScore: {
                    weight: 0.15,
                    target: 95,
                    upperLimit: 100,
                    lowerLimit: 90,
                    category: "compliance"
                }
            }
        };

        fs.writeFileSync(
            path.join(outputPath, 'config.json'),
            JSON.stringify(sampleConfig, null, 2)
        );

        log.success(`Sample configuration created at ${outputPath}/config.json`);
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Six Sigma Configuration Validator

Usage: node validate-six-sigma-config.js [options]

Options:
  --config-path PATH    Path to Six Sigma configuration directory (default: .six-sigma-config)
  --create-sample       Create sample configuration files
  --help, -h           Show this help message

Examples:
  node validate-six-sigma-config.js
  node validate-six-sigma-config.js --config-path ./config
  node validate-six-sigma-config.js --create-sample
`);
        process.exit(0);
    }

    if (args.includes('--create-sample')) {
        SixSigmaConfigValidator.createSampleConfig();
        process.exit(0);
    }

    const configPathIndex = args.indexOf('--config-path');
    const configPath = configPathIndex !== -1 && args[configPathIndex + 1]
        ? args[configPathIndex + 1]
        : '.six-sigma-config';

    const validator = new SixSigmaConfigValidator(configPath);
    validator.validate().catch(error => {
        log.error(`Validation failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = SixSigmaConfigValidator;