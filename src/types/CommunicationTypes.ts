/**
 * CommunicationTypes.ts - Princess Communication Type Definitions
 * @stub true
 * @architecture Multi-princess communication and coordination type system
 */

// Princess message
export interface PrincessMessage {
  readonly id: string;
  readonly from: string; // Princess ID
  readonly to: string; // Princess ID or 'broadcast'
  readonly type: MessageType;
  readonly payload: Record<string, unknown>;
  readonly timestamp: number;
  readonly priority: MessagePriority;
  readonly requiresAck: boolean;
  readonly metadata?: Record<string, unknown>;
  readonly messageId?: string;
  readonly fromPrincess?: string;
  readonly toPrincess?: string;
}

// Message type
export enum MessageType {
  REQUEST = 'REQUEST',
  RESPONSE = 'RESPONSE',
  NOTIFICATION = 'NOTIFICATION',
  BROADCAST = 'BROADCAST',
  ERROR = 'ERROR',
  ACK = 'ACK'
}

// Message priority
export enum MessagePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Message response
export interface MessageResponse {
  readonly messageId: string;
  readonly success: boolean;
  readonly data?: Record<string, unknown>;
  readonly error?: string;
  readonly timestamp: number;
  readonly processingTime: number;
}

// Communication channel
export interface CommunicationChannel {
  readonly id: string;
  readonly name: string;
  readonly participants: readonly string[];
  readonly type: ChannelType;
  readonly config: ChannelConfig;
  readonly active: boolean;
}

// Channel type
export enum ChannelType {
  DIRECT = 'DIRECT',
  BROADCAST = 'BROADCAST',
  MULTICAST = 'MULTICAST',
  PUBSUB = 'PUBSUB'
}

// Channel configuration
export interface ChannelConfig {
  readonly maxMessageSize: number; // bytes
  readonly timeout: number; // milliseconds
  readonly retryAttempts: number;
  readonly encryption: boolean;
  readonly compression: boolean;
}

// Security validation
export interface SecurityValidation {
  readonly valid: boolean;
  readonly principalId: string;
  readonly permissions: readonly string[];
  readonly violations: readonly string[];
  readonly timestamp: number;
}

// Consensus request
export interface ConsensusRequest {
  readonly id: string;
  readonly proposer: string;
  readonly proposal: Record<string, unknown>;
  readonly requiredVotes: number;
  readonly timeout: number;
  readonly priority: MessagePriority;
  threshold?: number;
  participants?: string[];
  votes?: Map<string, boolean>;
  resolved?: boolean;
}

// Consensus vote
export interface ConsensusVote {
  readonly requestId: string;
  readonly voter: string;
  readonly approve: boolean;
  readonly reason?: string;
  readonly timestamp: number;
}

// Consensus result
export interface ConsensusResult {
  readonly requestId: string;
  readonly approved: boolean;
  readonly votes: readonly ConsensusVote[];
  readonly finalizedAt: number;
  readonly executionPlan?: Record<string, unknown>;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0
// === END FOOTER ===
