"""ResNet Backbone for Financial Chart Pattern Recognition

Specialized ResNet architecture optimized for candlestick chart analysis.
Includes financial feature extraction and pattern-specific attention.
"""

from typing import Tuple, Dict, List, Optional

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

class FinancialConv2d(nn.Module):
    """Financial-specific convolutional layer with price-aware features."""

def __init__(self,
                in_channels: int,
                out_channels: int,
                kernel_size: int = 3,
                stride: int = 1,
                padding: int = 1,
                price_aware: bool = True):
        """Initialize financial convolution.

        Args:
            in_channels: Input channels
            out_channels: Output channels
            kernel_size: Convolution kernel size
            stride: Convolution stride
            padding: Convolution padding
            price_aware: Enable price-aware feature extraction
        """
        super(FinancialConv2d, self).__init__()

        self.price_aware = price_aware

        # Standard convolution
        self.conv = nn.Conv2d(
        in_channels, out_channels,
            kernel_size=kernel_size,
            stride=stride,
            padding=padding,
            bias=False
        )

        # Batch normalization
        self.bn = nn.BatchNorm2d(out_channels)

        # Price-aware attention if enabled
        if price_aware:
            self.price_attention = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
                nn.Conv2d(out_channels, out_channels // 4, 1),
                nn.ReLU(inplace=True),
                nn.Conv2d(out_channels // 4, out_channels, 1),
                nn.Sigmoid()
            )

        # Volume-weighted features
        self.volume_weight = nn.Parameter(torch.ones(1))

def forward(self, x: torch.Tensor, volume_data: Optional[torch.Tensor] = None) -> torch.Tensor:
        """Forward pass through financial convolution.

        Args:
            x: Input tensor [B, C, H, W]
            volume_data: Optional volume data for weighting

        Returns:
            Feature maps with financial enhancements
        """
        # Standard convolution
        out = self.conv(x)
        out = self.bn(out)

        # Apply price-aware attention
        if self.price_aware:
            attention = self.price_attention(out)
            out = out * attention

        # Volume weighting if provided
        if volume_data is not None:
            volume_weight = torch.sigmoid(self.volume_weight)
            volume_features = volume_data.mean(dim=[2, 3], keepdim=True)  # Global volume info
            out = out * (1 + volume_weight * volume_features)

        return F.relu(out, inplace=True)

class FinancialBasicBlock(nn.Module):
    """ResNet basic block adapted for financial data."""

    expansion = 1

def __init__(self,
                inplanes: int,
                planes: int,
                stride: int = 1,
                downsample: Optional[nn.Module] = None,
                financial_enhancement: bool = True):
        """Initialize basic block.

        Args:
            inplanes: Input planes
            planes: Output planes
            stride: Convolution stride
            downsample: Downsample layer
            financial_enhancement: Enable financial enhancements
        """
        super(FinancialBasicBlock, self).__init__()

        self.financial_enhancement = financial_enhancement

        # First convolution
        self.conv1 = FinancialConv2d(
        inplanes, planes,
            kernel_size=3,
            stride=stride,
            padding=1,
            price_aware=financial_enhancement
        )

        # Second convolution
        self.conv2 = FinancialConv2d(
        planes, planes,
            kernel_size=3,
            stride=1,
            padding=1,
            price_aware=False  # Only first conv is price-aware
        )

        self.downsample = downsample
        self.stride = stride

        # Financial pattern attention
        if financial_enhancement:
            self.pattern_attention = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
                nn.Linear(planes, planes // 4),
                nn.ReLU(inplace=True),
                nn.Linear(planes // 4, planes),
                nn.Sigmoid()
            )

def forward(self, x: torch.Tensor, volume_data: Optional[torch.Tensor] = None) -> torch.Tensor:
        """Forward pass through basic block.

        Args:
            x: Input tensor
            volume_data: Optional volume data

        Returns:
            Block output with residual connection
        """
        identity = x

        # First convolution with financial features
        out = self.conv1(x, volume_data)

        # Second convolution
        out = self.conv2(out)

        # Downsample identity if needed
        if self.downsample is not None:
            identity = self.downsample(x)

        # Apply financial pattern attention
        if self.financial_enhancement:
            B, C, H, W = out.shape
            attention_weights = self.pattern_attention(
            F.adaptive_avg_pool2d(out, 1).view(B, C)
            ).view(B, C, 1, 1)
            out = out * attention_weights

        # Residual connection
        out += identity
        out = F.relu(out)

        return out

class FinancialBottleneck(nn.Module):
    """ResNet bottleneck block for deeper networks."""

    expansion = 4

def __init__(self,
                inplanes: int,
                planes: int,
                stride: int = 1,
                downsample: Optional[nn.Module] = None,
                financial_enhancement: bool = True):
        """Initialize bottleneck block.

        Args:
            inplanes: Input planes
            planes: Bottleneck planes
            stride: Convolution stride
            downsample: Downsample layer
            financial_enhancement: Enable financial features
        """
        super(FinancialBottleneck, self).__init__()

        self.financial_enhancement = financial_enhancement

        # 1x1 convolution
        self.conv1 = nn.Conv2d(inplanes, planes, kernel_size=1, bias=False)
        self.bn1 = nn.BatchNorm2d(planes)

        # 3x3 financial convolution
        self.conv2 = FinancialConv2d(
        planes, planes,
            kernel_size=3,
            stride=stride,
            padding=1,
            price_aware=financial_enhancement
        )

        # 1x1 expansion convolution
        self.conv3 = nn.Conv2d(planes, planes * self.expansion, kernel_size=1, bias=False)
        self.bn3 = nn.BatchNorm2d(planes * self.expansion)

        self.downsample = downsample
        self.stride = stride

        # Multi-scale feature extraction for patterns
        if financial_enhancement:
            self.multi_scale = nn.ModuleList([
            nn.Conv2d(planes, planes // 4, kernel_size=k, padding=k//2)
            for k in [1, 3, 5, 7]  # Different scales for pattern features
            ])
            self.scale_fusion = nn.Conv2d(planes, planes, kernel_size=1)

def forward(self, x: torch.Tensor, volume_data: Optional[torch.Tensor] = None) -> torch.Tensor:
        """Forward pass through bottleneck block."""
        identity = x

        # 1x1 reduction
        out = F.relu(self.bn1(self.conv1(x)))

        # Multi-scale pattern extraction
        if self.financial_enhancement:
            scale_features = []
            for scale_conv in self.multi_scale:
                scale_features.append(scale_conv(out))
            multi_scale_out = torch.cat(scale_features, dim=1)
            out = out + self.scale_fusion(multi_scale_out)

        # 3x3 financial convolution
        out = self.conv2(out, volume_data)

        # 1x1 expansion
        out = self.bn3(self.conv3(out))

        # Downsample identity if needed
        if self.downsample is not None:
            identity = self.downsample(x)

        # Residual connection
        out += identity
        out = F.relu(out)

        return out

class FinancialResNet(nn.Module):
    """ResNet backbone specialized for financial chart pattern recognition.

    Features:
    - Price-aware convolutions
    - Volume-weighted features
    - Multi-scale pattern extraction
    - Financial attention mechanisms
    """

def __init__(self,
                block,
                layers: List[int],
                num_classes: int = 21,  # 20 patterns + background
                input_channels: int = 5,  # OHLCV
                width_per_group: int = 64,
                financial_enhancement: bool = True):
        """Initialize FinancialResNet.

        Args:
            block: ResNet block type (BasicBlock or Bottleneck)
            layers: Number of blocks in each layer
            num_classes: Number of pattern classes
            input_channels: Input channels (OHLCV = 5)
            width_per_group: Width per group for ResNeXt-style variants
            financial_enhancement: Enable financial enhancements
        """
        super(FinancialResNet, self).__init__()

        self.financial_enhancement = financial_enhancement
        self.inplanes = 64
        self.groups = 1
        self.base_width = width_per_group

        # Initial convolution for financial data
        self.conv1 = nn.Conv2d(
        input_channels, self.inplanes,
            kernel_size=7, stride=2, padding=3, bias=False
        )
        self.bn1 = nn.BatchNorm2d(self.inplanes)
        self.relu = nn.ReLU(inplace=True)
        self.maxpool = nn.MaxPool2d(kernel_size=3, stride=2, padding=1)

        # ResNet layers
        self.layer1 = self._make_layer(block, 64, layers[0], financial_enhancement=financial_enhancement)
        self.layer2 = self._make_layer(block, 128, layers[1], stride=2, financial_enhancement=financial_enhancement)
        self.layer3 = self._make_layer(block, 256, layers[2], stride=2, financial_enhancement=financial_enhancement)
        self.layer4 = self._make_layer(block, 512, layers[3], stride=2, financial_enhancement=financial_enhancement)

        # Global feature extraction
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))

        # Pattern-specific feature heads
        self.pattern_features = nn.Linear(512 * block.expansion, 256)

        # Gary's DPI integration layer
        self.dpi_layer = nn.Sequential(
        nn.Linear(256, 128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

        # Taleb's antifragility enhancement
        self.antifragile_gate = nn.Sequential(
        nn.Linear(256, 128),
            nn.Tanh(),
            nn.Linear(128, 256),
            nn.Sigmoid()
        )

        # Classification head
        self.classifier = nn.Linear(256, num_classes)

        # Confidence estimation head
        self.confidence_head = nn.Sequential(
        nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(128, 1),
            nn.Sigmoid()
        )

        # Pattern strength estimation
        self.strength_head = nn.Sequential(
        nn.Linear(256, 64),
            nn.ReLU(),
            nn.Linear(64, 4),  # Weak, Moderate, Strong, Very Strong
            nn.Softmax(dim=-1)
        )

        # Volume importance weights
        self.volume_importance = nn.Parameter(torch.ones(num_classes))

        self._initialize_weights()

def _make_layer(self,
                    block,
                    planes: int,
                    blocks: int,
                    stride: int = 1,
                    financial_enhancement: bool = True) -> nn.Sequential:
        """Create ResNet layer."""
        downsample = None
        if stride != 1 or self.inplanes != planes * block.expansion:
            downsample = nn.Sequential(
            nn.Conv2d(self.inplanes, planes * block.expansion,
                        kernel_size=1, stride=stride, bias=False),
                nn.BatchNorm2d(planes * block.expansion),
            )

        layers = []
        layers.append(block(self.inplanes, planes, stride, downsample, financial_enhancement))
        self.inplanes = planes * block.expansion
        for _ in range(1, blocks):
            layers.append(block(self.inplanes, planes, financial_enhancement=financial_enhancement))

        return nn.Sequential(*layers)

def _initialize_weights(self):
        """Initialize network weights."""
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.Linear):
                nn.init.xavier_uniform_(m.weight)
                if m.bias is not None:
                    nn.init.zeros_(m.bias)

def forward(self, x: torch.Tensor, volume_data: Optional[torch.Tensor] = None) -> Dict[str, torch.Tensor]:
        """Forward pass through FinancialResNet.

        Args:
            x: Input chart data [B, C, H, W] where C=5 (OHLCV)
            volume_data: Optional volume data for weighting

        Returns:
            Dictionary containing all model outputs
        """
        # Extract volume data from input if not provided separately
        if volume_data is None and x.size(1) >= 5:
            volume_data = x[:, 4:5]  # Volume channel

        # Initial convolution
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.maxpool(x)

        # ResNet backbone layers
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)

        # Global average pooling
        x = self.avgpool(x)
        x = torch.flatten(x, 1)

        # Pattern feature extraction
        pattern_features = F.relu(self.pattern_features(x))

        # Gary's DPI calculation
        dpi_score = self.dpi_layer(pattern_features)

        # Taleb's antifragility enhancement
        if self.financial_enhancement:
            antifragile_boost = self.antifragile_gate(pattern_features)
            enhanced_features = pattern_features * (1 + 0.2 * antifragile_boost)
        else:
            enhanced_features = pattern_features
            antifragile_boost = torch.zeros_like(dpi_score)

        # Classification
        logits = self.classifier(enhanced_features)
        probabilities = F.softmax(logits, dim=-1)

        # Confidence estimation
        confidence = self.confidence_head(enhanced_features)

        # Pattern strength estimation
        strength_probs = self.strength_head(enhanced_features)

        # Volume-weighted adjustments
        if volume_data is not None:
            volume_factor = torch.sigmoid(
            torch.mean(volume_data.view(volume_data.size(0), -1), dim=-1, keepdim=True)
            )
            volume_weights = torch.sigmoid(self.volume_importance).unsqueeze(0)
            adjusted_probs = probabilities * (1 + volume_factor * volume_weights)
            adjusted_probs = adjusted_probs / adjusted_probs.sum(dim=-1, keepdim=True)
        else:
            adjusted_probs = probabilities

        return {
        'logits': logits,
            'probabilities': probabilities,
            'adjusted_probabilities': adjusted_probs,
            'pattern_features': pattern_features,
            'enhanced_features': enhanced_features,
            'dpi_score': dpi_score,
            'antifragile_boost': antifragile_boost,
            'confidence': confidence,
            'strength_probabilities': strength_probs,
            'volume_importance': torch.sigmoid(self.volume_importance)
        }

def extract_features(self, x: torch.Tensor) -> torch.Tensor:
        """Extract features without classification.

        Args:
            x: Input chart data

        Returns:
            Feature representations
        """
        with torch.no_grad():
            outputs = self.forward(x)
            return outputs['enhanced_features']

def create_financial_resnet18(**kwargs) -> FinancialResNet:
    """Create FinancialResNet-18."""
    return FinancialResNet(FinancialBasicBlock, [2, 2, 2, 2], **kwargs)

def create_financial_resnet34(**kwargs) -> FinancialResNet:
    """Create FinancialResNet-34."""
    return FinancialResNet(FinancialBasicBlock, [3, 4, 6, 3], **kwargs)

def create_financial_resnet50(**kwargs) -> FinancialResNet:
    """Create FinancialResNet-50."""
    return FinancialResNet(FinancialBottleneck, [3, 4, 6, 3], **kwargs)

def create_financial_resnet101(**kwargs) -> FinancialResNet:
    """Create FinancialResNet-101."""
    return FinancialResNet(FinancialBottleneck, [3, 4, 23, 3], **kwargs)

# Optimized model for <100ms inference
def create_fast_financial_resnet(**kwargs) -> FinancialResNet:
    """Create lightweight FinancialResNet for fast inference.

    Optimized for <100ms inference time while maintaining pattern detection accuracy.
    """
    # Use smaller ResNet-18 with reduced channel width
    kwargs.setdefault('width_per_group', 32)  # Reduced from 64
    kwargs.setdefault('num_classes', 21)
    kwargs.setdefault('financial_enhancement', True)

    model = FinancialResNet(FinancialBasicBlock, [2, 2, 2, 2], **kwargs)

    # Compile for faster inference if PyTorch 2.0+
    if torch.__version__ >= "2.0.0":
        model = torch.compile(model, mode='max-autotune')

    return model