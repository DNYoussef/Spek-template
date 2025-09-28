/**
 * Dashboard State Machine - FSM-based dashboard view states
 * NASA Rule 10 Compliant: Focused FSM implementation
 */

import { DashboardTypes } from '../types/DashboardTypes';

export class DashboardStateMachine {
  private currentState: DashboardTypes.DashboardState;
  private context: DashboardTypes.DashboardContext;
  private config: DashboardTypes.DashboardFSMConfig;

  constructor(initialContext: Partial<DashboardTypes.DashboardContext> = {}) {
    this.currentState = DashboardTypes.DashboardState.INITIALIZING;
    this.context = this.buildInitialContext(initialContext);
    this.config = this.buildFSMConfig();
  }

  private buildInitialContext(initial: Partial<DashboardTypes.DashboardContext>): DashboardTypes.DashboardContext {
    return {
      currentLayout: null,
      activeWidgets: [],
      dataCache: new Map(),
      configuration: this.getDefaultConfiguration(),
      refreshTimers: new Map(),
      lastError: null,
      viewState: DashboardTypes.ViewState.OVERVIEW,
      ...initial
    };
  }

  private getDefaultConfiguration(): DashboardTypes.DashboardConfiguration {
    return {
      title: 'Migration Dashboard',
      description: 'Real-time migration monitoring',
      autoRefresh: true,
      refreshIntervalMs: 30000,
      theme: 'auto',
      timezone: 'UTC',
      dateFormat: 'ISO',
      numberFormat: 'US',
      enableNotifications: true,
      enableExport: true,
      maxDataPoints: 1000,
      retentionDays: 7
    };
  }

  private buildFSMConfig(): DashboardTypes.DashboardFSMConfig {
    return {
      initialState: DashboardTypes.DashboardState.INITIALIZING,
      states: this.createStateConfigurations(),
      transitions: this.createTransitions(),
      guards: this.createGuards()
    };
  }

  private createStateConfigurations(): Record<DashboardTypes.DashboardState, DashboardTypes.DashboardStateConfig> {
    return {
      [DashboardTypes.DashboardState.INITIALIZING]: {
        onEntry: this.handleInitializingEntry.bind(this),
        validEvents: [DashboardTypes.DashboardEvent.INITIALIZE],
        timeoutMs: 5000
      },
      [DashboardTypes.DashboardState.LOADING]: {
        onEntry: this.handleLoadingEntry.bind(this),
        onExit: this.handleLoadingExit.bind(this),
        validEvents: [DashboardTypes.DashboardEvent.DATA_LOADED, DashboardTypes.DashboardEvent.ERROR_OCCURRED],
        timeoutMs: 10000
      },
      [DashboardTypes.DashboardState.DISPLAYING]: {
        onEntry: this.handleDisplayingEntry.bind(this),
        validEvents: [
          DashboardTypes.DashboardEvent.REFRESH,
          DashboardTypes.DashboardEvent.CONFIGURE,
          DashboardTypes.DashboardEvent.EXPORT,
          DashboardTypes.DashboardEvent.ERROR_OCCURRED,
          DashboardTypes.DashboardEvent.CLEANUP_REQUESTED
        ]
      },
      [DashboardTypes.DashboardState.REFRESHING]: {
        onEntry: this.handleRefreshingEntry.bind(this),
        validEvents: [DashboardTypes.DashboardEvent.DATA_LOADED, DashboardTypes.DashboardEvent.ERROR_OCCURRED],
        timeoutMs: 15000
      },
      [DashboardTypes.DashboardState.CONFIGURING]: {
        onEntry: this.handleConfiguringEntry.bind(this),
        onExit: this.handleConfiguringExit.bind(this),
        validEvents: [DashboardTypes.DashboardEvent.LOAD_DATA, DashboardTypes.DashboardEvent.ERROR_OCCURRED]
      },
      [DashboardTypes.DashboardState.EXPORTING]: {
        onEntry: this.handleExportingEntry.bind(this),
        validEvents: [DashboardTypes.DashboardEvent.LOAD_DATA, DashboardTypes.DashboardEvent.ERROR_OCCURRED],
        timeoutMs: 30000
      },
      [DashboardTypes.DashboardState.ERROR]: {
        onEntry: this.handleErrorEntry.bind(this),
        validEvents: [DashboardTypes.DashboardEvent.RECOVERY, DashboardTypes.DashboardEvent.CLEANUP_REQUESTED],
        retryCount: 3
      },
      [DashboardTypes.DashboardState.CLEANUP]: {
        onEntry: this.handleCleanupEntry.bind(this),
        validEvents: [],
        timeoutMs: 5000
      }
    };
  }

  private createTransitions(): DashboardTypes.DashboardTransition[] {
    return [
      {
        from: DashboardTypes.DashboardState.INITIALIZING,
        to: DashboardTypes.DashboardState.LOADING,
        event: DashboardTypes.DashboardEvent.INITIALIZE,
        action: this.actionInitialize.bind(this)
      },
      {
        from: DashboardTypes.DashboardState.LOADING,
        to: DashboardTypes.DashboardState.DISPLAYING,
        event: DashboardTypes.DashboardEvent.DATA_LOADED,
        action: this.actionDataLoaded.bind(this)
      },
      {
        from: DashboardTypes.DashboardState.DISPLAYING,
        to: DashboardTypes.DashboardState.REFRESHING,
        event: DashboardTypes.DashboardEvent.REFRESH,
        guard: 'canRefresh'
      },
      {
        from: DashboardTypes.DashboardState.REFRESHING,
        to: DashboardTypes.DashboardState.DISPLAYING,
        event: DashboardTypes.DashboardEvent.DATA_LOADED
      },
      {
        from: DashboardTypes.DashboardState.DISPLAYING,
        to: DashboardTypes.DashboardState.CONFIGURING,
        event: DashboardTypes.DashboardEvent.CONFIGURE,
        action: this.actionStartConfiguration.bind(this)
      },
      {
        from: DashboardTypes.DashboardState.CONFIGURING,
        to: DashboardTypes.DashboardState.LOADING,
        event: DashboardTypes.DashboardEvent.LOAD_DATA
      },
      {
        from: DashboardTypes.DashboardState.DISPLAYING,
        to: DashboardTypes.DashboardState.EXPORTING,
        event: DashboardTypes.DashboardEvent.EXPORT,
        action: this.actionStartExport.bind(this)
      },
      {
        from: DashboardTypes.DashboardState.EXPORTING,
        to: DashboardTypes.DashboardState.DISPLAYING,
        event: DashboardTypes.DashboardEvent.LOAD_DATA
      },
      {
        from: DashboardTypes.DashboardState.LOADING,
        to: DashboardTypes.DashboardState.ERROR,
        event: DashboardTypes.DashboardEvent.ERROR_OCCURRED,
        action: this.actionHandleError.bind(this)
      },
      {
        from: DashboardTypes.DashboardState.ERROR,
        to: DashboardTypes.DashboardState.LOADING,
        event: DashboardTypes.DashboardEvent.RECOVERY,
        guard: 'canRecover'
      },
      {
        from: DashboardTypes.DashboardState.ERROR,
        to: DashboardTypes.DashboardState.CLEANUP,
        event: DashboardTypes.DashboardEvent.CLEANUP_REQUESTED
      },
      {
        from: DashboardTypes.DashboardState.DISPLAYING,
        to: DashboardTypes.DashboardState.CLEANUP,
        event: DashboardTypes.DashboardEvent.CLEANUP_REQUESTED
      }
    ];
  }

  private createGuards(): Record<string, (context: DashboardTypes.DashboardContext) => boolean> {
    return {
      canRefresh: (context) => context.configuration.autoRefresh && !context.lastError,
      canRecover: (context) => context.lastError !== null,
      hasActiveLayout: (context) => context.currentLayout !== null,
      hasData: (context) => context.dataCache.size > 0
    };
  }

  // State Entry Handlers
  private handleInitializingEntry(context: DashboardTypes.DashboardContext): void {
    context.viewState = DashboardTypes.ViewState.OVERVIEW;
    context.lastError = null;
  }

  private handleLoadingEntry(context: DashboardTypes.DashboardContext): void {
    // Loading state entry logic
  }

  private handleLoadingExit(context: DashboardTypes.DashboardContext): void {
    // Loading state exit logic
  }

  private handleDisplayingEntry(context: DashboardTypes.DashboardContext): void {
    if (context.configuration.autoRefresh) {
      this.scheduleAutoRefresh(context);
    }
  }

  private handleRefreshingEntry(context: DashboardTypes.DashboardContext): void {
    // Refresh state entry logic
  }

  private handleConfiguringEntry(context: DashboardTypes.DashboardContext): void {
    context.viewState = DashboardTypes.ViewState.WIDGET_CONFIG;
  }

  private handleConfiguringExit(context: DashboardTypes.DashboardContext): void {
    context.viewState = DashboardTypes.ViewState.OVERVIEW;
  }

  private handleExportingEntry(context: DashboardTypes.DashboardContext): void {
    context.viewState = DashboardTypes.ViewState.EXPORT_PREVIEW;
  }

  private handleErrorEntry(context: DashboardTypes.DashboardContext): void {
    this.clearAutoRefresh(context);
  }

  private handleCleanupEntry(context: DashboardTypes.DashboardContext): void {
    this.clearAutoRefresh(context);
    context.dataCache.clear();
    context.activeWidgets = [];
  }

  // Transition Actions
  private actionInitialize(context: DashboardTypes.DashboardContext): void {
    // Initialize dashboard resources
  }

  private actionDataLoaded(context: DashboardTypes.DashboardContext): void {
    context.lastError = null;
  }

  private actionStartConfiguration(context: DashboardTypes.DashboardContext): void {
    // Start configuration mode
  }

  private actionStartExport(context: DashboardTypes.DashboardContext): void {
    // Start export process
  }

  private actionHandleError(context: DashboardTypes.DashboardContext): void {
    // Handle error state
  }

  // Utility Methods
  private scheduleAutoRefresh(context: DashboardTypes.DashboardContext): void {
    const timer = setInterval(() => {
      this.transition(DashboardTypes.DashboardEvent.REFRESH);
    }, context.configuration.refreshIntervalMs);

    context.refreshTimers.set('autoRefresh', timer);
  }

  private clearAutoRefresh(context: DashboardTypes.DashboardContext): void {
    const timer = context.refreshTimers.get('autoRefresh');
    if (timer) {
      clearInterval(timer);
      context.refreshTimers.delete('autoRefresh');
    }
  }

  // Public API
  getCurrentState(): DashboardTypes.DashboardState {
    return this.currentState;
  }

  getContext(): DashboardTypes.DashboardContext {
    return { ...this.context };
  }

  getViewState(): DashboardTypes.ViewState {
    return this.context.viewState;
  }

  setViewState(viewState: DashboardTypes.ViewState): void {
    this.context.viewState = viewState;
  }

  transition(event: DashboardTypes.DashboardEvent, data?: any): boolean {
    const validTransition = this.findValidTransition(event);
    if (!validTransition) {
      return false;
    }

    if (validTransition.guard && !this.evaluateGuard(validTransition.guard)) {
      return false;
    }

    this.executeTransition(validTransition, data);
    return true;
  }

  private findValidTransition(event: DashboardTypes.DashboardEvent): DashboardTypes.DashboardTransition | null {
    return this.config.transitions.find(t =>
      t.from === this.currentState && t.event === event
    ) || null;
  }

  private evaluateGuard(guardName: string): boolean {
    const guard = this.config.guards[guardName];
    return guard ? guard(this.context) : true;
  }

  private executeTransition(transition: DashboardTypes.DashboardTransition, data?: any): void {
    this.exitCurrentState();

    if (transition.action) {
      transition.action(this.context);
    }

    this.currentState = transition.to;
    this.enterNewState();
  }

  private exitCurrentState(): void {
    const stateConfig = this.config.states[this.currentState];
    if (stateConfig.onExit) {
      stateConfig.onExit(this.context);
    }
  }

  private enterNewState(): void {
    const stateConfig = this.config.states[this.currentState];
    if (stateConfig.onEntry) {
      stateConfig.onEntry(this.context);
    }
  }

  isInState(state: DashboardTypes.DashboardState): boolean {
    return this.currentState === state;
  }

  canTransition(event: DashboardTypes.DashboardEvent): boolean {
    const transition = this.findValidTransition(event);
    if (!transition) return false;

    if (transition.guard) {
      return this.evaluateGuard(transition.guard);
    }

    return true;
  }

  updateContext(updates: Partial<DashboardTypes.DashboardContext>): void {
    this.context = { ...this.context, ...updates };
  }

  setError(error: Error): void {
    this.context.lastError = error;
    this.transition(DashboardTypes.DashboardEvent.ERROR_OCCURRED);
  }

  clearError(): void {
    this.context.lastError = null;
  }

  getValidEvents(): DashboardTypes.DashboardEvent[] {
    const stateConfig = this.config.states[this.currentState];
    return stateConfig ? stateConfig.validEvents : [];
  }
}