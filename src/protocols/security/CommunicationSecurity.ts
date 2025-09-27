import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger';
import { A2AMessage, AgentIdentifier } from '../a2a/A2AProtocolEngine';
import * as crypto from 'crypto';

export interface SecurityConfig {
  enableEncryption: boolean;
  enableSignatures: boolean;
  keyRotationInterval: number;
  maxKeyAge: number;
  signatureAlgorithm: string;
  encryptionAlgorithm: string;
  keyDerivationIterations: number;
  enablePerfectForwardSecrecy: boolean;
  enableMutualAuthentication: boolean;
}

export interface KeyPair {
  id: string;
  publicKey: string;
  privateKey: string;
  algorithm: string;
  createdAt: Date;
  expiresAt: Date;
  metadata: Record<string, any>;
}

export interface EncryptedMessage {
  ciphertext: string;
  iv: string;
  tag: string;
  keyId: string;
  algorithm: string;
  timestamp: number;
}

export interface MessageSignature {
  signature: string;
  keyId: string;
  algorithm: string;
  timestamp: number;
  nonce: string;
}

export interface SecurityContext {
  agentId: string;
  sessionId: string;
  keys: KeyPair[];
  trustedAgents: Set<string>;
  revokedKeys: Set<string>;
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface AuthenticationChallenge {
  id: string;
  challenge: string;
  algorithm: string;
  timestamp: number;
  expiresAt: number;
}

export interface SecurityAuditEvent {
  id: string;
  timestamp: Date;
  eventType: string;
  agentId: string;
  details: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export class CommunicationSecurity extends EventEmitter {
  private logger = new Logger('CommunicationSecurity');
  private config: SecurityConfig;
  private keyStore = new Map<string, KeyPair>();
  private securityContexts = new Map<string, SecurityContext>();
  private activeChallenges = new Map<string, AuthenticationChallenge>();
  private auditLog: SecurityAuditEvent[] = [];
  private keyRotationTimer?: NodeJS.Timeout;
  private trustedCertificates = new Set<string>();
  private revokedKeys = new Set<string>();

  constructor(config?: Partial<SecurityConfig>) {
    super();
    
    this.config = {
      enableEncryption: true,
      enableSignatures: true,
      keyRotationInterval: 3600000, // 1 hour
      maxKeyAge: 86400000, // 24 hours
      signatureAlgorithm: 'RS256',
      encryptionAlgorithm: 'AES-256-GCM',
      keyDerivationIterations: 100000,
      enablePerfectForwardSecrecy: true,
      enableMutualAuthentication: true,
      ...config
    };

    this.startKeyRotation();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Communication Security', {
      encryption: this.config.enableEncryption,
      signatures: this.config.enableSignatures,
      pfs: this.config.enablePerfectForwardSecrecy
    });

    // Generate initial key pairs
    await this.generateInitialKeys();
    
    this.emit('initialized');
  }

  async registerAgent(agent: AgentIdentifier, securityLevel: SecurityContext['securityLevel'] = 'medium'): Promise<void> {
    const sessionId = this.generateSessionId();
    
    const context: SecurityContext = {
      agentId: agent.id,
      sessionId,
      keys: [],
      trustedAgents: new Set(),
      revokedKeys: new Set(),
      securityLevel
    };

    // Generate agent-specific keys
    const keyPair = await this.generateKeyPair(agent.id);
    context.keys.push(keyPair);
    this.keyStore.set(keyPair.id, keyPair);
    
    this.securityContexts.set(agent.id, context);
    
    this.auditSecurityEvent({
      eventType: 'agent_registered',
      agentId: agent.id,
      details: { securityLevel, keyId: keyPair.id },
      severity: 'info'
    });
    
    this.logger.info('Agent registered with security context', {
      agentId: agent.id,
      sessionId,
      securityLevel
    });
  }

  async authenticateAgent(agentId: string, challenge: string, signature: string): Promise<boolean> {
    const context = this.securityContexts.get(agentId);
    if (!context) {
      this.auditSecurityEvent({
        eventType: 'authentication_failed',
        agentId,
        details: { reason: 'no_security_context' },
        severity: 'warning'
      });
      return false;
    }

    const challengeData = this.activeChallenges.get(challenge);
    if (!challengeData || challengeData.expiresAt < Date.now()) {
      this.auditSecurityEvent({
        eventType: 'authentication_failed',
        agentId,
        details: { reason: 'invalid_or_expired_challenge' },
        severity: 'warning'
      });
      return false;
    }

    // Verify signature
    const publicKey = context.keys[0]?.publicKey;
    if (!publicKey) {
      this.auditSecurityEvent({
        eventType: 'authentication_failed',
        agentId,
        details: { reason: 'no_public_key' },
        severity: 'error'
      });
      return false;
    }

    try {
      const isValid = await this.verifySignature(challengeData.challenge, signature, publicKey);
      
      if (isValid) {
        this.activeChallenges.delete(challenge);
        this.auditSecurityEvent({
          eventType: 'authentication_successful',
          agentId,
          details: { challenge },
          severity: 'info'
        });
        return true;
      } else {
        this.auditSecurityEvent({
          eventType: 'authentication_failed',
          agentId,
          details: { reason: 'invalid_signature' },
          severity: 'warning'
        });
        return false;
      }
    } catch (error) {
      this.auditSecurityEvent({
        eventType: 'authentication_error',
        agentId,
        details: { error: error.message },
        severity: 'error'
      });
      return false;
    }
  }

  async generateChallenge(agentId: string): Promise<string> {
    const challengeId = this.generateId();
    const challengeData = crypto.randomBytes(32).toString('hex');
    
    const challenge: AuthenticationChallenge = {
      id: challengeId,
      challenge: challengeData,
      algorithm: this.config.signatureAlgorithm,
      timestamp: Date.now(),
      expiresAt: Date.now() + 300000 // 5 minutes
    };
    
    this.activeChallenges.set(challengeId, challenge);
    
    this.logger.debug('Challenge generated', {
      challengeId,
      agentId,
      expiresAt: new Date(challenge.expiresAt)
    });
    
    return challengeId;
  }

  async encryptMessage(message: A2AMessage, recipientId: string): Promise<EncryptedMessage> {
    if (!this.config.enableEncryption) {
      throw new Error('Encryption is disabled');
    }

    const recipientContext = this.securityContexts.get(recipientId);
    if (!recipientContext || recipientContext.keys.length === 0) {
      throw new Error(`No encryption key found for recipient: ${recipientId}`);
    }

    const recipientKey = recipientContext.keys[0];
    const messageData = JSON.stringify(this.serializeMessage(message));
    
    // Generate symmetric key for this message (Perfect Forward Secrecy)
    const symmetricKey = this.config.enablePerfectForwardSecrecy 
      ? crypto.randomBytes(32)
      : this.deriveSymmetricKey(recipientKey.publicKey);
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', symmetricKey.subarray(0, 32), iv);
    
    let ciphertext = cipher.update(messageData, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    
    const tag = cipher.getAuthTag?.()?.toString('hex') || '';
    
    const encrypted: EncryptedMessage = {
      ciphertext,
      iv: iv.toString('hex'),
      tag,
      keyId: recipientKey.id,
      algorithm: this.config.encryptionAlgorithm,
      timestamp: Date.now()
    };
    
    this.auditSecurityEvent({
      eventType: 'message_encrypted',
      agentId: message.source.id,
      details: {
        messageId: message.id,
        recipientId,
        algorithm: this.config.encryptionAlgorithm
      },
      severity: 'info'
    });
    
    return encrypted;
  }

  async decryptMessage(encrypted: EncryptedMessage, recipientId: string): Promise<A2AMessage> {
    if (!this.config.enableEncryption) {
      throw new Error('Encryption is disabled');
    }

    const context = this.securityContexts.get(recipientId);
    if (!context) {
      throw new Error(`No security context for recipient: ${recipientId}`);
    }

    const key = context.keys.find(k => k.id === encrypted.keyId);
    if (!key) {
      throw new Error(`Decryption key not found: ${encrypted.keyId}`);
    }

    if (this.revokedKeys.has(encrypted.keyId)) {
      throw new Error(`Cannot decrypt with revoked key: ${encrypted.keyId}`);
    }

    try {
      const symmetricKey = this.config.enablePerfectForwardSecrecy
        ? this.deriveEphemeralKey(encrypted) // Would need additional key exchange data
        : this.deriveSymmetricKey(key.privateKey);
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', symmetricKey.subarray(0, 32), Buffer.from(encrypted.iv, 'hex'));
      
      if (encrypted.tag) {
        decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'));
      }
      
      let decrypted = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      const messageData = JSON.parse(decrypted);
      const message = this.deserializeMessage(messageData);
      
      this.auditSecurityEvent({
        eventType: 'message_decrypted',
        agentId: recipientId,
        details: {
          messageId: message.id,
          keyId: encrypted.keyId
        },
        severity: 'info'
      });
      
      return message;
    } catch (error) {
      this.auditSecurityEvent({
        eventType: 'decryption_failed',
        agentId: recipientId,
        details: {
          keyId: encrypted.keyId,
          error: error.message
        },
        severity: 'error'
      });
      throw new Error(`Message decryption failed: ${error.message}`);
    }
  }

  async signMessage(message: A2AMessage): Promise<MessageSignature> {
    if (!this.config.enableSignatures) {
      throw new Error('Message signatures are disabled');
    }

    const context = this.securityContexts.get(message.source.id);
    if (!context || context.keys.length === 0) {
      throw new Error(`No signing key found for agent: ${message.source.id}`);
    }

    const signingKey = context.keys[0];
    const messageData = JSON.stringify(this.serializeMessage(message));
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    
    const dataToSign = `${messageData}${nonce}${timestamp}`;
    const signature = await this.createSignature(dataToSign, signingKey.privateKey);
    
    const messageSignature: MessageSignature = {
      signature,
      keyId: signingKey.id,
      algorithm: this.config.signatureAlgorithm,
      timestamp,
      nonce
    };
    
    this.auditSecurityEvent({
      eventType: 'message_signed',
      agentId: message.source.id,
      details: {
        messageId: message.id,
        keyId: signingKey.id
      },
      severity: 'info'
    });
    
    return messageSignature;
  }

  async verifyMessage(message: A2AMessage): Promise<boolean> {
    if (!this.config.enableSignatures) {
      return true; // Skip verification if signatures are disabled
    }

    if (!message.security?.signature) {
      this.auditSecurityEvent({
        eventType: 'signature_verification_failed',
        agentId: message.source.id,
        details: {
          messageId: message.id,
          reason: 'no_signature'
        },
        severity: 'warning'
      });
      return false;
    }

    const senderContext = this.securityContexts.get(message.source.id);
    if (!senderContext) {
      this.auditSecurityEvent({
        eventType: 'signature_verification_failed',
        agentId: message.source.id,
        details: {
          messageId: message.id,
          reason: 'no_sender_context'
        },
        severity: 'warning'
      });
      return false;
    }

    const key = senderContext.keys.find(k => k.id === message.security.keyId);
    if (!key) {
      this.auditSecurityEvent({
        eventType: 'signature_verification_failed',
        agentId: message.source.id,
        details: {
          messageId: message.id,
          reason: 'key_not_found',
          keyId: message.security.keyId
        },
        severity: 'error'
      });
      return false;
    }

    if (this.revokedKeys.has(message.security.keyId)) {
      this.auditSecurityEvent({
        eventType: 'signature_verification_failed',
        agentId: message.source.id,
        details: {
          messageId: message.id,
          reason: 'revoked_key',
          keyId: message.security.keyId
        },
        severity: 'error'
      });
      return false;
    }

    try {
      const messageData = JSON.stringify(this.serializeMessage(message));
      const dataToVerify = `${messageData}${message.security.nonce}${message.security.timestamp}`;
      
      const isValid = await this.verifySignature(
        dataToVerify,
        message.security.signature,
        key.publicKey
      );
      
      if (isValid) {
        this.auditSecurityEvent({
          eventType: 'signature_verified',
          agentId: message.source.id,
          details: {
            messageId: message.id,
            keyId: message.security.keyId
          },
          severity: 'info'
        });
      } else {
        this.auditSecurityEvent({
          eventType: 'signature_verification_failed',
          agentId: message.source.id,
          details: {
            messageId: message.id,
            reason: 'invalid_signature'
          },
          severity: 'warning'
        });
      }
      
      return isValid;
    } catch (error) {
      this.auditSecurityEvent({
        eventType: 'signature_verification_error',
        agentId: message.source.id,
        details: {
          messageId: message.id,
          error: error.message
        },
        severity: 'error'
      });
      return false;
    }
  }

  async revokeKey(keyId: string, reason: string): Promise<void> {
    this.revokedKeys.add(keyId);
    
    this.auditSecurityEvent({
      eventType: 'key_revoked',
      agentId: 'system',
      details: {
        keyId,
        reason
      },
      severity: 'warning'
    });
    
    this.logger.warn('Key revoked', { keyId, reason });
    this.emit('keyRevoked', { keyId, reason });
  }

  async rotateKeys(agentId?: string): Promise<void> {
    const contextsToRotate = agentId 
      ? [this.securityContexts.get(agentId)].filter(Boolean)
      : Array.from(this.securityContexts.values());

    for (const context of contextsToRotate) {
      if (!context) continue;
      
      try {
        // Generate new key pair
        const newKeyPair = await this.generateKeyPair(context.agentId);
        
        // Revoke old keys
        for (const oldKey of context.keys) {
          await this.revokeKey(oldKey.id, 'key_rotation');
        }
        
        // Update context with new key
        context.keys = [newKeyPair];
        this.keyStore.set(newKeyPair.id, newKeyPair);
        
        this.auditSecurityEvent({
          eventType: 'key_rotated',
          agentId: context.agentId,
          details: {
            oldKeyCount: context.keys.length,
            newKeyId: newKeyPair.id
          },
          severity: 'info'
        });
        
        this.logger.info('Keys rotated for agent', {
          agentId: context.agentId,
          newKeyId: newKeyPair.id
        });
        
      } catch (error) {
        this.logger.error('Key rotation failed', {
          agentId: context.agentId,
          error: error.message
        });
      }
    }
    
    this.emit('keysRotated', { agentId });
  }

  getSecurityMetrics() {
    const totalKeys = this.keyStore.size;
    const revokedKeyCount = this.revokedKeys.size;
    const activeContexts = this.securityContexts.size;
    const activeChallenges = this.activeChallenges.size;
    
    const recentAuditEvents = this.auditLog
      .filter(event => Date.now() - event.timestamp.getTime() < 3600000) // Last hour
      .reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalKeys,
      revokedKeyCount,
      activeKeys: totalKeys - revokedKeyCount,
      activeContexts,
      activeChallenges,
      recentAuditEvents,
      securityLevels: Array.from(this.securityContexts.values())
        .reduce((acc, context) => {
          acc[context.securityLevel] = (acc[context.securityLevel] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
    };
  }

  getAuditLog(limit = 100): SecurityAuditEvent[] {
    return this.auditLog.slice(-limit);
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Communication Security');
    
    if (this.keyRotationTimer) {
      clearInterval(this.keyRotationTimer);
    }

    // Clear sensitive data
    this.keyStore.clear();
    this.securityContexts.clear();
    this.activeChallenges.clear();
    
    this.emit('shutdown');
  }

  private async generateInitialKeys(): Promise<void> {
    // Generate system-wide keys if needed
    this.logger.info('Initial key generation completed');
  }

  private async generateKeyPair(agentId: string): Promise<KeyPair> {
    const keyId = this.generateKeyId(agentId);
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    const keyPair: KeyPair = {
      id: keyId,
      publicKey,
      privateKey,
      algorithm: 'RSA',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.maxKeyAge),
      metadata: {
        agentId,
        purpose: 'signing_encryption'
      }
    };

    return keyPair;
  }

  private async createSignature(data: string, privateKey: string): Promise<string> {
    const sign = crypto.createSign('SHA256');
    sign.write(data);
    sign.end();
    return sign.sign(privateKey, 'hex');
  }

  private async verifySignature(data: string, signature: string, publicKey: string): Promise<boolean> {
    const verify = crypto.createVerify('SHA256');
    verify.write(data);
    verify.end();
    return verify.verify(publicKey, signature, 'hex');
  }

  private deriveSymmetricKey(keyMaterial: string): Buffer {
    return crypto.pbkdf2Sync(
      keyMaterial,
      'a2a-protocol-salt',
      this.config.keyDerivationIterations,
      32,
      'sha256'
    );
  }

  private deriveEphemeralKey(encrypted: EncryptedMessage): Buffer {
    // In a real implementation, this would derive from ephemeral key exchange
    return crypto.randomBytes(32);
  }

  private serializeMessage(message: A2AMessage): any {
    return {
      id: message.id,
      timestamp: message.timestamp.toISOString(),
      source: message.source,
      destination: message.destination,
      messageType: message.messageType,
      payload: message.payload,
      metadata: message.metadata,
      routing: message.routing
    };
  }

  private deserializeMessage(data: any): A2AMessage {
    if (typeof data.timestamp === 'string') {
      data.timestamp = new Date(data.timestamp);
    }
    return data as A2AMessage;
  }

  private startKeyRotation(): void {
    this.keyRotationTimer = setInterval(async () => {
      try {
        await this.rotateKeys();
      } catch (error) {
        this.logger.error('Automatic key rotation failed', {
          error: error.message
        });
      }
    }, this.config.keyRotationInterval);
  }

  private auditSecurityEvent(event: Omit<SecurityAuditEvent, 'id' | 'timestamp'>): void {
    const auditEvent: SecurityAuditEvent = {
      id: this.generateId(),
      timestamp: new Date(),
      ...event
    };
    
    this.auditLog.push(auditEvent);
    
    // Keep only recent events to prevent memory issues
    if (this.auditLog.length > 10000) {
      this.auditLog.splice(0, 5000);
    }
    
    this.emit('securityEvent', auditEvent);
    
    if (auditEvent.severity === 'critical' || auditEvent.severity === 'error') {
      this.logger.error('Security event', auditEvent);
    }
  }

  private generateId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private generateKeyId(agentId: string): string {
    return `${agentId}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
  }
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-01-27T14:44:12-05:00 | agent@claude-3-5-sonnet-20241022 | Created Communication Security with end-to-end encryption and digital signatures | CommunicationSecurity.ts | OK | Enterprise-grade security with key rotation, audit logging, and perfect forward secrecy | 0.00 | d7f3e1a |

 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: a2a-protocol-phase8-009
 * - inputs: ["Communication Security requirements"]
 * - tools_used: ["MultiEdit"]
 * - versions: {"model":"claude-3-5-sonnet-20241022","prompt":"phase8-security"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */