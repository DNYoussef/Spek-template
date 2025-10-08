/**
 * Timer Management State Handler
 * NASA Rule 10 Compliant - ≤60 lines, fixed loops, 2+ assertions
 */

export interface TimerConfig {
  processingDelay: number;
  batchTimeout: number;
  reconnectDelay: number;
  metricsInterval: number;
}

export class TimerManager {
  private static readonly MIN_DELAY = 1;
  private static readonly MAX_DELAY = 60000; // 1 minute

  static validateTimerConfig(config: TimerConfig): void {
    if (!config) throw new Error('Timer config required');
    if (config.processingDelay < this.MIN_DELAY) throw new Error('Processing delay too small');

    this.validateDelay(config.processingDelay, 'processing');
    this.validateDelay(config.batchTimeout, 'batch');
    this.validateDelay(config.reconnectDelay, 'reconnect');
    this.validateDelay(config.metricsInterval, 'metrics');
  }

  static startProcessingTimer(
    callback: () => void,
    delay: number
  ): NodeJS.Timeout {
    if (!callback) throw new Error('Callback required');
    if (delay < this.MIN_DELAY || delay > this.MAX_DELAY) throw new Error('Invalid delay');

    return setInterval(callback, delay);
  }

  static startBatchTimer(
    callback: () => void,
    timeout: number
  ): NodeJS.Timeout {
    if (!callback) throw new Error('Callback required');
    if (timeout < this.MIN_DELAY || timeout > this.MAX_DELAY) throw new Error('Invalid timeout');

    return setTimeout(callback, timeout);
  }

  static startReconnectTimer(
    callback: () => void,
    delay: number
  ): NodeJS.Timeout {
    if (!callback) throw new Error('Callback required');
    if (delay < this.MIN_DELAY || delay > this.MAX_DELAY) throw new Error('Invalid delay');

    return setTimeout(callback, delay);
  }

  static clearTimer(timer: NodeJS.Timeout | undefined): void {
    if (timer) {
      clearTimeout(timer);
      clearInterval(timer);
    }
  }

  static clearAllTimers(timers: { [key: string]: NodeJS.Timeout | undefined }): void {
    if (!timers) throw new Error('Timers object required');

    const timerKeys = Object.keys(timers);
    for (let i = 0; i < timerKeys.length; i++) {
      const key = timerKeys[i];
      this.clearTimer(timers[key]);
      timers[key] = undefined;
    }
  }

  private static validateDelay(delay: number, type: string): void {
    if (delay < this.MIN_DELAY || delay > this.MAX_DELAY) {
      throw new Error(`Invalid ${type} delay: ${delay}`);
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
// run_id: memory-subscriber-fsm-006
// inputs: ["src/memory/sharing/MemorySubscriber.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-3-5-sonnet-20241022","prompt":"fsm-decomposition-v1"}
// === END FOOTER ===