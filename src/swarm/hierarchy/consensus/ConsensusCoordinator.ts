/**
 * ConsensusCoordinator - Byzantine fault tolerance and consensus protocols
 * Manages quorum calculations, Byzantine detection, and consensus mechanisms
 */

import { EventEmitter } from 'events';
import { HivePrincess } from '../HivePrincess';
import { PrincessConsensus } from '../PrincessConsensus';

interface ConsensusProposal {
  id: string;
  proposer: string;
  type: 'decision' | 'escalation' | 'recovery';
  content: any;
  timestamp: number;
}

interface ConsensusMetrics {
  totalProposals: number;
  successfulConsensus: number;
  failedConsensus: number;
  byzantineNodes: Set<string>;
  successRate: number;
}

export class ConsensusCoordinator extends EventEmitter {
  private consensus!: PrincessConsensus;
  private proposals: Map<string, ConsensusProposal> = new Map();
  private byzantineNodes: Set<string> = new Set();
  private metrics: ConsensusMetrics = {
    totalProposals: 0,
    successfulConsensus: 0,
    failedConsensus: 0,
    byzantineNodes: new Set(),
    successRate: 0
  };

  constructor() {
    super();
  }

  /**
   * Initialize consensus system with princesses
   */
  async initialize(princesses: Map<string, HivePrincess>): Promise<void> {
    console.log(' Initializing Consensus Coordinator...');

    this.consensus = new PrincessConsensus(princesses);

    // Setup event listeners
    this.setupEventHandlers();

    console.log(' Consensus Coordinator initialized');
  }

  /**
   * Propose a decision for consensus
   */
  async propose(
    proposerId: string,
    type: ConsensusProposal['type'],
    content: any
  ): Promise<ConsensusProposal> {
    const proposal: ConsensusProposal = {
      id: this.generateProposalId(),
      proposer: proposerId,
      type,
      content,
      timestamp: Date.now()
    };

    this.proposals.set(proposal.id, proposal);
    this.metrics.totalProposals++;

    console.log(` New consensus proposal: ${proposal.id} (${type})`);

    // Submit to consensus system
    await this.consensus.propose(proposerId, type, content);

    return proposal;
  }

  /**
   * Setup event handlers for consensus system
   */
  private setupEventHandlers(): void {
    this.consensus.on('consensus:reached', (result) => {
      this.metrics.successfulConsensus++;
      this.updateSuccessRate();
      this.emit('consensus:reached', result);
    });

    this.consensus.on('consensus:failed', (failure) => {
      this.metrics.failedConsensus++;
      this.updateSuccessRate();
      this.emit('consensus:failed', failure);
    });

    this.consensus.on('byzantine:detected', ({ princess, pattern }) => {
      this.byzantineNodes.add(princess);
      this.metrics.byzantineNodes.add(princess);
      this.emit('byzantine:detected', { princess, pattern });

      console.warn(` Byzantine node detected: ${princess} - ${pattern}`);
    });
  }

  /**
   * Check if a princess is Byzantine
   */
  isByzantine(princessId: string): boolean {
    return this.byzantineNodes.has(princessId);
  }

  /**
   * Get Byzantine nodes
   */
  getByzantineNodes(): Set<string> {
    return new Set(this.byzantineNodes);
  }

  /**
   * Calculate quorum size
   */
  calculateQuorum(totalPrincesses: number): number {
    // Byzantine fault tolerance: need 2f+1 for f faulty nodes
    const maxFaulty = Math.floor((totalPrincesses - 1) / 3);
    return 2 * maxFaulty + 1;
  }

  /**
   * Verify consensus result
   */
  async verifyConsensus(proposalId: string): Promise<boolean> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      return false;
    }

    // Check if consensus was reached
    return this.metrics.successfulConsensus > 0;
  }

  /**
   * Get consensus metrics
   */
  getMetrics(): ConsensusMetrics {
    return {
      ...this.metrics,
      byzantineNodes: new Set(this.byzantineNodes)
    };
  }

  /**
   * Get consensus system
   */
  getConsensus(): PrincessConsensus {
    return this.consensus;
  }

  /**
   * Update success rate
   */
  private updateSuccessRate(): void {
    const total = this.metrics.successfulConsensus + this.metrics.failedConsensus;
    this.metrics.successRate = total > 0 ? this.metrics.successfulConsensus / total : 0;
  }

  /**
   * Generate unique proposal ID
   */
  private generateProposalId(): string {
    return `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Reset Byzantine node tracking
   */
  resetByzantineTracking(): void {
    this.byzantineNodes.clear();
    this.metrics.byzantineNodes.clear();
  }

  /**
   * Get proposal by ID
   */
  getProposal(proposalId: string): ConsensusProposal | undefined {
    return this.proposals.get(proposalId);
  }

  /**
   * Get all active proposals
   */
  getActiveProposals(): ConsensusProposal[] {
    return Array.from(this.proposals.values());
  }
}