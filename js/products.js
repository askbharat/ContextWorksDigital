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

  function animatePatientJourney() {
    const patientJourney = document.querySelector('.abn-patient-journey');
    if (!patientJourney) {
      return;
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      patientJourney.classList.add('is-animated');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            patientJourney.classList.add('is-animated');
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(patientJourney);
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

  function setupPatientInterestForm() {
    const form = document.getElementById('patient-interest-form');
    const feedback = document.getElementById('patient-form-feedback');
    const successMessage = document.getElementById('patient-form-success');

    if (!form || !feedback || !successMessage) {
      return;
    }

    const serviceCheckboxes = Array.from(form.querySelectorAll('input[name="services"]'));

    function setError(message, fields) {
      feedback.textContent = message;
      successMessage.textContent = '';
      fields.forEach((field) => field && field.setAttribute('aria-invalid', 'true'));
      if (fields[0]) {
        fields[0].focus();
      }
    }

    function clearErrorState() {
      feedback.textContent = '';
      const invalidFields = form.querySelectorAll('[aria-invalid="true"]');
      invalidFields.forEach((field) => field.removeAttribute('aria-invalid'));
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearErrorState();
      successMessage.textContent = '';

      const fullName = form.querySelector('#patient-full-name');
      const city = form.querySelector('#patient-city');
      const email = form.querySelector('#patient-email');
      const mobile = form.querySelector('#patient-mobile');
      const preferredLanguage = form.querySelector('#patient-language');
      const consent = form.querySelector('#patient-consent');
      const website = form.querySelector('#patient-website');

      if (!fullName.value.trim()) {
        setError('Please enter your full name.', [fullName]);
        return;
      }

      if (!city.value.trim()) {
        setError('Please enter your city.', [city]);
        return;
      }

      if (!email.value.trim()) {
        setError('Please enter your email address.', [email]);
        return;
      }

      if (!mobile.value.trim()) {
        setError('Please enter your mobile number.', [mobile]);
        return;
      }

      if (!preferredLanguage.value.trim()) {
        setError('Please enter your preferred language.', [preferredLanguage]);
        return;
      }

      const selectedServices = serviceCheckboxes.filter((item) => item.checked).map((item) => item.value);
      if (!selectedServices.length) {
        setError('Please select at least one service of interest.', [serviceCheckboxes[0]]);
        return;
      }

      if (!consent.checked) {
        setError('Please provide consent to continue.', [consent]);
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      const originalButtonText = submitButton ? submitButton.textContent : 'Register Your Interest';

      if (submitButton) {
        submitButton.textContent = 'Submitting...';
        submitButton.disabled = true;
      }

      try {
        const response = await fetch('/api/patient-interest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: fullName.value.trim(),
            city: city.value.trim(),
            email: email.value.trim(),
            mobile: mobile.value.trim(),
            preferredLanguage: preferredLanguage.value.trim(),
            services: selectedServices,
            consent: consent.checked,
            website: website.value.trim(),
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success) {
          const message = data.message || 'Unable to submit your request right now. Please try again.';
          feedback.textContent = message;
          return;
        }

        form.reset();
        successMessage.textContent = 'Thank you for registering your interest in AskBharatNow\u2122. We will contact you when a relevant patient or caregiver pilot becomes available.';
      } catch (_error) {
        feedback.textContent = 'Unable to submit your request right now. Please try again.';
      } finally {
        if (submitButton) {
          submitButton.textContent = originalButtonText;
          submitButton.disabled = false;
        }
      }
    });
  }

  revealElements();
  animateHeroWorkflow();
  animateVaultStage();
  animatePatientJourney();
  setupJourneyActivation();
  animateCounters();
  activateCapabilityCards();
  setupPatientInterestForm();
})();
