import { EventEmitter } from 'events';
import { VectorEmbeddings } from '../storage/VectorEmbeddings';
import { PatternClassifier } from './PatternClassifier';
import { DocumentationPattern, PatternType, PatternMetadata } from '../types/PatternTypes';
import { CodeAnalyzer } from '../analysis/CodeAnalyzer';

/**
 * Core pattern recognition and storage engine for documentation automation.
 * Provides intelligent pattern identification, classification, and retrieval.
 */
export class PatternEngine extends EventEmitter {
  private vectorEmbeddings: VectorEmbeddings;
  private classifier: PatternClassifier;
  private codeAnalyzer: CodeAnalyzer;
  private patternCache: Map<string, DocumentationPattern>;
  private patternStats: Map<string, PatternMetadata>;

  constructor() {
    super();
    this.vectorEmbeddings = new VectorEmbeddings();
    this.classifier = new PatternClassifier();
    this.codeAnalyzer = new CodeAnalyzer();
    this.patternCache = new Map();
    this.patternStats = new Map();
  }

  /**
   * Initialize the pattern engine with pre-trained models and existing patterns
   */
  async initialize(): Promise<void> {
    await this.vectorEmbeddings.initialize();
    await this.classifier.loadModel();
    await this.loadExistingPatterns();
    this.emit('initialized');
  }

  /**
   * Recognize patterns in code and generate appropriate documentation templates
   */
  async recognizePatterns(codeContent: string, filePath: string): Promise<DocumentationPattern[]> {
    const startTime = Date.now();
    
    try {
      // Analyze code structure and extract features
      const codeFeatures = await this.codeAnalyzer.extractFeatures(codeContent, filePath);
      
      // Generate vector embeddings for similarity search
      const embeddings = await this.vectorEmbeddings.generateEmbeddings(codeContent);
      
      // Find similar patterns in the knowledge base
      const similarPatterns = await this.vectorEmbeddings.findSimilar(embeddings, 0.8);
      
      // Classify the code into documentation pattern types
      const patternTypes = await this.classifier.classify(codeFeatures);
      
      // Generate documentation patterns
      const patterns: DocumentationPattern[] = [];
      
      for (const patternType of patternTypes) {
        const pattern = await this.generatePattern(patternType, codeFeatures, similarPatterns);
        patterns.push(pattern);
      }
      
      // Update performance metrics
      const processingTime = Date.now() - startTime;
      this.updateMetrics('pattern_recognition', processingTime);
      
      this.emit('patternsRecognized', { filePath, patterns, processingTime });
      return patterns;
      
    } catch (error) {
      this.emit('error', { operation: 'recognizePatterns', error, filePath });
      throw error;
    }
  }

  /**
   * Store a new documentation pattern in the knowledge base
   */
  async storePattern(pattern: DocumentationPattern): Promise<string> {
    const patternId = this.generatePatternId(pattern);
    
    // Cache the pattern
    this.patternCache.set(patternId, pattern);
    
    // Store embeddings for similarity search
    const embeddings = await this.vectorEmbeddings.generateEmbeddings(pattern.content);
    await this.vectorEmbeddings.store(patternId, embeddings, pattern.metadata);
    
    // Update pattern statistics
    this.updatePatternStats(patternId, pattern);
    
    // Train classifier with new pattern
    await this.classifier.addTrainingData(pattern);
    
    this.emit('patternStored', { patternId, pattern });
    return patternId;
  }

  /**
   * Update an existing pattern with new information
   */
  async updatePattern(patternId: string, updates: Partial<DocumentationPattern>): Promise<void> {
    const existingPattern = this.patternCache.get(patternId);
    if (!existingPattern) {
      throw new Error(`Pattern ${patternId} not found`);
    }
    
    const updatedPattern = { ...existingPattern, ...updates };
    this.patternCache.set(patternId, updatedPattern);
    
    // Update embeddings if content changed
    if (updates.content) {
      const embeddings = await this.vectorEmbeddings.generateEmbeddings(updates.content);
      await this.vectorEmbeddings.update(patternId, embeddings);
    }
    
    this.emit('patternUpdated', { patternId, updates });
  }

  /**
   * Find patterns similar to given content or pattern
   */
  async findSimilarPatterns(content: string, threshold: number = 0.7): Promise<DocumentationPattern[]> {
    const embeddings = await this.vectorEmbeddings.generateEmbeddings(content);
    const similar = await this.vectorEmbeddings.findSimilar(embeddings, threshold);
    
    return similar.map(item => this.patternCache.get(item.id)).filter(Boolean) as DocumentationPattern[];
  }

  /**
   * Get pattern usage analytics
   */
  getPatternAnalytics(): Map<string, PatternMetadata> {
    return new Map(this.patternStats);
  }

  /**
   * Optimize patterns based on usage statistics
   */
  async optimizePatterns(): Promise<void> {
    const analytics = this.getPatternAnalytics();
    
    for (const [patternId, metadata] of analytics) {
      if (metadata.usageCount > 100 && metadata.effectiveness < 0.7) {
        // Pattern is heavily used but not effective - needs optimization
        await this.optimizePattern(patternId, metadata);
      }
    }
    
    this.emit('patternsOptimized');
  }

  private async generatePattern(
    patternType: PatternType,
    codeFeatures: any,
    similarPatterns: any[]
  ): Promise<DocumentationPattern> {
    // Generate pattern based on type and features
    const template = await this.getPatternTemplate(patternType);
    const content = await this.populateTemplate(template, codeFeatures);
    
    return {
      id: this.generatePatternId({ type: patternType, content }),
      type: patternType,
      content,
      metadata: {
        createdAt: new Date(),
        usageCount: 0,
        effectiveness: 1.0,
        features: codeFeatures,
        similarPatterns: similarPatterns.map(p => p.id)
      }
    };
  }

  private async getPatternTemplate(patternType: PatternType): Promise<string> {
    // Load template based on pattern type
    const templates = {
      [PatternType.API_ENDPOINT]: this.getAPIEndpointTemplate(),
      [PatternType.CLASS_DOCUMENTATION]: this.getClassDocumentationTemplate(),
      [PatternType.FUNCTION_DOCUMENTATION]: this.getFunctionDocumentationTemplate(),
      [PatternType.CONFIGURATION]: this.getConfigurationTemplate(),
      [PatternType.ERROR_HANDLING]: this.getErrorHandlingTemplate()
    };
    
    return templates[patternType] || '';
  }

  private getAPIEndpointTemplate(): string {
    return `
## {{method}} {{path}}

### Description
{{description}}

### Parameters
{{#parameters}}
- **{{name}}** ({{type}}, {{required}}): {{description}}
{{/parameters}}

### Request Body
\`\`\`json
{{requestBodyExample}}
\`\`\`

### Response
\`\`\`json
{{responseExample}}
\`\`\`

### Error Codes
{{#errorCodes}}
- **{{code}}**: {{description}}
{{/errorCodes}}

### Example
\`\`\`javascript
{{example}}
\`\`\`
`;
  }

  private getClassDocumentationTemplate(): string {
    return `
## {{className}}

### Description
{{description}}

### Constructor
\`\`\`typescript
new {{className}}({{constructorParams}})
\`\`\`

### Properties
{{#properties}}
- **{{name}}** ({{type}}): {{description}}
{{/properties}}

### Methods
{{#methods}}
#### {{name}}
{{description}}

\`\`\`typescript
{{signature}}
\`\`\`
{{/methods}}

### Example Usage
\`\`\`typescript
{{example}}
\`\`\`
`;
  }

  private getFunctionDocumentationTemplate(): string {
    return `
## {{functionName}}

### Description
{{description}}

### Signature
\`\`\`typescript
{{signature}}
\`\`\`

### Parameters
{{#parameters}}
- **{{name}}** ({{type}}): {{description}}
{{/parameters}}

### Returns
{{returnType}}: {{returnDescription}}

### Example
\`\`\`typescript
{{example}}
\`\`\`

### Throws
{{#throws}}
- **{{type}}**: {{description}}
{{/throws}}
`;
  }

  private getConfigurationTemplate(): string {
    return `
## Configuration: {{configName}}

### Description
{{description}}

### Options
{{#options}}
#### {{name}}
- **Type**: {{type}}
- **Default**: {{default}}
- **Description**: {{description}}
{{#values}}
- \`{{value}}\`: {{description}}
{{/values}}
{{/options}}

### Example
\`\`\`json
{{example}}
\`\`\`
`;
  }

  private getErrorHandlingTemplate(): string {
    return `
## Error Handling: {{errorType}}

### Description
{{description}}

### Error Codes
{{#errorCodes}}
#### {{code}}: {{name}}
- **Description**: {{description}}
- **Cause**: {{cause}}
- **Resolution**: {{resolution}}
{{/errorCodes}}

### Example
\`\`\`typescript
{{example}}
\`\`\`
`;
  }

  private async populateTemplate(template: string, features: any): Promise<string> {
    // Simple template population - in real implementation would use Handlebars or similar
    let populated = template;
    
    for (const [key, value] of Object.entries(features)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      populated = populated.replace(regex, String(value));
    }
    
    return populated;
  }

  private generatePatternId(pattern: any): string {
    const content = JSON.stringify(pattern);
    return Buffer.from(content).toString('base64').slice(0, 16);
  }

  private updatePatternStats(patternId: string, pattern: DocumentationPattern): void {
    const existing = this.patternStats.get(patternId);
    if (existing) {
      existing.usageCount++;
      existing.lastUsed = new Date();
    } else {
      this.patternStats.set(patternId, {
        createdAt: new Date(),
        usageCount: 1,
        effectiveness: 1.0,
        lastUsed: new Date(),
        features: pattern.metadata?.features
      });
    }
  }

  private updateMetrics(operation: string, processingTime: number): void {
    this.emit('metrics', { operation, processingTime, timestamp: new Date() });
  }

  private async optimizePattern(patternId: string, metadata: PatternMetadata): Promise<void> {
    // Optimization logic would go here
    this.emit('patternOptimized', { patternId, metadata });
  }

  private async loadExistingPatterns(): Promise<void> {
    // Load patterns from persistent storage
    this.emit('patternsLoaded');
  }
}

export default PatternEngine;