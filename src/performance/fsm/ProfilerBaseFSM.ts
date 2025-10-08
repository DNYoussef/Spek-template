
// ProfilerBaseFSM.ts - Generated template for profiler pattern
import { StateDefinition, TransitionDefinition, FSMConfig } from '~types/fsm-types';

export enum ProfilerState {
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    PROCESSING = 'processing',
    VALIDATING = 'validating',
    COMPLETED = 'completed',
    ERROR = 'error'
}

export enum ProfilerEvent {
    INITIALIZE = 'initialize',
    PROCESS = 'process',
    VALIDATE = 'validate',
    COMPLETE = 'complete',
    ERROR = 'error',
    RESET = 'reset'
}

export const profilerBaseFSMConfig: FSMConfig = {
    states: {
        [ProfilerState.IDLE]: {
            onEnter: () => console.log('Entering idle state'),
            onExit: () => console.log('Exiting idle state')
        },
        [ProfilerState.INITIALIZING]: {
            onEnter: () => console.log('Entering initializing state'),
            onExit: () => console.log('Exiting initializing state')
        },
        [ProfilerState.PROCESSING]: {
            onEnter: () => console.log('Entering processing state'),
            onExit: () => console.log('Exiting processing state')
        },
        [ProfilerState.VALIDATING]: {
            onEnter: () => console.log('Entering validating state'),
            onExit: () => console.log('Exiting validating state')
        },
        [ProfilerState.COMPLETED]: {
            onEnter: () => console.log('Entering completed state'),
            onExit: () => console.log('Exiting completed state')
        },
        [ProfilerState.ERROR]: {
            onEnter: () => console.log('Entering error state'),
            onExit: () => console.log('Exiting error state')
        }
    },
    transitions: {
        [ProfilerState.IDLE]: {
            [ProfilerEvent.INITIALIZE]: ProfilerState.INITIALIZING
        },
        [ProfilerState.INITIALIZING]: {
            [ProfilerEvent.PROCESS]: ProfilerState.PROCESSING,
            [ProfilerEvent.ERROR]: ProfilerState.ERROR
        },
        [ProfilerState.PROCESSING]: {
            [ProfilerEvent.VALIDATE]: ProfilerState.VALIDATING,
            [ProfilerEvent.ERROR]: ProfilerState.ERROR
        },
        [ProfilerState.VALIDATING]: {
            [ProfilerEvent.COMPLETE]: ProfilerState.COMPLETED,
            [ProfilerEvent.ERROR]: ProfilerState.ERROR
        },
        [ProfilerState.COMPLETED]: {
            [ProfilerEvent.RESET]: ProfilerState.IDLE
        },
        [ProfilerState.ERROR]: {
            [ProfilerEvent.RESET]: ProfilerState.IDLE
        }
    },
    initialState: ProfilerState.IDLE
};
