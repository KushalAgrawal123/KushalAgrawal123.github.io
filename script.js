(function () {
  'use strict';

  var root = document.documentElement;
  var themeBtn = document.getElementById('theme-toggle');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function currentTheme() {
    var theme = root.getAttribute('data-theme');
    return theme === 'dark' ? 'dark' : 'light';
  }

  function syncThemeButton() {
    if (!themeBtn) return;
    var label = currentTheme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    themeBtn.setAttribute('aria-label', label);
    themeBtn.setAttribute('title', label);
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      syncThemeButton();
    });
    syncThemeButton();
  }

  /* Use the reading position so short sections and gaps stay predictable. */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.side-nav a, .mobile-nav a'));
  var sections = Array.prototype.slice.call(document.querySelectorAll('main .section'));
  var mobileNav = document.querySelector('.mobile-nav');
  var actionsBar = document.querySelector('.top-actions');
  var activeId;
  var scrollQueued = false;

  function setActive(id) {
    if (activeId === id) return;
    activeId = id;
    navLinks.forEach(function (link) {
      var active = link.getAttribute('href') === '#' + id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');

      if (active && mobileNav && link.parentElement === mobileNav && mobileNav.getClientRects().length) {
        var left = link.offsetLeft - (mobileNav.clientWidth - link.offsetWidth) / 2;
        mobileNav.scrollTo({ left: left, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      }
    });
  }

  function updateActiveSection() {
    scrollQueued = false;
    if (!sections.length) return;
    var stickyHeight = actionsBar ? actionsBar.offsetHeight : 0;
    if (mobileNav && mobileNav.getClientRects().length) stickyHeight += mobileNav.offsetHeight;
    var readingLine = Math.max(Math.min(window.innerHeight * .25, 180), stickyHeight + 36);
    var selected = sections[0];
    sections.forEach(function (section) {
      if (section.getBoundingClientRect().top <= readingLine) selected = section;
    });
    var atBottom = window.innerHeight + window.scrollY >= root.scrollHeight - 4;
    if (atBottom) selected = sections[sections.length - 1];
    setActive(selected.id);
  }

  function queueScrollUpdate() {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(updateActiveSection);
  }

  window.addEventListener('scroll', queueScrollUpdate, { passive: true });
  window.addEventListener('resize', function () {
    activeId = null;
    queueScrollUpdate();
  });
  window.addEventListener('load', updateActiveSection);
  updateActiveSection();

  /* Give clipboard success and failure visible and screen-reader feedback. */
  var copyStatus = document.getElementById('copy-status');

  function legacyCopy(value) {
    var previousFocus = document.activeElement;
    var selection = window.getSelection();
    var ranges = [];
    if (selection) {
      for (var i = 0; i < selection.rangeCount; i++) ranges.push(selection.getRangeAt(i).cloneRange());
    }
    var input = document.createElement('textarea');
    input.value = value;
    input.className = 'sr-only';
    input.setAttribute('readonly', '');
    input.setAttribute('aria-label', 'Contact detail to copy');
    document.body.appendChild(input);
    input.select();
    var copied = false;
    try { copied = document.execCommand('copy'); } catch (e) {}
    input.remove();
    if (selection) {
      selection.removeAllRanges();
      ranges.forEach(function (range) { selection.addRange(range); });
    }
    if (previousFocus) previousFocus.focus({ preventScroll: true });
    return copied;
  }

  Array.prototype.forEach.call(document.querySelectorAll('.copy-btn'), function (btn) {
    var resetTimer;
    var originalLabel = btn.getAttribute('aria-label');

    function showFeedback(copied) {
      window.clearTimeout(resetTimer);
      var message = copied ? 'Copied!' : 'Unable to copy';
      btn.classList.toggle('copied', copied);
      btn.setAttribute('data-feedback', message);
      btn.setAttribute('aria-label', copied ? 'Copied to clipboard' : originalLabel);
      if (copyStatus) copyStatus.textContent = copied ? 'Contact detail copied to clipboard.' : 'Copy was unavailable. Select the contact detail to copy it.';
      resetTimer = window.setTimeout(function () {
        btn.classList.remove('copied');
        btn.removeAttribute('data-feedback');
        btn.setAttribute('aria-label', originalLabel);
        if (copyStatus) copyStatus.textContent = '';
      }, 2000);
    }

    btn.addEventListener('click', function () {
      var value = btn.getAttribute('data-copy');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(function () {
          showFeedback(true);
        }, function () {
          showFeedback(legacyCopy(value));
        });
      } else {
        showFeedback(legacyCopy(value));
      }
    });
  });

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
