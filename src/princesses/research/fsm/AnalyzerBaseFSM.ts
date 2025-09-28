
// AnalyzerBaseFSM.ts - Generated template for analyzer pattern
import { StateDefinition, TransitionDefinition, FSMConfig } from '../../../types/fsm-types';

export enum AnalyzerState {
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    PROCESSING = 'processing',
    VALIDATING = 'validating',
    COMPLETED = 'completed',
    ERROR = 'error'
}

export enum AnalyzerEvent {
    INITIALIZE = 'initialize',
    PROCESS = 'process',
    VALIDATE = 'validate',
    COMPLETE = 'complete',
    ERROR = 'error',
    RESET = 'reset'
}

export const analyzerBaseFSMConfig: FSMConfig = {
    states: {
        [AnalyzerState.IDLE]: {
            onEnter: () => console.log('Entering idle state'),
            onExit: () => console.log('Exiting idle state')
        },
        [AnalyzerState.INITIALIZING]: {
            onEnter: () => console.log('Entering initializing state'),
            onExit: () => console.log('Exiting initializing state')
        },
        [AnalyzerState.PROCESSING]: {
            onEnter: () => console.log('Entering processing state'),
            onExit: () => console.log('Exiting processing state')
        },
        [AnalyzerState.VALIDATING]: {
            onEnter: () => console.log('Entering validating state'),
            onExit: () => console.log('Exiting validating state')
        },
        [AnalyzerState.COMPLETED]: {
            onEnter: () => console.log('Entering completed state'),
            onExit: () => console.log('Exiting completed state')
        },
        [AnalyzerState.ERROR]: {
            onEnter: () => console.log('Entering error state'),
            onExit: () => console.log('Exiting error state')
        }
    },
    transitions: {
        [AnalyzerState.IDLE]: {
            [AnalyzerEvent.INITIALIZE]: AnalyzerState.INITIALIZING
        },
        [AnalyzerState.INITIALIZING]: {
            [AnalyzerEvent.PROCESS]: AnalyzerState.PROCESSING,
            [AnalyzerEvent.ERROR]: AnalyzerState.ERROR
        },
        [AnalyzerState.PROCESSING]: {
            [AnalyzerEvent.VALIDATE]: AnalyzerState.VALIDATING,
            [AnalyzerEvent.ERROR]: AnalyzerState.ERROR
        },
        [AnalyzerState.VALIDATING]: {
            [AnalyzerEvent.COMPLETE]: AnalyzerState.COMPLETED,
            [AnalyzerEvent.ERROR]: AnalyzerState.ERROR
        },
        [AnalyzerState.COMPLETED]: {
            [AnalyzerEvent.RESET]: AnalyzerState.IDLE
        },
        [AnalyzerState.ERROR]: {
            [AnalyzerEvent.RESET]: AnalyzerState.IDLE
        }
    },
    initialState: AnalyzerState.IDLE
};
