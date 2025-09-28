/**
 * Rule Processor - FSM component for managing conversion rules
 * NASA Rule 10 Compliant: Fixed bounds and non-recursive operations
 */

import { ConversionRule, MAX_CONVERSION_RULES } from './MessageFormatTypes';
import { Logger } from '../../../utils/Logger';

export class RuleProcessor {
  private logger: Logger;
  private conversionRules: Map<string, ConversionRule>;

  constructor() {
    this.logger = new Logger('RuleProcessor');
    this.conversionRules = new Map();
  }

  /**
   * Register a conversion rule - NASA Rule 10: ≤60 lines
   */
  async registerRule(rule: ConversionRule): Promise<void> {
    // Assertion 1: Valid rule object
    console.assert(rule !== null && typeof rule === 'object', 'Valid rule object required');
    // Assertion 2: Required rule fields
    console.assert(rule.id && rule.sourceFormat && rule.targetFormat, 'Rule ID, source, and target formats required');

    // NASA Rule 10: Enforce rule limit
    if (this.conversionRules.size >= MAX_CONVERSION_RULES) {
      throw new Error(`Maximum number of conversion rules reached: ${MAX_CONVERSION_RULES}`);
    }

    // Validate rule
    await this.validateConversionRule(rule);

    const ruleKey = `${rule.sourceFormat}_to_${rule.targetFormat}`;
    this.conversionRules.set(ruleKey, rule);

    this.logger.info('Conversion rule registered', {
      id: rule.id,
      sourceFormat: rule.sourceFormat,
      targetFormat: rule.targetFormat,
      lossless: rule.lossless
    });
  }

  /**
   * Get conversion rules with filtering - NASA Rule 10: ≤60 lines
   */
  getConversionRules(sourceFormat?: string, targetFormat?: string): ConversionRule[] {
    // Assertion 1: Registry is initialized
    console.assert(this.conversionRules instanceof Map, 'Rule registry must be initialized');
    // Assertion 2: Parameters are valid if provided
    console.assert(!sourceFormat || typeof sourceFormat === 'string', 'Source format must be string if provided');

    let rules = Array.from(this.conversionRules.values());

    // NASA Rule 10: Fixed bounds for filtering
    const maxRulesToProcess = Math.min(rules.length, MAX_CONVERSION_RULES);

    if (sourceFormat) {
      rules = rules.filter(rule => rule.sourceFormat === sourceFormat);
    }

    if (targetFormat) {
      rules = rules.filter(rule => rule.targetFormat === targetFormat);
    }

    // NASA Rule 10: Bounded sort by priority
    return rules
      .slice(0, maxRulesToProcess)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Find conversion rules for specific format pair - NASA Rule 10: Single responsibility
   */
  async findConversionRules(sourceFormat: string, targetFormat: string): Promise<ConversionRule[]> {
    // Assertion 1: Valid format parameters
    console.assert(sourceFormat && targetFormat, 'Source and target formats required');
    // Assertion 2: Formats are different
    console.assert(sourceFormat !== targetFormat, 'Source and target formats must be different');

    const ruleKey = `${sourceFormat}_to_${targetFormat}`;
    const rule = this.conversionRules.get(ruleKey);
    return rule ? [rule] : [];
  }

  /**
   * Initialize built-in converters - NASA Rule 10: ≤60 lines
   */
  initializeBuiltInConverters(): void {
    // Assertion 1: Registry is clean
    console.assert(this.conversionRules.size === 0, 'Rule registry should be empty during initialization');
    // Assertion 2: Registry is ready
    console.assert(this.conversionRules instanceof Map, 'Rule registry must be Map instance');

    // JSON to XML conversion rule
    const jsonToXmlRule: ConversionRule = {
      id: 'json_to_xml_v1',
      name: 'JSON to XML Conversion',
      sourceFormat: 'json',
      targetFormat: 'xml',
      priority: 100,
      converters: [
        {
          sourceField: '*',
          targetField: '*',
          converterType: 'transform',
          transformer: {
            name: 'jsonToXmlTransformer',
            function: `
              function transform(jsonData) {
                return convertJsonToXml(jsonData);
              }
            `,
            parameters: [],
            reversible: true,
            reverseFunction: `
              function reverseTransform(xmlData) {
                return convertXmlToJson(xmlData);
              }
            `
          },
          required: true
        }
      ],
      postProcessors: [
        {
          name: 'xmlFormatting',
          stage: 'post_conversion',
          processor: `
            function formatXml(xmlString, options) {
              if (options.pretty) {
                return prettifyXml(xmlString);
              }
              return xmlString;
            }
          `,
          parameters: {},
          critical: false
        }
      ],
      validationRules: [
        {
          name: 'wellFormedXml',
          validator: `
            function validateXml(xmlString) {
              try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(xmlString, 'application/xml');
                return !doc.querySelector('parsererror');
              } catch (error) {
                return false;
              }
            }
          `,
          errorMessage: 'Generated XML is not well-formed',
          severity: 'error',
          stage: 'post'
        }
      ],
      preserveMetadata: true,
      lossless: false
    };

    this.conversionRules.set('json_to_xml', jsonToXmlRule);

    this.logger.info('Built-in converters initialized', {
      ruleCount: this.conversionRules.size
    });
  }

  /**
   * Validate conversion rule - NASA Rule 10: ≤60 lines
   */
  private async validateConversionRule(rule: ConversionRule): Promise<void> {
    // Assertion 1: Rule object exists
    console.assert(rule !== null, 'Rule object required for validation');
    // Assertion 2: Required fields present
    console.assert(rule.id && rule.sourceFormat && rule.targetFormat, 'ID, source, and target formats required');

    // Validate rule ID format
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(rule.id)) {
      throw new Error(`Invalid rule ID: ${rule.id}. Must start with letter and contain only alphanumeric, underscore, or dash characters.`);
    }

    // Validate priority
    if (typeof rule.priority !== 'number' || rule.priority < 0 || rule.priority > 1000) {
      throw new Error(`Invalid priority: ${rule.priority}. Must be number between 0 and 1000.`);
    }

    // Check for duplicate rule
    const ruleKey = `${rule.sourceFormat}_to_${rule.targetFormat}`;
    if (this.conversionRules.has(ruleKey)) {
      const existingRule = this.conversionRules.get(ruleKey);
      if (existingRule && existingRule.id === rule.id) {
        throw new Error(`Rule ${rule.id} for ${rule.sourceFormat} -> ${rule.targetFormat} already exists`);
      }
    }

    // Validate converters array
    if (!Array.isArray(rule.converters) || rule.converters.length === 0) {
      throw new Error('Rule must have at least one converter');
    }

    // NASA Rule 10: Bounded validation of converters
    const maxConverterCheck = 10;
    for (let i = 0; i < Math.min(rule.converters.length, maxConverterCheck); i++) {
      const converter = rule.converters[i];
      if (!converter.sourceField || !converter.targetField || !converter.converterType) {
        throw new Error(`Converter ${i} is missing required fields: sourceField, targetField, converterType`);
      }
    }

    this.logger.debug('Conversion rule validated', {
      id: rule.id,
      sourceFormat: rule.sourceFormat,
      targetFormat: rule.targetFormat
    });
  }

  /**
   * Remove rule from registry - NASA Rule 10: Single responsibility
   */
  async removeRule(sourceFormat: string, targetFormat: string): Promise<boolean> {
    // Assertion 1: Valid format parameters
    console.assert(sourceFormat && targetFormat, 'Source and target formats required');
    // Assertion 2: Registry is initialized
    console.assert(this.conversionRules instanceof Map, 'Rule registry must be initialized');

    const ruleKey = `${sourceFormat}_to_${targetFormat}`;
    const removed = this.conversionRules.delete(ruleKey);

    if (removed) {
      this.logger.info('Conversion rule removed', { sourceFormat, targetFormat });
    }

    return removed;
  }

  /**
   * Get rule registry statistics - NASA Rule 10: Single responsibility
   */
  getRuleStats(): {
    totalRules: number;
    maxRules: number;
    utilizationPercentage: number;
    formatPairs: Record<string, number>;
  } {
    // Assertion 1: Registry is initialized
    console.assert(this.conversionRules instanceof Map, 'Rule registry must be initialized');
    // Assertion 2: Valid rule limit
    console.assert(MAX_CONVERSION_RULES > 0, 'Maximum rules must be positive');

    const formatPairs: Record<string, number> = {};
    const maxPairCheck = 50; // NASA Rule 10: Fixed bound for pair counting

    let pairCheckCount = 0;
    for (const rule of this.conversionRules.values()) {
      const pair = `${rule.sourceFormat}->${rule.targetFormat}`;
      formatPairs[pair] = (formatPairs[pair] || 0) + 1;

      pairCheckCount++;
      if (pairCheckCount >= maxPairCheck) {
        break;
      }
    }

    return {
      totalRules: this.conversionRules.size,
      maxRules: MAX_CONVERSION_RULES,
      utilizationPercentage: (this.conversionRules.size / MAX_CONVERSION_RULES) * 100,
      formatPairs
    };
  }
}