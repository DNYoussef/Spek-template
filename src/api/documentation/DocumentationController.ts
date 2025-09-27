import { Request, Response } from 'express';
import { PatternEngine } from '../../documentation/patterns/PatternEngine';
import { TemplateGenerator } from '../../documentation/patterns/TemplateGenerator';
import { DocumentationStore } from '../../documentation/patterns/DocumentationStore';
import { CrossReferenceManager } from '../../documentation/patterns/CrossReferenceManager';
import { VersionSynchronizer } from '../../documentation/patterns/VersionSynchronizer';
import { OpenAPIGenerator } from '../../documentation/automation/OpenAPIGenerator';
import { DocumentationPattern, PatternSearchOptions } from '../../documentation/types/PatternTypes';
import { APIEndpoint } from '../../documentation/types/OpenAPITypes';

/**
 * REST API controller for documentation management.
 * Provides comprehensive endpoints for pattern CRUD operations, search, and automation.
 */
export class DocumentationController {
  private patternEngine: PatternEngine;
  private templateGenerator: TemplateGenerator;
  private documentationStore: DocumentationStore;
  private crossReferenceManager: CrossReferenceManager;
  private versionSynchronizer: VersionSynchronizer;
  private openAPIGenerator: OpenAPIGenerator;

  constructor(
    patternEngine: PatternEngine,
    templateGenerator: TemplateGenerator,
    documentationStore: DocumentationStore,
    crossReferenceManager: CrossReferenceManager,
    versionSynchronizer: VersionSynchronizer,
    openAPIGenerator: OpenAPIGenerator
  ) {
    this.patternEngine = patternEngine;
    this.templateGenerator = templateGenerator;
    this.documentationStore = documentationStore;
    this.crossReferenceManager = crossReferenceManager;
    this.versionSynchronizer = versionSynchronizer;
    this.openAPIGenerator = openAPIGenerator;
  }

  /**
   * GET /api/docs/patterns
   * List all available documentation patterns with filtering
   */
  async getPatterns(req: Request, res: Response): Promise<void> {
    try {
      const {
        type,
        tags,
        author,
        dateFrom,
        dateTo,
        minEffectiveness,
        limit = 20,
        offset = 0,
        search
      } = req.query;

      let patterns: DocumentationPattern[];

      if (search) {
        // Full-text search
        const searchOptions: PatternSearchOptions = {
          type: type as string,
          tags: tags ? (tags as string).split(',') : undefined,
          author: author as string,
          dateRange: dateFrom && dateTo ? {
            start: new Date(dateFrom as string),
            end: new Date(dateTo as string)
          } : undefined,
          minEffectiveness: minEffectiveness ? parseFloat(minEffectiveness as string) : undefined,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        };

        patterns = await this.documentationStore.searchPatterns(
          search as string,
          searchOptions
        );
      } else {
        // Get patterns by type if specified
        if (type) {
          patterns = await this.documentationStore.getPatternsByType(type as string);
        } else if (tags) {
          patterns = await this.documentationStore.getPatternsByTags(
            (tags as string).split(',')
          );
        } else {
          // This would require implementing a getAllPatterns method
          patterns = [];
        }
      }

      // Apply additional filters
      if (minEffectiveness) {
        const threshold = parseFloat(minEffectiveness as string);
        patterns = patterns.filter(p => 
          (p.metadata?.effectiveness || 0) >= threshold
        );
      }

      if (author) {
        patterns = patterns.filter(p => p.metadata?.author === author);
      }

      // Apply pagination if not already applied
      const startIndex = parseInt(offset as string);
      const endIndex = startIndex + parseInt(limit as string);
      const paginatedPatterns = patterns.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          patterns: paginatedPatterns,
          totalCount: patterns.length,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: endIndex < patterns.length
        },
        metadata: {
          searchTime: Date.now(),
          filters: {
            type,
            tags,
            author,
            dateRange: dateFrom && dateTo ? { dateFrom, dateTo } : null,
            search
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'PATTERN_RETRIEVAL_ERROR',
          message: 'Failed to retrieve patterns',
          details: error.message
        }
      });
    }
  }

  /**
   * GET /api/docs/patterns/:id
   * Get a specific documentation pattern by ID
   */
  async getPattern(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { includeReferences = false, includeStats = false } = req.query;

      const pattern = await this.documentationStore.getPattern(id);
      
      if (!pattern) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PATTERN_NOT_FOUND',
            message: `Pattern with ID '${id}' not found`
          }
        });
        return;
      }

      const response: any = {
        success: true,
        data: { pattern }
      };

      // Include cross-references if requested
      if (includeReferences === 'true') {
        const references = this.crossReferenceManager.getReferencesFor(id);
        const backReferences = this.crossReferenceManager.getBackReferencesFor(id);
        
        response.data.references = {
          outgoing: references,
          incoming: backReferences
        };
      }

      // Include usage statistics if requested
      if (includeStats === 'true') {
        // This would require implementing pattern statistics tracking
        response.data.statistics = {
          views: pattern.metadata?.usageCount || 0,
          lastAccessed: pattern.metadata?.lastAccessed,
          effectiveness: pattern.metadata?.effectiveness
        };
      }

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'PATTERN_RETRIEVAL_ERROR',
          message: 'Failed to retrieve pattern',
          details: error.message
        }
      });
    }
  }

  /**
   * POST /api/docs/patterns
   * Create a new documentation pattern
   */
  async createPattern(req: Request, res: Response): Promise<void> {
    try {
      const {
        type,
        content,
        metadata,
        autoGenerateReferences = true
      } = req.body;

      // Validate required fields
      if (!type || !content) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Type and content are required fields',
            details: {
              requiredFields: ['type', 'content'],
              providedFields: Object.keys(req.body)
            }
          }
        });
        return;
      }

      // Create pattern object
      const pattern: DocumentationPattern = {
        id: this.generatePatternId(),
        type,
        content,
        metadata: {
          ...metadata,
          createdAt: new Date(),
          author: req.headers['x-user-id'] as string || 'anonymous'
        }
      };

      // Store the pattern
      const storeResult = await this.documentationStore.storePattern(pattern);
      
      if (!storeResult.success) {
        res.status(500).json({
          success: false,
          error: {
            code: 'STORAGE_ERROR',
            message: 'Failed to store pattern',
            details: storeResult.error
          }
        });
        return;
      }

      // Auto-generate cross-references if requested
      let discoveredReferences = [];
      if (autoGenerateReferences) {
        try {
          discoveredReferences = await this.crossReferenceManager.autoDiscoverReferences(pattern.id);
        } catch (error) {
          // Don't fail the request if reference discovery fails
          console.warn('Failed to auto-discover references:', error);
        }
      }

      res.status(201).json({
        success: true,
        data: {
          pattern,
          discoveredReferences: discoveredReferences.length,
          processingTime: storeResult.processingTime
        },
        message: 'Pattern created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'PATTERN_CREATION_ERROR',
          message: 'Failed to create pattern',
          details: error.message
        }
      });
    }
  }

  /**
   * PUT /api/docs/patterns/:id
   * Update an existing documentation pattern
   */
  async updatePattern(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { content, metadata, updateReferences = true } = req.body;

      // Check if pattern exists
      const existingPattern = await this.documentationStore.getPattern(id);
      if (!existingPattern) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PATTERN_NOT_FOUND',
            message: `Pattern with ID '${id}' not found`
          }
        });
        return;
      }

      // Prepare updates
      const updates: Partial<DocumentationPattern> = {};
      
      if (content !== undefined) {
        updates.content = content;
      }
      
      if (metadata !== undefined) {
        updates.metadata = {
          ...existingPattern.metadata,
          ...metadata,
          lastModified: new Date(),
          version: (existingPattern.metadata?.version || 1) + 1
        };
      }

      // Update the pattern
      const updateResult = await this.documentationStore.updatePattern(id, updates);
      
      if (!updateResult.success) {
        res.status(500).json({
          success: false,
          error: {
            code: 'UPDATE_ERROR',
            message: 'Failed to update pattern',
            details: updateResult.error
          }
        });
        return;
      }

      // Update cross-references if content changed and requested
      if (content !== undefined && updateReferences) {
        try {
          await this.crossReferenceManager.updateReferencesForPattern(id);
        } catch (error) {
          console.warn('Failed to update references:', error);
        }
      }

      // Get updated pattern
      const updatedPattern = await this.documentationStore.getPattern(id);

      res.json({
        success: true,
        data: {
          pattern: updatedPattern,
          processingTime: updateResult.processingTime
        },
        message: 'Pattern updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'PATTERN_UPDATE_ERROR',
          message: 'Failed to update pattern',
          details: error.message
        }
      });
    }
  }

  /**
   * DELETE /api/docs/patterns/:id
   * Delete a documentation pattern
   */
  async deletePattern(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { force = false } = req.query;

      // Check if pattern exists
      const existingPattern = await this.documentationStore.getPattern(id);
      if (!existingPattern) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PATTERN_NOT_FOUND',
            message: `Pattern with ID '${id}' not found`
          }
        });
        return;
      }

      // Check for references if not forcing
      if (!force) {
        const backReferences = this.crossReferenceManager.getBackReferencesFor(id);
        if (backReferences.length > 0) {
          res.status(409).json({
            success: false,
            error: {
              code: 'PATTERN_HAS_REFERENCES',
              message: 'Cannot delete pattern that is referenced by other patterns',
              details: {
                referencingPatterns: backReferences.map(ref => ref.sourceId),
                referenceCount: backReferences.length,
                suggestion: 'Use force=true to delete anyway'
              }
            }
          });
          return;
        }
      }

      // Delete the pattern
      const deleteResult = await this.documentationStore.deletePattern(id);
      
      if (!deleteResult.success) {
        res.status(500).json({
          success: false,
          error: {
            code: 'DELETE_ERROR',
            message: 'Failed to delete pattern',
            details: deleteResult.error
          }
        });
        return;
      }

      res.json({
        success: true,
        data: {
          deletedPatternId: id,
          processingTime: deleteResult.processingTime
        },
        message: 'Pattern deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'PATTERN_DELETE_ERROR',
          message: 'Failed to delete pattern',
          details: error.message
        }
      });
    }
  }

  /**
   * POST /api/docs/generate
   * Generate documentation from code analysis
   */
  async generateDocumentation(req: Request, res: Response): Promise<void> {
    try {
      const {
        files,
        type = 'auto',
        options = {},
        storeResults = true
      } = req.body;

      if (!files || !Array.isArray(files) || files.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Files array is required and must not be empty',
            details: {
              requiredFields: ['files'],
              example: {
                files: ['src/api.ts', 'src/models.ts'],
                type: 'api',
                options: { includeExamples: true }
              }
            }
          }
        });
        return;
      }

      const generatedPatterns: DocumentationPattern[] = [];
      const errors: Array<{ file: string; error: string }> = [];

      for (const filePath of files) {
        try {
          // Generate documentation for each file
          const patterns = await this.patternEngine.recognizePatterns(
            await this.readFile(filePath),
            filePath
          );

          for (const pattern of patterns) {
            if (storeResults) {
              await this.documentationStore.storePattern(pattern);
            }
            generatedPatterns.push(pattern);
          }
        } catch (error) {
          errors.push({ file: filePath, error: error.message });
        }
      }

      res.json({
        success: true,
        data: {
          generatedPatterns,
          totalGenerated: generatedPatterns.length,
          errors,
          summary: {
            successfulFiles: files.length - errors.length,
            failedFiles: errors.length,
            totalPatterns: generatedPatterns.length
          }
        },
        message: `Generated ${generatedPatterns.length} documentation patterns`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'GENERATION_ERROR',
          message: 'Failed to generate documentation',
          details: error.message
        }
      });
    }
  }

  /**
   * GET /api/docs/search
   * Advanced search across all documentation
   */
  async searchDocumentation(req: Request, res: Response): Promise<void> {
    try {
      const {
        q: query,
        type,
        similarity = false,
        threshold = 0.7,
        limit = 20,
        offset = 0
      } = req.query;

      if (!query) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Query parameter q is required'
          }
        });
        return;
      }

      let results: DocumentationPattern[];
      const searchOptions = {
        type: type as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };

      if (similarity === 'true') {
        // Semantic similarity search
        results = await this.documentationStore.searchSimilarPatterns(
          query as string,
          parseFloat(threshold as string),
          parseInt(limit as string)
        );
      } else {
        // Full-text search
        results = await this.documentationStore.searchPatterns(
          query as string,
          searchOptions
        );
      }

      res.json({
        success: true,
        data: {
          results,
          totalCount: results.length,
          query: query as string,
          searchType: similarity === 'true' ? 'similarity' : 'fulltext',
          threshold: similarity === 'true' ? parseFloat(threshold as string) : undefined
        },
        metadata: {
          searchTime: Date.now(),
          parameters: {
            query,
            type,
            similarity,
            threshold,
            limit,
            offset
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: 'Search operation failed',
          details: error.message
        }
      });
    }
  }

  /**
   * POST /api/docs/validate
   * Validate documentation quality and completeness
   */
  async validateDocumentation(req: Request, res: Response): Promise<void> {
    try {
      const { patternIds, validationType = 'comprehensive' } = req.body;

      if (!patternIds || !Array.isArray(patternIds)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'patternIds array is required'
          }
        });
        return;
      }

      const validationResults = [];
      
      for (const patternId of patternIds) {
        try {
          const pattern = await this.documentationStore.getPattern(patternId);
          if (!pattern) {
            validationResults.push({
              patternId,
              isValid: false,
              errors: [`Pattern ${patternId} not found`],
              warnings: [],
              score: 0
            });
            continue;
          }

          // Perform validation (this would be a more comprehensive implementation)
          const validation = this.validatePattern(pattern, validationType);
          validationResults.push({
            patternId,
            ...validation
          });
        } catch (error) {
          validationResults.push({
            patternId,
            isValid: false,
            errors: [`Validation error: ${error.message}`],
            warnings: [],
            score: 0
          });
        }
      }

      const overallScore = validationResults.reduce((sum, result) => sum + result.score, 0) / validationResults.length;
      const validCount = validationResults.filter(result => result.isValid).length;

      res.json({
        success: true,
        data: {
          validationResults,
          summary: {
            totalPatterns: patternIds.length,
            validPatterns: validCount,
            invalidPatterns: patternIds.length - validCount,
            overallScore: Math.round(overallScore * 100) / 100,
            validationType
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation operation failed',
          details: error.message
        }
      });
    }
  }

  /**
   * GET /api/docs/analytics
   * Get documentation usage and effectiveness analytics
   */
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const {
        timeRange = '30d',
        granularity = 'daily',
        includeDetails = false
      } = req.query;

      // Get storage analytics
      const storageAnalytics = this.documentationStore.getStorageAnalytics();
      
      // Get pattern analytics
      const patternAnalytics = this.patternEngine.getPatternAnalytics();
      
      // Get reference analytics
      const referenceAnalytics = this.crossReferenceManager.getReferenceAnalytics();

      const analytics = {
        overview: {
          totalPatterns: storageAnalytics.totalPatterns,
          totalReferences: referenceAnalytics.totalReferences,
          averageQuality: storageAnalytics.averageRetrievalTime,
          cacheHitRate: storageAnalytics.cacheHitRate,
          lastUpdated: new Date()
        },
        patterns: {
          byType: Object.fromEntries(storageAnalytics.patternsByType),
          topAccessed: storageAnalytics.topAccessedPatterns,
          qualityDistribution: this.calculateQualityDistribution(storageAnalytics)
        },
        references: {
          total: referenceAnalytics.totalReferences,
          valid: referenceAnalytics.validReferences,
          broken: referenceAnalytics.brokenReferences,
          byType: Object.fromEntries(referenceAnalytics.referencesByType),
          mostReferenced: referenceAnalytics.mostReferencedPatterns
        },
        performance: {
          averageRetrievalTime: storageAnalytics.averageRetrievalTime,
          cacheHitRate: storageAnalytics.cacheHitRate,
          storageSize: storageAnalytics.storageSize
        }
      };

      if (includeDetails === 'true') {
        // Add detailed metrics if requested
        analytics.details = {
          recentActivity: [], // Would be implemented
          trendAnalysis: {}, // Would be implemented
          userEngagement: {} // Would be implemented
        };
      }

      res.json({
        success: true,
        data: analytics,
        metadata: {
          timeRange,
          granularity,
          generatedAt: new Date()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: 'Failed to retrieve analytics',
          details: error.message
        }
      });
    }
  }

  /**
   * POST /api/docs/openapi
   * Generate OpenAPI specification from endpoints
   */
  async generateOpenAPI(req: Request, res: Response): Promise<void> {
    try {
      const {
        serviceName,
        version = '1.0.0',
        endpoints,
        options = {}
      } = req.body;

      if (!serviceName || !endpoints || !Array.isArray(endpoints)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'serviceName and endpoints array are required'
          }
        });
        return;
      }

      const openApiSpec = await this.openAPIGenerator.generateOpenAPISpec(
        serviceName,
        version,
        endpoints,
        options
      );

      // Generate additional formats if requested
      const response: any = {
        success: true,
        data: {
          openApiSpec,
          serviceName,
          version,
          endpointCount: endpoints.length
        }
      };

      if (options.includeSwaggerUI) {
        response.data.swaggerUISpec = await this.openAPIGenerator.generateSwaggerUISpec(serviceName);
      }

      if (options.includePostmanCollection) {
        response.data.postmanCollection = await this.openAPIGenerator.generatePostmanCollection(serviceName);
      }

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'OPENAPI_GENERATION_ERROR',
          message: 'Failed to generate OpenAPI specification',
          details: error.message
        }
      });
    }
  }

  // Helper methods
  private generatePatternId(): string {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async readFile(filePath: string): Promise<string> {
    const fs = require('fs').promises;
    return await fs.readFile(filePath, 'utf-8');
  }

  private validatePattern(pattern: DocumentationPattern, validationType: string): any {
    // Simplified validation - would be more comprehensive in real implementation
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    if (!pattern.content || pattern.content.length < 50) {
      errors.push('Content is too short or missing');
      score -= 30;
    }

    if (!pattern.metadata?.title && !pattern.metadata?.description) {
      warnings.push('Missing title or description in metadata');
      score -= 10;
    }

    if (!pattern.metadata?.tags || pattern.metadata.tags.length === 0) {
      warnings.push('No tags specified for better discoverability');
      score -= 5;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  private calculateQualityDistribution(analytics: any): any {
    // Simplified quality distribution calculation
    const total = analytics.totalPatterns;
    return {
      high: Math.floor(total * 0.3),
      medium: Math.floor(total * 0.5),
      low: Math.floor(total * 0.2)
    };
  }
}

export default DocumentationController;