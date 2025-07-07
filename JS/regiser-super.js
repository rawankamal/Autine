document.addEventListener('DOMContentLoaded', function () {
    // Populate date of birth selectors
    populateDateSelectors();

    // Populate country and city selectors
    populateCountryAndCitySelectors();

    // Setup password visibility toggles
    setupPasswordToggles();

    // Handle profile picture upload
    setupProfilePicUpload();

    // Setup form validation and navigation
    setupFormNavigation();

    // Handle form submission
    setupFormSubmission();
});

// Define allowed countries (you can expand this list as needed)
const allowedCountries = [
    { value: 'US', name: 'United States' },
    { value: 'EG', name: 'Egypt' },
    { value: 'SA', name: 'Saudi Arabia' },
    { value: 'AE', name: 'United Arab Emirates' }
];

// Define cities for each country
const countryToCities = {
    'US': ['New York', 'Los Angeles', 'Chicago', 'Houston'],
    'EG': ['Cairo', 'Alexandria', 'Giza', 'Kafr Elshiekh'],
    'SA': ['Riyadh', 'Jeddah', 'Dammam', 'Mecca'],
    'AE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain']
};

// Get cities for a specific country
function getCitiesForCountry(countryValue) {
    return countryToCities[countryValue] || [];
}

// Populate country and city selectors
function populateCountryAndCitySelectors() {
    const country = document.getElementById('country');
    const city = document.getElementById('city');

    if (country) {
        // Clear existing options
        country.innerHTML = '';
        // Add a default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select Country';
        country.appendChild(defaultOption);

        // Add allowed countries
        allowedCountries.forEach(c => {
            const option = document.createElement('option');
            option.value = c.value;
            option.textContent = c.name;
            country.appendChild(option);
        });
    }

    // Populate city options based on selected country
    function populateCityOptions(selectedCountryValue, selectedCity = null) {
        if (!city) return;
        city.innerHTML = '';
        const cities = getCitiesForCountry(selectedCountryValue);

        // Add a default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select City';
        city.appendChild(defaultOption);

        cities.forEach(cityName => {
            const option = document.createElement('option');
            option.value = cityName;
            option.textContent = cityName;
            city.appendChild(option);
        });

        // Set selected city if provided
        if (selectedCity) {
            for (let i = 0; i < city.options.length; i++) {
                if (
                    city.options[i].value.toLowerCase() === selectedCity.toLowerCase() ||
                    city.options[i].textContent.toLowerCase() === selectedCity.toLowerCase()
                ) {
                    city.selectedIndex = i;
                    break;
                }
            }
        }
    }

    // Listen for country change to update cities
    if (country && city) {
        country.addEventListener('change', () => {
            populateCityOptions(country.value);
        });
    }
}

// Populate date selectors (days and years)
function populateDateSelectors() {
    // Populate Days (31 days)
    const daySelect = document.getElementById("dob-day");
    for (let i = 1; i <= 31; i++) {
        let option = document.createElement("option");
        option.value = i;
        option.text = i;
        daySelect.appendChild(option);
    }

    // Populate Years (last 80 years)
    const yearSelect = document.getElementById("dob-year");
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i >= currentYear - 80; i--) {
        let option = document.createElement("option");
        option.value = i;
        option.text = i;
        yearSelect.appendChild(option);
    }
}

// Setup password visibility toggles
function setupPasswordToggles() {
    const toggleRegisterPassword = document.getElementById('toggleRegisterPassword');
    const registerPassword = document.getElementById('registerPassword');

    toggleRegisterPassword.addEventListener('click', function () {
        togglePasswordVisibility(registerPassword, toggleRegisterPassword);
    });

    const toggleRegisterConfirmPassword = document.getElementById('toggleRegisterConfirmPassword');
    const registerConfirmPassword = document.getElementById('registerConfirmPassword');

    toggleRegisterConfirmPassword.addEventListener('click', function () {
        togglePasswordVisibility(registerConfirmPassword, toggleRegisterConfirmPassword);
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

// Setup profile picture upload functionality
function setupProfilePicUpload() {
    const fileInput = document.getElementById('fileInput');
    const profilePic = document.getElementById('profilePic');

    fileInput.addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                profilePic.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

// Setup form navigation between steps
function setupFormNavigation() {
    const steps = document.querySelectorAll('.step');

    // Step 1 validation and navigation
    document.getElementById('next-step-1').addEventListener('click', function () {
        if (validateStep1()) {
            goToStep(1);
        }
    });

    // Step 2 validation and navigation
    document.getElementById('next-step-2').addEventListener('click', function () {
        if (validateStep2()) {
            // Register supervisor before moving to verification step
            registerSupervisor();
        }
    });

    // Simulate verification process and move to profile step
    const verificationNextButton = document.querySelector('.step:nth-child(3) .next-step');
    if (verificationNextButton) {
        verificationNextButton.addEventListener('click', function (e) {
            e.preventDefault();
            showToast('Verifying your email...', 'info');

            // Simulate a short delay before moving to step 4
            setTimeout(() => {
                goToStep(3); // Step 4 is index 3 (0-based index)
            }, 1500);
        });
    }

    // Step 4 (profile) to final step
    const nextStep4Button = document.getElementById('next-step-4');
    if (nextStep4Button) {
        nextStep4Button.addEventListener('click', function (e) {
            e.preventDefault();
            if (validateStep4()) {
                updateSupervisorProfile();
            }
        });
    }

    // Skip profile button - redirect directly to supervisor.html
    const skipProfileButton = document.querySelector('.step:nth-child(4) .btn-outline-primary-500');
    if (skipProfileButton) {
        skipProfileButton.addEventListener('click', function (e) {
            e.preventDefault();
            showToast('Registration completed! Redirecting to supervisor panel...', 'success');
            setTimeout(() => {
                window.location.href = 'supervisor.html';
            }, 2000);
        });
    }
}

// Validate step 1 (personal details)
function validateStep1() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const gender = document.querySelector('input[name="customRadio"]:checked');

    if (!firstName) {
        showToast('Please enter your first name', 'error');
        return false;
    }

    if (!lastName) {
        showToast('Please enter your last name', 'error');
        return false;
    }

    if (!gender) {
        showToast('Please select your gender', 'error');
        return false;
    }

    return true;
}

// Validate step 2 (contact information)
function validateStep2() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const termsAccepted = document.getElementById('terms').checked;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showToast('Please enter a valid email address', 'error');
        return false;
    }

    // Password validation (at least 8 chars, 1 uppercase, 1 number, 1 special char)
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!password || !passwordRegex.test(password)) {
        showToast('Password must be at least 8 characters with 1 uppercase letter, 1 number, and 1 special character', 'error');
        return false;
    }

    // Confirm password validation
    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return false;
    }

    // Terms acceptance validation
    if (!termsAccepted) {
        showToast('Please accept the Terms of Use and Privacy Policy', 'error');
        return false;
    }

    return true;
}

// Validate step 4 (profile information)
function validateStep4() {
    const country = document.getElementById('country').value;
    const city = document.getElementById('city').value;
    const bio = document.getElementById('bio').value.trim();

    if (!country) {
        showToast('Please select your country', 'error');
        return false;
    }

    if (!city) {
        showToast('Please select your city', 'error');
        return false;
    }

    if (!bio) {
        showToast('Please enter your bio', 'error');
        return false;
    }

    return true;
}

// Navigate to specified step
function goToStep(stepIndex) {
    const steps = document.querySelectorAll('.step');

    steps.forEach((step, index) => {
        step.classList.remove('active');
    });

    steps[stepIndex].classList.add('active');

    // If going to congratulations step, set the username
    if (stepIndex === 4) {
        const firstName = document.getElementById('firstName').value.trim();
        document.getElementById('username').textContent = firstName;
    }
}

// Setup form submission
function setupFormSubmission() {
    const form = document.getElementById('registerForm');

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        // Final form submission is handled by the update profile or skip buttons
    });
}

// Register supervisor with the API
function registerSupervisor() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('registerPassword').value;

    const day = document.getElementById('dob-day').value;
    const month = document.getElementById('dob-month').value;
    const year = document.getElementById('dob-year').value;
    const dob = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T01:01:01Z`;

    // Get gender
    const gender = document.querySelector('input[name="customRadio"]:checked').value;

    // Generate a username from first name + random numbers
    const username = `${firstName.toLowerCase()}${Math.floor(Math.random() * 1000)}`;

    const supervisorData = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        userName: username,
        password: password,
        gender: gender,
        bio: null, // Will be updated in profile step
        country: "country", // Will be updated in profile step
        city: "city", // Will be updated in profile step
        superviorRole: "Doctor", // Always set to Doctor for supervisors
        dateOfBirth: dob
    };

    showToast('Processing supervisor registration...', 'info');

    fetch('https://autine-back.runasp.net/auths/supervisor-register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(supervisorData)
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else if (response.status === 400) {
                return response.json().then(data => {
                    throw new Error(data.detail || 'Bad Request');
                });
            } else if (response.status === 409) {
                return response.json().then(data => {
                    throw new Error(data.detail || 'Conflict occurred');
                });
            } else {
                throw new Error('Supervisor registration failed. Please try again.');
            }
        })
        .then(data => {
            if (data.code && data.userId) {
                console.log("Token received:", data.code); // For debugging

                localStorage.setItem("authToken", data.code); // Save token for later use
                localStorage.setItem('registeredUserId', data.userId);
                localStorage.setItem('registeredEmail', email);

                // Fetch access token after successful registration
                fetchAccessToken(email, password, data.userId, data.code);

                showToast('Supervisor registration successful! Please check your email to verify your account.', 'success');
                goToStep(2); // Move to verification step
            } else {
                throw new Error('Unexpected response format');
            }
        })
        .catch(error => {
            showToast(error.message, 'error');
            console.error("Supervisor registration error:", error);
        });
    console.log("Sending supervisor data:", JSON.stringify(supervisorData, null, 2)); // For debugging
}

// Fetch access token after registration and confirm email
function fetchAccessToken(email, password, userId, code) {
    // Confirm email before fetching access token
    if (!userId || !code) {
        console.error("Missing userId or code for email confirmation."); // For debugging
        return;
    }
    console.log("Confirming email with:", { userId, code }); // For debugging
    fetch('https://autine-back.runasp.net/auths/confirm-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: userId, code: code })
    })
        .then(response => {
            if (response.ok) {
                showToast('Email confirmed successfully!', 'success');
                console.log("Email confirmed successfully!"); // For debugging
                // Proceed to fetch access token
                return fetch('https://autine-back.runasp.net/auths/get-token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: email, password: password })
                });
            } else if (response.status === 400) {
                return response.json().then(data => {
                    console.error("Email confirmation error:", data); // For debugging
                    throw new Error(data.detail || 'Invalid confirmation details');
                });
            } else {
                throw new Error('Failed to confirm email. Please try again.');
            }
        })
        .then(response => {
            if (response.ok) {
                console.log("Fetching access token..."); // For debugging
                return response.json();
            } else if (response.status === 400) {
                return response.json().then(data => {
                    console.error("Access token error:", data); // For debugging
                    throw new Error(data.detail || 'Invalid credentials');
                });
            } else {
                throw new Error('Failed to fetch access token. Please try again.');
            }
        })
        .then(data => {
            if (data.accessToken) {
                console.log("Access Token:", data.accessToken); // For debugging
                localStorage.setItem("accessToken", data.accessToken);
                localStorage.setItem("refreshToken", data.refreshToken);
                showToast('Access token retrieved successfully!', 'success');
            } else {
                console.error("Unexpected response format:", data); // For debugging
                throw new Error('Unexpected response format');
            }
        })
        .catch(error => {
            console.error("Error during email confirmation or token retrieval:", error); // For debugging
            showToast(error.message, 'error');
        });
}

// Update supervisor profile
function updateSupervisorProfile() {
    const country = document.getElementById('country').value;
    const city = document.getElementById('city').value;
    const bio = document.getElementById('bio').value.trim();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const gender = document.querySelector('input[name="customRadio"]:checked').value;
    const day = document.getElementById('dob-day').value;
    const month = document.getElementById('dob-month').value;
    const year = document.getElementById('dob-year').value;
    const dateOfBirth = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T01:01:01Z`;

    const userId = localStorage.getItem('registeredUserId');
    const accessToken = localStorage.getItem('accessToken');

    if (!userId || !accessToken) {
        showToast('Supervisor not authenticated. Please log in again.', 'error');
        console.error("Missing userId or accessToken:", { userId, accessToken }); // For debugging
        return;
    }

    const profileData = {
        firstName: firstName,
        lastName: lastName,
        bio: bio,
        country: country || null,
        city: city || null,
        gender: gender,
        dateOfBirth: dateOfBirth
    };

    showToast('Updating supervisor profile...', 'info');
    console.log("Sending supervisor profile update with token:", accessToken); // For debugging

    fetch('https://autine-back.runasp.net/api/Profiles', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(profileData)
    })
        .then(response => {
            console.log("Supervisor profile update response status:", response.status); // For debugging

            if (response.ok) {
                // Check if the response has content before trying to parse it
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json") && response.headers.get("content-length") !== "0") {
                    return response.json().catch(e => {
                        console.warn("Could not parse JSON response, but request was successful", e);
                        return {}; // Return empty object if JSON parsing fails
                    });
                } else {
                    return {}; // Return empty object for non-JSON or empty responses
                }
            } else if (response.status === 401) {
                throw new Error('Authentication failed. Please log in again.');
            } else if (response.status === 400) {
                return response.text().then(text => {
                    try {
                        const data = JSON.parse(text);
                        throw new Error(data.detail || 'Invalid profile data');
                    } catch (e) {
                        throw new Error('Invalid profile data');
                    }
                });
            } else {
                throw new Error('Failed to update supervisor profile. Please try again.');
            }
        })
        .then(data => {
            showToast('Supervisor profile updated successfully!', 'success');
            updateProfilePicture();
        })
        .catch(error => {
            showToast(error.message, 'error');
            console.error("Supervisor profile update error:", error); // For debugging

            // Despite the error, still try to update the profile picture
            updateProfilePicture();
        });
}

// Update profile picture
function updateProfilePicture() {
    const profileImageInput = document.getElementById('fileInput');
    const previewImage = document.getElementById('profilePic');
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
        showToast('Supervisor not authenticated. Please log in again.', 'error');
        console.error("Missing accessToken"); // For debugging
        return;
    }

    const file = profileImageInput.files[0];
    if (!file) {
        // If no file selected, still redirect to supervisor.html
        showToast('Registration completed successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'supervisor.html';
        }, 2000);
        return;
    }

    // Check if file is an image
    if (!file.type.match('image.*')) {
        showToast('Please select an image file.', 'error');
        return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB.', 'error');
        return;
    }

    // Create FormData
    const formData = new FormData();
    formData.append('Image', file);

    // Send request to the server
    fetch('https://autine-back.runasp.net/api/Profiles/change-profile-picture', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        },
        body: formData
    })
        .then(response => {
            if (response.status === 204) {
                // Success case
                showToast('Profile picture updated successfully! Redirecting to supervisor panel...', 'success');

                // Update preview image
                const reader = new FileReader();
                reader.onload = function (e) {
                    previewImage.src = e.target.result;
                };
                reader.readAsDataURL(file);

                // Redirect to supervisor.html after 2 seconds
                setTimeout(() => {
                    window.location.href = 'supervisor.html';
                }, 2000);
            } else {
                // Handle error responses
                return response.json().then(data => {
                    throw new Error(data.detail || 'Failed to upload profile picture');
                });
            }
        })
        .catch(error => {
            showToast(error.message || 'An error occurred during upload.', 'error');
            console.error("Profile picture update error:", error); // For debugging

            // Even if profile picture upload fails, still redirect after showing error
            setTimeout(() => {
                window.location.href = 'supervisor.html';
            }, 3000);
        });
}


// Display toast notifications
function showToast(message, type) {
    const bgColor = type === 'error' ? '#FF4B4B' :
        type === 'success' ? '#3B918C' :
            type === 'info' ? '#B8CC66' : '#DBE5B1';

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