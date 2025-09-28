/**
 * Profiling State Handler - Manages active CPU profiling
 * NASA Rule 10 compliant with focused responsibilities
 */

import { CPUProfilerContext, CPUSample } from '../types/CPUProfilerTypes';
import { SampleCollector } from '../core/SampleCollector';
import { V8ProfilerManager } from '../core/V8ProfilerManager';

export class ProfilingStateHandler {
  private sampleCollector: SampleCollector;
  private v8Manager: V8ProfilerManager;

  constructor() {
    this.sampleCollector = new SampleCollector();
    this.v8Manager = new V8ProfilerManager();
  }

  /**
   * Enter profiling state (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  async enter(context: CPUProfilerContext, data: { intervalMs: number }): Promise<void> {
    // Assertion 1: Context is valid
    if (!context || typeof context !== 'object') {
      throw new Error('Invalid context provided to profiling state');
    }
    // Assertion 2: Interval is valid
    if (!data?.intervalMs || data.intervalMs <= 0) {
      throw new Error('Invalid sampling interval provided');
    }

    if (context.isProfileActive) {
      throw new Error('CPU profiling already active');
    }

    console.log('Starting CPU profiling...');

    // Initialize profiling context
    context.isProfileActive = true;
    context.startTime = Date.now();
    context.samples = [];
    context.baselineCPU = process.cpuUsage();

    // Start V8 profiler
    await this.v8Manager.start();

    // Start sampling
    context.sampleInterval = setInterval(() => {
      if (context.isProfileActive) {
        const sample = this.sampleCollector.takeSample(context);
        context.samples.push(sample);
      }
    }, data.intervalMs);

    console.log(`CPU profiling started with ${data.intervalMs}ms interval`);
  }

  /**
   * Exit profiling state (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  async exit(context: CPUProfilerContext): Promise<void> {
    // Assertion 1: Context is valid
    if (!context || typeof context !== 'object') {
      throw new Error('Invalid context provided to profiling exit');
    }
    // Assertion 2: Profiling is active
    if (!context.isProfileActive) {
      throw new Error('Profiling not active during exit');
    }

    console.log('Stopping CPU profiling...');

    context.isProfileActive = false;

    // Stop sampling
    if (context.sampleInterval) {
      clearInterval(context.sampleInterval);
      context.sampleInterval = null;
    }

    // Take final sample
    const finalSample = this.sampleCollector.takeSample(context);
    context.samples.push(finalSample);

    // Stop V8 profiler and get profile path
    context.v8ProfilePath = await this.v8Manager.stop(context.outputDir);

    console.log(`CPU profiling stopped. Collected ${context.samples.length} samples`);
  }

  /**
   * Get profiling status (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  getStatus(context: CPUProfilerContext): {
    isActive: boolean;
    samplesCollected: number;
    duration: number;
    currentCPU: NodeJS.CpuUsage | null;
  } {
    // Assertion 1: Context is valid
    if (!context || typeof context !== 'object') {
      throw new Error('Invalid context provided to status check');
    }
    // Assertion 2: Samples array exists
    if (!Array.isArray(context.samples)) {
      throw new Error('Invalid samples array in context');
    }

    const currentCPU = context.isProfileActive ? process.cpuUsage(context.baselineCPU) : null;
    const duration = context.startTime ? Date.now() - context.startTime : 0;

    return {
      isActive: context.isProfileActive,
      samplesCollected: context.samples.length,
      duration,
      currentCPU
    };
  }
}