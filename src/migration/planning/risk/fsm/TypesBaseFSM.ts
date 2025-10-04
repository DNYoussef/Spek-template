
// TypesBaseFSM.ts - Generated template for types pattern
import { StateDefinition, TransitionDefinition, FSMConfig } from '~types/fsm-types';

export enum TypesState {
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    PROCESSING = 'processing',
    VALIDATING = 'validating',
    COMPLETED = 'completed',
    ERROR = 'error'
}

export enum TypesEvent {
    INITIALIZE = 'initialize',
    PROCESS = 'process',
    VALIDATE = 'validate',
    COMPLETE = 'complete',
    ERROR = 'error',
    RESET = 'reset'
}

export const typesBaseFSMConfig: FSMConfig = {
    states: {
        [TypesState.IDLE]: {
            onEnter: () => console.log('Entering idle state'),
            onExit: () => console.log('Exiting idle state')
        },
        [TypesState.INITIALIZING]: {
            onEnter: () => console.log('Entering initializing state'),
            onExit: () => console.log('Exiting initializing state')
        },
        [TypesState.PROCESSING]: {
            onEnter: () => console.log('Entering processing state'),
            onExit: () => console.log('Exiting processing state')
        },
        [TypesState.VALIDATING]: {
            onEnter: () => console.log('Entering validating state'),
            onExit: () => console.log('Exiting validating state')
        },
        [TypesState.COMPLETED]: {
            onEnter: () => console.log('Entering completed state'),
            onExit: () => console.log('Exiting completed state')
        },
        [TypesState.ERROR]: {
            onEnter: () => console.log('Entering error state'),
            onExit: () => console.log('Exiting error state')
        }
    },
    transitions: {
        [TypesState.IDLE]: {
            [TypesEvent.INITIALIZE]: TypesState.INITIALIZING
        },
        [TypesState.INITIALIZING]: {
            [TypesEvent.PROCESS]: TypesState.PROCESSING,
            [TypesEvent.ERROR]: TypesState.ERROR
        },
        [TypesState.PROCESSING]: {
            [TypesEvent.VALIDATE]: TypesState.VALIDATING,
            [TypesEvent.ERROR]: TypesState.ERROR
        },
        [TypesState.VALIDATING]: {
            [TypesEvent.COMPLETE]: TypesState.COMPLETED,
            [TypesEvent.ERROR]: TypesState.ERROR
        },
        [TypesState.COMPLETED]: {
            [TypesEvent.RESET]: TypesState.IDLE
        },
        [TypesState.ERROR]: {
            [TypesEvent.RESET]: TypesState.IDLE
        }
    },
    initialState: TypesState.IDLE
};
