
// OrchestratorBaseFSM.ts - Generated template for orchestrator pattern
import { StateDefinition, TransitionDefinition, FSMConfig } from '../../../types/fsm-types';

export enum OrchestratorState {
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    PROCESSING = 'processing',
    VALIDATING = 'validating',
    COMPLETED = 'completed',
    ERROR = 'error'
}

export enum OrchestratorEvent {
    INITIALIZE = 'initialize',
    PROCESS = 'process',
    VALIDATE = 'validate',
    COMPLETE = 'complete',
    ERROR = 'error',
    RESET = 'reset'
}

export const orchestratorBaseFSMConfig: FSMConfig = {
    states: {
        [OrchestratorState.IDLE]: {
            onEnter: () => console.log('Entering idle state'),
            onExit: () => console.log('Exiting idle state')
        },
        [OrchestratorState.INITIALIZING]: {
            onEnter: () => console.log('Entering initializing state'),
            onExit: () => console.log('Exiting initializing state')
        },
        [OrchestratorState.PROCESSING]: {
            onEnter: () => console.log('Entering processing state'),
            onExit: () => console.log('Exiting processing state')
        },
        [OrchestratorState.VALIDATING]: {
            onEnter: () => console.log('Entering validating state'),
            onExit: () => console.log('Exiting validating state')
        },
        [OrchestratorState.COMPLETED]: {
            onEnter: () => console.log('Entering completed state'),
            onExit: () => console.log('Exiting completed state')
        },
        [OrchestratorState.ERROR]: {
            onEnter: () => console.log('Entering error state'),
            onExit: () => console.log('Exiting error state')
        }
    },
    transitions: {
        [OrchestratorState.IDLE]: {
            [OrchestratorEvent.INITIALIZE]: OrchestratorState.INITIALIZING
        },
        [OrchestratorState.INITIALIZING]: {
            [OrchestratorEvent.PROCESS]: OrchestratorState.PROCESSING,
            [OrchestratorEvent.ERROR]: OrchestratorState.ERROR
        },
        [OrchestratorState.PROCESSING]: {
            [OrchestratorEvent.VALIDATE]: OrchestratorState.VALIDATING,
            [OrchestratorEvent.ERROR]: OrchestratorState.ERROR
        },
        [OrchestratorState.VALIDATING]: {
            [OrchestratorEvent.COMPLETE]: OrchestratorState.COMPLETED,
            [OrchestratorEvent.ERROR]: OrchestratorState.ERROR
        },
        [OrchestratorState.COMPLETED]: {
            [OrchestratorEvent.RESET]: OrchestratorState.IDLE
        },
        [OrchestratorState.ERROR]: {
            [OrchestratorEvent.RESET]: OrchestratorState.IDLE
        }
    },
    initialState: OrchestratorState.IDLE
};
