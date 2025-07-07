// Sample data for demonstration
const sampleData = {
    patients: [
        {
            id: 1,
            firstName: "Noah",
            lastName: "Bennet",
            email: "noah.bennet@example.com",
            gender: "Male",
            bio: "I love to help people and make a difference in their lives. I am passionate about mental health and well-being.",
            image: "../images/p2.png"
        },
        {
            id: 2,
            firstName: "Emma",
            lastName: "Watson",
            email: "emma.watson@example.com",
            gender: "Female",
            bio: "Dedicated to personal growth and helping others achieve their goals.",
            image: "../images/p1.png"
        }
    ],
    supervisors: [
        {
            id: 1,
            firstName: "Daniel",
            lastName: "Cooper",
            email: "daniel.cooper@example.com",
            gender: "Male",
            bio: "I love to help people and make a difference in their lives. I am passionate about mental health and well-being.",
            image: "../images/therapist.png"
        },
        {
            id: 2,
            firstName: "Sarah",
            lastName: "Johnson",
            email: "sarah.johnson@example.com",
            gender: "Female",
            bio: "Experienced supervisor with 10+ years in mental health care.",
            image: "../images/supervisor2.png"
        }
    ],
    bots: [
        {
            id: 1,
            name: "Therapy Bot Alpha",
            bio: "A compassionate AI assistant designed to provide emotional support and guidance.",
            guidelines: "Always maintain a supportive tone and provide helpful resources.",
            image: "../images/bot (1).png",
            assignedPatients: [1, 2],
            messageCount: 150
        },
        {
            id: 2,
            name: "Wellness Companion",
            bio: "Focused on daily wellness check-ins and mindfulness practices.",
            guidelines: "Encourage healthy habits and positive thinking patterns.",
            image: "../images/bot (2).png",
            assignedPatients: [1],
            messageCount: 89
        }
    ]
};

// Global variables
let currentViewData = null;
let currentViewType = null;
let selectedBotImage = "../images/bot-default.png";

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function () {
    updateDashboardCounts();
    updateBotRanking();
    renderPatientCards();
    renderSupervisorCards();
    renderBotCards();
    setupEventListeners();
});

// Update dashboard counts
function updateDashboardCounts() {
    document.getElementById('patient-num').textContent = sampleData.patients.length;
    document.getElementById('bots-num').textContent = sampleData.bots.length;
    document.getElementById('supervisors-num').textContent = sampleData.supervisors.length;
}

// Update bot ranking table
function updateBotRanking() {
    const tableBody = document.getElementById('ranking-table-body');
    const sortedBots = [...sampleData.bots].sort((a, b) => b.messageCount - a.messageCount);

    tableBody.innerHTML = sortedBots.map((bot, index) => `
        <tr>
            <td>${index + 1}</td>
            <td class="middle">${bot.name}</td>
            <td>${bot.messageCount}</td>
        </tr>
    `).join('');
}

// Render patient cards
function renderPatientCards() {
    const container = document.getElementById('patientsCardsContainer');
    const emptyContainer = document.getElementById('emptyPatientContainer');

    if (sampleData.patients.length === 0) {
        container.classList.add('d-none');
        emptyContainer.classList.remove('d-none');
        return;
    }

    container.classList.remove('d-none');
    emptyContainer.classList.add('d-none');

    container.innerHTML = sampleData.patients.map(patient => `
        <div class="col-xl-4 col-lg-6 col-md-6 col-sm-12">
            <div class="card h-100 d-flex flex-column justify-content-center align-items-center p-3">
                <div class="d-flex justify-content-center align-items-center w-100 position-relative">
                    <img src="${patient.image}" class="card-img-top" alt="patient" style="width: 100px; height: 100px; object-fit: cover;">
                    <div class="dropdown position-absolute bot-edit-i end-0">
                        <i class="bi bi-three-dots-vertical fs-3" data-bs-toggle="dropdown" aria-expanded="false"></i>
                        <ul class="dropdown-menu">
                            <li><button class="dropdown-item custom-drop" onclick="viewDetails('patient', ${patient.id})" data-bs-toggle="offcanvas" data-bs-target="#viewBotOffcanvas">
                                <i class="bi bi-eye pe-1"></i>
                                View Details
                            </button></li>
                            <li><button class="dropdown-item custom-drop text-danger" onclick="deleteItem('patient', ${patient.id})">
                                <i class="bi bi-trash pe-1"></i>
                                Delete Patient
                            </button></li>
                        </ul>
                    </div>
                </div>
                <div class="card-body text-center">
                    <h5 class="card-title">${patient.firstName} ${patient.lastName}</h5>
                    <p class="card-text">${patient.bio}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// Render supervisor cards
function renderSupervisorCards() {
    const container = document.getElementById('supervisorsCardsContainer');
    const emptyContainer = document.getElementById('emptySupervisorContainer');

    if (sampleData.supervisors.length === 0) {
        container.classList.add('d-none');
        emptyContainer.classList.remove('d-none');
        return;
    }

    container.classList.remove('d-none');
    emptyContainer.classList.add('d-none');

    container.innerHTML = sampleData.supervisors.map(supervisor => `
        <div class="col-xl-4 col-lg-6 col-md-6 col-sm-12">
            <div class="card h-100 d-flex flex-column justify-content-center align-items-center p-3">
                <div class="d-flex justify-content-center align-items-center w-100 position-relative">
                    <img src="${supervisor.image}" class="card-img-top" alt="supervisor" style="width: 100px; height: 100px; object-fit: cover;">
                    <div class="dropdown position-absolute bot-edit-i end-0">
                        <i class="bi bi-three-dots-vertical fs-3" data-bs-toggle="dropdown" aria-expanded="false"></i>
                        <ul class="dropdown-menu">
                            <li><button class="dropdown-item custom-drop" onclick="viewDetails('supervisor', ${supervisor.id})" data-bs-toggle="offcanvas" data-bs-target="#viewBotOffcanvas">
                                <i class="bi bi-eye pe-1"></i>
                                View Details
                            </button></li>
                            <li><button class="dropdown-item custom-drop text-danger" onclick="deleteItem('supervisor', ${supervisor.id})">
                                <i class="bi bi-trash pe-1"></i>
                                Delete Supervisor
                            </button></li>
                        </ul>
                    </div>
                </div>
                <div class="card-body text-center">
                    <h5 class="card-title">${supervisor.firstName} ${supervisor.lastName}</h5>
                    <p class="card-text">${supervisor.bio}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// Render bot cards
function renderBotCards() {
    const container = document.getElementById('botCardsContainer');
    const emptyContainer = document.getElementById('emptyBotContainer');

    if (sampleData.bots.length === 0) {
        container.classList.add('d-none');
        emptyContainer.classList.remove('d-none');
        return;
    }

    container.classList.remove('d-none');
    emptyContainer.classList.add('d-none');

    container.innerHTML = sampleData.bots.map(bot => `
        <div class="col-xl-4 col-lg-6 col-md-6 col-sm-12">
            <div class="card h-100 d-flex flex-column justify-content-center align-items-center p-3">
                <div class="d-flex justify-content-center align-items-center w-100 position-relative">
                    <img src="${bot.image}" class="card-img-top" alt="bot" style="width: 100px; height: 100px; object-fit: cover;">
                    <div class="dropdown position-absolute bot-edit-i end-0">
                        <i class="bi bi-three-dots-vertical fs-3" data-bs-toggle="dropdown" aria-expanded="false"></i>
                        <ul class="dropdown-menu">
                            <li><button class="dropdown-item custom-drop" onclick="viewDetails('bot', ${bot.id})" data-bs-toggle="offcanvas" data-bs-target="#viewBotOffcanvas">
                                <i class="bi bi-eye pe-1"></i>
                                View Details
                            </button></li>
                            <li><button class="dropdown-item custom-drop text-danger" onclick="deleteItem('bot', ${bot.id})">
                                <i class="bi bi-trash pe-1"></i>
                                Delete Bot
                            </button></li>
                        </ul>
                    </div>
                </div>
                <div class="card-body text-center">
                    <h5 class="card-title">${bot.name}</h5>
                    <p class="card-text">${bot.bio}</p>
                </div>
            </div>
        </div>
    `).join('');

    // Update bot counter
    const botCounters = document.querySelectorAll('#botCounter');
    botCounters.forEach(counter => {
        counter.textContent = sampleData.bots.length;
    });
}

// View details function
function viewDetails(type, id) {
    let item;
    currentViewType = type;

    switch (type) {
        case 'patient':
            item = sampleData.patients.find(p => p.id === id);
            break;
        case 'supervisor':
            item = sampleData.supervisors.find(s => s.id === id);
            break;
        case 'bot':
            item = sampleData.bots.find(b => b.id === id);
            break;
    }

    if (!item) return;

    currentViewData = item;
    populateViewOffcanvas(type, item);
}

// Populate view offcanvas based on type
function populateViewOffcanvas(type, item) {
    const offcanvasBody = document.querySelector('#viewBotOffcanvas .offcanvas-body');

    if (type === 'bot') {
        // Bot view
        offcanvasBody.innerHTML = `
            <div class="mb-3 d-flex justify-content-center align-items-center">
                <div class="d-flex flex-column align-items-center justify-content-center border-bottom pb-3 mb-2">
                    <img src="${item.image}" alt="bot" width="100" class="bg-secondary-white pt-3 pb-2 rounded-circle">
                    <p class="fs-5">${item.name}</p>
                </div>
            </div>
            <div class="row mb-3">
                <label class="custom-label text-start">Bot Name</label>
                <p class="ps-0 pt-2">${item.name}</p>
            </div>
            <div class="row mb-3">
                <label class="custom-label text-start">Bio</label>
                <p class="ps-0 pt-2">${item.bio}</p>
            </div>
            <div class="row mb-3">
                <label class="custom-label text-start">Guidelines</label>
                <p class="ps-0 pt-2">${item.guidelines}</p>
            </div>
            <div class="row mb-3">
                <label class="custom-label text-start">Assigned Patients</label>
                <p class="ps-0 pt-2">${getAssignedPatientNames(item.assignedPatients)}</p>
            </div>
            <div class="row mb-3">
                <label class="custom-label text-start">Message Count</label>
                <p class="ps-0 pt-2">${item.messageCount}</p>
            </div>
            <div class="offcanvas-footer d-flex justify-content-end border-top mt-2 pt-3">
                <button type="button" class="custom-btn bg-transparent me-2" data-bs-dismiss="offcanvas">Cancel</button>
                <button type="button" class="custom-btn btn-error" onclick="confirmDelete()">Delete</button>
            </div>
        `;
    } else {
        // Patient/Supervisor view
        const title = type === 'patient' ? 'Patient' : 'Supervisor';
        offcanvasBody.innerHTML = `
            <div class="mb-3 d-flex justify-content-center align-items-center">
                <div class="d-flex flex-column align-items-center justify-content-center border-bottom pb-3 mb-2">
                    <img src="${item.image}" alt="${type}" width="100" class="bg-secondary-white pt-3 pb-2 rounded-circle">
                    <p class="fs-5">${item.firstName} ${item.lastName}</p>
                </div>
            </div>
            <div class="row mb-3">
                <label class="custom-label text-start">First Name</label>
                <p class="ps-0 pt-2">${item.firstName}</p>
            </div>
            <div class="row mb-3">
                <label class="custom-label text-start">Last Name</label>
                <p class="ps-0 pt-2">${item.lastName}</p>
            </div>
            <div class="row mb-3">
                <label class="custom-label text-start">Email</label>
                <p class="ps-0 pt-2">${item.email}</p>
            </div>
            <div class="row mb-3">
                <label class="custom-label text-start">Gender</label>
                <p class="ps-0 pt-2">${item.gender}</p>
            </div>
            <div class="row mb-3">
                <label class="custom-label text-start">Bio</label>
                <p class="ps-0 pt-2">${item.bio}</p>
            </div>
            <div class="offcanvas-footer d-flex justify-content-end border-top mt-2 pt-3">
                <button type="button" class="custom-btn bg-transparent me-2" data-bs-dismiss="offcanvas">Cancel</button>
                <button type="button" class="custom-btn btn-error" onclick="confirmDelete()">Delete</button>
            </div>
        `;
    }

    // Update offcanvas title
    document.getElementById('viewBotName').textContent = `View ${title} Details`;
}

// Get assigned patient names for bot display
function getAssignedPatientNames(patientIds) {
    if (!patientIds || patientIds.length === 0) return 'None';

    const names = patientIds.map(id => {
        const patient = sampleData.patients.find(p => p.id === id);
        return patient ? `${patient.firstName} ${patient.lastName}` : '';
    }).filter(name => name);

    return names.length > 0 ? names.join(', ') : 'None';
}

// Delete item function
function deleteItem(type, id) {
    currentViewType = type;
    currentViewData = { id };

    // Show delete confirmation modal
    const modal = new bootstrap.Modal(document.getElementById('deleteBotModal'));

    // Update modal text based on type
    const modalTitle = document.getElementById('deleteBotModalLabel');
    const modalText = document.querySelector('#deleteBotModal .fs-5');
    const modalSubtext = document.querySelector('#deleteBotModal .fs-6');

    switch (type) {
        case 'patient':
            modalTitle.textContent = 'Delete Patient?';
            modalText.textContent = 'Are you sure you want to delete this patient?';
            modalSubtext.textContent = 'This action cannot be undone, and all patient data will be permanently removed.';
            break;
        case 'supervisor':
            modalTitle.textContent = 'Delete Supervisor?';
            modalText.textContent = 'Are you sure you want to delete this supervisor?';
            modalSubtext.textContent = 'This action cannot be undone, and all supervisor data will be permanently removed.';
            break;
        case 'bot':
            modalTitle.textContent = 'Delete Bot?';
            modalText.textContent = 'Are you sure you want to delete this bot?';
            modalSubtext.textContent = 'This action cannot be undone, and all assigned patients will lose access to this bot\'s support.';
            break;
    }

    modal.show();
}

// Confirm delete function
function confirmDelete() {
    if (!currentViewData || !currentViewType) return;

    const id = currentViewData.id;

    switch (currentViewType) {
        case 'patient':
            sampleData.patients = sampleData.patients.filter(p => p.id !== id);
            renderPatientCards();
            break;
        case 'supervisor':
            sampleData.supervisors = sampleData.supervisors.filter(s => s.id !== id);
            renderSupervisorCards();
            break;
        case 'bot':
            sampleData.bots = sampleData.bots.filter(b => b.id !== id);
            renderBotCards();
            updateBotRanking();
            break;
    }

    updateDashboardCounts();

    // Close modals and offcanvas
    const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteBotModal'));
    const viewOffcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('viewBotOffcanvas'));

    if (deleteModal) deleteModal.hide();
    if (viewOffcanvas) viewOffcanvas.hide();

    currentViewData = null;
    currentViewType = null;
}

// Setup event listeners
function setupEventListeners() {
    // Add bot form submission
    document.getElementById('addBotForm').addEventListener('submit', function (e) {
        e.preventDefault();
        addNewBot();
    });

    // Delete confirmation button
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);

    // Populate patient dropdown for bot assignment
    populatePatientDropdown();
}

// Add new bot function
function addNewBot() {
    const name = document.getElementById('add-bot-name').value.trim();
    const bio = document.getElementById('add-bot-bio').value.trim();
    const guidelines = document.getElementById('add-bot-guide').value.trim();

    if (!name || !bio || !guidelines) {
        alert('Please fill in all required fields');
        return;
    }

    const newBot = {
        id: Math.max(...sampleData.bots.map(b => b.id), 0) + 1,
        name: name,
        bio: bio,
        guidelines: guidelines,
        image: selectedBotImage,
        assignedPatients: getSelectedPatients(),
        messageCount: 0
    };

    sampleData.bots.push(newBot);

    // Reset form
    document.getElementById('addBotForm').reset();
    selectedBotImage = "../images/bot-default.png";
    document.getElementById('addBotPreviewImg').src = selectedBotImage;
    document.getElementById('assigned-patients-list').innerHTML = '';

    // Update displays
    renderBotCards();
    updateDashboardCounts();
    updateBotRanking();

    // Close offcanvas
    const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('addBotOffcanvas'));
    if (offcanvas) offcanvas.hide();
}

// Populate patient dropdown
function populatePatientDropdown() {
    const dropdown = document.getElementById('patientDropdownList');
    dropdown.innerHTML = sampleData.patients.map(patient => `
        <li><a class="dropdown-item" href="#" onclick="assignPatient(${patient.id}, '${patient.firstName} ${patient.lastName}')">${patient.firstName} ${patient.lastName}</a></li>
    `).join('');
}

// Assign patient to bot
function assignPatient(patientId, patientName) {
    const assignedList = document.getElementById('assigned-patients-list');

    // Check if patient is already assigned
    if (assignedList.querySelector(`[data-patient-id="${patientId}"]`)) {
        return;
    }

    const patientTag = document.createElement('span');
    patientTag.className = 'badge bg-primary me-2 mb-2';
    patientTag.dataset.patientId = patientId;
    patientTag.innerHTML = `
        ${patientName}
        <i class="bi bi-x ms-1" onclick="removeAssignedPatient(${patientId})" style="cursor: pointer;"></i>
    `;

    assignedList.appendChild(patientTag);
}

// Remove assigned patient
function removeAssignedPatient(patientId) {
    const patientTag = document.querySelector(`[data-patient-id="${patientId}"]`);
    if (patientTag) {
        patientTag.remove();
    }
}

// Get selected patients for bot creation
function getSelectedPatients() {
    const assignedTags = document.querySelectorAll('#assigned-patients-list [data-patient-id]');
    return Array.from(assignedTags).map(tag => parseInt(tag.dataset.patientId));
}

// Change bot picture
function changeBotPicture(imageSrc) {
    selectedBotImage = imageSrc;
    document.getElementById('addBotPreviewImg').src = imageSrc;

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('choosePictureModal'));
    if (modal) modal.hide();
}

// Reset bot picture
function resetBotPicture() {
    selectedBotImage = "../images/bot-default.png";
    document.getElementById('addBotPreviewImg').src = selectedBotImage;
}

// Handle logout
function handleLogout() {
    // Add your logout logic here
    console.log('Logging out...');
    // For demo purposes, just close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('logoutModal'));
    if (modal) modal.hide();
}

// Update header title when switching tabs
document.addEventListener('shown.bs.tab', function (e) {
    const target = e.target.getAttribute('data-bs-target');
    const headerTitle = document.getElementById('header-title');

    switch (target) {
        case '#v-pills-dashboard':
            headerTitle.textContent = 'Dashboard';
            break;
        case '#v-pills-patients':
            headerTitle.textContent = 'Patients';
            break;
        case '#v-pills-supervisors':
            headerTitle.textContent = 'Supervisors';
            break;
        case '#v-pills-bots':
            headerTitle.textContent = 'Bots';
            break;
    }
});