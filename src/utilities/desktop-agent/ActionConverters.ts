import {
  ComputerAction,
  ClickMouseAction,
  DragMouseAction,
  MoveMouseAction,
  PressKeysAction,
  PressMouseAction,
  ScrollAction,
  TraceMouseAction,
  TypeKeysAction,
  TypeTextAction,
  WaitAction,
  ScreenshotAction,
  CursorPositionAction,
  ApplicationAction,
  PasteTextAction,
  WriteFileAction,
  ReadFileAction,
} from "../../services/desktop-agent/shared/types/computerAction.types";
import {
  ComputerToolUseContentBlock,
  MessageContentType,
} from "../../services/desktop-agent/shared/types/messageContent.types";

/**
 * Base converter utilities for tool use blocks
 */
export class BaseConverterUtils {
  /**
   * Base converter for creating tool use blocks
   */
  static createToolUseBlock(
    toolName: string,
    toolUseId: string,
    input: Record<string, any>
  ): ComputerToolUseContentBlock {
    return {
      type: MessageContentType.ToolUse,
      id: toolUseId,
      name: toolName as any,
      input,
    };
  }

  /**
   * Utility to conditionally add properties to objects
   */
  static conditionallyAdd<T extends Record<string, any>>(
    obj: T,
    conditions: Array<[boolean | undefined, string, any]>
  ): T {
    const result: Record<string, any> = { ...obj };
    conditions.forEach(([condition, key, value]) => {
      if (condition) {
        result[key] = value;
      }
    });
    return result as T;
  }
}

/**
 * Mouse action converters
 */
export class MouseActionConverters {
  static convertMoveMouseAction(
    action: MoveMouseAction,
    toolUseId: string
  ): ComputerToolUseContentBlock {
    return BaseConverterUtils.createToolUseBlock("computer_move_mouse", toolUseId, {
      coordinates: action.coordinates,
    });
  }

  static convertTraceMouseAction(
    action: TraceMouseAction,
    toolUseId: string
  ): ComputerToolUseContentBlock {
    return BaseConverterUtils.createToolUseBlock(
      "computer_trace_mouse",
      toolUseId,
      BaseConverterUtils.conditionallyAdd({ path: action.path }, [
        [action.holdKeys !== undefined, "holdKeys", action.holdKeys],
      ])
    );
  }

  static convertClickMouseAction(
    action: ClickMouseAction,
    toolUseId: string
  ): ComputerToolUseContentBlock {
    return BaseConverterUtils.createToolUseBlock(
      "computer_click_mouse",
      toolUseId,
      BaseConverterUtils.conditionallyAdd(
        {
          button: action.button,
          clickCount: action.clickCount,
        },
        [
          [action.coordinates !== undefined, "coordinates", action.coordinates],
          [action.holdKeys !== undefined, "holdKeys", action.holdKeys],
        ]
      )
    );
  }

  static convertPressMouseAction(
    action: PressMouseAction,
    toolUseId: string
  ): ComputerToolUseContentBlock {
    return BaseConverterUtils.createToolUseBlock(
      "computer_press_mouse",
      toolUseId,
      BaseConverterUtils.conditionallyAdd(
        {
          button: action.button,
          press: action.press,
        },
        [[action.coordinates !== undefined, "coordinates", action.coordinates]]
      )
    );
  }

  static convertDragMouseAction(
    action: DragMouseAction,
    toolUseId: string
  ): ComputerToolUseContentBlock {
    return BaseConverterUtils.createToolUseBlock(
      "computer_drag_mouse",
      toolUseId,
      BaseConverterUtils.conditionallyAdd(
        {
          path: action.path,
          button: action.button,
        },
        [[action.holdKeys !== undefined, "holdKeys", action.holdKeys]]
      )
    );
  }

  static convertScrollAction(
    action: ScrollAction,
    toolUseId: string
  ): ComputerToolUseContentBlock {
    return BaseConverterUtils.createToolUseBlock(
      "computer_scroll",
      toolUseId,
      BaseConverterUtils.conditionallyAdd(
        {
          direction: action.direction,
          scrollCount: action.scrollCount,
        },
        [
          [action.coordinates !== undefined, "coordinates", action.coordinates],
          [action.holdKeys !== undefined, "holdKeys", action.holdKeys],
        ]
      )
    );
  }
}

/**
 * Keyboard action converters
 */
export class KeyboardActionConverters {
  static convertTypeKeysAction(
    action: TypeKeysAction,
    toolUseId: string
  ): ComputerToolUseContentBlock {
    return BaseConverterUtils.createToolUseBlock(
      "computer_type_keys",
      toolUseId,
      BaseConverterUtils.conditionallyAdd({ keys: action.keys }, [
        [typeof action.delay === "number", "delay", action.delay],
      ])
    );
  }

  static convertPressKeysAction(
    action: PressKeysAction,
    toolUseId: string
  ): ComputerToolUseContentBlock {
    return BaseConverterUtils.createToolUseBlock("computer_press_keys", toolUseId, {
      keys: action.keys,
      press: action.press,
    });
  }

  static convertTypeTextAction(
    action: TypeTextAction,
    toolUseId: string
  ): ComputerToolUseContentBlock {
    return BaseConverterUtils.createToolUseBlock(
      "computer_type_text",
      toolUseId,
      BaseConverterUtils.conditionallyAdd({ text: action.text }, [
        [typeof action.delay === "number", "delay", action.delay],
        [typeof action.sensitive === "boolean", "isSensitive", action.sensitive],
      ])
    );
  }

  static convertPasteTextAction(
    action: PasteTextAction,
    toolUseId: string
  ): ComputerToolUseContentBlock {
    return BaseConverterUtils.createToolUseBlock("computer_paste_text", toolUseId, {
      text: action.text,
    });
  }
}

/**
 * System action converters
 */
export class SystemActionConverters {
  static convertWaitAction(
    action: WaitAction,
    toolUseId: string
  ): ComputerToolUseContentBlock {
    return BaseConverterUtils.createToolUseBlock("computer_wait", toolUseId, {
      duration: action.duration,
    });
  }

  static convertScreenshotAction(
    action: ScreenshotAction,
    toolUseId: string
  ): ComputerToolUseContentBlock {
    return BaseConverterUtils.createToolUseBlock("computer_screenshot", toolUseId, {});
  }

  static convertCursorPositionAction(
    action: CursorPositionAction,
    toolUseId: string
  ): ComputerToolUseContentBlock {
    return BaseConverterUtils.createToolUseBlock("computer_cursor_position", toolUseId, {});
  }

  static convertApplicationAction(
    action: ApplicationAction,
    toolUseId: string
  ): ComputerToolUseContentBlock {
    return BaseConverterUtils.createToolUseBlock("computer_application", toolUseId, {
      application: action.application,
    });
  }
}

/**
 * File operation converters
 */
export class FileActionConverters {
  static convertWriteFileAction(
    action: WriteFileAction,
    toolUseId: string
  ): ComputerToolUseContentBlock {
    return BaseConverterUtils.createToolUseBlock("computer_write_file", toolUseId, {
      path: action.path,
      data: action.data,
    });
  }

  static convertReadFileAction(
    action: ReadFileAction,
    toolUseId: string
  ): ComputerToolUseContentBlock {
    return BaseConverterUtils.createToolUseBlock("computer_read_file", toolUseId, {
      path: action.path,
    });
  }
}