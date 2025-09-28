import { PrincessDomain } from '../../coordinator/MemoryCoordinator';

export interface CrossDomainMessage {
  messageId: string;
  fromDomain: PrincessDomain;
  toDomain: PrincessDomain;
  messageType: 'request' | 'response' | 'notification' | 'coordination';
  payload: any;
  priority: 'low' | 'normal' | 'high' | 'critical';
  requiresAcknowledgment: boolean;
  timestamp: Date;
  expiresAt?: Date;
}

/**
 * Message validation utilities
 */
export class MessageValidationUtils {
  /**
   * Validate cross-domain message structure
   */
  static validateMessage(message: CrossDomainMessage): boolean {
    // Basic validation
    if (!message.fromDomain || !message.toDomain || !message.messageType) {
      return false;
    }

    // Check if message is expired
    if (message.expiresAt && message.expiresAt <= new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Validate message payload size
   */
  static validatePayloadSize(payload: any, maxSize: number = 1024 * 1024): boolean {
    try {
      const size = JSON.stringify(payload).length;
      return size <= maxSize;
    } catch {
      return false;
    }
  }

  /**
   * Check if message type is allowed for domain
   */
  static isMessageTypeAllowed(
    messageType: CrossDomainMessage['messageType'],
    fromDomain: PrincessDomain,
    toDomain: PrincessDomain
  ): boolean {
    // Basic rules - can be extended based on domain policies
    switch (messageType) {
      case 'coordination':
        return true; // All domains can coordinate
      case 'notification':
        return true; // All domains can send notifications
      case 'request':
        return fromDomain !== PrincessDomain.SYSTEM; // System domain is read-only
      case 'response':
        return true; // Responses are always allowed
      default:
        return false;
    }
  }

  /**
   * Validate message priority
   */
  static isValidPriority(priority: string): priority is CrossDomainMessage['priority'] {
    return ['low', 'normal', 'high', 'critical'].includes(priority);
  }

  /**
   * Check if message requires immediate processing
   */
  static requiresImmediateProcessing(message: CrossDomainMessage): boolean {
    return message.priority === 'critical' || message.requiresAcknowledgment;
  }

  /**
   * Sanitize message payload for security
   */
  static sanitizePayload(payload: any): any {
    // Remove potentially dangerous properties
    if (payload && typeof payload === 'object') {
      const sanitized = { ...payload };
      delete sanitized.__proto__;
      delete sanitized.constructor;
      delete sanitized.prototype;
      return sanitized;
    }
    return payload;
  }
}