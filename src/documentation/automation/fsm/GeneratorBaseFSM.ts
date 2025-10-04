
// GeneratorBaseFSM.ts - Generated template for generator pattern
import { StateDefinition, TransitionDefinition, FSMConfig } from '~types/fsm-types';

export enum GeneratorState {
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    PROCESSING = 'processing',
    VALIDATING = 'validating',
    COMPLETED = 'completed',
    ERROR = 'error'
}

export enum GeneratorEvent {
    INITIALIZE = 'initialize',
    PROCESS = 'process',
    VALIDATE = 'validate',
    COMPLETE = 'complete',
    ERROR = 'error',
    RESET = 'reset'
}

export const generatorBaseFSMConfig: FSMConfig = {
    states: {
        [GeneratorState.IDLE]: {
            onEnter: () => console.log('Entering idle state'),
            onExit: () => console.log('Exiting idle state')
        },
        [GeneratorState.INITIALIZING]: {
            onEnter: () => console.log('Entering initializing state'),
            onExit: () => console.log('Exiting initializing state')
        },
        [GeneratorState.PROCESSING]: {
            onEnter: () => console.log('Entering processing state'),
            onExit: () => console.log('Exiting processing state')
        },
        [GeneratorState.VALIDATING]: {
            onEnter: () => console.log('Entering validating state'),
            onExit: () => console.log('Exiting validating state')
        },
        [GeneratorState.COMPLETED]: {
            onEnter: () => console.log('Entering completed state'),
            onExit: () => console.log('Exiting completed state')
        },
        [GeneratorState.ERROR]: {
            onEnter: () => console.log('Entering error state'),
            onExit: () => console.log('Exiting error state')
        }
    },
    transitions: {
        [GeneratorState.IDLE]: {
            [GeneratorEvent.INITIALIZE]: GeneratorState.INITIALIZING
        },
        [GeneratorState.INITIALIZING]: {
            [GeneratorEvent.PROCESS]: GeneratorState.PROCESSING,
            [GeneratorEvent.ERROR]: GeneratorState.ERROR
        },
        [GeneratorState.PROCESSING]: {
            [GeneratorEvent.VALIDATE]: GeneratorState.VALIDATING,
            [GeneratorEvent.ERROR]: GeneratorState.ERROR
        },
        [GeneratorState.VALIDATING]: {
            [GeneratorEvent.COMPLETE]: GeneratorState.COMPLETED,
            [GeneratorEvent.ERROR]: GeneratorState.ERROR
        },
        [GeneratorState.COMPLETED]: {
            [GeneratorEvent.RESET]: GeneratorState.IDLE
        },
        [GeneratorState.ERROR]: {
            [GeneratorEvent.RESET]: GeneratorState.IDLE
        }
    },
    initialState: GeneratorState.IDLE
};
