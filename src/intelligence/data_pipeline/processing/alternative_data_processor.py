"""
Alternative Data Processor
Integration and processing of alternative data sources for enhanced trading signals
"""

import asyncio
import aiohttp
from lib.shared.utilities import get_logger
logger = get_logger(__name__)
self.session: Optional[aiohttp.ClientSession] = None
self.executor = ThreadPoolExecutor(max_workers=2)

        # Data storage
self.social_data: Dict[str, deque] = defaultdict(lambda: deque(maxlen=500))
        self.economic_data: deque = deque(maxlen=1000)
        self.alternative_signals: Dict[str, AlternativeSignal] = {}

        # Processing configuration
        self.social_platforms = ["twitter", "reddit", "stocktwits"]
        self.economic_indicators = [
        "GDP", "UNRATE", "CPIAUCSL", "FEDFUNDS", "DGS10", "DEXUSEU"
        ]

        # API configurations
        self.twitter_bearer_token = self._get_env_var("TWITTER_BEARER_TOKEN")
        self.reddit_client_id = self._get_env_var("REDDIT_CLIENT_ID")
        self.reddit_client_secret = self._get_env_var("REDDIT_CLIENT_SECRET")
        self.fred_api_key = config.data_sources.get("fred", {}).api_key

        # Background tasks
        self.social_task: Optional[asyncio.Task] = None
        self.economic_task: Optional[asyncio.Task] = None
        self.signal_task: Optional[asyncio.Task] = None

        self.running = False

    async def start(self):
        """Start alternative data processor"""
        self.logger.info("Starting alternative data processor")
        self.running = True

        # Create HTTP session
        timeout = aiohttp.ClientTimeout(total=30)
        self.session = aiohttp.ClientSession(timeout=timeout)

        # Start background tasks
        self.social_task = asyncio.create_task(self._social_data_loop())
        self.economic_task = asyncio.create_task(self._economic_data_loop())
        self.signal_task = asyncio.create_task(self._signal_generation_loop())

    async def stop(self):
        """Stop alternative data processor"""
        self.logger.info("Stopping alternative data processor")
        self.running = False

        # Cancel tasks
        for task in [self.social_task, self.economic_task, self.signal_task]:
            if task:
                task.cancel()

        # Close session
        if self.session:
            await self.session.close()

        # Shutdown executor
        self.executor.shutdown(wait=True)

    async def _social_data_loop(self):
        """Background loop for social sentiment data collection"""
        while self.running:
            try:
                # Collect from different platforms
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                await self._collect_twitter_sentiment()
                await self._collect_reddit_sentiment()
                await self._collect_stocktwits_sentiment()

                await asyncio.sleep(300)  # 5 minutes
            except Exception as e:
                self.logger.error(f"Social data collection error: {e)")
                await asyncio.sleep(60)

    async def _collect_twitter_sentiment(self):
        """Collect sentiment data from Twitter/X API"""
        if not self.twitter_bearer_token or not self.session:
            return

        symbols = ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN", "NVDA", "META"]  # Top symbols

        for symbol in symbols:
            try:
                url = "https://api.twitter.com/2/tweets/search/recent"
                headers = {"Authorization": f"Bearer {self.twitter_bearer_token)"}

                params = {
                "query": f"${symbol) OR {symbol) stock (bullish OR bearish OR buy OR sell) -is:retweet",
                    "max_results": 100,
                    "tweet.fields": "created_at,public_metrics,context_annotations"
                }

                async with self.session.get(url, headers=headers, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        if "data" in data:
                            sentiment_data = await self._process_twitter_tweets(symbol, data["data"])
                            if sentiment_data:
                                self.social_data[symbol].append(sentiment_data)
                    else:
                        self.logger.warning(f"Twitter API error for {symbol): {response.status)")

                # Rate limiting
                await asyncio.sleep(1)

            except Exception as e:
                self.logger.error(f"Twitter collection error for {symbol): {e)")

    async def _process_twitter_tweets(self, symbol: str, tweets: List[Dict]) -> Optional[SocialSentimentData]:
        """Process Twitter tweets for sentiment"""
        if not tweets:
            return None

        try:
            messages = [tweet["text"] for tweet in tweets]

            # Simple sentiment analysis (would use proper NLP in production)
            sentiment_scores = await asyncio.get_event_loop().run_in_executor(
            self.executor, self._analyze_social_sentiment, messages
            )

            positive_count = sum(1 for score in sentiment_scores if score > 0.1)
            negative_count = sum(1 for score in sentiment_scores if score < -0.1)
            neutral_count = len(sentiment_scores) - positive_count - negative_count

            # Count influencer mentions (users with high follower count)
            influencer_mentions = sum(
            1 for tweet in tweets
            if tweet.get("public_metrics", {}).get("followers_count", 0) > 10000
            )

            return SocialSentimentData(
            platform="twitter",
                symbol=symbol,
                timestamp=datetime.now(),
                message_count=len(messages),
                positive_count=positive_count,
                negative_count=negative_count,
                neutral_count=neutral_count,
                sentiment_score=np.mean(sentiment_scores),
                volume_mentions=len(messages),
                influencer_mentions=influencer_mentions,
                raw_messages=messages[:10]  # Store sample for analysis
            )

        except Exception as e:
            self.logger.error(f"Twitter processing error: {e)")
            return None

    async def _collect_reddit_sentiment(self):
        """Collect sentiment from Reddit"""
        if not self.reddit_client_id or not self.session:
            return

        subreddits = ["wallstreetbets", "investing", "stocks", "SecurityAnalysis"]
        symbols = ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN", "NVDA", "META"]

        try:
            # Get Reddit access token
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            auth_data = {
            "grant_type": "client_credentials",
                "device_id": "gary_taleb_pipeline"
            }

            auth_headers = {
            "User-Agent": "gary-taleb-pipeline/1.0"
            }

            auth = aiohttp.BasicAuth(self.reddit_client_id, self.reddit_client_secret)

            async with self.session.post(
            "https://www.reddit.com/api/v1/access_token",
                data=auth_data,
                headers=auth_headers,
                auth=auth
            ) as response:
                if response.status == 200:
                    token_data = await response.json()
                    access_token = token_data["access_token"]
                else:
                    self.logger.warning("Failed to get Reddit access token")
                    return

            # Collect posts from subreddits
            headers = {
            "Authorization": f"Bearer {access_token)",
                "User-Agent": "gary-taleb-pipeline/1.0"
            }

            for subreddit in subreddits:
                url = f"https://oauth.reddit.com/r/{subreddit)/hot"
                params = {"limit": 25)

                async with self.session.get(url, headers=headers, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        posts = data["data"]["children"]

                        # Process posts for each symbol
                        for symbol in symbols:
                            symbol_posts = [
                            post["data"] for post in posts
                            if symbol.lower() in post["data"]["title"].lower() or
                            symbol.lower() in post["data"].get("selftext", "").lower()
                            ]

                            if symbol_posts:
                                sentiment_data = await self._process_reddit_posts(symbol, subreddit, symbol_posts)
                                if sentiment_data:
                                    self.social_data[symbol].append(sentiment_data)

        except Exception as e:
            self.logger.error(f"Reddit collection error: {e)")

    async def _process_reddit_posts(self, symbol: str, subreddit: str, posts: List[Dict]) -> Optional[SocialSentimentData]:
        """Process Reddit posts for sentiment"""
        if not posts:
            return None

        try:
            messages = []
            for post in posts:
                title = post.get("title", "")
                selftext = post.get("selftext", "")
                messages.append(f"{title) {selftext)")

            sentiment_scores = await asyncio.get_event_loop().run_in_executor(
            self.executor, self._analyze_social_sentiment, messages
            )

            positive_count = sum(1 for score in sentiment_scores if score > 0.1)
            negative_count = sum(1 for score in sentiment_scores if score < -0.1)
            neutral_count = len(sentiment_scores) - positive_count - negative_count

            # Weight by post score (upvotes - downvotes)
            weighted_scores = []
            for post, sentiment in zip(posts, sentiment_scores):
                weight = max(1, post.get("score", 1))
                weighted_scores.extend([sentiment] * min(weight, 10))  # Cap weight

            return SocialSentimentData(
            platform=f"reddit_{subreddit)",
                symbol=symbol,
                timestamp=datetime.now(),
                message_count=len(messages),
                positive_count=positive_count,
                negative_count=negative_count,
                neutral_count=neutral_count,
                sentiment_score=np.mean(weighted_scores) if weighted_scores else 0,
                volume_mentions=len(messages),
                influencer_mentions=0,  # Reddit doesn't have clear influencer metrics
                raw_messages=messages[:5]
            )

        except Exception as e:
            self.logger.error(f"Reddit processing error: {e)")
            return None

    async def _collect_stocktwits_sentiment(self):
        """Collect sentiment from StockTwits API"""
        # StockTwits has specific API endpoints for symbols
        symbols = ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN", "NVDA", "META"]

        for symbol in symbols:
            try:
                url = f"https://api.stocktwits.com/api/2/streams/symbol/{symbol).json"

                async with self.session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        if "messages" in data:
                            sentiment_data = await self._process_stocktwits_messages(symbol, data["messages"])
                            if sentiment_data:
                                self.social_data[symbol].append(sentiment_data)

                # Rate limiting
                await asyncio.sleep(2)

            except Exception as e:
                self.logger.error(f"StockTwits collection error for {symbol): {e)")

    async def _process_stocktwits_messages(self, symbol: str, messages: List[Dict]) -> Optional[SocialSentimentData]:
        """Process StockTwits messages"""
        if not messages:
            return None

        try:
            texts = [msg.get("body", "") for msg in messages]

            # StockTwits provides sentiment in the data
            bullish_count = sum(1 for msg in messages if msg.get("entities", {}).get("sentiment", {}).get("basic") == "Bullish")
            bearish_count = sum(1 for msg in messages if msg.get("entities", {}).get("sentiment", {}).get("basic") == "Bearish")
            neutral_count = len(messages) - bullish_count - bearish_count

            # Calculate sentiment score
            if bullish_count + bearish_count > 0:
                sentiment_score = (bullish_count - bearish_count) / (bullish_count + bearish_count)
            else:
                sentiment_score = 0

            return SocialSentimentData(
            platform="stocktwits",
                symbol=symbol,
                timestamp=datetime.now(),
                message_count=len(texts),
                positive_count=bullish_count,
                negative_count=bearish_count,
                neutral_count=neutral_count,
                sentiment_score=sentiment_score,
                volume_mentions=len(texts),
                influencer_mentions=0,
                raw_messages=texts[:5]
            )

        except Exception as e:
            self.logger.error(f"StockTwits processing error: {e)")
            return None

    def _analyze_social_sentiment(self, messages: List[str]) -> List[float]:
        """Analyze sentiment of social media messages (simplified version)"""
        sentiment_scores = []

        # Simple keyword-based sentiment (would use proper NLP in production)
        positive_words = {
        "bullish", "buy", "long", "moon", "rocket", "pump", "gain", "profit",
            "strong", "good", "great", "excellent", "up", "rise", "bull", "calls"
        }

        negative_words = {
        "bearish", "sell", "short", "dump", "drop", "crash", "loss", "weak",
            "bad", "terrible", "awful", "down", "fall", "bear", "puts"
        }

        for message in messages:
            if not message:
                sentiment_scores.append(0.0)
                continue

            words = re.findall(r'\b\w+\b', message.lower())
            positive_count = sum(1 for word in words if word in positive_words)
            negative_count = sum(1 for word in words if word in negative_words)

            if positive_count + negative_count == 0:
                score = 0.0
            else:
                score = (positive_count - negative_count) / (positive_count + negative_count)

            sentiment_scores.append(score)

        return sentiment_scores

    async def _economic_data_loop(self):
        """Background loop for economic data collection"""
        while self.running:
            try:
                await self._collect_economic_indicators()
                await asyncio.sleep(3600)  # 1 hour
            except Exception as e:
                self.logger.error(f"Economic data collection error: {e)")
                await asyncio.sleep(600)  # 10 minutes on error

    async def _collect_economic_indicators(self):
        """Collect economic indicators from FRED API"""
        if not self.fred_api_key or not self.session:
            return

        for indicator in self.economic_indicators:
            try:
                url = "https://api.stlouisfed.org/fred/series/observations"
                params = {
                "series_id": indicator,
                    "api_key": self.fred_api_key,
                    "file_type": "json",
                    "limit": 1,
                    "sort_order": "desc"
                }

                async with self.session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        if "observations" in data and data["observations"]:
                            obs = data["observations"][0]

                            if obs["value"] != ".":  # FRED uses "." for missing values
                            econ_data = EconomicIndicator(
                            indicator_name=indicator,
                                    value=float(obs["value"]),
                                    timestamp=datetime.strptime(obs["date"], "%Y-%m-%d"),
                                    source="fred"
                                )

                                self.economic_data.append(econ_data)

                # Rate limiting
                await asyncio.sleep(1)

            except Exception as e:
                self.logger.error(f"FRED API error for {indicator): {e)")

    async def _signal_generation_loop(self):
        """Background loop for generating alternative signals"""
        while self.running:
            try:
                await self._generate_social_signals()
                await self._generate_economic_signals()
                await asyncio.sleep(300)  # 5 minutes
            except Exception as e:
                self.logger.error(f"Signal generation error: {e)")

    async def _generate_social_signals(self):
        """Generate signals from social sentiment data"""
        for symbol, data_deque in self.social_data.items():
            if len(data_deque) < 2:
                continue

            try:
                recent_data = list(data_deque)[-10:]  # Last 10 data points

                # Calculate aggregated sentiment
                total_messages = sum(d.message_count for d in recent_data)
                if total_messages < 10:  # Need minimum volume
                continue

                # Weighted sentiment score
                weighted_sentiment = sum(
                d.sentiment_score * d.message_count for d in recent_data
                ) / total_messages

                # Calculate trend
                if len(recent_data) >= 3:
                    recent_sentiment = np.mean([d.sentiment_score for d in recent_data[-3:]])
                    older_sentiment = np.mean([d.sentiment_score for d in recent_data[-6:-3]])
                    sentiment_trend = recent_sentiment - older_sentiment
                else:
                    sentiment_trend = 0

                # Generate signal
                if abs(weighted_sentiment) > 0.3 or abs(sentiment_trend) > 0.2:
                    direction = "bullish" if weighted_sentiment > 0 else "bearish"
                    strength = min(abs(weighted_sentiment) + abs(sentiment_trend), 1.0)
                    confidence = min(total_messages / 100, 1.0)  # More messages = higher confidence

                    signal = AlternativeSignal(
                    signal_type="social",
                        symbol=symbol,
                        strength=strength,
                        direction=direction,
                        confidence=confidence,
                        timestamp=datetime.now(),
                        data_points=len(recent_data),
                        raw_data={
                        "weighted_sentiment": weighted_sentiment,
                            "sentiment_trend": sentiment_trend,
                            "total_messages": total_messages,
                            "platforms": list(set(d.platform for d in recent_data))
                        },
                        expires_at=datetime.now() + timedelta(hours=6)
                    )

                    self.alternative_signals[f"social_{symbol)"] = signal

            except Exception as e:
                self.logger.error(f"Social signal generation error for {symbol): {e)")

    async def _generate_economic_signals(self):
        """Generate signals from economic indicators"""
        if len(self.economic_data) < 5:
            return

        try:
            # Group by indicator
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            indicators_data = defaultdict(list)
            for data in self.economic_data:
                indicators_data[data.indicator_name].append(data)

            for indicator, data_list in indicators_data.items():
                if len(data_list) < 2:
                    continue

                # Sort by timestamp
                data_list.sort(key=lambda x: x.timestamp)
                latest = data_list[-1]
                previous = data_list[-2]

                # Calculate change
                change_percent = ((latest.value - previous.value) / previous.value) * 100

                # Determine impact on markets
                market_impact = self._assess_economic_impact(indicator, change_percent)

                if market_impact["strength"] > 0.3:
                    signal = AlternativeSignal(
                    signal_type="economic",
                        symbol="SPY",  # Broad market impact
                        strength=market_impact["strength"],
                        direction=market_impact["direction"],
                        confidence=0.8,  # Economic data is generally reliable
                        timestamp=datetime.now(),
                        data_points=len(data_list),
                        raw_data={
                        "indicator": indicator,
                            "current_value": latest.value,
                            "previous_value": previous.value,
                            "change_percent": change_percent),
                        expires_at=datetime.now() + timedelta(days=7)  # Economic signals last longer
                    )

                    self.alternative_signals[f"economic_{indicator)"] = signal

        except Exception as e:
            self.logger.error(f"Economic signal generation error: {e)")

    def _assess_economic_impact(self, indicator: str, change_percent: float) -> Dict[str, Any]:
        """Assess market impact of economic indicator change"""
        # Simplified impact assessment
        impact_rules = {
        "GDP": {"threshold": 0.5, "positive_is_bullish": True),
            "UNRATE": {"threshold": 0.2, "positive_is_bullish": False),  # Higher unemployment is bearish
            "CPIAUCSL": {"threshold": 0.3, "positive_is_bullish": False),  # Higher inflation can be bearish
            "FEDFUNDS": {"threshold": 0.25, "positive_is_bullish": False),  # Higher rates can be bearish
            "DGS10": {"threshold": 0.2, "positive_is_bullish": False),  # Higher yields can be bearish for stocks)

        rule = impact_rules.get(indicator, {"threshold": 0.5, "positive_is_bullish": True))

        if abs(change_percent) > rule["threshold"]:
            strength = min(abs(change_percent) / rule["threshold"], 1.0)

            if change_percent > 0:
                direction = "bullish" if rule["positive_is_bullish"] else "bearish"
            else:
                direction = "bearish" if rule["positive_is_bullish"] else "bullish"

            return {"strength": strength, "direction": direction)

        return {"strength": 0.0, "direction": "neutral"}

    def get_social_sentiment(self, symbol: str, hours: int = 24) -> Dict[str, Any]:
        """Get aggregated social sentiment for a symbol"""
        if symbol not in self.social_data:
            return {}

        cutoff_time = datetime.now() - timedelta(hours=hours)
        recent_data = [
        d for d in self.social_data[symbol]
        if d.timestamp >= cutoff_time
        ]

        if not recent_data:
            return {}

        total_messages = sum(d.message_count for d in recent_data)
        total_positive = sum(d.positive_count for d in recent_data)
        total_negative = sum(d.negative_count for d in recent_data)

        weighted_sentiment = sum(
        d.sentiment_score * d.message_count for d in recent_data
        ) / total_messages if total_messages > 0 else 0

        return {
        "symbol": symbol,
            "timeframe_hours": hours,
            "total_messages": total_messages,
            "positive_ratio": total_positive / total_messages if total_messages > 0 else 0,
            "negative_ratio": total_negative / total_messages if total_messages > 0 else 0,
            "weighted_sentiment": weighted_sentiment,
            "platforms": list(set(d.platform for d in recent_data)),
            "last_update": max(d.timestamp for d in recent_data).isoformat()
        }

    def get_active_signals(self, signal_type: Optional[str] = None) -> List[AlternativeSignal]:
        """Get currently active alternative signals"""
        current_time = datetime.now()
        active_signals = []

        for signal in self.alternative_signals.values():
            # Check if signal is still valid
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            if signal.expires_at and signal.expires_at < current_time:
                continue

            if signal_type and signal.signal_type != signal_type:
                continue

            active_signals.append(signal)

        # Sort by strength and timestamp
        active_signals.sort(key=lambda x: (x.strength, x.timestamp), reverse=True)
        return active_signals

    def get_signal_summary(self) -> Dict[str, Any]:
        """Get summary of alternative data signals"""
        active_signals = self.get_active_signals()

        return {
        "total_active_signals": len(active_signals),
            "social_signals": len([s for s in active_signals if s.signal_type == "social"]),
            "economic_signals": len([s for s in active_signals if s.signal_type == "economic"]),
            "bullish_signals": len([s for s in active_signals if s.direction == "bullish"]),
            "bearish_signals": len([s for s in active_signals if s.direction == "bearish"]),
            "high_confidence_signals": len([s for s in active_signals if s.confidence > 0.7]),
            "symbols_tracked": len(self.social_data),
            "last_update": datetime.now().isoformat()
        }

    def _get_env_var(self, var_name: str) -> str:
        """Get environment variable"""
        import os
        return os.getenv(var_name, "")

    def __del__(self):
        """Cleanup on destruction"""
        if self.running:
            try:
                loop = asyncio.get_event_loop()
                loop.create_task(self.stop())
            except Exception:
                pass