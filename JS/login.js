document.addEventListener('DOMContentLoaded', function () {
    // Setup logout functionality
    setupLogoutHandler();

    // Setup password visibility toggles
    setupPasswordToggles();

    // Setup form navigation
    setupFormNavigation();

    // Handle login form submission
    setupLoginFormSubmission();

    // Prevent default form submissions
    preventFormSubmissions();
});

// Add explicit prevention of all form submissions
function preventFormSubmissions() {
    const allForms = document.querySelectorAll('form');
    allForms.forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            return false;
        });
    });
}

// Setup password visibility toggles
function setupPasswordToggles() {
    // Check if elements exist before adding event listeners
    const toggleLoginPassword = document.getElementById('toggleLoginPassword');
    const loginPassword = document.getElementById('loginPassword');

    if (toggleLoginPassword && loginPassword) {
        toggleLoginPassword.addEventListener('click', function () {
            togglePasswordVisibility(loginPassword, toggleLoginPassword);
        });
    }

    const toggleNewPassword = document.getElementById('toggleNewPassword');
    const newPassword = document.getElementById('newPassword');

    if (toggleNewPassword && newPassword) {
        toggleNewPassword.addEventListener('click', function () {
            togglePasswordVisibility(newPassword, toggleNewPassword);
        });
    }

    const toggleConfirmNewPassword = document.getElementById('toggleConfirmNewPassword');
    const confirmNewPassword = document.getElementById('confirmNewPassword');

    if (toggleConfirmNewPassword && confirmNewPassword) {
        toggleConfirmNewPassword.addEventListener('click', function () {
            togglePasswordVisibility(confirmNewPassword, toggleConfirmNewPassword);
        });
    }
}

// Toggle password visibility
function togglePasswordVisibility(inputField, icon) {
    if (inputField.type === 'password') {
        inputField.type = 'text';
        icon.classList.replace('bi-eye', 'bi-eye-slash');
    } else {
        inputField.type = 'password';
        icon.classList.replace('bi-eye-slash', 'bi-eye');
    }
}

// Setup form navigation between steps
function setupFormNavigation() {
    const loginForm = document.getElementById('loginForm');
    const steps = document.querySelectorAll('.step');

    // Login to recover step
    const forgetPasswordLink = document.querySelector('.step.active a[href="#"]');
    if (forgetPasswordLink) {
        forgetPasswordLink.addEventListener('click', function (e) {
            e.preventDefault();
            goToStep(1); // Go to recover step
            return false;
        });
    }

    // Recover to login step
    const backToLoginLink = document.querySelector('.step:nth-child(2) a[href="#"]');
    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', function (e) {
            e.preventDefault();
            goToStep(0); // Go back to login step
            return false;
        });
    }

    // Recover to verify step (send button)
    const recoverButton = document.getElementById('next-step-recover');
    if (recoverButton) {
        recoverButton.addEventListener('click', function (e) {
            e.preventDefault();
            if (validateRecoverStep()) {
                requestPasswordReset();
            }
            return false;
        });
    }

    // Resend email button in verify step
    const resendEmailButton = document.querySelector('.step:nth-child(3) .custom-btn');
    if (resendEmailButton) {
        resendEmailButton.addEventListener('click', function (e) {
            e.preventDefault();
            confirmEmail();
            return false;
        });
    }

    // Reset password button
    const resetButton = document.getElementById('next-step-reset');
    if (resetButton) {
        resetButton.addEventListener('click', function (e) {
            e.preventDefault();
            if (validateResetPasswordStep()) {
                resetPassword();
            }
            return false;
        });
    }

    // Reset to login step
    const resetToLoginLink = document.querySelector('.step:nth-child(4) a[href="#"]');
    if (resetToLoginLink) {
        resetToLoginLink.addEventListener('click', function (e) {
            e.preventDefault();
            goToStep(0); // Go back to login step
            return false;
        });
    }
}

// Navigate to specified step
function goToStep(stepIndex) {
    const steps = document.querySelectorAll('.step');

    steps.forEach((step) => {
        step.classList.remove('active');
    });

    steps[stepIndex].classList.add('active');
}

// Setup login form submission
function setupLoginFormSubmission() {
    const loginForm = document.getElementById('loginForm');
    const loginButton = document.getElementById('next-step-login');

    if (loginButton) {
        loginButton.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent default button action
            e.stopPropagation(); // Stop event from bubbling up
            if (validateLoginStep()) {
                loginUser();
            }
            return false; // Additional safeguard against event bubbling
        });
    }

    // IMPORTANT: Make sure the form never submits naturally
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault(); // Always prevent default submission
            e.stopPropagation(); // Stop event from bubbling up

            // Get the active step and handle submission based on step
            const activeStep = document.querySelector('.step.active');
            if (!activeStep) return false;

            // Find which step is active and trigger the appropriate button
            const stepIndex = Array.from(document.querySelectorAll('.step')).indexOf(activeStep);

            switch (stepIndex) {
                case 0: // Login step
                    if (validateLoginStep()) {
                        loginUser();
                    }
                    break;
                case 1: // Recover step
                    if (validateRecoverStep()) {
                        requestPasswordReset();
                    }
                    break;
                case 2: // Verify step
                    confirmEmail();
                    break;
                case 3: // Reset password step
                    if (validateResetPasswordStep()) {
                        resetPassword();
                    }
                    break;
            }

            return false; // Additional safeguard against form submission
        });
    }
}

// Validate login step
function validateLoginStep() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showToast('Please enter a valid email address', 'error');
        return false;
    }

    // Password validation (basic check)
    if (!password) {
        showToast('Please enter your password', 'error');
        return false;
    }

    return true;
}

// Validate recover step
function validateRecoverStep() {
    const recoverEmail = document.querySelector('#recover-email').value.trim();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recoverEmail || !emailRegex.test(recoverEmail)) {
        showToast('Please enter a valid email address', 'error');
        return false;
    }

    return true;
}

// Validate reset password step
function validateResetPasswordStep() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    // Password validation (at least 8 chars, 1 uppercase, 1 number, 1 special char)
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!newPassword || !passwordRegex.test(newPassword)) {
        showToast('Password must be at least 8 characters with 1 uppercase letter, 1 number, and 1 special character', 'error');
        return false;
    }

    // Confirm password validation
    if (newPassword !== confirmNewPassword) {
        showToast('Passwords do not match', 'error');
        return false;
    }

    return true;
}

// Get user role from API and store it
async function getUserRole(email) {
    try {
        console.log('Fetching role for email:', email);

        const apiUrl = `https://grad-project-ai-api.vercel.app/auth/user/role?email=${encodeURIComponent(email)}`;
        console.log('Constructed API URL:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Role API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Role API error:', errorText);
            throw new Error(`Failed to get user role: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Role API response data:', data);

        // Handle different possible response formats
        let role = null;
        if (typeof data === 'string') {
            role = data.toLowerCase().trim();
        } else if (data.user_role) {
            role = data.user_role.toLowerCase().trim();
        } else if (data.role) {
            role = data.role.toLowerCase().trim();
        } else if (data.Role) {
            role = data.Role.toLowerCase().trim();
        } else if (data.userRole) {
            role = data.userRole.toLowerCase().trim();
        } else {
            console.warn('Unexpected role API response format:', data);
            // Try to extract the role from the response
            role = String(data).toLowerCase().trim();
        }

        console.log('Extracted and normalized role:', role);

        // Store the role in sessionStorage for later use
        sessionStorage.setItem('userRole', role);

        return role;
    } catch (error) {
        console.error('Error getting user role:', error);
        throw new Error('Failed to determine user role');
    }
}

// Get redirect URL based on user role
function getRedirectUrl(role) {
    console.log('Getting redirect URL for role:', role, 'Type:', typeof role);

    // Normalize the role to lowercase for consistent matching
    const normalizedRole = String(role).toLowerCase().trim();
    console.log('Normalized role:', normalizedRole);

    const roleUrls = {
        'user': 'chat.html',
        'admin': 'admin.html',
        'supervisor': 'supervisor.html'
    };

    // Check if role exists in our mapping
    if (roleUrls[normalizedRole]) {
        console.log('Role match found:', normalizedRole, '-> redirecting to:', roleUrls[normalizedRole]);
        return roleUrls[normalizedRole];
    }

    // Log error if no match found - this should not happen if role API is working correctly
    console.error('CRITICAL: No matching role found for:', role, 'Normalized:', normalizedRole);
    console.error('Available roles:', Object.keys(roleUrls));

    // Throw error instead of defaulting - this will help identify the issue
    throw new Error(`Invalid user role: ${role}. Expected one of: ${Object.keys(roleUrls).join(', ')}`);
}

// Login user with the API - MODIFIED FLOW
function loginUser() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    showToast('Checking user role...', 'info');

    // Add a loading state to prevent multiple submissions
    const loginButton = document.getElementById('next-step-login');
    if (loginButton) {
        loginButton.disabled = true;
        loginButton.classList.add('btn-loading');
    }

    // STEP 1: First get the user role
    getUserRole(email)
        .then(userRole => {
            console.log('User role retrieved:', userRole);
            showToast('Role verified! Authenticating...', 'success');

            // STEP 2: Now authenticate with the login API
            const loginData = {
                email: email,
                password: password
            };

            return fetch('https://autine-back.runasp.net/auths/get-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else if (response.status === 400) {
                        return response.json().then(errorData => {
                            // Check if the error is about email not being confirmed
                            if (errorData.detail && errorData.detail.toLowerCase().includes('email') &&
                                errorData.detail.toLowerCase().includes('confirm')) {
                                // Store email in sessionStorage for security (not localStorage)
                                sessionStorage.setItem('pendingEmail', email);

                                // Don't store password in storage for security reasons
                                // Instead, ask user if they want to confirm email
                                if (confirm('Your email has not been confirmed. Would you like to confirm it now?')) {
                                    // Request a new confirmation code
                                    requestEmailConfirmation(email);
                                }
                            }
                            throw new Error(errorData.detail || 'Login failed. Please try again.');
                        });
                    } else {
                        throw new Error('Unexpected error occurred. Please try again.');
                    }
                })
                .then(authData => {
                    if (authData && authData.accessToken) {
                        // Store auth data consistently
                        storeAuthData(authData, rememberMe);

                        showToast('Authentication successful!', 'success');

                        // STEP 3: Get the stored role and redirect
                        const storedRole = sessionStorage.getItem('userRole');
                        console.log('Retrieved stored role:', storedRole);

                        if (!storedRole) {
                            throw new Error('User role not found. Please try logging in again.');
                        }

                        const redirectUrl = getRedirectUrl(storedRole);
                        console.log('Redirect URL determined:', redirectUrl);

                        showToast(`Welcome ${storedRole}! Redirecting...`, 'success');

                        // STEP 4: Redirect to the appropriate page
                        setTimeout(() => {
                            console.log('Redirecting to:', redirectUrl);
                            window.location.href = redirectUrl;
                        }, 1500);

                    } else {
                        throw new Error('Invalid response from server - missing access token');
                    }
                });
        })
        .catch(error => {
            // Reset button state
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.classList.remove('btn-loading');
            }

            console.error('Login process error:', error);
            showToast(error.message, 'error');
        });

    // Return false to ensure the form doesn't submit naturally
    return false;
}

// Store authentication data consistently
function storeAuthData(data, rememberMe) {
    // Create a consistent auth data object
    const authData = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || null,
        expiresAt: data.expiresIn ? Date.now() + (data.expiresIn * 1000) : null
    };

    // Store in the appropriate storage based on rememberMe
    if (rememberMe) {
        localStorage.setItem('authData', JSON.stringify(authData));
        sessionStorage.removeItem('authData'); // Clean up any session storage
    } else {
        sessionStorage.setItem('authData', JSON.stringify(authData));
        localStorage.removeItem('authData'); // Clean up any local storage
    }

    // If token expires, set up a refresh timer
    if (authData.expiresAt && authData.refreshToken) {
        const timeToRefresh = (authData.expiresAt - Date.now()) - (60 * 1000); // Refresh 1 minute before expiry
        if (timeToRefresh > 0) {
            setTimeout(() => {
                refreshAuthToken(authData.refreshToken);
            }, timeToRefresh);
        }
    }
}

// Get authentication data consistently
function getAuthData() {
    // Try session storage first, then localStorage
    let authData = null;
    const sessionData = sessionStorage.getItem('authData');
    const localData = localStorage.getItem('authData');

    if (sessionData) {
        authData = JSON.parse(sessionData);
    } else if (localData) {
        authData = JSON.parse(localData);
    }
    console.log('Retrieved auth data:', authData);

    return authData;
}

// Check if user is authenticated
function checkAuth() {
    console.log("Checking authentication...");

    const authData = getAuthData();

    if (!authData || !authData.accessToken) {
        console.log("No access token found, redirecting to login");
        window.location.href = '/pages/login.html';
        return false;
    }

    // Check if token is expired
    if (authData.expiresAt && Date.now() >= authData.expiresAt) {
        console.log("Token expired, attempting refresh");
        if (authData.refreshToken) {
            refreshAuthToken(authData.refreshToken);
            return true; // Continue with potentially expired token, refresh will handle redirect if needed
        } else {
            console.log("No refresh token available, redirecting to login");
            window.location.href = '/pages/login.html';
            return false;
        }
    }

    console.log("Access token found, user is authenticated");
    return true;
}

// Helper function to get authentication headers
function getAuthHeaders() {
    const authData = getAuthData();

    if (!authData || !authData.accessToken) {
        return { 'Content-Type': 'application/json' };
    }

    return {
        'Authorization': `Bearer ${authData.accessToken}`,
        'Content-Type': 'application/json'
    };
}

// Request password reset email
function requestPasswordReset() {
    const email = document.querySelector('#recover-email').value.trim();

    if (!email) {
        showToast('Please enter a valid email address', 'error');
        return;
    }

    const requestData = { email: email };

    showToast('Requesting password reset email...', 'info');

    fetch('https://autine-back.runasp.net/auths/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                return response.json().then(errorData => {
                    throw new Error(errorData.detail || 'Failed to send reset email');
                });
            }
        })
        .then(data => {
            if (data.code && data.userId) {
                // Store reset data in sessionStorage (more secure than localStorage)
                // and encrypt or encode it for better security
                const resetData = {
                    userId: data.userId,
                    code: data.code
                };
                console.log('Reset Data:', resetData);

                sessionStorage.setItem('resetData', btoa(JSON.stringify(resetData)));
                showToast('Password reset email sent successfully!', 'success');

                // Move to next step
                goToStep(2); // Go to verify step
            } else {
                throw new Error('Unexpected response from server');
            }
        })
        .catch(error => {
            showToast(error.message, 'error');
        });
}

// Simulate email confirmation and proceed to the next step
function confirmEmail() {
    showToast('Simulating email confirmation...', 'info');

    setTimeout(() => {
        showToast('Email verified successfully!', 'success');
        goToStep(3); // Proceed to reset password step
    }, 1000); // Simulate a delay for the confirmation process
}

// Reset password with userId, code, and new password
function resetPassword() {
    const newPassword = document.getElementById('newPassword').value;

    // Get reset data from sessionStorage and decode
    let resetData = null;
    try {
        const encodedData = sessionStorage.getItem('resetData');
        if (encodedData) {
            resetData = JSON.parse(atob(encodedData));
        }
    } catch (e) {
        console.error('Error decoding reset data:', e);
    }

    if (!resetData || !resetData.userId || !resetData.code || !newPassword) {
        showToast('Missing required information. Please try again.', 'error');
        return;
    }

    const requestData = {
        userId: resetData.userId,
        code: resetData.code,
        password: newPassword
    };

    console.log('Request Data:', requestData);

    showToast('Resetting password...', 'info');

    fetch('https://autine-back.runasp.net/auths/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                return response.json().then(errorData => {
                    throw new Error(errorData.detail || 'Failed to reset password');
                });
            }
        })
        .then(() => {
            // Clear reset data
            sessionStorage.removeItem('resetData');
            showToast('Password reset successfully!', 'success');
            setTimeout(() => {
                goToStep(0); // Return to login step
            }, 1500);
        })
        .catch(error => {
            showToast(error.message, 'error');
        });
}

// Function to refresh auth token
function refreshAuthToken(refreshToken) {
    if (!refreshToken) {
        console.error('No refresh token available');
        handleLogout();
        return;
    }

    console.log("Refreshing auth token...");

    fetch('https://autine-back.runasp.net/auths/refresh', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: refreshToken }),
        cache: 'no-cache'
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Failed to refresh token');
            }
        })
        .then(data => {
            if (data.accessToken) {
                // Get current auth data to determine storage type
                const currentAuthData = getAuthData();
                const useLocalStorage = !!localStorage.getItem('authData');

                // Create new auth data
                const authData = {
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken || currentAuthData?.refreshToken,
                    expiresAt: data.expiresIn ? Date.now() + (data.expiresIn * 1000) : null
                };

                // Store in the same storage that was used before
                if (useLocalStorage) {
                    localStorage.setItem('authData', JSON.stringify(authData));
                } else {
                    sessionStorage.setItem('authData', JSON.stringify(authData));
                }

                // Set up next refresh
                if (authData.expiresAt && authData.refreshToken) {
                    const timeToRefresh = (authData.expiresAt - Date.now()) - (60 * 1000); // Refresh 1 minute before expiry
                    if (timeToRefresh > 0) {
                        setTimeout(() => {
                            refreshAuthToken(authData.refreshToken);
                        }, timeToRefresh);
                    }
                }
            } else {
                throw new Error('Invalid token response');
            }
        })
        .catch(error => {
            console.error('Token refresh failed:', error);
            // Handle token refresh failure (redirect to login)
            handleLogout();
        });
}

// Setup logout handler function
function setupLogoutHandler() {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function (e) {
            e.preventDefault();
            handleLogout();
            return false;
        });
    }
}

// Handle logout
function handleLogout() {
    // Clear all authentication data
    localStorage.removeItem('authData');
    sessionStorage.removeItem('authData');

    // Clear role data
    sessionStorage.removeItem('userRole');

    // Clear any reset data
    sessionStorage.removeItem('resetData');
    sessionStorage.removeItem('pendingEmail');

    // Show logout notification
    showToast('Logging out...', 'info');

    // Redirect to login page
    setTimeout(() => {
        window.location.href = '/pages/login.html';
    }, 1000);
}

// Show toast notification
function showToast(message, type) {
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

// ADD THIS TO YOUR EXISTING LOGIN SCRIPT

// Enhanced store authentication data function
function storeAuthData(data, rememberMe, userEmail) {
    // Create a consistent auth data object
    const authData = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || null,
        expiresAt: data.expiresIn ? Date.now() + (data.expiresIn * 1000) : null,
        email: userEmail // Store the email in auth data
    };

    // Store in the appropriate storage based on rememberMe
    if (rememberMe) {
        localStorage.setItem('authData', JSON.stringify(authData));
        localStorage.setItem('userEmail', userEmail); // Store email separately as well
        sessionStorage.removeItem('authData'); // Clean up any session storage
        sessionStorage.removeItem('userEmail');
    } else {
        sessionStorage.setItem('authData', JSON.stringify(authData));
        sessionStorage.setItem('userEmail', userEmail); // Store email separately as well
        localStorage.removeItem('authData'); // Clean up any local storage
        localStorage.removeItem('userEmail');
    }

    // If token expires, set up a refresh timer
    if (authData.expiresAt && authData.refreshToken) {
        const timeToRefresh = (authData.expiresAt - Date.now()) - (60 * 1000); // Refresh 1 minute before expiry
        if (timeToRefresh > 0) {
            setTimeout(() => {
                refreshAuthToken(authData.refreshToken);
            }, timeToRefresh);
        }
    }
}

// MODIFY YOUR EXISTING loginUser FUNCTION
// Replace the line: storeAuthData(authData, rememberMe);
// With: storeAuthData(authData, rememberMe, email);

// Example of how to modify the loginUser function:
function loginUser() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    showToast('Checking user role...', 'info');

    // Add a loading state to prevent multiple submissions
    const loginButton = document.getElementById('next-step-login');
    if (loginButton) {
        loginButton.disabled = true;
        loginButton.classList.add('btn-loading');
    }

    // STEP 1: First get the user role
    getUserRole(email)
        .then(userRole => {
            console.log('User role retrieved:', userRole);
            showToast('Role verified! Authenticating...', 'success');

            // STEP 2: Now authenticate with the login API
            const loginData = {
                email: email,
                password: password
            };

            return fetch('https://autine-back.runasp.net/auths/get-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else if (response.status === 400) {
                        return response.json().then(errorData => {
                            // Check if the error is about email not being confirmed
                            if (errorData.detail && errorData.detail.toLowerCase().includes('email') &&
                                errorData.detail.toLowerCase().includes('confirm')) {
                                // Store email in sessionStorage for security (not localStorage)
                                sessionStorage.setItem('pendingEmail', email);

                                // Don't store password in storage for security reasons
                                // Instead, ask user if they want to confirm email
                                if (confirm('Your email has not been confirmed. Would you like to confirm it now?')) {
                                    // Request a new confirmation code
                                    requestEmailConfirmation(email);
                                }
                            }
                            throw new Error(errorData.detail || 'Login failed. Please try again.');
                        });
                    } else {
                        throw new Error('Unexpected error occurred. Please try again.');
                    }
                })
                .then(authData => {
                    if (authData && authData.accessToken) {
                        // Store auth data consistently WITH EMAIL
                        storeAuthData(authData, rememberMe, email); // <-- MODIFIED LINE

                        showToast('Authentication successful!', 'success');

                        // STEP 3: Get the stored role and redirect
                        const storedRole = sessionStorage.getItem('userRole');
                        console.log('Retrieved stored role:', storedRole);

                        if (!storedRole) {
                            throw new Error('User role not found. Please try logging in again.');
                        }

                        const redirectUrl = getRedirectUrl(storedRole);
                        console.log('Redirect URL determined:', redirectUrl);

                        showToast(`Welcome ${storedRole}! Redirecting...`, 'success');

                        // STEP 4: Redirect to the appropriate page
                        setTimeout(() => {
                            console.log('Redirecting to:', redirectUrl);
                            window.location.href = redirectUrl;
                        }, 1500);

                    } else {
                        throw new Error('Invalid response from server - missing access token');
                    }
                });
        })
        .catch(error => {
            // Reset button state
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.classList.remove('btn-loading');
            }

            console.error('Login process error:', error);
            showToast(error.message, 'error');
        });

    // Return false to ensure the form doesn't submit naturally
    return false;
}

// Enhanced handleLogout function to clear email data
function handleLogout() {
    // Clear all authentication data
    localStorage.removeItem('authData');
    sessionStorage.removeItem('authData');

    // Clear email data
    localStorage.removeItem('userEmail');
    sessionStorage.removeItem('userEmail');

    // Clear role data
    sessionStorage.removeItem('userRole');

    // Clear any reset data
    sessionStorage.removeItem('resetData');
    sessionStorage.removeItem('pendingEmail');

    // Show logout notification
    showToast('Logging out...', 'info');

    // Redirect to login page
    setTimeout(() => {
        window.location.href = '/pages/login.html';
    }, 1000);
}