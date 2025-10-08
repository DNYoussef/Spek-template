
// ScorerBaseFSM.ts - Generated template for scorer pattern
import { StateDefinition, TransitionDefinition, FSMConfig } from '~types/fsm-types';

export enum ScorerState {
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    PROCESSING = 'processing',
    VALIDATING = 'validating',
    COMPLETED = 'completed',
    ERROR = 'error'
}

export enum ScorerEvent {
    INITIALIZE = 'initialize',
    PROCESS = 'process',
    VALIDATE = 'validate',
    COMPLETE = 'complete',
    ERROR = 'error',
    RESET = 'reset'
}

export const scorerBaseFSMConfig: FSMConfig = {
    states: {
        [ScorerState.IDLE]: {
            onEnter: () => console.log('Entering idle state'),
            onExit: () => console.log('Exiting idle state')
        },
        [ScorerState.INITIALIZING]: {
            onEnter: () => console.log('Entering initializing state'),
            onExit: () => console.log('Exiting initializing state')
        },
        [ScorerState.PROCESSING]: {
            onEnter: () => console.log('Entering processing state'),
            onExit: () => console.log('Exiting processing state')
        },
        [ScorerState.VALIDATING]: {
            onEnter: () => console.log('Entering validating state'),
            onExit: () => console.log('Exiting validating state')
        },
        [ScorerState.COMPLETED]: {
            onEnter: () => console.log('Entering completed state'),
            onExit: () => console.log('Exiting completed state')
        },
        [ScorerState.ERROR]: {
            onEnter: () => console.log('Entering error state'),
            onExit: () => console.log('Exiting error state')
        }
    },
    transitions: {
        [ScorerState.IDLE]: {
            [ScorerEvent.INITIALIZE]: ScorerState.INITIALIZING
        },
        [ScorerState.INITIALIZING]: {
            [ScorerEvent.PROCESS]: ScorerState.PROCESSING,
            [ScorerEvent.ERROR]: ScorerState.ERROR
        },
        [ScorerState.PROCESSING]: {
            [ScorerEvent.VALIDATE]: ScorerState.VALIDATING,
            [ScorerEvent.ERROR]: ScorerState.ERROR
        },
        [ScorerState.VALIDATING]: {
            [ScorerEvent.COMPLETE]: ScorerState.COMPLETED,
            [ScorerEvent.ERROR]: ScorerState.ERROR
        },
        [ScorerState.COMPLETED]: {
            [ScorerEvent.RESET]: ScorerState.IDLE
        },
        [ScorerState.ERROR]: {
            [ScorerEvent.RESET]: ScorerState.IDLE
        }
    },
    initialState: ScorerState.IDLE
};
