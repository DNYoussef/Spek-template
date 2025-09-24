/**
 * Mock API Response Fixtures
 * Centralized test data for API mocking
 */

export const mockMetricsResponse = {
  gradient_history: [
    { step: 0, value: 0.1 },
    { step: 100, value: 0.3 },
    { step: 200, value: 0.6 },
    { step: 300, value: 0.85 }
  ],
  lambda_progress: 0.75,
  current_phase: 'exploration',
  metrics: {
    loss: 0.234,
    accuracy: 0.892,
    convergence_rate: 0.045
  }
};

export const mockEdgeControllerResponse = {
  criticality: 0.85,
  lambda: 0.72,
  phase: 'critical'
};

export const mockSelfModelResponse = {
  predictions: [
    [0.1, 0.2, 0.3, 0.4, 0.5],
    [0.2, 0.3, 0.4, 0.5, 0.6],
    [0.3, 0.4, 0.5, 0.6, 0.7],
    [0.4, 0.5, 0.6, 0.7, 0.8],
    [0.5, 0.6, 0.7, 0.8, 0.9]
  ],
  accuracy: 0.87
};

export const mockDreamBufferResponse = {
  buffer: [
    { experience_id: 1, quality: 0.95, timestamp: '2024-01-01T00:00:00Z' },
    { experience_id: 2, quality: 0.87, timestamp: '2024-01-01T00:01:00Z' },
    { experience_id: 3, quality: 0.76, timestamp: '2024-01-01T00:02:00Z' },
    { experience_id: 4, quality: 0.68, timestamp: '2024-01-01T00:03:00Z' },
    { experience_id: 5, quality: 0.82, timestamp: '2024-01-01T00:04:00Z' }
  ],
  avg_quality: 0.816
};

export const mockWeightTrajectoryResponse = {
  steps: [0, 50, 100, 150, 200, 250, 300],
  weights: [0.1, 0.25, 0.45, 0.6, 0.75, 0.85, 0.92]
};

// Edge cases
export const emptyMetricsResponse = {
  gradient_history: [],
  lambda_progress: 0,
  current_phase: 'exploration',
  metrics: {}
};

export const nullMetricsResponse = {
  gradient_history: null,
  lambda_progress: null,
  current_phase: null,
  metrics: null
};

export const extremeValuesResponse = {
  gradient_history: [
    { step: 0, value: 1e308 },
    { step: 1, value: -1e308 },
    { step: 2, value: 1e-308 }
  ],
  lambda_progress: 1e50,
  current_phase: 'exploration',
  metrics: {
    loss: Infinity,
    accuracy: -Infinity,
    convergence_rate: NaN
  }
};

export const invalidDataTypesResponse = {
  gradient_history: "not an array",
  lambda_progress: "not a number",
  current_phase: 12345,
  metrics: []
};

// Factory functions for dynamic data
export function generateMetricsResponse(overrides = {}) {
  return {
    ...mockMetricsResponse,
    ...overrides
  };
}

export function generateProgressiveMetrics(step: number) {
  return {
    gradient_history: Array.from({ length: step + 1 }, (_, i) => ({
      step: i * 100,
      value: Math.min(i * 0.2, 1.0)
    })),
    lambda_progress: Math.min(step * 0.2, 1.0),
    current_phase: ['exploration', 'exploitation', 'convergence', 'grokking'][step % 4],
    metrics: {
      loss: Math.max(1.0 - (step * 0.15), 0.01),
      accuracy: Math.min(0.5 + (step * 0.1), 0.99),
      convergence_rate: 0.045
    }
  };
}

export function generateRandomBuffer(size: number = 10) {
  return {
    buffer: Array.from({ length: size }, (_, i) => ({
      experience_id: i + 1,
      quality: Math.random(),
      timestamp: new Date(Date.now() - (size - i) * 60000).toISOString()
    })),
    avg_quality: 0.5 + (Math.random() * 0.5)
  };
}

export function generateSelfModelMatrix(rows: number = 5, cols: number = 5) {
  return {
    predictions: Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.random())
    ),
    accuracy: 0.7 + (Math.random() * 0.3)
  };
}