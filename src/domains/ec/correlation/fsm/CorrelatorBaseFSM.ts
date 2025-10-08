
// CorrelatorBaseFSM.ts - Generated template for correlator pattern
import { StateDefinition, TransitionDefinition, FSMConfig } from '~types/fsm-types';

export enum CorrelatorState {
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    PROCESSING = 'processing',
    VALIDATING = 'validating',
    COMPLETED = 'completed',
    ERROR = 'error'
}

export enum CorrelatorEvent {
    INITIALIZE = 'initialize',
    PROCESS = 'process',
    VALIDATE = 'validate',
    COMPLETE = 'complete',
    ERROR = 'error',
    RESET = 'reset'
}

export const correlatorBaseFSMConfig: FSMConfig = {
    states: {
        [CorrelatorState.IDLE]: {
            onEnter: () => console.log('Entering idle state'),
            onExit: () => console.log('Exiting idle state')
        },
        [CorrelatorState.INITIALIZING]: {
            onEnter: () => console.log('Entering initializing state'),
            onExit: () => console.log('Exiting initializing state')
        },
        [CorrelatorState.PROCESSING]: {
            onEnter: () => console.log('Entering processing state'),
            onExit: () => console.log('Exiting processing state')
        },
        [CorrelatorState.VALIDATING]: {
            onEnter: () => console.log('Entering validating state'),
            onExit: () => console.log('Exiting validating state')
        },
        [CorrelatorState.COMPLETED]: {
            onEnter: () => console.log('Entering completed state'),
            onExit: () => console.log('Exiting completed state')
        },
        [CorrelatorState.ERROR]: {
            onEnter: () => console.log('Entering error state'),
            onExit: () => console.log('Exiting error state')
        }
    },
    transitions: {
        [CorrelatorState.IDLE]: {
            [CorrelatorEvent.INITIALIZE]: CorrelatorState.INITIALIZING
        },
        [CorrelatorState.INITIALIZING]: {
            [CorrelatorEvent.PROCESS]: CorrelatorState.PROCESSING,
            [CorrelatorEvent.ERROR]: CorrelatorState.ERROR
        },
        [CorrelatorState.PROCESSING]: {
            [CorrelatorEvent.VALIDATE]: CorrelatorState.VALIDATING,
            [CorrelatorEvent.ERROR]: CorrelatorState.ERROR
        },
        [CorrelatorState.VALIDATING]: {
            [CorrelatorEvent.COMPLETE]: CorrelatorState.COMPLETED,
            [CorrelatorEvent.ERROR]: CorrelatorState.ERROR
        },
        [CorrelatorState.COMPLETED]: {
            [CorrelatorEvent.RESET]: CorrelatorState.IDLE
        },
        [CorrelatorState.ERROR]: {
            [CorrelatorEvent.RESET]: CorrelatorState.IDLE
        }
    },
    initialState: CorrelatorState.IDLE
};
