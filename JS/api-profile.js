/**
 * api-profile.js - Profile API interactions
 * Handles profile data operations - fetching, updating profile info and password
 */

// Base API URL
const API_BASE_URL = 'https://autine-back.runasp.net';

// Get auth token from storage (localStorage or sessionStorage)
function getAuthToken() {
    // Try localStorage first, then sessionStorage, then check for authToken key
    let authData = localStorage.getItem('authData') || sessionStorage.getItem('authData');

    if (authData) {
        try {
            const parsed = JSON.parse(authData);
            return parsed.accessToken;
        } catch (e) {
            console.warn('Failed to parse authData, trying direct token');
        }
    }

    // Fallback to direct token storage (consistent with api-chat.js)
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

// Helper function to safely parse JSON responses
async function safeJsonParse(response) {
    const text = await response.text();
    if (!text.trim()) {
        return null;
    }
    try {
        return JSON.parse(text);
    } catch (e) {
        console.warn('Failed to parse JSON response:', text);
        return null;
    }
}

// Helper function to get stored profile picture
function getStoredProfilePicture() {
    return localStorage.getItem('userProfilePicture') || sessionStorage.getItem('userProfilePicture');
}

// Helper function to store profile picture
function storeProfilePicture(pictureUrl) {
    if (pictureUrl) {
        localStorage.setItem('userProfilePicture', pictureUrl);
        sessionStorage.setItem('userProfilePicture', pictureUrl);
    } else {
        localStorage.removeItem('userProfilePicture');
        sessionStorage.removeItem('userProfilePicture');
    }
}

// Helper function to load authenticated image nn
async function loadAuthenticatedImage(imageUrl) {
    const token = getAuthToken();

    if (!token || !imageUrl) {
        return null;
    }

    try {
        console.log('Fetching authenticated image:', imageUrl);
        const response = await fetch(imageUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'image/*'
            }
        });

        console.log('Image fetch response status:', response.status);

        if (response.ok) {
            const blob = await response.blob();
            console.log('Blob created, size:', blob.size, 'type:', blob.type);

            // Convert blob to base64 data URL instead of blob URL
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
        } else {
            console.warn('Failed to load authenticated image:', response.status, response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Error loading authenticated image:', error);
        return null;
    }
}

// Helper function to update profile picture in UI
// Update images with proper error handling
userImg.forEach((img, index) => {
    console.log(`Setting user-img[${index}] src to:`, authenticatedUrl);

    // Use a small delay to ensure blob is ready
    setTimeout(() => {
        img.src = authenticatedUrl;
        img.onload = function () {
            console.log(`user-img[${index}] loaded successfully`);
        };
        img.onerror = function (e) {
            console.error(`Failed to load user-img[${index}]:`, e);
            console.error('Error details:', this.src);
            this.src = defaultImg;
        };
    }, 10);
});

if (userPic) {
    console.log('Setting user-pic src to:', authenticatedUrl);

    // Use a small delay to ensure blob is ready
    setTimeout(() => {
        userPic.src = authenticatedUrl;
        userPic.onload = function () {
            console.log('user-pic loaded successfully');
        };
        userPic.onerror = function (e) {
            console.error('Failed to load user-pic:', e);
            console.error('Error details:', this.src);
            this.src = defaultImg;
        };
    }, 10);
}


// Helper function to update profile picture in UI
// Helper function to update profile picture in UI
async function updateProfilePictureUI(imageUrl) {
    const defaultImg = '../images/user.png';

    // Update all user images
    const userImg = document.querySelectorAll('.user-img');
    const userPic = document.querySelector('.user-pic');

    console.log('Updating profile picture UI with URL:', imageUrl);
    console.log('Found user-img elements:', userImg.length);
    console.log('Found user-pic element:', userPic ? 'Yes' : 'No');

    if (!imageUrl) {
        // Use default image
        console.log('No image URL provided, using default');
        userImg.forEach(img => {
            img.src = defaultImg;
        });
        if (userPic) userPic.src = defaultImg;
        return;
    }

    // Check if the URL is from your API (requires authentication)
    if (imageUrl.includes('autine-back.runasp.net')) {
        console.log('Loading authenticated image...');

        // Try to load the authenticated image
        const dataUrl = await loadAuthenticatedImage(imageUrl);

        if (dataUrl) {
            console.log('Successfully loaded authenticated image as data URL');

            // Update images directly with data URL
            userImg.forEach((img, index) => {
                console.log(`Setting user-img[${index}] src to data URL`);
                img.src = dataUrl;
                img.onload = function () {
                    console.log(`user-img[${index}] loaded successfully`);
                };
                img.onerror = function (e) {
                    console.error(`Failed to load user-img[${index}]:`, e);
                    this.src = defaultImg;
                };
            });

            if (userPic) {
                console.log('Setting user-pic src to data URL');
                userPic.src = dataUrl;
                userPic.onload = function () {
                    console.log('user-pic loaded successfully');
                };
                userPic.onerror = function (e) {
                    console.error('Failed to load user-pic:', e);
                    this.src = defaultImg;
                };
            }

            // Store the original URL
            storeProfilePicture(imageUrl);
        } else {
            console.warn('Failed to load authenticated image, using default');
            userImg.forEach(img => {
                img.src = defaultImg;
            });
            if (userPic) userPic.src = defaultImg;
        }
    } else {
        // Regular image URL (not authenticated)
        console.log('Loading regular image...');

        userImg.forEach((img, index) => {
            img.src = imageUrl;
            img.onload = function () {
                console.log(`user-img[${index}] loaded successfully (direct)`);
            };
            img.onerror = function (e) {
                console.error(`Failed to load user-img[${index}] (direct):`, e);
                this.src = defaultImg;
            };
        });

        if (userPic) {
            userPic.src = imageUrl;
            userPic.onload = function () {
                console.log('user-pic loaded successfully (direct)');
            };
            userPic.onerror = function (e) {
                console.error('Failed to load user-pic (direct):', e);
                this.src = defaultImg;
            };
        }

        // Store the image URL
        storeProfilePicture(imageUrl);
    }
}

/**
 * Get current user profile
 * @returns {Promise} - Promise with user profile data
 */
async function getUserProfile() {
    const token = getAuthToken();

    if (!token) {
        console.error('No auth token found');
        showErrorToast('Please log in to access your profile.');
        return null;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/Profiles`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            console.error('Unauthorized - token may be expired');
            showErrorToast('Your session has expired. Please log in again.');
            return null;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch profile data`);
        }

        const profileData = await safeJsonParse(response);

        if (profileData) {
            console.log('Profile data received:', profileData); // Debug log

            // Update profile picture immediately
            if (profileData.profilePicture) {
                console.log('Profile picture URL from server:', profileData.profilePicture); // Debug log
                await updateProfilePictureUI(profileData.profilePicture);
            } else {
                // Try to use stored profile picture or default
                const storedPicture = getStoredProfilePicture();
                if (storedPicture) {
                    console.log('Using stored profile picture:', storedPicture); // Debug log
                    await updateProfilePictureUI(storedPicture);
                } else {
                    console.log('No profile picture found, using default'); // Debug log
                    await updateProfilePictureUI(null);
                }
            }

            // Populate form with profile data
            populateProfileForm(profileData);
        }

        return profileData;
    } catch (error) {
        console.error('Error fetching profile:', error);
        showErrorToast('Failed to load profile data. Please refresh and try again.');
        return null;
    }
}

/**
 * Populate profile form with user data
 * @param {Object} profileData - User profile data from API
 */
function populateProfileForm(profileData) {
    // Get form elements
    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    const dobDay = document.getElementById('dob-day');
    const dobMonth = document.getElementById('dob-month');
    const dobYear = document.getElementById('dob-year');
    const female = document.getElementById('female');
    const male = document.getElementById('male');
    const bio = document.getElementById('bio');
    const country = document.getElementById('country');
    const city = document.getElementById('city');

    // Set form values if elements exist
    if (profileData.firstName && firstName) firstName.value = profileData.firstName;
    if (profileData.lastName && lastName) lastName.value = profileData.lastName;

    // Profile picture is handled in getUserProfile() for immediate display

    // Set date of birth if it exists
    if (profileData.dateOfBirth) {
        const dob = new Date(profileData.dateOfBirth);

        if (dobDay) dobDay.value = dob.getDate();
        if (dobMonth) dobMonth.value = dob.getMonth() + 1; // Months are 0-indexed
        if (dobYear) dobYear.value = dob.getFullYear();
    }

    // Set gender
    if (profileData.gender) {
        if (profileData.gender.toLowerCase() === 'female' && female) {
            female.checked = true;
        } else if (profileData.gender.toLowerCase() === 'male' && male) {
            male.checked = true;
        }
    }

    // Set bio
    if (profileData.bio && bio) bio.value = profileData.bio;

    // Set country and city for fixed list: Egypt, USA, UAE, KSA, each with 4 cities
    const allowedCountries = [
        { value: 'EG', name: 'Egypt', cities: ['Cairo', 'Alexandria', 'Giza', 'Kafr Elshiekh'] },
        { value: 'US', name: 'USA', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston'] },
        { value: 'AE', name: 'UAE', cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain'] },
        { value: 'SA', name: 'KSA', cities: ['Riyadh', 'Jeddah', 'Dammam', 'Mecca'] }
    ];

    // Helper to get cities for a country value
    function getCitiesForCountry(countryValue) {
        const countryObj = allowedCountries.find(c => c.value === countryValue);
        return countryObj ? countryObj.cities : [];
    }

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

        // Set selected country if present in profileData
        if (profileData.country) {
            // Try to match by value or name (case-insensitive)
            for (let i = 0; i < country.options.length; i++) {
                if (
                    country.options[i].value.toLowerCase() === profileData.country.toLowerCase() ||
                    country.options[i].textContent.toLowerCase() === profileData.country.toLowerCase()
                ) {
                    country.selectedIndex = i;
                    // Trigger change event to populate cities if needed
                    const event = new Event('change');
                    country.dispatchEvent(event);
                    break;
                }
            }
        }
    }

    // Populate city options based on selected country
    function populateCityOptions(selectedCountryValue, selectedCity) {
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
            populateCityOptions(country.value, null);
        });
    }

    // Set city if present
    if (profileData.city && city && country) {
        // Wait for city options to be populated if needed
        const cityInterval = setInterval(() => {
            if (country.value) {
                populateCityOptions(country.value, profileData.city);
                clearInterval(cityInterval);
            }
        }, 200);
    }
}

/**
 * Submit profile form to update user profile
 */
async function submitProfileForm() {
    const token = getAuthToken();

    if (!token) {
        console.error('No auth token found');
        showErrorToast('Please log in to update your profile.');
        return false;
    }

    // Get form values
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;

    // Get DOB values
    const day = document.getElementById('dob-day').value;
    const month = document.getElementById('dob-month').value;
    const year = document.getElementById('dob-year').value;

    // Create date string in ISO format
    const dob = new Date(year, month - 1, day); // Month is 0-indexed
    const dateOfBirth = dob.toISOString();

    // Get gender
    const female = document.getElementById('female');
    const gender = female.checked ? 'female' : 'male';

    // Get bio
    const bio = document.getElementById('bio').value;

    // Get country and city
    const country = document.getElementById('country').value;
    const city = document.getElementById('city').value;

    // Create profile data object
    const profileData = {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        bio,
        country,
        city
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/Profiles`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });

        if (response.status === 401) {
            console.error('Unauthorized - token may be expired');
            showErrorToast('Your session has expired. Please log in again.');
            return false;
        }

        if (!response.ok) {
            const errorData = await safeJsonParse(response);
            throw new Error(errorData?.message || `HTTP ${response.status}: Failed to update profile`);
        }

        // Show success message
        showSuccessToast('Profile updated successfully');

        // Close modal if exists
        const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
        if (modal) modal.hide();

        return true;
    } catch (error) {
        console.error('Error updating profile:', error);
        showErrorToast(error.message || 'Failed to update profile. Please try again.');
        return false;
    }
}

/**
 * Change user password
 */
async function changePassword() {
    const token = getAuthToken();

    if (!token) {
        console.error('No auth token found');
        showErrorToast('Please log in to change your password.');
        return false;
    }

    // Get password values
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    // Create password data object
    const passwordData = {
        currentPassword,
        newPassword
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/Profiles/change-password`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(passwordData)
        });

        if (response.status === 401) {
            console.error('Unauthorized - token may be expired');
            showErrorToast('Your session has expired. Please log in again.');
            return false;
        }

        if (!response.ok) {
            const errorData = await safeJsonParse(response);
            throw new Error(errorData?.message || `HTTP ${response.status}: Failed to change password`);
        }

        // Clear password fields
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';

        // Show success message
        showSuccessToast('Password changed successfully');

        // Close modal if exists
        const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
        if (modal) modal.hide();

        return true;
    } catch (error) {
        console.error('Error changing password:', error);
        showErrorToast(error.message || 'Failed to change password. Please try again.');
        return false;
    }
}

/**
 * Update profile picture
 * @param {File} imageFile - Image file to upload
 */
async function changeProfilePicture(imageFile) {
    const token = getAuthToken();

    if (!token) {
        console.error('No auth token found');
        showErrorToast('Please log in to update your profile picture.');
        return false;
    }

    // Create form data
    const formData = new FormData();
    formData.append('Image', imageFile);

    try {
        const response = await fetch(`${API_BASE_URL}/api/Profiles/change-profile-picture`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
                // Content-Type is automatically set by the browser for FormData
            },
            body: formData
        });

        if (response.status === 401) {
            console.error('Unauthorized - token may be expired');
            showErrorToast('Your session has expired. Please log in again.');
            return false;
        }

        if (response.status === 204) {
            // Success case - 204 No Content
            // Create a local preview URL for immediate display
            const imageUrl = URL.createObjectURL(imageFile);
            await updateProfilePictureUI(imageUrl);

            // Show success message
            showSuccessToast('Profile picture updated successfully');
            return true;
        }

        if (!response.ok) {
            const errorData = await safeJsonParse(response);
            throw new Error(errorData?.detail || errorData?.message || `HTTP ${response.status}: Failed to update profile picture`);
        }

        const data = await safeJsonParse(response);

        // Update profile picture in UI with server response
        if (data && data.profilePicture) {
            console.log('New profile picture URL from server:', data.profilePicture); // Debug log
            await updateProfilePictureUI(data.profilePicture);
        } else {
            // If no URL in response, create local preview
            const imageUrl = URL.createObjectURL(imageFile);
            await updateProfilePictureUI(imageUrl);
        }

        // Show success message
        showSuccessToast('Profile picture updated successfully');

        return true;
    } catch (error) {
        console.error('Error updating profile picture:', error);
        showErrorToast(error.message || 'Failed to update profile picture. Please try again.');
        return false;
    }
}

/**
 * Delete user account
 */
async function deleteAccount() {
    const token = getAuthToken();

    if (!token) {
        console.error('No auth token found');
        showErrorToast('Please log in to delete your account.');
        return false;
    }

    // Get current password for verification
    const currentPassword = document.getElementById('currentPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/Profiles`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currentPassword })
        });

        if (response.status === 401) {
            console.error('Unauthorized - token may be expired');
            showErrorToast('Your session has expired. Please log in again.');
            return false;
        }

        if (!response.ok) {
            const errorData = await safeJsonParse(response);
            throw new Error(errorData?.message || `HTTP ${response.status}: Failed to delete account`);
        }

        // Clear auth tokens and profile picture from all possible locations
        localStorage.removeItem('authToken');
        localStorage.removeItem('authData');
        localStorage.removeItem('userProfilePicture');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('authData');
        sessionStorage.removeItem('userProfilePicture');

        // Show success message
        showSuccessToast('Account deleted successfully');

        // Redirect to login page after short delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);

        return true;
    } catch (error) {
        console.error('Error deleting account:', error);
        showErrorToast(error.message || 'Failed to delete account. Please try again.');
        return false;
    }
}

// Event listener for profile picture upload
document.addEventListener('DOMContentLoaded', () => {
    const profilePicInput = document.getElementById('profile-pic');

    if (profilePicInput) {
        profilePicInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];

                // Check file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showErrorToast('Profile picture must be less than 5MB');
                    return;
                }

                // Check file type
                if (!file.type.match('image.*')) {
                    showErrorToast('Please select an image file');
                    return;
                }

                // Upload profile picture
                changeProfilePicture(file);
            }
        });
    }

    // Setup delete photo button
    const deletePhotoButton = document.querySelector('.btn-text-error');
    if (deletePhotoButton) {
        deletePhotoButton.addEventListener('click', async () => {
            const token = getAuthToken();

            if (!token) {
                showErrorToast('Please log in to remove your profile picture.');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/Profiles/change-profile-picture`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                        // No Content-Type, no body
                    }
                });

                if (response.status === 401) {
                    showErrorToast('Your session has expired. Please log in again.');
                    return;
                }

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: Failed to remove profile picture`);
                }

                // Update UI to default image and clear stored picture
                await updateProfilePictureUI(null);

                showSuccessToast('Profile picture removed successfully');
            } catch (error) {
                console.error('Error removing profile picture:', error);
                showErrorToast('Failed to remove profile picture. Please try again.');
            }
        });
    }

    // Load profile data when page loads
    getUserProfile();

    // Debug function - you can call this in browser console to test image loading
    window.testProfileImage = async function (imageUrl) {
        console.log('Testing profile image:', imageUrl);
        await updateProfilePictureUI(imageUrl);
    };

    // Debug function to test direct image loading without authentication
    window.testDirectImage = function (imageUrl) {
        console.log('Testing direct image (no auth):', imageUrl);
        // const userImg = document.querySelectorAll('.user-img');
        const userPic = document.querySelector('.user-pic');

        userImg.forEach((img, index) => {
            console.log(`Setting user-img[${index}] directly to:`, imageUrl);
            img.src = imageUrl;
            img.onload = () => console.log(`Direct load success for user-img[${index}]`);
            img.onerror = (e) => console.error(`Direct load failed for user-img[${index}]:`, e);
        });

        if (userPic) {
            console.log('Setting user-pic directly to:', imageUrl);
            userPic.src = imageUrl;
            userPic.onload = () => console.log('Direct load success for user-pic');
            userPic.onerror = (e) => console.error('Direct load failed for user-pic:', e);
        }
    };

    // Debug function to check HTML elements
    window.checkElements = function () {
        // const userImg = document.querySelectorAll('.user-img');
        const userPic = document.querySelector('.user-pic');
        console.log('Found user-img elements:', userImg.length);
        console.log('Found user-pic element:', userPic ? 'Yes' : 'No');

        userImg.forEach((img, index) => {
            console.log(`user-img[${index}]:`, img, 'current src:', img.src);
        });

        if (userPic) {
            console.log('user-pic:', userPic, 'current src:', userPic.src);
        }
    };

    // Cleanup blob URLs when page unloads
    window.addEventListener('beforeunload', () => {
        blobUrlCache.forEach((cached) => {
            const blobUrl = cached.url || cached;
            URL.revokeObjectURL(blobUrl);
        });
        blobUrlCache.clear();
    });

    // Cleanup function - call this when needed
    window.cleanupProfileImages = function () {
        blobUrlCache.forEach((blobUrl) => {
            URL.revokeObjectURL(blobUrl);
        });
        blobUrlCache.clear();
        activeBlobRefs.clear();
    };

    // Cleanup on page unload
    window.addEventListener('beforeunload', window.cleanupProfileImages);
});