import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

/**
 * K6 Baseline Performance Check for SPEK Platform
 * Quick performance validation after deployment
 */

// Custom metrics
export let baselineResponseTime = new Trend('baseline_response_time');
export let baselineErrorRate = new Rate('baseline_errors');

// Baseline test configuration - lightweight and fast
export let options = {
  stages: [
    { duration: '10s', target: 5 },   // Quick ramp up to 5 users
    { duration: '20s', target: 10 },  // Maintain 10 users for baseline
    { duration: '10s', target: 0 },   // Quick ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% under 1s for baseline
    http_req_failed: ['rate<0.02'],    // Error rate under 2% for baseline
    baseline_response_time: ['avg<500'], // Average under 500ms
    baseline_errors: ['rate<0.02'],    // Baseline error rate under 2%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function () {
  // Critical baseline checks
  runBaselineChecks();
  sleep(1);
}

function runBaselineChecks() {
  // 1. Health Check - Most critical
  let response = http.get(`${BASE_URL}/health`, {
    headers: { 'User-Agent': 'k6-baseline-check' },
    timeout: '10s'
  });

  let healthOk = check(response, {
    'health endpoint available': (r) => r.status === 200,
    'health response fast': (r) => r.timings.duration < 1000,
    'health returns valid response': (r) => r.body.length > 0,
  });

  baselineResponseTime.add(response.timings.duration);
  if (!healthOk) baselineErrorRate.add(1);

  // 2. Ready Check - Deployment validation
  response = http.get(`${BASE_URL}/health/ready`, {
    headers: { 'User-Agent': 'k6-baseline-check' },
    timeout: '10s'
  });

  let readyOk = check(response, {
    'ready endpoint responds': (r) => r.status >= 200 && r.status < 500,
    'ready response reasonable': (r) => r.timings.duration < 2000,
  });

  baselineResponseTime.add(response.timings.duration);
  if (!readyOk) baselineErrorRate.add(1);

  // 3. API Status - Application functionality
  response = http.get(`${BASE_URL}/api/v1/status`, {
    headers: {
      'User-Agent': 'k6-baseline-check',
      'Accept': 'application/json'
    },
    timeout: '10s'
  });

  let apiOk = check(response, {
    'API status accessible': (r) => r.status >= 200 && r.status < 500,
    'API response timely': (r) => r.timings.duration < 2000,
  });

  baselineResponseTime.add(response.timings.duration);
  if (!apiOk) baselineErrorRate.add(1);

  // 4. Basic functionality test
  response = http.post(`${BASE_URL}/api/v1/auth/health`, JSON.stringify({
    baseline_test: true,
    timestamp: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'k6-baseline-check'
    },
    timeout: '15s'
  });

  let funcOk = check(response, {
    'basic functionality works': (r) => r.status >= 200 && r.status < 500,
    'functionality response acceptable': (r) => r.timings.duration < 3000,
  });

  baselineResponseTime.add(response.timings.duration);
  if (!funcOk) baselineErrorRate.add(1);
}

export function handleSummary(data) {
  const summary = generateBaselineSummary(data);

  return {
    'baseline-check-results.json': JSON.stringify(data, null, 2),
    'baseline-summary.txt': summary,
    stdout: summary,
  };
}

function generateBaselineSummary(data) {
  const duration = data.state.testRunDurationMs;
  const totalRequests = data.metrics.http_reqs?.values?.count || 0;
  const failedRequests = (data.metrics.http_req_failed?.values?.rate || 0) * 100;
  const avgResponseTime = data.metrics.http_req_duration?.values?.avg || 0;
  const p95ResponseTime = data.metrics.http_req_duration?.values?.['p(95)'] || 0;
  const baselineAvg = data.metrics.baseline_response_time?.values?.avg || 0;
  const baselineErrors = (data.metrics.baseline_errors?.values?.rate || 0) * 100;

  // Determine baseline status
  const isHealthy = failedRequests < 2 && p95ResponseTime < 1000 && baselineErrors < 2;
  const status = isHealthy ? 'HEALTHY' : 'DEGRADED';
  const statusIcon = isHealthy ? '🟢' : '🟡';

  const summary = `
BASELINE PERFORMANCE CHECK
=========================

${statusIcon} Deployment Status: ${status}

Test Summary:
  Duration: ${Math.round(duration / 1000)}s
  Total Requests: ${totalRequests}
  Virtual Users: 5-10 (baseline load)

Performance Results:
  Failed Requests: ${failedRequests.toFixed(2)}%
  Average Response Time: ${avgResponseTime.toFixed(2)}ms
  95th Percentile: ${p95ResponseTime.toFixed(2)}ms
  Baseline Average: ${baselineAvg.toFixed(2)}ms
  Baseline Error Rate: ${baselineErrors.toFixed(2)}%

Threshold Validation:
  Error Rate < 2%: ${(failedRequests < 2) ? 'PASS ✓' : 'FAIL ✗'}
  Response P95 < 1s: ${(p95ResponseTime < 1000) ? 'PASS ✓' : 'FAIL ✗'}
  Baseline Avg < 500ms: ${(baselineAvg < 500) ? 'PASS ✓' : 'FAIL ✗'}

Deployment Validation:
${generateDeploymentValidation(failedRequests, p95ResponseTime, baselineErrors)}

Next Steps:
${generateNextSteps(isHealthy, failedRequests, p95ResponseTime)}
`;

  return summary;
}

function generateDeploymentValidation(failedRequests, p95ResponseTime, baselineErrors) {
  const validations = [];

  if (failedRequests < 1) {
    validations.push("  ✓ Error rate excellent - deployment stable");
  } else if (failedRequests < 2) {
    validations.push("  ✓ Error rate acceptable - deployment functional");
  } else {
    validations.push("  ✗ Error rate concerning - investigate deployment issues");
  }

  if (p95ResponseTime < 500) {
    validations.push("  ✓ Response times excellent - performance optimal");
  } else if (p95ResponseTime < 1000) {
    validations.push("  ✓ Response times acceptable - performance adequate");
  } else {
    validations.push("  ✗ Response times slow - performance degraded");
  }

  if (baselineErrors < 1) {
    validations.push("  ✓ Baseline functionality perfect - all endpoints working");
  } else if (baselineErrors < 2) {
    validations.push("  ✓ Baseline functionality good - minor issues detected");
  } else {
    validations.push("  ✗ Baseline functionality poor - significant issues detected");
  }

  return validations.join('\n');
}

function generateNextSteps(isHealthy, failedRequests, p95ResponseTime) {
  if (isHealthy) {
    return `  • Deployment validation PASSED - proceed with traffic routing
  • Monitor metrics during initial traffic
  • Consider running full load tests if needed`;
  } else {
    const steps = ["  • Deployment validation FAILED - investigate before proceeding"];

    if (failedRequests > 2) {
      steps.push("  • Check application logs for error patterns");
      steps.push("  • Verify database and external service connectivity");
    }

    if (p95ResponseTime > 1000) {
      steps.push("  • Investigate performance bottlenecks");
      steps.push("  • Check resource utilization (CPU, memory, disk)");
    }

    steps.push("  • Consider rollback if issues cannot be resolved quickly");

    return steps.join('\n');
  }
}