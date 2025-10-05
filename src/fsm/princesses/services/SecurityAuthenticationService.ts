/**
 * SecurityAuthenticationService
 * NASA Rule 10 Compliant: Extracted service for authentication validation operations
 */

import { SecurityContext } from '../SecurityPrincessFSM';

export class SecurityAuthenticationService {
  /**
   * Perform authentication validation using real code analysis
   */
  async performAuthValidation(context: SecurityContext): Promise<void> {
    this.log('Performing authentication validation');

    try {
      const authFiles = await this.findAuthenticationFiles(context);
      const authAnalysis = await this.analyzeAuthenticationCode(authFiles);
      const securityAssessment = await this.assessAuthenticationSecurity(authAnalysis);
      const complianceCheck = await this.checkAuthenticationCompliance(authAnalysis);

      context.authentication = {
        implemented: authAnalysis.hasAuthImplementation,
        method: authAnalysis.detectedMethods.join(', ') || 'Unknown',
        encryption: authAnalysis.encryptionMethods.join(', ') || 'Unknown',
        validated: authAnalysis.hasValidation,
        filesAnalyzed: authFiles.length,
        securityFeatures: authAnalysis.securityFeatures,
        weaknesses: authAnalysis.weaknesses,
        securityScore: securityAssessment.score,
        complianceLevel: complianceCheck.level,
        recommendations: securityAssessment.recommendations,
        lastValidation: new Date().toISOString()
      };

      this.log('Authentication validation complete');
    } catch (error) {
      this.logError('Authentication validation failed', error);
      
      // Provide fallback validation result
      context.authentication = {
        implemented: false,
        method: 'Analysis failed',
        encryption: 'Unknown',
        validated: false,
        error: error instanceof Error ? error.message : String(error),
        lastValidation: new Date().toISOString()
      };
    }
  }

  /**
   * Find authentication-related files in the project
   */
  private async findAuthenticationFiles(context: SecurityContext): Promise<string[]> {
    const projectPath = context.metadata?.projectPath || process.cwd();
    
    try {
      const { glob } = await import('glob');
      const path = await import('path');

      const authPatterns = [
        '**/auth/**/*.{js,ts,jsx,tsx,py}',
        '**/authentication/**/*.{js,ts,jsx,tsx,py}',
        '**/login/**/*.{js,ts,jsx,tsx,py}',
        '**/security/**/*.{js,ts,jsx,tsx,py}',
        '**/*auth*.{js,ts,jsx,tsx,py}',
        '**/*login*.{js,ts,jsx,tsx,py}',
        '**/*session*.{js,ts,jsx,tsx,py}',
        '**/*jwt*.{js,ts,jsx,tsx,py}',
        '**/*passport*.{js,ts,jsx,tsx,py}',
        '**/*oauth*.{js,ts,jsx,tsx,py}'
      ];

      const files: string[] = [];

      for (const pattern of authPatterns) {
        try {
          const matches = await glob(pattern, { 
            cwd: projectPath,
            ignore: ['node_modules/**', 'dist/**', 'build/**']
          });
          files.push(...matches.map((file: unknown) => path.join(projectPath, file)));
        } catch (error) {
          // Continue with other patterns if one fails
        }
      }

      return [...new Set(files)]; // Remove duplicates
    } catch (error) {
      this.logError('Error finding authentication files', error);
      return [];
    }
  }

  /**
   * Analyze authentication implementation in code files
   */
  private async analyzeAuthenticationCode(authFiles: string[]): Promise<{
    hasAuthImplementation: boolean;
    detectedMethods: string[];
    encryptionMethods: string[];
    hasValidation: boolean;
    securityFeatures: string[];
    weaknesses: string[];
    codePatterns: any[];
  }> {
    const analysis = {
      hasAuthImplementation: false,
      detectedMethods: [] as string[],
      encryptionMethods: [] as string[],
      hasValidation: false,
      securityFeatures: [] as string[],
      weaknesses: [] as string[],
      codePatterns: [] as any[]
    };

    const fs = await import('fs/promises');

    for (const file of authFiles.slice(0, 20)) { // Limit analysis to prevent timeout
      try {
        const content = await fs.readFile(file, 'utf-8');
        const fileAnalysis = this.analyzeFileContent(content, file);
        
        // Merge results
        if (fileAnalysis.hasAuth) {
          analysis.hasAuthImplementation = true;
        }
        
        analysis.detectedMethods.push(...fileAnalysis.authMethods);
        analysis.encryptionMethods.push(...fileAnalysis.encryptionMethods);
        analysis.securityFeatures.push(...fileAnalysis.securityFeatures);
        analysis.weaknesses.push(...fileAnalysis.weaknesses);
        analysis.codePatterns.push(...fileAnalysis.patterns);
        
        if (fileAnalysis.hasValidation) {
          analysis.hasValidation = true;
        }

      } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
        this.log(`Could not analyze file ${file}: ${errorMessage}`);
      }
    }

    // Remove duplicates
    analysis.detectedMethods = [...new Set(analysis.detectedMethods)];
    analysis.encryptionMethods = [...new Set(analysis.encryptionMethods)];
    analysis.securityFeatures = [...new Set(analysis.securityFeatures)];
    analysis.weaknesses = [...new Set(analysis.weaknesses)];

    return analysis;
  }

  /**
   * Analyze individual file content for authentication patterns
   */
  private analyzeFileContent(content: string, filename: string): {
    hasAuth: boolean;
    authMethods: string[];
    encryptionMethods: string[];
    securityFeatures: string[];
    weaknesses: string[];
    hasValidation: boolean;
    patterns: any[];
  } {
    const result = {
      hasAuth: false,
      authMethods: [] as string[],
      encryptionMethods: [] as string[],
      securityFeatures: [] as string[],
      weaknesses: [] as string[],
      hasValidation: false,
      patterns: [] as any[]
    };

    const lowerContent = content.toLowerCase();
    const lines = content.split('\n');

    // Detect authentication methods
    const authPatterns = [
      { pattern: /jwt|jsonwebtoken/gi, method: 'JWT' },
      { pattern: /passport/gi, method: 'Passport.js' },
      { pattern: /oauth|auth0/gi, method: 'OAuth' },
      { pattern: /session/gi, method: 'Session-based' },
      { pattern: /basic.?auth/gi, method: 'Basic Auth' },
      { pattern: /bearer.?token/gi, method: 'Bearer Token' },
      { pattern: /api.?key/gi, method: 'API Key' },
      { pattern: /saml/gi, method: 'SAML' },
      { pattern: /ldap/gi, method: 'LDAP' }
    ];

    authPatterns.forEach(({ pattern, method }) => {
      if (pattern.test(content)) {
        result.hasAuth = true;
        result.authMethods.push(method);
      }
    });

    // Detect encryption methods
    const encryptionPatterns = [
      { pattern: /bcrypt/gi, method: 'bcrypt' },
      { pattern: /scrypt/gi, method: 'scrypt' },
      { pattern: /argon2/gi, method: 'Argon2' },
      { pattern: /pbkdf2/gi, method: 'PBKDF2' },
      { pattern: /aes/gi, method: 'AES' },
      { pattern: /rsa/gi, method: 'RSA' },
      { pattern: /sha256|sha-256/gi, method: 'SHA-256' },
      { pattern: /hmac/gi, method: 'HMAC' }
    ];

    encryptionPatterns.forEach(({ pattern, method }) => {
      if (pattern.test(content)) {
        result.encryptionMethods.push(method);
      }
    });

    // Detect security features
    const securityFeatures = [
      { pattern: /csrf|xsrf/gi, feature: 'CSRF Protection' },
      { pattern: /rate.?limit/gi, feature: 'Rate Limiting' },
      { pattern: /2fa|two.?factor|mfa|multi.?factor/gi, feature: 'Multi-Factor Authentication' },
      { pattern: /helmet/gi, feature: 'Security Headers (Helmet)' },
      { pattern: /cors/gi, feature: 'CORS Configuration' },
      { pattern: /content.?security.?policy|csp/gi, feature: 'Content Security Policy' },
      { pattern: /secure.?cookie/gi, feature: 'Secure Cookies' },
      { pattern: /same.?site/gi, feature: 'SameSite Cookie Protection' },
      { pattern: /https.?only/gi, feature: 'HTTPS Enforcement' }
    ];

    securityFeatures.forEach(({ pattern, feature }) => {
      if (pattern.test(content)) {
        result.securityFeatures.push(feature);
      }
    });

    // Detect validation patterns
    const validationPatterns = [
      /validate|verify|check|authenticate/gi,
      /\.(validate|verify|check)\(/gi,
      /if\s*\(.*(valid|authenticated|authorized)/gi
    ];

    validationPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        result.hasValidation = true;
      }
    });

    // Detect potential weaknesses
    const weaknessPatterns = [
      { pattern: /md5/gi, weakness: 'Weak MD5 hashing detected' },
      { pattern: /sha1/gi, weakness: 'Weak SHA1 hashing detected' },
      { pattern: /password.*plain|plain.*password/gi, weakness: 'Potential plain text password usage' },
      { pattern: /password.*=.*["'][^"']{1,8}["']/gi, weakness: 'Weak password pattern detected' },
      { pattern: /secret.*=.*["'][^"']+["']/gi, weakness: 'Hardcoded secret detected' },
      { pattern: /eval\(/gi, weakness: 'Use of eval() function' },
      { pattern: /document\.cookie/gi, weakness: 'Direct cookie manipulation' },
      { pattern: /localStorage|sessionStorage/gi, weakness: 'Potential sensitive data in web storage' }
    ];

    weaknessPatterns.forEach(({ pattern, weakness }) => {
      if (pattern.test(content)) {
        result.weaknesses.push(weakness);
      }
    });

    return result;
  }

  /**
   * Assess authentication security posture
   */
  private async assessAuthenticationSecurity(authAnalysis: any): Promise<{
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
  }> {
    let score = 0;
    const recommendations: string[] = [];

    // Base implementation score
    if (authAnalysis.hasAuthImplementation) {
      score += 30;
    } else {
      recommendations.push('Implement authentication mechanism');
    }

    // Method quality scoring
    const strongMethods = ['JWT', 'OAuth', 'SAML'];
    const weakMethods = ['Basic Auth', 'API Key'];
    
    const hasStrongMethod = authAnalysis.detectedMethods.some(method => 
      strongMethods.includes(method)
    );
    const hasWeakMethod = authAnalysis.detectedMethods.some(method => 
      weakMethods.includes(method)
    );

    if (hasStrongMethod) {
      score += 25;
    } else if (hasWeakMethod) {
      score += 10;
      recommendations.push('Consider upgrading to stronger authentication methods (JWT, OAuth)');
    }

    // Encryption scoring
    const strongEncryption = ['bcrypt', 'Argon2', 'scrypt'];
    const hasStrongEncryption = authAnalysis.encryptionMethods.some(method => 
      strongEncryption.includes(method)
    );

    if (hasStrongEncryption) {
      score += 20;
    } else {
      recommendations.push('Implement strong password hashing (bcrypt, Argon2, or scrypt)');
    }

    // Security features scoring
    score += Math.min(20, authAnalysis.securityFeatures.length * 3);

    if (!authAnalysis.securityFeatures.includes('Multi-Factor Authentication')) {
      recommendations.push('Consider implementing multi-factor authentication');
    }

    if (!authAnalysis.securityFeatures.includes('Rate Limiting')) {
      recommendations.push('Implement rate limiting for authentication endpoints');
    }

    // Validation scoring
    if (authAnalysis.hasValidation) {
      score += 15;
    } else {
      recommendations.push('Implement proper input validation for authentication');
    }

    // Penalty for weaknesses
    score -= authAnalysis.weaknesses.length * 5;

    // Normalize score
    score = Math.max(0, Math.min(100, score));

    // Determine security level
    let level: 'low' | 'medium' | 'high' | 'critical';
    if (score >= 80) {
      level = 'high';
    } else if (score >= 60) {
      level = 'medium';
    } else if (score >= 40) {
      level = 'low';
    } else {
      level = 'critical';
    }

    return {
      score,
      level,
      recommendations
    };
  }

  /**
   * Check authentication compliance with standards
   */
  private async checkAuthenticationCompliance(authAnalysis: any): Promise<{
    level: 'non-compliant' | 'basic' | 'standard' | 'high';
    standards: string[];
    gaps: string[];
  }> {
    const standards: string[] = [];
    const gaps: string[] = [];

    // OWASP Authentication Guidelines
    if (authAnalysis.hasAuthImplementation && authAnalysis.hasValidation) {
      standards.push('OWASP Basic Authentication');
    } else {
      gaps.push('OWASP Basic Authentication requirements not met');
    }

    // NIST SP 800-63B Guidelines
    const hasStrongEncryption = authAnalysis.encryptionMethods.some(method => 
      ['bcrypt', 'Argon2', 'scrypt', 'PBKDF2'].includes(method)
    );

    if (hasStrongEncryption) {
      standards.push('NIST SP 800-63B Password Guidelines');
    } else {
      gaps.push('NIST password hashing requirements not met');
    }

    // SOC 2 Type II
    const hasSecurityFeatures = authAnalysis.securityFeatures.length >= 3;
    if (hasSecurityFeatures && authAnalysis.weaknesses.length === 0) {
      standards.push('SOC 2 Security Controls');
    } else {
      gaps.push('SOC 2 security control requirements not fully met');
    }

    // Determine compliance level
    let level: 'non-compliant' | 'basic' | 'standard' | 'high';
    if (standards.length >= 3) {
      level = 'high';
    } else if (standards.length >= 2) {
      level = 'standard';
    } else if (standards.length >= 1) {
      level = 'basic';
    } else {
      level = 'non-compliant';
    }

    return {
      level,
      standards,
      gaps
    };
  }

  /**
   * Log message
   */
  private log(message: string, data?: any): void {
    console.log(`[SecurityAuthenticationService] ${message}`, data || '');
  }

  /**
   * Log error
   */
  private logError(message: string, error?: any): void {
    console.error(`[SecurityAuthenticationService] ERROR: ${message}`, error || '');
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: codex-038-authentication-service
// inputs: ["SecurityPrincessFSM.ts analysis"]
// tools_used: ["MultiEdit"]
// versions: {"model":"sonnet-4","prompt":"nasa-rule-10-fsm"}
// === END FOOTER ===