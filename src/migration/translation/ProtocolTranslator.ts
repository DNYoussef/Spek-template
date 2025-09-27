import { EventEmitter } from 'events';
import { Logger } from '../../utils/Logger';

export interface ProtocolMessage {
  id: string;
  type: string;
  version: string;
  timestamp: Date;
  headers: Record<string, any>;
  payload: any;
  metadata: MessageMetadata;
  checksum?: string;
}

export interface MessageMetadata {
  sourceProtocol: string;
  targetProtocol: string;
  contentType: string;
  encoding: string;
  compression?: string;
  encryption?: EncryptionMetadata;
  routing?: RoutingMetadata;
}

export interface EncryptionMetadata {
  algorithm: string;
  keyId: string;
  initVector?: string;
  signature?: string;
}

export interface RoutingMetadata {
  source: string;
  destination: string;
  priority: number;
  ttl?: number;
  retryPolicy?: RetryPolicy;
}

export interface TranslationRule {
  id: string;
  name: string;
  sourceProtocol: string;
  targetProtocol: string;
  sourceVersion: string;
  targetVersion: string;
  transformations: FieldTransformation[];
  conditions: TranslationCondition[];
  priority: number;
  bidirectional: boolean;
  validUntil?: Date;
}

export interface FieldTransformation {
  type: 'map' | 'transform' | 'aggregate' | 'split' | 'default' | 'remove';
  sourceField: string;
  targetField: string;
  transformation?: TransformationFunction;
  parameters?: Record<string, any>;
  required: boolean;
  validation?: FieldValidation;
}

export interface TransformationFunction {
  name: string;
  implementation: string; // JavaScript function as string
  parameters: Parameter[];
  returnType: string;
  description: string;
}

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface FieldValidation {
  type: string;
  rules: ValidationRule[];
  errorHandling: 'strict' | 'lenient' | 'ignore';
}

export interface ValidationRule {
  name: string;
  condition: string;
  errorMessage: string;
  severity: 'error' | 'warning' | 'info';
}

export interface TranslationCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains' | 'regex';
  value: any;
  caseSensitive?: boolean;
}

export interface TranslationResult {
  success: boolean;
  translatedMessage: ProtocolMessage | null;
  originalMessage: ProtocolMessage;
  appliedRules: string[];
  warnings: TranslationWarning[];
  errors: TranslationError[];
  metadata: TranslationMetadata;
  performance: PerformanceMetrics;
}

export interface TranslationWarning {
  code: string;
  message: string;
  field?: string;
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

export interface TranslationError {
  code: string;
  message: string;
  field?: string;
  cause?: Error;
  recoverable: boolean;
  suggestions: string[];
}

export interface TranslationMetadata {
  translationId: string;
  timestamp: Date;
  duration: number;
  rulesEvaluated: number;
  transformationsApplied: number;
  dataLoss: boolean;
  fidelity: number; // 0-100 percentage
}

export interface PerformanceMetrics {
  translationTime: number;
  validationTime: number;
  serializationTime: number;
  totalTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface ProtocolSchema {
  protocol: string;
  version: string;
  schema: any; // JSON Schema or similar
  messageTypes: MessageTypeDefinition[];
  constraints: SchemaConstraint[];
  compatibility: CompatibilityInfo;
}

export interface MessageTypeDefinition {
  type: string;
  description: string;
  fields: FieldDefinition[];
  required: string[];
  examples: any[];
}

export interface FieldDefinition {
  name: string;
  type: string;
  description: string;
  constraints?: FieldConstraint[];
  format?: string;
  default?: any;
}

export interface FieldConstraint {
  type: 'minLength' | 'maxLength' | 'pattern' | 'enum' | 'range' | 'custom';
  value: any;
  message?: string;
}

export interface SchemaConstraint {
  field: string;
  constraint: FieldConstraint;
  scope: 'global' | 'message_type' | 'conditional';
}

export interface CompatibilityInfo {
  backwardCompatible: string[];
  forwardCompatible: string[];
  breaking: BreakingChange[];
  deprecated: DeprecatedField[];
}

export interface BreakingChange {
  version: string;
  field: string;
  changeType: 'removed' | 'renamed' | 'type_changed' | 'constraint_added';
  description: string;
  migrationPath?: string;
}

export interface DeprecatedField {
  field: string;
  deprecatedIn: string;
  removedIn?: string;
  replacement?: string;
  reason: string;
}

export interface BatchTranslationRequest {
  messages: ProtocolMessage[];
  sourceProtocol: string;
  targetProtocol: string;
  options: BatchTranslationOptions;
}

export interface BatchTranslationOptions {
  parallelism: number;
  stopOnError: boolean;
  validateResults: boolean;
  generateReport: boolean;
  retryFailures: boolean;
}

export interface BatchTranslationResult {
  success: boolean;
  totalMessages: number;
  successfulTranslations: number;
  failedTranslations: number;
  results: TranslationResult[];
  summary: BatchSummary;
  report?: TranslationReport;
}

export interface BatchSummary {
  averageTranslationTime: number;
  totalDataLoss: boolean;
  averageFidelity: number;
  commonErrors: ErrorSummary[];
  performance: BatchPerformanceMetrics;
}

export interface ErrorSummary {
  errorCode: string;
  count: number;
  percentage: number;
  examples: string[];
}

export interface BatchPerformanceMetrics {
  totalTime: number;
  averageMessageTime: number;
  throughput: number; // messages per second
  memoryPeak: number;
  cpuUtilization: number;
}

export interface TranslationReport {
  summary: BatchSummary;
  detailedResults: TranslationResult[];
  ruleUsageStatistics: RuleUsageStats[];
  recommendations: TranslationRecommendation[];
  qualityMetrics: QualityMetrics;
}

export interface RuleUsageStats {
  ruleId: string;
  timesApplied: number;
  averageExecutionTime: number;
  successRate: number;
  errorRate: number;
}

export interface TranslationRecommendation {
  type: 'optimization' | 'rule_improvement' | 'schema_update' | 'performance';
  message: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  details: string;
}

export interface QualityMetrics {
  overallFidelity: number;
  dataLossPercentage: number;
  validationPassRate: number;
  performanceScore: number;
  reliabilityScore: number;
}

export class ProtocolTranslator extends EventEmitter {
  private logger: Logger;
  private translationRules: Map<string, TranslationRule>;
  private protocolSchemas: Map<string, ProtocolSchema>;
  private transformationEngine: TransformationEngine;
  private validationEngine: ValidationEngine;
  private metricsCollector: MetricsCollector;
  private cacheManager: TranslationCacheManager;

  constructor() {
    super();
    this.logger = new Logger('ProtocolTranslator');
    this.translationRules = new Map();
    this.protocolSchemas = new Map();
    this.transformationEngine = new TransformationEngine();
    this.validationEngine = new ValidationEngine();
    this.metricsCollector = new MetricsCollector();
    this.cacheManager = new TranslationCacheManager();
    this.initializeBuiltInRules();
  }

  async translateMessage(
    message: ProtocolMessage,
    sourceVersion: string,
    targetVersion: string,
    options: TranslationOptions = {}
  ): Promise<TranslationResult> {
    const startTime = Date.now();
    const translationId = this.generateTranslationId();

    this.logger.debug('Starting message translation', {
      translationId,
      messageId: message.id,
      sourceVersion,
      targetVersion
    });

    const result: TranslationResult = {
      success: false,
      translatedMessage: null,
      originalMessage: message,
      appliedRules: [],
      warnings: [],
      errors: [],
      metadata: {
        translationId,
        timestamp: new Date(),
        duration: 0,
        rulesEvaluated: 0,
        transformationsApplied: 0,
        dataLoss: false,
        fidelity: 0
      },
      performance: {
        translationTime: 0,
        validationTime: 0,
        serializationTime: 0,
        totalTime: 0,
        memoryUsage: 0,
        cpuUsage: 0
      }
    };

    try {
      // Check cache first
      if (options.useCache !== false) {
        const cachedResult = await this.cacheManager.get(message, sourceVersion, targetVersion);
        if (cachedResult) {
          this.logger.debug('Translation found in cache', { translationId });
          return cachedResult;
        }
      }

      // Validate source message
      const sourceValidation = await this.validateMessage(message, sourceVersion);
      if (!sourceValidation.valid && options.strictValidation !== false) {
        result.errors.push({
          code: 'SOURCE_VALIDATION_FAILED',
          message: 'Source message validation failed',
          cause: sourceValidation.error,
          recoverable: false,
          suggestions: ['Fix source message format', 'Check source protocol version']
        });
        return result;
      }

      // Find applicable translation rules
      const applicableRules = await this.findApplicableRules(
        message,
        sourceVersion,
        targetVersion
      );

      if (applicableRules.length === 0) {
        result.errors.push({
          code: 'NO_TRANSLATION_RULES',
          message: `No translation rules found for ${sourceVersion} -> ${targetVersion}`,
          recoverable: false,
          suggestions: [
            'Register translation rules',
            'Check protocol version compatibility',
            'Use intermediate translation steps'
          ]
        });
        return result;
      }

      result.metadata.rulesEvaluated = applicableRules.length;

      // Apply transformation rules
      const transformationStartTime = Date.now();
      const transformedMessage = await this.applyTransformationRules(
        message,
        applicableRules,
        result
      );
      result.performance.translationTime = Date.now() - transformationStartTime;

      if (!transformedMessage) {
        result.errors.push({
          code: 'TRANSFORMATION_FAILED',
          message: 'Message transformation failed',
          recoverable: true,
          suggestions: [
            'Check transformation rules',
            'Validate source message structure',
            'Review field mappings'
          ]
        });
        return result;
      }

      // Validate transformed message
      const validationStartTime = Date.now();
      const targetValidation = await this.validateMessage(transformedMessage, targetVersion);
      result.performance.validationTime = Date.now() - validationStartTime;

      if (!targetValidation.valid) {
        result.errors.push({
          code: 'TARGET_VALIDATION_FAILED',
          message: 'Transformed message validation failed',
          cause: targetValidation.error,
          recoverable: true,
          suggestions: [
            'Review transformation rules',
            'Check target protocol constraints',
            'Verify field mappings'
          ]
        });

        if (options.allowInvalidTarget !== true) {
          return result;
        }
      }

      // Calculate fidelity
      result.metadata.fidelity = await this.calculateFidelity(message, transformedMessage);
      result.metadata.dataLoss = result.metadata.fidelity < 100;

      // Finalize result
      result.success = true;
      result.translatedMessage = transformedMessage;
      result.metadata.duration = Date.now() - startTime;
      result.performance.totalTime = result.metadata.duration;

      // Cache successful translation
      if (options.useCache !== false && result.success) {
        await this.cacheManager.set(message, sourceVersion, targetVersion, result);
      }

      // Collect metrics
      await this.metricsCollector.recordTranslation(result);

      this.emit('translationCompleted', result);
      return result;

    } catch (error) {
      this.logger.error('Translation failed with exception', {
        translationId,
        error: error.message
      });

      result.errors.push({
        code: 'TRANSLATION_EXCEPTION',
        message: error.message,
        cause: error,
        recoverable: false,
        suggestions: ['Check system health', 'Review translation configuration']
      });

      result.metadata.duration = Date.now() - startTime;
      result.performance.totalTime = result.metadata.duration;

      this.emit('translationFailed', result, error);
      return result;
    }
  }

  async translateBatch(
    request: BatchTranslationRequest
  ): Promise<BatchTranslationResult> {
    const startTime = Date.now();

    this.logger.info('Starting batch translation', {
      messageCount: request.messages.length,
      sourceProtocol: request.sourceProtocol,
      targetProtocol: request.targetProtocol
    });

    const results: TranslationResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    try {
      if (request.options.parallelism > 1) {
        // Parallel processing
        const chunks = this.chunkArray(request.messages, request.options.parallelism);

        for (const chunk of chunks) {
          const chunkPromises = chunk.map(message =>
            this.translateMessage(
              message,
              request.sourceProtocol,
              request.targetProtocol
            ).catch(error => {
              this.logger.error('Batch translation item failed', {
                messageId: message.id,
                error: error.message
              });

              return {
                success: false,
                translatedMessage: null,
                originalMessage: message,
                appliedRules: [],
                warnings: [],
                errors: [{
                  code: 'BATCH_ITEM_FAILED',
                  message: error.message,
                  recoverable: false,
                  suggestions: []
                }],
                metadata: {
                  translationId: '',
                  timestamp: new Date(),
                  duration: 0,
                  rulesEvaluated: 0,
                  transformationsApplied: 0,
                  dataLoss: false,
                  fidelity: 0
                },
                performance: {
                  translationTime: 0,
                  validationTime: 0,
                  serializationTime: 0,
                  totalTime: 0,
                  memoryUsage: 0,
                  cpuUsage: 0
                }
              } as TranslationResult;
            })
          );

          const chunkResults = await Promise.all(chunkPromises);
          results.push(...chunkResults);

          // Check if we should stop on error
          if (request.options.stopOnError && chunkResults.some(r => !r.success)) {
            break;
          }
        }
      } else {
        // Sequential processing
        for (const message of request.messages) {
          try {
            const result = await this.translateMessage(
              message,
              request.sourceProtocol,
              request.targetProtocol
            );
            results.push(result);

            if (!result.success && request.options.stopOnError) {
              break;
            }
          } catch (error) {
            const failedResult: TranslationResult = {
              success: false,
              translatedMessage: null,
              originalMessage: message,
              appliedRules: [],
              warnings: [],
              errors: [{
                code: 'SEQUENTIAL_ITEM_FAILED',
                message: error.message,
                recoverable: false,
                suggestions: []
              }],
              metadata: {
                translationId: '',
                timestamp: new Date(),
                duration: 0,
                rulesEvaluated: 0,
                transformationsApplied: 0,
                dataLoss: false,
                fidelity: 0
              },
              performance: {
                translationTime: 0,
                validationTime: 0,
                serializationTime: 0,
                totalTime: 0,
                memoryUsage: 0,
                cpuUsage: 0
              }
            };

            results.push(failedResult);

            if (request.options.stopOnError) {
              break;
            }
          }
        }
      }

      // Calculate summary statistics
      successCount = results.filter(r => r.success).length;
      failureCount = results.filter(r => !r.success).length;

      const summary = await this.generateBatchSummary(results, Date.now() - startTime);

      let report: TranslationReport | undefined;
      if (request.options.generateReport) {
        report = await this.generateTranslationReport(results, summary);
      }

      const batchResult: BatchTranslationResult = {
        success: failureCount === 0 || !request.options.stopOnError,
        totalMessages: request.messages.length,
        successfulTranslations: successCount,
        failedTranslations: failureCount,
        results,
        summary,
        report
      };

      this.emit('batchTranslationCompleted', batchResult);
      return batchResult;

    } catch (error) {
      this.logger.error('Batch translation failed', { error: error.message });

      const summary = await this.generateBatchSummary(results, Date.now() - startTime);

      return {
        success: false,
        totalMessages: request.messages.length,
        successfulTranslations: successCount,
        failedTranslations: failureCount,
        results,
        summary
      };
    }
  }

  async registerTranslationRule(rule: TranslationRule): Promise<void> {
    // Validate rule
    await this.validateTranslationRule(rule);

    // Check for conflicts
    const existingRule = this.translationRules.get(rule.id);
    if (existingRule) {
      this.logger.warn('Overwriting existing translation rule', { ruleId: rule.id });
    }

    // Register rule
    this.translationRules.set(rule.id, rule);

    // If bidirectional, create reverse rule
    if (rule.bidirectional) {
      const reverseRule = await this.createReverseRule(rule);
      this.translationRules.set(reverseRule.id, reverseRule);
    }

    this.logger.info('Translation rule registered', {
      ruleId: rule.id,
      sourceProtocol: rule.sourceProtocol,
      targetProtocol: rule.targetProtocol,
      bidirectional: rule.bidirectional
    });

    this.emit('ruleRegistered', rule);
  }

  async registerProtocolSchema(schema: ProtocolSchema): Promise<void> {
    const schemaKey = `${schema.protocol}_${schema.version}`;

    // Validate schema
    await this.validateProtocolSchema(schema);

    this.protocolSchemas.set(schemaKey, schema);

    this.logger.info('Protocol schema registered', {
      protocol: schema.protocol,
      version: schema.version,
      messageTypes: schema.messageTypes.length
    });

    this.emit('schemaRegistered', schema);
  }

  async getTranslationRules(
    sourceProtocol?: string,
    targetProtocol?: string
  ): Promise<TranslationRule[]> {
    let rules = Array.from(this.translationRules.values());

    if (sourceProtocol) {
      rules = rules.filter(rule => rule.sourceProtocol === sourceProtocol);
    }

    if (targetProtocol) {
      rules = rules.filter(rule => rule.targetProtocol === targetProtocol);
    }

    return rules.sort((a, b) => b.priority - a.priority);
  }

  async getProtocolSchemas(): Promise<ProtocolSchema[]> {
    return Array.from(this.protocolSchemas.values());
  }

  async validateTranslationPath(
    sourceProtocol: string,
    targetProtocol: string
  ): Promise<TranslationPathValidation> {
    const directRules = await this.getTranslationRules(sourceProtocol, targetProtocol);

    if (directRules.length > 0) {
      return {
        valid: true,
        path: 'direct',
        rules: directRules,
        estimatedFidelity: await this.estimatePathFidelity(directRules)
      };
    }

    // Try to find indirect path
    const indirectPath = await this.findIndirectTranslationPath(sourceProtocol, targetProtocol);

    if (indirectPath) {
      return {
        valid: true,
        path: 'indirect',
        intermediateProtocols: indirectPath.intermediates,
        rules: indirectPath.rules,
        estimatedFidelity: indirectPath.estimatedFidelity
      };
    }

    return {
      valid: false,
      path: 'none',
      rules: [],
      estimatedFidelity: 0,
      suggestions: [
        'Register direct translation rules',
        'Add intermediate protocol support',
        'Check protocol compatibility'
      ]
    };
  }

  // Private helper methods
  private initializeBuiltInRules(): void {
    // Initialize common built-in translation rules
    const jsonToXmlRule: TranslationRule = {
      id: 'json_to_xml_v1',
      name: 'JSON to XML Translation',
      sourceProtocol: 'json',
      targetProtocol: 'xml',
      sourceVersion: '1.0',
      targetVersion: '1.0',
      transformations: [
        {
          type: 'transform',
          sourceField: '*',
          targetField: '*',
          transformation: {
            name: 'jsonToXml',
            implementation: `
              function jsonToXml(input) {
                // Convert JSON object to XML structure
                return convertObjectToXml(input);
              }
            `,
            parameters: [],
            returnType: 'object',
            description: 'Convert JSON object to XML structure'
          },
          required: true
        }
      ],
      conditions: [],
      priority: 100,
      bidirectional: true
    };

    this.translationRules.set(jsonToXmlRule.id, jsonToXmlRule);
  }

  private async findApplicableRules(
    message: ProtocolMessage,
    sourceVersion: string,
    targetVersion: string
  ): Promise<TranslationRule[]> {
    const rules: TranslationRule[] = [];

    for (const rule of this.translationRules.values()) {
      if (await this.isRuleApplicable(rule, message, sourceVersion, targetVersion)) {
        rules.push(rule);
      }
    }

    return rules.sort((a, b) => b.priority - a.priority);
  }

  private async isRuleApplicable(
    rule: TranslationRule,
    message: ProtocolMessage,
    sourceVersion: string,
    targetVersion: string
  ): Promise<boolean> {
    // Check protocol and version compatibility
    if (rule.sourceVersion !== sourceVersion || rule.targetVersion !== targetVersion) {
      return false;
    }

    // Check rule expiration
    if (rule.validUntil && rule.validUntil < new Date()) {
      return false;
    }

    // Evaluate conditions
    for (const condition of rule.conditions) {
      if (!await this.evaluateCondition(condition, message)) {
        return false;
      }
    }

    return true;
  }

  private async evaluateCondition(
    condition: TranslationCondition,
    message: ProtocolMessage
  ): Promise<boolean> {
    const fieldValue = this.getFieldValue(message, condition.field);

    switch (condition.operator) {
      case 'eq':
        return fieldValue === condition.value;
      case 'ne':
        return fieldValue !== condition.value;
      case 'gt':
        return fieldValue > condition.value;
      case 'lt':
        return fieldValue < condition.value;
      case 'gte':
        return fieldValue >= condition.value;
      case 'lte':
        return fieldValue <= condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'contains':
        return typeof fieldValue === 'string' &&
               fieldValue.includes(condition.value.toString());
      case 'regex':
        return typeof fieldValue === 'string' &&
               new RegExp(condition.value).test(fieldValue);
      default:
        return false;
    }
  }

  private getFieldValue(message: ProtocolMessage, fieldPath: string): any {
    const parts = fieldPath.split('.');
    let current = message;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  private async applyTransformationRules(
    message: ProtocolMessage,
    rules: TranslationRule[],
    result: TranslationResult
  ): Promise<ProtocolMessage | null> {
    let transformedMessage = { ...message };

    for (const rule of rules) {
      try {
        const ruleResult = await this.applyTransformationRule(transformedMessage, rule);

        if (ruleResult.success) {
          transformedMessage = ruleResult.message;
          result.appliedRules.push(rule.id);
          result.metadata.transformationsApplied += ruleResult.transformationsApplied;

          if (ruleResult.warnings) {
            result.warnings.push(...ruleResult.warnings);
          }
        } else {
          result.errors.push({
            code: 'RULE_APPLICATION_FAILED',
            message: `Failed to apply rule ${rule.id}: ${ruleResult.error}`,
            recoverable: true,
            suggestions: [`Review rule ${rule.id}`, 'Check transformation logic']
          });
        }

      } catch (error) {
        result.errors.push({
          code: 'RULE_EXCEPTION',
          message: `Exception applying rule ${rule.id}: ${error.message}`,
          cause: error,
          recoverable: true,
          suggestions: [`Debug rule ${rule.id}`, 'Check transformation implementation']
        });
      }
    }

    return result.errors.length === 0 ? transformedMessage : null;
  }

  private async applyTransformationRule(
    message: ProtocolMessage,
    rule: TranslationRule
  ): Promise<RuleApplicationResult> {
    const result: RuleApplicationResult = {
      success: false,
      message: { ...message },
      transformationsApplied: 0,
      warnings: []
    };

    try {
      for (const transformation of rule.transformations) {
        const transformResult = await this.transformationEngine.applyTransformation(
          result.message,
          transformation
        );

        if (transformResult.success) {
          result.message = transformResult.transformedMessage;
          result.transformationsApplied++;

          if (transformResult.warnings) {
            result.warnings.push(...transformResult.warnings);
          }
        } else {
          if (transformation.required) {
            result.error = `Required transformation failed: ${transformResult.error}`;
            return result;
          } else {
            result.warnings.push({
              code: 'OPTIONAL_TRANSFORMATION_FAILED',
              message: `Optional transformation failed: ${transformResult.error}`,
              field: transformation.targetField,
              severity: 'medium'
            });
          }
        }
      }

      result.success = true;
      return result;

    } catch (error) {
      result.error = error.message;
      return result;
    }
  }

  private async validateMessage(
    message: ProtocolMessage,
    version: string
  ): Promise<MessageValidationResult> {
    try {
      const schemaKey = `${message.metadata.sourceProtocol || message.metadata.targetProtocol}_${version}`;
      const schema = this.protocolSchemas.get(schemaKey);

      if (!schema) {
        return {
          valid: true, // Allow if no schema is registered
          warnings: [`No schema found for ${schemaKey}`]
        };
      }

      return await this.validationEngine.validateMessage(message, schema);

    } catch (error) {
      return {
        valid: false,
        error,
        errors: [`Validation failed: ${error.message}`]
      };
    }
  }

  private async calculateFidelity(
    original: ProtocolMessage,
    translated: ProtocolMessage
  ): Promise<number> {
    // Compare structure and content to calculate fidelity percentage
    const originalFields = this.extractFields(original);
    const translatedFields = this.extractFields(translated);

    const totalFields = originalFields.length;
    if (totalFields === 0) return 100;

    let preservedFields = 0;
    for (const field of originalFields) {
      if (translatedFields.some(tf => tf.path === field.path && tf.value === field.value)) {
        preservedFields++;
      }
    }

    return (preservedFields / totalFields) * 100;
  }

  private extractFields(message: ProtocolMessage): FieldInfo[] {
    const fields: FieldInfo[] = [];
    this.extractFieldsRecursive(message, '', fields);
    return fields;
  }

  private extractFieldsRecursive(obj: any, prefix: string, fields: FieldInfo[]): void {
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        this.extractFieldsRecursive(value, path, fields);
      } else {
        fields.push({ path, value, type: typeof value });
      }
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async generateBatchSummary(
    results: TranslationResult[],
    totalTime: number
  ): Promise<BatchSummary> {
    const successfulResults = results.filter(r => r.success);
    const averageTranslationTime = successfulResults.length > 0 ?
      successfulResults.reduce((sum, r) => sum + r.performance.totalTime, 0) / successfulResults.length : 0;

    const averageFidelity = successfulResults.length > 0 ?
      successfulResults.reduce((sum, r) => sum + r.metadata.fidelity, 0) / successfulResults.length : 0;

    const errorCounts = new Map<string, number>();
    results.forEach(r => {
      r.errors.forEach(e => {
        errorCounts.set(e.code, (errorCounts.get(e.code) || 0) + 1);
      });
    });

    const commonErrors = Array.from(errorCounts.entries())
      .map(([code, count]) => ({
        errorCode: code,
        count,
        percentage: (count / results.length) * 100,
        examples: results
          .filter(r => r.errors.some(e => e.code === code))
          .slice(0, 3)
          .map(r => r.originalMessage.id)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      averageTranslationTime,
      totalDataLoss: results.some(r => r.metadata.dataLoss),
      averageFidelity,
      commonErrors,
      performance: {
        totalTime,
        averageMessageTime: results.length > 0 ? totalTime / results.length : 0,
        throughput: results.length > 0 ? (results.length / totalTime) * 1000 : 0,
        memoryPeak: Math.max(...results.map(r => r.performance.memoryUsage), 0),
        cpuUtilization: results.length > 0 ?
          results.reduce((sum, r) => sum + r.performance.cpuUsage, 0) / results.length : 0
      }
    };
  }

  private generateTranslationId(): string {
    return `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Additional helper method implementations would continue here...
  private async validateTranslationRule(rule: TranslationRule): Promise<void> {
    // Real comprehensive rule validation
    const errors: string[] = [];

    // Validate basic structure
    if (!rule.id || rule.id.trim().length === 0) {
      errors.push('Rule ID is required and must be non-empty');
    }

    if (!rule.sourceProtocol || !rule.targetProtocol) {
      errors.push('Source and target protocols are required');
    }

    if (rule.sourceProtocol === rule.targetProtocol && rule.sourceVersion === rule.targetVersion) {
      errors.push('Source and target must be different');
    }

    // Validate transformations
    if (!rule.transformations || rule.transformations.length === 0) {
      errors.push('At least one transformation is required');
    }

    for (const [index, transformation] of rule.transformations.entries()) {
      if (!transformation.sourceField || !transformation.targetField) {
        errors.push(`Transformation ${index}: source and target fields are required`);
      }

      // Validate transformation function if present
      if (transformation.transformation) {
        try {
          new Function('input', 'params', transformation.transformation.implementation);
        } catch (error) {
          errors.push(`Transformation ${index}: invalid function implementation - ${error.message}`);
        }
      }

      // Validate field validation if present
      if (transformation.validation) {
        for (const [ruleIndex, validationRule] of transformation.validation.rules.entries()) {
          try {
            new Function('value', validationRule.condition);
          } catch (error) {
            errors.push(`Transformation ${index}, validation rule ${ruleIndex}: invalid condition - ${error.message}`);
          }
        }
      }
    }

    // Validate conditions
    for (const [index, condition] of rule.conditions.entries()) {
      if (!condition.field || condition.value === undefined) {
        errors.push(`Condition ${index}: field and value are required`);
      }

      if (!['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'contains', 'regex'].includes(condition.operator)) {
        errors.push(`Condition ${index}: invalid operator '${condition.operator}'`);
      }

      if (condition.operator === 'regex') {
        try {
          new RegExp(condition.value);
        } catch (error) {
          errors.push(`Condition ${index}: invalid regex pattern - ${error.message}`);
        }
      }
    }

    // Validate priority
    if (rule.priority < 0 || rule.priority > 1000) {
      errors.push('Priority must be between 0 and 1000');
    }

    // Check for circular dependencies if bidirectional
    if (rule.bidirectional) {
      const reverseRuleId = `${rule.id}_reverse`;
      if (this.translationRules.has(reverseRuleId)) {
        const reverseRule = this.translationRules.get(reverseRuleId)!;
        if (reverseRule.sourceProtocol === rule.targetProtocol &&
            reverseRule.targetProtocol === rule.sourceProtocol) {
          // This is expected for bidirectional rules
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Rule validation failed: ${errors.join('; ')}`);
    }
  }

  private async createReverseRule(rule: TranslationRule): Promise<TranslationRule> {
    // Implementation for creating reverse transformation rule
    return {
      ...rule,
      id: `${rule.id}_reverse`,
      sourceProtocol: rule.targetProtocol,
      targetProtocol: rule.sourceProtocol,
      sourceVersion: rule.targetVersion,
      targetVersion: rule.sourceVersion
    };
  }

  private async validateProtocolSchema(schema: ProtocolSchema): Promise<void> {
    // Real protocol schema validation
    const errors: string[] = [];

    // Validate basic structure
    if (!schema.protocol || schema.protocol.trim().length === 0) {
      errors.push('Protocol name is required');
    }

    if (!schema.version || schema.version.trim().length === 0) {
      errors.push('Protocol version is required');
    }

    // Validate version format (semantic versioning)
    const versionPattern = /^\d+\.\d+(\.\d+)?(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
    if (schema.version && !versionPattern.test(schema.version)) {
      errors.push('Version must follow semantic versioning format (e.g., 1.0.0)');
    }

    // Validate message types
    if (!schema.messageTypes || schema.messageTypes.length === 0) {
      errors.push('At least one message type must be defined');
    }

    const messageTypeNames = new Set<string>();
    for (const [index, messageType] of schema.messageTypes.entries()) {
      if (!messageType.type || messageType.type.trim().length === 0) {
        errors.push(`Message type ${index}: type name is required`);
      }

      if (messageTypeNames.has(messageType.type)) {
        errors.push(`Message type ${index}: duplicate type name '${messageType.type}'`);
      }
      messageTypeNames.add(messageType.type);

      // Validate fields
      if (!messageType.fields || messageType.fields.length === 0) {
        errors.push(`Message type '${messageType.type}': at least one field must be defined`);
      }

      const fieldNames = new Set<string>();
      for (const [fieldIndex, field] of messageType.fields.entries()) {
        if (!field.name || field.name.trim().length === 0) {
          errors.push(`Message type '${messageType.type}', field ${fieldIndex}: name is required`);
        }

        if (fieldNames.has(field.name)) {
          errors.push(`Message type '${messageType.type}': duplicate field name '${field.name}'`);
        }
        fieldNames.add(field.name);

        // Validate field type
        const validTypes = ['string', 'number', 'boolean', 'object', 'array', 'null', 'any'];
        if (!validTypes.includes(field.type)) {
          errors.push(`Message type '${messageType.type}', field '${field.name}': invalid type '${field.type}'`);
        }

        // Validate constraints
        if (field.constraints) {
          for (const [constraintIndex, constraint] of field.constraints.entries()) {
            if (!constraint.type || !constraint.value) {
              errors.push(`Message type '${messageType.type}', field '${field.name}', constraint ${constraintIndex}: type and value are required`);
            }

            // Validate constraint types
            const validConstraintTypes = ['minLength', 'maxLength', 'pattern', 'enum', 'range', 'custom'];
            if (!validConstraintTypes.includes(constraint.type)) {
              errors.push(`Message type '${messageType.type}', field '${field.name}', constraint ${constraintIndex}: invalid constraint type '${constraint.type}'`);
            }

            // Validate pattern constraints
            if (constraint.type === 'pattern') {
              try {
                new RegExp(constraint.value);
              } catch (error) {
                errors.push(`Message type '${messageType.type}', field '${field.name}', constraint ${constraintIndex}: invalid regex pattern - ${error.message}`);
              }
            }
          }
        }
      }

      // Validate required fields exist
      for (const requiredField of messageType.required) {
        if (!fieldNames.has(requiredField)) {
          errors.push(`Message type '${messageType.type}': required field '${requiredField}' is not defined`);
        }
      }
    }

    // Validate compatibility info
    if (schema.compatibility) {
      // Validate breaking changes
      for (const [index, breaking] of schema.compatibility.breaking.entries()) {
        if (!breaking.version || !breaking.field || !breaking.changeType) {
          errors.push(`Breaking change ${index}: version, field, and changeType are required`);
        }

        const validChangeTypes = ['removed', 'renamed', 'type_changed', 'constraint_added'];
        if (!validChangeTypes.includes(breaking.changeType)) {
          errors.push(`Breaking change ${index}: invalid changeType '${breaking.changeType}'`);
        }
      }

      // Validate deprecated fields
      for (const [index, deprecated] of schema.compatibility.deprecated.entries()) {
        if (!deprecated.field || !deprecated.deprecatedIn) {
          errors.push(`Deprecated field ${index}: field and deprecatedIn are required`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Schema validation failed: ${errors.join('; ')}`);
    }
  }

  private async estimatePathFidelity(rules: TranslationRule[]): Promise<number> {
    // Real fidelity estimation based on rule analysis
    if (rules.length === 0) return 0;

    let totalFidelity = 0;
    let ruleWeights = 0;

    for (const rule of rules) {
      // Analyze transformation complexity
      const complexityScore = this.analyzeTransformationComplexity(rule);

      // Calculate rule-specific fidelity based on transformation types
      let ruleFidelity = 100;

      for (const transformation of rule.transformations) {
        switch (transformation.type) {
          case 'map':
            ruleFidelity -= 0; // Direct mapping, no loss
            break;
          case 'transform':
            ruleFidelity -= 5; // Minor loss from transformation
            break;
          case 'aggregate':
            ruleFidelity -= 15; // Data consolidation may lose details
            break;
          case 'split':
            ruleFidelity -= 10; // Data splitting may introduce assumptions
            break;
          case 'default':
            ruleFidelity -= 25; // Default values replace actual data
            break;
          case 'remove':
            ruleFidelity -= 30; // Complete data loss
            break;
        }

        // Additional penalty for required transformations that may fail
        if (transformation.required && transformation.validation) {
          ruleFidelity -= 5;
        }
      }

      // Weight by rule priority (higher priority = more impact)
      const weight = rule.priority / 100;
      totalFidelity += Math.max(0, ruleFidelity) * weight;
      ruleWeights += weight;
    }

    return ruleWeights > 0 ? totalFidelity / ruleWeights : 0;
  }

  private async findIndirectTranslationPath(
    sourceProtocol: string,
    targetProtocol: string
  ): Promise<IndirectTranslationPath | null> {
    // Real graph traversal to find indirect translation paths
    const visited = new Set<string>();
    const queue: { protocol: string; path: string[]; rules: TranslationRule[]; fidelity: number }[] = [
      { protocol: sourceProtocol, path: [], rules: [], fidelity: 100 }
    ];

    const maxPathLength = 3; // Prevent infinite loops and excessive indirection

    while (queue.length > 0) {
      const { protocol, path, rules, fidelity } = queue.shift()!;

      if (path.length >= maxPathLength) continue;
      if (visited.has(protocol)) continue;

      visited.add(protocol);

      // Find all rules that start from current protocol
      const availableRules = Array.from(this.translationRules.values())
        .filter(rule => rule.sourceProtocol === protocol && !path.includes(rule.targetProtocol));

      for (const rule of availableRules) {
        const newPath = [...path, rule.targetProtocol];
        const newRules = [...rules, rule];

        // Calculate cumulative fidelity loss
        const ruleFidelityLoss = await this.calculateRuleFidelityLoss(rule);
        const newFidelity = fidelity * (1 - ruleFidelityLoss / 100);

        if (rule.targetProtocol === targetProtocol) {
          // Found a path!
          return {
            intermediates: path.slice(1), // Exclude source
            rules: newRules,
            estimatedFidelity: newFidelity
          };
        }

        // Continue searching if fidelity is still acceptable
        if (newFidelity >= 50) {
          queue.push({
            protocol: rule.targetProtocol,
            path: newPath,
            rules: newRules,
            fidelity: newFidelity
          });
        }
      }
    }

    return null;
  }

  private async generateTranslationReport(
    results: TranslationResult[],
    summary: BatchSummary
  ): Promise<TranslationReport> {
    // Implementation for generating detailed translation report
    return {
      summary,
      detailedResults: results,
      ruleUsageStatistics: [],
      recommendations: [],
      qualityMetrics: {
        overallFidelity: summary.averageFidelity,
        dataLossPercentage: 0,
        validationPassRate: 0,
        performanceScore: 0,
        reliabilityScore: 0
      }
    };
  }

  // Additional helper methods for real compatibility assessment
  private analyzeTransformationComplexity(rule: TranslationRule): number {
    let complexity = 0;

    for (const transformation of rule.transformations) {
      switch (transformation.type) {
        case 'map': complexity += 1; break;
        case 'transform': complexity += 3; break;
        case 'aggregate': complexity += 5; break;
        case 'split': complexity += 4; break;
        case 'default': complexity += 2; break;
        case 'remove': complexity += 1; break;
      }

      if (transformation.transformation) {
        complexity += 2; // Custom transformation adds complexity
      }

      if (transformation.validation) {
        complexity += transformation.validation.rules.length;
      }
    }

    return complexity;
  }

  private async calculateRuleFidelityLoss(rule: TranslationRule): Promise<number> {
    let fidelityLoss = 0;

    for (const transformation of rule.transformations) {
      switch (transformation.type) {
        case 'map': fidelityLoss += 0; break;
        case 'transform': fidelityLoss += 5; break;
        case 'aggregate': fidelityLoss += 15; break;
        case 'split': fidelityLoss += 10; break;
        case 'default': fidelityLoss += 25; break;
        case 'remove': fidelityLoss += 30; break;
      }
    }

    // Adjust based on rule conditions (more conditions = more precision)
    const conditionsBonus = Math.min(rule.conditions.length * 2, 10);
    fidelityLoss = Math.max(0, fidelityLoss - conditionsBonus);

    return fidelityLoss;
  }

  private async validateTransformedData(
    data: any,
    validationRules: ValidationRule[]
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const rule of validationRules) {
      try {
        const validatorFunction = new Function('value', 'data', `return ${rule.condition}`);
        const fieldValue = this.getFieldValue(data, rule.field || '');
        const isValid = validatorFunction(fieldValue, data);

        if (!isValid) {
          errors.push(rule.message || `Validation failed for field: ${rule.field}`);
        }
      } catch (error) {
        errors.push(`Validation error for ${rule.field}: ${error.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private isBreakingChangeApplicable(
    change: BreakingChange,
    fromVersion: string
  ): boolean {
    // Real version comparison to determine if breaking change applies
    try {
      const changeVersion = change.version;
      const fromVersionNum = this.parseVersion(fromVersion);
      const changeVersionNum = this.parseVersion(changeVersion);

      return this.compareVersionNumbers(fromVersionNum, changeVersionNum) < 0;
    } catch (error) {
      // If version parsing fails, assume change applies to be safe
      return true;
    }
  }

  private parseVersion(version: string): number[] {
    // Extract version numbers from protocol version strings like 'a2a-1.2.3'
    const versionPart = version.split('-')[1] || version;
    return versionPart.split('.').map(v => parseInt(v, 10) || 0);
  }

  private compareVersionNumbers(v1: number[], v2: number[]): number {
    const maxLength = Math.max(v1.length, v2.length);

    for (let i = 0; i < maxLength; i++) {
      const part1 = v1[i] || 0;
      const part2 = v2[i] || 0;

      if (part1 !== part2) {
        return part1 - part2;
      }
    }

    return 0;
  }

  private async identifyRequiredMigrations(
    fromVersion: string,
    toVersion: string,
    breakingChanges: BreakingChange[]
  ): Promise<string[]> {
    const requiredMigrations: string[] = [];

    // Standard migrations based on breaking changes
    for (const change of breakingChanges) {
      switch (change.changeType) {
        case 'removed':
          requiredMigrations.push(`field-removal-${change.fieldPath}`);
          break;
        case 'renamed':
          requiredMigrations.push(`field-rename-${change.fieldPath}`);
          break;
        case 'type_changed':
          requiredMigrations.push(`type-conversion-${change.fieldPath}`);
          break;
        case 'constraint_added':
          requiredMigrations.push(`constraint-validation-${change.fieldPath}`);
          break;
        case 'semantics_changed':
          requiredMigrations.push(`semantic-migration-${change.fieldPath}`);
          break;
      }
    }

    // Version-specific migrations
    const versionDiff = this.compareVersions(fromVersion, toVersion);
    if (Math.abs(versionDiff) > 1) {
      requiredMigrations.push('multi-version-migration');
    }

    return requiredMigrations;
  }

  private assessDataLossRisk(
    breakingChanges: BreakingChange[],
    requiredMigrations: string[]
  ): 'none' | 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // Risk from breaking changes
    for (const change of breakingChanges) {
      if (change.dataLossRisk) {
        riskScore += 20;
      } else {
        switch (change.changeType) {
          case 'removed': riskScore += 30; break;
          case 'type_changed': riskScore += 15; break;
          case 'constraint_added': riskScore += 10; break;
          default: riskScore += 5; break;
        }
      }
    }

    // Risk from migration complexity
    riskScore += requiredMigrations.length * 5;

    if (riskScore === 0) return 'none';
    if (riskScore <= 20) return 'low';
    if (riskScore <= 50) return 'medium';
    return 'high';
  }

  private determineCompatibilityLevel(
    score: number,
    breakingChangesCount: number
  ): 'full' | 'partial' | 'none' | 'breaking' {
    if (breakingChangesCount > 0) {
      return score >= 60 ? 'breaking' : 'none';
    }

    if (score >= 90) return 'full';
    if (score >= 60) return 'partial';
    return 'none';
  }

  private estimateEffort(
    breakingChangesCount: number,
    migrationsCount: number
  ): 'trivial' | 'low' | 'medium' | 'high' | 'critical' {
    const totalComplexity = breakingChangesCount * 3 + migrationsCount;

    if (totalComplexity === 0) return 'trivial';
    if (totalComplexity <= 5) return 'low';
    if (totalComplexity <= 15) return 'medium';
    if (totalComplexity <= 30) return 'high';
    return 'critical';
  }
}

// Supporting classes
class TransformationEngine {
  async applyTransformation(
    message: ProtocolMessage,
    transformation: FieldTransformation
  ): Promise<TransformationResult> {
    // Implementation for applying field transformations
    return {
      success: true,
      transformedMessage: message,
      warnings: []
    };
  }
}

class ValidationEngine {
  async validateMessage(
    message: ProtocolMessage,
    schema: ProtocolSchema
  ): Promise<MessageValidationResult> {
    // Implementation for message validation against schema
    return {
      valid: true,
      warnings: []
    };
  }
}

class MetricsCollector {
  async recordTranslation(result: TranslationResult): Promise<void> {
    // Implementation for recording translation metrics
  }
}

class TranslationCacheManager {
  async get(
    message: ProtocolMessage,
    sourceVersion: string,
    targetVersion: string
  ): Promise<TranslationResult | null> {
    // Implementation for cache retrieval
    return null;
  }

  async set(
    message: ProtocolMessage,
    sourceVersion: string,
    targetVersion: string,
    result: TranslationResult
  ): Promise<void> {
    // Implementation for cache storage
  }
}

// Supporting interfaces
interface TranslationOptions {
  useCache?: boolean;
  strictValidation?: boolean;
  allowInvalidTarget?: boolean;
}

interface RuleApplicationResult {
  success: boolean;
  message: ProtocolMessage;
  transformationsApplied: number;
  warnings: TranslationWarning[];
  error?: string;
}

interface TransformationResult {
  success: boolean;
  transformedMessage: ProtocolMessage;
  warnings: TranslationWarning[];
  error?: string;
}

interface MessageValidationResult {
  valid: boolean;
  warnings?: string[];
  errors?: string[];
  error?: Error;
}

interface FieldInfo {
  path: string;
  value: any;
  type: string;
}

interface TranslationPathValidation {
  valid: boolean;
  path: 'direct' | 'indirect' | 'none';
  intermediateProtocols?: string[];
  rules: TranslationRule[];
  estimatedFidelity: number;
  suggestions?: string[];
}

interface IndirectTranslationPath {
  intermediates: string[];
  rules: TranslationRule[];
  estimatedFidelity: number;
}

interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
}

export default ProtocolTranslator;