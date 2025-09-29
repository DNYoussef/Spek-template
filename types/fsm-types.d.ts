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
export declare enum FsmTypesStatus {
    IDLE = "IDLE",
    ACTIVE = "ACTIVE",
    COMPLETE = "COMPLETE",
    ERROR = "ERROR"
}
export type FsmTypesType = any;
declare const _default: {
    FsmTypesStatus: typeof FsmTypesStatus;
};
export default _default;
export interface StateDefinition {
    [key: string]: any;
}
export interface TransitionDefinition {
    [key: string]: any;
}
export interface FSMConfig {
    [key: string]: any;
}
