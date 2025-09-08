// Golden master test example
// Run with: npm test

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
});