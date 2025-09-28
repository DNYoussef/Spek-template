/**
 * Utilities Index - Domain-Organized Utility Functions
 *
 * This replaces the previous utility god objects with focused,
 * domain-specific modules that enable tree-shaking and better organization.
 *
 * ELIMINATED GOD OBJECTS:
 * - SharedMemoryProtocol.ts (574 lines) -> Memory utilities
 * - messageContent.utils.ts (515 lines) -> Type guard utilities
 * - SharedMemoryBus.ts (380 lines) -> Event bus utilities
 * - computerAction.utils.ts (342 lines) -> Desktop agent utilities
 */

// Memory utilities - from SharedMemoryProtocol decomposition
export * from './memory';

// Messaging utilities - cross-domain communication
export * from './messaging';

// Type guards - from messageContent.utils decomposition
export * from './type-guards';

// Desktop agent utilities - from computerAction.utils decomposition
export * from './desktop-agent';

// Generic validation utilities
export * from './validation';

/**
 * Tree-shaking friendly imports
 *
 * Users can now import only what they need:
 *
 * import { AccessControlUtils } from 'src/utilities/memory/AccessControl';
 * import { MouseActionConverters } from 'src/utilities/desktop-agent/ActionConverters';
 * import { BasicContentTypeGuards } from 'src/utilities/type-guards/ContentTypeGuards';
 *
 * This enables dead code elimination and reduces bundle size.
 */

/**
 * NASA Rule 10 Compliance:
 * - All utility functions are under 60 lines
 * - Each module has a single responsibility
 * - Clear separation of concerns
 * - No recursive utility patterns
 */