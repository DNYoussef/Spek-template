# /research:models

## Purpose
Research and analyze AI models on HuggingFace Hub to find specialized, open-source models for AI integration needs. Prioritizes small, efficient models that are production-ready, focusing on specific use cases rather than general-purpose large language models.

## Usage
/research:models '<ai_task_description>' [model_size=small|medium|large] [deployment_target=edge|cloud|hybrid]

## Implementation

### 1. AI Task Classification and Model Discovery

#### Task Classification Framework:
```javascript
const AI_TASK_TAXONOMY = {
  natural_language: {
    tasks: [
      'text_classification',
      'named_entity_recognition', 
      'sentiment_analysis',
      'text_summarization',
      'question_answering',
      'text_generation',
      'language_detection',
      'text_similarity'
    ],
    model_architectures: ['BERT', 'RoBERTa', 'DistilBERT', 'T5', 'GPT-2']
  },
  
  computer_vision: {
    tasks: [
      'image_classification',
      'object_detection',
      'semantic_segmentation',
      'face_recognition',
      'optical_character_recognition',
      'image_generation',
      'image_enhancement',
      'medical_imaging'
    ],
    model_architectures: ['ResNet', 'EfficientNet', 'YOLO', 'ViT', 'CLIP']
  },
  
  audio_processing: {
    tasks: [
      'speech_to_text',
      'text_to_speech',
      'audio_classification',
      'music_generation',
      'noise_reduction',
      'speaker_identification',
      'emotion_recognition'
    ],
    model_architectures: ['Wav2Vec2', 'Whisper', 'Tacotron', 'WaveNet']
  },
  
  time_series: {
    tasks: [
      'forecasting',
      'anomaly_detection',
      'pattern_recognition',
      'trend_analysis',
      'classification'
    ],
    model_architectures: ['LSTM', 'Transformer', 'Prophet', 'ARIMA']
  },
  
  recommendation: {
    tasks: [
      'collaborative_filtering',
      'content_based',
      'hybrid_recommendation',
      'ranking',
      'personalization'
    ],
    model_architectures: ['Matrix Factorization', 'Deep Neural Networks', 'Graph Neural Networks']
  }
};
```

#### Model Search and Filtering Strategy:
```javascript
const HUGGINGFACE_SEARCH_STRATEGY = {
  search_parameters: {
    task_filters: deriveTaskFilters(taskDescription),
    size_constraints: {
      small: { max_params: '125M', max_size_gb: 0.5 },
      medium: { max_params: '1B', max_size_gb: 2.0 },
      large: { max_params: '7B', max_size_gb: 15.0 }
    },
    performance_requirements: {
      min_downloads: 1000,
      min_likes: 10,
      recent_activity: 180, // days
      has_model_card: true
    }
  },
  
  quality_signals: [
    'download_count',
    'community_likes',
    'model_card_quality',
    'recent_updates',
    'inference_examples',
    'performance_benchmarks',
    'license_clarity',
    'deployment_compatibility'
  ],
  
  deployment_compatibility: {
    edge: {
      max_memory_mb: 512,
      supported_formats: ['onnx', 'tensorrt', 'coreml'],
      quantization_support: true,
      mobile_optimized: true
    },
    cloud: {
      max_memory_gb: 16,
      gpu_required: 'optional',
      supported_formats: ['pytorch', 'tensorflow', 'onnx'],
      batch_processing: true
    },
    hybrid: {
      scalable_deployment: true,
      model_serving_support: true,
      api_compatibility: true
    }
  }
};
```

### 2. Model Quality Assessment Framework

#### Comprehensive Model Evaluation:
```javascript
function evaluateModel(modelData, taskRequirements) {
  const evaluation = {
    technical_quality: assessTechnicalQuality(modelData),
    performance_metrics: extractPerformanceMetrics(modelData),
    deployment_readiness: assessDeploymentReadiness(modelData),
    community_validation: assessCommunityValidation(modelData),
    production_suitability: assessProductionSuitability(modelData),
    integration_complexity: assessIntegrationComplexity(modelData)
  };
  
  return {
    overall_score: calculateOverallScore(evaluation),
    detailed_assessment: evaluation,
    recommendation: generateRecommendation(evaluation, taskRequirements),
    integration_guide: generateIntegrationGuide(modelData, taskRequirements)
  };
}

const MODEL_QUALITY_METRICS = {
  technical_assessment: {
    architecture_modernity: { weight: 0.20 },
    parameter_efficiency: { weight: 0.25 },
    memory_footprint: { weight: 0.20 },
    inference_speed: { weight: 0.20 },
    accuracy_benchmarks: { weight: 0.15 }
  },
  
  production_readiness: {
    model_card_completeness: { weight: 0.25 },
    inference_examples: { weight: 0.20 },
    api_documentation: { weight: 0.20 },
    deployment_guides: { weight: 0.15 },
    error_handling: { weight: 0.10 },
    monitoring_support: { weight: 0.10 }
  },
  
  community_trust: {
    creator_reputation: { weight: 0.30 },
    download_velocity: { weight: 0.25 },
    community_feedback: { weight: 0.20 },
    issue_resolution: { weight: 0.15 },
    update_frequency: { weight: 0.10 }
  }
};
```

### 3. MCP Tool Integration for Deep Model Analysis

#### HuggingFace Research Pipeline:
```javascript
const MCP_MODELS_PIPELINE = {
  model_discovery: {
    tool: 'HuggingFace',
    purpose: 'Search and filter models on HF Hub',
    parameters: {
      task: identifiedTask,
      sort: 'downloads',
      filter: sizeConstraints,
      limit: 20
    }
  },
  
  model_documentation_analysis: {
    tool: 'Firecrawl',
    purpose: 'Extract model cards and documentation',
    parameters: {
      urls: modelUrls,
      extract_format: 'markdown',
      include_metadata: true,
      include_performance_data: true
    }
  },
  
  comparative_analysis: {
    tool: 'Sequential Thinking',
    purpose: 'Systematic model comparison and selection',
    parameters: {
      analysis_type: 'model_comparison',
      criteria: qualityMetrics,
      task_requirements: taskRequirements
    }
  },
  
  integration_planning: {
    tool: 'DeepWiki',
    purpose: 'Research integration patterns and best practices',
    parameters: {
      topics: [selectedModel.architecture, deploymentTarget],
      depth: 'implementation_focused',
      include_code_examples: true
    }
  },
  
  memory_storage: {
    tool: 'Memory',
    purpose: 'Store model research and integration patterns',
    parameters: {
      key: `research/models/${taskHash}`,
      data: modelAnalysis,
      tags: ['ai_models', 'huggingface', taskCategory]
    }
  }
};
```

### 4. Integration Documentation and Code Examples

#### Model Integration Guide Generation:
```javascript
function generateIntegrationGuide(selectedModel, requirements) {
  const integrationGuide = {
    installation_steps: generateInstallationSteps(selectedModel),
    code_examples: generateCodeExamples(selectedModel, requirements),
    deployment_configurations: generateDeploymentConfigs(selectedModel),
    performance_optimization: generateOptimizationTips(selectedModel),
    monitoring_setup: generateMonitoringGuide(selectedModel),
    troubleshooting: generateTroubleshootingGuide(selectedModel)
  };
  
  return integrationGuide;
}
```

### 5. Research Output Generation

#### Comprehensive AI Models Research Report:
```json
{
  "timestamp": "2024-09-08T14:00:00Z",
  "task_description": "sentiment analysis for customer feedback processing",
  "model_size_preference": "small",
  "deployment_target": "cloud",
  
  "executive_summary": {
    "models_evaluated": 18,
    "top_candidates": 4,
    "primary_recommendation": "cardiffnlp/twitter-roberta-base-sentiment-latest",
    "confidence": 0.92,
    "integration_complexity": "low"
  },
  
  "recommended_models": [
    {
      "name": "cardiffnlp/twitter-roberta-base-sentiment-latest",
      "huggingface_url": "https://huggingface.co/cardiffnlp/twitter-roberta-base-sentiment-latest",
      "model_type": "RoBERTa",
      "task": "text-classification",
      "overall_score": 0.94,
      
      "technical_specifications": {
        "parameters": "125M",
        "model_size": "501MB",
        "architecture": "RoBERTa-base",
        "input_format": "text",
        "output_format": "classification_scores",
        "max_sequence_length": 512,
        "languages": ["en"],
        "framework": "PyTorch"
      },
      
      "performance_metrics": {
        "accuracy": 0.847,
        "f1_score": 0.832,
        "precision": 0.841,
        "recall": 0.839,
        "benchmark_dataset": "TweetEval",
        "inference_time_ms": 23,
        "throughput_samples_sec": 180
      },
      
      "deployment_assessment": {
        "cloud_ready": true,
        "edge_capable": false,
        "gpu_required": false,
        "memory_requirement_mb": 512,
        "scaling_potential": "high",
        "latency_profile": "low"
      },
      
      "integration_guide": {
        "installation": [
          "pip install transformers torch",
          "pip install datasets # for preprocessing utilities"
        ],
        
        "basic_usage": {
          "python": """
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from transformers import pipeline

# Load model and tokenizer
model_name = "cardiffnlp/twitter-roberta-base-sentiment-latest"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

# Create pipeline
sentiment_pipeline = pipeline("sentiment-analysis", 
                              model=model, 
                              tokenizer=tokenizer)

# Analyze sentiment
result = sentiment_pipeline("I love this product!")
print(result)  # [{'label': 'LABEL_2', 'score': 0.9542}]

# Note: LABEL_0 = Negative, LABEL_1 = Neutral, LABEL_2 = Positive
          """,
          
          "javascript": """
// Using Hugging Face Inference API
const HF_TOKEN = process.env.HF_TOKEN;
const model = "cardiffnlp/twitter-roberta-base-sentiment-latest";

async function analyzeSentiment(text) {
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      headers: { Authorization: `Bearer ${HF_TOKEN}` },
      method: "POST",
      body: JSON.stringify({ inputs: text }),
    }
  );
  const result = await response.json();
  return result;
}

// Usage
analyzeSentiment("This is amazing!").then(console.log);
          """
        },
        
        "production_deployment": {
          "docker": {
            "dockerfile": """
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

# Download model at build time
RUN python -c "from transformers import AutoTokenizer, AutoModelForSequenceClassification; AutoTokenizer.from_pretrained('cardiffnlp/twitter-roberta-base-sentiment-latest'); AutoModelForSequenceClassification.from_pretrained('cardiffnlp/twitter-roberta-base-sentiment-latest')"

COPY . .

EXPOSE 8000
CMD ["python", "sentiment_api.py"]
            """,
            "estimated_image_size": "2.1GB"
          },
          
          "kubernetes": {
            "resource_requirements": {
              "cpu": "500m",
              "memory": "1Gi",
              "storage": "2Gi"
            },
            "scaling": {
              "min_replicas": 2,
              "max_replicas": 10,
              "target_cpu": 70
            }
          }
        }
      },
      
      "pros": [
        "Specifically fine-tuned for social media text",
        "Excellent performance on informal text",
        "Fast inference speed",
        "No GPU required",
        "Well-documented and maintained"
      ],
      
      "cons": [
        "Limited to English language",
        "Optimized for short text (Twitter-length)",
        "May not perform well on formal business text",
        "Binary sentiment classification only"
      ],
      
      "use_cases": [
        "Social media monitoring",
        "Customer feedback analysis",
        "Product review sentiment",
        "Real-time chat sentiment",
        "Content moderation assistance"
      ]
    },
    {
      "name": "nlptown/bert-base-multilingual-uncased-sentiment", 
      "model_type": "BERT",
      "overall_score": 0.87,
      "key_advantage": "Multilingual support (104 languages)",
      "trade_off": "Slightly lower accuracy on English-only tasks"
    }
  ],
  
  "alternative_approaches": [
    {
      "approach": "Custom model training",
      "time_estimate": "2-4 weeks",
      "pros": ["Perfect fit for domain", "Full control"],
      "cons": ["Requires ML expertise", "Data collection burden", "Training infrastructure"],
      "recommendation": "only_if_domain_highly_specialized"
    },
    {
      "approach": "Commercial API (AWS Comprehend, Google NL)",
      "time_estimate": "1-2 days integration",
      "pros": ["No model management", "Scalable", "Multi-feature"],
      "cons": ["Ongoing costs", "Vendor lock-in", "Data privacy"],
      "recommendation": "consider_for_mvp"
    }
  ],
  
  "implementation_roadmap": {
    "phase_1_prototype": {
      "duration": "2-3 days",
      "deliverables": [
        "Basic sentiment analysis API",
        "Model performance validation",
        "Integration testing"
      ],
      "success_metrics": [
        "API responds within 100ms",
        "Accuracy >80% on test data",
        "Handles 100 requests/minute"
      ]
    },
    
    "phase_2_production": {
      "duration": "1 week",
      "deliverables": [
        "Production deployment configuration",
        "Monitoring and alerting setup",
        "Load testing and optimization"
      ],
      "success_metrics": [
        "99.9% uptime",
        "Auto-scaling functional",
        "Cost optimization implemented"
      ]
    }
  },
  
  "cost_analysis": {
    "development_costs": {
      "integration_time": "3-5 developer days",
      "testing_and_validation": "2-3 days",
      "deployment_setup": "2-3 days"
    },
    
    "operational_costs": {
      "compute_monthly": "$45-120 (depending on usage)",
      "storage": "$5-15/month",
      "monitoring": "$10-20/month",
      "total_estimated": "$60-155/month"
    },
    
    "comparison_to_alternatives": {
      "commercial_api": "$200-500/month for similar usage",
      "custom_training": "$2000-5000 development cost"
    }
  },
  
  "monitoring_and_maintenance": {
    "key_metrics": [
      "Inference latency",
      "Prediction accuracy drift",
      "Error rates",
      "Resource utilization"
    ],
    
    "alerting_thresholds": {
      "latency_ms": 200,
      "error_rate": 0.05,
      "accuracy_degradation": 0.1
    },
    
    "maintenance_schedule": {
      "daily": "Check error logs and performance metrics",
      "weekly": "Review prediction accuracy and drift",
      "monthly": "Evaluate new model versions and alternatives"
    }
  },
  
  "metadata": {
    "models_searched": 156,
    "models_evaluated": 18,
    "evaluation_criteria": 12,
    "research_duration": "25 minutes",
    "confidence_factors": {
      "performance_validation": 0.94,
      "community_validation": 0.89,
      "integration_assessment": 0.91
    }
  }
}
```

## Integration Points

### Used by:
- `/research:analyze` for detailed model architecture analysis with Gemini
- `/research:deep` for implementation best practices and troubleshooting
- Memory MCP for model performance tracking and recommendations

### Produces:
- `research-models.json` - Comprehensive model research and recommendations
- Production-ready integration guides with code examples
- Cost analysis and deployment strategies
- Performance benchmarks and monitoring setup

### Consumes:
- AI task description and requirements
- Performance and deployment constraints
- Budget considerations and organizational preferences
- Integration complexity tolerance

## Advanced Features

### 1. Multi-Model Ensemble Recommendations
- Identify complementary models for ensemble approaches
- Performance and complexity trade-off analysis
- Ensemble architecture recommendations

### 2. Model Drift and Update Monitoring
- Track model performance degradation over time
- Automated recommendations for model updates
- A/B testing frameworks for model comparison

### 3. Custom Fine-tuning Guidance
- Identify base models suitable for domain-specific fine-tuning
- Data requirements and collection strategies
- Fine-tuning cost and timeline estimates

### 4. Edge Deployment Optimization
- Model quantization and compression recommendations
- Mobile and IoT deployment strategies
- Performance optimization for resource-constrained environments

## Examples

### Natural Language Processing:
```bash
/research:models 'extract key information from legal documents' small cloud
```

### Computer Vision:
```bash
/research:models 'detect product defects in manufacturing images' medium edge
```

### Time Series Analysis:
```bash
/research:models 'predict server resource usage for auto-scaling' small cloud
```

## Error Handling & Limitations

### Model Availability:
- Handle model deprecation and version changes gracefully
- Provide fallback recommendations when primary models unavailable
- Clear messaging about model licensing restrictions

### Performance Validation:
- Acknowledge limitations of published benchmarks
- Recommend custom evaluation on domain-specific data
- Provide guidance for performance testing methodologies

### Integration Complexity:
- Clear communication about implementation effort requirements
- Identification of potential integration challenges early
- Fallback recommendations for complex integration scenarios

This command transforms AI model discovery from manual browsing to intelligent, task-specific model recommendation with production-ready integration guidance, dramatically reducing the time from AI idea to production deployment.