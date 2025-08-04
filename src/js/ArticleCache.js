class ArticleCache {
  constructor() {
    this.CACHE_KEY = "wikipedia-loop-game-cache";
    this.CACHE_VERSION = "1.0";
    this.MAX_CACHE_SIZE = 50;
    this.articleCache = new Map();
    this.preloadingArticles = new Set();

    this.initialize();
  }

  // Initialize cache from localStorage
  initialize() {
    try {
      const cachedData = localStorage.getItem(this.CACHE_KEY);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed.version === this.CACHE_VERSION) {
          this.articleCache = new Map(parsed.articles);
          console.log(`Loaded ${this.articleCache.size} articles from cache`);
        } else {
          console.log("Cache version mismatch, clearing cache");
          localStorage.removeItem(this.CACHE_KEY);
        }
      }
    } catch (error) {
      console.error("Error loading cache:", error);
      localStorage.removeItem(this.CACHE_KEY);
    }
  }

  // Save cache to localStorage
  save() {
    try {
      const cacheData = {
        version: this.CACHE_VERSION,
        articles: Array.from(this.articleCache.entries()),
        timestamp: Date.now(),
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Error saving cache:", error);
      // If storage is full, clear some old entries
      if (error.name === "QuotaExceededError") {
        this.clearOldEntries();
      }
    }
  }

  // Clear old cache entries when storage is full
  clearOldEntries() {
    const entries = Array.from(this.articleCache.entries());
    // Sort by last accessed time and remove oldest half
    entries.sort((a, b) => (a[1].lastAccessed || 0) - (b[1].lastAccessed || 0));
    const toRemove = Math.floor(entries.length / 2);

    for (let i = 0; i < toRemove; i++) {
      this.articleCache.delete(entries[i][0]);
    }

    console.log(`Cleared ${toRemove} old cache entries`);
    this.save();
  }

  // Add article to cache
  add(title, html, resolvedTitle = null) {
    // Remove oldest entries if cache is too large
    if (this.articleCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.articleCache.keys().next().value;
      this.articleCache.delete(oldestKey);
    }

    const cacheData = {
      html: html,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      resolvedTitle: resolvedTitle || title,
    };

    this.articleCache.set(title, cacheData);

    // Also cache under resolved title if different
    if (resolvedTitle && resolvedTitle !== title) {
      this.articleCache.set(resolvedTitle, cacheData);
    }

    this.save();
  }

  // Get article from cache
  get(title) {
    const cached = this.articleCache.get(title);
    if (cached) {
      // Update last accessed time
      cached.lastAccessed = Date.now();
      console.log(
        `Cache hit for: ${title}${
          cached.resolvedTitle && cached.resolvedTitle !== title
            ? ` (resolves to: ${cached.resolvedTitle})`
            : ""
        }`
      );
      return {
        html: cached.html,
        resolvedTitle: cached.resolvedTitle || title,
      };
    }
    console.log(`Cache miss for: ${title}`);
    return null;
  }

  // Check if article exists in cache
  has(title) {
    return this.articleCache.has(title);
  }

  // Check if article is currently being preloaded
  isPreloading(title) {
    return this.preloadingArticles.has(title);
  }

  // Preload article in background
  async preload(title) {
    // Don't preload if already cached or currently preloading
    if (this.has(title) || this.isPreloading(title)) {
      return;
    }

    this.preloadingArticles.add(title);
    console.log(`Preloading article: ${title}`);

    try {
      const response = await fetch(
        `https://en.wikipedia.org/w/rest.php/v1/page/${encodeURIComponent(
          title
        )}/html`
      );
      if (response.ok) {
        const html = await response.text();
        this.add(title, html);
        console.log(`Preloaded and cached: ${title}`);
      }
    } catch (error) {
      console.error(`Error preloading ${title}:`, error);
    } finally {
      this.preloadingArticles.delete(title);
    }
  }
}

export default ArticleCache;
