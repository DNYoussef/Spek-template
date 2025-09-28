/**
 * RequirementsAnalyzer - Analyzes project requirements
 * NASA Rule 10 compliant (≤50 lines per function)
 */

import { DevelopmentContext } from '../DevelopmentPrincessFSM';

export class RequirementsAnalyzer {

  /**
   * Analyze project requirements
   */
  async analyze(context: DevelopmentContext): Promise<void> {
    try {
      const projectPath = context.metadata?.projectPath || process.cwd();
      const projectAnalysis = await this.analyzeProjectStructure(projectPath);
      const dependencyAnalysis = await this.analyzeDependencies(projectPath);
      const complexity = this.calculateComplexity(projectAnalysis, dependencyAnalysis);

      context.requirements = {
        analyzed: true,
        complexity,
        dependencies: dependencyAnalysis.dependencies,
        projectSize: projectAnalysis.fileCount,
        linesOfCode: projectAnalysis.totalLines,
        technologies: dependencyAnalysis.technologies,
        analysisDate: new Date().toISOString(),
        recommendations: projectAnalysis.recommendations
      };
    } catch (error) {
      context.requirements = {
        analyzed: false,
        complexity: 'unknown',
        dependencies: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Analyze project structure
   */
  private async analyzeProjectStructure(projectPath: string): Promise<{
    fileCount: number;
    totalLines: number;
    recommendations: string[];
  }> {
    const { glob } = await import('glob');
    const fs = await import('fs/promises');

    const analysis = {
      fileCount: 0,
      totalLines: 0,
      recommendations: [] as string[]
    };

    try {
      const sourceFiles = await glob('**/*.{js,ts,jsx,tsx,py,java,cpp,c,h}', {
        cwd: projectPath,
        ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**']
      });

      analysis.fileCount = sourceFiles.length;

      // Analyze sample of files for performance
      for (const file of sourceFiles.slice(0, 50)) {
        try {
          const content = await fs.readFile(require('path').join(projectPath, file), 'utf-8');
          analysis.totalLines += content.split('\n').length;
        } catch (error) {
          // Continue with other files
        }
      }

      // Generate recommendations
      if (analysis.fileCount > 1000) {
        analysis.recommendations.push('Large project detected - consider modular architecture');
      }
      if (analysis.totalLines > 50000) {
        analysis.recommendations.push('High LOC count - implement comprehensive testing strategy');
      }
    } catch (error) {
      // Return empty analysis on error
    }

    return analysis;
  }

  /**
   * Analyze project dependencies
   */
  private async analyzeDependencies(projectPath: string): Promise<{
    dependencies: string[];
    technologies: string[];
  }> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const analysis = {
      dependencies: [] as string[],
      technologies: [] as string[]
    };

    try {
      // Check for package.json (Node.js)
      try {
        const packageJson = JSON.parse(
          await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8')
        );

        const deps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        };

        analysis.dependencies.push(...Object.keys(deps));
        analysis.technologies.push('Node.js');

        // Detect frameworks
        if (deps.react) analysis.technologies.push('React');
        if (deps.vue) analysis.technologies.push('Vue.js');
        if (deps.angular) analysis.technologies.push('Angular');
      } catch (error) {
        // No package.json found
      }

      // Check for Python requirements
      try {
        const requirements = await fs.readFile(path.join(projectPath, 'requirements.txt'), 'utf-8');
        const pythonDeps = requirements.split('\n')
          .filter(line => line.trim())
          .map(line => line.split('==')[0].trim());

        analysis.dependencies.push(...pythonDeps);
        analysis.technologies.push('Python');
      } catch (error) {
        // No requirements.txt found
      }
    } catch (error) {
      // Return empty analysis on error
    }

    return analysis;
  }

  /**
   * Calculate project complexity
   */
  private calculateComplexity(
    projectAnalysis: { fileCount: number; totalLines: number },
    dependencyAnalysis: { dependencies: string[]; technologies: string[] }
  ): 'low' | 'medium' | 'high' {
    let complexityScore = 0;

    // File count factor
    if (projectAnalysis.fileCount > 100) complexityScore += 2;
    else if (projectAnalysis.fileCount > 50) complexityScore += 1;

    // Lines of code factor
    if (projectAnalysis.totalLines > 10000) complexityScore += 2;
    else if (projectAnalysis.totalLines > 5000) complexityScore += 1;

    // Technology diversity factor
    if (dependencyAnalysis.technologies.length > 3) complexityScore += 2;
    else if (dependencyAnalysis.technologies.length > 1) complexityScore += 1;

    // Dependency count factor
    if (dependencyAnalysis.dependencies.length > 50) complexityScore += 2;
    else if (dependencyAnalysis.dependencies.length > 20) complexityScore += 1;

    // Determine complexity level
    if (complexityScore >= 6) return 'high';
    if (complexityScore >= 3) return 'medium';
    return 'low';
  }
}