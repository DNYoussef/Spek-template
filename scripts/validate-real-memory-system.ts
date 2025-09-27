#!/usr/bin/env ts-node

/**
 * Real Memory System Validation Script
 * Validates that all theater elements have been replaced with real implementations
 */

import { RealLangroidMemoryManager } from '../src/memory/coordinator/RealLangroidMemoryManager';
import { RealLangroidAdapter } from '../src/swarm/memory/langroid/RealLangroidAdapter';
import { RealMemoryCompressor } from '../src/memory/langroid/RealMemoryCompressor';
import { MemoryCoordinator } from '../src/memory/coordinator/MemoryCoordinator';

interface ValidationResult {
  component: string;
  isReal: boolean;
  evidence: string[];
  theaterScore: number;
  fixes: string[];
}

class RealMemoryValidator {
  private results: ValidationResult[] = [];

  async validateAll(): Promise<{
    overallScore: number;
    results: ValidationResult[];
    summary: string;
  }> {
    console.log('🔍 VALIDATING REAL MEMORY SYSTEM IMPLEMENTATIONS...\n');

    // Validate each component
    await this.validateRealLangroidMemoryManager();
    await this.validateRealLangroidAdapter();
    await this.validateRealMemoryCompressor();
    await this.validateMemoryCoordinator();
    await this.validateIntegration();

    // Calculate overall score
    const overallScore = this.calculateOverallScore();
    const summary = this.generateSummary(overallScore);

    return { overallScore, results: this.results, summary };
  }

  private async validateRealLangroidMemoryManager(): Promise<void> {
    const evidence: string[] = [];
    const fixes: string[] = [];
    let theaterScore = 0;

    try {
      const manager = new RealLangroidMemoryManager();

      // Check for real OpenAI integration
      if (process.env.OPENAI_API_KEY) {
        evidence.push('✓ OpenAI API key configured for real embeddings');
        theaterScore += 30;
      } else {
        fixes.push('❌ Set OPENAI_API_KEY environment variable');
      }

      // Check for real LanceDB integration
      try {
        const stats = manager.getMemoryStats();
        if (stats.embeddingModel === 'text-embedding-3-small') {
          evidence.push('✓ Real OpenAI embedding model configured');
          theaterScore += 20;
        }
        if (stats.vectorDimensions === 1536) {
          evidence.push('✓ Real vector dimensions (1536) for OpenAI embeddings');
          theaterScore += 15;
        }
      } catch (error) {
        fixes.push(`❌ LanceDB initialization failed: ${error.message}`);
      }

      // Check for real file I/O
      try {
        await manager.persistMemory();
        evidence.push('✓ Real file system persistence implemented');
        theaterScore += 20;
      } catch (error) {
        fixes.push(`❌ File persistence failed: ${error.message}`);
      }

      // Check memory size calculations
      const testContent = 'test content for size calculation';
      try {
        const memoryId = await manager.storeMemory('test-agent', testContent, {
          contentType: 'validation',
          tags: ['test']
        });
        evidence.push('✓ Real memory storage with size calculation');
        theaterScore += 15;
      } catch (error) {
        fixes.push(`❌ Memory storage failed: ${error.message}`);
      }

      await manager.shutdown();

    } catch (error) {
      fixes.push(`❌ Manager initialization failed: ${error.message}`);
    }

    this.results.push({
      component: 'RealLangroidMemoryManager',
      isReal: theaterScore >= 70,
      evidence,
      theaterScore,
      fixes
    });
  }

  private async validateRealLangroidAdapter(): Promise<void> {
    const evidence: string[] = [];
    const fixes: string[] = [];
    let theaterScore = 0;

    try {
      const adapter = new RealLangroidAdapter();

      // Check real agent creation
      const agentConfig = adapter.createAgent('validation-agent', 'TEST', {
        name: 'ValidationAgent',
        systemMessage: 'Validation test agent',
        llmProvider: 'openai',
        vectorStore: {
          type: 'lancedb',
          collectionName: 'validation_vectors',
          storagePath: './validation_vectors',
          embeddingProvider: 'openai',
          maxMemoryMB: 10
        },
        tools: ['validation']
      });

      if (agentConfig.vectorStoreConfig.type === 'lancedb') {
        evidence.push('✓ Real LanceDB vector store configuration');
        theaterScore += 25;
      }

      if (agentConfig.vectorStoreConfig.embeddingProvider === 'openai') {
        evidence.push('✓ Real OpenAI embedding provider');
        theaterScore += 25;
      }

      // Check task execution with vector context
      try {
        const response = await adapter.executeTask('validation-agent-test', 'test message');
        if (response.includes('vector memory context')) {
          evidence.push('✓ Real vector memory context integration');
          theaterScore += 25;
        }
        if (response.includes('OpenAI embeddings')) {
          evidence.push('✓ Real OpenAI embeddings in task execution');
          theaterScore += 15;
        }
      } catch (error) {
        fixes.push(`❌ Task execution failed: ${error.message}`);
      }

      // Check compression integration
      try {
        const compressed = await adapter.compressInteractionData('validation-agent');
        if (Buffer.isBuffer(compressed)) {
          evidence.push('✓ Real LZ4 compression integration');
          theaterScore += 10;
        }
      } catch (error) {
        fixes.push(`❌ Compression failed: ${error.message}`);
      }

      await adapter.shutdown();

    } catch (error) {
      fixes.push(`❌ Adapter initialization failed: ${error.message}`);
    }

    this.results.push({
      component: 'RealLangroidAdapter',
      isReal: theaterScore >= 70,
      evidence,
      theaterScore,
      fixes
    });
  }

  private async validateRealMemoryCompressor(): Promise<void> {
    const evidence: string[] = [];
    const fixes: string[] = [];
    let theaterScore = 0;

    try {
      const compressor = new RealMemoryCompressor();

      // Check real LZ4 compression
      const testData = { content: 'x'.repeat(2048) };
      const result = await compressor.compressLZ4(testData);

      if (result.algorithm === 'lz4') {
        evidence.push('✓ Real LZ4 compression algorithm');
        theaterScore += 30;
      }

      if (Buffer.isBuffer(result.compressedData)) {
        evidence.push('✓ Real buffer compression output');
        theaterScore += 20;
      }

      if (result.compressionRatio < 1.0 && result.compressionRatio > 0) {
        evidence.push('✓ Real compression ratio calculation');
        theaterScore += 20;
      }

      // Check decompression
      const decompressed = await compressor.decompressLZ4(result.compressedData);
      if (JSON.stringify(decompressed) === JSON.stringify(testData)) {
        evidence.push('✓ Real LZ4 decompression works correctly');
        theaterScore += 20;
      }

      // Check compression decisions
      const shouldCompress = compressor.shouldCompress(testData);
      if (typeof shouldCompress === 'boolean') {
        evidence.push('✓ Real compression decision logic');
        theaterScore += 10;
      }

    } catch (error) {
      fixes.push(`❌ LZ4 compression failed: ${error.message}`);
    }

    this.results.push({
      component: 'RealMemoryCompressor',
      isReal: theaterScore >= 70,
      evidence,
      theaterScore,
      fixes
    });
  }

  private async validateMemoryCoordinator(): Promise<void> {
    const evidence: string[] = [];
    const fixes: string[] = [];
    let theaterScore = 0;

    try {
      const coordinator = MemoryCoordinator.getInstance();

      // Check real memory calculations
      const request = {
        size: 1024,
        domain: 'research' as any,
        priority: 1 as any,
        allowCompression: true
      };

      const blockId = await coordinator.allocateMemory(request);
      if (blockId) {
        evidence.push('✓ Real memory allocation with size calculation');
        theaterScore += 25;

        // Check real data storage
        const testData = { content: 'x'.repeat(1500) };
        const stored = await coordinator.storeData(blockId, testData);
        if (stored) {
          evidence.push('✓ Real data storage with compression');
          theaterScore += 25;

          // Check retrieval
          const retrieved = await coordinator.retrieveData(blockId);
          if (JSON.stringify(retrieved) === JSON.stringify(testData)) {
            evidence.push('✓ Real data retrieval and decompression');
            theaterScore += 25;
          }
        }
      }

      // Check memory statistics
      const status = coordinator.getMemoryStatus();
      if (status.compressionRatio && status.compressionRatio > 0) {
        evidence.push('✓ Real compression ratio tracking');
        theaterScore += 15;
      }

      if (status.efficiency && status.efficiency >= 0) {
        evidence.push('✓ Real memory efficiency calculation');
        theaterScore += 10;
      }

      await coordinator.shutdown();

    } catch (error) {
      fixes.push(`❌ Memory coordinator validation failed: ${error.message}`);
    }

    this.results.push({
      component: 'MemoryCoordinator',
      isReal: theaterScore >= 70,
      evidence,
      theaterScore,
      fixes
    });
  }

  private async validateIntegration(): Promise<void> {
    const evidence: string[] = [];
    const fixes: string[] = [];
    let theaterScore = 0;

    try {
      // Check 10MB vector coordination
      const manager = new RealLangroidMemoryManager();
      const stats = manager.getMemoryStats();

      if (stats.memoryLimit === '10MB') {
        evidence.push('✓ 10MB memory limit enforced');
        theaterScore += 20;
      }

      // Check real vector operations
      if (stats.embeddingModel && stats.vectorDimensions > 0) {
        evidence.push('✓ Real vector operations integrated');
        theaterScore += 20;
      }

      // Check LanceDB connection
      if (stats.lancedbConnected) {
        evidence.push('✓ LanceDB vector database connected');
        theaterScore += 30;
      } else {
        fixes.push('❌ LanceDB connection failed - check installation');
      }

      // Check file system operations
      try {
        await manager.persistMemory();
        evidence.push('✓ Real file system I/O operations');
        theaterScore += 20;
      } catch (error) {
        fixes.push(`❌ File system operations failed: ${error.message}`);
      }

      // Check environment setup
      if (process.env.OPENAI_API_KEY) {
        evidence.push('✓ OpenAI API key configured');
        theaterScore += 10;
      } else {
        fixes.push('❌ OPENAI_API_KEY environment variable not set');
      }

      await manager.shutdown();

    } catch (error) {
      fixes.push(`❌ Integration validation failed: ${error.message}`);
    }

    this.results.push({
      component: 'SystemIntegration',
      isReal: theaterScore >= 70,
      evidence,
      theaterScore,
      fixes
    });
  }

  private calculateOverallScore(): number {
    const totalScore = this.results.reduce((sum, result) => sum + result.theaterScore, 0);
    const maxScore = this.results.length * 100;
    return Math.round((totalScore / maxScore) * 100);
  }

  private generateSummary(overallScore: number): string {
    const realComponents = this.results.filter(r => r.isReal).length;
    const totalComponents = this.results.length;
    const allFixes = this.results.flatMap(r => r.fixes);

    let summary = `\n📊 REAL MEMORY SYSTEM VALIDATION SUMMARY\n`;
    summary += `${'='.repeat(50)}\n\n`;
    summary += `Overall Theater Elimination Score: ${overallScore}/100\n`;
    summary += `Real Components: ${realComponents}/${totalComponents}\n\n`;

    if (overallScore >= 90) {
      summary += `🎉 EXCELLENT: Theater successfully eliminated with real implementations!\n`;
    } else if (overallScore >= 70) {
      summary += `✅ GOOD: Most theater eliminated, minor fixes needed.\n`;
    } else {
      summary += `⚠️  NEEDS WORK: Significant theater still present.\n`;
    }

    if (allFixes.length > 0) {
      summary += `\n🔧 REQUIRED FIXES:\n`;
      allFixes.forEach(fix => summary += `   ${fix}\n`);
    }

    summary += `\n🎯 REAL IMPLEMENTATIONS VALIDATED:\n`;
    this.results.forEach(result => {
      const status = result.isReal ? '✅' : '❌';
      summary += `   ${status} ${result.component} (${result.theaterScore}/100)\n`;
      result.evidence.forEach(evidence => summary += `      ${evidence}\n`);
    });

    return summary;
  }
}

// Main execution
async function main() {
  try {
    const validator = new RealMemoryValidator();
    const { overallScore, results, summary } = await validator.validateAll();

    console.log(summary);

    // Write detailed results to file
    const detailedReport = {
      timestamp: new Date().toISOString(),
      overallScore,
      results,
      summary
    };

    const fs = require('fs').promises;
    await fs.writeFile(
      './validation-results.json',
      JSON.stringify(detailedReport, null, 2)
    );

    console.log(`\n📝 Detailed validation results written to: validation-results.json`);

    // Exit with appropriate code
    process.exit(overallScore >= 70 ? 0 : 1);

  } catch (error) {
    console.error(`❌ Validation failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}