// JDesk Workspace — Dashboard JS
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
    el.textContent = greeting + ', J. Dela Cruz! \uD83D\uDC4B';
  }

  // ── Sidebar navigation ────────────────────────────────────
  function initSidebarNav() {
    var items = document.querySelectorAll('.sidebar-menu li');
    items.forEach(function (item) {
      item.addEventListener('click', function () {
        // Only toggle active for items without onclick (not navigation links)
        if (!item.getAttribute('onclick')) {
          items.forEach(function (i) { i.classList.remove('active'); });
          item.classList.add('active');
        }
      });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          item.click();
        }
      });
    });
  }

  // ── Quick Actions ─────────────────────────────────────────
  function initQuickActions() {
    var actions = document.querySelectorAll('.quick-action');
    actions.forEach(function (action) {
      action.addEventListener('click', function () {
        var label = action.querySelector('div:last-child');
        if (label) {
          var name = label.textContent.trim();
          // Route to relevant page/section
          if (name === 'Messages' || name === 'Broadcast') {
            window.location.href = 'messaging.html';
          } else {
            console.info('[JDesk] Quick action:', name);
          }
        }
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
        // Ease-out
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
    animateStatNumbers();
    animateAttendanceBars();
  });

}());

