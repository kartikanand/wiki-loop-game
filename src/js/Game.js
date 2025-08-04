import GameState from "./GameState.js";
import ArticleProvider from "./ArticleProvider.js";
import ArticleDisplay from "./ArticleDisplay.js";
import GameUI from "./GameUI.js";

// Game class to manage the game loop and logic
class Game {
  constructor() {
    this.gameState = new GameState();
    this.articleProvider = new ArticleProvider();

    // Initialize game UI with callbacks
    this.gameUI = new GameUI({
      onNewGame: () => this.initializeGame(),
      onResetLevel: () => this.resetLevel(),
      onNextLevel: () => this.nextLevel(),
      onNavigateBack: (index, article) =>
        this.handleNavigateBack(index, article),
    });

    // Initialize article display with callbacks
    this.articleDisplay = new ArticleDisplay("wiki-content", {
      onLinkHover: (articleTitle) => {
        this.articleProvider.preload(articleTitle);
      },
      onLinkClick: (articleTitle) => this.handleLinkClick(articleTitle),
    });

    // List of starting articles for the game
    this.startingArticles = [
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
  }

  // Handle link clicks with game logic
  handleLinkClick(articleTitle) {
    // Check if this article is already in the navigation path
    if (this.gameState.navigationPath.includes(articleTitle)) {
      // If it's the starting article, check if we can complete the loop
      if (articleTitle === this.gameState.startingArticle) {
        const currentSteps = this.gameState.getCurrentSteps();
        const nextStepCount = currentSteps + 1; // This would be the step count after navigation

        if (nextStepCount === this.gameState.targetSteps) {
          // Valid loop completion - taking the Nth step to return to start
          this.fetchWikipediaArticle(articleTitle);
        } else if (nextStepCount < this.gameState.targetSteps) {
          alert(
            `You need to take exactly ${this.gameState.targetSteps} steps before returning to ${articleTitle}. This would be step ${nextStepCount} of ${this.gameState.targetSteps}.`
          );
        } else {
          alert(
            `You've taken too many steps. This would be step ${nextStepCount} but you needed exactly ${this.gameState.targetSteps} steps.`
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
      this.fetchWikipediaArticle(articleTitle);
    }
  }

  // Initialize game
  initializeGame() {
    this.gameState.initializeGame();

    // Choose random starting article
    const randomIndex = Math.floor(
      Math.random() * this.startingArticles.length
    );
    this.gameState.setStartingArticle(this.startingArticles[randomIndex]);
    // this.gameState.setStartingArticle('Technology'); // For testing purposes, use a fixed article

    this.updateGameDisplay();
    this.fetchWikipediaArticle(this.gameState.startingArticle, true);
  }

  // Update game display elements
  updateGameDisplay() {
    this.gameUI.updateGameDisplay(this.gameState);
  }

  // Check if player has completed the level
  checkGameCompletion() {
    const result = this.gameState.checkCompletion();

    switch (result.status) {
      case "perfect":
        this.showCompletionModal(result.level, result.steps, result.score);
        break;
      case "imperfect":
      case "failed":
        this.showGameResult(false, result.message);
        break;
      case "ongoing":
      case "none":
      default:
        // No action needed
        break;
    }
  }

  // Show completion modal
  showCompletionModal(level, steps, points) {
    this.gameUI.showCompletionModal(
      level,
      steps,
      points,
      this.gameState.globalScore
    );
  }

  // Show game result
  showGameResult(success, message) {
    this.gameUI.showGameResult(success, message);
  }

  // Show temporary message (for penalties, bonuses, etc.)
  showTemporaryMessage(message, type = "info", duration = 2000) {
    this.gameUI.showTemporaryMessage(message, type, duration);
  }

  // Move to next level
  nextLevel() {
    this.gameState.nextLevel();

    // Choose new starting article
    const randomIndex = Math.floor(
      Math.random() * this.startingArticles.length
    );
    this.gameState.setStartingArticle(this.startingArticles[randomIndex]);

    this.updateGameDisplay();
    this.fetchWikipediaArticle(this.gameState.startingArticle, true);
  }

  // Reset current level
  resetLevel() {
    this.gameState.resetLevel();
    this.updateGameDisplay();
    this.fetchWikipediaArticle(this.gameState.startingArticle, true);
  }

  // Handle navigate back callback from GameUI
  handleNavigateBack(index, article) {
    // Allow clicking on any article except current
    if (index !== this.gameState.navigationPath.length - 1) {
      // Apply penalty for backtracking if game has started
      if (this.gameState.gameStarted && !this.gameState.gameCompleted) {
        const result = this.gameState.navigateBack(index);
        if (result) {
          this.updateGameDisplay();

          // Show penalty message briefly
          this.showTemporaryMessage(
            `-${result.penalty} points for going back ${result.stepsBack} step(s)`,
            "penalty"
          );
        }
      }

      // Navigate to the article
      this.fetchWikipediaArticle(article, false); // false = don't add to path
    }
  }

  // Add article to navigation path
  addToNavigationPath(articleTitle) {
    if (this.gameState.addToNavigationPath(articleTitle)) {
      this.updateNavigationDisplay();
      this.updateGameDisplay();

      // Check for game completion
      this.checkGameCompletion();
    }
  }

  // Update the navigation path display in sidebar
  updateNavigationDisplay() {
    this.gameUI.updateNavigationDisplay(this.gameState);
  }

  // Display article and update game state
  displayArticleAndUpdateState(resolvedTitle, html, addToPath) {
    this.articleDisplay.displayArticle(resolvedTitle, html);
    this.gameState.setCurrentArticle(resolvedTitle);

    // Add to navigation path if this is a new navigation
    if (addToPath) {
      this.addToNavigationPath(resolvedTitle);
    } else {
      // If not adding to path (navigating back), still update the display
      this.updateNavigationDisplay();
    }
  }

  // Main function to fetch and display Wikipedia article
  async fetchWikipediaArticle(title, addToPath = true) {
    try {
      const articleContent = await this.articleProvider.getArticleContent(
        title
      );
      if (!articleContent) return; // Article not found, already handled

      const { html, resolvedTitle } = articleContent;
      this.displayArticleAndUpdateState(resolvedTitle, html, addToPath);
    } catch (error) {
      console.error("Error fetching article:", error);
      alert(
        `Failed to load article "${title}". Please try again or click on a different link.`
      );
    }
  }
}

export default Game;
