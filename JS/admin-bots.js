// Complete Bots Management Module with All API Endpoints
class BotsManager {
    constructor() {
        this.bots = [];
        this.selectedPatients = new Set();
        this.editSelectedPatients = new Set();
        this.selectedBotImage = '../images/bot-default.png';
        this.currentEditingBotId = null;
        this.currentViewingBot = null;
        this.init();
    }

    // Initialize the bots manager
    init() {
        console.log('Initializing bots manager...');

        // Check authentication first
        if (!checkAuth()) {
            showToast('Authentication required. Please login.', 'error');
            return;
        }

        this.setupEventListeners();
        this.loadBots();
    }

    // Get auth token
    getAuthToken() {
        const authData = getAuthData();
        return authData ? authData.accessToken : null;
    }

    // Setup event listeners
    setupEventListeners() {
        // Add bot form submission
        const addBotForm = document.getElementById('addBotForm');
        if (addBotForm) {
            addBotForm.addEventListener('submit', (e) => this.handleAddBot(e));
        }

        // Edit bot form submission
        const editBotForm = document.getElementById('editBotForm');
        if (editBotForm) {
            editBotForm.addEventListener('submit', (e) => this.handleEditBot(e));
        }

        // Reset form when add offcanvas is hidden
        const addBotOffcanvas = document.getElementById('addBotOffcanvas');
        if (addBotOffcanvas) {
            addBotOffcanvas.addEventListener('hidden.bs.offcanvas', () => this.resetForm());
        }

        // Reset edit form when edit offcanvas is hidden
        const editBotOffcanvas = document.getElementById('editBotOffcanvas');
        if (editBotOffcanvas) {
            editBotOffcanvas.addEventListener('hidden.bs.offcanvas', () => this.resetEditForm());
        }

        // Delete confirmation
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => this.confirmDeleteBot());
        }

        // View bot delete button
        const deleteBotBtn = document.getElementById('deleteBotBtn');
        if (deleteBotBtn) {
            deleteBotBtn.addEventListener('click', () => this.deleteFromView());
        }
    }

    // Load all bots using GET /api/Bots/my-bots
    async loadBots() {
        try {
            const token = this.getAuthToken();
            if (!token) {
                console.error('No auth token available');
                showToast('Authentication required', 'error');
                return;
            }

            console.log('=== LOADING BOTS ===');
            const response = await fetch('https://autine-back.runasp.net/api/Bots/my-bots', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Enhanced error handling for auth issues
            if (response.status === 401) {
                console.error('Unauthorized access - token may be expired');
                clearAuthData();
                showToast('Session expired. Please login again.', 'error');
                return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const responseData = await response.json();
            console.log('Bots loaded:', responseData);

            this.bots = responseData || [];
            this.renderBots();
            this.updateBotCounter();

        } catch (error) {
            console.error('Error loading bots:', error);
            showToast('Failed to load bots: ' + error.message, 'error');
        }
    }

    // Get single bot by ID using GET /api/Bots/{id}
    async getBotById(botId) {
        try {
            const token = this.getAuthToken();
            if (!token) return null;

            const response = await fetch(`https://autine-back.runasp.net/api/Bots/${botId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting bot by ID:', error);
            return null;
        }
    }

    // Change bot image using PUT /api/Bots/{id}/change-bot-image
    async changeBotImage(botId, imageUrl) {
        try {
            const token = this.getAuthToken();
            if (!token) return false;

            const response = await fetch(`https://autine-back.runasp.net/api/Bots/${botId}/change-bot-image`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ imageUrl })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('Error changing bot image:', error);
            return false;
        }
    }

    // Render bots using the provided HTML structure
    renderBots() {
        const container = document.getElementById('botCardsContainer');
        const emptyContainer = document.getElementById('emptyBotContainer');

        if (!container || !emptyContainer) {
            console.error('Bot containers not found in DOM!');
            return;
        }

        if (!this.bots || this.bots.length === 0) {
            container.classList.add('d-none');
            emptyContainer.classList.remove('d-none');
            return;
        }

        container.classList.remove('d-none');
        emptyContainer.classList.add('d-none');

        // Keep the first card as template and clear the rest
        const existingCards = container.querySelectorAll('.col-xl-4');
        existingCards.forEach((card, index) => {
            if (index > 0) {
                card.remove();
            }
        });

        // Update the first card or create new ones
        if (existingCards.length > 0) {
            // Update the existing card with first bot data
            this.updateBotCard(existingCards[0], this.bots[0]);

            // Add remaining bots
            for (let i = 1; i < this.bots.length; i++) {
                const botCard = this.createBotCard(this.bots[i]);
                container.appendChild(botCard);
            }
        } else {
            // Create all cards from scratch
            container.innerHTML = '';
            this.bots.forEach(bot => {
                const botCard = this.createBotCard(bot);
                container.appendChild(botCard);
            });
        }
    }

    // Update existing bot card
    updateBotCard(cardElement, bot) {
        const botImage = bot.image || '../images/bot (1).png';

        cardElement.querySelector('.card-img-top').src = botImage;
        cardElement.querySelector('.card-img-top').alt = bot.name;
        cardElement.querySelector('.card-title').textContent = bot.name;
        cardElement.querySelector('.card-text').textContent = bot.bio || 'An AI assistant to help with your needs';

        // Update dropdown actions
        const viewBtn = cardElement.querySelector('[onclick*="viewBot"]');
        const editBtn = cardElement.querySelector('[onclick*="editBot"]');
        const deleteBtn = cardElement.querySelector('[onclick*="openDeleteModal"]');

        if (viewBtn) viewBtn.setAttribute('onclick', `viewBot('${bot.id}')`);
        if (editBtn) editBtn.setAttribute('onclick', `editBot('${bot.id}')`);
        if (deleteBtn) deleteBtn.setAttribute('onclick', `openDeleteModal('${bot.id}')`);
    }

    // Create bot card using the provided HTML structure
    createBotCard(bot) {
        const col = document.createElement('div');
        col.className = 'col-xl-4 col-lg-6 col-md-6 col-sm-12';

        const botImage = bot.image || '../images/bot (1).png';

        col.innerHTML = `
            <div class="card h-100 d-flex flex-column justify-content-center align-items-center p-3">
                <div class="d-flex justify-content-center align-items-center w-100 position-relative">
                    <img src="${botImage}" class="card-img-top" alt="${bot.name}">
                    <div class="dropdown position-absolute bot-edit-i end-0">
                        <i class="bi bi-three-dots-vertical fs-3" data-bs-toggle="dropdown" aria-expanded="false"></i>
                        <ul class="dropdown-menu">
                            <li><button class="dropdown-item custom-drop" onclick="viewBot('${bot.id}')">
                                    <i class="bi bi-eye pe-1"></i>
                                    View Details
                                </button></li>
                            <li><button class="dropdown-item custom-drop" onclick="editBot('${bot.id}')">
                                    <i class="bi bi-pencil pe-1"></i>
                                    Edit Bot</button></li>
                            <li><button class="dropdown-item custom-drop text-danger" onclick="openDeleteModal('${bot.id}')">
                                    <i class="bi bi-trash pe-1"></i>
                                    Delete Bot</button></li>
                        </ul>
                    </div>
                </div>
                <div class="card-body text-center">
                    <h5 class="card-title">${bot.name}</h5>
                    <p class="card-text">${bot.bio || 'An AI assistant to help with your needs'}</p>
                </div>
            </div>
        `;

        return col;
    }

    // Update bot counter
    updateBotCounter() {
        const counter = document.getElementById('botCounter');
        if (counter) {
            counter.textContent = this.bots.length;
        }
    }

    // Handle add bot form submission using POST /api/Bots
    async handleAddBot(event) {
        event.preventDefault();

        const formData = {
            name: document.getElementById('add-bot-name').value.trim(),
            bio: document.getElementById('add-bot-bio').value.trim(),
            context: document.getElementById('add-bot-guide').value.trim()
        };

        if (!formData.name || !formData.bio || !formData.context) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            const token = this.getAuthToken();
            if (!token) {
                showToast('Authentication required', 'error');
                return;
            }

            console.log('Creating bot with data:', formData);

            const response = await fetch('https://autine-back.runasp.net/api/Bots', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                // Handle specific 409 conflict error
                if (response.status === 409) {
                    showToast('There is already a bot with this name', 'error');
                    return;
                }

                // Try to parse error response, but handle cases where it might not be JSON
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.Errors && errorData.Errors.length > 0) {
                        errorMessage = errorData.Errors[0].description || errorMessage;
                    }
                } catch (jsonError) {
                    // If JSON parsing fails, use the status text or generic message
                    errorMessage = response.statusText || errorMessage;
                }

                throw new Error(errorMessage);
            }

            const newBot = await response.json();
            console.log('New bot created:', newBot);

            // If a custom image was selected, update it
            if (this.selectedBotImage !== '../images/bot-default.png') {
                await this.changeBotImage(newBot.id, this.selectedBotImage);
            }

            showToast('Bot created successfully!', 'success');

            // Close offcanvas
            const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('addBotOffcanvas'));
            if (offcanvas) {
                offcanvas.hide();
            }

            // Reload bots
            setTimeout(() => {
                this.loadBots();
            }, 500);

        } catch (error) {
            console.error('Error creating bot:', error);
            showToast('Failed to create bot: ' + error.message, 'error');
        }
    }

    // Handle edit bot form submission using PUT /api/Bots/{id}
    async handleEditBot(event) {
        event.preventDefault();

        if (!this.currentEditingBotId) {
            showToast('No bot selected for editing', 'error');
            return;
        }

        const formData = {
            name: document.getElementById('edit-bot-name').value.trim(),
            bio: document.getElementById('edit-bot-bio').value.trim(),
            context: document.getElementById('edit-bot-guide').value.trim()
        };

        if (!formData.name || !formData.bio || !formData.context) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            const token = this.getAuthToken();
            if (!token) {
                showToast('Authentication required', 'error');
                return;
            }

            // First, update the bot basic information
            const response = await fetch(`https://autine-back.runasp.net/api/Bots/${this.currentEditingBotId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            // If image was changed, update it separately
            const currentBot = this.bots.find(bot => bot.id === this.currentEditingBotId);
            if (currentBot && this.selectedBotImage !== currentBot.image) {
                const imageUpdated = await this.changeBotImage(this.currentEditingBotId, this.selectedBotImage);
                if (!imageUpdated) {
                    console.warn('Failed to update bot image, but bot data was saved');
                }
            }

            showToast('Bot updated successfully!', 'success');

            // Close offcanvas
            const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('editBotOffcanvas'));
            if (offcanvas) {
                offcanvas.hide();
            }

            // Reload bots
            setTimeout(() => {
                this.loadBots();
            }, 500);

        } catch (error) {
            console.error('Error updating bot:', error);
            showToast('Failed to update bot: ' + error.message, 'error');
        }
    }

    // View bot details - Updated to match HTML structure
    async viewBotDetails(botId) {
        try {
            const bot = await this.getBotById(botId);
            if (!bot) {
                showToast('Bot not found', 'error');
                return;
            }

            this.currentViewingBot = bot;

            // Populate view form fields that exist in HTML
            document.getElementById('viewBotName').textContent = bot.name;
            document.getElementById('viewBotPreviewImg').src = bot.image || '../images/bot (1).png';

            // Set the readonly input fields
            document.getElementById('view-bot-name').value = bot.name;
            document.getElementById('view-bot-bio').value = bot.bio || '';
            document.getElementById('view-bot-guide').value = bot.context || '';

            // Show offcanvas
            const offcanvas = new bootstrap.Offcanvas(document.getElementById('viewBotOffcanvas'));
            offcanvas.show();

        } catch (error) {
            console.error('Error viewing bot details:', error);
            showToast('Failed to load bot details', 'error');
        }
    }

    // Edit bot - Updated to properly set selected image
    async editBot(botId) {
        try {
            const bot = await this.getBotById(botId);
            if (!bot) {
                showToast('Bot not found', 'error');
                return;
            }

            this.currentEditingBotId = botId;
            this.selectedBotImage = bot.image || '../images/bot-default.png';

            // Populate edit form
            document.getElementById('edit-bot-name').value = bot.name;
            document.getElementById('edit-bot-bio').value = bot.bio || '';
            document.getElementById('edit-bot-guide').value = bot.context || '';
            document.getElementById('editBotPreviewImg').src = bot.image || '../images/bot-default.png';

            // Show offcanvas
            const offcanvas = new bootstrap.Offcanvas(document.getElementById('editBotOffcanvas'));
            offcanvas.show();

        } catch (error) {
            console.error('Error editing bot:', error);
            showToast('Failed to load bot for editing', 'error');
        }
    }

    // Delete bot using DELETE /api/Bots/{id}
    async deleteBot(botId) {
        this.currentEditingBotId = botId;

        // Show confirmation modal
        const modal = new bootstrap.Modal(document.getElementById('deleteBotModal'));
        modal.show();
    }

    // Confirm delete bot
    async confirmDeleteBot() {
        if (!this.currentEditingBotId) return;

        try {
            const token = this.getAuthToken();
            if (!token) {
                showToast('Authentication required', 'error');
                return;
            }

            const response = await fetch(`https://autine-back.runasp.net/api/Bots/${this.currentEditingBotId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            showToast('Bot deleted successfully!', 'success');

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteBotModal'));
            if (modal) {
                modal.hide();
            }

            // Reload bots
            setTimeout(() => {
                this.loadBots();
            }, 500);

        } catch (error) {
            console.error('Error deleting bot:', error);
            showToast('Failed to delete bot: ' + error.message, 'error');
        }
    }

    // Delete from view
    deleteFromView() {
        if (this.currentViewingBot) {
            this.deleteBot(this.currentViewingBot.id);

            // Close view offcanvas
            const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('viewBotOffcanvas'));
            if (offcanvas) {
                offcanvas.hide();
            }
        }
    }

    // Reset add form
    resetForm() {
        const form = document.getElementById('addBotForm');
        if (form) {
            form.reset();
        }

        this.selectedPatients.clear();
        this.selectedBotImage = '../images/bot-default.png';

        const previewImg = document.getElementById('addBotPreviewImg');
        if (previewImg) {
            previewImg.src = this.selectedBotImage;
        }
    }

    // Reset edit form
    resetEditForm() {
        const form = document.getElementById('editBotForm');
        if (form) {
            form.reset();
        }

        this.editSelectedPatients.clear();
        this.currentEditingBotId = null;
        this.selectedBotImage = '../images/bot-default.png';
    }

    // Method to search and filter bots
    filterBots(searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            this.renderBots();
            return;
        }

        const filteredBots = this.bots.filter(bot =>
            bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (bot.bio && bot.bio.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        this.renderFilteredBots(filteredBots);
    }

    // Method to render filtered bots
    renderFilteredBots(filteredBots) {
        const container = document.getElementById('botCardsContainer');
        const emptyContainer = document.getElementById('emptyBotContainer');

        if (!container || !emptyContainer) return;

        if (filteredBots.length === 0) {
            container.classList.add('d-none');
            emptyContainer.classList.remove('d-none');
            return;
        }

        container.classList.remove('d-none');
        emptyContainer.classList.add('d-none');
        container.innerHTML = '';

        filteredBots.forEach(bot => {
            const botCard = this.createBotCard(bot);
            container.appendChild(botCard);
        });
    }
}

// Global functions for onclick handlers
function viewBot(botId) {
    if (window.botsManager) {
        window.botsManager.viewBotDetails(botId);
    }
}

function editBot(botId) {
    if (window.botsManager) {
        window.botsManager.editBot(botId);
    }
}

function openDeleteModal(botId) {
    if (window.botsManager) {
        window.botsManager.deleteBot(botId);
    }
}

// Global function to open edit bot from view
function openEditBot() {
    if (window.botsManager && window.botsManager.currentViewingBot) {
        // Close view offcanvas first
        const viewOffcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('viewBotOffcanvas'));
        if (viewOffcanvas) {
            viewOffcanvas.hide();
        }

        // Open edit after a short delay
        setTimeout(() => {
            window.botsManager.editBot(window.botsManager.currentViewingBot.id);
        }, 300);
    }
}

// Global functions for bot picture management
function changeBotPicture(imageUrl) {
    if (window.botsManager) {
        window.botsManager.selectedBotImage = imageUrl;

        // Update preview images
        const addPreviewImg = document.getElementById('addBotPreviewImg');
        const editPreviewImg = document.getElementById('editBotPreviewImg');

        if (addPreviewImg) {
            addPreviewImg.src = imageUrl;
        }

        if (editPreviewImg) {
            editPreviewImg.src = imageUrl;
        }

        // Close the modal
        const addModal = bootstrap.Modal.getInstance(document.getElementById('choosePictureModal'));
        const editModal = bootstrap.Modal.getInstance(document.getElementById('choosePictureModalEdit'));

        if (addModal) addModal.hide();
        if (editModal) editModal.hide();
    }
}

function resetBotPicture() {
    if (window.botsManager) {
        window.botsManager.selectedBotImage = '../images/bot-default.png';

        // Update preview images
        const addPreviewImg = document.getElementById('addBotPreviewImg');
        const editPreviewImg = document.getElementById('editBotPreviewImg');

        if (addPreviewImg) {
            addPreviewImg.src = '../images/bot-default.png';
        }

        if (editPreviewImg) {
            editPreviewImg.src = '../images/bot-default.png';
        }
    }
}

// Utility function to get auth data
function getAuthData() {
    // Try to get from sessionStorage first, then localStorage
    let authData = sessionStorage.getItem('authData');
    if (!authData) {
        authData = localStorage.getItem('authData');
    }

    if (authData) {
        try {
            return JSON.parse(authData);
        } catch (error) {
            console.error('Error parsing auth data:', error);
            return null;
        }
    }
    return null;
}

function checkAuth() {
    const authData = getAuthData();

    if (!authData || !authData.accessToken) {
        console.log("No access token found, redirecting to login");
        return false;
    }

    // Check if token is expired
    if (authData.expiresAt && Date.now() >= authData.expiresAt) {
        console.log("Token expired, redirecting to login");
        clearAuthData();
        window.location.href = '../pages/login.html';
        return false;
    }

    return true;
}

// Clear authentication data
function clearAuthData() {
    sessionStorage.removeItem('authData');
    localStorage.removeItem('authData');
}

// Utility function to show toast notifications
function showToast(message, type = 'info') {
    const bgColor = type === 'error' ? '#FF4B4B' :
        type === 'success' ? '#3B918C' :
            type === 'info' ? '#B8CC66' :
                type === 'warning' ? '#FFA500' : '#DBE5B1';

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

// Initialize the bots manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing bots manager...');
    window.botsManager = new BotsManager();

    // Add search functionality if search input exists
    const searchInput = document.getElementById('botSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            window.botsManager.filterBots(e.target.value);
        });
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + N to add new bot
        if ((e.ctrlKey || e.metaKey) && e.key === 'n' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            const addBotBtn = document.querySelector('[data-bs-target="#addBotOffcanvas"]');
            if (addBotBtn) addBotBtn.click();
        }
    });
});

// Handle page unload to cleanup
window.addEventListener('beforeunload', function () {
    // Cleanup any pending requests or intervals here if needed
    console.log('Cleaning up bots manager...');
});