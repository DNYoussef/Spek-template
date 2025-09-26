/**
 * Phase 1 Integration Tests: Langroid Memory Systems
 * Tests Development and Quality Princess Langroid integration
 */

import { LangroidMemory } from '../../../src/swarm/memory/development/LangroidMemory';
import { QualityLangroidMemory } from '../../../src/swarm/memory/quality/LangroidMemory';
import { VectorStore } from '../../../src/swarm/memory/development/VectorStore';
import { ContextDNA } from '../../../src/swarm/memory/development/ContextDNA';

describe('Langroid Memory Integration Tests', () => {
  let devMemory: LangroidMemory;
  let qualityMemory: QualityLangroidMemory;
  let vectorStore: VectorStore;
  let contextDNA: ContextDNA;

  beforeEach(() => {
    devMemory = new LangroidMemory('test-dev-agent');
    qualityMemory = new QualityLangroidMemory();
    vectorStore = new VectorStore();
    contextDNA = new ContextDNA();
  });

  afterEach(() => {
    devMemory.clear();
    qualityMemory.clear();
    vectorStore.clear();
  });

  describe('Development Princess Memory', () => {
    it('should initialize with 10MB limit', () => {
      const stats = devMemory.getStats();
      expect(stats.memoryLimit).toBe('10MB');
      expect(stats.langroidIntegration.enabled).toBe(true);
      expect(stats.langroidIntegration.agentId).toBe('test-dev-agent');
    });

    it('should store and retrieve code patterns', async () => {
      const codePattern = `
        function createComponent(name: string) {
          return {
            name,
            render: () => <div>{name}</div>
          };
        }
      `;

      const patternId = await devMemory.storePattern(codePattern, {
        fileType: 'react-component',
        language: 'typescript',
        framework: 'react',
        tags: ['component', 'factory'],
        useCount: 0,
        successRate: 1.0
      });

      expect(patternId).toMatch(/^dev-\d+-[a-f0-9]+$/);

      const searchResults = await devMemory.searchSimilar('create component', 5, 0.5);
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0].entry.content).toContain('createComponent');
    });

    it('should execute tasks through Langroid agent', async () => {
      const result = await devMemory.executeTask(
        'test-implementation',
        'Create a React component for user authentication'
      );

      expect(result).toContain('DevelopmentPrincess');
      expect(result).toContain('authentication');
    });
  });

  describe('Quality Princess Memory with Theater Detection', () => {
    it('should initialize with theater detection patterns', () => {
      const stats = qualityMemory.getStats();
      expect(stats.theaterPatterns).toBeGreaterThan(0);
      expect(stats.theaterThreshold).toBe(60);
    });

    it('should detect theater patterns in code', async () => {
      const fakeCode = `
        function authenticate(user) {
          // TODO: implement actual authentication
          return true; // placeholder
        }

        it('should authenticate user', () => {
          expect(true).toBe(true); // fake test
        });
      `;

      const patternId = await qualityMemory.storeQualityPattern(fakeCode, {
        testType: 'unit',
        framework: 'jest',
        coverage: 100,
        successRate: 1.0,
        effectiveness: 0.1
      });

      const theaterPatterns = qualityMemory.findTheaterPatterns(60);
      expect(theaterPatterns.length).toBeGreaterThan(0);

      const entry = theaterPatterns.find(p => p.id === patternId);
      expect(entry?.metadata.theaterScore).toBeGreaterThan(60);
    });
  });

  describe('Integration Validation', () => {
    it('should integrate all memory components successfully', async () => {
      const pattern = 'function calculate(a, b) { return a + b; }';
      const patternId = await devMemory.storePattern(pattern, {
        fileType: 'utility',
        language: 'javascript',
        tags: ['math', 'utility'],
        useCount: 0,
        successRate: 1.0
      });

      const searchResults = await devMemory.searchSimilar('calculate function', 3);
      expect(searchResults.length).toBeGreaterThan(0);

      const agent = devMemory.getLangroidAgent();
      expect(agent).toBeDefined();
      expect(agent?.name).toBe('DevelopmentPrincess');

      const taskResult = await devMemory.executeTask('integration-test', 'Test integration');
      expect(taskResult).toContain('DevelopmentPrincess');

      const stats = devMemory.getStats();
      expect(stats.langroidIntegration.enabled).toBe(true);
      expect(stats.totalEntries).toBeGreaterThan(0);
    });
  });
});