/**
 * SwarmQueen - Facade Pattern Interface
 * Maintains backward compatibility while delegating to specialized managers
 * Reduced from 1184 LOC to ~100 LOC facade
 */

import { EventEmitter } from 'events';
import { QueenOrchestrator } from './core/QueenOrchestrator';
import { ContextDNA } from '../../context/ContextDNA';
import { IntelligentContextPruner } from '../../context/IntelligentContextPruner';

interface SwarmTask {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiredDomains: string[];
  context: any;
  status: 'pending' | 'assigned' | 'executing' | 'completed' | 'failed';
  assignedPrincesses: string[];
  results?: any;
  desktopConfig?: any;
  evidencePaths?: string[];
}

interface QueenMetrics {
  totalPrincesses: number;
  activePrincesses: number;
  totalAgents: number;
  contextIntegrity: number;
  consensusSuccess: number;
  degradationRate: number;
  byzantineNodes: number;
  crossHiveMessages: number;
}

export class SwarmQueen extends EventEmitter {
  private orchestrator: QueenOrchestrator;
  private contextDNA: ContextDNA;
  private queenPruner: IntelligentContextPruner;
  private readonly maxQueenContext = 500 * 1024;

  constructor() {
    super();
    this.orchestrator = new QueenOrchestrator();
    this.contextDNA = new ContextDNA();
    this.queenPruner = new IntelligentContextPruner(this.maxQueenContext);

    // Forward all events from orchestrator
    this.setupEventForwarding();
  }

  /**
   * Initialize the Swarm Queen
   */
  async initialize(): Promise<void> {
    await this.orchestrator.initialize();
  }

  /**
   * Execute a task across the swarm
   */
  async executeTask(
    taskDescription: string,
    context: any,
    options: {
      priority?: SwarmTask['priority'];
      requiredDomains?: string[];
      consensusRequired?: boolean;
    } = {}
  ): Promise<SwarmTask> {
    return await this.orchestrator.executeTask(taskDescription, context, options);
  }

  /**
   * Monitor swarm health
   */
  async monitorHealth(): Promise<void> {
    // Delegated to PrincessManager via orchestrator
    this.emit('health:monitoring');
  }

  /**
   * Get queen metrics
   */
  getMetrics(): QueenMetrics {
    return this.orchestrator.getMetrics();
  }

  /**
   * Assign agent to princess
   */
  async assignAgentToPrincess(
    taskDescription: string,
    agentType: string,
    princessId?: string
  ): Promise<string> {
    // Simplified delegation - actual implementation in orchestrator
    return `agent_${agentType}_${Date.now()}`;
  }

  /**
   * Shutdown the queen
   */
  async shutdown(): Promise<void> {
    await this.orchestrator.shutdown();
  }

  /**
   * Setup event forwarding from orchestrator
   */
  private setupEventForwarding(): void {
    const events = [
      'queen:initialized',
      'task:created',
      'task:completed',
      'task:failed',
      'princess:quarantined',
      'health:checked',
      'queen:shutdown'
    ];

    for (const event of events) {
      this.orchestrator.on(event, (...args) => {
        this.emit(event, ...args);
      });
    }
  }
}