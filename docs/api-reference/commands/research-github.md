# /research:github

## Purpose
Analyze GitHub repositories to identify high-quality open source solutions, assess their suitability, and determine exactly which parts are needed instead of downloading entire repositories. Provides quality scoring, architecture analysis, and specific component extraction guidance.

## Usage
/research:github '<repository_search_terms>' [quality_threshold=0.7] [focus=code|docs|community|all]

## Implementation

### 1. Repository Discovery and Quality Assessment

#### Repository Search Strategy:
```javascript
const GITHUB_SEARCH_STRATEGY = {
  search_criteria: {
    keywords: extractKeywords(searchTerms),
    language_filters: detectLanguageContext(projectContext),
    size_constraints: {
      min_stars: 50,
      min_contributors: 3,
      max_age_months: 36
    },
    activity_requirements: {
      recent_commits: 30,        // days since last commit
      issue_activity: 90,        // days since last issue activity
      release_frequency: 180     // days since last release
    }
  },
  
  quality_signals: [
    'github_stars',
    'fork_ratio',
    'contributor_diversity',
    'commit_frequency',
    'issue_resolution_time',
    'documentation_completeness',
    'test_coverage',
    'security_practices',
    'license_clarity',
    'architectural_quality'
  ],
  
  search_scopes: [
    'repositories',
    'awesome_lists',
    'topics',
    'organizations',
    'trending_repos'
  ]
};
```

#### Repository Health Analysis:
```javascript
function analyzeRepositoryHealth(repoData) {
  const healthMetrics = {
    community_health: {
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      watchers: repoData.subscribers_count,
      contributors: getContributorCount(repoData),
      star_to_fork_ratio: calculateStarForkRatio(repoData),
      community_score: calculateCommunityScore(repoData)
    },
    
    development_activity: {
      last_commit: getLastCommitDate(repoData),
      commit_frequency: getCommitFrequency(repoData, 180), // last 6 months
      contributor_activity: getContributorActivity(repoData),
      release_cadence: getReleaseCadence(repoData),
      branch_strategy: analyzeBranchStrategy(repoData),
      activity_score: calculateActivityScore(repoData)
    },
    
    code_quality: {
      test_coverage: extractTestCoverage(repoData),
      ci_cd_setup: checkCICDConfiguration(repoData),
      code_analysis: runCodeAnalysis(repoData),
      security_scanning: checkSecurityPractices(repoData),
      dependency_health: analyzeDependencies(repoData),
      quality_score: calculateCodeQualityScore(repoData)
    },
    
    documentation: {
      readme_quality: assessReadmeQuality(repoData),
      api_documentation: checkAPIDocumentation(repoData),
      examples_provided: checkExamples(repoData),
      installation_guide: checkInstallationGuide(repoData),
      contributing_guide: checkContributingGuide(repoData),
      documentation_score: calculateDocumentationScore(repoData)
    }
  };
  
  return {
    overall_score: calculateOverallScore(healthMetrics),
    health_metrics: healthMetrics,
    recommendations: generateRecommendations(healthMetrics),
    risk_assessment: assessRisks(healthMetrics)
  };
}
```

### 2. Architecture and Component Analysis

#### Repository Structure Analysis:
```javascript
function analyzeRepositoryStructure(repoUrl) {
  const analysis = {
    architecture_pattern: identifyArchitecturePattern(repoStructure),
    component_breakdown: analyzeComponents(repoStructure),
    dependency_graph: buildDependencyGraph(repoStructure),
    modular_components: identifyReusableComponents(repoStructure),
    integration_points: findIntegrationPoints(repoStructure),
    extraction_candidates: identifyExtractionCandidates(repoStructure)
  };
  
  return analysis;
}

const COMPONENT_EXTRACTION_ANALYSIS = {
  extraction_strategies: {
    standalone_modules: {
      criteria: [
        'minimal_external_dependencies',
        'clear_interface_boundaries',
        'self_contained_functionality',
        'comprehensive_tests'
      ],
      extraction_complexity: 'low'
    },
    
    coupled_components: {
      criteria: [
        'shared_data_structures',
        'cross_component_dependencies',
        'integrated_configuration',
        'shared_utilities'
      ],
      extraction_complexity: 'medium',
      refactoring_required: true
    },
    
    core_architecture: {
      criteria: [
        'fundamental_to_system_design',
        'extensive_cross_cutting_concerns',
        'complex_state_management',
        'deep_framework_integration'
      ],
      extraction_complexity: 'high',
      recommendation: 'full_repository_adoption'
    }
  }
};
```

### 3. MCP Tool Integration for Deep Analysis

#### GitHub Analysis Pipeline:
```javascript
const MCP_GITHUB_PIPELINE = {
  repository_discovery: {
    tool: 'WebSearch',
    purpose: 'Find relevant repositories beyond basic GitHub search',
    parameters: {
      queries: [
        `"${searchTerms}" site:github.com`,
        `"${searchTerms}" "awesome list" site:github.com`,
        `"${searchTerms}" "curated" site:github.com`
      ],
      time_filter: 'recent_year'
    }
  },
  
  content_analysis: {
    tool: 'Firecrawl',
    purpose: 'Extract repository content for detailed analysis',
    parameters: {
      urls: repositoryUrls,
      extract_format: 'structured',
      include_code: true,
      include_readme: true,
      include_docs: true
    }
  },
  
  large_context_analysis: {
    tool: 'Gemini',
    purpose: 'Analyze entire repository for component extraction',
    parameters: {
      content: repositoryContent,
      analysis_type: 'component_extraction',
      output_format: 'structured_recommendations'
    }
  },
  
  systematic_thinking: {
    tool: 'Sequential Thinking',
    purpose: 'Structured analysis of repository suitability',
    parameters: {
      analysis_framework: 'repository_evaluation',
      criteria: qualityMetrics,
      decision_tree: extractionDecisionTree
    }
  },
  
  memory_storage: {
    tool: 'Memory',
    purpose: 'Store repository analysis for future reference',
    parameters: {
      key: `research/github/${repoHash}`,
      data: repositoryAnalysis,
      tags: ['github_research', 'repository_analysis', searchDomain]
    }
  }
};
```

### 4. Specific Component Identification

#### Component Extraction Recommendations:
```javascript
function generateExtractionRecommendations(repoAnalysis) {
  const recommendations = {
    exact_files_needed: [],
    directory_structures: [],
    dependency_requirements: [],
    configuration_changes: [],
    integration_steps: [],
    testing_requirements: []
  };
  
  // Analyze each component for extraction feasibility
  for (const component of repoAnalysis.components) {
    if (component.extraction_complexity === 'low') {
      recommendations.exact_files_needed.push({
        component: component.name,
        files: component.files,
        dependencies: component.external_deps,
        tests: component.test_files,
        documentation: component.docs,
        integration_effort: 'minimal'
      });
    }
  }
  
  return recommendations;
}
```

### 5. Research Output Generation

#### Comprehensive GitHub Research Report:
```json
{
  "timestamp": "2024-09-08T13:00:00Z",
  "search_query": "react component library design system",
  "quality_threshold": 0.7,
  "repositories_analyzed": 15,
  
  "executive_summary": {
    "high_quality_repos": 6,
    "extraction_candidates": 3,
    "full_adoption_recommendations": 2,
    "primary_recommendation": "Chakra UI component extraction",
    "confidence": 0.91
  },
  
  "top_repositories": [
    {
      "name": "chakra-ui/chakra-ui",
      "url": "https://github.com/chakra-ui/chakra-ui",
      "description": "Modular React component library with excellent TypeScript support",
      "overall_score": 0.94,
      
      "quality_assessment": {
        "community_health": {
          "stars": 28500,
          "forks": 2200,
          "contributors": 580,
          "star_fork_ratio": 12.95,
          "community_score": 0.96
        },
        "development_activity": {
          "last_commit": "2 days ago",
          "commit_frequency": 145,
          "release_cadence": "monthly",
          "activity_score": 0.93
        },
        "code_quality": {
          "test_coverage": 85,
          "typescript_coverage": 100,
          "ci_cd_setup": "comprehensive",
          "quality_score": 0.92
        },
        "documentation": {
          "readme_quality": 9.1,
          "api_docs": "comprehensive", 
          "examples": "extensive",
          "documentation_score": 0.95
        }
      },
      
      "architecture_analysis": {
        "pattern": "modular_component_library",
        "modularity": "excellent",
        "component_isolation": "high",
        "dependency_coupling": "low",
        "extraction_feasibility": "excellent"
      },
      
      "component_extraction": {
        "recommendation": "selective_component_extraction",
        "extraction_complexity": "low",
        "specific_components": [
          {
            "name": "Button Component",
            "files": [
              "packages/button/src/Button.tsx",
              "packages/button/src/ButtonGroup.tsx", 
              "packages/button/src/IconButton.tsx"
            ],
            "dependencies": [
              "@chakra-ui/system",
              "@chakra-ui/theme",
              "@chakra-ui/utils"
            ],
            "tests": [
              "packages/button/tests/Button.test.tsx"
            ],
            "documentation": [
              "packages/button/README.md"
            ],
            "integration_effort": "2-3 hours",
            "benefits": [
              "Production-tested component",
              "Excellent accessibility support", 
              "Comprehensive prop API",
              "TypeScript definitions included"
            ]
          },
          {
            "name": "Theme System",
            "files": [
              "packages/theme/src/index.ts",
              "packages/theme/src/foundations/",
              "packages/theme/src/components/"
            ],
            "dependencies": [
              "@chakra-ui/theme-tools"
            ],
            "integration_effort": "4-6 hours",
            "benefits": [
              "Design system foundation",
              "Theme customization support",
              "Color mode support",
              "Responsive design utilities"
            ]
          }
        ],
        
        "integration_strategy": {
          "approach": "gradual_component_adoption",
          "steps": [
            "Extract theme system as foundation",
            "Implement core components (Button, Input, Box)",
            "Add layout components (Stack, Grid, Flex)",
            "Extend with specialized components as needed"
          ],
          "estimated_time": "1-2 weeks",
          "risk_level": "low"
        }
      },
      
      "licensing": {
        "license": "MIT",
        "compatibility": "excellent",
        "commercial_use": "allowed",
        "attribution_required": true
      },
      
      "pros": [
        "Excellent component modularity for extraction",
        "Comprehensive TypeScript support",
        "Outstanding accessibility features",
        "Active community and maintenance",
        "Extensive documentation and examples"
      ],
      
      "cons": [
        "Some components have theme system dependencies",
        "Styling approach may conflict with existing systems",
        "Bundle size considerations for full adoption"
      ]
    }
  ],
  
  "alternative_approaches": [
    {
      "approach": "Build custom components from scratch",
      "time_estimate": "4-6 weeks",
      "pros": ["Full control", "Perfect fit for requirements"],
      "cons": ["Reinventing wheel", "Testing burden", "Accessibility concerns"],
      "recommendation": "not_recommended"
    },
    {
      "approach": "Fork repository and customize",
      "time_estimate": "2-3 weeks", 
      "pros": ["Full codebase access", "Customization freedom"],
      "cons": ["Maintenance burden", "Upgrade complications"],
      "recommendation": "only_if_major_changes_needed"
    }
  ],
  
  "implementation_roadmap": {
    "phase_1": {
      "duration": "3-5 days",
      "components": ["Theme system", "Basic components (Button, Input)"],
      "deliverables": ["Working theme integration", "Core component library"]
    },
    "phase_2": {
      "duration": "5-7 days", 
      "components": ["Layout components", "Form components"],
      "deliverables": ["Complete layout system", "Form building blocks"]
    },
    "phase_3": {
      "duration": "3-5 days",
      "components": ["Specialized components", "Customization"],
      "deliverables": ["Full component suite", "Brand customization"]
    }
  },
  
  "gemini_analysis_recommendation": {
    "suggested": true,
    "reason": "Repository too large for manual component analysis",
    "context": "31,000+ lines of code across 150+ files",
    "next_step": "/research:analyze 'chakra-ui component extraction strategy'"
  },
  
  "metadata": {
    "analysis_duration": "12 minutes",
    "repositories_scored": 15,
    "extraction_analyses": 6,
    "confidence_factors": {
      "code_quality_verification": 0.94,
      "community_validation": 0.89,
      "architecture_assessment": 0.93
    }
  }
}
```

## Integration Points

### Used by:
- `/research:analyze` for detailed Gemini analysis of promising repositories
- `/research:web` follow-up for specific repository discovery
- Memory MCP for repository analysis caching and learning

### Produces:
- `research-github.json` - Detailed repository analysis and recommendations
- Component extraction roadmaps with specific files and dependencies
- Integration effort estimates and risk assessments
- Quality scores and community health metrics

### Consumes:
- Repository search terms and quality thresholds
- Project context for architecture compatibility assessment
- Previous research findings from web and deep research
- Organizational constraints and preferences

## Advanced Features

### 1. Component Dependency Mapping
- Visualize component interdependencies within repositories
- Identify minimal extraction sets for specific functionality
- Calculate extraction complexity scores

### 2. Architecture Compatibility Assessment
- Compare repository architecture patterns with project needs
- Identify integration challenges and opportunities
- Provide migration strategies for different architectural approaches

### 3. Security and Compliance Analysis
- Automated security vulnerability scanning of repositories
- License compatibility verification
- Dependency risk assessment

### 4. Community and Maintenance Prediction
- Analyze contributor patterns and project sustainability
- Predict maintenance burden and upgrade path complexity
- Assess long-term viability of repository adoption

## Examples

### Component Library Research:
```bash
/research:github 'react typescript component library' 0.8 all
```

### Backend Framework Analysis:
```bash
/research:github 'node.js REST API framework' 0.7 code
```

### Utility Library Discovery:
```bash
/research:github 'javascript date manipulation library' 0.6 community
```

## Error Handling & Limitations

### Rate Limiting:
- Respect GitHub API rate limits with intelligent request throttling
- Cache repository data to minimize API calls
- Provide graceful fallbacks when rate limits are exceeded

### Large Repository Handling:
- Automatically trigger Gemini analysis for repositories >10k LOC
- Focus on high-level architecture analysis for massive codebases
- Provide sampling strategies for comprehensive analysis

### Private Repository Limitations:
- Clear messaging about public repository limitations
- Suggestions for private repository analysis approaches
- Integration with enterprise GitHub instances where available

This command transforms GitHub from a discovery tool into an intelligent component extraction and integration planning system, dramatically reducing the "reinvent the wheel" problem in software development.