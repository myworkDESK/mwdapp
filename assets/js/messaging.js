// WorkDesk — Messaging JS
// Handles thread selection, tab switching, message sending, and new chat modal.
// Cloudflare Pages compatible — no external dependencies, pure ES6.

(function () {
  'use strict';

  // ── Thread data ───────────────────────────────────────────
  var threads = {
    '1':  { name: 'Maria A. Santos',   status: 'Online',  avatar: 'MA', online: true  },
    '2':  { name: 'Jose R. Reyes',     status: 'Away',    avatar: 'JR', online: false },
    '3':  { name: 'Liza C. Cruz',      status: 'Online',  avatar: 'LC', online: true  },
    '4':  { name: 'Ben P. Mendoza',    status: 'Offline', avatar: 'BP', online: false },
    'g1': { name: 'HR Department',     status: '12 members', avatar: '👥', online: false, group: true },
    'g2': { name: 'All Employees',     status: '248 members', avatar: '🏢', online: false, group: true },
    'g3': { name: 'Finance Team',      status: '8 members', avatar: '💼', online: false, group: true }
  };

  // Sample messages per thread (in real use, fetch from Cloudflare Worker /api/messages?thread=id)
  var messages = {
    '1': [
      { from: 'inbound', text: 'Hi! Just checking on the leave request I submitted last week. Has it been approved?', time: '9:38 AM' },
      { from: 'outbound', text: 'Hi Maria! Yes, I just approved it. You should receive an email confirmation shortly. 😊', time: '9:40 AM ✓✓' },
      { from: 'inbound', text: 'Thanks for updating the leave balance too! Really appreciate it.', time: '9:42 AM' }
    ],
    '2': [
      { from: 'inbound', text: 'Please check my overtime request.', time: 'Yesterday' }
    ],
    '3': [
      { from: 'inbound', text: 'Got it, I\'ll send the report by EOD.', time: 'Mon' }
    ],
    '4': [
      { from: 'inbound', text: 'Operations meeting moved to 3 PM.', time: 'Mon' }
    ],
    'g1': [
      { from: 'inbound', name: 'Maria', text: 'Reminder — forms due Friday', time: '10:15 AM' }
    ],
    'g2': [
      { from: 'inbound', name: 'Ben', text: 'Q1 targets have been updated.', time: 'Yesterday' }
    ],
    'g3': [
      { from: 'inbound', name: 'Liza', text: 'Payroll report is ready.', time: 'Mon' }
    ]
  };

  var currentThread = '1';
  var currentTab = 'direct';

  // ── Helpers ───────────────────────────────────────────────
  function escapeHtml(text) {
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
  }

  // ── Render messages for a thread ─────────────────────────
  function renderMessages(threadId) {
    var area = document.getElementById('messagesArea');
    if (!area) return;
    var msgs = messages[threadId] || [];
    var dateLabel = '<div class="msg-date-label">Today</div>';
    var html = dateLabel;
    msgs.forEach(function (msg) {
      var bubbleAvatar = threads[threadId] ? threads[threadId].avatar : '';
      if (msg.from === 'inbound') {
        html += '<div class="msg-row inbound">';
        html += '<div class="msg-bubble-avatar" aria-hidden="true">' + escapeHtml(bubbleAvatar) + '</div>';
        html += '<div>';
        html += '<div class="msg-bubble">' + escapeHtml(msg.text) + '</div>';
        html += '<div class="msg-bubble-time">' + escapeHtml(msg.time) + '</div>';
        html += '</div>';
        html += '</div>';
      } else {
        html += '<div class="msg-row outbound">';
        html += '<div>';
        html += '<div class="msg-bubble">' + escapeHtml(msg.text) + '</div>';
        html += '<div class="msg-bubble-time">' + escapeHtml(msg.time) + '</div>';
        html += '</div>';
        html += '</div>';
      }
    });
    area.innerHTML = html;
    area.scrollTop = area.scrollHeight;
  }

  // ── Update chat header ────────────────────────────────────
  function updateChatHeader(threadId) {
    var t = threads[threadId];
    if (!t) return;
    var avatarEl = document.getElementById('chatAvatar');
    var nameEl   = document.getElementById('chatName');
    var statusEl = document.getElementById('chatStatus');
    if (avatarEl) avatarEl.textContent = t.avatar;
    if (nameEl)   nameEl.textContent   = t.name;
    if (statusEl) {
      statusEl.textContent = t.online ? '● Online' : t.status;
      statusEl.style.color = t.online ? 'var(--success)' : 'var(--text-muted)';
    }
  }

  // ── Mark thread as read ───────────────────────────────────
  function markRead(threadId) {
    var item = document.querySelector('[data-thread="' + threadId + '"]');
    if (!item) return;
    var badge = item.querySelector('.msg-unread-badge');
    if (badge) badge.remove();
    updateGlobalBadge();
  }

  function updateGlobalBadge() {
    var remaining = document.querySelectorAll('.msg-thread-item .msg-unread-badge').length;
    var badge = document.getElementById('sidebarMsgBadge');
    if (!badge) return;
    if (remaining > 0) {
      badge.textContent = remaining;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }

  // ── Select thread ────────────────────────────────────────
  function selectThread(threadId) {
    currentThread = threadId;
    // Remove active from all items
    document.querySelectorAll('.msg-thread-item').forEach(function (el) {
      el.classList.remove('active');
    });
    // Set active
    var item = document.querySelector('[data-thread="' + threadId + '"]');
    if (item) item.classList.add('active');

    updateChatHeader(threadId);
    renderMessages(threadId);
    markRead(threadId);

    // Focus compose input
    var input = document.getElementById('composeInput');
    if (input) input.focus();
  }

  // ── Tab switching (Direct / Groups) ───────────────────────
  function switchTab(tab) {
    currentTab = tab;
    // Update tab buttons
    document.querySelectorAll('.msg-tab[data-tab]').forEach(function (btn) {
      var isActive = btn.dataset.tab === tab;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    // Show/hide threads
    document.querySelectorAll('.msg-thread-item').forEach(function (item) {
      item.style.display = (item.dataset.type === tab) ? '' : 'none';
    });
    // Auto-select first visible
    var first = document.querySelector('.msg-thread-item[data-type="' + tab + '"]');
    if (first) selectThread(first.dataset.thread);
  }

  // ── Thread search filter ──────────────────────────────────
  function filterThreads(query) {
    var q = query.toLowerCase();
    document.querySelectorAll('.msg-thread-item[data-type="' + currentTab + '"]').forEach(function (item) {
      var name = (item.querySelector('.msg-thread-name') || {}).textContent || '';
      item.style.display = name.toLowerCase().includes(q) ? '' : 'none';
    });
  }

  // ── Send message ──────────────────────────────────────────
  function sendMessage(text) {
    if (!text.trim()) return;
    var now = new Date();
    var time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ✓';

    // Add to local state
    if (!messages[currentThread]) messages[currentThread] = [];
    messages[currentThread].push({ from: 'outbound', text: text, time: time });

    // Update thread preview
    var item = document.querySelector('[data-thread="' + currentThread + '"]');
    if (item) {
      var preview = item.querySelector('.msg-thread-preview');
      if (preview) preview.textContent = text.length > 40 ? text.slice(0, 40) + '…' : text;
      var timeEl = item.querySelector('.msg-thread-time');
      if (timeEl) timeEl.textContent = 'Just now';
    }

    // Re-render
    renderMessages(currentThread);

    // Simulate reply (for demo purposes)
    var t = threads[currentThread];
    if (t && !t.group) {
      simulateTyping();
    }

    // In production: POST to Cloudflare Worker
    // fetch('/api/messages', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ thread: currentThread, text: text })
    // });
  }

  function simulateTyping() {
    var indicator = document.getElementById('typingIndicator');
    if (!indicator) return;
    indicator.style.display = 'flex';
    var area = document.getElementById('messagesArea');
    if (area) area.scrollTop = area.scrollHeight;
    setTimeout(function () {
      indicator.style.display = 'none';
    }, 2200);
  }

  // ── Auto-resize textarea ──────────────────────────────────
  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }

  // ── New chat modal ────────────────────────────────────────
  var employees = [
    'Maria A. Santos', 'Jose R. Reyes', 'Liza C. Cruz', 'Ben P. Mendoza',
    'Anna L. Torres', 'Rico D. Garcia', 'Nena S. Bautista', 'Mark P. Villanueva'
  ];

  function openModal() {
    var modal = document.getElementById('newChatModal');
    if (modal) {
      modal.classList.remove('hidden');
      var input = document.getElementById('dmRecipient');
      if (input) input.focus();
    }
  }

  function closeModal() {
    var modal = document.getElementById('newChatModal');
    if (modal) modal.classList.add('hidden');
  }

  function initModalTabs() {
    document.querySelectorAll('[data-new-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-new-tab]').forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        var isDm = btn.dataset.newTab === 'dm';
        var dmForm = document.getElementById('newDmForm');
        var grpForm = document.getElementById('newGroupForm');
        if (dmForm) dmForm.style.display = isDm ? '' : 'none';
        if (grpForm) grpForm.style.display = isDm ? 'none' : '';
      });
    });
  }

  function initEmployeeSuggestions() {
    var input = document.getElementById('dmRecipient');
    var list  = document.getElementById('dmSuggestions');
    if (!input || !list) return;

    input.addEventListener('input', function () {
      var q = input.value.toLowerCase().trim();
      list.innerHTML = '';
      if (!q) { list.style.display = 'none'; return; }
      var matches = employees.filter(function (e) { return e.toLowerCase().includes(q); });
      if (!matches.length) { list.style.display = 'none'; return; }
      matches.forEach(function (emp) {
        var li = document.createElement('li');
        li.textContent = emp;
        li.style.cssText = 'padding:10px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border-light);';
        li.addEventListener('mouseenter', function () { li.style.background = 'var(--primary-soft)'; });
        li.addEventListener('mouseleave', function () { li.style.background = ''; });
        li.addEventListener('click', function () {
          input.value = emp;
          list.style.display = 'none';
        });
        list.appendChild(li);
      });
      list.style.display = '';
    });
  }

  // ── Init ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {

    // Thread item clicks
    document.querySelectorAll('.msg-thread-item').forEach(function (item) {
      item.addEventListener('click', function () { selectThread(item.dataset.thread); });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') selectThread(item.dataset.thread);
      });
    });

    // Tab buttons
    document.querySelectorAll('.msg-tab[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () { switchTab(btn.dataset.tab); });
    });

    // Thread search
    var searchInput = document.getElementById('threadSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function () { filterThreads(searchInput.value); });
    }

    // Compose form submit
    var form = document.getElementById('composeForm');
    var composeInput = document.getElementById('composeInput');
    if (form && composeInput) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var text = composeInput.value.trim();
        if (!text) return;
        sendMessage(text);
        composeInput.value = '';
        composeInput.style.height = 'auto';
      });
      composeInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          var text = composeInput.value.trim();
          if (text) {
            sendMessage(text);
            composeInput.value = '';
            composeInput.style.height = 'auto';
          }
        }
      });
      composeInput.addEventListener('input', function () { autoResize(composeInput); });
    }

    // New chat modal
    var newChatBtn = document.getElementById('newChatBtn');
    var closeBtn   = document.getElementById('closeNewChatModal');
    var overlay    = document.getElementById('newChatModal');

    if (newChatBtn) newChatBtn.addEventListener('click', openModal);
    if (closeBtn)   closeBtn.addEventListener('click', closeModal);
    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
      });
    }

    // Escape key closes modal
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    initModalTabs();
    initEmployeeSuggestions();

    // Initial render
    switchTab('direct');
    updateGlobalBadge();
  });

}());
