// Golden master test example with SPEK Template
// Run with: npm test

import { SPEKTemplate } from '../../src/index';

describe('Golden Master Test Example', () => {
  it('produces expected output format', () => {
    // Placeholder golden test
    const input = { name: 'test', version: '1.0.0' };
    const result = JSON.stringify(input, null, 2);
    
    const expected = `{
  "name": "test",
  "version": "1.0.0"
}`;
    
    expect(result).toBe(expected);
  });
  
  it('SPEKTemplate produces consistent golden output', () => {
    const template = new SPEKTemplate({
      name: 'Golden Test',
      version: '2.0.0',
      description: 'Golden master test'
    });
    
    const welcome = template.welcome();
    const config = template.getConfig();
    
    // Golden master assertions - exact output
    expect(welcome).toBe('Welcome to Golden Test v2.0.0');
    expect(config).toEqual({
      name: 'Golden Test',
      version: '2.0.0',
      description: 'Golden master test'
    });
    
    // Health check should have consistent structure
    const health = template.healthCheck();
    expect(health).toHaveProperty('status', 'healthy');
    expect(health).toHaveProperty('timestamp');
    expect(typeof health.timestamp).toBe('string');
  });
});