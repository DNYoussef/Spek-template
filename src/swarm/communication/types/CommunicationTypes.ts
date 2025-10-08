/**
 * Communication Types
 * Type definitions for Princess communication system
 */

import { ContextFingerprint } from '../../../context/ContextDNA';

export interface CommunicationChannel {
  channelId: string;
  fromDomain: string;
  toDomain: string;
  channelType: 'direct' | 'consensus' | 'broadcast' | 'emergency';
  established: number;
  lastActivity: number;
  messageCount: number;
  integrityScore: number;
  active: boolean;
}

export interface PrincessMessage {
  messageId: string;
  fromPrincess: string;
  toPrincess: string | string[]; // Single or broadcast
  messageType: 'task_handoff' | 'status_update' | 'escalation' | 'resource_request' | 'coordination_sync';
  priority: 'low' | 'medium' | 'high' | 'critical' | 'emergency';
  payload: any;
  contextFingerprint: ContextFingerprint;
  requiresAcknowledgment: boolean;
  requiresConsensus: boolean;
  timestamp: number;
  expiresAt?: number;
  retryCount: number;
}

export interface MessageResponse {
  responseId: string;
  originalMessageId: string;
  fromPrincess: string;
  status: 'acknowledged' | 'accepted' | 'rejected' | 'escalated';
  response?: any;
  reason?: string;
  timestamp: number;
}

export interface CommunicationMetrics {
  totalMessages: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageResponseTime: number;
  integrityViolations: number;
  consensusRequests: number;
  escalations: number;
}

export interface ConsensusRequest {
  requestId: string;
  messageId: string;
  participants: string[];
  threshold: number;
  votes: Map<string, boolean>;
  startTime: number;
  timeout: number;
  resolved: boolean;
}

export interface BroadcastResult {
  messageId: string;
  totalTargets: number;
  successfulDeliveries: number;
  failures: Array<{
    target: string;
    reason: string;
  }>;
  completedAt: number;
}

export interface ChannelHealthMetrics {
  channelId: string;
  uptime: number;
  messageLatency: number;
  errorRate: number;
  lastHealthCheck: number;
  status: 'healthy' | 'degraded' | 'failed';
}

export interface SecurityValidation {
  messageId: string;
  integrityCheck: boolean;
  authenticationCheck: boolean;
  authorizationCheck: boolean;
  contextValidation: boolean;
  timestamp: number;
  violations: string[];
}

export interface EscalationRule {
  ruleId: string;
  condition: string;
  targetPrincess: string;
  priority: 'high' | 'critical' | 'emergency';
  autoEscalate: boolean;
  escalationDelay: number;
}