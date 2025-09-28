
// ConfigBaseFSM.ts - Generated template for config pattern
import { StateDefinition, TransitionDefinition, FSMConfig } from '../../../types/fsm-types';

export enum ConfigState {
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    PROCESSING = 'processing',
    VALIDATING = 'validating',
    COMPLETED = 'completed',
    ERROR = 'error'
}

export enum ConfigEvent {
    INITIALIZE = 'initialize',
    PROCESS = 'process',
    VALIDATE = 'validate',
    COMPLETE = 'complete',
    ERROR = 'error',
    RESET = 'reset'
}

export const configBaseFSMConfig: FSMConfig = {
    states: {
        [ConfigState.IDLE]: {
            onEnter: () => console.log('Entering idle state'),
            onExit: () => console.log('Exiting idle state')
        },
        [ConfigState.INITIALIZING]: {
            onEnter: () => console.log('Entering initializing state'),
            onExit: () => console.log('Exiting initializing state')
        },
        [ConfigState.PROCESSING]: {
            onEnter: () => console.log('Entering processing state'),
            onExit: () => console.log('Exiting processing state')
        },
        [ConfigState.VALIDATING]: {
            onEnter: () => console.log('Entering validating state'),
            onExit: () => console.log('Exiting validating state')
        },
        [ConfigState.COMPLETED]: {
            onEnter: () => console.log('Entering completed state'),
            onExit: () => console.log('Exiting completed state')
        },
        [ConfigState.ERROR]: {
            onEnter: () => console.log('Entering error state'),
            onExit: () => console.log('Exiting error state')
        }
    },
    transitions: {
        [ConfigState.IDLE]: {
            [ConfigEvent.INITIALIZE]: ConfigState.INITIALIZING
        },
        [ConfigState.INITIALIZING]: {
            [ConfigEvent.PROCESS]: ConfigState.PROCESSING,
            [ConfigEvent.ERROR]: ConfigState.ERROR
        },
        [ConfigState.PROCESSING]: {
            [ConfigEvent.VALIDATE]: ConfigState.VALIDATING,
            [ConfigEvent.ERROR]: ConfigState.ERROR
        },
        [ConfigState.VALIDATING]: {
            [ConfigEvent.COMPLETE]: ConfigState.COMPLETED,
            [ConfigEvent.ERROR]: ConfigState.ERROR
        },
        [ConfigState.COMPLETED]: {
            [ConfigEvent.RESET]: ConfigState.IDLE
        },
        [ConfigState.ERROR]: {
            [ConfigEvent.RESET]: ConfigState.IDLE
        }
    },
    initialState: ConfigState.IDLE
};
