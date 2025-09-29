/**
 * FileToolHandler
 * Handles file system operations for computer automation (NASA Rule 10 compliant)
 */

import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { ComputerUseService } from '../computer-use/computer-use.service';

@Injectable()
export class FileToolHandler {
  constructor(private readonly computerUse: ComputerUseService) {}

  /**
   * Write file with base64 data (≤60 lines)
   */
  @Tool({
    name: 'computer_write_file',
    description: 'Writes a file to the specified path with base64 encoded data.',
    parameters: z.object({
      path: z.string().describe('The file path where the file should be written.'),
      data: z.string().describe('Base64 encoded file data to write.'),
    }),
  })
  async writeFile({ path, data }: { path: string; data: string }) {
    try {
      const result = await this.computerUse.action({
        action: 'write_file',
        path,
        data,
      });

      return {
        content: [{
          type: 'text',
          text: result.message || 'File written successfully',
        }],
      };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: `Error writing file: ${(err as Error).message}`,
        }],
      };
    }
  }

  /**
   * Read file and return as document content (≤60 lines)
   */
  @Tool({
    name: 'computer_read_file',
    description: 'Reads a file from the specified path and returns it as a document content block with base64 encoded data.',
    parameters: z.object({
      path: z.string().describe('The file path to read from.'),
    }),
  })
  async readFile({ path }: { path: string }) {
    try {
      const result = await this.computerUse.action({
        action: 'read_file',
        path,
      });

      if (result.success && result.data) {
        return {
          content: [{
            type: 'document',
            source: {
              type: 'base64',
              media_type: result.mediaType || 'application/octet-stream',
              data: result.data,
            },
            name: result.name || 'file',
            size: result.size,
          }],
        };
      } else {
        return {
          content: [{
            type: 'text',
            text: result.message || 'Error reading file',
          }],
        };
      }
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: `Error reading file: ${(err as Error).message}`,
        }],
      };
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
// run_id: agent104-file-tool-handler
// inputs: ["computer-use.tools.ts analysis"]
// tools_used: ["Write"]
// versions: {"model":"sonnet-4","prompt":"service-fsm-elimination"}
// === END FOOTER ===