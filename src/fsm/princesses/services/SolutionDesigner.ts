/**
 * SolutionDesigner - Designs architectural solutions
 * NASA Rule 10 compliant (≤50 lines per function)
 */

import { DevelopmentContext } from '../DevelopmentPrincessFSM';

export class SolutionDesigner {

  /**
   * Design solution architecture
   */
  async design(context: DevelopmentContext): Promise<void> {
    try {
      const projectPath = context.metadata?.projectPath || process.cwd();
      const architectureAnalysis = await this.analyzeExistingArchitecture(projectPath);
      const recommendedArchitecture = this.recommendArchitecture(context.requirements);
      const designPatterns = await this.identifyDesignPatterns(projectPath);

      context.design = {
        approved: recommendedArchitecture.feasible,
        architecture: recommendedArchitecture.type,
        patterns: designPatterns,
        currentArchitecture: architectureAnalysis.detectedArchitecture,
        recommendations: recommendedArchitecture.recommendations,
        designScore: architectureAnalysis.designScore,
        modularityIndex: architectureAnalysis.modularityIndex,
        lastAnalysis: new Date().toISOString()
      };
    } catch (error) {
      context.design = {
        approved: false,
        architecture: 'unknown',
        patterns: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Analyze existing architecture
   */
  private async analyzeExistingArchitecture(projectPath: string): Promise<{
    detectedArchitecture: string;
    designScore: number;
    modularityIndex: number;
  }> {
    const { glob } = await import('glob');

    const analysis = {
      detectedArchitecture: 'monolithic',
      designScore: 50,
      modularityIndex: 10
    };

    try {
      const sourceFiles = await glob('**/*.{js,ts,jsx,tsx}', {
        cwd: projectPath,
        ignore: ['node_modules/**', 'dist/**', 'build/**']
      });

      // Simple architecture detection based on directory patterns
      const directories = new Set<string>();
      sourceFiles.forEach(file => {
        directories.add(require('path').dirname(file));
      });

      const dirList = Array.from(directories);

      if (dirList.some(dir => dir.includes('services'))) {
        analysis.detectedArchitecture = 'microservices';
      } else if (dirList.some(dir => dir.includes('components'))) {
        analysis.detectedArchitecture = 'component-based';
      }

      analysis.modularityIndex = Math.min(100, Math.round((directories.size / sourceFiles.length) * 100));
      analysis.designScore = Math.min(100, 50 + (analysis.modularityIndex / 2));
    } catch (error) {
      // Use defaults on error
    }

    return analysis;
  }

  /**
   * Recommend architecture based on requirements
   */
  private recommendArchitecture(requirements: DevelopmentContext['requirements']): {
    type: string;
    feasible: boolean;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let recommendedType = 'monolithic';
    let feasible = true;

    if (!requirements) {
      return {
        type: 'unknown',
        feasible: false,
        recommendations: ['Requirements analysis needed before architectural recommendations']
      };
    }

    // Recommend based on complexity
    switch (requirements.complexity) {
      case 'high':
        recommendedType = 'microservices';
        recommendations.push('High complexity project - microservices architecture recommended');
        break;
      case 'medium':
        recommendedType = 'component-based';
        recommendations.push('Moderate complexity - component-based architecture suitable');
        break;
      case 'low':
        recommendedType = 'mvc';
        recommendations.push('Simple project - MVC pattern sufficient');
        break;
    }

    return {
      type: recommendedType,
      feasible,
      recommendations
    };
  }

  /**
   * Identify design patterns in codebase
   */
  private async identifyDesignPatterns(projectPath: string): Promise<string[]> {
    const { glob } = await import('glob');
    const fs = await import('fs/promises');

    const patterns: string[] = [];
    const patternKeywords = {
      'repository': ['repository', 'Repository'],
      'factory': ['factory', 'Factory'],
      'observer': ['observer', 'Observable'],
      'singleton': ['singleton', 'Singleton'],
      'mvc': ['controller', 'Controller', 'model', 'Model']
    };

    try {
      const sourceFiles = await glob('**/*.{js,ts,jsx,tsx}', {
        cwd: projectPath,
        ignore: ['node_modules/**', 'dist/**', 'build/**']
      });

      // Analyze sample of files for patterns
      for (const file of sourceFiles.slice(0, 10)) {
        try {
          const content = await fs.readFile(require('path').join(projectPath, file), 'utf-8');

          for (const [pattern, keywords] of Object.entries(patternKeywords)) {
            if (keywords.some(keyword => content.includes(keyword))) {
              if (!patterns.includes(pattern)) {
                patterns.push(pattern);
              }
            }
          }
        } catch (error) {
          // Continue with other files
        }
      }
    } catch (error) {
      // Return empty patterns on error
    }

    return patterns;
  }
}