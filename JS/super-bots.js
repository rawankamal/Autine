// Bot Management JavaScript Implementation - Enhanced with Patient Assignment

// Global variables
let bots = [];
let patients = [];
let currentEditingBotId = null;
let currentViewingBotId = null;
let botToDeleteId = null;
 

// Base URL for API calls
const BASE_URL = 'https://autine-back.runasp.net';

// Check if user is authenticated
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
        showToast('Session expired. Please login again.', 'error');
        setTimeout(() => {
            window.location.href = '../pages/login.html';
        }, 1500);
        return false;
    }

    return true;
}

// Get authentication data
function getAuthData() {
    try {
        const sessionData = sessionStorage.getItem('authData');
        const localData = localStorage.getItem('authData');

        if (sessionData) {
            return JSON.parse(sessionData);
        } else if (localData) {
            return JSON.parse(localData);
        }
    } catch (error) {
        console.error('Error parsing auth data:', error);
        clearAuthData();
    }

    return null;
}

// Clear authentication data
function clearAuthData() {
    sessionStorage.removeItem('authData');
    localStorage.removeItem('authData');
}

// Show toast notification
function showToast(message, type = 'info') {
    const bgColor = type === 'error' ? '#FF4B4B' :
        type === 'success' ? '#3B918C' :
            type === 'info' ? '#B8CC66' :
                type === 'warning' ? '#FFA500' : '#DBE5B1';

    // Check if Toastify is available
    if (typeof Toastify !== 'undefined') {
        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: bgColor,
            stopOnFocus: true
        }).showToast();
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
        alert(message);
    }
}

// API Helper function
async function apiCall(endpoint, method = 'GET', data = null, isFormData = false) {
    console.log('API Call endpoint:', endpoint);
    
    if (!checkAuth()) {
        console.error('Authentication failed');
        return null;
    }

    const authData = getAuthData();
    const headers = {
        'Authorization': `Bearer ${authData.accessToken}`
    };

    if (!isFormData && data) {
        headers['Content-Type'] = 'application/json';
    }

    const config = {
        method,
        headers,
    };

    if (data) {
        config.body = isFormData ? data : JSON.stringify(data);
    }

    try {
        console.log('Making API request toooo:', `${BASE_URL}${endpoint}`, 'with config:', config);
        const response = await fetch(`${BASE_URL}${endpoint}`, config);

        if (response.status === 401) {
            console.error('Unauthorized - clearing auth data');
            clearAuthData();
            showToast('Session expired. Please login again.', 'error');
            setTimeout(() => {
                window.location.href = '../pages/login.html';
            }, 1500);
            return null;
        }

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            return response.ok ? true : null;
        }
    } catch (error) {
        console.error('API Error:', error);

        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            showToast('Network error. Please check your connection.', 'error');
        } else {
            showToast(error.message, 'error');
        }
        return null;
    }
}

// Load all patients
// Updated loadPatients function with better debugging
async function loadPatients() {
    try {
        const response = await apiCall('/api/Patients/my-patient');
        if (response) {
            patients = Array.isArray(response) ? response : [];

            // Debug: Log the actual structure of patient objects
            console.log('Patients loaded:', patients);
            if (patients.length > 0) {
                console.log('First patient structure:', patients[0]);
                console.log('Available properties:', Object.keys(patients[0]));
            }
        } else {
            patients = [];
        }
    } catch (error) {
        console.error('Error loading patients:', error);
        patients = [];
    }
}

// Updated populatePatientDropdown function with fallback for different name properties
function populatePatientDropdown() {
    const dropdown = document.getElementById('editPatientDropdown');
    if (!dropdown) {
        console.error('Patient dropdown not found');
        return;
    }

    dropdown.innerHTML = '';

    if (patients.length === 0) {
        dropdown.innerHTML = '<li><span class="dropdown-item-text">No patients available</span></li>';
        return;
    }

    patients.forEach(patient => {
        // Debug: Log each patient object
        console.log('Processing patient:', patient);

        // Try different possible name properties
        const patientName = patient.name ||
            patient.fullName ||
            patient.firstName ||
            patient.patientName ||
            patient.userName ||
            `Patient ${patient.id}` ||
            'Unnamed Patient';

        // Try different possible image properties
        const patientImage = patient.image ||
            patient.profileImage ||
            patient.avatar ||
            patient.photo ||
            '../images/patient.png';

        console.log('Using name:', patientName, 'and image:', patientImage);

        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <button class="dropdown-item d-flex align-items-center" type="button" onclick="assignPatientToBot('${patient.id}')">
                <img src="${patientImage}" alt="${patientName}" width="30" height="30" class="rounded-circle me-2" onerror="this.src='../images/patient.png'">
                <span>${patientName}</span>
            </button>
        `;
        dropdown.appendChild(listItem);
    });
}

// Get bot's assigned patients
async function getBotAssignedPatients(botId) {
    try {
        const response = await apiCall(`/api/Bots/${botId}/bot-patients`);
        return response || [];
    } catch (error) {
        console.error('Error loading bot assigned patients:', error);
        return [];
    }
}

// Updated displayAssignedPatients function with same fix
function displayAssignedPatients(assignedPatients) {
    const container = document.getElementById('edit-assigned-patients-list');
    if (!container) {
        console.error('Assigned patients container not found');
        return;
    }

    if (!assignedPatients || assignedPatients.length === 0) {
        container.innerHTML = '<p class="text-muted">No patients assigned</p>';
        return;
    }

    container.innerHTML = assignedPatients.map(patient => {
        const patientName = patient.name ||
            patient.fullName ||
            patient.firstName ||
            patient.patientName ||
            patient.userName ||
            `Patient ${patient.id}` ||
            'Unnamed Patient';

        const patientImage = patient.image ||
            patient.profileImage ||
            patient.avatar ||
            patient.photo ||
            '../images/patient.png';

        return `
            <div class="d-flex align-items-center justify-content-between p-2 mb-2 bg-light rounded">
                <div class="d-flex align-items-center">
                    <img src="${patientImage}" alt="${patientName}" width="40" height="40" class="rounded-circle me-2" onerror="this.src='../images/patient.png'">
                    <span>${patientName}</span>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="unassignPatientFromBot('${patient.id}')">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;
    }).join('');
}

// Assign patient to bot - FIXED VERSION
async function assignPatientToBot(patientId) {
    if (!currentEditingBotId) {
        console.error('No bot ID set for patient assignment');
        showToast('Error: No bot selected', 'error');
        return;
    }

    try {
        // Fixed: Use query parameter format as specified in the API documentation
        const response = await apiCall(`/api/Bots/${currentEditingBotId}/assign-bot?patientId=${patientId}`, 'POST');
        if (response !== null) {
            showToast('Patient assigned successfully!', 'success');
            // Refresh assigned patients display
            await refreshAssignedPatients();
        }
    } catch (error) {
        console.error('Error assigning patient:', error);
        showToast('Failed to assign patient', 'error');
    }
}

// Unassign patient from bot - UPDATED VERSION
async function unassignPatientFromBot(patientId) {
    if (!currentEditingBotId) {
        console.error('No bot ID set for patient unassignment');
        showToast('Error: No bot selected', 'error');
        return;
    }

    try {
        // Updated: Use query parameter format for consistency
        const response = await apiCall(`/api/Bots/${currentEditingBotId}/remove-assign?patientId=${patientId}`, 'DELETE');
        if (response !== null) {
            showToast('Patient unassigned successfully!', 'success');
            // Refresh assigned patients display
            await refreshAssignedPatients();
        }
    } catch (error) {
        console.error('Error unassigning patient:', error);
        showToast('Failed to unassign patient', 'error');
    }
}

// Refresh assigned patients display
async function refreshAssignedPatients() {
    if (currentEditingBotId) {
        const assignedPatients = await getBotAssignedPatients(currentEditingBotId);
        displayAssignedPatients(assignedPatients);
    }
}

// Initialize bots page
async function initializeBotsPage() {
    if (!checkAuth()) {
        return;
    }

    try {
        await Promise.all([
            loadBots(),
            loadPatients()
        ]);
        setupEventListeners();
    } catch (error) {
        console.error('Failed to initialize bots page:', error);
        showToast('Failed to load page data', 'error');
    }
}

// Load all bots
async function loadBots() {
    try {
        const response = await apiCall('/api/Bots/my-bots');
        if (response) {
            bots = Array.isArray(response) ? response : [];
            renderBots();
            updateBotCounter();
        } else {
            bots = [];
            renderBots();
            updateBotCounter();
        }
    } catch (error) {
        console.error('Error loading bots:', error);
        bots = [];
        renderBots();
        updateBotCounter();
    }
}

// Render bots in the UI
function renderBots() {
    const botCardsContainer = document.getElementById('botCardsContainer');
    const emptyBotContainer = document.getElementById('emptyBotContainer');

    if (!botCardsContainer) {
        console.error('Bot cards container not found');
        return;
    }

    if (bots.length === 0) {
        botCardsContainer.innerHTML = '';
        if (emptyBotContainer) {
            emptyBotContainer.classList.remove('d-none');
        }
    } else {
        if (emptyBotContainer) {
            emptyBotContainer.classList.add('d-none');
        }
        botCardsContainer.innerHTML = bots.map(bot => createBotCard(bot)).join('');
    }
}

// Create bot card HTML
function createBotCard(bot) {
    const botImage = bot.image && !bot.image.includes('401') ? bot.image : '../images/bot (1).png';

    return `
        <div class="col-xl-4 col-lg-6 col-md-6 col-sm-12">
            <div class="card h-100 d-flex flex-column justify-content-center align-items-center p-3">
                <div class="d-flex justify-content-center align-items-center w-100 position-relative">
                    <img src="${botImage}" class="card-img-top" alt="bot" onerror="this.src='../images/bot-default.png'">
                    <div class="dropdown position-absolute bot-edit-i end-0">
                        <i class="bi bi-three-dots-vertical fs-3" data-bs-toggle="dropdown" aria-expanded="false" style="cursor: pointer;"></i>
                        <ul class="dropdown-menu">
                            <li>
                                <button class="dropdown-item custom-drop" onclick="viewBot('${bot.id}')" type="button">
                                    <i class="bi bi-eye pe-1"></i>
                                    View Details
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item custom-drop" onclick="editBot('${bot.id}')" type="button">
                                    <i class="bi bi-pencil pe-1"></i>
                                    Edit Bot
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item custom-drop text-danger" onclick="deleteBot('${bot.id}')" type="button">
                                    <i class="bi bi-trash pe-1"></i>
                                    Delete Bot
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="card-body text-center">
                    <h5 class="card-title">${bot.name || 'Unnamed Bot'}</h5>
                    <p class="card-text">${bot.bio || 'No description available'}</p>
                </div>
            </div>
        </div>
    `;
}

// Update bot counter
function updateBotCounter() {
    const botCounter = document.getElementById('botCounter');
    if (botCounter) {
        botCounter.textContent = bots.length;
    }
}

// FIXED: Enhanced setupEventListeners function
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Add bot form event listener
    const addBotForm = document.getElementById('addBotForm');
    if (addBotForm) {
        console.log('Found addBotForm, adding event listener');
        
        // Remove any existing event listeners to prevent duplicates
        addBotForm.removeEventListener('submit', handleAddBot);
        addBotForm.addEventListener('submit', handleAddBot);
        
        // Also add click event to submit button as fallback
        const addBotSubmitBtn = addBotForm.querySelector('button[type="submit"]');
        if (addBotSubmitBtn) {
            console.log('Found submit button, adding click listener');
            addBotSubmitBtn.removeEventListener('click', handleAddBotClick);
            addBotSubmitBtn.addEventListener('click', handleAddBotClick);
        }
    } else {
        console.error('addBotForm not found!');
    }

    // Edit bot form event listener
    const editBotForm = document.getElementById('editBotForm');
    if (editBotForm) {
        console.log('Found editBotForm, adding event listener');
        editBotForm.removeEventListener('submit', handleEditBot);
        editBotForm.addEventListener('submit', handleEditBot);
    } else {
        console.log('editBotForm not found (this is normal if not on edit page)');
    }

    // Delete confirmation button
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        console.log('Found confirmDeleteBtn, adding event listener');
        confirmDeleteBtn.removeEventListener('click', confirmDeleteBot);
        confirmDeleteBtn.addEventListener('click', confirmDeleteBot);
    } else {
        console.log('confirmDeleteBtn not found (this is normal if not on page with delete modal)');
    }
}

// FIXED: Enhanced handleAddBot function with better error handling and debugging
async function handleAddBot(event) {
    console.log('handleAddBot called with event:', event);
    
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    console.log('Form submission prevented, processing data...');

    // Get form elements with better error checking
    const nameInput = document.getElementById('add-bot-name');
    const bioInput = document.getElementById('add-bot-bio');
    const contextInput = document.getElementById('add-bot-guide');

    if (!nameInput || !bioInput || !contextInput) {
        console.error('Form inputs not found:', {
            nameInput: !!nameInput,
            bioInput: !!bioInput,
            contextInput: !!contextInput
        });
        showToast('Error: Form inputs not found', 'error');
        return;
    }

    const name = nameInput.value?.trim();
    const bio = bioInput.value?.trim();
    const context = contextInput.value?.trim();

    console.log('Form data:', { name, bio, context });

    // Validation
    if (!name) {
        showToast('Bot name is required', 'error');
        nameInput.focus();
        return;
    }
    if (!bio) {
        showToast('Bot bio is required', 'error');
        bioInput.focus();
        return;
    }
    if (!context) {
        showToast('Bot guidelines are required', 'error');
        contextInput.focus();
        return;
    }

    // Get image
    const previewImg = document.getElementById('addBotPreviewImg');
    const imageSrc = previewImg ? previewImg.src : '../images/bot-default.png';

    const formData = {
        name: name,
        bio: bio,
        context: context,
        image: imageSrc,
    };

    console.log('Sending bot data:', formData);

    // Disable submit button to prevent double submission
    const submitBtn = document.querySelector('#addBotForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';
    }

    try {
        const response = await apiCall('/api/Bots', 'POST', formData);
        if (response) {
            showToast('Bot created successfully!', 'success');
            await loadBots();
            closeOffcanvas('addBotOffcanvas');
            resetAddBotForm();
        } else {
            showToast('Failed to create bot', 'error');
        }
    } catch (error) {
        console.error('Error in handleAddBot:', error);
        showToast('Failed to create bot: ' + error.message, 'error');
    } finally {
        // Re-enable submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Bot';
        }
    }
}

// NEW: Alternative click handler for submit button
function handleAddBotClick(event) {
    console.log('handleAddBotClick called');
    
    // Find the form and trigger submit
    const form = document.getElementById('addBotForm');
    if (form) {
        // Prevent default button behavior
        event.preventDefault();
        
        // Create a submit event and dispatch it
        const submitEvent = new Event('submit', {
            bubbles: true,
            cancelable: true
        });
        
        form.dispatchEvent(submitEvent);
    } else {
        console.error('Form not found for click handler');
    }
}

// Handle edit bot form submission
async function handleEditBot(event) {
    event.preventDefault();

    if (!currentEditingBotId) {
        console.error('No bot ID set for editing');
        showToast('Error: No bot selected for editing', 'error');
        return;
    }

    const name = document.getElementById('edit-bot-name')?.value?.trim();
    const bio = document.getElementById('edit-bot-bio')?.value?.trim();
    const context = document.getElementById('edit-bot-guide')?.value?.trim();

    if (!name) {
        showToast('Bot name is required', 'error');
        return;
    }
    if (!bio) {
        showToast('Bot bio is required', 'error');
        return;
    }
    if (!context) {
        showToast('Bot guidelines are required', 'error');
        return;
    }

    const previewImg = document.getElementById('editBotPreviewImg');
    const formData = {
        id: currentEditingBotId,
        name: name,
        bio: bio,
        context: context,
        image: previewImg ? previewImg.src : '../images/bot-default.png',
    };

    console.log('Editing bot with data:', formData);

    const response = await apiCall(`/api/Bots/${currentEditingBotId}`, 'PUT', formData);
    if (response !== null) {
        showToast('Bot updated successfully!', 'success');
        await loadBots();
        closeOffcanvas('editBotOffcanvas');
        currentEditingBotId = null;
    }
}

// View bot function
async function viewBot(botId) {
    console.log('Viewing bot with ID:', botId);

    if (!botId) {
        console.error('No bot ID provided');
        showToast('Error: No bot ID provided', 'error');
        return;
    }

    // Check if Bootstrap is loaded
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap JavaScript not loaded!');
        showToast('Error: Bootstrap not loaded', 'error');
        return;
    }

    // Find the offcanvas element
    const viewBotOffcanvas = document.getElementById('botsViewBotOffcanvas');
    if (!viewBotOffcanvas) {
        console.error('View bot offcanvas not found! Looking for ID: botsViewBotOffcanvas');
        showToast('Error: View bot interface not found', 'error');
        return;
    }

    currentViewingBotId = botId;

    // Find the bot data
    let bot = bots.find(b => b.id === botId);
    if (!bot) {
        console.log('Bot not found locally, fetching from API...');
        const response = await apiCall(`/api/Bots/${botId}`);
        if (!response) {
            console.error('Failed to fetch bot from API');
            showToast('Failed to load bot details', 'error');
            return;
        }
        bot = response;
    }

    // Populate the form elements
    const elements = {
        viewBotName: document.getElementById('viewBotName'),
        viewBotNameInput: document.getElementById('view-bot-name'),
        viewBotBio: document.getElementById('view-bot-bio'),
        viewBotGuide: document.getElementById('view-bot-guide'),
        viewBotPreviewImg: document.getElementById('viewBotPreviewImg')
    };

    try {
        if (elements.viewBotName) elements.viewBotName.textContent = bot.name || 'Unnamed Bot';
        if (elements.viewBotNameInput) elements.viewBotNameInput.value = bot.name || '';
        if (elements.viewBotBio) elements.viewBotBio.value = bot.bio || '';
        if (elements.viewBotGuide) elements.viewBotGuide.value = bot.context || '';
        if (elements.viewBotPreviewImg) {
            elements.viewBotPreviewImg.src = bot.image || '../images/bot-default.png';
        }
    } catch (error) {
        console.error('Error populating form:', error);
    }

    // Show the offcanvas
    try {
        let offcanvasInstance = bootstrap.Offcanvas.getInstance(viewBotOffcanvas);
        if (!offcanvasInstance) {
            offcanvasInstance = new bootstrap.Offcanvas(viewBotOffcanvas);
        }
        offcanvasInstance.show();
    } catch (error) {
        console.error('Error showing offcanvas:', error);
        showToast('Error opening bot details: ' + error.message, 'error');
    }
}

// Edit bot function
async function editBot(botId) {
    console.log('Editing bot with ID:', botId);

    if (!botId) {
        console.error('No bot ID provided');
        showToast('Error: No bot ID provided', 'error');
        return;
    }

    currentEditingBotId = botId;
    let bot = bots.find(b => b.id === botId);

    if (!bot) {
        console.log('Bot not found in local array, fetching from API');
        const response = await apiCall(`/api/Bots/${botId}`);
        if (!response) {
            showToast('Failed to load bot details', 'error');
            return;
        }
        bot = response;
    }

    const editBotName = document.getElementById('edit-bot-name');
    const editBotBio = document.getElementById('edit-bot-bio');
    const editBotGuide = document.getElementById('edit-bot-guide');
    const editBotPreviewImg = document.getElementById('editBotPreviewImg');
    const editBotOffcanvas = document.getElementById('editBotOffcanvas');

    if (!editBotOffcanvas) {
        console.error('Edit bot offcanvas not found');
        showToast('Error: Edit bot interface not found', 'error');
        return;
    }

    // Populate edit bot offcanvas
    if (editBotName) editBotName.value = bot.name || '';
    if (editBotBio) editBotBio.value = bot.bio || '';
    if (editBotGuide) editBotGuide.value = bot.context || '';
    if (editBotPreviewImg) {
        editBotPreviewImg.src = bot.image || '../images/bot-default.png';
    }

    // Load and populate patient dropdown
    populatePatientDropdown();

    // Load and display assigned patients
    const assignedPatients = await getBotAssignedPatients(botId);
    displayAssignedPatients(assignedPatients);

    // Show offcanvas
    try {
        const offcanvas = new bootstrap.Offcanvas(editBotOffcanvas);
        offcanvas.show();
    } catch (error) {
        console.error('Error showing offcanvas:', error);
        showToast('Error opening bot editor', 'error');
    }
}

// Delete bot function - shows confirmation modal
function deleteBot(botId) {
    console.log('Preparing to delete bot with ID:', botId);

    if (!botId) {
        console.error('No bot ID provided');
        showToast('Error: No bot ID provided', 'error');
        return;
    }

    // IMPORTANT: Store the bot ID for deletion
    botToDeleteId = botId;
    console.log('Set botToDeleteId to:', botToDeleteId);

    // Find the bot to show its name in the modal
    const bot = bots.find(b => b.id === botId);
    const botName = bot ? bot.name : 'this bot';

    // Update modal text to include bot name
    const modalTitle = document.querySelector('#deleteBotModal .modal-title');
    const modalText = document.querySelector('#deleteBotModal p:first-of-type');

    if (modalTitle) {
        modalTitle.textContent = `Delete ${botName}?`;
    }
    if (modalText) {
        modalText.textContent = `Are you sure you want to delete "${botName}"?`;
    }

    // Show the delete confirmation modal
    const deleteBotModal = document.getElementById('deleteBotModal');
    if (!deleteBotModal) {
        console.error('Delete bot modal not found');
        showToast('Error: Delete confirmation dialog not found', 'error');
        return;
    }

    try {
        const modal = new bootstrap.Modal(deleteBotModal);
        modal.show();
        console.log('Modal shown, botToDeleteId is:', botToDeleteId);
    } catch (error) {
        console.error('Error showing delete modal:', error);
        showToast('Error opening delete confirmation', 'error');
    }
}



// Confirm delete bot - handles the actual deletion
async function confirmDeleteBot() {
    console.log('confirmDeleteBot called, botToDeleteId is:', botToDeleteId);

    if (!botToDeleteId) {
        console.error('No bot ID set for deletion');
        showToast('Error: No bot selected for deletion', 'error');
        return;
    }

    console.log('Confirming deletion of bot with ID:', botToDeleteId);

    try {
        // Show loading state
        const deleteBtn = document.getElementById('confirmDeleteBtn');
        if (deleteBtn) {
            deleteBtn.disabled = true;
            deleteBtn.textContent = 'Deleting...';
        }

        const response = await apiCall(`/api/Bots/${botToDeleteId}`, 'DELETE');

        if (response !== null) {
            showToast('Bot deleted successfully!', 'success');

            // Remove bot from local array
            bots = bots.filter(bot => bot.id !== botToDeleteId);

            // Re-render the bots list
            renderBots();
            updateBotCounter();

            // Hide the modal
            const deleteBotModal = document.getElementById('deleteBotModal');
            if (deleteBotModal) {
                const modal = bootstrap.Modal.getInstance(deleteBotModal);
                if (modal) {
                    modal.hide();
                }
            }
        } else {
            showToast('Failed to delete bot', 'error');
        }
    } catch (error) {
        console.error('Error deleting bot:', error);
        showToast('Failed to delete bot', 'error');
    } finally {
        // Reset button state
        const deleteBtn = document.getElementById('confirmDeleteBtn');
        if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.textContent = 'Delete';
        }

        // Clear the stored bot ID
        botToDeleteId = null;
        console.log('Cleared botToDeleteId');
    }
}

// Alternative function name for HTML onclick compatibility
function handleDeleteBot() {
    confirmDeleteBot();
}

// Change bot picture
function changeBotPicture(imageSrc) {
    const addBotPreview = document.getElementById('addBotPreviewImg');
    const editBotPreview = document.getElementById('editBotPreviewImg');

    const choosePictureModal = document.getElementById('choosePictureModal');
    const choosePictureModalEdit = document.getElementById('choosePictureModalEdit');

    if (choosePictureModal && choosePictureModal.classList.contains('show')) {
        if (addBotPreview) addBotPreview.src = imageSrc;
    } else if (choosePictureModalEdit && choosePictureModalEdit.classList.contains('show')) {
        if (editBotPreview) editBotPreview.src = imageSrc;
    }

    const activeModal = document.querySelector('.modal.show');
    if (activeModal) {
        const modal = bootstrap.Modal.getInstance(activeModal);
        if (modal) {
            modal.hide();
        }
    }
}

// Reset bot picture to default
function resetBotPicture() {
    const editBotPreview = document.getElementById('editBotPreviewImg');
    if (editBotPreview) {
        editBotPreview.src = '../images/bot-default.png';
    }
}

// Open edit bot from view bot
function openEditBot() {
    if (currentViewingBotId) {
        const viewOffcanvas = document.getElementById('botsViewBotOffcanvas');
        if (viewOffcanvas) {
            const offcanvasInstance = bootstrap.Offcanvas.getInstance(viewOffcanvas);
            if (offcanvasInstance) {
                offcanvasInstance.hide();
            }
        }

        setTimeout(() => {
            editBot(currentViewingBotId);
        }, 300);
    }
}

// Close offcanvas
function closeOffcanvas(offcanvasId) {
    const offcanvas = document.getElementById(offcanvasId);
    if (offcanvas) {
        const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvas);
        if (offcanvasInstance) {
            offcanvasInstance.hide();
        }
    }
}

// Reset add bot form
function resetAddBotForm() {
    const addBotForm = document.getElementById('addBotForm');
    const addBotPreviewImg = document.getElementById('addBotPreviewImg');
    if (addBotForm) addBotForm.reset();
    if (addBotPreviewImg) addBotPreviewImg.src = '../images/bot-default.png';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {

    document.getElementById('addBotForm')?.addEventListener('submit', handleAddBot);

    document.getElementById('submitBotBtn')?.addEventListener('click', handleAddBotClick);

    if (document.getElementById('botCardsContainer')) {
        console.log('Initializing bots page...');
        initializeBotsPage();
    }
});

console.log('Bot management script loaded');

// Export functions for global access
window.viewBot = viewBot;
window.editBot = editBot;
window.changeBotPicture = changeBotPicture;
window.resetBotPicture = resetBotPicture;
window.openEditBot = openEditBot;
window.assignPatientToBot = assignPatientToBot;
window.unassignPatientFromBot = unassignPatientFromBot;
window.deleteBot = deleteBot;
window.confirmDeleteBot = confirmDeleteBot;
window.handleDeleteBot = handleDeleteBot;
