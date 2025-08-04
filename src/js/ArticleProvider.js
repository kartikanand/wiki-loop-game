import ArticleCache from "./ArticleCache.js";
import { fetchArticleFromAPI } from "./utils.js";

class ArticleProvider {
  constructor() {
    this.cache = new ArticleCache();
  }

  // Get article content (from cache or API)
  async getArticleContent(title) {
    console.log("Fetching article:", title);

    // Check cache first
    const cacheResult = this.cache.get(title);
    if (cacheResult) {
      console.log("Article loaded from cache");
      return {
        html: cacheResult.html,
        resolvedTitle: cacheResult.resolvedTitle,
      };
    }

    // Not in cache, fetch from API
    const apiResult = await fetchArticleFromAPI(title);
    if (!apiResult) return null; // Article not found

    const { html, resolvedTitle } = apiResult;

    console.log(
      "Article fetched from API:",
      title,
      "-> resolved to:",
      resolvedTitle
    );

    // Add to cache with resolved title
    this.cache.add(title, html, resolvedTitle);
    console.log("Article fetched from API and cached");

    return { html, resolvedTitle };
  }

  // Preload article for faster access
  async preload(title) {
    // Only preload if not already in cache
    if (!this.cache.get(title)) {
      try {
        await this.getArticleContent(title);
      } catch (error) {
        console.warn("Failed to preload article:", title, error);
      }
    }
  }
}

export default ArticleProvider;
