"""
Sentiment Processing Engine
Advanced sentiment analysis for news and social media content
"""

import asyncio
from lib.shared.utilities import get_logger
logger = get_logger(__name__)
        self.executor = ThreadPoolExecutor(max_workers=config.processing.processing_threads)

        # Models and tokenizers
        self.models = {}
        self.tokenizers = {}
        self.pipelines = {}

        # Processing configuration
        self.batch_size = 32
        self.max_length = 512

        # Caching for performance
        self.sentiment_cache = {}
        self.cache_ttl = 3600  # 1 hour

        # Aggregation storage
        self.sentiment_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.aggregated_sentiments: Dict[str, Dict] = {}

        # Performance tracking
        self.processing_times = deque(maxlen=1000)
        self.total_processed = 0

        # Financial domain patterns
        self.financial_patterns = self._load_financial_patterns()

        # Background tasks
        self.aggregation_task: Optional[asyncio.Task] = None
        self.running = False

    async def start(self):
        """Initialize sentiment processor"""
        self.logger.info("Starting sentiment processor")
        self.running = True

        # Load models
        await self._load_models()

        # Start aggregation task
        self.aggregation_task = asyncio.create_task(self._aggregation_loop())

    async def stop(self):
        """Stop sentiment processor"""
        self.logger.info("Stopping sentiment processor")
        self.running = False

        if self.aggregation_task:
            self.aggregation_task.cancel()

        # Shutdown executor
        self.executor.shutdown(wait=True)

    async def _load_models(self):
        """Load pre-trained sentiment models"""
        models_to_load = [
            {
                "name": "finbert",
                "model_id": "ProsusAI/finbert",
                "primary": True
            },
            {
                "name": "distilbert",
                "model_id": config.processing.sentiment_model,
                "primary": False
            }
        ]

        for model_config in models_to_load:
            try:
                model_name = model_config["name"]
                model_id = model_config["model_id"]

                self.logger.info(f"Loading {model_name} model...")

                # Load in executor to avoid blocking
                tokenizer, model, sentiment_pipeline = await asyncio.get_event_loop().run_in_executor(
                    self.executor, self._load_model_sync, model_id
                )

                self.tokenizers[model_name] = tokenizer
                self.models[model_name] = model
                self.pipelines[model_name] = sentiment_pipeline

                self.logger.info(f"Successfully loaded {model_name}")

            except Exception as e:
                self.logger.error(f"Failed to load model {model_config['name']}: {e}")

        if not self.models:
            raise RuntimeError("No sentiment models could be loaded")

    def _load_model_sync(self, model_id: str):
        """Load model synchronously (for executor)"""
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        model = AutoModelForSequenceClassification.from_pretrained(model_id)

        # Create pipeline
        sentiment_pipeline = pipeline(
            "sentiment-analysis",
            model=model,
            tokenizer=tokenizer,
            truncation=True,
            max_length=self.max_length,
            device=0 if torch.cuda.is_available() else -1
        )

        return tokenizer, model, sentiment_pipeline

    async def analyze_article(self, article: NewsArticle) -> SentimentResult:
        """Analyze sentiment of a single article"""
        # Check cache first
        cache_key = f"{article.id}:{hash(article.content)}"
        if cache_key in self.sentiment_cache:
            cached_result, timestamp = self.sentiment_cache[cache_key]
            if time.time() - timestamp < self.cache_ttl:
                return cached_result

        # Prepare text for analysis
        text = self._prepare_text(article.title, article.content)

        # Analyze sentiment
        start_time = time.time()
        result = await self._analyze_text_batch([text])
        processing_time = (time.time() - start_time) * 1000

        if result:
            sentiment_result = result[0]
            sentiment_result.processing_time_ms = processing_time

            # Cache result
            self.sentiment_cache[cache_key] = (sentiment_result, time.time())

            # Store for aggregation
            self._store_sentiment_result(article, sentiment_result)

            return sentiment_result

        # Fallback result
        return SentimentResult(
            text=text[:100],
            sentiment="neutral",
            confidence=0.5,
            scores={"positive": 0.33, "negative": 0.33, "neutral": 0.34},
            processing_time_ms=processing_time,
            model_used="fallback"
        )

    async def analyze_batch(self, articles: List[NewsArticle]) -> List[SentimentResult]:
        """Analyze sentiment for batch of articles"""
        if not articles:
            return []

        # Prepare texts
        texts = []
        for article in articles:
            text = self._prepare_text(article.title, article.content)
            texts.append(text)

        # Process in batches
        results = []
        for i in range(0, len(texts), self.batch_size):
            batch_texts = texts[i:i + self.batch_size]
            batch_articles = articles[i:i + self.batch_size]

            batch_results = await self._analyze_text_batch(batch_texts)

            # Store results for aggregation
            for article, result in zip(batch_articles, batch_results):
                if result:
                    self._store_sentiment_result(article, result)

            results.extend(batch_results)

        return results

    async def _analyze_text_batch(self, texts: List[str]) -> List[SentimentResult]:
        """Analyze batch of texts using primary model"""
        if not texts or not self.pipelines:
            return []

        # Use primary model (FinBERT if available)
        primary_model = "finbert" if "finbert" in self.pipelines else list(self.pipelines.keys())[0]
        pipeline_obj = self.pipelines[primary_model]

        try:
            # Run in executor to avoid blocking
            start_time = time.time()
            raw_results = await asyncio.get_event_loop().run_in_executor(
                self.executor, pipeline_obj, texts
            )
            processing_time = (time.time() - start_time) * 1000

            # Convert to SentimentResult objects
            results = []
            for i, (text, raw_result) in enumerate(zip(texts, raw_results)):
                # Handle different output formats
                if isinstance(raw_result, list):
                    raw_result = raw_result[0] if raw_result else {"label": "NEUTRAL", "score": 0.5}

                sentiment = self._normalize_sentiment_label(raw_result["label"])
                confidence = raw_result["score"]

                # Create detailed scores
                scores = self._create_detailed_scores(sentiment, confidence)

                # Apply financial domain adjustments
                adjusted_sentiment, adjusted_confidence = self._apply_financial_adjustments(
                    text, sentiment, confidence
                )

                result = SentimentResult(
                    text=text[:100],  # Store truncated text for reference
                    sentiment=adjusted_sentiment,
                    confidence=adjusted_confidence,
                    scores=scores,
                    processing_time_ms=processing_time / len(texts),
                    model_used=primary_model
                )

                results.append(result)

            # Update performance metrics
            self.total_processed += len(results)
            self.processing_times.extend([r.processing_time_ms for r in results])

            return results

        except Exception as e:
            self.logger.error(f"Batch sentiment analysis failed: {e}")
            # Return neutral results as fallback
            return [
                SentimentResult(
                    text=text[:100],
                    sentiment="neutral",
                    confidence=0.5,
                    scores={"positive": 0.33, "negative": 0.33, "neutral": 0.34},
                    processing_time_ms=0.0,
                    model_used="error_fallback"
                )
                for text in texts
            ]

    def _prepare_text(self, title: str, content: str) -> str:
        """Prepare text for sentiment analysis"""
        # Combine title and content with title having higher weight
        if title and content:
            text = f"{title}. {content}"
        elif title:
            text = title
        elif content:
            text = content
        else:
            text = ""

        # Clean text
        text = self._clean_text_for_sentiment(text)

        # Truncate if too long
        if len(text) > self.max_length * 4:  # Rough character limit
            text = text[:self.max_length * 4]

        return text

    def _clean_text_for_sentiment(self, text: str) -> str:
        """Clean text specifically for sentiment analysis"""
        if not text:
            return ""

        # Remove URLs
        text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)

        # Remove email addresses
        text = re.sub(r'\S+@\S+', '', text)

        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)

        # Remove special characters but keep important punctuation
        text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)\$\%]', ' ', text)

        return text.strip()

    def _normalize_sentiment_label(self, label: str) -> str:
        """Normalize sentiment labels from different models"""
        label_lower = label.lower()

        if label_lower in ["positive", "pos", "bullish", "label_1"]:
            return "positive"
        elif label_lower in ["negative", "neg", "bearish", "label_0"]:
            return "negative"
        else:
            return "neutral"

    def _create_detailed_scores(self, sentiment: str, confidence: float) -> Dict[str, float]:
        """Create detailed sentiment scores"""
        if sentiment == "positive":
            return {
                "positive": confidence,
                "negative": (1 - confidence) * 0.3,
                "neutral": (1 - confidence) * 0.7
            }
        elif sentiment == "negative":
            return {
                "positive": (1 - confidence) * 0.3,
                "negative": confidence,
                "neutral": (1 - confidence) * 0.7
            }
        else:
            return {
                "positive": (1 - confidence) * 0.4,
                "negative": (1 - confidence) * 0.4,
                "neutral": confidence + (1 - confidence) * 0.2
            }

    def _apply_financial_adjustments(self, text: str, sentiment: str, confidence: float) -> Tuple[str, float]:
        """Apply financial domain-specific adjustments to sentiment"""
        text_lower = text.lower()

        # Strong positive indicators
        strong_positive = ["beats expectations", "strong earnings", "record profit", "outperform",
                          "upgrade", "bullish", "rally", "surge", "soar", "breakthrough"]

        # Strong negative indicators
        strong_negative = ["misses expectations", "weak earnings", "loss", "underperform",
                          "downgrade", "bearish", "plunge", "crash", "collapse", "bankruptcy"]

        # Amplify sentiment for strong indicators
        for indicator in strong_positive:
            if indicator in text_lower:
                if sentiment == "positive":
                    confidence = min(0.95, confidence * 1.2)
                elif sentiment == "neutral":
                    sentiment = "positive"
                    confidence = 0.7
                break

        for indicator in strong_negative:
            if indicator in text_lower:
                if sentiment == "negative":
                    confidence = min(0.95, confidence * 1.2)
                elif sentiment == "neutral":
                    sentiment = "negative"
                    confidence = 0.7
                break

        # Check for financial patterns
        for pattern_type, patterns in self.financial_patterns.items():
            for pattern in patterns:
                if pattern.search(text_lower):
                    if pattern_type == "positive" and sentiment != "negative":
                        confidence = min(0.9, confidence * 1.1)
                    elif pattern_type == "negative" and sentiment != "positive":
                        confidence = min(0.9, confidence * 1.1)

        return sentiment, confidence

    def _load_financial_patterns(self) -> Dict[str, List]:
        """Load financial domain patterns"""
        return {
            "positive": [
                re.compile(r'\b(?:earnings|revenue|profit)\s+(?:beat|exceed|surpass)\b'),
                re.compile(r'\b(?:strong|robust|solid)\s+(?:growth|performance|results)\b'),
                re.compile(r'\b(?:raise|increase|boost)\s+(?:guidance|forecast|target)\b'),
                re.compile(r'\b(?:acquisition|merger|deal)\s+(?:approved|completed|announced)\b')
            ],
            "negative": [
                re.compile(r'\b(?:earnings|revenue|profit)\s+(?:miss|fall\s+short|disappoint)\b'),
                re.compile(r'\b(?:weak|poor|disappointing)\s+(?:growth|performance|results)\b'),
                re.compile(r'\b(?:lower|cut|reduce)\s+(?:guidance|forecast|target)\b'),
                re.compile(r'\b(?:investigation|lawsuit|fine|penalty)\b')
            ]
        }

    def _store_sentiment_result(self, article: NewsArticle, result: SentimentResult):
        """Store sentiment result for aggregation"""
        for symbol in article.symbols:
            self.sentiment_history[symbol].append({
                "timestamp": article.published_at,
                "sentiment": result.sentiment,
                "confidence": result.confidence,
                "scores": result.scores,
                "article_id": article.id,
                "relevance_score": getattr(article, 'relevance_score', 1.0)
            })

    async def _aggregation_loop(self):
        """Background task for sentiment aggregation"""
        while self.running:
            try:
                await self._aggregate_sentiments()
                await asyncio.sleep(300)  # 5 minutes
            except Exception as e:
                self.logger.error(f"Sentiment aggregation error: {e}")

    async def _aggregate_sentiments(self):
        """Aggregate sentiment data for symbols"""
        current_time = datetime.now()
        timeframes = [
            ("1h", timedelta(hours=1)),
            ("4h", timedelta(hours=4)),
            ("1d", timedelta(days=1))
        ]

        for symbol, history in self.sentiment_history.items():
            if not history:
                continue

            for timeframe_name, timeframe_delta in timeframes:
                cutoff_time = current_time - timeframe_delta

                # Filter relevant data
                relevant_data = [
                    item for item in history
                    if item["timestamp"] >= cutoff_time
                ]

                if not relevant_data:
                    continue

                # Calculate aggregated metrics
                aggregated = self._calculate_aggregated_sentiment(
                    symbol, timeframe_name, current_time, relevant_data
                )

                # Store aggregated data
                key = f"{symbol}_{timeframe_name}"
                self.aggregated_sentiments[key] = aggregated

    def _calculate_aggregated_sentiment(
        self,
        symbol: str,
        timeframe: str,
        timestamp: datetime,
        data: List[Dict]
    ) -> AggregatedSentiment:
        """Calculate aggregated sentiment metrics"""
        if not data:
            return AggregatedSentiment(
                symbol=symbol,
                timeframe=timeframe,
                timestamp=timestamp,
                overall_sentiment="neutral",
                confidence=0.0,
                positive_ratio=0.0,
                negative_ratio=0.0,
                neutral_ratio=1.0,
                total_articles=0,
                weighted_score=0.0
            )

        total_articles = len(data)

        # Count sentiments
        positive_count = sum(1 for item in data if item["sentiment"] == "positive")
        negative_count = sum(1 for item in data if item["sentiment"] == "negative")
        neutral_count = total_articles - positive_count - negative_count

        # Calculate ratios
        positive_ratio = positive_count / total_articles
        negative_ratio = negative_count / total_articles
        neutral_ratio = neutral_count / total_articles

        # Calculate weighted score (considering confidence and relevance)
        weighted_scores = []
        for item in data:
            sentiment_score = 0.0
            if item["sentiment"] == "positive":
                sentiment_score = 1.0
            elif item["sentiment"] == "negative":
                sentiment_score = -1.0

            weight = item["confidence"] * item.get("relevance_score", 1.0)
            weighted_scores.append(sentiment_score * weight)

        weighted_score = np.mean(weighted_scores) if weighted_scores else 0.0

        # Determine overall sentiment
        if weighted_score > 0.2:
            overall_sentiment = "positive"
        elif weighted_score < -0.2:
            overall_sentiment = "negative"
        else:
            overall_sentiment = "neutral"

        # Calculate overall confidence
        confidence = np.mean([item["confidence"] for item in data])

        return AggregatedSentiment(
            symbol=symbol,
            timeframe=timeframe,
            timestamp=timestamp,
            overall_sentiment=overall_sentiment,
            confidence=confidence,
            positive_ratio=positive_ratio,
            negative_ratio=negative_ratio,
            neutral_ratio=neutral_ratio,
            total_articles=total_articles,
            weighted_score=weighted_score
        )

    def get_symbol_sentiment(
        self,
        symbol: str,
        timeframe: str = "4h"
    ) -> Optional[AggregatedSentiment]:
        """Get aggregated sentiment for a symbol"""
        key = f"{symbol}_{timeframe}"
        return self.aggregated_sentiments.get(key)

    def get_multiple_symbols_sentiment(
        self,
        symbols: List[str],
        timeframe: str = "4h"
    ) -> Dict[str, AggregatedSentiment]:
        """Get sentiment for multiple symbols"""
        results = {}
        for symbol in symbols:
            sentiment = self.get_symbol_sentiment(symbol, timeframe)
            if sentiment:
                results[symbol] = sentiment
        return results

    def get_trending_sentiment(self, timeframe: str = "1h", limit: int = 20) -> List[AggregatedSentiment]:
        """Get symbols with trending sentiment"""
        sentiments = [
            sentiment for key, sentiment in self.aggregated_sentiments.items()
            if key.endswith(f"_{timeframe}")
        ]

        # Sort by weighted score and total articles
        sentiments.sort(
            key=lambda x: (abs(x.weighted_score), x.total_articles),
            reverse=True
        )

        return sentiments[:limit]

    def get_processing_stats(self) -> Dict[str, Any]:
        """Get processing performance statistics"""
        if not self.processing_times:
            return {
                "total_processed": self.total_processed,
                "average_processing_time_ms": 0.0,
                "processing_rate_per_minute": 0.0
            }

        return {
            "total_processed": self.total_processed,
            "average_processing_time_ms": np.mean(self.processing_times),
            "max_processing_time_ms": np.max(self.processing_times),
            "min_processing_time_ms": np.min(self.processing_times),
            "processing_rate_per_minute": len(self.processing_times) * 60 / sum(self.processing_times) * 1000 if sum(self.processing_times) > 0 else 0.0,
            "models_loaded": list(self.models.keys())
        }

    def clear_cache(self):
        """Clear sentiment cache"""
        self.sentiment_cache.clear()
        self.logger.info("Sentiment cache cleared")

    def __del__(self):
        """Cleanup on destruction"""
        if self.running:
            try:
                loop = asyncio.get_event_loop()
                loop.create_task(self.stop())
            except Exception:
                pass