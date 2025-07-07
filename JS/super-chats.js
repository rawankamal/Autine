// Authentication functions
function getAuthData() {
    try {
        const authData = sessionStorage.getItem('authData') || localStorage.getItem('authData');
        return authData ? JSON.parse(authData) : null;
    } catch (error) {
        console.error('Error parsing auth data:', error);
        return null;
    }
}

function checkAuth() {
    const authData = getAuthData();

    if (!authData || !authData.accessToken) {
        console.log("No access token found, redirecting to login");
        return false;
    }

    // Check if token is expired
    if (authData.expiresAt && Date.now() >= authData.expiresAt) {
        console.log("Token expired, redirecting to login");
        clearAuthData();
        window.location.href = '../pages/login.html';
        return false;
    }

    return true;
}

function clearAuthData() {
    sessionStorage.removeItem('authData');
    localStorage.removeItem('authData');
    sessionStorage.removeItem('userEmail');
    localStorage.removeItem('userEmail');
}

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

// Custom Chat Interface with API Integration
class CustomChatManager {
    constructor() {
        this.currentChatId = null;
        this.currentThreadId = null;
        this.currentPatientId = null; // user_username (patient ID)
        this.supervisorUsername = null; // Current logged-in supervisor
        this.chats = new Map();
        this.threads = new Map();
        this.supervisors = [];
        this.activeTab = 'chats';
        this.apiBase = 'https://grad-project-ai-api.vercel.app';
        this.sessionId = "1"; // Fixed session ID as string
        this.init();
    }

    init() {
        this.getSupervisorUsername();
        this.bindEvents();
        this.loadData();
    }

    getSupervisorUsername() {
        // Get supervisor username from auth data or user input
        const authData = getAuthData();
        if (authData && authData.username) {
            this.supervisorUsername = authData.username;
        } else {
            // Fallback - you might want to get this from a login form or session
            this.supervisorUsername = 'default_supervisor'; // Replace with actual logic
        }
    }

    bindEvents() {
        // Tab switching
        document.getElementById('myChats-tab')?.addEventListener('click', () => {
            this.activeTab = 'chats';
            this.showEmptyState();
        });

        document.getElementById('myThreads-tab')?.addEventListener('click', () => {
            this.activeTab = 'threads';
            this.showEmptyState();
        });

        // Message sending
        const sendButton = document.getElementById('sendButton');
        const messageInput = document.getElementById('messageInput');
        sendButton?.addEventListener('click', () => this.sendMessage());
        messageInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Search functionality
        document.querySelectorAll('input[type="search"]').forEach(input => {
            input.addEventListener('input', (e) => this.handleSearch(e.target.value));
        });

        // Details toggles
        document.querySelector('[aria-label="View user details"]')?.addEventListener('click', () => {
            this.toggleChatDetails();
        });

        window.openThreadDetails = () => this.toggleThreadDetails();

        // Close details buttons
        document.querySelectorAll('[aria-label="Close details"]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('chatsDetails')?.classList.add('d-none');
                document.getElementById('threadDetails')?.classList.add('d-none');
            });
        });
    }

    async loadData() {
        // Check authentication first
        if (!checkAuth()) {
            showToast('Authentication required. Please login.', 'error');
            window.location.href = '../pages/login.html';
            return;
        }

        try {
            await Promise.all([
                this.fetchAllThreads(),
                this.fetchSupervisors()
            ]);
            this.showEmptyState();
            showToast('Data loaded successfully', 'success');
        } catch (error) {
            console.error('Error loading data:', error);
            showToast('Failed to load data.', 'error');
        }
    }

    // API Methods
    async sendMessageAPI(patientId, memberUsername, message) {
        try {
            const url = `${this.apiBase}/thread/supervisor/chat/send?supervisor_username=${this.supervisorUsername}&user_username=${patientId}&member_username=${memberUsername}&msg_text=${encodeURIComponent(message)}&session_id=1`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    getSupervisorUsername() {
        // First try to get from the profile loading function
        let supervisorId = getSupervisorId();

        // If not found, try auth data
        if (!supervisorId) {
            const authData = getAuthData();
            if (authData) {
                supervisorId = authData.supervisorId ||
                    authData.supervisor_id ||
                    authData.userId ||
                    authData.user_id ||
                    authData.id ||
                    authData.username;
            }
        }

        // If still not found, try DOM attribute
        if (!supervisorId) {
            supervisorId = document.body.getAttribute('data-supervisor-id') ||
                document.body.getAttribute('data-user-id');
        }

        if (supervisorId) {
            this.supervisorUsername = supervisorId;
            console.log('Supervisor ID set to:', supervisorId);
        } else {
            console.warn('No supervisor ID found');
            this.supervisorUsername = 'default_supervisor'; // Fallback
        }

        return this.supervisorUsername;
    }

    async fetchAllThreads() {
        try {
            // Get supervisor ID from auth data
            const authData = getAuthData();
            let supervisorId = null;

            // Try multiple possible fields for supervisor ID
            if (authData) {
                supervisorId = authData.supervisorId ||
                    authData.supervisor_id ||
                    authData.userId ||
                    authData.user_id ||
                    authData.id ||
                    authData.username;
            }

            if (!supervisorId) {
                throw new Error('No supervisor ID found in auth data');
            }

            // Set the supervisor username/ID for use in other methods
            this.supervisorUsername = supervisorId;

            const url = `${this.apiBase}/thread/supervisor/chat/gets?supervisor_username=${supervisorId}&session_id=1`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Threads data:', data);

            // Process threads data based on your API response structure
            if (data.thread_chats && Array.isArray(data.thread_chats)) {
                data.thread_chats.forEach((thread, index) => {
                    const threadId = `thread_${index}`;
                    this.threads.set(threadId, {
                        id: threadId,
                        patientId: thread.user_username,
                        name: thread.title,
                        avatar: '../images/user.png',
                        lastMessage: 'Start conversation',
                        timestamp: '',
                        messages: [],
                        members: [],
                        chatHistory: []
                    });
                });
            }

            // Process threads data based on your API response structure
            if (data.threads && Array.isArray(data.threads)) {
                data.threads.forEach((thread, index) => {
                    const threadId = `thread_${index}`;
                    this.threads.set(threadId, {
                        id: threadId,
                        patientId: thread.user_username || thread.patient_id,
                        name: thread.title || thread.patient_name || `Patient ${index + 1}`,
                        avatar: '../images/user.png',
                        lastMessage: thread.last_message || 'Start conversation',
                        timestamp: thread.timestamp || '',
                        messages: [],
                        members: [],
                        chatHistory: thread.messages || []
                    });
                });
            }

            console.log(`All threads fetched successfully. Total threads: ${this.threads.size}`);
            return data;
        } catch (error) {
            console.error('Error fetching threads:', error);
            showToast('Failed to fetch threads', 'error');
            throw error;
        }
    }

    async fetchSupervisors() {
        try {
            const url = `${this.apiBase}/supervisor/gets`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Supervisors data:', data);

            if (data.supervisors && Array.isArray(data.supervisors)) {
                this.supervisors = data.supervisors.map(supervisor => ({
                    id: supervisor.supervisor_username,
                    firstName: supervisor.supervisor_fname,
                    lastName: supervisor.supervisor_lname,
                    email: supervisor.supervisor_email,
                    fullName: `${supervisor.supervisor_fname} ${supervisor.supervisor_lname}`
                }));
            }

            this.updateSupervisorDropdown();
            return data;
        } catch (error) {
            console.error('Error fetching supervisors:', error);
            showToast('Failed to fetch supervisors', 'error');
            throw error;
        }
    }

    async fetchThreadMembers(patientId) {
        try {
            const url = `${this.apiBase}/thread/supervisor/member/gets?supervisor_username=${this.supervisorUsername}&user_username=${patientId}&session_id=1`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Thread members data:', data);

            // Process members data based on your API response structure
            const members = [];
            if (data.members && Array.isArray(data.members)) {
                data.members.forEach(member => {
                    members.push({
                        id: member.supervisor_username || member.id,
                        name: member.supervisor_fname && member.supervisor_lname
                            ? `${member.supervisor_fname} ${member.supervisor_lname}`
                            : member.name || 'Unknown Supervisor',
                        avatar: '../images/parent.png',
                        role: 'Supervisor'
                    });
                });
            }

            return members;
        } catch (error) {
            console.error('Error fetching thread members:', error);
            showToast('Failed to fetch thread members', 'error');
            return [];
        }
    }

    async fetchChatHistory(patientId) {
        try {
            // Assuming chat history is included in the thread data
            // If you have a separate endpoint for chat history, implement it here
            const thread = Array.from(this.threads.values()).find(t => t.patientId === patientId);
            return thread ? thread.chatHistory : [];
        } catch (error) {
            console.error('Error fetching chat history:', error);
            return [];
        }
    }

    // Update the dropdown event listener in updateSupervisorDropdown method
    updateSupervisorDropdown() {
        const dropdown = document.querySelector('.supervisor-dropdown .dropdown-menu');
        if (!dropdown) return;

        dropdown.innerHTML = '';
        this.supervisors.forEach(supervisor => {
            const li = document.createElement('li');
            li.className = 'd-flex align-items-center justify-content-between';
            li.innerHTML = `
            <a class="dropdown-item custom-drop" href="#" data-supervisor-id="${supervisor.id}">
                ${supervisor.fullName}
            </a>
            <span class="btn-text-primary mx-3 fw-bold add-supervisor-btn" data-supervisor-id="${supervisor.id}">Add</span>
        `;

            li.querySelector('.add-supervisor-btn').addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Disable button during API call
                const button = e.target;
                const originalText = button.textContent;
                button.textContent = 'Adding...';
                button.style.pointerEvents = 'none';

                try {
                    await this.addSupervisorToThread(supervisor.id, supervisor.fullName);
                } finally {
                    // Re-enable button
                    button.textContent = originalText;
                    button.style.pointerEvents = 'auto';
                }
            });

            dropdown.appendChild(li);
        });
    }



    // Update the addSupervisorToThread method
    async addSupervisorToThread(supervisorId, supervisorName) {
        try {
            if (!this.currentPatientId) {
                showToast('No thread selected', 'warning');
                return;
            }

            // Call the API to add member to thread
            const url = `${this.apiBase}/thread/supervisor/member/add?supervisor_username=${this.supervisorUsername}&user_username=${this.currentPatientId}&member_username=${supervisorId}&session_id=${this.sessionId}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Check for success - handle multiple possible success messages
            if (result.msg === "Supervisor User Member added" || 
                result.msg === "Member added successfully" || 
                result.success === true ||
                response.status === 200) {
                
                // Update local thread data
                if (this.currentThreadId) {
                    const thread = this.threads.get(this.currentThreadId);
                    if (thread) {
                        // Check if supervisor already exists locally
                        const existingMember = thread.members.find(m => m.id === supervisorId);
                        if (!existingMember) {
                            thread.members.push({
                                id: supervisorId,
                                name: supervisorName,
                                avatar: '../images/parent.png',
                                role: 'Supervisor'
                            });
                            this.updateThreadMembersDisplay(thread);
                        }
                    }
                }
                
                // Success toast
                showToast(`${supervisorName} added to thread successfully!`, 'success');
            } else {
                throw new Error(result.msg || 'Unknown error occurred');
            }

        } catch (error) {
            console.error('Error adding supervisor to thread:', error);

            // Handle specific error messages with appropriate toasts
            if (error.message.includes('Member exist') || error.message.includes('already exists')) {
                showToast(`${supervisorName} is already in this thread`, 'warning');
            } else if (error.message.includes('not exist') || error.message.includes('not found')) {
                showToast('User or supervisor not found', 'error');
            } else if (error.message.includes('Session not exist') || error.message.includes('expired')) {
                showToast('Session expired. Please login again.', 'error');
                // Optionally redirect to login
                // window.location.href = '../pages/login.html';
            } else {
                showToast(`Failed to add ${supervisorName} to thread: ${error.message}`, 'error');
            }
        }
    }

    showEmptyState() {
        const chatContainer = document.querySelector('#myChats-tab-pane .row.rounded-4');
        const threadContainer = document.querySelector('#myThreads-tab-pane .row.rounded-4');
        const emptyChatContainer = document.getElementById('empty-chats-container');
        const emptyThreadContainer = document.getElementById('empty-threads-container');

        if (this.activeTab === 'chats') {
            if (this.chats.size === 0) {
                chatContainer?.classList.add('d-none');
                emptyChatContainer?.classList.remove('d-none');
            } else {
                chatContainer?.classList.remove('d-none');
                emptyChatContainer?.classList.add('d-none');
                this.renderChatList();
            }
        } else {
            if (this.threads.size === 0) {
                threadContainer?.classList.add('d-none');
                emptyThreadContainer?.classList.remove('d-none');
            } else {
                threadContainer?.classList.remove('d-none');
                emptyThreadContainer?.classList.add('d-none');
                this.renderThreadList();
            }
        }
    }

    renderThreadList() {
        const threadList = document.querySelector('#threadAside .chat-list');
        if (!threadList) return;

        threadList.innerHTML = '';
        this.threads.forEach(thread => {
            threadList.appendChild(this.createThreadItem(thread));
        });
    }

    createThreadItem(thread) {
        const article = document.createElement('article');
        article.className = 'chat-item d-flex justify-content-start align-items-center border-bottom py-3';
        article.dataset.threadId = thread.id;
        article.style.cursor = 'pointer';

        article.innerHTML = `
            <img src="${thread.avatar}" alt="${thread.name}" width="56" class="rounded-circle me-3">
            <div class="d-flex flex-column justify-content-start align-items-start w-100">
                <div class="d-flex justify-content-between align-items-center w-100">
                    <p class="fw-bold mb-0">${thread.name}</p>
                    <small class="text-secondary">${thread.timestamp}</small>
                </div>
                <div class="d-flex justify-content-between align-items-center w-100">
                    <p class="text-secondary mb-0">${thread.lastMessage}</p>
                </div>
            </div>
        `;

        article.addEventListener('click', () => this.selectThread(thread.id));
        return article;
    }

    renderChatList() {
        const chatList = document.querySelector('#chatsAside .chat-list');
        if (!chatList) return;

        chatList.innerHTML = '';
        this.chats.forEach(chat => {
            chatList.appendChild(this.createChatItem(chat));
        });
    }

    createChatItem(chat) {
        const article = document.createElement('article');
        article.className = 'chat-item d-flex justify-content-start align-items-center border-bottom py-3';
        article.dataset.chatId = chat.id;
        article.style.cursor = 'pointer';

        article.innerHTML = `
            <img src="${chat.avatar}" alt="${chat.name}" width="56" class="rounded-circle me-3">
            <div class="d-flex flex-column justify-content-start align-items-start w-100">
                <div class="d-flex justify-content-between align-items-center w-100">
                    <p class="fw-bold mb-0">${chat.name}</p>
                    <small class="text-secondary">${chat.timestamp}</small>
                </div>
                <div class="d-flex justify-content-between align-items-center w-100">
                    <p class="text-secondary mb-0">${chat.lastMessage}</p>
                </div>
            </div>
        `;

        article.addEventListener('click', () => this.selectChat(chat.id));
        return article;
    }

    async selectThread(threadId) {
        this.currentThreadId = threadId;
        const thread = this.threads.get(threadId);
        if (!thread) return;

        this.currentPatientId = thread.patientId;

        document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`[data-thread-id="${threadId}"]`)?.classList.add('active');

        const header = document.querySelector('.thread-main .top-bar');
        if (header) {
            header.querySelector('img').src = thread.avatar;
            header.querySelector('img').alt = thread.name;
            header.querySelector('p').textContent = thread.name;
        }

        // Load thread members
        try {
            const members = await this.fetchThreadMembers(thread.patientId);
            thread.members = members;
            this.updateThreadMembersDisplay(thread);
        } catch (error) {
            console.error('Error loading thread members:', error);
        }

        // Load chat history
        try {
            const chatHistory = await this.fetchChatHistory(thread.patientId);
            thread.messages = this.processChatHistory(chatHistory);
            this.renderMessages(thread.messages, 'thread-main');
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    selectChat(chatId) {
        this.currentChatId = chatId;
        const chat = this.chats.get(chatId);
        if (!chat) return;

        document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`[data-chat-id="${chatId}"]`)?.classList.add('active');

        const header = document.querySelector('#chatsMain .top-bar');
        if (header) {
            header.querySelector('img').src = chat.avatar;
            header.querySelector('img').alt = chat.name;
            header.querySelector('p').textContent = chat.name;
        }

        this.renderMessages(chat.messages, 'chatsMain');
    }

    processChatHistory(chatHistory) {
        // Process chat history data into message format
        if (!Array.isArray(chatHistory)) return [];

        return chatHistory.map(msg => ({
            id: msg.id || 'msg_' + Date.now(),
            sender: msg.sender || msg.from || 'Unknown',
            content: msg.message || msg.text || msg.content,
            timestamp: msg.timestamp || msg.created_at || new Date().toISOString(),
            isOwn: msg.sender === this.supervisorUsername || msg.from === this.supervisorUsername
        }));
    }

    renderMessages(messages, containerClass) {
        const chatArea = document.querySelector(`.${containerClass} .chat-area`);
        if (!chatArea) return;

        const noMessagesContainer = chatArea.querySelector('#noMessagesContainer');

        if (messages.length === 0) {
            noMessagesContainer?.classList.remove('d-none');
            return;
        }

        noMessagesContainer?.classList.add('d-none');
        chatArea.querySelectorAll('.message').forEach(msg => msg.remove());

        messages.forEach(message => {
            chatArea.appendChild(this.createMessageElement(message));
        });

        chatArea.scrollTop = chatArea.scrollHeight;
    }

    createMessageElement(message) {
        const div = document.createElement('div');
        div.className = message.isOwn
            ? 'message d-flex justify-content-end mb-3'
            : 'message d-flex justify-content-start mb-3';

        const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        div.innerHTML = `
            <div class="message-bubble ${message.isOwn ? 'bg-primary text-white' : 'bg-light'} p-3 rounded-3" style="max-width: 70%;">
                ${!message.isOwn ? `<div class="fw-bold mb-1 text-primary">${message.sender}</div>` : ''}
                <div>${message.content}</div>
                <small class="text-${message.isOwn ? 'light' : 'muted'} d-block mt-1">${timestamp}</small>
            </div>
        `;

        return div;
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const content = messageInput?.value.trim();
        if (!content) return;

        if (this.activeTab === 'threads' && this.currentThreadId && this.currentPatientId) {
            try {
                // Send message via API
                await this.sendMessageAPI(this.currentPatientId, this.supervisorUsername, content);

                const timestamp = new Date().toISOString();
                const message = {
                    id: 'msg_' + Date.now(),
                    sender: this.supervisorUsername,
                    content: content,
                    timestamp: timestamp,
                    isOwn: true
                };

                const thread = this.threads.get(this.currentThreadId);
                if (thread) {
                    thread.messages.push(message);
                    thread.lastMessage = content;
                    thread.timestamp = new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    this.renderMessages(thread.messages, 'thread-main');
                    this.renderThreadList();
                }

                messageInput.value = '';
                showToast('Message sent successfully', 'success');
            } catch (error) {
                console.error('Error sending message:', error);
                showToast('Failed to send message', 'error');
            }
        } else if (this.activeTab === 'chats' && this.currentChatId) {
            // Handle regular chat messages (if needed)
            const timestamp = new Date().toISOString();
            const message = {
                id: 'msg_' + Date.now(),
                sender: this.supervisorUsername,
                content: content,
                timestamp: timestamp,
                isOwn: true
            };

            const chat = this.chats.get(this.currentChatId);
            if (chat) {
                chat.messages.push(message);
                chat.lastMessage = content;
                chat.timestamp = new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                this.renderMessages(chat.messages, 'chatsMain');
                this.renderChatList();
            }

            messageInput.value = '';
        } else {
            showToast('Please select a thread or chat to send a message', 'warning');
        }
    }

    handleSearch(query) {
        const items = this.activeTab === 'chats'
            ? document.querySelectorAll('#chatsAside .chat-item')
            : document.querySelectorAll('#threadAside .chat-item');

        items.forEach(item => {
            const name = item.querySelector('.fw-bold').textContent.toLowerCase();
            const message = item.querySelector('.text-secondary').textContent.toLowerCase();
            const searchTerm = query.toLowerCase();

            item.style.display = (name.includes(searchTerm) || message.includes(searchTerm)) ? 'flex' : 'none';
        });
    }

    toggleChatDetails() {
        const detailsPanel = document.getElementById('chatsDetails');
        const mainPanel = document.getElementById('chatsMain');

        if (detailsPanel?.classList.contains('d-none')) {
            detailsPanel.classList.remove('d-none');
            mainPanel?.classList.remove('col-lg-8');
            mainPanel?.classList.add('col-lg-5');
        } else {
            detailsPanel?.classList.add('d-none');
            mainPanel?.classList.remove('col-lg-5');
            mainPanel?.classList.add('col-lg-8');
        }
    }

    toggleThreadDetails() {
        const detailsPanel = document.getElementById('threadDetails');
        const mainPanel = document.querySelector('.thread-main');

        if (detailsPanel?.classList.contains('d-none')) {
            detailsPanel.classList.remove('d-none');
            mainPanel?.classList.remove('col-lg-8');
            mainPanel?.classList.add('col-lg-5');

            // Update thread ID display
            if (this.currentThreadId) {
                const thread = this.threads.get(this.currentThreadId);
                if (thread) {
                    const threadIdElement = detailsPanel.querySelector('.text-secondary.fs-6');
                    if (threadIdElement) {
                        threadIdElement.textContent = `THR-${thread.patientId || 'UNKNOWN'}`;
                    }
                    this.updateThreadMembersDisplay(thread);
                }
            }
        } else {
            detailsPanel?.classList.add('d-none');
            mainPanel?.classList.remove('col-lg-5');
            mainPanel?.classList.add('col-lg-8');
        }
    }

    updateThreadMembersDisplay(thread) {
        // Find or create members container
        let membersContainer = document.querySelector('#threadDetails .members-list');
        if (!membersContainer) {
            const detailsContent = document.querySelector('#threadDetails .d-flex.flex-column.justify-content-between');
            if (detailsContent) {
                membersContainer = document.createElement('div');
                membersContainer.className = 'members-list mt-3';
                detailsContent.appendChild(membersContainer);
            } else {
                return;
            }
        }

        if (!thread.members || thread.members.length === 0) {
            membersContainer.innerHTML = '<p class="text-secondary text-center">No members in this thread</p>';
            return;
        }

        membersContainer.innerHTML = '';

        thread.members.forEach(member => {
            const memberItem = document.createElement('div');
            memberItem.className = 'member-item d-flex justify-content-between align-items-center py-2 px-3 border-bottom';

            memberItem.innerHTML = `
                <div class="d-flex align-items-center">
                    <img src="${member.avatar}" alt="${member.name}" width="40" class="rounded-circle me-3">
                    <div>
                        <p class="mb-0 fw-bold">${member.name}</p>
                        <small class="text-secondary">${member.role}</small>
                    </div>
                </div>
            `;

            membersContainer.appendChild(memberItem);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CustomChatManager();
});

// Export for global access
window.CustomChatManager = CustomChatManager;