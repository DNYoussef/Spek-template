/**
 * SandboxManager - Extracted from SandboxTestingFramework
 * Manages sandbox environment creation and lifecycle
 * Part of god object decomposition (Day 3-5)
 */

import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs-extra';

export interface SandboxConfig {
  rootPath: string;
  isolationLevel: 'full' | 'partial' | 'none';
  resourceLimits: {
    memory: number;
    cpu: number;
    timeout: number;
  };
  cleanup: boolean;
}

export interface SandboxEnvironment {
  id: string;
  path: string;
  config: SandboxConfig;
  status: 'created' | 'active' | 'destroyed';
  createdAt: Date;
  processes: Set<number>;
}

export class SandboxManager extends EventEmitter {
  /**
   * Manages sandbox environment lifecycle.
   *
   * Extracted from SandboxTestingFramework (1,213 LOC -> ~250 LOC component).
   * Handles:
   * - Environment creation and destruction
   * - Resource isolation
   * - Process management
   * - Cleanup operations
   * - Environment snapshots
   */

  private sandboxes: Map<string, SandboxEnvironment>;
  private defaultConfig: SandboxConfig;
  private activeSandboxCount: number = 0;
  private maxConcurrentSandboxes: number = 10;

  constructor(defaultConfig?: Partial<SandboxConfig>) {
    super();

    this.sandboxes = new Map();
    this.defaultConfig = {
      rootPath: process.env.SANDBOX_ROOT || '/tmp/sandboxes',
      isolationLevel: 'partial',
      resourceLimits: {
        memory: 512 * 1024 * 1024, // 512MB
        cpu: 0.5,
        timeout: 30000 // 30 seconds
      },
      cleanup: true,
      ...defaultConfig
    };

    this.setupCleanupHandlers();
  }

  private setupCleanupHandlers(): void {
    // Cleanup on process exit
    process.on('exit', () => this.cleanupAll());
    process.on('SIGINT', () => this.cleanupAll());
    process.on('SIGTERM', () => this.cleanupAll());
  }

  async createSandbox(config?: Partial<SandboxConfig>): Promise<SandboxEnvironment> {
    if (this.activeSandboxCount >= this.maxConcurrentSandboxes) {
      throw new Error(`Maximum concurrent sandboxes (${this.maxConcurrentSandboxes}) reached`);
    }

    const sandboxId = this.generateSandboxId();
    const mergedConfig = { ...this.defaultConfig, ...config };
    const sandboxPath = path.join(mergedConfig.rootPath, sandboxId);

    // Create sandbox directory
    await fs.ensureDir(sandboxPath);

    // Create sandbox environment
    const sandbox: SandboxEnvironment = {
      id: sandboxId,
      path: sandboxPath,
      config: mergedConfig,
      status: 'created',
      createdAt: new Date(),
      processes: new Set()
    };

    // Apply isolation based on level
    await this.applyIsolation(sandbox);

    // Store sandbox
    this.sandboxes.set(sandboxId, sandbox);
    this.activeSandboxCount++;
    sandbox.status = 'active';

    this.emit('sandboxCreated', sandbox);
    return sandbox;
  }

  private generateSandboxId(): string {
    return `sandbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async applyIsolation(sandbox: SandboxEnvironment): Promise<void> {
    const { isolationLevel, resourceLimits } = sandbox.config;

    switch (isolationLevel) {
      case 'full':
        await this.applyFullIsolation(sandbox);
        break;
      case 'partial':
        await this.applyPartialIsolation(sandbox);
        break;
      case 'none':
        // No isolation needed
        break;
    }

    // Apply resource limits
    if (resourceLimits) {
      await this.applyResourceLimits(sandbox, resourceLimits);
    }
  }

  private async applyFullIsolation(sandbox: SandboxEnvironment): Promise<void> {
    // Create isolated filesystem
    await fs.ensureDir(path.join(sandbox.path, 'root'));
    await fs.ensureDir(path.join(sandbox.path, 'tmp'));
    await fs.ensureDir(path.join(sandbox.path, 'home'));

    // Create sandbox-specific node_modules
    await fs.ensureDir(path.join(sandbox.path, 'node_modules'));

    // Copy essential binaries if needed
    const essentialDirs = ['bin', 'lib'];
    for (const dir of essentialDirs) {
      await fs.ensureDir(path.join(sandbox.path, dir));
    }
  }

  private async applyPartialIsolation(sandbox: SandboxEnvironment): Promise<void> {
    // Create working directories
    await fs.ensureDir(path.join(sandbox.path, 'work'));
    await fs.ensureDir(path.join(sandbox.path, 'temp'));

    // Create local node_modules symlink
    const globalModules = path.join(process.cwd(), 'node_modules');
    const sandboxModules = path.join(sandbox.path, 'node_modules');

    if (await fs.pathExists(globalModules)) {
      await fs.ensureSymlink(globalModules, sandboxModules, 'dir');
    }
  }

  private async applyResourceLimits(
    sandbox: SandboxEnvironment,
    limits: SandboxConfig['resourceLimits']
  ): Promise<void> {
    // Store limits for enforcement during process execution
    // Actual enforcement happens in TestRunner component
    sandbox.config.resourceLimits = limits;
  }

  async destroySandbox(sandboxId: string): Promise<void> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      throw new Error(`Sandbox ${sandboxId} not found`);
    }

    // Kill all processes in sandbox
    await this.killSandboxProcesses(sandbox);

    // Cleanup if configured
    if (sandbox.config.cleanup) {
      await this.cleanupSandbox(sandbox);
    }

    // Update state
    sandbox.status = 'destroyed';
    this.sandboxes.delete(sandboxId);
    this.activeSandboxCount--;

    this.emit('sandboxDestroyed', sandbox);
  }

  private async killSandboxProcesses(sandbox: SandboxEnvironment): Promise<void> {
    for (const pid of sandbox.processes) {
      try {
        process.kill(pid, 'SIGTERM');
      } catch (error) {
        // Process may already be dead
      }
    }
    sandbox.processes.clear();
  }

  private async cleanupSandbox(sandbox: SandboxEnvironment): Promise<void> {
    try {
      await fs.remove(sandbox.path);
    } catch (error) {
      console.error(`Failed to cleanup sandbox ${sandbox.id}:`, error);
    }
  }

  async snapshotSandbox(sandboxId: string): Promise<string> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      throw new Error(`Sandbox ${sandboxId} not found`);
    }

    const snapshotId = `snapshot-${Date.now()}`;
    const snapshotPath = path.join(sandbox.config.rootPath, 'snapshots', snapshotId);

    // Create snapshot directory
    await fs.ensureDir(path.dirname(snapshotPath));

    // Copy sandbox contents
    await fs.copy(sandbox.path, snapshotPath);

    this.emit('snapshotCreated', { sandboxId, snapshotId });
    return snapshotId;
  }

  async restoreSnapshot(snapshotId: string): Promise<SandboxEnvironment> {
    const snapshotPath = path.join(this.defaultConfig.rootPath, 'snapshots', snapshotId);

    if (!await fs.pathExists(snapshotPath)) {
      throw new Error(`Snapshot ${snapshotId} not found`);
    }

    // Create new sandbox from snapshot
    const sandbox = await this.createSandbox();

    // Copy snapshot contents
    await fs.copy(snapshotPath, sandbox.path);

    this.emit('snapshotRestored', { snapshotId, sandboxId: sandbox.id });
    return sandbox;
  }

  registerProcess(sandboxId: string, pid: number): void {
    const sandbox = this.sandboxes.get(sandboxId);
    if (sandbox) {
      sandbox.processes.add(pid);
    }
  }

  unregisterProcess(sandboxId: string, pid: number): void {
    const sandbox = this.sandboxes.get(sandboxId);
    if (sandbox) {
      sandbox.processes.delete(pid);
    }
  }

  getSandbox(sandboxId: string): SandboxEnvironment | undefined {
    return this.sandboxes.get(sandboxId);
  }

  getActiveSandboxes(): SandboxEnvironment[] {
    return Array.from(this.sandboxes.values()).filter(s => s.status === 'active');
  }

  private async cleanupAll(): Promise<void> {
    const sandboxIds = Array.from(this.sandboxes.keys());
    for (const id of sandboxIds) {
      try {
        await this.destroySandbox(id);
      } catch (error) {
        // Best effort cleanup
      }
    }
  }

  getMetrics(): any {
    return {
      totalSandboxes: this.sandboxes.size,
      activeSandboxes: this.activeSandboxCount,
      maxConcurrent: this.maxConcurrentSandboxes,
      sandboxes: Array.from(this.sandboxes.values()).map(s => ({
        id: s.id,
        status: s.status,
        processes: s.processes.size,
        age: Date.now() - s.createdAt.getTime()
      }))
    };
  }
}