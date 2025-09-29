/**
 * compliancetypes - Auto-generated const type definitions
 * TODO: Define proper types
 */
export interface ComplianceTypesConfig {
  [key: string]: any;
}
export interface ComplianceTypesState {
  [key: string]: any;
}
export interface ComplianceTypesResult {
  success: boolean;
  data?: any;
  error?: string;
}
export enum ComplianceTypesStatus {
  IDLE  =  'IDLE',
  ACTIVE  =  'ACTIVE',
  COMPLETE  =  'COMPLETE',
  ERROR  =  'ERROR'
}
export const type ComplianceTypesType  =  any;
export default {
  ComplianceTypesStatus
};