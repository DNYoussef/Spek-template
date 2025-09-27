import { EventEmitter } from 'events';
import { DocumentationStore } from './DocumentationStore';
import { CrossReferenceManager } from './CrossReferenceManager';
import { CodeAnalyzer } from '../analysis/CodeAnalyzer';
import { TemplateGenerator } from './TemplateGenerator';
import { DocumentationPattern } from '../types/PatternTypes';
import { SyncResult, ChangeType, FileChange } from '../types/SyncTypes';

/**
 * Automatic synchronization of documentation with code changes.
 * Ensures documentation stays current with codebase evolution.
 */
export class VersionSynchronizer extends EventEmitter {
  private documentationStore: DocumentationStore;
  private crossReferenceManager: CrossReferenceManager;
  private codeAnalyzer: CodeAnalyzer;
  private templateGenerator: TemplateGenerator;
  private fileWatcher: Map<string, Date>; // filePath -> lastModified
  private syncQueue: FileChange[];
  private isProcessing: boolean;
  private syncMetrics: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageSyncTime: number;
    lastSyncTime: Date | null;
  };

  constructor(
    documentationStore: DocumentationStore,
    crossReferenceManager: CrossReferenceManager,
    templateGenerator: TemplateGenerator
  ) {
    super();
    this.documentationStore = documentationStore;
    this.crossReferenceManager = crossReferenceManager;
    this.codeAnalyzer = new CodeAnalyzer();
    this.templateGenerator = templateGenerator;
    this.fileWatcher = new Map();
    this.syncQueue = [];
    this.isProcessing = false;
    this.syncMetrics = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      averageSyncTime: 0,
      lastSyncTime: null
    };
  }

  /**
   * Initialize version synchronizer with file watching
   */
  async initialize(watchPaths: string[] = []): Promise<void> {
    // Set up file watching for specified paths
    for (const path of watchPaths) {
      await this.setupFileWatcher(path);
    }
    
    // Start processing sync queue
    this.startSyncProcessor();
    
    this.emit('initialized', { watchPaths });
  }

  /**
   * Synchronize documentation for a specific file
   */
  async syncFile(filePath: string, force: boolean = false): Promise<SyncResult> {
    const startTime = Date.now();
    
    try {
      // Check if file needs synchronization
      if (!force && !await this.needsSync(filePath)) {
        return {
          success: true,
          filePath,
          changeType: ChangeType.NO_CHANGE,
          processingTime: Date.now() - startTime,
          message: 'No synchronization needed'
        };
      }
      
      // Read and analyze file
      const fileContent = await this.readFile(filePath);
      const codeAnalysis = await this.codeAnalyzer.analyzeCode(fileContent, filePath);
      
      // Determine change type
      const changeType = await this.determineChangeType(filePath, codeAnalysis);
      
      // Process based on change type
      let syncResult: SyncResult;
      
      switch (changeType) {
        case ChangeType.NEW_FILE:
          syncResult = await this.handleNewFile(filePath, codeAnalysis);
          break;
        case ChangeType.MODIFIED:
          syncResult = await this.handleModifiedFile(filePath, codeAnalysis);
          break;
        case ChangeType.DELETED:
          syncResult = await this.handleDeletedFile(filePath);
          break;
        default:
          syncResult = await this.handleNoChange(filePath);
      }
      
      // Update file watcher timestamp
      this.fileWatcher.set(filePath, new Date());
      
      // Update metrics
      this.updateSyncMetrics(true, Date.now() - startTime);
      
      this.emit('fileSynced', syncResult);
      return syncResult;
      
    } catch (error) {
      const syncResult: SyncResult = {
        success: false,
        filePath,
        changeType: ChangeType.ERROR,
        processingTime: Date.now() - startTime,
        error: error.message
      };
      
      this.updateSyncMetrics(false, Date.now() - startTime);
      this.emit('syncError', { filePath, error });
      
      return syncResult;
    }
  }

  /**
   * Synchronize documentation for multiple files
   */
  async syncFiles(filePaths: string[]): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    
    // Process files in parallel for better performance
    const syncPromises = filePaths.map(filePath => this.syncFile(filePath));
    const batchResults = await Promise.allSettled(syncPromises);
    
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          success: false,
          filePath: 'unknown',
          changeType: ChangeType.ERROR,
          processingTime: 0,
          error: result.reason?.message || 'Unknown error'
        });
      }
    }
    
    this.emit('batchSyncCompleted', { results, fileCount: filePaths.length });
    return results;
  }

  /**
   * Watch directory for file changes and auto-sync
   */
  async watchDirectory(directoryPath: string): Promise<void> {
    // Set up directory watching with debouncing
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      const files = await fs.readdir(directoryPath, { recursive: true });
      
      for (const file of files) {
        const fullPath = path.join(directoryPath, file);
        const stats = await fs.stat(fullPath);
        
        if (stats.isFile() && this.isWatchableFile(fullPath)) {
          this.fileWatcher.set(fullPath, stats.mtime);
          
          // Queue for initial sync if needed
          if (await this.needsSync(fullPath)) {
            this.queueFileChange({
              filePath: fullPath,
              changeType: ChangeType.MODIFIED,
              timestamp: new Date()
            });
          }
        }
      }
      
      this.emit('directoryWatchStarted', { directoryPath, fileCount: files.length });
      
    } catch (error) {
      this.emit('error', { operation: 'watchDirectory', directoryPath, error });
    }
  }

  /**
   * Queue file change for processing
   */
  queueFileChange(change: FileChange): void {
    // Remove existing entry for same file
    this.syncQueue = this.syncQueue.filter(item => item.filePath !== change.filePath);
    
    // Add new change to queue
    this.syncQueue.push(change);
    
    this.emit('changeQueued', change);
  }

  /**
   * Process sync queue continuously
   */
  private startSyncProcessor(): void {
    const processQueue = async () => {
      if (this.isProcessing || this.syncQueue.length === 0) {
        return;
      }
      
      this.isProcessing = true;
      
      try {
        // Process changes in batches
        const batchSize = 5;
        const batch = this.syncQueue.splice(0, batchSize);
        
        const syncPromises = batch.map(change => 
          this.syncFile(change.filePath)
        );
        
        await Promise.allSettled(syncPromises);
        
      } catch (error) {
        this.emit('error', { operation: 'processQueue', error });
      } finally {
        this.isProcessing = false;
      }
    };
    
    // Process queue every 2 seconds
    setInterval(processQueue, 2000);
  }

  /**
   * Get synchronization status for files
   */
  getSyncStatus(): {
    watchedFiles: number;
    queuedChanges: number;
    isProcessing: boolean;
    metrics: typeof this.syncMetrics;
  } {
    return {
      watchedFiles: this.fileWatcher.size,
      queuedChanges: this.syncQueue.length,
      isProcessing: this.isProcessing,
      metrics: this.syncMetrics
    };
  }

  /**
   * Force synchronization of all watched files
   */
  async forceSync(): Promise<SyncResult[]> {
    const watchedFiles = Array.from(this.fileWatcher.keys());
    return await this.syncFiles(watchedFiles);
  }

  /**
   * Stop watching and clear queue
   */
  stop(): void {
    this.fileWatcher.clear();
    this.syncQueue.length = 0;
    this.isProcessing = false;
    this.emit('stopped');
  }

  private async handleNewFile(filePath: string, codeAnalysis: any): Promise<SyncResult> {
    const startTime = Date.now();
    
    try {
      // Generate documentation template for new file
      const template = await this.templateGenerator.generateFromCode(
        codeAnalysis.content,
        filePath
      );
      
      // Create documentation patterns from analysis
      const patterns: DocumentationPattern[] = [];
      
      // Create patterns for each discovered element
      if (codeAnalysis.classes) {
        for (const classInfo of codeAnalysis.classes) {
          const classTemplate = await this.templateGenerator.generateClassTemplate(classInfo);
          const pattern: DocumentationPattern = {
            id: `${filePath}:class:${classInfo.name}`,
            type: 'class',
            content: classTemplate.template,
            metadata: {
              filePath,
              className: classInfo.name,
              generatedAt: new Date(),
              sourceFile: filePath
            }
          };
          patterns.push(pattern);
        }
      }
      
      if (codeAnalysis.functions) {
        for (const functionInfo of codeAnalysis.functions) {
          const functionTemplate = await this.templateGenerator.generateFunctionTemplate(functionInfo);
          const pattern: DocumentationPattern = {
            id: `${filePath}:function:${functionInfo.name}`,
            type: 'function',
            content: functionTemplate.template,
            metadata: {
              filePath,
              functionName: functionInfo.name,
              generatedAt: new Date(),
              sourceFile: filePath
            }
          };
          patterns.push(pattern);
        }
      }
      
      if (codeAnalysis.apiEndpoints) {
        const apiTemplate = await this.templateGenerator.generateAPITemplate(codeAnalysis.apiEndpoints);
        const pattern: DocumentationPattern = {
          id: `${filePath}:api`,
          type: 'api',
          content: apiTemplate.template,
          metadata: {
            filePath,
            endpointCount: codeAnalysis.apiEndpoints.length,
            generatedAt: new Date(),
            sourceFile: filePath
          }
        };
        patterns.push(pattern);
      }
      
      // Store all patterns
      for (const pattern of patterns) {
        await this.documentationStore.storePattern(pattern);
      }
      
      // Auto-discover cross-references
      for (const pattern of patterns) {
        await this.crossReferenceManager.autoDiscoverReferences(pattern.id);
      }
      
      return {
        success: true,
        filePath,
        changeType: ChangeType.NEW_FILE,
        processingTime: Date.now() - startTime,
        patternsCreated: patterns.length,
        message: `Created ${patterns.length} documentation patterns`
      };
      
    } catch (error) {
      throw new Error(`Failed to handle new file ${filePath}: ${error.message}`);
    }
  }

  private async handleModifiedFile(filePath: string, codeAnalysis: any): Promise<SyncResult> {
    const startTime = Date.now();
    
    try {
      // Find existing patterns for this file
      const existingPatterns = await this.findPatternsForFile(filePath);
      
      let updatedCount = 0;
      let createdCount = 0;
      
      // Update existing patterns
      for (const pattern of existingPatterns) {
        const updatedContent = await this.generateUpdatedContent(pattern, codeAnalysis);
        if (updatedContent !== pattern.content) {
          await this.documentationStore.updatePattern(pattern.id, {
            content: updatedContent,
            metadata: {
              ...pattern.metadata,
              lastUpdated: new Date(),
              version: (pattern.metadata?.version || 1) + 1
            }
          });
          
          // Update cross-references
          await this.crossReferenceManager.updateReferencesForPattern(pattern.id);
          
          updatedCount++;
        }
      }
      
      // Create patterns for new elements
      const newElements = await this.findNewElements(filePath, codeAnalysis, existingPatterns);
      for (const element of newElements) {
        const template = await this.generateTemplateForElement(element, filePath);
        const pattern: DocumentationPattern = {
          id: `${filePath}:${element.type}:${element.name}`,
          type: element.type,
          content: template,
          metadata: {
            filePath,
            elementName: element.name,
            generatedAt: new Date(),
            sourceFile: filePath
          }
        };
        
        await this.documentationStore.storePattern(pattern);
        await this.crossReferenceManager.autoDiscoverReferences(pattern.id);
        
        createdCount++;
      }
      
      return {
        success: true,
        filePath,
        changeType: ChangeType.MODIFIED,
        processingTime: Date.now() - startTime,
        patternsUpdated: updatedCount,
        patternsCreated: createdCount,
        message: `Updated ${updatedCount} and created ${createdCount} patterns`
      };
      
    } catch (error) {
      throw new Error(`Failed to handle modified file ${filePath}: ${error.message}`);
    }
  }

  private async handleDeletedFile(filePath: string): Promise<SyncResult> {
    const startTime = Date.now();
    
    try {
      // Find and remove all patterns for this file
      const patterns = await this.findPatternsForFile(filePath);
      
      let deletedCount = 0;
      for (const pattern of patterns) {
        await this.documentationStore.deletePattern(pattern.id);
        deletedCount++;
      }
      
      // Remove from file watcher
      this.fileWatcher.delete(filePath);
      
      return {
        success: true,
        filePath,
        changeType: ChangeType.DELETED,
        processingTime: Date.now() - startTime,
        patternsDeleted: deletedCount,
        message: `Removed ${deletedCount} documentation patterns`
      };
      
    } catch (error) {
      throw new Error(`Failed to handle deleted file ${filePath}: ${error.message}`);
    }
  }

  private async handleNoChange(filePath: string): Promise<SyncResult> {
    return {
      success: true,
      filePath,
      changeType: ChangeType.NO_CHANGE,
      processingTime: 0,
      message: 'No changes detected'
    };
  }

  private async needsSync(filePath: string): Promise<boolean> {
    try {
      const fs = require('fs').promises;
      const stats = await fs.stat(filePath);
      const lastWatched = this.fileWatcher.get(filePath);
      
      return !lastWatched || stats.mtime > lastWatched;
    } catch (error) {
      // File doesn't exist, might be deleted
      return true;
    }
  }

  private async determineChangeType(filePath: string, codeAnalysis: any): Promise<ChangeType> {
    const isWatched = this.fileWatcher.has(filePath);
    const patterns = await this.findPatternsForFile(filePath);
    
    if (!isWatched && patterns.length === 0) {
      return ChangeType.NEW_FILE;
    }
    
    if (patterns.length > 0) {
      return ChangeType.MODIFIED;
    }
    
    return ChangeType.NO_CHANGE;
  }

  private async readFile(filePath: string): Promise<string> {
    const fs = require('fs').promises;
    return await fs.readFile(filePath, 'utf-8');
  }

  private isWatchableFile(filePath: string): boolean {
    const watchableExtensions = ['.ts', '.js', '.py', '.java', '.cs', '.cpp', '.h'];
    return watchableExtensions.some(ext => filePath.endsWith(ext));
  }

  private async setupFileWatcher(path: string): Promise<void> {
    // Set up file system watching for the path
    // This would use fs.watch or similar in a real implementation
  }

  private async findPatternsForFile(filePath: string): Promise<DocumentationPattern[]> {
    // Search for patterns that belong to this file
    const allPatterns = await this.documentationStore.searchPatterns(
      filePath,
      { type: undefined }
    );
    
    return allPatterns.filter(pattern => 
      pattern.metadata?.filePath === filePath ||
      pattern.metadata?.sourceFile === filePath
    );
  }

  private async generateUpdatedContent(pattern: DocumentationPattern, codeAnalysis: any): Promise<string> {
    // Generate updated content based on current code analysis
    // This would involve comparing the pattern with current code and updating accordingly
    return pattern.content; // Simplified for now
  }

  private async findNewElements(filePath: string, codeAnalysis: any, existingPatterns: DocumentationPattern[]): Promise<any[]> {
    const newElements: any[] = [];
    
    // Find classes not covered by existing patterns
    if (codeAnalysis.classes) {
      for (const classInfo of codeAnalysis.classes) {
        const hasPattern = existingPatterns.some(p => 
          p.metadata?.className === classInfo.name
        );
        if (!hasPattern) {
          newElements.push({ ...classInfo, type: 'class' });
        }
      }
    }
    
    // Find functions not covered by existing patterns
    if (codeAnalysis.functions) {
      for (const functionInfo of codeAnalysis.functions) {
        const hasPattern = existingPatterns.some(p => 
          p.metadata?.functionName === functionInfo.name
        );
        if (!hasPattern) {
          newElements.push({ ...functionInfo, type: 'function' });
        }
      }
    }
    
    return newElements;
  }

  private async generateTemplateForElement(element: any, filePath: string): Promise<string> {
    switch (element.type) {
      case 'class':
        const classTemplate = await this.templateGenerator.generateClassTemplate(element);
        return classTemplate.template;
      case 'function':
        const functionTemplate = await this.templateGenerator.generateFunctionTemplate(element);
        return functionTemplate.template;
      default:
        return `Documentation for ${element.name}`;
    }
  }

  private updateSyncMetrics(success: boolean, processingTime: number): void {
    this.syncMetrics.totalSyncs++;
    
    if (success) {
      this.syncMetrics.successfulSyncs++;
    } else {
      this.syncMetrics.failedSyncs++;
    }
    
    // Update average processing time
    const current = this.syncMetrics.averageSyncTime;
    this.syncMetrics.averageSyncTime = (current + processingTime) / 2;
    
    this.syncMetrics.lastSyncTime = new Date();
  }
}

export default VersionSynchronizer;