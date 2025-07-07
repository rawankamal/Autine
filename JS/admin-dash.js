// Dashboard JavaScript
const BASE_URL = 'https://grad-project-ai-api.vercel.app';

// Get auth token
function getAuthToken() {
    const authData = getAuthData();
    return authData ? authData.accessToken : null;
}

// Get auth data from storage
function getAuthData() {
    const sessionData = sessionStorage.getItem('authData');
    const localData = localStorage.getItem('authData');

    if (sessionData) {
        return JSON.parse(sessionData);
    } else if (localData) {
        return JSON.parse(localData);
    }

    return null;
}

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
    sessionStorage.removeItem('authData');
    localStorage.removeItem('authData');
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

// Fetch dashboard data from API
async function fetchDashboardData() {
    try {
        const adminEmail = getAdminEmail();

        if (!adminEmail) {
            showToast('Admin email not found. Please log in again.', 'error');
            // Redirect to login if no email found
            setTimeout(() => {
                window.location.href = '/pages/login.html';
            }, 2000);
            return null;
        }

        const token = getAuthToken();
        if (!token) {
            showToast('Authentication token not found', 'error');
            // Redirect to login if no token found
            setTimeout(() => {
                window.location.href = '/pages/login.html';
            }, 2000);
            return null;
        }

        console.log('Fetching dashboard data for admin:', adminEmail);

        const response = await fetch(`${BASE_URL}/admin/get/dashboard?admin_email=${encodeURIComponent(adminEmail)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // Handle specific API error messages
            if (response.status === 400) {
                if (errorData.msg === "Admin email missed") {
                    throw new Error('Admin email is required');
                } else if (errorData.msg === "Admin Not exist") {
                    throw new Error('Admin account not found. Please check your credentials.');
                } else {
                    throw new Error(errorData.msg || 'Bad request');
                }
            } else if (response.status === 401) {
                throw new Error('Authentication failed. Please log in again.');
            } else if (response.status === 403) {
                throw new Error('Access denied. Admin privileges required.');
            } else {
                throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
            }
        }

        const data = await response.json();
        console.log('Dashboard data received:', data);
        return data;

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showToast(error.message || 'Failed to fetch dashboard data', 'error');

        // If authentication error, redirect to login
        if (error.message.includes('Authentication') || error.message.includes('log in')) {
            setTimeout(() => {
                window.location.href = '/pages/login.html';
            }, 2000);
        }

        return null;
    }
}

// Update dashboard cards with fetched data
function updateDashboardCards(data) {
    // Update patients count
    const patientsElement = document.getElementById('patient-num');
    if (patientsElement && data.count_user !== undefined) {
        patientsElement.textContent = data.count_user;
    }

    // Update bots count
    const botsElement = document.getElementById('bots-num');
    if (botsElement && data.count_model !== undefined) {
        botsElement.textContent = data.count_model;
    }

    // Update supervisors count
    const supervisorsElement = document.getElementById('supervisors-num');
    if (supervisorsElement && data.count_supervisor !== undefined) {
        supervisorsElement.textContent = data.count_supervisor;
    }
}

// Populate bot ranking table
function populateRankingTable(mostModels) {
    const tableBody = document.getElementById('ranking-table-body');

    if (!tableBody) {
        console.error('Ranking table body not found');
        return;
    }

    // Clear existing content
    tableBody.innerHTML = '';

    if (!mostModels || mostModels.length === 0) {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `
            <td colspan="3" class="text-center text-secondary">
                No ranking data available
            </td>
        `;
        tableBody.appendChild(noDataRow);
        return;
    }

    // Sort models by message count (descending)
    const sortedModels = [...mostModels].sort((a, b) => b.msg_count - a.msg_count);

    // Create table rows
    sortedModels.forEach((model, index) => {
        const row = document.createElement('tr');

        // Add rank badges for top 3
        let rankDisplay = index + 1;
        if (index === 0) {
            rankDisplay = `<span class="text-dark">🥇 ${index + 1}</span>`;
        } else if (index === 1) {
            rankDisplay = `<span class="text-dark">🥈 ${index + 1}</span>`;
        } else if (index === 2) {
            rankDisplay = `<span class="text-dark">🥉 ${index + 1}</span>`;
        }

        row.innerHTML = `
            <td>${rankDisplay}</td>
            <td class="middle fw-semibold">${model.model_name || 'Unknown Bot'}</td>
            <td>
                <span class="text-dark">${model.msg_count || 0}</span>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// Initialize dashboard
async function initializeDashboard() {
    // Check authentication first
    if (!checkAuth()) {
        showToast('Please log in to access the dashboard', 'error');
        setTimeout(() => {
            window.location.href = '/pages/login.html';
        }, 2000);
        return;
    }

    // Check if user is admin
    const userRole = sessionStorage.getItem('userRole');
    if (userRole && userRole.toLowerCase() !== 'admin') {
        showToast('Access denied. Admin privileges required.', 'error');
        setTimeout(() => {
            // Redirect based on their actual role
            const redirectUrls = {
                'user': '/chat.html',
                'supervisor': '/therapist.html'
            };
            const redirectUrl = redirectUrls[userRole.toLowerCase()] || '/pages/login.html';
            window.location.href = redirectUrl;
        }, 2000);
        return;
    }

    // Update welcome message with admin email
    const adminEmail = getAdminEmail();
    const firstNameElement = document.querySelector('.first-name');
    if (firstNameElement && adminEmail) {
        // Extract first part of email as display name
        const displayName = adminEmail.split('@')[0];
        firstNameElement.textContent = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    }

    // Show loading state
    const loadingElements = [
        document.getElementById('patient-num'),
        document.getElementById('bots-num'),
        document.getElementById('supervisors-num')
    ];

    loadingElements.forEach(element => {
        if (element) {
            element.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>';
        }
    });

    // Show loading in ranking table
    const tableBody = document.getElementById('ranking-table-body');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center">
                    <div class="spinner-border spinner-border-sm" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    Loading ranking data...
                </td>
            </tr>
        `;
    }

    // Fetch and populate dashboard data
    const dashboardData = await fetchDashboardData();

    if (dashboardData) {
        updateDashboardCards(dashboardData);
        populateRankingTable(dashboardData.most_model);
        showToast('Dashboard loaded successfully', 'success');
    } else {
        // Reset to default values on error
        loadingElements.forEach(element => {
            if (element) {
                element.textContent = '0';
            }
        });

        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Failed to load ranking data
                    </td>
                </tr>
            `;
        }
    }
}

// Refresh dashboard data
function refreshDashboard() {
    initializeDashboard();
}

// Set up auto-refresh (optional)
function setupAutoRefresh(intervalMinutes = 5) {
    setInterval(() => {
        console.log('Auto-refreshing dashboard data...');
        refreshDashboard();
    }, intervalMinutes * 60 * 1000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeDashboard();

    // Optional: Set up auto-refresh every 5 minutes
    // setupAutoRefresh(5);
});

// Export functions for external use
window.dashboardAPI = {
    initializeDashboard,
    refreshDashboard,
    fetchDashboardData,
    updateDashboardCards,
    populateRankingTable,
    setupAutoRefresh
};