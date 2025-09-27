import { EventEmitter } from 'events';

export interface Alert {
  id: string;
  migrationId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: Date;
  source: string;
  metadata: Record<string, any>;
  status: AlertStatus;
  acknowledgments: AlertAcknowledgment[];
  escalations: AlertEscalation[];
  resolutionSteps: string[];
  relatedAlerts: string[];
  tags: string[];
}

export type AlertType =
  | 'threshold_violation'
  | 'health_check_failure'
  | 'migration_failure'
  | 'performance_degradation'
  | 'security_incident'
  | 'resource_exhaustion'
  | 'network_connectivity'
  | 'data_integrity'
  | 'compliance_violation'
  | 'custom';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'suppressed' | 'expired';

export interface AlertAcknowledgment {
  acknowledgedBy: string;
  acknowledgedAt: Date;
  comment?: string;
}

export interface AlertEscalation {
  level: number;
  escalatedTo: string;
  escalatedAt: Date;
  reason: string;
  acknowledged: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  severity: AlertSeverity;
  enabled: boolean;
  throttleMinutes: number;
  escalationRules: EscalationRule[];
  notificationChannels: string[];
  suppressionRules: SuppressionRule[];
  tags: string[];
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'contains' | 'not_contains';
  threshold: number | string;
  timeWindowMs: number;
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count' | 'percentile';
  percentileValue?: number;
  consecutiveViolations?: number;
}

export interface EscalationRule {
  level: number;
  delayMinutes: number;
  notificationChannels: string[];
  condition?: AlertCondition;
  assignTo?: string;
}

export interface SuppressionRule {
  id: string;
  condition: AlertCondition;
  duration: number;
  reason: string;
  enabled: boolean;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: NotificationChannelType;
  configuration: Record<string, any>;
  enabled: boolean;
  rateLimit?: {
    maxPerHour: number;
    maxPerDay: number;
  };
}

export type NotificationChannelType = 'email' | 'slack' | 'webhook' | 'sms' | 'pagerduty' | 'teams' | 'custom';

export interface NotificationMessage {
  alertId: string;
  channelId: string;
  subject: string;
  content: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  timestamp: Date;
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed' | 'retrying';
  retryCount: number;
  metadata: Record<string, any>;
}

export abstract class NotificationProvider {
  abstract send(channel: NotificationChannel, message: NotificationMessage): Promise<boolean>;
  abstract getProviderType(): NotificationChannelType;
  abstract validateConfiguration(config: Record<string, any>): boolean;
}

export class EmailNotificationProvider extends NotificationProvider {
  async send(channel: NotificationChannel, message: NotificationMessage): Promise<boolean> {
    try {
      const emailConfig = channel.configuration;

      await this.sendEmail({
        to: emailConfig.recipients,
        subject: message.subject,
        body: message.content,
        priority: message.priority
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  private async sendEmail(emailData: any): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  getProviderType(): NotificationChannelType {
    return 'email';
  }

  validateConfiguration(config: Record<string, any>): boolean {
    return config.recipients && Array.isArray(config.recipients) && config.recipients.length > 0;
  }
}

export class SlackNotificationProvider extends NotificationProvider {
  async send(channel: NotificationChannel, message: NotificationMessage): Promise<boolean> {
    try {
      const slackConfig = channel.configuration;

      await this.sendSlackMessage({
        webhook: slackConfig.webhookUrl,
        channel: slackConfig.channel,
        message: this.formatSlackMessage(message),
        username: 'Migration Alert Bot'
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  private async sendSlackMessage(slackData: any): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  private formatSlackMessage(message: NotificationMessage): any {
    const color = this.getSeverityColor(message.metadata.severity);

    return {
      attachments: [{
        color,
        title: message.subject,
        text: message.content,
        footer: 'Migration Alert System',
        ts: Math.floor(message.timestamp.getTime() / 1000)
      }]
    };
  }

  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'good';
      case 'low': return '#439FE0';
      default: return 'good';
    }
  }

  getProviderType(): NotificationChannelType {
    return 'slack';
  }

  validateConfiguration(config: Record<string, any>): boolean {
    return config.webhookUrl && config.channel;
  }
}

export class WebhookNotificationProvider extends NotificationProvider {
  async send(channel: NotificationChannel, message: NotificationMessage): Promise<boolean> {
    try {
      const webhookConfig = channel.configuration;

      await this.sendWebhook({
        url: webhookConfig.url,
        method: webhookConfig.method || 'POST',
        headers: webhookConfig.headers || {},
        payload: {
          alert: message.metadata.alert,
          message: message.content,
          timestamp: message.timestamp,
          priority: message.priority
        }
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  private async sendWebhook(webhookData: any): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  getProviderType(): NotificationChannelType {
    return 'webhook';
  }

  validateConfiguration(config: Record<string, any>): boolean {
    return config.url && this.isValidUrl(config.url);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export class AlertManager extends EventEmitter {
  private alerts: Map<string, Alert> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private notificationChannels: Map<string, NotificationChannel> = new Map();
  private notificationProviders: Map<NotificationChannelType, NotificationProvider> = new Map();
  private alertHistory: Alert[] = [];
  private suppressedAlerts: Set<string> = new Set();
  private escalationTimers: Map<string, NodeJS.Timer[]> = new Map();
  private rateLimit: Map<string, number[]> = new Map();

  constructor() {
    super();
    this.initializeDefaultProviders();
  }

  private initializeDefaultProviders(): void {
    this.registerProvider(new EmailNotificationProvider());
    this.registerProvider(new SlackNotificationProvider());
    this.registerProvider(new WebhookNotificationProvider());
  }

  registerProvider(provider: NotificationProvider): void {
    this.notificationProviders.set(provider.getProviderType(), provider);
  }

  createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'status' | 'acknowledgments' | 'escalations'>): Alert {
    const alert: Alert = {
      ...alertData,
      id: this.generateAlertId(),
      timestamp: new Date(),
      status: 'active',
      acknowledgments: [],
      escalations: []
    };

    if (this.shouldSuppressAlert(alert)) {
      alert.status = 'suppressed';
      this.suppressedAlerts.add(alert.id);
    }

    this.alerts.set(alert.id, alert);
    this.alertHistory.push(alert);

    if (alert.status === 'active') {
      this.processNewAlert(alert);
    }

    this.emit('alertCreated', alert);
    return alert;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldSuppressAlert(alert: Alert): boolean {
    const matchingRule = this.findMatchingAlertRule(alert);
    if (!matchingRule) return false;

    for (const suppressionRule of matchingRule.suppressionRules) {
      if (!suppressionRule.enabled) continue;

      if (this.evaluateSuppressionCondition(alert, suppressionRule.condition)) {
        return true;
      }
    }

    return false;
  }

  private findMatchingAlertRule(alert: Alert): AlertRule | null {
    for (const [, rule] of this.alertRules) {
      if (this.alertMatchesRule(alert, rule)) {
        return rule;
      }
    }
    return null;
  }

  private alertMatchesRule(alert: Alert, rule: AlertRule): boolean {
    return rule.enabled &&
           (rule.tags.length === 0 || rule.tags.some(tag => alert.tags.includes(tag)));
  }

  private evaluateSuppressionCondition(alert: Alert, condition: AlertCondition): boolean {
    const value = this.extractMetricValue(alert, condition.metric);
    return this.evaluateCondition(value, condition);
  }

  private extractMetricValue(alert: Alert, metric: string): any {
    return alert.metadata[metric] || null;
  }

  private evaluateCondition(value: any, condition: AlertCondition): boolean {
    const threshold = condition.threshold;

    switch (condition.operator) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'neq': return value !== threshold;
      case 'contains': return String(value).includes(String(threshold));
      case 'not_contains': return !String(value).includes(String(threshold));
      default: return false;
    }
  }

  private async processNewAlert(alert: Alert): Promise<void> {
    const rule = this.findMatchingAlertRule(alert);
    if (!rule) return;

    if (this.isThrottled(rule)) {
      return;
    }

    this.updateThrottle(rule);

    await this.sendNotifications(alert, rule.notificationChannels);
    this.scheduleEscalations(alert, rule.escalationRules);
  }

  private isThrottled(rule: AlertRule): boolean {
    if (rule.throttleMinutes <= 0) return false;

    const throttleKey = `rule_${rule.id}`;
    const now = Date.now();
    const throttleWindow = rule.throttleMinutes * 60 * 1000;
    const recentNotifications = this.rateLimit.get(throttleKey) || [];

    const validNotifications = recentNotifications.filter(time => now - time < throttleWindow);
    this.rateLimit.set(throttleKey, validNotifications);

    return validNotifications.length > 0;
  }

  private updateThrottle(rule: AlertRule): void {
    const throttleKey = `rule_${rule.id}`;
    const notifications = this.rateLimit.get(throttleKey) || [];
    notifications.push(Date.now());
    this.rateLimit.set(throttleKey, notifications);
  }

  private async sendNotifications(alert: Alert, channelIds: string[]): Promise<void> {
    for (const channelId of channelIds) {
      const channel = this.notificationChannels.get(channelId);
      if (!channel || !channel.enabled) continue;

      if (this.isChannelRateLimited(channel)) {
        continue;
      }

      const message = this.createNotificationMessage(alert, channelId);
      await this.sendNotification(channel, message);
      this.updateChannelRateLimit(channel);
    }
  }

  private isChannelRateLimited(channel: NotificationChannel): boolean {
    if (!channel.rateLimit) return false;

    const rateLimitKey = `channel_${channel.id}`;
    const now = Date.now();
    const recentNotifications = this.rateLimit.get(rateLimitKey) || [];

    const hourlyNotifications = recentNotifications.filter(time => now - time < 60 * 60 * 1000);
    const dailyNotifications = recentNotifications.filter(time => now - time < 24 * 60 * 60 * 1000);

    return hourlyNotifications.length >= (channel.rateLimit.maxPerHour || Infinity) ||
           dailyNotifications.length >= (channel.rateLimit.maxPerDay || Infinity);
  }

  private updateChannelRateLimit(channel: NotificationChannel): void {
    const rateLimitKey = `channel_${channel.id}`;
    const notifications = this.rateLimit.get(rateLimitKey) || [];
    notifications.push(Date.now());
    this.rateLimit.set(rateLimitKey, notifications);
  }

  private createNotificationMessage(alert: Alert, channelId: string): NotificationMessage {
    const subject = this.generateSubject(alert);
    const content = this.generateContent(alert);

    return {
      alertId: alert.id,
      channelId,
      subject,
      content,
      priority: this.mapSeverityToPriority(alert.severity),
      timestamp: new Date(),
      deliveryStatus: 'pending',
      retryCount: 0,
      metadata: { alert, severity: alert.severity }
    };
  }

  private generateSubject(alert: Alert): string {
    const severityEmoji = this.getSeverityEmoji(alert.severity);
    return `${severityEmoji} [${alert.severity.toUpperCase()}] ${alert.title}`;
  }

  private generateContent(alert: Alert): string {
    const lines = [
      `Migration Alert: ${alert.title}`,
      '',
      `Severity: ${alert.severity.toUpperCase()}`,
      `Migration ID: ${alert.migrationId}`,
      `Type: ${alert.type}`,
      `Source: ${alert.source}`,
      `Timestamp: ${alert.timestamp.toISOString()}`,
      '',
      `Description:`,
      alert.description,
      ''
    ];

    if (alert.resolutionSteps.length > 0) {
      lines.push('Resolution Steps:');
      alert.resolutionSteps.forEach((step, index) => {
        lines.push(`${index + 1}. ${step}`);
      });
      lines.push('');
    }

    if (Object.keys(alert.metadata).length > 0) {
      lines.push('Additional Information:');
      for (const [key, value] of Object.entries(alert.metadata)) {
        if (typeof value === 'object') {
          lines.push(`${key}: ${JSON.stringify(value, null, 2)}`);
        } else {
          lines.push(`${key}: ${value}`);
        }
      }
    }

    return lines.join('\n');
  }

  private getSeverityEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '🔶';
      case 'low': return '🔵';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  }

  private mapSeverityToPriority(severity: AlertSeverity): 'urgent' | 'high' | 'normal' | 'low' {
    switch (severity) {
      case 'critical': return 'urgent';
      case 'high': return 'high';
      case 'medium': return 'normal';
      case 'low':
      case 'info':
      default: return 'low';
    }
  }

  private async sendNotification(channel: NotificationChannel, message: NotificationMessage): Promise<void> {
    const provider = this.notificationProviders.get(channel.type);
    if (!provider) {
      this.emit('notificationError', {
        message: `No provider found for channel type: ${channel.type}`,
        channelId: channel.id,
        messageId: message.alertId
      });
      return;
    }

    try {
      const success = await provider.send(channel, message);

      if (success) {
        message.deliveryStatus = 'sent';
        this.emit('notificationSent', { channel, message });
      } else {
        message.deliveryStatus = 'failed';
        this.emit('notificationFailed', { channel, message });
      }
    } catch (error) {
      message.deliveryStatus = 'failed';
      this.emit('notificationError', {
        error,
        channel,
        message,
        channelId: channel.id,
        messageId: message.alertId
      });
    }
  }

  private scheduleEscalations(alert: Alert, escalationRules: EscalationRule[]): void {
    const timers: NodeJS.Timer[] = [];

    for (const rule of escalationRules) {
      const timer = setTimeout(async () => {
        await this.escalateAlert(alert, rule);
      }, rule.delayMinutes * 60 * 1000);

      timers.push(timer);
    }

    this.escalationTimers.set(alert.id, timers);
  }

  private async escalateAlert(alert: Alert, escalationRule: EscalationRule): Promise<void> {
    if (alert.status !== 'active') {
      return;
    }

    if (escalationRule.condition && !this.evaluateCondition(alert.metadata, escalationRule.condition)) {
      return;
    }

    const escalation: AlertEscalation = {
      level: escalationRule.level,
      escalatedTo: escalationRule.assignTo || 'unassigned',
      escalatedAt: new Date(),
      reason: `Automatic escalation after ${escalationRule.delayMinutes} minutes`,
      acknowledged: false
    };

    alert.escalations.push(escalation);
    this.alerts.set(alert.id, alert);

    await this.sendNotifications(alert, escalationRule.notificationChannels);
    this.emit('alertEscalated', { alert, escalation });
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string, comment?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status !== 'active') {
      return false;
    }

    const acknowledgment: AlertAcknowledgment = {
      acknowledgedBy,
      acknowledgedAt: new Date(),
      comment
    };

    alert.acknowledgments.push(acknowledgment);
    alert.status = 'acknowledged';
    this.alerts.set(alertId, alert);

    this.clearEscalationTimers(alertId);
    this.emit('alertAcknowledged', { alert, acknowledgment });

    return true;
  }

  resolveAlert(alertId: string, resolvedBy: string, resolution?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || (alert.status !== 'active' && alert.status !== 'acknowledged')) {
      return false;
    }

    alert.status = 'resolved';
    alert.metadata.resolvedBy = resolvedBy;
    alert.metadata.resolvedAt = new Date();
    alert.metadata.resolution = resolution;

    this.alerts.set(alertId, alert);
    this.clearEscalationTimers(alertId);
    this.emit('alertResolved', { alert, resolvedBy, resolution });

    return true;
  }

  private clearEscalationTimers(alertId: string): void {
    const timers = this.escalationTimers.get(alertId);
    if (timers) {
      timers.forEach(timer => clearTimeout(timer));
      this.escalationTimers.delete(alertId);
    }
  }

  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.emit('alertRuleAdded', rule);
  }

  removeAlertRule(ruleId: string): boolean {
    const removed = this.alertRules.delete(ruleId);
    if (removed) {
      this.emit('alertRuleRemoved', { ruleId });
    }
    return removed;
  }

  addNotificationChannel(channel: NotificationChannel): boolean {
    const provider = this.notificationProviders.get(channel.type);
    if (!provider || !provider.validateConfiguration(channel.configuration)) {
      return false;
    }

    this.notificationChannels.set(channel.id, channel);
    this.emit('notificationChannelAdded', channel);
    return true;
  }

  removeNotificationChannel(channelId: string): boolean {
    const removed = this.notificationChannels.delete(channelId);
    if (removed) {
      this.emit('notificationChannelRemoved', { channelId });
    }
    return removed;
  }

  getAlert(alertId: string): Alert | null {
    return this.alerts.get(alertId) || null;
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.status === 'active');
  }

  getAlertsByMigration(migrationId: string): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.migrationId === migrationId);
  }

  getAlertHistory(fromTime?: Date, toTime?: Date): Alert[] {
    if (!fromTime && !toTime) {
      return [...this.alertHistory];
    }

    return this.alertHistory.filter(alert => {
      if (fromTime && alert.timestamp < fromTime) return false;
      if (toTime && alert.timestamp > toTime) return false;
      return true;
    });
  }

  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  getNotificationChannels(): NotificationChannel[] {
    return Array.from(this.notificationChannels.values());
  }

  getAlertStatistics(): any {
    const allAlerts = Array.from(this.alerts.values());

    return {
      total: allAlerts.length,
      active: allAlerts.filter(a => a.status === 'active').length,
      acknowledged: allAlerts.filter(a => a.status === 'acknowledged').length,
      resolved: allAlerts.filter(a => a.status === 'resolved').length,
      suppressed: allAlerts.filter(a => a.status === 'suppressed').length,
      bySeverity: {
        critical: allAlerts.filter(a => a.severity === 'critical').length,
        high: allAlerts.filter(a => a.severity === 'high').length,
        medium: allAlerts.filter(a => a.severity === 'medium').length,
        low: allAlerts.filter(a => a.severity === 'low').length,
        info: allAlerts.filter(a => a.severity === 'info').length
      },
      byType: this.groupAlertsByType(allAlerts)
    };
  }

  private groupAlertsByType(alerts: Alert[]): Record<string, number> {
    const groups: Record<string, number> = {};
    for (const alert of alerts) {
      groups[alert.type] = (groups[alert.type] || 0) + 1;
    }
    return groups;
  }

  cleanup(): void {
    for (const [alertId] of this.escalationTimers) {
      this.clearEscalationTimers(alertId);
    }

    this.alerts.clear();
    this.alertRules.clear();
    this.notificationChannels.clear();
    this.alertHistory.splice(0);
    this.suppressedAlerts.clear();
    this.rateLimit.clear();
    this.removeAllListeners();
  }
}