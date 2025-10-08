import {
  MoveMouseToolUseBlock,
  TraceMouseToolUseBlock,
  ClickMouseToolUseBlock,
  PressMouseToolUseBlock,
  DragMouseToolUseBlock,
  ScrollToolUseBlock,
  TypeKeysToolUseBlock,
  PressKeysToolUseBlock,
  TypeTextToolUseBlock,
  WaitToolUseBlock,
  ScreenshotToolUseBlock,
  CursorPositionToolUseBlock,
  ApplicationToolUseBlock,
  SetTaskStatusToolUseBlock,
  CreateTaskToolUseBlock,
  PasteTextToolUseBlock,
  WriteFileToolUseBlock,
  ReadFileToolUseBlock
} from "../../services/desktop-agent/shared/types/messageContent.types";
import { ToolContentTypeGuards } from './ContentTypeGuards';

/**
 * Type guards for mouse tool use blocks
 */
export class MouseToolGuards {
  /**
   * Type guard to check if an object is a MoveMouseToolUseBlock
   */
  static isMoveMouseToolUseBlock(obj: unknown): obj is MoveMouseToolUseBlock {
    if (!ToolContentTypeGuards.isComputerToolUseContentBlock(obj)) {
      return false;
    }

    const block = obj as Record<string, any>;
    return block.name === "computer_move_mouse";
  }

  /**
   * Type guard to check if an object is a TraceMouseToolUseBlock
   */
  static isTraceMouseToolUseBlock(obj: unknown): obj is TraceMouseToolUseBlock {
    if (!ToolContentTypeGuards.isComputerToolUseContentBlock(obj)) {
      return false;
    }

    const block = obj as Record<string, any>;
    return block.name === "computer_trace_mouse";
  }

  /**
   * Type guard to check if an object is a ClickMouseToolUseBlock
   */
  static isClickMouseToolUseBlock(obj: unknown): obj is ClickMouseToolUseBlock {
    if (!ToolContentTypeGuards.isComputerToolUseContentBlock(obj)) {
      return false;
    }

    const block = obj as Record<string, any>;
    return block.name === "computer_click_mouse";
  }

  /**
   * Type guard to check if an object is a PressMouseToolUseBlock
   */
  static isPressMouseToolUseBlock(obj: unknown): obj is PressMouseToolUseBlock {
    if (!ToolContentTypeGuards.isComputerToolUseContentBlock(obj)) {
      return false;
    }

    const block = obj as Record<string, any>;
    return block.name === "computer_press_mouse";
  }

  /**
   * Type guard to check if an object is a DragMouseToolUseBlock
   */
  static isDragMouseToolUseBlock(obj: unknown): obj is DragMouseToolUseBlock {
    if (!ToolContentTypeGuards.isComputerToolUseContentBlock(obj)) {
      return false;
    }

    const block = obj as Record<string, any>;
    return block.name === "computer_drag_mouse";
  }
}

/**
 * Type guards for keyboard tool use blocks
 */
export class KeyboardToolGuards {
  /**
   * Type guard to check if an object is a TypeKeysToolUseBlock
   */
  static isTypeKeysToolUseBlock(obj: unknown): obj is TypeKeysToolUseBlock {
    if (!ToolContentTypeGuards.isComputerToolUseContentBlock(obj)) {
      return false;
    }

    const block = obj as Record<string, any>;
    return block.name === "computer_type_keys";
  }

  /**
   * Type guard to check if an object is a PressKeysToolUseBlock
   */
  static isPressKeysToolUseBlock(obj: unknown): obj is PressKeysToolUseBlock {
    if (!ToolContentTypeGuards.isComputerToolUseContentBlock(obj)) {
      return false;
    }

    const block = obj as Record<string, any>;
    return block.name === "computer_press_keys";
  }

  /**
   * Type guard to check if an object is a TypeTextToolUseBlock
   */
  static isTypeTextToolUseBlock(obj: unknown): obj is TypeTextToolUseBlock {
    if (!ToolContentTypeGuards.isComputerToolUseContentBlock(obj)) {
      return false;
    }

    const block = obj as Record<string, any>;
    return block.name === "computer_type_text";
  }

  /**
   * Type guard to check if an object is a PasteTextToolUseBlock
   */
  static isPasteTextToolUseBlock(obj: unknown): obj is PasteTextToolUseBlock {
    if (!ToolContentTypeGuards.isComputerToolUseContentBlock(obj)) {
      return false;
    }

    const block = obj as Record<string, any>;
    return block.name === "computer_paste_text";
  }
}

/**
 * Type guards for system tool use blocks
 */
export class SystemToolGuards {
  /**
   * Type guard to check if an object is a WaitToolUseBlock
   */
  static isWaitToolUseBlock(obj: unknown): obj is WaitToolUseBlock {
    if (!ToolContentTypeGuards.isComputerToolUseContentBlock(obj)) {
      return false;
    }

    const block = obj as Record<string, any>;
    return block.name === "computer_wait";
  }

  /**
   * Type guard to check if an object is a ScreenshotToolUseBlock
   */
  static isScreenshotToolUseBlock(obj: unknown): obj is ScreenshotToolUseBlock {
    if (!ToolContentTypeGuards.isComputerToolUseContentBlock(obj)) {
      return false;
    }

    const block = obj as Record<string, any>;
    return block.name === "computer_screenshot";
  }

  /**
   * Type guard to check if an object is a CursorPositionToolUseBlock
   */
  static isCursorPositionToolUseBlock(obj: unknown): obj is CursorPositionToolUseBlock {
    if (!ToolContentTypeGuards.isComputerToolUseContentBlock(obj)) {
      return false;
    }

    const block = obj as Record<string, any>;
    return block.name === "computer_cursor_position";
  }

  /**
   * Type guard to check if an object is a ScrollToolUseBlock
   */
  static isScrollToolUseBlock(obj: unknown): obj is ScrollToolUseBlock {
    if (!ToolContentTypeGuards.isComputerToolUseContentBlock(obj)) {
      return false;
    }

    const block = obj as Record<string, any>;
    return block.name === "computer_scroll";
  }

  /**
   * Type guard to check if an object is an ApplicationToolUseBlock
   */
  static isApplicationToolUseBlock(obj: unknown): obj is ApplicationToolUseBlock {
    if (!ToolContentTypeGuards.isComputerToolUseContentBlock(obj)) {
      return false;
    }

    const block = obj as Record<string, any>;
    return block.name === "computer_application";
  }
}

/**
 * Type guards for file operation tool use blocks
 */
export class FileToolGuards {
  /**
   * Type guard to check if an object is a WriteFileToolUseBlock
   */
  static isWriteFileToolUseBlock(obj: unknown): obj is WriteFileToolUseBlock {
    if (!ToolContentTypeGuards.isComputerToolUseContentBlock(obj)) {
      return false;
    }

    const block = obj as Record<string, any>;
    return block.name === "computer_write_file";
  }

  /**
   * Type guard to check if an object is a ReadFileToolUseBlock
   */
  static isReadFileToolUseBlock(obj: unknown): obj is ReadFileToolUseBlock {
    if (!ToolContentTypeGuards.isComputerToolUseContentBlock(obj)) {
      return false;
    }

    const block = obj as Record<string, any>;
    return block.name === "computer_read_file";
  }
}

/**
 * Type guards for task management tool use blocks
 */
export class TaskToolGuards {
  /**
   * Type guard to check if an object is a SetTaskStatusToolUseBlock
   */
  static isSetTaskStatusToolUseBlock(obj: unknown): obj is SetTaskStatusToolUseBlock {
    if (!ToolContentTypeGuards.isToolUseContentBlock(obj)) {
      return false;
    }

    const block = obj as Record<string, any>;
    return block.name === "set_task_status";
  }

  /**
   * Type guard to check if an object is a CreateTaskToolUseBlock
   */
  static isCreateTaskToolUseBlock(obj: unknown): obj is CreateTaskToolUseBlock {
    if (!ToolContentTypeGuards.isToolUseContentBlock(obj)) {
      return false;
    }

    const block = obj as Record<string, any>;
    return block.name === "create_task";
  }
}