import { Buffer } from 'buffer';
import * as zlib from 'zlib';
import { promisify } from 'util';
export interface CompressionResult {
  compressed: Buffer;
  originalSize: number;
  compressedSize: number;
  ratio: number;
  algorithm: string;
}
export interface CompressionConfig {
  algorithm: 'gzip' | 'deflate' | 'brotli' | 'lz4' | 'auto';
  level?: number;
  chunkSize?: number;
  threshold?: number;
}
export class MemoryCompressor {
  private readonly gzipAsync = promisify(zlib.gzip);
  private readonly gunzipAsync = promisify(zlib.gunzip);
  private readonly deflateAsync = promisify(zlib.deflate);
  private readonly inflateAsync = promisify(zlib.inflate);
  private readonly brotliCompressAsync = promisify(zlib.brotliCompress);
  private readonly brotliDecompressAsync = promisify(zlib.brotliDecompress);
  private readonly config: CompressionConfig;
  private compressionStats: Map<string, { count: number; totalRatio: number }> = new Map();
  constructor(config: Partial<CompressionConfig> = {}) {
    this.config = {
      algorithm: 'auto',
      level: 6,
      chunkSize: 64 * 1024, // 64KB
      threshold: 1024, // Don't compress data smaller than 1KB
      ...config
    };
  }
  /**
   * Compress data using the best algorithm for the data type
   */
  async compress(data: Buffer | string): Promise<Buffer> {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    // Skip compression for small data
    if (buffer.length < this.config.threshold!) {
      return this.addCompressionHeader(buffer, 'none', 1.0);
    }
    const algorithm = this.config.algorithm === 'auto'
      ? await this.selectBestAlgorithm(buffer)
      : this.config.algorithm;
    let compressed: Buffer;
    let actualAlgorithm = algorithm;
    try {
      switch (algorithm) {
        case 'gzip':
          compressed = await this.compressGzip(buffer);
          break;
        case 'deflate':
          compressed = await this.compressDeflate(buffer);
          break;
        case 'brotli':
          compressed = await this.compressBrotli(buffer);
          break;
        case 'lz4':
          compressed = await this.compressLZ4(buffer);
          break;
        default:
          compressed = buffer;
          actualAlgorithm = 'none';
      }
      const ratio = buffer.length / compressed.length;
      // Only use compression if it actually reduces size significantly
      if (ratio < 1.1) {
        compressed = buffer;
        actualAlgorithm = 'none';
      }
      this.updateCompressionStats(actualAlgorithm, ratio);
      return this.addCompressionHeader(compressed, actualAlgorithm, ratio);
    } catch (error) {
      // Fallback to uncompressed data
      return this.addCompressionHeader(buffer, 'none', 1.0);
    }
  }
  /**
   * Decompress data based on header information
   */
  async decompress(data: Buffer): Promise<Buffer> {
    try {
      const { algorithm, compressedData } = this.readCompressionHeader(data);
      switch (algorithm) {
        case 'gzip':
          return await this.decompressGzip(compressedData);
        case 'deflate':
          return await this.decompressDeflate(compressedData);
        case 'brotli':
          return await this.decompressBrotli(compressedData);
        case 'lz4':
          return await this.decompressLZ4(compressedData);
        case 'none':
        default:
          return compressedData;
      }
    } catch (error) {
      throw new Error(`Decompression failed: ${error.message}`);
    }
  }
  /**
   * Compress with specific algorithm
   */
  async compressWithAlgorithm(data: Buffer, algorithm: string): Promise<CompressionResult> {
    const originalSize = data.length;
    let compressed: Buffer;
    let actualAlgorithm = algorithm;
    try {
      switch (algorithm) {
        case 'gzip':
          compressed = await this.compressGzip(data);
          break;
        case 'deflate':
          compressed = await this.compressDeflate(data);
          break;
        case 'brotli':
          compressed = await this.compressBrotli(data);
          break;
        case 'lz4':
          compressed = await this.compressLZ4(data);
          break;
        default:
          compressed = data;
          actualAlgorithm = 'none';
      }
      const ratio = originalSize / compressed.length;
      return {
        compressed: this.addCompressionHeader(compressed, actualAlgorithm, ratio),
        originalSize,
        compressedSize: compressed.length,
        ratio,
        algorithm: actualAlgorithm
      };
    } catch (error) {
      return {
        compressed: this.addCompressionHeader(data, 'none', 1.0),
        originalSize,
        compressedSize: data.length,
        ratio: 1.0,
        algorithm: 'none'
      };
    }
  }
  /**
   * Get compression statistics
   */
  getStats() {
    const stats: Record<string, { count: number; averageRatio: number }> = {};
    for (const [algorithm, data] of this.compressionStats.entries()) {
      stats[algorithm] = {
        count: data.count,
        averageRatio: data.totalRatio / data.count
      };
    }
    return stats;
  }
  /**
   * Test compression ratios for different algorithms
   */
  async benchmarkAlgorithms(data: Buffer): Promise<Record<string, CompressionResult>> {
    const algorithms = ['gzip', 'deflate', 'brotli', 'lz4'];
    const results: Record<string, CompressionResult> = {};
    for (const algorithm of algorithms) {
      try {
        const start = Date.now();
        const result = await this.compressWithAlgorithm(data, algorithm);
        const duration = Date.now() - start;
        results[algorithm] = {
          ...result,
          compressionTime: duration
        } as CompressionResult & { compressionTime: number };
      } catch (error) {
        results[algorithm] = {
          compressed: data,
          originalSize: data.length,
          compressedSize: data.length,
          ratio: 1.0,
          algorithm: 'none'
        };
      }
    }
    return results;
  }
  private async compressGzip(data: Buffer): Promise<Buffer> {
    return await this.gzipAsync(data, { level: this.config.level });
  }
  private async decompressGzip(data: Buffer): Promise<Buffer> {
    return await this.gunzipAsync(data);
  }
  private async compressDeflate(data: Buffer): Promise<Buffer> {
    return await this.deflateAsync(data, { level: this.config.level });
  }
  private async decompressDeflate(data: Buffer): Promise<Buffer> {
    return await this.inflateAsync(data);
  }
  private async compressBrotli(data: Buffer): Promise<Buffer> {
    const options = {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: this.config.level || 6
      }
    };
    return await this.brotliCompressAsync(data, options);
  }
  private async decompressBrotli(data: Buffer): Promise<Buffer> {
    return await this.brotliDecompressAsync(data);
  }
  // Simple LZ4-like compression (placeholder implementation)
  private async compressLZ4(data: Buffer): Promise<Buffer> {
    // This is a simplified version - in production, use a proper LZ4 library
    return await this.compressDeflate(data);
  }
  private async decompressLZ4(data: Buffer): Promise<Buffer> {
    // This is a simplified version - in production, use a proper LZ4 library
    return await this.decompressDeflate(data);
  }
  private async selectBestAlgorithm(data: Buffer): Promise<string> {
    const sampleSize = Math.min(data.length, 8192); // Test with first 8KB
    const sample = data.slice(0, sampleSize);
    // Quick heuristics based on data characteristics
    const entropy = this.calculateEntropy(sample);
    const repetitiveness = this.calculateRepetitiveness(sample);
    // High entropy data (already compressed/encrypted) - use deflate
    if (entropy > 7.5) return 'deflate';
    // Highly repetitive data - use gzip
    if (repetitiveness > 0.3) return 'gzip';
    // Text-like data with good structure - use brotli
    if (entropy < 6 && this.detectTextLike(sample)) return 'brotli';
    // Binary data with moderate repetitiveness - use LZ4 for speed
    if (repetitiveness > 0.1) return 'lz4';
    // Default fallback
    return 'gzip';
  }
  private calculateEntropy(data: Buffer): number {
    const frequencies: Record<number, number> = {};
    for (let i = 0; i < data.length; i++) {
      const byte = data[i];
      frequencies[byte] = (frequencies[byte] || 0) + 1;
    }
    let entropy = 0;
    const length = data.length;
    for (const count of Object.values(frequencies)) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }
    return entropy;
  }
  private calculateRepetitiveness(data: Buffer): number {
    const windowSize = 32;
    let matches = 0;
    let comparisons = 0;
    for (let i = 0; i < data.length - windowSize; i++) {
      const window = data.slice(i, i + windowSize);
      for (let j = i + windowSize; j < data.length - windowSize; j++) {
        const target = data.slice(j, j + windowSize);
        comparisons++;
        if (window.equals(target)) {
          matches++;
        }
      }
    }
    return comparisons > 0 ? matches / comparisons : 0;
  }
  private detectTextLike(data: Buffer): boolean {
    let printableChars = 0;
    for (let i = 0; i < data.length; i++) {
      const byte = data[i];
      if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
        printableChars++;
      }
    }
    return (printableChars / data.length) > 0.7;
  }
  private addCompressionHeader(data: Buffer, algorithm: string, ratio: number): Buffer {
    const header = JSON.stringify({ algorithm, ratio, originalSize: data.length });
    const headerBuffer = Buffer.from(header, 'utf8');
    const headerLengthBuffer = Buffer.allocUnsafe(4);
    headerLengthBuffer.writeUInt32BE(headerBuffer.length, 0);
    return Buffer.concat([headerLengthBuffer, headerBuffer, data]);
  }
  private readCompressionHeader(data: Buffer): { algorithm: string; ratio: number; compressedData: Buffer } {
    const headerLength = data.readUInt32BE(0);
    const headerBuffer = data.slice(4, 4 + headerLength);
    const header = JSON.parse(headerBuffer.toString('utf8'));
    const compressedData = data.slice(4 + headerLength);
    return {
      algorithm: header.algorithm,
      ratio: header.ratio,
      compressedData
    };
  }
  private updateCompressionStats(algorithm: string, ratio: number): void {
    const current = this.compressionStats.get(algorithm) || { count: 0, totalRatio: 0 };
    current.count++;
    current.totalRatio += ratio;
    this.compressionStats.set(algorithm, current);
  }
}
export default MemoryCompressor;