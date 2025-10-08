/**
 * MouseToolHandler
 * Handles mouse-related computer automation tools (NASA Rule 10 compliant)
 */

import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { ComputerUseService } from '../computer-use/computer-use.service';

@Injectable()
export class MouseToolHandler {
  constructor(private readonly computerUse: ComputerUseService) {}

  /**
   * Move mouse to coordinates (≤60 lines)
   */
  @Tool({
    name: 'computer_move_mouse',
    description: 'Moves the mouse cursor to the specified coordinates.',
    parameters: z.object({
      coordinates: z.object({
        x: z.number().describe('The x-coordinate to move the mouse to.'),
        y: z.number().describe('The y-coordinate to move the mouse to.'),
      }),
    }),
  })
  async moveMouse({ coordinates }: { coordinates: { x: number; y: number } }) {
    try {
      await this.computerUse.action({ action: 'move_mouse', coordinates });
      return { content: [{ type: 'text', text: 'mouse moved' }] };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: `Error moving mouse: ${(err as Error).message}`,
        }],
      };
    }
  }

  /**
   * Click mouse at coordinates (≤60 lines)
   */
  @Tool({
    name: 'computer_click_mouse',
    description: 'Performs a mouse click at the specified coordinates or current position.',
    parameters: z.object({
      coordinates: z.object({
        x: z.number().describe('The x-coordinate to move the mouse to.'),
        y: z.number().describe('The y-coordinate to move the mouse to.'),
      }).optional(),
      button: z.enum(['left', 'right', 'middle']).describe('The mouse button to click.'),
      holdKeys: z.array(z.string()).optional(),
      clickCount: z.number().describe('Number of clicks to perform (e.g., 2 for double-click).'),
    }),
  })
  async clickMouse({
    coordinates,
    button,
    holdKeys,
    clickCount,
  }: {
    coordinates?: { x: number; y: number };
    button: 'left' | 'right' | 'middle';
    holdKeys?: string[];
    clickCount: number;
  }) {
    try {
      await this.computerUse.action({
        action: 'click_mouse',
        coordinates,
        button,
        holdKeys,
        clickCount,
      });
      return { content: [{ type: 'text', text: 'mouse clicked' }] };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: `Error clicking mouse: ${(err as Error).message}`,
        }],
      };
    }
  }

  /**
   * Drag mouse along path (≤60 lines)
   */
  @Tool({
    name: 'computer_drag_mouse',
    description: 'Drags the mouse from a starting point along a path while holding a specified button.',
    parameters: z.object({
      path: z.array(z.object({
        x: z.number().describe('The x-coordinate of a point in the drag path.'),
        y: z.number().describe('The y-coordinate of a point in the drag path.'),
      })),
      button: z.enum(['left', 'right', 'middle']).describe('The mouse button to hold while dragging.'),
      holdKeys: z.array(z.string()).optional(),
    }),
  })
  async dragMouse({
    path,
    button,
    holdKeys,
  }: {
    path: { x: number; y: number }[];
    button: 'left' | 'right' | 'middle';
    holdKeys?: string[];
  }) {
    try {
      await this.computerUse.action({
        action: 'drag_mouse',
        path,
        button,
        holdKeys,
      });
      return { content: [{ type: 'text', text: 'mouse dragged' }] };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: `Error dragging mouse: ${(err as Error).message}`,
        }],
      };
    }
  }

  /**
   * Scroll mouse wheel (≤60 lines)
   */
  @Tool({
    name: 'computer_scroll',
    description: 'Scrolls the mouse wheel up, down, left, or right.',
    parameters: z.object({
      coordinates: z.object({
        x: z.number(),
        y: z.number(),
      }).optional(),
      direction: z.enum(['up', 'down', 'left', 'right']),
      scrollCount: z.number(),
      holdKeys: z.array(z.string()).optional(),
    }),
  })
  async scroll({
    coordinates,
    direction,
    scrollCount,
    holdKeys,
  }: {
    coordinates?: { x: number; y: number };
    direction: 'up' | 'down' | 'left' | 'right';
    scrollCount: number;
    holdKeys?: string[];
  }) {
    try {
      await this.computerUse.action({
        action: 'scroll',
        coordinates,
        direction,
        scrollCount,
        holdKeys,
      });
      return { content: [{ type: 'text', text: 'scrolled' }] };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: `Error scrolling: ${(err as Error).message}`,
        }],
      };
    }
  }

  /**
   * Get cursor position (≤60 lines)
   */
  @Tool({
    name: 'computer_cursor_position',
    description: 'Gets the current (x, y) coordinates of the mouse cursor.',
  })
  async cursorPosition() {
    try {
      const pos = await this.computerUse.action({
        action: 'cursor_position',
      }) as { x: number; y: number };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(pos),
        }],
      };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: `Error getting cursor position: ${(err as Error).message}`,
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
// run_id: agent104-mouse-tool-handler
// inputs: ["computer-use.tools.ts analysis"]
// tools_used: ["Write"]
// versions: {"model":"sonnet-4","prompt":"service-fsm-elimination"}
// === END FOOTER ===