/**
 * Real ID Generator - Replaces Math.random() with proper UUIDs
 */

import { v4 as uuidv4, v1 as uuidv1 } from 'uuid';

export class IdGenerator {
  /**
   * Generate UUID v4 (random)
   */
  static generateId(): string {
    return uuidv4();
  }

  /**
   * Generate UUID v1 (timestamp-based)
   */
  static generateTimestampId(): string {
    return uuidv1();
  }

  /**
   * Generate short ID (8 characters)
   */
  static generateShortId(): string {
    return uuidv4().split('-')[0];
  }

  /**
   * Generate connection ID
   */
  static generateConnectionId(): string {
    return `conn_${this.generateShortId()}`;
  }

  /**
   * Generate message ID
   */
  static generateMessageId(): string {
    return `msg_${Date.now()}_${this.generateShortId()}`;
  }

  /**
   * Generate session ID
   */
  static generateSessionId(): string {
    return `session_${this.generateShortId()}`;
  }

  /**
   * Generate task ID
   */
  static generateTaskId(): string {
    return `task_${this.generateShortId()}`;
  }
}