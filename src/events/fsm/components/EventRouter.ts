/**
 * Event Router - Intelligent Event Routing Logic
 * NASA Rule 10 Compliant: All functions ≤60 lines, no recursion
 * Handles subscription matching, route resolution, and load balancing
 */

import {
  BaseEvent,
  EventSubscription,
  EventRoute,
  EventFilter,
  RouteCondition,
  RoutingResult
} from '~types/EventFSMTypes';

export interface RoutingStrategy {
  name: string;
  priority: number;
  matcher: (event: BaseEvent, subscription: EventSubscription) => boolean;
  selector: (matches: EventSubscription[]) => EventSubscription[];
}

export interface RoutingMetrics {
  totalRoutings: number;
  averageRoutingTime: number;
  subscriptionHitRate: number;
  routeHitRate: number;
  loadBalanceEfficiency: number;
}

export class EventRouter {
  private readonly strategies: Map<string, RoutingStrategy>;
  private readonly activeSubscriptions: Map<string, EventSubscription>;
  private readonly activeRoutes: Map<string, EventRoute>;
  private readonly routingMetrics: RoutingMetrics;
  private isInitialized = false;

  constructor() {
    this.strategies = new Map();
    this.activeSubscriptions = new Map();
    this.activeRoutes = new Map();
    this.routingMetrics = {
      totalRoutings: 0,
      averageRoutingTime: 0,
      subscriptionHitRate: 0,
      routeHitRate: 0,
      loadBalanceEfficiency: 0
    };
  }

  /**
   * Initialize event router with default strategies
   * NASA Rule 10: ≤60 lines, no recursion
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('EventRouter already initialized');
    }

    this.setupDefaultStrategies();
    this.validateConfiguration();

    this.isInitialized = true;
  }

  /**
   * Route event to matching subscriptions
   * NASA Rule 10: ≤60 lines, bounded execution
   */
  async routeEvent(event: BaseEvent): Promise<RoutingResult[]> {
    if (!this.isInitialized) {
      throw new Error('EventRouter not initialized');
    }

    const startTime = Date.now();
    const results: RoutingResult[] = [];

    try {
      // Find matching subscriptions
      const matchingSubscriptions = this.findMatchingSubscriptions(event);

      // Apply routing strategies
      const finalSubscriptions = this.applyRoutingStrategies(event, matchingSubscriptions);

      // Create routing results
      for (const subscription of finalSubscriptions) {
        results.push({
          routeId: subscription.id,
          target: subscription.subscriberId,
          matched: true,
          duration: Date.now() - startTime
        });
      }

      // Update metrics
      this.updateRoutingMetrics(startTime, results);

      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        routeId: 'error',
        target: 'none',
        matched: false,
        duration: Date.now() - startTime,
        error: errorMessage
      });

      return results;
    }
  }

  /**
   * Add subscription to router
   * NASA Rule 10: ≤60 lines, bounded operations
   */
  addSubscription(subscription: EventSubscription): void {
    if (!this.isInitialized) {
      throw new Error('EventRouter not initialized');
    }

    // Validate subscription
    if (!subscription.id || !subscription.subscriberId) {
      throw new Error('Invalid subscription: missing required fields');
    }

    if (!subscription.eventTypes || subscription.eventTypes.length === 0) {
      throw new Error('Invalid subscription: no event types specified');
    }

    this.activeSubscriptions.set(subscription.id, subscription);
  }

  /**
   * Remove subscription from router
   * NASA Rule 10: ≤60 lines, bounded operations
   */
  removeSubscription(subscriptionId: string): boolean {
    if (!this.isInitialized) {
      return false;
    }

    return this.activeSubscriptions.delete(subscriptionId);
  }

  /**
   * Add route to router
   * NASA Rule 10: ≤60 lines, bounded operations
   */
  addRoute(route: EventRoute): void {
    if (!this.isInitialized) {
      throw new Error('EventRouter not initialized');
    }

    // Validate route
    if (!route.id || !route.pattern || !route.target) {
      throw new Error('Invalid route: missing required fields');
    }

    if (!route.conditions || route.conditions.length === 0) {
      throw new Error('Invalid route: no conditions specified');
    }

    this.activeRoutes.set(route.id, route);
  }

  /**
   * Remove route from router
   * NASA Rule 10: ≤60 lines, bounded operations
   */
  removeRoute(routeId: string): boolean {
    if (!this.isInitialized) {
      return false;
    }

    return this.activeRoutes.delete(routeId);
  }

  /**
   * Find subscriptions matching event
   * NASA Rule 10: ≤60 lines, bounded matching
   */
  private findMatchingSubscriptions(event: BaseEvent): EventSubscription[] {
    const matches: EventSubscription[] = [];

    for (const subscription of this.activeSubscriptions.values()) {
      if (!subscription.metadata.active) {
        continue;
      }

      // Check event type match
      if (!this.matchesEventType(event, subscription)) {
        continue;
      }

      // Apply filters
      if (!this.applyFilters(event, subscription.filters)) {
        continue;
      }

      matches.push(subscription);
    }

    return matches;
  }

  /**
   * Check if event matches subscription event types
   * NASA Rule 10: ≤60 lines, bounded checks
   */
  private matchesEventType(event: BaseEvent, subscription: EventSubscription): boolean {
    // Wildcard match
    if (subscription.eventTypes.includes('*')) {
      return true;
    }

    // Exact match
    if (subscription.eventTypes.includes(event.type)) {
      return true;
    }

    // Pattern match (simple prefix/suffix)
    for (const eventType of subscription.eventTypes) {
      if (eventType.endsWith('*') && event.type.startsWith(eventType.slice(0, -1))) {
        return true;
      }
      if (eventType.startsWith('*') && event.type.endsWith(eventType.slice(1))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Apply filters to event
   * NASA Rule 10: ≤60 lines, bounded filtering
   */
  private applyFilters(event: BaseEvent, filters: EventFilter[]): boolean {
    if (!filters || filters.length === 0) {
      return true;
    }

    for (const filter of filters) {
      if (!this.evaluateFilter(event, filter)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate single filter against event
   * NASA Rule 10: ≤60 lines, bounded evaluation
   */
  private evaluateFilter(event: BaseEvent, filter: EventFilter): boolean {
    let value: any;

    switch (filter.type) {
      case 'source':
        value = event.metadata.source;
        break;
      case 'type':
        value = event.type;
        break;
      case 'priority':
        value = event.metadata.priority.level;
        break;
      case 'tags':
        value = event.metadata.tags;
        break;
      case 'custom':
        if (filter.expression && typeof filter.expression === 'function') {
          return filter.expression(event);
        }
        return true;
      default:
        return true;
    }

    return this.evaluateFilterOperator(value, filter.operator, filter.value);
  }

  /**
   * Evaluate filter operator
   * NASA Rule 10: ≤60 lines, bounded operators
   */
  private evaluateFilterOperator(value: any, operator: string, filterValue: any): boolean {
    switch (operator) {
      case 'equals':
        return value === filterValue;
      case 'not_equals':
        return value !== filterValue;
      case 'contains':
        if (Array.isArray(value)) {
          return value.includes(filterValue);
        }
        return String(value).includes(String(filterValue));
      case 'regex':
        const regex = new RegExp(filterValue);
        return regex.test(String(value));
      case 'function':
        if (typeof filterValue === 'function') {
          return filterValue(value);
        }
        return true;
      default:
        return true;
    }
  }

  /**
   * Apply routing strategies to subscription matches
   * NASA Rule 10: ≤60 lines, bounded strategy application
   */
  private applyRoutingStrategies(
    event: BaseEvent,
    subscriptions: EventSubscription[]
  ): EventSubscription[] {
    if (subscriptions.length === 0) {
      return [];
    }

    // Sort strategies by priority
    const sortedStrategies = Array.from(this.strategies.values())
      .sort((a, b) => b.priority - a.priority);

    let finalSubscriptions = subscriptions;

    for (const strategy of sortedStrategies) {
      try {
        // Apply strategy matcher
        const strategyMatches = finalSubscriptions.filter(sub =>
          strategy.matcher(event, sub)
        );

        // Apply strategy selector
        if (strategyMatches.length > 0) {
          finalSubscriptions = strategy.selector(strategyMatches);
        }

      } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
        // Strategy failed, continue with original subscriptions
        console.warn(`Routing strategy ${strategy.name} failed:`, errorMessage);
      }
    }

    return finalSubscriptions;
  }

  /**
   * Setup default routing strategies
   * NASA Rule 10: ≤60 lines, declarative setup
   */
  private setupDefaultStrategies(): void {
    // Priority-based routing
    this.strategies.set('priority', {
      name: 'priority',
      priority: 100,
      matcher: (event, subscription) => true,
      selector: (subscriptions) => {
        return subscriptions.sort((a, b) => b.priority - a.priority);
      }
    });

    // Load balancing for same priority
    this.strategies.set('load_balance', {
      name: 'load_balance',
      priority: 90,
      matcher: (event, subscription) => true,
      selector: (subscriptions) => {
        if (subscriptions.length <= 1) {
          return subscriptions;
        }

        // Simple round-robin based on trigger count
        return subscriptions.sort((a, b) =>
          a.metadata.triggerCount - b.metadata.triggerCount
        );
      }
    });

    // Error rate filtering
    this.strategies.set('error_filter', {
      name: 'error_filter',
      priority: 110,
      matcher: (event, subscription) => {
        const errorRate = subscription.metadata.errorCount /
          Math.max(subscription.metadata.triggerCount, 1);
        return errorRate < 0.5; // Filter out subscriptions with >50% error rate
      },
      selector: (subscriptions) => subscriptions
    });
  }

  /**
   * Validate router configuration
   * NASA Rule 10: ≤60 lines, bounded validation
   */
  private validateConfiguration(): void {
    if (this.strategies.size === 0) {
      throw new Error('No routing strategies configured');
    }

    // Validate strategy priorities are unique
    const priorities = Array.from(this.strategies.values()).map(s => s.priority);
    const uniquePriorities = new Set(priorities);

    if (priorities.length !== uniquePriorities.size) {
      throw new Error('Duplicate strategy priorities detected');
    }
  }

  /**
   * Update routing metrics
   * NASA Rule 10: ≤60 lines, bounded updates
   */
  private updateRoutingMetrics(startTime: number, results: RoutingResult[]): void {
    this.routingMetrics.totalRoutings++;

    // Update average routing time
    const routingTime = Date.now() - startTime;
    const totalTime = this.routingMetrics.averageRoutingTime *
      (this.routingMetrics.totalRoutings - 1) + routingTime;
    this.routingMetrics.averageRoutingTime = totalTime / this.routingMetrics.totalRoutings;

    // Update hit rates
    const successfulRoutes = results.filter(r => r.matched).length;
    const currentHitRate = successfulRoutes / Math.max(results.length, 1);

    this.routingMetrics.subscriptionHitRate =
      (this.routingMetrics.subscriptionHitRate * (this.routingMetrics.totalRoutings - 1) +
       currentHitRate) / this.routingMetrics.totalRoutings;
  }

  /**
   * Get routing metrics
   */
  getMetrics(): RoutingMetrics {
    return { ...this.routingMetrics };
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionCount(): number {
    return Array.from(this.activeSubscriptions.values())
      .filter(sub => sub.metadata.active).length;
  }

  /**
   * Get active routes count
   */
  getActiveRouteCount(): number {
    return this.activeRoutes.size;
  }

  /**
   * Shutdown router
   * NASA Rule 10: ≤60 lines, bounded cleanup
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    this.strategies.clear();
    this.activeSubscriptions.clear();
    this.activeRoutes.clear();
    this.isInitialized = false;
  }
}