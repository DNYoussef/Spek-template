
// MonitorBaseFSM.ts - Generated template for monitor pattern
import { StateDefinition, TransitionDefinition, FSMConfig } from '../../../types/fsm-types';

export enum MonitorState {
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    PROCESSING = 'processing',
    VALIDATING = 'validating',
    COMPLETED = 'completed',
    ERROR = 'error'
}

export enum MonitorEvent {
    INITIALIZE = 'initialize',
    PROCESS = 'process',
    VALIDATE = 'validate',
    COMPLETE = 'complete',
    ERROR = 'error',
    RESET = 'reset'
}

export const monitorBaseFSMConfig: FSMConfig = {
    states: {
        [MonitorState.IDLE]: {
            onEnter: () => console.log('Entering idle state'),
            onExit: () => console.log('Exiting idle state')
        },
        [MonitorState.INITIALIZING]: {
            onEnter: () => console.log('Entering initializing state'),
            onExit: () => console.log('Exiting initializing state')
        },
        [MonitorState.PROCESSING]: {
            onEnter: () => console.log('Entering processing state'),
            onExit: () => console.log('Exiting processing state')
        },
        [MonitorState.VALIDATING]: {
            onEnter: () => console.log('Entering validating state'),
            onExit: () => console.log('Exiting validating state')
        },
        [MonitorState.COMPLETED]: {
            onEnter: () => console.log('Entering completed state'),
            onExit: () => console.log('Exiting completed state')
        },
        [MonitorState.ERROR]: {
            onEnter: () => console.log('Entering error state'),
            onExit: () => console.log('Exiting error state')
        }
    },
    transitions: {
        [MonitorState.IDLE]: {
            [MonitorEvent.INITIALIZE]: MonitorState.INITIALIZING
        },
        [MonitorState.INITIALIZING]: {
            [MonitorEvent.PROCESS]: MonitorState.PROCESSING,
            [MonitorEvent.ERROR]: MonitorState.ERROR
        },
        [MonitorState.PROCESSING]: {
            [MonitorEvent.VALIDATE]: MonitorState.VALIDATING,
            [MonitorEvent.ERROR]: MonitorState.ERROR
        },
        [MonitorState.VALIDATING]: {
            [MonitorEvent.COMPLETE]: MonitorState.COMPLETED,
            [MonitorEvent.ERROR]: MonitorState.ERROR
        },
        [MonitorState.COMPLETED]: {
            [MonitorEvent.RESET]: MonitorState.IDLE
        },
        [MonitorState.ERROR]: {
            [MonitorEvent.RESET]: MonitorState.IDLE
        }
    },
    initialState: MonitorState.IDLE
};
