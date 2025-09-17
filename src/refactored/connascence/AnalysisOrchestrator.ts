/**
 * AnalysisOrchestrator - NASA POT10 Compliant
 *
 * Orchestration methods extracted from UnifiedConnascenceAnalyzer
 * Following NASA Rule 4: Functions <60 lines
 * Following NASA Rule 5: 2+ assertions per function
 * Following NASA Rule 7: Check all return values
 */

import { ConnascenceDetector } from './ConnascenceDetector';
import { CacheManager } from './CacheManager';
import { ResultAggregator } from './ResultAggregator';

interface AnalysisConfig {
    enableCaching: boolean;
    maxFiles: number;
    timeoutMs: number;
}

interface AnalysisResult {
    success: boolean;
    violations: any[];
    filesAnalyzed: number;
    errors: string[];
}

export class AnalysisOrchestrator {
    private detector: ConnascenceDetector;
    private cache: CacheManager;
    private aggregator: ResultAggregator;
    private readonly maxFiles = 1000; // NASA Rule 2

    constructor(config: AnalysisConfig) {
        // NASA Rule 5: Input assertions
        console.assert(config != null, 'config cannot be null');
        console.assert(config.maxFiles > 0, 'maxFiles must be positive');
        console.assert(config.timeoutMs > 0, 'timeoutMs must be positive');

        this.detector = new ConnascenceDetector();
        this.cache = new CacheManager();
        this.aggregator = new ResultAggregator();

        // NASA Rule 5: State assertion
        console.assert(this.detector != null, 'detector must be initialized');
    }

    /**
     * Orchestrate complete analysis pipeline
     * NASA Rule 4: <60 lines
     */
    async orchestrateAnalysis(files: string[]): Promise<AnalysisResult> {
        // NASA Rule 5: Input assertions
        console.assert(Array.isArray(files), 'files must be array');
        console.assert(files.length > 0, 'files array cannot be empty');

        const result: AnalysisResult = {
            success: false,
            violations: [],
            filesAnalyzed: 0,
            errors: []
        };

        try {
            // Validate file count limit
            if (files.length > this.maxFiles) {
                result.errors.push(`Too many files: ${files.length} (max: ${this.maxFiles})`);
                return result;
            }

            // Process files in batches
            const batchResults = await this.processBatches(files);
            if (!batchResults.success) {
                result.errors = batchResults.errors;
                return result;
            }

            // Aggregate all results
            const aggregated = this.aggregator.aggregateResults(batchResults.violations);
            if (!aggregated.success) {
                result.errors.push('Aggregation failed');
                return result;
            }

            result.success = true;
            result.violations = aggregated.violations;
            result.filesAnalyzed = files.length;

        } catch (error) {
            result.errors.push(`Analysis failed: ${error}`);
        }

        // NASA Rule 5: Output assertion
        console.assert(typeof result.success === 'boolean', 'success must be boolean');
        return result;
    }

    /**
     * Process files in manageable batches
     * NASA Rule 4: <60 lines
     */
    private async processBatches(files: string[]): Promise<AnalysisResult> {
        // NASA Rule 5: Input assertions
        console.assert(Array.isArray(files), 'files must be array');
        console.assert(files.length > 0, 'files cannot be empty');

        const result: AnalysisResult = {
            success: false,
            violations: [],
            filesAnalyzed: 0,
            errors: []
        };

        const batchSize = 10; // Fixed batch size
        let processedCount = 0;

        // NASA Rule 2: Fixed upper bound
        for (let i = 0; i < files.length && i < this.maxFiles; i += batchSize) {
            const batch = files.slice(i, i + batchSize);

            const batchResult = await this.processBatch(batch);
            if (!batchResult.success) {
                result.errors.push(...batchResult.errors);
                continue;
            }

            result.violations.push(...batchResult.violations);
            processedCount += batch.length;
        }

        result.success = result.errors.length === 0;
        result.filesAnalyzed = processedCount;

        // NASA Rule 5: Output assertion
        console.assert(typeof result.success === 'boolean', 'success must be boolean');
        return result;
    }

    /**
     * Process single batch of files
     * NASA Rule 4: <60 lines
     */
    private async processBatch(batch: string[]): Promise<AnalysisResult> {
        // NASA Rule 5: Input assertions
        console.assert(Array.isArray(batch), 'batch must be array');
        console.assert(batch.length <= 10, 'batch size too large');

        const result: AnalysisResult = {
            success: false,
            violations: [],
            filesAnalyzed: 0,
            errors: []
        };

        let successCount = 0;

        // NASA Rule 2: Fixed upper bound (batch size)
        for (let i = 0; i < batch.length && i < 10; i++) {
            const file = batch[i];

            try {
                const fileResult = await this.processFile(file);
                if (fileResult.success) {
                    result.violations.push(...fileResult.violations);
                    successCount++;
                } else {
                    result.errors.push(`File ${file}: ${fileResult.errors.join(', ')}`);
                }
            } catch (error) {
                result.errors.push(`File ${file} failed: ${error}`);
            }
        }

        result.success = successCount > 0;
        result.filesAnalyzed = successCount;

        // NASA Rule 5: Output assertion
        console.assert(typeof result.success === 'boolean', 'success must be boolean');
        return result;
    }

    /**
     * Process individual file
     * NASA Rule 4: <60 lines
     */
    private async processFile(filePath: string): Promise<AnalysisResult> {
        // NASA Rule 5: Input assertions
        console.assert(typeof filePath === 'string', 'filePath must be string');
        console.assert(filePath.length > 0, 'filePath cannot be empty');

        const result: AnalysisResult = {
            success: false,
            violations: [],
            filesAnalyzed: 0,
            errors: []
        };

        try {
            // Check cache first
            const cached = this.cache.getCachedResult(filePath);
            if (cached.found) {
                result.success = true;
                result.violations = cached.violations;
                result.filesAnalyzed = 1;
                return result;
            }

            // Load and parse file
            const parseResult = await this.parseFile(filePath);
            if (!parseResult.success) {
                result.errors = parseResult.errors;
                return result;
            }

            // Detect violations
            const detectionResult = await this.detectViolations(parseResult.ast, parseResult.sourceLines);
            if (!detectionResult.success) {
                result.errors = detectionResult.errors;
                return result;
            }

            // Cache result
            const cacheResult = this.cache.cacheResult(filePath, detectionResult.violations);
            if (!cacheResult.success) {
                // Continue even if caching fails
                console.warn(`Caching failed for ${filePath}`);
            }

            result.success = true;
            result.violations = detectionResult.violations;
            result.filesAnalyzed = 1;

        } catch (error) {
            result.errors.push(`Processing failed: ${error}`);
        }

        // NASA Rule 5: Output assertion
        console.assert(typeof result.success === 'boolean', 'success must be boolean');
        return result;
    }

    /**
     * Parse file to AST
     * NASA Rule 4: <60 lines
     */
    private async parseFile(filePath: string): Promise<{ success: boolean; ast?: any; sourceLines?: string[]; errors: string[] }> {
        // NASA Rule 5: Input assertions
        console.assert(typeof filePath === 'string', 'filePath must be string');
        console.assert(filePath.length > 0, 'filePath cannot be empty');

        const result = { success: false, errors: [] as string[] };

        try {
            // Simplified parsing - in real implementation would use actual parser
            const sourceLines = ['// Placeholder source'];
            const ast = { type: 'Program', body: [] };

            Object.assign(result, {
                success: true,
                ast,
                sourceLines
            });

        } catch (error) {
            result.errors.push(`Parse failed: ${error}`);
        }

        // NASA Rule 5: Output assertion
        console.assert(typeof result.success === 'boolean', 'success must be boolean');
        return result;
    }

    /**
     * Detect violations in AST
     * NASA Rule 4: <60 lines
     */
    private async detectViolations(ast: any, sourceLines: string[]): Promise<{ success: boolean; violations: any[]; errors: string[] }> {
        // NASA Rule 5: Input assertions
        console.assert(ast != null, 'ast cannot be null');
        console.assert(Array.isArray(sourceLines), 'sourceLines must be array');

        const result = { success: false, violations: [] as any[], errors: [] as string[] };

        try {
            // Run all detection methods
            const positionViolations = this.detector.detectPositionConnascence(ast, sourceLines);
            const meaningViolations = this.detector.detectMeaningConnascence(ast, sourceLines);
            const algorithmViolations = this.detector.detectAlgorithmConnascence(ast, sourceLines);

            result.violations = [
                ...positionViolations,
                ...meaningViolations,
                ...algorithmViolations
            ];

            result.success = true;

        } catch (error) {
            result.errors.push(`Detection failed: ${error}`);
        }

        // NASA Rule 5: Output assertion
        console.assert(typeof result.success === 'boolean', 'success must be boolean');
        return result;
    }
}