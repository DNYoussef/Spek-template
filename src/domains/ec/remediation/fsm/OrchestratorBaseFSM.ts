
// OrchestratorBaseFSM.ts - Generated template for orchestrator pattern
// Epic 6.3: Renamed from OrchestratorState/Event to RemediationOrchestratorState/Event
// to disambiguate from canonical orchestration/fsm/OrchestratorStates.ts
import { StateDefinition, TransitionDefinition, FSMConfig } from '~types/fsm-types';

export enum RemediationOrchestratorState {
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    PROCESSING = 'processing',
    VALIDATING = 'validating',
    COMPLETED = 'completed',
    ERROR = 'error'
}

export enum RemediationOrchestratorEvent {
    INITIALIZE = 'initialize',
    PROCESS = 'process',
    VALIDATE = 'validate',
    COMPLETE = 'complete',
    ERROR = 'error',
    RESET = 'reset'
}

export const orchestratorBaseFSMConfig: FSMConfig = {
    states: {
        [RemediationOrchestratorState.IDLE]: {
            onEnter: () => console.log('Entering idle state'),
            onExit: () => console.log('Exiting idle state')
        },
        [RemediationOrchestratorState.INITIALIZING]: {
            onEnter: () => console.log('Entering initializing state'),
            onExit: () => console.log('Exiting initializing state')
        },
        [RemediationOrchestratorState.PROCESSING]: {
            onEnter: () => console.log('Entering processing state'),
            onExit: () => console.log('Exiting processing state')
        },
        [RemediationOrchestratorState.VALIDATING]: {
            onEnter: () => console.log('Entering validating state'),
            onExit: () => console.log('Exiting validating state')
        },
        [RemediationOrchestratorState.COMPLETED]: {
            onEnter: () => console.log('Entering completed state'),
            onExit: () => console.log('Exiting completed state')
        },
        [RemediationOrchestratorState.ERROR]: {
            onEnter: () => console.log('Entering error state'),
            onExit: () => console.log('Exiting error state')
        }
    },
    transitions: {
        [RemediationOrchestratorState.IDLE]: {
            [RemediationOrchestratorEvent.INITIALIZE]: RemediationOrchestratorState.INITIALIZING
        },
        [RemediationOrchestratorState.INITIALIZING]: {
            [RemediationOrchestratorEvent.PROCESS]: RemediationOrchestratorState.PROCESSING,
            [RemediationOrchestratorEvent.ERROR]: RemediationOrchestratorState.ERROR
        },
        [RemediationOrchestratorState.PROCESSING]: {
            [RemediationOrchestratorEvent.VALIDATE]: RemediationOrchestratorState.VALIDATING,
            [RemediationOrchestratorEvent.ERROR]: RemediationOrchestratorState.ERROR
        },
        [RemediationOrchestratorState.VALIDATING]: {
            [RemediationOrchestratorEvent.COMPLETE]: RemediationOrchestratorState.COMPLETED,
            [RemediationOrchestratorEvent.ERROR]: RemediationOrchestratorState.ERROR
        },
        [RemediationOrchestratorState.COMPLETED]: {
            [RemediationOrchestratorEvent.RESET]: RemediationOrchestratorState.IDLE
        },
        [RemediationOrchestratorState.ERROR]: {
            [RemediationOrchestratorEvent.RESET]: RemediationOrchestratorState.IDLE
        }
    },
    initialState: RemediationOrchestratorState.IDLE
};
