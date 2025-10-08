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

/**
 * Type guard factory for computer actions
 */
export class ActionTypeGuardFactory {
  /**
   * Creates a type guard for a specific action type
   */
  static createActionTypeGuard<T extends ComputerAction>(
    actionType: T["action"]
  ): (obj: unknown) => obj is T {
    return (obj: unknown): obj is T => {
      if (!obj || typeof obj !== "object") {
        return false;
      }
      const action = obj as Record<string, any>;
      return action.action === actionType;
    };
  }
}

/**
 * Mouse action type guards
 */
export class MouseActionTypeGuards {
  static readonly isMoveMouseAction = ActionTypeGuardFactory.createActionTypeGuard<MoveMouseAction>("move_mouse");
  static readonly isTraceMouseAction = ActionTypeGuardFactory.createActionTypeGuard<TraceMouseAction>("trace_mouse");
  static readonly isClickMouseAction = ActionTypeGuardFactory.createActionTypeGuard<ClickMouseAction>("click_mouse");
  static readonly isPressMouseAction = ActionTypeGuardFactory.createActionTypeGuard<PressMouseAction>("press_mouse");
  static readonly isDragMouseAction = ActionTypeGuardFactory.createActionTypeGuard<DragMouseAction>("drag_mouse");
}

/**
 * Keyboard action type guards
 */
export class KeyboardActionTypeGuards {
  static readonly isTypeKeysAction = ActionTypeGuardFactory.createActionTypeGuard<TypeKeysAction>("type_keys");
  static readonly isPressKeysAction = ActionTypeGuardFactory.createActionTypeGuard<PressKeysAction>("press_keys");
  static readonly isTypeTextAction = ActionTypeGuardFactory.createActionTypeGuard<TypeTextAction>("type_text");
  static readonly isPasteTextAction = ActionTypeGuardFactory.createActionTypeGuard<PasteTextAction>("paste_text");
}

/**
 * System action type guards
 */
export class SystemActionTypeGuards {
  static readonly isScrollAction = ActionTypeGuardFactory.createActionTypeGuard<ScrollAction>("scroll");
  static readonly isWaitAction = ActionTypeGuardFactory.createActionTypeGuard<WaitAction>("wait");
  static readonly isScreenshotAction = ActionTypeGuardFactory.createActionTypeGuard<ScreenshotAction>("screenshot");
  static readonly isCursorPositionAction = ActionTypeGuardFactory.createActionTypeGuard<CursorPositionAction>("cursor_position");
  static readonly isApplicationAction = ActionTypeGuardFactory.createActionTypeGuard<ApplicationAction>("application");
}

/**
 * File action type guards
 */
export class FileActionTypeGuards {
  static readonly isWriteFileAction = ActionTypeGuardFactory.createActionTypeGuard<WriteFileAction>("write_file");
  static readonly isReadFileAction = ActionTypeGuardFactory.createActionTypeGuard<ReadFileAction>("read_file");
}

/**
 * Combined action type guard utilities
 */
export class ActionTypeGuardUtils {
  /**
   * Check if an object is any computer action
   */
  static isComputerAction(obj: unknown): obj is ComputerAction {
    if (!obj || typeof obj !== "object") {
      return false;
    }

    const action = obj as Record<string, any>;
    const validActions = [
      "move_mouse", "trace_mouse", "click_mouse", "press_mouse", "drag_mouse",
      "type_keys", "press_keys", "type_text", "paste_text",
      "scroll", "wait", "screenshot", "cursor_position", "application",
      "write_file", "read_file"
    ];

    return typeof action.action === "string" && validActions.includes(action.action);
  }

  /**
   * Get the category of a computer action
   */
  static getActionCategory(action: ComputerAction): "mouse" | "keyboard" | "system" | "file" {
    const mouseActions = ["move_mouse", "trace_mouse", "click_mouse", "press_mouse", "drag_mouse"];
    const keyboardActions = ["type_keys", "press_keys", "type_text", "paste_text"];
    const fileActions = ["write_file", "read_file"];

    if (mouseActions.includes(action.action)) {
      return "mouse";
    }

    if (keyboardActions.includes(action.action)) {
      return "keyboard";
    }

    if (fileActions.includes(action.action)) {
      return "file";
    }

    return "system";
  }

  /**
   * Validate action structure
   */
  static validateActionStructure(action: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!action || typeof action !== "object") {
      errors.push("Action must be an object");
      return { valid: false, errors };
    }

    const actionObj = action as Record<string, any>;

    if (!actionObj.action || typeof actionObj.action !== "string") {
      errors.push("Action must have a valid action type");
    }

    if (!this.isComputerAction(action)) {
      errors.push(`Unknown action type: ${actionObj.action}`);
    }

    return { valid: errors.length === 0, errors };
  }
}