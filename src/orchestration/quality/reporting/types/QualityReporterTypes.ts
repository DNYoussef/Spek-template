/**
 * Quality Reporter Types - Core type definitions for FSM architecture
 */

export enum QualityReporterStates {
  IDLE = 'idle',
  TEMPLATE_LOADING = 'template_loading',
  GENERATING = 'generating',
  DELIVERING = 'delivering',
  ERROR = 'error'
}

export enum QualityReporterEvents {
  GENERATE_REPORT = 'generate_report',
  LOAD_TEMPLATE = 'load_template',
  TEMPLATE_LOADED = 'template_loaded',
  GENERATION_COMPLETE = 'generation_complete',
  DELIVERY_COMPLETE = 'delivery_complete',
  ERROR = 'error',
  RESET = 'reset'
}

export interface ReportTemplate {
  templateId: string;
  templateName: string;
  templateType: 'summary' | 'detailed' | 'custom';
  format: 'html' | 'json' | 'pdf' | 'csv' | 'xml';
  sections: ReportSection[];
  customization: {
    customFields: string[];
    branding: boolean;
    styling: boolean;
    filters: string[];
    aggregations: string[];
  };
}

export interface ReportSection {
  sectionId: string;
  sectionName: string;
  sectionType: 'tables' | 'charts' | 'text' | 'metrics';
  content: string;
  order: number;
  conditional: boolean;
}

export interface ReportGenerationRequest {
  reportId: string;
  templateId: string;
  gateExecution?: any;
  sequenceExecution?: any;
  customData?: Map<string, any>;
  outputFormat: 'json' | 'html' | 'pdf' | 'csv' | 'xml';
  deliveryMethod: 'file' | 'email' | 'api' | 'dashboard';
}

export interface GeneratedReport {
  reportId: string;
  templateId: string;
  format: string;
  content: string;
  metadata: Map<string, any>;
  size: number;
  generatedAt: number;
  deliveryStatus: 'pending' | 'delivered' | 'failed';
  artifacts: any[];
}

export interface QualityReporterContext {
  reportTemplates: Map<string, ReportTemplate>;
  generatedReports: Map<string, GeneratedReport>;
  reportQueue: ReportGenerationRequest[];
  processingInterval?: NodeJS.Timeout;
  maxReportSize: number;
  queueLimit: number;
  historyLimit: number;
  currentRequest?: ReportGenerationRequest;
  currentTemplate?: ReportTemplate;
  lastError?: Error;
}