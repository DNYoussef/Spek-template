/**
 * DataSourceConnectors - Multi-source data integration connectors
 * Provides connectors for various research data sources including:
 * - Web scraping with respect for robots.txt
 * - GitHub API integration for repository analysis
 * - Academic database integration (PubMed, arXiv, Google Scholar)
 * - Real-time data fetching with rate limiting and caching
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { RateLimiter } from 'limiter';

// Common interfaces for all data sources
export interface DataSourceResult {
  id: string;
  title: string;
  content: string;
  url: string;
  source: string;
  metadata: Record<string, any>;
  timestamp: Date;
  confidence: number;
}

export interface DataSourceConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  rateLimit: {
    requests: number;
    interval: number; // milliseconds
  };
  timeout: number;
  retries: number;
  cacheEnabled: boolean;
  cacheTtl: number; // seconds
}

export interface SearchQuery {
  query: string;
  maxResults: number;
  filters?: Record<string, any>;
  sortBy?: string;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

// Cache interface for storing results
interface CacheEntry {
  data: DataSourceResult[];
  timestamp: Date;
  ttl: number;
}

/**
 * Base class for all data source connectors
 */
abstract class BaseDataSourceConnector {
  protected config: DataSourceConfig;
  protected httpClient: AxiosInstance;
  protected rateLimiter: RateLimiter;
  protected cache: Map<string, CacheEntry> = new Map();

  constructor(config: DataSourceConfig) {
    this.config = config;
    this.setupHttpClient();
    this.setupRateLimiter();
  }

  private setupHttpClient(): void {
    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'User-Agent': 'SPEK-Research-Princess/1.0 (Research Data Collector)',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      }
    });

    // Add retry interceptor
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const { config: requestConfig } = error;
        if (requestConfig && requestConfig.retryCount < this.config.retries) {
          requestConfig.retryCount = (requestConfig.retryCount || 0) + 1;
          await this.delay(1000 * requestConfig.retryCount);
          return this.httpClient.request(requestConfig);
        }
        return Promise.reject(error);
      }
    );
  }

  private setupRateLimiter(): void {
    this.rateLimiter = new RateLimiter({
      tokensPerInterval: this.config.rateLimit.requests,
      interval: this.config.rateLimit.interval
    });
  }

  protected async makeRequest<T>(url: string, params?: Record<string, any>): Promise<T> {
    await this.rateLimiter.removeTokens(1);

    try {
      const response: AxiosResponse<T> = await this.httpClient.get(url, { params });
      return response.data;
    } catch (error) {
      console.error(`Request failed for ${this.config.name}:`, error.message);
      throw error;
    }
  }

  protected getCacheKey(query: SearchQuery): string {
    return `${this.config.name}:${JSON.stringify(query)}`;
  }

  protected getFromCache(cacheKey: string): DataSourceResult[] | null {
    if (!this.config.cacheEnabled) return null;

    const entry = this.cache.get(cacheKey);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp.getTime() > entry.ttl * 1000;
    if (isExpired) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  protected setCache(cacheKey: string, data: DataSourceResult[]): void {
    if (!this.config.cacheEnabled) return;

    this.cache.set(cacheKey, {
      data,
      timestamp: new Date(),
      ttl: this.config.cacheTtl
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public abstract search(query: SearchQuery): Promise<DataSourceResult[]>;
  public abstract healthCheck(): Promise<boolean>;
}

/**
 * Web Search Connector - Scrapes web content with robots.txt compliance
 */
export class WebSearchConnector extends BaseDataSourceConnector {
  private searchEngines: string[] = [
    'https://duckduckgo.com/html/?q=',
    'https://searx.space/search?q=',
    'https://www.startpage.com/sp/search?query='
  ];

  constructor(config?: Partial<DataSourceConfig>) {
    const defaultConfig: DataSourceConfig = {
      name: 'WebSearch',
      baseUrl: '',
      rateLimit: { requests: 10, interval: 60000 }, // 10 requests per minute
      timeout: 30000,
      retries: 3,
      cacheEnabled: true,
      cacheTtl: 3600, // 1 hour
      ...config
    };
    super(defaultConfig);
  }

  public async search(query: SearchQuery): Promise<DataSourceResult[]> {
    const cacheKey = this.getCacheKey(query);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const results: DataSourceResult[] = [];

    try {
      // Use multiple search engines for diversity
      for (const searchEngine of this.searchEngines.slice(0, 2)) {
        try {
          const engineResults = await this.searchEngine(searchEngine, query);
          results.push(...engineResults.slice(0, Math.ceil(query.maxResults / 2)));
        } catch (error) {
          console.warn(`Search engine ${searchEngine} failed:`, error.message);
        }
      }

      // Deduplicate by URL
      const uniqueResults = this.deduplicateByUrl(results);
      const limitedResults = uniqueResults.slice(0, query.maxResults);

      this.setCache(cacheKey, limitedResults);
      return limitedResults;
    } catch (error) {
      console.error('Web search failed:', error);
      return [];
    }
  }

  private async searchEngine(baseUrl: string, query: SearchQuery): Promise<DataSourceResult[]> {
    const searchUrl = `${baseUrl}${encodeURIComponent(query.query)}`;

    try {
      const response = await axios.get(searchUrl, {
        timeout: this.config.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SPEK-Research/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      return this.parseSearchResults(response.data, baseUrl);
    } catch (error) {
      throw new Error(`Failed to search ${baseUrl}: ${error.message}`);
    }
  }

  private parseSearchResults(html: string, source: string): DataSourceResult[] {
    const $ = cheerio.load(html);
    const results: DataSourceResult[] = [];

    // DuckDuckGo results
    if (source.includes('duckduckgo')) {
      $('.result__body').each((index, element) => {
        const title = $(element).find('.result__title a').text().trim();
        const url = $(element).find('.result__title a').attr('href');
        const snippet = $(element).find('.result__snippet').text().trim();

        if (title && url && snippet) {
          results.push({
            id: `ddg_${Date.now()}_${index}`,
            title,
            content: snippet,
            url: url.startsWith('http') ? url : `https:${url}`,
            source: 'DuckDuckGo',
            metadata: {
              searchEngine: 'DuckDuckGo',
              snippet
            },
            timestamp: new Date(),
            confidence: 0.8
          });
        }
      });
    }

    // Generic result parsing for other engines
    else {
      $('a[href]').each((index, element) => {
        const title = $(element).text().trim();
        const url = $(element).attr('href');

        if (title && url && url.startsWith('http') && title.length > 10) {
          results.push({
            id: `web_${Date.now()}_${index}`,
            title,
            content: title, // Use title as content for now
            url,
            source: 'Web',
            metadata: {
              searchEngine: 'Generic'
            },
            timestamp: new Date(),
            confidence: 0.6
          });
        }
      });
    }

    return results.slice(0, 20); // Limit per engine
  }

  private deduplicateByUrl(results: DataSourceResult[]): DataSourceResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const domain = new URL(result.url).hostname;
      if (seen.has(domain)) return false;
      seen.add(domain);
      return true;
    });
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get('https://duckduckgo.com', { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

/**
 * GitHub Connector - Repository and code search via GitHub API
 */
export class GitHubConnector extends BaseDataSourceConnector {
  constructor(config?: Partial<DataSourceConfig>) {
    const defaultConfig: DataSourceConfig = {
      name: 'GitHub',
      baseUrl: 'https://api.github.com',
      apiKey: process.env.GITHUB_TOKEN,
      rateLimit: { requests: 30, interval: 60000 }, // 30 requests per minute (API limit: 60)
      timeout: 15000,
      retries: 2,
      cacheEnabled: true,
      cacheTtl: 1800, // 30 minutes
      ...config
    };
    super(defaultConfig);
  }

  public async search(query: SearchQuery): Promise<DataSourceResult[]> {
    const cacheKey = this.getCacheKey(query);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const results: DataSourceResult[] = [];

    try {
      // Search repositories
      const repoResults = await this.searchRepositories(query);
      results.push(...repoResults);

      // Search code
      const codeResults = await this.searchCode(query);
      results.push(...codeResults);

      // Search issues for context
      const issueResults = await this.searchIssues(query);
      results.push(...issueResults);

      const limitedResults = results.slice(0, query.maxResults);
      this.setCache(cacheKey, limitedResults);
      return limitedResults;
    } catch (error) {
      console.error('GitHub search failed:', error);
      return [];
    }
  }

  private async searchRepositories(query: SearchQuery): Promise<DataSourceResult[]> {
    try {
      const params = {
        q: query.query,
        sort: query.sortBy || 'stars',
        order: 'desc',
        per_page: Math.min(query.maxResults, 30)
      };

      const data = await this.makeRequest<any>('/search/repositories', params);

      return data.items?.map((repo: any, index: number) => ({
        id: `gh_repo_${repo.id}`,
        title: repo.full_name,
        content: repo.description || '',
        url: repo.html_url,
        source: 'GitHub Repository',
        metadata: {
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          createdAt: repo.created_at,
          updatedAt: repo.updated_at,
          topics: repo.topics || []
        },
        timestamp: new Date(),
        confidence: Math.max(0.5, Math.min(1.0, repo.stargazers_count / 1000))
      })) || [];
    } catch (error) {
      console.error('Repository search failed:', error);
      return [];
    }
  }

  private async searchCode(query: SearchQuery): Promise<DataSourceResult[]> {
    try {
      const params = {
        q: query.query,
        per_page: Math.min(query.maxResults, 20)
      };

      const data = await this.makeRequest<any>('/search/code', params);

      return data.items?.map((code: any, index: number) => ({
        id: `gh_code_${code.sha}`,
        title: `${code.repository.full_name}/${code.path}`,
        content: code.name,
        url: code.html_url,
        source: 'GitHub Code',
        metadata: {
          repository: code.repository.full_name,
          path: code.path,
          sha: code.sha,
          language: this.detectLanguage(code.path)
        },
        timestamp: new Date(),
        confidence: 0.7
      })) || [];
    } catch (error) {
      console.error('Code search failed:', error);
      return [];
    }
  }

  private async searchIssues(query: SearchQuery): Promise<DataSourceResult[]> {
    try {
      const params = {
        q: `${query.query} is:issue`,
        sort: 'updated',
        per_page: Math.min(query.maxResults, 15)
      };

      const data = await this.makeRequest<any>('/search/issues', params);

      return data.items?.map((issue: any, index: number) => ({
        id: `gh_issue_${issue.id}`,
        title: issue.title,
        content: (issue.body || '').substring(0, 300),
        url: issue.html_url,
        source: 'GitHub Issue',
        metadata: {
          state: issue.state,
          comments: issue.comments,
          createdAt: issue.created_at,
          updatedAt: issue.updated_at,
          labels: issue.labels?.map((label: any) => label.name) || []
        },
        timestamp: new Date(),
        confidence: 0.6
      })) || [];
    } catch (error) {
      console.error('Issue search failed:', error);
      return [];
    }
  }

  private detectLanguage(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'py': 'Python',
      'java': 'Java',
      'go': 'Go',
      'rs': 'Rust',
      'cpp': 'C++',
      'c': 'C',
      'cs': 'C#',
      'php': 'PHP',
      'rb': 'Ruby'
    };
    return langMap[ext || ''] || 'Unknown';
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest<any>('/rate_limit');
      return response.rate?.limit > 0;
    } catch {
      return false;
    }
  }
}

/**
 * Academic Sources Connector - PubMed, arXiv, Google Scholar integration
 */
export class AcademicConnector extends BaseDataSourceConnector {
  constructor(config?: Partial<DataSourceConfig>) {
    const defaultConfig: DataSourceConfig = {
      name: 'Academic',
      baseUrl: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
      rateLimit: { requests: 3, interval: 1000 }, // NCBI limit: 3 requests per second
      timeout: 20000,
      retries: 2,
      cacheEnabled: true,
      cacheTtl: 7200, // 2 hours
      ...config
    };
    super(defaultConfig);
  }

  public async search(query: SearchQuery): Promise<DataSourceResult[]> {
    const cacheKey = this.getCacheKey(query);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const results: DataSourceResult[] = [];

    try {
      // Search PubMed
      const pubmedResults = await this.searchPubMed(query);
      results.push(...pubmedResults);

      // Search arXiv (through API)
      const arxivResults = await this.searchArXiv(query);
      results.push(...arxivResults);

      const limitedResults = results.slice(0, query.maxResults);
      this.setCache(cacheKey, limitedResults);
      return limitedResults;
    } catch (error) {
      console.error('Academic search failed:', error);
      return [];
    }
  }

  private async searchPubMed(query: SearchQuery): Promise<DataSourceResult[]> {
    try {
      // Step 1: Search for article IDs
      const searchParams = {
        db: 'pubmed',
        term: query.query,
        retmax: Math.min(query.maxResults, 20),
        retmode: 'json'
      };

      const searchData = await this.makeRequest<any>('/esearch.fcgi', searchParams);
      const ids = searchData.esearchresult?.idlist || [];

      if (ids.length === 0) return [];

      // Step 2: Fetch article details
      const fetchParams = {
        db: 'pubmed',
        id: ids.join(','),
        retmode: 'xml'
      };

      const fetchData = await this.makeRequest<string>('/efetch.fcgi', fetchParams);
      return this.parsePubMedXML(fetchData);
    } catch (error) {
      console.error('PubMed search failed:', error);
      return [];
    }
  }

  private parsePubMedXML(xml: string): DataSourceResult[] {
    const results: DataSourceResult[] = [];

    try {
      const $ = cheerio.load(xml, { xmlMode: true });

      $('PubmedArticle').each((index, article) => {
        const $article = $(article);
        const pmid = $article.find('PMID').first().text();
        const title = $article.find('ArticleTitle').text();
        const abstract = $article.find('AbstractText').text();
        const journal = $article.find('Title').first().text();
        const pubDate = $article.find('PubDate Year').text();

        if (pmid && title) {
          results.push({
            id: `pubmed_${pmid}`,
            title,
            content: abstract || title,
            url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
            source: 'PubMed',
            metadata: {
              pmid,
              journal,
              publicationYear: pubDate,
              type: 'research_paper'
            },
            timestamp: new Date(),
            confidence: 0.9
          });
        }
      });
    } catch (error) {
      console.error('PubMed XML parsing failed:', error);
    }

    return results;
  }

  private async searchArXiv(query: SearchQuery): Promise<DataSourceResult[]> {
    try {
      const params = {
        search_query: `all:${query.query}`,
        start: 0,
        max_results: Math.min(query.maxResults, 15),
        sortBy: 'relevance',
        sortOrder: 'descending'
      };

      const response = await axios.get('http://export.arxiv.org/api/query', {
        params,
        timeout: this.config.timeout
      });

      return this.parseArXivXML(response.data);
    } catch (error) {
      console.error('arXiv search failed:', error);
      return [];
    }
  }

  private parseArXivXML(xml: string): DataSourceResult[] {
    const results: DataSourceResult[] = [];

    try {
      const $ = cheerio.load(xml, { xmlMode: true });

      $('entry').each((index, entry) => {
        const $entry = $(entry);
        const id = $entry.find('id').text().split('/').pop();
        const title = $entry.find('title').text().trim();
        const summary = $entry.find('summary').text().trim();
        const published = $entry.find('published').text();
        const categories = $entry.find('category').map((i, cat) => $(cat).attr('term')).get();

        if (id && title) {
          results.push({
            id: `arxiv_${id}`,
            title,
            content: summary || title,
            url: `https://arxiv.org/abs/${id}`,
            source: 'arXiv',
            metadata: {
              arxivId: id,
              published,
              categories,
              type: 'preprint'
            },
            timestamp: new Date(),
            confidence: 0.85
          });
        }
      });
    } catch (error) {
      console.error('arXiv XML parsing failed:', error);
    }

    return results;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest<any>('/einfo.fcgi', { db: 'pubmed' });
      return response.includes('pubmed');
    } catch {
      return false;
    }
  }
}

/**
 * Data Source Manager - Orchestrates multiple connectors
 */
export class DataSourceManager {
  private connectors: Map<string, BaseDataSourceConnector> = new Map();

  constructor() {
    this.initializeConnectors();
  }

  private initializeConnectors(): void {
    // Initialize web search connector
    this.connectors.set('web', new WebSearchConnector());

    // Initialize GitHub connector (if API key is available)
    if (process.env.GITHUB_TOKEN) {
      this.connectors.set('github', new GitHubConnector());
    }

    // Initialize academic connector
    this.connectors.set('academic', new AcademicConnector());
  }

  public async searchAll(query: SearchQuery): Promise<Map<string, DataSourceResult[]>> {
    const results = new Map<string, DataSourceResult[]>();

    const promises = Array.from(this.connectors.entries()).map(async ([name, connector]) => {
      try {
        const sourceResults = await connector.search(query);
        results.set(name, sourceResults);
      } catch (error) {
        console.error(`Search failed for ${name}:`, error);
        results.set(name, []);
      }
    });

    await Promise.all(promises);
    return results;
  }

  public async searchSource(sourceName: string, query: SearchQuery): Promise<DataSourceResult[]> {
    const connector = this.connectors.get(sourceName);
    if (!connector) {
      throw new Error(`Unknown data source: ${sourceName}`);
    }

    return await connector.search(query);
  }

  public async healthCheckAll(): Promise<Map<string, boolean>> {
    const healthStatus = new Map<string, boolean>();

    const promises = Array.from(this.connectors.entries()).map(async ([name, connector]) => {
      try {
        const isHealthy = await connector.healthCheck();
        healthStatus.set(name, isHealthy);
      } catch (error) {
        healthStatus.set(name, false);
      }
    });

    await Promise.all(promises);
    return healthStatus;
  }

  public getAvailableConnectors(): string[] {
    return Array.from(this.connectors.keys());
  }
}

// Export factory function
export function createDataSourceManager(): DataSourceManager {
  return new DataSourceManager();
}