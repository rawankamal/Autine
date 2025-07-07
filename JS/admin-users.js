// Supervisors and Patients Management JavaScript

// Global variables
// const API_BASE_URL = 'https://autine-back.runasp.net/api';
let allUsers = [];
let currentViewUser = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeUsersManagement();
});

// Initialize users management functionality
function initializeUsersManagement() {
    // Load all users when page loads
    loadAllUsers();

    // Setup tab click listeners
    const supervisorsTab = document.getElementById('v-pills-supervisors-tab');
    const patientsTab = document.getElementById('v-pills-patients-tab');

    if (supervisorsTab) {
        supervisorsTab.addEventListener('click', function () {
            displaySupervisors();
        });
    }

    if (patientsTab) {
        patientsTab.addEventListener('click', function () {
            displayPatients();
        });
    }

    // Setup delete functionality
    setupDeleteFunctionality();
}

// Load all users from API
async function loadAllUsers() {
    try {
        // Check authentication
        if (!checkAuth()) {
            return;
        }

        const token = getAuthToken();
        if (!token) {
            showToast('No authentication token found. Please login again.', 'error');
            window.location.href = '/pages/login.html';
            return;
        }

        // Make API call to get all users
        const response = await fetch(`${API_BASE_URL}/Users/all-users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            clearAuthData();
            window.location.href = '/pages/login.html';
            return;
        }

        if (!response.ok) {
            throw new Error('Failed to load users data');
        }

        const usersData = await response.json();
        console.log('All users loaded:', usersData);

        // Store users data globally
        allUsers = usersData || [];

        // Display current tab data
        const activeTab = document.querySelector('.tab-pane.active');
        if (activeTab) {
            if (activeTab.id === 'v-pills-supervisors') {
                displaySupervisors();
            } else if (activeTab.id === 'v-pills-patients') {
                displayPatients();
            }
        }

    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Failed to load users data. Please refresh the page.', 'error');
    }
}

// Filter and display supervisors (role: doctor)
function displaySupervisors() {
    const supervisors = allUsers.filter(user =>
        user.role && user.role.toLowerCase() === 'doctor'
    );

    console.log('Filtered supervisors:', supervisors);

    updateSupervisorsCounter(supervisors.length);
    renderSupervisorsCards(supervisors);
}

// Filter and display patients (role: user)
function displayPatients() {
    const patients = allUsers.filter(user =>
        user.role && user.role.toLowerCase() === 'user'
    );

    console.log('Filtered patients:', patients);

    updatePatientsCounter(patients.length);
    renderPatientsCards(patients);
}

// Update supervisors counter
function updateSupervisorsCounter(count) {
    const supervisorsTab = document.querySelector('#v-pills-supervisors');
    if (supervisorsTab) {
        const counterElement = supervisorsTab.querySelector('#botCounter');
        if (counterElement) {
            counterElement.textContent = count;
        }
    }
}

// Update patients counter
function updatePatientsCounter(count) {
    const patientsTab = document.querySelector('#v-pills-patients');
    if (patientsTab) {
        const counterElement = patientsTab.querySelector('#botCounter');
        if (counterElement) {
            counterElement.textContent = count;
        }
    }
}

// Render supervisors cards
function renderSupervisorsCards(supervisors) {
    const container = document.getElementById('supervisorsCardsContainer');
    const emptyContainer = document.getElementById('emptySupervisorContainer');

    if (!container) return;

    // Clear existing cards except the first static one (if any)
    const existingCards = container.querySelectorAll('.col-xl-4:not(:first-child)');
    existingCards.forEach(card => card.remove());

    if (supervisors.length === 0) {
        // Show empty state
        if (emptyContainer) {
            emptyContainer.classList.remove('d-none');
        }
        container.classList.add('d-none');
        return;
    }

    // Hide empty state and show container
    if (emptyContainer) {
        emptyContainer.classList.add('d-none');
    }
    container.classList.remove('d-none');

    // Render supervisor cards
    supervisors.forEach(supervisor => {
        const cardHtml = createSupervisorCard(supervisor);
        container.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// Render patients cards
function renderPatientsCards(patients) {
    const container = document.getElementById('patientsCardsContainer');
    const emptyContainer = document.getElementById('emptyPatientContainer');

    if (!container) return;

    // Clear existing cards except the first static one (if any)
    const existingCards = container.querySelectorAll('.col-xl-4:not(:first-child)');
    existingCards.forEach(card => card.remove());

    if (patients.length === 0) {
        // Show empty state
        if (emptyContainer) {
            emptyContainer.classList.remove('d-none');
        }
        container.classList.add('d-none');
        return;
    }

    // Hide empty state and show container
    if (emptyContainer) {
        emptyContainer.classList.add('d-none');
    }
    container.classList.remove('d-none');

    // Render patient cards
    patients.forEach(patient => {
        const cardHtml = createPatientCard(patient);
        container.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// Create supervisor card HTML
function createSupervisorCard(supervisor) {
    const displayName = `${supervisor.firstName || ''} ${supervisor.lastName || ''}`.trim() || 'Unknown Supervisor';
    const bio = supervisor.bio || 'Hey there! I am using Autine. I am here to help you with your mental health journey.';
    const imageUrl = supervisor.imageUrl || '../images/user.png';

    return `
        <div class="col-xl-4 col-lg-6 col-md-6 col-sm-12">
            <div class="card h-100 d-flex flex-column justify-content-center align-items-center p-3">
                <div class="d-flex justify-content-center align-items-center w-100 position-relative">
                    <img src="${imageUrl}" class="card-img-top" alt="supervisor" onerror="this.src='../images/user.png'">
                    <div class="dropdown position-absolute bot-edit-i end-0">
                        <i class="bi bi-three-dots-vertical fs-3" data-bs-toggle="dropdown" aria-expanded="false"></i>
                        <ul class="dropdown-menu">
                            <li>
                                <button class="dropdown-item custom-drop" onclick="viewUserDetails('${supervisor.id}', 'supervisor')" data-bs-toggle="offcanvas" data-bs-target="#viewOffcanvas">
                                    <i class="bi bi-eye pe-1"></i>
                                    View Details
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item custom-drop text-danger" onclick="deleteUser('${supervisor.id}', 'supervisor')">
                                    <i class="bi bi-trash pe-1"></i>
                                    Delete Supervisor
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="card-body text-center">
                    <h5 class="card-title">${displayName}</h5>
                    <p class="card-text">${bio}</p>
                </div>
            </div>
        </div>
    `;
}

// Create patient card HTML
function createPatientCard(patient) {
    const displayName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient';
    const bio = patient.bio || 'Hey there! I am using Autine.';
    const imageUrl = patient.imageUrl || '../images/user.png';
    const location = `${patient.city || ''}, ${patient.country || ''}`.replace(/^,\s*|,\s*$/g, '') || 'Location not specified';

    return `
        <div class="col-xl-4 col-lg-6 col-md-6 col-sm-12">
            <div class="card h-100 d-flex flex-column justify-content-center align-items-center p-3">
                <div class="d-flex justify-content-center align-items-center w-100 position-relative">
                    <img src="${imageUrl}" class="card-img-top" alt="patient" onerror="this.src='../images/user.png'">
                    <div class="dropdown position-absolute bot-edit-i end-0">
                        <i class="bi bi-three-dots-vertical fs-3" data-bs-toggle="dropdown" aria-expanded="false"></i>
                        <ul class="dropdown-menu">
                            <li>
                                <button class="dropdown-item custom-drop" onclick="viewUserDetails('${patient.id}', 'patient')" data-bs-toggle="offcanvas" data-bs-target="#viewOffcanvas">
                                    <i class="bi bi-eye pe-1"></i>
                                    View Details
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item custom-drop text-danger" onclick="deleteUser('${patient.id}', 'patient')">
                                    <i class="bi bi-trash pe-1"></i>
                                    Delete Patient
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="card-body text-center">
                    <h5 class="card-title">${displayName}</h5>
                    <p class="card-text">${bio}</p>
                    <small class="text-muted">${location}</small>
                </div>
            </div>
        </div>
    `;
}

// View user details
async function viewUserDetails(userId, userType) {
    try {
        // Check authentication
        if (!checkAuth()) {
            return;
        }

        const token = getAuthToken();
        if (!token) {
            showToast('No authentication token found. Please login again.', 'error');
            return;
        }

        // Make API call to get user details
        const response = await fetch(`${API_BASE_URL}/Users/${userId}/get-user-by-id`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            clearAuthData();
            window.location.href = '/pages/login.html';
            return;
        }

        if (!response.ok) {
            throw new Error('Failed to load user details');
        }

        const userData = await response.json();
        console.log('User details loaded:', userData);

        // Store current user for delete functionality
        currentViewUser = { ...userData, type: userType };

        // Populate offcanvas with user data
        populateViewOffcanvas(userData, userType);

    } catch (error) {
        console.error('Error loading user details:', error);
        showToast('Failed to load user details. Please try again.', 'error');
    }
}

// Populate view offcanvas with user data
function populateViewOffcanvas(userData, userType) {
    // Update title
    const titleElement = document.getElementById('viewName');
    if (titleElement) {
        titleElement.textContent = `${userType === 'supervisor' ? 'Supervisor' : 'Patient'} Details`;
    }

    // Update image
    const imageElement = document.getElementById('viewPreviewImg');
    if (imageElement) {
        const defaultImage = userType === 'supervisor' ? '../images/user.png' : '../images/user.png';
        imageElement.src = userData.imageUrl || defaultImage;
        imageElement.onerror = function () {
            this.src = defaultImage;
        };
    }

    // Update name in image section
    const nameElement = imageElement?.nextElementSibling;
    if (nameElement) {
        const displayName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown User';
        nameElement.textContent = displayName;
    }

    // Update form fields
    const firstNameElement = document.getElementById('view-fname');
    if (firstNameElement) {
        firstNameElement.textContent = userData.firstName || 'N/A';
    }

    const lastNameElement = document.getElementById('view-lname');
    if (lastNameElement) {
        lastNameElement.textContent = userData.lastName || 'N/A';
    }

    const emailElement = document.getElementById('view-email');
    if (emailElement) {
        emailElement.textContent = userData.email || 'N/A';
    }

    const genderElement = document.getElementById('view-gender');
    if (genderElement) {
        genderElement.textContent = userData.gender || 'N/A';
    }

    const bioElement = document.getElementById('view-bio');
    if (bioElement) {
        bioElement.textContent = userData.bio || 'No bio available';
    }

    // Update delete button text
    const deleteBtn = document.getElementById('deleteBotBtn');
    if (deleteBtn) {
        deleteBtn.textContent = `Delete ${userType === 'supervisor' ? 'Supervisor' : 'Patient'}`;
    }
}

// Setup delete functionality
function setupDeleteFunctionality() {
    const deleteBtn = document.getElementById('deleteBotBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function () {
            if (currentViewUser) {
                deleteUser(currentViewUser.id, currentViewUser.type);
            }
        });
    }
}

// Delete user
async function deleteUser(userId, userType) {
    // Show confirmation dialog
    const confirmMessage = `Are you sure you want to delete this ${userType}? This action cannot be undone.`;
    if (!confirm(confirmMessage)) {
        return;
    }

    try {
        // Check authentication
        if (!checkAuth()) {
            return;
        }

        const token = getAuthToken();
        if (!token) {
            showToast('No authentication token found. Please login again.', 'error');
            return;
        }

        // Make API call to delete user
        const response = await fetch(`${API_BASE_URL}/Users/${userId}/delete-user`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            clearAuthData();
            window.location.href = '/pages/login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`Failed to delete ${userType}`);
        }

        showToast(`${userType === 'supervisor' ? 'Supervisor' : 'Patient'} deleted successfully!`, 'success');

        // Close offcanvas if it's open
        const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('viewOffcanvas'));
        if (offcanvas) {
            offcanvas.hide();
        }

        // Reload users data
        await loadAllUsers();

    } catch (error) {
        console.error(`Error deleting ${userType}:`, error);
        showToast(`Failed to delete ${userType}. Please try again.`, 'error');
    }
}

// Authentication helper functions (reusing from profile management)
function getAuthData() {
    let authData = null;
    const sessionData = sessionStorage.getItem('authData');
    const localData = localStorage.getItem('authData');

    if (sessionData) {
        authData = JSON.parse(sessionData);
    } else if (localData) {
        authData = JSON.parse(localData);
    }

    return authData;
}

function getAuthToken() {
    const authData = getAuthData();
    return authData ? authData.accessToken : null;
}

function checkAuth() {
    const authData = getAuthData();

    if (!authData || !authData.accessToken) {
        console.log("No access token found, redirecting to login");
        return false;
    }

    if (authData.expiresAt && Date.now() >= authData.expiresAt) {
        console.log("Token expired");
        if (authData.refreshToken) {
            return true;
        } else {
            return false;
        }
    }

    return true;
}

function clearAuthData() {
    sessionStorage.removeItem('authData');
    localStorage.removeItem('authData');
}

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

// Export functions for global access
window.viewUserDetails = viewUserDetails;
window.deleteUser = deleteUser;
window.loadAllUsers = loadAllUsers;