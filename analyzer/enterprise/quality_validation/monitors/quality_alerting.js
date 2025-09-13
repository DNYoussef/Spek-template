/**
 * Quality Alerting System
 * 
 * Real-time alerting and notification system for quality validation events
 * with configurable thresholds and multi-channel delivery.
 */

class QualityAlerting {
  constructor() {
    this.alertChannels = this.initializeAlertChannels();
    this.alertRules = this.initializeAlertRules();
    this.alertHistory = new Map();
    this.suppressionManager = new AlertSuppressionManager();
    this.escalationManager = new AlertEscalationManager();
    this.notificationDelivery = new NotificationDelivery();
  }

  async sendQualityAlert(alertType, alertData) {
    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Create alert object
      const alert = {
        id: alertId,
        type: alertType,
        timestamp: new Date().toISOString(),
        data: alertData,
        severity: this.determineSeverity(alertType, alertData),
        status: 'ACTIVE',
        source: 'Quality Validation System'
      };

      // Check suppression rules
      if (await this.suppressionManager.shouldSuppress(alert)) {
        console.log(`Alert suppressed: ${alertId}`);
        return { alertId, status: 'SUPPRESSED' };
      }

      // Apply alert rules and enrichment
      const enrichedAlert = await this.enrichAlert(alert);
      
      // Store alert in history
      this.alertHistory.set(alertId, enrichedAlert);

      // Send notifications
      await this.deliverAlert(enrichedAlert);

      // Handle escalation if needed
      await this.escalationManager.scheduleEscalation(enrichedAlert);

      console.log(`Quality alert sent: ${alertId} - ${alertType}`);
      
      return { alertId, status: 'SENT', alert: enrichedAlert };
    } catch (error) {
      console.error(`Failed to send quality alert: ${error.message}`);
      throw error;
    }
  }

  async sendComplianceAlert(alertType, alertData) {
    return this.sendQualityAlert(`COMPLIANCE_${alertType}`, {
      ...alertData,
      category: 'compliance'
    });
  }

  async sendTheaterAlert(alertType, alertData) {
    return this.sendQualityAlert(`THEATER_${alertType}`, {
      ...alertData,
      category: 'theater'
    });
  }

  async sendPerformanceAlert(alertType, alertData) {
    return this.sendQualityAlert(`PERFORMANCE_${alertType}`, {
      ...alertData,
      category: 'performance'
    });
  }

  async getRecentAlerts(limit = 10, filter = {}) {
    const alerts = Array.from(this.alertHistory.values())
      .filter(alert => this.matchesFilter(alert, filter))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return alerts;
  }

  async getAlertsByCategory(category, limit = 20) {
    return this.getRecentAlerts(limit, { category });
  }

  async getAlertsBySeverity(severity, limit = 20) {
    return this.getRecentAlerts(limit, { severity });
  }

  async acknowledgeAlert(alertId, userId, reason) {
    const alert = this.alertHistory.get(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgmentReason = reason;

    // Cancel any pending escalations
    await this.escalationManager.cancelEscalation(alertId);

    console.log(`Alert acknowledged: ${alertId} by ${userId}`);
    
    return alert;
  }

  async resolveAlert(alertId, userId, resolution) {
    const alert = this.alertHistory.get(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    alert.status = 'RESOLVED';
    alert.resolvedBy = userId;
    alert.resolvedAt = new Date().toISOString();
    alert.resolution = resolution;

    console.log(`Alert resolved: ${alertId} by ${userId}`);
    
    return alert;
  }

  determineSeverity(alertType, alertData) {
    const severityRules = {
      'QUALITY_GATE_VIOLATIONS': (data) => {
        const violations = data.violations?.length || 0;
        if (violations >= 5) return 'CRITICAL';
        if (violations >= 3) return 'HIGH';
        if (violations >= 1) return 'MEDIUM';
        return 'LOW';
      },
      'NASA_COMPLIANCE_BELOW_TARGET': (data) => {
        const score = data.currentScore || 0;
        if (score < 80) return 'CRITICAL';
        if (score < 90) return 'HIGH';
        if (score < 95) return 'MEDIUM';
        return 'LOW';
      },
      'THEATER_PATTERN_DETECTED': (data) => {
        const patterns = data.patterns?.length || 0;
        if (patterns >= 10) return 'HIGH';
        if (patterns >= 5) return 'MEDIUM';
        return 'LOW';
      },
      'PERFORMANCE_OVERHEAD_EXCEEDED': (data) => {
        const overhead = data.overhead || 0;
        if (overhead > 5.0) return 'CRITICAL';
        if (overhead > 2.0) return 'HIGH';
        if (overhead > 1.1) return 'MEDIUM';
        return 'LOW';
      }
    };

    const rule = severityRules[alertType];
    return rule ? rule(alertData) : 'MEDIUM';
  }

  async enrichAlert(alert) {
    const enriched = { ...alert };

    // Add alert rule information
    const rule = this.alertRules[alert.type];
    if (rule) {
      enriched.rule = rule;
      enriched.description = rule.description;
      enriched.recommendedActions = rule.actions;
    }

    // Add context information
    enriched.context = await this.gatherAlertContext(alert);

    // Add notification configuration
    enriched.notifications = this.getNotificationConfig(alert);

    return enriched;
  }

  async gatherAlertContext(alert) {
    const context = {
      environment: process.env.NODE_ENV || 'development',
      timestamp: alert.timestamp,
      source: alert.source,
      alertCount: this.alertHistory.size
    };

    // Add type-specific context
    switch (alert.type) {
      case 'QUALITY_GATE_VIOLATIONS':
        context.qualityGateContext = await this.getQualityGateContext(alert.data);
        break;
      case 'NASA_COMPLIANCE_BELOW_TARGET':
        context.complianceContext = await this.getComplianceContext(alert.data);
        break;
      case 'THEATER_PATTERN_DETECTED':
        context.theaterContext = await this.getTheaterContext(alert.data);
        break;
      case 'PERFORMANCE_OVERHEAD_EXCEEDED':
        context.performanceContext = await this.getPerformanceContext(alert.data);
        break;
    }

    return context;
  }

  getNotificationConfig(alert) {
    const config = {
      channels: [],
      urgency: this.mapSeverityToUrgency(alert.severity),
      retryPolicy: this.getRetryPolicy(alert.severity)
    };

    // Determine channels based on severity and type
    switch (alert.severity) {
      case 'CRITICAL':
        config.channels = ['email', 'slack', 'webhook'];
        break;
      case 'HIGH':
        config.channels = ['email', 'slack'];
        break;
      case 'MEDIUM':
        config.channels = ['slack'];
        break;
      case 'LOW':
        config.channels = ['webhook'];
        break;
    }

    return config;
  }

  async deliverAlert(alert) {
    const notifications = alert.notifications;
    const deliveryPromises = [];

    for (const channel of notifications.channels) {
      const channelHandler = this.alertChannels[channel];
      if (channelHandler) {
        deliveryPromises.push(
          channelHandler.send(alert).catch(error => {
            console.error(`Failed to send alert via ${channel}: ${error.message}`);
            return { channel, status: 'FAILED', error: error.message };
          })
        );
      }
    }

    const deliveryResults = await Promise.all(deliveryPromises);
    
    // Log delivery results
    alert.deliveryResults = deliveryResults;
    
    return deliveryResults;
  }

  matchesFilter(alert, filter) {
    if (filter.category && alert.data?.category !== filter.category) return false;
    if (filter.severity && alert.severity !== filter.severity) return false;
    if (filter.type && alert.type !== filter.type) return false;
    if (filter.status && alert.status !== filter.status) return false;
    
    return true;
  }

  mapSeverityToUrgency(severity) {
    const mapping = {
      'CRITICAL': 'immediate',
      'HIGH': 'high',
      'MEDIUM': 'normal',
      'LOW': 'low'
    };
    return mapping[severity] || 'normal';
  }

  getRetryPolicy(severity) {
    const policies = {
      'CRITICAL': { maxRetries: 5, backoffMs: 30000 },
      'HIGH': { maxRetries: 3, backoffMs: 60000 },
      'MEDIUM': { maxRetries: 2, backoffMs: 300000 },
      'LOW': { maxRetries: 1, backoffMs: 600000 }
    };
    return policies[severity] || policies['MEDIUM'];
  }

  // Context gathering methods
  async getQualityGateContext(data) {
    return {
      totalViolations: data.violations?.length || 0,
      failedGates: data.violations?.map(v => v.gate) || [],
      project: data.project
    };
  }

  async getComplianceContext(data) {
    return {
      currentScore: data.currentScore,
      targetScore: data.targetScore,
      gap: data.targetScore - data.currentScore,
      criticalIssues: data.criticalIssues?.length || 0
    };
  }

  async getTheaterContext(data) {
    return {
      patternCount: data.patterns?.length || 0,
      patternTypes: data.patterns?.map(p => p.type) || [],
      severity: data.severity
    };
  }

  async getPerformanceContext(data) {
    return {
      currentOverhead: data.overhead,
      threshold: data.threshold || 1.1,
      impact: data.impact || 'unknown'
    };
  }

  initializeAlertChannels() {
    return {
      email: new EmailAlertChannel(),
      slack: new SlackAlertChannel(),
      webhook: new WebhookAlertChannel(),
      console: new ConsoleAlertChannel()
    };
  }

  initializeAlertRules() {
    return {
      'QUALITY_GATE_VIOLATIONS': {
        description: 'One or more quality gates have failed',
        actions: [
          'Review failing quality gates',
          'Fix violations before proceeding',
          'Update thresholds if necessary'
        ],
        escalationTimeMs: 3600000 // 1 hour
      },
      'NASA_COMPLIANCE_BELOW_TARGET': {
        description: 'NASA POT10 compliance score below target threshold',
        actions: [
          'Review compliance violations',
          'Address critical issues immediately',
          'Update compliance procedures'
        ],
        escalationTimeMs: 1800000 // 30 minutes
      },
      'THEATER_PATTERN_DETECTED': {
        description: 'Performance theater patterns detected in codebase',
        actions: [
          'Review identified theater patterns',
          'Remove vanity metrics',
          'Focus on meaningful quality measures'
        ],
        escalationTimeMs: 7200000 // 2 hours
      },
      'PERFORMANCE_OVERHEAD_EXCEEDED': {
        description: 'Quality validation performance overhead exceeded threshold',
        actions: [
          'Review monitoring configuration',
          'Optimize validation processes',
          'Consider reducing monitoring frequency'
        ],
        escalationTimeMs: 3600000 // 1 hour
      }
    };
  }
}

class AlertSuppressionManager {
  constructor() {
    this.suppressionRules = new Map();
    this.suppressedAlerts = new Map();
  }

  async shouldSuppress(alert) {
    // Check for duplicate alerts within time window
    const duplicateWindow = 300000; // 5 minutes
    const recentAlerts = Array.from(this.suppressedAlerts.values())
      .filter(a => 
        a.type === alert.type && 
        Date.now() - new Date(a.timestamp).getTime() < duplicateWindow
      );

    if (recentAlerts.length > 0) {
      return true;
    }

    // Check custom suppression rules
    for (const [ruleId, rule] of this.suppressionRules) {
      if (await rule.shouldSuppress(alert)) {
        return true;
      }
    }

    return false;
  }

  addSuppressionRule(ruleId, rule) {
    this.suppressionRules.set(ruleId, rule);
  }

  removeSuppressionRule(ruleId) {
    this.suppressionRules.delete(ruleId);
  }
}

class AlertEscalationManager {
  constructor() {
    this.escalations = new Map();
    this.escalationTimers = new Map();
  }

  async scheduleEscalation(alert) {
    const rule = alert.rule;
    if (!rule || !rule.escalationTimeMs) return;

    const escalationId = `escalation-${alert.id}`;
    
    const timer = setTimeout(async () => {
      await this.escalateAlert(alert);
    }, rule.escalationTimeMs);

    this.escalationTimers.set(escalationId, timer);
    this.escalations.set(escalationId, {
      alertId: alert.id,
      scheduledAt: new Date().toISOString(),
      escalationTimeMs: rule.escalationTimeMs
    });
  }

  async cancelEscalation(alertId) {
    const escalationId = `escalation-${alertId}`;
    const timer = this.escalationTimers.get(escalationId);
    
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(escalationId);
      this.escalations.delete(escalationId);
    }
  }

  async escalateAlert(alert) {
    console.log(`Escalating alert: ${alert.id}`);
    
    // Increase severity if not already critical
    if (alert.severity !== 'CRITICAL') {
      const severityLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const currentIndex = severityLevels.indexOf(alert.severity);
      alert.severity = severityLevels[Math.min(currentIndex + 1, severityLevels.length - 1)];
    }

    // Send escalation notification
    await this.sendEscalationNotification(alert);
  }

  async sendEscalationNotification(alert) {
    // Send to escalation channels (email, phone, etc.)
    console.log(`Sending escalation notification for alert: ${alert.id}`);
  }
}

class NotificationDelivery {
  async deliver(alert, channel) {
    // Implementation would handle actual delivery
    console.log(`Delivering alert ${alert.id} via ${channel}`);
  }
}

// Alert Channel Implementations
class EmailAlertChannel {
  async send(alert) {
    console.log(`[EMAIL] Alert: ${alert.type} - ${alert.description || 'No description'}`);
    return { channel: 'email', status: 'SUCCESS', timestamp: new Date().toISOString() };
  }
}

class SlackAlertChannel {
  async send(alert) {
    console.log(`[SLACK] Alert: ${alert.type} - ${alert.description || 'No description'}`);
    return { channel: 'slack', status: 'SUCCESS', timestamp: new Date().toISOString() };
  }
}

class WebhookAlertChannel {
  async send(alert) {
    console.log(`[WEBHOOK] Alert: ${alert.type} - ${alert.description || 'No description'}`);
    return { channel: 'webhook', status: 'SUCCESS', timestamp: new Date().toISOString() };
  }
}

class ConsoleAlertChannel {
  async send(alert) {
    const severityColors = {
      'CRITICAL': '\x1b[41m', // Red background
      'HIGH': '\x1b[31m',     // Red text
      'MEDIUM': '\x1b[33m',   // Yellow text
      'LOW': '\x1b[36m'       // Cyan text
    };
    
    const color = severityColors[alert.severity] || '\x1b[0m';
    const reset = '\x1b[0m';
    
    console.log(`${color}[ALERT ${alert.severity}] ${alert.type}${reset}`);
    console.log(`  Description: ${alert.description || 'No description'}`);
    console.log(`  Timestamp: ${alert.timestamp}`);
    console.log(`  Data: ${JSON.stringify(alert.data, null, 2)}`);
    
    return { channel: 'console', status: 'SUCCESS', timestamp: new Date().toISOString() };
  }
}

module.exports = QualityAlerting;