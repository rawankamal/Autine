// Chats Tab JavaScript
class ChatsManager {
  constructor() {
    this.currentChatId = null;
    this.currentThreadId = null;
    this.chats = [];
    this.threads = [];
    this.messages = [];
    this.apiBaseUrl = 'https://autine-back.runasp.net/api';
    this.currentTab = 'chats';

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadInitialData();
  }

  setupEventListeners() {
    // Tab switching
    document.getElementById('myChats-tab')?.addEventListener('click', () => {
      this.currentTab = 'chats';
      this.loadChats();
    });

    document.getElementById('myThreads-tab')?.addEventListener('click', () => {
      this.currentTab = 'threads';
      this.loadThreads();
    });

    // Search functionality
    const chatSearchInput = document.querySelector('#v-pills-chats .search-bar input');
    if (chatSearchInput) {
      chatSearchInput.addEventListener('input', (e) => {
        this.searchChats(e.target.value);
      });
    }

    // New chat/thread buttons
    document.querySelectorAll('.btn[aria-label="New chat"]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.currentTab === 'chats') {
          this.createNewChat();
        } else {
          this.createNewThread();
        }
      });
    });

    // Message input and send
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');

    if (messageInput) {
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendMessage();
        }
      });
    }

    if (sendButton) {
      sendButton.addEventListener('click', () => {
        this.sendMessage();
      });
    }

    // Chat item clicks
    document.addEventListener('click', (e) => {
      const chatItem = e.target.closest('.chat-item');
      if (chatItem) {
        const chatId = chatItem.dataset.chatId;
        if (this.currentTab === 'chats') {
          this.selectChat(chatId);
        } else {
          this.selectThread(chatId);
        }
      }
    });

    

    // Profile image clicks for details
    document.addEventListener('click', (e) => {
      if (e.target.matches('.chats-main img[aria-label="View user details"]')) {
        this.toggleChatDetails();
      }
    });

    // Close details button
    document.addEventListener('click', (e) => {
      if (e.target.matches('#chatsDetails .btn[aria-label="Close details"] i') ||
        e.target.matches('#threadDetails .btn[aria-label="Close details"] i')) {
        this.closeChatDetails();
      }
    });

    // Dropdown actions
    document.addEventListener('click', (e) => {
      if (e.target.closest('.dropdown-item')) {
        const action = e.target.textContent.trim();
        if (action.includes('Pin')) {
          this.togglePinChat();
        } else if (action.includes('Delete')) {
          this.deleteChatConfirm();
        }
      }
    });
  }

  async loadInitialData() {
    await this.loadChats();
  }

  async loadChats() {
    try {
      this.showLoading();
      const response = await this.apiCall('/Chats/contacts', 'GET');
      this.chats = response || [];
      this.renderChatList();
      this.hideLoading();
    } catch (error) {
      console.error('Error loading chats:', error);
      this.showError('Failed to load chats');
      this.hideLoading();
    }
  }

  async loadThreads() {
    try {
      this.showLoading();
      const response = await this.apiCall('/Threads/', 'GET');
      this.threads = response || [];
      this.renderThreadList();
      this.hideLoading();
    } catch (error) {
      console.error('Error loading threads:', error);
      this.showError('Failed to load threads');
      this.hideLoading();
    }
  }

  renderChatList() {
    const chatList = document.querySelector('#myChats-tab-pane .chat-list');
    const emptyContainer = document.getElementById('empty-chats-container');
    const mainContainer = document.querySelector('#myChats-tab-pane .row.rounded-4');

    if (!this.chats || this.chats.length === 0) {
      mainContainer?.classList.add('d-none');
      emptyContainer?.classList.remove('d-none');
      return;
    }

    mainContainer?.classList.remove('d-none');
    emptyContainer?.classList.add('d-none');

    if (chatList) {
      chatList.innerHTML = this.chats.map(chat => this.createChatItemHtml(chat)).join('');
    }
  }

  renderThreadList() {
    const threadList = document.querySelector('#myThreads-tab-pane .chat-list');
    const emptyContainer = document.getElementById('empty-threads-container');
    const mainContainer = document.querySelector('#myThreads-tab-pane .row.rounded-4');

    if (!this.threads || this.threads.length === 0) {
      mainContainer?.classList.add('d-none');
      emptyContainer?.classList.remove('d-none');
      return;
    }

    mainContainer?.classList.remove('d-none');
    emptyContainer?.classList.add('d-none');

    if (threadList) {
      threadList.innerHTML = this.threads.map(thread => this.createThreadItemHtml(thread)).join('');
    }
  }

  createChatItemHtml(chat) {
    const isPinned = chat.isPinned || false;
    const isRead = chat.isRead !== false;
    const unreadCount = chat.unreadCount || 0;
    const lastMessage = chat.lastMessage || 'No messages yet';
    const participantName = chat.participant?.name || 'Unknown User';

    return `
          <article class="chat-item d-flex justify-content-start align-items-center border-bottom py-3" 
                   data-chat-id="${chat.id}">
              <div class="d-flex flex-column justify-content-start align-items-start w-100">
                  <div class="d-flex justify-content-between align-items-center w-100">
                      <p class="fw-bold">${participantName}</p>
                  </div>
                  <div class="d-flex justify-content-between align-items-center w-100">
                      <p class="text-secondary">${this.truncateMessage(lastMessage)}</p>
                      <div class="d-flex justify-content-end align-items-center">
                          ${isPinned ? '<i class="bi bi-pin-angle-fill ps-2" aria-label="Pinned chat"></i>' : ''}
                          ${unreadCount > 0 ?
        `<i class="bi bi-${unreadCount}-circle-fill fs-5 incoming-msg" aria-label="${unreadCount} new messages"></i>` :
        `<i class="bi bi-check-all fs-3 ${isRead ? 'read' : 'unread'} ps-1" aria-label="${isRead ? 'Read' : 'Unread'} message"></i>`
      }
                      </div>
                  </div>
              </div>
          </article>
      `;
  }

  createThreadItemHtml(thread) {
    const isPinned = thread.isPinned || false;
    const isRead = thread.isRead !== false;
    const unreadCount = thread.unreadCount || 0;
    const lastMessage = thread.lastMessage || 'No messages yet';
    const patientName = thread.title || thread.patient?.name || 'Unknown Patient'; // Use title as patient name
    const threadCode = thread.code || `THR-${thread.id?.substring(0, 8)}`; // Generate code from ID if not provided

    return `
          <article class="chat-item d-flex justify-content-start align-items-center border-bottom py-3" 
                   data-chat-id="${thread.id}">
              <div class="d-flex flex-column justify-content-start align-items-start w-100">
                  <div class="d-flex justify-content-between align-items-center w-100">
                      <p class="fw-bold">${patientName}</p>
                  </div>
                  <div class="d-flex justify-content-between align-items-center w-100">
                      <p class="text-secondary">${this.truncateMessage(lastMessage)}</p>
                      <div class="d-flex justify-content-end align-items-center">
                          ${isPinned ? '<i class="bi bi-pin-angle-fill ps-2" aria-label="Pinned thread"></i>' : ''}
                          ${unreadCount > 0 ?
        `<i class="bi bi-${unreadCount}-circle-fill fs-5 incoming-msg" aria-label="${unreadCount} new messages"></i>` :
        `<i class="bi bi-check-all fs-3 ${isRead ? 'read' : 'unread'} ps-1" aria-label="${isRead ? 'Read' : 'Unread'} message"></i>`
      }
                      </div>
                  </div>
              </div>
          </article>
      `;
  }

  updateThreadHeader(thread) {
    const headerImg = document.querySelector('.chats-main .top-bar img');
    const headerName = document.querySelector('.chats-main .top-bar .fs-4');

    if (headerImg) {
      headerImg.src = thread.patient?.avatarUrl || '../images/patient.png';
      headerImg.alt = thread.title || 'Patient';
    }

    if (headerName) {
      headerName.textContent = thread.title || 'Unknown Patient'; // Use title as patient name
    }
  }
  async selectChat(chatId) {
    this.currentChatId = chatId;
    this.currentThreadId = null;

    // Update UI to show selected chat
    document.querySelectorAll('#myChats-tab-pane .chat-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`#myChats-tab-pane .chat-item[data-chat-id="${chatId}"]`)?.classList.add('active');

    // Load chat details
    const chat = this.chats.find(c => c.id === chatId);
    if (chat) {
      this.updateChatHeader(chat.participant);
      await this.loadChatMessages(chatId);
    }
  }

  async selectThread(threadId) {
    this.currentThreadId = threadId;
    this.currentChatId = null;

    // Update UI to show selected thread
    document.querySelectorAll('#myThreads-tab-pane .chat-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`#myThreads-tab-pane .chat-item[data-chat-id="${threadId}"]`)?.classList.add('active');

    // Load thread details
    const thread = this.threads.find(t => t.id === threadId);
    if (thread) {
      this.updateThreadHeader(thread);
      await this.loadThreadMessages(threadId);
    }
  }

  updateChatHeader(participant) {
    const headerImg = document.querySelector('.chats-main .top-bar img');
    const headerName = document.querySelector('.chats-main .top-bar .fs-4');

    if (headerImg && participant) {
      headerImg.src = participant.avatarUrl || '../images/parent.png';
      headerImg.alt = participant.name || 'User';
    }

    if (headerName && participant) {
      headerName.textContent = participant.name || 'Unknown User';
    }
  }

  updateThreadHeader(thread) {
    const headerImg = document.querySelector('.chats-main .top-bar img');
    const headerName = document.querySelector('.chats-main .top-bar .fs-4');

    if (headerImg && thread.patient) {
      // headerImg.src = thread.patient.avatarUrl || '../images/patient.png';
      headerImg.alt = thread.patient.name || 'Patient';
    }

    if (headerName && thread.patient) {
      headerName.textContent = thread.patient.name || 'Unknown Patient';
    }
  }

  async loadChatMessages(chatId) {
    try {
      const response = await this.apiCall(`/chats/${chatId}/messages`, 'GET');
      this.messages = response || [];
      this.renderMessages();
    } catch (error) {
      console.error('Error loading chat messages:', error);
      this.showError('Failed to load messages');
    }
  }

  async loadThreadMessages(threadId) {
    try {
      const response = await this.apiCall(`/threads/${threadId}/messages`, 'GET');
      this.messages = response || [];
      this.renderMessages();
    } catch (error) {
      console.error('Error loading thread messages:', error);
      this.showError('Failed to load messages');
    }
  }

  renderMessages() {
    const chatArea = document.getElementById('chatArea');
    const noMessagesContainer = document.getElementById('noMessagesContainer');

    if (!this.messages || this.messages.length === 0) {
      noMessagesContainer?.classList.remove('d-none');
      return;
    }

    noMessagesContainer?.classList.add('d-none');

    const messagesHtml = this.messages.map(message => this.createMessageHtml(message)).join('');
    chatArea.innerHTML = messagesHtml;

    // Scroll to bottom
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  createMessageHtml(message) {
    const isOwn = message.isFromCurrentUser || false;
    const avatarUrl = message.sender?.avatarUrl || (isOwn ? '../images/current-user.png' : '../images/parent.png');

    return `
          <div class="message ${isOwn ? 'own-message' : 'other-message'} mb-3">
              <div class="d-flex ${isOwn ? 'justify-content-end' : 'justify-content-start'}">
                  <div class="message-content ${isOwn ? 'bg-primary text-white' : 'bg-light'} p-3 rounded">
                      <p class="mb-1">${this.escapeHtml(message.content || message.text || '')}</p>
                  </div>
              </div>
          </div>
      `;
  }

  async sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput?.value.trim();

    if (!messageText) return;

    const currentId = this.currentChatId || this.currentThreadId;
    const endpoint = this.currentChatId ? '/chats' : '/threads';

    if (!currentId) {
      this.showError('Please select a chat or thread first');
      return;
    }

    try {
      const messageData = {
        content: messageText,
        [this.currentChatId ? 'chatId' : 'threadId']: currentId
      };

      await this.apiCall(`${endpoint}/${currentId}/messages`, 'POST', messageData);

      // Clear input
      messageInput.value = '';

      // Reload messages
      if (this.currentChatId) {
        await this.loadChatMessages(this.currentChatId);
      } else {
        await this.loadThreadMessages(this.currentThreadId);
      }

      // Update chat/thread list
      if (this.currentTab === 'chats') {
        await this.loadChats();
      } else {
        await this.loadThreads();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      this.showError('Failed to send message');
    }
  }

  searchChats(query) {
    const items = document.querySelectorAll('.chat-item');
    const searchTerm = query.toLowerCase();

    items.forEach(item => {
      const name = item.querySelector('.fw-bold')?.textContent.toLowerCase() || '';
      const message = item.querySelector('.text-secondary')?.textContent.toLowerCase() || '';

      if (name.includes(searchTerm) || message.includes(searchTerm)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  }

  async createNewChat() {
    // This would typically open a modal to select a user to chat with
    // For now, we'll show a placeholder
    this.showInfo('Feature to create new chat will be implemented');
  }

  async createNewThread() {
    // This would typically open a modal to create a new thread
    // For now, we'll show a placeholder
    this.showInfo('Feature to create new thread will be implemented');
  }

  toggleChatDetails() {
    const chatsMain = document.getElementById('chatsMain');
    const chatsDetails = this.currentTab === 'chats' ?
      document.getElementById('chatsDetails') :
      document.getElementById('threadDetails');

    if (chatsDetails?.classList.contains('d-none')) {
      chatsMain?.classList.remove('col-lg-8');
      chatsMain?.classList.add('col-lg-6');
      chatsDetails?.classList.remove('d-none');
    }
  }

  closeChatDetails() {
    const chatsMain = document.getElementById('chatsMain');
    const chatsDetails = document.getElementById('chatsDetails');
    const threadDetails = document.getElementById('threadDetails');

    chatsMain?.classList.remove('col-lg-6');
    chatsMain?.classList.add('col-lg-8');
    chatsDetails?.classList.add('d-none');
    threadDetails?.classList.add('d-none');
  }

  async togglePinChat() {
    const currentId = this.currentChatId || this.currentThreadId;
    const endpoint = this.currentChatId ? '/chats' : '/threads';

    if (!currentId) return;

    try {
      await this.apiCall(`${endpoint}/${currentId}/pin`, 'POST');

      // Reload the appropriate list
      if (this.currentTab === 'chats') {
        await this.loadChats();
      } else {
        await this.loadThreads();
      }

      this.showSuccess('Chat pin status updated');
    } catch (error) {
      console.error('Error toggling pin:', error);
      this.showError('Failed to update pin status');
    }
  }

  deleteChatConfirm() {
    // The modal should handle the actual deletion
    // This is just to show the confirmation modal
    const modal = document.getElementById('deleteChatModal');
    if (modal) {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    }
  }

  async deleteChat() {
    const currentId = this.currentChatId || this.currentThreadId;
    const endpoint = this.currentChatId ? '/chats' : '/threads';

    if (!currentId) return;

    try {
      await this.apiCall(`${endpoint}/${currentId}`, 'DELETE');

      // Clear current selection
      this.currentChatId = null;
      this.currentThreadId = null;

      // Reload the appropriate list
      if (this.currentTab === 'chats') {
        await this.loadChats();
      } else {
        await this.loadThreads();
      }

      this.showSuccess('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      this.showError('Failed to delete chat');
    }
  }

  // Update the apiCall method in the ChatsManager class
  async apiCall(endpoint, method = 'GET', data = null) {
    // Use the same auth structure as your other functions
    const authData = this.getAuthData();

    if (!authData || !authData.accessToken) {
      this.showError('Authentication required');
      // Redirect to login if needed
      window.location.href = '../pages/login.html'; // Adjust path as needed
      return;
    }

    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.accessToken}`
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, config);

      if (response.status === 401) {
        this.showError('Session expired. Please login again.');
        this.clearAuthData();
        window.location.href = '../pages/login.html'; // Adjust path as needed
        return;
      }

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }

  // Add these utility methods to the ChatsManager class
  getAuthData() {
    try {
      const sessionData = sessionStorage.getItem('authData');
      const localData = localStorage.getItem('authData');
      return JSON.parse(sessionData || localData);
    } catch (error) {
      console.error('Error parsing auth data:', error);
      return null;
    }
  }

  clearAuthData() {
    sessionStorage.removeItem('authData');
    localStorage.removeItem('authData');
    sessionStorage.removeItem('userEmail');
    localStorage.removeItem('userEmail');
  }

  checkAuth() {
    const authData = this.getAuthData();

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


  formatTimestamp(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;

    return date.toLocaleDateString() === now.toLocaleDateString()
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString();
  }

  truncateMessage(message, maxLength = 50) {
    if (!message) return '';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showLoading() {
    // Add loading indicator
    console.log('Loading...');
  }

  hideLoading() {
    // Hide loading indicator
    console.log('Loading complete');
  }

  showError(message) {
    // Show error notification
    console.error(message);
    // You could integrate with a toast notification system here
  }

  showSuccess(message) {
    // Show success notification
    console.log(message);
    // You could integrate with a toast notification system here
  }

  showInfo(message) {
    // Show info notification
    console.log(message);
    // You could integrate with a toast notification system here
  }
}

// Initialize the chats manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('v-pills-chats')) {
    window.chatsManager = new ChatsManager();
  }
});

