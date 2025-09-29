/**
 * QueenFSMTypes - Auto-generated type definitions
 * TODO: Define proper types
 */
export interface QueenFSMTypesConfig {
    [key: string]: any;
}
export interface QueenFSMTypesState {
    [key: string]: any;
}
export interface QueenFSMTypesResult {
    success: boolean;
    data?: any;
    error?: string;
}
export declare enum QueenFSMTypesStatus {
    IDLE = "IDLE",
    ACTIVE = "ACTIVE",
    COMPLETE = "COMPLETE",
    ERROR = "ERROR"
}
export type QueenFSMTypesType = any;
declare const _default: {
    QueenFSMTypesStatus: typeof QueenFSMTypesStatus;
};
export default _default;
export interface PrincessDomain {
    [key: string]: any;
}
export interface QueenState {
    [key: string]: any;
}
export interface QueenEvent {
    [key: string]: any;
}
export interface QueenCommandType {
    [key: string]: any;
}
