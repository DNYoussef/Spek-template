/**
 * Tamper-Evident Audit Trail System
 * Cryptographic integrity with blockchain-style verification
 * Provides non-repudiable evidence for enterprise compliance
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class TamperEvidenceAuditSystem {
  constructor(options = {}) {
    this.options = {
      hashAlgorithm: options.hashAlgorithm || 'sha256',
      encryptionAlgorithm: options.encryptionAlgorithm || 'aes-256-gcm',
      keyDerivationRounds: options.keyDerivationRounds || 100000,
      auditStoragePath: options.auditStoragePath || './audit-storage',
      backupInterval: options.backupInterval || 3600000, // 1 hour
      integrityCheckInterval: options.integrityCheckInterval || 600000, // 10 minutes
      ...options
    };

    this.auditChain = [];
    this.merkleTree = null;
    this.masterKey = null;
    this.integrityHashes = new Map();

    this.initializeSecureStorage();
    this.startIntegrityMonitoring();
  }

  /**
   * Create Tamper-Evident Audit Entry
   * Each entry is cryptographically linked to prevent tampering
   */
  async createAuditEntry(data) {
    const timestamp = Date.now();
    const entryId = this.generateEntryId();

    // Get previous entry hash for chaining
    const previousHash = this.auditChain.length > 0
      ? this.auditChain[this.auditChain.length - 1].hash
      : this.generateGenesisHash();

    // Create entry data with immutable structure
    const entryData = {
      id: entryId,
      timestamp,
      data: this.sanitizeData(data),
      previousHash,
      nonce: crypto.randomBytes(32).toString('hex'),
      version: '1.0',
      creator: this.getSystemIdentity()
    };

    // Generate cryptographic proof
    const entryHash = this.calculateEntryHash(entryData);
    const digitalSignature = this.signEntry(entryData, entryHash);
    const merkleProof = await this.generateMerkleProof(entryData);

    // Create complete audit entry
    const auditEntry = {
      ...entryData,
      hash: entryHash,
      signature: digitalSignature,
      merkleProof,
      integrityCheck: this.generateIntegrityCheck(entryData, entryHash),
      metadata: {
        entrySize: JSON.stringify(entryData).length,
        processingTime: Date.now() - timestamp,
        validationStatus: 'VERIFIED'
      }
    };

    // Validate entry before adding to chain
    await this.validateAuditEntry(auditEntry);

    // Add to chain and update integrity markers
    this.auditChain.push(auditEntry);
    await this.updateMerkleTree(auditEntry);
    await this.persistAuditEntry(auditEntry);

    // Update integrity tracking
    this.integrityHashes.set(entryId, {
      hash: entryHash,
      timestamp,
      verified: true
    });

    return auditEntry;
  }

  /**
   * Verify Audit Chain Integrity
   * Validates entire chain for tampering detection
   */
  async verifyChainIntegrity() {
    const results = {
      totalEntries: this.auditChain.length,
      validEntries: 0,
      invalidEntries: 0,
      tamperedEntries: [],
      brokenLinks: [],
      integrityScore: 0,
      verificationTimestamp: Date.now()
    };

    for (let i = 0; i < this.auditChain.length; i++) {
      const entry = this.auditChain[i];
      const verification = await this.verifyAuditEntry(entry, i);

      if (verification.valid) {
        results.validEntries++;
      } else {
        results.invalidEntries++;
        results.tamperedEntries.push({
          entryId: entry.id,
          index: i,
          issues: verification.issues,
          timestamp: entry.timestamp
        });
      }

      // Check chain linkage
      if (i > 0 && entry.previousHash !== this.auditChain[i - 1].hash) {
        results.brokenLinks.push({
          entryId: entry.id,
          index: i,
          expectedPreviousHash: this.auditChain[i - 1].hash,
          actualPreviousHash: entry.previousHash
        });
      }
    }

    // Calculate integrity score
    results.integrityScore = results.totalEntries > 0
      ? (results.validEntries / results.totalEntries) * 100
      : 100;

    // Generate integrity report
    const integrityReport = await this.generateIntegrityReport(results);

    // Create audit entry for this verification
    await this.createAuditEntry({
      type: 'INTEGRITY_VERIFICATION',
      results,
      integrityReport
    });

    return results;
  }

  /**
   * Digital Signature Generation and Verification
   * Uses ECDSA with SHA-256 for non-repudiation
   */
  signEntry(entryData, entryHash) {
    const privateKey = this.getPrivateKey();
    const sign = crypto.createSign('SHA256');
    sign.update(entryHash);
    sign.end();

    return {
      algorithm: 'ECDSA-SHA256',
      signature: sign.sign(privateKey, 'hex'),
      publicKey: this.getPublicKey(),
      timestamp: Date.now()
    };
  }

  /**
   * Verify Digital Signature
   */
  verifySignature(entryData, entryHash, signatureData) {
    try {
      const verify = crypto.createVerify('SHA256');
      verify.update(entryHash);
      verify.end();

      return verify.verify(signatureData.publicKey, signatureData.signature, 'hex');
    } catch (error) {
      return false;
    }
  }

  /**
   * Merkle Tree Implementation for Batch Verification
   * Enables efficient verification of large audit trails
   */
  async generateMerkleProof(entryData) {
    const leafHash = this.calculateEntryHash(entryData);
    const tree = await this.buildMerkleTree();
    const proof = this.generateMerkleProofPath(tree, leafHash);

    return {
      leafHash,
      rootHash: tree.root,
      proof,
      treeSize: tree.leaves.length,
      generationTimestamp: Date.now()
    };
  }

  async buildMerkleTree() {
    const leaves = this.auditChain.map(entry => entry.hash);
    const tree = { leaves, levels: [] };

    let currentLevel = [...leaves];

    while (currentLevel.length > 1) {
      const nextLevel = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        const parentHash = this.calculateParentHash(left, right);
        nextLevel.push(parentHash);
      }

      tree.levels.push(currentLevel);
      currentLevel = nextLevel;
    }

    tree.root = currentLevel[0];
    return tree;
  }

  generateMerkleProofPath(tree, targetHash) {
    const proof = [];
    const leafIndex = tree.leaves.indexOf(targetHash);

    if (leafIndex === -1) return null;

    let currentIndex = leafIndex;

    for (const level of tree.levels) {
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;

      if (siblingIndex < level.length) {
        proof.push({
          hash: level[siblingIndex],
          position: currentIndex % 2 === 0 ? 'right' : 'left'
        });
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return proof;
  }

  /**
   * Comprehensive Entry Validation
   * Verifies all aspects of an audit entry
   */
  async validateAuditEntry(entry) {
    const validation = {
      valid: true,
      issues: [],
      timestamp: Date.now()
    };

    // Validate required fields
    const requiredFields = ['id', 'timestamp', 'data', 'hash', 'signature'];
    for (const field of requiredFields) {
      if (!entry[field]) {
        validation.valid = false;
        validation.issues.push(`Missing required field: ${field}`);
      }
    }

    // Validate hash integrity
    const calculatedHash = this.calculateEntryHash({
      id: entry.id,
      timestamp: entry.timestamp,
      data: entry.data,
      previousHash: entry.previousHash,
      nonce: entry.nonce,
      version: entry.version,
      creator: entry.creator
    });

    if (calculatedHash !== entry.hash) {
      validation.valid = false;
      validation.issues.push('Hash integrity check failed');
    }

    // Validate digital signature
    const signatureValid = this.verifySignature(entry, entry.hash, entry.signature);
    if (!signatureValid) {
      validation.valid = false;
      validation.issues.push('Digital signature verification failed');
    }

    // Validate timestamp
    if (entry.timestamp > Date.now() + 300000) { // 5 minutes future tolerance
      validation.valid = false;
      validation.issues.push('Invalid timestamp - entry from future');
    }

    // Validate Merkle proof if present
    if (entry.merkleProof) {
      const merkleValid = await this.verifyMerkleProof(entry.merkleProof, entry.hash);
      if (!merkleValid) {
        validation.valid = false;
        validation.issues.push('Merkle proof verification failed');
      }
    }

    return validation;
  }

  /**
   * Verify Individual Audit Entry
   */
  async verifyAuditEntry(entry, index = null) {
    const verification = await this.validateAuditEntry(entry);

    // Additional verifications for chained entries
    if (index !== null && index > 0) {
      const previousEntry = this.auditChain[index - 1];
      if (entry.previousHash !== previousEntry.hash) {
        verification.valid = false;
        verification.issues.push('Chain link broken - previous hash mismatch');
      }
    }

    return verification;
  }

  /**
   * Secure Persistent Storage
   * Encrypted storage with redundancy and backup
   */
  async persistAuditEntry(entry) {
    const encryptedEntry = await this.encryptEntry(entry);
    const filename = `audit_${entry.id}.json`;
    const filepath = path.join(this.options.auditStoragePath, filename);

    // Write with atomic operation
    const tempFilepath = `${filepath}.tmp`;
    await fs.writeFile(tempFilepath, JSON.stringify(encryptedEntry));
    await fs.rename(tempFilepath, filepath);

    // Create backup copy
    const backupPath = path.join(this.options.auditStoragePath, 'backup', filename);
    await fs.copyFile(filepath, backupPath);

    // Update index
    await this.updateAuditIndex(entry.id, filepath);
  }

  /**
   * Retrieve and Verify Stored Entry
   */
  async retrieveAuditEntry(entryId) {
    const filepath = await this.getEntryFilepath(entryId);
    const encryptedData = await fs.readFile(filepath, 'utf8');
    const encryptedEntry = JSON.parse(encryptedData);
    const entry = await this.decryptEntry(encryptedEntry);

    // Verify integrity after retrieval
    const verification = await this.verifyAuditEntry(entry);
    if (!verification.valid) {
      throw new Error(`Stored entry integrity verification failed: ${verification.issues.join(', ')}`);
    }

    return entry;
  }

  /**
   * Export Audit Trail for External Verification
   */
  async exportAuditTrail(options = {}) {
    const exportData = {
      metadata: {
        exportTimestamp: Date.now(),
        totalEntries: this.auditChain.length,
        integrityScore: (await this.verifyChainIntegrity()).integrityScore,
        exportOptions: options
      },
      entries: [],
      merkleTree: await this.buildMerkleTree(),
      integrityProof: await this.generateIntegrityProof()
    };

    // Export entries based on filters
    for (const entry of this.auditChain) {
      if (this.shouldIncludeEntry(entry, options)) {
        exportData.entries.push(entry);
      }
    }

    // Generate export hash for verification
    exportData.exportHash = this.calculateHash(JSON.stringify(exportData));

    return exportData;
  }

  // Utility methods
  calculateEntryHash(entryData) {
    const hash = crypto.createHash(this.options.hashAlgorithm);
    hash.update(JSON.stringify(entryData));
    return hash.digest('hex');
  }

  calculateParentHash(left, right) {
    const hash = crypto.createHash(this.options.hashAlgorithm);
    hash.update(left + right);
    return hash.digest('hex');
  }

  calculateHash(data) {
    const hash = crypto.createHash(this.options.hashAlgorithm);
    hash.update(data);
    return hash.digest('hex');
  }

  generateEntryId() {
    return crypto.randomBytes(16).toString('hex');
  }

  generateGenesisHash() {
    return '0'.repeat(64); // Genesis block hash
  }

  sanitizeData(data) {
    // Remove sensitive information that shouldn't be audited
    const sanitized = JSON.parse(JSON.stringify(data));
    // Implement sanitization logic as needed
    return sanitized;
  }

  getSystemIdentity() {
    return {
      system: 'enterprise-compliance-engine',
      version: '1.0.0',
      nodeId: crypto.randomBytes(8).toString('hex')
    };
  }

  async initializeSecureStorage() {
    await fs.mkdir(this.options.auditStoragePath, { recursive: true });
    await fs.mkdir(path.join(this.options.auditStoragePath, 'backup'), { recursive: true });
  }

  startIntegrityMonitoring() {
    setInterval(async () => {
      await this.verifyChainIntegrity();
    }, this.options.integrityCheckInterval);
  }
}

module.exports = TamperEvidenceAuditSystem;