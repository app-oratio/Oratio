(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const prepareImages = () => {
    document.querySelectorAll('[data-app-image]').forEach((image) => {
      const wrapper = image.closest('[data-app-image-wrapper]');
      if (!wrapper) return;

      const showPlaceholder = () => wrapper.classList.add('is-missing');
      const showImage = () => wrapper.classList.remove('is-missing');

      image.addEventListener('error', showPlaceholder, { once: true });
      image.addEventListener('load', showImage, { once: true });

      if (image.complete) {
        if (image.naturalWidth > 0) showImage();
        else showPlaceholder();
      }
    });
  };

  const prepareCarousels = () => {
    document.querySelectorAll('[data-app-carousel-root]').forEach((root) => {
      const track = root.querySelector('[data-app-carousel]');
      const previousButton = root.parentElement?.querySelector('[data-carousel-prev]');
      const nextButton = root.parentElement?.querySelector('[data-carousel-next]');
      const status = root.querySelector('[data-carousel-status]');
      const cards = track ? Array.from(track.children) : [];

      if (!track || cards.length === 0) return;

      let activeIndex = 0;
      let updateFrame = 0;

      const cardLeft = (card) => card.offsetLeft - track.offsetLeft;

      const findClosestIndex = () => {
        const currentLeft = track.scrollLeft;
        let closestIndex = 0;
        let closestDistance = Number.POSITIVE_INFINITY;

        cards.forEach((card, index) => {
          const distance = Math.abs(cardLeft(card) - currentLeft);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });

        return closestIndex;
      };

      const updateControls = () => {
        activeIndex = findClosestIndex();
        const maximumScroll = Math.max(0, track.scrollWidth - track.clientWidth - 2);

        if (previousButton) previousButton.disabled = track.scrollLeft <= 2;
        if (nextButton) nextButton.disabled = track.scrollLeft >= maximumScroll;
        if (status) status.textContent = `${activeIndex + 1} de ${cards.length}`;
      };

      const goToCard = (index) => {
        const safeIndex = Math.max(0, Math.min(cards.length - 1, index));
        track.scrollTo({
          left: cardLeft(cards[safeIndex]),
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
      };

      previousButton?.addEventListener('click', () => goToCard(activeIndex - 1));
      nextButton?.addEventListener('click', () => goToCard(activeIndex + 1));

      track.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          goToCard(activeIndex - 1);
        }

        if (event.key === 'ArrowRight') {
          event.preventDefault();
          goToCard(activeIndex + 1);
        }
      });

      track.addEventListener('scroll', () => {
        window.cancelAnimationFrame(updateFrame);
        updateFrame = window.requestAnimationFrame(updateControls);
      }, { passive: true });

      window.addEventListener('resize', updateControls, { passive: true });
      updateControls();
    });
  };

  const prepareMobileDownload = () => {
    const mobileDownload = document.querySelector('[data-app-mobile-download]');
    const finalCallToAction = document.querySelector('[data-app-final-cta]');

    if (!mobileDownload || !finalCallToAction || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        mobileDownload.classList.toggle('is-hidden', entry.isIntersecting);
      });
    }, { threshold: 0.12 });

    observer.observe(finalCallToAction);
  };

  const initialize = () => {
    prepareImages();
    prepareCarousels();
    prepareMobileDownload();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
