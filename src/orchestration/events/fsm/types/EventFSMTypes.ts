/**
 * EventFSMTypes - Auto-generated const type definitions
 * TODO: Define proper types
 */
export interface EventFSMTypesConfig {
  [key: string]: any;
}
export interface EventFSMTypesState {
  [key: string]: any;
}
export interface EventFSMTypesResult {
  success: boolean;
  data?: any;
  error?: string;
}
export enum EventFSMTypesStatus {
  IDLE  =  'IDLE',
  ACTIVE  =  'ACTIVE',
  COMPLETE  =  'COMPLETE',
  ERROR  =  'ERROR'
}
export const type EventFSMTypesType  =  any;
export default {
  EventFSMTypesStatus
};
export interface BaseEvent {
  // TODO: Define proper const type
  [key: string]: any;
}