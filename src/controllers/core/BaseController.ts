/**
 * Base FSM Controller
 * Unified base class for all controllers - eliminates god objects
 */

import { EventEmitter } from 'events';
import { ControllerTransitionHub } from './ControllerTransitionHub';
import {
  UnifiedControllerState,
  UnifiedControllerEvent,
  ControllerRequest,
  ControllerResponse,
  ControllerContext,
  ControllerError,
  RequestValidator,
  RequestProcessor,
  ResponseBuilder,
  MetricsCollector,
  ControllerLogger,
  StateHandler
} from './ControllerFSMTypes';

import { UnifiedRequestValidator } from '../components/RequestValidator';
import { UnifiedResponseBuilder } from '../components/ResponseBuilder';
import { UnifiedMetricsCollector } from '../components/MetricsCollector';
import { UnifiedControllerLogger } from '../components/ControllerLogger';

export abstract class BaseController extends EventEmitter {
  protected transitionHub: ControllerTransitionHub;
  protected validator: RequestValidator;
  protected responseBuilder: ResponseBuilder;
  protected metricsCollector: MetricsCollector;
  protected logger: ControllerLogger;
  protected controllerId: string;

  constructor(controllerId: string) {
    super();
    this.controllerId = controllerId;
    this.transitionHub = new ControllerTransitionHub();
    this.validator = new UnifiedRequestValidator();
    this.responseBuilder = new UnifiedResponseBuilder();
    this.metricsCollector = new UnifiedMetricsCollector();
    this.logger = new UnifiedControllerLogger(controllerId);

    this.initializeStateHandlers();
    this.setupEventListeners();
  }

  /**
   * Main request handling method
   */
  async handleRequest(request: ControllerRequest): Promise<ControllerResponse> {
    this.logger.logRequest(request);
    this.metricsCollector.recordRequest(request);

    const context = this.transitionHub.createContext(request.id, {
      request,
      metadata: { controllerId: this.controllerId }
    });

    try {
      // Start the FSM workflow
      await this.transitionHub.transition(request.id, UnifiedControllerEvent.START);

      // Process through FSM states
      await this.processRequest(context);

      // Get final response
      const response = context.response || this.responseBuilder.buildError({
        code: 'NO_RESPONSE_GENERATED',
        message: 'No response was generated during processing'
      }, request.id);

      this.logger.logResponse(response);
      this.metricsCollector.recordResponse(response);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      const controllerError: ControllerError = {
        code: 'REQUEST_PROCESSING_FAILED',
        message: `Request processing failed: ${errorMessage}`,
        details: { error },
        stack: errorStack
      };

      this.logger.logError(controllerError);

      const errorResponse = this.responseBuilder.buildError(controllerError, request.id);
      this.metricsCollector.recordResponse(errorResponse);

      return errorResponse;
    } finally {
      this.transitionHub.cleanupContext(request.id);
    }
  }

  /**
   * Process request through FSM states
   */
  private async processRequest(context: ControllerContext): Promise<void> {
    // Validation state
    if (context.currentState === UnifiedControllerState.VALIDATING) {
      await this.transitionHub.handleEvent(context.requestId, UnifiedControllerEvent.VALIDATE);
    }

    // Processing state
    if (context.currentState === UnifiedControllerState.PROCESSING) {
      await this.transitionHub.handleEvent(context.requestId, UnifiedControllerEvent.PROCESS);
    }

    // Responding state
    if (context.currentState === UnifiedControllerState.RESPONDING) {
      await this.transitionHub.handleEvent(context.requestId, UnifiedControllerEvent.RESPOND);
    }

    // Logging state
    if (context.currentState === UnifiedControllerState.LOGGING) {
      await this.transitionHub.handleEvent(context.requestId, UnifiedControllerEvent.LOG);
    }
  }

  /**
   * Initialize state handlers for the FSM
   */
  private initializeStateHandlers(): void {
    // Validation state handler
    this.transitionHub.registerStateHandler({
      state: UnifiedControllerState.VALIDATING,
      onEntry: async (context) => {
        this.logger.logInfo('Entering validation state', {}, context.requestId);
      },
      handleEvent: async (event, context) => {
        if (event === UnifiedControllerEvent.VALIDATE && context.request) {
          const isValid = await this.validator.validate(context.request);
          if (isValid) {
            return UnifiedControllerState.PROCESSING;
          } else {
            context.errors.push(...this.validator.getValidationErrors());
            return UnifiedControllerState.ERROR;
          }
        }
        return context.currentState;
      }
    });

    // Processing state handler
    this.transitionHub.registerStateHandler({
      state: UnifiedControllerState.PROCESSING,
      onEntry: async (context) => {
        this.logger.logInfo('Entering processing state', {}, context.requestId);
      },
      handleEvent: async (event, context) => {
        if (event === UnifiedControllerEvent.PROCESS && context.request) {
          try {
            const result = await this.processRequestImplementation(context.request, context);
            context.response = this.responseBuilder.buildSuccess(result, context.requestId);
            return UnifiedControllerState.RESPONDING;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const controllerError: ControllerError = {
              code: 'PROCESSING_FAILED',
              message: `Processing failed: ${errorMessage}`,
              details: { error }
            };
            context.errors.push(controllerError);
            return UnifiedControllerState.ERROR;
          }
        }
        return context.currentState;
      }
    });

    // Responding state handler
    this.transitionHub.registerStateHandler({
      state: UnifiedControllerState.RESPONDING,
      onEntry: async (context) => {
        this.logger.logInfo('Entering responding state', {}, context.requestId);
      },
      handleEvent: async (event, context) => {
        if (event === UnifiedControllerEvent.RESPOND) {
          // Response already built in processing state
          return UnifiedControllerState.LOGGING;
        }
        return context.currentState;
      }
    });

    // Logging state handler
    this.transitionHub.registerStateHandler({
      state: UnifiedControllerState.LOGGING,
      onEntry: async (context) => {
        this.logger.logInfo('Entering logging state', {}, context.requestId);
      },
      handleEvent: async (event, context) => {
        if (event === UnifiedControllerEvent.LOG) {
          // Log final state
          this.logger.logInfo('Request processing completed', {
            requestId: context.requestId,
            duration: Date.now() - context.startTime.getTime(),
            errorsCount: context.errors.length
          }, context.requestId);
          return UnifiedControllerState.COMPLETE;
        }
        return context.currentState;
      }
    });

    // Error state handler
    this.transitionHub.registerStateHandler({
      state: UnifiedControllerState.ERROR,
      onEntry: async (context) => {
        this.logger.logInfo('Entering error state', { errors: context.errors }, context.requestId);

        // Build error response
        const primaryError = context.errors[0] || {
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred'
        };
        context.response = this.responseBuilder.buildError(primaryError, context.requestId);
      },
      handleEvent: async (event, context) => {
        if (event === UnifiedControllerEvent.COMPLETE) {
          return UnifiedControllerState.COMPLETE;
        }
        return context.currentState;
      }
    });

    // Add specialized state handlers
    this.addSpecializedStateHandlers();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.transitionHub.on('stateChanged', (data) => {
      this.logger.logStateTransition(data.from, data.to, data.event);
      this.emit('stateChanged', data);
    });

    this.transitionHub.on('transitionFailed', (data) => {
      this.logger.logError(data.error);
      this.emit('transitionFailed', data);
    });
  }

  /**
   * Get controller metrics
   */
  getMetrics() {
    return this.metricsCollector.getMetrics();
  }

  /**
   * Get controller logs
   */
  getLogs() {
    return this.logger.getAllLogs();
  }

  /**
   * Get active contexts
   */
  getActiveContexts() {
    return this.transitionHub.getActiveContexts();
  }

  /**
   * Abstract methods to be implemented by specific controllers
   */
  protected abstract processRequestImplementation(
    request: ControllerRequest,
    context: ControllerContext
  ): Promise<any>;

  protected abstract addSpecializedStateHandlers(): void;
}