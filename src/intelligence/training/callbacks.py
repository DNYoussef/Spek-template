from src.constants.base import API_TIMEOUT_SECONDS

import torch
import numpy as np
from typing import Dict, List, Optional, Any, Callable
from abc import ABC, abstractmethod
from pathlib import Path
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

class Callback(ABC):
    """Abstract base class for training callbacks."""
    
    def __init__(self):
        self.trainer = None
    
    def set_trainer(self, trainer):
        """Set reference to trainer."""
        self.trainer = trainer
    
    def on_train_begin(self):
        """Called at the beginning of training."""
    
    def on_train_end(self):
        """Called at the end of training."""
    
    def on_epoch_begin(self, epoch: int):
        """Called at the beginning of each epoch."""
    
    def on_epoch_end(self, epoch: int, metrics: Any):
        """Called at the end of each epoch."""
    
    def on_batch_begin(self, batch_idx: int):
        """Called at the beginning of each batch."""
    
    def on_batch_end(self, batch_idx: int, loss: float):
        """Called at the end of each batch."""

class EarlyStopping(Callback):
    """Early stopping callback to prevent overfitting."""
    
    def __init__(
        self,
        monitor: str = 'val_loss',
        patience: int = 10,
        min_delta: float = 1e-6,
        mode: str = 'min',
        restore_best_weights: bool = True,
        verbose: bool = True
    ):
        super().__init__()
        self.monitor = monitor
        self.patience = patience
        self.min_delta = min_delta
        self.mode = mode
        self.restore_best_weights = restore_best_weights
        self.verbose = verbose
        
        self.best_score = None
        self.wait = 0
        self.stopped_epoch = 0
        self.best_weights = None
        
        # Set comparison function based on mode
        if mode == 'min':
            self.is_better = lambda current, best: current < best - self.min_delta
        else:
            self.is_better = lambda current, best: current > best + self.min_delta
    
    def on_train_begin(self):
        """Initialize early stopping."""
        self.wait = 0
        self.stopped_epoch = 0
        self.best_score = None
        self.best_weights = None
    
    def on_epoch_end(self, epoch: int, metrics: Any):
        """Check for early stopping condition."""
        # Get monitored metric
        if hasattr(metrics, self.monitor):
            current_score = getattr(metrics, self.monitor)
        elif hasattr(metrics, 'val_loss') and self.monitor == 'val_loss':
            current_score = metrics.val_loss
        elif hasattr(metrics, 'train_loss') and self.monitor == 'train_loss':
            current_score = metrics.train_loss
        else:
            logger.warning(f"Metric '{self.monitor}' not found in metrics")
            return
        
        # Check if this is the best score
        if self.best_score is None or self.is_better(current_score, self.best_score):
            self.best_score = current_score
            self.wait = 0
            
            # Save best weights
            if self.restore_best_weights and self.trainer:
                self.best_weights = {
                    k: v.clone().cpu() for k, v in self.trainer.model.state_dict().items()
                }
            
            if self.verbose:
                logger.info(f"Epoch {epoch}: {self.monitor} improved to {current_score:.6f}")
        
        else:
            self.wait += 1
            if self.verbose and self.wait > 1:
                logger.info(
                    f"Epoch {epoch}: {self.monitor} did not improve "
                    f"({self.wait}/{self.patience})"
                )
        
        # Update trainer's best validation loss for compatibility
        if self.trainer and self.monitor == 'val_loss':
            if self.best_score is not None:
                self.trainer.best_val_loss = self.best_score
    
    def should_stop(self) -> bool:
        """Check if training should stop."""
        return self.wait >= self.patience
    
    def on_train_end(self):
        """Restore best weights if training stopped early."""
        if self.should_stop() and self.restore_best_weights and self.best_weights:
            if self.trainer:
                # Move weights back to device
                device = next(self.trainer.model.parameters()).device
                state_dict = {
                    k: v.to(device) for k, v in self.best_weights.items()
                }
                self.trainer.model.load_state_dict(state_dict)
                
                logger.info(f"Early stopping triggered. Restored best weights.")

class ModelCheckpoint(Callback):
    """Save model checkpoints during training."""
    
    def __init__(
        self,
        filepath: str,
        monitor: str = 'val_loss',
        save_best_only: bool = True,
        save_weights_only: bool = False,
        mode: str = 'min',
        period: int = 1,
        verbose: bool = True
    ):
        super().__init__()
        self.filepath = filepath
        self.monitor = monitor
        self.save_best_only = save_best_only
        self.save_weights_only = save_weights_only
        self.mode = mode
        self.period = period
        self.verbose = verbose
        
        self.best_score = None
        self.epochs_since_last_save = 0
        
        # Create directory if it doesn't exist
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        
        # Set comparison function
        if mode == 'min':
            self.is_better = lambda current, best: current < best
        else:
            self.is_better = lambda current, best: current > best
    
    def on_epoch_end(self, epoch: int, metrics: Any):
        """Save checkpoint if conditions are met."""
        self.epochs_since_last_save += 1
        
        # Get monitored metric
        if hasattr(metrics, self.monitor):
            current_score = getattr(metrics, self.monitor)
        elif hasattr(metrics, 'val_loss') and self.monitor == 'val_loss':
            current_score = metrics.val_loss
        elif hasattr(metrics, 'train_loss') and self.monitor == 'train_loss':
            current_score = metrics.train_loss
        else:
            current_score = None
        
        save_checkpoint = False
        
        if self.save_best_only:
            if current_score is not None:
                if self.best_score is None or self.is_better(current_score, self.best_score):
                    self.best_score = current_score
                    save_checkpoint = True
        else:
            if self.epochs_since_last_save >= self.period:
                save_checkpoint = True
        
        if save_checkpoint and self.trainer:
            self._save_checkpoint(epoch, current_score)
            self.epochs_since_last_save = 0
    
    def _save_checkpoint(self, epoch: int, score: Optional[float]):
        """Save the actual checkpoint."""
        try:
            if self.save_weights_only:
                torch.save(self.trainer.model.state_dict(), self.filepath)
            else:
                self.trainer.save_checkpoint(self.filepath)
            
            if self.verbose:
                score_str = f" (score: {score:.6f})" if score is not None else ""
                logger.info(f"Checkpoint saved at epoch {epoch}{score_str}")
                
        except Exception as e:
            logger.error(f"Failed to save checkpoint: {e}")

class LearningRateMonitor(Callback):
    """Monitor and log learning rate changes."""
    
    def __init__(self, verbose: bool = True):
        super().__init__()
        self.verbose = verbose
        self.last_lr = None
    
    def on_epoch_end(self, epoch: int, metrics: Any):
        """Log learning rate if it changed."""
        if self.trainer and hasattr(metrics, 'learning_rate'):
            current_lr = metrics.learning_rate
            
            if self.last_lr is None or abs(current_lr - self.last_lr) > 1e-10:
                if self.verbose:
                    logger.info(f"Epoch {epoch}: Learning rate = {current_lr:.2e}")
                
                # Log to MLflow if available
                try:
                    mlflow.log_metric("learning_rate", current_lr, step=epoch)
                except:
                    pass
                
                self.last_lr = current_lr

class ReduceLROnPlateau(Callback):
    """Reduce learning rate when metric plateaus."""
    
    def __init__(
        self,
        monitor: str = 'val_loss',
        factor: float = 0.5,
        patience: int = 5,
        min_delta: float = 1e-6,
        cooldown: int = 0,
        min_lr: float = 1e-8,
        mode: str = 'min',
        verbose: bool = True
    ):
        super().__init__()
        self.monitor = monitor
        self.factor = factor
        self.patience = patience
        self.min_delta = min_delta
        self.cooldown = cooldown
        self.min_lr = min_lr
        self.mode = mode
        self.verbose = verbose
        
        self.best_score = None
        self.wait = 0
        self.cooldown_counter = 0
        
        if mode == 'min':
            self.is_better = lambda current, best: current < best - self.min_delta
        else:
            self.is_better = lambda current, best: current > best + self.min_delta
    
    def on_epoch_end(self, epoch: int, metrics: Any):
        """Check if learning rate should be reduced."""
        if self.cooldown_counter > 0:
            self.cooldown_counter -= 1
            return
        
        # Get monitored metric
        if hasattr(metrics, self.monitor):
            current_score = getattr(metrics, self.monitor)
        elif hasattr(metrics, 'val_loss') and self.monitor == 'val_loss':
            current_score = metrics.val_loss
        else:
            return
        
        if self.best_score is None or self.is_better(current_score, self.best_score):
            self.best_score = current_score
            self.wait = 0
        else:
            self.wait += 1
        
        if self.wait >= self.patience:
            self._reduce_lr()
            self.wait = 0
            self.cooldown_counter = self.cooldown
    
    def _reduce_lr(self):
        """Reduce learning rate."""
        if self.trainer:
            for param_group in self.trainer.optimizer.param_groups:
                old_lr = param_group['lr']
                new_lr = max(old_lr * self.factor, self.min_lr)
                param_group['lr'] = new_lr
                
                if self.verbose and new_lr != old_lr:
                    logger.info(f"Learning rate reduced: {old_lr:.2e} -> {new_lr:.2e}")

class MetricsLogger(Callback):
    """Log training metrics to various backends."""
    
    def __init__(
        self,
        log_to_mlflow: bool = True,
        log_to_console: bool = True,
        log_frequency: int = 1
    ):
        super().__init__()
        self.log_to_mlflow = log_to_mlflow
        self.log_to_console = log_to_console
        self.log_frequency = log_frequency
    
    def on_epoch_end(self, epoch: int, metrics: Any):
        """Log metrics at the end of each epoch."""
        if epoch % self.log_frequency != 0:
            return
        
        # Console logging
        if self.log_to_console:
            log_str = f"Epoch {epoch}:"
            log_str += f" train_loss={metrics.train_loss:.6f}"
            if metrics.val_loss > 0:
                log_str += f" val_loss={metrics.val_loss:.6f}"
            log_str += f" lr={metrics.learning_rate:.2e}"
            
            logger.info(log_str)
        
        # MLflow logging
        if self.log_to_mlflow:
            try:
                log_dict = {
                    'train_loss': metrics.train_loss,
                    'learning_rate': metrics.learning_rate
                }
                
                if metrics.val_loss > 0:
                    log_dict['val_loss'] = metrics.val_loss
                
                # Add training metrics
                for key, value in metrics.train_metrics.items():
                    log_dict[f'train_{key}'] = value
                
                # Add validation metrics  
                for key, value in metrics.val_metrics.items():
                    log_dict[f'val_{key}'] = value
                
                mlflow.log_metrics(log_dict, step=epoch)
                
            except Exception as e:
                logger.warning(f"Failed to log to MLflow: {e}")

class GradientClipper(Callback):
    """Clip gradients to prevent exploding gradients."""
    
    def __init__(self, max_norm: float = 1.0, norm_type: float = 2.0):
        super().__init__()
        self.max_norm = max_norm
        self.norm_type = norm_type
        
    def on_batch_end(self, batch_idx: int, loss: float):
        """Clip gradients after backward pass."""
        if self.trainer:
            torch.nn.utils.clip_grad_norm_(
                self.trainer.model.parameters(),
                max_norm=self.max_norm,
                norm_type=self.norm_type
            )

class ModelEMA(Callback):
    """Exponential Moving Average of model weights."""
    
    def __init__(self, decay: float = 0.999):
        super().__init__()
        self.decay = decay
        self.ema_model = None
        self.updates = 0
    
    def on_train_begin(self):
        """Initialize EMA model."""
        if self.trainer:
            self.ema_model = {
                name: param.clone().detach()
                for name, param in self.trainer.model.named_parameters()
            }
    
    def on_batch_end(self, batch_idx: int, loss: float):
        """Update EMA weights."""
        if self.ema_model and self.trainer:
            self.updates += 1
            
            # Adjust decay based on number of updates
            decay = min(self.decay, (1 + self.updates) / (10 + self.updates))
            
            with torch.no_grad():
                for name, param in self.trainer.model.named_parameters():
                    if param.requires_grad:
                        self.ema_model[name].mul_(decay).add_(param, alpha=1 - decay)
    
    def apply_ema(self):
        """Apply EMA weights to model."""
        if self.ema_model and self.trainer:
            with torch.no_grad():
                for name, param in self.trainer.model.named_parameters():
                    if name in self.ema_model:
                        param.copy_(self.ema_model[name])

class WarmupScheduler(Callback):
    """Learning rate warmup scheduler."""
    
    def __init__(
        self,
        warmup_epochs: int = 5,
        initial_lr: float = 1e-6,
        target_lr: Optional[float] = None
    ):
        super().__init__()
        self.warmup_epochs = warmup_epochs
        self.initial_lr = initial_lr
        self.target_lr = target_lr
        
    def on_train_begin(self):
        """Set initial learning rate."""
        if self.trainer and self.warmup_epochs > 0:
            if self.target_lr is None:
                self.target_lr = self.trainer.optimizer.param_groups[0]['lr']
            
            # Set initial LR
            for param_group in self.trainer.optimizer.param_groups:
                param_group['lr'] = self.initial_lr
    
    def on_epoch_begin(self, epoch: int):
        """Update learning rate during warmup."""
        if epoch < self.warmup_epochs and self.trainer:
            # Linear warmup
            lr = self.initial_lr + (self.target_lr - self.initial_lr) * epoch / self.warmup_epochs
            
            for param_group in self.trainer.optimizer.param_groups:
                param_group['lr'] = lr

class CallbackList:
    """Container for multiple callbacks."""
    
    def __init__(self, callbacks: List[Callback]):
        self.callbacks = callbacks
    
    def set_trainer(self, trainer):
        """Set trainer for all callbacks."""
        for callback in self.callbacks:
            callback.set_trainer(trainer)
    
    def on_train_begin(self):
        """Call on_train_begin for all callbacks."""
        for callback in self.callbacks:
            callback.on_train_begin()
    
    def on_train_end(self):
        """Call on_train_end for all callbacks."""
        for callback in self.callbacks:
            callback.on_train_end()
    
    def on_epoch_begin(self, epoch: int):
        """Call on_epoch_begin for all callbacks."""
        for callback in self.callbacks:
            callback.on_epoch_begin(epoch)
    
    def on_epoch_end(self, epoch: int, metrics: Any):
        """Call on_epoch_end for all callbacks."""
        for callback in self.callbacks:
            callback.on_epoch_end(epoch, metrics)
    
    def on_batch_begin(self, batch_idx: int):
        """Call on_batch_begin for all callbacks."""
        for callback in self.callbacks:
            callback.on_batch_begin(batch_idx)
    
    def on_batch_end(self, batch_idx: int, loss: float):
        """Call on_batch_end for all callbacks."""
        for callback in self.callbacks:
            callback.on_batch_end(batch_idx, loss)

# Example usage and testing
def test_callbacks():
    """Test callback functionality."""
    from dataclasses import dataclass
    
    @dataclass
    class MockMetrics:
        epoch: int = 0
        train_loss: float = 1.0
        val_loss: float = 1.0
        train_metrics: Dict = None
        val_metrics: Dict = None
        learning_rate: float = 1e-3
        
        def __post_init__(self):
            if self.train_metrics is None:
                self.train_metrics = {}
            if self.val_metrics is None:
                self.val_metrics = {}
    
    print("=" * 40)
    
    # Test EarlyStopping
    early_stopping = EarlyStopping(patience=3, verbose=True)
    
    # Simulate training with improving then worsening loss
    losses = [1.0, 0.8, 0.6, 0.5, 0.7, 0.9, 1.1]
    
    for epoch, loss in enumerate(losses):
        metrics = MockMetrics(epoch=epoch, val_loss=loss)
        early_stopping.on_epoch_end(epoch, metrics)
        
        should_stop = early_stopping.should_stop()
        print(f"Epoch {epoch}: val_loss={loss:.1f}, should_stop={should_stop}")
        
        if should_stop:
            print("Early stopping triggered!")
            break
    
    print("-" * API_TIMEOUT_SECONDS)
    
    lr_monitor = LearningRateMonitor(verbose=True)
    
    learning_rates = [1e-3, 1e-3, 5e-4, 5e-4, 1e-4]
    for epoch, lr in enumerate(learning_rates):
        metrics = MockMetrics(epoch=epoch, learning_rate=lr)
        lr_monitor.on_epoch_end(epoch, metrics)

if __name__ == "__main__":
    test_callbacks()