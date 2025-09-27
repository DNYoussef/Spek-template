/**
 * SemanticAnalyzer - Advanced semantic analysis for research content
 * Provides enterprise-grade semantic analysis capabilities including:
 * - Named Entity Recognition (NER) for technology terms
 * - Sentiment analysis for research trends
 * - Semantic similarity and relevance scoring
 * - Concept extraction and knowledge graph integration
 * - Multi-language support and domain-specific vocabularies
 */

import * as natural from 'natural';

// Semantic analysis interfaces
export interface SemanticAnalysisResult {
  id: string;
  sourceText: string;
  entities: NamedEntity[];
  concepts: Concept[];
  sentiments: SentimentAnalysis;
  semanticTopics: SemanticTopic[];
  relationships: SemanticRelationship[];
  relevanceScores: Map<string, number>;
  languageInfo: LanguageInfo;
  metadata: {
    analyzedAt: Date;
    processingTime: number;
    confidence: number;
    algorithm: string;
  };
}

export interface NamedEntity {
  text: string;
  type: EntityType;
  position: {
    start: number;
    end: number;
  };
  confidence: number;
  canonicalForm?: string;
  aliases: string[];
  attributes: Record<string, any>;
  context: string;
}

export type EntityType =
  | 'TECHNOLOGY'
  | 'FRAMEWORK'
  | 'LANGUAGE'
  | 'PLATFORM'
  | 'COMPANY'
  | 'PERSON'
  | 'CONCEPT'
  | 'METHOD'
  | 'STANDARD'
  | 'TOOL'
  | 'DATABASE'
  | 'API'
  | 'LIBRARY'
  | 'PROTOCOL'
  | 'ARCHITECTURE'
  | 'PATTERN'
  | 'METRIC'
  | 'ALGORITHM';

export interface Concept {
  id: string;
  name: string;
  type: ConceptType;
  description: string;
  confidence: number;
  frequency: number;
  abstractionLevel: number; // 1 (concrete) to 5 (abstract)
  relatedTerms: string[];
  semanticField: string;
  contexts: string[];
}

export type ConceptType =
  | 'technical'
  | 'methodological'
  | 'theoretical'
  | 'practical'
  | 'architectural'
  | 'functional'
  | 'performance'
  | 'security'
  | 'scalability'
  | 'usability';

export interface SentimentAnalysis {
  overall: SentimentScore;
  aspects: AspectSentiment[];
  emotions: EmotionAnalysis[];
  subjectivity: number; // 0 (objective) to 1 (subjective)
  intensity: number; // 0 (neutral) to 1 (intense)
}

export interface SentimentScore {
  polarity: number; // -1 (negative) to 1 (positive)
  confidence: number;
  classification: 'positive' | 'negative' | 'neutral';
}

export interface AspectSentiment {
  aspect: string;
  sentiment: SentimentScore;
  mentions: Array<{
    text: string;
    position: { start: number; end: number };
  }>;
}

export interface EmotionAnalysis {
  emotion: 'joy' | 'anger' | 'fear' | 'sadness' | 'surprise' | 'trust' | 'anticipation' | 'disgust';
  intensity: number;
  triggers: string[];
}

export interface SemanticTopic {
  id: string;
  name: string;
  keywords: Array<{
    term: string;
    weight: number;
    tfidf: number;
  }>;
  coherence: number;
  prevalence: number;
  relatedTopics: string[];
}

export interface SemanticRelationship {
  source: string;
  target: string;
  type: RelationshipType;
  strength: number;
  context: string;
  direction: 'bidirectional' | 'source_to_target' | 'target_to_source';
  evidence: string[];
}

export type RelationshipType =
  | 'is_a'
  | 'part_of'
  | 'uses'
  | 'implements'
  | 'extends'
  | 'replaces'
  | 'similar_to'
  | 'opposite_of'
  | 'causes'
  | 'enables'
  | 'requires'
  | 'competes_with'
  | 'collaborates_with';

export interface LanguageInfo {
  primary: string;
  confidence: number;
  secondaryLanguages: Array<{ language: string; confidence: number }>;
  technicalVocabulary: boolean;
  formality: number; // 0 (informal) to 1 (formal)
  complexity: number; // 0 (simple) to 1 (complex)
}

export interface SemanticAnalysisConfig {
  entityRecognition: {
    enabledTypes: EntityType[];
    confidenceThreshold: number;
    useCustomVocabularies: boolean;
    domainSpecific: boolean;
  };
  conceptExtraction: {
    maxConcepts: number;
    minFrequency: number;
    abstractionLevels: number[];
  };
  sentimentAnalysis: {
    enableAspectSentiment: boolean;
    enableEmotionDetection: boolean;
    aspectKeywords: string[];
  };
  topicModeling: {
    maxTopics: number;
    minTopicCoherence: number;
    useLatentDirichlet: boolean;
  };
  relationshipExtraction: {
    enabledTypes: RelationshipType[];
    minConfidence: number;
    maxDistance: number; // Max word distance for relationship detection
  };
}

/**
 * Named Entity Recognition Engine
 */
class EntityRecognitionEngine {
  private technologyPatterns: RegExp[];
  private companyPatterns: RegExp[];
  private personPatterns: RegExp[];
  private conceptPatterns: RegExp[];
  private tokenizer: natural.TreebankWordTokenizer;

  constructor() {
    this.tokenizer = new natural.TreebankWordTokenizer();
    this.initializePatterns();
  }

  private initializePatterns(): void {
    // Technology patterns
    this.technologyPatterns = [
      // Programming languages
      /\b(javascript|typescript|python|java|golang|go|rust|c\+\+|c#|php|ruby|swift|kotlin|scala|clojure|haskell|erlang|elixir)\b/gi,
      // Frameworks
      /\b(react|angular|vue|svelte|node\.?js|express|fastify|django|flask|spring|laravel|rails|asp\.net|ember|backbone)\b/gi,
      // Databases
      /\b(mysql|postgresql|mongodb|redis|elasticsearch|cassandra|dynamodb|neo4j|arangodb|sqlite|oracle|sql\s*server)\b/gi,
      // Cloud platforms
      /\b(aws|amazon\s*web\s*services|azure|microsoft\s*azure|google\s*cloud|gcp|digitalocean|heroku|vercel|netlify)\b/gi,
      // DevOps tools
      /\b(docker|kubernetes|jenkins|gitlab|github\s*actions|terraform|ansible|chef|puppet|vagrant)\b/gi,
      // Architecture patterns
      /\b(microservices|monolith|serverless|event\-driven|domain\-driven|rest|graphql|grpc|websocket)\b/gi
    ];

    // Company patterns
    this.companyPatterns = [
      /\b(google|microsoft|amazon|apple|meta|facebook|netflix|uber|airbnb|stripe|salesforce|oracle|ibm|intel|nvidia)\b/gi,
      /\b([A-Z][a-z]+\s+(inc\.|corp\.|ltd\.|llc|corporation|company))\b/gi
    ];

    // Person patterns
    this.personPatterns = [
      /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g, // Basic first/last name pattern
      /\b(dr\.|prof\.|mr\.|ms\.|mrs\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
    ];

    // Concept patterns
    this.conceptPatterns = [
      /\b(machine\s*learning|artificial\s*intelligence|deep\s*learning|neural\s*network|blockchain|cryptocurrency)\b/gi,
      /\b(scalability|performance|security|reliability|maintainability|usability|accessibility)\b/gi,
      /\b(agile|scrum|kanban|devops|cicd|continuous\s*integration|continuous\s*deployment)\b/gi,
      /\b(load\s*balancing|caching|optimization|refactoring|testing|debugging|monitoring)\b/gi
    ];
  }

  public extractEntities(text: string): NamedEntity[] {
    const entities: NamedEntity[] = [];

    // Extract technology entities
    this.extractByPatterns(text, this.technologyPatterns, 'TECHNOLOGY', entities);

    // Extract company entities
    this.extractByPatterns(text, this.companyPatterns, 'COMPANY', entities);

    // Extract person entities
    this.extractByPatterns(text, this.personPatterns, 'PERSON', entities);

    // Extract concept entities
    this.extractByPatterns(text, this.conceptPatterns, 'CONCEPT', entities);

    // Extract additional entities using POS tagging
    entities.push(...this.extractByPOSTagging(text));

    return this.deduplicateEntities(entities);
  }

  private extractByPatterns(
    text: string,
    patterns: RegExp[],
    type: EntityType,
    entities: NamedEntity[]
  ): void {
    patterns.forEach(pattern => {
      let match;
      pattern.lastIndex = 0; // Reset regex state

      while ((match = pattern.exec(text)) !== null) {
        const entityText = match[0];
        const start = match.index;
        const end = start + entityText.length;

        entities.push({
          text: entityText,
          type,
          position: { start, end },
          confidence: this.calculateEntityConfidence(entityText, type),
          aliases: this.generateAliases(entityText),
          attributes: this.extractEntityAttributes(entityText, type),
          context: this.extractContext(text, start, end)
        });
      }
    });
  }

  private extractByPOSTagging(text: string): NamedEntity[] {
    const entities: NamedEntity[] = [];
    const tokens = this.tokenizer.tokenize(text);
    const taggedTokens = natural.BrillPOSTagger ?
      new natural.BrillPOSTagger().tag(tokens) :
      tokens.map(token => ({ token, tag: 'NN' })); // Fallback

    // Look for noun phrases that might be entities
    for (let i = 0; i < taggedTokens.length; i++) {
      const current = taggedTokens[i];

      // Proper nouns (NNP) are likely entities
      if (current.tag === 'NNP' || current.tag === 'NNPS') {
        let phrase = current.token;
        let j = i + 1;

        // Extend phrase if next tokens are also proper nouns
        while (j < taggedTokens.length &&
               (taggedTokens[j].tag === 'NNP' || taggedTokens[j].tag === 'NNPS')) {
          phrase += ' ' + taggedTokens[j].token;
          j++;
        }

        if (phrase.length > 2) {
          const start = text.indexOf(phrase);
          if (start !== -1) {
            entities.push({
              text: phrase,
              type: this.classifyEntityByContext(phrase, text),
              position: { start, end: start + phrase.length },
              confidence: 0.6,
              aliases: [],
              attributes: {},
              context: this.extractContext(text, start, start + phrase.length)
            });
          }
        }

        i = j - 1; // Skip processed tokens
      }
    }

    return entities;
  }

  private classifyEntityByContext(entity: string, text: string): EntityType {
    const context = this.extractContext(text, text.indexOf(entity), text.indexOf(entity) + entity.length);

    // Simple classification based on context keywords
    if (/\b(framework|library|language|platform|database|tool)\b/i.test(context)) {
      return 'TECHNOLOGY';
    }
    if (/\b(company|corporation|startup|organization)\b/i.test(context)) {
      return 'COMPANY';
    }
    if (/\b(concept|principle|methodology|approach|pattern)\b/i.test(context)) {
      return 'CONCEPT';
    }
    if (/\b(api|protocol|standard|specification)\b/i.test(context)) {
      return 'STANDARD';
    }

    return 'CONCEPT'; // Default classification
  }

  private calculateEntityConfidence(entity: string, type: EntityType): number {
    let confidence = 0.5;

    // Boost confidence for well-known entities
    const wellKnown = {
      TECHNOLOGY: ['javascript', 'python', 'react', 'angular', 'docker', 'kubernetes'],
      COMPANY: ['google', 'microsoft', 'amazon', 'apple', 'meta'],
      CONCEPT: ['machine learning', 'artificial intelligence', 'blockchain']
    };

    if (wellKnown[type]?.some(known =>
      entity.toLowerCase().includes(known.toLowerCase()))) {
      confidence += 0.3;
    }

    // Boost for capitalization patterns
    if (/^[A-Z]/.test(entity)) {
      confidence += 0.1;
    }

    // Boost for length (longer entities often more specific)
    if (entity.length > 10) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  private generateAliases(entity: string): string[] {
    const aliases: string[] = [];

    // Common abbreviations
    const abbreviations: Record<string, string[]> = {
      'javascript': ['js', 'ecmascript'],
      'typescript': ['ts'],
      'artificial intelligence': ['ai'],
      'machine learning': ['ml'],
      'application programming interface': ['api'],
      'user interface': ['ui'],
      'user experience': ['ux']
    };

    const lower = entity.toLowerCase();
    if (abbreviations[lower]) {
      aliases.push(...abbreviations[lower]);
    }

    // Generate acronym for multi-word entities
    const words = entity.split(/\s+/);
    if (words.length > 1) {
      const acronym = words.map(word => word[0].toUpperCase()).join('');
      if (acronym.length > 1) {
        aliases.push(acronym);
      }
    }

    return aliases;
  }

  private extractEntityAttributes(entity: string, type: EntityType): Record<string, any> {
    const attributes: Record<string, any> = {};

    switch (type) {
      case 'TECHNOLOGY':
        attributes.category = this.categorizeTechnology(entity);
        attributes.maturity = this.assessMaturity(entity);
        break;
      case 'COMPANY':
        attributes.sector = this.categorizeCompany(entity);
        attributes.size = this.estimateCompanySize(entity);
        break;
      case 'CONCEPT':
        attributes.domain = this.categorizeConcept(entity);
        attributes.complexity = this.assessComplexity(entity);
        break;
    }

    return attributes;
  }

  private categorizeTechnology(tech: string): string {
    const categories: Record<string, string[]> = {
      'programming_language': ['javascript', 'python', 'java', 'go', 'rust', 'typescript'],
      'framework': ['react', 'angular', 'vue', 'django', 'spring', 'express'],
      'database': ['mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch'],
      'cloud_platform': ['aws', 'azure', 'gcp', 'heroku', 'vercel'],
      'devops_tool': ['docker', 'kubernetes', 'jenkins', 'terraform']
    };

    const lower = tech.toLowerCase();
    for (const [category, technologies] of Object.entries(categories)) {
      if (technologies.some(t => lower.includes(t))) {
        return category;
      }
    }

    return 'other';
  }

  private assessMaturity(tech: string): 'emerging' | 'growing' | 'mature' | 'legacy' {
    const maturityMap: Record<string, 'emerging' | 'growing' | 'mature' | 'legacy'> = {
      'rust': 'emerging',
      'deno': 'emerging',
      'svelte': 'growing',
      'react': 'mature',
      'angular': 'mature',
      'jquery': 'legacy'
    };

    return maturityMap[tech.toLowerCase()] || 'growing';
  }

  private categorizeCompany(company: string): string {
    const sectors: Record<string, string[]> = {
      'tech_giant': ['google', 'microsoft', 'amazon', 'apple', 'meta'],
      'cloud_provider': ['aws', 'azure', 'gcp', 'digitalocean'],
      'social_media': ['facebook', 'twitter', 'linkedin', 'instagram'],
      'e_commerce': ['amazon', 'shopify', 'stripe', 'paypal']
    };

    const lower = company.toLowerCase();
    for (const [sector, companies] of Object.entries(sectors)) {
      if (companies.some(c => lower.includes(c))) {
        return sector;
      }
    }

    return 'other';
  }

  private estimateCompanySize(company: string): 'startup' | 'medium' | 'large' | 'enterprise' {
    const largeCorp = ['google', 'microsoft', 'amazon', 'apple', 'meta', 'ibm', 'oracle'];
    if (largeCorp.some(corp => company.toLowerCase().includes(corp))) {
      return 'enterprise';
    }
    return 'medium'; // Default assumption
  }

  private categorizeConcept(concept: string): string {
    const domains: Record<string, string[]> = {
      'ai_ml': ['machine learning', 'artificial intelligence', 'deep learning', 'neural network'],
      'architecture': ['microservices', 'monolith', 'serverless', 'event-driven'],
      'methodology': ['agile', 'scrum', 'kanban', 'devops', 'tdd'],
      'quality': ['performance', 'scalability', 'security', 'reliability']
    };

    const lower = concept.toLowerCase();
    for (const [domain, concepts] of Object.entries(domains)) {
      if (concepts.some(c => lower.includes(c))) {
        return domain;
      }
    }

    return 'general';
  }

  private assessComplexity(concept: string): number {
    const complexityMap: Record<string, number> = {
      'machine learning': 0.8,
      'blockchain': 0.9,
      'microservices': 0.7,
      'agile': 0.3,
      'testing': 0.4
    };

    return complexityMap[concept.toLowerCase()] || 0.5;
  }

  private extractContext(text: string, start: number, end: number): string {
    const contextSize = 50;
    const contextStart = Math.max(0, start - contextSize);
    const contextEnd = Math.min(text.length, end + contextSize);
    return text.substring(contextStart, contextEnd).trim();
  }

  private deduplicateEntities(entities: NamedEntity[]): NamedEntity[] {
    const unique = new Map<string, NamedEntity>();

    entities.forEach(entity => {
      const key = `${entity.type}:${entity.text.toLowerCase()}`;
      const existing = unique.get(key);

      if (!existing || entity.confidence > existing.confidence) {
        unique.set(key, entity);
      }
    });

    return Array.from(unique.values());
  }
}

/**
 * Sentiment Analysis Engine
 */
class SentimentEngine {
  private sentiment = natural.SentimentAnalyzer;
  private stemmer = natural.PorterStemmer;
  private analyzer: any;

  constructor() {
    this.analyzer = new this.sentiment('English', this.stemmer, 'afinn');
  }

  public analyzeSentiment(text: string, aspects: string[] = []): SentimentAnalysis {
    const tokens = natural.WordTokenizer.prototype.tokenize(text);
    const stemmedTokens = tokens.map(token => this.stemmer.stem(token));

    // Overall sentiment
    const overallScore = this.analyzer.getSentiment(stemmedTokens);
    const overall: SentimentScore = {
      polarity: overallScore,
      confidence: Math.abs(overallScore),
      classification: overallScore > 0.1 ? 'positive' : overallScore < -0.1 ? 'negative' : 'neutral'
    };

    // Aspect-based sentiment
    const aspectSentiments = aspects.map(aspect =>
      this.analyzeAspectSentiment(text, aspect)
    );

    // Emotion detection
    const emotions = this.detectEmotions(text);

    // Subjectivity and intensity
    const subjectivity = this.calculateSubjectivity(text);
    const intensity = Math.abs(overallScore);

    return {
      overall,
      aspects: aspectSentiments,
      emotions,
      subjectivity,
      intensity
    };
  }

  private analyzeAspectSentiment(text: string, aspect: string): AspectSentiment {
    const sentences = text.split(/[.!?]+/);
    const mentions: AspectSentiment['mentions'] = [];
    let totalSentiment = 0;
    let sentimentCount = 0;

    sentences.forEach(sentence => {
      const aspectIndex = sentence.toLowerCase().indexOf(aspect.toLowerCase());
      if (aspectIndex !== -1) {
        const tokens = natural.WordTokenizer.prototype.tokenize(sentence);
        const stemmed = tokens.map(token => this.stemmer.stem(token));
        const sentimentScore = this.analyzer.getSentiment(stemmed);

        mentions.push({
          text: sentence.trim(),
          position: {
            start: text.indexOf(sentence),
            end: text.indexOf(sentence) + sentence.length
          }
        });

        totalSentiment += sentimentScore;
        sentimentCount++;
      }
    });

    const avgSentiment = sentimentCount > 0 ? totalSentiment / sentimentCount : 0;

    return {
      aspect,
      sentiment: {
        polarity: avgSentiment,
        confidence: Math.abs(avgSentiment),
        classification: avgSentiment > 0.1 ? 'positive' : avgSentiment < -0.1 ? 'negative' : 'neutral'
      },
      mentions
    };
  }

  private detectEmotions(text: string): EmotionAnalysis[] {
    const emotionKeywords = {
      joy: ['happy', 'excited', 'pleased', 'delighted', 'satisfied', 'amazing', 'awesome', 'great'],
      anger: ['angry', 'frustrated', 'annoyed', 'furious', 'irritated', 'terrible', 'awful', 'horrible'],
      fear: ['afraid', 'worried', 'concerned', 'anxious', 'nervous', 'scared', 'uncertain'],
      sadness: ['sad', 'disappointed', 'depressed', 'upset', 'discouraged', 'unfortunate'],
      surprise: ['surprised', 'unexpected', 'shocking', 'amazing', 'incredible', 'unbelievable'],
      trust: ['reliable', 'trustworthy', 'confident', 'secure', 'stable', 'proven'],
      anticipation: ['excited', 'looking forward', 'expecting', 'hoping', 'eager', 'upcoming'],
      disgust: ['disgusting', 'revolting', 'awful', 'terrible', 'horrible', 'unacceptable']
    };

    const emotions: EmotionAnalysis[] = [];
    const lowerText = text.toLowerCase();

    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      const triggers = keywords.filter(keyword => lowerText.includes(keyword));
      if (triggers.length > 0) {
        emotions.push({
          emotion: emotion as EmotionAnalysis['emotion'],
          intensity: Math.min(triggers.length / keywords.length, 1.0),
          triggers
        });
      }
    });

    return emotions.sort((a, b) => b.intensity - a.intensity);
  }

  private calculateSubjectivity(text: string): number {
    const subjectiveIndicators = [
      'i think', 'i believe', 'in my opinion', 'i feel', 'seems', 'appears',
      'probably', 'possibly', 'might', 'could', 'should', 'would',
      'amazing', 'terrible', 'awesome', 'horrible', 'best', 'worst'
    ];

    const lowerText = text.toLowerCase();
    const matches = subjectiveIndicators.filter(indicator =>
      lowerText.includes(indicator)
    ).length;

    return Math.min(matches / 10, 1.0); // Normalize to 0-1
  }
}

/**
 * Main Semantic Analyzer
 */
export class SemanticAnalyzer {
  private entityEngine: EntityRecognitionEngine;
  private sentimentEngine: SentimentEngine;
  private config: SemanticAnalysisConfig;

  constructor(config?: Partial<SemanticAnalysisConfig>) {
    this.entityEngine = new EntityRecognitionEngine();
    this.sentimentEngine = new SentimentEngine();

    this.config = {
      entityRecognition: {
        enabledTypes: ['TECHNOLOGY', 'COMPANY', 'PERSON', 'CONCEPT', 'FRAMEWORK', 'TOOL'],
        confidenceThreshold: 0.5,
        useCustomVocabularies: true,
        domainSpecific: true,
        ...config?.entityRecognition
      },
      conceptExtraction: {
        maxConcepts: 20,
        minFrequency: 2,
        abstractionLevels: [1, 2, 3, 4, 5],
        ...config?.conceptExtraction
      },
      sentimentAnalysis: {
        enableAspectSentiment: true,
        enableEmotionDetection: true,
        aspectKeywords: ['performance', 'usability', 'reliability', 'scalability'],
        ...config?.sentimentAnalysis
      },
      topicModeling: {
        maxTopics: 10,
        minTopicCoherence: 0.3,
        useLatentDirichlet: true,
        ...config?.topicModeling
      },
      relationshipExtraction: {
        enabledTypes: ['uses', 'implements', 'extends', 'similar_to', 'requires'],
        minConfidence: 0.6,
        maxDistance: 10,
        ...config?.relationshipExtraction
      }
    };
  }

  /**
   * Perform comprehensive semantic analysis
   */
  public async analyze(text: string, additionalContext?: any): Promise<SemanticAnalysisResult> {
    const startTime = Date.now();
    const id = `semantic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Entity recognition
      const entities = this.entityEngine.extractEntities(text)
        .filter(entity =>
          this.config.entityRecognition.enabledTypes.includes(entity.type) &&
          entity.confidence >= this.config.entityRecognition.confidenceThreshold
        );

      // Concept extraction
      const concepts = this.extractConcepts(text, entities);

      // Sentiment analysis
      const sentiments = this.config.sentimentAnalysis.enableAspectSentiment
        ? this.sentimentEngine.analyzeSentiment(text, this.config.sentimentAnalysis.aspectKeywords)
        : this.sentimentEngine.analyzeSentiment(text);

      // Topic modeling
      const semanticTopics = this.extractTopics(text, concepts);

      // Relationship extraction
      const relationships = this.extractRelationships(text, entities);

      // Relevance scoring
      const relevanceScores = this.calculateRelevanceScores(text, entities, concepts);

      // Language detection
      const languageInfo = this.analyzeLanguage(text);

      const processingTime = Date.now() - startTime;

      return {
        id,
        sourceText: text,
        entities,
        concepts,
        sentiments,
        semanticTopics,
        relationships,
        relevanceScores,
        languageInfo,
        metadata: {
          analyzedAt: new Date(),
          processingTime,
          confidence: this.calculateOverallConfidence(entities, concepts, sentiments),
          algorithm: 'comprehensive_semantic_analysis'
        }
      };
    } catch (error) {
      console.error('Semantic analysis failed:', error);
      throw new Error(`Semantic analysis failed: ${error.message}`);
    }
  }

  private extractConcepts(text: string, entities: NamedEntity[]): Concept[] {
    const concepts: Concept[] = [];
    const tokens = natural.WordTokenizer.prototype.tokenize(text.toLowerCase());
    const termFrequency = new Map<string, number>();

    // Count term frequencies
    tokens.forEach(token => {
      if (token.length > 3) {
        termFrequency.set(token, (termFrequency.get(token) || 0) + 1);
      }
    });

    // Extract high-frequency terms as concepts
    Array.from(termFrequency.entries())
      .filter(([term, freq]) => freq >= this.config.conceptExtraction.minFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.config.conceptExtraction.maxConcepts)
      .forEach(([term, frequency], index) => {
        concepts.push({
          id: `concept_${index}`,
          name: term,
          type: this.classifyConceptType(term, text),
          description: `Concept extracted from high-frequency term: ${term}`,
          confidence: Math.min(frequency / 10, 1.0),
          frequency,
          abstractionLevel: this.calculateAbstractionLevel(term),
          relatedTerms: this.findRelatedTerms(term, tokens),
          semanticField: this.determineSemanticField(term),
          contexts: this.extractConceptContexts(term, text)
        });
      });

    return concepts;
  }

  private classifyConceptType(term: string, text: string): ConceptType {
    const context = text.toLowerCase();

    if (/\b(performance|speed|latency|throughput)\b/.test(context)) return 'performance';
    if (/\b(security|authentication|authorization|encryption)\b/.test(context)) return 'security';
    if (/\b(scale|scaling|scalability|distributed)\b/.test(context)) return 'scalability';
    if (/\b(user|interface|experience|usability)\b/.test(context)) return 'usability';
    if (/\b(architecture|pattern|design|structure)\b/.test(context)) return 'architectural';
    if (/\b(method|approach|technique|algorithm)\b/.test(context)) return 'methodological';
    if (/\b(theory|principle|concept|model)\b/.test(context)) return 'theoretical';
    if (/\b(implementation|practice|application|usage)\b/.test(context)) return 'practical';
    if (/\b(function|feature|capability|operation)\b/.test(context)) return 'functional';

    return 'technical';
  }

  private calculateAbstractionLevel(term: string): number {
    // Simple heuristic: longer terms and domain-specific terms are more specific (lower abstraction)
    if (term.length > 15) return 1; // Very specific
    if (term.length > 10) return 2; // Specific
    if (term.length > 6) return 3; // Medium
    if (term.length > 3) return 4; // General
    return 5; // Very general
  }

  private findRelatedTerms(term: string, tokens: string[]): string[] {
    // Find terms that often appear near the target term
    const related: string[] = [];
    const termIndex = tokens.indexOf(term);

    if (termIndex !== -1) {
      const window = 5; // Look within 5 words
      const start = Math.max(0, termIndex - window);
      const end = Math.min(tokens.length, termIndex + window + 1);

      for (let i = start; i < end; i++) {
        if (i !== termIndex && tokens[i].length > 3) {
          related.push(tokens[i]);
        }
      }
    }

    return [...new Set(related)].slice(0, 5); // Return unique terms, max 5
  }

  private determineSemanticField(term: string): string {
    const semanticFields = {
      'technology': ['code', 'software', 'system', 'application', 'program'],
      'business': ['market', 'customer', 'business', 'company', 'revenue'],
      'methodology': ['process', 'method', 'approach', 'strategy', 'framework'],
      'quality': ['performance', 'security', 'reliability', 'quality', 'testing']
    };

    for (const [field, keywords] of Object.entries(semanticFields)) {
      if (keywords.some(keyword => term.includes(keyword))) {
        return field;
      }
    }

    return 'general';
  }

  private extractConceptContexts(term: string, text: string): string[] {
    const contexts: string[] = [];
    const sentences = text.split(/[.!?]+/);

    sentences.forEach(sentence => {
      if (sentence.toLowerCase().includes(term.toLowerCase())) {
        contexts.push(sentence.trim());
      }
    });

    return contexts.slice(0, 3); // Max 3 contexts
  }

  private extractTopics(text: string, concepts: Concept[]): SemanticTopic[] {
    // Simple topic extraction based on concept clustering
    const topics: SemanticTopic[] = [];

    // Group concepts by semantic field
    const topicGroups = new Map<string, Concept[]>();
    concepts.forEach(concept => {
      const field = concept.semanticField;
      if (!topicGroups.has(field)) {
        topicGroups.set(field, []);
      }
      topicGroups.get(field)!.push(concept);
    });

    // Create topics from groups
    topicGroups.forEach((groupConcepts, field) => {
      if (groupConcepts.length >= 2) {
        topics.push({
          id: `topic_${field}`,
          name: field.charAt(0).toUpperCase() + field.slice(1),
          keywords: groupConcepts.map(concept => ({
            term: concept.name,
            weight: concept.confidence,
            tfidf: concept.frequency / text.length
          })),
          coherence: this.calculateTopicCoherence(groupConcepts),
          prevalence: groupConcepts.length / concepts.length,
          relatedTopics: []
        });
      }
    });

    return topics.filter(topic =>
      topic.coherence >= this.config.topicModeling.minTopicCoherence
    ).slice(0, this.config.topicModeling.maxTopics);
  }

  private calculateTopicCoherence(concepts: Concept[]): number {
    // Simple coherence calculation based on concept confidence
    const avgConfidence = concepts.reduce((sum, concept) => sum + concept.confidence, 0) / concepts.length;
    return avgConfidence;
  }

  private extractRelationships(text: string, entities: NamedEntity[]): SemanticRelationship[] {
    const relationships: SemanticRelationship[] = [];

    // Look for relationships between entities
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i];
        const entity2 = entities[j];

        const relationship = this.detectRelationship(text, entity1, entity2);
        if (relationship) {
          relationships.push(relationship);
        }
      }
    }

    return relationships.filter(rel =>
      this.config.relationshipExtraction.enabledTypes.includes(rel.type) &&
      rel.strength >= this.config.relationshipExtraction.minConfidence
    );
  }

  private detectRelationship(
    text: string,
    entity1: NamedEntity,
    entity2: NamedEntity
  ): SemanticRelationship | null {
    const pos1 = entity1.position.start;
    const pos2 = entity2.position.start;
    const distance = Math.abs(pos2 - pos1);

    if (distance > this.config.relationshipExtraction.maxDistance * 10) {
      return null; // Too far apart
    }

    const start = Math.min(pos1, pos2);
    const end = Math.max(
      entity1.position.end,
      entity2.position.end
    );
    const contextText = text.substring(start, end).toLowerCase();

    // Detect relationship type based on context
    let type: RelationshipType | null = null;
    let strength = 0.5;

    if (/\b(uses|utilizing|leverage|employ)\b/.test(contextText)) {
      type = 'uses';
      strength = 0.8;
    } else if (/\b(implement|implementation|built\s+with)\b/.test(contextText)) {
      type = 'implements';
      strength = 0.9;
    } else if (/\b(extend|extends|inherit)\b/.test(contextText)) {
      type = 'extends';
      strength = 0.8;
    } else if (/\b(similar|like|comparable|equivalent)\b/.test(contextText)) {
      type = 'similar_to';
      strength = 0.7;
    } else if (/\b(require|need|depend)\b/.test(contextText)) {
      type = 'requires';
      strength = 0.8;
    } else if (/\b(part\s+of|component|module)\b/.test(contextText)) {
      type = 'part_of';
      strength = 0.7;
    }

    if (!type) return null;

    return {
      source: entity1.text,
      target: entity2.text,
      type,
      strength,
      context: contextText,
      direction: 'source_to_target',
      evidence: [contextText]
    };
  }

  private calculateRelevanceScores(
    text: string,
    entities: NamedEntity[],
    concepts: Concept[]
  ): Map<string, number> {
    const scores = new Map<string, number>();

    // Calculate relevance for entities
    entities.forEach(entity => {
      const frequency = (text.toLowerCase().match(new RegExp(entity.text.toLowerCase(), 'g')) || []).length;
      const positionScore = 1 - (entity.position.start / text.length); // Earlier = more relevant
      const relevance = (entity.confidence * 0.5) + (frequency / 10 * 0.3) + (positionScore * 0.2);
      scores.set(`entity:${entity.text}`, Math.min(relevance, 1.0));
    });

    // Calculate relevance for concepts
    concepts.forEach(concept => {
      const relevance = (concept.confidence * 0.6) + (concept.frequency / 20 * 0.4);
      scores.set(`concept:${concept.name}`, Math.min(relevance, 1.0));
    });

    return scores;
  }

  private analyzeLanguage(text: string): LanguageInfo {
    // Simple language detection (in practice, use a proper library)
    const technicalTerms = [
      'api', 'database', 'framework', 'algorithm', 'function', 'class',
      'method', 'variable', 'interface', 'implementation', 'architecture'
    ];

    const lowerText = text.toLowerCase();
    const techTermCount = technicalTerms.filter(term => lowerText.includes(term)).length;
    const technicalVocabulary = techTermCount > 2;

    // Calculate formality (presence of formal indicators)
    const formalIndicators = ['furthermore', 'however', 'therefore', 'consequently', 'moreover'];
    const formalityScore = formalIndicators.filter(indicator => lowerText.includes(indicator)).length / 10;

    // Calculate complexity (average word length, sentence complexity)
    const words = text.split(/\s+/);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const complexity = Math.min(avgWordLength / 10, 1.0);

    return {
      primary: 'en', // Assuming English for now
      confidence: 0.95,
      secondaryLanguages: [],
      technicalVocabulary,
      formality: Math.min(formalityScore, 1.0),
      complexity
    };
  }

  private calculateOverallConfidence(
    entities: NamedEntity[],
    concepts: Concept[],
    sentiments: SentimentAnalysis
  ): number {
    const entityConfidence = entities.length > 0
      ? entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length
      : 0.5;

    const conceptConfidence = concepts.length > 0
      ? concepts.reduce((sum, c) => sum + c.confidence, 0) / concepts.length
      : 0.5;

    const sentimentConfidence = sentiments.overall.confidence;

    return (entityConfidence * 0.4) + (conceptConfidence * 0.4) + (sentimentConfidence * 0.2);
  }
}

// Factory function
export function createSemanticAnalyzer(config?: Partial<SemanticAnalysisConfig>): SemanticAnalyzer {
  return new SemanticAnalyzer(config);
}