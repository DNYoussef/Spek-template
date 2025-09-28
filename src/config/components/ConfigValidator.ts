/**
 * ConfigValidator - Schema-Based Configuration Validation Component
 * Validates configurations against rules and schemas
 *
 * NASA Rule 10: ≤60 line functions, bounded validation operations
 * FSM-First: Designed for VALIDATING state in ConfigStateMachine
 */

import { ValidationResult, ValidationRule } from '../types/ConfigTypes';

export class ConfigValidator {
    private rules: Map<string, ValidationRule[]>;
    private schemas: Map<string, any>;

    constructor() {
        this.rules = new Map();
        this.schemas = new Map();
    }

    /**
     * Add validation rule - NASA Rule 10: ≤60 lines
     */
    addRule(configType: string, rule: ValidationRule): void {
        if (!configType || !rule) {
            throw new Error('Config type and rule are required');
        }

        if (!this.rules.has(configType)) {
            this.rules.set(configType, []);
        }

        this.rules.get(configType)!.push(rule);
    }

    /**
     * Add validation schema - NASA Rule 10: ≤60 lines
     */
    addSchema(configType: string, schema: any): void {
        if (!configType || !schema) {
            throw new Error('Config type and schema are required');
        }

        this.schemas.set(configType, schema);
    }

    /**
     * Validate all configurations - NASA Rule 10: ≤60 lines
     */
    async validateConfigs(configs: any[]): Promise<ValidationResult> {
        const result: ValidationResult = {
            valid: true,
            errors: [],
            warnings: [],
            score: 100
        };

        let totalScore = 0;
        let validConfigs = 0;

        for (const configData of configs) {
            try {
                const validation = await this.validateSingleConfig(configData);

                if (!validation.valid) {
                    result.valid = false;
                    result.errors.push(...validation.errors);
                }

                result.warnings.push(...validation.warnings);

                if (validation.score !== undefined) {
                    totalScore += validation.score;
                    validConfigs++;
                }
            } catch (error) {
                result.valid = false;
                result.errors.push(`Validation error: ${error}`);
            }
        }

        // Calculate average score
        if (validConfigs > 0) {
            result.score = Math.round(totalScore / validConfigs);
        }

        return result;
    }

    /**
     * Validate single configuration - NASA Rule 10: ≤60 lines
     */
    private async validateSingleConfig(configData: any): Promise<ValidationResult> {
        const result: ValidationResult = {
            valid: true,
            errors: [],
            warnings: [],
            score: 100
        };

        if (!configData || !configData.config) {
            result.valid = false;
            result.errors.push('Invalid config data structure');
            return result;
        }

        const config = configData.config;
        const configType = this.detectConfigType(config);

        // Validate against rules
        const rulesValidation = this.validateAgainstRules(config, configType);
        if (!rulesValidation.valid) {
            result.valid = false;
            result.errors.push(...rulesValidation.errors);
        }
        result.warnings.push(...rulesValidation.warnings);

        // Validate against schema
        const schemaValidation = this.validateAgainstSchema(config, configType);
        if (!schemaValidation.valid) {
            result.valid = false;
            result.errors.push(...schemaValidation.errors);
        }
        result.warnings.push(...schemaValidation.warnings);

        // Calculate composite score
        result.score = this.calculateScore(rulesValidation, schemaValidation);

        return result;
    }

    /**
     * Validate against rules - NASA Rule 10: ≤60 lines
     */
    private validateAgainstRules(config: any, configType: string): ValidationResult {
        const result: ValidationResult = {
            valid: true,
            errors: [],
            warnings: []
        };

        const rules = this.rules.get(configType) || [];

        for (const rule of rules) {
            const ruleResult = this.applyRule(config, rule);
            if (!ruleResult.valid) {
                result.valid = false;
                result.errors.push(ruleResult.message || rule.message);
            } else if (ruleResult.warning) {
                result.warnings.push(ruleResult.message || rule.message);
            }
        }

        return result;
    }

    /**
     * Validate against schema - NASA Rule 10: ≤60 lines
     */
    private validateAgainstSchema(config: any, configType: string): ValidationResult {
        const result: ValidationResult = {
            valid: true,
            errors: [],
            warnings: []
        };

        const schema = this.schemas.get(configType);
        if (!schema) {
            result.warnings.push(`No schema found for config type: ${configType}`);
            return result;
        }

        // Basic schema validation (would use proper schema validator)
        try {
            this.validateObjectStructure(config, schema, result);
        } catch (error) {
            result.valid = false;
            result.errors.push(`Schema validation failed: ${error}`);
        }

        return result;
    }

    /**
     * Apply single validation rule
     */
    private applyRule(config: any, rule: ValidationRule): { valid: boolean; warning?: boolean; message?: string } {
        switch (rule.type) {
            case 'required':
                return this.validateRequired(config, rule);
            case 'type':
                return this.validateType(config, rule);
            case 'range':
                return this.validateRange(config, rule);
            case 'pattern':
                return this.validatePattern(config, rule);
            case 'custom':
                return this.validateCustom(config, rule);
            default:
                return { valid: false, message: `Unknown rule type: ${rule.type}` };
        }
    }

    /**
     * Detect configuration type
     */
    private detectConfigType(config: any): string {
        if (config.detectionRules) return 'analysis';
        if (config.phases) return 'migration';
        if (config.security) return 'security';
        if (config.infrastructure) return 'infrastructure';
        return 'unknown';
    }

    /**
     * Calculate validation score
     */
    private calculateScore(rulesResult: ValidationResult, schemaResult: ValidationResult): number {
        let score = 100;

        // Deduct for errors
        score -= (rulesResult.errors.length + schemaResult.errors.length) * 20;

        // Deduct for warnings
        score -= (rulesResult.warnings.length + schemaResult.warnings.length) * 5;

        return Math.max(0, score);
    }

    // Validation helper methods
    private validateRequired(config: any, rule: ValidationRule): { valid: boolean; message?: string } {
        const path = rule.condition as string;
        const value = this.getNestedValue(config, path);
        return { valid: value !== undefined && value !== null };
    }

    private validateType(config: any, rule: ValidationRule): { valid: boolean; message?: string } {
        const { path, expectedType } = rule.condition;
        const value = this.getNestedValue(config, path);
        return { valid: typeof value === expectedType };
    }

    private validateRange(config: any, rule: ValidationRule): { valid: boolean; message?: string } {
        const { path, min, max } = rule.condition;
        const value = this.getNestedValue(config, path);
        return { valid: typeof value === 'number' && value >= min && value <= max };
    }

    private validatePattern(config: any, rule: ValidationRule): { valid: boolean; message?: string } {
        const { path, pattern } = rule.condition;
        const value = this.getNestedValue(config, path);
        const regex = new RegExp(pattern);
        return { valid: typeof value === 'string' && regex.test(value) };
    }

    private validateCustom(config: any, rule: ValidationRule): { valid: boolean; message?: string } {
        const validator = rule.condition as (config: any) => boolean;
        return { valid: validator(config) };
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    private validateObjectStructure(obj: any, schema: any, result: ValidationResult): void {
        // Basic structure validation
        for (const key of Object.keys(schema)) {
            if (schema[key].required && !obj.hasOwnProperty(key)) {
                result.valid = false;
                result.errors.push(`Required property missing: ${key}`);
            }
        }
    }
}