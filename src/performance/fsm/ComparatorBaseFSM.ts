
// ComparatorBaseFSM.ts - Generated template for comparator pattern
import { StateDefinition, TransitionDefinition, FSMConfig } from '../../../types/fsm-types';

export enum ComparatorState {
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    PROCESSING = 'processing',
    VALIDATING = 'validating',
    COMPLETED = 'completed',
    ERROR = 'error'
}

export enum ComparatorEvent {
    INITIALIZE = 'initialize',
    PROCESS = 'process',
    VALIDATE = 'validate',
    COMPLETE = 'complete',
    ERROR = 'error',
    RESET = 'reset'
}

export const comparatorBaseFSMConfig: FSMConfig = {
    states: {
        [ComparatorState.IDLE]: {
            onEnter: () => console.log('Entering idle state'),
            onExit: () => console.log('Exiting idle state')
        },
        [ComparatorState.INITIALIZING]: {
            onEnter: () => console.log('Entering initializing state'),
            onExit: () => console.log('Exiting initializing state')
        },
        [ComparatorState.PROCESSING]: {
            onEnter: () => console.log('Entering processing state'),
            onExit: () => console.log('Exiting processing state')
        },
        [ComparatorState.VALIDATING]: {
            onEnter: () => console.log('Entering validating state'),
            onExit: () => console.log('Exiting validating state')
        },
        [ComparatorState.COMPLETED]: {
            onEnter: () => console.log('Entering completed state'),
            onExit: () => console.log('Exiting completed state')
        },
        [ComparatorState.ERROR]: {
            onEnter: () => console.log('Entering error state'),
            onExit: () => console.log('Exiting error state')
        }
    },
    transitions: {
        [ComparatorState.IDLE]: {
            [ComparatorEvent.INITIALIZE]: ComparatorState.INITIALIZING
        },
        [ComparatorState.INITIALIZING]: {
            [ComparatorEvent.PROCESS]: ComparatorState.PROCESSING,
            [ComparatorEvent.ERROR]: ComparatorState.ERROR
        },
        [ComparatorState.PROCESSING]: {
            [ComparatorEvent.VALIDATE]: ComparatorState.VALIDATING,
            [ComparatorEvent.ERROR]: ComparatorState.ERROR
        },
        [ComparatorState.VALIDATING]: {
            [ComparatorEvent.COMPLETE]: ComparatorState.COMPLETED,
            [ComparatorEvent.ERROR]: ComparatorState.ERROR
        },
        [ComparatorState.COMPLETED]: {
            [ComparatorEvent.RESET]: ComparatorState.IDLE
        },
        [ComparatorState.ERROR]: {
            [ComparatorEvent.RESET]: ComparatorState.IDLE
        }
    },
    initialState: ComparatorState.IDLE
};
