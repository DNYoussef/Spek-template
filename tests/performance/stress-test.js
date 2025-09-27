import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';

/**
 * K6 Stress Testing Script for SPEK Platform
 * Tests application performance under high load conditions
 */

// Custom metrics
export let errorRate = new Rate('errors');
export let stressFailures = new Counter('stress_failures');

// Stress test configuration
export let options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Stress test with 100 users
    { duration: '1m', target: 150 },   // Peak stress with 150 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s during stress
    http_req_failed: ['rate<0.10'],    // Error rate under 10% during stress
    errors: ['rate<0.10'],             // Custom error rate under 10%
  },
};

// Test configuration
const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

// Stress test scenarios
const scenarios = [
  'health_check',
  'api_stress',
  'concurrent_requests',
  'resource_exhaustion'
];

export default function () {
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

  switch (scenario) {
    case 'health_check':
      healthCheckStress();
      break;
    case 'api_stress':
      apiStress();
      break;
    case 'concurrent_requests':
      concurrentRequestsStress();
      break;
    case 'resource_exhaustion':
      resourceExhaustionStress();
      break;
  }

  sleep(Math.random() * 2 + 1); // Random sleep between 1-3 seconds
}

function healthCheckStress() {
  const response = http.get(`${BASE_URL}/health`, {
    headers: { 'User-Agent': 'k6-stress-test' },
    timeout: '30s'
  });

  const success = check(response, {
    'health check responds': (r) => r.status !== 0,
    'health check not 5xx': (r) => r.status < 500,
    'health check under 5s': (r) => r.timings.duration < 5000,
  });

  if (!success) {
    errorRate.add(1);
    stressFailures.add(1);
  }
}

function apiStress() {
  const endpoints = [
    '/api/v1/status',
    '/api/v1/health',
    '/health/ready',
    '/metrics'
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

  const response = http.get(`${BASE_URL}${endpoint}`, {
    headers: {
      'User-Agent': 'k6-stress-test',
      'Accept': 'application/json'
    },
    timeout: '30s'
  });

  const success = check(response, {
    'API endpoint responds': (r) => r.status !== 0,
    'API not server error': (r) => r.status < 500,
    'API responds in reasonable time': (r) => r.timings.duration < 10000,
  });

  if (!success) {
    errorRate.add(1);
    stressFailures.add(1);
  }
}

function concurrentRequestsStress() {
  // Simulate multiple concurrent requests from same user
  const requests = [];

  for (let i = 0; i < 3; i++) {
    requests.push([
      'GET',
      `${BASE_URL}/health`,
      null,
      {
        headers: { 'User-Agent': 'k6-stress-concurrent' },
        timeout: '30s'
      }
    ]);
  }

  const responses = http.batch(requests);

  let successCount = 0;
  responses.forEach((response, index) => {
    const success = check(response, {
      [`concurrent request ${index} responds`]: (r) => r.status !== 0,
      [`concurrent request ${index} not 5xx`]: (r) => r.status < 500,
    });

    if (success) successCount++;
  });

  if (successCount < responses.length * 0.8) { // At least 80% should succeed
    errorRate.add(1);
    stressFailures.add(1);
  }
}

function resourceExhaustionStress() {
  // Test with larger payloads to stress memory/CPU
  const largePayload = {
    test: 'stress_test',
    data: 'x'.repeat(1024), // 1KB of data
    timestamp: new Date().toISOString(),
    iteration: Math.floor(Math.random() * 10000)
  };

  const response = http.post(`${BASE_URL}/api/v1/auth/health`, JSON.stringify(largePayload), {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'k6-stress-resource'
    },
    timeout: '45s'
  });

  const success = check(response, {
    'resource stress responds': (r) => r.status !== 0,
    'resource stress completes': (r) => r.status < 500,
    'resource stress reasonable time': (r) => r.timings.duration < 15000,
  });

  if (!success) {
    errorRate.add(1);
    stressFailures.add(1);
  }
}

export function handleSummary(data) {
  const summary = generateStressSummary(data);

  return {
    'stress-test-results.json': JSON.stringify(data, null, 2),
    'stress-test-summary.txt': summary,
    stdout: summary,
  };
}

function generateStressSummary(data) {
  const duration = data.state.testRunDurationMs;
  const totalRequests = data.metrics.http_reqs?.values?.count || 0;
  const failedRequests = (data.metrics.http_req_failed?.values?.rate || 0) * 100;
  const avgResponseTime = data.metrics.http_req_duration?.values?.avg || 0;
  const p95ResponseTime = data.metrics.http_req_duration?.values?.['p(95)'] || 0;
  const p99ResponseTime = data.metrics.http_req_duration?.values?.['p(99)'] || 0;
  const stressFailureCount = data.metrics.stress_failures?.values?.count || 0;

  const summary = `
STRESS TEST RESULTS
==================

Test Configuration:
  Duration: ${Math.round(duration / 1000)}s
  Peak Virtual Users: 150
  Test Type: High Load Stress Test

Performance Metrics:
  Total Requests: ${totalRequests}
  Failed Requests: ${failedRequests.toFixed(2)}%
  Average Response Time: ${avgResponseTime.toFixed(2)}ms
  95th Percentile: ${p95ResponseTime.toFixed(2)}ms
  99th Percentile: ${p99ResponseTime.toFixed(2)}ms
  Stress Failures: ${stressFailureCount}

Threshold Results:
  Response Time P95 < 2s: ${(p95ResponseTime < 2000) ? 'PASS ✓' : 'FAIL ✗'}
  Error Rate < 10%: ${(failedRequests < 10) ? 'PASS ✓' : 'FAIL ✗'}

Overall Assessment:
${assessStressResults(failedRequests, p95ResponseTime, stressFailureCount)}

Recommendations:
${generateRecommendations(failedRequests, p95ResponseTime, stressFailureCount)}
`;

  return summary;
}

function assessStressResults(failedRequests, p95ResponseTime, stressFailures) {
  if (failedRequests < 5 && p95ResponseTime < 1000 && stressFailures < 10) {
    return "  🟢 EXCELLENT - System handles stress very well";
  } else if (failedRequests < 10 && p95ResponseTime < 2000 && stressFailures < 50) {
    return "  🟡 ACCEPTABLE - System shows some strain but remains functional";
  } else {
    return "  🔴 CONCERNING - System shows significant stress degradation";
  }
}

function generateRecommendations(failedRequests, p95ResponseTime, stressFailures) {
  const recommendations = [];

  if (failedRequests > 10) {
    recommendations.push("- Consider implementing circuit breakers for high error rates");
    recommendations.push("- Review error handling and graceful degradation strategies");
  }

  if (p95ResponseTime > 2000) {
    recommendations.push("- Investigate performance bottlenecks in slow endpoints");
    recommendations.push("- Consider caching strategies for frequently accessed data");
    recommendations.push("- Review database query performance under load");
  }

  if (stressFailures > 50) {
    recommendations.push("- Implement better resource management and connection pooling");
    recommendations.push("- Consider horizontal scaling for peak traffic");
    recommendations.push("- Review memory management and garbage collection");
  }

  if (recommendations.length === 0) {
    recommendations.push("- Current performance is acceptable for stress conditions");
    recommendations.push("- Consider monitoring these metrics in production");
  }

  return recommendations.join('\n');
}