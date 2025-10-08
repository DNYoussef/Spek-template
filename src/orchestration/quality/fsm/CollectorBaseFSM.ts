
// CollectorBaseFSM.ts - Generated template for collector pattern
import { StateDefinition, TransitionDefinition, FSMConfig } from '~types/fsm-types';

export enum CollectorState {
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    PROCESSING = 'processing',
    VALIDATING = 'validating',
    COMPLETED = 'completed',
    ERROR = 'error'
}

export enum CollectorEvent {
    INITIALIZE = 'initialize',
    PROCESS = 'process',
    VALIDATE = 'validate',
    COMPLETE = 'complete',
    ERROR = 'error',
    RESET = 'reset'
}

export const collectorBaseFSMConfig: FSMConfig = {
    states: {
        [CollectorState.IDLE]: {
            onEnter: () => console.log('Entering idle state'),
            onExit: () => console.log('Exiting idle state')
        },
        [CollectorState.INITIALIZING]: {
            onEnter: () => console.log('Entering initializing state'),
            onExit: () => console.log('Exiting initializing state')
        },
        [CollectorState.PROCESSING]: {
            onEnter: () => console.log('Entering processing state'),
            onExit: () => console.log('Exiting processing state')
        },
        [CollectorState.VALIDATING]: {
            onEnter: () => console.log('Entering validating state'),
            onExit: () => console.log('Exiting validating state')
        },
        [CollectorState.COMPLETED]: {
            onEnter: () => console.log('Entering completed state'),
            onExit: () => console.log('Exiting completed state')
        },
        [CollectorState.ERROR]: {
            onEnter: () => console.log('Entering error state'),
            onExit: () => console.log('Exiting error state')
        }
    },
    transitions: {
        [CollectorState.IDLE]: {
            [CollectorEvent.INITIALIZE]: CollectorState.INITIALIZING
        },
        [CollectorState.INITIALIZING]: {
            [CollectorEvent.PROCESS]: CollectorState.PROCESSING,
            [CollectorEvent.ERROR]: CollectorState.ERROR
        },
        [CollectorState.PROCESSING]: {
            [CollectorEvent.VALIDATE]: CollectorState.VALIDATING,
            [CollectorEvent.ERROR]: CollectorState.ERROR
        },
        [CollectorState.VALIDATING]: {
            [CollectorEvent.COMPLETE]: CollectorState.COMPLETED,
            [CollectorEvent.ERROR]: CollectorState.ERROR
        },
        [CollectorState.COMPLETED]: {
            [CollectorEvent.RESET]: CollectorState.IDLE
        },
        [CollectorState.ERROR]: {
            [CollectorEvent.RESET]: CollectorState.IDLE
        }
    },
    initialState: CollectorState.IDLE
};
