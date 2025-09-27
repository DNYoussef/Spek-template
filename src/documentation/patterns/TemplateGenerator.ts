import { CodeAnalyzer } from '../analysis/CodeAnalyzer';
import { PatternEngine } from './PatternEngine';
import { DocumentationTemplate, TemplateContext, GenerationOptions } from '../types/TemplateTypes';
import { APIEndpoint, ClassDefinition, FunctionDefinition } from '../types/CodeTypes';

/**
 * Dynamic template generation from code analysis.
 * Creates intelligent documentation templates based on code structure and patterns.
 */
export class TemplateGenerator {
  private codeAnalyzer: CodeAnalyzer;
  private patternEngine: PatternEngine;
  private templateCache: Map<string, DocumentationTemplate>;
  private generationMetrics: Map<string, number>;

  constructor(patternEngine: PatternEngine) {
    this.codeAnalyzer = new CodeAnalyzer();
    this.patternEngine = patternEngine;
    this.templateCache = new Map();
    this.generationMetrics = new Map();
  }

  /**
   * Generate documentation template from code analysis
   */
  async generateFromCode(
    codeContent: string,
    filePath: string,
    options: GenerationOptions = {}
  ): Promise<DocumentationTemplate> {
    const startTime = Date.now();
    
    try {
      // Analyze code structure
      const analysis = await this.codeAnalyzer.analyzeCode(codeContent, filePath);
      
      // Determine template type based on code content
      const templateType = this.determineTemplateType(analysis);
      
      // Generate appropriate template
      const template = await this.generateTemplateByType(templateType, analysis, options);
      
      // Cache the template
      const cacheKey = this.generateCacheKey(filePath, templateType);
      this.templateCache.set(cacheKey, template);
      
      // Update metrics
      const generationTime = Date.now() - startTime;
      this.updateGenerationMetrics(templateType, generationTime);
      
      return template;
      
    } catch (error) {
      throw new Error(`Template generation failed for ${filePath}: ${error.message}`);
    }
  }

  /**
   * Generate API documentation template from endpoints
   */
  async generateAPITemplate(endpoints: APIEndpoint[]): Promise<DocumentationTemplate> {
    const context: TemplateContext = {
      type: 'api',
      title: 'API Documentation',
      sections: []
    };

    // Group endpoints by tag/category
    const groupedEndpoints = this.groupEndpointsByTag(endpoints);
    
    for (const [tag, tagEndpoints] of groupedEndpoints) {
      const section = {
        title: tag,
        content: await this.generateEndpointDocumentation(tagEndpoints)
      };
      context.sections.push(section);
    }

    return {
      id: this.generateTemplateId('api', context),
      type: 'api',
      context,
      template: await this.buildAPITemplate(context),
      metadata: {
        generatedAt: new Date(),
        endpointCount: endpoints.length,
        tags: Array.from(groupedEndpoints.keys())
      }
    };
  }

  /**
   * Generate class documentation template
   */
  async generateClassTemplate(classDefinition: ClassDefinition): Promise<DocumentationTemplate> {
    const context: TemplateContext = {
      type: 'class',
      title: `Class: ${classDefinition.name}`,
      sections: [
        {
          title: 'Overview',
          content: this.generateClassOverview(classDefinition)
        },
        {
          title: 'Constructor',
          content: this.generateConstructorDocumentation(classDefinition.constructor)
        },
        {
          title: 'Properties',
          content: this.generatePropertiesDocumentation(classDefinition.properties)
        },
        {
          title: 'Methods',
          content: this.generateMethodsDocumentation(classDefinition.methods)
        }
      ]
    };

    return {
      id: this.generateTemplateId('class', context),
      type: 'class',
      context,
      template: await this.buildClassTemplate(context),
      metadata: {
        generatedAt: new Date(),
        className: classDefinition.name,
        methodCount: classDefinition.methods.length,
        propertyCount: classDefinition.properties.length
      }
    };
  }

  /**
   * Generate function documentation template
   */
  async generateFunctionTemplate(functionDef: FunctionDefinition): Promise<DocumentationTemplate> {
    const context: TemplateContext = {
      type: 'function',
      title: `Function: ${functionDef.name}`,
      sections: [
        {
          title: 'Description',
          content: this.generateFunctionDescription(functionDef)
        },
        {
          title: 'Parameters',
          content: this.generateParameterDocumentation(functionDef.parameters)
        },
        {
          title: 'Returns',
          content: this.generateReturnDocumentation(functionDef.returnType)
        },
        {
          title: 'Examples',
          content: this.generateFunctionExamples(functionDef)
        }
      ]
    };

    return {
      id: this.generateTemplateId('function', context),
      type: 'function',
      context,
      template: await this.buildFunctionTemplate(context),
      metadata: {
        generatedAt: new Date(),
        functionName: functionDef.name,
        parameterCount: functionDef.parameters.length,
        isAsync: functionDef.isAsync
      }
    };
  }

  /**
   * Generate OpenAPI specification template
   */
  async generateOpenAPITemplate(endpoints: APIEndpoint[]): Promise<DocumentationTemplate> {
    const openApiSpec = {
      openapi: '3.1.0',
      info: {
        title: 'API Documentation',
        version: '1.0.0',
        description: 'Auto-generated API documentation'
      },
      servers: [
        {
          url: 'https://api.example.com',
          description: 'Production server'
        }
      ],
      paths: {},
      components: {
        schemas: {},
        responses: {},
        parameters: {},
        securitySchemes: {}
      }
    };

    // Generate paths from endpoints
    for (const endpoint of endpoints) {
      const pathSpec = this.generateOpenAPIPath(endpoint);
      openApiSpec.paths[endpoint.path] = {
        ...openApiSpec.paths[endpoint.path],
        [endpoint.method.toLowerCase()]: pathSpec
      };
    }

    // Extract and generate schemas
    const schemas = this.extractSchemasFromEndpoints(endpoints);
    openApiSpec.components.schemas = schemas;

    const context: TemplateContext = {
      type: 'openapi',
      title: 'OpenAPI Specification',
      sections: [
        {
          title: 'Specification',
          content: JSON.stringify(openApiSpec, null, 2)
        }
      ]
    };

    return {
      id: this.generateTemplateId('openapi', context),
      type: 'openapi',
      context,
      template: JSON.stringify(openApiSpec, null, 2),
      metadata: {
        generatedAt: new Date(),
        endpointCount: endpoints.length,
        version: '3.1.0'
      }
    };
  }

  /**
   * Generate interactive example template
   */
  async generateInteractiveTemplate(
    codeExample: string,
    description: string
  ): Promise<DocumentationTemplate> {
    const context: TemplateContext = {
      type: 'interactive',
      title: 'Interactive Example',
      sections: [
        {
          title: 'Description',
          content: description
        },
        {
          title: 'Code',
          content: codeExample
        },
        {
          title: 'Try It',
          content: this.generateInteractiveWidget(codeExample)
        }
      ]
    };

    return {
      id: this.generateTemplateId('interactive', context),
      type: 'interactive',
      context,
      template: await this.buildInteractiveTemplate(context),
      metadata: {
        generatedAt: new Date(),
        hasInteractiveWidget: true
      }
    };
  }

  /**
   * Get cached template if available
   */
  getCachedTemplate(filePath: string, templateType: string): DocumentationTemplate | null {
    const cacheKey = this.generateCacheKey(filePath, templateType);
    return this.templateCache.get(cacheKey) || null;
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * Get generation metrics
   */
  getGenerationMetrics(): Map<string, number> {
    return new Map(this.generationMetrics);
  }

  private determineTemplateType(analysis: any): string {
    if (analysis.apiEndpoints && analysis.apiEndpoints.length > 0) {
      return 'api';
    }
    if (analysis.classes && analysis.classes.length > 0) {
      return 'class';
    }
    if (analysis.functions && analysis.functions.length > 0) {
      return 'function';
    }
    if (analysis.configurations && analysis.configurations.length > 0) {
      return 'configuration';
    }
    return 'general';
  }

  private async generateTemplateByType(
    templateType: string,
    analysis: any,
    options: GenerationOptions
  ): Promise<DocumentationTemplate> {
    switch (templateType) {
      case 'api':
        return this.generateAPITemplate(analysis.apiEndpoints);
      case 'class':
        return this.generateClassTemplate(analysis.classes[0]);
      case 'function':
        return this.generateFunctionTemplate(analysis.functions[0]);
      default:
        return this.generateGeneralTemplate(analysis, options);
    }
  }

  private async generateGeneralTemplate(
    analysis: any,
    options: GenerationOptions
  ): Promise<DocumentationTemplate> {
    const context: TemplateContext = {
      type: 'general',
      title: 'Documentation',
      sections: [
        {
          title: 'Overview',
          content: 'General documentation content'
        }
      ]
    };

    return {
      id: this.generateTemplateId('general', context),
      type: 'general',
      context,
      template: 'General template content',
      metadata: {
        generatedAt: new Date()
      }
    };
  }

  private groupEndpointsByTag(endpoints: APIEndpoint[]): Map<string, APIEndpoint[]> {
    const groups = new Map<string, APIEndpoint[]>();
    
    for (const endpoint of endpoints) {
      const tag = endpoint.tags?.[0] || 'Default';
      if (!groups.has(tag)) {
        groups.set(tag, []);
      }
      groups.get(tag)!.push(endpoint);
    }
    
    return groups;
  }

  private async generateEndpointDocumentation(endpoints: APIEndpoint[]): Promise<string> {
    let documentation = '';
    
    for (const endpoint of endpoints) {
      documentation += `
### ${endpoint.method.toUpperCase()} ${endpoint.path}

`;
      documentation += `${endpoint.description || 'No description available'}\n\n`;
      
      if (endpoint.parameters && endpoint.parameters.length > 0) {
        documentation += '#### Parameters\n';
        for (const param of endpoint.parameters) {
          documentation += `- **${param.name}** (${param.type}): ${param.description}\n`;
        }
        documentation += '\n';
      }
      
      if (endpoint.requestBody) {
        documentation += '#### Request Body\n';
        documentation += '```json\n';
        documentation += JSON.stringify(endpoint.requestBody.example, null, 2);
        documentation += '\n```\n\n';
      }
      
      if (endpoint.responses) {
        documentation += '#### Responses\n';
        for (const [code, response] of Object.entries(endpoint.responses)) {
          documentation += `**${code}**: ${response.description}\n`;
        }
        documentation += '\n';
      }
    }
    
    return documentation;
  }

  private generateClassOverview(classDefinition: ClassDefinition): string {
    return `
The \`${classDefinition.name}\` class ${classDefinition.description || 'provides functionality for the application'}.

${classDefinition.extends ? `Extends: \`${classDefinition.extends}\`\n` : ''}
${classDefinition.implements ? `Implements: \`${classDefinition.implements.join(', ')}\`\n` : ''}
`;
  }

  private generateConstructorDocumentation(constructor: any): string {
    if (!constructor) return 'No constructor defined.';
    
    let doc = `\`\`\`typescript\nnew ${constructor.className}(`;
    if (constructor.parameters) {
      doc += constructor.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
    }
    doc += ')\n```\n\n';
    
    if (constructor.parameters && constructor.parameters.length > 0) {
      doc += '#### Parameters\n';
      for (const param of constructor.parameters) {
        doc += `- **${param.name}** (${param.type}): ${param.description || 'No description'}\n`;
      }
    }
    
    return doc;
  }

  private generatePropertiesDocumentation(properties: any[]): string {
    if (!properties || properties.length === 0) {
      return 'No public properties.';
    }
    
    let doc = '';
    for (const prop of properties) {
      doc += `#### ${prop.name}\n`;
      doc += `- **Type**: \`${prop.type}\`\n`;
      doc += `- **Access**: ${prop.access || 'public'}\n`;
      doc += `- **Description**: ${prop.description || 'No description'}\n\n`;
    }
    
    return doc;
  }

  private generateMethodsDocumentation(methods: any[]): string {
    if (!methods || methods.length === 0) {
      return 'No public methods.';
    }
    
    let doc = '';
    for (const method of methods) {
      doc += `#### ${method.name}\n`;
      doc += `${method.description || 'No description'}\n\n`;
      
      doc += `\`\`\`typescript\n${method.signature}\n\`\`\`\n\n`;
      
      if (method.parameters && method.parameters.length > 0) {
        doc += '##### Parameters\n';
        for (const param of method.parameters) {
          doc += `- **${param.name}** (${param.type}): ${param.description || 'No description'}\n`;
        }
        doc += '\n';
      }
      
      if (method.returnType && method.returnType !== 'void') {
        doc += `##### Returns\n`;
        doc += `\`${method.returnType}\`: ${method.returnDescription || 'No description'}\n\n`;
      }
    }
    
    return doc;
  }

  private generateFunctionDescription(functionDef: FunctionDefinition): string {
    return functionDef.description || `The \`${functionDef.name}\` function performs a specific operation.`;
  }

  private generateParameterDocumentation(parameters: any[]): string {
    if (!parameters || parameters.length === 0) {
      return 'No parameters.';
    }
    
    let doc = '';
    for (const param of parameters) {
      doc += `- **${param.name}** (${param.type}): ${param.description || 'No description'}\n`;
    }
    
    return doc;
  }

  private generateReturnDocumentation(returnType: any): string {
    if (!returnType || returnType === 'void') {
      return 'This function does not return a value.';
    }
    
    return `Returns \`${returnType.type || returnType}\`: ${returnType.description || 'No description'}`;
  }

  private generateFunctionExamples(functionDef: FunctionDefinition): string {
    return `
\`\`\`typescript
// Example usage of ${functionDef.name}
const result = ${functionDef.name}(${
  functionDef.parameters?.map(p => `example${p.name.charAt(0).toUpperCase() + p.name.slice(1)}`).join(', ') || ''
});
console.log(result);
\`\`\`
`;
  }

  private generateOpenAPIPath(endpoint: APIEndpoint): any {
    const pathSpec: any = {
      summary: endpoint.summary || `${endpoint.method.toUpperCase()} ${endpoint.path}`,
      description: endpoint.description,
      tags: endpoint.tags || ['default']
    };

    // Add parameters
    if (endpoint.parameters && endpoint.parameters.length > 0) {
      pathSpec.parameters = endpoint.parameters.map(param => ({
        name: param.name,
        in: param.in || 'query',
        required: param.required || false,
        schema: {
          type: param.type || 'string'
        },
        description: param.description
      }));
    }

    // Add request body
    if (endpoint.requestBody) {
      pathSpec.requestBody = {
        required: endpoint.requestBody.required || false,
        content: {
          'application/json': {
            schema: endpoint.requestBody.schema,
            example: endpoint.requestBody.example
          }
        }
      };
    }

    // Add responses
    pathSpec.responses = {};
    if (endpoint.responses) {
      for (const [code, response] of Object.entries(endpoint.responses)) {
        pathSpec.responses[code] = {
          description: response.description,
          content: response.schema ? {
            'application/json': {
              schema: response.schema,
              example: response.example
            }
          } : undefined
        };
      }
    } else {
      pathSpec.responses['200'] = {
        description: 'Successful response'
      };
    }

    return pathSpec;
  }

  private extractSchemasFromEndpoints(endpoints: APIEndpoint[]): any {
    const schemas = {};
    
    for (const endpoint of endpoints) {
      // Extract schemas from request bodies and responses
      if (endpoint.requestBody?.schema) {
        // Add schema extraction logic
      }
      
      if (endpoint.responses) {
        for (const response of Object.values(endpoint.responses)) {
          if (response.schema) {
            // Add schema extraction logic
          }
        }
      }
    }
    
    return schemas;
  }

  private generateInteractiveWidget(codeExample: string): string {
    return `
<div class="interactive-example">
  <div class="code-editor">
    <pre><code>${codeExample}</code></pre>
  </div>
  <div class="run-button">
    <button onclick="runExample()">Run Example</button>
  </div>
  <div class="output">
    <pre id="output"></pre>
  </div>
</div>

<script>
function runExample() {
  try {
    const result = eval(\`${codeExample}\`);
    document.getElementById('output').textContent = JSON.stringify(result, null, 2);
  } catch (error) {
    document.getElementById('output').textContent = 'Error: ' + error.message;
  }
}
</script>
`;
  }

  private async buildAPITemplate(context: TemplateContext): Promise<string> {
    let template = `# ${context.title}\n\n`;
    
    for (const section of context.sections) {
      template += `## ${section.title}\n\n`;
      template += `${section.content}\n\n`;
    }
    
    return template;
  }

  private async buildClassTemplate(context: TemplateContext): Promise<string> {
    let template = `# ${context.title}\n\n`;
    
    for (const section of context.sections) {
      template += `## ${section.title}\n\n`;
      template += `${section.content}\n\n`;
    }
    
    return template;
  }

  private async buildFunctionTemplate(context: TemplateContext): Promise<string> {
    let template = `# ${context.title}\n\n`;
    
    for (const section of context.sections) {
      template += `## ${section.title}\n\n`;
      template += `${section.content}\n\n`;
    }
    
    return template;
  }

  private async buildInteractiveTemplate(context: TemplateContext): Promise<string> {
    let template = `# ${context.title}\n\n`;
    
    for (const section of context.sections) {
      if (section.title === 'Try It') {
        template += section.content; // Raw HTML for interactive widget
      } else {
        template += `## ${section.title}\n\n`;
        template += `${section.content}\n\n`;
      }
    }
    
    return template;
  }

  private generateTemplateId(type: string, context: TemplateContext): string {
    const content = JSON.stringify({ type, context });
    return Buffer.from(content).toString('base64').slice(0, 16);
  }

  private generateCacheKey(filePath: string, templateType: string): string {
    return `${filePath}:${templateType}`;
  }

  private updateGenerationMetrics(templateType: string, generationTime: number): void {
    const existing = this.generationMetrics.get(templateType) || 0;
    this.generationMetrics.set(templateType, Math.max(existing, generationTime));
  }
}

export default TemplateGenerator;