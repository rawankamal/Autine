// Bot Management JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Initialize bot management
    initBotManagement();
});

// Global variables
let bots = [];
let selectedBotPicture = '../images/bot-default.png';
let currentBotId = null;
let tempAssignedPatients = [];
let availablePatients = [
    { id: 1, name: 'John Doe', img: '../images/patient.png' },
    { id: 2, name: 'Jane Smith', img: '../images/patient.png' },
    { id: 3, name: 'Alice Johnson', img: '../images/patient.png' },
    { id: 4, name: 'Liam Carter', img: '../images/patient.png' },
    { id: 5, name: 'Emma Wilson', img: '../images/patient.png' }
];

// Initialize bot management functionality
function initBotManagement() {
    // Example bot for demonstration
    if (bots.length === 0) {
        addExampleBot();
    }

    // Load patients into dropdowns
    populatePatientDropdowns();

    // Initialize form submissions
    initializeFormHandlers();

    // Update UI
    updateBotsUI();
}

// Add example bot for demonstration
function addExampleBot() {
    bots.push({
        id: generateUniqueId(),
        name: 'Spark Bot',
        picture: '../images/bot (1).png',
        bio: 'An energetic chatbot that keeps conversations fun, motivating, and engaging',
        guidelines: 'Use positive and energetic language. Keep responses concise and upbeat. Ask engaging questions.',
        assignedPatients: [
            { id: 1, name: 'John Doe', img: '../images/patient.png' },
            { id: 2, name: 'Jane Smith', img: '../images/patient.png' },
            { id: 3, name: 'Alice Johnson', img: '../images/patient.png' },
            { id: 4, name: 'Liam Carter', img: '../images/patient.png' }
        ]
    });
}

// Generate unique ID
function generateUniqueId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Initialize form handlers
function initializeFormHandlers() {
    // Add Bot Form
    const addBotForm = document.getElementById('addBotForm');
    if (addBotForm) {
        addBotForm.addEventListener('submit', function (e) {
            e.preventDefault();
            createNewBot();
        });
    }

    // Edit Bot Form
    const editBotForm = document.getElementById('editBotForm');
    if (editBotForm) {
        editBotForm.addEventListener('submit', function (e) {
            e.preventDefault();
            saveEditedBot();
        });
    }

    // Delete Bot Confirmation
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function () {
            confirmDeleteBot();
        });
    }
}

// Populate patient dropdowns
function populatePatientDropdowns() {
    const addPatientDropdown = document.getElementById('patientDropdownList');
    const editPatientDropdown = document.getElementById('editPatientDropdown');

    if (addPatientDropdown) {
        addPatientDropdown.innerHTML = '';
        availablePatients.forEach(patient => {
            const li = document.createElement('li');
            li.innerHTML = `
                <a class="dropdown-item patient-drop" href="#" onclick="assignPatient(${patient.id}, '${patient.name}', '${patient.img}')">
                    <div class="d-flex align-items-center">
                        <img src="${patient.img}" alt="patient" class="pe-1" width="30">
                        ${patient.name}
                    </div>
                    <button class="btn-text btn-text-primary ps-5">Add</button>
                </a>
            `;
            addPatientDropdown.appendChild(li);
        });
    }

    if (editPatientDropdown) {
        editPatientDropdown.innerHTML = '';
        availablePatients.forEach(patient => {
            const li = document.createElement('li');
            li.innerHTML = `
                <a class="dropdown-item patient-drop" href="#" onclick="assignPatientToEdit(${patient.id}, '${patient.name}', '${patient.img}')">
                    <div class="d-flex align-items-center">
                        <img src="${patient.img}" alt="patient" class="pe-1" width="30">
                        ${patient.name}
                    </div>
                    <button class="btn-text btn-text-primary ps-5">Add</button>
                </a>
            `;
            editPatientDropdown.appendChild(li);
        });
    }
}

// Handle bot picture selection
function changeBotPicture(picturePath) {
    selectedBotPicture = picturePath;

    // Update all preview images
    const botPictureElements = [
        document.getElementById('addBotPreviewImg'),
        document.getElementById('editBotPreviewImg'),
        document.getElementById('viewBotPreviewImg')
    ];

    botPictureElements.forEach(element => {
        if (element) {
            element.src = picturePath;
        }
    });

    // Close modals
    const pictureModal = bootstrap.Modal.getInstance(document.getElementById('choosePictureModal'));
    if (pictureModal) pictureModal.hide();

    const editPictureModal = bootstrap.Modal.getInstance(document.getElementById('choosePictureModalEdit'));
    if (editPictureModal) editPictureModal.hide();
}

// Reset bot picture to default
function resetBotPicture() {
    changeBotPicture('../images/bot-default.png');
}

// Update the bots UI
function updateBotsUI() {
    const botCardsContainer = document.getElementById('botCardsContainer');
    const emptyBotContainer = document.getElementById('emptyBotContainer');
    const botCounter = document.getElementById('botCounter');

    if (botCardsContainer && emptyBotContainer && botCounter) {
        // Update bot counter
        botCounter.textContent = bots.length;

        // Show/hide empty state
        if (bots.length === 0) {
            emptyBotContainer.classList.remove('d-none');
            botCardsContainer.classList.add('d-none');
        } else {
            emptyBotContainer.classList.add('d-none');
            botCardsContainer.classList.remove('d-none');

            // Render bot cards
            renderBotCards();
        }
    }
}

// Render bot cards
function renderBotCards() {
    const botCardsContainer = document.getElementById('botCardsContainer');
    if (botCardsContainer) {
        botCardsContainer.innerHTML = '';

        bots.forEach(bot => {
            const card = document.createElement('div');
            card.className = 'col-xl-4 col-lg-6 col-md-6 col-sm-12';

            // Create patient avatars
            let patientAvatars = '';
            let extraPatients = 0;

            bot.assignedPatients.forEach((patient, index) => {
                if (index < 4) {
                    patientAvatars += `<img src="${patient.img}" alt="patient">`;
                } else {
                    extraPatients++;
                }
            });

            let extraPatientsText = extraPatients > 0 ?
                `<span class="btn-text-primary ps-1">+${extraPatients} assigned patients</span>` : '';

            card.innerHTML = `
                <div class="card h-100 d-flex flex-column justify-content-center align-items-center p-3">
                    <div class="d-flex justify-content-center align-items-center w-100 position-relative">
                        <img src="${bot.picture}" class="card-img-top" alt="bot">
                        <div class="dropdown position-absolute bot-edit-i end-0">
                            <i class="bi bi-three-dots-vertical fs-3" data-bs-toggle="dropdown" aria-expanded="false"></i>
                            <ul class="dropdown-menu">
                                <li><button class="dropdown-item custom-drop" onclick="viewBot('${bot.id}')">
                                    <i class="bi bi-eye pe-1"></i>
                                    View Details
                                </button></li>
                                <li><button class="dropdown-item custom-drop" onclick="editBot('${bot.id}')">
                                    <i class="bi bi-pencil pe-1"></i>
                                    Edit Bot</button></li>
                                <li><button class="dropdown-item custom-drop text-danger" onclick="openDeleteModal('${bot.id}')">
                                    <i class="bi bi-trash pe-1"></i>
                                    Delete Bot</button></li>
                            </ul>
                        </div>
                    </div>
                    <div class="card-body text-center">
                        <h5 class="card-title">${bot.name}</h5>
                        <p class="card-text">${bot.bio}</p>
                        <div class="pt-2 d-flex justify-content-center align-items-center">
                            ${patientAvatars}
                            ${extraPatientsText}
                        </div>
                    </div>
                </div>
            `;

            botCardsContainer.appendChild(card);
        });
    }
}

// Create a new bot
function createNewBot() {
    const botName = document.getElementById('add-bot-name').value;
    const botBio = document.getElementById('add-bot-bio').value;
    const botGuide = document.getElementById('add-bot-guide').value;

    // Validate inputs
    if (!botName || !botBio || !botGuide) {
        alert('Please fill in all required fields');
        return;
    }

    // Create new bot object
    const newBot = {
        id: generateUniqueId(),
        name: botName,
        picture: selectedBotPicture,
        bio: botBio,
        guidelines: botGuide,
        assignedPatients: [...tempAssignedPatients]
    };

    // Add to bots array
    bots.push(newBot);

    // Update UI
    updateBotsUI();

    // Close offcanvas
    const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('addBotOffcanvas'));
    if (offcanvas) offcanvas.hide();

    // Reset form
    resetAddBotForm();
}

// Reset add bot form
function resetAddBotForm() {
    document.getElementById('add-bot-name').value = '';
    document.getElementById('add-bot-bio').value = '';
    document.getElementById('add-bot-guide').value = '';
    resetBotPicture();
    document.getElementById('assigned-patients-list').innerHTML = '';
    tempAssignedPatients = [];
}

// Assign patient to bot
function assignPatient(patientId, patientName, patientImg) {
    // Check if patient is already assigned
    if (tempAssignedPatients.some(p => p.id === patientId)) {
        return;
    }

    // Add patient to assigned patients list
    tempAssignedPatients.push({
        id: patientId,
        name: patientName,
        img: patientImg
    });

    // Update UI
    updateAssignedPatientsUI();
}

// Assign patient to edit mode
function assignPatientToEdit(patientId, patientName, patientImg) {
    const bot = bots.find(b => b.id === currentBotId);
    if (!bot) return;

    // Check if patient is already assigned
    if (bot.assignedPatients.some(p => p.id === patientId)) {
        return;
    }

    // Add patient to bot's assigned patients
    bot.assignedPatients.push({
        id: patientId,
        name: patientName,
        img: patientImg
    });

    // Update UI
    updateEditAssignedPatientsUI();
}

// Update assigned patients UI
function updateAssignedPatientsUI() {
    const assignedPatientsList = document.getElementById('assigned-patients-list');
    if (assignedPatientsList) {
        assignedPatientsList.innerHTML = '';

        tempAssignedPatients.forEach(patient => {
            const patientElement = document.createElement('div');
            patientElement.className = 'custom-btn w-100 text-start custom-border px-2 text-secondary mb-2 d-flex justify-content-between align-items-center patient-item';
            patientElement.dataset.patientId = patient.id;

            patientElement.innerHTML = `
                <div>
                    <img src="${patient.img}" alt="patient" class="pe-1" width="30">
                    ${patient.name}
                </div>
                <button class="btn-text-error" onclick="removeAssignedPatient(${patient.id})">
                    <i class="bi bi-x"></i>
                </button>
            `;

            assignedPatientsList.appendChild(patientElement);
        });
    }
}

// Update edit assigned patients UI
function updateEditAssignedPatientsUI() {
    const bot = bots.find(b => b.id === currentBotId);
    if (!bot) return;

    const editAssignedPatientsList = document.getElementById('edit-assigned-patients-list');
    if (editAssignedPatientsList) {
        editAssignedPatientsList.innerHTML = '';

        bot.assignedPatients.forEach(patient => {
            const patientElement = document.createElement('div');
            patientElement.className = 'custom-btn w-100 text-start custom-border px-2 text-secondary mb-2 d-flex justify-content-between align-items-center patient-item';
            patientElement.dataset.patientId = patient.id;

            patientElement.innerHTML = `
                <div>
                    <img src="${patient.img}" alt="patient" class="pe-1" width="30">
                    ${patient.name}
                </div>
                <button class="btn-text-error" onclick="removeEditAssignedPatient(${patient.id})">
                    <i class="bi bi-x"></i>
                </button>
            `;

            editAssignedPatientsList.appendChild(patientElement);
        });
    }
}

// Remove assigned patient
function removeAssignedPatient(patientId) {
    tempAssignedPatients = tempAssignedPatients.filter(p => p.id !== patientId);
    updateAssignedPatientsUI();
}

// Remove edit assigned patient
function removeEditAssignedPatient(patientId) {
    const bot = bots.find(b => b.id === currentBotId);
    if (!bot) return;

    bot.assignedPatients = bot.assignedPatients.filter(p => p.id !== patientId);
    updateEditAssignedPatientsUI();
}

// View bot details
function viewBot(botId) {
    const bot = bots.find(b => b.id === botId);
    if (!bot) return;

    // Set current bot ID
    currentBotId = botId;

    // Fill view form
    document.getElementById('viewBotName').textContent = bot.name;
    document.getElementById('viewBotPreviewImg').src = bot.picture;
    document.getElementById('view-bot-name').value = bot.name;
    document.getElementById('view-bot-bio').value = bot.bio;
    document.getElementById('view-bot-guide').value = bot.guidelines;

    // Update assigned patients
    const viewAssignedPatientsList = document.getElementById('view-assigned-patients-list');
    if (viewAssignedPatientsList) {
        viewAssignedPatientsList.innerHTML = '';

        bot.assignedPatients.forEach(patient => {
            const patientElement = document.createElement('div');
            patientElement.className = 'custom-btn w-100 text-start custom-border px-2 text-secondary mb-2';

            patientElement.innerHTML = `
                <img src="${patient.img}" alt="patient" class="pe-1" width="30">
                ${patient.name}
            `;

            viewAssignedPatientsList.appendChild(patientElement);
        });
    }

    // Open view offcanvas
    const viewBotOffcanvas = new bootstrap.Offcanvas(document.getElementById('viewBotOffcanvas'));
    viewBotOffcanvas.show();
}

// Open edit bot form
function editBot(botId) {
    const bot = bots.find(b => b.id === botId);
    if (!bot) return;

    // Set current bot ID
    currentBotId = botId;

    // Fill edit form
    document.getElementById('editBotPreviewImg').src = bot.picture;
    document.getElementById('edit-bot-name').value = bot.name;
    document.getElementById('edit-bot-bio').value = bot.bio;
    document.getElementById('edit-bot-guide').value = bot.guidelines;
    selectedBotPicture = bot.picture;

    // Update assigned patients UI
    updateEditAssignedPatientsUI();

    // Close view offcanvas if open
    const viewBotOffcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('viewBotOffcanvas'));
    if (viewBotOffcanvas) viewBotOffcanvas.hide();

    // Open edit offcanvas
    const editBotOffcanvas = new bootstrap.Offcanvas(document.getElementById('editBotOffcanvas'));
    editBotOffcanvas.show();
}

// Open edit bot from view
function openEditBot() {
    if (currentBotId) {
        // Close view offcanvas
        const viewBotOffcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('viewBotOffcanvas'));
        if (viewBotOffcanvas) viewBotOffcanvas.hide();

        // Open edit offcanvas with current bot ID
        editBot(currentBotId);
    }
}

// Save edited bot
function saveEditedBot() {
    const botIndex = bots.findIndex(b => b.id === currentBotId);
    if (botIndex === -1) return;

    const botName = document.getElementById('edit-bot-name').value;
    const botBio = document.getElementById('edit-bot-bio').value;
    const botGuide = document.getElementById('edit-bot-guide').value;

    // Validate inputs
    if (!botName || !botBio || !botGuide) {
        alert('Please fill in all required fields');
        return;
    }

    // Update bot object
    bots[botIndex] = {
        ...bots[botIndex],
        name: botName,
        picture: selectedBotPicture,
        bio: botBio,
        guidelines: botGuide
    };

    // Update UI
    updateBotsUI();

    // Close offcanvas
    const editBotOffcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('editBotOffcanvas'));
    if (editBotOffcanvas) editBotOffcanvas.hide();

    // Reset current bot ID
    currentBotId = null;
}

// Open delete confirmation modal
function openDeleteModal(botId) {
    currentBotId = botId;
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteBotModal'));
    deleteModal.show();
}

// Confirm delete bot
function confirmDeleteBot() {
    if (!currentBotId) return;

    // Remove bot from array
    bots = bots.filter(b => b.id !== currentBotId);

    // Update UI
    updateBotsUI();

    // Close modal
    const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteBotModal'));
    if (deleteModal) deleteModal.hide();

    // Reset current bot ID
    currentBotId = null;
}

// Delete bot (without confirmation - called from delete modal)
function deleteBot() {
    // For direct deletion without confirmation (Not recommended)
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteBotModal'));
    deleteModal.show();
}