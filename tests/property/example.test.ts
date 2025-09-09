// Property-based test example with SPEK Template
// Run with: npm test

import fc from 'fast-check';
import { SPEKTemplate } from '../../src/index';

// Placeholder function to demonstrate property testing
function sortNumbers(arr: number[]): number[] {
  return [...arr].sort((a, b) => a - b);
}

describe('Property-Based Test Example', () => {
  it('sortNumbers produces ordered output', () => {
    fc.assert(fc.property(
      fc.array(fc.integer()),
      (input) => {
        const sorted = sortNumbers(input);
        
        // Property: result should be ordered
        for (let i = 1; i < sorted.length; i++) {
          expect(sorted[i-1]!).toBeLessThanOrEqual(sorted[i]!);
        }
        
        // Property: result should have same length
        expect(sorted.length).toBe(input.length);
        
        // Property: result should contain same elements
        const sortedInput = [...input].sort((a, b) => a - b);
        expect(sorted).toEqual(sortedInput);
      }
    ), { numRuns: 50 }); // Reduced for CI performance
  });
  
  it('SPEKTemplate properties always hold', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.string({ minLength: 1, maxLength: 20 }),
      (name, version) => {
        const template = new SPEKTemplate({ name, version });
        
        // Property: config should be preserved
        expect(template.getConfig().name).toBe(name);
        expect(template.getConfig().version).toBe(version);
        
        // Property: welcome should contain name
        expect(template.welcome()).toContain(name);
        expect(template.welcome()).toContain(version);
        
        // Property: health check should always be healthy
        const health = template.healthCheck();
        expect(health.status).toBe('healthy');
        expect(new Date(health.timestamp)).toBeInstanceOf(Date);
      }
    ), { numRuns: 25 }); // Reduced for CI performance
  });
});