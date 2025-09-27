import { Buffer } from 'buffer';
export interface SerializationMetadata {
  type: string;
  version: number;
  timestamp: number;
  originalSize: number;
  encoding: string;
}
export interface SerializedData {
  metadata: SerializationMetadata;
  payload: Buffer;
}
export type SerializableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | RegExp
  | Buffer
  | ArrayBuffer
  | SerializableValue[]
  | { [key: string]: SerializableValue };
export class MemorySerializer {
  private readonly version = 1;
  /**
   * Serialize any JavaScript value to Buffer
   */
  serialize(value: SerializableValue): Buffer {
    try {
      const serialized = this.serializeValue(value);
      const metadata: SerializationMetadata = {
        type: this.getValueType(value),
        version: this.version,
        timestamp: Date.now(),
        originalSize: 0,
        encoding: 'utf8'
      };
      const metadataBuffer = Buffer.from(JSON.stringify(metadata), 'utf8');
      const payloadBuffer = Buffer.from(serialized, 'utf8');
      metadata.originalSize = payloadBuffer.length;
      // Create final buffer with metadata length prefix
      const metadataLengthBuffer = Buffer.allocUnsafe(4);
      metadataLengthBuffer.writeUInt32BE(metadataBuffer.length, 0);
      return Buffer.concat([
        metadataLengthBuffer,
        metadataBuffer,
        payloadBuffer
      ]);
    } catch (error) {
      throw new Error(`Serialization failed: ${error.message}`);
    }
  }
  /**
   * Deserialize Buffer back to JavaScript value
   */
  deserialize(buffer: Buffer): SerializableValue {
    try {
      // Read metadata length
      const metadataLength = buffer.readUInt32BE(0);
      // Extract metadata
      const metadataBuffer = buffer.slice(4, 4 + metadataLength);
      const metadata: SerializationMetadata = JSON.parse(metadataBuffer.toString('utf8'));
      // Extract payload
      const payloadBuffer = buffer.slice(4 + metadataLength);
      const serialized = payloadBuffer.toString(metadata.encoding);
      return this.deserializeValue(serialized, metadata.type);
    } catch (error) {
      throw new Error(`Deserialization failed: ${error.message}`);
    }
  }
  /**
   * Get serialization metadata without deserializing
   */
  getMetadata(buffer: Buffer): SerializationMetadata {
    try {
      const metadataLength = buffer.readUInt32BE(0);
      const metadataBuffer = buffer.slice(4, 4 + metadataLength);
      return JSON.parse(metadataBuffer.toString('utf8'));
    } catch (error) {
      throw new Error(`Failed to read metadata: ${error.message}`);
    }
  }
  /**
   * Check if buffer contains valid serialized data
   */
  isValid(buffer: Buffer): boolean {
    try {
      if (buffer.length < 4) return false;
      const metadataLength = buffer.readUInt32BE(0);
      if (metadataLength > buffer.length - 4) return false;
      const metadata = this.getMetadata(buffer);
      return metadata.version <= this.version;
    } catch {
      return false;
    }
  }
  /**
   * Estimate serialized size without actually serializing
   */
  estimateSize(value: SerializableValue): number {
    try {
      const type = this.getValueType(value);
      switch (type) {
        case 'string':
          return Buffer.byteLength(value as string, 'utf8') + 50; // +metadata overhead
        case 'number':
        case 'boolean':
          return 50; // Small fixed size + metadata
        case 'null':
        case 'undefined':
          return 30;
        case 'Date':
          return 70;
        case 'RegExp':
          return Buffer.byteLength((value as RegExp).toString(), 'utf8') + 50;
        case 'Buffer':
          return (value as Buffer).length + 50;
        case 'ArrayBuffer':
          return (value as ArrayBuffer).byteLength + 50;
        case 'Array':
          let arraySize = 50;
          for (const item of value as SerializableValue[]) {
            arraySize += this.estimateSize(item);
          }
          return arraySize;
        case 'Object':
          let objectSize = 50;
          for (const [key, val] of Object.entries(value as object)) {
            objectSize += Buffer.byteLength(key, 'utf8') + this.estimateSize(val);
          }
          return objectSize;
        default:
          return Buffer.byteLength(JSON.stringify(value), 'utf8') + 50;
      }
    } catch {
      return 1000; // Conservative estimate on error
    }
  }
  private serializeValue(value: SerializableValue): string {
    const type = this.getValueType(value);
    switch (type) {
      case 'string':
      case 'number':
      case 'boolean':
      case 'null':
        return JSON.stringify(value);
      case 'undefined':
        return '__undefined__';
      case 'Date':
        return `__date__:${(value as Date).toISOString()}`;
      case 'RegExp':
        const regex = value as RegExp;
        return `__regex__:${regex.source}__flags__:${regex.flags}`;
      case 'Buffer':
        return `__buffer__:${(value as Buffer).toString('base64')}`;
      case 'ArrayBuffer':
        const buffer = Buffer.from(value as ArrayBuffer);
        return `__arraybuffer__:${buffer.toString('base64')}`;
      case 'Array':
        const arrayData = (value as SerializableValue[]).map(item => this.serializeValue(item));
        return `__array__:${JSON.stringify(arrayData)}`;
      case 'Object':
        const objectData: Record<string, string> = {};
        for (const [key, val] of Object.entries(value as object)) {
          objectData[key] = this.serializeValue(val);
        }
        return `__object__:${JSON.stringify(objectData)}`;
      default:
        return JSON.stringify(value);
    }
  }
  private deserializeValue(serialized: string, type: string): SerializableValue {
    switch (type) {
      case 'string':
      case 'number':
      case 'boolean':
      case 'null':
        return JSON.parse(serialized);
      case 'undefined':
        return undefined;
      case 'Date':
        const dateStr = serialized.replace('__date__:', '');
        return new Date(dateStr);
      case 'RegExp':
        const regexMatch = serialized.match(/^__regex__:(.*)__flags__:(.*)$/);
        if (regexMatch) {
          return new RegExp(regexMatch[1], regexMatch[2]);
        }
        throw new Error('Invalid RegExp serialization');
      case 'Buffer':
        const bufferData = serialized.replace('__buffer__:', '');
        return Buffer.from(bufferData, 'base64');
      case 'ArrayBuffer':
        const arrayBufferData = serialized.replace('__arraybuffer__:', '');
        const buffer = Buffer.from(arrayBufferData, 'base64');
        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      case 'Array':
        const arrayStr = serialized.replace('__array__:', '');
        const arrayData = JSON.parse(arrayStr);
        return arrayData.map((item: string) => this.deserializeValue(item, this.inferType(item)));
      case 'Object':
        const objectStr = serialized.replace('__object__:', '');
        const objectData = JSON.parse(objectStr);
        const result: Record<string, SerializableValue> = {};
        for (const [key, val] of Object.entries(objectData)) {
          result[key] = this.deserializeValue(val as string, this.inferType(val as string));
        }
        return result;
      default:
        return JSON.parse(serialized);
    }
  }
  private getValueType(value: SerializableValue): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (value instanceof Date) return 'Date';
    if (value instanceof RegExp) return 'RegExp';
    if (Buffer.isBuffer(value)) return 'Buffer';
    if (value instanceof ArrayBuffer) return 'ArrayBuffer';
    if (Array.isArray(value)) return 'Array';
    const type = typeof value;
    if (type === 'object') return 'Object';
    return type;
  }
  private inferType(serialized: string): string {
    if (serialized === '__undefined__') return 'undefined';
    if (serialized.startsWith('__date__:')) return 'Date';
    if (serialized.startsWith('__regex__:')) return 'RegExp';
    if (serialized.startsWith('__buffer__:')) return 'Buffer';
    if (serialized.startsWith('__arraybuffer__:')) return 'ArrayBuffer';
    if (serialized.startsWith('__array__:')) return 'Array';
    if (serialized.startsWith('__object__:')) return 'Object';
    // Try to infer from JSON
    try {
      const parsed = JSON.parse(serialized);
      if (parsed === null) return 'null';
      return typeof parsed;
    } catch {
      return 'string';
    }
  }
  /**
   * Create a serializer optimized for specific data types
   */
  static createTypedSerializer<T extends SerializableValue>(): MemorySerializer {
    return new MemorySerializer();
  }
  /**
   * Batch serialize multiple values
   */
  serializeBatch(values: SerializableValue[]): Buffer {
    const serializedValues = values.map(value => this.serialize(value));
    const lengthBuffer = Buffer.allocUnsafe(4);
    lengthBuffer.writeUInt32BE(serializedValues.length, 0);
    const lengthBuffers = serializedValues.map(buf => {
      const lenBuf = Buffer.allocUnsafe(4);
      lenBuf.writeUInt32BE(buf.length, 0);
      return lenBuf;
    });
    return Buffer.concat([lengthBuffer, ...lengthBuffers, ...serializedValues]);
  }
  /**
   * Batch deserialize multiple values
   */
  deserializeBatch(buffer: Buffer): SerializableValue[] {
    let offset = 0;
    const count = buffer.readUInt32BE(offset);
    offset += 4;
    const lengths: number[] = [];
    for (let i = 0; i < count; i++) {
      lengths.push(buffer.readUInt32BE(offset));
      offset += 4;
    }
    const results: SerializableValue[] = [];
    for (const length of lengths) {
      const valueBuffer = buffer.slice(offset, offset + length);
      results.push(this.deserialize(valueBuffer));
      offset += length;
    }
    return results;
  }
}
export default MemorySerializer;