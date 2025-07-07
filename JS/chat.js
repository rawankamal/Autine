/**
 * api-chat.js - API integration for chat functionality
 * Handles all API calls related to bots and chat messages
 */

// API Base URL
const API_BASE_URL = 'https://autine-back.runasp.net';

// Token handling
function getAuthToken() {
    return localStorage.getItem('authToken');
}

/**
 * Fetch all available bots
 * GET /api/BotUsers
 */
async function fetchAllBots() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/BotUsers`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch bots');
        }

        const data = await response.json();
        populateBotContainer(data);
        return data;
    } catch (error) {
        console.error('Error fetching all bots:', error);
        showErrorToast('Failed to load available bots');
        return [];
    }
}

/**
 * Fetch bots the user has interacted with
 * GET /api/BotUsers/my-bots
 */
async function fetchMyBots() {
    try {
        const response = await fetch(`${API_BASE_URL}/BotUsers/my-bots`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch my bots');
        }

        const data = await response.json();
        populateMessagesBotContainer(data);
        return data;
    } catch (error) {
        console.error('Error fetching my bots:', error);
        return [];
    }
}

/**
 * Send message to a bot
 * POST /api/BotUsers/{botId}/send-to-bot
 * @param {string} botId - ID of the bot to send message to
 * @param {string} message - Message text to send
 */
async function sendMessageToBot(botId, message) {
    try {
        // Add user message to UI immediately
        addMessageToUI('user', message);

        const response = await fetch(`${API_BASE_URL}/api/BotUsers/${botId}/send-to-bot`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Log the response for debugging
        console.log('Send message response:', data);

        // Check for bot's reply in the correct property
        if (data && data.content) {
            addMessageToUI('bot', data.content);
        } else if (data && data.message) {
            addMessageToUI('bot', data.message);
        } else if (data && data.reply) {
            addMessageToUI('bot', data.reply);
        } else {
            // If no immediate response, get bot response separately
            await getBotResponse(botId);
        }

        return data;
    } catch (error) {
        console.error('Error sending message:', error);
        addSystemMessageToUI('Failed to send message. Please try again.');
        throw error;
    }
}

/**
 * Get bot response
 * GET /api/BotUsers/{botId}/chat-bot
 * @param {string} botId - ID of the bot to get response from
 */
async function getBotResponse(botId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/BotUsers/${botId}/chat-bot`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get bot response: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Add bot response to UI - check for content first
        if (data && data.content) {
            addMessageToUI('bot', data.content);
        } else if (data && data.message) {
            addMessageToUI('bot', data.message);
        } else if (data && data.reply) {
            addMessageToUI('bot', data.reply);
        } else if (data && typeof data === 'string') {
            addMessageToUI('bot', data);
        }

        return data;
    } catch (error) {
        console.error('Error getting bot response:', error);
        addSystemMessageToUI('Failed to get bot response. Please try again.');
        throw error;
    }
}

/**
 * Get bot response
 * GET /api/BotUsers/{botId}/chat-bot
 * @param {string} botId - ID of the bot to get response from
 */
async function getBotResponse(botId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/BotUsers/${botId}/chat-bot`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get bot response: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Add bot response to UI
        if (data && data.message) {
            addMessageToUI('bot', data.message);
        } else if (data && data.reply) {
            addMessageToUI('bot', data.reply);
        } else if (data && typeof data === 'string') {
            addMessageToUI('bot', data);
        }

        return data;
    } catch (error) {
        console.error('Error getting bot response:', error);
        addSystemMessageToUI('Failed to get bot response. Please try again.');
        throw error;
    }
}

/**
 * Get chat history with a bot
 * GET /api/BotUsers/{botId}/chat-history
 * @param {string} botId - ID of the bot to get chat history for
 */
async function getBotChatHistory(botId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/BotUsers/${botId}/my-bots`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get chat history: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Clear chat area
        if (typeof chatArea !== 'undefined') {
            chatArea.innerHTML = '';
        }

        // Populate chat area with history
        if (data && Array.isArray(data)) {
            // Hide empty chat message if we have history
            if (data.length > 0 && typeof noMessagesContainer !== 'undefined') {
                noMessagesContainer.classList.add('d-none');
            } else if (typeof noMessagesContainer !== 'undefined') {
                noMessagesContainer.classList.remove('d-none');
            }

            // Add messages to UI
            data.forEach(message => {
                const sender = message.isFromUser ? 'user' : 'bot';
                addMessageToUI(sender, message.content);
            });
        }

        return data;
    } catch (error) {
        console.error('Error getting chat history:', error);
        addSystemMessageToUI('Failed to load chat history');
        throw error;
    }
}

/**
 * Delete chat history with a bot
 * DELETE /api/BotUsers/{botId}/delete-chat
 * @param {string} botId - ID of the bot to delete chat history for
 */
async function deleteBotChat(botId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/BotUsers/${botId}/delete-chat`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to delete chat: ${response.status} ${response.statusText}`);
        }

        // Clear chat area
        if (typeof chatArea !== 'undefined') {
            chatArea.innerHTML = '';
        }

        // Show empty chat message
        if (typeof noMessagesContainer !== 'undefined') {
            noMessagesContainer.classList.remove('d-none');
        }

        // Update message history
        if (typeof messageHistory !== 'undefined' && messageHistory[botId]) {
            messageHistory[botId] = [];
        }

        if (typeof showSuccessToast === 'function') {
            showSuccessToast('Chat history deleted successfully');
        }

        return true;
    } catch (error) {
        console.error('Error deleting chat:', error);
        if (typeof showErrorToast === 'function') {
            showErrorToast('Failed to delete chat history');
        }
        throw error;
    }
}

/**
 * Send message and handle the complete flow
 * @param {string} botId - ID of the bot to send message to
 * @param {string} message - Message text to send
 */
async function sendMessageComplete(botId, message) {
    try {
        // Send message to bot
        const response = await sendMessageToBot(botId, message);

        // If the send-to-bot response doesn't include the bot's reply,
        // fetch it separately
        if (!response.message && !response.reply) {
            await getBotResponse(botId);
        }

        return response;
    } catch (error) {
        console.error('Error in complete message flow:', error);
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

    // Clear previous content (except placeholder/clone elements)
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

    // Update scroll buttons visibility
    if (typeof updateScrollButtons === 'function') {
        updateScrollButtons();
    }
}

/**
 * Populate messages bot container with user's bots
 * @param {Array} bots - Array of bot objects the user has chatted with
 */
function populateMessagesBotContainer(bots) {
    const container = document.getElementById('messagesBotContainer');

    if (!container || !Array.isArray(bots)) return;

    // Keep the header
    const header = container.querySelector('p');
    container.innerHTML = '';
    if (header) {
        container.appendChild(header);
    }

    if (bots.length === 0) {
        // No bots to display
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'text-center text-secondary my-3';
        emptyMessage.textContent = 'No chat history yet';
        container.appendChild(emptyMessage);
        return;
    }

    // Add bots to container
    bots.forEach(bot => {
        const botElement = document.createElement('div');
        botElement.className = 'bot-chat-item d-flex align-items-center p-2 mb-2 rounded';

        // Get last message or placeholder
        const lastMessage = bot.lastMessage || 'Start chatting...';

        botElement.innerHTML = `
            <img src="${bot.imageUrl || '../images/bot (1).png'}" alt="${bot.name}" width="40px" class="rounded-circle me-2">
            <div class="flex-grow-1">
                <p class="mb-0 fw-bold">${bot.name}</p>
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
            // Don't open chat if clicking on dropdown or delete button
            if (e.target.closest('.dropdown') || e.target.closest('.delete-chat')) {
                return;
            }

            if (typeof openChat === 'function') {
                openChat(bot.id, bot.name, bot.imageUrl || '../images/bot (1).png');
            }
        });

        // Add delete event
        const deleteButton = botElement.querySelector('.delete-chat');
        if (deleteButton) {
            deleteButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Confirm deletion
                if (confirm('Are you sure you want to delete this chat history?')) {
                    deleteBotChat(bot.id).then(() => {
                        // Refresh my bots list
                        fetchMyBots();
                    });
                }
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
            if (typeof currentBotId !== 'undefined' && currentBotId && confirm('Are you sure you want to delete this chat history?')) {
                deleteBotChat(currentBotId).then(() => {
                    // Refresh my bots list
                    fetchMyBots();
                });
            }
        });

        topBar.appendChild(deleteButton);
    }
});