// Contract test example using Zod
// Run with: npm test

import { z } from 'zod';

// Schema for configuration contract
const ConfigSchema = z.object({
  budgets: z.object({
    max_loc: z.number().positive(),
    max_files: z.number().positive()
  }),
  allowlist: z.array(z.string()),
  denylist: z.array(z.string()),
  verification: z.object({
    test_cmd: z.string(),
    typecheck_cmd: z.string(),
    lint_cmd: z.string()
  })
});

describe('Configuration Contract Tests', () => {
  it('validates codex config schema', () => {
    const mockConfig = {
      budgets: { max_loc: 25, max_files: 2 },
      allowlist: ['src/**', 'tests/**'],
      denylist: ['.claude/**', 'node_modules/**'],
      verification: {
        test_cmd: 'npm test',
        typecheck_cmd: 'npm run typecheck',
        lint_cmd: 'npm run lint'
      }
    };
    
    expect(() => ConfigSchema.parse(mockConfig)).not.toThrow();
  });
  
  it('rejects invalid configuration', () => {
    const invalidConfig = {
      budgets: { max_loc: -1 }, // Invalid: negative number
      allowlist: 'not-an-array', // Invalid: should be array
    };
    
    expect(() => ConfigSchema.parse(invalidConfig)).toThrow();
  });
});