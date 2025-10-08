/**
 * Dependency Injection Type Identifiers
 * Centralized type definitions for all quality gate components
 * Ensures type safety and prevents naming conflicts
 */

export const TYPES = {
  // Core Event System
  EventBus: Symbol.for('EventBus'),

  // Gate Registry System
  GateRegistry: Symbol.for('GateRegistry'),
  GateValidator: Symbol.for('GateValidator'),
  GateMetadataManager: Symbol.for('GateMetadataManager'),
  GateStorage: Symbol.for('GateStorage'),
  GateCache: Symbol.for('GateCache'),
  GateEventEmitter: Symbol.for('GateEventEmitter'),

  // Sequence Management
  SequenceEngine: Symbol.for('SequenceEngine'),
  SequenceValidator: Symbol.for('SequenceValidator'),
  SequenceStorage: Symbol.for('SequenceStorage'),

  // Execution Management
  ExecutionManager: Symbol.for('ExecutionManager'),
  ExecutionEngine: Symbol.for('ExecutionEngine'),
  ExecutionTracker: Symbol.for('ExecutionTracker'),
  ExecutionStorage: Symbol.for('ExecutionStorage'),

  // Processing Engines
  ValidationEngine: Symbol.for('ValidationEngine'),
  MeasurementEngine: Symbol.for('MeasurementEngine'),
  ReportingEngine: Symbol.for('ReportingEngine'),
  AnalysisEngine: Symbol.for('AnalysisEngine'),

  // State Machines
  GateStateMachine: Symbol.for('GateStateMachine'),
  SequenceStateMachine: Symbol.for('SequenceStateMachine'),
  GateStateMachineFactory: Symbol.for('GateStateMachineFactory'),
  SequenceStateMachineFactory: Symbol.for('SequenceStateMachineFactory'),

  // Monitoring and Health
  MonitoringService: Symbol.for('MonitoringService'),
  HealthCheckService: Symbol.for('HealthCheckService'),
  PerformanceMonitor: Symbol.for('PerformanceMonitor'),
  MetricsCollector: Symbol.for('MetricsCollector'),

  // External Integrations
  DashboardService: Symbol.for('DashboardService'),
  NotificationService: Symbol.for('NotificationService'),
  AuditService: Symbol.for('AuditService'),

  // Configuration and Context
  ConfigurationManager: Symbol.for('ConfigurationManager'),
  ContextProvider: Symbol.for('ContextProvider'),
  EnvironmentProvider: Symbol.for('EnvironmentProvider'),

  // Validation Tools
  TypeScriptValidator: Symbol.for('TypeScriptValidator'),
  TestValidator: Symbol.for('TestValidator'),
  SecurityValidator: Symbol.for('SecurityValidator'),
  PerformanceValidator: Symbol.for('PerformanceValidator'),
  ComplianceValidator: Symbol.for('ComplianceValidator'),

  // Measurement Tools
  CoverageMeasurer: Symbol.for('CoverageMeasurer'),
  PerformanceMeasurer: Symbol.for('PerformanceMeasurer'),
  SecurityMeasurer: Symbol.for('SecurityMeasurer'),
  QualityMeasurer: Symbol.for('QualityMeasurer'),

  // Reporting Components
  ReportGenerator: Symbol.for('ReportGenerator'),
  ReportDistributor: Symbol.for('ReportDistributor'),
  DashboardUpdater: Symbol.for('DashboardUpdater'),

  // Storage Providers
  FileStorage: Symbol.for('FileStorage'),
  DatabaseStorage: Symbol.for('DatabaseStorage'),
  MemoryStorage: Symbol.for('MemoryStorage'),
  CloudStorage: Symbol.for('CloudStorage'),

  // Cache Providers
  MemoryCache: Symbol.for('MemoryCache'),
  RedisCache: Symbol.for('RedisCache'),
  FileCache: Symbol.for('FileCache'),

  // Main Orchestrator
  QualityGateOrchestrator: Symbol.for('QualityGateOrchestrator'),
  QualityGateOrchestratorV2: Symbol.for('QualityGateOrchestratorV2'),

  // Migration Components
  MigrationOrchestrator: Symbol.for('MigrationOrchestrator'),
  FeatureFlagManager: Symbol.for('FeatureFlagManager'),
  BackwardCompatibilityLayer: Symbol.for('BackwardCompatibilityLayer'),

  // Factories
  ValidationEngineFactory: Symbol.for('ValidationEngineFactory'),
  MeasurementEngineFactory: Symbol.for('MeasurementEngineFactory'),
  ReportingEngineFactory: Symbol.for('ReportingEngineFactory'),

  // Utilities
  Logger: Symbol.for('Logger'),
  Timer: Symbol.for('Timer'),
  IdGenerator: Symbol.for('IdGenerator'),
  JsonSerializer: Symbol.for('JsonSerializer'),
  XmlSerializer: Symbol.for('XmlSerializer'),

  // Security
  AuthenticationService: Symbol.for('AuthenticationService'),
  AuthorizationService: Symbol.for('AuthorizationService'),
  EncryptionService: Symbol.for('EncryptionService'),

  // Concurrency
  ThreadPoolExecutor: Symbol.for('ThreadPoolExecutor'),
  AsyncQueue: Symbol.for('AsyncQueue'),
  Semaphore: Symbol.for('Semaphore'),

  // Error Handling
  ErrorHandler: Symbol.for('ErrorHandler'),
  RetryPolicy: Symbol.for('RetryPolicy'),
  CircuitBreaker: Symbol.for('CircuitBreaker'),

  // Resource Management
  ResourcePool: Symbol.for('ResourcePool'),
  ConnectionPool: Symbol.for('ConnectionPool'),
  MemoryManager: Symbol.for('MemoryManager')
};

// Type groups for easier management
export const TYPE_GROUPS = {
  CORE: [
    TYPES.EventBus,
    TYPES.GateRegistry,
    TYPES.SequenceEngine,
    TYPES.ExecutionManager
  ],

  ENGINES: [
    TYPES.ValidationEngine,
    TYPES.MeasurementEngine,
    TYPES.ReportingEngine,
    TYPES.AnalysisEngine
  ],

  STATE_MACHINES: [
    TYPES.GateStateMachine,
    TYPES.SequenceStateMachine,
    TYPES.GateStateMachineFactory,
    TYPES.SequenceStateMachineFactory
  ],

  STORAGE: [
    TYPES.GateStorage,
    TYPES.SequenceStorage,
    TYPES.ExecutionStorage,
    TYPES.FileStorage,
    TYPES.DatabaseStorage,
    TYPES.MemoryStorage,
    TYPES.CloudStorage
  ],

  CACHE: [
    TYPES.GateCache,
    TYPES.MemoryCache,
    TYPES.RedisCache,
    TYPES.FileCache
  ],

  MONITORING: [
    TYPES.MonitoringService,
    TYPES.HealthCheckService,
    TYPES.PerformanceMonitor,
    TYPES.MetricsCollector
  ],

  VALIDATION_TOOLS: [
    TYPES.TypeScriptValidator,
    TYPES.TestValidator,
    TYPES.SecurityValidator,
    TYPES.PerformanceValidator,
    TYPES.ComplianceValidator
  ],

  MEASUREMENT_TOOLS: [
    TYPES.CoverageMeasurer,
    TYPES.PerformanceMeasurer,
    TYPES.SecurityMeasurer,
    TYPES.QualityMeasurer
  ],

  UTILITIES: [
    TYPES.Logger,
    TYPES.Timer,
    TYPES.IdGenerator,
    TYPES.JsonSerializer,
    TYPES.XmlSerializer
  ]
};

// Environment-specific type configurations
export const ENVIRONMENT_TYPES = {
  DEVELOPMENT: {
    // Use mock implementations
    validator: TYPES.GateValidator,
    storage: TYPES.MemoryStorage,
    cache: TYPES.MemoryCache,
    monitoring: TYPES.MonitoringService
  },

  TESTING: {
    // Use lightweight implementations
    validator: TYPES.GateValidator,
    storage: TYPES.MemoryStorage,
    cache: TYPES.MemoryCache,
    monitoring: TYPES.MonitoringService
  },

  PRODUCTION: {
    // Use production implementations
    validator: TYPES.GateValidator,
    storage: TYPES.DatabaseStorage,
    cache: TYPES.RedisCache,
    monitoring: TYPES.MonitoringService
  }
};

// Feature flags for conditional binding
export const FEATURE_FLAGS = {
  ENABLE_CACHING: 'enable_caching',
  ENABLE_PERSISTENCE: 'enable_persistence',
  ENABLE_MONITORING: 'enable_monitoring',
  ENABLE_SECURITY: 'enable_security',
  ENABLE_PERFORMANCE_TRACKING: 'enable_performance_tracking',
  ENABLE_AUDIT_LOGGING: 'enable_audit_logging'
};

// Configuration keys
export const CONFIG_KEYS = {
  CACHE_TTL: 'cache.ttl',
  CACHE_MAX_SIZE: 'cache.maxSize',
  STORAGE_CONNECTION_STRING: 'storage.connectionString',
  MONITORING_INTERVAL: 'monitoring.interval',
  VALIDATION_LEVEL: 'validation.level',
  EXECUTION_TIMEOUT: 'execution.timeout',
  RETRY_MAX_ATTEMPTS: 'retry.maxAttempts',
  RETRY_DELAY: 'retry.delay'
};

// Binding tags for tagged bindings
export const BINDING_TAGS = {
  ENVIRONMENT: 'environment',
  FEATURE: 'feature',
  PRIORITY: 'priority',
  LIFECYCLE: 'lifecycle',
  SCOPE: 'scope'
};

// Binding names for named bindings
export const BINDING_NAMES = {
  // Storage implementations
  MEMORY_STORAGE: 'memory',
  FILE_STORAGE: 'file',
  DATABASE_STORAGE: 'database',
  CLOUD_STORAGE: 'cloud',

  // Cache implementations
  MEMORY_CACHE: 'memory',
  REDIS_CACHE: 'redis',
  FILE_CACHE: 'file',

  // Validation implementations
  STRICT_VALIDATOR: 'strict',
  LENIENT_VALIDATOR: 'lenient',
  MODERATE_VALIDATOR: 'moderate',

  // Execution strategies
  SEQUENTIAL_EXECUTION: 'sequential',
  PARALLEL_EXECUTION: 'parallel',
  ADAPTIVE_EXECUTION: 'adaptive'
};

// Type validation helpers
export class TypeValidator {
  static isValidType(type: symbol): boolean {
    return Object.values(TYPES).includes(type);
  }

  static isCoreType(type: symbol): boolean {
    return TYPE_GROUPS.CORE.includes(type);
  }

  static isEngineType(type: symbol): boolean {
    return TYPE_GROUPS.ENGINES.includes(type);
  }

  static isStorageType(type: symbol): boolean {
    return TYPE_GROUPS.STORAGE.includes(type);
  }

  static isCacheType(type: symbol): boolean {
    return TYPE_GROUPS.CACHE.includes(type);
  }

  static getTypeGroup(type: symbol): string | null {
    for (const [groupName, types] of Object.entries(TYPE_GROUPS)) {
      if (types.includes(type)) {
        return groupName;
      }
    }
    return null;
  }
}

// Type metadata for documentation and debugging
export const TYPE_METADATA = new Map<symbol, {
  name: string;
  description: string;
  group: string;
  required: boolean;
  singleton: boolean;
}>([
  [TYPES.EventBus, {
    name: 'EventBus',
    description: 'Central event communication hub',
    group: 'CORE',
    required: true,
    singleton: true
  }],
  [TYPES.GateRegistry, {
    name: 'GateRegistry',
    description: 'Registry for quality gate definitions',
    group: 'CORE',
    required: true,
    singleton: true
  }],
  [TYPES.SequenceEngine, {
    name: 'SequenceEngine',
    description: 'Engine for managing gate sequences',
    group: 'CORE',
    required: true,
    singleton: true
  }],
  [TYPES.ExecutionManager, {
    name: 'ExecutionManager',
    description: 'Manages gate execution lifecycle',
    group: 'CORE',
    required: true,
    singleton: true
  }],
  [TYPES.ValidationEngine, {
    name: 'ValidationEngine',
    description: 'Engine for validation operations',
    group: 'ENGINES',
    required: true,
    singleton: true
  }],
  [TYPES.MeasurementEngine, {
    name: 'MeasurementEngine',
    description: 'Engine for measurement operations',
    group: 'ENGINES',
    required: true,
    singleton: true
  }],
  [TYPES.ReportingEngine, {
    name: 'ReportingEngine',
    description: 'Engine for reporting operations',
    group: 'ENGINES',
    required: true,
    singleton: true
  }]
]);

// Helper function to get type metadata
export function getTypeMetadata(type: symbol) {
  return TYPE_METADATA.get(type);
}

