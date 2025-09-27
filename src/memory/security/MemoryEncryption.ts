import { EventEmitter } from 'events';
import * as crypto from 'crypto';
export interface EncryptionConfig {
  algorithm: 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305';
  keyDerivation: 'pbkdf2' | 'scrypt' | 'argon2';
  keySize: number;
  ivSize: number;
  tagSize: number;
  iterations: number;
  saltSize: number;
}
export interface EncryptedData {
  algorithm: string;
  iv: string;
  tag?: string;
  salt: string;
  data: string;
  keyId: string;
  timestamp: Date;
}
export interface KeyRotationPolicy {
  enabled: boolean;
  rotationInterval: number; // milliseconds
  maxKeyAge: number; // milliseconds
  keepOldKeys: number; // number of old keys to retain
  autoRotate: boolean;
}
export interface EncryptionKey {
  id: string;
  key: Buffer;
  createdAt: Date;
  lastUsed: Date;
  isActive: boolean;
  algorithm: string;
  metadata: Record<string, any>;
}
export interface AccessControlEntry {
  principal: string; // User/service identifier
  permissions: ('read' | 'write' | 'admin')[];
  conditions?: {
    timeRange?: { start: Date; end: Date };
    ipWhitelist?: string[];
    domainRestriction?: string[];
  };
  createdAt: Date;
  expiresAt?: Date;
}
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  operation: 'encrypt' | 'decrypt' | 'key-rotation' | 'access-grant' | 'access-revoke';
  principal: string;
  keyId: string;
  dataId?: string;
  success: boolean;
  errorMessage?: string;
  metadata: Record<string, any>;
}
/**
 * Memory Encryption and Security System
 * Provides encryption at rest and in transit, key management,
 * access control, and comprehensive audit logging.
 */
export class MemoryEncryption extends EventEmitter {
  private config: EncryptionConfig;
  private keyRotationPolicy: KeyRotationPolicy;
  private encryptionKeys: Map<string, EncryptionKey> = new Map();
  private accessControl: Map<string, AccessControlEntry[]> = new Map(); // dataId -> ACL
  private auditLog: AuditLogEntry[] = [];
  private activeKeyId: string | null = null;
  private keyRotationTimer: NodeJS.Timeout | null = null;
  private readonly MAX_AUDIT_LOG_SIZE = 10000;
  constructor(
    config: Partial<EncryptionConfig> = {},
    keyRotationPolicy: Partial<KeyRotationPolicy> = {}
  ) {
    super();
    this.config = {
      algorithm: 'aes-256-gcm',
      keyDerivation: 'pbkdf2',
      keySize: 32, // 256 bits
      ivSize: 16, // 128 bits
      tagSize: 16, // 128 bits
      iterations: 100000,
      saltSize: 16,
      ...config
    };
    this.keyRotationPolicy = {
      enabled: true,
      rotationInterval: 24 * 60 * 60 * 1000, // 24 hours
      maxKeyAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      keepOldKeys: 5,
      autoRotate: true,
      ...keyRotationPolicy
    };
    this.initializeEncryption();
  }
  private async initializeEncryption(): Promise<void> {
    try {
      // Generate initial encryption key
      await this.generateNewKey();
      // Start key rotation if enabled
      if (this.keyRotationPolicy.enabled && this.keyRotationPolicy.autoRotate) {
        this.startKeyRotation();
      }
      this.emit('encryption-initialized', { algorithm: this.config.algorithm });
    } catch (error) {
      this.emit('initialization-failed', { error });
      throw error;
    }
  }
  /**
   * Encrypt data with current active key
   */
  public async encrypt(
    data: any,
    dataId?: string,
    principal: string = 'system'
  ): Promise<EncryptedData> {
    const startTime = Date.now();
    try {
      // Check access permissions
      if (dataId && !this.checkPermission(dataId, principal, 'write')) {
        throw new Error('Access denied: insufficient permissions for encryption');
      }
      const activeKey = this.getActiveKey();
      if (!activeKey) {
        throw new Error('No active encryption key available');
      }
      // Serialize data
      const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
      const plaintextBuffer = Buffer.from(plaintext, 'utf8');
      // Generate IV and salt
      const iv = crypto.randomBytes(this.config.ivSize);
      const salt = crypto.randomBytes(this.config.saltSize);
      let encryptedData: EncryptedData;
      switch (this.config.algorithm) {
        case 'aes-256-gcm':
          encryptedData = await this.encryptAESGCM(plaintextBuffer, activeKey.key, iv, salt);
          break;
        case 'aes-256-cbc':
          encryptedData = await this.encryptAESCBC(plaintextBuffer, activeKey.key, iv, salt);
          break;
        case 'chacha20-poly1305':
          encryptedData = await this.encryptChaCha20(plaintextBuffer, activeKey.key, iv, salt);
          break;
        default:
          throw new Error(`Unsupported encryption algorithm: ${this.config.algorithm}`);
      }
      encryptedData.keyId = activeKey.id;
      encryptedData.timestamp = new Date();
      // Update key usage
      activeKey.lastUsed = new Date();
      // Log successful encryption
      this.logAuditEvent({
        operation: 'encrypt',
        principal,
        keyId: activeKey.id,
        dataId,
        success: true,
        metadata: {
          algorithm: this.config.algorithm,
          dataSize: plaintextBuffer.length,
          duration: Date.now() - startTime
        }
      });
      this.emit('data-encrypted', {
        dataId,
        keyId: activeKey.id,
        size: plaintextBuffer.length,
        duration: Date.now() - startTime
      });
      return encryptedData;
    } catch (error) {
      // Log failed encryption
      this.logAuditEvent({
        operation: 'encrypt',
        principal,
        keyId: this.activeKeyId || 'unknown',
        dataId,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        metadata: { duration: Date.now() - startTime }
      });
      this.emit('encryption-failed', { dataId, error });
      throw error;
    }
  }
  /**
   * Decrypt data using specified key
   */
  public async decrypt(
    encryptedData: EncryptedData,
    dataId?: string,
    principal: string = 'system'
  ): Promise<any> {
    const startTime = Date.now();
    try {
      // Check access permissions
      if (dataId && !this.checkPermission(dataId, principal, 'read')) {
        throw new Error('Access denied: insufficient permissions for decryption');
      }
      const key = this.encryptionKeys.get(encryptedData.keyId);
      if (!key) {
        throw new Error(`Encryption key not found: ${encryptedData.keyId}`);
      }
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const salt = Buffer.from(encryptedData.salt, 'base64');
      const ciphertext = Buffer.from(encryptedData.data, 'base64');
      let decryptedBuffer: Buffer;
      switch (encryptedData.algorithm) {
        case 'aes-256-gcm':
          const tag = Buffer.from(encryptedData.tag!, 'base64');
          decryptedBuffer = await this.decryptAESGCM(ciphertext, key.key, iv, salt, tag);
          break;
        case 'aes-256-cbc':
          decryptedBuffer = await this.decryptAESCBC(ciphertext, key.key, iv, salt);
          break;
        case 'chacha20-poly1305':
          decryptedBuffer = await this.decryptChaCha20(ciphertext, key.key, iv, salt);
          break;
        default:
          throw new Error(`Unsupported decryption algorithm: ${encryptedData.algorithm}`);
      }
      const plaintext = decryptedBuffer.toString('utf8');
      // Try to parse as JSON, fallback to string
      let result: any;
      try {
        result = JSON.parse(plaintext);
      } catch {
        result = plaintext;
      }
      // Update key usage
      key.lastUsed = new Date();
      // Log successful decryption
      this.logAuditEvent({
        operation: 'decrypt',
        principal,
        keyId: key.id,
        dataId,
        success: true,
        metadata: {
          algorithm: encryptedData.algorithm,
          dataSize: decryptedBuffer.length,
          duration: Date.now() - startTime
        }
      });
      this.emit('data-decrypted', {
        dataId,
        keyId: key.id,
        size: decryptedBuffer.length,
        duration: Date.now() - startTime
      });
      return result;
    } catch (error) {
      // Log failed decryption
      this.logAuditEvent({
        operation: 'decrypt',
        principal,
        keyId: encryptedData.keyId,
        dataId,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        metadata: { duration: Date.now() - startTime }
      });
      this.emit('decryption-failed', { dataId, error });
      throw error;
    }
  }
  /**
   * Generate new encryption key
   */
  public async generateNewKey(makeActive: boolean = true): Promise<string> {
    try {
      const keyId = this.generateKeyId();
      const key = crypto.randomBytes(this.config.keySize);
      const newKey: EncryptionKey = {
        id: keyId,
        key,
        createdAt: new Date(),
        lastUsed: new Date(),
        isActive: false,
        algorithm: this.config.algorithm,
        metadata: {}
      };
      this.encryptionKeys.set(keyId, newKey);
      if (makeActive) {
        this.setActiveKey(keyId);
      }
      this.emit('key-generated', { keyId, algorithm: this.config.algorithm });
      return keyId;
    } catch (error) {
      this.emit('key-generation-failed', { error });
      throw error;
    }
  }
  /**
   * Set active encryption key
   */
  public setActiveKey(keyId: string): boolean {
    const key = this.encryptionKeys.get(keyId);
    if (!key) {
      return false;
    }
    // Deactivate previous active key
    if (this.activeKeyId) {
      const previousKey = this.encryptionKeys.get(this.activeKeyId);
      if (previousKey) {
        previousKey.isActive = false;
      }
    }
    // Activate new key
    key.isActive = true;
    this.activeKeyId = keyId;
    this.emit('active-key-changed', { newKeyId: keyId, previousKeyId: this.activeKeyId });
    return true;
  }
  /**
   * Rotate encryption keys
   */
  public async rotateKeys(): Promise<{ newKeyId: string; deactivatedKeys: string[] }> {
    const startTime = Date.now();
    try {
      // Generate new key
      const newKeyId = await this.generateNewKey(true);
      // Deactivate old keys based on policy
      const deactivatedKeys = this.deactivateOldKeys();
      // Log key rotation
      this.logAuditEvent({
        operation: 'key-rotation',
        principal: 'system',
        keyId: newKeyId,
        success: true,
        metadata: {
          newKeyId,
          deactivatedKeys,
          duration: Date.now() - startTime
        }
      });
      this.emit('keys-rotated', { newKeyId, deactivatedKeys });
      return { newKeyId, deactivatedKeys };
    } catch (error) {
      this.logAuditEvent({
        operation: 'key-rotation',
        principal: 'system',
        keyId: 'unknown',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        metadata: { duration: Date.now() - startTime }
      });
      this.emit('key-rotation-failed', { error });
      throw error;
    }
  }
  /**
   * Grant access to encrypted data
   */
  public grantAccess(
    dataId: string,
    principal: string,
    permissions: AccessControlEntry['permissions'],
    conditions?: AccessControlEntry['conditions'],
    expiresAt?: Date,
    grantedBy: string = 'system'
  ): void {
    const acl = this.accessControl.get(dataId) || [];
    // Check if entry already exists for this principal
    const existingIndex = acl.findIndex(entry => entry.principal === principal);
    const newEntry: AccessControlEntry = {
      principal,
      permissions,
      conditions,
      createdAt: new Date(),
      expiresAt
    };
    if (existingIndex >= 0) {
      acl[existingIndex] = newEntry;
    } else {
      acl.push(newEntry);
    }
    this.accessControl.set(dataId, acl);
    this.logAuditEvent({
      operation: 'access-grant',
      principal: grantedBy,
      keyId: 'n/a',
      dataId,
      success: true,
      metadata: {
        targetPrincipal: principal,
        permissions,
        conditions,
        expiresAt
      }
    });
    this.emit('access-granted', { dataId, principal, permissions, grantedBy });
  }
  /**
   * Revoke access to encrypted data
   */
  public revokeAccess(dataId: string, principal: string, revokedBy: string = 'system'): boolean {
    const acl = this.accessControl.get(dataId);
    if (!acl) {
      return false;
    }
    const initialLength = acl.length;
    const updatedAcl = acl.filter(entry => entry.principal !== principal);
    if (updatedAcl.length === initialLength) {
      return false; // No entry found
    }
    if (updatedAcl.length === 0) {
      this.accessControl.delete(dataId);
    } else {
      this.accessControl.set(dataId, updatedAcl);
    }
    this.logAuditEvent({
      operation: 'access-revoke',
      principal: revokedBy,
      keyId: 'n/a',
      dataId,
      success: true,
      metadata: { targetPrincipal: principal }
    });
    this.emit('access-revoked', { dataId, principal, revokedBy });
    return true;
  }
  /**
   * Check if principal has permission for data
   */
  public checkPermission(
    dataId: string,
    principal: string,
    operation: 'read' | 'write' | 'admin'
  ): boolean {
    const acl = this.accessControl.get(dataId);
    if (!acl) {
      return false; // No access control = no access
    }
    const now = new Date();
    for (const entry of acl) {
      if (entry.principal === principal) {
        // Check expiration
        if (entry.expiresAt && entry.expiresAt <= now) {
          continue;
        }
        // Check time range condition
        if (entry.conditions?.timeRange) {
          const { start, end } = entry.conditions.timeRange;
          if (now < start || now > end) {
            continue;
          }
        }
        // Check permissions
        return entry.permissions.includes(operation);
      }
    }
    return false;
  }
  /**
   * Get encryption statistics
   */
  public getStatistics(): {
    activeKeys: number;
    totalKeys: number;
    encryptionOperations: number;
    decryptionOperations: number;
    keyRotations: number;
    accessControlEntries: number;
    auditLogEntries: number;
    oldestKey: Date | null;
    newestKey: Date | null;
  } {
    const activeKeys = Array.from(this.encryptionKeys.values()).filter(k => k.isActive).length;
    const encryptionOps = this.auditLog.filter(entry => entry.operation === 'encrypt' && entry.success).length;
    const decryptionOps = this.auditLog.filter(entry => entry.operation === 'decrypt' && entry.success).length;
    const keyRotations = this.auditLog.filter(entry => entry.operation === 'key-rotation' && entry.success).length;
    const keyDates = Array.from(this.encryptionKeys.values()).map(k => k.createdAt);
    const oldestKey = keyDates.length > 0 ? new Date(Math.min(...keyDates.map(d => d.getTime()))) : null;
    const newestKey = keyDates.length > 0 ? new Date(Math.max(...keyDates.map(d => d.getTime()))) : null;
    let totalAclEntries = 0;
    for (const acl of this.accessControl.values()) {
      totalAclEntries += acl.length;
    }
    return {
      activeKeys,
      totalKeys: this.encryptionKeys.size,
      encryptionOperations: encryptionOps,
      decryptionOperations: decryptionOps,
      keyRotations,
      accessControlEntries: totalAclEntries,
      auditLogEntries: this.auditLog.length,
      oldestKey,
      newestKey
    };
  }
  /**
   * Get audit log entries
   */
  public getAuditLog(
    filters: {
      operation?: AuditLogEntry['operation'];
      principal?: string;
      dataId?: string;
      success?: boolean;
      timeRange?: { start: Date; end: Date };
    } = {},
    limit: number = 100
  ): AuditLogEntry[] {
    let filtered = this.auditLog;
    if (filters.operation) {
      filtered = filtered.filter(entry => entry.operation === filters.operation);
    }
    if (filters.principal) {
      filtered = filtered.filter(entry => entry.principal === filters.principal);
    }
    if (filters.dataId) {
      filtered = filtered.filter(entry => entry.dataId === filters.dataId);
    }
    if (filters.success !== undefined) {
      filtered = filtered.filter(entry => entry.success === filters.success);
    }
    if (filters.timeRange) {
      filtered = filtered.filter(entry =>
        entry.timestamp >= filters.timeRange!.start &&
        entry.timestamp <= filters.timeRange!.end
      );
    }
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return filtered.slice(0, limit);
  }
  // Encryption algorithm implementations
  private async encryptAESGCM(
    plaintext: Buffer,
    key: Buffer,
    iv: Buffer,
    salt: Buffer
  ): Promise<EncryptedData> {
    const derivedKey = await this.deriveKey(key, salt);
    const cipher = crypto.createCipher('aes-256-gcm', derivedKey);
    cipher.setAAD(salt);
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
      algorithm: 'aes-256-gcm',
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      salt: salt.toString('base64'),
      data: encrypted.toString('base64'),
      keyId: '', // Will be set by caller
      timestamp: new Date()
    };
  }
  private async decryptAESGCM(
    ciphertext: Buffer,
    key: Buffer,
    iv: Buffer,
    salt: Buffer,
    tag: Buffer
  ): Promise<Buffer> {
    const derivedKey = await this.deriveKey(key, salt);
    const decipher = crypto.createDecipher('aes-256-gcm', derivedKey);
    decipher.setAAD(salt);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }
  private async encryptAESCBC(
    plaintext: Buffer,
    key: Buffer,
    iv: Buffer,
    salt: Buffer
  ): Promise<EncryptedData> {
    const derivedKey = await this.deriveKey(key, salt);
    const cipher = crypto.createCipher('aes-256-cbc', derivedKey);
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return {
      algorithm: 'aes-256-cbc',
      iv: iv.toString('base64'),
      salt: salt.toString('base64'),
      data: encrypted.toString('base64'),
      keyId: '',
      timestamp: new Date()
    };
  }
  private async decryptAESCBC(
    ciphertext: Buffer,
    key: Buffer,
    iv: Buffer,
    salt: Buffer
  ): Promise<Buffer> {
    const derivedKey = await this.deriveKey(key, salt);
    const decipher = crypto.createDecipher('aes-256-cbc', derivedKey);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }
  private async encryptChaCha20(
    plaintext: Buffer,
    key: Buffer,
    iv: Buffer,
    salt: Buffer
  ): Promise<EncryptedData> {
    const derivedKey = await this.deriveKey(key, salt);
    const cipher = crypto.createCipher('chacha20-poly1305', derivedKey);
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
      algorithm: 'chacha20-poly1305',
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      salt: salt.toString('base64'),
      data: encrypted.toString('base64'),
      keyId: '',
      timestamp: new Date()
    };
  }
  private async decryptChaCha20(
    ciphertext: Buffer,
    key: Buffer,
    iv: Buffer,
    salt: Buffer
  ): Promise<Buffer> {
    const derivedKey = await this.deriveKey(key, salt);
    const decipher = crypto.createDecipher('chacha20-poly1305', derivedKey);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }
  // Helper methods
  private async deriveKey(key: Buffer, salt: Buffer): Promise<Buffer> {
    switch (this.config.keyDerivation) {
      case 'pbkdf2':
        return crypto.pbkdf2Sync(key, salt, this.config.iterations, this.config.keySize, 'sha256');
      case 'scrypt':
        return crypto.scryptSync(key, salt, this.config.keySize);
      default:
        return crypto.pbkdf2Sync(key, salt, this.config.iterations, this.config.keySize, 'sha256');
    }
  }
  private getActiveKey(): EncryptionKey | null {
    if (!this.activeKeyId) {
      return null;
    }
    return this.encryptionKeys.get(this.activeKeyId) || null;
  }
  private generateKeyId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `key_${timestamp}_${random}`;
  }
  private startKeyRotation(): void {
    this.keyRotationTimer = setInterval(() => {
      this.rotateKeys().catch(error => {
        this.emit('automatic-rotation-failed', { error });
      });
    }, this.keyRotationPolicy.rotationInterval);
  }
  private deactivateOldKeys(): string[] {
    const now = Date.now();
    const deactivatedKeys: string[] = [];
    // Sort keys by creation date
    const keyArray = Array.from(this.encryptionKeys.entries())
      .sort(([, a], [, b]) => b.createdAt.getTime() - a.createdAt.getTime());
    // Keep recent keys based on policy
    const keysToKeep = keyArray.slice(0, this.keyRotationPolicy.keepOldKeys);
    const keysToRemove = keyArray.slice(this.keyRotationPolicy.keepOldKeys);
    // Remove old keys
    for (const [keyId, key] of keysToRemove) {
      if (now - key.createdAt.getTime() > this.keyRotationPolicy.maxKeyAge) {
        this.encryptionKeys.delete(keyId);
        deactivatedKeys.push(keyId);
      }
    }
    return deactivatedKeys;
  }
  private logAuditEvent(event: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    const auditEntry: AuditLogEntry = {
      id: this.generateAuditId(),
      timestamp: new Date(),
      ...event
    };
    this.auditLog.unshift(auditEntry);
    // Trim audit log if too large
    if (this.auditLog.length > this.MAX_AUDIT_LOG_SIZE) {
      this.auditLog.splice(this.MAX_AUDIT_LOG_SIZE);
    }
    this.emit('audit-logged', { entry: auditEntry });
  }
  private generateAuditId(): string {
    return `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
  /**
   * Export audit log for compliance
   */
  public exportAuditLog(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['id', 'timestamp', 'operation', 'principal', 'keyId', 'dataId', 'success', 'errorMessage', 'metadata'];
      const rows = this.auditLog.map(entry => [
        entry.id,
        entry.timestamp.toISOString(),
        entry.operation,
        entry.principal,
        entry.keyId,
        entry.dataId || '',
        entry.success.toString(),
        entry.errorMessage || '',
        JSON.stringify(entry.metadata)
      ]);
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
    return JSON.stringify(this.auditLog, null, 2);
  }
  /**
   * Shutdown encryption system
   */
  public shutdown(): void {
    if (this.keyRotationTimer) {
      clearInterval(this.keyRotationTimer);
      this.keyRotationTimer = null;
    }
    // Clear sensitive data from memory
    for (const key of this.encryptionKeys.values()) {
      key.key.fill(0); // Overwrite key data
    }
    this.encryptionKeys.clear();
    this.accessControl.clear();
    this.auditLog.length = 0;
    this.activeKeyId = null;
    this.emit('shutdown');
  }
}
export default MemoryEncryption;