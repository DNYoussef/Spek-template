/**
 * FSMTypes - Auto-generated type definitions
 * TODO: Define proper types
 */
export interface FSMTypesConfig {
  [key: string]: any;
}
export interface FSMTypesState {
  [key: string]: any;
}
export interface FSMTypesResult {
  success: boolean;
  data?: any;
  error?: string;
}
export enum FSMTypesStatus {
  IDLE  =  'IDLE',
  ACTIVE  =  'ACTIVE',
  COMPLETE  =  'COMPLETE',
  ERROR  =  'ERROR'
}
export type FSMTypesType = any;
export default {
  FSMTypesStatus
};
export interface FSMContext {
  // TODO: Define proper type
  [key: string]: any;
}
export interface TransitionDefinition {
  // TODO: Define proper type
  [key: string]: any;
}
export interface StateDefinition {
  // TODO: Define proper type
  [key: string]: any;
}
export interface TransitionGuard {
  // TODO: Define proper type
  [key: string]: any;
}