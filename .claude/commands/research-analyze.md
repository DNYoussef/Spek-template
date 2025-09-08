# /research:analyze

## Purpose
Leverage Gemini's massive context window to analyze complex research findings, synthesize multiple sources, and provide specific implementation guidance. Particularly valuable for processing large repositories, comprehensive documentation, and complex technical decisions that exceed normal context limits.

## Usage
/research:analyze '<research_context_or_findings>' [analysis_type=synthesis|extraction|decision|comparison] [output_format=guidance|roadmap|specification]

## Implementation

### 1. Large Context Analysis Framework

#### Context Processing Strategy:
```javascript
const GEMINI_ANALYSIS_FRAMEWORK = {
  context_optimization: {
    content_structuring: {
      hierarchical_organization: 'Structure content by importance and relevance',
      key_information_highlighting: 'Emphasize critical decision points',
      relationship_mapping: 'Show connections between concepts and components'
    },
    
    context_compression: {
      summary_extraction: 'Extract key points from verbose documentation',
      redundancy_removal: 'Eliminate duplicate information across sources',
      relevance_filtering: 'Focus on information relevant to specific goals'
    }
  },
  
  analysis_types: {
    synthesis: {
      purpose: 'Combine multiple research sources into unified recommendations',
      inputs: ['research-web.json', 'research-github.json', 'research-deep.json'],
      output: 'comprehensive_implementation_strategy',
      gemini_prompt_pattern: 'synthesis_and_decision_making'
    },
    
    extraction: {
      purpose: 'Extract specific implementation details from large codebases',
      inputs: ['repository_content', 'documentation', 'architectural_specs'],
      output: 'specific_component_extraction_guide',
      gemini_prompt_pattern: 'component_identification_and_extraction'
    },
    
    decision: {
      purpose: 'Make complex technical decisions based on multiple factors',
      inputs: ['requirements', 'constraints', 'research_findings', 'trade_offs'],
      output: 'decision_matrix_with_rationale',
      gemini_prompt_pattern: 'decision_making_with_trade_off_analysis'
    },
    
    comparison: {
      purpose: 'Compare multiple solutions or approaches systematically',
      inputs: ['solution_options', 'evaluation_criteria', 'context_constraints'],
      output: 'detailed_comparison_matrix',
      gemini_prompt_pattern: 'systematic_multi_criteria_comparison'
    }
  }
};
```

#### Gemini-Specific Prompt Engineering:
```javascript
const GEMINI_PROMPT_TEMPLATES = {
  synthesis_and_decision_making: {
    system_prompt: `
You are an expert technical architect and researcher with access to comprehensive research findings. Your task is to synthesize multiple research sources and provide specific, actionable implementation guidance.

Context Processing Guidelines:
- Analyze ALL provided research sources for patterns and insights
- Identify contradictions and provide resolution strategies
- Focus on practical implementation over theoretical discussion
- Provide specific technology recommendations with rationale
- Include implementation timelines and effort estimates
- Address potential risks and mitigation strategies

Analysis Framework:
1. Research Summary: Key findings from each source
2. Synthesis: Combined insights and unified recommendations
3. Implementation Strategy: Step-by-step approach with specifics
4. Risk Assessment: Potential challenges and solutions
5. Next Steps: Immediate actions and follow-up research
    `,
    
    user_prompt_template: `
Research Context:
{research_context}

Specific Analysis Request:
{analysis_request}

Requirements and Constraints:
{requirements}

Please provide a comprehensive analysis following the framework outlined in the system prompt.
    `
  },
  
  component_identification_and_extraction: {
    system_prompt: `
You are an expert software architect specializing in component analysis and extraction. Given a large codebase or system documentation, identify exactly which parts are needed and how to extract them efficiently.

Analysis Focus:
- Identify minimal viable components for the specific use case
- Map dependencies and required supporting code
- Provide exact file and directory listings
- Estimate extraction complexity and integration effort
- Suggest refactoring needs for clean extraction
- Identify potential integration challenges

Output Structure:
1. Component Analysis: What's needed and why
2. Extraction Plan: Exact files, dependencies, and steps  
3. Integration Strategy: How to incorporate into target system
4. Customization Needs: Required modifications and configurations
5. Validation Approach: Testing and verification strategy
    `,
    
    user_prompt_template: `
Repository/System Content:
{large_content}

Extraction Requirements:
{extraction_requirements}

Target Integration Context:
{target_system_context}

Please analyze and provide specific extraction guidance.
    `
  },
  
  decision_making_with_trade_off_analysis: {
    system_prompt: `
You are a senior technical decision maker with extensive experience in complex system architecture. Analyze the provided options and make a clear recommendation based on multi-criteria evaluation.

Decision Framework:
- Evaluate each option against all relevant criteria
- Quantify trade-offs where possible
- Consider short-term and long-term implications
- Address implementation complexity and maintenance burden
- Factor in team capabilities and organizational constraints
- Provide clear recommendation with confidence level

Decision Matrix Structure:
1. Criteria Definition: Weight and importance of each factor
2. Option Evaluation: Detailed scoring for each alternative
3. Trade-off Analysis: What you gain/lose with each choice
4. Recommendation: Clear choice with rationale
5. Implementation Considerations: What success requires
    `,
    
    user_prompt_template: `
Decision Context:
{decision_context}

Available Options:
{options}

Evaluation Criteria:
{criteria}

Organizational Constraints:
{constraints}

Please provide a comprehensive decision analysis.
    `
  }
};
```

### 2. MCP Integration for Large Context Processing

#### Gemini Analysis Pipeline:
```javascript
const MCP_GEMINI_PIPELINE = {
  context_preparation: {
    tool: 'Sequential Thinking',
    purpose: 'Structure complex research findings for Gemini analysis',
    parameters: {
      analysis_type: 'context_organization',
      input_sources: researchFindings,
      organization_strategy: 'hierarchical_by_importance'
    }
  },
  
  large_context_analysis: {
    tool: 'Gemini',
    purpose: 'Process large context and generate specific implementation guidance',
    parameters: {
      model: 'gemini-1.5-pro',
      context_window: 'maximum',
      temperature: 0.1,
      system_prompt: promptTemplate.system_prompt,
      user_content: structuredContext,
      output_format: 'structured_analysis'
    }
  },
  
  output_validation: {
    tool: 'Sequential Thinking',
    purpose: 'Validate and structure Gemini analysis output',
    parameters: {
      analysis_type: 'output_validation',
      validation_criteria: outputQualityCriteria,
      completeness_check: true
    }
  },
  
  memory_integration: {
    tool: 'Memory',
    purpose: 'Store analysis results and learned patterns',
    parameters: {
      key: `research/analysis/${contextHash}`,
      data: validatedAnalysis,
      tags: ['gemini_analysis', 'implementation_guidance', analysisType]
    }
  }
};
```

### 3. Analysis Output Generation

#### Comprehensive Analysis Report:
```json
{
  "timestamp": "2024-09-08T16:00:00Z",
  "analysis_type": "synthesis",
  "input_sources": ["research-web.json", "research-github.json", "research-models.json"],
  "analysis_context": "Authentication system implementation for multi-tenant SaaS",
  "gemini_model": "gemini-1.5-pro",
  "context_size_tokens": 87543,
  
  "executive_summary": {
    "unified_recommendation": "Implement Auth0 with custom tenant isolation using SuperTokens for cost optimization",
    "implementation_approach": "Hybrid commercial/open-source strategy",
    "timeline_estimate": "3-4 weeks implementation, 1 week integration testing",
    "confidence_level": 0.94,
    "key_decision_factors": [
      "Cost optimization through hybrid approach",
      "Reduced development complexity",
      "Production-ready security features",
      "Scalability and maintenance considerations"
    ]
  },
  
  "research_synthesis": {
    "web_research_insights": {
      "key_findings": [
        "Auth0 dominates enterprise authentication market",
        "SuperTokens emerging as viable open-source alternative",
        "Multi-tenant isolation requires careful architecture planning"
      ],
      "implementation_patterns": [
        "Tenant-per-database for enterprise customers",
        "Shared database with row-level security for SMB customers"
      ]
    },
    
    "github_analysis_insights": {
      "auth0_integration": {
        "community_health": "Excellent (8500+ stars, active maintenance)",
        "integration_complexity": "Low (comprehensive SDKs available)",
        "extraction_recommendation": "Use full SDK, focus on tenant customization"
      },
      
      "supertokens_analysis": {
        "component_extraction": {
          "core_authentication": {
            "files_needed": [
              "lib/src/recipe/session/",
              "lib/src/recipe/emailpassword/",
              "lib/src/recipe/thirdpartyemailpassword/"
            ],
            "dependencies": [
              "supertokens-node",
              "supertokens-website" 
            ],
            "integration_effort": "Medium (requires custom tenant logic)"
          }
        }
      }
    },
    
    "ai_models_insights": {
      "fraud_detection_integration": {
        "recommended_model": "microsoft/DialoGPT-medium",
        "use_case": "Anomalous login pattern detection",
        "integration_point": "Post-authentication analysis pipeline"
      }
    }
  },
  
  "unified_implementation_strategy": {
    "architecture_overview": {
      "primary_auth_provider": "Auth0 (for enterprise customers)",
      "secondary_auth_provider": "SuperTokens (for cost-sensitive customers)",
      "tenant_isolation_strategy": "Dynamic provider selection based on customer tier",
      "ai_enhancement": "Fraud detection using specialized ML models"
    },
    
    "implementation_phases": {
      "phase_1_foundation": {
        "duration": "1 week",
        "deliverables": [
          "Auth0 integration with basic tenant support",
          "Tenant routing logic implementation",
          "Basic user management APIs"
        ],
        "specific_tasks": [
          {
            "task": "Auth0 tenant configuration",
            "implementation": "Create separate Auth0 applications per customer tier",
            "code_example": {
              "auth0_config": {
                "enterprise": {
                  "domain": "enterprise.{company}.auth0.com",
                  "clientId": "enterprise_client_id",
                  "audience": "https://api.company.com/enterprise"
                },
                "standard": {
                  "domain": "standard.{company}.auth0.com", 
                  "clientId": "standard_client_id",
                  "audience": "https://api.company.com/standard"
                }
              }
            }
          }
        ]
      },
      
      "phase_2_supertokens_integration": {
        "duration": "1 week",
        "deliverables": [
          "SuperTokens deployment for cost optimization",
          "Dynamic auth provider selection",
          "Unified authentication middleware"
        ],
        "extraction_implementation": {
          "supertokens_components": [
            {
              "component": "Session Management",
              "source_files": [
                "lib/src/recipe/session/index.ts",
                "lib/src/recipe/session/sessionFunctions.ts"
              ],
              "customization_needed": "Add tenant context to session data",
              "integration_code": `
// Custom session with tenant context
import Session from 'supertokens-node/recipe/session';

Session.init({
    cookieSecure: process.env.NODE_ENV === 'production',
    sessionExpiredStatusCode: 401,
    override: {
        functions: (originalImplementation) => {
            return {
                ...originalImplementation,
                createNewSession: async function(input) {
                    // Add tenant context to session
                    const tenantId = input.userContext.tenantId;
                    input.accessTokenPayload = {
                        ...input.accessTokenPayload,
                        tenantId: tenantId
                    };
                    return originalImplementation.createNewSession(input);
                }
            };
        }
    }
});
              `
            }
          ]
        }
      },
      
      "phase_3_ai_enhancement": {
        "duration": "1 week",
        "deliverables": [
          "Fraud detection model integration",
          "Anomaly detection pipeline",
          "Real-time risk scoring"
        ],
        "ai_implementation": {
          "model_integration": {
            "fraud_detection_pipeline": `
// Anomaly detection integration
import { pipeline } from '@huggingface/transformers';

const anomalyDetector = await pipeline(
  'text-classification',
  'microsoft/DialoGPT-medium'
);

async function analyzeLoginPattern(loginContext) {
  const features = extractLoginFeatures(loginContext);
  const result = await anomalyDetector(features);
  
  return {
    riskScore: result[0].score,
    decision: result[0].score > 0.8 ? 'block' : 'allow',
    factors: result.map(r => r.label)
  };
}
            `
          }
        }
      },
      
      "phase_4_optimization": {
        "duration": "1 week",
        "deliverables": [
          "Performance optimization",
          "Cost monitoring and optimization",
          "Production monitoring setup"
        ]
      }
    }
  },
  
  "decision_matrix": {
    "evaluation_criteria": [
      {"criterion": "Implementation Speed", "weight": 0.25},
      {"criterion": "Long-term Costs", "weight": 0.30},
      {"criterion": "Security Features", "weight": 0.25},
      {"criterion": "Maintenance Burden", "weight": 0.20}
    ],
    
    "option_scoring": {
      "auth0_only": {
        "implementation_speed": 9,
        "long_term_costs": 4,
        "security_features": 10,
        "maintenance_burden": 9,
        "weighted_score": 6.85
      },
      
      "supertokens_only": {
        "implementation_speed": 6,
        "long_term_costs": 9,
        "security_features": 7,
        "maintenance_burden": 6,
        "weighted_score": 7.05
      },
      
      "hybrid_approach": {
        "implementation_speed": 7,
        "long_term_costs": 8,
        "security_features": 9,
        "maintenance_burden": 7,
        "weighted_score": 7.75
      }
    },
    
    "recommendation_rationale": {
      "chosen_option": "hybrid_approach",
      "key_advantages": [
        "Optimizes costs while maintaining enterprise features",
        "Provides fallback options for different customer tiers",
        "Allows gradual migration and learning"
      ],
      "risk_mitigation": [
        "Complexity managed through clear abstraction layers",
        "Gradual rollout reduces implementation risk",
        "Clear separation of concerns between providers"
      ]
    }
  },
  
  "implementation_specifics": {
    "file_structure": {
      "auth/": {
        "providers/": [
          "auth0.provider.ts - Auth0 integration logic",
          "supertokens.provider.ts - SuperTokens integration logic",
          "base.provider.ts - Common authentication interface"
        ],
        "middleware/": [
          "tenant-routing.middleware.ts - Route to appropriate provider",
          "unified-auth.middleware.ts - Common authentication middleware"
        ],
        "models/": [
          "tenant.model.ts - Tenant configuration and preferences",
          "user.model.ts - Unified user model across providers"
        ]
      }
    },
    
    "configuration_management": {
      "environment_variables": [
        "AUTH0_DOMAIN",
        "AUTH0_CLIENT_ID", 
        "AUTH0_CLIENT_SECRET",
        "SUPERTOKENS_CONNECTION_URI",
        "SUPERTOKENS_API_KEY"
      ],
      "tenant_configuration": {
        "database_schema": `
CREATE TABLE tenant_auth_config (
  tenant_id UUID PRIMARY KEY,
  auth_provider VARCHAR(50) NOT NULL,
  provider_config JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
        `,
        "routing_logic": "Route based on tenant subscription tier and preferences"
      }
    }
  },
  
  "risk_assessment_and_mitigation": {
    "implementation_risks": [
      {
        "risk": "Provider-specific feature discrepancies",
        "impact": "Medium",
        "probability": "High", 
        "mitigation": "Create abstraction layer that normalizes features across providers"
      },
      {
        "risk": "Complex debugging across multiple auth systems",
        "impact": "Medium",
        "probability": "Medium",
        "mitigation": "Implement comprehensive logging and monitoring for both providers"
      }
    ],
    
    "operational_risks": [
      {
        "risk": "Auth0 service outage affecting enterprise customers",
        "impact": "High",
        "probability": "Low",
        "mitigation": "Implement failover to SuperTokens for critical operations"
      }
    ]
  },
  
  "cost_analysis": {
    "implementation_costs": {
      "development_time": "3-4 weeks (1 senior developer)",
      "auth0_setup": "$0 (using existing account)",
      "supertokens_infrastructure": "$50-100/month",
      "ai_model_hosting": "$25-50/month"
    },
    
    "operational_costs": {
      "auth0_monthly": "$200-800 (based on MAU and features)",
      "supertokens_hosting": "$50-150/month",
      "monitoring_and_logging": "$30-80/month",
      "total_estimated": "$280-1030/month"
    },
    
    "cost_optimization_potential": {
      "current_auth0_only": "$500-1200/month",
      "hybrid_approach": "$280-1030/month", 
      "potential_savings": "15-40% reduction in auth costs"
    }
  },
  
  "next_steps": {
    "immediate_actions": [
      "Set up development environment with both Auth0 and SuperTokens",
      "Create proof of concept for tenant routing logic",
      "Design database schema for tenant authentication configuration"
    ],
    
    "follow_up_research": [
      "/research:deep 'multi-tenant authentication security best practices'",
      "/research:models 'real-time fraud detection for authentication'",
      "/research:github 'auth0 supertokens integration patterns'"
    ],
    
    "decision_validation": [
      "Create small-scale prototype with both providers",
      "Test authentication flows for different tenant types",
      "Validate cost assumptions with actual usage data"
    ]
  },
  
  "metadata": {
    "analysis_duration_minutes": 8,
    "input_context_size": "87,543 tokens",
    "output_comprehensiveness": 0.96,
    "implementation_specificity": 0.94,
    "decision_confidence": 0.94,
    "gemini_processing_notes": [
      "Successfully processed all research sources",
      "Identified optimal synthesis strategy",
      "Generated specific implementation code examples",
      "Provided detailed cost-benefit analysis"
    ]
  }
}
```

## Integration Points

### Used by:
- Follow-up to `/research:web`, `/research:github`, `/research:models`, `/research:deep`
- Memory MCP for persistent analysis pattern storage
- Sequential Thinking MCP for output validation and structure

### Produces:
- `research-analyze.json` - Comprehensive implementation strategy
- Specific code examples and file structures
- Decision matrices with quantified trade-offs
- Detailed implementation roadmaps with timelines

### Consumes:
- Research findings from other research commands
- Large repository contents and documentation
- Complex technical requirements and constraints
- Multi-criteria decision scenarios

## Advanced Features

### 1. Multi-Source Synthesis
- Combine findings from web, GitHub, models, and deep research
- Resolve contradictions and provide unified recommendations
- Identify gaps where additional research is needed

### 2. Large Repository Analysis
- Process entire codebases for component extraction guidance
- Generate specific file and dependency lists
- Provide integration effort estimates and complexity assessments

### 3. Complex Decision Making
- Multi-criteria analysis with weighted scoring
- Trade-off visualization and quantification
- Risk-adjusted recommendations with confidence levels

### 4. Implementation Planning
- Generate detailed implementation roadmaps with phases
- Provide specific code examples and configuration
- Create testing and validation strategies

## Examples

### Research Synthesis:
```bash
/research:analyze "$(cat .claude/.artifacts/research-*.json)" synthesis guidance
```

### Repository Component Extraction:
```bash
/research:analyze "large_repository_content" extraction specification
```

### Technical Decision Making:
```bash
/research:analyze "database_selection_criteria_and_options" decision roadmap
```

### Solution Comparison:
```bash
/research:analyze "authentication_solutions_research" comparison specification
```

## Error Handling & Limitations

### Context Size Management:
- Automatically compress and prioritize content for large contexts
- Provide summaries when full analysis exceeds token limits
- Suggest breaking complex analyses into focused sub-analyses

### Analysis Quality Validation:
- Cross-validate recommendations against research sources
- Flag potential contradictions or gaps in analysis
- Provide confidence levels for different aspects of recommendations

### Implementation Specificity:
- Ensure recommendations include specific, actionable steps
- Validate that code examples are syntactically correct
- Check that suggested file structures and configurations are realistic

This command transforms research findings into specific, actionable implementation strategies with the depth and complexity that only large context analysis can provide.