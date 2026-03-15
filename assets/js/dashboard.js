// WorkDesk — Dashboard JS
// Handles greeting, sidebar navigation, quick actions, and stat card animations.
// Cloudflare Pages compatible — no external dependencies, pure ES6.

(function () {
  'use strict';

  // ── Greeting ─────────────────────────────────────────────
  function setGreeting() {
    var el = document.getElementById('greetingText');
    if (!el) return;
    var hour = new Date().getHours();
    var greeting = hour < 12 ? 'Good Morning' : (hour < 17 ? 'Good Afternoon' : 'Good Evening');
    var name = localStorage.getItem('workdesk_display_name') || 'HR Admin';
    el.textContent = greeting + ', ' + name + '! \uD83D\uDC4B';
    // Update avatar initials
    var initials = name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
    var avatarEls = document.querySelectorAll('.greeting-avatar, [id="topbarAvatar"]');
    avatarEls.forEach(function (el) { el.textContent = initials; });
  }

  // ── Sidebar navigation ────────────────────────────────────
  function initSidebarNav() {
    var items = document.querySelectorAll('.sidebar-menu li');
    items.forEach(function (item) {
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          item.click();
        }
      });
    });
  }

  // ── Toast notification ────────────────────────────────────
  function showToast(msg) {
    var existing = document.getElementById('dashToast');
    if (!existing) {
      existing = document.createElement('div');
      existing.id = 'dashToast';
      existing.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1F2933;color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:500;z-index:999;pointer-events:none;opacity:0;transform:translateY(12px);transition:opacity .3s,transform .3s;';
      document.body.appendChild(existing);
    }
    existing.textContent = msg;
    existing.style.opacity = '1';
    existing.style.transform = 'translateY(0)';
    setTimeout(function () {
      existing.style.opacity = '0';
      existing.style.transform = 'translateY(12px)';
    }, 3000);
  }

  // ── Quick Actions ─────────────────────────────────────────
  function initQuickActions() {
    var actions = document.querySelectorAll('.quick-action');
    actions.forEach(function (action) {
      action.setAttribute('role', 'button');
      action.setAttribute('tabindex', '0');
      action.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') action.click();
      });
      action.addEventListener('click', function () {
        var key = action.dataset.action;
        switch (key) {
          case 'leave':     window.location.href = 'leave.html'; break;
          case 'ticket':    window.location.href = 'tickets.html'; break;
          case 'employee':  window.location.href = 'employees.html'; break;
          case 'payroll':   window.location.href = 'payroll.html'; break;
          case 'reports':   window.location.href = 'analytics.html'; break;
          case 'settings':  window.location.href = 'settings.html'; break;
          case 'messages':  window.location.href = 'messaging.html'; break;
          case 'alerts':    showToast('No new alerts at this time.'); break;
          default:          showToast('Opening ' + (action.textContent.trim()) + '…'); break;
        }
      });
    });
  }

  // ── Card action buttons ───────────────────────────────────
  function initCardActions() {
    var postBtn = document.getElementById('postAnnouncementBtn');
    if (postBtn) {
      postBtn.addEventListener('click', function () {
        var msg = prompt('Enter announcement message:');
        if (msg && msg.trim()) {
          var text = msg.trim();
          WDConfirm.show({
            title:       'Post Announcement',
            message:     'Are you sure you want to post this announcement?',
            type:        'info',
            confirmText: 'Yes, Post',
            cancelText:  'No',
            onConfirm: function () {
              var card = postBtn.closest('.card');
              var notice = document.createElement('div');
              notice.className = 'notice';
              notice.innerHTML = '<div class="notice-title">📢 New Announcement</div>' + text;
              card.appendChild(notice);
              showToast('Announcement posted.');
            }
          });
        }
      });
    }

    var ticketsBtn = document.getElementById('manageTicketsBtn');
    if (ticketsBtn) {
      ticketsBtn.addEventListener('click', function () {
        window.location.href = 'tickets.html';
      });
    }

    // Ticket status row clicks
    document.querySelectorAll('.ticket-item').forEach(function (item) {
      item.style.cursor = 'pointer';
      item.addEventListener('click', function () {
        window.location.href = 'tickets.html';
      });
    });
  }

  // ── Animate stat numbers (count-up) ──────────────────────
  function animateStatNumbers() {
    var statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(function (el) {
      var target = parseInt(el.textContent, 10);
      if (isNaN(target) || target === 0) return;
      var start = 0;
      var duration = 900;
      var startTime = null;
      function step(ts) {
        if (!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target;
        }
      }
      requestAnimationFrame(step);
    });
  }

  // ── Attendance bar fill animation ─────────────────────────
  function animateAttendanceBars() {
    var fills = document.querySelectorAll('.attendance-bar-fill');
    fills.forEach(function (fill) {
      var targetWidth = fill.style.width;
      fill.style.width = '0';
      setTimeout(function () {
        fill.style.transition = 'width 1s cubic-bezier(0.16, 1, 0.3, 1)';
        fill.style.width = targetWidth;
      }, 200);
    });
  }

  // ── Init ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    setGreeting();
    initSidebarNav();
    initQuickActions();
    initCardActions();
    animateStatNumbers();
    animateAttendanceBars();
  });

}());

