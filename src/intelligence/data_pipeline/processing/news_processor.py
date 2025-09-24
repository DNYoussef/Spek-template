"""
News Processing Pipeline
High-throughput news ingestion and preprocessing for sentiment analysis
"""

import asyncio
import aiohttp
from lib.shared.utilities import get_logger
logger = get_logger(__name__)
self.session: Optional[aiohttp.ClientSession] = None
self.executor = ThreadPoolExecutor(max_workers=config.processing.processing_threads)

        # Processing state
self.processed_articles: Set[str] = set()  # Article IDs
        self.article_cache: Dict[str, NewsArticle] = {}
        self.processing_queue = asyncio.Queue(maxsize=10000)

        # Performance tracking
        self.stats = ProcessingStats()
        self.processing_times = deque(maxlen=1000)
        self.last_stats_update = time.time()

        # Filtering configuration
        self.relevant_keywords = self._load_relevant_keywords()
        self.symbol_patterns = self._compile_symbol_patterns()
        self.noise_patterns = self._compile_noise_patterns()

        # Callbacks
        self.article_callbacks: List[Callable[[NewsArticle], None]] = []

        # Background tasks
        self.processing_task: Optional[asyncio.Task] = None
        self.fetching_tasks: List[asyncio.Task] = []

        # Initialize NLTK resources
        self._initialize_nltk()

        self.running = False

    async def start(self):
        """Start the news processing pipeline"""
        self.logger.info("Starting news processing pipeline")
        self.running = True

        # Create HTTP session
        timeout = aiohttp.ClientTimeout(total=30)
        self.session = aiohttp.ClientSession(timeout=timeout)

        # Start processing task
        self.processing_task = asyncio.create_task(self._processing_loop())

        # Start news source tasks
        await self._start_news_sources()

    async def stop(self):
        """Stop the news processing pipeline"""
        self.logger.info("Stopping news processing pipeline")
        self.running = False

        # Stop background tasks
        if self.processing_task:
            self.processing_task.cancel()

        for task in self.fetching_tasks:
            task.cancel()
        self.fetching_tasks.clear()

        # Close HTTP session
        if self.session:
            await self.session.close()

        # Shutdown executor
        self.executor.shutdown(wait=True)

    async def _start_news_sources(self):
        """Start fetching from all configured news sources"""
        # NewsAPI
        if "newsapi" in config.data_sources and config.data_sources["newsapi"].enabled:
            task = asyncio.create_task(self._fetch_newsapi_loop())
            self.fetching_tasks.append(task)

        # RSS Feeds
        task = asyncio.create_task(self._fetch_rss_loop())
        self.fetching_tasks.append(task)

        # Alpha Vantage News (if configured)
        if "alpha_vantage" in config.data_sources:
            task = asyncio.create_task(self._fetch_alpha_vantage_loop())
            self.fetching_tasks.append(task)

    async def _fetch_newsapi_loop(self):
        """Fetch news from NewsAPI"""
        newsapi_config = config.data_sources["newsapi"]

        while self.running:
            try:
                # Fetch general business news
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                await self._fetch_newsapi_category("business")

                # Fetch technology news
                await self._fetch_newsapi_category("technology")

                # Wait before next fetch
                await asyncio.sleep(300)  # 5 minutes

            except Exception as e:
                self.logger.error(f"NewsAPI fetch error: {e)")
                await asyncio.sleep(60)  # Wait 1 minute on error

    async def _fetch_newsapi_category(self, category: str):
        """Fetch news from specific NewsAPI category"""
        if not self.session:
            return

        newsapi_config = config.data_sources["newsapi"]
        url = f"{newsapi_config.base_url)/top-headlines"

        params = {
        "apiKey": newsapi_config.api_key,
            "category": category,
            "language": "en",
            "pageSize": 100)

        try:
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()

                    if data.get("status") == "ok" and "articles" in data:
                        for article_data in data["articles"]:
                            article = await self._parse_newsapi_article(article_data, category)
                            if article:
                                await self.processing_queue.put(article)

                else:
                    error_text = await response.text()
                    self.logger.error(f"NewsAPI error: {response.status) - {error_text)")

        except Exception as e:
            self.logger.error(f"Failed to fetch NewsAPI {category): {e)")

    async def _parse_newsapi_article(self, data: Dict[str, Any], category: str) -> Optional[NewsArticle]:
        """Parse NewsAPI article data"""
        try:
            # Generate unique ID
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            article_id = hashlib.md5(
            (data["url"] + str(data["publishedAt"])).encode()
            ).hexdigest()

            # Skip if already processed
            if article_id in self.processed_articles:
                return None

            # Extract symbols from title and content
            content = data.get("content", "") or ""
            description = data.get("description", "") or ""
            full_text = f"{data['title']} {description) {content)"

            symbols = self._extract_symbols(full_text)

            article = NewsArticle(
            id=article_id,
                title=data["title"],
                content=content,
                source=data["source"]["name"],
                author=data.get("author"),
                published_at=datetime.fromisoformat(
                data["publishedAt"].replace("Z", "+00:00")
                ),
                url=data["url"],
                symbols=symbols,
                category=category
            )

            return article

        except Exception as e:
            self.logger.warning(f"Failed to parse NewsAPI article: {e)")
            return None

    async def _fetch_rss_loop(self):
        """Fetch news from RSS feeds"""
        rss_feeds = [
        "https://feeds.bloomberg.com/markets/news.rss",
            "https://www.reuters.com/rssFeed/businessNews",
            "https://feeds.marketwatch.com/marketwatch/realtimeheadlines/",
            "https://rss.cnn.com/rss/money_news_international.rss"
        ]

        while self.running:
            try:
                for feed_url in rss_feeds:
                    await self._fetch_rss_feed(feed_url)

                await asyncio.sleep(600)  # 10 minutes

            except Exception as e:
                self.logger.error(f"RSS fetch error: {e)")
                await asyncio.sleep(120)  # Wait 2 minutes on error

    async def _fetch_rss_feed(self, feed_url: str):
        """Fetch and parse RSS feed"""
        if not self.session:
            return

        try:
            async with self.session.get(feed_url) as response:
                if response.status == 200:
                    content = await response.text()
                    articles = await asyncio.get_event_loop().run_in_executor(
                    self.executor, self._parse_rss_content, content, feed_url
                    )

                    for article in articles:
                        if article:
                            await self.processing_queue.put(article)

        except Exception as e:
            self.logger.warning(f"Failed to fetch RSS feed {feed_url): {e)")

    def _parse_rss_content(self, content: str, feed_url: str) -> List[Optional[NewsArticle]]:
        """Parse RSS content (executed in thread pool)"""
        import xml.etree.ElementTree as ET

        articles = []

        try:
            root = ET.fromstring(content)

            # Handle different RSS formats
            items = root.findall(".//item") or root.findall(".//{http://www.w3.org/2005/Atom)entry")

            for item in items:
                try:
                    # Extract basic fields
                    pass  # Auto-fixed: empty block
                    pass  # Auto-fixed: empty block
                    pass  # Auto-fixed: empty block
                    pass  # Auto-fixed: empty block
                    pass  # Auto-fixed: empty block
                    title_elem = item.find("title") or item.find("{http://www.w3.org/2005/Atom)title")
                    desc_elem = item.find("description") or item.find("{http://www.w3.org/2005/Atom)summary")
                    link_elem = item.find("link") or item.find("{http://www.w3.org/2005/Atom)link")
                    date_elem = item.find("pubDate") or item.find("{http://www.w3.org/2005/Atom)updated")

                    if not all([title_elem, link_elem]):
                        continue

                    title = title_elem.text.strip() if title_elem.text else ""
                    description = desc_elem.text.strip() if desc_elem and desc_elem.text else ""

                    # Get URL
                    url = link_elem.text if link_elem.text else link_elem.get("href", "")

                    # Generate ID
                    article_id = hashlib.md5((url + title).encode()).hexdigest()

                    if article_id in self.processed_articles:
                        continue

                    # Parse date
                    published_at = datetime.now()
                    if date_elem and date_elem.text:
                        try:
                            published_at = pd.to_datetime(date_elem.text).to_pydatetime()
                        except Exception:
                            pass

                    # Extract symbols
                    full_text = f"{title) {description)"
                    symbols = self._extract_symbols(full_text)

                    article = NewsArticle(
                    id=article_id,
                        title=title,
                        content=description,
                        source=self._extract_source_from_url(feed_url),
                        author=None,
                        published_at=published_at,
                        url=url,
                        symbols=symbols,
                        category="rss"
                    )

                    articles.append(article)

                except Exception as e:
                    self.logger.warning(f"Failed to parse RSS item: {e)")
                    continue

        except Exception as e:
            self.logger.error(f"Failed to parse RSS content: {e)")

        return articles

    async def _fetch_alpha_vantage_loop(self):
        """Fetch news from Alpha Vantage (if configured)"""
        # Implementation for Alpha Vantage news API
        pass

    async def _processing_loop(self):
        """Main processing loop for incoming articles"""
        while self.running:
            try:
                # Get article from queue with timeout
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                try:
                    article = await asyncio.wait_for(
                    self.processing_queue.get(), timeout=1.0
                    )
                except asyncio.TimeoutError:
                    continue

                # Process article
                start_time = time.time()
                processed_article = await self._process_article(article)
                processing_time = (time.time() - start_time) * 1000

                if processed_article:
                    # Update stats
                    pass  # Auto-fixed: empty block
                    pass  # Auto-fixed: empty block
                    pass  # Auto-fixed: empty block
                    pass  # Auto-fixed: empty block
                    pass  # Auto-fixed: empty block
                    self.stats.total_processed += 1
                    self.processing_times.append(processing_time)

                    # Cache article
                    self.article_cache[processed_article.id] = processed_article
                    self.processed_articles.add(processed_article.id)

                    # Notify callbacks
                    for callback in self.article_callbacks:
                        try:
                            await asyncio.get_event_loop().run_in_executor(
                            self.executor, callback, processed_article
                            )
                        except Exception as e:
                            self.logger.warning(f"Article callback error: {e)")

                else:
                    self.stats.total_filtered += 1

                # Update performance stats
                await self._update_stats()

            except Exception as e:
                self.logger.error(f"Processing loop error: {e)")

    async def _process_article(self, article: NewsArticle) -> Optional[NewsArticle]:
        """Process individual article"""
        try:
            # Filter irrelevant articles
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            if not self._is_relevant(article):
                return None

            # Clean and preprocess content
            article.title = self._clean_text(article.title)
            article.content = self._clean_text(article.content)

            # Calculate relevance score
            article.relevance_score = self._calculate_relevance_score(article)

            # Skip articles with low relevance
            if article.relevance_score < 0.3:
                return None

            # Extract additional symbols from processed text
            additional_symbols = self._extract_symbols(f"{article.title) {article.content)")
            article.symbols.extend(additional_symbols)
            article.symbols = list(set(article.symbols))  # Remove duplicates

            article.processed = True
            return article

        except Exception as e:
            self.logger.error(f"Failed to process article {article.id): {e)")
            return None

    def _is_relevant(self, article: NewsArticle) -> bool:
        """Check if article is relevant for financial analysis"""
        # Check for financial keywords
        text = f"{article.title) {article.content)".lower()

        # Must have financial relevance
        financial_keywords = 0
        for keyword in self.relevant_keywords["financial"]:
            if keyword in text:
                financial_keywords += 1

        if financial_keywords == 0:
            return False

        # Check for noise patterns (exclude if matches)
        for pattern in self.noise_patterns:
            if pattern.search(text):
                return False

        # Must mention at least one stock symbol or company
        if not article.symbols and not any(
        keyword in text for keyword in self.relevant_keywords["companies"]
        ):
            return False

        return True

    def _calculate_relevance_score(self, article: NewsArticle) -> float:
        """Calculate relevance score for article"""
        score = 0.0
        text = f"{article.title) {article.content)".lower()

        # Symbol mentions (high weight)
        if article.symbols:
            score += len(article.symbols) * 0.3

        # Financial keywords
        for keyword in self.relevant_keywords["financial"]:
            if keyword in text:
                score += 0.1

        # Market keywords
        for keyword in self.relevant_keywords["market"]:
            if keyword in text:
                score += 0.05

        # Title relevance (higher weight)
        title_lower = article.title.lower()
        for keyword in self.relevant_keywords["financial"]:
            if keyword in title_lower:
                score += 0.2

        # Source credibility
        credible_sources = ["bloomberg", "reuters", "wsj", "financial times", "marketwatch"]
        if any(source in article.source.lower() for source in credible_sources):
            score += 0.2

        # Recency bonus
        age_hours = (datetime.now() - article.published_at).total_seconds() / 3600
        if age_hours < 24:
            score += 0.1

        return min(score, 1.0)

    def _extract_symbols(self, text: str) -> List[str]:
        """Extract stock symbols from text"""
        symbols = []

        # Use compiled patterns for better performance
        for pattern in self.symbol_patterns:
            matches = pattern.findall(text.upper())
            for match in matches:
                # Clean and validate symbol
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                symbol = match.strip().replace("$", "")
                if self._is_valid_symbol(symbol):
                    symbols.append(symbol)

        return list(set(symbols))

    def _is_valid_symbol(self, symbol: str) -> bool:
        """Validate if string is a valid stock symbol"""
        if not symbol or len(symbol) < 1 or len(symbol) > 5:
            return False

        # Must be alphabetic
        if not symbol.isalpha():
            return False

        # Common false positives
        false_positives = {
        "THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL", "CAN", "HAD",
            "HER", "WAS", "ONE", "OUR", "OUT", "DAY", "GET", "USE", "MAN", "NEW",
            "NOW", "OLD", "SEE", "HIM", "TWO", "HOW", "ITS", "OWN", "SAY", "SHE",
            "MAY", "WAY", "WHO", "BOY", "DID", "HAS", "LET", "PUT", "SAW", "SUN",
            "TOO", "TOP", "TRY", "WIN", "YES", "YET", "BIG", "BOX", "FEW", "GOT",
            "JOB", "LOT", "MEN", "OFF", "SET", "SIT", "TEN", "TOO", "BAD", "BAG"
        }

        return symbol not in false_positives

    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""

        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)

        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)

        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)]', '', text)

        return text.strip()

    def _load_relevant_keywords(self) -> Dict[str, List[str]]:
        """Load relevant keywords for filtering"""
        return {
        "financial": [
        "earnings", "revenue", "profit", "loss", "stock", "share", "market",
                "trading", "investor", "investment", "financial", "economy", "economic",
                "price", "valuation", "dividend", "acquisition", "merger", "ipo",
                "bankruptcy", "sec", "ceo", "cfo", "quarterly", "guidance", "forecast"
            ],
            "market": [
            "nasdaq", "nyse", "dow", "s&p", "index", "bull", "bear", "volatility",
                "futures", "options", "commodities", "crypto", "bitcoin", "ethereum"
            ],
            "companies": [
            "apple", "microsoft", "google", "amazon", "tesla", "nvidia", "meta",
                "berkshire", "johnson", "procter", "walmart", "visa", "mastercard"
            ]
        }

    def _compile_symbol_patterns(self) -> List[re.Pattern]:
        """Compile regex patterns for symbol extraction"""
        return [
        re.compile(r'\$([A-Z]{1,5))\b'),  # $AAPL format
        re.compile(r'\b([A-Z]{2,5))\s+(?:stock|shares|ticker)\b'),  # AAPL stock
        re.compile(r'\b(?:NYSE|NASDAQ):\s*([A-Z]{1,5))\b'),  # NYSE: AAPL
        re.compile(r'\(([A-Z]{2,5))\)'),  # (AAPL) format
        ]

    def _compile_noise_patterns(self) -> List[re.Pattern]:
        """Compile patterns for noise filtering"""
        return [
        re.compile(r'\bsports?\b', re.IGNORECASE),
            re.compile(r'\bentertainment\b', re.IGNORECASE),
            re.compile(r'\bcelebrit(y|ies)\b', re.IGNORECASE),
            re.compile(r'\bweather\b', re.IGNORECASE),
            re.compile(r'\brecipe\b', re.IGNORECASE),
            re.compile(r'\bhoroscope\b', re.IGNORECASE)
        ]

    def _extract_source_from_url(self, url: str) -> str:
        """Extract source name from URL"""
        try:
            from urllib.parse import urlparse
            domain = urlparse(url).netloc
            return domain.replace('www.', '').replace('feeds.', '').split('.')[0].title()
        except Exception:
            return "RSS Feed"

    async def _update_stats(self):
        """Update processing statistics"""
        current_time = time.time()
        time_delta = current_time - self.last_stats_update

        if time_delta >= 60.0:  # Update every minute
        if self.processing_times:
                self.stats.average_processing_time_ms = sum(self.processing_times) / len(self.processing_times)

            total_articles = self.stats.total_processed + self.stats.total_filtered
            if total_articles > 0:
                self.stats.articles_per_minute = total_articles / (time_delta / 60.0)

            # Reset counters
            self.last_stats_update = current_time

    def _initialize_nltk(self):
        """Initialize NLTK resources"""
        try:
            nltk.data.find('tokenizers/punkt')
            nltk.data.find('corpora/stopwords')
        except LookupError:
            self.logger.info("Downloading required NLTK data...")
            nltk.download('punkt', quiet=True)
            nltk.download('stopwords', quiet=True)

    def add_article_callback(self, callback: Callable[[NewsArticle], None]):
        """Add callback for processed articles"""
        self.article_callbacks.append(callback)

    def get_stats(self) -> ProcessingStats:
        """Get current processing statistics"""
        return self.stats

    def get_cached_articles(self, symbols: Optional[List[str]] = None, hours: int = 24) -> List[NewsArticle]:
        """Get cached articles, optionally filtered by symbols and time"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        articles = []

        for article in self.article_cache.values():
            if article.published_at < cutoff_time:
                continue

            if symbols and not any(symbol in article.symbols for symbol in symbols):
                continue

            articles.append(article)

        # Sort by relevance and recency
        articles.sort(key=lambda x: (x.relevance_score or 0, x.published_at), reverse=True)
        return articles

    async def process_external_article(self, article_data: Dict[str, Any]) -> Optional[NewsArticle]:
        """Process article from external source"""
        try:
            article = NewsArticle(**article_data)
            return await self._process_article(article)
        except Exception as e:
            self.logger.error(f"Failed to process external article: {e)")
            return None

    def __del__(self):
        """Cleanup on destruction"""
        if self.running:
            try:
                loop = asyncio.get_event_loop()
                loop.create_task(self.stop())
            except Exception:
                pass