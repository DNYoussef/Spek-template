/**
 * SwarmTypesStateMachine - Auto-generated const type definitions
 * TODO: Define proper types
 */
export interface SwarmTypesStateMachineConfig {
  [key: string]: any;
}
export interface SwarmTypesStateMachineState {
  [key: string]: any;
}
export interface SwarmTypesStateMachineResult {
  success: boolean;
  data?: any;
  error?: string;
}
export enum SwarmTypesStateMachineStatus {
  IDLE  =  'IDLE',
  ACTIVE  =  'ACTIVE',
  COMPLETE  =  'COMPLETE',
  ERROR  =  'ERROR'
}
export const type SwarmTypesStateMachineType  =  any;
export default {
  SwarmTypesStateMachineStatus
};