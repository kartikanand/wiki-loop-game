class ArticleDisplay {
  constructor(containerId, callbacks) {
    this.container = document.getElementById(containerId);
    this.callbacks = callbacks;
    this.currentIframe = null;
  }

  // Display article content using iframe for complete isolation
  displayArticle(title, html) {
    // Clear previous content and remove loading class
    this.container.innerHTML = "";
    this.container.className = "";
    this.container.style.cssText =
      "display: flex; flex-direction: column; flex: 1; overflow: hidden;";

    // Create title outside iframe
    const titleElement = document.createElement("h1");
    titleElement.className = "wiki-title";
    titleElement.textContent = title;
    this.container.appendChild(titleElement);

    // Create iframe for Wikipedia content
    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "width: 100%; flex: 1; border: none; background: white;";
    iframe.sandbox = "allow-same-origin allow-scripts";
    this.container.appendChild(iframe);
    this.currentIframe = iframe;

    // Write the Wikipedia HTML directly to the iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Wait for iframe to load then process links and scroll
    iframe.onload = () => {
      this._scrollToTop(iframe, iframeDoc);
      this._processLinks(iframe, iframeDoc);
    };
  }

  _scrollToTop(iframe, iframeDoc) {
    // Scroll to top of both the main content area and the iframe content
    const mainContent = document.querySelector(".main-content");
    mainContent.scrollTop = 0;

    // Also scroll the iframe content to top
    if (iframeDoc.documentElement) {
      iframeDoc.documentElement.scrollTop = 0;
      iframeDoc.body.scrollTop = 0;
    }

    // Additional scroll after a brief delay to ensure content is fully rendered
    setTimeout(() => {
      mainContent.scrollTop = 0;
      if (iframeDoc.documentElement) {
        iframeDoc.documentElement.scrollTop = 0;
        iframeDoc.body.scrollTop = 0;
        // Also try scrolling the window within the iframe
        try {
          iframe.contentWindow.scrollTo(0, 0);
        } catch (e) {
          console.log("Could not scroll iframe window:", e);
        }
      }
    }, 100);

    // Final scroll attempt after all links are processed
    setTimeout(() => {
      const mainContent = document.querySelector(".main-content");
      mainContent.scrollTop = 0;
      if (iframeDoc.documentElement) {
        iframeDoc.documentElement.scrollTop = 0;
        iframeDoc.body.scrollTop = 0;
        try {
          iframe.contentWindow.scrollTo(0, 0);
        } catch (e) {
          console.log("Could not scroll iframe window:", e);
        }
      }
    }, 250);
  }

  _processLinks(iframe, iframeDoc) {
    // Convert Wikipedia links to custom clickable spans within iframe
    const links = iframeDoc.querySelectorAll("a");

    links.forEach((link) => {
      const href = link.getAttribute("href");
      const rel = link.getAttribute("rel");
      const title = link.getAttribute("title");

      // Check if it's a Wikipedia link
      if (this._isWikipediaLink(href, rel)) {
        this._convertToWikiLink(link, href, rel, title, iframeDoc);
      } else {
        // For non-Wikipedia links, disable them
        this._disableExternalLink(link);
      }
    });
  }

  _isWikipediaLink(href, rel) {
    return (
      (rel && rel.includes("mw:WikiLink")) ||
      (href &&
        (href.startsWith("/wiki/") ||
          href.includes("wikipedia.org/wiki/") ||
          href.includes("en.wikipedia.org/wiki/")))
    );
  }

  _convertToWikiLink(link, href, rel, title, iframeDoc) {
    // Extract article title from different sources
    let articleTitle = this._extractArticleTitle(href, title, rel, link);

    // Create a custom clickable span
    const span = iframeDoc.createElement("span");
    span.innerHTML = link.innerHTML;
    span.className = "wiki-link";
    span.style.cssText =
      "color: #0645ad; cursor: pointer; text-decoration: none;";
    span.title = `Navigate to: ${articleTitle}`;
    span.dataset.articleTitle = articleTitle;

    // Add hover effect and preloading
    this._addHoverEffects(span, articleTitle);

    // Add click handler
    this._addClickHandler(span, articleTitle);

    // Replace the original link
    link.parentNode.replaceChild(span, link);
  }

  _extractArticleTitle(href, title, rel, link) {
    let articleTitle = "";

    if (href && href.startsWith("/wiki/")) {
      articleTitle = href.replace("/wiki/", "");
    } else if (href && href.includes("/wiki/")) {
      articleTitle = href.split("/wiki/")[1];
    } else if (title) {
      articleTitle = title;
    } else if (rel && rel.includes("mw:WikiLink")) {
      articleTitle = link.textContent.trim();
    }

    // Clean up the title
    return decodeURIComponent(articleTitle).replace(/_/g, " ").split("#")[0];
  }

  _addHoverEffects(span, articleTitle) {
    span.addEventListener("mouseenter", () => {
      span.style.textDecoration = "underline";
      setTimeout(() => {
        if (span.matches(":hover")) {
          this.callbacks.onLinkHover(articleTitle);
        }
      }, 200);
    });

    span.addEventListener("mouseleave", () => {
      span.style.textDecoration = "none";
    });
  }

  _addClickHandler(span, articleTitle) {
    span.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      console.log("Iframe link clicked:", articleTitle);

      if (articleTitle && articleTitle.trim() !== "") {
        this.callbacks.onLinkClick(articleTitle);
      }
    });
  }

  _disableExternalLink(link) {
    link.style.cssText = "color: #666; cursor: default;";
    link.title = "External link disabled";
    link.addEventListener("click", (e) => {
      e.preventDefault();
    });
  }
}

export default ArticleDisplay;
