import {
  MessageContentType,
  TextContentBlock,
  ImageContentBlock,
  DocumentContentBlock,
  ToolUseContentBlock,
  ComputerToolUseContentBlock,
  ToolResultContentBlock,
  ThinkingContentBlock,
  RedactedThinkingContentBlock,
  UserActionContentBlock,
  MessageContentBlock
} from "../../services/desktop-agent/shared/types/messageContent.types";

/**
 * Type guards for basic content blocks
 */
export class BasicContentTypeGuards {
  /**
   * Type guard to check if an object is a TextContentBlock
   */
  static isTextContentBlock(obj: unknown): obj is TextContentBlock {
    if (!obj || typeof obj !== "object") {
      return false;
    }

    const block = obj as Partial<TextContentBlock>;
    return (
      block.type === MessageContentType.Text && typeof block.text === "string"
    );
  }

  /**
   * Type guard to check if an object is an ImageContentBlock
   */
  static isImageContentBlock(obj: unknown): obj is ImageContentBlock {
    if (!obj || typeof obj !== "object") {
      return false;
    }

    const block = obj as Partial<ImageContentBlock>;
    return (
      block.type === MessageContentType.Image &&
      block.source !== undefined &&
      typeof block.source === "object" &&
      typeof block.source.media_type === "string" &&
      typeof block.source.type === "string" &&
      typeof block.source.data === "string"
    );
  }

  /**
   * Type guard to check if an object is a DocumentContentBlock
   */
  static isDocumentContentBlock(obj: unknown): obj is DocumentContentBlock {
    if (!obj || typeof obj !== "object") {
      return false;
    }

    const block = obj as Partial<DocumentContentBlock>;
    return (
      block.type === MessageContentType.Document &&
      block.source !== undefined &&
      typeof block.source === "object" &&
      typeof block.source.type === "string" &&
      typeof block.source.media_type === "string" &&
      typeof block.source.data === "string"
    );
  }

  /**
   * Type guard to check if an object is a UserActionContentBlock
   */
  static isUserActionContentBlock(obj: unknown): obj is UserActionContentBlock {
    if (!obj || typeof obj !== "object") {
      return false;
    }

    const block = obj as Partial<UserActionContentBlock>;
    return block.type === MessageContentType.UserAction;
  }
}

/**
 * Type guards for thinking content blocks
 */
export class ThinkingContentTypeGuards {
  /**
   * Type guard to check if an object is a ThinkingContentBlock
   */
  static isThinkingContentBlock(obj: unknown): obj is ThinkingContentBlock {
    if (!obj || typeof obj !== "object") {
      return false;
    }

    const block = obj as Partial<ThinkingContentBlock>;
    return (
      block.type === MessageContentType.Thinking &&
      typeof block.thinking === "string" &&
      typeof block.signature === "string"
    );
  }

  /**
   * Type guard to check if an object is a RedactedThinkingContentBlock
   */
  static isRedactedThinkingContentBlock(obj: unknown): obj is RedactedThinkingContentBlock {
    if (!obj || typeof obj !== "object") {
      return false;
    }

    const block = obj as Partial<RedactedThinkingContentBlock>;
    return (
      block.type === MessageContentType.RedactedThinking &&
      typeof block.data === "string"
    );
  }
}

/**
 * Type guards for tool content blocks
 */
export class ToolContentTypeGuards {
  /**
   * Type guard to check if an object is a ToolUseContentBlock
   */
  static isToolUseContentBlock(obj: unknown): obj is ToolUseContentBlock {
    if (!obj || typeof obj !== "object") {
      return false;
    }

    const block = obj as Partial<ToolUseContentBlock>;
    return (
      block.type === MessageContentType.ToolUse &&
      typeof block.name === "string" &&
      typeof block.id === "string" &&
      block.input !== undefined &&
      typeof block.input === "object"
    );
  }

  /**
   * Type guard to check if an object is a ComputerToolUseContentBlock
   */
  static isComputerToolUseContentBlock(obj: unknown): obj is ComputerToolUseContentBlock {
    if (!this.isToolUseContentBlock(obj)) {
      return false;
    }

    return (obj as ToolUseContentBlock).name.startsWith("computer_");
  }

  /**
   * Type guard to check if an object is a ToolResultContentBlock
   */
  static isToolResultContentBlock(obj: unknown): obj is ToolResultContentBlock {
    if (!obj || typeof obj !== "object") {
      return false;
    }

    const block = obj as Partial<ToolResultContentBlock>;
    return (
      block.type === MessageContentType.ToolResult &&
      typeof block.tool_use_id === "string"
    );
  }
}

/**
 * Combined type guard utilities
 */
export class ContentTypeGuardUtils {
  /**
   * Type guard to check if an object is any type of MessageContentBlock
   */
  static isMessageContentBlock(obj: unknown): obj is MessageContentBlock {
    return (
      BasicContentTypeGuards.isTextContentBlock(obj) ||
      BasicContentTypeGuards.isImageContentBlock(obj) ||
      BasicContentTypeGuards.isDocumentContentBlock(obj) ||
      ToolContentTypeGuards.isToolUseContentBlock(obj) ||
      ToolContentTypeGuards.isToolResultContentBlock(obj) ||
      ThinkingContentTypeGuards.isThinkingContentBlock(obj) ||
      ThinkingContentTypeGuards.isRedactedThinkingContentBlock(obj) ||
      BasicContentTypeGuards.isUserActionContentBlock(obj)
    );
  }

  /**
   * Determines the specific type of MessageContentBlock for a given object
   */
  static getMessageContentBlockType(obj: unknown): string | null {
    if (!obj || typeof obj !== "object") {
      return null;
    }

    if (BasicContentTypeGuards.isTextContentBlock(obj)) {
      return "TextContentBlock";
    }

    if (BasicContentTypeGuards.isImageContentBlock(obj)) {
      return "ImageContentBlock";
    }

    if (BasicContentTypeGuards.isDocumentContentBlock(obj)) {
      return "DocumentContentBlock";
    }

    if (ThinkingContentTypeGuards.isThinkingContentBlock(obj)) {
      return "ThinkingContentBlock";
    }

    if (ThinkingContentTypeGuards.isRedactedThinkingContentBlock(obj)) {
      return "RedactedThinkingContentBlock";
    }

    if (ToolContentTypeGuards.isComputerToolUseContentBlock(obj)) {
      const computerBlock = obj as ComputerToolUseContentBlock;
      if (computerBlock.input && typeof computerBlock.input === "object") {
        return `ComputerToolUseContentBlock:${computerBlock.name.replace(
          "computer_",
          ""
        )}`;
      }
      return "ComputerToolUseContentBlock";
    }

    if (ToolContentTypeGuards.isToolUseContentBlock(obj)) {
      return "ToolUseContentBlock";
    }

    if (ToolContentTypeGuards.isToolResultContentBlock(obj)) {
      return "ToolResultContentBlock";
    }

    return null;
  }
}