/**
 * Size calculation utilities for memory operations
 */
export class SizeCalculationUtils {
  /**
   * Calculate size of data for memory allocation (UTF-16 estimate)
   */
  static calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // UTF-16 estimate
    } catch (error) {
      // Fallback for circular references or non-serializable data
      return this.approximateSize(data);
    }
  }

  /**
   * Approximate size for complex objects
   */
  private static approximateSize(obj: any): number {
    if (obj === null || obj === undefined) {
      return 8; // Basic pointer size
    }

    if (typeof obj === 'string') {
      return obj.length * 2; // UTF-16
    }

    if (typeof obj === 'number') {
      return 8; // 64-bit number
    }

    if (typeof obj === 'boolean') {
      return 4; // 32-bit boolean
    }

    if (Array.isArray(obj)) {
      return obj.reduce((total, item) => total + this.approximateSize(item), 0);
    }

    if (typeof obj === 'object') {
      return Object.entries(obj).reduce(
        (total, [key, value]) =>
          total + key.length * 2 + this.approximateSize(value),
        0
      );
    }

    return 64; // Default fallback
  }

  /**
   * Check if size is within allowed limits
   */
  static isWithinLimit(dataSize: number, maxSize: number, allowanceMultiplier = 1.0): boolean {
    return dataSize <= maxSize * allowanceMultiplier;
  }

  /**
   * Format size for human-readable display
   */
  static formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Calculate memory overhead for storage structures
   */
  static calculateOverhead(entryCount: number, avgSize: number): number {
    // Estimate overhead: Map structure + object overhead
    const mapOverhead = entryCount * 64; // Map entry overhead
    const objectOverhead = entryCount * 128; // Object wrapper overhead
    return mapOverhead + objectOverhead;
  }

  /**
   * Estimate total memory usage
   */
  static estimateMemoryUsage(entries: Array<{ size: number }>): {
    dataSize: number;
    overhead: number;
    total: number;
  } {
    const dataSize = entries.reduce((total, entry) => total + entry.size, 0);
    const overhead = this.calculateOverhead(entries.length, dataSize / entries.length || 0);

    return {
      dataSize,
      overhead,
      total: dataSize + overhead
    };
  }
}