
// DashboardBaseFSM.ts - Generated template for dashboard pattern
import { StateDefinition, TransitionDefinition, FSMConfig } from '../../../types/fsm-types';

export enum DashboardState {
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    PROCESSING = 'processing',
    VALIDATING = 'validating',
    COMPLETED = 'completed',
    ERROR = 'error'
}

export enum DashboardEvent {
    INITIALIZE = 'initialize',
    PROCESS = 'process',
    VALIDATE = 'validate',
    COMPLETE = 'complete',
    ERROR = 'error',
    RESET = 'reset'
}

export const dashboardBaseFSMConfig: FSMConfig = {
    states: {
        [DashboardState.IDLE]: {
            onEnter: () => console.log('Entering idle state'),
            onExit: () => console.log('Exiting idle state')
        },
        [DashboardState.INITIALIZING]: {
            onEnter: () => console.log('Entering initializing state'),
            onExit: () => console.log('Exiting initializing state')
        },
        [DashboardState.PROCESSING]: {
            onEnter: () => console.log('Entering processing state'),
            onExit: () => console.log('Exiting processing state')
        },
        [DashboardState.VALIDATING]: {
            onEnter: () => console.log('Entering validating state'),
            onExit: () => console.log('Exiting validating state')
        },
        [DashboardState.COMPLETED]: {
            onEnter: () => console.log('Entering completed state'),
            onExit: () => console.log('Exiting completed state')
        },
        [DashboardState.ERROR]: {
            onEnter: () => console.log('Entering error state'),
            onExit: () => console.log('Exiting error state')
        }
    },
    transitions: {
        [DashboardState.IDLE]: {
            [DashboardEvent.INITIALIZE]: DashboardState.INITIALIZING
        },
        [DashboardState.INITIALIZING]: {
            [DashboardEvent.PROCESS]: DashboardState.PROCESSING,
            [DashboardEvent.ERROR]: DashboardState.ERROR
        },
        [DashboardState.PROCESSING]: {
            [DashboardEvent.VALIDATE]: DashboardState.VALIDATING,
            [DashboardEvent.ERROR]: DashboardState.ERROR
        },
        [DashboardState.VALIDATING]: {
            [DashboardEvent.COMPLETE]: DashboardState.COMPLETED,
            [DashboardEvent.ERROR]: DashboardState.ERROR
        },
        [DashboardState.COMPLETED]: {
            [DashboardEvent.RESET]: DashboardState.IDLE
        },
        [DashboardState.ERROR]: {
            [DashboardEvent.RESET]: DashboardState.IDLE
        }
    },
    initialState: DashboardState.IDLE
};
