/**
 * ComputerUseToolsOrchestrator
 * Replaces the original ComputerUseTools god object with organized delegation
 */

import { Injectable } from '@nestjs/common';
import { MouseToolHandler } from './MouseToolHandler';
import { KeyboardToolHandler } from './KeyboardToolHandler';
import { SystemToolHandler } from './SystemToolHandler';
import { FileToolHandler } from './FileToolHandler';
import { ComputerUseService } from '../computer-use/computer-use.service';

@Injectable()
export class ComputerUseToolsOrchestrator {
  private mouseHandler: MouseToolHandler;
  private keyboardHandler: KeyboardToolHandler;
  private systemHandler: SystemToolHandler;
  private fileHandler: FileToolHandler;

  constructor(private readonly computerUse: ComputerUseService) {
    this.mouseHandler = new MouseToolHandler(computerUse);
    this.keyboardHandler = new KeyboardToolHandler(computerUse);
    this.systemHandler = new SystemToolHandler(computerUse);
    this.fileHandler = new FileToolHandler(computerUse);
  }

  /**
   * Get mouse operations handler (≤60 lines)
   */
  getMouseHandler(): MouseToolHandler {
    return this.mouseHandler;
  }

  /**
   * Get keyboard operations handler (≤60 lines)
   */
  getKeyboardHandler(): KeyboardToolHandler {
    return this.keyboardHandler;
  }

  /**
   * Get system operations handler (≤60 lines)
   */
  getSystemHandler(): SystemToolHandler {
    return this.systemHandler;
  }

  /**
   * Get file operations handler (≤60 lines)
   */
  getFileHandler(): FileToolHandler {
    return this.fileHandler;
  }

  /**
   * Route tool request to appropriate handler (≤60 lines)
   */
  async routeToolRequest(toolName: string, params: any): Promise<any> {
    if (toolName.includes('mouse') || toolName.includes('click') || toolName.includes('drag') || toolName.includes('scroll')) {
      return this.routeMouseRequest(toolName, params);
    }

    if (toolName.includes('key') || toolName.includes('type') || toolName.includes('paste')) {
      return this.routeKeyboardRequest(toolName, params);
    }

    if (toolName.includes('wait') || toolName.includes('application') || toolName.includes('screenshot')) {
      return this.routeSystemRequest(toolName, params);
    }

    if (toolName.includes('file') || toolName.includes('read') || toolName.includes('write')) {
      return this.routeFileRequest(toolName, params);
    }

    throw new Error(`Unknown tool: ${toolName}`);
  }

  /**
   * Route mouse-related requests (≤60 lines)
   */
  private async routeMouseRequest(toolName: string, params: any): Promise<any> {
    switch (toolName) {
      case 'computer_move_mouse':
        return this.mouseHandler.moveMouse(params);
      case 'computer_click_mouse':
        return this.mouseHandler.clickMouse(params);
      case 'computer_drag_mouse':
        return this.mouseHandler.dragMouse(params);
      case 'computer_scroll':
        return this.mouseHandler.scroll(params);
      case 'computer_cursor_position':
        return this.mouseHandler.cursorPosition();
      default:
        throw new Error(`Unknown mouse tool: ${toolName}`);
    }
  }

  /**
   * Route keyboard-related requests (≤60 lines)
   */
  private async routeKeyboardRequest(toolName: string, params: any): Promise<any> {
    switch (toolName) {
      case 'computer_type_keys':
        return this.keyboardHandler.typeKeys(params);
      case 'computer_press_keys':
        return this.keyboardHandler.pressKeys(params);
      case 'computer_type_text':
        return this.keyboardHandler.typeText(params);
      case 'computer_paste_text':
        return this.keyboardHandler.pasteText(params);
      default:
        throw new Error(`Unknown keyboard tool: ${toolName}`);
    }
  }

  /**
   * Route system-related requests (≤60 lines)
   */
  private async routeSystemRequest(toolName: string, params: any): Promise<any> {
    switch (toolName) {
      case 'computer_wait':
        return this.systemHandler.wait(params);
      case 'computer_application':
        return this.systemHandler.application(params);
      case 'computer_screenshot':
        return this.systemHandler.screenshot();
      default:
        throw new Error(`Unknown system tool: ${toolName}`);
    }
  }

  /**
   * Route file-related requests (≤60 lines)
   */
  private async routeFileRequest(toolName: string, params: any): Promise<any> {
    switch (toolName) {
      case 'computer_write_file':
        return this.fileHandler.writeFile(params);
      case 'computer_read_file':
        return this.fileHandler.readFile(params);
      default:
        throw new Error(`Unknown file tool: ${toolName}`);
    }
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: agent104-tools-orchestrator
// inputs: ["computer-use.tools.ts", "MouseToolHandler.ts", "KeyboardToolHandler.ts", "SystemToolHandler.ts", "FileToolHandler.ts"]
// tools_used: ["Write"]
// versions: {"model":"sonnet-4","prompt":"service-fsm-elimination"}
// === END FOOTER ===