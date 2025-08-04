import GameState from "./GameState.js";
import ArticleCache from "./ArticleCache.js";
import ArticleDisplay from "./ArticleDisplay.js";
import GameUI from "./GameUI.js";

let gameState = new GameState();
let articleCache = new ArticleCache();

// Initialize game UI with callbacks
let gameUI = new GameUI({
  onNewGame: initializeGame,
  onResetLevel: resetLevel,
  onNextLevel: nextLevel,
  onNavigateBack: handleNavigateBack,
});

// Initialize article display with callbacks
let articleDisplay = new ArticleDisplay("wiki-content", {
  onLinkHover: (articleTitle) => {
    articleCache.preload(articleTitle);
  },
  onLinkClick: (articleTitle) => {
    // Check if this article is already in the navigation path
    if (gameState.navigationPath.includes(articleTitle)) {
      // If it's the starting article, check if we can complete the loop
      if (articleTitle === gameState.startingArticle) {
        const currentSteps = gameState.getCurrentSteps();
        const nextStepCount = currentSteps + 1; // This would be the step count after navigation

        if (nextStepCount === gameState.targetSteps) {
          // Valid loop completion - taking the Nth step to return to start
          fetchWikipediaArticle(articleTitle);
        } else if (nextStepCount < gameState.targetSteps) {
          alert(
            `You need to take exactly ${gameState.targetSteps} steps before returning to ${articleTitle}. This would be step ${nextStepCount} of ${gameState.targetSteps}.`
          );
        } else {
          alert(
            `You've taken too many steps. This would be step ${nextStepCount} but you needed exactly ${gameState.targetSteps} steps.`
          );
        }
      } else {
        // Trying to visit an intermediate article already in path
        alert(
          `You've already visited "${articleTitle}". You can only return to the starting article to complete the loop!`
        );
      }
    } else {
      // Article not in path, allow navigation
      fetchWikipediaArticle(articleTitle);
    }
  },
});

// List of starting articles for the game
const startingArticles = [
  "History",
  "Science",
  "Mathematics",
  "Geography",
  "Philosophy",
  "Technology",
  "Music",
  "Art",
  "Literature",
  "Biology",
  "Physics",
  "Chemistry",
  "Astronomy",
  "Computer",
  "Language",
  "Culture",
  "Religion",
  "Economy",
  "Politics",
  "Education",
];

// Initialize game
function initializeGame() {
  gameState.initializeGame();

  // Choose random starting article
  const randomIndex = Math.floor(Math.random() * startingArticles.length);
  gameState.setStartingArticle(startingArticles[randomIndex]);
  // gameState.setStartingArticle('Technology'); // For testing purposes, use a fixed article

  updateGameDisplay();
  fetchWikipediaArticle(gameState.startingArticle, true);
}

// Update game display elements
function updateGameDisplay() {
  gameUI.updateGameDisplay(gameState);
}

// Check if player has completed the level
function checkGameCompletion() {
  const result = gameState.checkCompletion();

  switch (result.status) {
    case "perfect":
      showCompletionModal(result.level, result.steps, result.score);
      break;
    case "imperfect":
    case "failed":
      showGameResult(false, result.message);
      break;
    case "ongoing":
    case "none":
    default:
      // No action needed
      break;
  }
}

// Show completion modal
function showCompletionModal(level, steps, points) {
  gameUI.showCompletionModal(level, steps, points, gameState.globalScore);
}

// Show game result
function showGameResult(success, message) {
  gameUI.showGameResult(success, message);
}

// Show temporary message (for penalties, bonuses, etc.)
function showTemporaryMessage(message, type = "info", duration = 2000) {
  gameUI.showTemporaryMessage(message, type, duration);
}

// Move to next level
function nextLevel() {
  gameState.nextLevel();

  // Choose new starting article
  const randomIndex = Math.floor(Math.random() * startingArticles.length);
  gameState.setStartingArticle(startingArticles[randomIndex]);

  updateGameDisplay();
  fetchWikipediaArticle(gameState.startingArticle, true);
}

// Reset current level
function resetLevel() {
  gameState.resetLevel();
  updateGameDisplay();
  fetchWikipediaArticle(gameState.startingArticle, true);
}

// Add event listeners for game buttons
// (These are now handled by GameUI class)

// Handle navigate back callback from GameUI
function handleNavigateBack(index, article) {
  // Allow clicking on any article except current
  if (index !== gameState.navigationPath.length - 1) {
    // Apply penalty for backtracking if game has started
    if (gameState.gameStarted && !gameState.gameCompleted) {
      const result = gameState.navigateBack(index);
      if (result) {
        updateGameDisplay();

        // Show penalty message briefly
        showTemporaryMessage(
          `-${result.penalty} points for going back ${result.stepsBack} step(s)`,
          "penalty"
        );
      }
    }

    // Navigate to the article
    fetchWikipediaArticle(article, false); // false = don't add to path
  }
}

// Add article to navigation path
function addToNavigationPath(articleTitle) {
  if (gameState.addToNavigationPath(articleTitle)) {
    updateNavigationDisplay();
    updateGameDisplay();

    // Check for game completion
    checkGameCompletion();
  }
}

// Update the navigation path display in sidebar
function updateNavigationDisplay() {
  gameUI.updateNavigationDisplay(gameState);
}

// Extract resolved title from Wikipedia API response
function extractResolvedTitle(response, html, originalTitle) {
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
async function fetchArticleFromAPI(title) {
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

// Get article content (from cache or API)
async function getArticleContent(title) {
  console.log("Fetching article:", title);

  // Check cache first
  const cacheResult = articleCache.get(title);
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
  articleCache.add(title, html, resolvedTitle);
  console.log("Article fetched from API and cached");

  return { html, resolvedTitle };
}

// Display article and update game state
function displayArticleAndUpdateState(resolvedTitle, html, addToPath) {
  articleDisplay.displayArticle(resolvedTitle, html);
  gameState.setCurrentArticle(resolvedTitle);

  // Add to navigation path if this is a new navigation
  if (addToPath) {
    addToNavigationPath(resolvedTitle);
  } else {
    // If not adding to path (navigating back), still update the display
    updateNavigationDisplay();
  }
}

// Main function to fetch and display Wikipedia article
async function fetchWikipediaArticle(title, addToPath = true) {
  try {
    const articleContent = await getArticleContent(title);
    if (!articleContent) return; // Article not found, already handled

    const { html, resolvedTitle } = articleContent;
    displayArticleAndUpdateState(resolvedTitle, html, addToPath);
  } catch (error) {
    console.error("Error fetching article:", error);
    alert(
      `Failed to load article "${title}". Please try again or click on a different link.`
    );
  }
}

// Start with a new game
initializeGame();
