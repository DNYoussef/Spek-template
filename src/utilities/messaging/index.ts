/**
 * Messaging utilities for cross-domain communication
 * Decomposed from SharedMemoryProtocol god object
 */

export { MessageValidationUtils, CrossDomainMessage } from './MessageValidation';
export { QueueManagementUtils } from './QueueManagement';

// Re-export common types for convenience
export type {
  CrossDomainMessage
} from './MessageValidation';