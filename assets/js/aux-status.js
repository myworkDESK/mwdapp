/**
 * WorkDesk — Shared AUX Status Manager
 * Handles agent status (Online/Away/Busy/Offline) with Clock In/Out support.
 * Persists status and session timing to localStorage.
 * Attempts to sync AUX log entries with /api/aux when available.
 *
 * Exposed API:  window.WDAux.clockIn()  / window.WDAux.clockOut()
 * localStorage keys:
 *   workdesk_aux_status  — current status string
 *   workdesk_aux_start   — ISO timestamp of current status start
 *   workdesk_aux_log     — JSON array of AUX log entries
 *   workdesk_clocked_in  — '1' when a work session is active
 */
(function () {
  'use strict';

  var STATUS_KEY  = 'workdesk_aux_status';
  var START_KEY   = 'workdesk_aux_start';
  var LOG_KEY     = 'workdesk_aux_log';
  var CLOCK_KEY   = 'workdesk_clocked_in';

  var auxStatusStart = Date.now();

  // ── Read/write helpers ────────────────────────────────────
  function getSavedStatus() {
    return localStorage.getItem(STATUS_KEY) || 'offline';
  }

  function isClockedIn() {
    return !!localStorage.getItem(CLOCK_KEY);
  }

  function saveStatus(status) {
    localStorage.setItem(STATUS_KEY, status);
    localStorage.setItem(START_KEY, new Date().toISOString());
  }

  // ── AUX log helpers ───────────────────────────────────────
  function logAuxChange(status) {
    var logs = [];
    try { logs = JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch (e) { logs = []; }
    var now = new Date();
    // Close out previous open entry
    if (logs.length > 0 && !logs[logs.length - 1].endTime) {
      logs[logs.length - 1].endTime = now.toISOString();
    }
    logs.push({
      status: status,
      startTime: now.toISOString(),
      endTime: null,
      employee: localStorage.getItem('workdesk_display_name') || 'Unknown'
    });
    if (logs.length > 200) logs = logs.slice(-200);
    try { localStorage.setItem(LOG_KEY, JSON.stringify(logs)); } catch (e) { /* ignore */ }
    auxStatusStart = Date.now();

    // Sync to backend (fire-and-forget)
    var token = localStorage.getItem('workdesk_token') || '';
    if (token) {
      fetch('/api/aux', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({
          status: status,
          startTime: now.toISOString(),
          employee: localStorage.getItem('workdesk_display_name') || 'Unknown'
        })
      }).catch(function () { /* offline */ });
    }
  }

  // ── Apply a status to the UI ──────────────────────────────
  function applyStatus(status) {
    var dot = document.getElementById('statusDot');
    var lbl = document.getElementById('statusLabel');
    if (!dot || !lbl) return;
    dot.className = 'status-dot ' + status;
    var labels = { online: 'Online', away: 'Away', busy: 'Busy', offline: 'Offline' };
    lbl.textContent = labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
    updateClockBtns(status);
  }

  // ── AUX timer ─────────────────────────────────────────────
  function updateAuxTimer() {
    var el = document.getElementById('auxTimer');
    if (!el) return;
    var elapsed = Math.floor((Date.now() - auxStatusStart) / 1000);
    var h = Math.floor(elapsed / 3600);
    var m = Math.floor((elapsed % 3600) / 60);
    var s = elapsed % 60;
    if (h > 0) {
      el.textContent = h + 'h ' + m + 'm';
    } else if (m > 0) {
      el.textContent = m + 'm ' + s + 's';
    } else {
      el.textContent = s + 's';
    }
  }

  // ── Clock In/Out ──────────────────────────────────────────
  function clockIn() {
    localStorage.setItem(CLOCK_KEY, '1');
    saveStatus('online');
    applyStatus('online');
    logAuxChange('online');
    updateClockBtns('online');

    // Sync to attendance API
    var token = localStorage.getItem('workdesk_token') || '';
    if (token) {
      var now = new Date();
      fetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ time: now.toLocaleTimeString(), date: now.toISOString().slice(0, 10) })
      }).catch(function () { /* offline */ });
    }
  }

  function clockOut() {
    localStorage.removeItem(CLOCK_KEY);
    saveStatus('offline');
    applyStatus('offline');
    logAuxChange('offline');
    updateClockBtns('offline');

    // Sync to attendance API
    var token = localStorage.getItem('workdesk_token') || '';
    if (token) {
      var now = new Date();
      fetch('/api/attendance/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ time: now.toLocaleTimeString() })
      }).catch(function () { /* offline */ });
    }
  }

  // ── Update clock button visibility ───────────────────────
  function updateClockBtns(status) {
    var btnIn  = document.getElementById('auxClockIn');
    var btnOut = document.getElementById('auxClockOut');
    if (!btnIn || !btnOut) return;
    var clocked = isClockedIn();
    btnIn.style.display  = clocked ? 'none' : '';
    btnOut.style.display = clocked ? '' : 'none';
  }

  // ── Wire up the status dropdown ───────────────────────────
  function initWidget() {
    var statusBtn  = document.getElementById('statusBadgeBtn');
    var statusDrop = document.getElementById('statusDropdown');
    var statusDot  = document.getElementById('statusDot');
    var statusLbl  = document.getElementById('statusLabel');

    // Restore persisted status
    var savedStatus = getSavedStatus();
    var savedStart  = localStorage.getItem(START_KEY);
    if (savedStart) {
      var parsed = new Date(savedStart).getTime();
      if (!isNaN(parsed)) auxStatusStart = parsed;
    }
    applyStatus(savedStatus);

    if (!statusBtn || !statusDrop) return;

    statusBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = statusDrop.classList.toggle('open');
      statusBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', function (e) {
      var wrap = document.getElementById('statusWrap');
      if (wrap && !wrap.contains(e.target)) {
        statusDrop.classList.remove('open');
        statusBtn.setAttribute('aria-expanded', 'false');
      }
    });

    statusDrop.querySelectorAll('.status-dropdown-item').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.stopPropagation();
        var s = item.dataset.status;
        // Going offline from dropdown: only allowed when not clocked in
        if (s === 'offline' && isClockedIn()) {
          // Prompt clock-out instead
          statusDrop.classList.remove('open');
          statusBtn.setAttribute('aria-expanded', 'false');
          WDConfirm.show({
            title:       'Clock Out',
            message:     'Clock out to go Offline?',
            type:        'warn',
            confirmText: 'Yes, Clock Out',
            cancelText:  'No',
            onConfirm:   clockOut
          });
          return;
        }
        saveStatus(s);
        applyStatus(s);
        logAuxChange(s);
        statusDrop.classList.remove('open');
        statusBtn.setAttribute('aria-expanded', 'false');
      });
    });

    // Clock In button
    var btnIn = document.getElementById('auxClockIn');
    if (btnIn) {
      btnIn.addEventListener('click', function (e) {
        e.stopPropagation();
        WDConfirm.show({
          title:       'Clock In',
          message:     'Are you sure you want to clock in and start your work session?',
          type:        'info',
          confirmText: 'Yes, Clock In',
          cancelText:  'No',
          onConfirm:   clockIn
        });
      });
    }

    // Clock Out button
    var btnOut = document.getElementById('auxClockOut');
    if (btnOut) {
      btnOut.addEventListener('click', function (e) {
        e.stopPropagation();
        WDConfirm.show({
          title:       'Clock Out',
          message:     'Are you sure you want to clock out and end your work session?',
          type:        'warn',
          confirmText: 'Yes, Clock Out',
          cancelText:  'No',
          onConfirm:   clockOut
        });
      });
    }

    updateClockBtns(savedStatus);
  }

  // ── Start timer interval ──────────────────────────────────
  function startTimer() {
    updateAuxTimer();
    setInterval(updateAuxTimer, 1000);
  }

  // ── Expose public API ─────────────────────────────────────
  window.WDAux = {
    clockIn:   clockIn,
    clockOut:  clockOut,
    isClockedIn: isClockedIn,
    updateTimer: updateAuxTimer
  };

  // ── Auto-init ─────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initWidget();
      startTimer();
    });
  } else {
    initWidget();
    startTimer();
  }

}());
