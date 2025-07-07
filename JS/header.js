// Dynamic Header Title System for Admin Dashboard
document.addEventListener('DOMContentLoaded', function () {
    const headerTitle = document.getElementById('header-title');

    // Define tab titles mapping
    const tabTitles = {
        'v-pills-dashboard': 'Dashboard',
        'v-pills-patients': 'Patients',
        'v-pills-bots': 'Bots',
        'v-pills-supervisors': 'Supervisors',
        'v-pills-chats': 'Chats'
    };

    // Function to update header title
    function updateHeaderTitle(tabId) {
        const title = tabTitles[tabId] || 'Dashboard';
        if (headerTitle) {
            headerTitle.textContent = title;
        }
    }

    // Listen for tab changes using Bootstrap's tab events
    const tabElements = document.querySelectorAll('[data-bs-toggle="pill"]');

    tabElements.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (event) {
            const targetId = event.target.getAttribute('data-bs-target').substring(1); // Remove # from target
            updateHeaderTitle(targetId);
        });
    });

    // Alternative method: Listen for clicks on tab buttons
    const tabButtons = document.querySelectorAll('#v-pills-dashboard-tab, #v-pills-patients-tab, #v-pills-bots-tab, #v-pills-supervisors-tab, #v-pills-chats-tab');

    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            const targetId = this.getAttribute('data-bs-target').substring(1); // Remove # from target
            updateHeaderTitle(targetId);
        });
    });

    // Handle dashboard card arrow clicks (for navigation to other tabs)
    document.addEventListener('click', function (event) {
        // Handle arrow clicks in dashboard cards
        if (event.target.matches('[onclick*="v-pills-"]')) {
            const onclickContent = event.target.getAttribute('onclick');
            const match = onclickContent.match(/v-pills-\w+/);
            if (match) {
                const tabId = match[0];
                setTimeout(() => updateHeaderTitle(tabId), 100); // Small delay to ensure tab is activated
            }
        }

        // Handle direct clicks on elements that trigger tab changes
        if (event.target.classList.contains('bi-arrow-up-right')) {
            const onclickContent = event.target.getAttribute('onclick');
            if (onclickContent && onclickContent.includes('v-pills-')) {
                const match = onclickContent.match(/v-pills-\w+/);
                if (match) {
                    const tabId = match[0];
                    setTimeout(() => updateHeaderTitle(tabId), 100);
                }
            }
        }
    });

    // Handle programmatic tab activation using MutationObserver
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.classList.contains('tab-pane') &&
                    target.classList.contains('active') &&
                    target.classList.contains('show')) {
                    updateHeaderTitle(target.id);
                }
            }
        });
    });

    // Observe all tab panes for class changes
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => {
        observer.observe(pane, { attributes: true, attributeFilter: ['class'] });
    });

    // Handle sidebar navigation (if sidebar exists)
    const sidebarLinks = document.querySelectorAll('.sidebar-link, .nav-link[data-bs-target]');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function () {
            const target = this.getAttribute('data-bs-target');
            if (target) {
                const tabId = target.substring(1); // Remove # from target
                setTimeout(() => updateHeaderTitle(tabId), 50);
            }
        });
    });

    // Handle hash changes in URL
    window.addEventListener('hashchange', function () {
        const hash = window.location.hash.substring(1); // Remove # from hash
        if (tabTitles[hash]) {
            updateHeaderTitle(hash);
        }
    });

    // Initialize with current active tab or default to dashboard
    const activeTab = document.querySelector('.tab-pane.active.show');
    if (activeTab) {
        updateHeaderTitle(activeTab.id);
    } else {
        // If no active tab found, default to dashboard
        updateHeaderTitle('v-pills-dashboard');
    }

    // Optional: Update browser title as well
    function updateBrowserTitle(tabId) {
        const title = tabTitles[tabId] || 'Dashboard';
        document.title = `${title} - Panel`;
    }

    // Enhanced update function that also updates browser title
    const originalUpdateHeaderTitle = updateHeaderTitle;
    updateHeaderTitle = function (tabId) {
        originalUpdateHeaderTitle(tabId);
        updateBrowserTitle(tabId);
    };

    // Handle Bootstrap tab events more comprehensively
    document.addEventListener('shown.bs.tab', function (event) {
        const targetId = event.target.getAttribute('data-bs-target');
        if (targetId) {
            const tabId = targetId.substring(1);
            updateHeaderTitle(tabId);
        }
    });

    // Debug function (remove in production)
    window.debugHeaderTitle = function () {
        console.log('Current header title:', headerTitle ? headerTitle.textContent : 'Header element not found');
        console.log('Available tabs:', Object.keys(tabTitles));
        console.log('Active tab:', document.querySelector('.tab-pane.active.show')?.id || 'None');
    };
});