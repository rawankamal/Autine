// Admin Profile Management JavaScript

// Global variables
const API_BASE_URL = 'https://autine-back.runasp.net/api';

// Set country and city for fixed list: Egypt, USA, UAE, KSA, each with 4 cities
const allowedCountries = [
    { value: 'EG', name: 'Egypt', cities: ['Cairo', 'Alexandria', 'Giza', 'Kafr Elshiekh'] },
    { value: 'US', name: 'USA', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston'] },
    { value: 'AE', name: 'UAE', cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain'] },
    { value: 'SA', name: 'KSA', cities: ['Riyadh', 'Jeddah', 'Dammam', 'Mecca'] }
];

// Initialize profile management when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeProfileManagement();
});

// Initialize profile management functionality
function initializeProfileManagement() {
    // Initialize form immediately (in case tab is already active)
    initializeProfileForm();

    // Also set up the tab click listener for future tab switches
    const profileTab = document.getElementById('v-pills-profile-tab');
    if (profileTab) {
        profileTab.addEventListener('click', function () {
            initializeProfileForm();
        });
    }

    // Setup form submission
    setupProfileForm();

    // Load current profile data
    loadCurrentProfile();
}

// Initialize profile form
function initializeProfileForm() {
    try {
        // Populate date dropdowns
        populateDateDropdowns();

        // Load countries
        populateCountryDropdown();

        // Setup dependent dropdowns
        setupCountryCityDropdowns();

    } catch (error) {
        console.error('Error initializing profile form:', error);
        showToast('Failed to initialize form. Please refresh the page.', 'error');
    }
}

// Load current profile data from API
async function loadCurrentProfile() {
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

        // Make API call to get current user profile
        const response = await fetch(`${API_BASE_URL}/Profiles`, {
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
            throw new Error('Failed to load profile data');
        }

        const profileData = await response.json();
        console.log('Profile data loaded:', profileData);

        // Update admin name display in elements with class 'first-name'
        function updateAdminNameDisplay(profileData) {
            try {
                const firstNameElements = document.querySelectorAll('.first-name');

                if (firstNameElements.length > 0 && profileData) {
                    const displayName = profileData.firstName || 'Admin';

                    firstNameElements.forEach(element => {
                        element.textContent = displayName;
                    });

                    console.log('Updated admin name display:', displayName);
                }
            } catch (error) {
                console.error('Error updating admin name display:', error);
            }
        }

        // Populate form with profile data
        populateProfileForm(profileData);

        // Update admin name display
        updateAdminNameDisplay(profileData);

    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Failed to load profile data. Please refresh the page.', 'error');
    }
}

// Populate form with profile data
function populateProfileForm(profileData) {
    try {
        // Basic info
        const firstNameInput = document.getElementById('firstName');
        const lastNameInput = document.getElementById('lastName');

        if (firstNameInput && profileData.firstName) {
            firstNameInput.value = profileData.firstName;
        }
        if (lastNameInput && profileData.lastName) {
            lastNameInput.value = profileData.lastName;
        }

        // Date of birth
        if (profileData.dateOfBirth) {
            const date = new Date(profileData.dateOfBirth);
            const day = date.getDate();
            const month = date.getMonth() + 1; // getMonth() is 0-indexed
            const year = date.getFullYear();

            const daySelect = document.getElementById('dob-day');
            const monthSelect = document.getElementById('dob-month');
            const yearSelect = document.getElementById('dob-year');

            if (daySelect) daySelect.value = day;
            if (monthSelect) monthSelect.value = month;
            if (yearSelect) yearSelect.value = year;
        }

        // Gender
        if (profileData.gender) {
            const genderInputs = document.querySelectorAll('input[name="customRadio"]');
            genderInputs.forEach(input => {
                if (input.value.toLowerCase() === profileData.gender.toLowerCase()) {
                    input.checked = true;
                }
            });
        }

        // Country and City
        if (profileData.country) {
            const countrySelect = document.getElementById('country');
            // Find country by name
            const countryObj = allowedCountries.find(c =>
                c.name.toLowerCase() === profileData.country.toLowerCase()
            );

            if (countryObj && countrySelect) {
                countrySelect.value = countryObj.value;

                // Load cities for this country
                loadCitiesForCountry(countryObj.value);

                // Set city after a small delay to ensure cities are loaded
                setTimeout(() => {
                    const citySelect = document.getElementById('city');
                    if (citySelect && profileData.city) {
                        citySelect.value = profileData.city;
                    }
                }, 100);
            }
        }

    } catch (error) {
        console.error('Error populating profile form:', error);
        showToast('Error displaying profile data', 'error');
    }
}

// Populate date dropdowns (day, month, year)
function populateDateDropdowns() {
    populateDayDropdown();
    populateMonthDropdown();
    populateYearDropdown();
}

// Populate day dropdown
function populateDayDropdown() {
    const daySelect = document.getElementById('dob-day');
    if (!daySelect) return;

    // Clear existing options
    daySelect.innerHTML = '<option value="">Day</option>';

    // Add days 1-31
    for (let day = 1; day <= 31; day++) {
        const option = document.createElement('option');
        option.value = day;
        option.textContent = day;
        daySelect.appendChild(option);
    }
}

// Populate month dropdown
function populateMonthDropdown() {
    const monthSelect = document.getElementById('dob-month');
    if (!monthSelect) return;

    // Clear existing options
    monthSelect.innerHTML = '<option value="">Month</option>';

    // Month names
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Add months (1-12)
    months.forEach((monthName, index) => {
        const option = document.createElement('option');
        option.value = index + 1; // 1-12
        option.textContent = monthName;
        monthSelect.appendChild(option);
    });
}

// Populate year dropdown
function populateYearDropdown() {
    const yearSelect = document.getElementById('dob-year');
    if (!yearSelect) return;

    // Clear existing options
    yearSelect.innerHTML = '<option value="">Year</option>';

    // Add years from current year back to 1900
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1900; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
}

// Populate country dropdown with fixed list
function populateCountryDropdown() {
    const countrySelect = document.getElementById('country');
    if (!countrySelect) return;

    // Clear existing options and add default
    countrySelect.innerHTML = '<option value="">Select Country</option>';

    // Add allowed countries
    allowedCountries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.value;
        option.textContent = country.name;
        countrySelect.appendChild(option);
    });
}

// Setup country-city dropdown dependency
function setupCountryCityDropdowns() {
    const countrySelect = document.getElementById('country');
    const citySelect = document.getElementById('city');

    if (!countrySelect || !citySelect) return;

    countrySelect.addEventListener('change', function () {
        const selectedCountryValue = this.value;

        if (selectedCountryValue) {
            loadCitiesForCountry(selectedCountryValue);
        } else {
            // Clear city dropdown
            citySelect.innerHTML = '<option value="">Select City</option>';
        }
    });
}

// Load cities for selected country
function loadCitiesForCountry(countryValue) {
    const citySelect = document.getElementById('city');
    if (!citySelect) return;

    // Find the selected country
    const selectedCountry = allowedCountries.find(country => country.value === countryValue);

    if (!selectedCountry) {
        citySelect.innerHTML = '<option value="">No cities available</option>';
        return;
    }

    // Clear and populate city dropdown
    citySelect.innerHTML = '<option value="">Select City</option>';

    selectedCountry.cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });
}

// Setup profile form submission
function setupProfileForm() {
    const profileForm = document.getElementById('profileForm');
    if (!profileForm) return;

    profileForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Validate form
        if (!validateProfileForm()) {
            return;
        }

        // Get form data
        const formData = getProfileFormData();

        // Submit to API
        await submitProfileForm(formData);
    });
}

// Validate profile form
function validateProfileForm() {
    const form = document.getElementById('profileForm');
    if (!form) return false;

    let isValid = true;

    // Remove existing validation classes
    form.querySelectorAll('.is-invalid').forEach(element => {
        element.classList.remove('is-invalid');
    });

    // Validate required fields
    const requiredFields = [
        { id: 'firstName', message: 'Please enter your first name' },
        { id: 'lastName', message: 'Please enter your last name' },
        { id: 'dob-day', message: 'Please select day' },
        { id: 'dob-month', message: 'Please select month' },
        { id: 'dob-year', message: 'Please select year' },
        { id: 'country', message: 'Please select country' },
        { id: 'city', message: 'Please select city' }
    ];

    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element || !element.value.trim()) {
            if (element) {
                element.classList.add('is-invalid');
                const feedback = element.nextElementSibling;
                if (feedback && feedback.classList.contains('invalid-feedback')) {
                    feedback.textContent = field.message;
                }
            }
            isValid = false;
        }
    });

    // Validate gender selection
    const genderInputs = document.querySelectorAll('input[name="customRadio"]');
    const isGenderSelected = Array.from(genderInputs).some(input => input.checked);

    if (!isGenderSelected) {
        const genderFeedback = document.querySelector('.gender-feedback');
        if (genderFeedback) {
            genderFeedback.style.display = 'block';
        }
        isValid = false;
    } else {
        const genderFeedback = document.querySelector('.gender-feedback');
        if (genderFeedback) {
            genderFeedback.style.display = 'none';
        }
    }

    return isValid;
}

// Get form data for submission
function getProfileFormData() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const day = document.getElementById('dob-day').value;
    const month = document.getElementById('dob-month').value;
    const year = document.getElementById('dob-year').value;
    const country = document.getElementById('country').value;
    const city = document.getElementById('city').value;

    // Get selected gender
    const genderInputs = document.querySelectorAll('input[name="customRadio"]');
    const selectedGender = Array.from(genderInputs).find(input => input.checked);
    const gender = selectedGender ? selectedGender.value : '';

    // Format date of birth (YYYY-MM-DD)
    const dateOfBirth = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    // Get country name for submission
    const selectedCountryObj = allowedCountries.find(c => c.value === country);
    const countryName = selectedCountryObj ? selectedCountryObj.name : country;

    return {
        firstName: firstName,
        lastName: lastName,
        gender: gender,
        dateOfBirth: dateOfBirth,
        country: countryName,
        city: city,
        bio: "bio", // Assuming bio is not used in this form, set to null
        imageUrl: "image" // Assuming imageUrl is not used in this form, set to null
    };
}

// Submit profile form to API
async function submitProfileForm(formData) {
    const submitButton = document.querySelector('#profileForm button[type="submit"]');
    const originalButtonText = submitButton.textContent;

    try {
        // Show loading state
        submitButton.textContent = 'Saving Changes...';
        submitButton.disabled = true;

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

        // Console log the data being sent
        console.log('Sending profile data:', formData);
        console.log('API endpoint:', `${API_BASE_URL}/Profiles`);

        // Make API call
        const response = await fetch(`${API_BASE_URL}/Profiles`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        // Console log the response
        console.log('API response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            clearAuthData();
            window.location.href = '/pages/login.html';
            return;
        }

        if (!response.ok) {
            let errorMessage = 'Failed to update profile. Please try again.';

            // Try to parse error response
            try {
                const errorData = await response.json();
                console.log('Error response data:', errorData);
                console.log('Sent data that caused error:', formData);

                if (errorData && errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData && errorData.errors) {
                    // Handle validation errors
                    const errors = Object.values(errorData.errors).flat();
                    errorMessage = errors.join(', ');
                } else if (response.status === 400) {
                    errorMessage = 'Invalid data provided. Please check your inputs.';
                }
            } catch (jsonError) {
                console.log('Could not parse error response as JSON:', jsonError);
                // Use status-based error messages
                if (response.status === 400) {
                    errorMessage = 'Invalid data provided. Please check your inputs.';
                } else if (response.status === 500) {
                    errorMessage = 'Server error. Please try again later.';
                }
            }

            throw new Error(errorMessage);
        }

        // Success - handle response safely
        let responseData = null;
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            try {
                const responseText = await response.text();
                console.log('Raw response text:', responseText);

                if (responseText.trim()) {
                    responseData = JSON.parse(responseText);
                    console.log('Success response data:', responseData);
                } else {
                    console.log('Empty response body - profile updated successfully');
                }
            } catch (jsonError) {
                console.log('Could not parse success response as JSON:', jsonError);
                console.log('But request was successful based on status code');
            }
        } else {
            console.log('Response is not JSON format');
        }

        showToast('Profile updated successfully!', 'success');

        // Optionally reload the profile data to reflect any server-side changes
        setTimeout(() => {
            loadCurrentProfile();
        }, 1000);

    } catch (error) {
        console.error('Error updating profile:', error);
        showToast(error.message || 'Failed to update profile. Please try again.', 'error');
    } finally {
        // Reset button state
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    }
}

// Authentication helper functions
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

    return authData;
}

// Get auth token
function getAuthToken() {
    const authData = getAuthData();
    return authData ? authData.accessToken : null;
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

// Export functions for global access (if needed)
window.initializeProfileManagement = initializeProfileManagement;



