// WorkDesk — Timeline JS
// Handles role-based compose visibility, reactions, comments, and new post creation.
// Cloudflare Pages compatible — no external dependencies, pure ES6.

(function () {
  'use strict';

  // ── Helpers ───────────────────────────────────────────────
  function escapeHtml(text) {
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
  }

  function getCurrentUserName() {
    return localStorage.getItem('workdesk_display_name') || 'HR Admin';
  }

  function getRole() {
    // In production, read from session cookie / Worker response.
    // Here we read the data-role attribute set on <body>.
    return document.body.dataset.role || 'member';
  }

  // ── Show/hide compose area based on role ─────────────────
  function initRoleUI() {
    var role = getRole();
    var compose = document.getElementById('tlCompose');
    var notice  = document.getElementById('tlLeadersNotice');
    if (role === 'leader') {
      if (compose) compose.style.display = '';
      if (notice)  notice.style.display  = 'none';
    } else {
      if (compose) compose.style.display = 'none';
      if (notice)  notice.style.display  = '';
    }
  }

  // ── Post button ───────────────────────────────────────────
  function initPostButton() {
    var btn   = document.getElementById('postBtn');
    var input = document.getElementById('tlPostInput');
    if (!btn || !input) return;

    btn.addEventListener('click', function () {
      var text = input.value.trim();
      if (!text) {
        input.focus();
        return;
      }
      WDConfirm.show({
        title:       'Post to Timeline',
        message:     'Are you sure you want to post this to the timeline?',
        type:        'info',
        confirmText: 'Yes, Post',
        cancelText:  'No',
        onConfirm: function () {
          createPost(text);
          input.value = '';
          input.style.height = 'auto';
        }
      });
    });

    // Enter+Ctrl submits
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        btn.click();
      }
    });

    // Auto-resize textarea
    input.addEventListener('input', function () {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 200) + 'px';
    });
  }

  // ── Create a new post ─────────────────────────────────────
  function createPost(text) {
    var feed = document.getElementById('tlFeed');
    if (!feed) return;

    var postId = 'p' + Date.now();
    var now    = new Date();
    var timeStr = 'Just now';
    var safeText = escapeHtml(text)
      // Make **bold** work in posts
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    var article = document.createElement('article');
    article.className = 'tl-post';
    article.dataset.postId = postId;
    article.innerHTML =
      '<div class="tl-post-header">' +
        '<div class="tl-post-avatar">JD</div>' +
        '<div class="tl-post-author-info">' +
          '<div class="tl-post-author-row">' +
            '<span class="tl-post-author-name">' + escapeHtml(getCurrentUserName()) + '</span>' +
            '<span class="tl-leader-badge" aria-label="Leader">Leader</span>' +
          '</div>' +
          '<div class="tl-post-role">HR Administrator · HR Department</div>' +
        '</div>' +
        '<span class="tl-post-time">' + escapeHtml(timeStr) + '</span>' +
      '</div>' +
      '<div class="tl-post-body">' + safeText + '</div>' +
      '<div class="tl-reactions" aria-label="Reactions"></div>' +
      '<div class="tl-post-actions">' +
        '<button class="tl-action-btn" data-action="like" aria-label="Like post">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>' +
            '<path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>' +
          '</svg>' +
          'Like' +
        '</button>' +
        '<button class="tl-action-btn" data-action="comment" aria-label="Comment on post">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>' +
          '</svg>' +
          'Comment' +
        '</button>' +
        '<button class="tl-action-btn" data-action="share" aria-label="Share post">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>' +
            '<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>' +
            '<line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>' +
          '</svg>' +
          'Share' +
        '</button>' +
      '</div>' +
      '<div class="tl-comments" id="comments-' + postId + '">' +
        '<div class="tl-comment-input-row">' +
          '<div class="employee-avatar" style="width:32px;height:32px;font-size:11px;flex-shrink:0;">JD</div>' +
          '<input class="tl-comment-input" placeholder="Write a comment…" aria-label="Write a comment" data-post="' + postId + '" />' +
        '</div>' +
      '</div>';

    // Prepend new post at top of feed
    feed.insertBefore(article, feed.firstChild);

    // Bind events on new post
    bindPostEvents(article);

    // Scroll to top to show new post
    var mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.scrollTop = 0;

    // Push a notification for the new timeline post
    if (window.WDNotifications) {
      var author = getCurrentUserName();
      var preview = text.length > 60 ? text.slice(0, 60) + '…' : text;
      window.WDNotifications.push(
        'timeline',
        '<strong>' + escapeHtml(author) + '</strong> posted: ' + escapeHtml(preview),
        'timeline.html'
      );
    }

    // In production: POST to Cloudflare Worker
    // fetch('/api/timeline', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ text: text })
    // });
  }

  // ── Reactions ─────────────────────────────────────────────
  function initReactionBtn(btn) {
    btn.addEventListener('click', function () {
      var reacted = btn.classList.toggle('reacted');
      var count = parseInt(btn.dataset.count, 10) || 0;
      count = reacted ? count + 1 : Math.max(0, count - 1);
      btn.dataset.count = count;
      btn.textContent = btn.dataset.emoji + ' ' + count;
    });
  }

  // ── Action buttons (Like / Comment / Share) ────────────────
  function initActionBtn(btn, post) {
    btn.addEventListener('click', function () {
      var action = btn.dataset.action;
      if (action === 'like') {
        var liked = btn.dataset.liked === 'true';
        btn.dataset.liked = liked ? 'false' : 'true';
        btn.style.color = liked ? '' : 'var(--primary)';
        // Optionally update reaction count
      } else if (action === 'comment') {
        var postId    = post.dataset.postId;
        var comments  = document.getElementById('comments-' + postId);
        if (comments) {
          comments.classList.toggle('open');
          if (comments.classList.contains('open')) {
            var commentInput = comments.querySelector('.tl-comment-input');
            if (commentInput) commentInput.focus();
          }
        }
      } else if (action === 'share') {
        // Clipboard copy of current URL with post anchor
        var shareUrl = window.location.href.split('#')[0] + '#' + (post.dataset.postId || '');
        if (navigator.clipboard) {
          navigator.clipboard.writeText(shareUrl).then(function () {
            var orig = btn.textContent;
            btn.textContent = '✓ Copied!';
            setTimeout(function () { btn.textContent = orig; }, 2000);
          });
        }
      }
    });
  }

  // ── Comment input ────────────────────────────────────────
  function initCommentInput(input, post) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        var text = input.value.trim();
        if (!text) return;
        WDConfirm.show({
          title:       'Post Comment',
          message:     'Are you sure you want to post this comment?',
          type:        'info',
          confirmText: 'Yes, Post',
          cancelText:  'No',
          onConfirm: function () {
            submitComment(input, post, text);
          }
        });
      }
    });
  }

  function submitComment(input, post, text) {
    var postId   = post.dataset.postId;
    var comments = document.getElementById('comments-' + postId);
    if (!comments) return;

    var comment = document.createElement('div');
    comment.className = 'tl-comment';
    comment.innerHTML =
      '<div class="tl-comment-avatar">JD</div>' +
      '<div class="tl-comment-bubble">' +
        '<div class="tl-comment-author">' + escapeHtml(getCurrentUserName()) + '</div>' +
        '<div class="tl-comment-text">' + escapeHtml(text) + '</div>' +
        '<div class="tl-comment-time">Just now</div>' +
      '</div>';

    // Insert before the input row
    var inputRow = comments.querySelector('.tl-comment-input-row');
    comments.insertBefore(comment, inputRow);
    input.value = '';

    // In production: POST to Cloudflare Worker
    // fetch('/api/timeline/comments', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ postId: postId, text: text })
    // });
  }

  // ── Bind all events to a post element ────────────────────
  function bindPostEvents(post) {
    post.querySelectorAll('.tl-reaction-btn').forEach(function (btn) {
      initReactionBtn(btn);
    });
    post.querySelectorAll('.tl-action-btn').forEach(function (btn) {
      initActionBtn(btn, post);
    });
    post.querySelectorAll('.tl-comment-input').forEach(function (input) {
      initCommentInput(input, post);
    });
  }

  // ── Init ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    initRoleUI();
    initPostButton();

    // Bind events on existing posts
    document.querySelectorAll('.tl-post').forEach(function (post) {
      bindPostEvents(post);
    });
  });

}());
