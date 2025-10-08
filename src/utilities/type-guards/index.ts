/**
 * Type guard utilities for content blocks and tool use blocks
 * Decomposed from messageContent.utils.ts god object
 */

export {
  BasicContentTypeGuards,
  ThinkingContentTypeGuards,
  ToolContentTypeGuards,
  ContentTypeGuardUtils
} from './ContentTypeGuards';

export {
  MouseToolGuards,
  KeyboardToolGuards,
  SystemToolGuards,
  FileToolGuards,
  TaskToolGuards
} from './ComputerToolGuards';

// Legacy exports for backward compatibility
export {
  BasicContentTypeGuards as isTextContentBlock,
  BasicContentTypeGuards as isImageContentBlock,
  BasicContentTypeGuards as isDocumentContentBlock,
  ThinkingContentTypeGuards as isThinkingContentBlock,
  ThinkingContentTypeGuards as isRedactedThinkingContentBlock,
  ToolContentTypeGuards as isToolUseContentBlock,
  ToolContentTypeGuards as isComputerToolUseContentBlock,
  ToolContentTypeGuards as isToolResultContentBlock,
  ContentTypeGuardUtils as isMessageContentBlock,
  ContentTypeGuardUtils as getMessageContentBlockType,
} from './ContentTypeGuards';