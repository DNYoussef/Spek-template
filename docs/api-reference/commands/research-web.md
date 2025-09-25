# /research:web

## Purpose
Comprehensive web search and scraping to discover existing solutions, avoiding reinventing the wheel. Searches for open source alternatives, existing implementations, and related projects with quality scoring and relevance analysis.

## Usage
/research:web '<problem_description>' [scope=general|specific|technical] [depth=surface|deep|comprehensive]

## Implementation

### 1. Multi-Source Web Research Strategy

#### Primary Search Approach:
```javascript
const SEARCH_STRATEGY = {
  problem_analysis: {
    keywords: extractKeywords(problemDescription),
    synonyms: generateSynonyms(keywords),
    technical_terms: identifyTechnicalTerms(problemDescription),
    domain_context: analyzeDomain(problemDescription)
  },
  
  search_sources: [
    'google_scholar',     // Academic papers and research
    'github_search',      // Code repositories
    'stackoverflow',      // Technical discussions
    'reddit',            // Community insights
    'product_hunt',      // Product discovery
    'hackernews',        // Technical news
    'awesome_lists',     // Curated resource lists
    'documentation',     // Official docs and guides
    'blogs',             // Technical blogs and tutorials
    'youtube',           // Video tutorials and demos
  ],
  
  quality_indicators: [
    'github_stars',
    'community_activity',
    'documentation_quality',
    'maintenance_status',
    'license_compatibility',
    'security_audit',
    'performance_benchmarks'
  ]
};
```

### 2. Web Scraping and Content Analysis

#### Content Extraction Pipeline:
```javascript
function analyzeWebResults(searchResults) {
  const analysis = {
    solutions: [],
    alternatives: [],
    quality_metrics: {},
    implementation_patterns: [],
    pros_cons_analysis: {},
    compatibility_assessment: {}
  };
  
  for (const result of searchResults) {
    const content = await scrapeContent(result.url);
    const extractedData = {
      title: content.title,
      description: extractDescription(content),
      technology_stack: identifyTechnologies(content),
      implementation_approach: analyzeApproach(content),
      quality_score: calculateQualityScore(result, content),
      relevance_score: calculateRelevance(problemDescription, content),
      license: extractLicense(content),
      community_metrics: getCommunityMetrics(result),
      last_updated: extractLastUpdate(content),
      documentation_quality: assessDocumentationQuality(content)
    };
    
    if (extractedData.relevance_score > 0.7) {
      analysis.solutions.push(extractedData);
    }
  }
  
  return analysis;
}
```

### 3. Quality Assessment Framework

#### Solution Scoring System:
```javascript
const QUALITY_METRICS = {
  community_health: {
    github_stars: { weight: 0.15, threshold: 100 },
    recent_commits: { weight: 0.20, threshold: 30 }, // commits in last 30 days
    contributor_count: { weight: 0.15, threshold: 5 },
    issue_resolution: { weight: 0.20, threshold: 0.8 }, // resolution rate
    documentation: { weight: 0.15, threshold: 0.7 },
    license_clarity: { weight: 0.15, threshold: 1.0 }
  },
  
  technical_quality: {
    code_coverage: { weight: 0.25, threshold: 0.8 },
    security_scan: { weight: 0.30, threshold: 0.9 },
    performance_bench: { weight: 0.20, threshold: 0.7 },
    architecture: { weight: 0.15, threshold: 0.8 },
    dependencies: { weight: 0.10, threshold: 0.9 } // minimal, up-to-date deps
  },
  
  business_fit: {
    license_compatibility: { weight: 0.40, threshold: 1.0 },
    maintenance_commitment: { weight: 0.30, threshold: 0.8 },
    feature_completeness: { weight: 0.20, threshold: 0.7 },
    integration_complexity: { weight: 0.10, threshold: 0.8 }
  }
};
```

### 4. MCP Tool Integration

#### Web Research Tool Chain:
```javascript
const MCP_RESEARCH_PIPELINE = {
  web_search: {
    tool: 'WebSearch',
    purpose: 'Multi-query search across different engines',
    parameters: {
      queries: generateSearchQueries(problemDescription),
      domains: ['github.com', 'stackoverflow.com', 'reddit.com'],
      time_filter: 'recent_2years'
    }
  },
  
  content_extraction: {
    tool: 'Firecrawl', 
    purpose: 'Extract and normalize web content',
    parameters: {
      urls: topResults,
      extract_format: 'markdown',
      include_links: true,
      include_metadata: true
    }
  },
  
  deep_analysis: {
    tool: 'DeepWiki',
    purpose: 'Research technical concepts and relationships',
    parameters: {
      topics: identifiedTopics,
      depth: 'comprehensive',
      include_related: true
    }
  },
  
  pattern_analysis: {
    tool: 'Sequential Thinking',
    purpose: 'Systematic analysis of found solutions',
    parameters: {
      analysis_type: 'solution_comparison',
      criteria: qualityMetrics,
      output_format: 'structured_comparison'
    }
  },
  
  memory_integration: {
    tool: 'Memory',
    purpose: 'Store research findings for future reference',
    parameters: {
      key: `research/web/${problemHash}`,
      data: researchFindings,
      tags: ['web_research', 'solutions', problemDomain]
    }
  }
};
```

### 5. Research Output Generation

#### Comprehensive Research Report:
```json
{
  "timestamp": "2024-09-08T12:00:00Z",
  "research_query": "User authentication system for multi-tenant SaaS",
  "search_scope": "comprehensive",
  "search_depth": "deep",
  
  "executive_summary": {
    "solutions_found": 12,
    "high_quality_options": 4,
    "recommendation": "Auth0 + custom tenant isolation",
    "confidence": 0.89,
    "time_to_implement": "2-3 weeks"
  },
  
  "top_solutions": [
    {
      "name": "Auth0",
      "type": "commercial_service",
      "url": "https://auth0.com",
      "description": "Enterprise-grade authentication platform with multi-tenant support",
      "quality_score": 0.95,
      "relevance_score": 0.92,
      "pros": [
        "Production-ready multi-tenant support",
        "Extensive documentation and SDKs",
        "Strong security and compliance",
        "Active community and support"
      ],
      "cons": [
        "Commercial licensing costs",
        "Vendor lock-in considerations", 
        "Complex pricing at scale"
      ],
      "technology_stack": ["Node.js", "React", "OAuth 2.0", "OIDC"],
      "integration_complexity": "medium",
      "license": "commercial",
      "community_metrics": {
        "github_stars": 8500,
        "stackoverflow_questions": 12000,
        "documentation_rating": 9.2,
        "support_responsiveness": "excellent"
      }
    },
    {
      "name": "SuperTokens",
      "type": "open_source",
      "url": "https://github.com/supertokens/supertokens-core",
      "description": "Open source Auth0 alternative with self-hosted option",
      "quality_score": 0.87,
      "relevance_score": 0.88,
      "pros": [
        "Open source with commercial support",
        "Multi-tenant architecture built-in",
        "Self-hosted option available",
        "Modern architecture and APIs"
      ],
      "cons": [
        "Smaller community than Auth0",
        "Less mature ecosystem",
        "Documentation gaps in advanced features"
      ],
      "technology_stack": ["Node.js", "React", "Docker", "PostgreSQL"],
      "integration_complexity": "medium-high",
      "license": "Apache 2.0",
      "community_metrics": {
        "github_stars": 4200,
        "recent_commits": 45,
        "contributors": 23,
        "issue_resolution_rate": 0.76
      }
    }
  ],
  
  "alternative_approaches": [
    {
      "approach": "Custom JWT + tenant isolation",
      "complexity": "high",
      "time_estimate": "4-6 weeks",
      "pros": ["Full control", "No vendor dependency"],
      "cons": ["Security risks", "Maintenance burden"],
      "recommendation": "not_recommended"
    }
  ],
  
  "implementation_patterns": [
    {
      "pattern": "Tenant-per-database",
      "description": "Separate database per tenant for maximum isolation",
      "complexity": "high",
      "use_case": "Enterprise customers with strict data requirements"
    },
    {
      "pattern": "Shared-database-with-tenant-id", 
      "description": "Single database with tenant identification in all tables",
      "complexity": "medium",
      "use_case": "Most SaaS applications with moderate scale"
    }
  ],
  
  "security_considerations": [
    "Implement proper tenant isolation at all levels",
    "Regular security audits and penetration testing", 
    "Compliance with SOC2, GDPR, and industry standards",
    "Rate limiting and abuse prevention per tenant"
  ],
  
  "next_steps": {
    "immediate": [
      "Evaluate top 3 solutions with POC implementations",
      "Assess licensing and cost implications",
      "Review security and compliance requirements"
    ],
    "follow_up_research": [
      "/research:github 'supertokens multi-tenant setup'",
      "/research:models 'authentication AI fraud detection'",
      "/research:deep 'SaaS tenant isolation best practices'"
    ]
  },
  
  "metadata": {
    "search_queries_used": [
      "multi-tenant authentication SaaS",
      "open source Auth0 alternative", 
      "tenant isolation patterns",
      "SaaS authentication best practices"
    ],
    "sources_consulted": 47,
    "content_pages_analyzed": 23,
    "research_duration_minutes": 18,
    "confidence_factors": {
      "source_diversity": 0.91,
      "information_recency": 0.87,
      "cross_validation": 0.93
    }
  }
}
```

## Integration Points

### Used by:
- Research workflow as primary external solution discovery
- `/research:analyze` for Gemini large-context analysis of findings
- `/research:github` for detailed repository analysis of promising solutions
- Memory MCP for persistent research knowledge base

### Produces:
- `research-web.json` - Comprehensive web research results
- Solution recommendations with quality scoring
- Implementation pattern guidance
- Security and compliance considerations

### Consumes:
- Problem description and requirements
- Domain context and technical constraints
- Previous research findings from Memory MCP
- User preferences and organizational constraints

## Advanced Features

### 1. Intelligent Query Expansion
- Automatic synonym generation and technical term identification
- Domain-specific query optimization
- Multi-language search support for global solutions

### 2. Quality Signal Detection
- GitHub repository health analysis
- Community engagement metrics
- Documentation quality assessment
- Security vulnerability scanning

### 3. Trend Analysis
- Solution popularity trends over time
- Technology adoption patterns
- Community momentum indicators
- Future viability assessment

### 4. Cost-Benefit Analysis
- Implementation time estimates
- Licensing cost projections
- Maintenance burden assessment
- ROI calculations for different approaches

## Examples

### Simple Feature Research:
```bash
/research:web 'user profile management with avatar upload'
```

### Complex System Research:
```bash
/research:web 'distributed task queue with failure recovery' comprehensive deep
```

### Domain-Specific Research:
```bash
/research:web 'HIPAA compliant file storage system' specific comprehensive
```

## Error Handling & Limitations

### Rate Limiting Management:
- Implement respectful crawling with delays
- Rotate search APIs to avoid quotas
- Cache results to minimize redundant requests

### Content Quality Filtering:
- Filter out low-quality or spam content
- Verify source authenticity and credibility
- Handle paywall and access-restricted content gracefully

### Research Scope Management:
- Balance depth vs. breadth based on scope parameter
- Time-bound research sessions to prevent endless exploration
- Focus on actionable solutions rather than theoretical discussions

This command transforms the traditional "build it from scratch" mindset into "research first, then decide" approach, dramatically improving development efficiency and solution quality.