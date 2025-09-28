
// ProtocolBaseFSM.ts - Generated template for protocol pattern
import { StateDefinition, TransitionDefinition, FSMConfig } from '../../../types/fsm-types';

export enum ProtocolState {
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    PROCESSING = 'processing',
    VALIDATING = 'validating',
    COMPLETED = 'completed',
    ERROR = 'error'
}

export enum ProtocolEvent {
    INITIALIZE = 'initialize',
    PROCESS = 'process',
    VALIDATE = 'validate',
    COMPLETE = 'complete',
    ERROR = 'error',
    RESET = 'reset'
}

export const protocolBaseFSMConfig: FSMConfig = {
    states: {
        [ProtocolState.IDLE]: {
            onEnter: () => console.log('Entering idle state'),
            onExit: () => console.log('Exiting idle state')
        },
        [ProtocolState.INITIALIZING]: {
            onEnter: () => console.log('Entering initializing state'),
            onExit: () => console.log('Exiting initializing state')
        },
        [ProtocolState.PROCESSING]: {
            onEnter: () => console.log('Entering processing state'),
            onExit: () => console.log('Exiting processing state')
        },
        [ProtocolState.VALIDATING]: {
            onEnter: () => console.log('Entering validating state'),
            onExit: () => console.log('Exiting validating state')
        },
        [ProtocolState.COMPLETED]: {
            onEnter: () => console.log('Entering completed state'),
            onExit: () => console.log('Exiting completed state')
        },
        [ProtocolState.ERROR]: {
            onEnter: () => console.log('Entering error state'),
            onExit: () => console.log('Exiting error state')
        }
    },
    transitions: {
        [ProtocolState.IDLE]: {
            [ProtocolEvent.INITIALIZE]: ProtocolState.INITIALIZING
        },
        [ProtocolState.INITIALIZING]: {
            [ProtocolEvent.PROCESS]: ProtocolState.PROCESSING,
            [ProtocolEvent.ERROR]: ProtocolState.ERROR
        },
        [ProtocolState.PROCESSING]: {
            [ProtocolEvent.VALIDATE]: ProtocolState.VALIDATING,
            [ProtocolEvent.ERROR]: ProtocolState.ERROR
        },
        [ProtocolState.VALIDATING]: {
            [ProtocolEvent.COMPLETE]: ProtocolState.COMPLETED,
            [ProtocolEvent.ERROR]: ProtocolState.ERROR
        },
        [ProtocolState.COMPLETED]: {
            [ProtocolEvent.RESET]: ProtocolState.IDLE
        },
        [ProtocolState.ERROR]: {
            [ProtocolEvent.RESET]: ProtocolState.IDLE
        }
    },
    initialState: ProtocolState.IDLE
};
