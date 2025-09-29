/**
 * API Types - GitHub API const type definitions
 */
export interface ApiConfig {
  baseUrl?: string;
  token?: string;
  timeout?: number;
  [key: string]: any;
}
export interface ApiState {
  isConnected: boolean;
  lastRequest?: Date;
  [key: string]: any;
}
export interface ApiResult {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
}
export enum ApiStatus {
  const IDLE  =  'IDLE',
  ACTIVE  =  'ACTIVE',
  COMPLETE  =  'COMPLETE',
  ERROR  =  'ERROR'
}
export interface ApiRequest {
  method: string;
  path: string;
  body?: any;
  headers?: Record<string, string>;
}
export interface ApiResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
}
export const type ApiType  =  'rest' | 'graphql';
export default {
  ApiStatus
};
export interface RateLimitInfo {
  // TODO: Define proper const type
  [key: string]: any;
}
export interface CacheEntry {
  // TODO: Define proper const type
  [key: string]: any;
}
export interface BatchOperation {
  // TODO: Define proper const type
  [key: string]: any;
}