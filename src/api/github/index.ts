import express from 'express';
import { Logger } from '../../utils/Logger';
import { GitHubProjectManager } from '../../github/integration/GitHubProjectManager';
import { WorkflowOrchestrator } from '../../github/integration/WorkflowOrchestrator';
import { RepositoryCoordinator } from '../../github/integration/RepositoryCoordinator';
import { IssueIntelligence } from '../../github/issues/IssueIntelligence';
import { PRLifecycleManager } from '../../github/pr/PRLifecycleManager';
import { SecurityPolicyAutomation } from '../../github/security/SecurityPolicyAutomation';
import { ProjectBoardIntelligence } from '../../github/projects/ProjectBoardIntelligence';
import { GitHubAPIOptimizer } from '../../github/api/GitHubAPIOptimizer';
import { QueenGitHubOrchestrator } from '../../github/integration/QueenGitHubOrchestrator';

/**
 * GitHub API Endpoints
 * Provides RESTful API for GitHub integration and management
 */

const router = express.Router();
const logger = new Logger('GitHubAPI');

// Initialize GitHub services (token would come from environment)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'your-github-token';

const projectManager = new GitHubProjectManager(GITHUB_TOKEN);
const workflowOrchestrator = new WorkflowOrchestrator(GITHUB_TOKEN);
const repositoryCoordinator = new RepositoryCoordinator(GITHUB_TOKEN);
const issueIntelligence = new IssueIntelligence(GITHUB_TOKEN);
const prLifecycleManager = new PRLifecycleManager(GITHUB_TOKEN);
const securityAutomation = new SecurityPolicyAutomation(GITHUB_TOKEN);
const projectIntelligence = new ProjectBoardIntelligence(projectManager['octokit']);
const queenOrchestrator = new QueenGitHubOrchestrator(GITHUB_TOKEN);

/**
 * Project Management Endpoints
 */

// GET /github/projects - List and manage GitHub projects
router.get('/projects', async (req, res) => {
  try {
    const { owner, repo } = req.query;

    if (!owner || !repo) {
      return res.status(400).json({
        error: 'Missing required parameters: owner, repo'
      });
    }

    const metrics = await projectManager.getProjectMetrics(parseInt(req.query.projectId as string));

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get project metrics', { error });
    res.status(500).json({
      error: 'Failed to get project metrics',
      message: error.message
    });
  }
});

// POST /github/projects - Create intelligent project
router.post('/projects', async (req, res) => {
  try {
    const { context } = req.body;

    if (!context) {
      return res.status(400).json({
        error: 'Missing required parameter: context'
      });
    }

    const project = await projectManager.createIntelligentProject(context);

    res.status(201).json({
      success: true,
      data: project,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to create project', { error });
    res.status(500).json({
      error: 'Failed to create project',
      message: error.message
    });
  }
});

/**
 * Workflow Management Endpoints
 */

// POST /github/workflows - Create and trigger workflows
router.post('/workflows', async (req, res) => {
  try {
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({
        error: 'Missing required parameter: config'
      });
    }

    const workflow = await workflowOrchestrator.generateIntelligentWorkflow(config);

    res.status(201).json({
      success: true,
      data: workflow,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to create workflow', { error });
    res.status(500).json({
      error: 'Failed to create workflow',
      message: error.message
    });
  }
});

// GET /github/workflows/:workflowId/execute - Execute workflow
router.get('/workflows/:workflowId/execute', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const context = req.query;

    const execution = await workflowOrchestrator.executeWorkflow(workflowId, context);

    res.json({
      success: true,
      data: execution,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to execute workflow', { error });
    res.status(500).json({
      error: 'Failed to execute workflow',
      message: error.message
    });
  }
});

/**
 * Issue Management Endpoints
 */

// PUT /github/issues - Intelligent issue management
router.put('/issues', async (req, res) => {
  try {
    const { owner, repo, issueNumber } = req.body;

    if (!owner || !repo || !issueNumber) {
      return res.status(400).json({
        error: 'Missing required parameters: owner, repo, issueNumber'
      });
    }

    const result = await issueIntelligence.processNewIssue(owner, repo, issueNumber);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to process issue', { error });
    res.status(500).json({
      error: 'Failed to process issue',
      message: error.message
    });
  }
});

// GET /github/issues/analytics - Issue analytics and insights
router.get('/issues/analytics', async (req, res) => {
  try {
    const { owner, repo } = req.query;

    if (!owner || !repo) {
      return res.status(400).json({
        error: 'Missing required parameters: owner, repo'
      });
    }

    const analytics = await issueIntelligence.analyzeRepositoryIssues(owner as string, repo as string);

    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get issue analytics', { error });
    res.status(500).json({
      error: 'Failed to get issue analytics',
      message: error.message
    });
  }
});

/**
 * Pull Request Management Endpoints
 */

// POST /github/pr/lifecycle - Initialize PR lifecycle
router.post('/pr/lifecycle', async (req, res) => {
  try {
    const { owner, repo, pullNumber } = req.body;

    if (!owner || !repo || !pullNumber) {
      return res.status(400).json({
        error: 'Missing required parameters: owner, repo, pullNumber'
      });
    }

    const lifecycle = await prLifecycleManager.initializePRLifecycle(owner, repo, pullNumber);

    res.status(201).json({
      success: true,
      data: lifecycle,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to initialize PR lifecycle', { error });
    res.status(500).json({
      error: 'Failed to initialize PR lifecycle',
      message: error.message
    });
  }
});

// GET /github/pr/:pullNumber/health - Monitor PR health
router.get('/pr/:pullNumber/health', async (req, res) => {
  try {
    const { pullNumber } = req.params;
    const { owner, repo } = req.query;

    if (!owner || !repo) {
      return res.status(400).json({
        error: 'Missing required parameters: owner, repo'
      });
    }

    const health = await prLifecycleManager.monitorPRHealth(
      owner as string,
      repo as string,
      parseInt(pullNumber)
    );

    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to monitor PR health', { error });
    res.status(500).json({
      error: 'Failed to monitor PR health',
      message: error.message
    });
  }
});

/**
 * Repository Coordination Endpoints
 */

// POST /github/coordination - Multi-repo coordination
router.post('/coordination', async (req, res) => {
  try {
    const { repositories, operation } = req.body;

    if (!repositories || !operation) {
      return res.status(400).json({
        error: 'Missing required parameters: repositories, operation'
      });
    }

    const result = await repositoryCoordinator.coordinateAtomicOperation(repositories, operation);

    res.status(201).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to coordinate repositories', { error });
    res.status(500).json({
      error: 'Failed to coordinate repositories',
      message: error.message
    });
  }
});

// GET /github/coordination/health - Repository health monitoring
router.get('/coordination/health', async (req, res) => {
  try {
    const { repositories } = req.query;

    if (!repositories) {
      return res.status(400).json({
        error: 'Missing required parameter: repositories'
      });
    }

    const repoArray = Array.isArray(repositories) ? repositories : [repositories];
    const health = await repositoryCoordinator.monitorRepositoryHealth(repoArray as string[]);

    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to monitor repository health', { error });
    res.status(500).json({
      error: 'Failed to monitor repository health',
      message: error.message
    });
  }
});

/**
 * Security Management Endpoints
 */

// POST /github/security/policies - Apply security policies
router.post('/security/policies', async (req, res) => {
  try {
    const { owner, repo, policies } = req.body;

    if (!owner || !repo || !policies) {
      return res.status(400).json({
        error: 'Missing required parameters: owner, repo, policies'
      });
    }

    const result = await securityAutomation.applySecurityPolicies(owner, repo, policies);

    res.status(201).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to apply security policies', { error });
    res.status(500).json({
      error: 'Failed to apply security policies',
      message: error.message
    });
  }
});

// GET /github/security/report - Security status and remediation
router.get('/security/report', async (req, res) => {
  try {
    const { owner, repo } = req.query;

    if (!owner || !repo) {
      return res.status(400).json({
        error: 'Missing required parameters: owner, repo'
      });
    }

    const report = await securityAutomation.generateSecurityReport(owner as string, repo as string);

    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to generate security report', { error });
    res.status(500).json({
      error: 'Failed to generate security report',
      message: error.message
    });
  }
});

/**
 * Project Board Intelligence Endpoints
 */

// GET /github/projects/:projectId/insights - Project analytics and insights
router.get('/projects/:projectId/insights', async (req, res) => {
  try {
    const { projectId } = req.params;

    const insights = await projectIntelligence.generateProjectInsights(parseInt(projectId));

    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to generate project insights', { error });
    res.status(500).json({
      error: 'Failed to generate project insights',
      message: error.message
    });
  }
});

// POST /github/projects/:projectId/automate - Automate project management
router.post('/projects/:projectId/automate', async (req, res) => {
  try {
    const { projectId } = req.params;

    const automation = await projectIntelligence.automateProjectManagement(parseInt(projectId));

    res.status(201).json({
      success: true,
      data: automation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to automate project management', { error });
    res.status(500).json({
      error: 'Failed to automate project management',
      message: error.message
    });
  }
});

/**
 * Queen Orchestration Endpoints
 */

// POST /github/orchestration - Orchestrate GitHub integration
router.post('/orchestration', async (req, res) => {
  try {
    const { repositories, domains, integrationLevel } = req.body;

    if (!repositories || !domains) {
      return res.status(400).json({
        error: 'Missing required parameters: repositories, domains'
      });
    }

    const orchestration = await queenOrchestrator.orchestrateGitHubIntegration(
      repositories,
      domains,
      integrationLevel
    );

    res.status(201).json({
      success: true,
      data: orchestration,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to orchestrate GitHub integration', { error });
    res.status(500).json({
      error: 'Failed to orchestrate GitHub integration',
      message: error.message
    });
  }
});

// POST /github/orchestration/princess - Coordinate Princess operations
router.post('/orchestration/princess', async (req, res) => {
  try {
    const { domain, operations, priority } = req.body;

    if (!domain || !operations) {
      return res.status(400).json({
        error: 'Missing required parameters: domain, operations'
      });
    }

    const coordination = await queenOrchestrator.coordinatePrincessGitHubOperations(
      domain,
      operations,
      priority
    );

    res.status(201).json({
      success: true,
      data: coordination,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to coordinate Princess operations', { error });
    res.status(500).json({
      error: 'Failed to coordinate Princess operations',
      message: error.message
    });
  }
});

/**
 * Health Check Endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'GitHub Integration API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * Error handling middleware
 */
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled API error', { error, path: req.path });

  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

export default router;

// Version & Run Log
// | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
// |---------|-----------|-------------|----------------|-----------|--------|-------|------|------|
// | 1.0.0   | 2025-01-27T20:56:00Z | assistant@claude-sonnet-4 | Initial GitHub API endpoints with comprehensive integration management | index.ts | OK | Complete RESTful API for GitHub integration with all service endpoints | 0.00 | f7d8b6a |

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: github-phase8-api-endpoints-001
// inputs: ["GitHub API requirements", "RESTful endpoint specifications"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"api-endpoints-v1"}