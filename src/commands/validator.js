/**
 * Command Validator
 * Validates command arguments and execution context
 */

const fs = require('fs').promises;
const path = require('path');

class CommandValidator {
  constructor() {
    this.rules = new Map();
    this.customValidators = new Map();
    this.initializeDefaultRules();
  }

  /**
   * Initialize default validation rules
   */
  initializeDefaultRules() {
    // Type validators
    this.addRule('string', (value) => typeof value === 'string');
    this.addRule('number', (value) => typeof value === 'number' && !isNaN(value));
    this.addRule('boolean', (value) => typeof value === 'boolean');
    this.addRule('array', (value) => Array.isArray(value));
    this.addRule('object', (value) => typeof value === 'object' && value !== null && !Array.isArray(value));

    // Path validators
    this.addRule('file', async (value) => {
      try {
        const stat = await fs.stat(value);
        return stat.isFile();
      } catch {
        return false;
      }
    });

    this.addRule('directory', async (value) => {
      try {
        const stat = await fs.stat(value);
        return stat.isDirectory();
      } catch {
        return false;
      }
    });

    this.addRule('path', async (value) => {
      try {
        await fs.access(value);
        return true;
      } catch {
        return false;
      }
    });

    // Format validators
    this.addRule('email', (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
    this.addRule('url', (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    });
    this.addRule('semver', (value) => /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/.test(value));

    // Range validators
    this.addRule('positive', (value) => typeof value === 'number' && value > 0);
    this.addRule('non-negative', (value) => typeof value === 'number' && value >= 0);
    this.addRule('percentage', (value) => typeof value === 'number' && value >= 0 && value <= 100);
  }

  /**
   * Add a validation rule
   */
  addRule(name, validator) {
    this.rules.set(name, validator);
  }

  /**
   * Add custom validator for a specific command
   */
  addCustomValidator(commandName, validator) {
    this.customValidators.set(commandName, validator);
  }

  /**
   * Validate command arguments
   */
  async validate(command, args) {
    const errors = [];
    const warnings = [];

    // Check if command has custom validator
    const customValidator = this.customValidators.get(command.name);
    if (customValidator) {
      const customResult = await customValidator(args);
      if (!customResult.valid) {
        return customResult;
      }
    }

    // Validate based on command schema
    const schema = this.getCommandSchema(command);

    for (const [paramName, paramRules] of Object.entries(schema)) {
      const value = args[paramName];

      // Check required parameters
      if (paramRules.required && (value === undefined || value === null)) {
        errors.push(`Missing required parameter: ${paramName}`);
        continue;
      }

      // Skip optional parameters that are not provided
      if (!paramRules.required && (value === undefined || value === null)) {
        continue;
      }

      // Validate type
      if (paramRules.type) {
        const typeValidator = this.rules.get(paramRules.type);
        if (typeValidator) {
          const isValid = await typeValidator(value);
          if (!isValid) {
            errors.push(`Invalid type for ${paramName}: expected ${paramRules.type}`);
          }
        }
      }

      // Validate enum values
      if (paramRules.enum && !paramRules.enum.includes(value)) {
        errors.push(`Invalid value for ${paramName}: must be one of [${paramRules.enum.join(', ')}]`);
      }

      // Validate pattern
      if (paramRules.pattern && !new RegExp(paramRules.pattern).test(value)) {
        errors.push(`Invalid format for ${paramName}: must match pattern ${paramRules.pattern}`);
      }

      // Validate range
      if (paramRules.min !== undefined && value < paramRules.min) {
        errors.push(`${paramName} must be at least ${paramRules.min}`);
      }
      if (paramRules.max !== undefined && value > paramRules.max) {
        errors.push(`${paramName} must be at most ${paramRules.max}`);
      }

      // Custom validation function
      if (paramRules.validate) {
        const customValid = await paramRules.validate(value, args);
        if (customValid !== true) {
          errors.push(customValid || `Invalid value for ${paramName}`);
        }
      }
    }

    // Check for unknown parameters
    for (const paramName of Object.keys(args)) {
      if (!schema[paramName]) {
        warnings.push(`Unknown parameter: ${paramName}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get command schema based on command type
   */
  getCommandSchema(command) {
    const schemas = {
      // Research commands
      'research-web': {
        query: { type: 'string', required: true },
        limit: { type: 'number', required: false, min: 1, max: 100 },
        language: { type: 'string', required: false }
      },
      'research-github': {
        query: { type: 'string', required: true },
        language: { type: 'string', required: false },
        stars: { type: 'number', required: false, min: 0 },
        sort: { type: 'string', required: false, enum: ['stars', 'forks', 'updated'] }
      },

      // Planning commands
      'spec-plan': {
        spec: { type: 'file', required: true },
        output: { type: 'string', required: false },
        format: { type: 'string', required: false, enum: ['json', 'yaml', 'markdown'] }
      },
      'tasks': {
        plan: { type: 'file', required: true },
        priority: { type: 'string', required: false, enum: ['high', 'medium', 'low'] }
      },

      // Implementation commands
      'codex-micro': {
        file: { type: 'file', required: true },
        lines: { type: 'number', required: false, max: 25 },
        sandbox: { type: 'boolean', required: false }
      },
      'fix-planned': {
        plan: { type: 'file', required: true },
        checkpoints: { type: 'boolean', required: false },
        dry_run: { type: 'boolean', required: false }
      },

      // QA commands
      'qa-run': {
        target: { type: 'path', required: false },
        tests: { type: 'boolean', required: false },
        lint: { type: 'boolean', required: false },
        types: { type: 'boolean', required: false },
        coverage: { type: 'boolean', required: false }
      },
      'qa-gate': {
        threshold: { type: 'percentage', required: false },
        strict: { type: 'boolean', required: false }
      },

      // Analysis commands
      'conn-scan': {
        path: { type: 'path', required: false },
        depth: { type: 'number', required: false, min: 1, max: 10 },
        format: { type: 'string', required: false, enum: ['json', 'html', 'text'] }
      },
      'sec-scan': {
        path: { type: 'path', required: false },
        rules: { type: 'string', required: false },
        severity: { type: 'string', required: false, enum: ['critical', 'high', 'medium', 'low'] }
      },

      // Project management
      'pr-open': {
        title: { type: 'string', required: true },
        body: { type: 'string', required: false },
        base: { type: 'string', required: false },
        draft: { type: 'boolean', required: false }
      }
    };

    return schemas[command.name] || {};
  }

  /**
   * Validate execution context
   */
  async validateContext(context) {
    const errors = [];

    // Validate working directory
    if (context.cwd) {
      const cwdValid = await this.rules.get('directory')(context.cwd);
      if (!cwdValid) {
        errors.push(`Invalid working directory: ${context.cwd}`);
      }
    }

    // Validate environment variables
    if (context.env && typeof context.env !== 'object') {
      errors.push('Environment variables must be an object');
    }

    // Validate user permissions
    if (context.user && !context.user.id) {
      errors.push('User context must include an ID');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize arguments
   */
  sanitize(args) {
    const sanitized = {};

    for (const [key, value] of Object.entries(args)) {
      // Remove dangerous characters from strings
      if (typeof value === 'string') {
        sanitized[key] = value
          .replace(/[<>]/g, '')
          .replace(/\.\.\//g, '')
          .trim();
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Validate batch execution
   */
  async validateBatch(commands) {
    const results = [];

    for (const { command, args } of commands) {
      const validation = await this.validate(command, args);
      results.push({
        command: command.name,
        ...validation
      });
    }

    return {
      valid: results.every(r => r.valid),
      results
    };
  }
}

module.exports = CommandValidator;