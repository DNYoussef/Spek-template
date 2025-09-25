from src.constants.base import MAXIMUM_FUNCTION_PARAMETERS

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from typing import Dict, List, Optional, Tuple, Union, Callable
import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

@dataclass
class TrainingConfig:
    """Configuration for training pipeline."""
    # Basic training parameters
    epochs: int = 100
    batch_size: int = 64
    learning_rate: float = 1e-4
    weight_decay: float = 1e-5
    gradient_clip: float = 1.0
    
    # Optimization
    optimizer: str = 'adamw'
    scheduler: str = 'cosine_annealing'
    warmup_epochs: int = 5
    
    # Validation
    validation_freq: int = 1
    patience: int = 10
    min_delta: float = 1e-6
    
    # Loss configuration
    primary_loss: str = 'mse'
    loss_weights: Dict[str, float] = field(default_factory=lambda: {
        'prediction': 1.0,
        'sharpe': 0.3,
        'drawdown': 0.2,
        'directional': 0.1
    })
    
    # Regularization
    dropout: float = 0.1
    label_smoothing: float = 0.0
    mixup_alpha: float = 0.0
    
    # Advanced techniques
    use_amp: bool = True  # Automatic Mixed Precision
    use_swa: bool = True  # Stochastic Weight Averaging
    gradient_accumulation_steps: int = 1

@dataclass 
class TrainingMetrics:
    """Container for training metrics."""
    epoch: int
    train_loss: float
    val_loss: float
    train_metrics: Dict[str, float]
    val_metrics: Dict[str, float]
    learning_rate: float
    timestamp: float

class ModelTrainer:
    """Core model trainer with financial-specific optimizations."""
    
    def __init__(
        self,
        model: nn.Module,
        config: TrainingConfig,
        device: str = None
    ):
        self.model = model
        self.config = config
        self.device = device or torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Move model to device
        self.model.to(self.device)
        
        # Initialize training components
        self.optimizer = self._create_optimizer()
        self.scheduler = self._create_scheduler()
        self.loss_fn = self._create_loss_function()
        self.scaler = torch.cuda.amp.GradScaler() if config.use_amp else None
        
        # Training state
        self.epoch = 0
        self.best_val_loss = float('inf')
        self.training_history: List[TrainingMetrics] = []
        self.callbacks: List[Callback] = []
        
        # SWA model for better generalization
        self.swa_model = None
        self.swa_scheduler = None
        if config.use_swa:
            self.swa_model = optim.swa_utils.AveragedModel(model)
            self.swa_scheduler = optim.swa_utils.SWALR(
                self.optimizer, swa_lr=config.learning_rate * 0.1
            )
    
    def _create_optimizer(self) -> optim.Optimizer:
        """Create optimizer based on configuration."""
        optimizer_map = {
            'adam': optim.Adam,
            'adamw': optim.AdamW,
            'rmsprop': optim.RMSprop,
            'sgd': optim.SGD
        }
        
        optimizer_class = optimizer_map.get(self.config.optimizer, optim.AdamW)
        
        if self.config.optimizer == 'sgd':
            return optimizer_class(
                self.model.parameters(),
                lr=self.config.learning_rate,
                weight_decay=self.config.weight_decay,
                momentum=0.9
            )
        else:
            return optimizer_class(
                self.model.parameters(),
                lr=self.config.learning_rate,
                weight_decay=self.config.weight_decay
            )
    
    def _create_scheduler(self) -> Optional[optim.lr_scheduler._LRScheduler]:
        """Create learning rate scheduler."""
        if self.config.scheduler == 'cosine_annealing':
            return optim.lr_scheduler.CosineAnnealingLR(
                self.optimizer,
                T_max=self.config.epochs,
                eta_min=self.config.learning_rate * 0.1
            )
        elif self.config.scheduler == 'reduce_on_plateau':
            return optim.lr_scheduler.ReduceLROnPlateau(
                self.optimizer,
                mode='min',
                factor=0.5,
                patience=self.config.patience // 2,
                verbose=True
            )
        elif self.config.scheduler == 'exponential':
            return optim.lr_scheduler.ExponentialLR(
                self.optimizer,
                gamma=0.95
            )
        else:
            return None
    
    def _create_loss_function(self) -> nn.Module:
        """Create composite loss function."""
        return CompositeLoss(
            primary_loss=self.config.primary_loss,
            weights=self.config.loss_weights
        )
    
    def add_callback(self, callback: Callback):
        """Add training callback."""
        callback.set_trainer(self)
        self.callbacks.append(callback)
    
    def train_epoch(
        self,
        train_loader: DataLoader,
        val_loader: Optional[DataLoader] = None
    ) -> TrainingMetrics:
        """Train for one epoch."""
        self.model.train()
        
        # Training metrics
        train_losses = []
        train_metrics = {'predictions': [], 'targets': []}
        
        # Progress bar
        pbar = tqdm(train_loader, desc=f'Epoch {self.epoch}')
        
        for batch_idx, batch in enumerate(pbar):
            # Get batch data
            if isinstance(batch, (list, tuple)) and len(batch) == 2:
                features, targets = batch
                features = features.to(self.device)
                targets = targets.to(self.device)
            else:
                # Assume batch is features only
                features = batch.to(self.device)
                targets = None
            
            # Forward pass with mixed precision
            with torch.cuda.amp.autocast(enabled=self.config.use_amp):
                if hasattr(self.model, 'forward'):
                    outputs = self.model(features)
                    if isinstance(outputs, ModelOutput):
                        predictions = outputs.predictions
                        metadata = outputs.metadata
                    else:
                        predictions = outputs
                        metadata = {}
                else:
                    raise ValueError("Model must have forward method")
                
                # Calculate loss
                if targets is not None:
                    loss = self.loss_fn(predictions, targets, metadata)
                else:
                    # Self-supervised or unsupervised loss
                    loss = self.loss_fn(predictions, predictions, metadata)
            
            # Backward pass
            if self.config.gradient_accumulation_steps > 1:
                loss = loss / self.config.gradient_accumulation_steps
            
            if self.scaler:
                self.scaler.scale(loss).backward()
                
                if (batch_idx + 1) % self.config.gradient_accumulation_steps == 0:
                    # Gradient clipping
                    self.scaler.unscale_(self.optimizer)
                    torch.nn.utils.clip_grad_norm_(
                        self.model.parameters(),
                        self.config.gradient_clip
                    )
                    
                    self.scaler.step(self.optimizer)
                    self.scaler.update()
                    self.optimizer.zero_grad()
            else:
                loss.backward()
                
                if (batch_idx + 1) % self.config.gradient_accumulation_steps == 0:
                    torch.nn.utils.clip_grad_norm_(
                        self.model.parameters(),
                        self.config.gradient_clip
                    )
                    self.optimizer.step()
                    self.optimizer.zero_grad()
            
            # Record metrics
            train_losses.append(loss.item() * self.config.gradient_accumulation_steps)
            
            if targets is not None:
                train_metrics['predictions'].append(predictions.detach().cpu())
                train_metrics['targets'].append(targets.detach().cpu())
            
            # Update progress bar
            pbar.set_postfix({'loss': f'{loss.item():.6f}'})
        
        # Calculate epoch metrics
        avg_train_loss = np.mean(train_losses)
        
        # Calculate financial metrics
        financial_metrics = {}
        if train_metrics['predictions'] and train_metrics['targets']:
            all_preds = torch.cat(train_metrics['predictions'])
            all_targets = torch.cat(train_metrics['targets'])
            financial_metrics = self._calculate_financial_metrics(all_preds, all_targets)
        
        # Validation
        val_loss = 0.0
        val_metrics = {}
        if val_loader and self.epoch % self.config.validation_freq == 0:
            val_loss, val_metrics = self.validate(val_loader)
        
        # Create metrics object
        metrics = TrainingMetrics(
            epoch=self.epoch,
            train_loss=avg_train_loss,
            val_loss=val_loss,
            train_metrics=financial_metrics,
            val_metrics=val_metrics,
            learning_rate=self.optimizer.param_groups[0]['lr'],
            timestamp=time.time()
        )
        
        # Update learning rate
        if self.scheduler:
            if isinstance(self.scheduler, optim.lr_scheduler.ReduceLROnPlateau):
                self.scheduler.step(val_loss or avg_train_loss)
            else:
                self.scheduler.step()
        
        # SWA update
        if self.swa_model and self.epoch >= self.config.epochs * 0.75:
            self.swa_model.update_parameters(self.model)
            if self.swa_scheduler:
                self.swa_scheduler.step()
        
        # Store history
        self.training_history.append(metrics)
        
        return metrics
    
    def validate(self, val_loader: DataLoader) -> Tuple[float, Dict[str, float]]:
        """Validate model."""
        self.model.eval()
        val_losses = []
        val_predictions = []
        val_targets = []
        
        with torch.no_grad():
            for batch in val_loader:
                if isinstance(batch, (list, tuple)) and len(batch) == 2:
                    features, targets = batch
                    features = features.to(self.device)
                    targets = targets.to(self.device)
                else:
                    features = batch.to(self.device)
                    targets = None
                
                # Forward pass
                outputs = self.model(features)
                if isinstance(outputs, ModelOutput):
                    predictions = outputs.predictions
                    metadata = outputs.metadata
                else:
                    predictions = outputs
                    metadata = {}
                
                # Calculate loss
                if targets is not None:
                    loss = self.loss_fn(predictions, targets, metadata)
                    val_losses.append(loss.item())
                    val_predictions.append(predictions.cpu())
                    val_targets.append(targets.cpu())
        
        avg_val_loss = np.mean(val_losses) if val_losses else 0.0
        
        # Calculate validation metrics
        val_metrics = {}
        if val_predictions and val_targets:
            all_preds = torch.cat(val_predictions)
            all_targets = torch.cat(val_targets)
            val_metrics = self._calculate_financial_metrics(all_preds, all_targets)
        
        return avg_val_loss, val_metrics
    
    def _calculate_financial_metrics(
        self,
        predictions: torch.Tensor,
        targets: torch.Tensor
    ) -> Dict[str, float]:
        """Calculate financial performance metrics."""
        predictions = predictions.squeeze().numpy()
        targets = targets.squeeze().numpy()
        
        # Basic metrics
        mse = np.mean((predictions - targets) ** 2)
        mae = np.mean(np.abs(predictions - targets))
        
        # Directional accuracy
        pred_direction = np.sign(predictions)
        target_direction = np.sign(targets)
        directional_accuracy = np.mean(pred_direction == target_direction)
        
        # Information Ratio approximation
        tracking_error = np.std(predictions - targets)
        information_ratio = np.mean(predictions - targets) / (tracking_error + 1e-8)
        
        # Correlation
        correlation = np.corrcoef(predictions, targets)[0, 1] if len(predictions) > 1 else 0.0
        
        return {
            'mse': float(mse),
            'mae': float(mae),
            'directional_accuracy': float(directional_accuracy),
            'information_ratio': float(information_ratio),
            'correlation': float(correlation),
            'tracking_error': float(tracking_error)
        }
    
    def train(
        self,
        train_loader: DataLoader,
        val_loader: Optional[DataLoader] = None,
        epochs: Optional[int] = None
    ) -> List[TrainingMetrics]:
        """Main training loop."""
        epochs = epochs or self.config.epochs
        
        logger.info(f"Starting training for {epochs} epochs")
        logger.info(f"Model parameters: {sum(p.numel() for p in self.model.parameters()):,}")
        
        # Initialize callbacks
        for callback in self.callbacks:
            callback.on_train_begin()
        
        try:
            for epoch in range(epochs):
                self.epoch = epoch
                
                # Callback: on_epoch_begin
                for callback in self.callbacks:
                    callback.on_epoch_begin(epoch)
                
                # Train epoch
                metrics = self.train_epoch(train_loader, val_loader)
                
                # Callback: on_epoch_end
                for callback in self.callbacks:
                    callback.on_epoch_end(epoch, metrics)
                
                # Log metrics
                logger.info(
                    f"Epoch {epoch}: train_loss={metrics.train_loss:.6f}, "
                    f"val_loss={metrics.val_loss:.6f}, lr={metrics.learning_rate:.2e}"
                )
                
                # Check for early stopping
                should_stop = False
                for callback in self.callbacks:
                    if hasattr(callback, 'should_stop') and callback.should_stop():
                        should_stop = True
                        break
                
                if should_stop:
                    logger.info("Early stopping triggered")
                    break
        
        except KeyboardInterrupt:
            logger.info("Training interrupted by user")
        
        finally:
            # Finalize SWA if used
            if self.swa_model:
                optim.swa_utils.update_bn(train_loader, self.swa_model)
                logger.info("SWA model finalized")
            
            # Final callbacks
            for callback in self.callbacks:
                callback.on_train_end()
        
        return self.training_history
    
    def save_checkpoint(self, filepath: str):
        """Save training checkpoint."""
        checkpoint = {
            'epoch': self.epoch,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'scheduler_state_dict': self.scheduler.state_dict() if self.scheduler else None,
            'scaler_state_dict': self.scaler.state_dict() if self.scaler else None,
            'best_val_loss': self.best_val_loss,
            'config': self.config,
            'training_history': self.training_history
        }
        
        if self.swa_model:
            checkpoint['swa_model_state_dict'] = self.swa_model.state_dict()
        
        torch.save(checkpoint, filepath)
        logger.info(f"Checkpoint saved: {filepath}")
    
    def load_checkpoint(self, filepath: str):
        """Load training checkpoint."""
        checkpoint = torch.load(filepath, map_location=self.device)
        
        self.epoch = checkpoint['epoch']
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        
        if checkpoint['scheduler_state_dict'] and self.scheduler:
            self.scheduler.load_state_dict(checkpoint['scheduler_state_dict'])
        
        if checkpoint['scaler_state_dict'] and self.scaler:
            self.scaler.load_state_dict(checkpoint['scaler_state_dict'])
        
        self.best_val_loss = checkpoint['best_val_loss']
        self.training_history = checkpoint.get('training_history', [])
        
        if 'swa_model_state_dict' in checkpoint and self.swa_model:
            self.swa_model.load_state_dict(checkpoint['swa_model_state_dict'])
        
        logger.info(f"Checkpoint loaded: {filepath}")

class TrainingPipeline:
    """High-level training pipeline for GaryTaleb models."""
    
    def __init__(self, mlflow_experiment: str = None):
        self.mlflow_experiment = mlflow_experiment
        if mlflow_experiment:
            mlflow.set_experiment(mlflow_experiment)
    
    def train_model(
        self,
        model: nn.Module,
        train_features: FeatureSet,
        val_features: FeatureSet,
        config: TrainingConfig,
        model_name: str = "gary_taleb_model"
    ) -> ModelTrainer:
        """Train a model with the complete pipeline."""
        
        # Start MLflow run
        with mlflow.start_run(run_name=f"{model_name}_{int(time.time())}"):
            
            # Log parameters
            mlflow.log_params({
                'model_name': model_name,
                'epochs': config.epochs,
                'batch_size': config.batch_size,
                'learning_rate': config.learning_rate,
                'optimizer': config.optimizer,
                'scheduler': config.scheduler
            })
            
            # Create data loaders
            train_loader = self._create_dataloader(train_features, config, shuffle=True)
            val_loader = self._create_dataloader(val_features, config, shuffle=False)
            
            # Create trainer
            trainer = ModelTrainer(model, config)
            
            # Add standard callbacks
            trainer.add_callback(EarlyStopping(
                patience=config.patience,
                min_delta=config.min_delta
            ))
            
            trainer.add_callback(ModelCheckpoint(
                filepath=f"checkpoints/{model_name}_best.pt",
                monitor='val_loss',
                save_best_only=True
            ))
            
            trainer.add_callback(LearningRateMonitor())
            
            # Train model
            history = trainer.train(train_loader, val_loader)
            
            # Log metrics
            for metrics in history:
                mlflow.log_metrics({
                    'train_loss': metrics.train_loss,
                    'val_loss': metrics.val_loss,
                    'learning_rate': metrics.learning_rate,
                    **{f'train_{k}': v for k, v in metrics.train_metrics.items()},
                    **{f'val_{k}': v for k, v in metrics.val_metrics.items()}
                }, step=metrics.epoch)
            
            # Save final model
            final_model = trainer.swa_model if trainer.swa_model else trainer.model
            mlflow.pytorch.log_model(final_model, "model")
            
            # Save training artifacts
            trainer.save_checkpoint(f"final_checkpoint_{model_name}.pt")
            
            logger.info(f"Training completed for {model_name}")
            
            return trainer
    
    def _create_dataloader(
        self,
        feature_set: FeatureSet,
        config: TrainingConfig,
        shuffle: bool = True
    ) -> DataLoader:
        """Create DataLoader from FeatureSet."""
        
        # Convert to tensors
        features_tensor = torch.FloatTensor(feature_set.features.values)
        targets_tensor = torch.FloatTensor(feature_set.target.values).unsqueeze(1)
        
        # Create dataset
        dataset = TensorDataset(features_tensor, targets_tensor)
        
        # Create dataloader
        return DataLoader(
            dataset,
            batch_size=config.batch_size,
            shuffle=shuffle,
            num_workers=2,
            pin_memory=torch.cuda.is_available()
        )

# Example usage and testing
def test_training_pipeline():
    """Test the training pipeline."""
    from ..models.gary_dpi import GaryTalebPredictor
    from ..data.preprocessing import FeatureEngineering
    from ..data.loaders import MarketDataLoader
    
    async def run_test():
        # Get sample data
        async with MarketDataLoader() as loader:
            data = await loader.fetch_data('BTC/USDT', 'binance', '1h', limit=1000)
            
            if data:
                # Create features
                fe = FeatureEngineering()
                train_features, val_features = fe.create_features(data)
                
                # Create model
                model = GaryTalebPredictor(input_dim=len(train_features.feature_names))
                
                # Create training config
                config = TrainingConfig(
                    epochs=MAXIMUM_FUNCTION_PARAMETERS,  # Short test
                    batch_size=32,
                    learning_rate=1e-3
                )
                
                # Create and run pipeline
                pipeline = TrainingPipeline("test_experiment")
                trainer = pipeline.train_model(
                    model, train_features, val_features, config, "test_model"
                )
                
                print(f"Training completed with {len(trainer.training_history)} epochs")
                print(f"Best validation loss: {trainer.best_val_loss:.6f}")
    
    import asyncio
    asyncio.run(run_test())

if __name__ == "__main__":
    test_training_pipeline()