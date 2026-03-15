/**
 * WorkDesk — Confirmation Dialog (WDConfirm)
 * Provides a styled, non-blocking replacement for the browser confirm() dialog.
 *
 * Usage:
 *   WDConfirm.show({
 *     title:   'Log Out',              // optional heading
 *     message: 'Are you sure you want to log out?',
 *     type:    'warn' | 'danger' | 'info',   // default: 'warn'
 *     confirmText: 'Yes',             // default: 'Yes'
 *     cancelText:  'No',              // default: 'No'
 *     onConfirm:   function() { ... },
 *     onCancel:    function() { ... }  // optional
 *   });
 */
(function () {
  'use strict';

  /* ── Icon map ────────────────────────────────────────── */
  var ICONS = {
    warn:   '⚠️',
    danger: '🗑️',
    info:   'ℹ️',
    success:'✅'
  };

  /* ── Build and show the dialog ───────────────────────── */
  function show(opts) {
    opts = opts || {};
    var title       = opts.title       || 'Confirm Action';
    var message     = opts.message     || 'Are you sure?';
    var type        = opts.type        || 'warn';
    var confirmText = opts.confirmText || 'Yes';
    var cancelText  = opts.cancelText  || 'No';
    var onConfirm   = typeof opts.onConfirm === 'function' ? opts.onConfirm : function () {};
    var onCancel    = typeof opts.onCancel  === 'function' ? opts.onCancel  : function () {};

    /* overlay */
    var overlay = document.createElement('div');
    overlay.className = 'wdconfirm-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'wdcTitle');

    /* box */
    var box = document.createElement('div');
    box.className = 'wdconfirm-box';

    /* icon */
    var iconEl = document.createElement('div');
    iconEl.className = 'wdconfirm-icon icon-' + type;
    iconEl.textContent = ICONS[type] || ICONS.warn;

    /* title */
    var titleEl = document.createElement('p');
    titleEl.className = 'wdconfirm-title';
    titleEl.id = 'wdcTitle';
    titleEl.textContent = title;

    /* message */
    var msgEl = document.createElement('p');
    msgEl.className = 'wdconfirm-msg';
    msgEl.textContent = message;

    /* action buttons */
    var actions = document.createElement('div');
    actions.className = 'wdconfirm-actions';

    var btnCancel = document.createElement('button');
    btnCancel.className = 'btn btn-outline';
    btnCancel.textContent = cancelText;

    var btnConfirm = document.createElement('button');
    btnConfirm.className = type === 'danger' ? 'btn btn-danger' : 'btn btn-primary';
    btnConfirm.textContent = confirmText;

    actions.appendChild(btnCancel);
    actions.appendChild(btnConfirm);

    box.appendChild(iconEl);
    box.appendChild(titleEl);
    box.appendChild(msgEl);
    box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    /* focus the confirm button for keyboard accessibility */
    btnConfirm.focus();

    /* ── Handlers ─────────────────────────────────────── */
    function close() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    btnConfirm.addEventListener('click', function () {
      close();
      onConfirm();
    });

    btnCancel.addEventListener('click', function () {
      close();
      onCancel();
    });

    /* close on backdrop click */
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        close();
        onCancel();
      }
    });

    /* close on Escape key */
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', onKeyDown);
        close();
        onCancel();
      }
    }
    document.addEventListener('keydown', onKeyDown);
  }

  /* ── Expose global API ───────────────────────────────── */
  window.WDConfirm = { show: show };

}());
