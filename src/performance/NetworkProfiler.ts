import { EventEmitter } from 'events';
import * as net from 'net';
import * as http from 'http';
import * as https from 'https';
import * as dns from 'dns';
import { performance } from 'perf_hooks';

export interface NetworkProfile {
  startTime: number;
  endTime: number;
  duration: number;
  metrics: NetworkMetrics;
  connections: ConnectionInfo[];
  requests: RequestInfo[];
  dnsLookups: DNSLookupInfo[];
  analysis: NetworkAnalysis;
  bandwidth: BandwidthMetrics;
  latency: LatencyMetrics;
}

export interface NetworkMetrics {
  totalConnections: number;
  activeConnections: number;
  failedConnections: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  bytesReceived: number;
  bytesSent: number;
  averageLatency: number;
  peakLatency: number;
  dnsLookups: number;
  dnsFailures: number;
}

export interface ConnectionInfo {
  id: string;
  timestamp: number;
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  remotePort: number;
  protocol: 'tcp' | 'udp' | 'http' | 'https';
  state: 'connecting' | 'connected' | 'closed' | 'error';
  duration: number;
  bytesReceived: number;
  bytesSent: number;
  error?: string;
}

export interface RequestInfo {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  protocol: 'http' | 'https';
  statusCode?: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  headers: { [key: string]: string };
  error?: string;
  connectionReused: boolean;
  dnsLookupTime: number;
  connectionTime: number;
  tlsHandshakeTime: number;
  firstByteTime: number;
  downloadTime: number;
}

export interface DNSLookupInfo {
  id: string;
  timestamp: number;
  hostname: string;
  addresses: string[];
  duration: number;
  error?: string;
  cached: boolean;
}

export interface NetworkAnalysis {
  performanceBottlenecks: NetworkBottleneck[];
  connectionPatterns: ConnectionPattern[];
  bandwidthUtilization: number; // 0-1
  latencyDistribution: LatencyDistribution;
  errorAnalysis: ErrorAnalysis;
  optimizationSuggestions: NetworkOptimization[];
  securityConcerns: SecurityConcern[];
}

export interface NetworkBottleneck {
  type: 'dns' | 'connection' | 'bandwidth' | 'latency' | 'timeout';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: number; // 0-1
  frequency: number;
  examples: any[];
  recommendation: string;
}

export interface ConnectionPattern {
  pattern: 'connection-pooling' | 'connection-churning' | 'keep-alive' | 'concurrent';
  frequency: number;
  efficiency: number; // 0-1
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface LatencyDistribution {
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  mean: number;
  stddev: number;
  min: number;
  max: number;
}

export interface ErrorAnalysis {
  totalErrors: number;
  errorTypes: { [type: string]: number };
  errorRate: number; // 0-1
  timeouts: number;
  connectionRefused: number;
  dnsFailures: number;
  sslErrors: number;
}

export interface NetworkOptimization {
  type: 'connection-pooling' | 'caching' | 'compression' | 'cdn' | 'dns' | 'keep-alive';
  priority: 'low' | 'medium' | 'high';
  description: string;
  expectedImprovement: string;
  effort: 'low' | 'medium' | 'high';
  implementation: string;
}

export interface SecurityConcern {
  type: 'unencrypted' | 'weak-tls' | 'certificate' | 'dns-security' | 'data-exposure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedConnections: string[];
  recommendation: string;
}

export interface BandwidthMetrics {
  uploadThroughput: number; // bytes per second
  downloadThroughput: number; // bytes per second
  peakUpload: number;
  peakDownload: number;
  utilization: number; // 0-1
  efficiency: number; // 0-1
}

export interface LatencyMetrics {
  dns: LatencyDistribution;
  connection: LatencyDistribution;
  tls: LatencyDistribution;
  firstByte: LatencyDistribution;
  download: LatencyDistribution;
  total: LatencyDistribution;
}

export class NetworkProfiler extends EventEmitter {
  private isProfileActive = false;
  private startTime = 0;
  private connections: Map<string, ConnectionInfo> = new Map();
  private requests: Map<string, RequestInfo> = new Map();
  private dnsLookups: DNSLookupInfo[] = [];
  private originalHttp: any = {};
  private originalHttps: any = {};
  private originalDNS: any = {};
  private originalNet: any = {};
  private connectionCounter = 0;
  private requestCounter = 0;
  private dnsCounter = 0;

  constructor() {
    super();
  }

  async startProfiling(): Promise<void> {
    if (this.isProfileActive) {
      throw new Error('Network profiling already active');
    }

    console.log('Starting network profiling...');
    this.isProfileActive = true;
    this.startTime = Date.now();
    this.connections.clear();
    this.requests.clear();
    this.dnsLookups = [];

    // Monkey patch network modules
    this.patchHTTP();
    this.patchHTTPS();
    this.patchDNS();
    this.patchNet();

    this.emit('profiling-started', { startTime: this.startTime });
  }

  async stopProfiling(): Promise<NetworkProfile> {
    if (!this.isProfileActive) {
      throw new Error('Network profiling not active');
    }

    console.log('Stopping network profiling...');
    this.isProfileActive = false;

    // Restore original modules
    this.restorePatches();

    const endTime = Date.now();
    const duration = endTime - this.startTime;

    // Analyze collected data
    const metrics = this.calculateMetrics();
    const analysis = this.analyzeNetworkData();
    const bandwidth = this.calculateBandwidthMetrics();
    const latency = this.calculateLatencyMetrics();

    const profile: NetworkProfile = {
      startTime: this.startTime,
      endTime,
      duration,
      metrics,
      connections: Array.from(this.connections.values()),
      requests: Array.from(this.requests.values()),
      dnsLookups: [...this.dnsLookups],
      analysis,
      bandwidth,
      latency
    };

    this.emit('profiling-stopped', profile);
    return profile;
  }

  private patchHTTP(): void {
    const originalRequest = http.request;
    const originalGet = http.get;

    this.originalHttp = { request: originalRequest, get: originalGet };

    http.request = (options: any, callback?: any) => {
      const requestId = `req_${++this.requestCounter}`;
      const startTime = performance.now();

      // Create request info
      const requestInfo: RequestInfo = {
        id: requestId,
        timestamp: Date.now(),
        method: options.method || 'GET',
        url: this.buildURL(options),
        protocol: 'http',
        responseTime: 0,
        requestSize: 0,
        responseSize: 0,
        headers: options.headers || {},
        connectionReused: false,
        dnsLookupTime: 0,
        connectionTime: 0,
        tlsHandshakeTime: 0,
        firstByteTime: 0,
        downloadTime: 0
      };

      this.requests.set(requestId, requestInfo);

      // Create wrapped request
      const req = originalRequest.call(http, options, (res: any) => {
        const firstByteTime = performance.now();
        requestInfo.firstByteTime = firstByteTime - startTime;
        requestInfo.statusCode = res.statusCode;

        // Track response data
        let responseSize = 0;
        const originalData = res.on;

        res.on = function(event: string, listener: any) {
          if (event === 'data') {
            const originalListener = listener;
            listener = (chunk: any) => {
              responseSize += chunk.length;
              return originalListener(chunk);
            };
          }
          return originalData.call(this, event, listener);
        };

        res.on('end', () => {
          const endTime = performance.now();
          requestInfo.responseTime = endTime - startTime;
          requestInfo.responseSize = responseSize;
          requestInfo.downloadTime = endTime - firstByteTime;

          this.emit('request-complete', requestInfo);
        });

        if (callback) callback(res);
      });

      // Track request data
      const originalWrite = req.write;
      const originalEnd = req.end;

      req.write = function(chunk: any) {
        if (chunk) {
          requestInfo.requestSize += chunk.length;
        }
        return originalWrite.call(this, chunk);
      };

      req.end = function(chunk?: any) {
        if (chunk) {
          requestInfo.requestSize += chunk.length;
        }
        return originalEnd.call(this, chunk);
      };

      // Handle errors
      req.on('error', (error: Error) => {
        requestInfo.error = error.message;
        requestInfo.responseTime = performance.now() - startTime;
        this.emit('request-error', { requestInfo, error });
      });

      // Handle socket events for connection tracking
      req.on('socket', (socket: any) => {
        const connectionId = `conn_${++this.connectionCounter}`;

        const connectionInfo: ConnectionInfo = {
          id: connectionId,
          timestamp: Date.now(),
          localAddress: socket.localAddress || '',
          localPort: socket.localPort || 0,
          remoteAddress: socket.remoteAddress || options.hostname || options.host || '',
          remotePort: socket.remotePort || options.port || 80,
          protocol: 'http',
          state: 'connecting',
          duration: 0,
          bytesReceived: 0,
          bytesSent: 0
        };

        this.connections.set(connectionId, connectionInfo);
        requestInfo.connectionReused = socket._httpMessage !== req;

        socket.on('connect', () => {
          connectionInfo.state = 'connected';
          connectionInfo.duration = Date.now() - connectionInfo.timestamp;
          requestInfo.connectionTime = performance.now() - startTime;
          this.emit('connection-established', connectionInfo);
        });

        socket.on('close', () => {
          connectionInfo.state = 'closed';
          this.emit('connection-closed', connectionInfo);
        });

        socket.on('error', (error: Error) => {
          connectionInfo.state = 'error';
          connectionInfo.error = error.message;
          this.emit('connection-error', { connectionInfo, error });
        });
      });

      return req;
    };

    http.get = (options: any, callback?: any) => {
      return http.request(options, callback).end();
    };
  }

  private patchHTTPS(): void {
    const originalRequest = https.request;
    const originalGet = https.get;

    this.originalHttps = { request: originalRequest, get: originalGet };

    https.request = (options: any, callback?: any) => {
      const requestId = `req_${++this.requestCounter}`;
      const startTime = performance.now();

      // Create request info for HTTPS
      const requestInfo: RequestInfo = {
        id: requestId,
        timestamp: Date.now(),
        method: options.method || 'GET',
        url: this.buildURL(options, true),
        protocol: 'https',
        responseTime: 0,
        requestSize: 0,
        responseSize: 0,
        headers: options.headers || {},
        connectionReused: false,
        dnsLookupTime: 0,
        connectionTime: 0,
        tlsHandshakeTime: 0,
        firstByteTime: 0,
        downloadTime: 0
      };

      this.requests.set(requestId, requestInfo);

      // Create wrapped request
      const req = originalRequest.call(https, options, (res: any) => {
        const firstByteTime = performance.now();
        requestInfo.firstByteTime = firstByteTime - startTime;
        requestInfo.statusCode = res.statusCode;

        // Track response data
        let responseSize = 0;
        const originalData = res.on;

        res.on = function(event: string, listener: any) {
          if (event === 'data') {
            const originalListener = listener;
            listener = (chunk: any) => {
              responseSize += chunk.length;
              return originalListener(chunk);
            };
          }
          return originalData.call(this, event, listener);
        };

        res.on('end', () => {
          const endTime = performance.now();
          requestInfo.responseTime = endTime - startTime;
          requestInfo.responseSize = responseSize;
          requestInfo.downloadTime = endTime - firstByteTime;

          this.emit('request-complete', requestInfo);
        });

        if (callback) callback(res);
      });

      // Track request data
      const originalWrite = req.write;
      const originalEnd = req.end;

      req.write = function(chunk: any) {
        if (chunk) {
          requestInfo.requestSize += chunk.length;
        }
        return originalWrite.call(this, chunk);
      };

      req.end = function(chunk?: any) {
        if (chunk) {
          requestInfo.requestSize += chunk.length;
        }
        return originalEnd.call(this, chunk);
      };

      // Handle errors
      req.on('error', (error: Error) => {
        requestInfo.error = error.message;
        requestInfo.responseTime = performance.now() - startTime;
        this.emit('request-error', { requestInfo, error });
      });

      // Handle socket events for HTTPS connection tracking
      req.on('socket', (socket: any) => {
        const connectionId = `conn_${++this.connectionCounter}`;

        const connectionInfo: ConnectionInfo = {
          id: connectionId,
          timestamp: Date.now(),
          localAddress: socket.localAddress || '',
          localPort: socket.localPort || 0,
          remoteAddress: socket.remoteAddress || options.hostname || options.host || '',
          remotePort: socket.remotePort || options.port || 443,
          protocol: 'https',
          state: 'connecting',
          duration: 0,
          bytesReceived: 0,
          bytesSent: 0
        };

        this.connections.set(connectionId, connectionInfo);
        requestInfo.connectionReused = socket._httpMessage !== req;

        socket.on('connect', () => {
          connectionInfo.state = 'connected';
          connectionInfo.duration = Date.now() - connectionInfo.timestamp;
          requestInfo.connectionTime = performance.now() - startTime;
        });

        socket.on('secureConnect', () => {
          requestInfo.tlsHandshakeTime = performance.now() - startTime - requestInfo.connectionTime;
          this.emit('connection-established', connectionInfo);
        });

        socket.on('close', () => {
          connectionInfo.state = 'closed';
          this.emit('connection-closed', connectionInfo);
        });

        socket.on('error', (error: Error) => {
          connectionInfo.state = 'error';
          connectionInfo.error = error.message;
          this.emit('connection-error', { connectionInfo, error });
        });
      });

      return req;
    };

    https.get = (options: any, callback?: any) => {
      return https.request(options, callback).end();
    };
  }

  private patchDNS(): void {
    const originalLookup = dns.lookup;
    const originalResolve = dns.resolve;

    this.originalDNS = { lookup: originalLookup, resolve: originalResolve };

    dns.lookup = (hostname: string, options: any, callback?: any) => {
      const lookupId = `dns_${++this.dnsCounter}`;
      const startTime = performance.now();

      // Handle different callback signatures
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }

      const lookupInfo: DNSLookupInfo = {
        id: lookupId,
        timestamp: Date.now(),
        hostname,
        addresses: [],
        duration: 0,
        cached: false
      };

      const wrappedCallback = (err: any, address: any, family?: any) => {
        const endTime = performance.now();
        lookupInfo.duration = endTime - startTime;

        if (err) {
          lookupInfo.error = err.message;
        } else {
          lookupInfo.addresses = Array.isArray(address) ? address : [address];
          // Check if lookup was likely cached (very fast response)
          lookupInfo.cached = lookupInfo.duration < 1;
        }

        this.dnsLookups.push(lookupInfo);
        this.emit('dns-lookup', lookupInfo);

        if (callback) callback(err, address, family);
      };

      return originalLookup.call(dns, hostname, options, wrappedCallback);
    };

    dns.resolve = (hostname: string, rrtype?: any, callback?: any) => {
      const lookupId = `dns_${++this.dnsCounter}`;
      const startTime = performance.now();

      if (typeof rrtype === 'function') {
        callback = rrtype;
        rrtype = 'A';
      }

      const lookupInfo: DNSLookupInfo = {
        id: lookupId,
        timestamp: Date.now(),
        hostname,
        addresses: [],
        duration: 0,
        cached: false
      };

      const wrappedCallback = (err: any, addresses: any) => {
        const endTime = performance.now();
        lookupInfo.duration = endTime - startTime;

        if (err) {
          lookupInfo.error = err.message;
        } else {
          lookupInfo.addresses = Array.isArray(addresses) ? addresses : [addresses];
          lookupInfo.cached = lookupInfo.duration < 1;
        }

        this.dnsLookups.push(lookupInfo);
        this.emit('dns-lookup', lookupInfo);

        if (callback) callback(err, addresses);
      };

      return originalResolve.call(dns, hostname, rrtype, wrappedCallback);
    };
  }

  private patchNet(): void {
    const originalCreateConnection = net.createConnection;

    this.originalNet = { createConnection: originalCreateConnection };

    net.createConnection = (options: any, callback?: any) => {
      const connectionId = `conn_${++this.connectionCounter}`;

      const connectionInfo: ConnectionInfo = {
        id: connectionId,
        timestamp: Date.now(),
        localAddress: '',
        localPort: 0,
        remoteAddress: options.host || options.hostname || '',
        remotePort: options.port || 0,
        protocol: 'tcp',
        state: 'connecting',
        duration: 0,
        bytesReceived: 0,
        bytesSent: 0
      };

      this.connections.set(connectionId, connectionInfo);

      const socket = originalCreateConnection.call(net, options, callback);

      socket.on('connect', () => {
        connectionInfo.state = 'connected';
        connectionInfo.localAddress = socket.localAddress;
        connectionInfo.localPort = socket.localPort;
        connectionInfo.remoteAddress = socket.remoteAddress;
        connectionInfo.remotePort = socket.remotePort;
        connectionInfo.duration = Date.now() - connectionInfo.timestamp;
        this.emit('connection-established', connectionInfo);
      });

      socket.on('data', (data: Buffer) => {
        connectionInfo.bytesReceived += data.length;
      });

      socket.on('close', () => {
        connectionInfo.state = 'closed';
        this.emit('connection-closed', connectionInfo);
      });

      socket.on('error', (error: Error) => {
        connectionInfo.state = 'error';
        connectionInfo.error = error.message;
        this.emit('connection-error', { connectionInfo, error });
      });

      // Track outgoing data
      const originalWrite = socket.write;
      socket.write = function(data: any) {
        if (data) {
          connectionInfo.bytesSent += Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);
        }
        return originalWrite.call(this, data);
      };

      return socket;
    };
  }

  private buildURL(options: any, isHttps: boolean = false): string {
    const protocol = isHttps ? 'https:' : 'http:';
    const hostname = options.hostname || options.host || 'localhost';
    const port = options.port || (isHttps ? 443 : 80);
    const path = options.path || '/';

    const defaultPort = isHttps ? 443 : 80;
    const portStr = port === defaultPort ? '' : `:${port}`;

    return `${protocol}//${hostname}${portStr}${path}`;
  }

  private restorePatches(): void {
    // Restore HTTP
    if (this.originalHttp.request) {
      http.request = this.originalHttp.request;
    }
    if (this.originalHttp.get) {
      http.get = this.originalHttp.get;
    }

    // Restore HTTPS
    if (this.originalHttps.request) {
      https.request = this.originalHttps.request;
    }
    if (this.originalHttps.get) {
      https.get = this.originalHttps.get;
    }

    // Restore DNS
    if (this.originalDNS.lookup) {
      dns.lookup = this.originalDNS.lookup;
    }
    if (this.originalDNS.resolve) {
      dns.resolve = this.originalDNS.resolve;
    }

    // Restore Net
    if (this.originalNet.createConnection) {
      net.createConnection = this.originalNet.createConnection;
    }
  }

  private calculateMetrics(): NetworkMetrics {
    const connections = Array.from(this.connections.values());
    const requests = Array.from(this.requests.values());

    const totalConnections = connections.length;
    const activeConnections = connections.filter(c => c.state === 'connected').length;
    const failedConnections = connections.filter(c => c.state === 'error').length;

    const totalRequests = requests.length;
    const successfulRequests = requests.filter(r => !r.error && r.statusCode && r.statusCode < 400).length;
    const failedRequests = totalRequests - successfulRequests;

    const bytesReceived = connections.reduce((sum, c) => sum + c.bytesReceived, 0) +
                         requests.reduce((sum, r) => sum + r.responseSize, 0);
    const bytesSent = connections.reduce((sum, c) => sum + c.bytesSent, 0) +
                     requests.reduce((sum, r) => sum + r.requestSize, 0);

    const latencies = requests.filter(r => r.responseTime > 0).map(r => r.responseTime);
    const averageLatency = latencies.length > 0 ? latencies.reduce((sum, l) => sum + l, 0) / latencies.length : 0;
    const peakLatency = latencies.length > 0 ? Math.max(...latencies) : 0;

    const dnsLookups = this.dnsLookups.length;
    const dnsFailures = this.dnsLookups.filter(d => d.error).length;

    return {
      totalConnections,
      activeConnections,
      failedConnections,
      totalRequests,
      successfulRequests,
      failedRequests,
      bytesReceived,
      bytesSent,
      averageLatency,
      peakLatency,
      dnsLookups,
      dnsFailures
    };
  }

  private analyzeNetworkData(): NetworkAnalysis {
    const bottlenecks = this.identifyBottlenecks();
    const patterns = this.analyzeConnectionPatterns();
    const bandwidthUtilization = this.calculateBandwidthUtilization();
    const latencyDistribution = this.calculateLatencyDistribution();
    const errorAnalysis = this.analyzeErrors();
    const optimizations = this.generateOptimizations();
    const securityConcerns = this.analyzeSecurityConcerns();

    return {
      performanceBottlenecks: bottlenecks,
      connectionPatterns: patterns,
      bandwidthUtilization,
      latencyDistribution,
      errorAnalysis,
      optimizationSuggestions: optimizations,
      securityConcerns
    };
  }

  private identifyBottlenecks(): NetworkBottleneck[] {
    const bottlenecks: NetworkBottleneck[] = [];
    const requests = Array.from(this.requests.values());

    // DNS bottleneck
    const dnsLookups = this.dnsLookups.filter(d => !d.cached && d.duration > 100);
    if (dnsLookups.length > 0) {
      const avgDNSTime = dnsLookups.reduce((sum, d) => sum + d.duration, 0) / dnsLookups.length;
      bottlenecks.push({
        type: 'dns',
        severity: avgDNSTime > 500 ? 'high' : 'medium',
        description: `Slow DNS lookups detected: average ${avgDNSTime.toFixed(1)}ms`,
        impact: Math.min(1, avgDNSTime / 1000),
        frequency: dnsLookups.length,
        examples: dnsLookups.slice(0, 3),
        recommendation: 'Consider DNS caching or using faster DNS servers'
      });
    }

    // High latency bottleneck
    const highLatencyRequests = requests.filter(r => r.responseTime > 2000);
    if (highLatencyRequests.length > 0) {
      const avgLatency = highLatencyRequests.reduce((sum, r) => sum + r.responseTime, 0) / highLatencyRequests.length;
      bottlenecks.push({
        type: 'latency',
        severity: avgLatency > 5000 ? 'critical' : 'high',
        description: `High latency requests: average ${avgLatency.toFixed(0)}ms`,
        impact: Math.min(1, avgLatency / 10000),
        frequency: highLatencyRequests.length,
        examples: highLatencyRequests.slice(0, 3),
        recommendation: 'Optimize server response times or implement caching'
      });
    }

    return bottlenecks;
  }

  private analyzeConnectionPatterns(): ConnectionPattern[] {
    const patterns: ConnectionPattern[] = [];
    const connections = Array.from(this.connections.values());
    const requests = Array.from(this.requests.values());

    // Connection reuse pattern
    const reusedConnections = requests.filter(r => r.connectionReused).length;
    const reuseRate = requests.length > 0 ? reusedConnections / requests.length : 0;

    patterns.push({
      pattern: 'keep-alive',
      frequency: reuseRate,
      efficiency: reuseRate,
      description: `Connection reuse rate: ${(reuseRate * 100).toFixed(1)}%`,
      impact: reuseRate > 0.7 ? 'positive' : 'negative'
    });

    // Concurrent connections
    const maxConcurrent = this.calculateMaxConcurrentConnections();
    patterns.push({
      pattern: 'concurrent',
      frequency: maxConcurrent,
      efficiency: Math.min(1, maxConcurrent / 6), // HTTP/1.1 typical limit
      description: `Peak concurrent connections: ${maxConcurrent}`,
      impact: maxConcurrent > 10 ? 'negative' : 'positive'
    });

    return patterns;
  }

  private calculateMaxConcurrentConnections(): number {
    const connections = Array.from(this.connections.values());
    const timepoints = new Set<number>();

    connections.forEach(conn => {
      timepoints.add(conn.timestamp);
      timepoints.add(conn.timestamp + (conn.duration || 0));
    });

    let maxConcurrent = 0;
    Array.from(timepoints).sort().forEach(time => {
      const concurrent = connections.filter(conn =>
        conn.timestamp <= time &&
        (conn.timestamp + (conn.duration || 0)) >= time &&
        conn.state === 'connected'
      ).length;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
    });

    return maxConcurrent;
  }

  private calculateBandwidthUtilization(): number {
    const metrics = this.calculateMetrics();
    const duration = Date.now() - this.startTime;
    const totalBytes = metrics.bytesReceived + metrics.bytesSent;

    if (duration === 0) return 0;

    const throughput = totalBytes / (duration / 1000); // bytes per second
    const estimatedCapacity = 100 * 1024 * 1024; // 100 Mbps estimate

    return Math.min(1, throughput / estimatedCapacity);
  }

  private calculateLatencyDistribution(): LatencyDistribution {
    const requests = Array.from(this.requests.values());
    const latencies = requests.filter(r => r.responseTime > 0).map(r => r.responseTime).sort((a, b) => a - b);

    if (latencies.length === 0) {
      return { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0, mean: 0, stddev: 0, min: 0, max: 0 };
    }

    const mean = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
    const variance = latencies.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / latencies.length;
    const stddev = Math.sqrt(variance);

    return {
      p50: this.percentile(latencies, 50),
      p75: this.percentile(latencies, 75),
      p90: this.percentile(latencies, 90),
      p95: this.percentile(latencies, 95),
      p99: this.percentile(latencies, 99),
      mean,
      stddev,
      min: latencies[0],
      max: latencies[latencies.length - 1]
    };
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private analyzeErrors(): ErrorAnalysis {
    const requests = Array.from(this.requests.values());
    const connections = Array.from(this.connections.values());

    const requestErrors = requests.filter(r => r.error).length;
    const connectionErrors = connections.filter(c => c.error).length;
    const totalErrors = requestErrors + connectionErrors;

    const errorTypes: { [type: string]: number } = {};
    requests.forEach(r => {
      if (r.error) {
        errorTypes[r.error] = (errorTypes[r.error] || 0) + 1;
      }
    });

    const errorRate = requests.length > 0 ? requestErrors / requests.length : 0;
    const timeouts = requests.filter(r => r.error && r.error.includes('timeout')).length;
    const connectionRefused = connections.filter(c => c.error && c.error.includes('ECONNREFUSED')).length;
    const dnsFailures = this.dnsLookups.filter(d => d.error).length;
    const sslErrors = requests.filter(r => r.error && r.error.includes('SSL')).length;

    return {
      totalErrors,
      errorTypes,
      errorRate,
      timeouts,
      connectionRefused,
      dnsFailures,
      sslErrors
    };
  }

  private generateOptimizations(): NetworkOptimization[] {
    const optimizations: NetworkOptimization[] = [];
    const requests = Array.from(this.requests.values());

    // Connection pooling optimization
    const reuseRate = requests.filter(r => r.connectionReused).length / Math.max(1, requests.length);
    if (reuseRate < 0.5) {
      optimizations.push({
        type: 'connection-pooling',
        priority: 'high',
        description: 'Implement connection pooling to reuse HTTP connections',
        expectedImprovement: `${((0.7 - reuseRate) * 100).toFixed(0)}% reduction in connection overhead`,
        effort: 'medium',
        implementation: 'Configure HTTP agent with keepAlive: true and maxSockets settings'
      });
    }

    // DNS caching
    const uncachedDNS = this.dnsLookups.filter(d => !d.cached).length;
    if (uncachedDNS > 5) {
      optimizations.push({
        type: 'dns',
        priority: 'medium',
        description: 'Implement DNS caching to reduce lookup times',
        expectedImprovement: `${Math.min(50, uncachedDNS * 2)}ms average latency reduction`,
        effort: 'low',
        implementation: 'Use dns.setServers() with caching resolver or implement application-level DNS cache'
      });
    }

    return optimizations;
  }

  private analyzeSecurityConcerns(): SecurityConcern[] {
    const concerns: SecurityConcern[] = [];
    const requests = Array.from(this.requests.values());

    // Unencrypted connections
    const httpRequests = requests.filter(r => r.protocol === 'http');
    if (httpRequests.length > 0) {
      concerns.push({
        type: 'unencrypted',
        severity: 'medium',
        description: `${httpRequests.length} unencrypted HTTP requests detected`,
        affectedConnections: httpRequests.map(r => r.url),
        recommendation: 'Use HTTPS for all external communications'
      });
    }

    return concerns;
  }

  private calculateBandwidthMetrics(): BandwidthMetrics {
    const connections = Array.from(this.connections.values());
    const requests = Array.from(this.requests.values());
    const duration = (Date.now() - this.startTime) / 1000; // seconds

    const totalUpload = connections.reduce((sum, c) => sum + c.bytesSent, 0) +
                       requests.reduce((sum, r) => sum + r.requestSize, 0);
    const totalDownload = connections.reduce((sum, c) => sum + c.bytesReceived, 0) +
                         requests.reduce((sum, r) => sum + r.responseSize, 0);

    const uploadThroughput = duration > 0 ? totalUpload / duration : 0;
    const downloadThroughput = duration > 0 ? totalDownload / duration : 0;

    // Calculate peaks (simplified - would need time-windowed analysis)
    const peakUpload = uploadThroughput * 2; // Simplified peak calculation
    const peakDownload = downloadThroughput * 2;

    const estimatedCapacity = 10 * 1024 * 1024; // 10 MB/s estimated capacity
    const utilization = Math.min(1, (uploadThroughput + downloadThroughput) / estimatedCapacity);

    // Efficiency based on payload vs overhead ratio
    const totalPayload = totalUpload + totalDownload;
    const estimatedOverhead = requests.length * 500; // Estimated header overhead
    const efficiency = totalPayload > 0 ? (totalPayload - estimatedOverhead) / totalPayload : 1;

    return {
      uploadThroughput,
      downloadThroughput,
      peakUpload,
      peakDownload,
      utilization,
      efficiency: Math.max(0, efficiency)
    };
  }

  private calculateLatencyMetrics(): LatencyMetrics {
    const requests = Array.from(this.requests.values());

    const dnsLatencies = requests.filter(r => r.dnsLookupTime > 0).map(r => r.dnsLookupTime);
    const connectionLatencies = requests.filter(r => r.connectionTime > 0).map(r => r.connectionTime);
    const tlsLatencies = requests.filter(r => r.tlsHandshakeTime > 0).map(r => r.tlsHandshakeTime);
    const firstByteLatencies = requests.filter(r => r.firstByteTime > 0).map(r => r.firstByteTime);
    const downloadLatencies = requests.filter(r => r.downloadTime > 0).map(r => r.downloadTime);
    const totalLatencies = requests.filter(r => r.responseTime > 0).map(r => r.responseTime);

    return {
      dns: this.calculateLatencyDistributionFromArray(dnsLatencies),
      connection: this.calculateLatencyDistributionFromArray(connectionLatencies),
      tls: this.calculateLatencyDistributionFromArray(tlsLatencies),
      firstByte: this.calculateLatencyDistributionFromArray(firstByteLatencies),
      download: this.calculateLatencyDistributionFromArray(downloadLatencies),
      total: this.calculateLatencyDistributionFromArray(totalLatencies)
    };
  }

  private calculateLatencyDistributionFromArray(latencies: number[]): LatencyDistribution {
    const sorted = latencies.slice().sort((a, b) => a - b);

    if (sorted.length === 0) {
      return { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0, mean: 0, stddev: 0, min: 0, max: 0 };
    }

    const mean = sorted.reduce((sum, l) => sum + l, 0) / sorted.length;
    const variance = sorted.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / sorted.length;
    const stddev = Math.sqrt(variance);

    return {
      p50: this.percentile(sorted, 50),
      p75: this.percentile(sorted, 75),
      p90: this.percentile(sorted, 90),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
      mean,
      stddev,
      min: sorted[0],
      max: sorted[sorted.length - 1]
    };
  }

  async getMetrics(): Promise<NetworkMetrics> {
    return this.calculateMetrics();
  }

  isActive(): boolean {
    return this.isProfileActive;
  }

  getConnections(): ConnectionInfo[] {
    return Array.from(this.connections.values());
  }

  getRequests(): RequestInfo[] {
    return Array.from(this.requests.values());
  }

  getDNSLookups(): DNSLookupInfo[] {
    return [...this.dnsLookups];
  }

  clearData(): void {
    this.connections.clear();
    this.requests.clear();
    this.dnsLookups = [];
  }

  destroy(): void {
    if (this.isProfileActive) {
      this.stopProfiling();
    }

    this.removeAllListeners();
  }
}

export default NetworkProfiler;