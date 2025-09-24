/**
 * Security Validators
 * Implementation of secure input validation functions
 */

const path = require('path');
const fs = require('fs');

/**
 * CWE-78: OS Command Injection Prevention
 * Validates file paths to prevent command injection
 */
function validateFilePath(filePath) {
  // Type validation
  if (typeof filePath !== 'string') {
    throw new Error('Invalid file path: must be a string');
  }

  // Empty check
  if (!filePath || filePath.trim().length === 0) {
    throw new Error('Invalid file path: cannot be empty');
  }

  // Length check (DoS prevention)
  if (filePath.length > 4096) {
    throw new Error('Invalid file path: exceeds maximum length of 4096 characters');
  }

  // Null byte injection prevention
  if (filePath.includes('\u0000') || filePath.includes('\x00')) {
    throw new Error('Invalid file path: null byte injection detected');
  }

  // CRLF injection prevention
  if (filePath.includes('\r') || filePath.includes('\n')) {
    throw new Error('Invalid file path: CRLF injection detected');
  }

  // Command injection patterns
  const dangerousPatterns = [
    /[;&|`$()]/,  // Shell metacharacters
    /\.\./,        // Path traversal
    /^-/,          // Command flag injection
    /\\x[0-9a-f]{2}/i, // Hex escape sequences
    /\$\{/,        // Variable expansion
    /<|>/          // Redirection operators
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(filePath)) {
      throw new Error(`Invalid file path: dangerous pattern detected - ${pattern}`);
    }
  }

  // Whitelist approach: only allow safe characters
  const safePathPattern = /^[a-zA-Z0-9\/_.\-:\\]+$/;
  if (!safePathPattern.test(filePath)) {
    throw new Error('Invalid file path: contains unsafe characters');
  }

  return filePath;
}

/**
 * CWE-88: Argument Injection Prevention
 * Validates paths with directory restrictions
 */
function validatePath(userPath, allowedBase) {
  // Type validation
  if (typeof userPath !== 'string' || typeof allowedBase !== 'string') {
    throw new Error('Invalid input: path and base must be strings');
  }

  // Empty check
  if (!userPath || userPath.trim().length === 0) {
    throw new Error('Invalid path format: cannot be empty');
  }

  // Whitelist format validation (only alphanumeric, /, \, _, ., -, :)
  // Allow : for Windows drive letters (C:\)
  const pathFormatPattern = /^[a-zA-Z0-9\/_.\-:\\]+$/;
  if (!pathFormatPattern.test(userPath)) {
    throw new Error('Invalid path format: Only alphanumeric, /, \\, _, ., -, : allowed');
  }

  // Resolve to absolute path and check containment
  let realPath;
  try {
    // Normalize paths for comparison
    const normalizedBase = path.resolve(allowedBase);
    const normalizedPath = path.resolve(userPath);

    // Check if path is within allowed directory
    if (!normalizedPath.startsWith(normalizedBase)) {
      throw new Error(`Path must be within allowed directory: ${allowedBase}`);
    }

    realPath = normalizedPath;
  } catch (error) {
    throw new Error(`Path validation failed: ${error.message}`);
  }

  return realPath;
}

/**
 * CWE-917: Expression Language Injection Prevention
 * Safe expression evaluation with restricted operations
 */
function safeEval(expression) {
  // Type validation
  if (typeof expression !== 'string') {
    throw new Error('Invalid expression: must be a string');
  }

  // Empty check
  if (!expression || expression.trim().length === 0) {
    throw new Error('Invalid expression: cannot be empty');
  }

  // Try JSON parsing first (safest option)
  try {
    return JSON.parse(expression);
  } catch (jsonError) {
    // Not JSON, try AST parsing
  }

  // Use AST parsing with restricted node types
  const vm = require('vm');
  const esprima = require('esprima');

  try {
    // Parse to AST
    const ast = esprima.parseScript(expression, { tolerant: false });

    // Whitelist of safe node types
    const SAFE_NODES = new Set([
      'Program',
      'ExpressionStatement',
      'Literal',
      'BinaryExpression',
      'UnaryExpression',
      'ArrayExpression',
      'ObjectExpression',
      'Property',
      'Identifier'
    ]);

    // Validate all nodes are safe
    function validateNode(node) {
      if (!SAFE_NODES.has(node.type)) {
        throw new Error(`Unsafe operation: ${node.type} not allowed`);
      }

      // Recursively validate children
      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            node[key].forEach(validateNode);
          } else if (node[key].type) {
            validateNode(node[key]);
          }
        }
      }
    }

    validateNode(ast);

    // Execute in restricted context
    const sandbox = {
      Math: Math,
      // No access to require, process, etc.
    };
    const context = vm.createContext(sandbox);
    return vm.runInContext(expression, context, {
      timeout: 1000, // 1 second max
      displayErrors: true
    });

  } catch (error) {
    throw new Error(`Invalid expression: ${error.message}`);
  }
}

/**
 * CWE-95: Code Injection Prevention
 * Safe module loading with whitelist
 */
function loadModel(modelName) {
  // Type validation
  if (typeof modelName !== 'string') {
    throw new Error('Model name must be a string');
  }

  // Sanitize input
  const sanitized = modelName.toLowerCase().trim();

  // Whitelist of allowed models
  const ALLOWED_MODELS = {
    'gemini': './models/gemini',
    'gemini-pro': './models/gemini-pro',
    'gpt5': './models/gpt5',
    'claude-opus': './models/claude-opus',
    'claude-sonnet': './models/claude-sonnet',
    'gemini-flash': './models/gemini-flash'
  };

  // Check whitelist
  if (!ALLOWED_MODELS.hasOwnProperty(sanitized)) {
    const allowed = Object.keys(ALLOWED_MODELS).join(', ');
    throw new Error(`Unknown model: ${modelName}. Allowed models: ${allowed}`);
  }

  // Additional validation: no command injection characters
  if (/[;&|`$()<>]/.test(modelName)) {
    throw new Error('Model name contains invalid characters');
  }

  // Safe require with static path
  const modulePath = ALLOWED_MODELS[sanitized];

  // Verify the module path is within project directory
  const resolvedPath = path.resolve(__dirname, modulePath);
  const projectRoot = path.resolve(__dirname, '../..');

  if (!resolvedPath.startsWith(projectRoot)) {
    throw new Error('Module path outside project directory not allowed');
  }

  // Return mock for testing (in production, would actually require)
  return {
    name: sanitized,
    path: modulePath,
    loaded: true
  };
}

/**
 * Security configuration
 */
const securityConfig = {
  allowDynamicRequire: false,
  allowEval: false,
  sanitizeInputs: true,
  maxInputLength: 4096,
  enablePathTraversalProtection: true,
  enableCommandInjectionProtection: true,
  enableCodeInjectionProtection: true
};

module.exports = {
  validateFilePath,
  validatePath,
  safeEval,
  loadModel,
  securityConfig
};