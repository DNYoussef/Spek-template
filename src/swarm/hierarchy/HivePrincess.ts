/**
 * Hive Princess - Factory Pattern Facade
 *
 * Factory for creating domain-specific Princess instances.
 * Delegates to specialized princess classes based on domain.
 *
 * REFACTORED: Reduced from 1200 LOC to 130 LOC (92% reduction)
 */

import { PrincessBase } from './base/PrincessBase';
import { ArchitecturePrincess } from './domains/ArchitecturePrincess';
import { DevelopmentPrincess } from './domains/DevelopmentPrincess';
import { QualityPrincess } from './domains/QualityPrincess';
import { SecurityPrincess } from './domains/SecurityPrincess';
import { PerformancePrincess } from './domains/PerformancePrincess';
import { DocumentationPrincess } from './domains/DocumentationPrincess';

export type DomainType = 'Architecture' | 'Development' | 'Quality' | 'Security' | 'Performance' | 'Documentation';

export class HivePrincess {
  private static instances: Map<string, PrincessBase> = new Map();

  /**
   * Create or retrieve a domain-specific princess
   */
  static create(domain: DomainType): PrincessBase {
    // Check if instance already exists
    if (this.instances.has(domain)) {
      return this.instances.get(domain)!;
    }

    // Create new domain-specific princess
    let princess: PrincessBase;

    switch (domain) {
      case 'Architecture':
        princess = new ArchitecturePrincess();
        break;
      case 'Development':
        princess = new DevelopmentPrincess();
        break;
      case 'Quality':
        princess = new QualityPrincess();
        break;
      case 'Security':
        princess = new SecurityPrincess();
        break;
      case 'Performance':
        princess = new PerformancePrincess();
        break;
      case 'Documentation':
        princess = new DocumentationPrincess();
        break;
      default:
        throw new Error(`Unknown domain: ${domain}`);
    }

    // Cache instance
    this.instances.set(domain, princess);

    return princess;
  }

  /**
   * Create all domain princesses
   */
  static createAll(): Map<DomainType, PrincessBase> {
    const domains: DomainType[] = [
      'Architecture',
      'Development',
      'Quality',
      'Security',
      'Performance',
      'Documentation'
    ];

    const princesses = new Map<DomainType, PrincessBase>();

    for (const domain of domains) {
      princesses.set(domain, this.create(domain));
    }

    return princesses;
  }

  /**
   * Get existing princess instance
   */
  static get(domain: DomainType): PrincessBase | undefined {
    return this.instances.get(domain);
  }

  /**
   * Clear all princess instances
   */
  static clearAll(): void {
    this.instances.clear();
  }

  /**
   * Get all active princesses
   */
  static getAll(): Map<string, PrincessBase> {
    return new Map(this.instances);
  }

  /**
   * Legacy constructor for backward compatibility
   */
  constructor(domainName: string, modelType?: string, agentCount?: number) {
    console.warn('Direct HivePrincess instantiation is deprecated. Use HivePrincess.create() instead.');

    // Map old domain names to new types
    const domainMap: Record<string, DomainType> = {
      'architecture': 'Architecture',
      'development': 'Development',
      'quality': 'Quality',
      'security': 'Security',
      'performance': 'Performance',
      'documentation': 'Documentation',
      'research': 'Documentation',
      'infrastructure': 'Performance',
      'coordination': 'Architecture'
    };

    const mappedDomain = domainMap[domainName.toLowerCase()] || 'Development';
    const princess = HivePrincess.create(mappedDomain);

    // Copy princess methods to this instance for backward compatibility
    return princess as any;
  }
}

export default HivePrincess;