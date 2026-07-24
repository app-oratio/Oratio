(function () {
  'use strict';

  var layer = document.querySelector('[data-drawer-layer]');
  var drawer = document.getElementById('site-drawer');
  var openButton = document.querySelector('[data-drawer-open]');

  if (!layer || !drawer || !openButton) return;

  var closeButtons = layer.querySelectorAll('[data-drawer-close]');
  var searchButton = drawer.querySelector('[data-drawer-search]');
  var accordionItems = Array.prototype.slice.call(drawer.querySelectorAll('[data-drawer-accordion-item]'));
  var desktopQuery = window.matchMedia ? window.matchMedia('(min-width: 1180px)') : null;
  var lastFocused = null;
  var closeTimer = null;
  var focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function focusableElements() {
    return Array.prototype.slice.call(drawer.querySelectorAll(focusableSelector)).filter(function (element) {
      return !element.hidden && element.offsetParent !== null;
    });
  }

  function itemForElement(element) {
    var current = element;

    while (current && current !== drawer) {
      if (current.hasAttribute && current.hasAttribute('data-drawer-accordion-item')) return current;
      current = current.parentElement;
    }

    return null;
  }

  function setAccordionState(item, expanded) {
    if (!item) return;

    var trigger = item.querySelector('[data-drawer-accordion-trigger]');
    var panel = item.querySelector('[data-drawer-accordion-panel]');

    if (!trigger || !panel) return;

    trigger.setAttribute('aria-expanded', String(expanded));
    panel.hidden = !expanded;
    item.classList.toggle('is-open', expanded);
  }

  function openOnlyAccordion(item) {
    accordionItems.forEach(function (candidate) {
      setAccordionState(candidate, candidate === item);
    });
  }

  function currentAccordionItem() {
    var currentLink = drawer.querySelector('a[aria-current="page"]');
    return currentLink ? itemForElement(currentLink) : null;
  }

  function preferredAccordionItem() {
    return currentAccordionItem() || drawer.querySelector('[data-drawer-default-open]') || accordionItems[0] || null;
  }

  function prepareAccordions() {
    if (!accordionItems.length) return;

    drawer.classList.add('is-enhanced');
    openOnlyAccordion(preferredAccordionItem());

    accordionItems.forEach(function (item) {
      var trigger = item.querySelector('[data-drawer-accordion-trigger]');

      if (!trigger) return;

      trigger.addEventListener('click', function () {
        var shouldOpen = trigger.getAttribute('aria-expanded') !== 'true';

        if (shouldOpen) {
          openOnlyAccordion(item);
        } else {
          setAccordionState(item, false);
        }
      });
    });
  }

  function openDrawer() {
    window.clearTimeout(closeTimer);
    lastFocused = document.activeElement;
    layer.inert = false;
    layer.setAttribute('aria-hidden', 'false');
    openButton.setAttribute('aria-expanded', 'true');
    document.body.classList.add('drawer-open');

    var currentItem = currentAccordionItem();
    if (currentItem) openOnlyAccordion(currentItem);

    window.requestAnimationFrame(function () {
      layer.classList.add('is-open');
      var first = drawer.querySelector('[data-drawer-first]') || focusableElements()[0] || drawer;
      first.focus();
    });
  }

  function closeDrawer(restoreFocus) {
    if (layer.getAttribute('aria-hidden') === 'true' && !layer.classList.contains('is-open')) return;

    layer.classList.remove('is-open');
    openButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('drawer-open');

    closeTimer = window.setTimeout(function () {
      layer.setAttribute('aria-hidden', 'true');
      layer.inert = true;
    }, 270);

    if (restoreFocus !== false && lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }

  function trapFocus(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDrawer(true);
      return;
    }

    if (event.key !== 'Tab') return;

    var elements = focusableElements();

    if (!elements.length) {
      event.preventDefault();
      drawer.focus();
      return;
    }

    var first = elements[0];
    var last = elements[elements.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  prepareAccordions();

  openButton.addEventListener('click', openDrawer);

  closeButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      closeDrawer(true);
    });
  });

  drawer.addEventListener('keydown', trapFocus);

  drawer.querySelectorAll('a[href]').forEach(function (link) {
    link.addEventListener('click', function () {
      closeDrawer(false);
    });
  });

  if (searchButton) {
    searchButton.addEventListener('click', function () {
      closeDrawer(false);
    });
  }

  if (desktopQuery) {
    var handleDesktopChange = function (event) {
      if (event.matches) closeDrawer(false);
    };

    if (typeof desktopQuery.addEventListener === 'function') {
      desktopQuery.addEventListener('change', handleDesktopChange);
    } else if (typeof desktopQuery.addListener === 'function') {
      desktopQuery.addListener(handleDesktopChange);
    }
  }
}());
