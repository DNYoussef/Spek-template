/**
 * ID generation utilities for memory operations
 */
export class IdGenerationUtils {
  /**
   * Generate unique request ID with timestamp and random component
   */
  static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Generate unique message ID with timestamp and random component
   */
  static generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Generate unique subscription ID with timestamp and random component
   */
  static generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique event key for persistence
   */
  static generateEventKey(timestamp: number, version: number): string {
    return `bus_event_${timestamp}_${version}`;
  }

  /**
   * Generate unique block ID for memory allocation
   */
  static generateBlockId(): string {
    return `block_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * Extract timestamp from generated ID
   */
  static extractTimestamp(id: string): number | null {
    const match = id.match(/_(\\d+)_/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Validate ID format
   */
  static isValidId(id: string, prefix: string): boolean {
    const pattern = new RegExp(`^${prefix}_\\d+_[a-z0-9]+$`);
    return pattern.test(id);
  }
}