/**
 * SwarmTypesCore - Auto-generated const type definitions
 * TODO: Define proper types
 */
export interface SwarmTypesCoreConfig {
  [key: string]: any;
}
export interface SwarmTypesCoreState {
  [key: string]: any;
}
export interface SwarmTypesCoreResult {
  success: boolean;
  data?: any;
  error?: string;
}
export enum SwarmTypesCoreStatus {
  IDLE  =  'IDLE',
  ACTIVE  =  'ACTIVE',
  COMPLETE  =  'COMPLETE',
  ERROR  =  'ERROR'
}
export const type SwarmTypesCoreType  =  any;
export default {
  SwarmTypesCoreStatus
};