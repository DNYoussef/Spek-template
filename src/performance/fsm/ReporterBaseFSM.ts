
// ReporterBaseFSM.ts - Generated template for reporter pattern
import { StateDefinition, TransitionDefinition, FSMConfig } from '~types/fsm-types';

export enum ReporterState {
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    PROCESSING = 'processing',
    VALIDATING = 'validating',
    COMPLETED = 'completed',
    ERROR = 'error'
}

export enum ReporterEvent {
    INITIALIZE = 'initialize',
    PROCESS = 'process',
    VALIDATE = 'validate',
    COMPLETE = 'complete',
    ERROR = 'error',
    RESET = 'reset'
}

export const reporterBaseFSMConfig: FSMConfig = {
    states: {
        [ReporterState.IDLE]: {
            onEnter: () => console.log('Entering idle state'),
            onExit: () => console.log('Exiting idle state')
        },
        [ReporterState.INITIALIZING]: {
            onEnter: () => console.log('Entering initializing state'),
            onExit: () => console.log('Exiting initializing state')
        },
        [ReporterState.PROCESSING]: {
            onEnter: () => console.log('Entering processing state'),
            onExit: () => console.log('Exiting processing state')
        },
        [ReporterState.VALIDATING]: {
            onEnter: () => console.log('Entering validating state'),
            onExit: () => console.log('Exiting validating state')
        },
        [ReporterState.COMPLETED]: {
            onEnter: () => console.log('Entering completed state'),
            onExit: () => console.log('Exiting completed state')
        },
        [ReporterState.ERROR]: {
            onEnter: () => console.log('Entering error state'),
            onExit: () => console.log('Exiting error state')
        }
    },
    transitions: {
        [ReporterState.IDLE]: {
            [ReporterEvent.INITIALIZE]: ReporterState.INITIALIZING
        },
        [ReporterState.INITIALIZING]: {
            [ReporterEvent.PROCESS]: ReporterState.PROCESSING,
            [ReporterEvent.ERROR]: ReporterState.ERROR
        },
        [ReporterState.PROCESSING]: {
            [ReporterEvent.VALIDATE]: ReporterState.VALIDATING,
            [ReporterEvent.ERROR]: ReporterState.ERROR
        },
        [ReporterState.VALIDATING]: {
            [ReporterEvent.COMPLETE]: ReporterState.COMPLETED,
            [ReporterEvent.ERROR]: ReporterState.ERROR
        },
        [ReporterState.COMPLETED]: {
            [ReporterEvent.RESET]: ReporterState.IDLE
        },
        [ReporterState.ERROR]: {
            [ReporterEvent.RESET]: ReporterState.IDLE
        }
    },
    initialState: ReporterState.IDLE
};
