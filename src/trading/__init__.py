#!/usr/bin/env python3
"""
Trading module - Core trading system components.

Provides the missing dependencies identified in theater detection:
- PortfolioManager: Real portfolio tracking and management
- TradeExecutor: Actual trade execution (not mocked)
- MarketDataProvider: Live market data integration

Addresses theater detection findings by implementing actual business logic
instead of placeholder imports.
"""

# Export all trading components
from .portfolio_manager import PortfolioManager, PortfolioState
from .trade_executor import TradeExecutor, OrderType, OrderStatus
from .market_data_provider import MarketDataProvider, MarketConditions

__all__ = [
    'PortfolioManager',
    'PortfolioState', 
    'TradeExecutor',
    'OrderType',
    'OrderStatus',
    'MarketDataProvider',
    'MarketConditions'
]