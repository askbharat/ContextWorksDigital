(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function revealElements() {
    const items = Array.from(document.querySelectorAll('.js-reveal'));
    if (!items.length) {
      return;
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const delay = Number(entry.target.getAttribute('data-delay') || 0);
          const stagger = Number(entry.target.getAttribute('data-stagger') || 0);
          const staggerDelay = stagger > 0 ? stagger * 100 : 0;

          window.setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, delay + staggerDelay);

          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.16 }
    );

    items.forEach((item) => revealObserver.observe(item));
  }

  function animateHeroWorkflow() {
    const heroVisual = document.querySelector('.abn-hero-visual');
    if (!heroVisual) {
      return;
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      heroVisual.classList.add('is-animated');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            heroVisual.classList.add('is-animated');
            observer.disconnect();
          }
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(heroVisual);
  }

  function animateVaultStage() {
    const vault = document.querySelector('.abn-vault-stage');
    if (!vault) {
      return;
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      vault.classList.add('is-animated');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            vault.classList.add('is-animated');
            observer.disconnect();
          }
        });
      },
      { threshold: 0.32 }
    );

    observer.observe(vault);
  }

  function setupJourneyActivation() {
    const steps = Array.from(document.querySelectorAll('.abn-journey-step'));
    const progress = document.querySelector('.abn-journey-progress');
    const detail = document.getElementById('journey-detail');

    if (!steps.length || !progress || !detail) {
      return;
    }

    function activateStep(step) {
      const stepNumber = Number(step.getAttribute('data-step') || 1);
      const max = steps.length;
      const percentage = max > 1 ? ((stepNumber - 1) / (max - 1)) * 100 : 100;

      steps.forEach((item) => item.classList.remove('is-active'));
      step.classList.add('is-active');
      progress.style.width = percentage + '%';
      detail.textContent = step.getAttribute('data-detail') || '';
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      activateStep(steps[steps.length - 1]);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
          .forEach((entry) => activateStep(entry.target));
      },
      {
        threshold: [0.4, 0.65],
        rootMargin: '-10% 0px -30% 0px',
      }
    );

    steps.forEach((step) => observer.observe(step));
  }

  function animateCounters() {
    const counters = Array.from(document.querySelectorAll('.abn-count[data-target]'));
    if (!counters.length) {
      return;
    }

    const animate = (counter) => {
      const endValue = Number(counter.getAttribute('data-target'));
      if (!Number.isFinite(endValue) || endValue <= 0) {
        return;
      }

      if (reduceMotion) {
        counter.textContent = String(endValue);
        return;
      }

      const duration = 1500;
      const start = performance.now();

      function frame(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const value = Math.round(progress * endValue);
        counter.textContent = String(value);
        if (progress < 1) {
          requestAnimationFrame(frame);
        }
      }

      requestAnimationFrame(frame);
    };

    if (!('IntersectionObserver' in window) || reduceMotion) {
      counters.forEach(animate);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.65 }
    );

    counters.forEach((counter) => observer.observe(counter));
  }

  function activateCapabilityCards() {
    const cards = Array.from(document.querySelectorAll('.abn-cap-card'));
    if (!cards.length) {
      return;
    }

    cards.forEach((card) => {
      card.addEventListener('focus', () => card.classList.add('is-active'));
      card.addEventListener('blur', () => card.classList.remove('is-active'));
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      cards.forEach((card) => card.classList.add('is-active'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-active');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );

    cards.forEach((card) => observer.observe(card));
  }

  revealElements();
  animateHeroWorkflow();
  animateVaultStage();
  setupJourneyActivation();
  animateCounters();
  activateCapabilityCards();
})();
