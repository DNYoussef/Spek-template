#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

/**
 * Production Deployment Metrics Collection
 * Collects real-time deployment metrics for validation and monitoring
 */

class DeploymentMetrics {
  constructor(options = {}) {
    this.deploymentId = options.deploymentId;
    this.environment = options.environment;
    this.metricsInterval = 30000; // 30 seconds
    this.metricsHistory = [];
    this.alertThresholds = {
      errorRate: 5,
      responseTime: 1000,
      availability: 99.9,
      memoryUsage: 85,
      cpuUsage: 80
    };
    this.isRunning = false;
    this.metricsServer = null;
  }

  async startMetricsCollection() {
    console.log(`📊 Starting deployment metrics collection for ${this.deploymentId}`);

    try {
      // Create metrics directory
      const metricsDir = path.join(process.cwd(), '.claude', '.artifacts', 'metrics');
      fs.mkdirSync(metricsDir, { recursive: true });

      // Initialize metrics collection
      await this.initializeMetricsCollection();
      await this.startMetricsServer();
      await this.startPeriodicCollection();

      console.log('✅ Deployment metrics collection started successfully');
      return { status: 'started', metricsId: this.deploymentId };

    } catch (error) {
      console.error('❌ Failed to start deployment metrics collection:', error.message);
      throw error;
    }
  }

  async initializeMetricsCollection() {
    console.log('🚀 Initializing metrics collection...');

    const metricsConfig = {
      deployment_id: this.deploymentId,
      environment: this.environment,
      started_at: new Date().toISOString(),
      collection_interval: this.metricsInterval,
      metrics_types: [
        'http_requests',
        'response_times',
        'error_rates',
        'system_resources',
        'application_health',
        'database_performance',
        'cache_performance'
      ],
      endpoints: {
        health: process.env.APP_HEALTH_URL || 'http://localhost:3000/health',
        metrics: process.env.APP_METRICS_URL || 'http://localhost:3000/metrics',
        status: process.env.APP_STATUS_URL || 'http://localhost:3000/api/v1/status'
      }
    };

    // Write metrics configuration
    const configPath = path.join('.claude', '.artifacts', 'metrics', `config-${this.deploymentId}.json`);
    fs.writeFileSync(configPath, JSON.stringify(metricsConfig, null, 2));

    console.log('✅ Metrics collection configuration saved');
  }

  async startMetricsServer() {
    console.log('🌐 Starting metrics HTTP server...');

    const server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');

      if (req.url === '/metrics') {
        const latestMetrics = this.metricsHistory.slice(-10);
        res.writeHead(200);
        res.end(JSON.stringify({
          deployment_id: this.deploymentId,
          environment: this.environment,
          timestamp: new Date().toISOString(),
          latest_metrics: latestMetrics,
          summary: this.calculateMetricsSummary()
        }, null, 2));
      } else if (req.url === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({
          status: this.isRunning ? 'running' : 'stopped',
          uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          deployment_id: this.deploymentId
        }));
      } else if (req.url === '/summary') {
        res.writeHead(200);
        res.end(JSON.stringify(this.calculateMetricsSummary(), null, 2));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    const port = process.env.METRICS_PORT || 9091;
    server.listen(port, () => {
      console.log(`✅ Metrics server running on port ${port}`);
      this.metricsServer = server;
    });

    // Cleanup on exit
    process.on('SIGINT', () => {
      server.close();
      console.log('🛑 Metrics server stopped');
    });
  }

  async startPeriodicCollection() {
    console.log('⏰ Starting periodic metrics collection...');

    this.isRunning = true;
    const collectionInterval = setInterval(async () => {
      try {
        await this.collectCurrentMetrics();
      } catch (error) {
        console.error('❌ Error in periodic collection:', error.message);
      }
    }, this.metricsInterval);

    // Save collection process info
    const processInfo = {
      pid: process.pid,
      deployment_id: this.deploymentId,
      started_at: new Date().toISOString(),
      interval: this.metricsInterval
    };

    const pidPath = path.join('.claude', '.artifacts', 'metrics', `collection-${this.deploymentId}.pid`);
    fs.writeFileSync(pidPath, JSON.stringify(processInfo, null, 2));

    // Cleanup on exit
    process.on('SIGINT', () => {
      clearInterval(collectionInterval);
      this.isRunning = false;
      console.log('🛑 Periodic metrics collection stopped');
      process.exit(0);
    });

    console.log('✅ Periodic collection started');
  }

  async collectCurrentMetrics() {
    const timestamp = new Date().toISOString();
    const metrics = {
      deployment_id: this.deploymentId,
      timestamp,
      environment: this.environment,
      system: await this.collectSystemMetrics(),
      application: await this.collectApplicationMetrics(),
      performance: await this.collectPerformanceMetrics(),
      availability: await this.collectAvailabilityMetrics()
    };

    // Add to metrics history
    this.metricsHistory.push(metrics);

    // Keep only last 1000 metrics entries
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory = this.metricsHistory.slice(-1000);
    }

    // Write to file
    const metricsFile = path.join('.claude', '.artifacts', 'metrics', `metrics-${this.deploymentId}-${Date.now()}.json`);
    fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));

    // Check for alerts
    await this.checkAlertConditions(metrics);

    console.log(`📊 Metrics collected at ${timestamp}`);
    return metrics;
  }

  async collectSystemMetrics() {
    const system = {
      memory: { usage: 0, total: 0, free: 0 },
      cpu: { usage: 0, load: [] },
      disk: { usage: 0, available: 0 },
      network: { connections: 0, throughput: 0 }
    };

    try {
      // Memory metrics - Real system memory
      const memInfo = execSync('free -m 2>/dev/null', { encoding: 'utf8', timeout: 5000 });
      const memLines = memInfo.split('\n')[1].split(/\s+/);
      system.memory.total = parseInt(memLines[1]) || 0;
      system.memory.used = parseInt(memLines[2]) || 0;
      system.memory.free = parseInt(memLines[3]) || 0;
      system.memory.usage = system.memory.total > 0 ? (system.memory.used / system.memory.total) * 100 : 0;
    } catch (e) {
      console.warn('⚠️ Could not collect memory metrics');
    }

    try {
      // CPU metrics - Real system CPU
      const loadAvg = execSync('uptime 2>/dev/null | awk -F\'load average:\' \'{ print $2 }\'',
        { encoding: 'utf8', timeout: 5000 });
      const loads = loadAvg.trim().split(',').map(l => parseFloat(l.trim()));
      system.cpu.load = loads.slice(0, 3);
      system.cpu.usage = loads[0] || 0;
    } catch (e) {
      console.warn('⚠️ Could not collect CPU metrics');
    }

    try {
      // Disk metrics - Real disk usage
      const diskInfo = execSync('df -h / 2>/dev/null | tail -1', { encoding: 'utf8', timeout: 5000 });
      const diskParts = diskInfo.split(/\s+/);
      system.disk.usage = parseFloat(diskParts[4]?.replace('%', '')) || 0;
      system.disk.available = diskParts[3] || '0';
    } catch (e) {
      console.warn('⚠️ Could not collect disk metrics');
    }

    try {
      // Network connections - Real network metrics
      const netConnections = execSync('netstat -an 2>/dev/null | grep ESTABLISHED | wc -l',
        { encoding: 'utf8', timeout: 5000 });
      system.network.connections = parseInt(netConnections.trim()) || 0;
    } catch (e) {
      console.warn('⚠️ Could not collect network metrics');
    }

    return system;
  }

  async collectApplicationMetrics() {
    const application = {
      health_status: 'unknown',
      response_time: 0,
      error_rate: 0,
      request_count: 0,
      active_connections: 0
    };

    try {
      // Application health check - Real health endpoint
      const healthUrl = process.env.APP_HEALTH_URL || 'http://localhost:3000/health';
      const start = Date.now();

      await this.makeHttpRequest(healthUrl, { timeout: 5000 });

      application.health_status = 'healthy';
      application.response_time = Date.now() - start;
    } catch (error) {
      application.health_status = 'unhealthy';
      application.response_time = 5000; // Timeout value
      console.warn('⚠️ Application health check failed:', error.message);
    }

    try {
      // Try to get application metrics from metrics endpoint
      const metricsUrl = process.env.APP_METRICS_URL || 'http://localhost:3000/metrics';
      const metricsData = await this.makeHttpRequest(metricsUrl, { timeout: 3000 });

      // Parse Prometheus-style metrics if available
      if (typeof metricsData === 'string') {
        const requestCountMatch = metricsData.match(/http_requests_total (\d+)/);
        if (requestCountMatch) {
          application.request_count = parseInt(requestCountMatch[1]);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not collect application metrics endpoint data');
    }

    try {
      // Check application process metrics
      const processInfo = execSync(`ps aux | grep -E "(node|npm|yarn)" | grep -v grep | wc -l`,
        { encoding: 'utf8', timeout: 5000 });
      application.active_connections = parseInt(processInfo.trim()) || 0;
    } catch (e) {
      console.warn('⚠️ Could not collect process metrics');
    }

    return application;
  }

  async collectPerformanceMetrics() {
    const performance = {
      avg_response_time: 0,
      p95_response_time: 0,
      p99_response_time: 0,
      throughput: 0,
      concurrent_users: 0
    };

    try {
      // Collect response time samples
      const sampleUrls = [
        process.env.APP_HEALTH_URL || 'http://localhost:3000/health',
        process.env.APP_STATUS_URL || 'http://localhost:3000/api/v1/status'
      ];

      const responseTimes = [];

      for (const url of sampleUrls) {
        try {
          const start = Date.now();
          await this.makeHttpRequest(url, { timeout: 3000 });
          responseTimes.push(Date.now() - start);
        } catch (e) {
          responseTimes.push(3000); // Timeout value
        }
      }

      if (responseTimes.length > 0) {
        responseTimes.sort((a, b) => a - b);
        performance.avg_response_time = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        performance.p95_response_time = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
        performance.p99_response_time = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0;
      }
    } catch (error) {
      console.warn('⚠️ Could not collect performance metrics:', error.message);
    }

    return performance;
  }

  async collectAvailabilityMetrics() {
    const availability = {
      uptime_percentage: 100,
      failed_checks: 0,
      total_checks: 0,
      service_status: 'operational'
    };

    try {
      // Calculate availability from recent metrics
      const recentMetrics = this.metricsHistory.slice(-20); // Last 20 metrics
      availability.total_checks = recentMetrics.length;
      availability.failed_checks = recentMetrics.filter(m =>
        m.application?.health_status !== 'healthy'
      ).length;

      if (availability.total_checks > 0) {
        availability.uptime_percentage =
          ((availability.total_checks - availability.failed_checks) / availability.total_checks) * 100;
      }

      // Determine service status
      if (availability.uptime_percentage >= 99.9) {
        availability.service_status = 'operational';
      } else if (availability.uptime_percentage >= 95) {
        availability.service_status = 'degraded';
      } else {
        availability.service_status = 'outage';
      }
    } catch (error) {
      console.warn('⚠️ Could not calculate availability metrics:', error.message);
    }

    return availability;
  }

  async checkAlertConditions(metrics) {
    const alerts = [];

    // Check error rate
    if (metrics.application.health_status === 'unhealthy') {
      alerts.push({
        type: 'application_health',
        severity: 'critical',
        message: 'Application health check failed',
        value: metrics.application.health_status
      });
    }

    // Check response time
    if (metrics.application.response_time > this.alertThresholds.responseTime) {
      alerts.push({
        type: 'response_time',
        severity: 'warning',
        message: `High response time: ${metrics.application.response_time}ms`,
        value: metrics.application.response_time
      });
    }

    // Check memory usage
    if (metrics.system.memory.usage > this.alertThresholds.memoryUsage) {
      alerts.push({
        type: 'memory_usage',
        severity: 'warning',
        message: `High memory usage: ${metrics.system.memory.usage.toFixed(1)}%`,
        value: metrics.system.memory.usage
      });
    }

    // Check availability
    if (metrics.availability.uptime_percentage < this.alertThresholds.availability) {
      alerts.push({
        type: 'availability',
        severity: 'critical',
        message: `Low availability: ${metrics.availability.uptime_percentage.toFixed(2)}%`,
        value: metrics.availability.uptime_percentage
      });
    }

    if (alerts.length > 0) {
      console.log('🚨 Alerts triggered:');
      alerts.forEach(alert => {
        console.log(`  ${alert.severity.toUpperCase()}: ${alert.message}`);
      });

      // Write alerts to file
      const alertsFile = path.join('.claude', '.artifacts', 'metrics', `alerts-${this.deploymentId}-${Date.now()}.json`);
      fs.writeFileSync(alertsFile, JSON.stringify({
        deployment_id: this.deploymentId,
        timestamp: new Date().toISOString(),
        alerts
      }, null, 2));
    }

    return alerts;
  }

  calculateMetricsSummary() {
    if (this.metricsHistory.length === 0) {
      return { status: 'no_data' };
    }

    const recent = this.metricsHistory.slice(-10);
    const summary = {
      deployment_id: this.deploymentId,
      period: {
        start: recent[0]?.timestamp,
        end: recent[recent.length - 1]?.timestamp,
        count: recent.length
      },
      averages: {
        response_time: 0,
        memory_usage: 0,
        cpu_usage: 0,
        uptime_percentage: 0
      },
      status: {
        health: 'unknown',
        availability: 'unknown',
        performance: 'unknown'
      }
    };

    // Calculate averages
    if (recent.length > 0) {
      summary.averages.response_time = recent.reduce((sum, m) =>
        sum + (m.application?.response_time || 0), 0) / recent.length;
      summary.averages.memory_usage = recent.reduce((sum, m) =>
        sum + (m.system?.memory?.usage || 0), 0) / recent.length;
      summary.averages.cpu_usage = recent.reduce((sum, m) =>
        sum + (m.system?.cpu?.usage || 0), 0) / recent.length;
      summary.averages.uptime_percentage = recent.reduce((sum, m) =>
        sum + (m.availability?.uptime_percentage || 0), 0) / recent.length;

      // Determine overall status
      const healthyCount = recent.filter(m => m.application?.health_status === 'healthy').length;
      summary.status.health = healthyCount / recent.length > 0.8 ? 'healthy' : 'unhealthy';
      summary.status.availability = summary.averages.uptime_percentage > 95 ? 'good' : 'poor';
      summary.status.performance = summary.averages.response_time < 1000 ? 'good' : 'slow';
    }

    return summary;
  }

  async makeHttpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const timeout = options.timeout || 5000;
      const urlObj = new URL(url);
      const httpModule = urlObj.protocol === 'https:' ? https : http;

      const req = httpModule.get(url, { timeout }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
        });
      });

      req.setTimeout(timeout, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.on('error', reject);
    });
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
    console.error('❌ Usage: node start-deployment-metrics.js --deployment-id <id> --environment <env>');
    process.exit(1);
  }

  const metrics = new DeploymentMetrics({
    deploymentId: options['deployment-id'],
    environment: options['environment']
  });

  metrics.startMetricsCollection()
    .then(result => {
      console.log('✅ Deployment metrics collection started:', result);
      // Keep process running
    })
    .catch(error => {
      console.error('❌ Deployment metrics collection failed:', error.message);
      process.exit(1);
    });
}

if (require.main === module) {
  main();
}

module.exports = DeploymentMetrics;