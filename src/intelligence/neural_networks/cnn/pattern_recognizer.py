"""Chart Pattern CNN Recognizer

ResNet-based CNN for real-time chart pattern recognition.
Identifies 20+ chart patterns with <100ms inference and Gary×Taleb integration.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from typing import Dict, List, Tuple, Optional, Any, Union
import time
from dataclasses import dataclass
import cv2
from PIL import Image
import matplotlib.pyplot as plt
import io
import base64

from .resnet_backbone import FinancialResNet, create_fast_financial_resnet
from .pattern_definitions import CHART_PATTERNS, PatternCharacteristics, get_pattern_by_name


@dataclass
class PatternConfig:
    """Configuration for pattern recognizer."""
    image_size: Tuple[int, int] = (224, 224)  # Input image dimensions
    sequence_length: int = 60  # Number of candlesticks
    num_patterns: int = 21  # 20 patterns + background
    confidence_threshold: float = 0.7
    batch_size: int = 16
    device: str = 'cuda' if torch.cuda.is_available() else 'cpu'

    # Gary×Taleb integration
    dpi_weight: float = 0.25
    antifragile_weight: float = 0.20
    volume_importance: float = 0.8

    # Pattern detection thresholds
    pattern_strength_threshold: float = 0.6
    volume_confirmation_required: bool = True
    multi_timeframe_validation: bool = True


class ChartRenderer:
    """Render OHLCV data as candlestick charts for CNN input."""

    def __init__(self, image_size: Tuple[int, int] = (224, 224)):
        """Initialize chart renderer.

        Args:
            image_size: Output image dimensions
        """
        self.image_size = image_size
        self.dpi = 100

    def ohlcv_to_image(self,
                      ohlcv_data: np.ndarray,
                      volume_overlay: bool = True,
                      style: str = 'candlestick') -> np.ndarray:
        """Convert OHLCV data to chart image.

        Args:
            ohlcv_data: OHLCV data [seq_len, 5] (Open, High, Low, Close, Volume)
            volume_overlay: Include volume bars
            style: Chart style ('candlestick' or 'ohlc')

        Returns:
            Chart image as numpy array [H, W, C]
        """
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(self.image_size[0]/self.dpi, self.image_size[1]/self.dpi),
                                      dpi=self.dpi, gridspec_kw={'height_ratios': [3, 1]})

        # Extract OHLCV
        opens = ohlcv_data[:, 0]
        highs = ohlcv_data[:, 1]
        lows = ohlcv_data[:, 2]
        closes = ohlcv_data[:, 3]
        volumes = ohlcv_data[:, 4]

        x_pos = np.arange(len(ohlcv_data))

        # Price chart
        if style == 'candlestick':
            self._draw_candlesticks(ax1, x_pos, opens, highs, lows, closes)
        else:
            self._draw_ohlc_bars(ax1, x_pos, opens, highs, lows, closes)

        # Volume chart
        if volume_overlay:
            colors = ['green' if c >= o else 'red' for c, o in zip(closes, opens)]
            ax2.bar(x_pos, volumes, color=colors, alpha=0.7)
            ax2.set_ylabel('Volume')

        # Formatting
        ax1.set_ylabel('Price')
        ax1.grid(True, alpha=0.3)
        ax2.grid(True, alpha=0.3)
        ax2.set_xlabel('Time')

        # Remove axis labels for CNN input
        ax1.set_xticks([])
        ax1.set_yticks([])
        ax2.set_xticks([])
        ax2.set_yticks([])

        # Convert to image
        fig.tight_layout(pad=0.1)
        buf = io.BytesIO()
        fig.savefig(buf, format='png', dpi=self.dpi, bbox_inches='tight', pad_inches=0)
        buf.seek(0)

        # Load as numpy array
        img = Image.open(buf)
        img_array = np.array(img)
        plt.close(fig)
        buf.close()

        # Resize to target size
        img_resized = cv2.resize(img_array, self.image_size)

        return img_resized

    def _draw_candlesticks(self, ax, x_pos, opens, highs, lows, closes):
        """Draw candlestick chart."""
        for i, (x, o, h, l, c) in enumerate(zip(x_pos, opens, highs, lows, closes)):
            color = 'green' if c >= o else 'red'

            # High-low line
            ax.plot([x, x], [l, h], color='black', linewidth=0.8)

            # Candlestick body
            body_height = abs(c - o)
            body_bottom = min(o, c)

            rect = plt.Rectangle((x - 0.3, body_bottom), 0.6, body_height,
                               facecolor=color, edgecolor='black', linewidth=0.5,
                               alpha=0.8 if c >= o else 1.0)
            ax.add_patch(rect)

    def _draw_ohlc_bars(self, ax, x_pos, opens, highs, lows, closes):
        """Draw OHLC bar chart."""
        for i, (x, o, h, l, c) in enumerate(zip(x_pos, opens, highs, lows, closes)):
            color = 'green' if c >= o else 'red'

            # High-low line
            ax.plot([x, x], [l, h], color=color, linewidth=1.2)

            # Open tick (left)
            ax.plot([x - 0.3, x], [o, o], color=color, linewidth=1.2)

            # Close tick (right)
            ax.plot([x, x + 0.3], [c, c], color=color, linewidth=1.2)

    def create_multi_timeframe_image(self,
                                   ohlcv_1m: np.ndarray,
                                   ohlcv_5m: np.ndarray,
                                   ohlcv_15m: np.ndarray) -> np.ndarray:
        """Create multi-timeframe chart image.

        Args:
            ohlcv_1m: 1-minute OHLCV data
            ohlcv_5m: 5-minute OHLCV data
            ohlcv_15m: 15-minute OHLCV data

        Returns:
            Combined multi-timeframe image
        """
        # Create individual charts
        chart_1m = self.ohlcv_to_image(ohlcv_1m)
        chart_5m = self.ohlcv_to_image(ohlcv_5m)
        chart_15m = self.ohlcv_to_image(ohlcv_15m)

        # Combine charts vertically
        combined = np.vstack([chart_15m, chart_5m, chart_1m])

        # Resize to target dimensions
        combined_resized = cv2.resize(combined, self.image_size)

        return combined_resized


class ChartPatternCNN(nn.Module):
    """CNN for chart pattern recognition with Gary×Taleb integration.

    Features:
    - 20+ chart pattern recognition
    - Real-time inference <100ms
    - Gary's DPI integration
    - Taleb's antifragility principles
    - Multi-timeframe validation
    """

    def __init__(self, config: PatternConfig):
        """Initialize pattern recognizer.

        Args:
            config: Pattern recognition configuration
        """
        super(ChartPatternCNN, self).__init__()

        self.config = config
        self.device = torch.device(config.device)

        # Chart renderer
        self.renderer = ChartRenderer(config.image_size)

        # ResNet backbone
        self.backbone = create_fast_financial_resnet(
            num_classes=config.num_patterns,
            input_channels=3,  # RGB image input
            financial_enhancement=True
        )

        # Pattern-specific processing layers
        self.pattern_processors = nn.ModuleDict()
        for pattern_name in CHART_PATTERNS.keys():
            self.pattern_processors[pattern_name] = nn.Sequential(
                nn.Linear(256, 128),
                nn.ReLU(),
                nn.Dropout(0.1),
                nn.Linear(128, 1),
                nn.Sigmoid()
            )

        # Gary's DPI integration network
        self.dpi_network = nn.Sequential(
            nn.Linear(256 + 5, 128),  # Features + OHLCV statistics
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

        # Taleb's antifragility assessment
        self.antifragile_network = nn.Sequential(
            nn.Linear(256, 128),
            nn.Tanh(),  # Symmetric activation for antifragility
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

        # Multi-timeframe fusion
        self.timeframe_fusion = nn.Sequential(
            nn.Linear(256 * 3, 512),  # 3 timeframes
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Linear(256, config.num_patterns)
        )

        # Performance tracking
        self.inference_times = []
        self.pattern_detections = {pattern: 0 for pattern in CHART_PATTERNS.keys()}

    def forward(self,
                chart_images: torch.Tensor,
                ohlcv_stats: Optional[torch.Tensor] = None,
                multi_timeframe: bool = False) -> Dict[str, torch.Tensor]:
        """Forward pass through pattern recognizer.

        Args:
            chart_images: Chart images [B, C, H, W]
            ohlcv_stats: Optional OHLCV statistics [B, 5]
            multi_timeframe: Whether input contains multiple timeframes

        Returns:
            Pattern recognition outputs
        """
        start_time = time.time()

        batch_size = chart_images.size(0)

        if multi_timeframe:
            # Split into timeframes and process separately
            tf_features = []
            for i in range(3):  # 3 timeframes
                tf_chart = chart_images[:, :, i*self.config.image_size[0]:(i+1)*self.config.image_size[0], :]
                tf_output = self.backbone(tf_chart)
                tf_features.append(tf_output['enhanced_features'])

            # Fuse timeframe features
            fused_features = torch.cat(tf_features, dim=1)
            main_logits = self.timeframe_fusion(fused_features)
            main_output = {
                'logits': main_logits,
                'probabilities': F.softmax(main_logits, dim=-1),
                'enhanced_features': fused_features.mean(dim=1),  # Average for compatibility
                'dpi_score': tf_features[0].new_zeros(batch_size, 1),  # Placeholder
                'antifragile_boost': tf_features[0].new_zeros(batch_size, 1)  # Placeholder
            }
        else:
            # Single timeframe processing
            main_output = self.backbone(chart_images)

        # Extract enhanced features
        enhanced_features = main_output['enhanced_features']

        # Pattern-specific processing
        pattern_scores = {}
        for pattern_name in CHART_PATTERNS.keys():
            pattern_scores[pattern_name] = self.pattern_processors[pattern_name](enhanced_features)

        # Gary's DPI calculation
        if ohlcv_stats is not None:
            dpi_input = torch.cat([enhanced_features, ohlcv_stats], dim=1)
            dpi_score = self.dpi_network(dpi_input)
        else:
            dpi_score = main_output.get('dpi_score', torch.zeros(batch_size, 1, device=self.device))

        # Taleb's antifragility assessment
        antifragile_score = self.antifragile_network(enhanced_features)

        # Combine all outputs
        combined_logits = main_output['logits']

        # Apply Gary×Taleb weighting
        if self.config.dpi_weight > 0:
            dpi_weights = 1 + self.config.dpi_weight * dpi_score
            combined_logits = combined_logits * dpi_weights

        if self.config.antifragile_weight > 0:
            antifragile_weights = 1 + self.config.antifragile_weight * antifragile_score
            combined_logits = combined_logits * antifragile_weights

        final_probabilities = F.softmax(combined_logits, dim=-1)

        # Pattern strength assessment
        pattern_strengths = self._assess_pattern_strengths(pattern_scores, final_probabilities)

        # Track inference time
        inference_time = (time.time() - start_time) * 1000
        self.inference_times.append(inference_time)

        return {
            'probabilities': final_probabilities,
            'pattern_scores': pattern_scores,
            'pattern_strengths': pattern_strengths,
            'dpi_score': dpi_score,
            'antifragile_score': antifragile_score,
            'enhanced_features': enhanced_features,
            'inference_time_ms': inference_time,
            'gary_dpi_integrated': self.config.dpi_weight > 0,
            'taleb_antifragile_enhanced': self.config.antifragile_weight > 0
        }

    def _assess_pattern_strengths(self,
                                pattern_scores: Dict[str, torch.Tensor],
                                probabilities: torch.Tensor) -> Dict[str, torch.Tensor]:
        """Assess strength of detected patterns.

        Args:
            pattern_scores: Individual pattern scores
            probabilities: Overall pattern probabilities

        Returns:
            Pattern strength assessments
        """
        strengths = {}

        for i, pattern_name in enumerate(CHART_PATTERNS.keys()):
            if i < probabilities.size(1) - 1:  # Exclude background class
                pattern_char = get_pattern_by_name(pattern_name)

                # Base strength from model
                base_strength = pattern_scores[pattern_name]

                # Weighted by pattern reliability
                reliability_weight = pattern_char.success_rate

                # Weighted by overall probability
                prob_weight = probabilities[:, i:i+1]

                # Combined strength
                combined_strength = base_strength * reliability_weight * prob_weight
                strengths[pattern_name] = combined_strength

        return strengths

    def detect_patterns(self,
                       ohlcv_data: np.ndarray,
                       multi_timeframe_data: Optional[Dict[str, np.ndarray]] = None,
                       return_visualization: bool = False) -> Dict[str, Any]:
        """Detect chart patterns in OHLCV data.

        Args:
            ohlcv_data: OHLCV data [seq_len, 5]
            multi_timeframe_data: Optional multi-timeframe data
            return_visualization: Return chart visualization

        Returns:
            Pattern detection results
        """
        self.eval()

        with torch.no_grad():
            # Render chart image
            if multi_timeframe_data is not None:
                chart_image = self.renderer.create_multi_timeframe_image(
                    multi_timeframe_data.get('1m', ohlcv_data),
                    multi_timeframe_data.get('5m', ohlcv_data[::5]),
                    multi_timeframe_data.get('15m', ohlcv_data[::15])
                )
                is_multi_timeframe = True
            else:
                chart_image = self.renderer.ohlcv_to_image(ohlcv_data)
                is_multi_timeframe = False

            # Prepare input tensor
            chart_tensor = torch.FloatTensor(chart_image).permute(2, 0, 1).unsqueeze(0)
            chart_tensor = chart_tensor / 255.0  # Normalize to [0, 1]
            chart_tensor = chart_tensor.to(self.device)

            # Prepare OHLCV statistics
            ohlcv_stats = self._compute_ohlcv_statistics(ohlcv_data)
            ohlcv_stats_tensor = torch.FloatTensor(ohlcv_stats).unsqueeze(0).to(self.device)

            # Forward pass
            outputs = self.forward(chart_tensor, ohlcv_stats_tensor, is_multi_timeframe)

            # Process results
            probabilities = outputs['probabilities'][0].cpu().numpy()
            pattern_scores = {k: v[0].cpu().numpy() for k, v in outputs['pattern_scores'].items()}
            pattern_strengths = {k: v[0].cpu().numpy() for k, v in outputs['pattern_strengths'].items()}

            # Identify detected patterns
            detected_patterns = []
            pattern_names = list(CHART_PATTERNS.keys()) + ['background']

            for i, prob in enumerate(probabilities):
                if i < len(pattern_names) - 1:  # Exclude background
                    pattern_name = pattern_names[i]
                    if prob > self.config.confidence_threshold:
                        pattern_char = get_pattern_by_name(pattern_name)

                        detected_patterns.append({
                            'pattern': pattern_name,
                            'probability': float(prob),
                            'confidence': float(pattern_scores[pattern_name].item()),
                            'strength': float(pattern_strengths[pattern_name].item()),
                            'characteristics': {
                                'type': pattern_char.pattern_type.value,
                                'strength_category': pattern_char.strength.name,
                                'success_rate': pattern_char.success_rate,
                                'avg_move_pct': pattern_char.avg_move_pct,
                                'bullish_implications': pattern_char.bullish_implications,
                                'bearish_implications': pattern_char.bearish_implications
                            },
                            'trading_signal': self._generate_pattern_trading_signal(pattern_name, prob, pattern_char),
                            'gary_dpi_weight': pattern_char.gary_dpi_weight,
                            'taleb_antifragility_factor': pattern_char.taleb_antifragility_factor
                        })

            # Sort by probability
            detected_patterns.sort(key=lambda x: x['probability'], reverse=True)

            # Gary's DPI analysis
            dpi_analysis = self._analyze_dpi_factors(ohlcv_data, outputs['dpi_score'][0].cpu().numpy())

            # Taleb's antifragility assessment
            antifragile_assessment = self._assess_antifragility(
                detected_patterns, outputs['antifragile_score'][0].cpu().numpy()
            )

            result = {
                'detected_patterns': detected_patterns,
                'all_probabilities': {name: float(prob) for name, prob in zip(pattern_names, probabilities)},
                'dpi_analysis': dpi_analysis,
                'antifragile_assessment': antifragile_assessment,
                'inference_time_ms': outputs['inference_time_ms'],
                'multi_timeframe_validated': is_multi_timeframe,
                'ohlcv_statistics': ohlcv_stats.tolist(),
                'model_confidence': float(np.max(probabilities)),
                'background_probability': float(probabilities[-1])
            }

            # Add visualization if requested
            if return_visualization:
                result['chart_visualization'] = self._encode_image_base64(chart_image)

            # Update detection statistics
            for pattern in detected_patterns:
                self.pattern_detections[pattern['pattern']] += 1

            return result

    def _compute_ohlcv_statistics(self, ohlcv_data: np.ndarray) -> np.ndarray:
        """Compute OHLCV statistical features.

        Args:
            ohlcv_data: OHLCV data [seq_len, 5]

        Returns:
            Statistical features array
        """
        closes = ohlcv_data[:, 3]
        volumes = ohlcv_data[:, 4]

        stats = np.array([
            np.mean(closes[-20:]),  # Recent average price
            np.std(closes[-20:]),   # Recent volatility
            np.mean(volumes[-20:]), # Recent average volume
            (closes[-1] - closes[0]) / closes[0],  # Total return
            np.mean(volumes[-5:]) / np.mean(volumes[-20:])  # Recent volume ratio
        ])

        return stats

    def _generate_pattern_trading_signal(self,
                                       pattern_name: str,
                                       probability: float,
                                       pattern_char: PatternCharacteristics) -> Dict[str, Any]:
        """Generate trading signal for detected pattern.

        Args:
            pattern_name: Name of detected pattern
            probability: Pattern probability
            pattern_char: Pattern characteristics

        Returns:
            Trading signal information
        """
        # Base signal strength
        signal_strength = probability * pattern_char.success_rate

        # Determine signal direction
        if pattern_char.pattern_type.value == 'reversal':
            if 'bullish' in pattern_char.bullish_implications.lower():
                signal = 'BUY'
                direction = 1
            elif 'bearish' in pattern_char.bearish_implications.lower():
                signal = 'SELL'
                direction = -1
            else:
                signal = 'HOLD'
                direction = 0
        elif pattern_char.pattern_type.value == 'continuation':
            # Continuation patterns depend on existing trend
            signal = 'HOLD'  # Would need trend context
            direction = 0
        else:
            signal = 'HOLD'
            direction = 0

        return {
            'signal': signal,
            'direction': direction,
            'strength': float(signal_strength),
            'expected_move_pct': pattern_char.avg_move_pct,
            'pattern_type': pattern_char.pattern_type.value,
            'reliability': pattern_char.success_rate,
            'volume_importance': pattern_char.volume_importance,
            'entry_strategy': pattern_char.entry_strategy,
            'stop_loss_strategy': pattern_char.stop_loss_strategy,
            'target_calculation': pattern_char.target_calculation
        }

    def _analyze_dpi_factors(self, ohlcv_data: np.ndarray, dpi_score: float) -> Dict[str, Any]:
        """Analyze Gary's DPI factors for pattern context.

        Args:
            ohlcv_data: OHLCV data
            dpi_score: DPI score from model

        Returns:
            DPI analysis results
        """
        closes = ohlcv_data[:, 3]
        volumes = ohlcv_data[:, 4]

        # Price momentum analysis
        short_momentum = (closes[-5:].mean() - closes[-10:-5].mean()) / closes[-10:-5].mean()
        long_momentum = (closes[-10:].mean() - closes[-20:-10].mean()) / closes[-20:-10].mean()

        # Volume analysis
        volume_trend = (volumes[-5:].mean() - volumes[-10:-5].mean()) / volumes[-10:-5].mean()

        # Volatility analysis
        volatility = np.std(closes[-20:]) / closes[-20:].mean()

        return {
            'dpi_composite_score': float(dpi_score),
            'short_term_momentum': float(short_momentum),
            'long_term_momentum': float(long_momentum),
            'volume_trend': float(volume_trend),
            'volatility_factor': float(volatility),
            'momentum_alignment': abs(short_momentum - long_momentum) < 0.02,
            'volume_confirmation': volume_trend > 0.1,
            'gary_dpi_signals': {
                'momentum_strong': abs(short_momentum) > 0.05,
                'volume_supporting': volume_trend > 0.05,
                'volatility_manageable': volatility < 0.3,
                'trend_consistent': short_momentum * long_momentum > 0
            }
        }

    def _assess_antifragility(self,
                            detected_patterns: List[Dict],
                            antifragile_score: float) -> Dict[str, Any]:
        """Assess Taleb's antifragility for detected patterns.

        Args:
            detected_patterns: Detected pattern list
            antifragile_score: Antifragility score from model

        Returns:
            Antifragility assessment
        """
        # Analyze pattern antifragility characteristics
        high_antifragile_patterns = []
        total_antifragile_weight = 0.0

        for pattern in detected_patterns:
            af_factor = pattern['taleb_antifragility_factor']
            if af_factor > 0.6:
                high_antifragile_patterns.append({
                    'pattern': pattern['pattern'],
                    'antifragility_factor': af_factor,
                    'probability': pattern['probability']
                })
            total_antifragile_weight += af_factor * pattern['probability']

        return {
            'antifragile_composite_score': float(antifragile_score),
            'total_antifragile_weight': float(total_antifragile_weight),
            'high_antifragile_patterns': high_antifragile_patterns,
            'market_stress_opportunity': antifragile_score > 0.7,
            'volatility_beneficial': len(high_antifragile_patterns) > 0,
            'taleb_principles': {
                'benefits_from_disorder': antifragile_score > 0.6,
                'asymmetric_payoff': any(p['characteristics']['avg_move_pct'] > 0.15 for p in detected_patterns),
                'limited_downside': any('stop_loss' in p['trading_signal']['stop_loss_strategy'] for p in detected_patterns),
                'unlimited_upside': any(p['characteristics']['success_rate'] > 0.75 for p in detected_patterns)
            }
        }

    def _encode_image_base64(self, image: np.ndarray) -> str:
        """Encode image as base64 string.

        Args:
            image: Image array

        Returns:
            Base64 encoded image string
        """
        # Convert to PIL Image
        pil_image = Image.fromarray(image.astype(np.uint8))

        # Save to bytes buffer
        buffer = io.BytesIO()
        pil_image.save(buffer, format='PNG')
        buffer.seek(0)

        # Encode as base64
        image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        buffer.close()

        return f\"data:image/png;base64,{image_base64}\"

    def get_performance_metrics(self) -> Dict[str, Any]:
        \"\"\"Get model performance metrics.\"\"\"
        if not self.inference_times:
            return {\"status\": \"No inference data available\"}

        recent_times = self.inference_times[-100:]

        return {
            'avg_inference_time_ms': np.mean(recent_times),
            'max_inference_time_ms': np.max(recent_times),
            'min_inference_time_ms': np.min(recent_times),
            'inference_target_met': np.mean(recent_times) < 100,
            'total_detections': sum(self.pattern_detections.values()),
            'pattern_detection_counts': self.pattern_detections.copy(),
            'most_detected_pattern': max(self.pattern_detections.items(), key=lambda x: x[1]),
            'model_parameters': sum(p.numel() for p in self.parameters()),
            'supported_patterns': len(CHART_PATTERNS),
            'gary_dpi_integration': self.config.dpi_weight > 0,
            'taleb_antifragile_enhancement': self.config.antifragile_weight > 0
        }


# Factory function for easy creation
def create_pattern_recognizer(
    image_size: Tuple[int, int] = (224, 224),
    confidence_threshold: float = 0.7,
    enable_dpi: bool = True,
    enable_antifragile: bool = True,
    fast_mode: bool = True
) -> ChartPatternCNN:
    \"\"\"Create chart pattern recognizer with Gary×Taleb integration.

    Args:
        image_size: Input image size
        confidence_threshold: Pattern detection threshold
        enable_dpi: Enable Gary's DPI calculations
        enable_antifragile: Enable Taleb's antifragility assessment
        fast_mode: Optimize for <100ms inference

    Returns:
        Configured pattern recognizer
    \"\"\"
    config = PatternConfig(
        image_size=image_size,
        confidence_threshold=confidence_threshold,
        dpi_weight=0.25 if enable_dpi else 0.0,
        antifragile_weight=0.20 if enable_antifragile else 0.0
    )

    model = ChartPatternCNN(config)

    if fast_mode:
        # Optimize for fast inference
        model.eval()
        for param in model.parameters():
            param.requires_grad = False

        # Compile if available
        if torch.__version__ >= \"2.0.0\":
            model = torch.compile(model, mode='max-autotune')

    print(f\"Chart Pattern CNN created with {len(CHART_PATTERNS)} patterns\")
    print(f\"Gary×Taleb integration: DPI={enable_dpi}, Antifragile={enable_antifragile}\")
    print(f\"Target inference time: <100ms\")

    return model"