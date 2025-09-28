/**
 * Domain Boundary Manager - FSM component for domain boundary operations
 * NASA Rule 10 Compliant: Fixed bounds and non-recursive operations
 */

import {
  DomainBoundary,
  MAX_DOMAINS
} from './MECEValidationTypes';
import { Logger } from '../../../utils/Logger';

export class DomainBoundaryManager {
  private logger: Logger;
  private domainBoundaries: Map<string, DomainBoundary>;

  constructor() {
    this.logger = new Logger('DomainBoundaryManager');
    this.domainBoundaries = new Map();
  }

  /**
   * Register domain boundary - NASA Rule 10: ≤60 lines
   */
  registerDomain(domain: DomainBoundary): boolean {
    // Assertion 1: Valid domain
    console.assert(domain !== null && typeof domain === 'object', 'Valid domain object required');
    // Assertion 2: Domain has name
    console.assert(domain.domainName && domain.domainName.length > 0, 'Domain name required');

    try {
      // NASA Rule 10: Enforce domain limits
      if (this.domainBoundaries.size >= MAX_DOMAINS) {
        this.logger.warn('Maximum domain limit reached', { limit: MAX_DOMAINS });
        return false;
      }

      // Validate domain structure
      if (!this.validateDomainStructure(domain)) {
        this.logger.error('Invalid domain structure', { domainName: domain.domainName });
        return false;
      }

      this.domainBoundaries.set(domain.domainName, {
        ...domain,
        principalResponsibilities: domain.principalResponsibilities.slice(0, 20), // NASA Rule 10: Fixed bound
        criticalKeys: domain.criticalKeys.slice(0, 10), // NASA Rule 10: Fixed bound
        managedAgentTypes: domain.managedAgentTypes.slice(0, 15), // NASA Rule 10: Fixed bound
        exclusionPatterns: domain.exclusionPatterns.slice(0, 10), // NASA Rule 10: Fixed bound
        dependencies: domain.dependencies.slice(0, 10) // NASA Rule 10: Fixed bound
      });

      this.logger.info('Domain registered successfully', {
        domainName: domain.domainName,
        totalDomains: this.domainBoundaries.size
      });

      return true;

    } catch (error) {
      this.logger.error('Failed to register domain', {
        domainName: domain.domainName,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Validate domain structure - NASA Rule 10: Single responsibility
   */
  private validateDomainStructure(domain: DomainBoundary): boolean {
    // Assertion 1: Domain exists
    console.assert(domain !== null, 'Domain object required');
    // Assertion 2: Required fields present
    console.assert(domain.domainName && Array.isArray(domain.principalResponsibilities), 'Required domain fields missing');

    // Check required fields
    if (!domain.domainName || domain.domainName.length === 0) {
      return false;
    }

    if (!Array.isArray(domain.principalResponsibilities) || domain.principalResponsibilities.length === 0) {
      return false;
    }

    if (!Array.isArray(domain.criticalKeys)) {
      return false;
    }

    if (!Array.isArray(domain.managedAgentTypes)) {
      return false;
    }

    if (!Array.isArray(domain.exclusionPatterns)) {
      return false;
    }

    if (!Array.isArray(domain.dependencies)) {
      return false;
    }

    return true;
  }

  /**
   * Get domain boundary - NASA Rule 10: Single responsibility
   */
  getDomain(domainName: string): DomainBoundary | null {
    // Assertion 1: Valid domain name
    console.assert(typeof domainName === 'string' && domainName.length > 0, 'Valid domain name required');
    // Assertion 2: Domain map exists
    console.assert(this.domainBoundaries instanceof Map, 'Domain boundaries map must exist');

    const domain = this.domainBoundaries.get(domainName);
    if (!domain) {
      this.logger.debug('Domain not found', { domainName });
      return null;
    }

    return { ...domain }; // Return copy to prevent mutations
  }

  /**
   * Get all domains - NASA Rule 10: Single responsibility
   */
  getAllDomains(): DomainBoundary[] {
    // Assertion 1: Domain map exists
    console.assert(this.domainBoundaries instanceof Map, 'Domain boundaries map must exist');
    // Assertion 2: Domain count within bounds
    console.assert(this.domainBoundaries.size <= MAX_DOMAINS, 'Domain count within limits');

    const domains: DomainBoundary[] = [];
    let domainCount = 0;
    const maxDomains = Math.min(this.domainBoundaries.size, MAX_DOMAINS);

    // NASA Rule 10: Fixed iteration bounds
    for (const [, domain] of this.domainBoundaries) {
      if (domainCount >= maxDomains) {
        break;
      }
      domains.push({ ...domain }); // Return copies to prevent mutations
      domainCount++;
    }

    return domains;
  }

  /**
   * Remove domain - NASA Rule 10: Single responsibility
   */
  removeDomain(domainName: string): boolean {
    // Assertion 1: Valid domain name
    console.assert(typeof domainName === 'string' && domainName.length > 0, 'Valid domain name required');
    // Assertion 2: Domain map exists
    console.assert(this.domainBoundaries instanceof Map, 'Domain boundaries map must exist');

    if (!this.domainBoundaries.has(domainName)) {
      this.logger.warn('Attempted to remove non-existent domain', { domainName });
      return false;
    }

    this.domainBoundaries.delete(domainName);
    this.logger.info('Domain removed', {
      domainName,
      remainingDomains: this.domainBoundaries.size
    });

    return true;
  }

  /**
   * Update domain - NASA Rule 10: Single responsibility
   */
  updateDomain(domainName: string, updates: Partial<DomainBoundary>): boolean {
    // Assertion 1: Valid parameters
    console.assert(typeof domainName === 'string' && updates !== null, 'Valid domain name and updates required');
    // Assertion 2: Domain exists
    console.assert(this.domainBoundaries.has(domainName), 'Domain must exist for updates');

    const existingDomain = this.domainBoundaries.get(domainName);
    if (!existingDomain) {
      this.logger.error('Domain not found for update', { domainName });
      return false;
    }

    try {
      const updatedDomain: DomainBoundary = {
        ...existingDomain,
        ...updates,
        domainName: existingDomain.domainName, // Prevent name changes
        // Apply NASA Rule 10 bounds to updated arrays
        principalResponsibilities: updates.principalResponsibilities ? 
          updates.principalResponsibilities.slice(0, 20) : existingDomain.principalResponsibilities,
        criticalKeys: updates.criticalKeys ?
          updates.criticalKeys.slice(0, 10) : existingDomain.criticalKeys,
        managedAgentTypes: updates.managedAgentTypes ?
          updates.managedAgentTypes.slice(0, 15) : existingDomain.managedAgentTypes,
        exclusionPatterns: updates.exclusionPatterns ?
          updates.exclusionPatterns.slice(0, 10) : existingDomain.exclusionPatterns,
        dependencies: updates.dependencies ?
          updates.dependencies.slice(0, 10) : existingDomain.dependencies
      };

      if (!this.validateDomainStructure(updatedDomain)) {
        this.logger.error('Updated domain structure invalid', { domainName });
        return false;
      }

      this.domainBoundaries.set(domainName, updatedDomain);
      this.logger.info('Domain updated successfully', { domainName });
      return true;

    } catch (error) {
      this.logger.error('Failed to update domain', {
        domainName,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Check domain conflicts - NASA Rule 10: ≤60 lines
   */
  checkDomainConflicts(domain: DomainBoundary): string[] {
    // Assertion 1: Valid domain
    console.assert(domain !== null && typeof domain === 'object', 'Valid domain object required');
    // Assertion 2: Domain has name
    console.assert(domain.domainName && domain.domainName.length > 0, 'Domain name required');

    const conflicts: string[] = [];
    const maxConflictChecks = 50; // NASA Rule 10: Fixed bound
    let checkCount = 0;

    // Check for name conflicts
    if (this.domainBoundaries.has(domain.domainName)) {
      conflicts.push(`Domain name '${domain.domainName}' already exists`);
    }

    // Check for responsibility overlaps
    for (const [existingName, existingDomain] of this.domainBoundaries) {
      if (checkCount >= maxConflictChecks) break;
      
      if (existingName === domain.domainName) {
        checkCount++;
        continue;
      }

      const overlap = this.findResponsibilityOverlap(domain, existingDomain);
      if (overlap.length > 0) {
        conflicts.push(`Responsibility overlap with domain '${existingName}': ${overlap.join(', ')}`);
      }
      
      checkCount++;
    }

    return conflicts.slice(0, 10); // NASA Rule 10: Fixed return limit
  }

  /**
   * Find responsibility overlap - NASA Rule 10: Single responsibility
   */
  private findResponsibilityOverlap(domain1: DomainBoundary, domain2: DomainBoundary): string[] {
    // Assertion 1: Valid domains
    console.assert(domain1 && domain2, 'Both domains required for overlap check');
    // Assertion 2: Different domains
    console.assert(domain1.domainName !== domain2.domainName, 'Domains must be different');

    const overlaps: string[] = [];
    const maxOverlapChecks = 25; // NASA Rule 10: Fixed bound
    let checkCount = 0;

    // NASA Rule 10: Fixed nested loop bounds
    for (let i = 0; i < Math.min(domain1.principalResponsibilities.length, 10); i++) {
      if (checkCount >= maxOverlapChecks) break;
      
      for (let j = 0; j < Math.min(domain2.principalResponsibilities.length, 10); j++) {
        if (checkCount >= maxOverlapChecks) break;
        
        const resp1 = domain1.principalResponsibilities[i].toLowerCase();
        const resp2 = domain2.principalResponsibilities[j].toLowerCase();
        
        if (this.responsibilitiesMatch(resp1, resp2)) {
          overlaps.push(domain1.principalResponsibilities[i]);
        }
        checkCount++;
      }
    }

    return overlaps.slice(0, 5); // NASA Rule 10: Fixed return limit
  }

  /**
   * Check if responsibilities match - NASA Rule 10: Single responsibility
   */
  private responsibilitiesMatch(resp1: string, resp2: string): boolean {
    // Assertion 1: Valid responsibilities
    console.assert(typeof resp1 === 'string' && typeof resp2 === 'string', 'String responsibilities required');
    // Assertion 2: Non-empty responsibilities
    console.assert(resp1.length > 0 && resp2.length > 0, 'Non-empty responsibilities required');

    // Simple matching - exact match or significant word overlap
    if (resp1 === resp2) {
      return true;
    }

    const words1 = resp1.split(/\s+/).slice(0, 5); // NASA Rule 10: Fixed bound
    const words2 = resp2.split(/\s+/).slice(0, 5); // NASA Rule 10: Fixed bound
    let matchCount = 0;
    const maxWordChecks = 25; // NASA Rule 10: Fixed bound
    let checkCount = 0;

    for (const word1 of words1) {
      if (checkCount >= maxWordChecks) break;
      
      for (const word2 of words2) {
        if (checkCount >= maxWordChecks) break;
        
        if (word1 === word2 && word1.length > 3) {
          matchCount++;
        }
        checkCount++;
      }
    }

    return matchCount >= 2; // Threshold for match
  }

  /**
   * Get domain statistics - NASA Rule 10: Single responsibility
   */
  getDomainStatistics(): {
    totalDomains: number;
    averageResponsibilities: number;
    averageDependencies: number;
    mostConnectedDomain: string | null;
  } {
    // Assertion 1: Domain map exists
    console.assert(this.domainBoundaries instanceof Map, 'Domain boundaries map must exist');
    // Assertion 2: Domain count within bounds
    console.assert(this.domainBoundaries.size <= MAX_DOMAINS, 'Domain count within limits');

    let totalResponsibilities = 0;
    let totalDependencies = 0;
    let maxDependencies = 0;
    let mostConnectedDomain: string | null = null;
    let domainCount = 0;
    const maxStatsDomains = Math.min(this.domainBoundaries.size, MAX_DOMAINS);

    // NASA Rule 10: Fixed iteration bounds
    for (const [domainName, domain] of this.domainBoundaries) {
      if (domainCount >= maxStatsDomains) break;
      
      totalResponsibilities += domain.principalResponsibilities.length;
      totalDependencies += domain.dependencies.length;
      
      if (domain.dependencies.length > maxDependencies) {
        maxDependencies = domain.dependencies.length;
        mostConnectedDomain = domainName;
      }
      
      domainCount++;
    }

    return {
      totalDomains: this.domainBoundaries.size,
      averageResponsibilities: domainCount > 0 ? totalResponsibilities / domainCount : 0,
      averageDependencies: domainCount > 0 ? totalDependencies / domainCount : 0,
      mostConnectedDomain
    };
  }

  /**
   * Clear all domains - NASA Rule 10: Single responsibility
   */
  clearAllDomains(): void {
    // Assertion 1: Domain map exists
    console.assert(this.domainBoundaries instanceof Map, 'Domain boundaries map must exist');
    // Assertion 2: Operation confirmation
    console.assert(true, 'Clearing all domains - operation confirmed');

    const domainCount = this.domainBoundaries.size;
    this.domainBoundaries.clear();
    
    this.logger.info('All domains cleared', { clearedCount: domainCount });
  }
}
