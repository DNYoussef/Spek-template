/**
 * PenetrationTester
 * Handles penetration testing operations (NASA Rule 10 compliant)
 */

export class PenetrationTester {
  /**
   * Test for SQL injection vulnerabilities (≤60 lines)
   */
  async testSQLInjection(projectPath: string): Promise<{ passed: boolean; details: string }> {
    try {
      const fs = await import('fs/promises');
      const { glob } = await import('glob');

      const codeFiles = await glob('**/*.{js,ts,py,sql}', {
        cwd: projectPath,
        ignore: ['node_modules/**', 'dist/**']
      });

      for (const file of codeFiles.slice(0, 20)) {
        const content = await fs.readFile(`${projectPath}/${file}`, 'utf-8');

        // Look for potential SQL injection vulnerabilities
        const vulnerablePatterns = [
          /query\s*\(\s*["'].*\+.*["']\s*\)/gi, // String concatenation in queries
          /sql\s*=\s*["'].*\$\{.*\}.*["']/gi,   // Template literals in SQL
          /WHERE.*=.*\$\{/gi,                    // Direct variable injection
          /INSERT INTO.*VALUES.*\+/gi           // Concatenated INSERT statements
        ];

        for (const pattern of vulnerablePatterns) {
          if (pattern.test(content)) {
            return {
              passed: false,
              details: `Potential SQL injection vulnerability found in ${file}`
            };
          }
        }
      }

      return { passed: true, details: 'No SQL injection vulnerabilities detected' };
    } catch (error) {
      return { passed: false, details: `SQL injection test failed: ${error.message}` };
    }
  }

  /**
   * Test for XSS vulnerabilities (≤60 lines)
   */
  async testXSSVulnerability(projectPath: string): Promise<{ passed: boolean; details: string }> {
    try {
      const fs = await import('fs/promises');
      const { glob } = await import('glob');

      const codeFiles = await glob('**/*.{js,ts,jsx,tsx,html}', {
        cwd: projectPath,
        ignore: ['node_modules/**', 'dist/**']
      });

      for (const file of codeFiles.slice(0, 20)) {
        const content = await fs.readFile(`${projectPath}/${file}`, 'utf-8');

        // Look for potential XSS vulnerabilities
        const vulnerablePatterns = [
          /innerHTML\s*=\s*[^;]*\+/gi,           // Direct innerHTML with concatenation
          /document\.write\s*\(/gi,             // document.write usage
          /eval\s*\(/gi,                      // eval usage
          /dangerouslySetInnerHTML/gi,        // React dangerouslySetInnerHTML
          /v-html\s*=/gi                      // Vue v-html directive
        ];

        for (const pattern of vulnerablePatterns) {
          if (pattern.test(content)) {
            return {
              passed: false,
              details: `Potential XSS vulnerability found in ${file}`
            };
          }
        }
      }

      return { passed: true, details: 'No XSS vulnerabilities detected' };
    } catch (error) {
      return { passed: false, details: `XSS test failed: ${error.message}` };
    }
  }

  /**
   * Test for CSRF protection (≤60 lines)
   */
  async testCSRFProtection(projectPath: string): Promise<{ passed: boolean; details: string }> {
    try {
      const fs = await import('fs/promises');

      // Check for CSRF protection in package.json
      const packageJson = JSON.parse(
        await fs.readFile(`${projectPath}/package.json`, 'utf-8')
      );

      const csrfLibs = ['csurf', 'csrf', 'express-csrf'];
      const hasCSRFLib = csrfLibs.some(lib =>
        packageJson.dependencies?.[lib] || packageJson.devDependencies?.[lib]
      );

      if (hasCSRFLib) {
        return { passed: true, details: 'CSRF protection library found' };
      }

      // Check for CSRF tokens in code
      const { glob } = await import('glob');
      const codeFiles = await glob('**/*.{js,ts,jsx,tsx}', {
        cwd: projectPath,
        ignore: ['node_modules/**', 'dist/**']
      });

      for (const file of codeFiles.slice(0, 10)) {
        const content = await fs.readFile(`${projectPath}/${file}`, 'utf-8');

        if (content.includes('csrf') || content.includes('CSRF') || content.includes('token')) {
          return { passed: true, details: 'CSRF protection implementation found' };
        }
      }

      return { passed: false, details: 'No CSRF protection found' };
    } catch (error) {
      return { passed: false, details: `CSRF test failed: ${error.message}` };
    }
  }

  /**
   * Test for authentication bypass vulnerabilities (≤60 lines)
   */
  async testAuthenticationBypass(projectPath: string): Promise<{ passed: boolean; details: string }> {
    try {
      const fs = await import('fs/promises');
      const { glob } = await import('glob');

      const codeFiles = await glob('**/*.{js,ts}', {
        cwd: projectPath,
        ignore: ['node_modules/**', 'dist/**']
      });

      for (const file of codeFiles.slice(0, 20)) {
        const content = await fs.readFile(`${projectPath}/${file}`, 'utf-8');

        // Look for potential authentication bypass patterns
        const bypassPatterns = [
          /if\s*\(\s*true\s*\)/gi,              // Hardcoded true conditions
          /auth\s*=\s*true/gi,                 // Hardcoded authentication
          /authenticated\s*=\s*true/gi,        // Hardcoded authentication status
          /password\s*===?\s*["']["']/gi,      // Empty password checks
          /user\s*===?\s*["']admin["']/gi      // Hardcoded admin checks
        ];

        for (const pattern of bypassPatterns) {
          if (pattern.test(content)) {
            return {
              passed: false,
              details: `Potential authentication bypass found in ${file}`
            };
          }
        }
      }

      return { passed: true, details: 'No authentication bypass vulnerabilities detected' };
    } catch (error) {
      return { passed: false, details: `Authentication bypass test failed: ${error.message}` };
    }
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: agent104-penetration-tester
// inputs: ["SecurityValidationService.ts analysis"]
// tools_used: ["Write"]
// versions: {"model":"sonnet-4","prompt":"service-fsm-elimination"}
// === END FOOTER ===