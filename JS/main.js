/**
 * main.js - Core functions for chat application
 * Handles UI interactions, responsive design, and common utilities
 */

// DOM Elements
const chatMain = document.getElementById('chatsMain');
const noChatsContainer = document.getElementById('noChatsContainer');
const chatArea = document.getElementById('chatArea');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const botScrollContainer = document.getElementById('botScrollContainer');
const messagesBotContainer = document.getElementById('messagesBotContainer');
const noMessagesContainer = document.getElementById('noMessagesContainer');

// Global Variables
let currentBotId = null;
let currentBotName = null;
let currentBotImage = null;
let isMobileView = window.innerWidth < 768;
let messageHistory = {};

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', () => {

    
    // Check if mobile view
    checkMobileView();

    // Event listeners
    window.addEventListener('resize', checkMobileView);
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Initialize chat and bot data
    fetchAllBots();
    fetchMyBots();

    // Setup UI components
    setupPasswordToggles();
    setupFormValidations();
    setupNotificationToggle();
});

/**
 * Check if the current view is mobile and adjust UI accordingly
 */
function checkMobileView() {
    isMobileView = window.innerWidth < 768;

    // If in mobile view, adjust chat UI
    if (isMobileView) {
        // Add back button to chat header when in mobile view
        const topBar = document.querySelector('.top-bar');
        if (topBar && !document.getElementById('backButton')) {
            const backButton = document.createElement('i');
            backButton.className = 'bi bi-arrow-left fs-4 me-3';
            backButton.id = 'backButton';
            backButton.style.cursor = 'pointer';
            backButton.addEventListener('click', () => {
                // Hide chat view, show list view
                if (chatMain.classList.contains('d-flex')) {
                    chatMain.classList.remove('d-flex');
                    chatMain.classList.add('d-none');
                    document.getElementById('chatsAside').classList.remove('d-none');
                    if (noChatsContainer) {
                        noChatsContainer.classList.remove('d-none');
                    }
                }
            });
            topBar.prepend(backButton);
        }
    } else {
        // Remove back button in desktop view
        const backButton = document.getElementById('backButton');
        if (backButton) backButton.remove();

        // Make sure chat list is visible in desktop
        document.getElementById('chatsAside').classList.remove('d-none');
    }
}

/**
 * Send message to the current bot - Updated to use the new flow
 */
function sendMessage() {
    if (!messageInput.value.trim() || !currentBotId) return;

    const messageText = messageInput.value.trim();

    // Clear input first
    messageInput.value = '';

    // Use the new sendMessageAndGetResponse function instead
    sendMessageAndGetResponse(currentBotId, messageText)
        .catch(error => {
            console.error('Error in chat flow:', error);
            addSystemMessageToUI('Failed to send message. Please try again.');
        });
}
/**
 * Updated addMessageToUI function to work with the expected DOM structure
 */
function addMessageToUI(sender, text, force = false, botId = null) {
    // Hide no messages container when first message is added
    if (noMessagesContainer) {
        noMessagesContainer.classList.add('d-none');
    }

    const messageElement = document.createElement('div');
    messageElement.className = `message-container ${sender === 'user' ? 'user-message' : 'bot-message'}`;

    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble';
    messageBubble.textContent = text;

    const timeElement = document.createElement('small');
    timeElement.className = 'message-time';
    timeElement.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageElement.appendChild(messageBubble);
    messageElement.appendChild(timeElement);

    // Add fade-in animation
    messageElement.style.opacity = '0';
    messageElement.style.transform = 'translateY(10px)';

    chatArea.appendChild(messageElement);

    // Trigger animation
    requestAnimationFrame(() => {
        messageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateY(0)';
    });

    // Scroll to bottom
    chatArea.scrollTop = chatArea.scrollHeight;

    // Store in history if not a forced historical message
    if (!force && botId && messageHistory[botId]) {
        messageHistory[botId].push({
            sender,
            text,
            timestamp: new Date()
        });
    }
}

/**
 * Add a system message to the UI (for errors, notifications)
 * @param {string} text - Message content
 */
function addSystemMessageToUI(text) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message system-message';

    const textElement = document.createElement('p');
    textElement.textContent = text;

    messageElement.appendChild(textElement);
    chatArea.appendChild(messageElement);

    // Scroll to bottom
    chatArea.scrollTop = chatArea.scrollHeight;
}

/**
 * Enhanced openChat function to properly initialize chat
 */
function openChat(botId, botName, botImage) {
    currentBotId = botId;
    currentBotName = botName;
    currentBotImage = botImage;

    // Update UI
    const botNameElement = document.querySelector('.top-bar p');
    const botImageElement = document.querySelector('.top-bar img');

    if (botNameElement) botNameElement.textContent = botName;
    if (botImageElement) botImageElement.src = botImage;

    // Show chat area
    if (noChatsContainer) {
        noChatsContainer.classList.add('d-none');
    }

    chatMain.classList.remove('d-none');
    chatMain.classList.add('d-flex', 'flex-column');

    // Clear chat area
    chatArea.innerHTML = '';

    // Reset duplicate tracking variables
    if (typeof lastUserMessage !== 'undefined') {
        lastUserMessage = '';
        lastBotMessage = '';
        lastMessageTimestamp = 0;
    }

    // If in mobile view, hide the chat list
    if (isMobileView) {
        document.getElementById('chatsAside').classList.add('d-none');
    }

    // Initialize message history for this bot if it doesn't exist
    if (!messageHistory[botId]) {
        messageHistory[botId] = [];
    }

    // Load chat history from API
    getBotChatHistory(botId).then(() => {
        console.log('Chat history loaded for bot:', botId);
    }).catch(error => {
        console.error('Failed to load chat history:', error);
        // Show no messages container if history fails to load
        if (noMessagesContainer) {
            noMessagesContainer.classList.remove('d-none');
        }
    });
}


/**
 * Setup password toggle visibility for all password fields
 */
function setupPasswordToggles() {
    const togglePasswordElements = document.querySelectorAll('[id^="toggle"]');

    togglePasswordElements.forEach(element => {
        const passwordField = document.getElementById(element.id.replace('toggle', ''));

        if (passwordField) {
            element.addEventListener('click', () => {
                const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordField.setAttribute('type', type);

                // Toggle icon
                element.classList.toggle('bi-eye');
                element.classList.toggle('bi-eye-slash');
            });
        }
    });
}

/**
 * Setup form validations
 */
function setupFormValidations() {
    // Profile form validation
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Validate form
            const isValid = validateProfileForm();

            if (isValid) {
                // Submit form data
                submitProfileForm();
            }
        });
    }

    // Password form validation
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Validate form
            const isValid = validatePasswordForm();

            if (isValid) {
                // Submit form data
                changePassword();
            }
        });
    }
}

/**
 * Validate profile form
 * @returns {boolean} - Whether form is valid
 */
function validateProfileForm() {
    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    const dobDay = document.getElementById('dob-day');
    const dobMonth = document.getElementById('dob-month');
    const dobYear = document.getElementById('dob-year');
    const genderElements = document.querySelectorAll('input[name="customRadio"]');
    const country = document.getElementById('country');
    const city = document.getElementById('city');

    let isValid = true;

    // Check required fields
    if (!firstName.value.trim()) {
        firstName.classList.add('is-invalid');
        isValid = false;
    } else {
        firstName.classList.remove('is-invalid');
    }

    if (!lastName.value.trim()) {
        lastName.classList.add('is-invalid');
        isValid = false;
    } else {
        lastName.classList.remove('is-invalid');
    }

    // Check DOB
    if (!dobDay.value) {
        dobDay.classList.add('is-invalid');
        isValid = false;
    } else {
        dobDay.classList.remove('is-invalid');
    }

    if (!dobMonth.value) {
        dobMonth.classList.add('is-invalid');
        isValid = false;
    } else {
        dobMonth.classList.remove('is-invalid');
    }

    if (!dobYear.value) {
        dobYear.classList.add('is-invalid');
        isValid = false;
    } else {
        dobYear.classList.remove('is-invalid');
    }

    // Check gender
    let genderSelected = false;
    genderElements.forEach(el => {
        if (el.checked) {
            genderSelected = true;
        }
    });

    if (!genderSelected) {
        document.querySelector('.gender-feedback').style.display = 'block';
        isValid = false;
    } else {
        document.querySelector('.gender-feedback').style.display = 'none';
    }

    // Check country and city
    if (!country.value) {
        country.classList.add('is-invalid');
        isValid = false;
    } else {
        country.classList.remove('is-invalid');
    }

    if (!city.value) {
        city.classList.add('is-invalid');
        isValid = false;
    } else {
        city.classList.remove('is-invalid');
    }

    return isValid;
}

/**
 * Validate password form
 * @returns {boolean} - Whether form is valid
 */
function validatePasswordForm() {
    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    let isValid = true;

    // Check current password
    if (!currentPassword.value.trim()) {
        currentPassword.classList.add('is-invalid');
        isValid = false;
    } else {
        currentPassword.classList.remove('is-invalid');
    }

    // Check new password (min 8 characters)
    if (!newPassword.value.trim() || newPassword.value.length < 8) {
        newPassword.classList.add('is-invalid');
        isValid = false;
    } else {
        newPassword.classList.remove('is-invalid');
    }

    // Check confirm password
    if (newPassword.value !== confirmPassword.value) {
        confirmPassword.classList.add('is-invalid');
        isValid = false;
    } else {
        confirmPassword.classList.remove('is-invalid');
    }

    return isValid;
}

/**
 * Setup notification toggle
 */
function setupNotificationToggle() {
    const notificationToggle = document.getElementById('notificationToggle');

    if (notificationToggle) {
        notificationToggle.addEventListener('click', () => {
            // Toggle class
            notificationToggle.classList.toggle('bi-toggle-on');
            notificationToggle.classList.toggle('bi-toggle-off');

            // Update notification setting
            const enabled = notificationToggle.classList.contains('bi-toggle-on');
            updateNotificationSetting(enabled);
        });
    }
}

/**
 * Update notification setting
 * @param {boolean} enabled - Whether notifications are enabled
 */
function updateNotificationSetting(enabled) {
    // In a real app, this would call an API to update the setting
    console.log('Notifications ' + (enabled ? 'enabled' : 'disabled'));

    // Show feedback to user
    const toast = document.createElement('div');
    toast.className = 'toast show position-fixed bottom-0 end-0 m-3';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">Notification Setting</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            Notifications are now ${enabled ? 'enabled' : 'disabled'}.
        </div>
    `;

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/**
 * Populate day dropdown for DOB
 */
function populateDayDropdown() {
    const dobDay = document.getElementById('dob-day');

    if (dobDay) {
        // Clear current options
        dobDay.innerHTML = '<option value="">Day</option>';

        // Add days
        for (let i = 1; i <= 31; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            dobDay.appendChild(option);
        }
    }
}

/**
 * Populate year dropdown for DOB
 */
function populateYearDropdown() {
    const dobYear = document.getElementById('dob-year');

    if (dobYear) {
        // Clear current options
        dobYear.innerHTML = '<option value="">Year</option>';

        // Add years (current year - 100 to current year - 18)
        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 18; i >= currentYear - 100; i--) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            dobYear.appendChild(option);
        }
    }
}

/**
 * Show success toast notification
 * @param {string} message - Success message
 */
function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast show position-fixed bottom-0 end-0 m-3';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">Success</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/**
 * Show error toast notification
 * @param {string} message - Error message
 */
function showErrorToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast show position-fixed bottom-0 end-0 m-3 bg-danger text-white';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="toast-header bg-danger text-white">
            <strong class="me-auto">Error</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/**
 * Confirm account deletion
 */
function confirmDeletion() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'confirmDeletionModal';
    modal.tabIndex = '-1';
    modal.setAttribute('aria-labelledby', 'confirmDeletionModalLabel');
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="confirmDeletionModalLabel">Delete Account</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="custom-btn bg-transparent" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="custom-btn btn-error" id="finalDeleteBtn">Delete Account</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Show modal
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    // Add event listener to final delete button
    document.getElementById('finalDeleteBtn').addEventListener('click', () => {
        deleteAccount();
        modalInstance.hide();
    });

    // Remove modal when hidden
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });
}

/**
 * Initialize country and city selectors
 */
function initCountryAndCitySelectors() {
    const countrySelector = document.getElementById('country');
    const citySelector = document.getElementById('city');

    if (countrySelector && citySelector) {
        // Populate countries
        fetch('https://restcountries.com/v3.1/all')
            .then(response => response.json())
            .then(data => {
                const countries = data.map(country => ({
                    name: country.name.common,
                    code: country.cca2
                })).sort((a, b) => a.name.localeCompare(b.name));

                countrySelector.innerHTML = '<option value="">Country</option>';

                countries.forEach(country => {
                    const option = document.createElement('option');
                    option.value = country.code;
                    option.textContent = country.name;
                    countrySelector.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error fetching countries:', error);
            });

        // Update cities when country changes
        countrySelector.addEventListener('change', () => {
            // In a real app, you would fetch cities for the selected country
            // For now, we'll clear the city dropdown
            citySelector.innerHTML = '<option value="">City</option>';

            // Add placeholder cities
            if (countrySelector.value) {
                const cities = ['Capital City', 'Major City 1', 'Major City 2'];

                cities.forEach(city => {
                    const option = document.createElement('option');
                    option.value = city;
                    option.textContent = city;
                    citySelector.appendChild(option);
                });
            }
        });
    }
}

/**
 * Initialize form data when page loads
 */
function initFormData() {
    populateDayDropdown();
    populateYearDropdown();
    initCountryAndCitySelectors();

    // Get user profile data
    getUserProfile();
}


// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', initFormData);

// Handle logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    // In a real app, this would call an API to log out
    window.location.href = 'login.html'; // Redirect to login page
});