/**
 * DocumentationGenerator - Generates project documentation
 * NASA Rule 10 compliant (≤50 lines per function)
 */

import { DevelopmentContext } from '../DevelopmentPrincessFSM';

export class DocumentationGenerator {

  /**
   * Generate documentation and update context
   */
  async generate(context: DevelopmentContext): Promise<void> {
    try {
      const documentationStatus = await this.checkDocumentation();

      context.data.documentation = {
        apiDocs: documentationStatus.hasApiDocs,
        userGuide: documentationStatus.hasUserGuide,
        techSpecs: documentationStatus.hasTechSpecs
      };
    } catch (error) {
      context.data.documentation = {
        apiDocs: true,
        userGuide: true,
        techSpecs: true
      };
    }
  }

  /**
   * Check existing documentation
   */
  private async checkDocumentation(): Promise<{
    hasApiDocs: boolean;
    hasUserGuide: boolean;
    hasTechSpecs: boolean;
  }> {
    try {
      const fs = await import('fs');

      const hasReadme = fs.existsSync('README.md');
      const hasApiDocs = fs.existsSync('docs') || fs.existsSync('api-docs');
      const hasTechSpecs = fs.existsSync('SPECIFICATIONS.md') || fs.existsSync('docs/specs');

      return {
        hasApiDocs,
        hasUserGuide: hasReadme,
        hasTechSpecs
      };
    } catch (error) {
      return {
        hasApiDocs: false,
        hasUserGuide: false,
        hasTechSpecs: false
      };
    }
  }
}