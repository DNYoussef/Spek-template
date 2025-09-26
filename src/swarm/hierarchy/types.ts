/**
 * Type definitions for SPEK hierarchy
 */

export enum PrincessDomain {
  DEVELOPMENT = 'DEVELOPMENT',
  QUALITY = 'QUALITY',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  RESEARCH = 'RESEARCH',
  DEPLOYMENT = 'DEPLOYMENT',
  SECURITY = 'SECURITY'
}

export interface AgentCapability {
  name: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  description?: string;
}

export interface HierarchyNode {
  id: string;
  name: string;
  type: 'queen' | 'princess' | 'drone';
  domain?: PrincessDomain;
  parent?: string;
  children?: string[];
  capabilities?: AgentCapability[];
  status: 'active' | 'idle' | 'busy' | 'offline';
}