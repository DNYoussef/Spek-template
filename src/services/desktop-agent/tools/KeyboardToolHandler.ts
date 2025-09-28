/**
 * KeyboardToolHandler
 * Handles keyboard-related computer automation tools (NASA Rule 10 compliant)
 */

import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { ComputerUseService } from '../computer-use/computer-use.service';

@Injectable()
export class KeyboardToolHandler {
  constructor(private readonly computerUse: ComputerUseService) {}

  /**
   * Type sequence of keys (≤60 lines)
   */
  @Tool({
    name: 'computer_type_keys',
    description: `Simulates typing a sequence of keys, often used for shortcuts involving modifier keys (e.g., Ctrl+C). Presses and releases each key in order.`,
    parameters: z.object({
      keys: z.array(z.string()).describe('An array of key names to type in sequence (e.g., ["control", "c"]).'),
      delay: z.number().optional().describe('Optional delay in milliseconds between key presses.'),
    }),
  })
  async typeKeys({ keys, delay }: { keys: string[]; delay?: number }) {
    try {
      await this.computerUse.action({ action: 'type_keys', keys, delay });
      return { content: [{ type: 'text', text: 'keys typed' }] };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: `Error typing keys: ${(err as Error).message}`,
        }],
      };
    }
  }

  /**
   * Press or release keys (≤60 lines)
   */
  @Tool({
    name: 'computer_press_keys',
    description: `Simulates pressing down or releasing specific keys. Useful for holding modifier keys.`,
    parameters: z.object({
      keys: z.array(z.string()).describe('An array of key names to press or release (e.g., ["shift"]).'),
      press: z.enum(['down', 'up']).describe('Whether to press the keys down or release them up.'),
    }),
  })
  async pressKeys({ keys, press }: { keys: string[]; press: 'down' | 'up' }) {
    try {
      await this.computerUse.action({ action: 'press_keys', keys, press });
      return { content: [{ type: 'text', text: 'keys pressed' }] };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: `Error pressing keys: ${(err as Error).message}`,
        }],
      };
    }
  }

  /**
   * Type text character by character (≤60 lines)
   */
  @Tool({
    name: 'computer_type_text',
    description: 'Types a string of text character by character. Use this tool for strings less than 25 characters, or passwords/sensitive form fields.',
    parameters: z.object({
      text: z.string().describe('The text string to type.'),
      delay: z.number().optional().describe('Optional delay in milliseconds between key presses.'),
    }),
  })
  async typeText({ text, delay }: { text: string; delay?: number }) {
    try {
      await this.computerUse.action({ action: 'type_text', text, delay });
      return { content: [{ type: 'text', text: 'text typed' }] };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: `Error typing text: ${(err as Error).message}`,
        }],
      };
    }
  }

  /**
   * Paste text via clipboard (≤60 lines)
   */
  @Tool({
    name: 'computer_paste_text',
    description: 'Copies text to the clipboard and pastes it. Use this tool for typing long text strings or special characters not on the standard keyboard.',
    parameters: z.object({
      text: z.string().describe('The text string to paste.'),
    }),
  })
  async pasteText({ text }: { text: string }) {
    try {
      await this.computerUse.action({ action: 'paste_text', text });
      return { content: [{ type: 'text', text: 'text pasted' }] };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: `Error pasting text: ${(err as Error).message}`,
        }],
      };
    }
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T12:52:50-04:00 | AGENT104@sonnet-4 | Extract KeyboardToolHandler from computer-use.tools | KeyboardToolHandler.ts | OK | Keyboard operations split, <60 lines per function | 0.00 | d3b7f1c |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: agent104-keyboard-tool-handler
- inputs: ["computer-use.tools.ts analysis"]
- tools_used: ["Write"]
- versions: {"model":"sonnet-4","prompt":"service-fsm-elimination"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->