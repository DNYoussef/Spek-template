# /research:deep

## Purpose
Conduct comprehensive research using MCP tools (DeepWiki, Firecrawl) to gather deep technical knowledge, best practices, architectural patterns, and implementation guidance. Goes beyond surface-level search to provide authoritative, structured knowledge synthesis.

## Usage
/research:deep '<research_topic>' [depth=standard|comprehensive|exhaustive] [focus=technical|business|architectural]

## Implementation

### 1. Multi-Source Deep Research Strategy

#### Research Source Taxonomy:
```javascript
const DEEP_RESEARCH_SOURCES = {
  authoritative_documentation: {
    sources: [
      'official_documentation',
      'api_references', 
      'architectural_decision_records',
      'standards_specifications',
      'technical_white_papers'
    ],
    reliability: 'high',
    depth: 'comprehensive'
  },
  
  community_knowledge: {
    sources: [
      'stackoverflow_canonical_answers',
      'github_discussions',
      'reddit_technical_communities',
      'discord_developer_communities',
      'technical_forums'
    ],
    reliability: 'medium-high',
    depth: 'practical'
  },
  
  expert_content: {
    sources: [
      'technical_blogs_by_experts',
      'conference_presentations',
      'research_papers',
      'case_studies',
      'architecture_reviews'
    ],
    reliability: 'high',
    depth: 'analytical'
  },
  
  implementation_examples: {
    sources: [
      'github_repositories',
      'code_samples',
      'tutorials_with_code',
      'implementation_guides',
      'reference_architectures'
    ],
    reliability: 'medium',
    depth: 'practical'
  }
};
```

#### Research Methodology Framework:
```javascript
const RESEARCH_METHODOLOGY = {
  topic_decomposition: {
    primary_concepts: extractCoreConcepts(researchTopic),
    related_topics: identifyRelatedTopics(researchTopic),
    technical_dependencies: mapTechnicalDependencies(researchTopic),
    business_implications: analyzeBusiness.context(researchTopic)
  },
  
  research_phases: {
    discovery: {
      objective: 'Identify authoritative sources and key concepts',
      methods: ['broad_search', 'source_validation', 'topic_mapping'],
      duration: '20%'
    },
    
    deep_dive: {
      objective: 'Extract detailed technical knowledge',
      methods: ['content_analysis', 'pattern_identification', 'best_practices_extraction'],
      duration: '50%'
    },
    
    synthesis: {
      objective: 'Combine knowledge into actionable insights',
      methods: ['cross_source_validation', 'contradiction_resolution', 'recommendation_generation'],
      duration: '20%'
    },
    
    validation: {
      objective: 'Verify findings and fill knowledge gaps',
      methods: ['expert_validation', 'community_consensus', 'implementation_verification'],
      duration: '10%'
    }
  }
};
```

### 2. MCP Tool Integration for Comprehensive Research

#### Deep Research Pipeline:
```javascript
const MCP_DEEP_RESEARCH_PIPELINE = {
  knowledge_extraction: {
    tool: 'DeepWiki',
    purpose: 'Extract structured knowledge from authoritative sources',
    parameters: {
      topics: researchTopics,
      depth: researchDepth,
      include_related: true,
      format: 'structured_knowledge',
      cross_references: true
    }
  },
  
  content_crawling: {
    tool: 'Firecrawl',
    purpose: 'Crawl and extract content from identified sources',
    parameters: {
      urls: authoritative_sources,
      extract_format: 'markdown',
      include_links: true,
      include_metadata: true,
      respect_robots: true,
      depth_limit: 3
    }
  },
  
  web_research: {
    tool: 'WebSearch',
    purpose: 'Discover additional authoritative sources',
    parameters: {
      queries: generate_expert_queries(researchTopic),
      domains: [
        'stackoverflow.com',
        'github.com', 
        'medium.com',
        'dev.to',
        'hackernoon.com'
      ],
      time_filter: 'recent_year'
    }
  },
  
  systematic_analysis: {
    tool: 'Sequential Thinking',
    purpose: 'Systematic analysis and synthesis of research findings',
    parameters: {
      analysis_type: 'knowledge_synthesis',
      input_sources: research_findings,
      synthesis_framework: 'technical_analysis',
      output_structure: 'comprehensive_guide'
    }
  },
  
  knowledge_storage: {
    tool: 'Memory',
    purpose: 'Store research findings for future reference and learning',
    parameters: {
      key: `research/deep/${topicHash}`,
      data: synthesized_knowledge,
      tags: ['deep_research', 'authoritative', topicCategory, researchDepth]
    }
  }
};
```

### 3. Content Analysis and Knowledge Extraction

#### Advanced Content Processing:
```javascript
function processResearchContent(crawledContent, researchFocus) {
  const analysis = {
    concept_extraction: extractKeyConceptsAndDefinitions(crawledContent),
    pattern_identification: identifyImplementationPatterns(crawledContent), 
    best_practices: extractBestPractices(crawledContent),
    anti_patterns: identifyAntiPatterns(crawledContent),
    trade_offs: analyzeTechnicaltrade-offs(crawledContent),
    implementation_guidance: extractImplementationGuidance(crawledContent),
    expert_opinions: identifyExpertOpinions(crawledContent),
    community_consensus: analyzeCommunityconsensus(crawledContent)
  };
  
  return {
    structured_knowledge: analysis,
    confidence_scores: calculateConfidenceScores(analysis),
    source_authority: assessSourceAuthority(crawledContent),
    knowledge_gaps: identifyKnowledgeGaps(analysis, researchFocus)
  };
}
```

### 4. Research Quality Assessment and Validation

#### Knowledge Validation Framework:
```javascript
const KNOWLEDGE_VALIDATION = {
  source_credibility: {
    authority_indicators: [
      'official_documentation',
      'recognized_expert_authors',
      'peer_reviewed_content',
      'industry_standard_bodies',
      'major_tech_company_engineering_blogs'
    ],
    reliability_scoring: {
      official_docs: 1.0,
      expert_blogs: 0.9,
      community_consensus: 0.8,
      individual_opinions: 0.6,
      unverified_content: 0.3
    }
  },
  
  content_validation: {
    cross_reference_validation: 'minimum_3_sources',
    recency_requirements: 'within_2_years_for_tech',
    implementation_verification: 'code_examples_tested',
    community_validation: 'peer_review_indicators'
  },
  
  knowledge_completeness: {
    concept_coverage: 'all_core_concepts_addressed',
    implementation_guidance: 'step_by_step_instructions',
    troubleshooting: 'common_issues_documented',
    best_practices: 'expert_recommendations_included'
  }
};
```

### 5. Research Output Generation

#### Comprehensive Deep Research Report:
```json
{
  "timestamp": "2024-09-08T15:00:00Z",
  "research_topic": "microservices architecture patterns for high-scale applications",
  "research_depth": "comprehensive",
  "research_focus": "technical",
  "research_duration_minutes": 45,
  
  "executive_summary": {
    "key_findings": [
      "Event-driven architecture is critical for microservices resilience",
      "Service mesh adoption is becoming standard for service communication",
      "Database per service pattern requires sophisticated data consistency strategies"
    ],
    "primary_recommendation": "Implement event sourcing with CQRS for complex business domains",
    "implementation_complexity": "high",
    "confidence_level": 0.91
  },
  
  "knowledge_synthesis": {
    "core_concepts": {
      "service_decomposition": {
        "definition": "Breaking down monolithic applications into independent, loosely coupled services",
        "key_principles": [
          "Single responsibility principle",
          "Business capability alignment", 
          "Data ownership boundaries",
          "Independent deployment capability"
        ],
        "implementation_approaches": [
          {
            "approach": "Domain-Driven Design (DDD)",
            "description": "Use bounded contexts to identify service boundaries",
            "pros": ["Clear business alignment", "Natural team boundaries"],
            "cons": ["Complex domain modeling", "Requires domain expertise"],
            "authority_sources": [
              "Eric Evans - Domain-Driven Design",
              "Martin Fowler - Microservices articles",
              "Netflix Engineering Blog"
            ]
          }
        ]
      },
      
      "service_communication": {
        "synchronous_patterns": {
          "rest_apis": {
            "description": "HTTP-based request-response communication",
            "use_cases": ["Direct user interactions", "Simple data queries"],
            "implementation_guidance": {
              "api_design": "Follow REST principles and OpenAPI specifications",
              "error_handling": "Implement circuit breaker pattern",
              "authentication": "Use OAuth 2.0 with JWT tokens"
            },
            "best_practices": [
              "Use HTTP status codes appropriately",
              "Implement proper versioning strategy",
              "Design for idempotency",
              "Add comprehensive logging and tracing"
            ]
          },
          
          "graphql": {
            "description": "Query language for APIs with single endpoint",
            "use_cases": ["Complex data fetching", "Mobile applications", "BFF patterns"],
            "trade_offs": {
              "pros": ["Single request for complex data", "Strong typing", "Real-time subscriptions"],
              "cons": ["Query complexity management", "Caching challenges", "N+1 query problems"]
            }
          }
        },
        
        "asynchronous_patterns": {
          "event_driven_architecture": {
            "description": "Services communicate through events published to message brokers",
            "patterns": [
              {
                "name": "Event Sourcing",
                "description": "Store all changes as a sequence of events",
                "implementation": {
                  "event_store": "Apache Kafka, EventStore, or AWS DynamoDB",
                  "projection_building": "Separate read models from write models",
                  "replay_capability": "Rebuild state from events for debugging"
                },
                "complexity": "high",
                "benefits": [
                  "Complete audit trail",
                  "Temporal queries",
                  "System evolution flexibility"
                ]
              }
            ]
          }
        }
      }
    },
    
    "architectural_patterns": {
      "service_mesh": {
        "description": "Infrastructure layer for service-to-service communication",
        "leading_solutions": [
          {
            "name": "Istio",
            "maturity": "production_ready",
            "complexity": "high",
            "features": ["Traffic management", "Security", "Observability"],
            "adoption_recommendation": "For complex multi-team organizations"
          },
          {
            "name": "Linkerd",
            "maturity": "production_ready", 
            "complexity": "medium",
            "features": ["Lightweight", "Focused on reliability"],
            "adoption_recommendation": "For simpler deployments requiring reliability"
          }
        ],
        
        "implementation_strategy": {
          "phase_1": "Start with traffic management and observability",
          "phase_2": "Add security policies and mutual TLS",
          "phase_3": "Implement advanced traffic patterns",
          "prerequisites": [
            "Kubernetes cluster",
            "Container orchestration experience",
            "DevOps team capability"
          ]
        }
      }
    },
    
    "data_management_patterns": {
      "database_per_service": {
        "principle": "Each microservice owns its data and database",
        "implementation_challenges": [
          {
            "challenge": "Data consistency across services",
            "solutions": [
              {
                "pattern": "Saga Pattern",
                "description": "Manage distributed transactions through choreography or orchestration",
                "implementation_options": [
                  "Choreography: Event-driven saga execution",
                  "Orchestration: Central coordinator manages saga"
                ],
                "tools": ["Apache Camel", "Netflix Conductor", "Zeebe"]
              },
              {
                "pattern": "Two-Phase Commit (2PC)",
                "description": "Distributed transaction protocol",
                "recommendation": "Avoid due to performance and availability issues",
                "alternatives": ["Eventual consistency with compensating actions"]
              }
            ]
          }
        ]
      },
      
      "cqrs_pattern": {
        "description": "Command Query Responsibility Segregation",
        "use_cases": [
          "Complex business domains",
          "Different read/write performance requirements",
          "Event sourcing implementations"
        ],
        "implementation_guidance": {
          "command_side": "Handle business logic and state changes",
          "query_side": "Optimized read models for different views",
          "synchronization": "Event-driven updates to read models"
        }
      }
    },
    
    "operational_patterns": {
      "observability": {
        "three_pillars": {
          "logging": {
            "structured_logging": "Use JSON format with correlation IDs",
            "centralized_collection": "ELK Stack, Fluentd, or cloud solutions",
            "log_levels": "Appropriate use of DEBUG, INFO, WARN, ERROR"
          },
          
          "metrics": {
            "application_metrics": "Business and technical KPIs",
            "infrastructure_metrics": "Resource utilization and health",
            "tools": ["Prometheus + Grafana", "DataDog", "New Relic"]
          },
          
          "tracing": {
            "distributed_tracing": "Track requests across service boundaries", 
            "tools": ["Jaeger", "Zipkin", "AWS X-Ray"],
            "implementation": "OpenTelemetry for vendor-neutral instrumentation"
          }
        }
      },
      
      "deployment_patterns": {
        "blue_green_deployment": {
          "description": "Maintain two identical production environments",
          "benefits": ["Zero-downtime deployments", "Quick rollback capability"],
          "implementation": "Load balancer switches traffic between environments"
        },
        
        "canary_deployment": {
          "description": "Gradual rollout to subset of users",
          "benefits": ["Risk mitigation", "Performance validation"],
          "implementation": "Feature flags and traffic splitting"
        }
      }
    }
  },
  
  "implementation_roadmap": {
    "assessment_phase": {
      "duration": "2-4 weeks",
      "activities": [
        "Current system analysis and decomposition planning",
        "Service boundary identification using DDD",
        "Team structure and capability assessment",
        "Technology stack evaluation and selection"
      ],
      "deliverables": [
        "Service decomposition plan",
        "Technology architecture document",
        "Migration roadmap"
      ]
    },
    
    "foundation_phase": {
      "duration": "4-8 weeks",
      "activities": [
        "Container orchestration platform setup (Kubernetes)",
        "CI/CD pipeline establishment",
        "Observability stack implementation",
        "Service mesh deployment (if needed)"
      ],
      "success_criteria": [
        "Automated deployment pipeline functional",
        "Monitoring and alerting operational",
        "Development team trained on new tools"
      ]
    },
    
    "migration_phase": {
      "duration": "3-6 months",
      "approach": "Strangler Fig Pattern",
      "activities": [
        "Identify and extract first service (start with leaf nodes)",
        "Implement service communication patterns",
        "Gradually extract remaining services",
        "Decommission monolithic components"
      ]
    }
  },
  
  "risk_assessment": {
    "high_risks": [
      {
        "risk": "Distributed system complexity",
        "impact": "Development velocity reduction",
        "mitigation": "Invest heavily in tooling, automation, and team training",
        "probability": "high"
      },
      {
        "risk": "Data consistency challenges", 
        "impact": "Business logic errors and data corruption",
        "mitigation": "Implement comprehensive testing and monitoring for distributed transactions",
        "probability": "medium"
      }
    ],
    
    "medium_risks": [
      {
        "risk": "Network latency and partitions",
        "mitigation": "Design for eventual consistency and implement circuit breakers"
      }
    ]
  },
  
  "best_practices_summary": [
    "Start with a monolith and extract services based on clear business boundaries",
    "Implement comprehensive observability before scaling to many services",
    "Use database per service but carefully manage data consistency",
    "Automate everything: testing, deployment, monitoring, and recovery",
    "Design for failure: implement circuit breakers, bulkheads, and timeouts",
    "Invest in team structure: align teams with service ownership",
    "Gradual migration: use strangler fig pattern rather than big bang approach"
  ],
  
  "anti_patterns_to_avoid": [
    "Distributed monolith: Services too tightly coupled",
    "Shared databases: Violates service autonomy",
    "Synchronous communication for everything: Creates tight coupling",
    "Lack of proper monitoring: Flying blind in distributed system",
    "Premature optimization: Over-engineering early services"
  ],
  
  "expert_consensus": {
    "areas_of_agreement": [
      "Service boundaries should follow business domain boundaries",
      "Observability is critical and should be implemented early",
      "Start simple and evolve architecture based on real needs"
    ],
    
    "areas_of_debate": [
      "Service mesh adoption timing (early vs later)",
      "Event sourcing complexity vs benefits trade-off",
      "Optimal service granularity"
    ]
  },
  
  "follow_up_research": {
    "immediate": [
      "/research:models 'distributed tracing for microservices'",
      "/research:github 'kubernetes service mesh comparison'",
      "/research:web 'event sourcing implementation patterns'"
    ],
    
    "future": [
      "Specific technology deep dives based on selection",
      "Team structure and Conway's Law implications",
      "Cost optimization strategies for microservices"
    ]
  },
  
  "metadata": {
    "sources_analyzed": 47,
    "authoritative_sources": 23,
    "expert_opinions_included": 12,
    "implementation_examples": 18,
    "cross_validation_score": 0.89,
    "knowledge_completeness": 0.93,
    "authority_weighted_confidence": 0.91
  }
}
```

## Integration Points

### Used by:
- `/research:analyze` for Gemini-based synthesis of complex research findings
- `/research:web` and `/research:github` for focused follow-up research
- Memory MCP for building organizational knowledge base

### Produces:
- `research-deep.json` - Comprehensive structured knowledge synthesis
- Implementation roadmaps with phases and timelines
- Risk assessments and mitigation strategies
- Best practices and anti-patterns documentation

### Consumes:
- Research topics with technical, business, or architectural focus
- Depth requirements (standard, comprehensive, exhaustive)
- Organizational context and constraints
- Previous research findings for knowledge building

## Advanced Features

### 1. Knowledge Graph Construction
- Build interconnected knowledge maps showing relationships between concepts
- Identify knowledge dependencies and prerequisite learning paths
- Visual representation of complex technical architectures

### 2. Authority Source Ranking
- Automatic identification and ranking of authoritative sources
- Expert opinion aggregation and consensus identification
- Source credibility scoring based on community validation

### 3. Implementation Pattern Mining
- Extract reusable implementation patterns from multiple sources
- Code example aggregation and synthesis
- Anti-pattern identification and avoidance strategies

### 4. Knowledge Gap Analysis
- Identify areas where information is incomplete or contradictory
- Suggest additional research directions
- Flag areas requiring expert consultation

## Examples

### Architectural Research:
```bash
/research:deep 'event-driven architecture implementation patterns' comprehensive technical
```

### Best Practices Research:
```bash
/research:deep 'API security best practices for financial applications' standard business
```

### Technology Deep Dive:
```bash
/research:deep 'container orchestration with Kubernetes at scale' exhaustive technical
```

## Error Handling & Limitations

### Content Quality Control:
- Filter out outdated or deprecated information
- Handle conflicting information from different sources
- Validate implementation examples for correctness

### Research Scope Management:
- Balance depth vs. breadth based on time constraints
- Focus on actionable insights rather than theoretical knowledge
- Prioritize authoritative sources over opinion pieces

### Knowledge Synthesis Challenges:
- Handle contradictory expert opinions appropriately
- Identify when consensus doesn't exist
- Provide balanced perspectives on controversial topics

This command transforms scattered internet knowledge into structured, authoritative technical guidance that can directly inform architectural decisions and implementation strategies.