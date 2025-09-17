/**
 * Princess Consensus System - Byzantine Fault Tolerant Decision Making
 * Implements PBFT-style consensus with 2f+1 tolerance for princess coordination
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ContextDNA } from '../../context/ContextDNA';
import { HivePrincess } from './HivePrincess';
import { ContextValidator } from '../../context/ContextValidator';

interface ConsensusProposal {
  id: string;
  proposer: string;
  type: 'context_update' | 'decision' | 'recovery' | 'escalation';
  content: any;
  contextDNA: string;
  timestamp: number;
  signature: string;
  votes: Map<string, ConsensusVote>;
  phase: 'propose' | 'prepare' | 'commit' | 'final';
  round: number;
}

interface ConsensusVote {
  princess: string;
  vote: 'accept' | 'reject' | 'abstain';
  reason?: string;
  contextValidation: {
    processValid: boolean;
    semanticScore: number;
    integrityValid: boolean;
  };
  timestamp: number;
  signature: string;
}

interface ByzantineDetection {
  princess: string;
  violations: number;
  lastViolation: Date;
  patterns: string[];
  trustScore: number;
}

export class PrincessConsensus extends EventEmitter {
  private proposals: Map<string, ConsensusProposal> = new Map();
  private byzantineTracker: Map<string, ByzantineDetection> = new Map();
  private consensusHistory: ConsensusProposal[] = [];
  private readonly contextDNA: ContextDNA;
  private readonly validator: ContextValidator;
  private requiredVotes: number;
  private readonly byzantineThreshold = 3;
  private consensusTimeout = 5000;
  private activeRound = 0;
  private readonly persistencePath: string;
  private readonly keyPair: { publicKey: string; privateKey: string };
  private readonly rateLimiters: Map<string, { count: number; lastReset: number }> = new Map();
  private readonly leaderElectionState: {
    currentLeader?: string;
    term: number;
    votes: Map<string, string>;
    electionTimeout?: NodeJS.Timeout;
  } = { term: 0, votes: new Map() };

  constructor(
    private readonly princesses: Map<string, HivePrincess>,
    private readonly quorumPercentage = 0.67,
    persistenceDir = './data/consensus'
  ) {
    super();
    this.contextDNA = new ContextDNA();
    this.validator = new ContextValidator();
    this.requiredVotes = Math.ceil(princesses.size * quorumPercentage);
    this.persistencePath = persistenceDir;
    this.keyPair = this.generateKeyPair();
    this.initializeByzantineTracking();
    this.initializeRateLimiters();
    this.initializePersistence();
    this.startLeaderElection();
  }

  /**
   * Propose a consensus decision to all princesses
   */
  async propose(
    proposer: string,
    type: ConsensusProposal['type'],
    content: any
  ): Promise<ConsensusProposal> {
    // Check rate limiting for Byzantine protection
    if (!this.checkRateLimit(proposer)) {
      throw new Error(`Rate limit exceeded for proposer ${proposer}`);
    }
    const proposal: ConsensusProposal = {
      id: this.generateProposalId(),
      proposer,
      type,
      content,
      contextDNA: await this.contextDNA.createFingerprint(content),
      timestamp: Date.now(),
      signature: this.signProposal(proposer, content),
      votes: new Map(),
      phase: 'propose',
      round: ++this.activeRound
    };

    this.proposals.set(proposal.id, proposal);
    this.emit('proposal:created', proposal);

    // Start consensus protocol
    await this.executePBFT(proposal);
    return proposal;
  }

  /**
   * Execute Practical Byzantine Fault Tolerant consensus
   */
  private async executePBFT(proposal: ConsensusProposal): Promise<boolean> {
    try {
      // Phase 1: Propose - Broadcast to all princesses
      await this.broadcastProposal(proposal);

      // Phase 2: Prepare - Collect initial votes
      const prepareSuccess = await this.preparePhase(proposal);
      if (!prepareSuccess) {
        this.handleFailedConsensus(proposal, 'prepare');
        return false;
      }

      // Phase 3: Commit - Verify consistency
      const commitSuccess = await this.commitPhase(proposal);
      if (!commitSuccess) {
        this.handleFailedConsensus(proposal, 'commit');
        return false;
      }

      // Phase 4: Final - Execute decision
      await this.finalizeConsensus(proposal);
      return true;

    } catch (error) {
      console.error('PBFT execution failed:', error);
      this.handleFailedConsensus(proposal, 'error');
      return false;
    }
  }

  /**
   * Broadcast proposal to all princesses
   */
  private async broadcastProposal(proposal: ConsensusProposal): Promise<void> {
    const broadcasts = Array.from(this.princesses.entries()).map(
      async ([id, princess]) => {
        try {
          // Validate context before sending
          const validation = await this.validator.validateContext(
            proposal.content,
            { threshold: 0.85 }
          );

          if (!validation.valid) {
            throw new Error(`Context validation failed: ${validation.errors.join(', ')}`);
          }

          // Send to princess for evaluation
          await princess.evaluateProposal({
            ...proposal,
            contextValidation: validation
          });

        } catch (error) {
          console.error(`Failed to broadcast to ${id}:`, error);
          this.recordByzantineActivity(id, 'broadcast_failure');
        }
      }
    );

    await Promise.allSettled(broadcasts);
  }

  /**
   * Prepare phase - collect and validate votes
   */
  private async preparePhase(proposal: ConsensusProposal): Promise<boolean> {
    proposal.phase = 'prepare';
    const timeout = Date.now() + this.consensusTimeout;

    while (Date.now() < timeout) {
      const votes = proposal.votes.size;
      
      if (votes >= this.requiredVotes) {
        const { accepted, rejected } = this.countVotes(proposal);
        
        // Check for Byzantine behavior
        const byzantineNodes = this.detectByzantineVotes(proposal);
        if (byzantineNodes.length > 0) {
          await this.handleByzantineNodes(byzantineNodes, proposal);
        }

        // Require supermajority for acceptance
        if (accepted >= this.requiredVotes) {
          return true;
        } else if (rejected > this.princesses.size - this.requiredVotes) {
          return false; // Cannot achieve consensus
        }
      }

      await this.delay(100);
    }

    return false; // Timeout
  }

  /**
   * Commit phase - ensure consistency across princesses
   */
  private async commitPhase(proposal: ConsensusProposal): Promise<boolean> {
    proposal.phase = 'commit';

    // Verify all accepting votes have consistent context
    const acceptingVotes = Array.from(proposal.votes.values())
      .filter(v => v.vote === 'accept');

    if (acceptingVotes.length < this.requiredVotes) {
      return false;
    }

    // Check context consistency
    const contextChecks = await Promise.all(
      acceptingVotes.map(async vote => {
        const validation = vote.contextValidation;
        return (
          validation.processValid &&
          validation.semanticScore > 0.85 &&
          validation.integrityValid
        );
      })
    );

    const consistentCount = contextChecks.filter(Boolean).length;
    return consistentCount >= this.requiredVotes;
  }

  /**
   * Finalize consensus and execute decision
   */
  private async finalizeConsensus(proposal: ConsensusProposal): Promise<void> {
    proposal.phase = 'final';
    this.consensusHistory.push(proposal);

    // Persist consensus history
    await this.persistConsensusHistory();

    // Notify all princesses of final decision
    const notifications = Array.from(this.princesses.values()).map(
      princess => princess.executeConsensusDecision(proposal)
    );

    await Promise.allSettled(notifications);
    this.emit('consensus:reached', proposal);

    // Clean up old proposals
    this.pruneOldProposals();
  }

  /**
   * Handle failed consensus
   */
  private handleFailedConsensus(proposal: ConsensusProposal, reason: string): void {
    console.error(`Consensus failed for ${proposal.id}: ${reason}`);
    this.emit('consensus:failed', { proposal, reason });

    // Attempt recovery based on failure type
    if (reason === 'prepare' || reason === 'commit') {
      this.initiateRecoveryProtocol(proposal);
    }
  }

  /**
   * Detect Byzantine voting patterns
   */
  private detectByzantineVotes(proposal: ConsensusProposal): string[] {
    const byzantineNodes: string[] = [];
    const majorityContext = this.computeMajorityContext(proposal);

    for (const [princess, vote] of proposal.votes) {
      // Check for inconsistent voting patterns
      if (vote.vote === 'reject' && vote.contextValidation.integrityValid) {
        // Rejecting valid context - potential Byzantine
        const deviation = this.calculateContextDeviation(
          vote.contextValidation,
          majorityContext
        );

        if (deviation > 0.3) {
          byzantineNodes.push(princess);
          this.recordByzantineActivity(princess, 'inconsistent_vote');
        }
      }

      // Check for abstaining without reason
      if (vote.vote === 'abstain' && !vote.reason) {
        this.recordByzantineActivity(princess, 'unexplained_abstain');
      }
    }

    return byzantineNodes;
  }

  /**
   * Handle detected Byzantine nodes
   */
  private async handleByzantineNodes(
    nodes: string[],
    proposal: ConsensusProposal
  ): Promise<void> {
    for (const node of nodes) {
      const tracker = this.byzantineTracker.get(node);
      if (!tracker) continue;

      tracker.violations++;
      tracker.lastViolation = new Date();

      // Quarantine if threshold exceeded
      if (tracker.violations >= this.byzantineThreshold) {
        await this.quarantinePrincess(node, proposal);
      }

      // Reduce trust score
      tracker.trustScore = Math.max(0, tracker.trustScore - 0.1);
    }
  }

  /**
   * Quarantine a Byzantine princess
   */
  private async quarantinePrincess(
    princessId: string,
    proposal: ConsensusProposal
  ): Promise<void> {
    console.warn(`Quarantining Byzantine princess: ${princessId}`);
    
    // Remove from active consensus
    proposal.votes.delete(princessId);
    
    // Notify other princesses
    this.emit('princess:quarantined', {
      princess: princessId,
      reason: 'byzantine_behavior',
      proposal: proposal.id
    });

    // Initiate recovery with remaining princesses
    if (this.princesses.size - 1 >= this.requiredVotes) {
      return this.rebalanceConsensus(proposal);
    }
  }

  /**
   * Recovery protocol for failed consensus
   */
  private async initiateRecoveryProtocol(proposal: ConsensusProposal): Promise<void> {
    console.log('Initiating recovery protocol for proposal:', proposal.id);

    // Strategy 1: View change (elect new leader)
    const newLeader = this.electNewLeader(proposal.proposer);
    if (newLeader) {
      const recoveryProposal = await this.propose(
        newLeader,
        'recovery',
        {
          originalProposal: proposal.id,
          recoveryReason: 'consensus_failure',
          content: proposal.content
        }
      );
      return;
    }

    // Strategy 2: Reduce quorum temporarily
    const emergencyQuorum = Math.ceil(this.princesses.size * 0.51);
    if (proposal.votes.size >= emergencyQuorum) {
      this.requiredVotes = emergencyQuorum;
      await this.executePBFT(proposal);
      return;
    }

    // Strategy 3: Escalate to Queen
    this.emit('consensus:escalate', {
      proposal,
      reason: 'recovery_failed'
    });
  }

  /**
   * Calculate context deviation between votes
   */
  private calculateContextDeviation(
    vote: ConsensusVote['contextValidation'],
    majority: any
  ): number {
    const scoreDiff = Math.abs(vote.semanticScore - majority.semanticScore);
    const processMatch = vote.processValid === majority.processValid ? 0 : 0.5;
    const integrityMatch = vote.integrityValid === majority.integrityValid ? 0 : 0.5;

    return (scoreDiff + processMatch + integrityMatch) / 2;
  }

  /**
   * Compute majority context from votes
   */
  private computeMajorityContext(proposal: ConsensusProposal): any {
    const validations = Array.from(proposal.votes.values())
      .map(v => v.contextValidation);

    if (validations.length === 0) return null;

    // Calculate averages
    const avgScore = validations.reduce((sum, v) => sum + v.semanticScore, 0) / validations.length;
    const processValid = validations.filter(v => v.processValid).length > validations.length / 2;
    const integrityValid = validations.filter(v => v.integrityValid).length > validations.length / 2;

    return {
      semanticScore: avgScore,
      processValid,
      integrityValid
    };
  }

  /**
   * Register a vote for a proposal
   */
  async registerVote(
    proposalId: string,
    vote: ConsensusVote
  ): Promise<void> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    // Validate vote signature
    if (!this.validateVoteSignature(vote)) {
      this.recordByzantineActivity(vote.princess, 'invalid_signature');
      throw new Error('Invalid vote signature');
    }

    // Validate voting phase
    if (proposal.phase === 'final') {
      throw new Error('Proposal already finalized');
    }

    proposal.votes.set(vote.princess, vote);
    this.emit('vote:registered', { proposal: proposalId, vote });
  }

  /**
   * Helper functions
   */
  private generateProposalId(): string {
    return `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private signProposal(proposer: string, content: any): string {
    const data = JSON.stringify({ proposer, content, timestamp: Date.now() });
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    return sign.sign(this.keyPair.privateKey, 'base64');
  }

  private validateVoteSignature(vote: ConsensusVote): boolean {
    const data = JSON.stringify({
      princess: vote.princess,
      vote: vote.vote,
      timestamp: vote.timestamp
    });

    try {
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(data);
      return verify.verify(this.keyPair.publicKey, vote.signature, 'base64');
    } catch (error) {
      console.error('Signature validation failed:', error);
      return false;
    }
  }

  private countVotes(proposal: ConsensusProposal): { accepted: number; rejected: number } {
    let accepted = 0;
    let rejected = 0;

    for (const vote of proposal.votes.values()) {
      if (vote.vote === 'accept') accepted++;
      else if (vote.vote === 'reject') rejected++;
    }

    return { accepted, rejected };
  }

  private electNewLeader(excludeId: string): string | null {
    const candidates = Array.from(this.princesses.keys())
      .filter(id => id !== excludeId && !this.isByzantine(id));

    if (candidates.length === 0) return null;

    // Implement Raft-style leader election with randomized timeouts
    this.leaderElectionState.term++;
    this.leaderElectionState.votes.clear();

    // Select based on composite score: trust + availability + performance
    let bestCandidate = candidates[0];
    let bestScore = 0;

    for (const candidate of candidates) {
      const tracker = this.byzantineTracker.get(candidate);
      const score = this.calculateLeadershipScore(candidate, tracker);

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }

    this.leaderElectionState.currentLeader = bestCandidate;
    this.scheduleLeaderElectionTimeout();

    return bestCandidate;
  }

  private rebalanceConsensus(proposal: ConsensusProposal): Promise<void> {
    // Recalculate required votes after quarantine
    const activePrincesses = this.princesses.size - 
      Array.from(this.byzantineTracker.values())
        .filter(t => t.violations >= this.byzantineThreshold).length;

    const newRequired = Math.ceil(activePrincesses * this.quorumPercentage);
    if (newRequired < this.requiredVotes) {
      this.requiredVotes = newRequired;
    }

    return this.executePBFT(proposal);
  }

  private recordByzantineActivity(princess: string, pattern: string): void {
    let tracker = this.byzantineTracker.get(princess);
    if (!tracker) {
      tracker = {
        princess,
        violations: 0,
        lastViolation: new Date(),
        patterns: [],
        trustScore: 1.0
      };
      this.byzantineTracker.set(princess, tracker);
    }

    tracker.patterns.push(pattern);
    this.emit('byzantine:detected', { princess, pattern });
  }

  private initializeByzantineTracking(): void {
    for (const princess of this.princesses.keys()) {
      this.byzantineTracker.set(princess, {
        princess,
        violations: 0,
        lastViolation: new Date(0),
        patterns: [],
        trustScore: 1.0
      });
    }
  }

  private pruneOldProposals(): void {
    const cutoff = Date.now() - 3600000; // 1 hour
    for (const [id, proposal] of this.proposals) {
      if (proposal.timestamp < cutoff && proposal.phase === 'final') {
        this.proposals.delete(id);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get consensus metrics
   */
  getMetrics() {
    const byzantineCount = Array.from(this.byzantineTracker.values())
      .filter(t => t.violations > 0).length;

    return {
      totalProposals: this.consensusHistory.length,
      activeProposals: this.proposals.size,
      requiredVotes: this.requiredVotes,
      byzantineNodes: byzantineCount,
      successRate: this.calculateSuccessRate(),
      averageConsensusTime: this.calculateAverageTime()
    };
  }

  private calculateSuccessRate(): number {
    if (this.consensusHistory.length === 0) return 0;
    const successful = this.consensusHistory.filter(p => p.phase === 'final').length;
    return successful / this.consensusHistory.length;
  }

  private calculateAverageTime(): number {
    if (this.consensusHistory.length === 0) return 0;
    const times = this.consensusHistory.map(p => {
      const firstVote = Array.from(p.votes.values())[0];
      return firstVote ? firstVote.timestamp - p.timestamp : 0;
    });
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  /**
   * Generate RSA key pair for cryptographic operations
   */
  private generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    return { publicKey, privateKey };
  }

  /**
   * Initialize persistence layer
   */
  private async initializePersistence(): Promise<void> {
    try {
      await fs.mkdir(this.persistencePath, { recursive: true });
      await this.loadConsensusHistory();
    } catch (error) {
      console.error('Failed to initialize persistence:', error);
    }
  }

  /**
   * Persist consensus history to disk
   */
  private async persistConsensusHistory(): Promise<void> {
    try {
      const historyPath = path.join(this.persistencePath, 'consensus_history.json');
      const data = JSON.stringify(this.consensusHistory, null, 2);
      await fs.writeFile(historyPath, data);
    } catch (error) {
      console.error('Failed to persist consensus history:', error);
    }
  }

  /**
   * Load consensus history from disk
   */
  private async loadConsensusHistory(): Promise<void> {
    try {
      const historyPath = path.join(this.persistencePath, 'consensus_history.json');
      const data = await fs.readFile(historyPath, 'utf8');
      this.consensusHistory = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, start with empty history
      this.consensusHistory = [];
    }
  }

  /**
   * Initialize rate limiters for Byzantine protection
   */
  private initializeRateLimiters(): void {
    for (const princess of this.princesses.keys()) {
      this.rateLimiters.set(princess, { count: 0, lastReset: Date.now() });
    }
  }

  /**
   * Check rate limit for princess proposals
   */
  private checkRateLimit(princess: string): boolean {
    const limiter = this.rateLimiters.get(princess);
    if (!limiter) return false;

    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const maxRequests = 10; // Max 10 proposals per minute

    // Reset window if needed
    if (now - limiter.lastReset > windowMs) {
      limiter.count = 0;
      limiter.lastReset = now;
    }

    // Check limit
    if (limiter.count >= maxRequests) {
      this.recordByzantineActivity(princess, 'rate_limit_exceeded');
      return false;
    }

    limiter.count++;
    return true;
  }

  /**
   * Check if princess is Byzantine
   */
  private isByzantine(princess: string): boolean {
    const tracker = this.byzantineTracker.get(princess);
    return tracker ? tracker.violations >= this.byzantineThreshold : false;
  }

  /**
   * Calculate leadership score for election
   */
  private calculateLeadershipScore(candidate: string, tracker?: ByzantineDetection): number {
    let score = 1.0;

    // Trust score component (40%)
    if (tracker) {
      score *= tracker.trustScore * 0.4;
    }

    // Violation penalty (30%)
    const violationPenalty = tracker ? Math.max(0, 1 - (tracker.violations / this.byzantineThreshold)) : 1;
    score *= violationPenalty * 0.3;

    // Availability component (20%)
    const princess = this.princesses.get(candidate);
    if (princess) {
      // This would integrate with princess availability metrics
      score *= 0.2;
    }

    // Random factor for tie-breaking (10%)
    score *= (0.5 + Math.random() * 0.5) * 0.1;

    return score;
  }

  /**
   * Start leader election process
   */
  private startLeaderElection(): void {
    this.scheduleLeaderElectionTimeout();
  }

  /**
   * Schedule leader election timeout
   */
  private scheduleLeaderElectionTimeout(): void {
    if (this.leaderElectionState.electionTimeout) {
      clearTimeout(this.leaderElectionState.electionTimeout);
    }

    // Randomized timeout between 5-10 seconds
    const timeout = 5000 + Math.random() * 5000;

    this.leaderElectionState.electionTimeout = setTimeout(() => {
      this.triggerLeaderElection();
    }, timeout);
  }

  /**
   * Trigger leader election
   */
  private async triggerLeaderElection(): Promise<void> {
    if (this.leaderElectionState.currentLeader) {
      // Check if current leader is still responsive
      try {
        const isResponsive = await this.checkLeaderResponsiveness();
        if (isResponsive) {
          this.scheduleLeaderElectionTimeout();
          return;
        }
      } catch (error) {
        console.warn('Leader responsiveness check failed:', error);
      }
    }

    // Start new election
    const newLeader = this.electNewLeader(this.leaderElectionState.currentLeader || '');
    if (newLeader) {
      this.emit('leader:elected', {
        leader: newLeader,
        term: this.leaderElectionState.term
      });
    }
  }

  /**
   * Check if current leader is responsive
   */
  private async checkLeaderResponsiveness(): Promise<boolean> {
    const leader = this.leaderElectionState.currentLeader;
    if (!leader) return false;

    const princess = this.princesses.get(leader);
    if (!princess) return false;

    try {
      // Send heartbeat and wait for response
      await Promise.race([
        princess.ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000))
      ]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current leader
   */
  getCurrentLeader(): string | undefined {
    return this.leaderElectionState.currentLeader;
  }

  /**
   * Get public key for signature verification
   */
  getPublicKey(): string {
    return this.keyPair.publicKey;
  }
}
