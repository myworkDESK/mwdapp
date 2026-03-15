// WorkDesk — Messaging JS
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

  var messages = {
    '1': [
      { id: 'm1', from: 'inbound',  text: 'Hi! Just checking on the leave request I submitted last week. Has it been approved?', time: '9:38 AM' },
      { id: 'm2', from: 'outbound', text: 'Hi Maria! Yes, I just approved it. You should receive an email confirmation shortly.', time: '9:40 AM ✓✓' },
      { id: 'm3', from: 'inbound',  text: 'Thanks for updating the leave balance too! Really appreciate it.', time: '9:42 AM' }
    ],
    '2': [{ id: 'm4', from: 'inbound',  text: 'Please check my overtime request.', time: 'Yesterday' }],
    '3': [{ id: 'm5', from: 'inbound',  text: 'Got it, I will send the report by EOD.', time: 'Mon' }],
    '4': [{ id: 'm6', from: 'inbound',  text: 'Operations meeting moved to 3 PM.', time: 'Mon' }],
    'g1': [{ id: 'g1m1', from: 'inbound', name: 'Maria', text: 'Reminder — forms due Friday', time: '10:15 AM' }],
    'g2': [{ id: 'g2m1', from: 'inbound', name: 'Ben',   text: 'Q1 targets have been updated.', time: 'Yesterday' }],
    'g3': [{ id: 'g3m1', from: 'inbound', name: 'Liza',  text: 'Payroll report is ready.', time: 'Mon' }]
  };

  var pinned = {};
  var archived = {};
  var msgCounter = 100;
  var currentThread = '1';
  var currentTab = 'direct';
  var pendingAttachments = [];

  function escapeHtml(text) {
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, function (m) { return map[m]; });
  }

  function nowTime() {
    var now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function getPinnedForThread() {
    return pinned[currentThread] || [];
  }

  function renderPinnedBar() {
    var bar = document.getElementById('pinnedBar');
    var itemsEl = document.getElementById('pinnedItems');
    if (!bar || !itemsEl) return;
    var pins = getPinnedForThread();
    if (!pins.length) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    var msgs = messages[currentThread] || [];
    itemsEl.innerHTML = '';
    pins.forEach(function(pid) {
      var msg = msgs.find(function(m){ return m.id === pid; });
      if (!msg) return;
      var chip = document.createElement('div');
      chip.className = 'msg-pin-item';
      chip.innerHTML = '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(msg.text.slice(0,40)) + (msg.text.length > 40 ? '…' : '') + '</span>' +
        '<span class="pin-remove" data-pid="' + pid + '" title="Unpin">×</span>';
      chip.querySelector('.pin-remove').addEventListener('click', function(e) {
        e.stopPropagation();
        unpinMessage(pid);
      });
      chip.addEventListener('click', function() {
        var el = document.querySelector('[data-msg-id="' + pid + '"]');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      itemsEl.appendChild(chip);
    });
  }

  function pinMessage(msgId) {
    if (!pinned[currentThread]) pinned[currentThread] = [];
    var pins = pinned[currentThread];
    if (pins.indexOf(msgId) !== -1) return;
    if (pins.length >= 5) { showToast('Maximum 5 pinned messages per chat.'); return; }
    pins.push(msgId);
    renderMessages(currentThread);
    renderPinnedBar();
    showToast('Message pinned.');
  }

  function unpinMessage(msgId) {
    if (!pinned[currentThread]) return;
    pinned[currentThread] = pinned[currentThread].filter(function(id){ return id !== msgId; });
    renderMessages(currentThread);
    renderPinnedBar();
  }

  function showToast(msg) {
    var t = document.getElementById('msgToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'msgToast';
      t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1F2933;color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:500;z-index:9999;pointer-events:none;opacity:0;transform:translateY(12px);transition:opacity .3s,transform .3s;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1'; t.style.transform = 'translateY(0)';
    clearTimeout(t._tid);
    t._tid = setTimeout(function(){ t.style.opacity = '0'; t.style.transform = 'translateY(12px)'; }, 3000);
  }

  function archiveMessage(msgId) {
    if (!archived[currentThread]) archived[currentThread] = [];
    if (archived[currentThread].indexOf(msgId) === -1) archived[currentThread].push(msgId);
    renderMessages(currentThread);
    showToast('Message archived.');
  }

  function deleteMessage(msgId) {
    if (!messages[currentThread]) return;
    messages[currentThread] = messages[currentThread].filter(function(m){ return m.id !== msgId; });
    if (pinned[currentThread]) pinned[currentThread] = pinned[currentThread].filter(function(id){ return id !== msgId; });
    renderMessages(currentThread);
    renderPinnedBar();
    showToast('Message deleted.');
  }

  function startEditMessage(msgId) {
    var msgs = messages[currentThread];
    if (!msgs) return;
    var msg = msgs.find(function(m){ return m.id === msgId; });
    if (!msg || msg.from !== 'outbound') return;
    var input = document.getElementById('composeInput');
    if (!input) return;
    input.value = msg.text;
    input.dataset.editId = msgId;
    input.focus();
    autoResize(input);
    var form = document.getElementById('composeForm');
    if (form) {
      var existing = form.querySelector('.edit-indicator');
      if (!existing) {
        var ind = document.createElement('div');
        ind.className = 'edit-indicator';
        ind.style.cssText = 'font-size:11px;color:var(--primary);padding:4px 20px;background:var(--primary-soft);border-top:1px solid var(--primary);';
        ind.textContent = '✎ Editing message — press Enter to save, Esc to cancel';
        form.insertBefore(ind, form.firstChild);
      }
    }
  }

  function cancelEdit() {
    var input = document.getElementById('composeInput');
    if (input) { input.value = ''; delete input.dataset.editId; autoResize(input); }
    var form = document.getElementById('composeForm');
    if (form) { var ind = form.querySelector('.edit-indicator'); if (ind) ind.remove(); }
  }

  function buildActions(msg) {
    var pins = getPinnedForThread();
    var isPinned = pins.indexOf(msg.id) !== -1;
    var canEdit = msg.from === 'outbound';
    var html = '<div class="msg-actions">';
    if (!isPinned) {
      html += '<button class="msg-action-btn" data-action="pin" data-id="' + msg.id + '" title="Pin">📌</button>';
    } else {
      html += '<button class="msg-action-btn" data-action="unpin" data-id="' + msg.id + '" title="Unpin">📍</button>';
    }
    if (canEdit) html += '<button class="msg-action-btn" data-action="edit" data-id="' + msg.id + '" title="Edit">✎</button>';
    html += '<button class="msg-action-btn" data-action="archive" data-id="' + msg.id + '" title="Archive">🗃</button>';
    html += '<button class="msg-action-btn" data-action="delete" data-id="' + msg.id + '" title="Delete">🗑</button>';
    html += '</div>';
    return html;
  }

  function renderMessages(threadId) {
    var area = document.getElementById('messagesArea');
    if (!area) return;
    var msgs = (messages[threadId] || []).filter(function(m){
      return !(archived[threadId] && archived[threadId].indexOf(m.id) !== -1);
    });
    var pins = pinned[threadId] || [];
    var html = '<div class="msg-date-label">Today</div>';
    msgs.forEach(function (msg) {
      var t = threads[threadId];
      var bubbleAvatar = t ? t.avatar : '';
      var isPinned = pins.indexOf(msg.id) !== -1;
      var pinnedBadge = isPinned ? '<span class="msg-pinned-badge" title="Pinned">📌</span>' : '';
      var attachHtml = '';
      if (msg.attachments && msg.attachments.length) {
        attachHtml = '<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;">';
        msg.attachments.forEach(function(a){
          attachHtml += '<span style="background:rgba(255,255,255,0.25);border-radius:4px;padding:2px 8px;font-size:11px;">📎 ' + escapeHtml(a) + '</span>';
        });
        attachHtml += '</div>';
      }
      if (msg.from === 'inbound') {
        html += '<div class="msg-row inbound" data-msg-id="' + msg.id + '">';
        html += '<div class="msg-bubble-avatar" aria-hidden="true">' + escapeHtml(bubbleAvatar) + '</div>';
        html += '<div>';
        if (msg.name) html += '<div style="font-size:11px;color:var(--text-muted);margin-bottom:2px;">' + escapeHtml(msg.name) + '</div>';
        html += '<div class="msg-bubble">' + escapeHtml(msg.text) + attachHtml + '</div>';
        html += '<div class="msg-bubble-time">' + escapeHtml(msg.time) + pinnedBadge + '</div>';
        html += '</div>';
        html += buildActions(msg);
        html += '</div>';
      } else {
        html += '<div class="msg-row outbound" data-msg-id="' + msg.id + '">';
        html += '<div>';
        html += '<div class="msg-bubble">' + escapeHtml(msg.text) + attachHtml + '</div>';
        html += '<div class="msg-bubble-time">' + escapeHtml(msg.time) + pinnedBadge + '</div>';
        html += '</div>';
        html += buildActions(msg);
        html += '</div>';
      }
    });
    area.innerHTML = html;
    area.scrollTop = area.scrollHeight;

    area.querySelectorAll('.msg-action-btn').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var action = btn.dataset.action;
        var id = btn.dataset.id;
        if (action === 'pin')     pinMessage(id);
        if (action === 'unpin')   unpinMessage(id);
        if (action === 'edit')    startEditMessage(id);
        if (action === 'archive') archiveMessage(id);
        if (action === 'delete')  deleteMessage(id);
      });
    });
  }

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
    if (remaining > 0) { badge.textContent = remaining; badge.style.display = ''; }
    else { badge.style.display = 'none'; }
  }

  function selectThread(threadId) {
    currentThread = threadId;
    document.querySelectorAll('.msg-thread-item').forEach(function (el) { el.classList.remove('active'); });
    var item = document.querySelector('[data-thread="' + threadId + '"]');
    if (item) item.classList.add('active');
    updateChatHeader(threadId);
    renderMessages(threadId);
    renderPinnedBar();
    markRead(threadId);
    var input = document.getElementById('composeInput');
    if (input) input.focus();
  }

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.msg-tab[data-tab]').forEach(function (btn) {
      var isActive = btn.dataset.tab === tab;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    document.querySelectorAll('.msg-thread-item').forEach(function (item) {
      item.style.display = (item.dataset.type === tab) ? '' : 'none';
    });
    var first = document.querySelector('.msg-thread-item[data-type="' + tab + '"]');
    if (first) selectThread(first.dataset.thread);
  }

  function filterThreads(query) {
    var q = query.toLowerCase();
    document.querySelectorAll('.msg-thread-item[data-type="' + currentTab + '"]').forEach(function (item) {
      var name = (item.querySelector('.msg-thread-name') || {}).textContent || '';
      item.style.display = name.toLowerCase().includes(q) ? '' : 'none';
    });
  }

  function renderAttachPreview() {
    var bar = document.getElementById('attachPreview');
    if (!bar) return;
    if (!pendingAttachments.length) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    bar.innerHTML = pendingAttachments.map(function(f, i){
      return '<div class="msg-attach-chip">📎 ' + escapeHtml(f) +
        '<span class="remove-attach" data-idx="' + i + '" title="Remove">×</span></div>';
    }).join('');
    bar.querySelectorAll('.remove-attach').forEach(function(btn){
      btn.addEventListener('click', function(){
        pendingAttachments.splice(parseInt(btn.dataset.idx), 1);
        renderAttachPreview();
      });
    });
  }

  function sendMessage(text) {
    if (!text.trim() && !pendingAttachments.length) return;
    var input = document.getElementById('composeInput');
    var editId = input ? input.dataset.editId : null;

    if (editId) {
      var msgs = messages[currentThread];
      if (msgs) {
        var msg = msgs.find(function(m){ return m.id === editId; });
        if (msg) { msg.text = text; msg.time = msg.time + ' (edited)'; }
      }
      cancelEdit();
      renderMessages(currentThread);
      return;
    }

    var now = nowTime();
    var newMsg = {
      id: 'msg' + (++msgCounter),
      from: 'outbound',
      text: text,
      time: now + ' ✓',
      attachments: pendingAttachments.slice()
    };

    if (!messages[currentThread]) messages[currentThread] = [];
    messages[currentThread].push(newMsg);

    pendingAttachments = [];
    renderAttachPreview();
    var attachInput = document.getElementById('attachInput');
    if (attachInput) attachInput.value = '';

    var item = document.querySelector('[data-thread="' + currentThread + '"]');
    if (item) {
      var preview = item.querySelector('.msg-thread-preview');
      if (preview) preview.textContent = text.length > 40 ? text.slice(0, 40) + '…' : (text || '📎 Attachment');
      var timeEl = item.querySelector('.msg-thread-time');
      if (timeEl) timeEl.textContent = 'Just now';
    }

    renderMessages(currentThread);
    var t = threads[currentThread];
    if (t && !t.group) simulateTyping();
  }

  function simulateTyping() {
    var indicator = document.getElementById('typingIndicator');
    if (!indicator) return;
    indicator.style.display = 'flex';
    var area = document.getElementById('messagesArea');
    if (area) area.scrollTop = area.scrollHeight;
    setTimeout(function () {
      indicator.style.display = 'none';
      // Simulate receiving a reply and push a notification
      var t = threads[currentThread];
      if (t && window.WDNotifications) {
        var senderName = t.name;
        window.WDNotifications.push(
          'message',
          'New message from <strong>' + senderName + '</strong>',
          'messaging.html'
        );
      }
    }, 2200);
  }

  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }

  var employees = [
    'Maria A. Santos', 'Jose R. Reyes', 'Liza C. Cruz', 'Ben P. Mendoza',
    'Anna L. Torres', 'Rico D. Garcia', 'Nena S. Bautista', 'Mark P. Villanueva'
  ];

  function openModal() {
    var modal = document.getElementById('newChatModal');
    if (modal) { modal.classList.remove('hidden'); var inp = document.getElementById('dmRecipient'); if (inp) inp.focus(); }
  }

  function closeModal() {
    var modal = document.getElementById('newChatModal');
    if (modal) modal.classList.add('hidden');
  }

  function initModalTabs() {
    document.querySelectorAll('[data-new-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-new-tab]').forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
        btn.classList.add('active'); btn.setAttribute('aria-selected','true');
        var isDm = btn.dataset.newTab === 'dm';
        var dmF = document.getElementById('newDmForm');
        var grpF = document.getElementById('newGroupForm');
        if (dmF) dmF.style.display = isDm ? '' : 'none';
        if (grpF) grpF.style.display = isDm ? 'none' : '';
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
        li.addEventListener('click', function () { input.value = emp; list.style.display = 'none'; });
        list.appendChild(li);
      });
      list.style.display = '';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {

    document.querySelectorAll('.msg-thread-item').forEach(function (item) {
      item.addEventListener('click', function () { selectThread(item.dataset.thread); });
      item.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') selectThread(item.dataset.thread); });
    });

    document.querySelectorAll('.msg-tab[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () { switchTab(btn.dataset.tab); });
    });

    var searchInput = document.getElementById('threadSearch');
    if (searchInput) searchInput.addEventListener('input', function () { filterThreads(searchInput.value); });

    var form = document.getElementById('composeForm');
    var composeInput = document.getElementById('composeInput');
    if (form && composeInput) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var text = composeInput.value.trim();
        if (!text && !pendingAttachments.length) return;
        sendMessage(text);
        composeInput.value = '';
        composeInput.style.height = 'auto';
      });
      composeInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && composeInput.dataset.editId) { cancelEdit(); return; }
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          var text = composeInput.value.trim();
          if (text || pendingAttachments.length) {
            sendMessage(text);
            composeInput.value = '';
            composeInput.style.height = 'auto';
          }
        }
      });
      composeInput.addEventListener('input', function () { autoResize(composeInput); });
    }

    var attachBtn   = document.getElementById('attachBtn');
    var attachInput = document.getElementById('attachInput');
    if (attachBtn && attachInput) {
      attachBtn.addEventListener('click', function(){ attachInput.click(); });
      attachInput.addEventListener('change', function(){
        Array.from(attachInput.files).forEach(function(f){ pendingAttachments.push(f.name); });
        renderAttachPreview();
      });
    }

    var newChatBtn = document.getElementById('newChatBtn');
    var closeBtn   = document.getElementById('closeNewChatModal');
    var overlay    = document.getElementById('newChatModal');
    if (newChatBtn) newChatBtn.addEventListener('click', openModal);
    if (closeBtn)   closeBtn.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', function(e){ if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeModal(); });

    initModalTabs();
    initEmployeeSuggestions();
    switchTab('direct');
    updateGlobalBadge();
  });

}());
