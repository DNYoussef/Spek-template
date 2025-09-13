/**
 * Six Sigma Reporting System Configuration
 * Integration with enterprise_config.yaml and checks.yaml
 * 
 * @module SixSigmaConfig
 * @compliance NASA-POT10-95%
 */

const fs = require('fs').promises;
const yaml = require('js-yaml');
const path = require('path');

class SixSigmaConfig {
    constructor() {
        this.config = null;
        this.defaultConfig = {
            // Core Six Sigma parameters
            targetSigma: 4.0,
            sigmaShift: 1.5,
            
            // Performance constraints
            performanceThreshold: 1.2, // <1.2% overhead
            maxExecutionTime: 5000,     // 5 seconds max
            maxMemoryUsage: 100,        // 100MB max
            
            // Artifacts configuration
            artifactsPath: '.claude/.artifacts/sixsigma/',
            reportFormats: ['executive', 'detailed', 'technical', 'dashboard'],
            
            // CTQ configuration
            ctqWeights: {
                testCoverage: 0.20,
                codeQuality: 0.15,
                securityScore: 0.20,
                performanceScore: 0.15,
                maintainabilityIndex: 0.10,
                deploymentSuccess: 0.10,
                userSatisfaction: 0.10
            },
            
            // Thresholds
            thresholds: {
                critical: 0.95,
                warning: 0.85,
                failure: 0.75
            },
            
            // SPC configuration
            spcConfig: {
                controlLimitSigma: 3,
                trendLength: 7,
                patternDetection: true,
                violationSeverity: {
                    ucl: 'HIGH',
                    lcl: 'HIGH',
                    trend: 'MEDIUM',
                    pattern: 'MEDIUM'
                }
            },
            
            // DPMO configuration
            dpmoConfig: {
                industryBenchmarks: {
                    worldClass: { sigma: 6.0, dpmo: 3.4 },
                    excellent: { sigma: 5.0, dpmo: 233 },
                    good: { sigma: 4.0, dpmo: 6210 },
                    average: { sigma: 3.0, dpmo: 66807 },
                    poor: { sigma: 2.0, dpmo: 308538 }
                }
            },
            
            // Theater detection configuration
            theaterConfig: {
                enableDetection: true,
                patternWeights: {
                    codeTheater: 0.3,
                    metricTheater: 0.3,
                    documentationTheater: 0.2,
                    testTheater: 0.1,
                    performanceTheater: 0.1
                },
                riskThresholds: {
                    low: 0.3,
                    medium: 0.6,
                    high: 0.8
                }
            },
            
            // Compliance configuration
            complianceConfig: {
                nasaPOT10Target: 95,
                auditTrailEnabled: true,
                evidenceRequirements: {
                    ctqCalculations: true,
                    spcCharts: true,
                    dpmoAnalysis: true,
                    theaterDetection: true
                }
            }
        };
    }

    /**
     * Load configuration from enterprise_config.yaml and checks.yaml
     * @returns {Object} Loaded configuration
     */
    async loadConfig() {
        if (this.config) return this.config;

        try {
            // Start with default configuration
            this.config = { ...this.defaultConfig };

            // Load enterprise configuration
            await this.loadEnterpriseConfig();

            // Load checks configuration
            await this.loadChecksConfig();

            // Validate configuration
            this.validateConfig();

            return this.config;

        } catch (error) {
            console.warn('Failed to load configuration, using defaults:', error.message);
            this.config = { ...this.defaultConfig };
            return this.config;
        }
    }

    /**
     * Load enterprise_config.yaml settings
     */
    async loadEnterpriseConfig() {
        try {
            const enterpriseConfigPath = this.findConfigFile('enterprise_config.yaml');
            if (!enterpriseConfigPath) return;

            const configContent = await fs.readFile(enterpriseConfigPath, 'utf8');
            const enterpriseConfig = yaml.load(configContent);

            // Merge enterprise configuration
            if (enterpriseConfig.sixSigma) {
                Object.assign(this.config, enterpriseConfig.sixSigma);
            }

            // Extract specific settings
            if (enterpriseConfig.performance) {
                this.config.performanceThreshold = enterpriseConfig.performance.maxOverhead || this.config.performanceThreshold;
                this.config.maxExecutionTime = enterpriseConfig.performance.maxExecutionTime || this.config.maxExecutionTime;
            }

            if (enterpriseConfig.quality) {
                this.config.targetSigma = enterpriseConfig.quality.targetSigma || this.config.targetSigma;
                this.config.sigmaShift = enterpriseConfig.quality.sigmaShift || this.config.sigmaShift;
            }

            if (enterpriseConfig.compliance) {
                Object.assign(this.config.complianceConfig, enterpriseConfig.compliance);
            }

        } catch (error) {
            console.warn('Enterprise config not found or invalid:', error.message);
        }
    }

    /**
     * Load checks.yaml CTQ definitions
     */
    async loadChecksConfig() {
        try {
            const checksConfigPath = this.findConfigFile('checks.yaml');
            if (!checksConfigPath) return;

            const checksContent = await fs.readFile(checksConfigPath, 'utf8');
            const checksConfig = yaml.load(checksContent);

            // Extract CTQ targets and weights
            if (checksConfig.ctq) {
                Object.assign(this.config.ctqWeights, checksConfig.ctq.weights || {});
            }

            // Extract thresholds
            if (checksConfig.thresholds) {
                Object.assign(this.config.thresholds, checksConfig.thresholds);
            }

            // Extract specific check configurations
            const checkMappings = {
                coverage: 'testCoverage',
                quality: 'codeQuality',
                security: 'securityScore',
                performance: 'performanceScore',
                maintainability: 'maintainabilityIndex',
                deployment: 'deploymentSuccess',
                satisfaction: 'userSatisfaction'
            };

            for (const [checkKey, ctqKey] of Object.entries(checkMappings)) {
                if (checksConfig[checkKey]) {
                    if (checksConfig[checkKey].target) {
                        this.config.ctqTargets = this.config.ctqTargets || {};
                        this.config.ctqTargets[ctqKey] = checksConfig[checkKey].target;
                    }
                    if (checksConfig[checkKey].weight) {
                        this.config.ctqWeights[ctqKey] = checksConfig[checkKey].weight;
                    }
                }
            }

        } catch (error) {
            console.warn('Checks config not found or invalid:', error.message);
        }
    }

    /**
     * Find configuration file in common locations
     * @param {string} filename - Configuration filename
     * @returns {string|null} File path or null if not found
     */
    findConfigFile(filename) {
        const searchPaths = [
            path.join(process.cwd(), filename),
            path.join(process.cwd(), 'config', filename),
            path.join(process.cwd(), '.config', filename),
            path.join(__dirname, '..', '..', '..', filename),
            path.join(__dirname, '..', '..', '..', 'config', filename)
        ];

        for (const searchPath of searchPaths) {
            try {
                const fsSync = require('fs');
                fsSync.accessSync(searchPath);
                return searchPath;
            } catch (error) {
                // Continue searching
            }
        }

        return null;
    }

    /**
     * Validate loaded configuration
     */
    validateConfig() {
        // Validate target sigma
        if (this.config.targetSigma < 1.0 || this.config.targetSigma > 6.0) {
            console.warn('Invalid target sigma, using default 4.0');
            this.config.targetSigma = 4.0;
        }

        // Validate sigma shift
        if (this.config.sigmaShift < 0 || this.config.sigmaShift > 3.0) {
            console.warn('Invalid sigma shift, using default 1.5');
            this.config.sigmaShift = 1.5;
        }

        // Validate performance threshold
        if (this.config.performanceThreshold < 0.1 || this.config.performanceThreshold > 10.0) {
            console.warn('Invalid performance threshold, using default 1.2%');
            this.config.performanceThreshold = 1.2;
        }

        // Validate CTQ weights sum to 1.0
        const totalWeight = Object.values(this.config.ctqWeights).reduce((sum, weight) => sum + weight, 0);
        if (Math.abs(totalWeight - 1.0) > 0.01) {
            console.warn('CTQ weights do not sum to 1.0, normalizing...');
            for (const key of Object.keys(this.config.ctqWeights)) {
                this.config.ctqWeights[key] = this.config.ctqWeights[key] / totalWeight;
            }
        }

        // Validate thresholds are in correct order
        if (this.config.thresholds.critical <= this.config.thresholds.warning ||
            this.config.thresholds.warning <= this.config.thresholds.failure) {
            console.warn('Invalid threshold order, using defaults');
            this.config.thresholds = this.defaultConfig.thresholds;
        }
    }

    /**
     * Get configuration for specific module
     * @param {string} module - Module name (ctq, spc, dpmo, theater, performance)
     * @returns {Object} Module-specific configuration
     */
    getModuleConfig(module) {
        if (!this.config) {
            throw new Error('Configuration not loaded. Call loadConfig() first.');
        }

        const configs = {
            ctq: {
                weights: this.config.ctqWeights,
                targets: this.config.ctqTargets,
                thresholds: this.config.thresholds
            },
            spc: {
                ...this.config.spcConfig,
                controlLimitSigma: this.config.spcConfig.controlLimitSigma
            },
            dpmo: {
                ...this.config.dpmoConfig,
                targetSigma: this.config.targetSigma,
                sigmaShift: this.config.sigmaShift
            },
            theater: {
                ...this.config.theaterConfig
            },
            performance: {
                performanceThreshold: this.config.performanceThreshold,
                maxExecutionTime: this.config.maxExecutionTime,
                maxMemoryUsage: this.config.maxMemoryUsage
            }
        };

        return configs[module] || {};
    }

    /**
     * Update configuration at runtime
     * @param {Object} updates - Configuration updates
     */
    updateConfig(updates) {
        if (!this.config) {
            throw new Error('Configuration not loaded. Call loadConfig() first.');
        }

        Object.assign(this.config, updates);
        this.validateConfig();
    }

    /**
     * Export current configuration
     * @returns {Object} Current configuration
     */
    exportConfig() {
        return this.config ? { ...this.config } : null;
    }

    /**
     * Save configuration to file
     * @param {string} filepath - Output file path
     */
    async saveConfig(filepath) {
        if (!this.config) {
            throw new Error('Configuration not loaded. Call loadConfig() first.');
        }

        const configYaml = yaml.dump(this.config, {
            indent: 2,
            lineWidth: 100,
            noRefs: true
        });

        await fs.writeFile(filepath, configYaml, 'utf8');
    }

    /**
     * Reset to default configuration
     */
    resetToDefaults() {
        this.config = { ...this.defaultConfig };
    }

    /**
     * Get compliance requirements
     * @returns {Object} Compliance configuration
     */
    getComplianceRequirements() {
        return this.config ? this.config.complianceConfig : this.defaultConfig.complianceConfig;
    }

    /**
     * Get artifacts configuration
     * @returns {Object} Artifacts configuration
     */
    getArtifactsConfig() {
        return {
            path: this.config?.artifactsPath || this.defaultConfig.artifactsPath,
            formats: this.config?.reportFormats || this.defaultConfig.reportFormats
        };
    }

    /**
     * Validate NASA POT10 compliance settings
     * @returns {Object} Compliance validation result
     */
    validateNASACompliance() {
        const compliance = this.getComplianceRequirements();
        
        return {
            valid: compliance.nasaPOT10Target >= 90,
            target: compliance.nasaPOT10Target,
            auditTrail: compliance.auditTrailEnabled,
            evidenceComplete: Object.values(compliance.evidenceRequirements).every(req => req === true),
            recommendations: compliance.nasaPOT10Target < 95 ? 
                ['Increase NASA POT10 target to 95% for defense industry readiness'] : []
        };
    }
}

// Singleton instance
const sixSigmaConfig = new SixSigmaConfig();

module.exports = { 
    SixSigmaConfig,
    sixSigmaConfig // Export singleton instance for consistent usage
};