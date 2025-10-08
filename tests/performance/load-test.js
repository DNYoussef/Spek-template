import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

/**
 * K6 Load Testing Script for SPEK Platform
 * Tests application performance under normal load conditions
 */

// Custom metrics
export let errorRate = new Rate('errors');

// Test configuration
export let options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp up to 10 users
    { duration: '5m', target: 50 },  // Stay at 50 users for 5 minutes
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.05'],   // Error rate must be below 5%
    errors: ['rate<0.05'],            // Custom error rate below 5%
  },
};

// Test data
const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function () {
  let response;

  // Test 1: Health check endpoint
  response = http.get(`${BASE_URL}/health`, {
    headers: { 'User-Agent': 'k6-load-test' },
    timeout: '10s'
  });

  check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 500ms': (r) => r.timings.duration < 500,
    'health check returns valid JSON': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: API status endpoint
  response = http.get(`${BASE_URL}/api/v1/status`, {
    headers: {
      'User-Agent': 'k6-load-test',
      'Accept': 'application/json'
    },
    timeout: '10s'
  });

  check(response, {
    'API status is 200': (r) => r.status === 200,
    'API response time < 1000ms': (r) => r.timings.duration < 1000,
    'API returns JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: Authentication flow simulation
  response = http.post(`${BASE_URL}/api/v1/auth/health`, JSON.stringify({
    test: true
  }), {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'k6-load-test'
    },
    timeout: '15s'
  });

  check(response, {
    'auth health check status ok': (r) => r.status >= 200 && r.status < 500,
    'auth response time < 2000ms': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);

  sleep(2);

  // Test 4: Static resource loading
  response = http.get(`${BASE_URL}/favicon.ico`, {
    headers: { 'User-Agent': 'k6-load-test' },
    timeout: '5s'
  });

  check(response, {
    'static resource loads': (r) => r.status === 200 || r.status === 404, // 404 is acceptable for favicon
    'static resource fast': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = `
${indent}Load Test Summary
${indent}================
${indent}
${indent}Test Duration: ${data.state.testRunDurationMs}ms
${indent}Virtual Users: ${data.options.stages?.map(s => `${s.target} users`).join(' -> ') || 'N/A'}
${indent}
${indent}Metrics:
${indent}  HTTP Requests: ${data.metrics.http_reqs?.values?.count || 0}
${indent}  Failed Requests: ${data.metrics.http_req_failed?.values?.rate * 100 || 0}%
${indent}  Average Response Time: ${data.metrics.http_req_duration?.values?.avg || 0}ms
${indent}  95th Percentile: ${data.metrics.http_req_duration?.values?.['p(95)'] || 0}ms
${indent}  99th Percentile: ${data.metrics.http_req_duration?.values?.['p(99)'] || 0}ms
${indent}
${indent}Thresholds:
${indent}  Response Time P95: ${data.metrics.http_req_duration?.thresholds?.['p(95)<500']?.ok ? 'PASS' : 'FAIL'}
${indent}  Error Rate: ${data.metrics.http_req_failed?.thresholds?.['rate<0.05']?.ok ? 'PASS' : 'FAIL'}
${indent}
`;

  if (data.metrics.errors) {
    summary += `${indent}  Custom Error Rate: ${data.metrics.errors.thresholds?.['rate<0.05']?.ok ? 'PASS' : 'FAIL'}\n`;
  }

  return summary;
}