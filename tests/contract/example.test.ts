// Contract test example using Zod and SPEK Template
// Run with: npm test

import { z } from 'zod';
import { SPEKTemplate } from '../../src/index';

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
  
  it('validates SPEKTemplate creation', () => {
    const config = {
      name: 'Test Template',
      version: '1.0.0',
      description: 'Test description'
    };
    
    const template = new SPEKTemplate(config);
    expect(template.getConfig()).toEqual(config);
    expect(template.welcome()).toContain('Test Template');
  });
  
  it('validates health check contract', () => {
    const template = new SPEKTemplate({
      name: 'Health Test',
      version: '1.0.0'
    });
    
    const health = template.healthCheck();
    expect(health).toHaveProperty('status', 'healthy');
    expect(health).toHaveProperty('timestamp');
    expect(new Date(health.timestamp)).toBeInstanceOf(Date);
  });
});