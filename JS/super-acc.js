// Supervisor Settings JavaScript - Load and Edit Profile Data
document.addEventListener('DOMContentLoaded', function () {
    // Initialize supervisor settings
    initializeSupervisorSettings();

    // Setup form handlers
    setupProfileFormHandler();
    setupPasswordFormHandler();
    setupProfilePictureHandler();
    setupNotificationToggle();
    setupPasswordVisibilityToggles();
});

// Initialize supervisor settings on page load
function initializeSupervisorSettings() {
    // Check authentication first
    if (!checkAuth()) {
        return;
    }

    // Load supervisor profile data
    loadSupervisorProfile();

    // Setup date selectors
    populateDateSelectors();

    // Setup country and city selectors
    setupLocationSelectors();
}

async function loadSupervisorProfile() {
    try {
        showToast('Loading profile data...', 'info');

        const response = await fetch('https://autine-back.runasp.net/api/Profiles', {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 401) {
                handleLogout();
                return;
            }
            throw new Error(`Failed to load profile: ${response.status}`);
        }

        const profileData = await response.json();

        // Extract and store supervisor ID
        let supervisorId = null;
        if (profileData.id) {
            supervisorId = profileData.id;
            console.log('Supervisor ID extracted:', supervisorId);

            // Store supervisor ID in multiple ways for accessibility
            // 1. Store in sessionStorage for cross-page access
            sessionStorage.setItem('supervisorId', supervisorId);

            // 2. Store in localStorage as backup
            localStorage.setItem('supervisorId', supervisorId);

            // 3. Store as data attribute on body
            document.body.setAttribute('data-supervisor-id', supervisorId);

            // 4. Update auth data with supervisor ID
            const authData = getAuthData();
            if (authData) {
                authData.supervisorId = supervisorId;
                authData.supervisor_id = supervisorId; // Alternative field name
                // Update stored auth data
                const storageKey = sessionStorage.getItem('authData') ? 'authData' : 'authData';
                const storageType = sessionStorage.getItem('authData') ? sessionStorage : localStorage;
                storageType.setItem(storageKey, JSON.stringify(authData));
            }
        }

        // Check all possible name fields
        const possibleNameFields = ['firstName', 'first_name'];
        possibleNameFields.forEach(field => {
            if (profileData[field]) {
                // Name field processing if needed
            }
        });

        // Populate form fields with the data
        populateProfileForm(profileData);

        showToast('Profile loaded successfully!', 'success');

        // Return supervisor ID for immediate use if needed
        return supervisorId;

    } catch (error) {
        console.error('Error loading supervisor profile:', error);
        showToast('Failed to load profile data', 'error');
        return null;
    }
}

// Helper function to get supervisor ID from various storage locations
function getSupervisorId() {
    // Try multiple sources
    let supervisorId = sessionStorage.getItem('supervisorId') ||
        localStorage.getItem('supervisorId') ||
        document.body.getAttribute('data-supervisor-id');

    // If not found, try from auth data
    if (!supervisorId) {
        const authData = getAuthData();
        if (authData) {
            supervisorId = authData.supervisorId ||
                authData.supervisor_id ||
                authData.id;
        }
    }

    return supervisorId;
}

// Updated populateProfileForm function
function populateProfileForm(data) {
    try {
        // Store the user ID as supervisor ID if available
        if (data.id) {
            // Store it in a data attribute for later use
            document.body.setAttribute('data-user-id', data.id);
            document.body.setAttribute('data-supervisor-id', data.id); // Also store as supervisor ID
            console.log('Stored supervisor ID:', data.id);
        }

        // Basic information - populate form inputs
        if (data.firstName && data.firstName.trim()) {
            const firstNameInput = document.getElementById('firstName');
            if (firstNameInput) {
                firstNameInput.value = data.firstName.trim();
            }
        }

        if (data.lastName && data.lastName.trim()) {
            const lastNameInput = document.getElementById('lastName');
            if (lastNameInput) {
                lastNameInput.value = data.lastName.trim();
            }
        }

        // ONLY UPDATE NAME DISPLAYS - no other logic
        updateNameDisplays(data.firstName, data.lastName);

        if (data.bio) {
            const bioInput = document.getElementById('bio');
            if (bioInput) {
                bioInput.value = data.bio;
            }
        }

        // Date of birth
        if (data.dateOfBirth) {
            const dob = new Date(data.dateOfBirth);
            if (!isNaN(dob.getTime())) {
                const daySelect = document.getElementById('dob-day');
                const monthSelect = document.getElementById('dob-month');
                const yearSelect = document.getElementById('dob-year');

                if (daySelect) daySelect.value = dob.getDate();
                if (monthSelect) monthSelect.value = dob.getMonth() + 1;
                if (yearSelect) yearSelect.value = dob.getFullYear();
            }
        }

        // Gender
        if (data.gender) {
            const genderInput = document.querySelector(`input[name="customRadio"][value="${data.gender.toLowerCase()}"]`);
            if (genderInput) {
                genderInput.checked = true;
            }
        }

        // Location
        if (data.country) {
            const countrySelect = document.getElementById('country');
            if (countrySelect) {
                countrySelect.value = data.country;
                // Trigger city loading if country is set
                loadCitiesForCountry(data.country, data.city);
            }
        }

        // Profile image
        if (data.imageUrl) {
            const profilePic = document.querySelector('.therapist-pic');
            if (profilePic) {
                profilePic.src = data.imageUrl;
                console.log('Profile image element updated with URL:', data.imageUrl);
            }
        } else {
            console.log('No profile image URL found in API response');
        }
    } catch (error) {
        console.error('Error populating profile form:', error);
        showToast('Error displaying profile data', 'error');
    }
}


// New function to update name displays in different elements
function updateNameDisplays(firstName, lastName) {

    // Clean and validate names
    const cleanFirstName = cleanNameValue(firstName) || 'Supervisor';
    const cleanLastName = cleanNameValue(lastName) || '';

    // Create full name
    const fullName = cleanLastName ? `${cleanFirstName} ${cleanLastName}` : cleanFirstName;

    // Update elements with class 'supervisor-fname' (display full name)
    const supervisorFnameElements = document.querySelectorAll('.supervisor-fname');
    if (supervisorFnameElements.length > 0) {
        supervisorFnameElements.forEach((element, index) => {
            element.textContent = fullName;
        });
    } else {
        console.warn('No elements found with class "supervisor-fname"');
    }
}



// New function to update name displays in different elements
function updateNameDisplays(firstName, lastName) {
    // Clean and validate names
    const cleanFirstName = cleanNameValue(firstName) || 'Supervisor';
    const cleanLastName = cleanNameValue(lastName) || '';

    // Create full name
    const fullName = cleanLastName ? `${cleanFirstName} ${cleanLastName}` : cleanFirstName;
 

    // Update elements with class 'supervisor-fname' (display full name)
    const supervisorFnameElements = document.querySelectorAll('.supervisor-fname');
    if (supervisorFnameElements.length > 0) {
        supervisorFnameElements.forEach((element, index) => {
            element.textContent = fullName;
        });
    } else {
        console.warn('No elements found with class "supervisor-fname"');
    }
}




// Simplified function to clean name values (removed email extraction)
function cleanNameValue(nameStr) {
    if (!nameStr || typeof nameStr !== 'string') return '';

    // Remove special characters and numbers, but keep spaces, hyphens, and apostrophes
    let cleaned = nameStr.replace(/[^a-zA-Z\s\-']/g, ' ').trim();

    // Replace multiple spaces with single space
    cleaned = cleaned.replace(/\s+/g, ' ');

    // If the cleaned string is empty or too short, return empty
    if (cleaned.length < 1) return '';

    // Capitalize properly
    cleaned = cleaned.split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');

    return cleaned;
}



// Setup profile form submission handler
function setupProfileFormHandler() {
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', function (e) {
            e.preventDefault();
            updateSupervisorProfile();
        });
    }
}

// Enhanced updateSupervisorProfile function with updated name display
async function updateSupervisorProfile() {
    try {
        // Validate form data
        if (!validateProfileForm()) {
            return;
        }

        // Collect form data
        const profileData = collectProfileFormData();

        console.log('Profile data being sent:', profileData);

        showToast('Updating profile...', 'info');

        const response = await fetch('https://autine-back.runasp.net/api/Profiles', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(profileData)
        });

        if (!response.ok) {
            if (response.status === 401) {
                handleLogout();
                return;
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Update failed: ${response.status}`);
        }

        showToast('Profile updated successfully!', 'success');

        // Update name displays immediately after successful update
        updateNameDisplays(profileData.firstName, profileData.lastName);

        console.log('Profile update completed');

    } catch (error) {
        console.error('Error updating supervisor profile:', error);
        showToast(error.message || 'Failed to update profile', 'error');
    }
}


// Add this function to manually debug what's in the profile data
function debugProfileData() {
    console.log('=== DEBUGGING PROFILE DATA ===');
    
    // Check current supervisor name elements
    supervisorElements.forEach((el, index) => {
        console.log(`Element ${index}:`, el.textContent);
    });
    
    // Check if there's cached profile data
    const authData = getAuthData();
    console.log('Auth data:', authData);
    
    // Manually load profile to see what we get
    loadSupervisorProfile();
}

// Collect profile form data
function collectProfileFormData() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const bio = document.getElementById('bio').value.trim();
    const country = document.getElementById('country').value;
    const city = document.getElementById('city').value;

    // Get selected gender
    const genderInput = document.querySelector('input[name="customRadio"]:checked');
    const gender = genderInput ? genderInput.value : '';

    // Get date of birth
    const day = document.getElementById('dob-day').value;
    const month = document.getElementById('dob-month').value;
    const year = document.getElementById('dob-year').value;

    let dateOfBirth = '';
    if (day && month && year) {
        // Format as ISO date string
        const date = new Date(year, month - 1, day);
        dateOfBirth = date.toISOString();
    }

    return {
        firstName,
        lastName,
        bio,
        country: country || null,
        city: city || null,
        gender,
        dateOfBirth
    };
}

// Validate profile form
function validateProfileForm() {
    let isValid = true;

    // Required fields validation
    const requiredFields = [
        { id: 'firstName', message: 'First name is required' },
        { id: 'lastName', message: 'Last name is required' },
        { id: 'bio', message: 'Bio is required' }
    ];

    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element.value.trim()) {
            element.classList.add('is-invalid');
            showToast(field.message, 'error');
            isValid = false;
        } else {
            element.classList.remove('is-invalid');
        }
    });

    // Gender validation
    const genderInput = document.querySelector('input[name="customRadio"]:checked');
    if (!genderInput) {
        showToast('Please select your gender', 'error');
        isValid = false;
    }

    // Date validation
    const day = document.getElementById('dob-day').value;
    const month = document.getElementById('dob-month').value;
    const year = document.getElementById('dob-year').value;

    if (!day || !month || !year) {
        showToast('Please select your complete date of birth', 'error');
        isValid = false;
    }

    return isValid;
}

// Setup password change form handler
function setupPasswordFormHandler() {
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function (e) {
            e.preventDefault();
            changeSupervisorPassword();
        });
    }
}

// Change supervisor password
async function changeSupervisorPassword() {
    try {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate passwords
        if (!validatePasswordChange(currentPassword, newPassword, confirmPassword)) {
            return;
        }

        showToast('Changing password...', 'info');

        const response = await fetch('https://autine-back.runasp.net/api/Profiles/change-password', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                handleLogout();
                return;
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to change password');
        }

        showToast('Password changed successfully!', 'success');

        // Clear form
        document.getElementById('passwordForm').reset();

    } catch (error) {
        console.error('Error changing password:', error);
        showToast(error.message || 'Failed to change password', 'error');
    }
}

// Validate password change
function validatePasswordChange(currentPassword, newPassword, confirmPassword) {
    if (!currentPassword) {
        showToast('Current password is required', 'error');
        return false;
    }

    if (!newPassword || newPassword.length < 8) {
        showToast('New password must be at least 8 characters long', 'error');
        return false;
    }

    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return false;
    }

    // Additional password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        showToast('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character', 'error');
        return false;
    }

    return true;
}

// Setup profile picture handler with enhanced functionality
function setupProfilePictureHandler() {
    const profilePicInput = document.getElementById('profile-pic');
    const uploadLabel = document.querySelector('label[for="profile-pic"]');

    if (profilePicInput && uploadLabel) {
        profilePicInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                console.log('Selected file:', file);
                console.log('File path:', file.name);
                console.log('File size:', file.size, 'bytes');
                console.log('File type:', file.type);

                // Preview the image immediately
                previewProfilePicture(file);

                // Upload to server
                uploadProfilePicture(file);
            }
        });
    }
}

// Preview profile picture before uploading
function previewProfilePicture(file) {
    console.log('Previewing profile picture...');

    if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
        const imageDataUrl = e.target.result;
        console.log('Image data URL generated:', imageDataUrl.substring(0, 50) + '...');

        // Update all profile picture elements
        updateAllProfilePictures(imageDataUrl);
    };

    reader.onerror = function () {
        console.error('Error reading file');
        showToast('Error reading image file', 'error');
    };

    reader.readAsDataURL(file);
}

// Update all profile picture elements on the page
function updateAllProfilePictures(imageSrc) {
    console.log('Updating all profile pictures with new image...');

    // List of possible profile picture selectors
    const profilePicSelectors = [
        '.therapist-pic',
        '.therapist-photo',
        '.profile-image',
        '.user-avatar',
        'img[alt="therapist"]',
        'img[alt="photo"]'
    ];

    let updatedCount = 0;

    profilePicSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element, index) => {
            if (element.tagName === 'IMG') {
                const oldSrc = element.src;
                element.src = imageSrc;
                updatedCount++;

                console.log(`Updated ${selector}[${index}]:`, {
                    oldSrc: oldSrc,
                    newSrc: imageSrc.substring(0, 50) + '...',
                    element: element
                });
            }
        });
    });

    console.log(`Total profile pictures updated: ${updatedCount}`);

    if (updatedCount === 0) {
        console.warn('No profile picture elements found to update');
    }
}


// Upload profile picture
async function uploadProfilePicture(file) {
    try {
        // Validate file
        if (!file.type.startsWith('image/')) {
            showToast('Please select a valid image file', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            showToast('Image file size must be less than 5MB', 'error');
            return;
        }

        showToast('Uploading profile picture...', 'info');

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('https://autine-back.runasp.net/api/Profiles/change-profile-picture', {
            method: 'PUT',
            headers: {
                'Authorization': getAuthHeaders().Authorization
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload profile picture');
        }

        // Update the profile picture preview
        const reader = new FileReader();
        reader.onload = function (e) {
            const profilePic = document.querySelector('.therapist-pic');
            if (profilePic) {
                profilePic.src = e.target.result;
            }
        };
        reader.readAsDataURL(file);

        showToast('Profile picture updated successfully!', 'success');

    } catch (error) {
        console.error('Error uploading profile picture:', error);
        showToast('Failed to upload profile picture', 'error');
    }
}

// Delete profile picture
async function deleteProfilePicture() {
    if (!confirm('Are you sure you want to delete your profile picture?')) {
        return;
    }

    try {
        showToast('Deleting profile picture...', 'info');

        // Reset to default image
        const profilePic = document.querySelector('.therapist-pic');
        if (profilePic) {
            profilePic.src = '../images/user.png';
        }

        showToast('Profile picture deleted successfully!', 'success');

    } catch (error) {
        console.error('Error deleting profile picture:', error);
        showToast('Failed to delete profile picture', 'error');
    }
}

// Setup notification toggle
function setupNotificationToggle() {
    const notificationToggle = document.getElementById('notificationToggle');
    if (notificationToggle) {
        notificationToggle.addEventListener('click', function () {
            toggleNotifications();
        });
    }
}

// Toggle notifications
function toggleNotifications() {
    const toggle = document.getElementById('notificationToggle');
    const isEnabled = toggle.classList.contains('bi-toggle-on');

    if (isEnabled) {
        toggle.classList.remove('bi-toggle-on');
        toggle.classList.add('bi-toggle-off');
        showToast('Notifications disabled', 'info');
    } else {
        toggle.classList.remove('bi-toggle-off');
        toggle.classList.add('bi-toggle-on');
        showToast('Notifications enabled', 'success');
    }
}

// Setup password visibility toggles
function setupPasswordVisibilityToggles() {
    const toggles = [
        { toggleId: 'toggleCurrentPassword', inputId: 'currentPassword' },
        { toggleId: 'toggleNewPassword', inputId: 'newPassword' },
        { toggleId: 'toggleConfirmPassword', inputId: 'confirmPassword' }
    ];

    toggles.forEach(({ toggleId, inputId }) => {
        const toggle = document.getElementById(toggleId);
        const input = document.getElementById(inputId);

        if (toggle && input) {
            toggle.addEventListener('click', function () {
                togglePasswordVisibility(input, toggle);
            });
        }
    });
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

// Populate date selectors
function populateDateSelectors() {
    // Populate days (1-31)
    const daySelect = document.getElementById('dob-day');
    if (daySelect) {
        daySelect.innerHTML = '<option value="">Day</option>';
        for (let i = 1; i <= 31; i++) {
            daySelect.innerHTML += `<option value="${i}">${i}</option>`;
        }
    }

    // Populate years (current year - 100 to current year - 13)
    const yearSelect = document.getElementById('dob-year');
    if (yearSelect) {
        const currentYear = new Date().getFullYear();
        yearSelect.innerHTML = '<option value="">Year</option>';
        for (let i = currentYear - 13; i >= currentYear - 100; i--) {
            yearSelect.innerHTML += `<option value="${i}">${i}</option>`;
        }
    }
}

// Setup location selectors (simplified version)
function setupLocationSelectors() {
    const countrySelect = document.getElementById('country');
    const citySelect = document.getElementById('city');

    if (countrySelect) {
        // Add basic countries - you can expand this list
        const countries = [
            'United States', 'Canada', 'United Kingdom', 'Germany', 'France',
            'Italy', 'Spain', 'Netherlands', 'Sweden', 'Norway', 'Denmark',
            'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore',
            'Egypt', 'Saudi Arabia', 'UAE', 'Jordan', 'Lebanon'
        ];

        countrySelect.innerHTML = '<option value="">Select Country</option>';
        countries.forEach(country => {
            countrySelect.innerHTML += `<option value="${country}">${country}</option>`;
        });

        countrySelect.addEventListener('change', function () {
            loadCitiesForCountry(this.value);
        });
    }
}

// Load cities for selected country (simplified)
function loadCitiesForCountry(country, selectedCity = null) {
    const citySelect = document.getElementById('city');
    if (!citySelect) return;

    // Basic city mapping - you can enhance this with a proper API
    const cityMapping = {
        'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
        'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
        'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds'],
        'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Sharm El Sheikh', 'Luxor'],
        // Add more countries and cities as needed
    };

    const cities = cityMapping[country] || [];

    citySelect.innerHTML = '<option value="">Select City</option>';
    cities.forEach(city => {
        const selected = selectedCity === city ? 'selected' : '';
        citySelect.innerHTML += `<option value="${city}" ${selected}>${city}</option>`;
    });
}

// Utility functions (reused from your existing code)

// Get authentication data consistently
function getAuthData() {
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
        window.location.href = '../pages/login.html';
        return false;
    }

    // Check if token is expired
    if (authData.expiresAt && Date.now() >= authData.expiresAt) {
        console.log("Token expired, attempting refresh");
        if (authData.refreshToken) {
            refreshAuthToken(authData.refreshToken);
            return true;
        } else {
            console.log("No refresh token available, redirecting to login");
            window.location.href = '../pages/login.html';
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

// Handle logout
function handleLogout() {
    localStorage.removeItem('authData');
    sessionStorage.removeItem('authData');
    localStorage.removeItem('userEmail');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('resetData');
    sessionStorage.removeItem('pendingEmail');

    showToast('Session expired. Redirecting to login...', 'info');

    setTimeout(() => {
        window.location.href = '../pages/login.html';
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