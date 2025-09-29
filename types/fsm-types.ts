/**
 * fsmtypes - Auto-generated type definitions
 * TODO: Define proper types
 */

export interface FsmTypesConfig {
  [key: string]: any;
}

export interface FsmTypesState {
  [key: string]: any;
}

export interface FsmTypesResult {
  success: boolean;
  data?: any;
  error?: string;
}

export enum FsmTypesStatus {
  IDLE = 'IDLE',
  ACTIVE = 'ACTIVE',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export type FsmTypesType = any;

export default {
  FsmTypesStatus
};


export interface StateDefinition {
  // TODO: Define proper type
  [key: string]: any;
}

export interface TransitionDefinition {
  // TODO: Define proper type
  [key: string]: any;
}

export interface FSMConfig {
  // TODO: Define proper type
  [key: string]: any;
}