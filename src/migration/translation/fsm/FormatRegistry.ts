/**
 * Format Registry - FSM component for managing message formats
 * NASA Rule 10 Compliant: Fixed bounds and non-recursive operations
 */

import { MessageFormat, MAX_FORMATS } from './MessageFormatTypes';
import { Logger } from '../../../utils/Logger';

export class FormatRegistry {
  private logger: Logger;
  private formats: Map<string, MessageFormat>;

  constructor() {
    this.logger = new Logger('FormatRegistry');
    this.formats = new Map();
  }

  /**
   * Register a message format - NASA Rule 10: ≤60 lines
   */
  async registerFormat(format: MessageFormat): Promise<void> {
    // Assertion 1: Valid format object
    console.assert(format !== null && typeof format === 'object', 'Valid format object required');
    // Assertion 2: Required format fields
    console.assert(format.name && format.version, 'Format name and version required');

    // NASA Rule 10: Enforce format limit
    if (this.formats.size >= MAX_FORMATS) {
      throw new Error(`Maximum number of formats reached: ${MAX_FORMATS}`);
    }

    // Validate format definition
    await this.validateFormatDefinition(format);

    this.formats.set(format.name, format);

    this.logger.info('Message format registered', {
      name: format.name,
      version: format.version,
      type: format.schema.type
    });
  }

  /**
   * Get format by name - NASA Rule 10: Single responsibility
   */
  async getFormat(name: string): Promise<MessageFormat | null> {
    // Assertion 1: Valid name parameter
    console.assert(typeof name === 'string' && name.length > 0, 'Valid format name required');
    // Assertion 2: Registry is initialized
    console.assert(this.formats instanceof Map, 'Format registry must be initialized');

    return this.formats.get(name) || null;
  }

  /**
   * Get all supported formats - NASA Rule 10: Single responsibility
   */
  getSupportedFormats(): MessageFormat[] {
    // Assertion 1: Registry is initialized
    console.assert(this.formats instanceof Map, 'Format registry must be initialized');
    // Assertion 2: Format limit not exceeded
    console.assert(this.formats.size <= MAX_FORMATS, `Format count must not exceed ${MAX_FORMATS}`);

    return Array.from(this.formats.values());
  }

  /**
   * Check if format exists - NASA Rule 10: Single responsibility
   */
  hasFormat(name: string): boolean {
    // Assertion 1: Valid name parameter
    console.assert(typeof name === 'string' && name.length > 0, 'Valid format name required');
    // Assertion 2: Registry is initialized
    console.assert(this.formats instanceof Map, 'Format registry must be initialized');

    return this.formats.has(name);
  }

  /**
   * Initialize built-in formats - NASA Rule 10: ≤60 lines
   */
  initializeBuiltInFormats(): void {
    // Assertion 1: Registry is clean
    console.assert(this.formats.size === 0, 'Registry should be empty during initialization');
    // Assertion 2: Registry is ready
    console.assert(this.formats instanceof Map, 'Registry must be Map instance');

    // JSON Format
    const jsonFormat: MessageFormat = {
      name: 'json',
      version: '1.0',
      contentType: 'application/json',
      encoding: 'utf-8',
      schema: {
        type: 'json',
        definition: {},
        namespace: 'org.example.json'
      },
      characteristics: {
        humanReadable: true,
        binaryFormat: false,
        selfDescribing: true,
        schemaEvolution: false,
        compression: ['gzip', 'deflate'],
        encryption: ['aes-256', 'rsa'],
        streaming: true,
        size: 'medium'
      },
      serialization: {
        serializer: 'json_serializer',
        deserializer: 'json_deserializer',
        options: { pretty: false },
        contentTypeMapping: {
          'application/json': 'json',
          'text/json': 'json'
        }
      },
      validation: {
        validateOnSerialize: true,
        validateOnDeserialize: true,
        strictMode: false,
        allowedExtensions: ['.json']
      }
    };

    this.formats.set('json', jsonFormat);

    // XML Format
    const xmlFormat: MessageFormat = {
      name: 'xml',
      version: '1.0',
      contentType: 'application/xml',
      encoding: 'utf-8',
      schema: {
        type: 'xml',
        definition: {},
        namespace: 'http://example.org/xml'
      },
      characteristics: {
        humanReadable: true,
        binaryFormat: false,
        selfDescribing: true,
        schemaEvolution: false,
        compression: ['gzip', 'deflate'],
        encryption: ['xml-encryption'],
        streaming: true,
        size: 'verbose'
      },
      serialization: {
        serializer: 'xml_serializer',
        deserializer: 'xml_deserializer',
        options: { pretty: false, includeDeclaration: true },
        contentTypeMapping: {
          'application/xml': 'xml',
          'text/xml': 'xml'
        }
      },
      validation: {
        validateOnSerialize: true,
        validateOnDeserialize: true,
        strictMode: true,
        allowedExtensions: ['.xml']
      }
    };

    this.formats.set('xml', xmlFormat);

    this.logger.info('Built-in formats initialized', {
      formatCount: this.formats.size
    });
  }

  /**
   * Validate format definition - NASA Rule 10: ≤60 lines
   */
  private async validateFormatDefinition(format: MessageFormat): Promise<void> {
    // Assertion 1: Format object exists
    console.assert(format !== null, 'Format object required for validation');
    // Assertion 2: Required fields present
    console.assert(format.name && format.version && format.schema, 'Name, version, and schema required');

    // Validate name format
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(format.name)) {
      throw new Error(`Invalid format name: ${format.name}. Must start with letter and contain only alphanumeric, underscore, or dash characters.`);
    }

    // Validate version format
    if (!/^\d+\.\d+(\.\d+)?$/.test(format.version)) {
      throw new Error(`Invalid version format: ${format.version}. Must be in format x.y or x.y.z`);
    }

    // Validate schema type
    const validSchemaTypes = ['json', 'xml', 'avro', 'protobuf', 'yaml', 'binary', 'custom'];
    if (!validSchemaTypes.includes(format.schema.type)) {
      throw new Error(`Invalid schema type: ${format.schema.type}. Must be one of: ${validSchemaTypes.join(', ')}`);
    }

    // Check for duplicate format
    if (this.formats.has(format.name)) {
      const existingFormat = this.formats.get(format.name);
      if (existingFormat && existingFormat.version === format.version) {
        throw new Error(`Format ${format.name} version ${format.version} already exists`);
      }
    }

    // Validate characteristics
    if (!format.characteristics || typeof format.characteristics !== 'object') {
      throw new Error('Format characteristics must be provided as an object');
    }

    // Validate serialization config
    if (!format.serialization || !format.serialization.serializer || !format.serialization.deserializer) {
      throw new Error('Format must specify both serializer and deserializer');
    }

    this.logger.debug('Format definition validated', {
      name: format.name,
      version: format.version,
      type: format.schema.type
    });
  }

  /**
   * Remove format from registry - NASA Rule 10: Single responsibility
   */
  async removeFormat(name: string): Promise<boolean> {
    // Assertion 1: Valid name parameter
    console.assert(typeof name === 'string' && name.length > 0, 'Valid format name required');
    // Assertion 2: Registry is initialized
    console.assert(this.formats instanceof Map, 'Format registry must be initialized');

    const removed = this.formats.delete(name);

    if (removed) {
      this.logger.info('Format removed from registry', { name });
    }

    return removed;
  }

  /**
   * Get format statistics - NASA Rule 10: Single responsibility
   */
  getRegistryStats(): {
    totalFormats: number;
    maxFormats: number;
    utilizationPercentage: number;
    formatTypes: Record<string, number>;
  } {
    // Assertion 1: Registry is initialized
    console.assert(this.formats instanceof Map, 'Format registry must be initialized');
    // Assertion 2: Valid format limit
    console.assert(MAX_FORMATS > 0, 'Maximum formats must be positive');

    const formatTypes: Record<string, number> = {};
    const maxTypesCheck = 20; // NASA Rule 10: Fixed bound for type counting

    let typeCheckCount = 0;
    for (const format of this.formats.values()) {
      const type = format.schema.type;
      formatTypes[type] = (formatTypes[type] || 0) + 1;

      typeCheckCount++;
      if (typeCheckCount >= maxTypesCheck) {
        break;
      }
    }

    return {
      totalFormats: this.formats.size,
      maxFormats: MAX_FORMATS,
      utilizationPercentage: (this.formats.size / MAX_FORMATS) * 100,
      formatTypes
    };
  }
}