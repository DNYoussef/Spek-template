/**
 * Security Configuration
 * Central security settings and validation rules
 */

module.exports = {
  // Disable dangerous operations
  allowDynamicRequire: false,
  allowEval: false,
  sanitizeInputs: true,

  // Input validation limits
  maxInputLength: 4096,
  maxPathLength: 4096,
  maxExpressionLength: 1000,

  // Protection flags
  enablePathTraversalProtection: true,
  enableCommandInjectionProtection: true,
  enableCodeInjectionProtection: true,
  enableNullByteProtection: true,
  enableCRLFProtection: true,

  // Allowed file extensions
  allowedFileExtensions: [
    '.js', '.ts', '.jsx', '.tsx',
    '.json', '.md', '.txt',
    '.py', '.sh', '.yml', '.yaml'
  ],

  // Blocked patterns (regex strings)
  blockedPatterns: [
    '[;&|`$()]',        // Shell metacharacters
    '\\.\\.',           // Path traversal
    '\\x00',            // Null bytes
    '\\r|\\n',          // CRLF
    '__import__',       // Python imports
    'eval\\(',          // Eval calls
    'exec\\(',          // Exec calls
    'require\\(',       // Dynamic requires
    'Function\\(',      // Function constructor
  ],

  // Security headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  },

  // Logging
  logSecurityEvents: true,
  logLevel: 'warning',

  // Rate limiting
  maxRequestsPerMinute: 100,
  maxFailedAttemptsBeforeBlock: 5
};