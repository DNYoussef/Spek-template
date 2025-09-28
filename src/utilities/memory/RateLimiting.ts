import { PrincessDomain } from '../../coordinator/MemoryCoordinator';
import { MemoryAccessPolicy } from './AccessControl';

export interface RateLimitData {
  requests: number[];
  dataTransfer: number[];
}

/**
 * Rate limiting utilities for memory operations
 */
export class RateLimitUtils {
  private static readonly RATE_LIMIT_WINDOW = 60000; // 1 minute

  static checkRateLimit(
    domain: PrincessDomain,
    dataSize: number,
    policy: MemoryAccessPolicy | undefined,
    tracking: RateLimitData
  ): boolean {
    if (!policy) {
      return false;
    }

    const now = Date.now();

    // Clean old entries
    tracking.requests = tracking.requests.filter(
      time => now - time < this.RATE_LIMIT_WINDOW
    );
    tracking.dataTransfer = tracking.dataTransfer.filter(
      time => now - time < this.RATE_LIMIT_WINDOW
    );

    // Check limits
    if (tracking.requests.length >= policy.rateLimits.requestsPerMinute) {
      return false;
    }

    const currentDataTransfer = tracking.dataTransfer.length;
    if (currentDataTransfer + dataSize > policy.rateLimits.dataTransferPerMinute) {
      return false;
    }

    return true;
  }

  static updateRateLimit(
    domain: PrincessDomain,
    dataSize: number,
    tracking: RateLimitData
  ): void {
    const now = Date.now();
    tracking.requests.push(now);

    // Add entries for each KB
    for (let i = 0; i < dataSize; i += 1024) {
      tracking.dataTransfer.push(now);
    }
  }

  static getRateLimitStatus(
    domain: PrincessDomain,
    tracking: RateLimitData | undefined
  ): { requests: number; dataTransfer: number } {
    if (!tracking) {
      return { requests: 0, dataTransfer: 0 };
    }

    const now = Date.now();
    const recentRequests = tracking.requests.filter(
      time => now - time < this.RATE_LIMIT_WINDOW
    );
    const recentTransfer = tracking.dataTransfer.filter(
      time => now - time < this.RATE_LIMIT_WINDOW
    );

    return {
      requests: recentRequests.length,
      dataTransfer: recentTransfer.length
    };
  }

  static cleanupExpiredEntries(tracking: RateLimitData): void {
    const now = Date.now();
    tracking.requests = tracking.requests.filter(
      time => now - time < this.RATE_LIMIT_WINDOW
    );
    tracking.dataTransfer = tracking.dataTransfer.filter(
      time => now - time < this.RATE_LIMIT_WINDOW
    );
  }
}