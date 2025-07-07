/**
 * api-chat.js - Enhanced API integration for chat functionality
 * Handles all API calls related to bots and chat messages with history management
 */

// Chat history management
let chatHistory = {};
const CHAT_HISTORY_KEY = 'chatbot_history';

// Token handling - Made consistent with api-profile.js
function getAuthToken() {
    // Try localStorage first, then sessionStorage, then check for authToken key
    let authData = localStorage.getItem('authData') || sessionStorage.getItem('authData');

    if (authData) {
        try {
            const parsed = JSON.parse(authData);
            return parsed.accessToken;
        } catch (e) {
            console.warn('Failed to parse authData, trying direct token');
        }
    }

    // Fallback to direct token storage
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

// Helper function to safely parse JSON responses
async function safeJsonParse(response) {
    const text = await response.text();
    if (!text.trim()) {
        return null;
    }
    try {
        return JSON.parse(text);
    } catch (e) {
        console.warn('Failed to parse JSON response:', text);
        return null;
    }
}

// Display toast notifications
function showToast(message, type) {
    const bgColor = type === 'error' ? '#FF4B4B' :
        type === 'success' ? '#3B918C' :
            type === 'info' ? '#B8CC66' : '#DBE5B1';

    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        backgroundColor: bgColor,
        stopOnFocus: true
    }).showToast();
}

// Convenience functions for different toast types
function showErrorToast(message) {
    showToast(message, 'error');
}

function showSuccessToast(message) {
    showToast(message, 'success');
}

function showInfoToast(message) {
    showToast(message, 'info');
}

// Track last messages to prevent duplicates
let lastUserMessage = '';
let lastBotMessage = '';
let lastMessageTimestamp = 0;


/**
 * Load chat history from sessionStorage (for temporary session use only)
 */
function loadChatHistory() {
    try {
        const savedHistory = sessionStorage.getItem(CHAT_HISTORY_KEY);
        if (savedHistory) {
            chatHistory = JSON.parse(savedHistory);
            console.log('Chat history loaded from sessionStorage:', chatHistory);
        }
    } catch (error) {
        console.error('Error loading chat history from sessionStorage:', error);
        chatHistory = {};
    }
}

/**
 * Save chat history to sessionStorage (temporary session cache)
 */
function saveChatHistory() {
    try {
        sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
        console.log('Chat history cached to sessionStorage');
    } catch (error) {
        console.error('Error caching chat history to sessionStorage:', error);
    }
}


/**
 * Add message to session cache only (not persistent storage)
 * @param {string} botId - Bot ID
 * @param {string} sender - 'user' or 'bot'
 * @param {string} message - Message content
 * @param {string} messageId - Optional message ID from server
 * @param {number} status - Optional message status
 */
function addMessageToHistory(botId, sender, message, messageId = null, status = null) {
    if (!chatHistory[botId]) {
        chatHistory[botId] = [];
    }

    const messageData = {
        id: messageId,
        sender: sender,
        content: message,
        timestamp: new Date().toISOString(),
        status: status,
        direction: sender === 'user' // true for user, false for bot
    };

    chatHistory[botId].push(messageData);

    // Keep only last 50 messages per bot in session cache
    if (chatHistory[botId].length > 50) {
        chatHistory[botId] = chatHistory[botId].slice(-50);
    }

    saveChatHistory(); // Cache in sessionStorage temporarily
    console.log(`Message cached in session for bot ${botId}:`, messageData);
}

/**
 * Get chat history for a specific bot
 * @param {string} botId - Bot ID
 * @returns {Array} Array of messages
 */
function getChatHistoryForBot(botId) {
    return chatHistory[botId] || [];
}

/**
 * Clear chat history for a specific bot from sessionStorage
 * @param {string} botId - Bot ID
 */
function clearChatHistoryForBot(botId) {
    if (chatHistory[botId]) {
        delete chatHistory[botId];
        saveChatHistory();
        console.log(`Chat history cleared from sessionStorage for bot ${botId}`);
    }
}


/**
 * Format chat history for API request
 * @param {string} botId - Bot ID
 * @returns {Array} Formatted chat history array
 */
function formatChatHistoryForAPI(botId) {
    const history = getChatHistoryForBot(botId);
    return history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.timestamp
    }));
}

/**
 * Create and show delete confirmation modal
 * @param {string} botId - ID of the bot
 * @param {string} botName - Name of the bot
 * @param {Function} onConfirm - Callback function to execute on confirmation
 */
function showDeleteChatModal(botId, botName, onConfirm) {
    // Remove existing modal if any
    const existingModal = document.getElementById('deleteChatModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="deleteChatModal" tabindex="-1" aria-labelledby="deleteChatModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header border-0">
                        <h5 class="modal-title" id="deleteChatModalLabel">
                            <i class="bi bi-trash text-danger me-2"></i>Delete Chat History
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p class="text-center mb-3">
                            Are you sure you want to delete your chat history with <strong>${botName}</strong>?
                        </p>
                        <div class="alert alert-danger" role="alert">
                            <i class="bi bi-info-circle me-2"></i>
                            This action cannot be undone. All messages will be permanently deleted.
                        </div>
                    </div>
                    <div class="modal-footer border-0 d-flex justify-content-center">
                        <button type="button" class="custom-btn" data-bs-dismiss="modal">
                            Cancel
                        </button>
                        <button type="button" class="custom-btn btn-error" id="confirmDeleteBtn">
                            Delete Chat
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Get modal element and show it
    const modal = document.getElementById('deleteChatModal');
    const bsModal = new bootstrap.Modal(modal);

    // Add confirm button event listener
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    confirmBtn.addEventListener('click', async () => {
        // Show loading state
        confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span>Deleting...';
        confirmBtn.disabled = true;

        try {
            // Call the delete chat API directly
            await deleteBotChat(botId);
            bsModal.hide();

            // Execute additional callback if provided (without calling delete again)
            if (onConfirm) {
                await onConfirm();
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
            // Reset button state on error
            confirmBtn.innerHTML = 'Delete Chat';
            confirmBtn.disabled = false;
        }
    });

    // Clean up modal when hidden
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });

    // Show the modal
    bsModal.show();
}

/**
 * Add message to UI with new styling and duplicate prevention
 * @param {string} sender - 'user' or 'bot'
 * @param {string} message - Message content
 * @param {boolean} force - Force add message even if duplicate
 * @param {string} botId - Bot ID for history tracking
 */
function addMessageToUI(sender, message, force = false, botId = null) {
    const chatArea = document.getElementById('chatArea') || document.querySelector('.chat-area');
    if (!chatArea) return;

    // Prevent duplicate messages (unless forced)
    if (!force) {
        const currentTime = Date.now();
        const timeDiff = currentTime - lastMessageTimestamp;

        if (sender === 'user' && message === lastUserMessage && timeDiff < 1000) {
            console.log('Preventing duplicate user message:', message);
            return;
        }

        if (sender === 'bot' && message === lastBotMessage && timeDiff < 1000) {
            console.log('Preventing duplicate bot message:', message);
            return;
        }
    }

    const messageContainer = document.createElement('div');
    messageContainer.className = `message-container ${sender === 'user' ? 'user-message' : 'bot-message'}`;

    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble';
    messageBubble.textContent = message;

    // Add fade-in animation
    messageContainer.style.opacity = '0';
    messageContainer.style.transform = 'translateY(10px)';

    messageContainer.appendChild(messageBubble);
    chatArea.appendChild(messageContainer);

    // Trigger animation
    requestAnimationFrame(() => {
        messageContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        messageContainer.style.opacity = '1';
        messageContainer.style.transform = 'translateY(0)';
    });

    // Update tracking variables
    if (sender === 'user') {
        lastUserMessage = message;
    } else if (sender === 'bot') {
        lastBotMessage = message;
    }
    lastMessageTimestamp = Date.now();

    // Add to chat history if botId is provided and this isn't a forced historical message
    if (botId && !force) {
        addMessageToHistory(botId, sender, message);
    }

    // Scroll to bottom
    chatArea.scrollTop = chatArea.scrollHeight;
}

/**
 * Add system message to UI
 * @param {string} message - System message content
 */
function addSystemMessageToUI(message) {
    const chatArea = document.getElementById('chatArea') || document.querySelector('.chat-area');
    if (!chatArea) return;

    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';
    messageContainer.style.justifyContent = 'center';

    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble';
    messageBubble.style.background = '#f8f9fa';
    messageBubble.style.color = '#6c757d';
    messageBubble.style.borderRadius = 'var(--radius-large)';
    messageBubble.style.fontSize = '0.9rem';
    messageBubble.style.fontStyle = 'italic';
    messageBubble.textContent = message;

    messageContainer.appendChild(messageBubble);
    chatArea.appendChild(messageContainer);

    // Scroll to bottom
    chatArea.scrollTop = chatArea.scrollHeight;
}

/**
 * Fetch all available bots
 * GET /api/BotUsers
 */
async function fetchAllBots() {
    const token = getAuthToken();

    if (!token) {
        console.error('No auth token found');
        showErrorToast('Please log in to access bots.');
        return [];
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/BotUsers`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            console.error('Unauthorized - token may be expired');
            showErrorToast('Your session has expired. Please log in again.');
            return [];
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch bots`);
        }

        const data = await safeJsonParse(response);
        if (data && Array.isArray(data)) {
            populateBotContainer(data);
            return data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching all bots:', error);
        showErrorToast('Failed to load available bots');
        return [];
    }
}

/**
 * Fetch bots the user has interacted with - Always from API
 * GET /api/BotUsers/my-bots
 */
async function fetchMyBots() {
    const token = getAuthToken();

    if (!token) {
        console.error('No auth token found');
        showErrorToast('Please log in to access your chat history.');
        return [];
    }

    try {
        console.log('Fetching my bots from API...');
        
        const response = await fetch(`${API_BASE_URL}/api/BotUsers/my-bots`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            console.error('Unauthorized - token may be expired');
            showErrorToast('Your session has expired. Please log in again.');
            return [];
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch my bots`);
        }

        const data = await safeJsonParse(response);
        console.log('My bots data from API:', data);
        
        if (data && Array.isArray(data)) {
            populateMessagesBotContainer(data);
            return data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching my bots from API:', error);
        showErrorToast('Failed to load your chat history');
        return [];
    }
}

/**
 * Enhanced showTypingIndicator with better styling
 */
function showTypingIndicator(botName = 'Bot') {
    // Remove any existing typing indicator first
    hideTypingIndicator();

    const chatArea = document.getElementById('chatArea');
    if (!chatArea) {
        console.error('Chat area not found');
        return null;
    }

    const typingContainer = document.createElement('div');
    typingContainer.className = 'message-container bot-message';
    typingContainer.id = 'typingIndicator';

    const typingBubble = document.createElement('div');
    typingBubble.className = 'message-bubble typing-bubble';
    typingBubble.style.cssText = `
        background: #f1f1f1;
        padding: 8px 12px;
        border-radius: 18px;
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    // Create typing text and dots
    const firstName = botName.split(' ')[0];
    typingBubble.innerHTML = `
        <span class="typing-text" style="font-size: 14px; color: #666;">${firstName} is typing</span>
        <span class="typing-dots" style="display: flex; gap: 2px;">
            <span class="dot" style="width: 4px; height: 4px; background: #666; border-radius: 50%; animation: typing 1.4s infinite ease-in-out;"></span>
            <span class="dot" style="width: 4px; height: 4px; background: #666; border-radius: 50%; animation: typing 1.4s infinite ease-in-out 0.16s;"></span>
            <span class="dot" style="width: 4px; height: 4px; background: #666; border-radius: 50%; animation: typing 1.4s infinite ease-in-out 0.32s;"></span>
        </span>
    `;

    // Add CSS animation for dots if not already present
    if (!document.getElementById('typing-animation-style')) {
        const style = document.createElement('style');
        style.id = 'typing-animation-style';
        style.textContent = `
            @keyframes typing {
                0%, 60%, 100% {
                    transform: translateY(0);
                    opacity: 0.4;
                }
                30% {
                    transform: translateY(-10px);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    typingContainer.appendChild(typingBubble);
    chatArea.appendChild(typingContainer);

    // Scroll to bottom
    chatArea.scrollTop = chatArea.scrollHeight;

    console.log('Typing indicator shown for:', botName);
    return typingContainer;
}

/**
 * Enhanced hideTypingIndicator
 */
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
        console.log('Typing indicator hidden');
    }
}

/**
 * Enhanced sendMessageAndGetResponse with better error handling
 */
async function sendMessageAndGetResponse(botId, message) {
    if (!botId || !message.trim()) {
        console.error('Invalid botId or message');
        return;
    }

    try {
        console.log(`Sending message to bot ${botId}:`, message);

        // Add user message to UI immediately
        addMessageToUI('user', message, false, botId);

        // Show typing indicator
        const botName = currentBotName || 'Bot';
        const typingIndicator = showTypingIndicator(botName);

        // Get current chat history for context
        const chatHistoryArray = formatChatHistoryForAPI(botId);
        console.log('Chat history for context:', chatHistoryArray);

        // Send message to bot with history context
        const botResponse = await sendMessageToBot(botId, message, chatHistoryArray);

        console.log('Bot response received:', botResponse);

        // Extract bot message from response
        let botMessage = extractBotMessage(botResponse);

        // Calculate realistic typing delay
        const typingDelay = botMessage ? Math.min(Math.max(botMessage.length * 50, 1000), 4000) : 1500;

        // Wait for typing delay to make it feel natural
        await new Promise(resolve => setTimeout(resolve, typingDelay));

        // Hide typing indicator
        hideTypingIndicator();

        // Add bot response to UI
        if (botMessage && botMessage.trim()) {
            addMessageToUI('bot', botMessage, false, botId);
            console.log('Bot message added to UI:', botMessage);
        } else {
            console.warn('No valid bot message found in response:', botResponse);
            addSystemMessageToUI('Bot responded but no message content was found.');
        }

    } catch (error) {
        console.error('Error in chat flow:', error);
        hideTypingIndicator();

        // Show appropriate error message
        if (error.message.includes('Unauthorized')) {
            addSystemMessageToUI('Your session has expired. Please log in again.');
        } else if (error.message.includes('Failed to fetch')) {
            addSystemMessageToUI('Network error. Please check your connection.');
        } else {
            addSystemMessageToUI('Something went wrong. Please try again.');
        }
    }
}

/**
 * Extract bot message from various response formats
 */
function extractBotMessage(response) {
    if (!response) return null;

    // Handle string response
    if (typeof response === 'string') {
        return response.trim();
    }

    // Handle object response - try common properties
    const possibleKeys = ['message', 'content', 'response', 'reply', 'text', 'answer', 'output'];

    for (const key of possibleKeys) {
        if (response[key] && typeof response[key] === 'string') {
            return response[key].trim();
        }
    }

    // Try to find any string value in the response
    const values = Object.values(response);
    const firstStringValue = values.find(value =>
        typeof value === 'string' && value.trim().length > 0
    );

    return firstStringValue ? firstStringValue.trim() : null;
}

/**
 * Enhanced sendMessageToBot with better error handling and logging
 */
async function sendMessageToBot(botId, message, chatHistory = []) {
    const token = getAuthToken();

    if (!token) {
        console.error('No auth token found');
        showErrorToast('Please log in to send messages.');
        throw new Error('No auth token found');
    }

    if (!botId || !message.trim()) {
        throw new Error('Invalid botId or message');
    }

    try {
        // Prepare request body
        const requestBody = {
            content: message.trim(),
            chatHistory: chatHistory,
            timestamp: new Date().toISOString()
        };

        console.log('Sending request to bot API:', {
            botId,
            url: `${API_BASE_URL}/api/BotUsers/${botId}/send-to-bot`,
            body: requestBody
        });

        const response = await fetch(`${API_BASE_URL}/api/BotUsers/${botId}/send-to-bot`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.status === 401) {
            console.error('Unauthorized - token may be expired');
            showErrorToast('Your session has expired. Please log in again.');
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to send message'}`);
        }

        const data = await safeJsonParse(response);
        console.log('Parsed bot response:', data);

        return data;
    } catch (error) {
        console.error('Error in sendMessageToBot:', error);

        if (error.message.includes('fetch')) {
            showErrorToast('Network error. Please check your connection.');
        } else if (!error.message.includes('Unauthorized')) {
            showErrorToast('Failed to send message. Please try again.');
        }

        throw error;
    }
}


/**
 * Clear chat area and reset duplicate tracking
 */
function clearChatArea() {
    const chatArea = document.getElementById('chatArea') || document.querySelector('.chat-area');
    if (chatArea) {
        chatArea.innerHTML = '';
    }

    // Reset duplicate tracking
    lastUserMessage = '';
    lastBotMessage = '';
    lastMessageTimestamp = 0;
}

/**
 * Enhanced getBotChatHistory with better error handling
 */
async function getBotChatHistory(botId) {
    const token = getAuthToken();

    if (!token) {
        console.error('No auth token found');
        addSystemMessageToUI('Please log in to load chat history.');
        throw new Error('No auth token found');
    }

    try {
        console.log(`Loading chat history for bot: ${botId}`);

        const response = await fetch(`${API_BASE_URL}/api/BotUsers/${botId}/chat-bot`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            console.error('Unauthorized - token may be expired');
            addSystemMessageToUI('Your session has expired. Please log in again.');
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error loading chat history:', errorText);
            throw new Error(`HTTP ${response.status}: Failed to fetch chat history`);
        }

        const chatData = await safeJsonParse(response);
        console.log('Chat history data received:', chatData);

        // Handle empty or no messages
        if (!chatData || !chatData.messages || !Array.isArray(chatData.messages) || chatData.messages.length === 0) {
            console.log(`No chat history found for bot ${botId}`);

            // Show no messages container
            if (noMessagesContainer) {
                noMessagesContainer.classList.remove('d-none');
            }

            return [];
        }

        // Hide no messages container
        if (noMessagesContainer) {
            noMessagesContainer.classList.add('d-none');
        }

        // Sort messages by timestamp
        const sortedMessages = chatData.messages.sort((a, b) =>
            new Date(a.timestamp) - new Date(b.timestamp)
        );

        // Add messages to UI
        sortedMessages.forEach(msg => {
            const sender = msg.direction ? 'user' : 'bot';
            addMessageToUI(sender, msg.content, true); // Force add for history
        });

        console.log(`Loaded ${sortedMessages.length} messages for bot ${botId}`);
        return sortedMessages;

    } catch (error) {
        console.error('Error loading chat history:', error);

        // Show no messages container on error
        if (noMessagesContainer) {
            noMessagesContainer.classList.remove('d-none');
        }

        // Only show error message if not unauthorized (that's handled separately)
        if (!error.message.includes('Unauthorized')) {
            addSystemMessageToUI('Failed to load chat history');
        }

        return [];
    }
}


/**
 * Refresh current chat by reloading from API
 * @param {string} botId - Bot ID to refresh
 */
async function refreshChatFromAPI(botId) {
    try {
        console.log(`Refreshing chat history from API for bot: ${botId}`);
        await getBotChatHistory(botId);
        showInfoToast('Chat history refreshed');
    } catch (error) {
        console.error('Failed to refresh chat:', error);
        showErrorToast('Failed to refresh chat history');
    }
}

/**
 * Delete chat history with a bot - Enhanced to clear both server and local storage
 * DELETE /api/BotUsers/{botId}/delete-chat
 * @param {string} botId - ID of the bot to delete chat history for
 */
async function deleteBotChat(botId) {
    try {
        // Clear local storage first
        clearChatHistoryForBot(botId);

        // Try to delete server history
        try {
            const response = await fetch(`${API_BASE_URL}/api/BotUsers/${botId}/delete-chat`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn('Failed to delete server chat history, but local history cleared');
            }
        } catch (serverError) {
            console.warn('Could not delete server history:', serverError);
        }

        // Clear chat area and reset tracking
        clearChatArea();

        // Show empty chat message
        const noMessagesContainer = document.getElementById('noMessagesContainer') || document.querySelector('.no-messages');
        if (noMessagesContainer) {
            noMessagesContainer.classList.remove('d-none');
        }

        showSuccessToast('Chat history deleted successfully');
        return true;
    } catch (error) {
        showErrorToast('Failed to delete chat history');
        throw error;
    }
}

/**
 * Populate bot container with available bots
 * @param {Array} bots - Array of bot objects
 */
function populateBotContainer(bots) {
    const container = document.getElementById('botScrollContainer');

    if (!container || !Array.isArray(bots)) return;

    // Clear previous content
    while (container.childElementCount > 0) {
        container.removeChild(container.firstChild);
    }

    // Add bots to container
    bots.forEach(bot => {
        const botElement = document.createElement('div');
        botElement.className = 'd-flex flex-column align-items-center justify-content-center me-3';
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
 * Populate messages bot container with user's bots from API
 * @param {Array} bots - Array of bot objects from API
 */
function populateMessagesBotContainer(bots) {
    const container = document.getElementById('messagesBotContainer');

    if (!container) return;

    // Keep the header
    const header = container.querySelector('p');
    container.innerHTML = '';
    if (header) {
        container.appendChild(header);
    }

    if (!Array.isArray(bots) || bots.length === 0) {
        // No bots to display
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'text-center text-secondary my-3';
        emptyMessage.textContent = 'No chat history yet';
        container.appendChild(emptyMessage);
        return;
    }

    // Create bot display elements from API data
    bots.forEach(bot => {
        const botElement = document.createElement('div');
        botElement.className = 'bot-chat-item d-flex align-items-center p-2 mb-2 rounded';

        const botName = bot.name || `Bot ${bot.id}`;
        const botImage = bot.imageUrl || '../images/bot (1).png';
        const lastMessage = bot.lastMessage || 'Start chatting...';
        const messageCount = bot.messageCount || 0;

        botElement.innerHTML = `
            <img src="${botImage}" alt="${botName}" width="40px" class="rounded-circle me-2">
            <div class="flex-grow-1">
                <p class="mb-0 fw-bold">${botName} ${messageCount > 0 ? `<small class="text-info">(${messageCount} messages)</small>` : ''}</p>
                <p class="text-secondary small mb-0 text-truncate">${lastMessage}</p>
            </div>
            <div class="dropdown">
                <i class="bi bi-three-dots-vertical" data-bs-toggle="dropdown" aria-expanded="false"></i>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item delete-chat" href="#"><i class="bi bi-trash me-2"></i>Delete Chat</a></li>
                </ul>
            </div>
        `;

        // Add click event to open chat
        botElement.addEventListener('click', (e) => {
            if (e.target.closest('.dropdown') || e.target.closest('.delete-chat')) {
                return;
            }

            if (typeof openChat === 'function') {
                openChat(bot.id, botName, botImage);
            }
        });

        // Add delete event with modal
        const deleteButton = botElement.querySelector('.delete-chat');
        if (deleteButton) {
            deleteButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                showDeleteChatModal(bot.id, botName, () => {
                    // Refresh the bot list after deletion
                    fetchMyBots();
                });
            });
        }

        container.appendChild(botElement);
    });
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Add a delete button to chat header
    const topBar = document.querySelector('.top-bar');
    if (topBar) {
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-sm btn-outline-danger ms-auto';
        deleteButton.innerHTML = '<i class="bi bi-trash"></i> Delete Chat';
        deleteButton.addEventListener('click', () => {
            if (typeof currentBotId !== 'undefined' && currentBotId) {
                // Get bot name for the modal (try to find it or use default)
                let botName = 'this bot';
                if (typeof currentBotName !== 'undefined' && currentBotName) {
                    botName = currentBotName;
                }

                // Show delete confirmation modal
                showDeleteChatModal(currentBotId, botName, () => {
                    return deleteBotChat(currentBotId).then(() => {
                        // Refresh my bots list
                        fetchMyBots();
                    });
                });
            }
        });

        topBar.appendChild(deleteButton);
    }
});