// settings modal JS
// Document ready function
document.addEventListener('DOMContentLoaded', function () {
    // Initialize date of birth dropdowns
    initDateOfBirthDropdowns();

    // Initialize country and city dropdowns
    initCountryCityDropdowns();

    // Initialize password toggles
    initPasswordToggles();

    // Initialize notification toggle
    initNotificationToggle();
});

// Initialize date of birth dropdowns
function initDateOfBirthDropdowns() {
    // Populate days
    const daySelect = document.getElementById('dob-day');
    if (daySelect) {
        // Add placeholder option
        const placeholderOption = document.createElement('option');
        placeholderOption.value = "";
        placeholderOption.textContent = "Day";
        placeholderOption.selected = true;
        daySelect.appendChild(placeholderOption);

        // Add days 1-31
        for (let i = 1; i <= 31; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            daySelect.appendChild(option);
        }
    }

    // Populate years
    const yearSelect = document.getElementById('dob-year');
    if (yearSelect) {
        // Add placeholder option
        const placeholderOption = document.createElement('option');
        placeholderOption.value = "";
        placeholderOption.textContent = "Year";
        placeholderOption.selected = true;
        yearSelect.appendChild(placeholderOption);

        // Add years (current year - 100) to current year
        const currentYear = new Date().getFullYear();
        for (let i = currentYear; i >= currentYear - 100; i--) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            yearSelect.appendChild(option);
        }
    }

    // Add placeholder to month dropdown if it doesn't have one
    const monthSelect = document.getElementById('dob-month');
    if (monthSelect && !monthSelect.querySelector('option[value=""]')) {
        const placeholderOption = document.createElement('option');
        placeholderOption.value = "";
        placeholderOption.textContent = "Month";
        placeholderOption.selected = true;
        monthSelect.prepend(placeholderOption);
    }
}

// Initialize country and city dropdowns
function initCountryCityDropdowns() {
    const countrySelect = document.getElementById('country');
    const citySelect = document.getElementById('city');

    if (countrySelect) {
        // Sample countries - replace with your own list or API call
        const countries = [
            { code: "", name: "Select Country" },
            { code: "EG", name: "Egypt" },
            { code: "SA", name: "Saudi Arabia" },
            { code: "AE", name: "United Arab Emirates" },
            { code: "US", name: "United States" },
        ];

        // Populate countries
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.code;
            option.textContent = country.name;
            countrySelect.appendChild(option);
        });

        // Handle country change
        countrySelect.addEventListener('change', function () {
            updateCities(this.value);
        });
    }

    function updateCities(countryCode) {
        if (citySelect) {
            // Clear existing options
            citySelect.innerHTML = '';

            // Add placeholder
            const placeholderOption = document.createElement('option');
            placeholderOption.value = "";
            placeholderOption.textContent = "Select City";
            citySelect.appendChild(placeholderOption);

            // Sample cities by country - replace with your own data or API
            const citiesByCountry = {
                "EG": ["Cairo", "Alexandria", "Giza", "Kafr El Sheikh", "Luxor", "Aswan", "Hurghada"],
                "SA": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Al Khobar", "Tabuk"],
                "AE": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Al Ain"],
                "US": ["New York", "Los Angeles", "Chicago", "Houston", "Miami", "San Francisco", "Washington DC"]
            };

            if (countryCode && citiesByCountry[countryCode]) {
                citiesByCountry[countryCode].forEach(city => {
                    const option = document.createElement('option');
                    option.value = city;
                    option.textContent = city;
                    citySelect.appendChild(option);
                });
            }
        }
    }
}

// Initialize password toggle visibility
function initPasswordToggles() {
    const togglePasswordElements = [
        { inputId: 'currentPassword', toggleId: 'toggleCurrentPassword' },
        { inputId: 'newPassword', toggleId: 'toggleNewPassword' },
        { inputId: 'confirmPassword', toggleId: 'toggleConfirmPassword' },
        { inputId: 'password', toggleId: null } // For delete account section
    ];

    togglePasswordElements.forEach(element => {
        const input = document.getElementById(element.inputId);
        const toggle = element.toggleId ? document.getElementById(element.toggleId) : null;

        if (input && toggle) {
            toggle.addEventListener('click', function () {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);

                // Toggle icon
                this.classList.toggle('bi-eye');
                this.classList.toggle('bi-eye-slash');
            });
        }
    });
}

// Initialize notification toggle
function initNotificationToggle() {
    const notificationToggle = document.getElementById('notificationToggle');
    if (notificationToggle) {
        notificationToggle.addEventListener('click', function () {
            this.classList.toggle('bi-toggle-on');
            this.classList.toggle('bi-toggle-off');

            // You could save the notification preference here
            const notificationsEnabled = this.classList.contains('bi-toggle-on');
            console.log('Notifications enabled:', notificationsEnabled);

            // Optional: Show feedback to the user
            const feedbackMessage = notificationsEnabled ?
                'Notifications enabled' : 'Notifications disabled';
            showToast(feedbackMessage);
        });
    }
}

// Profile picture upload functionality
document.addEventListener('DOMContentLoaded', function () {
    const profilePicInput = document.getElementById('profile-pic');
    const profileImg = document.querySelector('.therapist-pic');

    if (profilePicInput && profileImg) {
        profilePicInput.addEventListener('change', function (event) {
            const file = event.target.files[0];
            if (file) {
                // Validate file (optional)
                const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!validImageTypes.includes(file.type)) {
                    showToast('Please select a valid image file (JPEG, PNG, GIF)');
                    return;
                }

                // Update profile picture preview
                const reader = new FileReader();
                reader.onload = function (e) {
                    profileImg.src = e.target.result;
                };
                reader.readAsDataURL(file);

                // Here you could implement code to upload the image to your server
                console.log('Profile picture selected:', file.name);
            }
        });

        // Delete profile picture button
        const deletePhotoButton = document.querySelector('.btn-text-error');
        if (deletePhotoButton) {
            deletePhotoButton.addEventListener('click', function (e) {
                e.preventDefault();
                profileImg.src = '../images/user.png'; // Reset to default image
                profilePicInput.value = ''; // Clear the file input
                showToast('Profile picture removed');
            });
        }
    }
});

// Form submission handling
document.addEventListener('DOMContentLoaded', function () {
    const profileForm = document.querySelector('#v-pills-profile form');
    if (profileForm) {
        profileForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Validate form
            if (validateProfileForm()) {
                // Collect form data
                const formData = {
                    firstName: document.getElementById('firstName').value,
                    lastName: document.getElementById('lastName').value,
                    dob: {
                        day: document.getElementById('dob-day').value,
                        month: document.getElementById('dob-month').value,
                        year: document.getElementById('dob-year').value
                    },
                    gender: document.querySelector('input[name="customRadio"]:checked')?.value,
                    bio: document.getElementById('bio').value,
                    country: document.getElementById('country').value,
                    city: document.getElementById('city').value
                };

                console.log('Profile form data:', formData);

                // Here you would typically send the data to your server
                // For now, just show a success message
                showToast('Profile updated successfully!');
            }
        });
    }

    // Change password form handling
    const passwordForm = document.querySelector('form[action="changePassword"]');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function (e) {
            e.preventDefault();

            if (validatePasswordForm()) {
                // Here you would typically send the data to your server
                // For now, just show a success message
                showToast('Password changed successfully!');
            }
        });
    }
});

// Validation functions
function validateProfileForm() {
    const requiredFields = [
        { id: 'firstName', label: 'First Name' },
        { id: 'lastName', label: 'Last Name' },
        { id: 'bio', label: 'Bio' },
        { id: 'country', label: 'Country' },
        { id: 'city', label: 'City' }
    ];

    // Check required text fields
    for (const field of requiredFields) {
        const element = document.getElementById(field.id);
        if (!element || !element.value.trim()) {
            showToast(`${field.label} is required`);
            if (element) element.focus();
            return false;
        }
    }

    // Check DOB
    const dobDay = document.getElementById('dob-day').value;
    const dobMonth = document.getElementById('dob-month').value;
    const dobYear = document.getElementById('dob-year').value;
    if (!dobDay || !dobMonth || !dobYear) {
        showToast('Date of birth is required');
        return false;
    }

    // Check gender
    const gender = document.querySelector('input[name="customRadio"]:checked');
    if (!gender) {
        showToast('Gender selection is required');
        return false;
    }

    return true;
}

function validatePasswordForm() {
    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    if (!currentPassword || !currentPassword.value.trim()) {
        showToast('Current password is required');
        if (currentPassword) currentPassword.focus();
        return false;
    }

    if (!newPassword || !newPassword.value.trim()) {
        showToast('New password is required');
        if (newPassword) newPassword.focus();
        return false;
    }

    if (!confirmPassword || !confirmPassword.value.trim()) {
        showToast('Confirm password is required');
        if (confirmPassword) confirmPassword.focus();
        return false;
    }

    if (newPassword.value !== confirmPassword.value) {
        showToast('New password and confirm password do not match');
        confirmPassword.focus();
        return false;
    }

    // Password strength validation (optional)
    if (newPassword.value.length < 8) {
        showToast('Password must be at least 8 characters long');
        newPassword.focus();
        return false;
    }

    return true;
}

// Delete account functionality
function confirmDeletion() {
    const password = document.getElementById('password').value;

    if (!password) {
        showToast('Please enter your password to confirm account deletion');
        return;
    }

    // Show a confirmation dialog
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        // Here you would typically send a request to your server
        console.log('Account deletion confirmed with password');

        // For demonstration purposes
        showToast('Account deleted successfully');

        // Redirect to login or home page after a brief delay
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
    }
}

// Utility function to show feedback to the user
function showToast(message, type = 'info') {
    const bgColor = type === "error" ? "#FF4B4B" :
        type === "success" ? "#DBE5B1" :
            "#3B918C";

    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        backgroundColor: bgColor,
    }).showToast();
}
// dashboard JS
// Initialize dashboard data when the document is ready
document.addEventListener('DOMContentLoaded', function () {
    // Get current date and greet the therapist
    setGreeting();

    // Load data for the tables
    loadInactivityData();
    loadActivityData();
    loadRankingData();

    // Animate the counter numbers
    animateCounter('patient-num', 0, 50, 1500);
    animateCounter('bots-num', 0, 12, 1500);
});

// Set the greeting based on time of day
function setGreeting() {
    const now = new Date();
    const hour = now.getHours();
    const therapistName = document.getElementById('therapist-name').textContent;

    let greeting = 'Good Morning';
    if (hour >= 12 && hour < 17) {
        greeting = 'Good Afternoon';
    } else if (hour >= 17) {
        greeting = 'Good Evening';
    }

    document.querySelector('.dash-main h3').textContent = `${greeting}, ${therapistName}`;
}

// Animate counter for statistical numbers
function animateCounter(id, start, end, duration) {
    const element = document.getElementById(id);
    let current = start;
    const increment = (end - start) / (duration / 50);
    const timer = setInterval(function () {
        current += increment;
        element.textContent = Math.floor(current);
        if (current >= end) {
            element.textContent = end;
            clearInterval(timer);
        }
    }, 50);
}

// Load data for the inactivity warning table
function loadInactivityData() {
    // Sample data - in a real application, this would come from an API
    const inactivityData = [
        {
            name: 'John Doe',
            image: '../images/patient.png',
            lastSeen: 'March 28, 2025',
            daysInactive: 25
        },
        {
            name: 'John',
            image: '../images/p2.png',
            lastSeen: 'March 30, 2025',
            daysInactive: 23
        },
        {
            name: 'Doe',
            image: '../images/p3.png',
            lastSeen: 'April 2, 2025',
            daysInactive: 20
        }
    ];

    const tableBody = document.getElementById('warning-table-body');
    tableBody.innerHTML = '';

    inactivityData.forEach(patient => {
        const row = document.createElement('tr');
        row.className = 'border-bottom';

        row.innerHTML = `
            <td class="d-flex align-items-center">
                <img src="${patient.image}" alt="patient" width="25" class="me-2">
                <span>${patient.name}</span>
            </td>
            <td class="middle">${patient.lastSeen}</td>
            <td>${patient.daysInactive} days</td>
        `;

        tableBody.appendChild(row);
    });
}

// Load data for the activity table
function loadActivityData() {
    // Sample data - in a real application, this would come from an API
    const activityData = [
        {
            userName: 'John Doe',
            userImage: '../images/patient.png',
            botName: 'Lumia Bot',
            botImage: '../images/bot (1).png',
            lastInteraction: 'Feb 20, 2025'
        },
        {
            userName: 'Jane Smith',
            userImage: '../images/p2.png',
            botName: 'Nova Bot',
            botImage: '../images/bot (2).png',
            lastInteraction: 'Feb 15, 2025'
        },
        {
            userName: 'Alice Johnson',
            userImage: '../images/p3.png',
            botName: 'Spark Bot',
            botImage: '../images/bot (3).png',
            lastInteraction: 'Feb 10, 2025'
        },
        {
            userName: 'John Doe',
            userImage: '../images/patient.png',
            botName: 'Nova Bot',
            botImage: '../images/bot (4).png',
            lastInteraction: 'Feb 20, 2025'
        },
        {
            userName: 'Jane Smith',
            userImage: '../images/p2.png',
            botName: 'Lumia Bot',
            botImage: '../images/bot (5).png',
            lastInteraction: 'Feb 15, 2025'
        }
    ];

    const tableBody = document.getElementById('activity-table-body');
    tableBody.innerHTML = '';

    activityData.forEach(activity => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>
                <img src="${activity.userImage}" alt="patient" class="pe-1" width="30">
                ${activity.userName}
            </td>
            <td>
                <img src="${activity.botImage}" alt="bot" class="pe-1" width="30">
                ${activity.botName}
            </td>
            <td>${activity.lastInteraction}</td>
        `;

        tableBody.appendChild(row);
    });
}

// Load data for the bot ranking table
function loadRankingData() {
    // Sample data - in a real application, this would come from an API
    const rankingData = [
        {
            rank: 1,
            name: 'Lumia Bot',
            image: '../images/bot (1).png',
            messages: 223,
        },
        {
            rank: 2,
            name: 'Nova Bot',
            image: '../images/bot (2).png',
            messages: 203,
        },
        {
            rank: 3,
            name: 'Spark Bot',
            image: '../images/bot (3).png',
            messages: 150,
        }
    ];

    const tableBody = document.getElementById('ranking-table-body');
    tableBody.innerHTML = '';

    rankingData.forEach(bot => {
        const row = document.createElement('tr');
        row.className = 'border-bottom';

        row.innerHTML = `
            <td>${bot.rank}</td>
            <td class="middle">
                <img src="${bot.image}" alt="bot" width="25px">
                <span class="ms-2">${bot.name}</span>
            </td>
            <td>${bot.messages}</td>
        `;

        tableBody.appendChild(row);
    });
}