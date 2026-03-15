// auth.js

// ── Auth Guard ──────────────────────────────────────────────────────────────
// Runs immediately when the script is loaded (bottom of <body>).
// Redirects unauthenticated visitors to login.html on all protected pages.
// Also redirects super-admin.html to login if the session role is not superadmin.
(function () {
  var page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var PUBLIC_PAGES = ['login.html', 'index.html', ''];

  if (PUBLIC_PAGES.indexOf(page) !== -1) {
    // On the login page: if already signed in, send to the right destination.
    var existingToken = localStorage.getItem('workdesk_token');
    var existingRole  = localStorage.getItem('workdesk_role');
    if (existingToken) {
      window.location.replace(existingRole === 'superadmin' ? 'super-admin.html' : 'dashboard.html');
    }
    return;
  }

  // Protected page — require a token.
  var token = localStorage.getItem('workdesk_token');
  if (!token) {
    window.location.replace('login.html');
    return;
  }

  // Super Admin portal is restricted to the superadmin role only.
  if (page === 'super-admin.html') {
    var role = localStorage.getItem('workdesk_role');
    if (role !== 'superadmin') {
      window.location.replace('dashboard.html');
    }
  }
}());

// ── CEO / Super Admin login helper ──────────────────────────────────────────
// Function to handle CEO login with Cloudflare secrets
async function ceoLogin() {
    const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            email: document.getElementById('username') ? document.getElementById('username').value : '',
            password: document.getElementById('orgId') ? document.getElementById('orgId').value : '',
        })
    });
    const data = await response.json();
    if (response.ok) {
        // Storing session payload in localStorage
        localStorage.setItem('session', JSON.stringify({
            token: data.token,
            role: data.role,
            permissions: data.permissions,
            orgId: data.orgId,
            displayName: data.displayName
        }));
        window.location.href = 'dashboard.html';
    } else {
        alert(data.message);
    }
}

// Shared logout handler — clears session data and redirects to login
function logout() {
    WDConfirm.show({
        title:       'Log Out',
        message:     'Are you sure you want to log out?',
        type:        'warn',
        confirmText: 'Yes, Log Out',
        cancelText:  'No',
        onConfirm: function () {
            localStorage.removeItem('workdesk_token');
            localStorage.removeItem('workdesk_display_name');
            localStorage.removeItem('workdesk_role');
            localStorage.removeItem('workdesk_email');
            localStorage.removeItem('session');
            window.location.href = 'login.html';
        }
    });
}
