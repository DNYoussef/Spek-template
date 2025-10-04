
// DetectorBaseFSM.ts - Generated template for detector pattern
import { StateDefinition, TransitionDefinition, FSMConfig } from '~types/fsm-types';

export enum DetectorState {
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    PROCESSING = 'processing',
    VALIDATING = 'validating',
    COMPLETED = 'completed',
    ERROR = 'error'
}

export enum DetectorEvent {
    INITIALIZE = 'initialize',
    PROCESS = 'process',
    VALIDATE = 'validate',
    COMPLETE = 'complete',
    ERROR = 'error',
    RESET = 'reset'
}

export const detectorBaseFSMConfig: FSMConfig = {
    states: {
        [DetectorState.IDLE]: {
            onEnter: () => console.log('Entering idle state'),
            onExit: () => console.log('Exiting idle state')
        },
        [DetectorState.INITIALIZING]: {
            onEnter: () => console.log('Entering initializing state'),
            onExit: () => console.log('Exiting initializing state')
        },
        [DetectorState.PROCESSING]: {
            onEnter: () => console.log('Entering processing state'),
            onExit: () => console.log('Exiting processing state')
        },
        [DetectorState.VALIDATING]: {
            onEnter: () => console.log('Entering validating state'),
            onExit: () => console.log('Exiting validating state')
        },
        [DetectorState.COMPLETED]: {
            onEnter: () => console.log('Entering completed state'),
            onExit: () => console.log('Exiting completed state')
        },
        [DetectorState.ERROR]: {
            onEnter: () => console.log('Entering error state'),
            onExit: () => console.log('Exiting error state')
        }
    },
    transitions: {
        [DetectorState.IDLE]: {
            [DetectorEvent.INITIALIZE]: DetectorState.INITIALIZING
        },
        [DetectorState.INITIALIZING]: {
            [DetectorEvent.PROCESS]: DetectorState.PROCESSING,
            [DetectorEvent.ERROR]: DetectorState.ERROR
        },
        [DetectorState.PROCESSING]: {
            [DetectorEvent.VALIDATE]: DetectorState.VALIDATING,
            [DetectorEvent.ERROR]: DetectorState.ERROR
        },
        [DetectorState.VALIDATING]: {
            [DetectorEvent.COMPLETE]: DetectorState.COMPLETED,
            [DetectorEvent.ERROR]: DetectorState.ERROR
        },
        [DetectorState.COMPLETED]: {
            [DetectorEvent.RESET]: DetectorState.IDLE
        },
        [DetectorState.ERROR]: {
            [DetectorEvent.RESET]: DetectorState.IDLE
        }
    },
    initialState: DetectorState.IDLE
};
