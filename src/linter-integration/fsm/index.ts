/**
 * FSM-Based Linter Integration API - Export Module
 * NASA Rule 10 Compliant: Clean exports with proper documentation
 */

// Core State Machine Components
export { StateMachine } from './IntegrationApiStateMachine';
export {
  ApiServerState,
  RequestState,
  WebSocketState,
  AuthState,
  RateLimitState,
  ApiEvent,
  ApiContext,
  RequestContext,
  WebSocketContext,
  AuthenticationContext,
  RateLimitInfo,
  StateHandler,
  StateGuard,
  StateMachineConfig,
  StateMetrics,
  TransitionMetrics,
  ErrorRecoveryConfig,
  isApiServerState,
  isRequestState,
  isWebSocketState,
  isAuthState,
  isRateLimitState,
  isApiEvent
} from './IntegrationApiStates';

// Specialized State Machines
export { WebSocketStateMachine } from './WebSocketStateMachine';
export { AuthenticationStateMachine } from './AuthenticationStateMachine';

// API Components
export {
  HealthCheckHandler,
  StatusCheckHandler,
  LintExecutionHandler,
  LintResultsHandler,
  ToolsListHandler,
  ToolStatusHandler,
  ToolExecutionHandler,
  ApiRequest,
  ApiResponse
} from './ApiEndpointHandlers';

// Main Facade
export { IntegrationApiFacade } from './IntegrationApiFacade';

// Factory function for easy setup
export function createIntegrationApi(
  ingestionEngine: any,
  toolManager: any,
  correlationFramework: any,
  port: number = 3000
) {
  return new IntegrationApiFacade(
    ingestionEngine,
    toolManager,
    correlationFramework,
    port
  );
}

/*
 * CODEX AGENT 036 - FSM Module Exports
 * Status: OK | NASA Rule 10 Compliant
 * Run ID: integration-api-exports-008
 * Created: 2025-09-28T12:03:12-04:00
 */