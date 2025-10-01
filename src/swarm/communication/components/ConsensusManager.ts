/**
 * Consensus Manager Component
 * Manages consensus-based decision making for Princess communication
 * NASA Rule 10 Compliant with bounded consensus attempts
 */

import { EventEmitter } from 'events';
import { ConsensusRequest, PrincessMessage, MessageResponse } from '~types/CommunicationTypes';

export class ConsensusManager extends EventEmitter {
  private activeConsensus: Map<string, ConsensusRequest> = new Map();
  private consensusHistory: ConsensusRequest[] = [];

  private readonly MAX_CONSENSUS_PARTICIPANTS = 7; // NASA Rule 10: max 7 participants
  private readonly DEFAULT_CONSENSUS_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_CONCURRENT_CONSENSUS = 5; // Prevent resource exhaustion

  constructor() {
    super();
    this.startConsensusMonitoring();
  }

  public async initiateConsensus(
    message: PrincessMessage,
    participants: string[],
    threshold: number = 0.6
  ): Promise<string> {
    if (this.activeConsensus.size >= this.MAX_CONCURRENT_CONSENSUS) {
      throw new Error('Maximum concurrent consensus requests exceeded');
    }

    const boundedParticipants = participants.slice(0, this.MAX_CONSENSUS_PARTICIPANTS);

    if (boundedParticipants.length === 0) {
      throw new Error('No participants specified for consensus');
    }

    const requestId = this.generateRequestId();
    const consensusRequest: ConsensusRequest = {
      requestId,
      messageId: message.messageId,
      participants: boundedParticipants,
      threshold: Math.min(Math.max(threshold, 0.1), 1.0), // Bound between 0.1 and 1.0
      votes: new Map(),
      startTime: Date.now(),
      timeout: Date.now() + this.DEFAULT_CONSENSUS_TIMEOUT,
      resolved: false
    };

    this.activeConsensus.set(requestId, consensusRequest);

    // Notify participants
    this.emit('consensus_initiated', {
      requestId,
      message,
      participants: boundedParticipants,
      threshold: consensusRequest.threshold
    });

    return requestId;
  }

  public submitVote(requestId: string, participant: string, vote: boolean): boolean {
    const consensus = this.activeConsensus.get(requestId);

    if (!consensus || consensus.resolved) {
      return false;
    }

    if (!consensus.participants.includes(participant)) {
      return false;
    }

    consensus.votes.set(participant, vote);

    const result = this.evaluateConsensus(consensus);
    if (result !== null) {
      this.resolveConsensus(requestId, result);
    }

    return true;
  }

  public getConsensusStatus(requestId: string): ConsensusRequest | null {
    return this.activeConsensus.get(requestId) || null;
  }

  public getAllActiveConsensus(): ConsensusRequest[] {
    return Array.from(this.activeConsensus.values());
  }

  private evaluateConsensus(consensus: ConsensusRequest): boolean | null {
    const totalParticipants = consensus.participants.length;
    const totalVotes = consensus.votes.size;

    // Check if all participants have voted
    if (totalVotes === totalParticipants) {
      const positiveVotes = Array.from(consensus.votes.values()).filter(vote => vote).length;
      return (positiveVotes / totalParticipants) >= consensus.threshold;
    }

    // Check if consensus is mathematically impossible
    const positiveVotes = Array.from(consensus.votes.values()).filter(vote => vote).length;
    const remainingVotes = totalParticipants - totalVotes;
    const maxPossiblePositive = positiveVotes + remainingVotes;
    const minRequiredPositive = Math.ceil(totalParticipants * consensus.threshold);

    if (maxPossiblePositive < minRequiredPositive) {
      return false; // Consensus cannot be reached
    }

    // Check if consensus is already achieved
    if (positiveVotes >= minRequiredPositive) {
      return true; // Consensus already achieved
    }

    return null; // Continue waiting for more votes
  }

  private resolveConsensus(requestId: string, result: boolean): void {
    const consensus = this.activeConsensus.get(requestId);
    if (!consensus) return;

    consensus.resolved = true;

    this.emit('consensus_resolved', {
      requestId,
      result,
      votes: Array.from(consensus.votes.entries()),
      participationRate: consensus.votes.size / consensus.participants.length
    });

    // Move to history
    this.consensusHistory.push(consensus);
    this.activeConsensus.delete(requestId);

    // Limit history size (NASA Rule 10)
    if (this.consensusHistory.length > 100) {
      this.consensusHistory = this.consensusHistory.slice(-50);
    }
  }

  private startConsensusMonitoring(): void {
    setInterval(() => {
      const now = Date.now();
      const expiredRequests: string[] = [];

      for (const [requestId, consensus] of this.activeConsensus) {
        if (now > consensus.timeout && !consensus.resolved) {
          expiredRequests.push(requestId);
        }
      }

      // Handle expired consensus requests
      expiredRequests.forEach(requestId => {
        const consensus = this.activeConsensus.get(requestId);
        if (consensus) {
          this.emit('consensus_timeout', {
            requestId,
            participantCount: consensus.participants.length,
            voteCount: consensus.votes.size
          });

          // Force resolution based on current votes
          const result = this.evaluateConsensus(consensus);
          this.resolveConsensus(requestId, result === true);
        }
      });
    }, 1000); // Check every second
  }

  private generateRequestId(): string {
    return `consensus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getConsensusMetrics(): any {
    const activeCount = this.activeConsensus.size;
    const historyCount = this.consensusHistory.length;

    const successfulConsensus = this.consensusHistory.filter(c => {
      const result = this.evaluateConsensus(c);
      return result === true;
    }).length;

    return {
      activeConsensusRequests: activeCount,
      totalHistoricalRequests: historyCount,
      successRate: historyCount > 0 ? successfulConsensus / historyCount : 0,
      averageParticipants: historyCount > 0
        ? this.consensusHistory.reduce((sum, c) => sum + c.participants.length, 0) / historyCount
        : 0
    };
  }

  public destroy(): void {
    this.activeConsensus.clear();
    this.consensusHistory = [];
  }
}