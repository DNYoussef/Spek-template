/**
 * Desktop Evidence Validator
 * 
 * Validates desktop automation evidence for authenticity and completeness
 * Integrates with theater detection and reality validation systems
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { DesktopEvidence, QualityViolation } from './desktop-quality-gates';

export interface EvidenceValidationConfig {
  strictMode: boolean;
  theaterDetectionThreshold: number;
  realityValidationEnabled: boolean;
  imageAnalysisEnabled: boolean;
  logParsingEnabled: boolean;
}

export interface EvidenceValidationResult {
  evidenceId: string;
  valid: boolean;
  confidence: number;
  theaterScore: number;
  violations: QualityViolation[];
  metadata: {
    fileSize: number;
    createdAt: number;
    lastModified: number;
    fileHash: string;
    imageAnalysis?: ImageAnalysisResult;
    logAnalysis?: LogAnalysisResult;
  };
  recommendations: string[];
}

export interface ImageAnalysisResult {
  resolution: { width: number; height: number };
  format: string;
  hasUI: boolean;
  hasText: boolean;
  estimatedAge: number;
  duplicateDetected: boolean;
  artificialDetected: boolean;
}

export interface LogAnalysisResult {
  operationCount: number;
  successRate: number;
  avgResponseTime: number;
  errorCount: number;
  suspiciousPatterns: string[];
  timelineConsistency: boolean;
}

export interface TheaterDetectionResult {
  score: number; // 0-100, higher = more authentic
  patterns: {
    fakeScreenshots: number;
    duplicateOperations: number;
    impossibleTimelines: number;
    artificialLogs: number;
  };
  confidence: number;
  recommendations: string[];
}

export class DesktopEvidenceValidator extends EventEmitter {
  private config: EvidenceValidationConfig;
  private validationCache: Map<string, EvidenceValidationResult> = new Map();
  private theaterPatterns: Map<string, number> = new Map();
  private artifactsPath: string;

  constructor(config: Partial<EvidenceValidationConfig> = {}) {
    super();
    
    this.config = {
      strictMode: true,
      theaterDetectionThreshold: 60, // Below 60 = likely theater
      realityValidationEnabled: true,
      imageAnalysisEnabled: true,
      logParsingEnabled: true,
      ...config
    };

    this.artifactsPath = path.join(process.cwd(), '.claude', '.artifacts', 'desktop');
    this.initializeTheaterPatterns();

    console.log('[DesktopEvidenceValidator] Initialized with theater detection');
  }

  /**
   * Validate a single piece of desktop evidence
   */
  async validateEvidence(evidence: DesktopEvidence): Promise<EvidenceValidationResult> {
    console.log(`[Evidence Validation] Validating: ${evidence.id} (${evidence.type})`);

    // Check cache first
    const cacheKey = `${evidence.id}-${evidence.metadata.lastModified || Date.now()}`;
    if (this.validationCache.has(cacheKey)) {
      console.log(`[Evidence Validation] Using cached result for ${evidence.id}`);
      return this.validationCache.get(cacheKey)!;
    }

    const result: EvidenceValidationResult = {
      evidenceId: evidence.id,
      valid: false,
      confidence: 0,
      theaterScore: 0,
      violations: [],
      metadata: {
        fileSize: 0,
        createdAt: evidence.timestamp,
        lastModified: evidence.timestamp,
        fileHash: ''
      },
      recommendations: []
    };

    try {
      // Basic file validation
      const fileStats = await this.validateFile(evidence.filePath);
      result.metadata = { ...result.metadata, ...fileStats };

      // Type-specific validation
      switch (evidence.type) {
        case 'screenshot':
          if (this.config.imageAnalysisEnabled) {
            result.metadata.imageAnalysis = await this.analyzeScreenshot(evidence.filePath);
          }
          break;
        case 'operation_log':
        case 'audit_trail':
        case 'error_log':
          if (this.config.logParsingEnabled) {
            result.metadata.logAnalysis = await this.analyzeLog(evidence.filePath);
          }
          break;
        case 'performance_metric':
          await this.validatePerformanceData(evidence.filePath, result);
          break;
      }

      // Theater detection
      if (this.config.realityValidationEnabled) {
        result.theaterScore = await this.detectTheater(evidence, result.metadata);
      }

      // Calculate overall validity and confidence
      const validationScores = await this.calculateValidationScores(evidence, result);
      result.valid = validationScores.valid;
      result.confidence = validationScores.confidence;

      // Generate recommendations
      result.recommendations = this.generateEvidenceRecommendations(result);

      // Cache result
      this.validationCache.set(cacheKey, result);

      console.log(`[Evidence Validation] ${evidence.id}: Valid=${result.valid}, Confidence=${result.confidence.toFixed(2)}, Theater=${result.theaterScore.toFixed(1)}`);
      return result;

    } catch (error) {
      console.error(`[Evidence Validation] Failed for ${evidence.id}:`, error);
      
      result.violations.push({
        type: 'operation_failure',
        severity: 'high',
        description: `Evidence validation failed: ${error.message}`,
        evidence,
        suggestedFix: 'Regenerate evidence with proper validation',
        autoFixable: false
      });

      return result;
    }
  }

  /**
   * Validate multiple evidence items and detect cross-evidence patterns
   */
  async validateEvidenceSet(evidenceSet: DesktopEvidence[]): Promise<{
    individualResults: EvidenceValidationResult[];
    crossValidation: {
      timelineConsistency: boolean;
      operationSequenceValid: boolean;
      duplicatesDetected: number;
      theaterPatterns: string[];
    };
    overallValid: boolean;
    confidence: number;
  }> {
    console.log(`[Evidence Set Validation] Validating ${evidenceSet.length} evidence items`);

    // Validate individual evidence
    const individualResults = await Promise.all(
      evidenceSet.map(evidence => this.validateEvidence(evidence))
    );

    // Cross-validation analysis
    const crossValidation = {
      timelineConsistency: this.validateTimeline(evidenceSet),
      operationSequenceValid: this.validateOperationSequence(evidenceSet),
      duplicatesDetected: this.detectDuplicates(evidenceSet),
      theaterPatterns: this.detectCrossEvidenceTheater(evidenceSet, individualResults)
    };

    // Calculate overall validity
    const validCount = individualResults.filter(r => r.valid).length;
    const overallValid = validCount >= evidenceSet.length * 0.8 && // 80% must be valid
                        crossValidation.timelineConsistency &&
                        crossValidation.operationSequenceValid &&
                        crossValidation.duplicatesDetected < evidenceSet.length * 0.2; // <20% duplicates

    // Calculate confidence
    const avgConfidence = individualResults.reduce((sum, r) => sum + r.confidence, 0) / individualResults.length;
    const crossValidationPenalty = [
      crossValidation.timelineConsistency ? 0 : 0.2,
      crossValidation.operationSequenceValid ? 0 : 0.2,
      crossValidation.duplicatesDetected > 0 ? 0.1 : 0
    ].reduce((sum, penalty) => sum + penalty, 0);

    const confidence = Math.max(0, avgConfidence - crossValidationPenalty);

    console.log(`[Evidence Set Validation] Overall Valid: ${overallValid}, Confidence: ${confidence.toFixed(2)}`);

    return {
      individualResults,
      crossValidation,
      overallValid,
      confidence
    };
  }

  /**
   * Detect performance theater in desktop automation evidence
   */
  async detectTheater(evidence: DesktopEvidence, metadata: any): Promise<number> {
    let theaterScore = 100; // Start with perfect score, deduct for theater indicators
    const patterns: string[] = [];

    try {
      // Check for common theater patterns
      
      // 1. File timestamp manipulation
      if (this.detectTimestampManipulation(evidence, metadata)) {
        theaterScore -= 20;
        patterns.push('timestamp_manipulation');
      }

      // 2. Duplicate or template content
      if (this.detectDuplicateContent(evidence)) {
        theaterScore -= 15;
        patterns.push('duplicate_content');
      }

      // 3. Impossible operation sequences
      if (evidence.type === 'operation_log' && this.detectImpossibleSequences(evidence)) {
        theaterScore -= 25;
        patterns.push('impossible_sequences');
      }

      // 4. Artificial screenshot indicators
      if (evidence.type === 'screenshot' && metadata.imageAnalysis) {
        if (metadata.imageAnalysis.artificialDetected) {
          theaterScore -= 30;
          patterns.push('artificial_screenshot');
        }
        if (metadata.imageAnalysis.duplicateDetected) {
          theaterScore -= 20;
          patterns.push('duplicate_screenshot');
        }
      }

      // 5. Inconsistent performance metrics
      if (evidence.type === 'performance_metric' && this.detectInconsistentMetrics(evidence)) {
        theaterScore -= 15;
        patterns.push('inconsistent_metrics');
      }

      // 6. Missing required metadata
      if (this.detectMissingCriticalMetadata(evidence)) {
        theaterScore -= 10;
        patterns.push('missing_metadata');
      }

      // Store pattern detection for learning
      patterns.forEach(pattern => {
        const currentCount = this.theaterPatterns.get(pattern) || 0;
        this.theaterPatterns.set(pattern, currentCount + 1);
      });

      theaterScore = Math.max(0, Math.min(100, theaterScore));
      
      if (patterns.length > 0) {
        console.log(`[Theater Detection] Evidence ${evidence.id} scored ${theaterScore}/100, patterns: ${patterns.join(', ')}`);
      }

      return theaterScore;

    } catch (error) {
      console.error(`[Theater Detection] Failed for ${evidence.id}:`, error);
      return 50; // Default moderate score on error
    }
  }

  /**
   * Generate comprehensive theater detection report
   */
  async generateTheaterReport(evidenceSet: DesktopEvidence[]): Promise<TheaterDetectionResult> {
    console.log(`[Theater Report] Analyzing ${evidenceSet.length} evidence items`);

    const patterns = {
      fakeScreenshots: 0,
      duplicateOperations: 0,
      impossibleTimelines: 0,
      artificialLogs: 0
    };

    let totalScore = 0;
    let validationCount = 0;

    for (const evidence of evidenceSet) {
      const result = await this.validateEvidence(evidence);
      totalScore += result.theaterScore;
      validationCount++;

      // Count specific patterns
      if (evidence.type === 'screenshot' && result.metadata.imageAnalysis?.artificialDetected) {
        patterns.fakeScreenshots++;
      }
      if (evidence.type === 'operation_log' && this.detectImpossibleSequences(evidence)) {
        patterns.impossibleTimelines++;
      }
      // Add more pattern detection...
    }

    const avgScore = validationCount > 0 ? totalScore / validationCount : 0;
    const confidence = this.calculateTheaterConfidence(patterns, evidenceSet.length);

    const recommendations = this.generateTheaterRecommendations(avgScore, patterns);

    console.log(`[Theater Report] Average authenticity score: ${avgScore.toFixed(1)}/100`);

    return {
      score: avgScore,
      patterns,
      confidence,
      recommendations
    };
  }

  // Private helper methods for validation
  private async validateFile(filePath: string): Promise<{
    fileSize: number;
    createdAt: number;
    lastModified: number;
    fileHash: string;
  }> {
    try {
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath);
      const hash = require('crypto').createHash('sha256').update(content).digest('hex');

      return {
        fileSize: stats.size,
        createdAt: stats.birthtime.getTime(),
        lastModified: stats.mtime.getTime(),
        fileHash: hash
      };
    } catch (error) {
      throw new Error(`File validation failed: ${error.message}`);
    }
  }

  private async analyzeScreenshot(filePath: string): Promise<ImageAnalysisResult> {
    // Mock implementation - in reality would use image processing libraries
    const stats = fs.statSync(filePath);

    return {
      resolution: { width: 1920, height: 1080 },
      format: path.extname(filePath).slice(1).toLowerCase(),
      hasUI: true,
      hasText: true,
      estimatedAge: Date.now() - stats.mtime.getTime(),
      duplicateDetected: false,
      artificialDetected: false
    };
  }

  private async analyzeLog(filePath: string): Promise<LogAnalysisResult> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      // Mock analysis - in reality would parse actual log format
      return {
        operationCount: lines.length,
        successRate: 0.9, // 90% success rate
        avgResponseTime: 1500, // 1.5 seconds
        errorCount: Math.floor(lines.length * 0.1),
        suspiciousPatterns: [],
        timelineConsistency: true
      };
    } catch (error) {
      throw new Error(`Log analysis failed: ${error.message}`);
    }
  }

  private async validatePerformanceData(filePath: string, result: EvidenceValidationResult): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);

      // Validate performance metrics structure
      if (!data.timestamp || !data.responseTime || !data.memoryUsage) {
        result.violations.push({
          type: 'performance_issue',
          severity: 'medium',
          description: 'Incomplete performance metrics data',
          evidence: {} as any,
          suggestedFix: 'Ensure all required metrics are captured',
          autoFixable: false
        });
      }
    } catch (error) {
      result.violations.push({
        type: 'performance_issue',
        severity: 'high',
        description: `Performance data validation failed: ${error.message}`,
        evidence: {} as any,
        suggestedFix: 'Fix performance data format and regenerate',
        autoFixable: false
      });
    }
  }

  private async calculateValidationScores(evidence: DesktopEvidence, result: EvidenceValidationResult): Promise<{
    valid: boolean;
    confidence: number;
  }> {
    let confidence = 1.0;

    // Reduce confidence based on violations
    const criticalViolations = result.violations.filter(v => v.severity === 'critical').length;
    const highViolations = result.violations.filter(v => v.severity === 'high').length;

    confidence -= criticalViolations * 0.3;
    confidence -= highViolations * 0.15;

    // Factor in theater score
    if (result.theaterScore < this.config.theaterDetectionThreshold) {
      confidence -= 0.2;
    }

    confidence = Math.max(0, Math.min(1, confidence));

    return {
      valid: confidence >= 0.7 && criticalViolations === 0,
      confidence
    };
  }

  // Theater detection helper methods
  private detectTimestampManipulation(evidence: DesktopEvidence, metadata: any): boolean {
    // Check if file timestamps seem manipulated
    const timeDiff = Math.abs(evidence.timestamp - metadata.lastModified);
    return timeDiff > 60000; // More than 1 minute difference is suspicious
  }

  private detectDuplicateContent(evidence: DesktopEvidence): boolean {
    // Mock implementation - would check against known content hashes
    return false;
  }

  private detectImpossibleSequences(evidence: DesktopEvidence): boolean {
    // Mock implementation - would analyze operation timing and sequences
    return false;
  }

  private detectInconsistentMetrics(evidence: DesktopEvidence): boolean {
    // Mock implementation - would analyze performance metric consistency
    return false;
  }

  private detectMissingCriticalMetadata(evidence: DesktopEvidence): boolean {
    // Check for required metadata fields
    const requiredFields = ['timestamp', 'filePath'];
    return requiredFields.some(field => !evidence[field]);
  }

  // Cross-validation methods
  private validateTimeline(evidenceSet: DesktopEvidence[]): boolean {
    if (evidenceSet.length < 2) return true;

    // Sort by timestamp and check for reasonable intervals
    const sorted = evidenceSet.sort((a, b) => a.timestamp - b.timestamp);

    for (let i = 1; i < sorted.length; i++) {
      const timeDiff = sorted[i].timestamp - sorted[i-1].timestamp;

      // Check for impossibly fast operations (less than 100ms)
      if (timeDiff < 100) {
        return false;
      }

      // Check for unreasonably long gaps (more than 1 hour)
      if (timeDiff > 3600000) {
        return false;
      }
    }

    return true;
  }

  private validateOperationSequence(evidenceSet: DesktopEvidence[]): boolean {
    // Mock implementation - would validate logical operation sequences
    return true;
  }

  private detectDuplicates(evidenceSet: DesktopEvidence[]): number {
    const seen = new Set<string>();
    let duplicates = 0;

    for (const evidence of evidenceSet) {
      const key = `${evidence.type}-${evidence.timestamp}`;
      if (seen.has(key)) {
        duplicates++;
      } else {
        seen.add(key);
      }
    }

    return duplicates;
  }

  private detectCrossEvidenceTheater(evidenceSet: DesktopEvidence[], results: EvidenceValidationResult[]): string[] {
    const patterns: string[] = [];

    // Check for coordinated fake evidence
    const lowScores = results.filter(r => r.theaterScore < 50);
    if (lowScores.length > evidenceSet.length * 0.5) {
      patterns.push('coordinated_fake_evidence');
    }

    // Check for template-based generation
    const timestamps = evidenceSet.map(e => e.timestamp);
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i-1]);
    }

    // If all intervals are very similar, might be template-generated
    if (intervals.length > 0) {
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const uniformIntervals = intervals.filter(interval => Math.abs(interval - avgInterval) < 1000).length;

      if (uniformIntervals > intervals.length * 0.8) {
        patterns.push('template_generated_evidence');
      }
    }

    return patterns;
  }

  // Recommendation generation
  private generateEvidenceRecommendations(result: EvidenceValidationResult): string[] {
    const recommendations: string[] = [];

    if (!result.valid) {
      recommendations.push('Regenerate evidence with proper validation');
    }

    if (result.theaterScore < this.config.theaterDetectionThreshold) {
      recommendations.push('Review evidence generation process for authenticity');
    }

    if (result.confidence < 0.7) {
      recommendations.push('Improve evidence quality and completeness');
    }

    result.violations.forEach(violation => {
      if (violation.autoFixable) {
        recommendations.push(`Auto-fix: ${violation.suggestedFix}`);
      } else {
        recommendations.push(`Manual fix: ${violation.suggestedFix}`);
      }
    });

    return [...new Set(recommendations)];
  }

  private calculateTheaterConfidence(patterns: any, evidenceCount: number): number {
    let confidence = 1.0;

    // Reduce confidence based on detected patterns
    const totalPatterns = Object.values(patterns).reduce((sum: number, count: any) => sum + count, 0);
    const patternRatio = totalPatterns / evidenceCount;

    confidence -= patternRatio * 0.5;

    return Math.max(0, Math.min(1, confidence));
  }

  private generateTheaterRecommendations(score: number, patterns: any): string[] {
    const recommendations: string[] = [];

    if (score < 60) {
      recommendations.push('Critical: Evidence authenticity is questionable - review generation process');
    } else if (score < 80) {
      recommendations.push('Warning: Some evidence quality issues detected');
    }

    if (patterns.fakeScreenshots > 0) {
      recommendations.push('Review screenshot generation for artificial content');
    }

    if (patterns.duplicateOperations > 0) {
      recommendations.push('Eliminate duplicate operations in evidence');
    }

    if (patterns.impossibleTimelines > 0) {
      recommendations.push('Fix timeline inconsistencies in operation logs');
    }

    if (patterns.artificialLogs > 0) {
      recommendations.push('Ensure operation logs are genuine and not fabricated');
    }

    return recommendations;
  }

  // Pattern learning initialization
  private initializeTheaterPatterns(): void {
    // Initialize common theater patterns for detection
    this.theaterPatterns.set('timestamp_manipulation', 0);
    this.theaterPatterns.set('duplicate_content', 0);
    this.theaterPatterns.set('impossible_sequences', 0);
    this.theaterPatterns.set('artificial_screenshot', 0);
    this.theaterPatterns.set('inconsistent_metrics', 0);
    this.theaterPatterns.set('missing_metadata', 0);

    console.log('[DesktopEvidenceValidator] Theater detection patterns initialized');
  }

  // Public interface methods
  getValidationCache(): Map<string, EvidenceValidationResult> {
    return new Map(this.validationCache);
  }

  getTheaterPatterns(): Map<string, number> {
    return new Map(this.theaterPatterns);
  }

  clearCache(): void {
    this.validationCache.clear();
    console.log('[DesktopEvidenceValidator] Validation cache cleared');
  }
}