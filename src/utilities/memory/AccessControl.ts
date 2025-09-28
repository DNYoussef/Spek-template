import { PrincessDomain } from '../../coordinator/MemoryCoordinator';

export interface MemoryAccessPolicy {
  domain: PrincessDomain;
  maxSharedMemory: number;
  allowedDataTypes: string[];
  defaultPermissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  rateLimits: {
    requestsPerMinute: number;
    dataTransferPerMinute: number;
  };
  retentionPolicies: Record<string, number>; // dataType -> TTL
}

export interface SharedMemoryEntry {
  id: string;
  request: any;
  data: any;
  status: 'pending' | 'active' | 'expired' | 'revoked';
  permissions: {
    read: PrincessDomain[];
    write: PrincessDomain[];
    admin: PrincessDomain[];
  };
  accessLog: Array<{
    domain: PrincessDomain;
    operation: 'read' | 'write' | 'create' | 'delete';
    timestamp: Date;
    success: boolean;
  }>;
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt?: Date;
}

/**
 * Utilities for access control and permission management
 */
export class AccessControlUtils {
  private static readonly DEFAULT_POLICIES: Map<PrincessDomain, MemoryAccessPolicy> = new Map([
    [PrincessDomain.INFRASTRUCTURE, {
      domain: PrincessDomain.INFRASTRUCTURE,
      maxSharedMemory: 2 * 1024 * 1024, // 2MB
      allowedDataTypes: ['state', 'configuration', 'results', 'coordination'],
      defaultPermissions: { read: true, write: true, admin: false },
      rateLimits: { requestsPerMinute: 120, dataTransferPerMinute: 10 * 1024 * 1024 },
      retentionPolicies: {
        'state': 600000,
        'configuration': 3600000,
        'results': 1800000,
        'coordination': 300000
      }
    }],
    [PrincessDomain.RESEARCH, {
      domain: PrincessDomain.RESEARCH,
      maxSharedMemory: 2 * 1024 * 1024, // 2MB
      allowedDataTypes: ['results', 'coordination', 'notification'],
      defaultPermissions: { read: true, write: false, admin: false },
      rateLimits: { requestsPerMinute: 60, dataTransferPerMinute: 5 * 1024 * 1024 },
      retentionPolicies: {
        'results': 7200000,
        'coordination': 1800000,
        'notification': 300000
      }
    }],
    [PrincessDomain.SYSTEM, {
      domain: PrincessDomain.SYSTEM,
      maxSharedMemory: 512 * 1024, // 512KB
      allowedDataTypes: ['coordination', 'notification'],
      defaultPermissions: { read: true, write: false, admin: true },
      rateLimits: { requestsPerMinute: 30, dataTransferPerMinute: 1024 * 1024 },
      retentionPolicies: {
        'coordination': 600000,
        'notification': 60000
      }
    }]
  ]);

  static getDefaultPolicy(domain: PrincessDomain): MemoryAccessPolicy | undefined {
    return this.DEFAULT_POLICIES.get(domain);
  }

  static hasPermission(
    entry: SharedMemoryEntry,
    domain: PrincessDomain,
    operation: 'read' | 'write' | 'admin'
  ): boolean {
    switch (operation) {
      case 'read':
        return entry.permissions.read.includes(domain);
      case 'write':
        return entry.permissions.write.includes(domain);
      case 'admin':
        return entry.permissions.admin.includes(domain);
      default:
        return false;
    }
  }

  static canRevoke(entry: SharedMemoryEntry, domain: PrincessDomain): boolean {
    return (
      this.hasPermission(entry, domain, 'admin') ||
      entry.request.fromDomain === domain
    );
  }

  static logAccess(
    entry: SharedMemoryEntry,
    domain: PrincessDomain,
    operation: SharedMemoryEntry['accessLog'][0]['operation'],
    success: boolean
  ): void {
    entry.accessLog.push({
      domain,
      operation,
      timestamp: new Date(),
      success
    });

    // Keep only last 100 access log entries
    if (entry.accessLog.length > 100) {
      entry.accessLog = entry.accessLog.slice(-100);
    }
  }
}

/**
 * Validation utilities for access control
 */
export class AccessValidationUtils {
  static validateRequest(
    request: any,
    policy: MemoryAccessPolicy | undefined
  ): { valid: boolean; reason?: string } {
    if (!policy) {
      return { valid: false, reason: 'no-policy-found' };
    }

    if (!policy.allowedDataTypes.includes(request.dataType)) {
      return { valid: false, reason: 'data-type-not-allowed' };
    }

    if (request.size > policy.maxSharedMemory) {
      return { valid: false, reason: 'size-exceeds-limit' };
    }

    return { valid: true };
  }

  static isEntryExpired(entry: SharedMemoryEntry): boolean {
    return (
      entry.status === 'expired' ||
      (entry.expiresAt && entry.expiresAt <= new Date())
    );
  }

  static canAccessEntry(
    entry: SharedMemoryEntry,
    domain: PrincessDomain,
    operation: 'read' | 'write'
  ): { success: boolean; error?: string } {
    if (this.isEntryExpired(entry)) {
      return { success: false, error: 'Entry expired' };
    }

    if (!AccessControlUtils.hasPermission(entry, domain, operation)) {
      return { success: false, error: 'Permission denied' };
    }

    return { success: true };
  }
}