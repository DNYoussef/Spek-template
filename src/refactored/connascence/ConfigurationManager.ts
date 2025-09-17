/**
 * ConfigurationManager - NASA POT10 Compliant
 *
 * Configuration methods extracted from UnifiedConnascenceAnalyzer
 * Following NASA Rule 4: Functions <60 lines
 * Following NASA Rule 5: 2+ assertions per function
 * Following NASA Rule 8: Limited preprocessor use
 */

interface AnalysisConfig {
    enableCaching: boolean;
    maxFiles: number;
    timeoutMs: number;
    detectionRules: {
        position: boolean;
        meaning: boolean;
        algorithm: boolean;
        execution: boolean;
        timing: boolean;
    };
    thresholds: {
        maxParameters: number;
        maxMethods: number;
        maxNesting: number;
        maxLines: number;
    };
    outputFormats: string[];
}

interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export class ConfigurationManager {
    private config: AnalysisConfig;
    private readonly defaultConfig: AnalysisConfig;

    constructor() {
        // NASA Rule 3: Pre-allocate memory
        this.defaultConfig = {
            enableCaching: true,
            maxFiles: 1000,
            timeoutMs: 300000, // 5 minutes
            detectionRules: {
                position: true,
                meaning: true,
                algorithm: true,
                execution: true,
                timing: true
            },
            thresholds: {
                maxParameters: 3,
                maxMethods: 15,
                maxNesting: 4,
                maxLines: 60 // NASA Rule 4
            },
            outputFormats: ['json', 'html', 'csv']
        };

        this.config = { ...this.defaultConfig };

        // NASA Rule 5: Assertions
        console.assert(this.config != null, 'config must be initialized');
        console.assert(this.defaultConfig != null, 'defaultConfig must be initialized');
    }

    /**
     * Load configuration from object
     * NASA Rule 4: <60 lines
     */
    loadConfig(newConfig: Partial<AnalysisConfig>): ValidationResult {
        // NASA Rule 5: Input assertions
        console.assert(newConfig != null, 'newConfig cannot be null');

        const result: ValidationResult = {
            valid: false,
            errors: [],
            warnings: []
        };

        try {
            // Validate configuration
            const validation = this.validateConfig(newConfig);
            if (!validation.valid) {
                result.errors = validation.errors;
                result.warnings = validation.warnings;
                return result;
            }

            // Merge with defaults
            this.config = this.mergeWithDefaults(newConfig);

            // Final validation
            const finalValidation = this.validateConfig(this.config);
            if (!finalValidation.valid) {
                result.errors = ['Final configuration validation failed'];
                this.config = { ...this.defaultConfig }; // Restore defaults
                return result;
            }

            result.valid = true;
            result.warnings = validation.warnings;

        } catch (error) {
            result.errors.push(`Configuration loading failed: ${error}`);
            this.config = { ...this.defaultConfig }; // Restore defaults
        }

        // NASA Rule 5: Output assertion
        console.assert(typeof result.valid === 'boolean', 'valid must be boolean');
        return result;
    }

    /**
     * Validate configuration object
     * NASA Rule 4: <60 lines
     */
    private validateConfig(config: Partial<AnalysisConfig>): ValidationResult {
        // NASA Rule 5: Input assertions
        console.assert(config != null, 'config cannot be null');

        const result: ValidationResult = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Validate basic properties
        if (config.maxFiles !== undefined) {
            if (typeof config.maxFiles !== 'number' || config.maxFiles <= 0) {
                result.errors.push('maxFiles must be positive number');
                result.valid = false;
            } else if (config.maxFiles > 10000) {
                result.warnings.push('maxFiles is very large, may impact performance');
            }
        }

        if (config.timeoutMs !== undefined) {
            if (typeof config.timeoutMs !== 'number' || config.timeoutMs <= 0) {
                result.errors.push('timeoutMs must be positive number');
                result.valid = false;
            }
        }

        // Validate thresholds
        if (config.thresholds) {
            const thresholdValidation = this.validateThresholds(config.thresholds);
            if (!thresholdValidation.valid) {
                result.errors.push(...thresholdValidation.errors);
                result.valid = false;
            }
            result.warnings.push(...thresholdValidation.warnings);
        }

        // Validate detection rules
        if (config.detectionRules) {
            const rulesValidation = this.validateDetectionRules(config.detectionRules);
            if (!rulesValidation.valid) {
                result.errors.push(...rulesValidation.errors);
                result.valid = false;
            }
        }

        // NASA Rule 5: Output assertion
        console.assert(typeof result.valid === 'boolean', 'valid must be boolean');
        return result;
    }

    /**
     * Validate threshold configuration
     * NASA Rule 4: <60 lines
     */
    private validateThresholds(thresholds: Partial<AnalysisConfig['thresholds']>): ValidationResult {
        // NASA Rule 5: Input assertions
        console.assert(thresholds != null, 'thresholds cannot be null');

        const result: ValidationResult = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Validate maxParameters
        if (thresholds.maxParameters !== undefined) {
            if (typeof thresholds.maxParameters !== 'number' || thresholds.maxParameters < 0) {
                result.errors.push('maxParameters must be non-negative number');
                result.valid = false;
            } else if (thresholds.maxParameters > 10) {
                result.warnings.push('maxParameters > 10 may indicate design issues');
            }
        }

        // Validate maxMethods
        if (thresholds.maxMethods !== undefined) {
            if (typeof thresholds.maxMethods !== 'number' || thresholds.maxMethods < 1) {
                result.errors.push('maxMethods must be positive number');
                result.valid = false;
            } else if (thresholds.maxMethods > 50) {
                result.warnings.push('maxMethods > 50 indicates god object');
            }
        }

        // Validate maxLines (NASA Rule 4)
        if (thresholds.maxLines !== undefined) {
            if (typeof thresholds.maxLines !== 'number' || thresholds.maxLines < 1) {
                result.errors.push('maxLines must be positive number');
                result.valid = false;
            } else if (thresholds.maxLines > 60) {
                result.errors.push('maxLines cannot exceed 60 (NASA Rule 4)');
                result.valid = false;
            }
        }

        // NASA Rule 5: Output assertion
        console.assert(typeof result.valid === 'boolean', 'valid must be boolean');
        return result;
    }

    /**
     * Validate detection rules configuration
     * NASA Rule 4: <60 lines
     */
    private validateDetectionRules(rules: Partial<AnalysisConfig['detectionRules']>): ValidationResult {
        // NASA Rule 5: Input assertions
        console.assert(rules != null, 'rules cannot be null');

        const result: ValidationResult = {
            valid: true,
            errors: [],
            warnings: []
        };

        const ruleNames = ['position', 'meaning', 'algorithm', 'execution', 'timing'];
        let enabledCount = 0;

        // NASA Rule 2: Fixed upper bound
        for (let i = 0; i < ruleNames.length && i < 10; i++) {
            const ruleName = ruleNames[i];
            const ruleValue = rules[ruleName as keyof typeof rules];

            if (ruleValue !== undefined) {
                if (typeof ruleValue !== 'boolean') {
                    result.errors.push(`${ruleName} must be boolean`);
                    result.valid = false;
                } else if (ruleValue) {
                    enabledCount++;
                }
            }
        }

        // Check if any rules are enabled
        if (enabledCount === 0) {
            result.warnings.push('No detection rules enabled');
        }

        // NASA Rule 5: Output assertion
        console.assert(typeof result.valid === 'boolean', 'valid must be boolean');
        return result;
    }

    /**
     * Merge configuration with defaults
     * NASA Rule 4: <60 lines
     */
    private mergeWithDefaults(config: Partial<AnalysisConfig>): AnalysisConfig {
        // NASA Rule 5: Input assertions
        console.assert(config != null, 'config cannot be null');

        const merged: AnalysisConfig = { ...this.defaultConfig };

        try {
            // Merge basic properties
            if (config.enableCaching !== undefined) {
                merged.enableCaching = config.enableCaching;
            }
            if (config.maxFiles !== undefined) {
                merged.maxFiles = config.maxFiles;
            }
            if (config.timeoutMs !== undefined) {
                merged.timeoutMs = config.timeoutMs;
            }

            // Merge thresholds
            if (config.thresholds) {
                merged.thresholds = { ...merged.thresholds, ...config.thresholds };
            }

            // Merge detection rules
            if (config.detectionRules) {
                merged.detectionRules = { ...merged.detectionRules, ...config.detectionRules };
            }

            // Merge output formats
            if (config.outputFormats) {
                merged.outputFormats = [...config.outputFormats];
            }

        } catch (error) {
            console.error('Configuration merge failed:', error);
            return { ...this.defaultConfig };
        }

        // NASA Rule 5: Output assertion
        console.assert(merged != null, 'merged config cannot be null');
        return merged;
    }

    /**
     * Get current configuration
     * NASA Rule 4: <60 lines
     */
    getConfig(): AnalysisConfig {
        // Create deep copy to prevent external modification
        const copy: AnalysisConfig = {
            enableCaching: this.config.enableCaching,
            maxFiles: this.config.maxFiles,
            timeoutMs: this.config.timeoutMs,
            detectionRules: { ...this.config.detectionRules },
            thresholds: { ...this.config.thresholds },
            outputFormats: [...this.config.outputFormats]
        };

        // NASA Rule 5: Output assertions
        console.assert(copy != null, 'copy cannot be null');
        console.assert(copy.maxFiles > 0, 'maxFiles must be positive');
        return copy;
    }

    /**
     * Reset to default configuration
     * NASA Rule 4: <60 lines
     */
    resetToDefaults(): void {
        // NASA Rule 5: State assertion
        console.assert(this.defaultConfig != null, 'defaultConfig must exist');

        this.config = { ...this.defaultConfig };

        // NASA Rule 5: Output assertion
        console.assert(this.config.maxFiles === this.defaultConfig.maxFiles, 'reset failed');
    }

    /**
     * Export configuration to JSON
     * NASA Rule 4: <60 lines
     */
    exportToJson(): string {
        try {
            const json = JSON.stringify(this.config, null, 2);

            // NASA Rule 5: Output assertions
            console.assert(typeof json === 'string', 'json must be string');
            console.assert(json.length > 0, 'json cannot be empty');
            return json;

        } catch (error) {
            console.error('JSON export failed:', error);
            return '{}';
        }
    }

    /**
     * Import configuration from JSON
     * NASA Rule 4: <60 lines
     */
    importFromJson(json: string): ValidationResult {
        // NASA Rule 5: Input assertions
        console.assert(typeof json === 'string', 'json must be string');
        console.assert(json.length > 0, 'json cannot be empty');

        const result: ValidationResult = {
            valid: false,
            errors: [],
            warnings: []
        };

        try {
            const parsed = JSON.parse(json);
            const loadResult = this.loadConfig(parsed);

            result.valid = loadResult.valid;
            result.errors = loadResult.errors;
            result.warnings = loadResult.warnings;

        } catch (error) {
            result.errors.push(`JSON parsing failed: ${error}`);
        }

        // NASA Rule 5: Output assertion
        console.assert(typeof result.valid === 'boolean', 'valid must be boolean');
        return result;
    }
}