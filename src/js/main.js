import GameState from './GameState.js';
import ArticleCache from './ArticleCache.js';

let gameState = new GameState();
let articleCache = new ArticleCache();

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
    document.getElementById('current-level').textContent = gameState.level;
    document.getElementById('target-steps').textContent = gameState.targetSteps;
    document.getElementById('steps-taken').textContent = gameState.getCurrentSteps();
    document.getElementById('target-article').textContent = gameState.startingArticle;
    document.getElementById('global-score').textContent = gameState.globalScore;
    document.getElementById('level-score').textContent = gameState.currentLevelScore;
    
    // Hide game result
    document.getElementById('game-result').classList.add('hidden');
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
    const modal = document.getElementById('completion-modal');
    const title = document.getElementById('completion-title');
    const message = document.getElementById('completion-message');
    const scoreDetails = document.getElementById('score-details');
    const nextLevelInfo = document.getElementById('next-level-info');
    
    title.textContent = `Level ${level} Complete!`;
    message.textContent = `Perfect! You completed the loop in exactly ${steps} steps!`;
    scoreDetails.textContent = `+${points} points earned (Total: ${gameState.globalScore})`;
    nextLevelInfo.textContent = `Loading Level ${level + 1}...`;
    
    modal.style.display = 'block';
    
    // Auto-close and proceed to next level after 3 seconds
    setTimeout(() => {
        modal.style.display = 'none';
        nextLevel();
    }, 3000);
}

// Show game result
function showGameResult(success, message) {
    const resultDiv = document.getElementById('game-result');
    resultDiv.textContent = message;
    resultDiv.classList.remove('hidden');
    if (success) {
        resultDiv.classList.remove('failure');
    } else {
        resultDiv.classList.add('failure');
    }
}

// Show temporary message (for penalties, bonuses, etc.)
function showTemporaryMessage(message, type = 'info', duration = 2000) {
    const resultDiv = document.getElementById('game-result');
    const originalContent = resultDiv.textContent;
    const wasHidden = resultDiv.classList.contains('hidden');
    
    resultDiv.textContent = message;
    resultDiv.classList.remove('hidden');
    
    if (type === 'penalty') {
        resultDiv.classList.add('failure');
    } else {
        resultDiv.classList.remove('failure');
    }
    
    setTimeout(() => {
        if (wasHidden) {
            resultDiv.classList.add('hidden');
        } else {
            resultDiv.textContent = originalContent;
        }
    }, duration);
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
document.getElementById('new-game-btn').addEventListener('click', initializeGame);
document.getElementById('reset-level-btn').addEventListener('click', resetLevel);

// Help modal functionality
const helpModal = document.getElementById('help-modal');
const helpBtn = document.getElementById('help-btn');
const closeModal = document.getElementById('close-modal');

helpBtn.addEventListener('click', () => {
    helpModal.style.display = 'block';
});

closeModal.addEventListener('click', () => {
    helpModal.style.display = 'none';
});

// Close modal when clicking outside of it
window.addEventListener('click', (event) => {
    if (event.target === helpModal) {
        helpModal.style.display = 'none';
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && helpModal.style.display === 'block') {
        helpModal.style.display = 'none';
    }
});

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
    const pathContainer = document.getElementById('navigation-path');
    pathContainer.innerHTML = '';
    
    gameState.navigationPath.forEach((article, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="step-number">${index + 1}.</span>
            ${article}
        `;
        
        // Mark current article
        if (index === gameState.navigationPath.length - 1) {
            li.classList.add('current');
        }
        
        // Add click handler to navigate back to previous articles
        li.addEventListener('click', async () => {
            // Allow clicking on any article
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
                await fetchWikipediaArticle(article, false); // false = don't add to path
            }
        });
        
        pathContainer.appendChild(li);
    });
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
        
        displayArticle(resolvedTitle, html);
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

// Display article content using iframe for complete isolation
function displayArticle(title, html) {
    const container = document.getElementById('wiki-content');
    
    // Clear previous content and remove loading class
    container.innerHTML = '';
    container.className = '';
    container.style.cssText = 'display: flex; flex-direction: column; flex: 1; overflow: hidden;';
    
    // Create title outside iframe
    const titleElement = document.createElement('h1');
    titleElement.className = 'wiki-title';
    titleElement.textContent = title;
    container.appendChild(titleElement);
    
    // Create iframe for Wikipedia content
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width: 100%; flex: 1; border: none; background: white;';
    iframe.sandbox = 'allow-same-origin allow-scripts';
    container.appendChild(iframe);
    
    // Write the Wikipedia HTML directly to the iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
    
    // Wait for iframe to load then process links and scroll
    iframe.onload = () => {
        // Scroll to top of both the main content area and the iframe content
        const mainContent = document.querySelector('.main-content');
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
                    console.log('Could not scroll iframe window:', e);
                }
            }
        }, 100);
        
        // Convert Wikipedia links to custom clickable spans within iframe
        const links = iframeDoc.querySelectorAll('a');
        
        links.forEach((link, index) => {
            const href = link.getAttribute('href');
            const rel = link.getAttribute('rel');
            const title = link.getAttribute('title');
            
            // Check if it's a Wikipedia link
            if ((rel && rel.includes('mw:WikiLink')) || 
                (href && (
                    href.startsWith('/wiki/') || 
                    href.includes('wikipedia.org/wiki/') ||
                    href.includes('en.wikipedia.org/wiki/')
                ))) {
                
                // Extract article title from different sources
                let articleTitle = '';
                
                if (href && href.startsWith('/wiki/')) {
                    articleTitle = href.replace('/wiki/', '');
                } else if (href && href.includes('/wiki/')) {
                    articleTitle = href.split('/wiki/')[1];
                } else if (title) {
                    articleTitle = title;
                } else if (rel && rel.includes('mw:WikiLink')) {
                    articleTitle = link.textContent.trim();
                }
                
                // Clean up the title
                articleTitle = decodeURIComponent(articleTitle)
                    .replace(/_/g, ' ')
                    .split('#')[0];
                
                // Create a custom clickable span
                const span = iframeDoc.createElement('span');
                span.innerHTML = link.innerHTML;
                span.className = 'wiki-link';
                span.style.cssText = 'color: #0645ad; cursor: pointer; text-decoration: none;';
                span.title = `Navigate to: ${articleTitle}`;
                span.dataset.articleTitle = articleTitle;
                
                // Add hover effect and preloading
                span.addEventListener('mouseenter', () => {
                    span.style.textDecoration = 'underline';
                    setTimeout(() => {
                        if (span.matches(':hover')) {
                            articleCache.preload(articleTitle);
                        }
                    }, 200);
                });
                span.addEventListener('mouseleave', () => {
                    span.style.textDecoration = 'none';
                });
                
                // Add click handler
                span.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log('Iframe link clicked:', articleTitle);
                    
                    if (articleTitle && articleTitle.trim() !== '') {
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
                
                // Replace the original link
                link.parentNode.replaceChild(span, link);
            } else {
                // For non-Wikipedia links, disable them
                link.style.cssText = 'color: #666; cursor: default;';
                link.title = 'External link disabled';
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                });
            }
        });
        
        // Final scroll attempt after all links are processed
        setTimeout(() => {
            const mainContent = document.querySelector('.main-content');
            mainContent.scrollTop = 0;
            if (iframeDoc.documentElement) {
                iframeDoc.documentElement.scrollTop = 0;
                iframeDoc.body.scrollTop = 0;
                try {
                    iframe.contentWindow.scrollTo(0, 0);
                } catch (e) {
                    console.log('Could not scroll iframe window:', e);
                }
            }
        }, 250);
    };
}

// Start with a new game
initializeGame();