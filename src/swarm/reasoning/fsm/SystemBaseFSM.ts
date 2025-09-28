
// SystemBaseFSM.ts - Generated template for system pattern
import { StateDefinition, TransitionDefinition, FSMConfig } from '../../../types/fsm-types';

export enum SystemState {
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    PROCESSING = 'processing',
    VALIDATING = 'validating',
    COMPLETED = 'completed',
    ERROR = 'error'
}

export enum SystemEvent {
    INITIALIZE = 'initialize',
    PROCESS = 'process',
    VALIDATE = 'validate',
    COMPLETE = 'complete',
    ERROR = 'error',
    RESET = 'reset'
}

export const systemBaseFSMConfig: FSMConfig = {
    states: {
        [SystemState.IDLE]: {
            onEnter: () => console.log('Entering idle state'),
            onExit: () => console.log('Exiting idle state')
        },
        [SystemState.INITIALIZING]: {
            onEnter: () => console.log('Entering initializing state'),
            onExit: () => console.log('Exiting initializing state')
        },
        [SystemState.PROCESSING]: {
            onEnter: () => console.log('Entering processing state'),
            onExit: () => console.log('Exiting processing state')
        },
        [SystemState.VALIDATING]: {
            onEnter: () => console.log('Entering validating state'),
            onExit: () => console.log('Exiting validating state')
        },
        [SystemState.COMPLETED]: {
            onEnter: () => console.log('Entering completed state'),
            onExit: () => console.log('Exiting completed state')
        },
        [SystemState.ERROR]: {
            onEnter: () => console.log('Entering error state'),
            onExit: () => console.log('Exiting error state')
        }
    },
    transitions: {
        [SystemState.IDLE]: {
            [SystemEvent.INITIALIZE]: SystemState.INITIALIZING
        },
        [SystemState.INITIALIZING]: {
            [SystemEvent.PROCESS]: SystemState.PROCESSING,
            [SystemEvent.ERROR]: SystemState.ERROR
        },
        [SystemState.PROCESSING]: {
            [SystemEvent.VALIDATE]: SystemState.VALIDATING,
            [SystemEvent.ERROR]: SystemState.ERROR
        },
        [SystemState.VALIDATING]: {
            [SystemEvent.COMPLETE]: SystemState.COMPLETED,
            [SystemEvent.ERROR]: SystemState.ERROR
        },
        [SystemState.COMPLETED]: {
            [SystemEvent.RESET]: SystemState.IDLE
        },
        [SystemState.ERROR]: {
            [SystemEvent.RESET]: SystemState.IDLE
        }
    },
    initialState: SystemState.IDLE
};
