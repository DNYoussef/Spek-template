// Property-based test example
// Run with: npm test

import fc from 'fast-check';

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
          expect(sorted[i-1]).toBeLessThanOrEqual(sorted[i]);
        }
        
        // Property: result should have same length
        expect(sorted.length).toBe(input.length);
        
        // Property: result should contain same elements
        const sortedInput = [...input].sort((a, b) => a - b);
        expect(sorted).toEqual(sortedInput);
      }
    ));
  });
});