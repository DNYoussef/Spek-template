"""Chart Pattern Definitions

Comprehensive definitions of 20+ chart patterns with characteristics,
trading implications, and technical parameters.
"""

from typing import Dict, List, Tuple, NamedTuple

from dataclasses import dataclass
from enum import Enum

class PatternType(Enum):
    """Chart pattern categories."""
    REVERSAL = "reversal"
    CONTINUATION = "continuation"
    BILATERAL = "bilateral"
    MOMENTUM = "momentum"

class PatternStrength(Enum):
    """Pattern reliability strength."""
    WEAK = 1
    MODERATE = 2
    STRONG = 3
    VERY_STRONG = 4

@dataclass
class PatternCharacteristics:
    """Characteristics of a chart pattern."""
    name: str
    pattern_type: PatternType
    strength: PatternStrength
    min_bars: int  # Minimum bars to form pattern
    max_bars: int  # Maximum bars for pattern validity
    success_rate: float  # Historical success rate (0-1)
    avg_move_pct: float  # Average price move percentage
    volume_importance: float  # Volume confirmation importance (0-1)
    description: str
    bullish_implications: str
    bearish_implications: str
    entry_strategy: str
    stop_loss_strategy: str
    target_calculation: str
    gary_dpi_weight: float  # Gary's DPI weighting factor
    taleb_antifragility_factor: float  # Taleb's antifragility multiplier

# Comprehensive chart pattern definitions
CHART_PATTERNS: Dict[str, PatternCharacteristics] = {

    # === REVERSAL PATTERNS ===

    "head_and_shoulders": PatternCharacteristics(
    name="Head and Shoulders",
        pattern_type=PatternType.REVERSAL,
        strength=PatternStrength.VERY_STRONG,
        min_bars=15,
        max_bars=50,
        success_rate=0.83,
        avg_move_pct=0.18,
        volume_importance=0.8,
        description="Classic bearish reversal pattern with three peaks",
        bullish_implications="None - bearish pattern only",
        bearish_implications="Strong sell signal, major trend reversal likely",
        entry_strategy="Break below neckline with volume confirmation",
        stop_loss_strategy="Above right shoulder or recent swing high",
        target_calculation="Height of head subtracted from neckline break",
        gary_dpi_weight=0.9,
        taleb_antifragility_factor=0.8
    ),

    "inverse_head_and_shoulders": PatternCharacteristics(
    name="Inverse Head and Shoulders",
        pattern_type=PatternType.REVERSAL,
        strength=PatternStrength.VERY_STRONG,
        min_bars=15,
        max_bars=50,
        success_rate=0.81,
        avg_move_pct=0.16,
        volume_importance=0.8,
        description="Classic bullish reversal pattern with three troughs",
        bullish_implications="Strong buy signal, major trend reversal likely",
        bearish_implications="None - bullish pattern only",
        entry_strategy="Break above neckline with volume confirmation",
        stop_loss_strategy="Below right shoulder or recent swing low",
        target_calculation="Height of head added to neckline break",
        gary_dpi_weight=0.9,
        taleb_antifragility_factor=0.8
    ),

    "double_top": PatternCharacteristics(
    name="Double Top",
        pattern_type=PatternType.REVERSAL,
        strength=PatternStrength.STRONG,
        min_bars=20,
        max_bars=60,
        success_rate=0.75,
        avg_move_pct=0.14,
        volume_importance=0.7,
        description="Bearish reversal with two similar peaks",
        bullish_implications="None - bearish pattern only",
        bearish_implications="Sell signal, uptrend likely ending",
        entry_strategy="Break below valley between peaks",
        stop_loss_strategy="Above second peak",
        target_calculation="Height of pattern subtracted from break point",
        gary_dpi_weight=0.7,
        taleb_antifragility_factor=0.6
    ),

    "double_bottom": PatternCharacteristics(
    name="Double Bottom",
        pattern_type=PatternType.REVERSAL,
        strength=PatternStrength.STRONG,
        min_bars=20,
        max_bars=60,
        success_rate=0.78,
        avg_move_pct=0.13,
        volume_importance=0.7,
        description="Bullish reversal with two similar troughs",
        bullish_implications="Buy signal, downtrend likely ending",
        bearish_implications="None - bullish pattern only",
        entry_strategy="Break above peak between troughs",
        stop_loss_strategy="Below second bottom",
        target_calculation="Height of pattern added to break point",
        gary_dpi_weight=0.7,
        taleb_antifragility_factor=0.6
    ),

    "triple_top": PatternCharacteristics(
    name="Triple Top",
        pattern_type=PatternType.REVERSAL,
        strength=PatternStrength.STRONG,
        min_bars=25,
        max_bars=80,
        success_rate=0.72,
        avg_move_pct=0.15,
        volume_importance=0.8,
        description="Bearish reversal with three similar peaks",
        bullish_implications="None - bearish pattern only",
        bearish_implications="Strong sell signal, major resistance level",
        entry_strategy="Break below support line connecting troughs",
        stop_loss_strategy="Above highest peak",
        target_calculation="Height of pattern subtracted from break",
        gary_dpi_weight=0.8,
        taleb_antifragility_factor=0.7
    ),

    "triple_bottom": PatternCharacteristics(
    name="Triple Bottom",
        pattern_type=PatternType.REVERSAL,
        strength=PatternStrength.STRONG,
        min_bars=25,
        max_bars=80,
        success_rate=0.74,
        avg_move_pct=0.14,
        volume_importance=0.8,
        description="Bullish reversal with three similar troughs",
        bullish_implications="Strong buy signal, major support level",
        bearish_implications="None - bullish pattern only",
        entry_strategy="Break above resistance line connecting peaks",
        stop_loss_strategy="Below lowest trough",
        target_calculation="Height of pattern added to break",
        gary_dpi_weight=0.8,
        taleb_antifragility_factor=0.7
    ),

    # === CONTINUATION PATTERNS ===

    "ascending_triangle": PatternCharacteristics(
    name="Ascending Triangle",
        pattern_type=PatternType.CONTINUATION,
        strength=PatternStrength.STRONG,
        min_bars=10,
        max_bars=40,
        success_rate=0.72,
        avg_move_pct=0.12,
        volume_importance=0.6,
        description="Bullish continuation with flat top and rising bottom",
        bullish_implications="Upward breakout expected, continuation likely",
        bearish_implications="Downward break invalidates pattern",
        entry_strategy="Break above horizontal resistance with volume",
        stop_loss_strategy="Below most recent swing low",
        target_calculation="Height of triangle added to breakout point",
        gary_dpi_weight=0.6,
        taleb_antifragility_factor=0.4
    ),

    "descending_triangle": PatternCharacteristics(
    name="Descending Triangle",
        pattern_type=PatternType.CONTINUATION,
        strength=PatternStrength.STRONG,
        min_bars=10,
        max_bars=40,
        success_rate=0.70,
        avg_move_pct=0.11,
        volume_importance=0.6,
        description="Bearish continuation with flat bottom and falling top",
        bullish_implications="Upward break invalidates pattern",
        bearish_implications="Downward breakout expected, continuation likely",
        entry_strategy="Break below horizontal support with volume",
        stop_loss_strategy="Above most recent swing high",
        target_calculation="Height of triangle subtracted from breakout",
        gary_dpi_weight=0.6,
        taleb_antifragility_factor=0.4
    ),

    "symmetrical_triangle": PatternCharacteristics(
    name="Symmetrical Triangle",
        pattern_type=PatternType.BILATERAL,
        strength=PatternStrength.MODERATE,
        min_bars=8,
        max_bars=35,
        success_rate=0.65,
        avg_move_pct=0.10,
        volume_importance=0.7,
        description="Neutral triangle with converging trendlines",
        bullish_implications="Bullish if upward breakout with volume",
        bearish_implications="Bearish if downward breakout with volume",
        entry_strategy="Trade direction of breakout with volume confirmation",
        stop_loss_strategy="Opposite side of triangle",
        target_calculation="Height of triangle applied from breakout",
        gary_dpi_weight=0.5,
        taleb_antifragility_factor=0.3
    ),

    "bull_flag": PatternCharacteristics(
    name="Bull Flag",
        pattern_type=PatternType.CONTINUATION,
        strength=PatternStrength.STRONG,
        min_bars=5,
        max_bars=20,
        success_rate=0.78,
        avg_move_pct=0.9,
        volume_importance=0.8,
        description="Short-term bearish consolidation in uptrend",
        bullish_implications="Continuation of uptrend expected",
        bearish_implications="Failure below flag low negates pattern",
        entry_strategy="Break above flag high with volume surge",
        stop_loss_strategy="Below flag low",
        target_calculation="Flagpole height added to breakout",
        gary_dpi_weight=0.8,
        taleb_antifragility_factor=0.5
    ),

    "bear_flag": PatternCharacteristics(
    name="Bear Flag",
        pattern_type=PatternType.CONTINUATION,
        strength=PatternStrength.STRONG,
        min_bars=5,
        max_bars=20,
        success_rate=0.76,
        avg_move_pct=0.8,
        volume_importance=0.8,
        description="Short-term bullish consolidation in downtrend",
        bullish_implications="Failure above flag high negates pattern",
        bearish_implications="Continuation of downtrend expected",
        entry_strategy="Break below flag low with volume",
        stop_loss_strategy="Above flag high",
        target_calculation="Flagpole height subtracted from breakout",
        gary_dpi_weight=0.8,
        taleb_antifragility_factor=0.5
    ),

    "bull_pennant": PatternCharacteristics(
    name="Bull Pennant",
        pattern_type=PatternType.CONTINUATION,
        strength=PatternStrength.STRONG,
        min_bars=5,
        max_bars=15,
        success_rate=0.74,
        avg_move_pct=0.8,
        volume_importance=0.9,
        description="Small symmetrical triangle after strong upward move",
        bullish_implications="Continuation of uptrend expected",
        bearish_implications="Downward break invalidates bullish view",
        entry_strategy="Upward breakout with volume confirmation",
        stop_loss_strategy="Below pennant low",
        target_calculation="Flagpole height added to breakout",
        gary_dpi_weight=0.7,
        taleb_antifragility_factor=0.4
    ),

    "bear_pennant": PatternCharacteristics(
    name="Bear Pennant",
        pattern_type=PatternType.CONTINUATION,
        strength=PatternStrength.STRONG,
        min_bars=5,
        max_bars=15,
        success_rate=0.72,
        avg_move_pct=0.7,
        volume_importance=0.9,
        description="Small symmetrical triangle after strong downward move",
        bullish_implications="Upward break invalidates bearish view",
        bearish_implications="Continuation of downtrend expected",
        entry_strategy="Downward breakout with volume confirmation",
        stop_loss_strategy="Above pennant high",
        target_calculation="Flagpole height subtracted from breakout",
        gary_dpi_weight=0.7,
        taleb_antifragility_factor=0.4
    ),

    # === RECTANGULAR PATTERNS ===

    "rectangle_bullish": PatternCharacteristics(
    name="Bullish Rectangle",
        pattern_type=PatternType.CONTINUATION,
        strength=PatternStrength.MODERATE,
        min_bars=10,
        max_bars=50,
        success_rate=0.68,
        avg_move_pct=0.10,
        volume_importance=0.6,
        description="Horizontal trading range in uptrend",
        bullish_implications="Upward breakout continues uptrend",
        bearish_implications="Downward break reverses trend",
        entry_strategy="Break above resistance with volume",
        stop_loss_strategy="Below rectangle support",
        target_calculation="Rectangle height added to breakout",
        gary_dpi_weight=0.5,
        taleb_antifragility_factor=0.3
    ),

    "rectangle_bearish": PatternCharacteristics(
    name="Bearish Rectangle",
        pattern_type=PatternType.CONTINUATION,
        strength=PatternStrength.MODERATE,
        min_bars=10,
        max_bars=50,
        success_rate=0.66,
        avg_move_pct=0.9,
        volume_importance=0.6,
        description="Horizontal trading range in downtrend",
        bullish_implications="Upward break reverses trend",
        bearish_implications="Downward breakout continues downtrend",
        entry_strategy="Break below support with volume",
        stop_loss_strategy="Above rectangle resistance",
        target_calculation="Rectangle height subtracted from breakout",
        gary_dpi_weight=0.5,
        taleb_antifragility_factor=0.3
    ),

    # === WEDGE PATTERNS ===

    "rising_wedge": PatternCharacteristics(
    name="Rising Wedge",
        pattern_type=PatternType.REVERSAL,
        strength=PatternStrength.MODERATE,
        min_bars=12,
        max_bars=45,
        success_rate=0.69,
        avg_move_pct=0.12,
        volume_importance=0.7,
        description="Bearish pattern with rising support and resistance",
        bullish_implications="Pattern failure leads to strong upward move",
        bearish_implications="Downward break signals trend reversal",
        entry_strategy="Break below rising support with volume",
        stop_loss_strategy="Above recent swing high",
        target_calculation="Wedge height at widest point subtracted",
        gary_dpi_weight=0.6,
        taleb_antifragility_factor=0.6
    ),

    "falling_wedge": PatternCharacteristics(
    name="Falling Wedge",
        pattern_type=PatternType.REVERSAL,
        strength=PatternStrength.MODERATE,
        min_bars=12,
        max_bars=45,
        success_rate=0.71,
        avg_move_pct=0.11,
        volume_importance=0.7,
        description="Bullish pattern with falling support and resistance",
        bullish_implications="Upward break signals trend reversal",
        bearish_implications="Pattern failure leads to continued decline",
        entry_strategy="Break above falling resistance with volume",
        stop_loss_strategy="Below recent swing low",
        target_calculation="Wedge height at widest point added",
        gary_dpi_weight=0.6,
        taleb_antifragility_factor=0.6
    ),

    # === MOMENTUM PATTERNS ===

    "cup_and_handle": PatternCharacteristics(
    name="Cup and Handle",
        pattern_type=PatternType.CONTINUATION,
        strength=PatternStrength.STRONG,
        min_bars=30,
        max_bars=120,
        success_rate=0.79,
        avg_move_pct=0.18,
        volume_importance=0.8,
        description="Bullish continuation with cup formation and handle",
        bullish_implications="Strong continuation signal with large targets",
        bearish_implications="Handle break below cup low invalidates",
        entry_strategy="Break above handle high with volume surge",
        stop_loss_strategy="Below handle low",
        target_calculation="Cup depth added to breakout point",
        gary_dpi_weight=0.9,
        taleb_antifragility_factor=0.7
    ),

    "rounding_bottom": PatternCharacteristics(
    name="Rounding Bottom",
        pattern_type=PatternType.REVERSAL,
        strength=PatternStrength.MODERATE,
        min_bars=20,
        max_bars=100,
        success_rate=0.67,
        avg_move_pct=0.13,
        volume_importance=0.5,
        description="Gradual bullish reversal with curved bottom",
        bullish_implications="Slow but steady trend reversal signal",
        bearish_implications="Failure to break resistance continues downtrend",
        entry_strategy="Break above resistance with increasing volume",
        stop_loss_strategy="Below rounding bottom low",
        target_calculation="Pattern height added to breakout",
        gary_dpi_weight=0.4,
        taleb_antifragility_factor=0.5
    ),

    "rounding_top": PatternCharacteristics(
    name="Rounding Top",
        pattern_type=PatternType.REVERSAL,
        strength=PatternStrength.MODERATE,
        min_bars=20,
        max_bars=100,
        success_rate=0.65,
        avg_move_pct=0.12,
        volume_importance=0.5,
        description="Gradual bearish reversal with curved top",
        bullish_implications="Failure to break support continues uptrend",
        bearish_implications="Slow but steady trend reversal signal",
        entry_strategy="Break below support with increasing volume",
        stop_loss_strategy="Above rounding top high",
        target_calculation="Pattern height subtracted from breakout",
        gary_dpi_weight=0.4,
        taleb_antifragility_factor=0.5
    ),

    # === DIAMOND PATTERNS ===

    "diamond_top": PatternCharacteristics(
    name="Diamond Top",
        pattern_type=PatternType.REVERSAL,
        strength=PatternStrength.MODERATE,
        min_bars=15,
        max_bars=60,
        success_rate=0.64,
        avg_move_pct=0.13,
        volume_importance=0.8,
        description="Rare bearish reversal pattern shaped like diamond",
        bullish_implications="Pattern failure leads to continuation",
        bearish_implications="Breakdown signals significant reversal",
        entry_strategy="Break below diamond support with volume",
        stop_loss_strategy="Above diamond high",
        target_calculation="Diamond height subtracted from break",
        gary_dpi_weight=0.7,
        taleb_antifragility_factor=0.8
    ),

    "diamond_bottom": PatternCharacteristics(
    name="Diamond Bottom",
        pattern_type=PatternType.REVERSAL,
        strength=PatternStrength.MODERATE,
        min_bars=15,
        max_bars=60,
        success_rate=0.66,
        avg_move_pct=0.12,
        volume_importance=0.8,
        description="Rare bullish reversal pattern shaped like diamond",
        bullish_implications="Breakout signals significant reversal",
        bearish_implications="Pattern failure leads to continuation",
        entry_strategy="Break above diamond resistance with volume",
        stop_loss_strategy="Below diamond low",
        target_calculation="Diamond height added to break",
        gary_dpi_weight=0.7,
        taleb_antifragility_factor=0.8
    ),

    # === GAP PATTERNS ===

    "breakaway_gap": PatternCharacteristics(
    name="Breakaway Gap",
        pattern_type=PatternType.MOMENTUM,
        strength=PatternStrength.STRONG,
        min_bars=2,
        max_bars=5,
        success_rate=0.75,
        avg_move_pct=0.6,
        volume_importance=0.9,
        description="Strong gap that initiates new trend direction",
        bullish_implications="Upward gap signals strong bullish momentum",
        bearish_implications="Downward gap signals strong bearish momentum",
        entry_strategy="Trade direction of gap with volume confirmation",
        stop_loss_strategy="Gap fill level",
        target_calculation="Average daily range multiplied by trend strength",
        gary_dpi_weight=0.8,
        taleb_antifragility_factor=0.6
    )
}

def get_pattern_by_name(pattern_name: str) -> PatternCharacteristics:
    """Get pattern characteristics by name.

    Args:
        pattern_name: Name of the pattern

    Returns:
        Pattern characteristics

    Raises:
        KeyError: If pattern not found
    """
    if pattern_name not in CHART_PATTERNS:
        raise KeyError(f"Pattern '(pattern_name)' not found. Available patterns: {list(CHART_PATTERNS.keys())}")

    return CHART_PATTERNS[pattern_name]

def get_patterns_by_type(pattern_type: PatternType) -> List[PatternCharacteristics]:
    """Get all patterns of a specific type.

    Args:
        pattern_type: Pattern type to filter by

    Returns:
        List of matching pattern characteristics
    """
    return [pattern for pattern in CHART_PATTERNS.values()
    if pattern.pattern_type == pattern_type]

def get_patterns_by_strength(min_strength: PatternStrength) -> List[PatternCharacteristics]:
    """Get patterns with minimum strength level.

    Args:
        min_strength: Minimum strength level

    Returns:
        List of patterns meeting strength criteria
    """
    return [pattern for pattern in CHART_PATTERNS.values()
    if pattern.strength.value >= min_strength.value]

def get_high_gary_dpi_patterns(min_weight: float = 0.7) -> List[PatternCharacteristics]:
    """Get patterns with high Gary DPI weighting.

    Args:
        min_weight: Minimum DPI weight

    Returns:
        List of patterns with high DPI significance
    """
    return [pattern for pattern in CHART_PATTERNS.values()
    if pattern.gary_dpi_weight >= min_weight]

def get_antifragile_patterns(min_factor: float = 0.6) -> List[PatternCharacteristics]:
    """Get patterns with high Taleb antifragility factor.

    Args:
        min_factor: Minimum antifragility factor

    Returns:
        List of patterns with high antifragility significance
    """
    return [pattern for pattern in CHART_PATTERNS.values()
    if pattern.taleb_antifragility_factor >= min_factor]

# Pattern statistics
PATTERN_STATS = {
'total_patterns': len(CHART_PATTERNS),
    'reversal_patterns': len(get_patterns_by_type(PatternType.REVERSAL)),
    'continuation_patterns': len(get_patterns_by_type(PatternType.CONTINUATION)),
    'bilateral_patterns': len(get_patterns_by_type(PatternType.BILATERAL)),
    'momentum_patterns': len(get_patterns_by_type(PatternType.MOMENTUM)),
    'strong_patterns': len(get_patterns_by_strength(PatternStrength.STRONG)),
    'high_dpi_patterns': len(get_high_gary_dpi_patterns()),
    'antifragile_patterns': len(get_antifragile_patterns()),
    'avg_success_rate': sum(p.success_rate for p in CHART_PATTERNS.values()) / len(CHART_PATTERNS),
    'avg_move_pct': sum(p.avg_move_pct for p in CHART_PATTERNS.values()) / len(CHART_PATTERNS)
}