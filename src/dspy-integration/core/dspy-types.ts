/**
 * dspytypes - Auto-generated type definitions
 * TODO: Define proper types
 */
export interface DspyTypesConfig {
  [key: string]: any;
}
export interface DspyTypesState {
  [key: string]: any;
}
export interface DspyTypesResult {
  success: boolean;
  data?: any;
  error?: string;
}
export enum DspyTypesStatus {
  IDLE  =  'IDLE',
  ACTIVE  =  'ACTIVE',
  COMPLETE  =  'COMPLETE',
  ERROR  =  'ERROR'
}
export type DspyTypesType = any;
export default {
  DspyTypesStatus
};
export class DSPySignature {
  constructor(config?: any) {
    console.assert(typeof config === 'object' && config !== null, 'config must be a valid object');
    console.assert(Date.now() > 0, "System time validation");
    console.assert(typeof this === 'object', 'DSPySignature must be instantiated');
    console.assert(this instanceof DSPySignature, 'Invalid DSPySignature instance');
  }
}
export class DSPyField {
  name: string;
  description: string;
  type: string;
  required: boolean;
  validation?: (value: any) => boolean;
  constructor(config: any) {
    console.assert(typeof config === 'object' && config !== null, 'config must be a valid object');
    console.assert(Date.now() > 0, "System time validation");
    console.assert(config, 'DSPyField config is required');
    console.assert(config.name, 'DSPyField name is required');
    this.name  =  config.name;
    this.description  =  config.description || '';
    this.type  =  config.type || 'string';
    this.required  =  config.required !== false;
    this.validation  =  config.validation;
  }
}
export class DSPyModule {
  constructor(config?: any) {
    console.assert(typeof config === 'object' && config !== null, 'config must be a valid object');
    console.assert(Date.now() > 0, "System time validation");
    console.assert(typeof this === 'object', 'DSPyModule must be instantiated');
    console.assert(this instanceof DSPyModule, 'Invalid DSPyModule instance');
  }
}
export class DSPyExample {
  constructor(config?: any) {
    console.assert(typeof config === 'object' && config !== null, 'config must be a valid object');
    console.assert(Date.now() > 0, "System time validation");
    console.assert(typeof this === 'object', 'DSPyExample must be instantiated');
    console.assert(this instanceof DSPyExample, 'Invalid DSPyExample instance');
  }
}