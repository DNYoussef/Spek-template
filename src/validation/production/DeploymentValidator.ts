/**
 * Deployment Validator
 * Validates deployment pipeline readiness and configuration
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface DeploymentValidationResult {
  isReady: boolean;
  score: number;
  checks: DeploymentCheck[];
  blocking: string[];
  warnings: string[];
}

export interface DeploymentCheck {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  description: string;
  details: string[];
}

export class DeploymentValidator {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async validateDeployment(): Promise<DeploymentValidationResult> {
    const checks = await this.runAllChecks();
    const score = this.calculateScore(checks);
    const isReady = score >= 80 && !this.hasBlockingIssues(checks);
    const blocking = this.getBlockingIssues(checks);
    const warnings = this.getWarnings(checks);

    return {
      isReady,
      score,
      checks,
      blocking,
      warnings
    };
  }

  private async runAllChecks(): Promise<DeploymentCheck[]> {
    return [
      await this.checkDockerConfiguration(),
      await this.checkEnvironmentConfiguration(),
      await this.checkCICDPipeline(),
      await this.checkHealthChecks(),
      await this.checkSecrets(),
      await this.checkRollbackStrategy(),
      await this.checkMonitoring(),
      await this.checkLoadBalancing(),
      await this.checkScaling(),
      await this.checkBackup()
    ];
  }

  private async checkDockerConfiguration(): Promise<DeploymentCheck> {
    const details: string[] = [];
    let status: 'PASS' | 'FAIL' | 'WARNING' = 'FAIL';

    try {
      // Check Dockerfile
      if (existsSync(join(this.projectRoot, 'Dockerfile'))) {
        const dockerfile = readFileSync(join(this.projectRoot, 'Dockerfile'), 'utf8');
        
        if (dockerfile.includes('EXPOSE')) {
          details.push('✓ Port exposure configured');
        } else {
          details.push('⚠ No port exposure found');
        }

        if (dockerfile.includes('HEALTHCHECK')) {
          details.push('✓ Health check configured');
        } else {
          details.push('⚠ No health check in Dockerfile');
        }

        if (dockerfile.includes('USER') && !dockerfile.includes('USER root')) {
          details.push('✓ Non-root user configured');
        } else {
          details.push('⚠ Running as root user');
        }

        status = 'PASS';
      } else {
        details.push('✗ Dockerfile not found');
      }

      // Check docker-compose
      if (existsSync(join(this.projectRoot, 'docker-compose.yml'))) {
        details.push('✓ Docker Compose configuration found');
      }

      // Check .dockerignore
      if (existsSync(join(this.projectRoot, '.dockerignore'))) {
        details.push('✓ .dockerignore file present');
      } else {
        details.push('⚠ .dockerignore file missing');
      }

    } catch (error) {
      details.push(`✗ Docker validation error: ${error.message}`);
    }

    return {
      name: 'Docker Configuration',
      status,
      description: 'Validates Docker setup for containerized deployment',
      details
    };
  }

  private async checkEnvironmentConfiguration(): Promise<DeploymentCheck> {
    const details: string[] = [];
    let status: 'PASS' | 'FAIL' | 'WARNING' = 'FAIL';

    try {
      // Check .env.example
      if (existsSync(join(this.projectRoot, '.env.example'))) {
        const envExample = readFileSync(join(this.projectRoot, '.env.example'), 'utf8');
        const envVars = envExample.split('\n').filter(line => line.includes('='));
        
        if (envVars.length > 0) {
          details.push(`✓ Environment template with ${envVars.length} variables`);
          status = 'PASS';
        }
      } else {
        details.push('✗ .env.example file missing');
      }

      // Check for hardcoded values
      const srcFiles = this.findTypeScriptFiles();
      let hardcodedFound = 0;

      for (const file of srcFiles) {
        const content = readFileSync(file, 'utf8');
        const hardcodedPatterns = [
          /localhost:\d+/g,
          /127\.0\.0\.1/g,
          /password.*['"]\w+['"]/gi,
          /api[_-]?key.*['"]\w+['"]/gi
        ];

        for (const pattern of hardcodedPatterns) {
          if (pattern.test(content)) {
            hardcodedFound++;
          }
        }
      }

      if (hardcodedFound === 0) {
        details.push('✓ No hardcoded configuration detected');
      } else {
        details.push(`✗ ${hardcodedFound} hardcoded configuration items found`);
        status = 'FAIL';
      }

    } catch (error) {
      details.push(`✗ Environment validation error: ${error.message}`);
    }

    return {
      name: 'Environment Configuration',
      status,
      description: 'Validates environment variable configuration',
      details
    };
  }

  private async checkCICDPipeline(): Promise<DeploymentCheck> {
    const details: string[] = [];
    let status: 'PASS' | 'FAIL' | 'WARNING' = 'FAIL';

    const cicdPaths = [
      '.github/workflows',
      '.gitlab-ci.yml',
      'azure-pipelines.yml',
      'Jenkinsfile',
      '.circleci/config.yml'
    ];

    let foundCICD = false;
    for (const path of cicdPaths) {
      if (existsSync(join(this.projectRoot, path))) {
        foundCICD = true;
        details.push(`✓ CI/CD configuration found: ${path}`);
        
        if (path.includes('github')) {
          status = await this.validateGitHubWorkflows();
        }
        break;
      }
    }

    if (!foundCICD) {
      details.push('✗ No CI/CD configuration found');
    }

    return {
      name: 'CI/CD Pipeline',
      status,
      description: 'Validates continuous integration and deployment setup',
      details
    };
  }

  private async validateGitHubWorkflows(): Promise<'PASS' | 'FAIL' | 'WARNING'> {
    try {
      const workflowDir = join(this.projectRoot, '.github/workflows');
      if (existsSync(workflowDir)) {
        return 'PASS';
      }
    } catch (error) {
      // Workflow validation error
    }
    return 'WARNING';
  }

  private async checkHealthChecks(): Promise<DeploymentCheck> {
    const details: string[] = [];
    let status: 'PASS' | 'FAIL' | 'WARNING' = 'FAIL';

    try {
      const srcFiles = this.findTypeScriptFiles();
      let healthEndpointFound = false;

      for (const file of srcFiles) {
        const content = readFileSync(file, 'utf8');
        
        if (content.includes('/health') || content.includes('/healthz') || content.includes('health')) {
          healthEndpointFound = true;
          details.push(`✓ Health endpoint found in ${file}`);
          break;
        }
      }

      if (healthEndpointFound) {
        status = 'PASS';
      } else {
        details.push('✗ No health check endpoint found');
      }

    } catch (error) {
      details.push(`✗ Health check validation error: ${error.message}`);
    }

    return {
      name: 'Health Checks',
      status,
      description: 'Validates health monitoring endpoints',
      details
    };
  }

  private async checkSecrets(): Promise<DeploymentCheck> {
    const details: string[] = [];
    let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';

    try {
      // Check for committed secrets
      const { stdout } = await execAsync('git log --all --full-history -- *secret* *password* *key*', 
        { cwd: this.projectRoot });
      
      if (stdout.trim()) {
        details.push('⚠ Potential secrets in git history');
        status = 'WARNING';
      } else {
        details.push('✓ No secrets detected in git history');
      }

      // Check current files for secrets
      const srcFiles = this.findTypeScriptFiles();
      let secretsFound = 0;

      for (const file of srcFiles) {
        const content = readFileSync(file, 'utf8');
        const secretPatterns = [
          /password\s*[:=]\s*['"]\w+['"]/gi,
          /api[_-]?key\s*[:=]\s*['"]\w+['"]/gi,
          /secret\s*[:=]\s*['"]\w+['"]/gi,
          /token\s*[:=]\s*['"]\w+['"]/gi
        ];

        for (const pattern of secretPatterns) {
          if (pattern.test(content)) {
            secretsFound++;
          }
        }
      }

      if (secretsFound > 0) {
        details.push(`✗ ${secretsFound} potential hardcoded secrets found`);
        status = 'FAIL';
      } else {
        details.push('✓ No hardcoded secrets detected');
      }

    } catch (error) {
      details.push(`✗ Secrets validation error: ${error.message}`);
    }

    return {
      name: 'Secrets Management',
      status,
      description: 'Validates proper secrets handling',
      details
    };
  }

  private async checkRollbackStrategy(): Promise<DeploymentCheck> {
    const details: string[] = [];
    let status: 'PASS' | 'FAIL' | 'WARNING' = 'WARNING';

    // Check for deployment strategy documentation
    const deploymentDocs = [
      'docs/DEPLOYMENT.md',
      'README.md',
      'DEPLOYMENT.md'
    ];

    let rollbackDocumented = false;
    for (const doc of deploymentDocs) {
      try {
        const content = readFileSync(join(this.projectRoot, doc), 'utf8');
        if (content.toLowerCase().includes('rollback') || content.toLowerCase().includes('revert')) {
          rollbackDocumented = true;
          details.push(`✓ Rollback strategy documented in ${doc}`);
          status = 'PASS';
          break;
        }
      } catch {
        // File doesn't exist
      }
    }

    if (!rollbackDocumented) {
      details.push('⚠ Rollback strategy not documented');
    }

    return {
      name: 'Rollback Strategy',
      status,
      description: 'Validates rollback and recovery procedures',
      details
    };
  }

  private async checkMonitoring(): Promise<DeploymentCheck> {
    const details: string[] = [];
    let status: 'PASS' | 'FAIL' | 'WARNING' = 'WARNING';

    const srcFiles = this.findTypeScriptFiles();
    let monitoringFound = false;

    for (const file of srcFiles) {
      const content = readFileSync(file, 'utf8');
      
      if (content.includes('prometheus') || content.includes('grafana') || 
          content.includes('metrics') || content.includes('monitoring')) {
        monitoringFound = true;
        details.push('✓ Monitoring integration detected');
        status = 'PASS';
        break;
      }
    }

    if (!monitoringFound) {
      details.push('⚠ No monitoring integration found');
    }

    return {
      name: 'Monitoring',
      status,
      description: 'Validates monitoring and observability setup',
      details
    };
  }

  private async checkLoadBalancing(): Promise<DeploymentCheck> {
    const details: string[] = [];
    let status: 'PASS' | 'FAIL' | 'WARNING' = 'WARNING';

    // Check for load balancing configuration
    const configFiles = [
      'nginx.conf',
      'k8s',
      'kubernetes',
      'ingress.yml'
    ];

    let lbFound = false;
    for (const config of configFiles) {
      if (existsSync(join(this.projectRoot, config))) {
        lbFound = true;
        details.push(`✓ Load balancing configuration found: ${config}`);
        status = 'PASS';
        break;
      }
    }

    if (!lbFound) {
      details.push('⚠ No load balancing configuration found');
    }

    return {
      name: 'Load Balancing',
      status,
      description: 'Validates load balancing configuration',
      details
    };
  }

  private async checkScaling(): Promise<DeploymentCheck> {
    const details: string[] = [];
    let status: 'PASS' | 'FAIL' | 'WARNING' = 'WARNING';

    // Check for auto-scaling configuration
    if (existsSync(join(this.projectRoot, 'k8s'))) {
      details.push('✓ Kubernetes configuration found');
      status = 'PASS';
    } else if (existsSync(join(this.projectRoot, 'docker-compose.yml'))) {
      const dockerCompose = readFileSync(join(this.projectRoot, 'docker-compose.yml'), 'utf8');
      if (dockerCompose.includes('replicas') || dockerCompose.includes('scale')) {
        details.push('✓ Docker Compose scaling configured');
        status = 'PASS';
      }
    }

    if (status === 'WARNING') {
      details.push('⚠ No auto-scaling configuration found');
    }

    return {
      name: 'Scaling',
      status,
      description: 'Validates auto-scaling capabilities',
      details
    };
  }

  private async checkBackup(): Promise<DeploymentCheck> {
    const details: string[] = [];
    let status: 'PASS' | 'FAIL' | 'WARNING' = 'WARNING';

    // Check for backup documentation or scripts
    const backupFiles = [
      'backup.sh',
      'scripts/backup',
      'docs/BACKUP.md'
    ];

    let backupFound = false;
    for (const backup of backupFiles) {
      if (existsSync(join(this.projectRoot, backup))) {
        backupFound = true;
        details.push(`✓ Backup configuration found: ${backup}`);
        status = 'PASS';
        break;
      }
    }

    if (!backupFound) {
      details.push('⚠ No backup strategy documented');
    }

    return {
      name: 'Backup Strategy',
      status,
      description: 'Validates backup and recovery procedures',
      details
    };
  }

  private findTypeScriptFiles(): string[] {
    const files: string[] = [];
    
    try {
      const { execSync } = require('child_process');
      const output = execSync('find . -name "*.ts" -not -path "./node_modules/*"', 
        { cwd: this.projectRoot, encoding: 'utf8' });
      return output.trim().split('\n').filter(f => f.length > 0);
    } catch {
      return [];
    }
  }

  private calculateScore(checks: DeploymentCheck[]): number {
    const weights = {
      'PASS': 100,
      'WARNING': 50,
      'FAIL': 0
    };

    const totalScore = checks.reduce((sum, check) => sum + weights[check.status], 0);
    return Math.round(totalScore / checks.length);
  }

  private hasBlockingIssues(checks: DeploymentCheck[]): boolean {
    return checks.some(check => 
      check.status === 'FAIL' && 
      (check.name.includes('Security') || check.name.includes('Health'))
    );
  }

  private getBlockingIssues(checks: DeploymentCheck[]): string[] {
    return checks
      .filter(check => check.status === 'FAIL')
      .map(check => `${check.name}: ${check.details.filter(d => d.includes('✗')).join(', ')}`);
  }

  private getWarnings(checks: DeploymentCheck[]): string[] {
    return checks
      .filter(check => check.status === 'WARNING')
      .map(check => `${check.name}: ${check.details.filter(d => d.includes('⚠')).join(', ')}`);
  }
}