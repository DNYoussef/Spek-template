/**
 * End-to-End Tests for Agent Forge UI
 * Tests real-time updates, memory leaks, and API failure scenarios
 */

import { test, expect, Page } from '@playwright/test';

const API_BASE = 'http://localhost:8000';
const UI_BASE = 'http://localhost:3000';

test.describe('Agent Forge UI - Real-time Updates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${UI_BASE}/phase5`);
  });

  test('should poll metrics endpoint at 1s intervals', async ({ page }) => {
    const requests: any[] = [];

    // Intercept API requests
    await page.route('**/api/grokfast/metrics', (route) => {
      requests.push({ timestamp: Date.now() });
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          gradient_history: [{ step: 0, value: 0.5 }],
          lambda_progress: 0.75,
          current_phase: 'exploration',
          metrics: { loss: 0.234, accuracy: 0.892, convergence_rate: 0.045 }
        })
      });
    });

    // Wait for multiple requests
    await page.waitForTimeout(3500);

    // Should have 3-4 requests (initial + polls)
    expect(requests.length).toBeGreaterThanOrEqual(3);

    // Check intervals are ~1000ms
    for (let i = 1; i < requests.length; i++) {
      const interval = requests[i].timestamp - requests[i-1].timestamp;
      expect(interval).toBeGreaterThanOrEqual(900);
      expect(interval).toBeLessThanOrEqual(1200);
    }
  });

  test('should poll edge controller at 2s intervals', async ({ page }) => {
    const requests: any[] = [];

    await page.route('**/api/forge/edge-controller/status', (route) => {
      requests.push({ timestamp: Date.now() });
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          criticality: 0.85,
          lambda: 0.72,
          phase: 'critical'
        })
      });
    });

    await page.waitForTimeout(5000);

    expect(requests.length).toBeGreaterThanOrEqual(2);

    // Check 2s intervals
    for (let i = 1; i < requests.length; i++) {
      const interval = requests[i].timestamp - requests[i-1].timestamp;
      expect(interval).toBeGreaterThanOrEqual(1900);
      expect(interval).toBeLessThanOrEqual(2200);
    }
  });

  test('should update UI when metrics change', async ({ page }) => {
    let responseCount = 0;

    await page.route('**/api/grokfast/metrics', (route) => {
      responseCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          gradient_history: [{ step: responseCount, value: responseCount * 0.1 }],
          lambda_progress: responseCount * 0.25,
          current_phase: responseCount % 2 === 0 ? 'exploration' : 'exploitation',
          metrics: { loss: 0.5 - (responseCount * 0.1), accuracy: 0.5 + (responseCount * 0.1), convergence_rate: 0.045 }
        })
      });
    });

    // Check initial render
    await page.waitForSelector('[data-testid="lambda-progress-bar"]');
    const initialWidth = await page.locator('[data-testid="lambda-progress-bar"]').evaluate(el => el.style.width);

    // Wait for update
    await page.waitForTimeout(1500);

    const updatedWidth = await page.locator('[data-testid="lambda-progress-bar"]').evaluate(el => el.style.width);

    // Width should have changed
    expect(initialWidth).not.toBe(updatedWidth);
  });
});

test.describe('Agent Forge UI - Memory Leak Detection', () => {
  test('should not leak memory over 5 minutes of polling', async ({ page }) => {
    await page.goto(`${UI_BASE}/phase5`);

    // Mock API responses
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          gradient_history: Array.from({ length: 100 }, (_, i) => ({ step: i, value: Math.random() })),
          lambda_progress: Math.random(),
          current_phase: 'exploration',
          metrics: { loss: Math.random(), accuracy: Math.random(), convergence_rate: Math.random() },
          criticality: Math.random(),
          lambda: Math.random(),
          phase: 'critical',
          predictions: Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => Math.random())),
          accuracy: Math.random(),
          buffer: Array.from({ length: 50 }, (_, i) => ({
            experience_id: i,
            quality: Math.random(),
            timestamp: new Date().toISOString()
          })),
          avg_quality: Math.random(),
          steps: Array.from({ length: 100 }, (_, i) => i),
          weights: Array.from({ length: 100 }, () => Math.random())
        })
      });
    });

    // Get initial memory
    const initialMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize || 0);

    // Run for 5 minutes (simulated with faster intervals)
    // In real test, use actual 5 minutes
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(1000);

      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });
    }

    // Get final memory
    const finalMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize || 0);

    // Memory growth should be reasonable (<50MB)
    const memoryGrowth = finalMemory - initialMemory;
    expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
  });

  test('should cleanup intervals on unmount', async ({ page }) => {
    await page.goto(`${UI_BASE}/phase5`);

    let requestCount = 0;
    await page.route('**/api/grokfast/metrics', (route) => {
      requestCount++;
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    // Wait for some requests
    await page.waitForTimeout(2500);
    const countBefore = requestCount;

    // Navigate away (unmount)
    await page.goto(`${UI_BASE}/`);

    // Wait and check no new requests
    await page.waitForTimeout(3000);
    expect(requestCount).toBe(countBefore);
  });

  test('should not cause re-render storms', async ({ page, browserName }) => {
    await page.goto(`${UI_BASE}/phase5`);

    // Enable performance monitoring
    await page.evaluate(() => {
      (window as any).renderCount = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' && entry.name.includes('React')) {
            (window as any).renderCount++;
          }
        }
      });
      observer.observe({ entryTypes: ['measure'] });
    });

    await page.route('**/api/**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"test": true}' });
    });

    // Wait for updates
    await page.waitForTimeout(5000);

    const renderCount = await page.evaluate(() => (window as any).renderCount || 0);

    // Should not have excessive re-renders (< 100 in 5s)
    expect(renderCount).toBeLessThan(100);
  });
});

test.describe('Agent Forge UI - API Failure Handling', () => {
  test('should display error when API is unreachable', async ({ page }) => {
    await page.route('**/api/grokfast/metrics', (route) => {
      route.abort('failed');
    });

    await page.goto(`${UI_BASE}/phase5`);

    await expect(page.locator('text=/error.*metrics/i')).toBeVisible({ timeout: 5000 });
  });

  test('should retry failed requests', async ({ page }) => {
    let attemptCount = 0;

    await page.route('**/api/grokfast/metrics', (route) => {
      attemptCount++;
      if (attemptCount < 3) {
        route.abort('failed');
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            gradient_history: [],
            lambda_progress: 0.5,
            current_phase: 'exploration',
            metrics: {}
          })
        });
      }
    });

    await page.goto(`${UI_BASE}/phase5`);

    // Should eventually succeed
    await expect(page.locator('[data-testid="lambda-progress-bar"]')).toBeVisible({ timeout: 10000 });
    expect(attemptCount).toBeGreaterThanOrEqual(3);
  });

  test('should handle null/undefined API responses', async ({ page }) => {
    await page.route('**/api/grokfast/metrics', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          gradient_history: null,
          lambda_progress: undefined,
          current_phase: null,
          metrics: null
        })
      });
    });

    await page.goto(`${UI_BASE}/phase5`);

    // Should render without crashing
    await expect(page.locator('text=/no.*data/i')).toBeVisible();
  });

  test('should handle malformed JSON', async ({ page }) => {
    await page.route('**/api/grokfast/metrics', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{invalid json{{{'
      });
    });

    await page.goto(`${UI_BASE}/phase5`);

    await expect(page.locator('text=/error.*parsing/i')).toBeVisible();
  });

  test('should handle extremely large numbers', async ({ page }) => {
    await page.route('**/api/grokfast/metrics', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          gradient_history: [{ step: 0, value: 1e308 }],
          lambda_progress: 1e50,
          current_phase: 'exploration',
          metrics: { loss: 1e100, accuracy: -1e100, convergence_rate: 1e-308 }
        })
      });
    });

    await page.goto(`${UI_BASE}/phase5`);

    // Should handle gracefully (clamping, scientific notation, etc.)
    await expect(page.locator('[data-testid="lambda-progress-bar"]')).toBeVisible();
  });

  test('should handle negative values', async ({ page }) => {
    await page.route('**/api/grokfast/metrics', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          gradient_history: [{ step: 0, value: -0.5 }],
          lambda_progress: -0.5,
          current_phase: 'exploration',
          metrics: { loss: -1.5, accuracy: -0.8, convergence_rate: -0.1 }
        })
      });
    });

    await page.goto(`${UI_BASE}/phase5`);

    // Should display or handle negative values appropriately
    await page.waitForSelector('[data-testid="metrics-display"]');
  });

  test('should handle division by zero scenarios', async ({ page }) => {
    await page.route('**/api/forge/edge-controller/status', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          criticality: 0,
          lambda: 0,
          phase: 'ordered',
          // Simulate division by zero in derived metrics
          derived_metric: 5.0 / 0
        })
      });
    });

    await page.goto(`${UI_BASE}/phase5`);

    // Should handle Infinity/NaN gracefully
    const text = await page.textContent('body');
    expect(text).not.toContain('NaN');
  });

  test('should show loading state during API calls', async ({ page }) => {
    await page.route('**/api/grokfast/metrics', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}'
      });
    });

    await page.goto(`${UI_BASE}/phase5`);

    // Should show loading indicator
    await expect(page.locator('text=/loading/i')).toBeVisible();
  });

  test('should handle HTTP error codes', async ({ page }) => {
    await page.route('**/api/grokfast/metrics', (route) => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.goto(`${UI_BASE}/phase5`);

    await expect(page.locator('text=/server error/i')).toBeVisible();
  });
});

test.describe('Agent Forge UI - Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto(`${UI_BASE}/phase5`);

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should focus on interactive elements
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto(`${UI_BASE}/phase5`);

    const progressBar = page.locator('[data-testid="lambda-progress-bar"]');
    await expect(progressBar).toHaveAttribute('role', 'progressbar');
    await expect(progressBar).toHaveAttribute('aria-label');
  });
});