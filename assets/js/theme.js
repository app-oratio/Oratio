(function () {
  'use strict';

  var storageKey = 'oratio-theme';
  var mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function readPreference() {
    try {
      var value = window.localStorage.getItem(storageKey);
      return value === 'light' || value === 'dark' ? value : null;
    } catch (error) {
      return null;
    }
  }

  function systemPreference() {
    return mediaQuery && mediaQuery.matches ? 'dark' : 'light';
  }

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  function updateControls(theme) {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      var darkIsActive = theme === 'dark';
      var actionLabel = darkIsActive ? 'Ativar tema claro' : 'Ativar tema escuro';
      button.setAttribute('aria-label', actionLabel);
      button.setAttribute('aria-pressed', String(darkIsActive));
      var symbol = button.querySelector('[data-theme-symbol]');
      var label = button.querySelector('[data-theme-label]');
      if (symbol) symbol.textContent = darkIsActive ? '☀' : '☾';
      if (label) label.textContent = darkIsActive ? 'Tema claro' : 'Tema escuro';
    });

    var themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', theme === 'dark' ? '#121212' : '#004A98');
  }

  function applyTheme(theme, persist) {
    document.documentElement.setAttribute('data-theme', theme);
    if (persist) {
      try { window.localStorage.setItem(storageKey, theme); } catch (error) { /* Preferência apenas na sessão. */ }
    }
    updateControls(theme);
  }

  applyTheme(readPreference() || systemPreference(), false);

  function initialize() {
    updateControls(currentTheme());
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      button.addEventListener('click', function () {
        applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();

  if (mediaQuery) {
    mediaQuery.addEventListener('change', function () {
      if (!readPreference()) applyTheme(systemPreference(), false);
    });
  }
}());

