// auth.js

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
            localStorage.removeItem('session');
            window.location.href = 'login.html';
        }
    });
}
