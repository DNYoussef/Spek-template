/**
 * ConfigTypes - Unified Configuration Type System
 * Replaces massive 1,029-line god object with focused, composable types
 *
 * NASA Rule 10: Bounded type definitions, focused interfaces
 * FSM-First: Types designed for state machine lifecycle
 */

// Core FSM Types
export enum ConfigState {
    IDLE = 'idle',
    LOADING = 'loading',
    VALIDATING = 'validating',
    MERGING = 'merging',
    WATCHING = 'watching',
    RELOADING = 'reloading',
    ERROR = 'error'
}

export enum ConfigEvent {
    LOAD = 'load',
    VALIDATE = 'validate',
    MERGE = 'merge',
    WATCH = 'watch',
    RELOAD = 'reload',
    ERROR = 'error',
    RESET = 'reset'
}

// Configuration Context
export interface ConfigContext {
    currentState: ConfigState;
    config: any;
    rawConfigs?: any[];
    sources: string[];
    errors: string[];
    watchers: Map<string, any>;
}

// Transition Types
export interface StateTransition {
    fromState: ConfigState;
    event: ConfigEvent;
    toState: ConfigState;
    handler: (context: ConfigContext) => Promise<boolean>;
    guard?: TransitionGuard;
}

export type TransitionGuard = (context: ConfigContext) => boolean;

// Configuration Source Types
export interface ConfigSource {
    type: 'file' | 'env' | 'remote' | 'database';
    path: string;
    priority: number;
    required: boolean;
    encoding?: string;
}

// Validation Types
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    score?: number;
}

export interface ValidationRule {
    name: string;
    type: 'required' | 'type' | 'range' | 'pattern' | 'custom';
    condition: any;
    message: string;
}

// Merge Strategy Types
export interface MergeStrategy {
    type: 'deep' | 'shallow' | 'replace' | 'array_concat' | 'custom';
    resolver?: (base: any, override: any, key: string) => any;
}

// Watch Types
export interface WatchConfig {
    source: string;
    debounceMs: number;
    recursive: boolean;
    filters?: string[];
}

// Core Configuration Interfaces (decomposed from massive god object)
export interface AnalysisConfig {
    enabled: boolean;
    rules: AnalysisRules;
    thresholds: AnalysisThresholds;
    output: OutputConfig;
}

export interface AnalysisRules {
    position: boolean;
    meaning: boolean;
    algorithm: boolean;
    execution: boolean;
    timing: boolean;
}

export interface AnalysisThresholds {
    maxParameters: number;
    maxMethods: number;
    maxNesting: number;
    maxLines: number;
}

export interface OutputConfig {
    formats: string[];
    destination: string;
    compression: boolean;
}

// Migration Configuration (decomposed)
export interface MigrationConfig {
    phases: MigrationPhase[];
    timeline: TimelineConfig;
    resources: ResourceConfig;
    validation: ValidationConfig;
}

export interface MigrationPhase {
    id: string;
    name: string;
    duration: string;
    dependencies: string[];
    deliverables: string[];
}

export interface TimelineConfig {
    startDate: Date;
    endDate: Date;
    milestones: Milestone[];
    criticalPath: string[];
}

export interface ResourceConfig {
    human: ResourceAllocation[];
    technical: ResourceAllocation[];
    financial: ResourceAllocation[];
}

export interface ValidationConfig {
    rules: ValidationRule[];
    gates: QualityGate[];
    reporting: ReportConfig;
}

// Focused supporting interfaces
export interface Milestone {
    id: string;
    name: string;
    date: Date;
    type: string;
    criteria: string[];
}

export interface ResourceAllocation {
    type: string;
    quantity: number;
    duration: string;
    cost: number;
}

export interface QualityGate {
    name: string;
    criteria: string[];
    threshold: number;
    blocking: boolean;
}

export interface ReportConfig {
    frequency: string;
    recipients: string[];
    format: string;
    template: string;
}