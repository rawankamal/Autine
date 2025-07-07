/**
 * Search functionality for bots
 */

// Global variables for search
let allBots = [];
let filteredBots = [];

/**
 * Initialize search functionality
 */
function initializeSearch() {
    const searchInput = document.querySelector('.search-bar input[type="search"]');

    if (searchInput) {
        // Add event listeners for real-time search
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keyup', handleSearch);

        // Optional: Add search on Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch(e);
            }
        });
    }
}

/**
 * Handle search input
 * @param {Event} event - Input event
 */
function handleSearch(event) {
    const searchTerm = event.target.value.trim().toLowerCase();

    if (searchTerm === '') {
        // Show all bots when search is empty
        displayBots(allBots);
        return;
    }

    // Filter bots based on search term
    filteredBots = allBots.filter(bot => {
        return bot.name.toLowerCase().includes(searchTerm) ||
            (bot.description && bot.description.toLowerCase().includes(searchTerm)) ||
            (bot.category && bot.category.toLowerCase().includes(searchTerm));
    });

    // Display filtered results
    displayBots(filteredBots);

    // Show search results count
    showSearchResultsCount(filteredBots.length, searchTerm);
}

/**
 * Display bots in the container
 * @param {Array} bots - Array of bots to display
 */
function displayBots(bots) {
    const container = document.getElementById('botScrollContainer');

    if (!container) return;

    // Clear previous content
    container.innerHTML = '';

    if (bots.length === 0) {
        // Show no results message
        const noResultsElement = document.createElement('div');
        noResultsElement.className = 'text-center text-secondary py-4';
        noResultsElement.innerHTML = `
            <i class="bi bi-search fs-1"></i>
            <p class="mt-2">No bots found</p>
            <small>Try adjusting your search terms</small>
        `;
        container.appendChild(noResultsElement);
        return;
    }

    // Add bots to container
    bots.forEach(bot => {
        const botElement = document.createElement('div');
        botElement.className = 'd-flex flex-column align-items-center justify-content-center me-3 bot-item';
        botElement.innerHTML = `
            <img src="${bot.imageUrl || '../images/bot (1).png'}" alt="${bot.name}" width="50px" class="rounded-circle">
            <p class="bot-name mt-1">${bot.name}</p>
        `;

        // Add click event to open chat
        botElement.addEventListener('click', () => {
            if (typeof openChat === 'function') {
                openChat(bot.id, bot.name, bot.imageUrl || '../images/bot (1).png');
            }
        });

        container.appendChild(botElement);
    });

    // Update scroll buttons visibility if function exists
    if (typeof updateScrollButtons === 'function') {
        updateScrollButtons();
    }
}

/**
 * Show search results count
 * @param {number} count - Number of results
 * @param {string} searchTerm - Search term used
 */
function showSearchResultsCount(count, searchTerm) {
    // Remove existing search results indicator
    const existingIndicator = document.querySelector('.search-results-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }

    // Add new search results indicator
    const container = document.getElementById('botScrollContainer');
    if (container && container.parentElement) {
        const indicator = document.createElement('div');
        indicator.className = 'search-results-indicator text-muted small mb-2';
        indicator.innerHTML = `
            <i class="bi bi-search me-1"></i>
            Found ${count} bot${count !== 1 ? 's' : ''} for "${searchTerm}"
        `;

        // Add clear search functionality
        const clearButton = indicator.querySelector('.clear-search');
        clearButton.addEventListener('click', () => {
            clearSearch();
        });

        container.parentElement.insertBefore(indicator, container);
    }
}

/**
 * Clear search and show all bots
 */
function clearSearch() {
    const searchInput = document.querySelector('.search-bar input[type="search"]');
    if (searchInput) {
        searchInput.value = '';
    }

    // Remove search results indicator
    const indicator = document.querySelector('.search-results-indicator');
    if (indicator) {
        indicator.remove();
    }

    // Show all bots
    displayBots(allBots);
}

/**
 * Enhanced populateBotContainer with search support
 * @param {Array} bots - Array of bot objects
 */
function populateBotContainer(bots) {
    // Store all bots for search functionality
    allBots = bots || [];

    // Display all bots initially
    displayBots(allBots);
}

/**
 * Search in messages/chat history
 * @param {string} searchTerm - Term to search for
 * @param {string} botId - Optional bot ID to search within specific bot
 */
function searchChatHistory(searchTerm, botId = null) {
    const results = [];

    if (botId) {
        // Search within specific bot's history
        const history = getChatHistoryForBot(botId);
        history.forEach(message => {
            if (message.content.toLowerCase().includes(searchTerm.toLowerCase())) {
                results.push({
                    botId: botId,
                    message: message,
                    snippet: getSearchSnippet(message.content, searchTerm)
                });
            }
        });
    } else {
        // Search across all chat histories
        Object.keys(chatHistory).forEach(currentBotId => {
            const history = chatHistory[currentBotId];
            history.forEach(message => {
                if (message.content.toLowerCase().includes(searchTerm.toLowerCase())) {
                    results.push({
                        botId: currentBotId,
                        message: message,
                        snippet: getSearchSnippet(message.content, searchTerm)
                    });
                }
            });
        });
    }

    return results;
}

/**
 * Get search snippet with highlighted term
 * @param {string} text - Full text
 * @param {string} searchTerm - Term to highlight
 * @returns {string} - Text snippet with highlighted term
 */
function getSearchSnippet(text, searchTerm) {
    const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index === -1) return text.substring(0, 100) + '...';

    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + searchTerm.length + 50);
    let snippet = text.substring(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    // Highlight the search term
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    snippet = snippet.replace(regex, '<mark>$1</mark>');

    return snippet;
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeSearch();

    // Override the original populateBotContainer function to support search
    if (typeof window.populateBotContainer === 'undefined') {
        window.populateBotContainer = populateBotContainer;
    }
});

// Make functions available globally
window.initializeSearch = initializeSearch;
window.handleSearch = handleSearch;
window.clearSearch = clearSearch;
window.searchChatHistory = searchChatHistory;