const fc = require('fast-check');

// Example property-based tests for common SPEK-AUGMENT functions
// These test mathematical invariants and general properties

describe('Email Normalization (Property Tests)', () => {
  // Simple email normalizer for demonstration
  function normalizeEmail(email) {
    if (typeof email !== 'string') return '';
    return email.trim().toLowerCase();
  }

  test('normalization is idempotent', () => {
    fc.assert(
      fc.property(fc.string(), email => {
        const once = normalizeEmail(email);
        const twice = normalizeEmail(once);
        return once === twice;
      }),
      { numRuns: 100 }
    );
  });

  test('normalization removes leading/trailing whitespace', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.length > 0),
        email => {
          const normalized = normalizeEmail(email);
          return normalized === normalized.trim();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('normalization converts to lowercase', () => {
    fc.assert(
      fc.property(fc.string(), email => {
        const normalized = normalizeEmail(email);
        return normalized === normalized.toLowerCase();
      }),
      { numRuns: 100 }
    );
  });

  test('empty/invalid inputs produce empty strings', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(null), fc.constant(undefined), fc.constant(123)),
        invalidInput => {
          const result = normalizeEmail(invalidInput);
          return result === '';
        }
      )
    );
  });
});

describe('Configuration Merging (Property Tests)', () => {
  // Example configuration merger
  function mergeConfig(base, override) {
    if (!base || typeof base !== 'object') base = {};
    if (!override || typeof override !== 'object') override = {};
    return { ...base, ...override };
  }

  test('merge is associative', () => {
    fc.assert(
      fc.property(
        fc.record({ a: fc.integer(), b: fc.string() }),
        fc.record({ c: fc.boolean(), d: fc.integer() }),
        fc.record({ e: fc.string() }),
        (config1, config2, config3) => {
          // (a + b) + c === a + (b + c)
          const left = mergeConfig(mergeConfig(config1, config2), config3);
          const right = mergeConfig(config1, mergeConfig(config2, config3));
          return JSON.stringify(left) === JSON.stringify(right);
        }
      )
    );
  });

  test('override properties are preserved', () => {
    fc.assert(
      fc.property(
        fc.record({ key: fc.string() }),
        fc.record({ key: fc.string() }),
        (base, override) => {
          const result = mergeConfig(base, override);
          return result.key === override.key;
        }
      )
    );
  });

  test('base properties are preserved when not overridden', () => {
    fc.assert(
      fc.property(
        fc.record({ unique: fc.string(), shared: fc.integer() }),
        fc.record({ shared: fc.integer() }),
        (base, override) => {
          const result = mergeConfig(base, override);
          return result.unique === base.unique;
        }
      )
    );
  });
});

describe('Array Processing (Property Tests)', () => {
  // Example array deduplication function
  function deduplicate(arr) {
    if (!Array.isArray(arr)) return [];
    return [...new Set(arr)];
  }

  test('deduplication is idempotent', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), arr => {
        const once = deduplicate(arr);
        const twice = deduplicate(once);
        return JSON.stringify(once) === JSON.stringify(twice);
      })
    );
  });

  test('deduplication preserves all unique elements', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), arr => {
        const result = deduplicate(arr);
        const uniqueOriginal = new Set(arr);
        return result.length === uniqueOriginal.size;
      })
    );
  });

  test('deduplication maintains order of first occurrence', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), arr => {
        const result = deduplicate(arr);
        
        // Check that each element in result appears in original order
        let lastIndex = -1;
        return result.every(item => {
          const index = arr.indexOf(item);
          const isInOrder = index > lastIndex;
          lastIndex = index;
          return isInOrder;
        });
      })
    );
  });

  test('invalid input produces empty array', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined), 
          fc.string(),
          fc.integer(),
          fc.record({})
        ),
        invalidInput => {
          const result = deduplicate(invalidInput);
          return Array.isArray(result) && result.length === 0;
        }
      )
    );
  });
});

describe('String Processing (Property Tests)', () => {
  // Example slug generation function
  function generateSlug(text) {
    if (typeof text !== 'string') return '';
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  test('slug generation is deterministic', () => {
    fc.assert(
      fc.property(fc.string(), text => {
        const slug1 = generateSlug(text);
        const slug2 = generateSlug(text);
        return slug1 === slug2;
      })
    );
  });

  test('slugs contain only valid characters', () => {
    fc.assert(
      fc.property(fc.string(), text => {
        const slug = generateSlug(text);
        // Should only contain lowercase letters, numbers, and hyphens
        return /^[a-z0-9-]*$/.test(slug);
      })
    );
  });

  test('slugs do not start or end with hyphens', () => {
    fc.assert(
      fc.property(fc.string().filter(s => s.length > 0), text => {
        const slug = generateSlug(text);
        if (slug.length === 0) return true; // Empty slug is valid
        return !slug.startsWith('-') && !slug.endsWith('-');
      })
    );
  });

  test('identical normalized inputs produce identical slugs', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.trim().length > 0),
        text => {
          const slug1 = generateSlug(text);
          const slug2 = generateSlug(text.toUpperCase());
          const slug3 = generateSlug(`  ${text}  `);
          return slug1 === slug2 && slug2 === slug3;
        }
      )
    );
  });
});

describe('Error Handling (Property Tests)', () => {
  // Example function with error handling
  function safeJSONParse(text, defaultValue = null) {
    try {
      if (typeof text !== 'string') return defaultValue;
      return JSON.parse(text);
    } catch {
      return defaultValue;
    }
  }

  test('valid JSON strings parse successfully', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({ key: fc.string() }),
          fc.array(fc.integer()),
          fc.string(),
          fc.integer(),
          fc.boolean()
        ),
        obj => {
          const json = JSON.stringify(obj);
          const parsed = safeJSONParse(json);
          return JSON.stringify(parsed) === json;
        }
      )
    );
  });

  test('invalid inputs return default value', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.integer(),
          fc.boolean(),
          fc.string().filter(s => {
            try { JSON.parse(s); return false; } catch { return true; }
          })
        ),
        fc.oneof(fc.string(), fc.integer(), fc.constant(null)),
        (invalidInput, defaultValue) => {
          const result = safeJSONParse(invalidInput, defaultValue);
          return result === defaultValue;
        }
      )
    );
  });
});