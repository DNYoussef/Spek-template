
// ValidatorBaseFSM.ts - Generated template for validator pattern
import { StateDefinition, TransitionDefinition, FSMConfig } from '~types/fsm-types';

export enum ValidatorState {
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    PROCESSING = 'processing',
    VALIDATING = 'validating',
    COMPLETED = 'completed',
    ERROR = 'error'
}

export enum ValidatorEvent {
    INITIALIZE = 'initialize',
    PROCESS = 'process',
    VALIDATE = 'validate',
    COMPLETE = 'complete',
    ERROR = 'error',
    RESET = 'reset'
}

export const validatorBaseFSMConfig: FSMConfig = {
    states: {
        [ValidatorState.IDLE]: {
            onEnter: () => console.log('Entering idle state'),
            onExit: () => console.log('Exiting idle state')
        },
        [ValidatorState.INITIALIZING]: {
            onEnter: () => console.log('Entering initializing state'),
            onExit: () => console.log('Exiting initializing state')
        },
        [ValidatorState.PROCESSING]: {
            onEnter: () => console.log('Entering processing state'),
            onExit: () => console.log('Exiting processing state')
        },
        [ValidatorState.VALIDATING]: {
            onEnter: () => console.log('Entering validating state'),
            onExit: () => console.log('Exiting validating state')
        },
        [ValidatorState.COMPLETED]: {
            onEnter: () => console.log('Entering completed state'),
            onExit: () => console.log('Exiting completed state')
        },
        [ValidatorState.ERROR]: {
            onEnter: () => console.log('Entering error state'),
            onExit: () => console.log('Exiting error state')
        }
    },
    transitions: {
        [ValidatorState.IDLE]: {
            [ValidatorEvent.INITIALIZE]: ValidatorState.INITIALIZING
        },
        [ValidatorState.INITIALIZING]: {
            [ValidatorEvent.PROCESS]: ValidatorState.PROCESSING,
            [ValidatorEvent.ERROR]: ValidatorState.ERROR
        },
        [ValidatorState.PROCESSING]: {
            [ValidatorEvent.VALIDATE]: ValidatorState.VALIDATING,
            [ValidatorEvent.ERROR]: ValidatorState.ERROR
        },
        [ValidatorState.VALIDATING]: {
            [ValidatorEvent.COMPLETE]: ValidatorState.COMPLETED,
            [ValidatorEvent.ERROR]: ValidatorState.ERROR
        },
        [ValidatorState.COMPLETED]: {
            [ValidatorEvent.RESET]: ValidatorState.IDLE
        },
        [ValidatorState.ERROR]: {
            [ValidatorEvent.RESET]: ValidatorState.IDLE
        }
    },
    initialState: ValidatorState.IDLE
};
