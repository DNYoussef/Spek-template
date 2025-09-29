/**
 * Collect new examples from agent interactions for continuous dataset improvement
 * Integrates with SPEK system for real-time example harvesting
 */

import { EventEmitter } from 'events';
import { CommunicationExample, PerformanceMetrics } from '../types/DatasetTypes';
import { CommunicationExampleDataset, CommunicationType } from './CommunicationExampleDataset';
import { ScoringEngine } from './ScoringEngine';

export interface CollectionConfig {
  auto_collection_enabled: boolean;
  collection_rate: number; // Examples per hour
  quality_threshold: number; // Minimum score for collection
  max_examples_per_type: number;
  collection_sources: string[];
}

export interface AgentInteraction {
  timestamp: string;
  agent_id: string;
  communication_type: CommunicationType;
  input_context: Record<string, any>;
  output_communication: string;
  performance_data?: PerformanceMetrics;
  user_feedback?: {
    satisfaction: number; // 1-10
    effectiveness: number; // 1-10
    comments?: string;
  };
}

export class DatasetCollector extends EventEmitter {
  private config: CollectionConfig;
  private dataset: CommunicationExampleDataset;
  private scorer: ScoringEngine;
  private collectionBuffer: Map<string, AgentInteraction[]> = new Map();
  private collectionStats: {
    collected_today: number;
    rejected_today: number;
    total_collected: number;
    last_collection: string;
  };

  constructor(
    dataset: CommunicationExampleDataset,
    config?: Partial<CollectionConfig>
  ) {
    super();
    this.dataset = dataset;
    this.scorer = new ScoringEngine();
    this.config = {
      auto_collection_enabled: true,
      collection_rate: 10, // 10 examples per hour
      quality_threshold: 6.5,
      max_examples_per_type: 100,
      collection_sources: ['agent_logs', 'user_interactions', 'swarm_communications'],
      ...config
    };

    this.collectionStats = {
      collected_today: 0,
      rejected_today: 0,
      total_collected: 0,
      last_collection: new Date().toISOString()
    };

    this.initializeCollection();
  }

  /**
   * Record agent interaction for potential collection
   * NASA Rule 10: ≤60 lines, fixed bounds, ≥2 assertions
   */
  async recordInteraction(interaction: AgentInteraction): Promise<boolean> {
    assert(interaction.agent_id !== undefined, 'Agent ID required');
    assert(interaction.communication_type !== undefined, 'Communication type required');

    // Add to buffer for batch processing
    const bufferKey = interaction.communication_type;
    if (!this.collectionBuffer.has(bufferKey)) {
      this.collectionBuffer.set(bufferKey, []);
    }
    this.collectionBuffer.get(bufferKey)!.push(interaction);

    // Emit event for real-time monitoring
    this.emit('interaction_recorded', {
      type: interaction.communication_type,
      agent: interaction.agent_id,
      timestamp: interaction.timestamp
    });

    // Process buffer if it reaches batch size
    if (this.collectionBuffer.get(bufferKey)!.length >= 5) {
      await this.processBatch(bufferKey);
    }

    return true;
  }

  /**
   * Collect examples from SPEK agent logs
   */
  async collectFromAgentLogs(logFilePath: string): Promise<number> {
    assert(logFilePath.length > 0, 'Log file path required');

    try {
      // In a real implementation, this would parse actual log files
      // For now, we'll simulate log parsing
      const simulatedLogs = await this.simulateLogParsing(logFilePath);
      let collectedCount = 0;

      for (const logEntry of simulatedLogs) {
        const interaction = this.parseLogEntry(logEntry);
        if (interaction && await this.shouldCollectInteraction(interaction)) {
          await this.recordInteraction(interaction);
          collectedCount++;
        }
      }

      this.emit('batch_collected', {
        source: 'agent_logs',
        count: collectedCount,
        file: logFilePath
      });

      return collectedCount;
    } catch (error) {
      this.emit('collection_error', {
        source: 'agent_logs',
        error: error instanceof Error ? error.message : 'Unknown error',
        file: logFilePath
      });
      return 0;
    }
  }

  /**
   * Collect examples from swarm communications
   */
  async collectFromSwarmCommunications(swarmId: string): Promise<number> {
    assert(swarmId.length > 0, 'Swarm ID required');

    try {
      // Integration with SPEK swarm system
      const communications = await this.fetchSwarmCommunications(swarmId);
      let collectedCount = 0;

      for (const comm of communications) {
        const interaction = this.parseSwarmCommunication(comm);
        if (interaction && await this.shouldCollectInteraction(interaction)) {
          await this.recordInteraction(interaction);
          collectedCount++;
        }
      }

      this.emit('batch_collected', {
        source: 'swarm_communications',
        count: collectedCount,
        swarm_id: swarmId
      });

      return collectedCount;
    } catch (error) {
      this.emit('collection_error', {
        source: 'swarm_communications',
        error: error instanceof Error ? error.message : 'Unknown error',
        swarm_id: swarmId
      });
      return 0;
    }
  }

  /**
   * Process user feedback to improve collection quality
   */
  async processFeedback(exampleId: string, feedback: {
    satisfaction: number;
    effectiveness: number;
    comments?: string;
  }): Promise<void> {
    // Update example with feedback
    await this.dataset.updateExample(exampleId, {
      metadata: {
        user_feedback: feedback,
        feedback_received: new Date().toISOString()
      }
    });

    // Adjust collection thresholds based on feedback
    this.adjustThresholds(feedback);

    this.emit('feedback_processed', {
      example_id: exampleId,
      feedback
    });
  }

  /**
   * Get collection statistics and health metrics
   */
  getCollectionStats(): {
    stats: typeof this.collectionStats;
    health: {
      collection_rate_24h: number;
      quality_rate: number;
      buffer_size: number;
      status: 'healthy' | 'degraded' | 'critical';
    };
    recommendations: string[];
  } {
    const bufferSize = Array.from(this.collectionBuffer.values())
      .reduce((total, buffer) => total + buffer.length, 0);

    const qualityRate = this.collectionStats.total_collected > 0
      ? (this.collectionStats.collected_today / (this.collectionStats.collected_today + this.collectionStats.rejected_today))
      : 0;

    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    const recommendations: string[] = [];

    if (this.collectionStats.collected_today < this.config.collection_rate / 24) {
      status = 'degraded';
      recommendations.push('Collection rate below target - check agent activity');
    }

    if (qualityRate < 0.5) {
      status = 'critical';
      recommendations.push('Low quality rate - review collection criteria');
    }

    if (bufferSize > 50) {
      recommendations.push('Large buffer size - consider increasing processing frequency');
    }

    return {
      stats: this.collectionStats,
      health: {
        collection_rate_24h: this.collectionStats.collected_today,
        quality_rate: qualityRate,
        buffer_size: bufferSize,
        status
      },
      recommendations
    };
  }

  /**
   * Start automated collection from configured sources
   */
  startAutomatedCollection(): void {
    if (!this.config.auto_collection_enabled) {
      return;
    }

    // Process buffers every 5 minutes
    setInterval(async () => {
      for (const [type, buffer] of this.collectionBuffer.entries()) {
        if (buffer.length > 0) {
          await this.processBatch(type);
        }
      }
    }, 5 * 60 * 1000);

    // Collect from agent logs every hour
    setInterval(async () => {
      try {
        await this.collectFromAgentLogs('./logs/agent-interactions.log');
      } catch (error) {
        console.error('Automated collection error:', error);
      }
    }, 60 * 60 * 1000);

    this.emit('automated_collection_started');
  }

  /**
   * Stop automated collection
   */
  stopAutomatedCollection(): void {
    // In a real implementation, this would clear intervals
    this.emit('automated_collection_stopped');
  }

  // Private helper methods

  private initializeCollection(): void {
    // Initialize collection buffers for each communication type
    const types: CommunicationType[] = ['queen_princess', 'princess_drone', 'drone_princess', 'princess_queen', 'context_dna'];
    types.forEach(type => {
      this.collectionBuffer.set(type, []);
    });

    // Reset daily stats at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    setTimeout(() => {
      this.collectionStats.collected_today = 0;
      this.collectionStats.rejected_today = 0;

      // Reset daily at midnight every day
      setInterval(() => {
        this.collectionStats.collected_today = 0;
        this.collectionStats.rejected_today = 0;
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  private async processBatch(communicationType: string): Promise<void> {
    const buffer = this.collectionBuffer.get(communicationType);
    if (!buffer || buffer.length === 0) return;

    const interactions = buffer.splice(0); // Clear buffer
    let processedCount = 0;

    for (const interaction of interactions) {
      try {
        if (await this.shouldCollectInteraction(interaction)) {
          const example = await this.convertToExample(interaction);
          await this.dataset.addExample(example);
          processedCount++;
          this.collectionStats.collected_today++;
          this.collectionStats.total_collected++;
        } else {
          this.collectionStats.rejected_today++;
        }
      } catch (error) {
        console.error('Error processing interaction:', error);
        this.collectionStats.rejected_today++;
      }
    }

    this.collectionStats.last_collection = new Date().toISOString();

    this.emit('batch_processed', {
      type: communicationType,
      processed: processedCount,
      rejected: interactions.length - processedCount
    });
  }

  private async shouldCollectInteraction(interaction: AgentInteraction): Promise<boolean> {
    // Check current dataset size
    const examples = await this.dataset.getExamples(interaction.communication_type);
    if (examples.length >= this.config.max_examples_per_type) {
      return false;
    }

    // Quick quality assessment
    const tempExample = await this.convertToExample(interaction);
    const scoring = await this.scorer.scoreExample(tempExample);

    return scoring.overall_score >= this.config.quality_threshold;
  }

  private async convertToExample(interaction: AgentInteraction): Promise<CommunicationExample> {
    return {
      id: `collected_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      communication_type: interaction.communication_type,
      input: {
        context: interaction.input_context,
        requirements: this.extractRequirements(interaction.input_context),
        constraints: this.extractConstraints(interaction.input_context)
      },
      output: {
        communication: interaction.output_communication,
        structured_data: this.extractStructuredData(interaction.output_communication),
        quality_metrics: {
          clarity: 0, // Will be calculated by scorer
          completeness: 0,
          actionability: 0
        }
      },
      scoring: {
        clarity: 0,
        actionability: 0,
        completeness: 0,
        efficiency: 0,
        overall_score: 0
      },
      metadata: {
        created_date: interaction.timestamp,
        agent_source: interaction.agent_id,
        validation_status: 'pending',
        performance_data: interaction.performance_data,
        user_feedback: interaction.user_feedback,
        collection_source: 'automated'
      }
    };
  }

  private extractRequirements(context: Record<string, any>): string[] {
    // Extract requirements from context
    const requirements: string[] = [];
    if (context.requirements) {
      requirements.push(...(Array.isArray(context.requirements) ? context.requirements : [context.requirements]));
    }
    if (context.goals) {
      requirements.push(...(Array.isArray(context.goals) ? context.goals : [context.goals]));
    }
    return requirements;
  }

  private extractConstraints(context: Record<string, any>): Record<string, any> {
    return {
      timeline: context.timeline || context.deadline,
      resources: context.resources || context.budget,
      dependencies: context.dependencies,
      technical_constraints: context.technical_constraints
    };
  }

  private extractStructuredData(communication: string): Record<string, any> {
    // Basic extraction of structured elements from communication
    const structured: Record<string, any> = {};

    // Extract task IDs
    const taskIdMatch = communication.match(/task[_\s]*id[:\s]*([a-zA-Z0-9_-]+)/i);
    if (taskIdMatch) {
      structured.task_id = taskIdMatch[1];
    }

    // Extract priorities
    const priorityMatch = communication.match(/priority[:\s]*(high|medium|low|critical)/i);
    if (priorityMatch) {
      structured.priority = priorityMatch[1].toLowerCase();
    }

    // Extract deadlines
    const deadlineMatch = communication.match(/deadline[:\s]*([^.!?\n]+)/i);
    if (deadlineMatch) {
      structured.deadline = deadlineMatch[1].trim();
    }

    return structured;
  }

  private adjustThresholds(feedback: { satisfaction: number; effectiveness: number }): void {
    // Adjust collection thresholds based on user feedback
    const avgFeedback = (feedback.satisfaction + feedback.effectiveness) / 2;

    if (avgFeedback < 5) {
      // Poor feedback - raise threshold
      this.config.quality_threshold = Math.min(9, this.config.quality_threshold + 0.2);
    } else if (avgFeedback > 8) {
      // Good feedback - can lower threshold slightly
      this.config.quality_threshold = Math.max(5, this.config.quality_threshold - 0.1);
    }
  }

  private async simulateLogParsing(logFilePath: string): Promise<any[]> {
    // Simulate parsing log entries - in real implementation would read actual files
    return [
      {
        timestamp: new Date().toISOString(),
        agent_id: 'queen_01',
        type: 'queen_princess',
        input: { domain: 'development', tasks: ['implement auth'] },
        output: 'Implement authentication system with JWT tokens...'
      }
    ];
  }

  private parseLogEntry(logEntry: any): AgentInteraction | null {
    try {
      return {
        timestamp: logEntry.timestamp,
        agent_id: logEntry.agent_id,
        communication_type: logEntry.type,
        input_context: logEntry.input,
        output_communication: logEntry.output
      };
    } catch {
      return null;
    }
  }

  private async fetchSwarmCommunications(swarmId: string): Promise<any[]> {
    // Simulate fetching from swarm system
    return [];
  }

  private parseSwarmCommunication(comm: any): AgentInteraction | null {
    // Parse swarm communication format
    return null;
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}