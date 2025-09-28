/**
 * SystemToolHandler
 * Handles system-level computer automation tools (NASA Rule 10 compliant)
 */

import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { ComputerUseService } from '../computer-use/computer-use.service';
import { compressPngBase64Under1MB } from '../mcp/compressor';

@Injectable()
export class SystemToolHandler {
  constructor(private readonly computerUse: ComputerUseService) {}

  /**
   * Wait for specified duration (≤60 lines)
   */
  @Tool({
    name: 'computer_wait',
    description: 'Pauses execution for a specified duration.',
    parameters: z.object({
      duration: z.number().default(500).describe('The duration to wait in milliseconds.'),
    }),
  })
  async wait({ duration }: { duration: number }) {
    try {
      await this.computerUse.action({ action: 'wait', duration });
      return { content: [{ type: 'text', text: 'waiting done' }] };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: `Error waiting: ${(err as Error).message}`,
        }],
      };
    }
  }

  /**
   * Open or switch application (≤60 lines)
   */
  @Tool({
    name: 'computer_application',
    description: 'Opens or switches to the specified application and maximizes it.',
    parameters: z.object({
      application: z.enum([
        'firefox',
        '1password',
        'thunderbird',
        'vscode',
        'terminal',
        'desktop',
        'directory',
      ]),
    }),
  })
  async application({
    application,
  }: {
    application: 'firefox' | '1password' | 'thunderbird' | 'vscode' | 'terminal' | 'desktop' | 'directory';
  }) {
    try {
      await this.computerUse.action({ action: 'application', application });
      return { content: [{ type: 'text', text: 'application opened' }] };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: `Error opening application: ${(err as Error).message}`,
        }],
      };
    }
  }

  /**
   * Capture screenshot (≤60 lines)
   */
  @Tool({
    name: 'computer_screenshot',
    description: 'Captures a screenshot of the current screen.',
  })
  async screenshot() {
    try {
      const shot = await this.computerUse.action({
        action: 'screenshot',
      }) as { image: string };

      return {
        content: [{
          type: 'image',
          data: await compressPngBase64Under1MB(shot.image),
          mimeType: 'image/png',
        }],
      };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: `Error taking screenshot: ${(err as Error).message}`,
        }],
      };
    }
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T12:53:25-04:00 | AGENT104@sonnet-4 | Extract SystemToolHandler from computer-use.tools | SystemToolHandler.ts | OK | System operations split, <60 lines per function | 0.00 | b9e4c5f |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: agent104-system-tool-handler
- inputs: ["computer-use.tools.ts analysis"]
- tools_used: ["Write"]
- versions: {"model":"sonnet-4","prompt":"service-fsm-elimination"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->