class GameUI {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.initializeElements();
    this.setupEventListeners();
  }

  initializeElements() {
    // Game display elements
    this.currentLevelEl = document.getElementById("current-level");
    this.targetStepsEl = document.getElementById("target-steps");
    this.stepsTakenEl = document.getElementById("steps-taken");
    this.targetArticleEl = document.getElementById("target-article");
    this.globalScoreEl = document.getElementById("global-score");
    this.levelScoreEl = document.getElementById("level-score");
    this.gameResultEl = document.getElementById("game-result");
    this.navigationPathEl = document.getElementById("navigation-path");

    // Buttons
    this.newGameBtn = document.getElementById("new-game-btn");
    this.resetLevelBtn = document.getElementById("reset-level-btn");
    this.helpBtn = document.getElementById("help-btn");

    // Modals
    this.helpModal = document.getElementById("help-modal");
    this.closeModal = document.getElementById("close-modal");
    this.completionModal = document.getElementById("completion-modal");
    this.completionTitle = document.getElementById("completion-title");
    this.completionMessage = document.getElementById("completion-message");
    this.scoreDetails = document.getElementById("score-details");
    this.nextLevelInfo = document.getElementById("next-level-info");
  }

  setupEventListeners() {
    // Game buttons
    this.newGameBtn.addEventListener("click", () => {
      this.callbacks.onNewGame();
    });

    this.resetLevelBtn.addEventListener("click", () => {
      this.callbacks.onResetLevel();
    });

    // Help modal
    this.helpBtn.addEventListener("click", () => {
      this.showHelpModal();
    });

    this.closeModal.addEventListener("click", () => {
      this.hideHelpModal();
    });

    // Close modal when clicking outside
    window.addEventListener("click", (event) => {
      if (event.target === this.helpModal) {
        this.hideHelpModal();
      }
    });

    // Close modal with Escape key
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.helpModal.style.display === "block") {
        this.hideHelpModal();
      }
    });
  }

  updateGameDisplay(gameState) {
    this.currentLevelEl.textContent = gameState.level;
    this.targetStepsEl.textContent = gameState.targetSteps;
    this.stepsTakenEl.textContent = gameState.getCurrentSteps();
    this.targetArticleEl.textContent = gameState.startingArticle;
    this.globalScoreEl.textContent = gameState.globalScore;
    this.levelScoreEl.textContent = gameState.currentLevelScore;

    // Hide game result
    this.gameResultEl.classList.add("hidden");
  }

  updateNavigationDisplay(gameState) {
    this.navigationPathEl.innerHTML = "";

    gameState.navigationPath.forEach((article, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
                <span class="step-number">${index + 1}.</span>
                ${article}
            `;

      // Mark current article
      if (index === gameState.navigationPath.length - 1) {
        li.classList.add("current");
      }

      // Add click handler to navigate back to previous articles
      li.addEventListener("click", () => {
        this.callbacks.onNavigateBack(index, article);
      });

      this.navigationPathEl.appendChild(li);
    });
  }

  showGameResult(success, message) {
    this.gameResultEl.textContent = message;
    this.gameResultEl.classList.remove("hidden");
    if (success) {
      this.gameResultEl.classList.remove("failure");
    } else {
      this.gameResultEl.classList.add("failure");
    }
  }

  showTemporaryMessage(message, type = "info", duration = 2000) {
    const originalContent = this.gameResultEl.textContent;
    const wasHidden = this.gameResultEl.classList.contains("hidden");

    this.gameResultEl.textContent = message;
    this.gameResultEl.classList.remove("hidden");

    if (type === "penalty") {
      this.gameResultEl.classList.add("failure");
    } else {
      this.gameResultEl.classList.remove("failure");
    }

    setTimeout(() => {
      if (wasHidden) {
        this.gameResultEl.classList.add("hidden");
      } else {
        this.gameResultEl.textContent = originalContent;
      }
    }, duration);
  }

  showCompletionModal(level, steps, points, globalScore) {
    this.completionTitle.textContent = `Level ${level} Complete!`;
    this.completionMessage.textContent = `Perfect! You completed the loop in exactly ${steps} steps!`;
    this.scoreDetails.textContent = `+${points} points earned (Total: ${globalScore})`;
    this.nextLevelInfo.textContent = `Loading Level ${level + 1}...`;

    this.completionModal.style.display = "block";

    // Auto-close and proceed to next level after 3 seconds
    setTimeout(() => {
      this.completionModal.style.display = "none";
      this.callbacks.onNextLevel();
    }, 3000);
  }

  showHelpModal() {
    this.helpModal.style.display = "block";
  }

  hideHelpModal() {
    this.helpModal.style.display = "none";
  }
}

export default GameUI;
