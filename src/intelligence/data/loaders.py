"""
Market data loaders for various exchanges and data sources.
Implements efficient data loading with caching and real-time streaming capabilities.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union, AsyncGenerator, Tuple

from lib.shared.utilities import get_logger
import aioredis
import asyncio
import ccxt
import numpy as np
import orjson
import pandas as pd
import yfinance as yf

@dataclass
class MarketData:
    """Standard market data structure."""
    timestamp: datetime
    symbol: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    source: str
    metadata: Dict = None

class DataSource(ABC):
    """Abstract base class for data sources."""
    
    @abstractmethod
    async def fetch_ohlcv(
        self,
        symbol: str,
        timeframe: str,
        since: Optional[datetime] = None,
        limit: Optional[int] = None
    ) -> List[MarketData]:
        """Fetch OHLCV data for a symbol."""
    
    @abstractmethod
    async def subscribe_real_time(
        self,
        symbols: List[str],
        callback: callable
    ) -> None:
        """Subscribe to real-time data updates."""

class CCXTDataSource(DataSource):
    """CCXT-based data source for cryptocurrency exchanges."""
    
    def __init__(self, exchange_name: str, api_key: str = None, secret: str = None):
        self.exchange_name = exchange_name
        self.exchange = getattr(ccxt, exchange_name)({
            'apiKey': api_key,
            'secret': secret,
            'sandbox': False,
            'enableRateLimit': True,
        })
    
    async def fetch_ohlcv(
        self,
        symbol: str,
        timeframe: str,
        since: Optional[datetime] = None,
        limit: Optional[int] = None
    ) -> List[MarketData]:
        """Fetch OHLCV data from exchange."""
        try:
            since_ms = int(since.timestamp() * 1000) if since else None
            
            ohlcv = await self.exchange.fetch_ohlcv(
                symbol, timeframe, since_ms, limit
            )
            
            return [
                MarketData(
                    timestamp=datetime.fromtimestamp(row[0] / 1000),
                    symbol=symbol,
                    open=row[1],
                    high=row[2],
                    low=row[3], 
                    close=row[4],
                    volume=row[5],
                    source=self.exchange_name
                )
                for row in ohlcv
            ]
            
        except Exception as e:
            logger.error(f"Error fetching data from {self.exchange_name}: {e}")
            return []
    
    async def subscribe_real_time(
        self,
        symbols: List[str],
        callback: callable
    ) -> None:
        """Subscribe to real-time WebSocket data."""
        if hasattr(self.exchange, 'watch_ohlcv'):
            while True:
                try:
                    for symbol in symbols:
                        data = await self.exchange.watch_ohlcv(symbol, '1m')
                        if data:
                            market_data = MarketData(
                                timestamp=datetime.fromtimestamp(data[-1][0] / 1000),
                                symbol=symbol,
                                open=data[-1][1],
                                high=data[-1][2],
                                low=data[-1][3],
                                close=data[-1][4], 
                                volume=data[-1][5],
                                source=self.exchange_name
                            )
                            await callback(market_data)
                            
                except Exception as e:
                    logger.error(f"WebSocket error: {e}")
                    await asyncio.sleep(5)

class YFinanceDataSource(DataSource):
    """Yahoo Finance data source for traditional assets."""
    
    async def fetch_ohlcv(
        self,
        symbol: str,
        timeframe: str,
        since: Optional[datetime] = None,
        limit: Optional[int] = None
    ) -> List[MarketData]:
        """Fetch data from Yahoo Finance."""
        try:
            # Map timeframes
            interval_map = {
                '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
                '1h': '1h', '1d': '1d', '1wk': '1wk', '1mo': '1mo'
            }
            
            interval = interval_map.get(timeframe, '1d')
            end_date = datetime.now()
            start_date = since or (end_date - timedelta(days=365))
            
            ticker = yf.Ticker(symbol)
            df = ticker.history(
                start=start_date,
                end=end_date,
                interval=interval
            )
            
            if df.empty:
                return []
                
            return [
                MarketData(
                    timestamp=row.Index,
                    symbol=symbol,
                    open=row.Open,
                    high=row.High,
                    low=row.Low,
                    close=row.Close,
                    volume=row.Volume,
                    source='yahoo_finance'
                )
                for row in df.itertuples()
            ]
            
        except Exception as e:
            logger.error(f"Error fetching Yahoo Finance data: {e}")
            return []
    
    async def subscribe_real_time(
        self,
        symbols: List[str],
        callback: callable
    ) -> None:
        """Yahoo Finance doesn't support real-time streaming."""
        logger.warning("Yahoo Finance doesn't support real-time streaming")

class MarketDataLoader:
    """Main market data loader with multi-source support and caching."""
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.sources: Dict[str, DataSource] = {}
        self.redis_url = redis_url
        self.redis = None
        self._setup_sources()
    
    async def __aenter__(self):
        """Async context manager entry."""
        self.redis = await aioredis.from_url(self.redis_url)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.redis:
            await self.redis.close()
    
    def _setup_sources(self):
        """Initialize data sources."""
        # Cryptocurrency exchanges
        for exchange in ['binance', 'coinbase', 'kraken']:
            try:
                self.sources[exchange] = CCXTDataSource(exchange)
            except Exception as e:
                logger.warning(f"Could not initialize {exchange}: {e}")
        
        # Traditional markets
        self.sources['yahoo'] = YFinanceDataSource()
    
    async def fetch_data(
        self,
        symbol: str,
        source: str,
        timeframe: str = '1h',
        since: Optional[datetime] = None,
        limit: Optional[int] = 1000,
        use_cache: bool = True
    ) -> List[MarketData]:
        """Fetch market data with caching."""
        
        # Generate cache key
        cache_key = f"market_data:{source}:{symbol}:{timeframe}:{since}:{limit}"
        
        # Try to get from cache first
        if use_cache and self.redis:
            cached_data = await self.redis.get(cache_key)
            if cached_data:
                try:
                    data_list = orjson.loads(cached_data)
                    return [MarketData(**item) for item in data_list]
                except Exception as e:
                    logger.warning(f"Cache deserialization error: {e}")
        
        # Fetch from source
        if source not in self.sources:
            raise ValueError(f"Unknown data source: {source}")
        
        data = await self.sources[source].fetch_ohlcv(
            symbol, timeframe, since, limit
        )
        
        # Cache the result
        if use_cache and self.redis and data:
            try:
                serialized = orjson.dumps([
                    {
                        'timestamp': item.timestamp.isoformat(),
                        'symbol': item.symbol,
                        'open': item.open,
                        'high': item.high,
                        'low': item.low,
                        'close': item.close,
                        'volume': item.volume,
                        'source': item.source
                    } for item in data
                ])
                await self.redis.setex(cache_key, 300, serialized)  # 5 min cache
            except Exception as e:
                logger.warning(f"Cache serialization error: {e}")
        
        return data
    
    async def fetch_multiple_symbols(
        self,
        symbols: List[str],
        source: str,
        timeframe: str = '1h',
        since: Optional[datetime] = None,
        limit: Optional[int] = 1000
    ) -> Dict[str, List[MarketData]]:
        """Fetch data for multiple symbols concurrently."""
        
        tasks = []
        for symbol in symbols:
            task = self.fetch_data(symbol, source, timeframe, since, limit)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return {
            symbol: result if not isinstance(result, Exception) else []
            for symbol, result in zip(symbols, results)
        }
    
    def to_polars_df(self, data: List[MarketData]) -> pl.DataFrame:
        """Convert market data to Polars DataFrame for efficient processing."""
        if not data:
            return pl.DataFrame()
        
        return pl.DataFrame({
            'timestamp': [d.timestamp for d in data],
            'symbol': [d.symbol for d in data],
            'open': [d.open for d in data],
            'high': [d.high for d in data],
            'low': [d.low for d in data],
            'close': [d.close for d in data],
            'volume': [d.volume for d in data],
            'source': [d.source for d in data]
        })
    
    def to_pandas_df(self, data: List[MarketData]) -> pd.DataFrame:
        """Convert market data to Pandas DataFrame."""
        if not data:
            return pd.DataFrame()
        
        return pd.DataFrame([
            {
                'timestamp': d.timestamp,
                'symbol': d.symbol,
                'open': d.open,
                'high': d.high,
                'low': d.low,
                'close': d.close,
                'volume': d.volume,
                'source': d.source
            } for d in data
        ]).set_index('timestamp')

class RealTimeDataStream:
    """Real-time data streaming with WebSocket connections."""
    
    def __init__(self, data_loader: MarketDataLoader):
        self.data_loader = data_loader
        self.subscribers: Dict[str, List[callable]] = {}
        self.is_streaming = False
    
    async def subscribe(
        self,
        symbol: str,
        source: str,
        callback: callable
    ) -> None:
        """Subscribe to real-time updates for a symbol."""
        key = f"{source}:{symbol}"
        
        if key not in self.subscribers:
            self.subscribers[key] = []
        
        self.subscribers[key].append(callback)
        
        # Start streaming if not already active
        if not self.is_streaming:
            await self.start_streaming()
    
    async def start_streaming(self) -> None:
        """Start the real-time streaming service."""
        self.is_streaming = True
        
        # Group subscribers by source
        source_symbols: Dict[str, List[str]] = {}
        for key in self.subscribers:
            source, symbol = key.split(':', 1)
            if source not in source_symbols:
                source_symbols[source] = []
            source_symbols[source].append(symbol)
        
        # Start streaming for each source
        tasks = []
        for source, symbols in source_symbols.items():
            if source in self.data_loader.sources:
                task = self._stream_source(source, symbols)
                tasks.append(task)
        
        if tasks:
            await asyncio.gather(*tasks)
    
    async def _stream_source(self, source: str, symbols: List[str]) -> None:
        """Stream data from a specific source."""
        async def data_callback(market_data: MarketData):
            """Handle incoming market data."""
            key = f"{source}:{market_data.symbol}"
            if key in self.subscribers:
                # Notify all subscribers
                for callback in self.subscribers[key]:
                    try:
                        await callback(market_data)
                    except Exception as e:
                        logger.error(f"Error in subscriber callback: {e}")
        
        await self.data_loader.sources[source].subscribe_real_time(
            symbols, data_callback
        )
    
    async def stop_streaming(self) -> None:
        """Stop the streaming service."""
        self.is_streaming = False
        self.subscribers.clear()

# Example usage and testing functions
async def test_data_loader():
    """Test the data loader functionality."""
    async with MarketDataLoader() as loader:
        # Test single symbol fetch
        data = await loader.fetch_data(
            symbol='BTC/USDT',
            source='binance',
            timeframe='1h',
            limit=100
        )
        
        print(f"Fetched {len(data)} data points for BTC/USDT")
        
        # Test multiple symbols
        symbols = ['BTC/USDT', 'ETH/USDT', 'ADA/USDT']
        multi_data = await loader.fetch_multiple_symbols(
            symbols=symbols,
            source='binance',
            timeframe='1h',
            limit=100
        )
        
        for symbol, symbol_data in multi_data.items():
            print(f"{symbol}: {len(symbol_data)} data points")
        
        # Convert to DataFrame
        if data:
            df = loader.to_polars_df(data)
            print(f"DataFrame shape: {df.shape}")
            print(df.head())

if __name__ == "__main__":
    asyncio.run(test_data_loader())