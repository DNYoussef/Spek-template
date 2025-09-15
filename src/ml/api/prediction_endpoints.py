"""
Real-time Prediction API Endpoints for ML Models

This module provides RESTful API endpoints for real-time ML predictions,
enabling integration with external systems and providing a unified
interface for quality, theater, and compliance predictions.
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import Dict, List, Optional, Any, Union
import logging
import asyncio
from datetime import datetime, timedelta
import json
import os
from pathlib import Path
import hashlib
import time

# Import ML models and systems
import sys
sys.path.append(str(Path(__file__).parent.parent))
from quality_predictor import QualityPredictor
from theater_classifier import TheaterClassifier
from compliance_forecaster import ComplianceForecaster
from alerts.notification_system import MLAlertSystem
from integration.validation_bridge import MLValidationOrchestrator

# Pydantic models for API requests/responses
class CodeData(BaseModel):
    """Code analysis data structure."""
    metrics: Dict[str, Any] = Field(..., description="Code metrics")
    changes: Dict[str, Any] = Field(..., description="Code changes")
    quality: Dict[str, Any] = Field(default_factory=dict, description="Quality metrics")
    history: List[Dict[str, Any]] = Field(default_factory=list, description="Historical data")
    patterns: Dict[str, Any] = Field(default_factory=dict, description="Pattern data")
    code_text: Optional[str] = Field(None, description="Code content")

class ChangeData(BaseModel):
    """Change analysis data structure."""
    metrics: Dict[str, Any] = Field(..., description="Change metrics")
    quality_before: Dict[str, Any] = Field(..., description="Quality before change")
    quality_after: Dict[str, Any] = Field(..., description="Quality after change")
    effort: Dict[str, Any] = Field(default_factory=dict, description="Effort metrics")
    impact: Dict[str, Any] = Field(default_factory=dict, description="Impact metrics")
    timing: Dict[str, Any] = Field(default_factory=dict, description="Timing context")
    history: Dict[str, Any] = Field(default_factory=dict, description="Historical context")
    change_types: Dict[str, Any] = Field(default_factory=dict, description="Change types")

class ComplianceData(BaseModel):
    """Compliance analysis data structure."""
    current_metrics: Dict[str, Any] = Field(..., description="Current compliance metrics")
    history: List[Dict[str, Any]] = Field(default_factory=list, description="Historical compliance data")
    violations: Dict[str, Any] = Field(default_factory=dict, description="Violation data")
    recent_changes: Dict[str, Any] = Field(default_factory=dict, description="Recent changes")
    process_maturity: Dict[str, Any] = Field(default_factory=dict, description="Process maturity")
    external_factors: Dict[str, Any] = Field(default_factory=dict, description="External factors")

class PredictionRequest(BaseModel):
    """Generic prediction request."""
    request_id: Optional[str] = Field(None, description="Optional request ID")
    timestamp: Optional[datetime] = Field(default_factory=datetime.now, description="Request timestamp")
    context: Dict[str, Any] = Field(default_factory=dict, description="Additional context")

class QualityPredictionRequest(PredictionRequest):
    """Quality prediction request."""
    code_data: CodeData

class TheaterPredictionRequest(PredictionRequest):
    """Theater detection request."""
    change_data: ChangeData

class CompliancePredictionRequest(PredictionRequest):
    """Compliance prediction request."""
    compliance_data: ComplianceData
    forecast_days: Optional[int] = Field(30, description="Forecast horizon in days")

class BatchPredictionRequest(BaseModel):
    """Batch prediction request."""
    predictions: List[Dict[str, Any]] = Field(..., description="List of prediction requests")
    batch_id: Optional[str] = Field(None, description="Optional batch ID")

class PredictionResponse(BaseModel):
    """Generic prediction response."""
    request_id: Optional[str]
    timestamp: datetime
    processing_time_ms: float
    status: str = Field(..., description="Response status")
    model_version: Optional[str] = Field(None, description="Model version used")

class QualityPredictionResponse(PredictionResponse):
    """Quality prediction response."""
    quality_prediction: int
    quality_probability: Dict[str, float]
    confidence: float
    anti_patterns: Dict[str, float]
    is_anomaly: bool
    anomaly_score: float
    recommendation: str

class TheaterPredictionResponse(PredictionResponse):
    """Theater detection response."""
    is_theater: bool
    theater_probability: float
    genuine_probability: float
    confidence: float
    uncertainty: float
    gaming_detection: Dict[str, float]
    explanation: str
    recommendation: str

class CompliancePredictionResponse(PredictionResponse):
    """Compliance prediction response."""
    overall_risk_score: float
    risk_level: str
    component_scores: Dict[str, float]
    predicted_violations: Dict[str, float]
    drift_detected: bool
    drift_severity: Optional[str]
    forecast: List[Dict[str, Any]]
    recommendations: List[str]

class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    timestamp: datetime
    models_loaded: Dict[str, bool]
    api_version: str
    uptime_seconds: float

# API Authentication
security = HTTPBearer()

class MLPredictionAPI:
    """
    FastAPI application for ML prediction endpoints.

    Features:
    - Real-time quality, theater, and compliance predictions
    - Batch processing capabilities
    - Authentication and rate limiting
    - Comprehensive error handling and logging
    - Health monitoring and metrics
    """

    def __init__(self, config_file: str = "config/ml/api_config.json"):
        self.config = self._load_config(config_file)
        self.logger = self._setup_logging()

        # ML models and systems
        self.quality_predictor = None
        self.theater_classifier = None
        self.compliance_forecaster = None
        self.orchestrator = None

        # API state
        self.start_time = time.time()
        self.request_count = 0
        self.error_count = 0

        # Initialize FastAPI app
        self.app = self._create_app()

    def _load_config(self, config_file: str) -> Dict[str, Any]:
        """Load API configuration."""
        default_config = {
            'api': {
                'title': 'ML Quality Validation API',
                'version': '1.0.0',
                'description': 'Real-time ML predictions for code quality validation',
                'host': '0.0.0.0',
                'port': 8000,
                'debug': False
            },
            'models': {
                'quality_predictor_path': 'models/quality',
                'theater_classifier_path': 'models/theater',
                'compliance_forecaster_path': 'models/compliance'
            },
            'security': {
                'enabled': True,
                'api_key': 'your-api-key-here',
                'rate_limit_per_minute': 100
            },
            'performance': {
                'max_batch_size': 100,
                'timeout_seconds': 30,
                'cache_enabled': True,
                'cache_ttl_seconds': 300
            },
            'cors': {
                'enabled': True,
                'origins': ['*'],
                'methods': ['GET', 'POST'],
                'headers': ['*']
            }
        }

        if Path(config_file).exists():
            with open(config_file, 'r') as f:
                config = json.load(f)
                self._deep_merge(default_config, config)

        return default_config

    def _deep_merge(self, base: Dict, update: Dict) -> None:
        """Deep merge configuration dictionaries."""
        for key, value in update.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                self._deep_merge(base[key], value)
            else:
                base[key] = value

    def _setup_logging(self) -> logging.Logger:
        """Setup logging for API."""
        logger = logging.getLogger('ml_prediction_api')
        logger.setLevel(logging.INFO)

        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    def _create_app(self) -> FastAPI:
        """Create and configure FastAPI application."""
        app = FastAPI(
            title=self.config['api']['title'],
            version=self.config['api']['version'],
            description=self.config['api']['description']
        )

        # Add CORS middleware
        if self.config['cors']['enabled']:
            app.add_middleware(
                CORSMiddleware,
                allow_origins=self.config['cors']['origins'],
                allow_credentials=True,
                allow_methods=self.config['cors']['methods'],
                allow_headers=self.config['cors']['headers'],
            )

        # Add routes
        self._add_routes(app)

        return app

    def _add_routes(self, app: FastAPI) -> None:
        """Add API routes to FastAPI app."""

        @app.on_event("startup")
        async def startup_event():
            """Initialize ML models on startup."""
            await self.initialize_models()

        @app.get("/health", response_model=HealthResponse)
        async def health_check():
            """Health check endpoint."""
            return await self.get_health_status()

        @app.post("/predict/quality", response_model=QualityPredictionResponse)
        async def predict_quality(
            request: QualityPredictionRequest,
            credentials: HTTPAuthorizationCredentials = Depends(security)
        ):
            """Predict code quality."""
            await self._validate_credentials(credentials)
            return await self.predict_quality_endpoint(request)

        @app.post("/predict/theater", response_model=TheaterPredictionResponse)
        async def predict_theater(
            request: TheaterPredictionRequest,
            credentials: HTTPAuthorizationCredentials = Depends(security)
        ):
            """Detect performance theater."""
            await self._validate_credentials(credentials)
            return await self.predict_theater_endpoint(request)

        @app.post("/predict/compliance", response_model=CompliancePredictionResponse)
        async def predict_compliance(
            request: CompliancePredictionRequest,
            credentials: HTTPAuthorizationCredentials = Depends(security)
        ):
            """Predict compliance issues."""
            await self._validate_credentials(credentials)
            return await self.predict_compliance_endpoint(request)

        @app.post("/predict/batch")
        async def batch_predict(
            request: BatchPredictionRequest,
            background_tasks: BackgroundTasks,
            credentials: HTTPAuthorizationCredentials = Depends(security)
        ):
            """Process batch predictions."""
            await self._validate_credentials(credentials)
            return await self.batch_predict_endpoint(request, background_tasks)

        @app.get("/models/status")
        async def models_status(
            credentials: HTTPAuthorizationCredentials = Depends(security)
        ):
            """Get model status information."""
            await self._validate_credentials(credentials)
            return await self.get_models_status()

        @app.get("/metrics")
        async def api_metrics(
            credentials: HTTPAuthorizationCredentials = Depends(security)
        ):
            """Get API performance metrics."""
            await self._validate_credentials(credentials)
            return await self.get_api_metrics()

    async def _validate_credentials(self, credentials: HTTPAuthorizationCredentials) -> None:
        """Validate API credentials."""
        if not self.config['security']['enabled']:
            return

        expected_key = self.config['security']['api_key']
        if credentials.credentials != expected_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key"
            )

    async def initialize_models(self) -> None:
        """Initialize ML models and orchestrator."""
        try:
            self.logger.info("Initializing ML models...")

            # Initialize quality predictor
            quality_path = self.config['models']['quality_predictor_path']
            if Path(quality_path).exists():
                self.quality_predictor = QualityPredictor()
                self.quality_predictor.load_models(quality_path)
                self.logger.info("Quality predictor initialized")

            # Initialize theater classifier
            theater_path = self.config['models']['theater_classifier_path']
            if Path(theater_path).exists():
                self.theater_classifier = TheaterClassifier()
                self.theater_classifier.load_models(theater_path)
                self.logger.info("Theater classifier initialized")

            # Initialize compliance forecaster
            compliance_path = self.config['models']['compliance_forecaster_path']
            if Path(compliance_path).exists():
                self.compliance_forecaster = ComplianceForecaster()
                self.compliance_forecaster.load_models(compliance_path)
                self.logger.info("Compliance forecaster initialized")

            # Initialize orchestrator
            self.orchestrator = MLValidationOrchestrator()
            self.orchestrator.initialize()
            self.logger.info("ML orchestrator initialized")

        except Exception as e:
            self.logger.error(f"Model initialization failed: {e}")
            raise

    async def get_health_status(self) -> HealthResponse:
        """Get API health status."""
        models_loaded = {
            'quality_predictor': self.quality_predictor is not None,
            'theater_classifier': self.theater_classifier is not None,
            'compliance_forecaster': self.compliance_forecaster is not None,
            'orchestrator': self.orchestrator is not None
        }

        status = "healthy" if all(models_loaded.values()) else "degraded"

        return HealthResponse(
            status=status,
            timestamp=datetime.now(),
            models_loaded=models_loaded,
            api_version=self.config['api']['version'],
            uptime_seconds=time.time() - self.start_time
        )

    async def predict_quality_endpoint(self, request: QualityPredictionRequest) -> QualityPredictionResponse:
        """Handle quality prediction request."""
        start_time = time.time()
        self.request_count += 1

        try:
            if not self.quality_predictor:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Quality predictor not available"
                )

            # Convert request to model format
            code_data = request.code_data.dict()

            # Make prediction
            prediction = self.quality_predictor.predict_quality(code_data)

            processing_time = (time.time() - start_time) * 1000

            return QualityPredictionResponse(
                request_id=request.request_id,
                timestamp=datetime.now(),
                processing_time_ms=processing_time,
                status="success",
                model_version="1.0.0",
                quality_prediction=prediction['quality_prediction'],
                quality_probability=prediction['quality_probability'],
                confidence=prediction['confidence'],
                anti_patterns=prediction['anti_patterns'],
                is_anomaly=prediction['is_anomaly'],
                anomaly_score=prediction['anomaly_score'],
                recommendation=prediction['recommendation']
            )

        except Exception as e:
            self.error_count += 1
            self.logger.error(f"Quality prediction failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Prediction failed: {str(e)}"
            )

    async def predict_theater_endpoint(self, request: TheaterPredictionRequest) -> TheaterPredictionResponse:
        """Handle theater detection request."""
        start_time = time.time()
        self.request_count += 1

        try:
            if not self.theater_classifier:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Theater classifier not available"
                )

            # Convert request to model format
            change_data = request.change_data.dict()

            # Make prediction
            prediction = self.theater_classifier.predict_theater(change_data)

            processing_time = (time.time() - start_time) * 1000

            return TheaterPredictionResponse(
                request_id=request.request_id,
                timestamp=datetime.now(),
                processing_time_ms=processing_time,
                status="success",
                model_version="1.0.0",
                is_theater=prediction['is_theater'],
                theater_probability=prediction['theater_probability'],
                genuine_probability=prediction['genuine_probability'],
                confidence=prediction['confidence'],
                uncertainty=prediction['uncertainty'],
                gaming_detection=prediction['gaming_detection'],
                explanation=prediction['explanation'],
                recommendation=prediction['recommendation']
            )

        except Exception as e:
            self.error_count += 1
            self.logger.error(f"Theater prediction failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Prediction failed: {str(e)}"
            )

    async def predict_compliance_endpoint(self, request: CompliancePredictionRequest) -> CompliancePredictionResponse:
        """Handle compliance prediction request."""
        start_time = time.time()
        self.request_count += 1

        try:
            if not self.compliance_forecaster:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Compliance forecaster not available"
                )

            # Convert request to model format
            compliance_data = request.compliance_data.dict()

            # Risk assessment
            risk_result = self.compliance_forecaster.calculate_risk_score(compliance_data)

            # Drift prediction
            drift_result = {}
            if compliance_data.get('history'):
                drift_result = self.compliance_forecaster.predict_compliance_drift(
                    compliance_data['history'], request.forecast_days
                )

            processing_time = (time.time() - start_time) * 1000

            return CompliancePredictionResponse(
                request_id=request.request_id,
                timestamp=datetime.now(),
                processing_time_ms=processing_time,
                status="success",
                model_version="1.0.0",
                overall_risk_score=risk_result['overall_risk_score'],
                risk_level=risk_result['risk_level'],
                component_scores=risk_result['component_scores'],
                predicted_violations=risk_result['predicted_violations'],
                drift_detected=drift_result.get('drift_detected', False),
                drift_severity=drift_result.get('drift_severity'),
                forecast=drift_result.get('forecast', []),
                recommendations=risk_result['mitigation_recommendations']
            )

        except Exception as e:
            self.error_count += 1
            self.logger.error(f"Compliance prediction failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Prediction failed: {str(e)}"
            )

    async def batch_predict_endpoint(self, request: BatchPredictionRequest,
                                   background_tasks: BackgroundTasks) -> Dict[str, Any]:
        """Handle batch prediction request."""
        if len(request.predictions) > self.config['performance']['max_batch_size']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Batch size exceeds maximum of {self.config['performance']['max_batch_size']}"
            )

        batch_id = request.batch_id or f"batch_{int(time.time())}"

        # Process batch in background
        background_tasks.add_task(self._process_batch, batch_id, request.predictions)

        return {
            "batch_id": batch_id,
            "status": "accepted",
            "total_predictions": len(request.predictions),
            "estimated_completion": datetime.now() + timedelta(
                seconds=len(request.predictions) * 2
            )
        }

    async def _process_batch(self, batch_id: str, predictions: List[Dict[str, Any]]) -> None:
        """Process batch predictions in background."""
        try:
            self.logger.info(f"Processing batch {batch_id} with {len(predictions)} predictions")

            results = []
            for i, pred_data in enumerate(predictions):
                try:
                    # Determine prediction type and process
                    pred_type = pred_data.get('type')

                    if pred_type == 'quality' and self.quality_predictor:
                        result = self.quality_predictor.predict_quality(pred_data['data'])
                    elif pred_type == 'theater' and self.theater_classifier:
                        result = self.theater_classifier.predict_theater(pred_data['data'])
                    elif pred_type == 'compliance' and self.compliance_forecaster:
                        result = self.compliance_forecaster.calculate_risk_score(pred_data['data'])
                    else:
                        result = {'error': f'Unknown prediction type: {pred_type}'}

                    results.append({
                        'index': i,
                        'result': result,
                        'status': 'success' if 'error' not in result else 'failed'
                    })

                except Exception as e:
                    results.append({
                        'index': i,
                        'error': str(e),
                        'status': 'failed'
                    })

            # Save batch results (in practice, store in database or cache)
            self.logger.info(f"Batch {batch_id} completed: {len(results)} results")

        except Exception as e:
            self.logger.error(f"Batch processing failed for {batch_id}: {e}")

    async def get_models_status(self) -> Dict[str, Any]:
        """Get detailed model status information."""
        status = {
            'quality_predictor': {
                'loaded': self.quality_predictor is not None,
                'trained': getattr(self.quality_predictor, 'trained', False) if self.quality_predictor else False
            },
            'theater_classifier': {
                'loaded': self.theater_classifier is not None,
                'trained': getattr(self.theater_classifier, 'trained', False) if self.theater_classifier else False
            },
            'compliance_forecaster': {
                'loaded': self.compliance_forecaster is not None,
                'trained': getattr(self.compliance_forecaster, 'trained', False) if self.compliance_forecaster else False
            },
            'orchestrator': {
                'loaded': self.orchestrator is not None,
                'health': self.orchestrator.health_check() if self.orchestrator else None
            }
        }

        return status

    async def get_api_metrics(self) -> Dict[str, Any]:
        """Get API performance metrics."""
        uptime = time.time() - self.start_time

        metrics = {
            'uptime_seconds': uptime,
            'total_requests': self.request_count,
            'total_errors': self.error_count,
            'error_rate': self.error_count / max(self.request_count, 1),
            'requests_per_second': self.request_count / max(uptime, 1),
            'timestamp': datetime.now().isoformat()
        }

        # Add model-specific metrics if orchestrator is available
        if self.orchestrator:
            integration_metrics = self.orchestrator.get_integration_metrics()
            metrics['integration_metrics'] = integration_metrics

        return metrics

# API factory function
def create_api(config_file: str = None) -> FastAPI:
    """Create and return FastAPI application."""
    api = MLPredictionAPI(config_file)
    return api.app

# For running with uvicorn
app = create_api()

if __name__ == "__main__":
    import uvicorn

    # Load configuration
    api_instance = MLPredictionAPI()
    config = api_instance.config['api']

    uvicorn.run(
        "prediction_endpoints:app",
        host=config['host'],
        port=config['port'],
        reload=config['debug'],
        log_level="info"
    )