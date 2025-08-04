// Extract resolved title from Wikipedia API response
export function extractResolvedTitle(response, html, originalTitle) {
  let resolvedTitle = originalTitle;

  // Extract title from the final URL after redirects
  const finalUrl = response.url;
  if (finalUrl && finalUrl.includes("/page/")) {
    const urlParts = finalUrl.split("/page/");
    if (urlParts.length > 1) {
      resolvedTitle = decodeURIComponent(urlParts[1].split("/")[0]).replace(
        /_/g,
        " "
      );
    }
  }

  // Also try to extract title from HTML content
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    const htmlTitle = titleMatch[1].replace(/ - Wikipedia$/, "").trim();
    if (htmlTitle && htmlTitle !== "Wikipedia") {
      resolvedTitle = htmlTitle;
    }
  }

  return resolvedTitle;
}

// Fetch article HTML from Wikipedia API
export async function fetchArticleFromAPI(title) {
  const response = await fetch(
    `https://en.wikipedia.org/w/rest.php/v1/page/${encodeURIComponent(
      title
    )}/html`
  );

  if (!response.ok) {
    if (response.status === 404) {
      alert(`Article "${title}" not found. Try clicking on a different link.`);
      return null;
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const html = await response.text();
  const resolvedTitle = extractResolvedTitle(response, html, title);

  return { html, resolvedTitle };
}
