import lz4 from 'lz4';
import { Logger } from '../../utils/logger';

export interface CompressionResult {
  compressedData: Buffer;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  algorithm: 'lz4';
}

export interface CompressionStats {
  totalCompressions: number;
  totalOriginalBytes: number;
  totalCompressedBytes: number;
  averageCompressionRatio: number;
  bestCompressionRatio: number;
  worstCompressionRatio: number;
}

/**
 * Real Memory Compressor using LZ4 algorithm
 * Replaces fake deflate with actual LZ4 compression
 */
export class RealMemoryCompressor {
  private logger: Logger;
  private stats: CompressionStats;

  constructor() {
    this.logger = new Logger('RealMemoryCompressor');
    this.stats = {
      totalCompressions: 0,
      totalOriginalBytes: 0,
      totalCompressedBytes: 0,
      averageCompressionRatio: 0,
      bestCompressionRatio: 0,
      worstCompressionRatio: Number.MAX_VALUE
    };
  }

  /**
   * Compress data using real LZ4 algorithm
   */
  async compressLZ4(data: any): Promise<CompressionResult> {
    try {
      // Convert data to buffer
      const jsonString = JSON.stringify(data);
      const originalBuffer = Buffer.from(jsonString, 'utf8');
      const originalSize = originalBuffer.length;

      // Apply real LZ4 compression
      const compressedData = lz4.encode(originalBuffer);
      const compressedSize = compressedData.length;

      // Calculate compression ratio
      const compressionRatio = originalSize > 0 ? compressedSize / originalSize : 1;

      // Update statistics
      this.updateStats(originalSize, compressedSize, compressionRatio);

      const result: CompressionResult = {
        compressedData,
        originalSize,
        compressedSize,
        compressionRatio,
        algorithm: 'lz4'
      };

      this.logger.debug(
        `LZ4 compression: ${originalSize} -> ${compressedSize} bytes ` +
        `(${(compressionRatio * 100).toFixed(1)}% of original)`
      );

      return result;
    } catch (error) {
      this.logger.error('LZ4 compression failed:', error);
      throw new Error(`LZ4 compression failed: ${error.message}`);
    }
  }

  /**
   * Decompress LZ4 data
   */
  async decompressLZ4(compressedData: Buffer): Promise<any> {
    try {
      // Decompress using real LZ4
      const decompressedBuffer = lz4.decode(compressedData);
      const jsonString = decompressedBuffer.toString('utf8');

      // Parse back to original data
      const data = JSON.parse(jsonString);

      this.logger.debug(
        `LZ4 decompression: ${compressedData.length} -> ${decompressedBuffer.length} bytes`
      );

      return data;
    } catch (error) {
      this.logger.error('LZ4 decompression failed:', error);
      throw new Error(`LZ4 decompression failed: ${error.message}`);
    }
  }

  /**
   * Compress memory block data
   */
  async compressMemoryBlock(blockData: any): Promise<{
    compressed: Buffer;
    metadata: {
      originalSize: number;
      compressedSize: number;
      compressionRatio: number;
      algorithm: string;
      timestamp: Date;
    };
  }> {
    const result = await this.compressLZ4(blockData);

    return {
      compressed: result.compressedData,
      metadata: {
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        compressionRatio: result.compressionRatio,
        algorithm: result.algorithm,
        timestamp: new Date()
      }
    };
  }

  /**
   * Decompress memory block data
   */
  async decompressMemoryBlock(compressedBuffer: Buffer): Promise<any> {
    return await this.decompressLZ4(compressedBuffer);
  }

  /**
   * Get compression ratio for data (without actually compressing)
   */
  estimateCompressionRatio(data: any): number {
    // Use historical average if we have stats
    if (this.stats.totalCompressions > 0) {
      return this.stats.averageCompressionRatio;
    }

    // Estimate based on data type and content
    const jsonString = JSON.stringify(data);
    const dataSize = Buffer.byteLength(jsonString, 'utf8');

    // Simple heuristic based on data characteristics
    if (dataSize < 1024) {
      return 0.9; // Small data doesn't compress well
    } else if (jsonString.includes('"')) {
      return 0.6; // Text with quotes compresses well
    } else if (/\d+\.?\d*/.test(jsonString)) {
      return 0.7; // Numeric data compresses moderately
    } else {
      return 0.8; // Default estimate
    }
  }

  /**
   * Check if data should be compressed based on size and content
   */
  shouldCompress(data: any, threshold: number = 1024): boolean {
    const jsonString = JSON.stringify(data);
    const dataSize = Buffer.byteLength(jsonString, 'utf8');

    // Don't compress small data
    if (dataSize < threshold) {
      return false;
    }

    // Estimate compression benefit
    const estimatedRatio = this.estimateCompressionRatio(data);
    const estimatedSavings = dataSize * (1 - estimatedRatio);

    // Compress if we can save at least 10% and 256 bytes
    return estimatedSavings > Math.max(dataSize * 0.1, 256);
  }

  /**
   * Batch compress multiple memory entries
   */
  async batchCompress(entries: Array<{ id: string; data: any }>): Promise<Array<{
    id: string;
    compressed: Buffer;
    metadata: any;
  }>> {
    const results = [];

    for (const entry of entries) {
      try {
        if (this.shouldCompress(entry.data)) {
          const compressed = await this.compressMemoryBlock(entry.data);
          results.push({
            id: entry.id,
            compressed: compressed.compressed,
            metadata: compressed.metadata
          });
        } else {
          // Store uncompressed
          const jsonString = JSON.stringify(entry.data);
          const buffer = Buffer.from(jsonString, 'utf8');
          results.push({
            id: entry.id,
            compressed: buffer,
            metadata: {
              originalSize: buffer.length,
              compressedSize: buffer.length,
              compressionRatio: 1.0,
              algorithm: 'none',
              timestamp: new Date()
            }
          });
        }
      } catch (error) {
        this.logger.error(`Failed to compress entry ${entry.id}:`, error);
        // Skip problematic entries
      }
    }

    this.logger.info(`Batch compressed ${results.length}/${entries.length} entries`);
    return results;
  }

  /**
   * Update compression statistics
   */
  private updateStats(originalSize: number, compressedSize: number, ratio: number): void {
    this.stats.totalCompressions++;
    this.stats.totalOriginalBytes += originalSize;
    this.stats.totalCompressedBytes += compressedSize;

    // Update averages
    this.stats.averageCompressionRatio = this.stats.totalCompressedBytes / this.stats.totalOriginalBytes;

    // Update best/worst ratios
    if (ratio > this.stats.bestCompressionRatio) {
      this.stats.bestCompressionRatio = ratio;
    }
    if (ratio < this.stats.worstCompressionRatio) {
      this.stats.worstCompressionRatio = ratio;
    }
  }

  /**
   * Get compression statistics
   */
  getCompressionStats(): CompressionStats & {
    totalSavedBytes: number;
    spaceSavingsPercent: number;
  } {
    const totalSavedBytes = this.stats.totalOriginalBytes - this.stats.totalCompressedBytes;
    const spaceSavingsPercent = this.stats.totalOriginalBytes > 0 ?
      (totalSavedBytes / this.stats.totalOriginalBytes) * 100 : 0;

    return {
      ...this.stats,
      totalSavedBytes,
      spaceSavingsPercent
    };
  }

  /**
   * Reset compression statistics
   */
  resetStats(): void {
    this.stats = {
      totalCompressions: 0,
      totalOriginalBytes: 0,
      totalCompressedBytes: 0,
      averageCompressionRatio: 0,
      bestCompressionRatio: 0,
      worstCompressionRatio: Number.MAX_VALUE
    };

    this.logger.info('Compression statistics reset');
  }
}

export default RealMemoryCompressor;