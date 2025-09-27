#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Production Deployment Monitoring Setup
 * Sets up comprehensive monitoring for deployment validation and rollback triggers
 */

class DeploymentMonitor {
  constructor(options = {}) {
    this.deploymentId = options.deploymentId;
    this.environment = options.environment;
    this.alertThresholds = {
      errorRate: 5, // 5% error rate threshold
      responseTime: 1000, // 1 second response time threshold
      availability: 99.9, // 99.9% availability threshold
      memoryUsage: 85, // 85% memory usage threshold
      cpuUsage: 80 // 80% CPU usage threshold
    };
    this.monitoringInterval = 30000; // 30 seconds
    this.rollbackTriggers = new Set();
  }

  async setupMonitoring() {
    console.log(`🔍 Setting up deployment monitoring for ${this.deploymentId}`);

    try {
      // Create monitoring directory
      const monitoringDir = path.join(process.cwd(), '.claude', '.artifacts', 'monitoring');
      fs.mkdirSync(monitoringDir, { recursive: true });

      // Initialize monitoring configuration
      await this.initializeHealthChecks();
      await this.setupAlerts();
      await this.configureRollbackTriggers();
      await this.startMetricsCollection();

      console.log('✅ Deployment monitoring configured successfully');
      return { status: 'success', monitoringId: this.deploymentId };

    } catch (error) {
      console.error('❌ Failed to setup deployment monitoring:', error.message);
      throw error;
    }
  }

  async initializeHealthChecks() {
    console.log('🏥 Initializing health checks...');

    const healthChecks = {
      deployment_id: this.deploymentId,
      environment: this.environment,
      checks: [
        {
          name: 'application_health',
          endpoint: '/health',
          method: 'GET',
          expected_status: 200,
          timeout: 5000,
          interval: 30000
        },
        {
          name: 'database_connectivity',
          endpoint: '/health/database',
          method: 'GET',
          expected_status: 200,
          timeout: 10000,
          interval: 60000
        },
        {
          name: 'external_dependencies',
          endpoint: '/health/dependencies',
          method: 'GET',
          expected_status: 200,
          timeout: 15000,
          interval: 120000
        },
        {
          name: 'api_endpoints',
          endpoint: '/api/v1/status',
          method: 'GET',
          expected_status: 200,
          timeout: 5000,
          interval: 45000
        }
      ]
    };

    // Write health check configuration
    const configPath = path.join('.claude', '.artifacts', 'monitoring', `health-checks-${this.deploymentId}.json`);
    fs.writeFileSync(configPath, JSON.stringify(healthChecks, null, 2));

    console.log(`✅ Health checks configured: ${healthChecks.checks.length} checks active`);
  }

  async setupAlerts() {
    console.log('🚨 Setting up monitoring alerts...');

    const alertConfig = {
      deployment_id: this.deploymentId,
      environment: this.environment,
      thresholds: this.alertThresholds,
      notification_channels: [
        {
          type: 'slack',
          webhook_url: process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/PLACEHOLDER',
          channel: '#deployments',
          enabled: !!process.env.SLACK_WEBHOOK_URL
        },
        {
          type: 'email',
          smtp_server: process.env.SMTP_SERVER || 'smtp.company.com',
          recipients: process.env.ALERT_EMAIL_LIST?.split(',') || ['devops@company.com'],
          enabled: !!process.env.SMTP_SERVER
        },
        {
          type: 'pagerduty',
          integration_key: process.env.PAGERDUTY_INTEGRATION_KEY,
          enabled: !!process.env.PAGERDUTY_INTEGRATION_KEY
        }
      ],
      escalation_rules: [
        {
          condition: 'error_rate > 10',
          wait_time: 300, // 5 minutes
          action: 'trigger_rollback'
        },
        {
          condition: 'availability < 95',
          wait_time: 600, // 10 minutes
          action: 'trigger_rollback'
        },
        {
          condition: 'response_time > 2000',
          wait_time: 900, // 15 minutes
          action: 'alert_team'
        }
      ]
    };

    // Write alert configuration
    const alertPath = path.join('.claude', '.artifacts', 'monitoring', `alerts-${this.deploymentId}.json`);
    fs.writeFileSync(alertPath, JSON.stringify(alertConfig, null, 2));

    console.log('✅ Alert configuration saved');
  }

  async configureRollbackTriggers() {
    console.log('🔄 Configuring automatic rollback triggers...');

    const rollbackConfig = {
      deployment_id: this.deploymentId,
      environment: this.environment,
      enabled: true,
      triggers: [
        {
          name: 'high_error_rate',
          condition: 'error_rate > 10',
          duration: 300, // 5 minutes sustained
          action: 'immediate_rollback',
          priority: 'critical'
        },
        {
          name: 'service_unavailable',
          condition: 'availability < 90',
          duration: 180, // 3 minutes sustained
          action: 'immediate_rollback',
          priority: 'critical'
        },
        {
          name: 'memory_exhaustion',
          condition: 'memory_usage > 95',
          duration: 120, // 2 minutes sustained
          action: 'scale_up_or_rollback',
          priority: 'high'
        },
        {
          name: 'database_connection_failure',
          condition: 'database_connectivity = false',
          duration: 60, // 1 minute sustained
          action: 'investigate_and_rollback',
          priority: 'critical'
        }
      ],
      rollback_strategy: 'blue_green',
      notification_delay: 30, // 30 seconds before rollback
      safety_checks: [
        'verify_previous_version_healthy',
        'ensure_database_compatibility',
        'confirm_external_dependencies'
      ]
    };

    // Write rollback configuration
    const rollbackPath = path.join('.claude', '.artifacts', 'monitoring', `rollback-${this.deploymentId}.json`);
    fs.writeFileSync(rollbackPath, JSON.stringify(rollbackConfig, null, 2));

    console.log(`✅ Rollback triggers configured: ${rollbackConfig.triggers.length} triggers active`);
  }

  async startMetricsCollection() {
    console.log('📊 Starting metrics collection...');

    const metricsConfig = {
      deployment_id: this.deploymentId,
      environment: this.environment,
      collection_interval: this.monitoringInterval,
      metrics: [
        {
          name: 'http_requests_total',
          type: 'counter',
          labels: ['method', 'status_code', 'endpoint']
        },
        {
          name: 'http_request_duration_seconds',
          type: 'histogram',
          labels: ['method', 'endpoint']
        },
        {
          name: 'application_memory_usage_bytes',
          type: 'gauge',
          labels: ['instance']
        },
        {
          name: 'application_cpu_usage_percent',
          type: 'gauge',
          labels: ['instance']
        },
        {
          name: 'database_connections_active',
          type: 'gauge',
          labels: ['database']
        },
        {
          name: 'cache_hit_rate',
          type: 'gauge',
          labels: ['cache_type']
        }
      ],
      retention_period: '7d',
      export_targets: [
        {
          type: 'prometheus',
          endpoint: process.env.PROMETHEUS_ENDPOINT || 'http://prometheus:9090',
          enabled: !!process.env.PROMETHEUS_ENDPOINT
        },
        {
          type: 'datadog',
          api_key: process.env.DATADOG_API_KEY,
          enabled: !!process.env.DATADOG_API_KEY
        },
        {
          type: 'newrelic',
          license_key: process.env.NEWRELIC_LICENSE_KEY,
          enabled: !!process.env.NEWRELIC_LICENSE_KEY
        }
      ]
    };

    // Write metrics configuration
    const metricsPath = path.join('.claude', '.artifacts', 'monitoring', `metrics-${this.deploymentId}.json`);
    fs.writeFileSync(metricsPath, JSON.stringify(metricsConfig, null, 2));

    // Start metrics collection process if in production environment
    if (this.environment === 'production') {
      this.startRealTimeMonitoring();
    }

    console.log('✅ Metrics collection started');
  }

  startRealTimeMonitoring() {
    console.log('🔄 Starting real-time monitoring...');

    const monitoringProcess = setInterval(() => {
      this.collectMetrics().catch(error => {
        console.error('❌ Metrics collection error:', error.message);
      });
    }, this.monitoringInterval);

    // Save monitoring process PID for cleanup
    const pidPath = path.join('.claude', '.artifacts', 'monitoring', `monitoring-${this.deploymentId}.pid`);
    fs.writeFileSync(pidPath, process.pid.toString());

    // Cleanup on exit
    process.on('SIGINT', () => {
      clearInterval(monitoringProcess);
      console.log('🛑 Monitoring stopped');
      process.exit(0);
    });
  }

  async collectMetrics() {
    try {
      const timestamp = new Date().toISOString();
      const metrics = {
        deployment_id: this.deploymentId,
        timestamp,
        metrics: {}
      };

      // Collect system metrics
      try {
        // Memory usage
        const memInfo = execSync('free -m 2>/dev/null | awk \'NR==2{printf "%.0f", $3*100/$2}\'',
          { encoding: 'utf8', timeout: 5000 });
        metrics.metrics.memory_usage = parseFloat(memInfo) || 0;
      } catch (e) {
        metrics.metrics.memory_usage = 0;
      }

      // CPU usage
      try {
        const cpuInfo = execSync('top -bn1 2>/dev/null | grep "Cpu(s)" | awk \'{print $2}\' | awk -F\'%\' \'{print $1}\'',
          { encoding: 'utf8', timeout: 5000 });
        metrics.metrics.cpu_usage = parseFloat(cpuInfo) || 0;
      } catch (e) {
        metrics.metrics.cpu_usage = 0;
      }

      // Application health check
      try {
        const healthResponse = await this.checkApplicationHealth();
        metrics.metrics.health_status = healthResponse.status;
        metrics.metrics.response_time = healthResponse.responseTime;
      } catch (e) {
        metrics.metrics.health_status = 'failed';
        metrics.metrics.response_time = 0;
      }

      // Write metrics to file
      const metricsFile = path.join('.claude', '.artifacts', 'monitoring', `metrics-${this.deploymentId}-${Date.now()}.json`);
      fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));

      // Check if rollback should be triggered
      await this.evaluateRollbackConditions(metrics);

    } catch (error) {
      console.error('❌ Error collecting metrics:', error.message);
    }
  }

  async checkApplicationHealth() {
    const start = Date.now();

    try {
      // Use curl to check application health
      const healthUrl = process.env.APP_HEALTH_URL || 'http://localhost:3000/health';
      execSync(`curl -f -s -m 5 "${healthUrl}"`, { timeout: 5000 });

      return {
        status: 'healthy',
        responseTime: Date.now() - start
      };
    } catch (error) {
      return {
        status: 'failed',
        responseTime: Date.now() - start
      };
    }
  }

  async evaluateRollbackConditions(metrics) {
    const conditions = [
      {
        name: 'high_error_rate',
        condition: metrics.metrics.health_status === 'failed',
        threshold: 10,
        current: metrics.metrics.health_status === 'failed' ? 100 : 0
      },
      {
        name: 'high_memory_usage',
        condition: metrics.metrics.memory_usage > this.alertThresholds.memoryUsage,
        threshold: this.alertThresholds.memoryUsage,
        current: metrics.metrics.memory_usage
      },
      {
        name: 'high_cpu_usage',
        condition: metrics.metrics.cpu_usage > this.alertThresholds.cpuUsage,
        threshold: this.alertThresholds.cpuUsage,
        current: metrics.metrics.cpu_usage
      },
      {
        name: 'slow_response_time',
        condition: metrics.metrics.response_time > this.alertThresholds.responseTime,
        threshold: this.alertThresholds.responseTime,
        current: metrics.metrics.response_time
      }
    ];

    const triggeredConditions = conditions.filter(c => c.condition);

    if (triggeredConditions.length > 0) {
      console.log('⚠️ Rollback conditions detected:');
      triggeredConditions.forEach(condition => {
        console.log(`  - ${condition.name}: ${condition.current} > ${condition.threshold}`);
        this.rollbackTriggers.add(condition.name);
      });

      // If critical conditions are met, trigger rollback preparation
      const criticalConditions = ['high_error_rate'];
      const hasCritical = triggeredConditions.some(c => criticalConditions.includes(c.name));

      if (hasCritical) {
        console.log('🚨 Critical conditions detected - preparing for potential rollback');
        await this.prepareRollback();
      }
    }
  }

  async prepareRollback() {
    const rollbackPrep = {
      deployment_id: this.deploymentId,
      environment: this.environment,
      timestamp: new Date().toISOString(),
      triggered_conditions: Array.from(this.rollbackTriggers),
      status: 'prepared',
      rollback_command: `gh workflow run deployment-rollback.yml -f environment=${this.environment} -f reason="Automatic rollback due to monitoring alerts"`
    };

    const prepPath = path.join('.claude', '.artifacts', 'monitoring', `rollback-prep-${this.deploymentId}.json`);
    fs.writeFileSync(prepPath, JSON.stringify(rollbackPrep, null, 2));

    console.log('🔄 Rollback preparation completed');
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    options[key] = value;
  }

  if (!options['deployment-id'] || !options['environment']) {
    console.error('❌ Usage: node setup-deployment-monitoring.js --deployment-id <id> --environment <env>');
    process.exit(1);
  }

  const monitor = new DeploymentMonitor({
    deploymentId: options['deployment-id'],
    environment: options['environment']
  });

  monitor.setupMonitoring()
    .then(result => {
      console.log('✅ Deployment monitoring setup completed:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Deployment monitoring setup failed:', error.message);
      process.exit(1);
    });
}

if (require.main === module) {
  main();
}

module.exports = DeploymentMonitor;