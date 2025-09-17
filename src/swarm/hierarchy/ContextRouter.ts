/**
 * Context Router - Intelligent Context Distribution System
 * Routes context to appropriate princesses based on domain expertise and load
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { ContextDNA } from '../../context/ContextDNA';
import { ContextValidator } from '../../context/ContextValidator';
import { HivePrincess } from './HivePrincess';
import { DegradationMonitor } from '../../context/DegradationMonitor';

interface RouteDecision {
  contextId: string;
  sourcePrincess: string;
  targetPrincesses: string[];
  strategy: 'broadcast' | 'targeted' | 'cascade' | 'redundant';
  priority: 'low' | 'medium' | 'high' | 'critical';
  compression: boolean;
  channels: ('direct' | 'memory' | 'plane')[];
  metadata: {
    domainRelevance: Map<string, number>;
    loadFactors: Map<string, number>;
    routingPath: string[];
  };
}

interface PrincessCapabilities {
  domains: string[];
  specializations: string[];
  currentLoad: number;
  maxCapacity: number;
  reliability: number;
  latency: number;
  contextTypes: string[];
}

interface RoutingMetrics {
  totalRouted: number;
  successRate: number;
  averageLatency: number;
  degradationRate: number;
  routingEfficiency: number;
}

interface CircuitBreaker {
  princess: string;
  failures: number;
  lastFailure: Date;
  state: 'closed' | 'open' | 'half-open';
  nextRetry: Date;
}

export class ContextRouter extends EventEmitter {
  private readonly contextDNA: ContextDNA;
  private readonly validator: ContextValidator;
  private readonly monitor: DegradationMonitor;
  private routingTable: Map<string, PrincessCapabilities> = new Map();
  private routingHistory: RouteDecision[] = [];
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private domainIndex: Map<string, Set<string>> = new Map();
  private readonly maxHistorySize = 1000;
  private readonly circuitBreakerThreshold = 3;
  private readonly circuitBreakerTimeout = 30000;

  constructor(
    private readonly princesses: Map<string, HivePrincess>,
    private readonly compressionThreshold = 1024
  ) {
    super();
    this.contextDNA = new ContextDNA();
    this.validator = new ContextValidator();
    this.monitor = new DegradationMonitor();
    this.initializeRoutingTable();
    this.buildDomainIndex();
  }

  /**
   * Route context to appropriate princesses
   */
  async routeContext(
    context: any,
    sourcePrincess: string,
    options: {
      priority?: RouteDecision['priority'];
      strategy?: RouteDecision['strategy'];
      excludePrincesses?: string[];
    } = {}
  ): Promise<RouteDecision> {
    const contextId = await this.contextDNA.createFingerprint(context);
    
    // Analyze context for routing
    const analysis = await this.analyzeContext(context);
    
    // Determine target princesses
    const targets = await this.selectTargetPrincesses(
      analysis,
      sourcePrincess,
      options.excludePrincesses || []
    );

    // Create routing decision
    const decision: RouteDecision = {
      contextId,
      sourcePrincess,
      targetPrincesses: targets,
      strategy: options.strategy || this.determineStrategy(targets.length, analysis.complexity),
      priority: options.priority || this.determinePriority(analysis),
      compression: this.shouldCompress(context),
      channels: this.selectChannels(options.priority || 'medium'),
      metadata: {
        domainRelevance: analysis.domainRelevance,
        loadFactors: this.calculateLoadFactors(targets),
        routingPath: [sourcePrincess, ...targets]
      }
    };

    // Execute routing
    await this.executeRouting(decision, context);
    
    // Record metrics
    this.recordRoutingDecision(decision);
    
    return decision;
  }

  /**
   * Analyze context to determine routing requirements
   */
  private async analyzeContext(context: any): Promise<any> {
    const text = JSON.stringify(context);

    // Use NLP for advanced domain keyword extraction
    const nlpAnalysis = await this.nlpProcessor.analyzeText(text);
    const domainScores = await this.nlpProcessor.extractDomainRelevance(nlpAnalysis);

    // Calculate complexity using NLP
    const complexity = nlpAnalysis.complexity;

    // Detect context type
    const contextType = this.detectContextType(context);

    return {
      domainRelevance: domainScores,
      complexity,
      contextType,
      size: text.length,
      urgency: this.detectUrgency(context),
      dependencies: this.extractDependencies(context),
      nlpAnalysis
    };
  }

  /**
   * Select target princesses based on analysis
   */
  private async selectTargetPrincesses(
    analysis: any,
    sourcePrincess: string,
    exclude: string[]
  ): Promise<string[]> {
    const candidates: { princess: string; score: number }[] = [];

    for (const [princessId, capabilities] of this.routingTable) {
      // Skip excluded and source
      if (exclude.includes(princessId) || princessId === sourcePrincess) {
        continue;
      }

      // Skip if circuit breaker is open
      const breaker = this.circuitBreakers.get(princessId);
      if (breaker && breaker.state === 'open') {
        if (Date.now() < breaker.nextRetry.getTime()) {
          continue;
        } else {
          // Try half-open state
          breaker.state = 'half-open';
        }
      }

      // Calculate routing score
      const score = this.calculateRoutingScore(
        capabilities,
        analysis,
        princessId
      );

      if (score > 0.3) {
        candidates.push({ princess: princessId, score });
      }
    }

    // Sort by score and select top candidates
    candidates.sort((a, b) => b.score - a.score);
    
    // Determine how many targets based on priority and complexity
    const targetCount = this.determineTargetCount(analysis);
    
    return candidates.slice(0, targetCount).map(c => c.princess);
  }

  /**
   * Calculate routing score for a princess
   */
  private calculateRoutingScore(
    capabilities: PrincessCapabilities,
    analysis: any,
    princessId: string
  ): number {
    let score = 0;

    // Domain relevance (40%)
    for (const domain of capabilities.domains) {
      const relevance = analysis.domainRelevance.get(domain) || 0;
      score += relevance * 0.4;
    }

    // Load factor (20%)
    const loadScore = 1 - (capabilities.currentLoad / capabilities.maxCapacity);
    score += loadScore * 0.2;

    // Reliability (20%)
    score += capabilities.reliability * 0.2;

    // Latency (10%)
    const latencyScore = Math.max(0, 1 - capabilities.latency / 1000);
    score += latencyScore * 0.1;

    // Context type match (10%)
    if (capabilities.contextTypes.includes(analysis.contextType)) {
      score += 0.1;
    }

    // Apply circuit breaker penalty
    const breaker = this.circuitBreakers.get(princessId);
    if (breaker && breaker.state === 'half-open') {
      score *= 0.5; // Reduce score for recovering nodes
    }

    return score;
  }

  /**
   * Execute routing decision
   */
  private async executeRouting(
    decision: RouteDecision,
    context: any
  ): Promise<void> {
    // Prepare context for routing
    const preparedContext = await this.prepareContext(context, decision);

    // Route based on strategy
    switch (decision.strategy) {
      case 'broadcast':
        await this.broadcastRoute(decision, preparedContext);
        break;
      case 'targeted':
        await this.targetedRoute(decision, preparedContext);
        break;
      case 'cascade':
        await this.cascadeRoute(decision, preparedContext);
        break;
      case 'redundant':
        await this.redundantRoute(decision, preparedContext);
        break;
    }
  }

  /**
   * Broadcast routing - send to all targets simultaneously
   */
  private async broadcastRoute(
    decision: RouteDecision,
    context: any
  ): Promise<void> {
    const routes = decision.targetPrincesses.map(async target => {
      try {
        const princess = this.princesses.get(target);
        if (!princess) throw new Error(`Princess ${target} not found`);

        await princess.handleContext(context, {
          source: decision.sourcePrincess,
          priority: decision.priority,
          channels: decision.channels
        });

        this.recordSuccess(target);
      } catch (error) {
        console.error(`Failed to route to ${target}:`, error);
        this.recordFailure(target);
      }
    });

    await Promise.allSettled(routes);
  }

  /**
   * Targeted routing - send to specific high-score targets
   */
  private async targetedRoute(
    decision: RouteDecision,
    context: any
  ): Promise<void> {
    for (const target of decision.targetPrincesses) {
      try {
        const princess = this.princesses.get(target);
        if (!princess) continue;

        // Customize context for target domain
        const customContext = await this.customizeForDomain(
          context,
          this.routingTable.get(target)?.domains || []
        );

        await princess.handleContext(customContext, {
          source: decision.sourcePrincess,
          priority: decision.priority,
          channels: decision.channels
        });

        this.recordSuccess(target);
      } catch (error) {
        console.error(`Targeted routing failed for ${target}:`, error);
        this.recordFailure(target);
      }
    }
  }

  /**
   * Cascade routing - sequential routing with validation
   */
  private async cascadeRoute(
    decision: RouteDecision,
    context: any
  ): Promise<void> {
    let currentContext = context;

    for (const target of decision.targetPrincesses) {
      try {
        const princess = this.princesses.get(target);
        if (!princess) continue;

        // Process and enhance context
        await princess.handleContext(currentContext, {
          source: decision.sourcePrincess,
          priority: decision.priority
        });

        // For cascade routing, we assume the context is enhanced by the princess
        // This would need integration with the actual princess implementation

        this.recordSuccess(target);

        // Validate for degradation
        const degradation = await this.monitor.detectDegradation(
          context,
          currentContext
        );

        if (degradation > 0.15) {
          console.warn(`High degradation detected in cascade: ${degradation}`);
          break; // Stop cascade if degradation too high
        }

      } catch (error) {
        console.error(`Cascade routing failed at ${target}:`, error);
        this.recordFailure(target);
        break; // Stop cascade on failure
      }
    }
  }

  /**
   * Redundant routing - multiple paths for critical context
   */
  private async redundantRoute(
    decision: RouteDecision,
    context: any
  ): Promise<void> {
    // Split targets into primary and backup groups
    const midpoint = Math.ceil(decision.targetPrincesses.length / 2);
    const primaryTargets = decision.targetPrincesses.slice(0, midpoint);
    const backupTargets = decision.targetPrincesses.slice(midpoint);

    // Route to primary targets first
    const primaryResults = await Promise.allSettled(
      primaryTargets.map(target => this.routeToPrincess(target, context, decision))
    );

    // Check primary success rate
    const primarySuccesses = primaryResults.filter(r => r.status === 'fulfilled').length;
    const primarySuccessRate = primarySuccesses / primaryTargets.length;

    // Route to backup if primary success rate is low
    if (primarySuccessRate < 0.7) {
      console.log('Primary routing incomplete, activating backup routes');
      await Promise.allSettled(
        backupTargets.map(target => this.routeToPrincess(target, context, decision))
      );
    }
  }

  /**
   * Route to individual princess
   */
  private async routeToPrincess(
    target: string,
    context: any,
    decision: RouteDecision
  ): Promise<void> {
    const princess = this.princesses.get(target);
    if (!princess) throw new Error(`Princess ${target} not found`);

    await princess.handleContext(context, {
      source: decision.sourcePrincess,
      priority: decision.priority,
      channels: decision.channels
    });

    this.recordSuccess(target);
  }

  /**
   * Prepare context for routing
   */
  private async prepareContext(
    context: any,
    decision: RouteDecision
  ): Promise<any> {
    let prepared = { ...context };

    // Add routing metadata
    prepared._routing = {
      id: decision.contextId,
      source: decision.sourcePrincess,
      timestamp: Date.now(),
      priority: decision.priority,
      path: decision.metadata.routingPath
    };

    // Compress if needed
    if (decision.compression) {
      prepared = await this.compressContext(prepared);
    }

    // Add integrity check
    prepared._integrity = await this.contextDNA.createFingerprint(prepared);

    return prepared;
  }

  /**
   * Compress context for efficient routing
   */
  private async compressContext(context: any): Promise<any> {
    const json = JSON.stringify(context);
    
    // Simple compression using repeated pattern replacement
    const patterns = new Map<string, string>();
    let compressed = json;
    let patternId = 0;

    // Find repeated substrings
    const minLength = 20;
    for (let i = 0; i < json.length - minLength; i++) {
      const substr = json.substring(i, i + minLength);
      const occurrences = (json.match(new RegExp(substr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      
      if (occurrences > 2) {
        const placeholder = `__P${patternId++}__`;
        patterns.set(placeholder, substr);
        compressed = compressed.replace(new RegExp(substr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), placeholder);
      }
    }

    return {
      _compressed: true,
      data: compressed,
      patterns: Object.fromEntries(patterns),
      originalSize: json.length,
      compressedSize: compressed.length
    };
  }

  /**
   * Customize context for specific domain
   */
  private async customizeForDomain(
    context: any,
    domains: string[]
  ): Promise<any> {
    const customized = { ...context };
    
    // Add domain-specific metadata
    customized._domains = domains;
    
    // Filter irrelevant information based on domain
    if (domains.includes('development') && !domains.includes('quality')) {
      delete customized.testResults;
      delete customized.coverage;
    }
    
    if (domains.includes('security') && !domains.includes('infrastructure')) {
      delete customized.deploymentConfig;
      delete customized.kubernetesManifest;
    }

    return customized;
  }

  /**
   * Initialize routing table with princess capabilities
   */
  private initializeRoutingTable(): void {
    // Define princess capabilities
    const capabilities: Record<string, PrincessCapabilities> = {
      development: {
        domains: ['development', 'coordination'],
        specializations: ['coding', 'architecture', 'api'],
        currentLoad: 0,
        maxCapacity: 100,
        reliability: 0.95,
        latency: 50,
        contextTypes: ['code', 'specification', 'architecture']
      },
      quality: {
        domains: ['quality', 'security'],
        specializations: ['testing', 'validation', 'coverage'],
        currentLoad: 0,
        maxCapacity: 80,
        reliability: 0.98,
        latency: 100,
        contextTypes: ['test', 'validation', 'quality']
      },
      security: {
        domains: ['security', 'quality'],
        specializations: ['auth', 'vulnerability', 'compliance'],
        currentLoad: 0,
        maxCapacity: 60,
        reliability: 0.99,
        latency: 150,
        contextTypes: ['security', 'auth', 'vulnerability']
      },
      research: {
        domains: ['research', 'coordination'],
        specializations: ['analysis', 'discovery', 'documentation'],
        currentLoad: 0,
        maxCapacity: 120,
        reliability: 0.92,
        latency: 200,
        contextTypes: ['research', 'analysis', 'documentation']
      },
      infrastructure: {
        domains: ['infrastructure', 'development'],
        specializations: ['deployment', 'pipeline', 'monitoring'],
        currentLoad: 0,
        maxCapacity: 90,
        reliability: 0.96,
        latency: 75,
        contextTypes: ['deployment', 'infrastructure', 'pipeline']
      },
      coordination: {
        domains: ['coordination'],
        specializations: ['planning', 'orchestration', 'consensus'],
        currentLoad: 0,
        maxCapacity: 150,
        reliability: 0.97,
        latency: 30,
        contextTypes: ['plan', 'coordination', 'consensus']
      }
    };

    return defaultCapabilities[princessId] || {
      domains: [princessId],
      specializations: ['general'],
      currentLoad: 0,
      maxCapacity: 100,
      reliability: 0.90,
      latency: 100,
      contextTypes: ['general']
    };
  }

  /**
   * Build domain index for fast lookup
   */
  private buildDomainIndex(): void {
    for (const [princess, capabilities] of this.routingTable) {
      for (const domain of capabilities.domains) {
        if (!this.domainIndex.has(domain)) {
          this.domainIndex.set(domain, new Set());
        }
        this.domainIndex.get(domain)?.add(princess);
      }
    }
  }

  /**
   * Initialize circuit breaker for princess
   */
  private initializeCircuitBreaker(princess: string): void {
    this.circuitBreakers.set(princess, {
      princess,
      failures: 0,
      lastFailure: new Date(0),
      state: 'closed',
      nextRetry: new Date()
    });
  }

  /**
   * Record successful routing
   */
  private recordSuccess(princess: string): void {
    const breaker = this.circuitBreakers.get(princess);
    if (breaker) {
      breaker.failures = 0;
      breaker.state = 'closed';
    }

    const capabilities = this.routingTable.get(princess);
    if (capabilities) {
      capabilities.currentLoad = Math.max(0, capabilities.currentLoad - 1);
    }
  }

  /**
   * Record failed routing
   */
  private recordFailure(princess: string): void {
    const breaker = this.circuitBreakers.get(princess);
    if (breaker) {
      breaker.failures++;
      breaker.lastFailure = new Date();

      if (breaker.failures >= this.circuitBreakerThreshold) {
        breaker.state = 'open';
        breaker.nextRetry = new Date(Date.now() + this.circuitBreakerTimeout);
        this.emit('circuit:open', { princess });
      }
    }

    const capabilities = this.routingTable.get(princess);
    if (capabilities) {
      capabilities.reliability = Math.max(0, capabilities.reliability - 0.01);
    }
  }

  /**
   * Helper functions
   */
  private shouldCompress(context: any): boolean {
    const size = JSON.stringify(context).length;
    return size > this.compressionThreshold;
  }

  private determineStrategy(
    targetCount: number,
    complexity: number
  ): RouteDecision['strategy'] {
    if (targetCount >= 4) return 'broadcast';
    if (complexity > 0.7) return 'cascade';
    if (targetCount === 1) return 'targeted';
    return 'redundant';
  }

  private determinePriority(analysis: any): RouteDecision['priority'] {
    if (analysis.urgency > 0.8) return 'critical';
    if (analysis.urgency > 0.6) return 'high';
    if (analysis.urgency > 0.3) return 'medium';
    return 'low';
  }

  private selectChannels(priority: string): ('direct' | 'memory' | 'plane')[] {
    switch (priority) {
      case 'critical':
        return ['direct', 'memory', 'plane'];
      case 'high':
        return ['direct', 'memory'];
      case 'medium':
        return ['direct'];
      default:
        return ['memory'];
    }
  }

  private calculateComplexity(context: any): number {
    const json = JSON.stringify(context);
    const depth = this.calculateDepth(context);
    const size = json.length;
    
    return Math.min(1, (depth / 10 + size / 10000) / 2);
  }

  private calculateDepth(obj: any, current = 0): number {
    if (typeof obj !== 'object' || obj === null) return current;
    
    let maxDepth = current;
    for (const value of Object.values(obj)) {
      const depth = this.calculateDepth(value, current + 1);
      maxDepth = Math.max(maxDepth, depth);
    }
    
    return maxDepth;
  }

  private detectContextType(context: any): string {
    if (context.code || context.implementation) return 'code';
    if (context.tests || context.coverage) return 'test';
    if (context.auth || context.permissions) return 'security';
    if (context.deployment || context.pipeline) return 'infrastructure';
    if (context.research || context.analysis) return 'research';
    if (context.plan || context.coordination) return 'coordination';
    return 'general';
  }

  private detectUrgency(context: any): number {
    const urgentKeywords = ['critical', 'urgent', 'asap', 'immediately', 'emergency'];
    const text = JSON.stringify(context).toLowerCase();
    
    let urgency = 0;
    for (const keyword of urgentKeywords) {
      if (text.includes(keyword)) urgency += 0.2;
    }
    
    return Math.min(1, urgency);
  }

  private extractDependencies(context: any): string[] {
    const dependencies: string[] = [];
    
    if (context.dependencies) {
      dependencies.push(...Object.keys(context.dependencies));
    }
    
    if (context.requires) {
      dependencies.push(...context.requires);
    }
    
    return [...new Set(dependencies)];
  }

  private calculateLoadFactors(targets: string[]): Map<string, number> {
    const factors = new Map<string, number>();
    
    for (const target of targets) {
      const capabilities = this.routingTable.get(target);
      if (capabilities) {
        factors.set(target, capabilities.currentLoad / capabilities.maxCapacity);
      }
    }
    
    return factors;
  }

  private determineTargetCount(analysis: any): number {
    if (analysis.urgency > 0.8) return 5;
    if (analysis.complexity > 0.7) return 3;
    if (analysis.size > 5000) return 4;
    return 2;
  }

  private recordRoutingDecision(decision: RouteDecision): void {
    this.routingHistory.push(decision);
    
    // Prune old history
    if (this.routingHistory.length > this.maxHistorySize) {
      this.routingHistory = this.routingHistory.slice(-this.maxHistorySize);
    }
    
    this.emit('routing:complete', decision);
  }

  /**
   * Get routing metrics
   */
  getMetrics(): RoutingMetrics {
    const total = this.routingHistory.length;
    const successful = this.routingHistory.filter(
      d => d.targetPrincesses.length > 0
    ).length;

    return {
      totalRouted: total,
      successRate: total > 0 ? successful / total : 0,
      averageLatency: this.calculateAverageLatency(),
      degradationRate: this.calculateDegradationRate(),
      routingEfficiency: this.calculateRoutingEfficiency()
    };
  }

  private calculateAverageLatency(): number {
    let totalLatency = 0;
    let count = 0;

    for (const capabilities of this.routingTable.values()) {
      totalLatency += capabilities.latency;
      count++;
    }

    return count > 0 ? totalLatency / count : 0;
  }

  private calculateDegradationRate(): number {
    // Would integrate with DegradationMonitor for real metrics
    return 0.05; // Placeholder
  }

  private calculateRoutingEfficiency(): number {
    const circuitOpen = Array.from(this.circuitBreakers.values())
      .filter(b => b.state === 'open').length;

    const totalCircuits = this.circuitBreakers.size;
    return totalCircuits > 0 ? (totalCircuits - circuitOpen) / totalCircuits : 1;
  }

  /**
   * Discover capabilities from a princess instance
   */
  private async discoverPrincessCapabilities(
    princessId: string,
    princess: HivePrincess
  ): Promise<PrincessCapabilities> {
    try {
      // Query princess for its capabilities
      const capabilityResponse = await princess.getCapabilities();

      return {
        domains: capabilityResponse.domains || this.inferDomainsFromId(princessId),
        specializations: capabilityResponse.specializations || [],
        currentLoad: capabilityResponse.currentLoad || 0,
        maxCapacity: capabilityResponse.maxCapacity || 100,
        reliability: capabilityResponse.reliability || 0.95,
        latency: capabilityResponse.latency || 100,
        contextTypes: capabilityResponse.contextTypes || ['general']
      };
    } catch (error) {
      console.warn(`Could not query capabilities for ${princessId}, using inference`);
      return this.getDefaultCapabilities(princessId);
    }
  }

  /**
   * Infer domains from princess ID
   */
  private inferDomainsFromId(princessId: string): string[] {
    const domainMappings: Record<string, string[]> = {
      development: ['development', 'coding'],
      quality: ['quality', 'testing'],
      security: ['security', 'auth'],
      research: ['research', 'analysis'],
      infrastructure: ['infrastructure', 'deployment'],
      coordination: ['coordination', 'planning']
    };

    return domainMappings[princessId] || [princessId];
  }

  /**
   * Start periodic capability discovery
   */
  private startCapabilityDiscovery(): void {
    this.capabilityDiscoveryTimer = setInterval(async () => {
      await this.updateCapabilities();
    }, 60000); // Update every minute
  }

  /**
   * Update capabilities in real-time
   */
  private async updateCapabilities(): Promise<void> {
    const updates = Array.from(this.princesses.entries()).map(async ([princessId, princess]) => {
      try {
        const currentCaps = this.routingTable.get(princessId);
        if (!currentCaps) return;

        // Get real-time metrics
        const metrics = await princess.getMetrics();

        // Update dynamic fields
        currentCaps.currentLoad = metrics.currentLoad || currentCaps.currentLoad;
        currentCaps.reliability = this.calculateReliability(princessId, metrics);
        currentCaps.latency = metrics.averageLatency || currentCaps.latency;

        this.routingTable.set(princessId, currentCaps);

      } catch (error) {
        console.warn(`Failed to update capabilities for ${princessId}:`, error);
      }
    });

    await Promise.allSettled(updates);
  }

  /**
   * Calculate reliability based on metrics
   */
  private calculateReliability(princessId: string, metrics: any): number {
    const breaker = this.circuitBreakers.get(princessId);
    if (!breaker) return 0.95;

    // Base reliability from metrics
    let reliability = metrics.successRate || 0.95;

    // Adjust for circuit breaker state
    if (breaker.state === 'open') {
      reliability *= 0.1; // Significantly reduced when circuit is open
    } else if (breaker.state === 'half-open') {
      reliability *= 0.7; // Moderately reduced when recovering
    }

    // Factor in failure history
    const failurePenalty = Math.min(0.5, breaker.failures * 0.1);
    reliability = Math.max(0.1, reliability - failurePenalty);

    return reliability;
  }

  /**
   * Cleanup resources
   */
  shutdown(): void {
    if (this.capabilityDiscoveryTimer) {
      clearInterval(this.capabilityDiscoveryTimer);
    }
    this.compressionCache.clear();
    this.emit('router:shutdown');
  }
}

/**
 * NLP Processor for advanced domain keyword extraction
 */
class NLPProcessor {
  private domainPatterns: Map<string, RegExp[]> = new Map();
  private contextualWeights: Map<string, number> = new Map();

  constructor() {
    this.initializeDomainPatterns();
    this.initializeContextualWeights();
  }

  /**
   * Initialize domain-specific patterns
   */
  private initializeDomainPatterns(): void {
    this.domainPatterns.set('development', [
      /\b(?:code|coding|program|function|class|method|api|sdk)\b/gi,
      /\b(?:implement|develop|build|create|design)\b/gi,
      /\b(?:frontend|backend|fullstack|database|architecture)\b/gi
    ]);

    this.domainPatterns.set('quality', [
      /\b(?:test|testing|unit|integration|e2e|coverage)\b/gi,
      /\b(?:quality|qa|validation|verification|assert)\b/gi,
      /\b(?:lint|eslint|prettier|jest|mocha|cypress)\b/gi
    ]);

    this.domainPatterns.set('security', [
      /\b(?:security|auth|authentication|authorization|permission)\b/gi,
      /\b(?:vulnerability|encrypt|decrypt|hash|token|jwt)\b/gi,
      /\b(?:ssl|tls|cors|xss|csrf|owasp)\b/gi
    ]);

    this.domainPatterns.set('research', [
      /\b(?:research|analyze|analysis|investigate|explore)\b/gi,
      /\b(?:discover|study|examine|evaluate|assess)\b/gi,
      /\b(?:benchmark|performance|optimization|profiling)\b/gi
    ]);

    this.domainPatterns.set('infrastructure', [
      /\b(?:deploy|deployment|infrastructure|pipeline|ci\/cd)\b/gi,
      /\b(?:docker|kubernetes|aws|azure|gcp|cloud)\b/gi,
      /\b(?:monitoring|logging|observability|metrics)\b/gi
    ]);

    this.domainPatterns.set('coordination', [
      /\b(?:plan|planning|coordinate|orchestrate|manage)\b/gi,
      /\b(?:schedule|organize|sync|synchronize|workflow)\b/gi,
      /\b(?:project|task|milestone|deadline|sprint)\b/gi
    ]);
  }

  /**
   * Initialize contextual weights
   */
  private initializeContextualWeights(): void {
    this.contextualWeights.set('title', 3.0);
    this.contextualWeights.set('heading', 2.0);
    this.contextualWeights.set('emphasis', 1.5);
    this.contextualWeights.set('body', 1.0);
    this.contextualWeights.set('metadata', 0.8);
  }

  /**
   * Analyze text using NLP techniques
   */
  async analyzeText(text: string): Promise<any> {
    const tokens = this.tokenize(text);
    const entities = this.extractEntities(text);
    const sentiment = this.analyzeSentiment(text);
    const complexity = this.calculateTextComplexity(text);

    return {
      tokens,
      entities,
      sentiment,
      complexity,
      wordCount: tokens.length,
      uniqueWords: new Set(tokens).size
    };
  }

  /**
   * Extract domain relevance using advanced NLP
   */
  async extractDomainRelevance(nlpAnalysis: any): Promise<Map<string, number>> {
    const domainScores = new Map<string, number>();
    const text = nlpAnalysis.tokens.join(' ');

    for (const [domain, patterns] of this.domainPatterns) {
      let score = 0;
      let totalMatches = 0;

      for (const pattern of patterns) {
        const matches = text.match(pattern) || [];
        totalMatches += matches.length;

        // Apply contextual weighting
        for (const match of matches) {
          const context = this.getMatchContext(text, match);
          const weight = this.contextualWeights.get(context) || 1.0;
          score += weight;
        }
      }

      // Normalize by text length and apply entity boost
      const normalizedScore = score / Math.max(nlpAnalysis.wordCount, 1);
      const entityBoost = this.calculateEntityBoost(nlpAnalysis.entities, domain);
      const finalScore = normalizedScore * (1 + entityBoost);

      domainScores.set(domain, Math.min(1.0, finalScore));
    }

    return domainScores;
  }

  /**
   * Tokenize text
   */
  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  /**
   * Extract named entities
   */
  private extractEntities(text: string): string[] {
    const entities: string[] = [];

    // Technology entities
    const techPattern = /\b(?:react|vue|angular|node|python|java|kubernetes|docker|aws)\b/gi;
    const techMatches = text.match(techPattern) || [];
    entities.push(...techMatches);

    // Framework entities
    const frameworkPattern = /\b(?:express|fastify|django|flask|spring|laravel)\b/gi;
    const frameworkMatches = text.match(frameworkPattern) || [];
    entities.push(...frameworkMatches);

    return [...new Set(entities)];
  }

  /**
   * Analyze sentiment
   */
  private analyzeSentiment(text: string): number {
    const positiveWords = ['good', 'great', 'excellent', 'success', 'improve', 'optimize', 'efficient'];
    const negativeWords = ['bad', 'error', 'fail', 'problem', 'issue', 'bug', 'slow'];

    const words = text.toLowerCase().split(/\s+/);
    let sentiment = 0;

    for (const word of words) {
      if (positiveWords.includes(word)) sentiment += 1;
      if (negativeWords.includes(word)) sentiment -= 1;
    }

    return Math.max(-1, Math.min(1, sentiment / words.length));
  }

  /**
   * Calculate text complexity
   */
  private calculateTextComplexity(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/);
    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    const avgCharsPerWord = text.length / Math.max(words.length, 1);

    // Simplified complexity score
    return Math.min(1, (avgWordsPerSentence / 20 + avgCharsPerWord / 10) / 2);
  }

  /**
   * Get match context
   */
  private getMatchContext(text: string, match: string): string {
    const index = text.indexOf(match);
    if (index === -1) return 'body';

    // Simple heuristics for context detection
    const beforeText = text.substring(Math.max(0, index - 50), index);

    if (/[#*]{1,6}\s*$/.test(beforeText)) return 'heading';
    if (/\*\*|__/.test(beforeText)) return 'emphasis';
    if (index < 100) return 'title';

    return 'body';
  }

  /**
   * Calculate entity boost for domain
   */
  private calculateEntityBoost(entities: string[], domain: string): number {
    const domainEntities: Record<string, string[]> = {
      development: ['react', 'vue', 'angular', 'node', 'python', 'java'],
      infrastructure: ['kubernetes', 'docker', 'aws', 'azure', 'gcp'],
      quality: ['jest', 'mocha', 'cypress', 'selenium'],
      security: ['oauth', 'jwt', 'ssl', 'encryption']
    };

    const relevantEntities = domainEntities[domain] || [];
    const matches = entities.filter(entity =>
      relevantEntities.some(relevant =>
        entity.toLowerCase().includes(relevant.toLowerCase())
      )
    );

    return Math.min(0.5, matches.length * 0.1);
  }
}
