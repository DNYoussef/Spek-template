import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { BenchmarkSuite, BenchmarkResult } from './PerformanceBenchmarker';

const execAsync = promisify(exec);

export interface PlatformConfig {
  platform: NodeJS.Platform;
  arch: string;
  nodeVersion: string;
  maxMemory: number;
  maxCPU: number;
  tempDir: string;
  shellCommand: string;
  processManager: string;
}

export interface CrossPlatformMetrics {
  platform: string;
  arch: string;
  nodeVersion: string;
  systemInfo: {
    hostname: string;
    uptime: number;
    loadavg: number[];
    totalmem: number;
    freemem: number;
    cpus: os.CpuInfo[];
    networkInterfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]>;
  };
  performanceCounters?: {
    processCount: number;
    diskUsage: any;
    networkStats: any;
  };
}

export class CrossPlatformRunner {
  private platformConfig: PlatformConfig;

  constructor() {
    this.platformConfig = this.detectPlatform();
  }

  private detectPlatform(): PlatformConfig {
    const platform = os.platform();
    const arch = os.arch();
    const nodeVersion = process.version;

    const config: PlatformConfig = {
      platform,
      arch,
      nodeVersion,
      maxMemory: os.totalmem(),
      maxCPU: os.cpus().length,
      tempDir: os.tmpdir(),
      shellCommand: this.getShellCommand(platform),
      processManager: this.getProcessManager(platform)
    };

    return config;
  }

  private getShellCommand(platform: NodeJS.Platform): string {
    switch (platform) {
      case 'win32':
        return 'cmd.exe';
      case 'darwin':
      case 'linux':
        return '/bin/bash';
      default:
        return '/bin/sh';
    }
  }

  private getProcessManager(platform: NodeJS.Platform): string {
    switch (platform) {
      case 'win32':
        return 'tasklist';
      case 'darwin':
        return 'ps';
      case 'linux':
        return 'ps';
      default:
        return 'ps';
    }
  }

  async runBenchmark(suite: BenchmarkSuite): Promise<CrossPlatformMetrics> {
    console.log(`Running benchmark on ${this.platformConfig.platform} ${this.platformConfig.arch}`);

    const metrics: CrossPlatformMetrics = {
      platform: this.platformConfig.platform,
      arch: this.platformConfig.arch,
      nodeVersion: this.platformConfig.nodeVersion,
      systemInfo: {
        hostname: os.hostname(),
        uptime: os.uptime(),
        loadavg: os.loadavg(),
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        cpus: os.cpus(),
        networkInterfaces: os.networkInterfaces()
      }
    };

    // Collect platform-specific performance counters
    try {
      metrics.performanceCounters = await this.collectPlatformSpecificMetrics();
    } catch (error) {
      console.warn('Failed to collect platform-specific metrics:', error);
    }

    return metrics;
  }

  private async collectPlatformSpecificMetrics(): Promise<any> {
    const platform = this.platformConfig.platform;

    switch (platform) {
      case 'win32':
        return this.collectWindowsMetrics();
      case 'darwin':
        return this.collectMacOSMetrics();
      case 'linux':
        return this.collectLinuxMetrics();
      default:
        return this.collectGenericMetrics();
    }
  }

  private async collectWindowsMetrics(): Promise<any> {
    try {
      // Get process count
      const { stdout: processOutput } = await execAsync('tasklist /fo csv | find /c /v ""');
      const processCount = parseInt(processOutput.trim()) - 1; // Subtract header row

      // Get disk usage for C: drive
      const { stdout: diskOutput } = await execAsync('dir C:\\ /-c | find "bytes free"');
      const diskMatch = diskOutput.match(/(\d+) bytes free/);
      const diskFree = diskMatch ? parseInt(diskMatch[1]) : 0;

      // Get memory info using wmic
      const { stdout: memOutput } = await execAsync('wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /format:csv');
      const memLines = memOutput.split('\n').filter(line => line.includes(','));
      const memData = memLines[0] ? memLines[0].split(',') : [];

      return {
        processCount,
        diskUsage: {
          free: diskFree,
          platform: 'windows'
        },
        memory: {
          total: memData[2] ? parseInt(memData[2]) * 1024 : os.totalmem(),
          free: memData[1] ? parseInt(memData[1]) * 1024 : os.freemem()
        },
        networkStats: await this.getWindowsNetworkStats()
      };
    } catch (error) {
      console.warn('Windows metrics collection failed:', error);
      return this.collectGenericMetrics();
    }
  }

  private async collectMacOSMetrics(): Promise<any> {
    try {
      // Get process count
      const { stdout: processOutput } = await execAsync('ps aux | wc -l');
      const processCount = parseInt(processOutput.trim()) - 1;

      // Get disk usage
      const { stdout: diskOutput } = await execAsync('df -h / | tail -1');
      const diskParts = diskOutput.trim().split(/\s+/);
      const diskFree = diskParts[3];

      // Get memory pressure
      const { stdout: memOutput } = await execAsync('memory_pressure');

      // Get CPU info
      const { stdout: cpuOutput } = await execAsync('sysctl -n hw.ncpu hw.physicalcpu');
      const cpuInfo = cpuOutput.trim().split('\n');

      return {
        processCount,
        diskUsage: {
          free: diskFree,
          platform: 'macos'
        },
        cpu: {
          logical: parseInt(cpuInfo[0]),
          physical: parseInt(cpuInfo[1])
        },
        memoryPressure: memOutput.includes('normal') ? 'normal' : 'elevated',
        networkStats: await this.getMacOSNetworkStats()
      };
    } catch (error) {
      console.warn('macOS metrics collection failed:', error);
      return this.collectGenericMetrics();
    }
  }

  private async collectLinuxMetrics(): Promise<any> {
    try {
      // Get process count
      const { stdout: processOutput } = await execAsync('ps aux | wc -l');
      const processCount = parseInt(processOutput.trim()) - 1;

      // Get memory info from /proc/meminfo
      const { stdout: memOutput } = await execAsync('cat /proc/meminfo');
      const memInfo = this.parseLinuxMemInfo(memOutput);

      // Get disk usage
      const { stdout: diskOutput } = await execAsync('df -h / | tail -1');
      const diskParts = diskOutput.trim().split(/\s+/);

      // Get CPU info
      const { stdout: cpuOutput } = await execAsync('nproc --all');
      const cpuCount = parseInt(cpuOutput.trim());

      // Get load average
      const { stdout: loadOutput } = await execAsync('cat /proc/loadavg');
      const loadAvg = loadOutput.trim().split(' ').slice(0, 3).map(parseFloat);

      return {
        processCount,
        diskUsage: {
          total: diskParts[1],
          used: diskParts[2],
          free: diskParts[3],
          platform: 'linux'
        },
        memory: memInfo,
        cpu: {
          count: cpuCount,
          loadAverage: loadAvg
        },
        networkStats: await this.getLinuxNetworkStats()
      };
    } catch (error) {
      console.warn('Linux metrics collection failed:', error);
      return this.collectGenericMetrics();
    }
  }

  private parseLinuxMemInfo(meminfo: string): any {
    const lines = meminfo.split('\n');
    const info: any = {};

    lines.forEach(line => {
      const match = line.match(/^(\w+):\s*(\d+)\s*kB/);
      if (match) {
        info[match[1]] = parseInt(match[2]) * 1024; // Convert to bytes
      }
    });

    return {
      total: info.MemTotal || 0,
      free: info.MemFree || 0,
      available: info.MemAvailable || 0,
      buffers: info.Buffers || 0,
      cached: info.Cached || 0,
      swapTotal: info.SwapTotal || 0,
      swapFree: info.SwapFree || 0
    };
  }

  private async collectGenericMetrics(): Promise<any> {
    return {
      processCount: 0,
      diskUsage: {
        platform: 'generic'
      },
      networkStats: {}
    };
  }

  private async getWindowsNetworkStats(): Promise<any> {
    try {
      const { stdout } = await execAsync('netstat -e');
      const lines = stdout.split('\n');

      // Parse network statistics
      const stats: any = {};
      lines.forEach(line => {
        if (line.includes('Bytes')) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 3) {
            stats.bytesReceived = parseInt(parts[1]) || 0;
            stats.bytesSent = parseInt(parts[2]) || 0;
          }
        }
      });

      return stats;
    } catch (error) {
      return {};
    }
  }

  private async getMacOSNetworkStats(): Promise<any> {
    try {
      const { stdout } = await execAsync('netstat -ibn | grep -E "en[0-9]"');
      const lines = stdout.split('\n').filter(line => line.trim());

      let totalBytesIn = 0;
      let totalBytesOut = 0;

      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 7) {
          totalBytesIn += parseInt(parts[6]) || 0;
          totalBytesOut += parseInt(parts[9]) || 0;
        }
      });

      return {
        bytesReceived: totalBytesIn,
        bytesSent: totalBytesOut
      };
    } catch (error) {
      return {};
    }
  }

  private async getLinuxNetworkStats(): Promise<any> {
    try {
      const { stdout } = await execAsync('cat /proc/net/dev');
      const lines = stdout.split('\n').slice(2); // Skip header lines

      let totalBytesReceived = 0;
      let totalBytesSent = 0;

      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('lo:')) { // Skip loopback
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 9) {
            const interfaceName = parts[0].replace(':', '');
            const bytesReceived = parseInt(parts[1]) || 0;
            const bytesSent = parseInt(parts[9]) || 0;

            totalBytesReceived += bytesReceived;
            totalBytesSent += bytesSent;
          }
        }
      });

      return {
        bytesReceived: totalBytesReceived,
        bytesSent: totalBytesSent
      };
    } catch (error) {
      return {};
    }
  }

  async validatePlatformCapabilities(): Promise<boolean> {
    const capabilities = {
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch(),
      memory: os.totalmem(),
      cpus: os.cpus().length
    };

    console.log('Platform capabilities:', capabilities);

    // Check minimum requirements
    const nodeVersionNum = parseFloat(process.version.substring(1));
    if (nodeVersionNum < 14.0) {
      console.warn('Node.js version should be 14.0 or higher for optimal performance');
      return false;
    }

    if (os.totalmem() < 1024 * 1024 * 1024) { // 1GB
      console.warn('System has less than 1GB RAM, benchmarks may be unreliable');
      return false;
    }

    return true;
  }

  getPlatformConfig(): PlatformConfig {
    return { ...this.platformConfig };
  }

  async createIsolatedEnvironment(): Promise<string> {
    const isolationDir = path.join(this.platformConfig.tempDir, `benchmark-${Date.now()}`);

    try {
      fs.mkdirSync(isolationDir, { recursive: true });
      console.log(`Created isolated environment: ${isolationDir}`);
      return isolationDir;
    } catch (error) {
      console.error('Failed to create isolated environment:', error);
      throw error;
    }
  }

  async cleanupIsolatedEnvironment(envPath: string): Promise<void> {
    try {
      fs.rmSync(envPath, { recursive: true, force: true });
      console.log(`Cleaned up isolated environment: ${envPath}`);
    } catch (error) {
      console.warn('Failed to cleanup isolated environment:', error);
    }
  }

  async measureSystemOverhead(): Promise<any> {
    const measurements = [];
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();

      // Measure basic operations
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const loadAvg = os.loadavg();

      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // Convert to milliseconds

      measurements.push({
        iteration: i,
        duration,
        memUsage,
        cpuUsage,
        loadAvg
      });

      // Small delay between measurements
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    return {
      measurements,
      averageOverhead: measurements.reduce((sum, m) => sum + m.duration, 0) / measurements.length,
      platform: this.platformConfig.platform
    };
  }
}

export default CrossPlatformRunner;