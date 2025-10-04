/**
 * workflow/WorkflowTypes.ts
 * PRODUCTION: Central workflow type definitions
 *
 * This file re-exports from the canonical source to provide a single source of truth.
 * All workflow types are maintained in the orchestration module and re-exported here
 * for centralized access via path alias: ~types/workflow/WorkflowTypes
 *
 * @module types/workflow/WorkflowTypes
 * @canonical src/architecture/langgraph/workflows/orchestration/WorkflowTypes.ts
 */

// PRODUCTION: Re-export all workflow types from canonical source
export * from '../../architecture/langgraph/workflows/orchestration/WorkflowTypes';

/**
 * MIGRATION NOTE:
 *
 * This file previously contained duplicate type definitions that were out of sync
 * with the canonical source. As of Week 5 Phase 2, all types are now re-exported
 * from the orchestration module which is the single source of truth.
 *
 * Canonical Source: src/architecture/langgraph/workflows/orchestration/WorkflowTypes.ts
 * - Contains: 350 lines, 39 exported types
 * - Includes: WorkflowDefinition, WorkflowValidator, WorkflowExecutor, etc.
 *
 * Import Pattern (use path alias for consistency):
 * import { WorkflowDefinition } from '~types/workflow/WorkflowTypes';
 *
 * DO NOT add type definitions directly to this file.
 * Update the canonical source instead.
 */
