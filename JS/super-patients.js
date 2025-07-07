// Enhanced Patients Section JavaScript
const API_BASE_URL = 'https://autine-back.runasp.net/api';

// Patient management state
let currentPatients = [];
let followingPatients = [];
let currentTab = 'myPatients';
let filteredPatients = [];
let currentFilters = {};

// Add Patient Form State
let currentStep = 1;
const totalSteps = 3;
let patientFormData = {};

// Initialize patients section
document.addEventListener('DOMContentLoaded', function () {
    initializePatientsSection();
});

function initializePatientsSection() {
    // Check authentication
    if (!checkAuth()) {
        window.location.href = '../pages/login.html';
        return;
    }

    // Set up event listeners
    setupEventListeners();

    // NEW: Setup delete modal
    setupDeletePatientModal();

    // Initialize form elements
    initializeFormElements();

    // Load initial data
    loadMyPatients();
    loadFollowingPatients();
}

function setupEventListeners() {
    // Tab switching
    const myPatientsTab = document.getElementById('myPatients-tab');
    const followingTab = document.getElementById('following-tab');

    if (myPatientsTab) {
        myPatientsTab.addEventListener('click', () => {
            currentTab = 'myPatients';
            loadMyPatients();
        });
    }

    if (followingTab) {
        followingTab.addEventListener('click', () => {
            currentTab = 'following';
            loadFollowingPatients();
        });
    }

    // Add patient button
    const addPatientBtn = document.querySelector('[data-bs-target="#addPatientOffcanvas"]');
    if (addPatientBtn) {
        addPatientBtn.addEventListener('click', openAddPatientModal);
    }

    // Filter button
    const filterBtn = document.querySelector('[data-bs-target="#filterOffcanvas"]');
    if (filterBtn) {
        filterBtn.addEventListener('click', openFilterModal);
    }

    // Search functionality
    const searchInput = document.querySelector('#patientSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Setup Add Patient Form Event Listeners
    setupAddPatientFormListeners();

    // Setup Filter Form Event Listeners
    setupFilterFormListeners();

    // new
    const editForm = document.getElementById('editPatientForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditPatientSubmit);
    }
}

async function handleEditPatientSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const patientId = form.dataset.patientId;

    if (!patientId) {
        showToast('Patient ID not found', 'error');
        return;
    }

    console.log('=== EDIT PATIENT SUBMISSION DEBUG ===');
    console.log('Patient ID:', patientId);

    // Get selected gender
    const selectedGender = document.querySelector('input[name="editPatientGender"]:checked');

    // Format dates using the fixed function
    const dateOfBirth = formatDateToISO(
        document.getElementById('edit-patient-day')?.value,
        document.getElementById('edit-patient-month')?.value,
        document.getElementById('edit-patient-year')?.value
    );

    const nextSession = formatDateToISO(
        document.getElementById('edit-next-session-day')?.value,
        document.getElementById('edit-next-session-month')?.value,
        document.getElementById('edit-next-session-year')?.value
    );

    const lastSession = formatDateToISO(
        document.getElementById('edit-last-session-day')?.value,
        document.getElementById('edit-last-session-month')?.value,
        document.getElementById('edit-last-session-year')?.value
    );

    const formData = {
        firstName: document.getElementById('edit-patient-fname')?.value?.trim() || '',
        lastName: document.getElementById('edit-patient-lname')?.value?.trim() || '',
        bio: document.getElementById('edit-patient-bio')?.value?.trim() || 'Hey there! I\'m using Autine',
        gender: selectedGender?.value?.toLowerCase() || '',
        dateOfBirth: dateOfBirth,
        country: "Egypt",
        city: "Cairo",
        nextSession: nextSession,
        lastSession: lastSession,
        diagnosis: document.getElementById('edit-patient-diagnosis')?.value || 'mild',
        status: document.getElementById('edit-patient-status')?.value || 'stable',
        notes: document.getElementById('edit-patient-notes')?.value?.trim() || 'No additional notes',
        sessionFrequency: document.getElementById('edit-patient-session-frequency')?.value || 'Weekly'
    };

    console.log('Edit form data:', formData);

    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/Patients/${patientId}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
        });

        console.log('Edit API response status:', response.status);

        if (response.ok) {
            showToast('Patient updated successfully', 'success');

            // Close the offcanvas
            const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('editPatientOffcanvas'));
            if (offcanvas) {
                offcanvas.hide();
            }

            // Refresh the patients list
            if (currentTab === 'myPatients') {
                loadMyPatients();
            } else {
                loadFollowingPatients();
            }
        } else {
            let errorMessage = 'Failed to update patient';

            try {
                const errorData = await response.json();
                console.error('Edit API error response:', errorData);

                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.errors) {
                    const validationErrors = Object.values(errorData.errors).flat();
                    errorMessage = validationErrors.join(', ');
                }
            } catch (parseError) {
                const errorText = await response.text();
                console.error('Raw edit error response:', errorText);
            }

            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('Error updating patient:', error);
        showToast(error.message || 'Failed to update patient', 'error');
    }
}


// Initialize form elements (populate dropdowns)
function initializeFormElements() {
    populateDateDropdowns();
    populateYearDropdowns();
}
// Populate day dropdowns for DOB and sessions
function populateDateDropdowns() {
    const dayDropdowns = ['addPatientDobDay', 'addLastSessionDay', 'addNextSessionDay', 'edit-patient-day', 'edit-last-session-day', 'edit-next-session-day'];

    dayDropdowns.forEach(id => {
        const dropdown = document.getElementById(id);
        if (dropdown) {
            dropdown.innerHTML = '<option value="">Day</option>';

            // Add days 1-31
            for (let i = 1; i <= 31; i++) {
                dropdown.innerHTML += `<option value="${i}">${i}</option>`;
            }
        }
    });
}

function populateYearDropdowns() {
    const currentYear = new Date().getFullYear();
    // Fixed to match actual HTML IDs
    const yearDropdowns = ['patientDobYear', 'addLastSessionYear', 'addNextSessionYear', 'edit-patient-year', 'edit-last-session-year', 'edit-next-session-year'];

    yearDropdowns.forEach(id => {
        const dropdown = document.getElementById(id);
        if (dropdown) {
            dropdown.innerHTML = '<option value="">Year</option>';

            // For DOB: from current year down to 30 years ago
            if (id === 'patientDobYear' || id.startsWith('add') || id.startsWith('edit')) {
                for (let i = currentYear; i >= currentYear - 30; i--) {
                    dropdown.innerHTML += `<option value="${i}">${i}</option>`;
                }
            } else {
                // For sessions: from current year to 5 years in future
                for (let i = currentYear; i <= currentYear + 5; i++) {
                    dropdown.innerHTML += `<option value="${i}">${i}</option>`;
                }
            }
        }
    });
}

// Fix the profile picture upload
function setupAddPatientFormListeners() {
    // Next/Previous buttons
    const nextBtn = document.querySelector('.next-step');
    const prevBtn = document.querySelector('.prev-step');

    if (nextBtn) {
        nextBtn.addEventListener('click', handleNextStep);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', handlePrevStep);
    }

    // Form input listeners
    setupFormInputListeners();

    // Profile picture upload - Fix the ID reference
    const profilePicInput = document.getElementById('addPatientProfilePic');
    const profilePicImg = document.querySelector('.therapist-pic');

    if (profilePicInput && profilePicImg) {
        profilePicInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    profilePicImg.src = e.target.result;
                    patientFormData.profileImage = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Password toggle - Fix the ID reference
    const togglePassword = document.getElementById('toggleCurrentPassword');
    const passwordInput = document.getElementById('addPatientPassword');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('bi-eye');
            this.classList.toggle('bi-eye-slash');
        });
    }
}


// Fixed setupFormInputListeners function with correct IDs
function setupFormInputListeners() {
    // Step 1 inputs - Fixed ID references to match HTML
    const step1Inputs = [
        'addPatientFirstName', 'addPatientLastName', 'addPatientEmail', 'addPatientPassword',
        'addPatientDobDay', 'addPatientDobMonth', 'patientDobYear' // Fixed this ID
    ];

    step1Inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', updateFormData);
            input.addEventListener('input', updateFormData);
        }
    });

    // Gender radio buttons
    const genderRadios = document.querySelectorAll('input[name="customRadio"]');
    genderRadios.forEach(radio => {
        radio.addEventListener('change', updateFormData);
    });

    // Step 2 selects
    const step2Selects = ['addPatientDiagnosis', 'addPatientStatus'];
    step2Selects.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.addEventListener('change', updateFormData);
        }
    });

    // Step 3 inputs
    const step3Inputs = [
        'addLastSessionDay', 'addLastSessionMonth', 'addLastSessionYear',
        'addNextSessionDay', 'addNextSessionMonth', 'addNextSessionYear'
    ];

    step3Inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', updateFormData);
        }
    });
}

// 5. ENHANCED: Form data update with better validation
function updateFormData() {
    console.log('Updating form data...');

    // Step 1 data with trimming
    patientFormData.firstName = document.getElementById('addPatientFirstName')?.value?.trim() || '';
    patientFormData.lastName = document.getElementById('addPatientLastName')?.value?.trim() || '';
    patientFormData.email = document.getElementById('addPatientEmail')?.value?.trim().toLowerCase() || '';
    patientFormData.password = document.getElementById('addPatientPassword')?.value || '';

    // Gender
    const selectedGender = document.querySelector('input[name="customRadio"]:checked');
    patientFormData.gender = selectedGender?.value || '';

    // Date of birth
    patientFormData.dobDay = document.getElementById('addPatientDobDay')?.value || '';
    patientFormData.dobMonth = document.getElementById('addPatientDobMonth')?.value || '';
    patientFormData.dobYear = document.getElementById('patientDobYear')?.value || '';

    // Step 2 data
    patientFormData.diagnosis = document.getElementById('addPatientDiagnosis')?.value || '';
    patientFormData.status = document.getElementById('addPatientStatus')?.value || '';

    // Step 3 data
    patientFormData.lastSessionDay = document.getElementById('addLastSessionDay')?.value || '';
    patientFormData.lastSessionMonth = document.getElementById('addLastSessionMonth')?.value || '';
    patientFormData.lastSessionYear = document.getElementById('addLastSessionYear')?.value || '';
    patientFormData.nextSessionDay = document.getElementById('addNextSessionDay')?.value || '';
    patientFormData.nextSessionMonth = document.getElementById('addNextSessionMonth')?.value || '';
    patientFormData.nextSessionYear = document.getElementById('addNextSessionYear')?.value || '';

    const frequencySelect = document.querySelector('#addPatientSessionFrequency');
    patientFormData.sessionFrequency = frequencySelect?.value || '';

    console.log('Updated form data:', patientFormData);
}

// Step navigation functions
function handleNextStep() {
    console.log(`Moving to step ${currentStep + 1}, current form data:`, patientFormData);

    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            goToStep(currentStep + 1);
        } else {
            // Final step - submit form
            submitPatientForm();
        }
    }
}


function handlePrevStep() {
    if (currentStep > 1) {
        goToStep(currentStep - 1);
    }
}

function goToStep(step) {
    // Hide current step
    const currentStepElement = document.getElementById(`addPatientStep${currentStep}`);
    if (currentStepElement) {
        currentStepElement.classList.add('d-none');
    }

    // Show new step
    const newStepElement = document.getElementById(`addPatientStep${step}`);
    if (newStepElement) {
        newStepElement.classList.remove('d-none');
    }

    currentStep = step;
    updateStepButtons();
    updateStepIndicator();
}

function updateStepButtons() {
    const nextBtn = document.querySelector('.next-step');
    const prevBtn = document.querySelector('.prev-step');

    if (nextBtn) {
        if (currentStep === totalSteps) {
            nextBtn.textContent = 'Add Patient';
            nextBtn.classList.add('btn-success');
            nextBtn.classList.remove('btn-primary-500');
        } else {
            nextBtn.textContent = 'Next';
            nextBtn.classList.remove('btn-success');
            nextBtn.classList.add('btn-primary-500');
        }
    }

    if (prevBtn) {
        if (currentStep === 1) {
            prevBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'inline-block';
        }
    }
}

function updateStepIndicator() {
    // Update step indicator if you have one
    const stepIndicators = document.querySelectorAll('.step-indicator');
    stepIndicators.forEach((indicator, index) => {
        if (index + 1 === currentStep) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
}

function validateCurrentStep() {
    let isValid = true;
    let errorMessage = '';

    switch (currentStep) {
        case 1:
            if (!patientFormData.firstName || !patientFormData.lastName) {
                errorMessage = 'First name and last name are required.';
                isValid = false;
            } else if (!patientFormData.email || !isValidEmail(patientFormData.email)) {
                errorMessage = 'Please enter a valid email address.';
                isValid = false;
            } else if (!patientFormData.password || patientFormData.password.length < 6) {
                errorMessage = 'Password must be at least 6 characters long.';
                isValid = false;
            } else if (!patientFormData.gender) {
                errorMessage = 'Please select a gender.';
                isValid = false;
            } else if (!patientFormData.dobDay || !patientFormData.dobMonth || !patientFormData.dobYear) {
                errorMessage = 'Please provide a complete date of birth.';
                isValid = false;
            }
            break;
        case 2:
            if (!patientFormData.diagnosis) {
                errorMessage = 'Please select a diagnosis.';
                isValid = false;
            } else if (!patientFormData.status) {
                errorMessage = 'Please select a status.';
                isValid = false;
            }
            break;
        case 3:
            // Optional validations for step 3
            break;
    }

    if (!isValid) {
        showToast(errorMessage, 'error');
    }

    return isValid;
}

function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// Enhanced Debug Version - Focus on the main issues causing 400 errors

// 1. FIXED: Date formatting function
function formatDateToISO(day, month, year) {
    if (!day || !month || !year) {
        return null; // Return null instead of invalid date
    }

    // Ensure values are numbers
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    // Validate ranges
    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900) {
        console.error('Invalid date values:', { day: dayNum, month: monthNum, year: yearNum });
        return null;
    }

    // Create date and format to ISO string
    const date = new Date(yearNum, monthNum - 1, dayNum); // month is 0-indexed

    // Validate the created date
    if (isNaN(date.getTime())) {
        console.error('Invalid date created:', date);
        return null;
    }

    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
}

// 2. FIXED: Submit patient form with proper validation
async function submitPatientForm() {
    try {
        updateFormData(); // Ensure all data is captured

        console.log('=== PATIENT FORM SUBMISSION DEBUG ===');
        console.log('Raw form data:', patientFormData);

        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'email', 'password', 'gender'];
        const missingFields = requiredFields.filter(field => !patientFormData[field]);

        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Validate email format
        if (!isValidEmail(patientFormData.email)) {
            throw new Error('Invalid email format');
        }

        // Format dates properly
        const dateOfBirth = formatDateToISO(
            patientFormData.dobDay,
            patientFormData.dobMonth,
            patientFormData.dobYear
        );

        const lastSession = formatDateToISO(
            patientFormData.lastSessionDay,
            patientFormData.lastSessionMonth,
            patientFormData.lastSessionYear
        );

        const nextSession = formatDateToISO(
            patientFormData.nextSessionDay,
            patientFormData.nextSessionMonth,
            patientFormData.nextSessionYear
        );

        console.log('Formatted dates:', { dateOfBirth, lastSession, nextSession });

        // Build the API payload
        const formData = {
            firstName: patientFormData.firstName.trim(),
            lastName: patientFormData.lastName.trim(),
            email: patientFormData.email.trim().toLowerCase() || "email@gmail.com",
            userName: patientFormData.email.trim().toLowerCase() || "email@gmail.com", // Use email as username
            password: patientFormData.password || "defaultPassword11",
            gender: patientFormData.gender.toLowerCase(),
            bio: "Hey there! I'm using Autine",
            country: "Egypt",
            city: "Cairo",
            dateOfBirth: dateOfBirth,
            diagnosis: patientFormData.diagnosis || "mild", // Provide default
            status: patientFormData.status || "stable", // Provide default
            lastSession: lastSession,
            nextSession: nextSession,
            notes: "No additional notes",
            sessionFrequency: patientFormData.sessionFrequency || "Weekly"
        };

        console.log('Final API payload:', formData);
        console.log('API URL:', `${API_BASE_URL}/Patients`);

        // Make the API call with enhanced error handling
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/Patients`, {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        console.log('API Response Status:', response.status);
        console.log('API Response Headers:', response.headers);

        if (response.ok) {
            const responseData = await response.json();
            console.log('Success! API response:', responseData);

            showToast('Patient added successfully!', 'success');
            closeAddPatientModal();
            resetAddPatientForm();
            loadMyPatients();
        } else {
            // Enhanced error handling
            let errorMessage = 'Failed to add patient';

            try {
                const errorData = await response.json();
                console.error('API Error Response:', errorData);

                // Handle different error response formats
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.errors) {
                    // Handle validation errors
                    const validationErrors = Object.values(errorData.errors).flat();
                    errorMessage = validationErrors.join(', ');
                } else if (typeof errorData === 'string') {
                    errorMessage = errorData;
                }
            } catch (parseError) {
                console.error('Error parsing error response:', parseError);
                const errorText = await response.text();
                console.error('Raw error response:', errorText);
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }

            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('=== SUBMISSION ERROR ===');
        // console.error('Error:', error);
        // console.error('Stack:', error.stack);
        // showToast(error.message || 'Failed to add patient', 'error');
    }
}


function formatSessionDate(type) {
    const prefix = type === 'last' ? 'lastSession' : 'nextSession';
    const day = patientFormData[`${prefix}Day`];
    const month = patientFormData[`${prefix}Month`];
    const year = patientFormData[`${prefix}Year`];

    if (day && month && year) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return null;
}

function resetAddPatientForm() {
    currentStep = 1;
    patientFormData = {};

    // Reset form elements
    const form = document.querySelector('#addPatientOffcanvas form');
    if (form) {
        form.reset();
    }

    // Reset profile image
    const profileImg = document.querySelector('.therapist-pic');
    if (profileImg) {
        profileImg.src = '../images/user.png';
    }

    // Reset steps visibility
    for (let i = 1; i <= totalSteps; i++) {
        const stepElement = document.getElementById(`addPatientStep${i}`);
        if (stepElement) {
            if (i === 1) {
                stepElement.classList.remove('d-none');
            } else {
                stepElement.classList.add('d-none');
            }
        }
    }

    updateStepButtons();
}

function openAddPatientModal() {
    resetAddPatientForm();
    goToStep(1);
}

function closeAddPatientModal() {
    const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('addPatientOffcanvas'));
    if (offcanvas) {
        offcanvas.hide();
    }
}

// Setup Filter Form Event Listeners
function setupFilterFormListeners() {
    const filterForm = document.querySelector('#filterOffcanvas form');
    if (filterForm) {
        filterForm.addEventListener('submit', handleFilterSubmit);

        const resetBtn = filterForm.querySelector('button[type="reset"]');
        if (resetBtn) {
            resetBtn.addEventListener('click', handleFilterReset);
        }
    }
}

function handleFilterSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const filters = {};

    // Get date filters
    const lastSessionFrom = e.target.querySelector('input[type="date"]:nth-of-type(1)')?.value;
    const lastSessionTo = e.target.querySelector('input[type="date"]:nth-of-type(2)')?.value;
    const nextSessionFrom = e.target.querySelector('input[type="date"]:nth-of-type(3)')?.value;
    const nextSessionTo = e.target.querySelector('input[type="date"]:nth-of-type(4)')?.value;

    // Get select filters
    const diagnosis = e.target.querySelector('select:nth-of-type(1)')?.value;
    const status = e.target.querySelector('select:nth-of-type(2)')?.value;

    if (lastSessionFrom) filters.lastSessionFrom = lastSessionFrom;
    if (lastSessionTo) filters.lastSessionTo = lastSessionTo;
    if (nextSessionFrom) filters.nextSessionFrom = nextSessionFrom;
    if (nextSessionTo) filters.nextSessionTo = nextSessionTo;
    if (diagnosis) filters.diagnosis = diagnosis;
    if (status) filters.status = status;

    currentFilters = filters;
    applyFilters();
    closeFilterModal();
    showToast('Filters applied successfully', 'success');
}

function handleFilterReset() {
    currentFilters = {};
    applyFilters();
    showToast('Filters reset', 'info');
}

function applyFilters() {
    const patients = currentTab === 'myPatients' ? currentPatients : followingPatients;

    if (Object.keys(currentFilters).length === 0) {
        filteredPatients = patients;
    } else {
        filteredPatients = patients.filter(patient => {
            return matchesFilters(patient, currentFilters);
        });
    }

    renderPatients(filteredPatients, currentTab);
    updatePatientsCount(filteredPatients.length, currentTab);
}

function matchesFilters(patient, filters) {
    // Date range filters
    if (filters.lastSessionFrom && patient.lastSession) {
        if (new Date(patient.lastSession) < new Date(filters.lastSessionFrom)) {
            return false;
        }
    }

    if (filters.lastSessionTo && patient.lastSession) {
        if (new Date(patient.lastSession) > new Date(filters.lastSessionTo)) {
            return false;
        }
    }

    if (filters.nextSessionFrom && patient.nextSession) {
        if (new Date(patient.nextSession) < new Date(filters.nextSessionFrom)) {
            return false;
        }
    }

    if (filters.nextSessionTo && patient.nextSession) {
        if (new Date(patient.nextSession) > new Date(filters.nextSessionTo)) {
            return false;
        }
    }

    // Diagnosis filter
    if (filters.diagnosis && patient.diagnosis !== filters.diagnosis) {
        return false;
    }

    // Status filter
    if (filters.status && patient.status?.toLowerCase() !== filters.status.toLowerCase()) {
        return false;
    }

    return true;
}

function closeFilterModal() {
    const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('filterOffcanvas'));
    if (offcanvas) {
        offcanvas.hide();
    }
}

function openFilterModal() {
    // Pre-populate filter form with current filters
    const filterForm = document.querySelector('#filterOffcanvas form');
    if (filterForm && Object.keys(currentFilters).length > 0) {
        const dateInputs = filterForm.querySelectorAll('input[type="date"]');
        const selects = filterForm.querySelectorAll('select');

        if (dateInputs[0] && currentFilters.lastSessionFrom) {
            dateInputs[0].value = currentFilters.lastSessionFrom;
        }
        if (dateInputs[1] && currentFilters.lastSessionTo) {
            dateInputs[1].value = currentFilters.lastSessionTo;
        }
        if (dateInputs[2] && currentFilters.nextSessionFrom) {
            dateInputs[2].value = currentFilters.nextSessionFrom;
        }
        if (dateInputs[3] && currentFilters.nextSessionTo) {
            dateInputs[3].value = currentFilters.nextSessionTo;
        }
        if (selects[0] && currentFilters.diagnosis) {
            selects[0].value = currentFilters.diagnosis;
        }
        if (selects[1] && currentFilters.status) {
            selects[1].value = currentFilters.status;
        }
    }
}

// Load my patients
async function loadMyPatients() {
    try {
        showLoading('myPatients');
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/Patients/my-patient`);

        if (response.ok) {
            const patients = await response.json();
            currentPatients = patients;
            applyFilters(); // Apply current filters
        } else {
            throw new Error('Failed to load my patients');
        }
    } catch (error) {
        console.error('Error loading my patients:', error);
        showToast('Failed to load patients', 'error');
        showEmptyState('myPatients');
    } finally {
        hideLoading('myPatients');
    }
}

// Load following patients
async function loadFollowingPatients() {
    try {
        showLoading('following');
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/Patients/follow-patient`);

        if (response.ok) {
            const patients = await response.json();
            followingPatients = patients;
            if (currentTab === 'following') {
                applyFilters(); // Apply current filters
            }
        } else {
            throw new Error('Failed to load following patients');
        }
    } catch (error) {
        console.error('Error loading following patients:', error);
        showToast('Failed to load following patients', 'error');
        showEmptyState('following');
    } finally {
        hideLoading('following');
    }
}

// Fix 5: Alternative method - Update the renderPatients function to properly initialize dropdowns
function renderPatients(patients, tabType) {
    const tableBody = getTableBody(tabType);

    if (!tableBody) return;

    if (patients.length === 0) {
        showEmptyState(tabType);
        return;
    }

    hideEmptyState(tabType);

    tableBody.innerHTML = patients.map(patient => createPatientRow(patient, tabType)).join('');

    // Initialize Bootstrap dropdowns after rendering
    const dropdownElements = tableBody.querySelectorAll('.dropdown-toggle');
    dropdownElements.forEach(dropdownToggle => {
        new bootstrap.Dropdown(dropdownToggle);
    });

    // Add event listeners to dropdown menus
    setupPatientRowEventListeners(tabType);
}

// Replace the createPatientRow function with this corrected version:

function createPatientRow(patient, tabType) {
    const statusButton = getStatusButton(patient.status);
    const patientName = getPatientFullName(patient);
    const age = calculateAge(patient.dateOfBirth) || patient.age || 'N/A';

    return `
        <tr data-patient-id="${patient.id}">
            <td>
                <div class="d-flex align-items-center">
                    <div>
                        <div class="fw-medium">${patientName}</div>
                        <div class="d-md-none text-muted small">${age} years</div>
                    </div>
                </div>
            </td>
            <td class="d-none d-md-table-cell">${age} years</td>
            <td class="d-none d-lg-table-cell">${patient.diagnosis || 'Not specified'}</td>
            <td class="d-none d-xl-table-cell">${formatDate(patient.lastSession)}</td>
            <td class="d-none d-xl-table-cell">${formatDate(patient.nextSession)}</td>
            <td class="d-none d-lg-table-cell">${patient.guardianName || 'Not specified'}</td>
            <td>${statusButton}</td>
            <td class="position-relative">
                ${tabType === 'myPatients' ? `
                    <div class="dropdown">
                        <i class="fs-4 bi bi-three-dots-vertical dropdown-toggle" 
                           data-bs-toggle="dropdown" 
                           aria-expanded="false"
                           style="cursor: pointer;"></i>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item custom-drop" href="#" data-action="view" data-patient-id="${patient.id}">
                                <i class="bi bi-eye me-2"></i>View Details</a></li>
                            <li><a class="dropdown-item custom-drop" href="#" data-action="edit" data-patient-id="${patient.id}">
                                <i class="bi bi-pencil me-2"></i>Edit Patient</a></li>
                            <li><a class="dropdown-item text-danger custom-drop" href="#" data-action="delete" data-patient-id="${patient.id}" data-patient-name="${patientName.replace(/"/g, '&quot;')}">
                                <i class="bi bi-trash me-2"></i>Delete Patient</a></li>
                        </ul>
                    </div>
                ` : `
                    <i class="fs-4 bi bi-three-dots-vertical" style="cursor: pointer;"></i>
                `}
            </td>
        </tr>
    `;
}


// Calculate age from date of birth
function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

// Get patient full name
function getPatientFullName(patient) {
    const firstName = patient.firstName || '';
    const lastName = patient.lastName || '';

    if (firstName && lastName) {
        return `${firstName} ${lastName}`;
    } else if (firstName) {
        return firstName;
    } else if (lastName) {
        return lastName;
    } else if (patient.userName) {
        return patient.userName;
    } else {
        return 'Unknown Patient';
    }
}

// Create dropdown menu for patient actions
function createDropdownMenu(patient) {
    const patientName = getPatientFullName(patient);
    return `
        <ul class="dropdown-menu">
            <li><a class="dropdown-item custom-drop" href="#" onclick="viewOffcanvas('${patient.id}')">
                <i class="bi bi-eye me-2"></i>View Details</a></li>
            <li><a class="dropdown-item custom-drop" href="#" onclick="editPatientOffcanvas('${patient.id}')">
                <i class="bi bi-pencil me-2"></i>Edit Patient</a></li>
            <li><a class="dropdown-item custom-drop" href="#" onclick="viewPatientBot('${patient.id}')">
                <i class="bi bi-robot me-2"></i>View Bot</a></li>
            <li><a class="dropdown-item text-danger custom-drop" href="#" onclick="confirmDeletePatient('${patient.id}', '${patientName}')">
                <i class="bi bi-trash me-2"></i>Delete Patient</a></li>
        </ul>
    `;
}

// Get status button HTML
function getStatusButton(status) {
    const statusClass = {
        'stable': 'stable-btn',
        'improving': 'improving-btn',
        'critical': 'critical-btn',
        'declining': 'declining-btn'
    };

    const btnClass = statusClass[status?.toLowerCase()] || 'stable-btn';
    const statusText = status || 'Stable';

    return `<button class="${btnClass}">${statusText}</button>`;
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'Not scheduled';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Update patients count
function updatePatientsCount(count, tabType) {
    const countElement = document.querySelector(`#${tabType}-tab-pane #patients-count`);
    if (countElement) {
        countElement.textContent = count;
    }
}

// Show/hide empty state
function showEmptyState(tabType) {
    const emptyContainer = document.querySelector(`#${tabType}-tab-pane .empty-bot-container`);
    const tableContainer = document.querySelector(`#${tabType}-tab-pane .table-responsive`);

    if (emptyContainer) emptyContainer.classList.remove('d-none');
    if (tableContainer) tableContainer.classList.add('d-none');
}

function hideEmptyState(tabType) {
    const emptyContainer = document.querySelector(`#${tabType}-tab-pane .empty-bot-container`);
    const tableContainer = document.querySelector(`#${tabType}-tab-pane .table-responsive`);

    if (emptyContainer) emptyContainer.classList.add('d-none');
    if (tableContainer) tableContainer.classList.remove('d-none');
}

// Show/hide loading state
function showLoading(tabType) {
    const tableBody = getTableBody(tabType);
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </td>
            </tr>
        `;
    }
}

function hideLoading(tabType) {
    // Loading will be hidden when patients are rendered
}

// Get table body element
function getTableBody(tabType) {
    return document.querySelector(`#${tabType}-tab-pane #patients-table tbody`);
}

// Replace setupPatientRowEventListeners function with this:

function setupPatientRowEventListeners(tabType) {
    // Remove the old eval-based approach and use proper event delegation
    const tableBody = getTableBody(tabType);
    if (!tableBody) return;

    // Add event delegation for dropdown items
    tableBody.addEventListener('click', function (e) {
        e.stopPropagation();

        const dropdownItem = e.target.closest('.dropdown-item');
        if (dropdownItem) {
            e.preventDefault();

            const action = dropdownItem.dataset.action;
            const patientId = dropdownItem.dataset.patientId;
            const patientName = dropdownItem.dataset.patientName;

            switch (action) {
                case 'view':
                    viewOffcanvas(patientId);
                    break;
                case 'edit':
                    editPatientOffcanvas(patientId);
                    break;
                case 'delete':
                    confirmDeletePatient(patientId, patientName);
                    break;
            }

            // Close the dropdown
            const dropdown = dropdownItem.closest('.dropdown');
            const dropdownMenu = dropdown.querySelector('.dropdown-menu');
            dropdownMenu.classList.remove('show');
        }
    });

    // Handle row clicks (but not when clicking dropdowns)
    const rows = tableBody.querySelectorAll('tr[data-patient-id]');
    rows.forEach(row => {
        row.addEventListener('click', (e) => {
            // Prevent row click when interacting with dropdown elements
            if (e.target.closest('.dropdown') ||
                e.target.closest('.dropdown-toggle') ||
                e.target.closest('.dropdown-menu') ||
                e.target.closest('button')) {
                return;
            }

            const patientId = row.dataset.patientId;
            if (patientId) {
                viewOffcanvas(patientId);
            }
        });
    });
}

function setupDeletePatientModal() {
    const deleteModal = document.getElementById('deletePatientModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    if (deleteModal && confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function () {
            if (window.pendingDeletePatient) {
                deletePatient(window.pendingDeletePatient.id);

                // Close the modal
                const modal = bootstrap.Modal.getInstance(deleteModal);
                if (modal) {
                    modal.hide();
                }

                // Clear pending data
                window.pendingDeletePatient = null;
            }
        });
    }
}

// Fix 6: Enhanced patient action functions with better error handling
async function viewOffcanvas(patientId) {
    try {
        // Close any open dropdowns first
        const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
        openDropdowns.forEach(dropdown => {
            dropdown.classList.remove('show');
        });

        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/Patients/${patientId}`);

        if (response.ok) {
            const patient = await response.json();
            showPatientDetailsModal(patient);
        } else {
            throw new Error('Failed to load patient details');
        }
    } catch (error) {
        console.error('Error loading patient details:', error);
        showToast('Failed to load patient details', 'error');
    }
}

async function editPatientOffcanvas(patientId) {
    try {
        // Close any open dropdowns first
        const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
        openDropdowns.forEach(dropdown => {
            dropdown.classList.remove('show');
        });

        console.log('Fetching patient data for editing, ID:', patientId);

        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/Patients/${patientId}`);

        if (response.ok) {
            const patient = await response.json();
            console.log('Retrieved patient data for editing:', patient);
            
            showEditPatientModal(patient);
        } else {
            throw new Error('Failed to load patient for editing');
        }
    } catch (error) {
        console.error('Error loading patient for edit:', error);
        showToast('Failed to load patient for editing', 'error');
    }
}


// ISSUE 4: Update confirmDeletePatient to properly show patient name in modal
function confirmDeletePatient(patientId, patientName) {
    console.log('Delete confirmation for patient ID:', patientId, 'Name:', patientName); // Add this

    // Close any open dropdowns first
    const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
    openDropdowns.forEach(dropdown => {
        dropdown.classList.remove('show');
    });

    // Validate patient ID
    if (!patientId) {
        showToast('Error: No patient ID provided', 'error');
        return;
    }

    // Store patient data for the modal
    window.pendingDeletePatient = {
        id: patientId,
        name: patientName
    };

    // Update the modal content with patient name
    const modalBody = document.querySelector('#deletePatientModal .modal-body');
    if (modalBody) {
        modalBody.innerHTML = `Are you sure you want to delete patient <strong>${patientName}</strong>? This action cannot be undone.`;
    }

    // Show the delete confirmation modal
    const deleteModal = new bootstrap.Modal(document.getElementById('deletePatientModal'));
    deleteModal.show();
}


// In your deletePatient function, add logging to verify the ID
async function deletePatient(patientId) {
    try {
        console.log('Attempting to delete patient with ID:', patientId); // Add this line

        // Make sure patientId is not undefined or null
        if (!patientId) {
            throw new Error('Patient ID is required');
        }

        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/Patients/${patientId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Patient deleted successfully', 'success');
            loadMyPatients();
        } 
        else {
            const errorText = await response.text();
            console.error('Delete failed with response:', errorText);
            throw new Error(`Failed to delete patient: ${response.status}`);
        }
    } 
    catch (error) {
        console.error('Error deleting patient:', error);
        showToast('Failed to delete patient', 'error');
    }
}


function showPatientDetailsModal(patient) {
    // Update the view offcanvas with patient data
    const viewOffcanvas = document.getElementById('viewOffcanvas');
    if (!viewOffcanvas) return;

    // Update image
    const viewImg = document.getElementById('viewPreviewImg');
    if (viewImg) {
        viewImg.src = patient.image || '../images/patient.jpg'; // Default image if none provided
    }

    // Update name in header
    const viewName = document.getElementById('viewName');
    if (viewName) {
        viewName.textContent = getPatientFullName(patient);
    }

    // Update name display under image
    const nameDisplay = viewOffcanvas.querySelector('.fs-5');
    if (nameDisplay) {
        nameDisplay.textContent = getPatientFullName(patient);
    }

    // Update fields
    const viewFname = document.getElementById('view-fname');
    if (viewFname) {
        viewFname.textContent = patient.firstName || 'Not specified';
    }

    const viewLname = document.getElementById('view-lname');
    if (viewLname) {
        viewLname.textContent = patient.lastName || 'Not specified';
    }

    const viewEmail = document.getElementById('view-email');
    if (viewEmail) {
        viewEmail.textContent = patient.email || 'Not specified';
    }

    const viewGender = document.getElementById('view-gender');
    if (viewGender) {
        viewGender.textContent = patient.gender || 'Not specified';
    }

    const viewBio = document.getElementById('view-bio');
    if (viewBio) {
        viewBio.textContent = patient.bio || patient.diagnosis || 'No bio available';
    }

    // Update delete button to have patient ID
    const deleteBtn = document.getElementById('deleteBotBtn');
    if (deleteBtn) {
        deleteBtn.onclick = () => confirmDeletePatient(patient.id, getPatientFullName(patient));
    }

    // Show the offcanvas
    const offcanvas = new bootstrap.Offcanvas(viewOffcanvas);
    offcanvas.show();
}

// 2. ADD this new function for showing edit patient modal:

function showEditPatientModal(patient) {
    const editOffcanvas = document.getElementById('editPatientOffcanvas');
    if (!editOffcanvas) return;

    // Populate basic info fields
    const editFname = document.getElementById('edit-patient-fname');
    if (editFname) {
        editFname.value = patient.firstName || '';
    }

    const editLname = document.getElementById('edit-patient-lname');
    if (editLname) {
        editLname.value = patient.lastName || '';
    }

    const editEmail = document.getElementById('edit-patient-email');
    if (editEmail) {
        editEmail.value = patient.email || '';
    }

    // Set gender radio buttons
    if (patient.gender) {
        const genderRadio = document.querySelector(`input[name="editPatientGender"][value="${patient.gender.toLowerCase()}"]`);
        if (genderRadio) {
            genderRadio.checked = true;
        }
    }

    // Parse and set date of birth
    if (patient.dateOfBirth) {
        const dobDate = new Date(patient.dateOfBirth);

        const editDobDay = document.getElementById('edit-patient-day');
        const editDobMonth = document.getElementById('edit-patient-month');
        const editDobYear = document.getElementById('edit-patient-year');

        if (editDobDay) editDobDay.value = dobDate.getDate();
        if (editDobMonth) editDobMonth.value = dobDate.getMonth() + 1; // Month is 0-indexed
        if (editDobYear) editDobYear.value = dobDate.getFullYear();
    }

    // Set diagnosis
    const editDiagnosis = document.getElementById('edit-patient-diagnosis');
    if (editDiagnosis && patient.diagnosis) {
        // Map diagnosis values to select options
        const diagnosisMap = {
            'mild': 'mild',
            'moderate': 'moderate',
            'severe': 'severe',
            'mild asd': 'mild',
            'moderate asd': 'moderate',
            'severe asd': 'severe'
        };
        const mappedDiagnosis = diagnosisMap[patient.diagnosis.toLowerCase()] || patient.diagnosis.toLowerCase();
        editDiagnosis.value = mappedDiagnosis;
    }

    // Set status
    const editStatus = document.getElementById('edit-patient-status');
    if (editStatus && patient.status) {
        editStatus.value = patient.status.toLowerCase();
    }

    // Set guardian
    const editGuardian = document.getElementById('edit-patient-guardian');
    if (editGuardian) {
        editGuardian.value = patient.guardianName || '';
    }

    // Parse and set last session date
    if (patient.lastSession) {
        const lastSessionDate = new Date(patient.lastSession);

        const lastSessionDay = document.getElementById('edit-last-session-day');
        const lastSessionMonth = document.getElementById('edit-last-session-month');
        const lastSessionYear = document.getElementById('edit-last-session-year');

        if (lastSessionDay) lastSessionDay.value = lastSessionDate.getDate();
        if (lastSessionMonth) lastSessionMonth.value = lastSessionDate.getMonth() + 1;
        if (lastSessionYear) lastSessionYear.value = lastSessionDate.getFullYear();
    }

    // Parse and set next session date
    if (patient.nextSession) {
        const nextSessionDate = new Date(patient.nextSession);

        const nextSessionDay = document.getElementById('edit-next-session-day');
        const nextSessionMonth = document.getElementById('edit-next-session-month');
        const nextSessionYear = document.getElementById('edit-next-session-year');

        if (nextSessionDay) nextSessionDay.value = nextSessionDate.getDate();
        if (nextSessionMonth) nextSessionMonth.value = nextSessionDate.getMonth() + 1;
        if (nextSessionYear) nextSessionYear.value = nextSessionDate.getFullYear();
    }

    // Store patient ID for form submission
    const editForm = document.getElementById('editPatientForm');
    if (editForm) {
        editForm.dataset.patientId = patient.id;
    }

    // Show the offcanvas
    const offcanvas = new bootstrap.Offcanvas(editOffcanvas);
    offcanvas.show();
}


// Search functionality
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();

    if (searchTerm === '') {
        // Show all filtered patients
        applyFilters();
        return;
    }

    const patients = currentTab === 'myPatients' ? currentPatients : followingPatients;

    // Filter patients based on search term
    const searchResults = patients.filter(patient => {
        const fullName = getPatientFullName(patient).toLowerCase();
        const email = (patient.email || '').toLowerCase();
        const diagnosis = (patient.diagnosis || '').toLowerCase();
        const status = (patient.status || '').toLowerCase();

        return fullName.includes(searchTerm) ||
            email.includes(searchTerm) ||
            diagnosis.includes(searchTerm) ||
            status.includes(searchTerm);
    });

    // Apply current filters to search results
    if (Object.keys(currentFilters).length > 0) {
        filteredPatients = searchResults.filter(patient => matchesFilters(patient, currentFilters));
    } else {
        filteredPatients = searchResults;
    }

    renderPatients(filteredPatients, currentTab);
    updatePatientsCount(filteredPatients.length, currentTab);
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
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
        // Fallback to console if Toastify is not available
        console.log(`${type.toUpperCase()}: ${message}`);
        alert(message);
    }
}

async function makeAuthenticatedRequest(url, options = {}) {
    const authData = getAuthData();
    const token = authData?.accessToken;

    if (!token) {
        throw new Error('No authentication token found');
    }

    console.log('Making authenticated request to:', url);
    console.log('Request options:', options);

    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    console.log('Final request headers:', mergedOptions.headers);

    if (mergedOptions.body) {
        console.log('Request body:', mergedOptions.body);
    }

    const response = await fetch(url, mergedOptions);

    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);

    return response;
}



// Export functionality
function exportPatients() {
    const patients = currentTab === 'myPatients' ? filteredPatients : followingPatients;

    if (patients.length === 0) {
        showToast('No patients to export', 'info');
        return;
    }

    // Prepare data for export
    const exportData = patients.map(patient => ({
        'Full Name': getPatientFullName(patient),
        'Age': calculateAge(patient.dateOfBirth) || 'N/A',
        'Gender': patient.gender || 'Not specified',
        'Email': patient.email || 'Not specified',
        'Diagnosis': patient.diagnosis || 'Not specified',
        'Status': patient.status || 'Not specified',
        'Last Session': formatDate(patient.lastSession),
        'Next Session': formatDate(patient.nextSession),
        'Guardian': patient.guardianName || 'Not specified'
    }));

    // Convert to CSV
    const csvContent = convertToCSV(exportData);

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patients_${currentTab}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showToast('Patients exported successfully', 'success');
}

function convertToCSV(data) {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header];
            // Escape quotes and wrap in quotes if contains comma
            return typeof value === 'string' && (value.includes(',') || value.includes('"'))
                ? `"${value.replace(/"/g, '""')}"`
                : value;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('#patientSearch');
        if (searchInput) {
            searchInput.focus();
        }
    }

    // Escape key to close modals/offcanvas
    if (e.key === 'Escape') {
        // Close any open Bootstrap modals or offcanvas
        const openModals = document.querySelectorAll('.modal.show');
        const openOffcanvas = document.querySelectorAll('.offcanvas.show');

        openModals.forEach(modal => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        });

        openOffcanvas.forEach(offcanvas => {
            const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvas);
            if (bsOffcanvas) bsOffcanvas.hide();
        });
    }
});

// Window resize handler for responsive table
window.addEventListener('resize', debounce(function () {
    // Handle any responsive adjustments if needed
}, 250));

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePatientsSection);
} else {
    initializePatientsSection();
}


async function testApiConnection() {
    try {
        console.log('Testing API connection...');
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/Patients/my-patient`);
        console.log('API connection test - Status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('API connection successful, sample data:', data);
        } else {
            const errorText = await response.text();
            console.error('API connection test failed:', errorText);
        }
    } catch (error) {
        console.error('API connection test error:', error);
    }
}

// 8. DEBUGGING: Add this to check what's being sent
function debugFormSubmission() {
    console.log('=== FORM DEBUG INFO ===');
    console.log('Current step:', currentStep);
    console.log('Form data:', patientFormData);
    console.log('API Base URL:', API_BASE_URL);

    // Check auth
    const authData = getAuthData();
    console.log('Auth data available:', !!authData);
    console.log('Access token available:', !!authData?.accessToken);

    // Check form elements
    const firstName = document.getElementById('addPatientFirstName');
    const lastName = document.getElementById('addPatientLastName');
    const email = document.getElementById('addPatientEmail');

    console.log('Form elements found:', {
        firstName: !!firstName,
        lastName: !!lastName,
        email: !!email
    });

    if (firstName) console.log('First name value:', firstName.value);
    if (lastName) console.log('Last name value:', lastName.value);
    if (email) console.log('Email value:', email.value);
}