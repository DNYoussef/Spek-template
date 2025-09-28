
// ExecutorBaseFSM.ts - Generated template for executor pattern
import { StateDefinition, TransitionDefinition, FSMConfig } from '../../../types/fsm-types';

export enum ExecutorState {
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    PROCESSING = 'processing',
    VALIDATING = 'validating',
    COMPLETED = 'completed',
    ERROR = 'error'
}

export enum ExecutorEvent {
    INITIALIZE = 'initialize',
    PROCESS = 'process',
    VALIDATE = 'validate',
    COMPLETE = 'complete',
    ERROR = 'error',
    RESET = 'reset'
}

export const executorBaseFSMConfig: FSMConfig = {
    states: {
        [ExecutorState.IDLE]: {
            onEnter: () => console.log('Entering idle state'),
            onExit: () => console.log('Exiting idle state')
        },
        [ExecutorState.INITIALIZING]: {
            onEnter: () => console.log('Entering initializing state'),
            onExit: () => console.log('Exiting initializing state')
        },
        [ExecutorState.PROCESSING]: {
            onEnter: () => console.log('Entering processing state'),
            onExit: () => console.log('Exiting processing state')
        },
        [ExecutorState.VALIDATING]: {
            onEnter: () => console.log('Entering validating state'),
            onExit: () => console.log('Exiting validating state')
        },
        [ExecutorState.COMPLETED]: {
            onEnter: () => console.log('Entering completed state'),
            onExit: () => console.log('Exiting completed state')
        },
        [ExecutorState.ERROR]: {
            onEnter: () => console.log('Entering error state'),
            onExit: () => console.log('Exiting error state')
        }
    },
    transitions: {
        [ExecutorState.IDLE]: {
            [ExecutorEvent.INITIALIZE]: ExecutorState.INITIALIZING
        },
        [ExecutorState.INITIALIZING]: {
            [ExecutorEvent.PROCESS]: ExecutorState.PROCESSING,
            [ExecutorEvent.ERROR]: ExecutorState.ERROR
        },
        [ExecutorState.PROCESSING]: {
            [ExecutorEvent.VALIDATE]: ExecutorState.VALIDATING,
            [ExecutorEvent.ERROR]: ExecutorState.ERROR
        },
        [ExecutorState.VALIDATING]: {
            [ExecutorEvent.COMPLETE]: ExecutorState.COMPLETED,
            [ExecutorEvent.ERROR]: ExecutorState.ERROR
        },
        [ExecutorState.COMPLETED]: {
            [ExecutorEvent.RESET]: ExecutorState.IDLE
        },
        [ExecutorState.ERROR]: {
            [ExecutorEvent.RESET]: ExecutorState.IDLE
        }
    },
    initialState: ExecutorState.IDLE
};
