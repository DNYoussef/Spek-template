/**
 * Test suite for Feature Flag API Server
 * Tests RESTful API endpoints and WebSocket functionality
 */

const request = require('supertest');
const WebSocket = require('ws');
const FeatureFlagAPIServer = require('../../../src/enterprise/feature-flags/api-server');
const { cleanupTestResources } = require('../../setup/test-environment');

describe('FeatureFlagAPIServer', () => {
    let server;
    let app;
    let wsClient;

    beforeAll(async () => {
        server = new FeatureFlagAPIServer({
            port: 3100,
            wsPort: 3101,
            configPath: null, // Skip loading config file in tests
            enableRateLimit: false // Disable for tests
        });

        // Initialize with test flags
        try {
            await server.flagManager.initialize({
                test_flag: {
                    enabled: true,
                    rolloutStrategy: 'boolean'
                },
                percentage_flag: {
                    enabled: true,
                    rolloutStrategy: 'percentage',
                    rolloutPercentage: 50
                }
            });
        } catch (error) {
            console.warn('Flag initialization failed:', error.message);
        }

        app = server.app;
    }, 30000);

    afterAll(async () => {
        if (wsClient) {
            wsClient.close();
        }
        if (server && typeof server.shutdown === 'function') {
            await server.shutdown();
        }
        await cleanupTestResources();
    }, 10000);

    describe('Health Check', () => {
        test('GET /api/health should return health status', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body.healthy).toBe(true);
            expect(response.body.stats).toBeDefined();
        });
    });

    describe('Flag Management', () => {
        test('GET /api/flags should return all flags', async () => {
            const response = await request(app)
                .get('/api/flags')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.count).toBeGreaterThan(0);
        });

        test('GET /api/flags/:key should return specific flag', async () => {
            const response = await request(app)
                .get('/api/flags/test_flag')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.key).toBe('test_flag');
            expect(response.body.data.enabled).toBe(true);
        });

        test('GET /api/flags/:key should return 404 for non-existent flag', async () => {
            const response = await request(app)
                .get('/api/flags/non_existent')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Flag not found');
        });

        test('POST /api/flags should create new flag', async () => {
            const newFlag = {
                key: 'new_test_flag',
                config: {
                    enabled: false,
                    rolloutStrategy: 'boolean'
                }
            };

            const response = await request(app)
                .post('/api/flags')
                .send(newFlag)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.key).toBe('new_test_flag');
            expect(response.body.data.enabled).toBe(false);
        });

        test('POST /api/flags should return 400 for invalid data', async () => {
            const invalidFlag = {
                key: 'invalid_flag'
                // Missing config
            };

            const response = await request(app)
                .post('/api/flags')
                .send(invalidFlag)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('config are required');
        });

        test('PUT /api/flags/:key should update flag', async () => {
            const updates = {
                enabled: false,
                metadata: { description: 'Updated flag' }
            };

            const response = await request(app)
                .put('/api/flags/test_flag')
                .send(updates)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.enabled).toBe(false);
            expect(response.body.data.version).toBeGreaterThan(1);
        });

        test('PUT /api/flags/:key should return 404 for non-existent flag', async () => {
            const response = await request(app)
                .put('/api/flags/non_existent')
                .send({ enabled: true })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        test('PATCH /api/flags/:key/toggle should toggle flag', async () => {
            // Get current state
            const currentResponse = await request(app)
                .get('/api/flags/test_flag')
                .expect(200);

            const currentEnabled = currentResponse.body.data.enabled;

            // Toggle flag
            const toggleResponse = await request(app)
                .patch('/api/flags/test_flag/toggle')
                .expect(200);

            expect(toggleResponse.body.success).toBe(true);
            expect(toggleResponse.body.data.enabled).toBe(!currentEnabled);
        });
    });

    describe('Flag Evaluation', () => {
        test('POST /api/flags/:key/evaluate should evaluate flag', async () => {
            const context = {
                context: {
                    userId: 'test_user',
                    environment: 'test'
                }
            };

            const response = await request(app)
                .post('/api/flags/test_flag/evaluate')
                .send(context)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.flagKey).toBe('test_flag');
            expect(typeof response.body.data.result).toBe('boolean');
        });

        test('POST /api/flags/evaluate should batch evaluate flags', async () => {
            const batchRequest = {
                flags: ['test_flag', 'percentage_flag'],
                context: {
                    userId: 'batch_user'
                }
            };

            const response = await request(app)
                .post('/api/flags/evaluate')
                .send(batchRequest)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.test_flag).toBeDefined();
            expect(response.body.data.percentage_flag).toBeDefined();
        });

        test('POST /api/flags/evaluate should return 400 for invalid request', async () => {
            const invalidRequest = {
                flags: 'not_an_array'
            };

            const response = await request(app)
                .post('/api/flags/evaluate')
                .send(invalidRequest)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('flags must be an array');
        });
    });

    describe('Statistics and Monitoring', () => {
        test('GET /api/statistics should return statistics', async () => {
            const response = await request(app)
                .get('/api/statistics')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.flagCount).toBeGreaterThan(0);
            expect(response.body.data.evaluationCount).toBeGreaterThanOrEqual(0);
        });

        test('GET /api/audit should return audit log', async () => {
            const response = await request(app)
                .get('/api/audit')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        test('GET /api/audit should filter by category', async () => {
            const response = await request(app)
                .get('/api/audit?category=SYSTEM')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.every(entry => entry.category === 'SYSTEM')).toBe(true);
        });

        test('GET /api/audit should limit results', async () => {
            const response = await request(app)
                .get('/api/audit?limit=5')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeLessThanOrEqual(5);
        });
    });

    describe('Import/Export', () => {
        test('GET /api/export should export flags', async () => {
            const response = await request(app)
                .get('/api/export')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.flags).toBeDefined();
            expect(response.body.data.version).toBe('1.0');
        });

        test('POST /api/import should import flags', async () => {
            const importData = {
                flags: {
                    imported_flag: {
                        enabled: true,
                        rolloutStrategy: 'boolean'
                    }
                },
                version: '1.0'
            };

            const response = await request(app)
                .post('/api/import')
                .send(importData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('imported successfully');
        });
    });

    describe('Rollback', () => {
        test('POST /api/flags/:key/rollback should rollback flag', async () => {
            // First update the flag to create history
            await request(app)
                .put('/api/flags/test_flag')
                .send({ enabled: true });

            // Then rollback
            const response = await request(app)
                .post('/api/flags/test_flag/rollback')
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        test('POST /api/flags/:key/rollback should return 404 for non-existent flag', async () => {
            const response = await request(app)
                .post('/api/flags/non_existent/rollback')
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('WebSocket Integration', () => {
        test('should connect to WebSocket server', async () => {
            wsClient = new WebSocket('ws://localhost:3101');

            await new Promise((resolve, reject) => {
                wsClient.on('open', () => {
                    expect(wsClient.readyState).toBe(WebSocket.OPEN);
                    resolve();
                });

                wsClient.on('error', reject);

                // Timeout after 5 seconds
                setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
            });
        });

        test('should receive initial state on connection', async () => {
            if (!wsClient) {
                wsClient = new WebSocket('ws://localhost:3101');
            }

            await new Promise((resolve, reject) => {
                wsClient.on('message', (data) => {
                    const message = JSON.parse(data.toString());

                    if (message.type === 'initial_state') {
                        expect(message.data).toBeInstanceOf(Array);
                        expect(message.data.length).toBeGreaterThan(0);
                        resolve();
                    }
                });

                // Timeout after 5 seconds
                setTimeout(() => reject(new Error('Initial state timeout')), 5000);
            });
        });

        test('should receive flag update notifications', async () => {
            if (!wsClient) {
                wsClient = new WebSocket('ws://localhost:3101');
            }

            const updatePromise = new Promise((resolve, reject) => {
                wsClient.on('message', (data) => {
                    const message = JSON.parse(data.toString());

                    if (message.type === 'flag_updated') {
                        expect(message.data.key).toBeDefined();
                        expect(message.data.flag).toBeDefined();
                        resolve();
                    }
                });

                // Timeout after 5 seconds
                setTimeout(() => reject(new Error('Flag update notification timeout')), 5000);
            });

            // Update a flag to trigger notification (no setTimeout)
            await new Promise(resolve => setImmediate(resolve)); // Allow message listener to be set
            await request(app)
                .put('/api/flags/test_flag')
                .send({ metadata: { updated: Date.now() } });

            await updatePromise;
        });
    });

    describe('Error Handling', () => {
        test('should handle malformed JSON requests', async () => {
            const response = await request(app)
                .post('/api/flags')
                .set('Content-Type', 'application/json')
                .send('invalid json')
                .expect(400);

            // Express will handle this and return 400
        });

        test('should handle server errors gracefully', async () => {
            // Mock a server error
            const originalEvaluate = server.flagManager.evaluate;
            server.flagManager.evaluate = jest.fn().mockRejectedValue(new Error('Test error'));

            const response = await request(app)
                .post('/api/flags/test_flag/evaluate')
                .send({ context: {} })
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Test error');

            // Restore original method
            server.flagManager.evaluate = originalEvaluate;
        });
    });

    describe('Rate Limiting', () => {
        test('should not rate limit in test environment', async () => {
            // Make multiple requests quickly
            const requests = [];
            for (let i = 0; i < 10; i++) {
                requests.push(request(app).get('/api/health'));
            }

            const responses = await Promise.all(requests);
            responses.forEach(response => {
                expect(response.status).toBe(200);
            });
        });
    });

    describe('Configuration Reload', () => {
        test('POST /api/reload should trigger configuration reload', async () => {
            const response = await request(app)
                .post('/api/reload')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('reloaded successfully');
        });
    });
});