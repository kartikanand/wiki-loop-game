import GameState from './GameState.js';
import ArticleCache from './ArticleCache.js';
import ArticleDisplay from './ArticleDisplay.js';
import GameUI from './GameUI.js';

let gameState = new GameState();
let articleCache = new ArticleCache();

// Initialize game UI with callbacks
let gameUI = new GameUI({
    onNewGame: initializeGame,
    onResetLevel: resetLevel,
    onNextLevel: nextLevel,
    onNavigateBack: handleNavigateBack
});

// Initialize article display with callbacks
let articleDisplay = new ArticleDisplay('wiki-content', {
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
                    alert(`You need to take exactly ${gameState.targetSteps} steps before returning to ${articleTitle}. This would be step ${nextStepCount} of ${gameState.targetSteps}.`);
                } else {
                    alert(`You've taken too many steps. This would be step ${nextStepCount} but you needed exactly ${gameState.targetSteps} steps.`);
                }
            } else {
                // Trying to visit an intermediate article already in path
                alert(`You've already visited "${articleTitle}". You can only return to the starting article to complete the loop!`);
            }
        } else {
            // Article not in path, allow navigation
            fetchWikipediaArticle(articleTitle);
        }
    }
});

// List of starting articles for the game
const startingArticles = [
    'History',
    'Science',
    'Mathematics',
    'Geography',
    'Philosophy',
    'Technology',
    'Music',
    'Art',
    'Literature',
    'Biology',
    'Physics',
    'Chemistry',
    'Astronomy',
    'Computer',
    'Language',
    'Culture',
    'Religion',
    'Economy',
    'Politics',
    'Education'
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
    if (!gameState.gameStarted || gameState.gameCompleted) return;
    
    const steps = gameState.getCurrentSteps();
    
    // Check if player returned to starting article
    if (gameState.currentArticle === gameState.startingArticle && steps > 0) {
        if (steps === gameState.targetSteps) {
            // Perfect completion!
            gameState.completeLevel();
            showCompletionModal(gameState.level, steps, gameState.currentLevelScore);
        } else if (steps > gameState.targetSteps) {
            // Completed but with extra steps
            gameState.gameCompleted = true;
            showGameResult(false, `You returned to ${gameState.startingArticle} but took ${steps} steps instead of ${gameState.targetSteps}. Try again!`);
        }
    } else if (steps >= gameState.targetSteps * 2) {
        // Too many steps without returning
        gameState.gameCompleted = true;
        showGameResult(false, `Too many steps! Try to return to ${gameState.startingArticle} in ${gameState.targetSteps} steps.`);
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
function showTemporaryMessage(message, type = 'info', duration = 2000) {
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
                showTemporaryMessage(`-${result.penalty} points for going back ${result.stepsBack} step(s)`, 'penalty');
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

// Fetch Wikipedia article content
async function fetchWikipediaArticle(title, addToPath = true) {
    try {
        console.log('Fetching article:', title);
        
        // Check cache first
        let cacheResult = articleCache.get(title);
        let html = cacheResult ? cacheResult.html : null;
        let resolvedTitle = cacheResult ? cacheResult.resolvedTitle : title;
        
        if (!html) {
            // Not in cache, fetch from API
            const response = await fetch(`https://en.wikipedia.org/w/rest.php/v1/page/${encodeURIComponent(title)}/html`);
            if (!response.ok) {
                // Show alert for missing articles instead of navigating
                if (response.status === 404) {
                    alert(`Article "${title}" not found. Try clicking on a different link.`);
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            html = await response.text();
            
            // Extract the actual resolved title from the response headers or HTML
            const finalUrl = response.url;
            if (finalUrl && finalUrl.includes('/page/')) {
                // Extract title from the final URL after redirects
                const urlParts = finalUrl.split('/page/');
                if (urlParts.length > 1) {
                    resolvedTitle = decodeURIComponent(urlParts[1].split('/')[0]).replace(/_/g, ' ');
                }
            }
            
            // Also try to extract title from HTML content
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
                const htmlTitle = titleMatch[1].replace(/ - Wikipedia$/, '').trim();
                if (htmlTitle && htmlTitle !== 'Wikipedia') {
                    resolvedTitle = htmlTitle;
                }
            }

            console.log('Article fetched from API:', title, '-> resolved to:', resolvedTitle);

            // Add to cache with resolved title
            articleCache.add(title, html, resolvedTitle);
            console.log('Article fetched from API and cached');
        } else {
            console.log('Article loaded from cache');
        }
        
        articleDisplay.displayArticle(resolvedTitle, html);
        gameState.setCurrentArticle(resolvedTitle); // Use resolved title as current article
        
        // Add to navigation path if this is a new navigation
        if (addToPath) {
            addToNavigationPath(resolvedTitle); // Use resolved title in navigation
        } else {
            // If not adding to path (navigating back), still update the display
            updateNavigationDisplay();
        }
    } catch (error) {
        console.error('Error fetching article:', error);
        // Show alert instead of replacing content with error message
        alert(`Failed to load article "${title}". Please try again or click on a different link.`);
    }
}

// Start with a new game
initializeGame();