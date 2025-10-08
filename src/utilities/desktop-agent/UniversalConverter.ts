import { ComputerAction } from "../../services/desktop-agent/shared/types/computerAction.types";
import { ComputerToolUseContentBlock } from "../../services/desktop-agent/shared/types/messageContent.types";
import { MouseActionConverters } from './ActionConverters';
import { KeyboardActionConverters } from './ActionConverters';
import { SystemActionConverters } from './ActionConverters';
import { FileActionConverters } from './ActionConverters';

/**
 * Universal converter that handles all action types
 */
export class UniversalActionConverter {
  /**
   * Convert any computer action to a tool use block
   */
  static convertComputerActionToToolUseBlock(
    action: ComputerAction,
    toolUseId: string
  ): ComputerToolUseContentBlock {
    switch (action.action) {
      // Mouse actions
      case "move_mouse":
        return MouseActionConverters.convertMoveMouseAction(action, toolUseId);
      case "trace_mouse":
        return MouseActionConverters.convertTraceMouseAction(action, toolUseId);
      case "click_mouse":
        return MouseActionConverters.convertClickMouseAction(action, toolUseId);
      case "press_mouse":
        return MouseActionConverters.convertPressMouseAction(action, toolUseId);
      case "drag_mouse":
        return MouseActionConverters.convertDragMouseAction(action, toolUseId);
      case "scroll":
        return MouseActionConverters.convertScrollAction(action, toolUseId);

      // Keyboard actions
      case "type_keys":
        return KeyboardActionConverters.convertTypeKeysAction(action, toolUseId);
      case "press_keys":
        return KeyboardActionConverters.convertPressKeysAction(action, toolUseId);
      case "type_text":
        return KeyboardActionConverters.convertTypeTextAction(action, toolUseId);
      case "paste_text":
        return KeyboardActionConverters.convertPasteTextAction(action, toolUseId);

      // System actions
      case "wait":
        return SystemActionConverters.convertWaitAction(action, toolUseId);
      case "screenshot":
        return SystemActionConverters.convertScreenshotAction(action, toolUseId);
      case "cursor_position":
        return SystemActionConverters.convertCursorPositionAction(action, toolUseId);
      case "application":
        return SystemActionConverters.convertApplicationAction(action, toolUseId);

      // File actions
      case "write_file":
        return FileActionConverters.convertWriteFileAction(action, toolUseId);
      case "read_file":
        return FileActionConverters.convertReadFileAction(action, toolUseId);

      default:
        const exhaustiveCheck: never = action;
        throw new Error(
          `Unknown action type: ${(exhaustiveCheck as any).action}`
        );
    }
  }

  /**
   * Batch convert multiple actions
   */
  static convertMultipleActions(
    actions: ComputerAction[],
    generateToolUseId: () => string
  ): ComputerToolUseContentBlock[] {
    return actions.map(action =>
      this.convertComputerActionToToolUseBlock(action, generateToolUseId())
    );
  }

  /**
   * Convert action with validation
   */
  static convertWithValidation(
    action: ComputerAction,
    toolUseId: string
  ): { success: boolean; result?: ComputerToolUseContentBlock; error?: string } {
    try {
      const result = this.convertComputerActionToToolUseBlock(action, toolUseId);
      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown conversion error'
      };
    }
  }
}