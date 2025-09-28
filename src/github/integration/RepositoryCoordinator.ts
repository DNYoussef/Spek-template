import { RepositoryCoordinatorFSM, RepositoryCoordinationConfig } from '../fsm/RepositoryCoordinatorFSM';
import { GitHubOperationContext } from '../fsm/GitHubSharedTypes';
import { Logger } from '../../utils/Logger';

/**
 * Repository Coordinator (FSM Facade)
 * Delegates to RepositoryCoordinatorFSM for 90% line reduction
 * Original: 558 lines -> Facade: ~56 lines = 90% reduction
 */
export class RepositoryCoordinator {
  private fsm: RepositoryCoordinatorFSM;
  private logger: Logger;

  constructor(githubToken: string) {
    this.logger = new Logger('RepositoryCoordinator');

    const context: GitHubOperationContext = {
      operationId: this.generateId(),
      repository: 'default-repo',
      owner: 'default-owner',
      token: githubToken,
      retryCount: 0,
      maxRetries: 3,
      startTime: new Date(),
      metadata: {}
    };

    const config: RepositoryCoordinationConfig = {
      repositories: [],
      coordinationType: 'sync',
      autoCoordination: true
    };

    this.fsm = new RepositoryCoordinatorFSM(context, config);
  }

  /**
   * Coordinate repository operations
   */
  async coordinateRepositories(repositories: string[]): Promise<any> {
    await this.fsm.init();
    return this.fsm.coordinateRepositories(repositories);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `repo_coord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    await this.fsm.shutdown();
  }
}

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */
/* Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T11:08:18-04:00 | MEGA-086@Claude-Sonnet-4 | Converted Repository coordinator god object to FSM facade (558->56 lines, 90% reduction) | RepositoryCoordinator.ts | OK | Delegates to RepositoryCoordinatorFSM for state management | 0.00 | 7b5c9e3 |

Receipt:
- status: OK
- reason_if_blocked: --
- run_id: mega-086-repository-coordinator-facade
- inputs: ["RepositoryCoordinatorFSM.ts"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"repo-coordinator-facade-v1"}
*/
/* AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */