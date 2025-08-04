export default class GameState {
    constructor() {
        this.level = 1;
        this.targetSteps = 2;
        this.startingArticle = '';
        this.gameStarted = false;
        this.gameCompleted = false;
        this.globalScore = 0;
        this.currentLevelScore = 100;
        this.backtrackPenalty = 10;
        this.currentArticle = '';
        this.navigationPath = [];
    }

    // Initialize a new game
    initializeGame() {
        this.level = 1;
        this.targetSteps = 2;
        this.gameStarted = false;
        this.gameCompleted = false;
        this.globalScore = 0;
        this.currentLevelScore = 100;
        this.currentArticle = '';
        this.navigationPath = [];
    }

    // Start the game (called after first move)
    startGame() {
        this.gameStarted = true;
    }

    // Complete the current level
    completeLevel() {
        this.gameCompleted = true;
        this.globalScore += this.currentLevelScore;
    }

    // Move to next level
    nextLevel() {
        this.level++;
        this.targetSteps = this.level * 2;
        this.gameCompleted = false;
        this.gameStarted = false;
        this.currentLevelScore = 100;
        this.currentArticle = '';
        this.navigationPath = [];
    }

    // Reset current level
    resetLevel() {
        this.gameCompleted = false;
        this.gameStarted = false;
        this.currentLevelScore = 100;
        this.currentArticle = '';
        this.navigationPath = [];
    }

    // Apply penalty for backtracking
    applyBacktrackPenalty(stepsBack) {
        const penalty = stepsBack * this.backtrackPenalty;
        this.currentLevelScore = Math.max(0, this.currentLevelScore - penalty);
        return penalty;
    }

    // Set starting article
    setStartingArticle(article) {
        this.startingArticle = article;
    }

    // Set current article
    setCurrentArticle(article) {
        this.currentArticle = article;
    }

    // Add article to navigation path
    addToNavigationPath(articleTitle) {
        // Don't add the same article consecutively
        if (this.navigationPath.length > 0 && this.navigationPath[this.navigationPath.length - 1] === articleTitle) {
            console.log('Skipping duplicate consecutive article:', articleTitle);
            return false;
        }
        
        this.navigationPath.push(articleTitle);
        
        // Mark game as started after first move
        if (this.navigationPath.length > 1) {
            this.startGame();
        }
        
        return true;
    }

    // Navigate back to a previous article (for backtracking)
    navigateBack(index) {
        if (index < this.navigationPath.length - 1) {
            const stepsBack = this.navigationPath.length - 1 - index;
            const penalty = this.applyBacktrackPenalty(stepsBack);
            
            // Trim the navigation path
            this.navigationPath = this.navigationPath.slice(0, index + 1);
            this.currentArticle = this.navigationPath[index];
            
            return { penalty, stepsBack };
        }
        return null;
    }

    // Get current step count (excluding starting article)
    getCurrentSteps() {
        return this.navigationPath.length > 0 ? this.navigationPath.length - 1 : 0;
    }
}

