/**
 * Pattern Types - Stub definitions for Pattern Engine
 * TODO(Phase 4): Complete implementation with full type definitions
 */

export interface DocumentationPattern {
  id: string;
  type: PatternType;
  content: string;
  metadata: PatternMetadata;
}

export type PatternType =
  | 'class-documentation'
  | 'function-documentation'
  | 'api-documentation'
  | 'type-documentation'
  | 'module-documentation'
  | string;

export interface PatternMetadata {
  filePath: string;
  lineNumber?: number;
  confidence: number;
  tags: string[];
  createdAt: number;
  updatedAt?: number;
}
