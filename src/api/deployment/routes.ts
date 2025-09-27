import { Router } from 'express';
import { DeploymentController } from './DeploymentController';
import { authMiddleware } from '../middleware/auth';
import { validationMiddleware } from '../middleware/validation';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import { auditMiddleware } from '../middleware/audit';

const router = Router();
const deploymentController = new DeploymentController();

// Apply middleware to all deployment routes
router.use(authMiddleware);
router.use(auditMiddleware);

// Core deployment endpoints
router.post('/deploy',
  rateLimitMiddleware({ requests: 10, window: 60000 }), // 10 requests per minute
  validationMiddleware('deploymentRequest'),
  deploymentController.deploy.bind(deploymentController)
);

router.get('/status/:deploymentId',
  deploymentController.getDeploymentStatus.bind(deploymentController)
);

router.post('/rollback/:deploymentId',
  rateLimitMiddleware({ requests: 5, window: 60000 }), // 5 rollbacks per minute
  validationMiddleware('rollbackRequest'),
  deploymentController.rollback.bind(deploymentController)
);

router.post('/promote',
  rateLimitMiddleware({ requests: 3, window: 300000 }), // 3 promotions per 5 minutes
  validationMiddleware('promotionRequest'),
  deploymentController.promoteEnvironment.bind(deploymentController)
);

// Environment management
router.get('/environments',
  deploymentController.listEnvironments.bind(deploymentController)
);

// Metrics and monitoring
router.get('/metrics/:deploymentId',
  deploymentController.getMetrics.bind(deploymentController)
);

router.get('/metrics/:deploymentId/report',
  deploymentController.generateMetricsReport.bind(deploymentController)
);

router.get('/alerts',
  deploymentController.getActiveAlerts.bind(deploymentController)
);

router.post('/alerts/rules',
  rateLimitMiddleware({ requests: 20, window: 3600000 }), // 20 rules per hour
  validationMiddleware('alertRule'),
  deploymentController.createAlertRule.bind(deploymentController)
);

// Blue-green deployment specific
router.get('/blue-green/:applicationName/status',
  deploymentController.getBlueGreenStatus.bind(deploymentController)
);

router.post('/blue-green/:applicationName/switch',
  rateLimitMiddleware({ requests: 5, window: 300000 }), // 5 switches per 5 minutes
  validationMiddleware('trafficSwitch'),
  deploymentController.switchTraffic.bind(deploymentController)
);

// Scaling
router.post('/scale',
  rateLimitMiddleware({ requests: 10, window: 300000 }), // 10 scaling operations per 5 minutes
  validationMiddleware('scalingRequest'),
  deploymentController.scale.bind(deploymentController)
);

// Security
router.get('/security/scan/:imageTag',
  deploymentController.getSecurityScan.bind(deploymentController)
);

// Rollback management
router.get('/rollback/:deploymentId/history',
  deploymentController.getRollbackHistory.bind(deploymentController)
);

// Active deployments
router.get('/active',
  deploymentController.getActiveDeployments.bind(deploymentController)
);

// Queen integration endpoints
router.post('/queen/orders',
  rateLimitMiddleware({ requests: 50, window: 60000 }), // 50 orders per minute
  validationMiddleware('queenOrder'),
  deploymentController.receiveQueenOrder.bind(deploymentController)
);

router.get('/queen/orders/:orderId/status',
  deploymentController.getQueenOrderStatus.bind(deploymentController)
);

export { router as deploymentRoutes };