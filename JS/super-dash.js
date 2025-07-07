// Dashboard JavaScript for Supervisor Panel
const BASE_URL_AI = 'https://grad-project-ai-api.vercel.app/';

// Global variables to manage refresh intervals
let refreshInterval = null;
let isLoading = false;
let lastRefreshTime = 0;

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    if (!checkAuth()) {
        window.location.href = '../pages/login.html';
        return;
    }

    loadDashboard();

    // Set up periodic refresh every 5 minutes (300 seconds) instead of 30 seconds
    // Clear any existing interval first
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    refreshInterval = setInterval(() => {
        // Only refresh if not currently loading and if enough time has passed
        if (!isLoading && Date.now() - lastRefreshTime > 60000) { // Minimum 1 minute between refreshes
            loadDashboard();
        }
    }, 300000); // 5 minutes
});

// Get admin email from login form or stored data
function getAdminEmail() {
    // First try to get from the login form if it exists
    const emailInput = document.getElementById('email');
    if (emailInput && emailInput.value) {
        return emailInput.value.trim();
    }

    // Try to get from stored auth data
    const authData = getAuthData();
    if (authData && authData.email) {
        return authData.email;
    }

    // Try to get from sessionStorage (stored during login)
    const storedEmail = sessionStorage.getItem('userEmail');
    if (storedEmail) {
        return storedEmail;
    }

    // Try to get from localStorage as fallback
    const localStoredEmail = localStorage.getItem('userEmail');
    if (localStoredEmail) {
        return localStoredEmail;
    }

    return null;
}

// Get authentication data
function getAuthData() {
    try {
        const authData = sessionStorage.getItem('authData') || localStorage.getItem('authData');
        return authData ? JSON.parse(authData) : null;
    } catch (error) {
        console.error('Error parsing auth data:', error);
        return null;
    }
}

// Check if user is authenticated
function checkAuth() {
    const authData = getAuthData();

    if (!authData || !authData.accessToken) {
        console.log("No access token found, redirecting to login");
        return false;
    }

    // Check if token is expired
    if (authData.expiresAt && Date.now() >= authData.expiresAt) {
        console.log("Token expired");
        if (authData.refreshToken) {
            // You can implement token refresh here if needed
            return true;
        } else {
            return false;
        }
    }

    return true;
}

// Clear authentication data
function clearAuthData() {
    // Clear refresh interval when logging out
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }

    sessionStorage.removeItem('authData');
    localStorage.removeItem('authData');
    sessionStorage.removeItem('userEmail');
    localStorage.removeItem('userEmail');
}

// Show toast notification
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

// Main function to load dashboard data
async function loadDashboard() {
    // Prevent multiple simultaneous requests
    if (isLoading) {
        console.log('Dashboard is already loading, skipping request');
        return;
    }

    // Rate limiting: don't allow requests more than once per minute
    const timeSinceLastRefresh = Date.now() - lastRefreshTime;
    if (timeSinceLastRefresh < 60000 && lastRefreshTime > 0) {
        console.log('Rate limited: waiting before next refresh');
        return;
    }

    const supervisorEmail = getAdminEmail();

    if (!supervisorEmail) {
        showToast('Supervisor email not found. Please login again.', 'error');
        setTimeout(() => {
            window.location.href = '../pages/login.html';
        }, 2000);
        return;
    }

    try {
        isLoading = true;
        showLoading(true);

        const response = await fetch(`${BASE_URL_AI}supervisor/get/dashboard?supervisor_email=${encodeURIComponent(supervisorEmail)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthData()?.accessToken || ''}`
            }
        });



        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Update dashboard with received data
        updateDashboard(data);
        lastRefreshTime = Date.now();

    } catch (error) {
        console.error('Error loading dashboard:', error);
        handleDashboardError(error);
    } finally {
        isLoading = false;
        showLoading(false);
    }
}

// Update dashboard elements with data
function updateDashboard(data) {
    try {
        // Update total patients count
        const patientNumElement = document.getElementById('patient-num');
        if (patientNumElement) {
            patientNumElement.textContent = data.count_user || 0;
        }

        // Update total bots count
        const botsNumElement = document.getElementById('bots-num');
        if (botsNumElement) {
            botsNumElement.textContent = data.count_model || 0;
        }

        // Update supervisor name if available
        updateSupervisorName();

        // Populate warning table (users with far interactions)
        populateWarningTable(data.far_user_model || []);

        // Populate activity table (users with near interactions)
        populateActivityTable(data.near_user_model || []);

        // Populate ranking table (most used models)
        populateRankingTable(data.most_model || []);

        // Only show success message for manual refreshes
        if (arguments.callee.caller === refreshDashboard) {
            showToast('Dashboard updated successfully', 'success');
        }

    } catch (error) {
        console.error('Error updating dashboard:', error);
        showToast('Error updating dashboard display', 'error');
    }
}

// Update supervisor name in the welcome message
function updateSupervisorName() {
    const supervisorNameElement = document.querySelector('.supervisor-name');
    const supervisorEmail = getAdminEmail();

    if (supervisorNameElement && supervisorEmail) {
        // Extract name from email or use email
        const name = supervisorEmail.split('@')[0];
        supervisorNameElement.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    }
}

// Populate warning table with inactive users
function populateWarningTable(farUserModel) {
    const warningTableBody = document.getElementById('warning-table-body');

    if (!warningTableBody) return;

    warningTableBody.innerHTML = '';

    if (farUserModel.length === 0) {
        warningTableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-muted">No inactive users found</td>
            </tr>
        `;
        return;
    }

    farUserModel.forEach(user => {
        const row = document.createElement('tr');
        const lastSeen = formatDateTime(user.datetime);
        const inactivity = calculateInactivity(user.datetime);

        row.innerHTML = `
            <td>${escapeHtml(user.user_name)}</td>
            <td class="middle">${lastSeen}</td>
            <td><span class="text-dark">${inactivity}</span></td>
        `;

        warningTableBody.appendChild(row);
    });
}

// Populate activity table with recent user interactions
function populateActivityTable(nearUserModel) {
    const activityTableBody = document.getElementById('activity-table-body');

    if (!activityTableBody) return;

    activityTableBody.innerHTML = '';

    if (nearUserModel.length === 0) {
        activityTableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-muted">No recent activity found</td>
            </tr>
        `;
        return;
    }

    nearUserModel.forEach(user => {
        const row = document.createElement('tr');
        // Add 3 hours to the datetime for User Activity display
        const adjustedDateTime = addHoursToDateTime(user.datetime, 3);
        const lastInteraction = formatDateTime(adjustedDateTime);

        row.innerHTML = `
            <td>${escapeHtml(user.user_name)}</td>
            <td>${escapeHtml(user.model_name)}</td>
            <td>${lastInteraction}</td>
        `;

        activityTableBody.appendChild(row);
    });
}

// Populate ranking table with most used models
function populateRankingTable(mostModel) {
    const rankingTableBody = document.getElementById('ranking-table-body');

    if (!rankingTableBody) return;

    rankingTableBody.innerHTML = '';

    if (mostModel.length === 0) {
        rankingTableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-muted">No ranking data available</td>
            </tr>
        `;
        return;
    }

    mostModel.forEach((model, index) => {
        const row = document.createElement('tr');
        const rank = index + 1;
        const rankBadge = getRankBadge(rank);

        row.innerHTML = `
            <td>${rankBadge}</td>
            <td class="middle">${escapeHtml(model.model_name)}</td>
            <td>${model.msg_count || 0}</td>
        `;

        rankingTableBody.appendChild(row);
    });
}

// Get rank badge HTML
function getRankBadge(rank) {
    const badges = {
        1: '<span class="text-dark ">🥇 1</span>',
        2: '<span class="text-dark ">🥈 2</span>',
        3: '<span class="text-dark ">🥉 3</span>'
    };

    return badges[rank] || `<span class="text-dark">${rank}</span>`;
}

// Add hours to datetime string
function addHoursToDateTime(dateTimeString, hours) {
    if (!dateTimeString) return null;

    try {
        const date = new Date(dateTimeString);
        date.setHours(date.getHours() + hours);
        return date.toISOString();
    } catch (error) {
        console.error('Error adding hours to datetime:', error);
        return dateTimeString; // Return original if error
    }
}

// Format datetime string
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'Unknown';

    try {
        const date = new Date(dateTimeString);
        
        // Format as readable date: "Dec 15, 2023"
        const options = { 
            year: 'numeric', 
            month: 'numeric', 
            day: 'numeric' 
        };
        
        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
}

// Calculate inactivity period
function calculateInactivity(dateTimeString) {
    if (!dateTimeString) return 'Unknown';

    try {
        const date = new Date(dateTimeString);
        const now = new Date();
        const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) {
            return 'Today';
        } else if (diffInDays === 1) {
            return '1 day';
        } else if (diffInDays < 7) {
            return `${diffInDays} days`;
        } else if (diffInDays < 30) {
            const weeks = Math.floor(diffInDays / 7);
            return `${weeks} week${weeks > 1 ? 's' : ''}`;
        } else {
            const months = Math.floor(diffInDays / 30);
            return `${months} month${months > 1 ? 's' : ''}`;
        }
    } catch (error) {
        console.error('Error calculating inactivity:', error);
        return 'Unknown';
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';

    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show/hide loading indicator
function showLoading(show) {
    const loadingIndicators = document.querySelectorAll('.loading-indicator');

    if (show) {
        // Create loading indicator if it doesn't exist
        if (loadingIndicators.length === 0) {
            const loading = document.createElement('div');
            loading.className = 'loading-indicator position-fixed top-50 start-50 translate-middle';
            loading.innerHTML = `
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            `;
            loading.style.zIndex = '9999';
            document.body.appendChild(loading);
        } else {
            loadingIndicators.forEach(indicator => {
                indicator.style.display = 'block';
            });
        }
    } else {
        loadingIndicators.forEach(indicator => {
            indicator.remove();
        });
    }
}

// Handle dashboard loading errors
function handleDashboardError(error) {
    console.error('Dashboard error:', error);

    if (error.message.includes('401') || error.message.includes('403')) {
        showToast('Authentication failed. Please login again.', 'error');
        setTimeout(() => {
            clearAuthData();
            window.location.href = '../pages/login.html';
        }, 2000);
    } else if (error.message.includes('400')) {
        showToast('Invalid request. Please check your supervisor email.', 'error');
    } else if (error.message.includes('404')) {
        showToast('Supervisor not found. Please contact administrator.', 'error');
    } else {
        showToast('Failed to load dashboard. Please try again.', 'error');
    }
}

// Refresh dashboard manually
function refreshDashboard() {
    showToast('Refreshing dashboard...', 'info');
    loadDashboard();
}

// Logout function
function logout() {
    clearAuthData();
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = '../pages/login.html';
    }, 1000);
}

// Add event listeners for navigation clicks
document.addEventListener('DOMContentLoaded', function () {
    // Add click handlers for card navigation
    const patientCard = document.querySelector('#patient-num').closest('.dash-card');
    if (patientCard) {
        patientCard.addEventListener('click', function () {
            document.getElementById('v-pills-patients-tab')?.click();
        });
    }

    const botsCard = document.querySelector('#bots-num').closest('.dash-card');
    if (botsCard) {
        botsCard.addEventListener('click', function () {
            document.getElementById('v-pills-bots-tab')?.click();
        });
    }

    // Add refresh button functionality if exists
    const refreshButton = document.querySelector('[data-action="refresh"]');
    if (refreshButton) {
        refreshButton.addEventListener('click', refreshDashboard);
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', function () {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});

// Export functions for global access
window.loadDashboard = loadDashboard;
window.refreshDashboard = refreshDashboard;
window.logout = logout;