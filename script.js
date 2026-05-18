if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

(function () {

  var langToggle    = document.getElementById('lang-toggle');
  var langSwitch    = document.getElementById('lang-switch');
  var loadingScreen = document.getElementById('loading-screen');
  var introOverlay  = document.getElementById('intro-overlay');
  var introClick    = document.getElementById('intro-click');
  var introPoster   = document.getElementById('intro-poster');
  var video1        = document.getElementById('video-1');
  var video2        = document.getElementById('video-2');

  // ===== Language System =====

  function setLanguage(lang) {
    document.querySelectorAll('[data-ka], [data-en]').forEach(function (el) {
      el.textContent = lang === 'en'
        ? (el.dataset.en || el.dataset.ka)
        : (el.dataset.ka || el.dataset.en);
    });
    document.documentElement.lang = lang === 'en' ? 'en' : 'ka';
    document.body.classList.toggle('lang-en', lang === 'en');
    localStorage.setItem('lang', lang);
    langSwitch.classList.toggle('lang-en', lang === 'en');
    langSwitch.setAttribute('aria-checked', lang === 'en' ? 'true' : 'false');
  }

  langSwitch.addEventListener('click', function () {
    var current = localStorage.getItem('lang') || 'ka';
    setLanguage(current === 'ka' ? 'en' : 'ka');
  });

  langSwitch.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      var current = localStorage.getItem('lang') || 'ka';
      setLanguage(current === 'ka' ? 'en' : 'ka');
    }
  });

  // ===== Loading Screen =====

  function hideLoader() {
    loadingScreen.classList.add('fade-out');
    setTimeout(function () { loadingScreen.classList.add('gone'); }, 700);
  }

  function setupLoader() {
    if (introPoster && introPoster.complete) {
      hideLoader();
    } else if (introPoster) {
      introPoster.addEventListener('load', hideLoader, { once: true });
      introPoster.addEventListener('error', setupVideoFallback, { once: true });
    } else {
      setupVideoFallback();
    }
  }

  function setupVideoFallback() {
    if (video1.readyState >= 2) {
      hideLoader();
    } else {
      video1.addEventListener('loadeddata', hideLoader, { once: true });
    }
    setTimeout(hideLoader, 4000);
  }

  setupLoader();

  // ===== Intro Sequence =====

  function revealSite() {
    introOverlay.classList.add('fade-out');
    setTimeout(function () {
      introOverlay.classList.add('gone');
      document.body.classList.remove('no-scroll');
      document.body.classList.add('scrollbar-ready');
      langToggle.classList.add('visible');
    }, 900);
  }

  function playVideo2() {
    video1.classList.remove('active');
    video2.classList.add('active');
    video2.play();
    video2.addEventListener('ended', revealSite, { once: true });
  }

  function playVideo1() {
    introOverlay.style.cursor = 'default';
    introClick.style.animation = 'none';
    introClick.style.opacity = '1';
    introClick.style.pointerEvents = 'none';
    requestAnimationFrame(function () {
      introClick.style.opacity = '0';
    });
    if (introPoster) introPoster.classList.add('hidden');
    video2.load();
    video1.play();
    video1.addEventListener('ended', playVideo2, { once: true });
  }

  introOverlay.addEventListener('click', playVideo1, { once: true });
  introOverlay.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playVideo1(); }
  }, { once: true });

  // ===== Placeholder language support =====

  var rsvpNameInput = document.getElementById('rsvp-name');

  function updatePlaceholders(lang) {
    if (!rsvpNameInput) return;
    rsvpNameInput.placeholder = lang === 'en'
      ? (rsvpNameInput.dataset.placeholderEn || '')
      : (rsvpNameInput.dataset.placeholderKa || '');
  }

  var _origSetLanguage = setLanguage;
  setLanguage = function (lang) {
    _origSetLanguage(lang);
    updatePlaceholders(lang);
  };

  // Initialize language (UI shown only after intro ends)
  setLanguage(localStorage.getItem('lang') || 'ka');

  // ===== RSVP — Guest count toggle =====

  var rsvpGuests = document.getElementById('rsvp-guests');
  var attendanceInputs = document.querySelectorAll('input[name="attendance"]');

  attendanceInputs.forEach(function (input) {
    input.addEventListener('change', function () {
      if (input.value === 'yes') {
        rsvpGuests.classList.add('open');
        rsvpGuests.setAttribute('aria-hidden', 'false');
      } else {
        rsvpGuests.classList.remove('open');
        rsvpGuests.setAttribute('aria-hidden', 'true');
        document.querySelectorAll('input[name="guestCount"]').forEach(function (r) { r.checked = false; });
      }
    });
  });

  // ===== RSVP — Submit =====

  var API_URL    = 'https://weddsites-backend.vercel.app/api/rsvp';
  var PROJECT_ID = 'salome-giga-2026';

  var rsvpForm     = document.getElementById('rsvp-form');
  var rsvpStatus   = document.getElementById('rsvp-status');
  var rsvpThankyou = document.getElementById('rsvp-thankyou');
  var rsvpSubmit   = rsvpForm ? rsvpForm.querySelector('.rsvp-submit') : null;

  function currentLang() {
    return localStorage.getItem('lang') || 'ka';
  }

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      var name       = rsvpNameInput ? rsvpNameInput.value.trim() : '';
      var attendance = document.querySelector('input[name="attendance"]:checked');
      var guestCount = document.querySelector('input[name="guestCount"]:checked');

      if (!name) {
        rsvpStatus.textContent = currentLang() === 'en' ? 'Please enter your name.' : 'გთხოვთ შეიყვანოთ სახელი.';
        return;
      }
      if (!attendance) {
        rsvpStatus.textContent = currentLang() === 'en' ? 'Please select an option.' : 'გთხოვთ აირჩიოთ პასუხი.';
        return;
      }

      rsvpStatus.textContent = currentLang() === 'en' ? 'Sending…' : 'იგზავნება…';
      if (rsvpSubmit) rsvpSubmit.disabled = true;

      var body = {
        projectId:  PROJECT_ID,
        name:       name,
        attendance: attendance.value,
        guestCount: (attendance.value === 'yes' && guestCount)
          ? Number(guestCount.value)
          : undefined
      };

      try {
        var res = await fetch(API_URL, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body)
        });
        var json = await res.json();
        if (!res.ok) throw new Error(json.error || 'error');

        rsvpForm.style.display = 'none';
        rsvpThankyou.classList.add('visible');
        rsvpThankyou.setAttribute('aria-hidden', 'false');
        // re-run lang to translate thank-you text
        setLanguage(currentLang());
      } catch (err) {
        rsvpStatus.textContent = currentLang() === 'en'
          ? 'Something went wrong. Please try again.'
          : 'დაფიქსირდა შეცდომა. გთხოვთ სცადოთ თავიდან.';
        if (rsvpSubmit) rsvpSubmit.disabled = false;
      }
    });
  }

  // ===== Scroll Reveal =====

  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

}());
