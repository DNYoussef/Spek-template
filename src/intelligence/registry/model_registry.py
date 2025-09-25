from src.constants.base import TAKE_PROFIT_PERCENTAGE

import mlflow
import mlflow.pytorch
import mlflow.sklearn
from mlflow.tracking import MlflowClient
from mlflow.models import ModelVersion as MLModelVersion
from mlflow.exceptions import MlflowException

import torch
import torch.nn as nn
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Union, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
import json
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

@dataclass
class ModelMetadata:
    """Metadata associated with a model version."""
    name: str
    version: str
    description: str = ""
    tags: Dict[str, str] = field(default_factory=dict)
    metrics: Dict[str, float] = field(default_factory=dict)
    parameters: Dict[str, Any] = field(default_factory=dict)
    artifacts: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    created_by: str = "system"
    stage: str = "None"  # None, Staging, Production, Archived

@dataclass
class ModelVersion:
    """Represents a specific version of a model."""
    name: str
    version: str
    run_id: str
    model_uri: str
    metadata: ModelMetadata
    mlflow_version: Optional[MLModelVersion] = None

class ModelRegistry:
    """Comprehensive model registry with MLflow backend."""
    
    def __init__(
        self,
        tracking_uri: str = None,
        registry_uri: str = None,
        experiment_name: str = None
    ):
        # Set MLflow configuration
        if tracking_uri:
            mlflow.set_tracking_uri(tracking_uri)
        elif config.registry.tracking_uri:
            mlflow.set_tracking_uri(config.registry.tracking_uri)
        
        if registry_uri:
            mlflow.set_registry_uri(registry_uri)
        
        # Set experiment
        self.experiment_name = experiment_name or config.registry.experiment_name
        
        try:
            mlflow.set_experiment(self.experiment_name)
        except Exception as e:
            logger.warning(f"Could not set experiment {self.experiment_name}: {e}")
            mlflow.set_experiment("Default")
        
        # Initialize MLflow client
        self.client = MlflowClient()
        
        # Model promotion thresholds
        self.staging_threshold = config.registry.staging_threshold
        self.production_threshold = config.registry.production_threshold
        
        # Model store
        self.model_store_path = Path(config.registry.model_store_path)
        self.model_store_path.mkdir(parents=True, exist_ok=True)
        
    def register_model(
        self,
        model: nn.Module,
        model_name: str,
        run_id: Optional[str] = None,
        metadata: Optional[Dict] = None,
        artifacts: Optional[Dict[str, Any]] = None,
        auto_promote: bool = True
    ) -> ModelVersion:
        """
        Register a new model version.
        
        Args:
            model: PyTorch model to register
            model_name: Name of the model
            run_id: MLflow run ID (if None, creates new run)
            metadata: Additional metadata
            artifacts: Additional artifacts to log
            auto_promote: Whether to auto-promote based on performance
            
        Returns:
            ModelVersion object
        """
        metadata = metadata or {}
        artifacts = artifacts or {}
        
        # Create or use existing run
        if run_id:
            mlflow.start_run(run_id=run_id)
        else:
            mlflow.start_run(run_name=f"{model_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        
        try:
            current_run = mlflow.active_run()
            run_id = current_run.info.run_id
            
            # Log model
            model_uri = f"runs:/{run_id}/model"
            mlflow.pytorch.log_model(
                pytorch_model=model,
                artifact_path="model",
                registered_model_name=model_name
            )
            
            # Log metadata and artifacts
            self._log_metadata_and_artifacts(metadata, artifacts)
            
            # Get the registered model version
            model_versions = self.client.search_model_versions(f"name='{model_name}'")
            latest_version = max(model_versions, key=lambda v: int(v.version))
            
            # Create ModelMetadata
            model_metadata = ModelMetadata(
                name=model_name,
                version=latest_version.version,
                description=metadata.get('description', ''),
                tags=metadata.get('tags', {}),
                metrics=metadata.get('metrics', {}),
                parameters=metadata.get('parameters', {}),
                artifacts=list(artifacts.keys()),
                stage=latest_version.current_stage
            )
            
            # Create ModelVersion
            model_version = ModelVersion(
                name=model_name,
                version=latest_version.version,
                run_id=run_id,
                model_uri=model_uri,
                metadata=model_metadata,
                mlflow_version=latest_version
            )
            
            # Auto-promote if enabled
            if auto_promote:
                self._auto_promote_model(model_version)
            
            logger.info(f"Model {model_name} v{latest_version.version} registered successfully")
            
            return model_version
            
        finally:
            mlflow.end_run()
    
    def _log_metadata_and_artifacts(
        self,
        metadata: Dict,
        artifacts: Dict[str, Any]
    ):
        """Log metadata and artifacts to MLflow."""
        
        # Log parameters
        if 'parameters' in metadata:
            mlflow.log_params(metadata['parameters'])
        
        # Log metrics
        if 'metrics' in metadata:
            mlflow.log_metrics(metadata['metrics'])
        
        # Log tags
        if 'tags' in metadata:
            mlflow.set_tags(metadata['tags'])
        
        # Log artifacts
        for name, artifact in artifacts.items():
            if isinstance(artifact, (pd.DataFrame, pd.Series)):
                artifact_path = f"{name}.parquet"
                artifact.to_parquet(artifact_path)
                mlflow.log_artifact(artifact_path)
                Path(artifact_path).unlink()  # Clean up
                
            elif isinstance(artifact, dict):
                artifact_path = f"{name}.json"
                with open(artifact_path, 'w') as f:
                    json.dump(artifact, f, indent=2)
                mlflow.log_artifact(artifact_path)
                Path(artifact_path).unlink()
                
            elif isinstance(artifact, np.ndarray):
                artifact_path = f"{name}.npy"
                np.save(artifact_path, artifact)
                mlflow.log_artifact(artifact_path)
                Path(artifact_path).unlink()
                
            else:
                # Try to pickle other objects
                try:
                    artifact_path = f"{name}.pkl"
                    with open(artifact_path, 'wb') as f:
                        pickle.dump(artifact, f)
                    mlflow.log_artifact(artifact_path)
                    Path(artifact_path).unlink()
                except Exception as e:
                    logger.warning(f"Could not serialize artifact {name}: {e}")
    
    def _auto_promote_model(self, model_version: ModelVersion):
        """Auto-promote model based on performance thresholds."""
        metrics = model_version.metadata.metrics
        
        # Extract key performance metrics
        sharpe_ratio = metrics.get('sharpe_ratio', 0)
        max_drawdown = metrics.get('max_drawdown', 1.0)
        win_rate = metrics.get('win_rate', 0)
        
        # Composite score for promotion decision
        composite_score = self._calculate_composite_score(metrics)
        
        current_stage = model_version.metadata.stage
        new_stage = current_stage
        
        # Promotion logic
        if composite_score >= self.production_threshold:
            if current_stage != "Production":
                new_stage = "Production"
                logger.info(f"Auto-promoting {model_version.name} v{model_version.version} to Production")
                
        elif composite_score >= self.staging_threshold:
            if current_stage == "None":
                new_stage = "Staging"
                logger.info(f"Auto-promoting {model_version.name} v{model_version.version} to Staging")
        
        # Update stage if changed
        if new_stage != current_stage:
            self.transition_model_stage(
                model_version.name,
                model_version.version,
                new_stage
            )
    
    def _calculate_composite_score(self, metrics: Dict[str, float]) -> float:
        """Calculate composite performance score for promotion decisions."""
        # Weights for different metrics
        weights = {
            'sharpe_ratio': 0.3,
            'information_ratio': 0.2,
            'max_drawdown': -0.2,  # Negative weight (lower is better)
            'win_rate': TAKE_PROFIT_PERCENTAGE,
            'profit_factor': TAKE_PROFIT_PERCENTAGE
        }
        
        score = 0.0
        total_weight = 0.0
        
        for metric, weight in weights.items():
            if metric in metrics:
                value = metrics[metric]
                
                # Normalize metrics to 0-1 range
                if metric == 'sharpe_ratio':
                    normalized = min(max(value / 3.0, 0), 1)  # Cap at 3.0
                elif metric == 'information_ratio':
                    normalized = min(max(value / 2.0, 0), 1)  # Cap at 2.0
                elif metric == 'max_drawdown':
                    normalized = max(1 - value, 0)  # Invert (lower drawdown is better)
                elif metric == 'win_rate':
                    normalized = min(max(value, 0), 1)
                elif metric == 'profit_factor':
                    normalized = min(max((value - 1) / 2.0, 0), 1)  # Normalize around 1.0
                else:
                    normalized = value
                
                score += weight * normalized
                total_weight += abs(weight)
        
        return score / total_weight if total_weight > 0 else 0.0
    
    def transition_model_stage(
        self,
        model_name: str,
        version: str,
        stage: str,
        archive_existing_production: bool = True
    ):
        """Transition model to a new stage."""
        try:
            # Archive existing production models if transitioning to production
            if stage == "Production" and archive_existing_production:
                self._archive_production_models(model_name)
            
            # Transition to new stage
            self.client.transition_model_version_stage(
                name=model_name,
                version=version,
                stage=stage
            )
            
            logger.info(f"Transitioned {model_name} v{version} to {stage}")
            
        except MlflowException as e:
            logger.error(f"Failed to transition model stage: {e}")
    
    def _archive_production_models(self, model_name: str):
        """Archive existing production models."""
        try:
            production_versions = self.client.get_latest_versions(
                model_name, stages=["Production"]
            )
            
            for version in production_versions:
                self.client.transition_model_version_stage(
                    name=model_name,
                    version=version.version,
                    stage="Archived"
                )
                logger.info(f"Archived {model_name} v{version.version}")
                
        except MlflowException as e:
            logger.warning(f"Could not archive production models: {e}")
    
    def load_model(
        self,
        model_name: str,
        version: Optional[str] = None,
        stage: Optional[str] = None
    ) -> Tuple[nn.Module, ModelVersion]:
        """
        Load a model from the registry.
        
        Args:
            model_name: Name of the model
            version: Specific version (if None, uses stage)
            stage: Stage to load from (if version is None)
            
        Returns:
            Tuple of (model, model_version)
        """
        try:
            if version:
                model_uri = f"models:/{model_name}/{version}"
                mlflow_version = self.client.get_model_version(model_name, version)
            else:
                stage = stage or "Production"
                model_uri = f"models:/{model_name}/{stage}"
                versions = self.client.get_latest_versions(model_name, stages=[stage])
                if not versions:
                    raise ValueError(f"No model found in {stage} stage")
                mlflow_version = versions[0]
            
            # Load the model
            model = mlflow.pytorch.load_model(model_uri)
            
            # Create ModelVersion object
            run = self.client.get_run(mlflow_version.run_id)
            
            metadata = ModelMetadata(
                name=model_name,
                version=mlflow_version.version,
                description=mlflow_version.description or "",
                tags=mlflow_version.tags,
                metrics=run.data.metrics,
                parameters=run.data.params,
                stage=mlflow_version.current_stage
            )
            
            model_version = ModelVersion(
                name=model_name,
                version=mlflow_version.version,
                run_id=mlflow_version.run_id,
                model_uri=model_uri,
                metadata=metadata,
                mlflow_version=mlflow_version
            )
            
            logger.info(f"Loaded {model_name} v{mlflow_version.version} from {stage}")
            
            return model, model_version
            
        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {e}")
            raise
    
    def list_models(self, name_filter: Optional[str] = None) -> List[str]:
        """List all registered models."""
        try:
            models = self.client.search_registered_models()
            model_names = [model.name for model in models]
            
            if name_filter:
                model_names = [name for name in model_names if name_filter in name]
            
            return sorted(model_names)
            
        except Exception as e:
            logger.error(f"Failed to list models: {e}")
            return []
    
    def list_model_versions(
        self,
        model_name: str,
        stage: Optional[str] = None
    ) -> List[ModelVersion]:
        """List versions of a specific model."""
        try:
            if stage:
                mlflow_versions = self.client.get_latest_versions(model_name, stages=[stage])
            else:
                mlflow_versions = self.client.search_model_versions(f"name='{model_name}'")
            
            model_versions = []
            for mv in mlflow_versions:
                try:
                    run = self.client.get_run(mv.run_id)
                    
                    metadata = ModelMetadata(
                        name=model_name,
                        version=mv.version,
                        description=mv.description or "",
                        tags=mv.tags,
                        metrics=run.data.metrics,
                        parameters=run.data.params,
                        stage=mv.current_stage
                    )
                    
                    model_version = ModelVersion(
                        name=model_name,
                        version=mv.version,
                        run_id=mv.run_id,
                        model_uri=f"models:/{model_name}/{mv.version}",
                        metadata=metadata,
                        mlflow_version=mv
                    )
                    
                    model_versions.append(model_version)
                    
                except Exception as e:
                    logger.warning(f"Could not load metadata for {model_name} v{mv.version}: {e}")
            
            return sorted(model_versions, key=lambda v: int(v.version), reverse=True)
            
        except Exception as e:
            logger.error(f"Failed to list model versions for {model_name}: {e}")
            return []
    
    def compare_models(
        self,
        model_versions: List[ModelVersion],
        metrics: List[str] = None
    ) -> pd.DataFrame:
        """Compare multiple model versions."""
        if not model_versions:
            return pd.DataFrame()
        
        if metrics is None:
            metrics = ['sharpe_ratio', 'max_drawdown', 'win_rate', 'total_return']
        
        comparison_data = []
        for mv in model_versions:
            row = {
                'name': mv.name,
                'version': mv.version,
                'stage': mv.metadata.stage,
                'created_at': mv.metadata.created_at
            }
            
            # Add metrics
            for metric in metrics:
                row[metric] = mv.metadata.metrics.get(metric, np.nan)
            
            comparison_data.append(row)
        
        df = pd.DataFrame(comparison_data)
        return df.sort_values('version', ascending=False)
    
    def delete_model(self, model_name: str, version: Optional[str] = None):
        """Delete a model or specific version."""
        try:
            if version:
                # Delete specific version
                self.client.delete_model_version(model_name, version)
                logger.info(f"Deleted {model_name} v{version}")
            else:
                # Delete entire model
                self.client.delete_registered_model(model_name)
                logger.info(f"Deleted model {model_name}")
                
        except Exception as e:
            logger.error(f"Failed to delete model: {e}")
            raise
    
    def get_model_lineage(self, model_name: str, version: str) -> Dict:
        """Get model lineage information."""
        try:
            model_version = self.client.get_model_version(model_name, version)
            run = self.client.get_run(model_version.run_id)
            
            lineage = {
                'model_name': model_name,
                'version': version,
                'run_id': model_version.run_id,
                'experiment_id': run.info.experiment_id,
                'start_time': run.info.start_time,
                'end_time': run.info.end_time,
                'status': run.info.status,
                'metrics': run.data.metrics,
                'parameters': run.data.params,
                'tags': run.data.tags,
                'artifacts': [f.path for f in self.client.list_artifacts(run.info.run_id)]
            }
            
            return lineage
            
        except Exception as e:
            logger.error(f"Failed to get model lineage: {e}")
            return {}

# Example usage and testing
def test_model_registry():
    """Test model registry functionality."""
    from ..models.gary_dpi import GaryTalebPredictor
    
    # Initialize registry
    registry = ModelRegistry(experiment_name="test_registry")
    
    # Create a test model
    model = GaryTalebPredictor(input_dim=50)
    
    # Test model registration
    metadata = {
        'description': 'Test GaryTaleb model',
        'tags': {'framework': 'pytorch', 'strategy': 'gary_taleb'},
        'metrics': {
            'sharpe_ratio': 1.8,
            'max_drawdown': 0.15,
            'win_rate': 0.62,
            'total_return': 0.45
        },
        'parameters': {
            'learning_rate': 1e-4,
            'batch_size': 64,
            'epochs': 100
        }
    }
    
    try:
        # Register model
        model_version = registry.register_model(
            model=model,
            model_name="test_gary_taleb",
            metadata=metadata
        )
        
        print(f"Registered model: {model_version.name} v{model_version.version}")
        print(f"Stage: {model_version.metadata.stage}")
        
        # List models
        models = registry.list_models()
        print(f"Available models: {models}")
        
        # Load model
        loaded_model, loaded_version = registry.load_model(
            "test_gary_taleb", 
            version=model_version.version
        )
        
        print(f"Loaded model: {loaded_version.name} v{loaded_version.version}")
        
        # List model versions
        versions = registry.list_model_versions("test_gary_taleb")
        print(f"Model versions: {[v.version for v in versions]}")
        
        # Compare models
        if len(versions) > 0:
            comparison = registry.compare_models(versions[:1])
            print("\nModel Comparison:")
            print(comparison)
        
    except Exception as e:
        pass

if __name__ == "__main__":
    test_model_registry()