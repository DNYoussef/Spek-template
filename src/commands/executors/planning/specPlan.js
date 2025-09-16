/**
 * Spec to Plan Converter Executor
 * Converts SPEC.md files into structured plan.json
 */

const fs = require('fs').promises;
const path = require('path');

class SpecPlanExecutor {
  async execute(args, context) {
    const {
      spec = 'SPEC.md',
      output = 'plan.json',
      format = 'json'
    } = args;

    console.log(`[SpecPlan] Converting ${spec} to ${output}`);

    try {
      // Read specification file
      const specContent = await this.readSpecFile(spec);

      // Parse specification into structured plan
      const plan = this.parseSpecification(specContent);

      // Enhance plan with SPEK methodology
      const enhancedPlan = this.enhanceSPEKPlan(plan);

      // Save plan in requested format
      await this.savePlan(enhancedPlan, output, format);

      return {
        success: true,
        input: spec,
        output,
        plan: enhancedPlan,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Spec to plan conversion failed: ${error.message}`);
    }
  }

  async readSpecFile(specPath) {
    try {
      const content = await fs.readFile(specPath, 'utf8');
      return content;
    } catch (error) {
      throw new Error(`Cannot read spec file: ${error.message}`);
    }
  }

  parseSpecification(content) {
    const lines = content.split('\n');
    const plan = {
      title: '',
      description: '',
      requirements: [],
      userStories: [],
      technicalRequirements: [],
      constraints: [],
      milestones: [],
      risks: []
    };

    let currentSection = '';
    let currentItem = null;

    for (const line of lines) {
      // Parse title
      if (line.startsWith('# ')) {
        plan.title = line.substring(2).trim();
        continue;
      }

      // Parse section headers
      if (line.startsWith('## ')) {
        currentSection = line.substring(3).trim().toLowerCase();
        continue;
      }

      // Parse list items
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const item = line.substring(2).trim();

        switch (currentSection) {
          case 'requirements':
          case 'functional requirements':
            plan.requirements.push(item);
            break;
          case 'user stories':
            plan.userStories.push(this.parseUserStory(item));
            break;
          case 'technical requirements':
          case 'non-functional requirements':
            plan.technicalRequirements.push(item);
            break;
          case 'constraints':
            plan.constraints.push(item);
            break;
          case 'milestones':
            plan.milestones.push(this.parseMilestone(item));
            break;
          case 'risks':
            plan.risks.push(item);
            break;
        }
      }

      // Capture description (first paragraph after title)
      if (!plan.description && !line.startsWith('#') && line.trim() && !currentSection) {
        plan.description += line + ' ';
      }
    }

    plan.description = plan.description.trim();
    return plan;
  }

  parseUserStory(story) {
    // Parse "As a... I want... So that..." format
    const asMatch = story.match(/As a (.+?),? I want/i);
    const wantMatch = story.match(/I want (.+?)(?:,? so that|$)/i);
    const soMatch = story.match(/so that (.+)/i);

    return {
      raw: story,
      role: asMatch ? asMatch[1] : null,
      feature: wantMatch ? wantMatch[1] : story,
      benefit: soMatch ? soMatch[1] : null
    };
  }

  parseMilestone(milestone) {
    // Parse milestone with optional date
    const dateMatch = milestone.match(/\((.+?)\)/);
    const title = milestone.replace(/\(.+?\)/, '').trim();

    return {
      title,
      date: dateMatch ? dateMatch[1] : null,
      status: 'pending'
    };
  }

  enhanceSPEKPlan(plan) {
    // Add SPEK methodology phases
    const spekPhases = {
      specification: {
        status: 'defined',
        items: plan.requirements,
        completeness: plan.requirements.length > 0 ? 0.8 : 0
      },
      research: {
        status: 'pending',
        tasks: [
          'Research existing solutions',
          'Analyze technical feasibility',
          'Investigate integration points'
        ]
      },
      planning: {
        status: 'pending',
        tasks: this.generatePlanningTasks(plan)
      },
      execution: {
        status: 'pending',
        tasks: this.generateExecutionTasks(plan)
      },
      knowledge: {
        status: 'pending',
        tasks: [
          'Document implementation',
          'Create test suites',
          'Establish monitoring'
        ]
      }
    };

    return {
      ...plan,
      methodology: 'SPEK',
      phases: spekPhases,
      estimatedEffort: this.estimateEffort(plan),
      priority: this.calculatePriority(plan),
      generated: new Date().toISOString()
    };
  }

  generatePlanningTasks(plan) {
    const tasks = [];

    if (plan.requirements.length > 0) {
      tasks.push(`Define architecture for ${plan.requirements.length} requirements`);
    }

    if (plan.userStories.length > 0) {
      tasks.push(`Create user journey maps for ${plan.userStories.length} stories`);
    }

    if (plan.technicalRequirements.length > 0) {
      tasks.push('Design technical architecture');
      tasks.push('Select technology stack');
    }

    if (plan.risks.length > 0) {
      tasks.push('Develop risk mitigation strategies');
    }

    return tasks;
  }

  generateExecutionTasks(plan) {
    const tasks = [];

    // Generate tasks based on requirements
    plan.requirements.forEach((req, index) => {
      tasks.push(`Implement requirement ${index + 1}: ${req.substring(0, 50)}...`);
    });

    // Add testing tasks
    if (plan.requirements.length > 0) {
      tasks.push('Write unit tests');
      tasks.push('Perform integration testing');
    }

    return tasks;
  }

  estimateEffort(plan) {
    // Simple effort estimation based on complexity
    const complexity = {
      requirements: plan.requirements.length * 2,
      userStories: plan.userStories.length * 3,
      technical: plan.technicalRequirements.length * 4,
      risks: plan.risks.length * 1
    };

    const totalHours = Object.values(complexity).reduce((a, b) => a + b, 0);

    return {
      hours: totalHours,
      days: Math.ceil(totalHours / 8),
      complexity: totalHours > 40 ? 'high' : totalHours > 16 ? 'medium' : 'low'
    };
  }

  calculatePriority(plan) {
    // Calculate priority based on various factors
    let score = 0;

    score += plan.requirements.length * 2;
    score += plan.userStories.length * 3;
    score += plan.risks.length * 5;

    if (plan.constraints.length > 3) score += 10;
    if (plan.milestones.length > 0) score += 5;

    return score > 30 ? 'high' : score > 15 ? 'medium' : 'low';
  }

  async savePlan(plan, outputPath, format) {
    let content;

    if (format === 'json') {
      content = JSON.stringify(plan, null, 2);
    } else if (format === 'yaml') {
      // Simple YAML conversion (use js-yaml in production)
      content = this.toSimpleYAML(plan);
    } else if (format === 'markdown') {
      content = this.toMarkdown(plan);
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    await fs.writeFile(outputPath, content, 'utf8');
  }

  toSimpleYAML(obj, indent = 0) {
    let yaml = '';
    const spaces = '  '.repeat(indent);

    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n`;
            yaml += this.toSimpleYAML(item, indent + 2);
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        yaml += `${spaces}${key}:\n`;
        yaml += this.toSimpleYAML(value, indent + 1);
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }

    return yaml;
  }

  toMarkdown(plan) {
    let md = `# ${plan.title}\n\n`;
    md += `${plan.description}\n\n`;

    md += `## Requirements\n\n`;
    plan.requirements.forEach(req => {
      md += `- ${req}\n`;
    });

    if (plan.userStories.length > 0) {
      md += `\n## User Stories\n\n`;
      plan.userStories.forEach(story => {
        md += `- ${story.raw}\n`;
      });
    }

    md += `\n## SPEK Phases\n\n`;
    for (const [phase, details] of Object.entries(plan.phases)) {
      md += `### ${phase.charAt(0).toUpperCase() + phase.slice(1)}\n`;
      md += `Status: ${details.status}\n\n`;
      if (details.tasks) {
        details.tasks.forEach(task => {
          md += `- ${task}\n`;
        });
      }
      md += '\n';
    }

    return md;
  }
}

module.exports = new SpecPlanExecutor();