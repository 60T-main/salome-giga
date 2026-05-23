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
  var bgMusic       = document.getElementById('bg-music');
  var musicToggle   = document.getElementById('music-toggle');
  var musicSwitch   = document.getElementById('music-switch');
  var petalsLayer   = document.getElementById('petals-layer');

  // Kick off audio buffering immediately — mobile often ignores preload="auto"
  if (bgMusic) bgMusic.load();

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

  // ===== Hero Video Loop =====

  var hvFwd = document.getElementById('hv-fwd');

  if (hvFwd) {
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        hvFwd.pause();
      } else if (hvFwd.classList.contains('show')) {
        hvFwd.play();
      }
    });
  }

  function revealSite() {
    var heroCenter = document.querySelector('.hero-center');
    if (heroCenter) heroCenter.classList.add('revealed');
    if (hvFwd) {
      hvFwd.style.transition = 'opacity 1s ease';
      hvFwd.play().then(function () {
        hvFwd.classList.add('show');
      }).catch(function () {});
      setTimeout(function () { hvFwd.style.transition = ''; }, 1200);
    }
    // Safety net: make sure the music is playing once the site reveals.
    if (bgMusic && bgMusic.paused && musicSwitch && musicSwitch.classList.contains('playing')) {
      bgMusic.play().catch(function () {});
    }
    introOverlay.classList.add('fade-out');
    setTimeout(function () {
      introOverlay.classList.add('gone');
      document.body.classList.remove('no-scroll');
      document.body.classList.add('scrollbar-ready');
      langToggle.classList.add('visible');
      if (musicToggle) musicToggle.classList.add('visible');
      if (petalsLayer) petalsLayer.classList.add('visible');
    }, 500);
  }

  function playVideo2() {
    video1.classList.remove('active');
    video2.classList.add('active');
    video2.play();
    video2.addEventListener('ended', revealSite, { once: true });
  }

  function playVideo1() {
    // Intro videos are muted, so start the background music right on the tap.
    if (bgMusic) {
      bgMusic.muted = false;
      bgMusic.volume = 0.2;
      bgMusic.play().then(function () {
        if (musicSwitch) {
          musicSwitch.classList.add('playing');
          musicSwitch.setAttribute('aria-checked', 'true');
        }
      }).catch(function () {});
    }
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

  // ===== Music Toggle =====

  if (bgMusic && musicSwitch) {
    function toggleMusic() {
      if (musicSwitch.classList.contains('playing')) {
        bgMusic.pause();
        musicSwitch.classList.remove('playing');
        musicSwitch.setAttribute('aria-checked', 'false');
      } else {
        bgMusic.play().then(function () {
          bgMusic.volume = 0.2;
        }).catch(function () {});
        musicSwitch.classList.add('playing');
        musicSwitch.setAttribute('aria-checked', 'true');
      }
    }

    musicSwitch.addEventListener('click', toggleMusic);
    musicSwitch.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMusic(); }
    });

    // Pause when the tab/browser loses focus, resume when it returns
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        bgMusic.pause();
      } else if (musicSwitch.classList.contains('playing')) {
        bgMusic.play().then(function () {
          bgMusic.volume = 0.2;
        }).catch(function () {});
      }
    });
  }

  // ===== Placeholder language support =====

  var rsvpNameInput    = document.getElementById('rsvp-name');
  var rsvpSurnameInput = document.getElementById('rsvp-surname');

  function updatePlaceholders(lang) {
    [rsvpNameInput, rsvpSurnameInput].forEach(function (el) {
      if (!el) return;
      el.placeholder = lang === 'en'
        ? (el.dataset.placeholderEn || '')
        : (el.dataset.placeholderKa || '');
    });
  }

  var _origSetLanguage = setLanguage;
  setLanguage = function (lang) {
    _origSetLanguage(lang);
    updatePlaceholders(lang);
  };

  // Initialize language (UI shown only after intro ends)
  setLanguage(localStorage.getItem('lang') || 'ka');

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

      var name       = rsvpNameInput    ? rsvpNameInput.value.trim()    : '';
      var surname    = rsvpSurnameInput ? rsvpSurnameInput.value.trim() : '';
      var attendance = document.querySelector('input[name="attendance"]:checked');

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
        surname:    surname || undefined,
        attendance: attendance.value
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

  // ===== Countdown =====

  var cdTarget = new Date('2026-07-18T14:00:00+04:00').getTime();
  var cdDays   = document.getElementById('cd-days');
  var cdHours  = document.getElementById('cd-hours');
  var cdMins   = document.getElementById('cd-mins');
  var cdSecs   = document.getElementById('cd-secs');

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function tickCountdown() {
    var diff = cdTarget - Date.now();
    if (diff < 0) diff = 0;
    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff % 86400000) / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    if (cdDays)  cdDays.textContent  = pad(d);
    if (cdHours) cdHours.textContent = pad(h);
    if (cdMins)  cdMins.textContent  = pad(m);
    if (cdSecs)  cdSecs.textContent  = pad(s);
  }

  if (cdDays) {
    tickCountdown();
    setInterval(tickCountdown, 1000);
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

  // ===== Falling Petals =====
  if (petalsLayer) {
    var petalSrcs  = ['pettle1.png', 'pettle2.png', 'pettle3.png'];
    var petalAnims = ['petalFallA', 'petalFallB', 'petalFallC'];
    var PETAL_COUNT = 6;
    var heroEl = document.querySelector('.hero');
    var siteEl = document.getElementById('site');
    var heroH  = heroEl ? heroEl.offsetHeight : window.innerHeight;
    var siteH  = siteEl ? siteEl.offsetHeight : (document.body.scrollHeight || 3000);
    var zoneH  = Math.max(siteH - heroH, window.innerHeight);
    for (var pi = 0; pi < PETAL_COUNT; pi++) {
      var pel   = document.createElement('img');
      pel.className = 'petal';
      pel.src   = petalSrcs[pi % petalSrcs.length];
      pel.alt   = '';
      var pSize  = 44 + Math.floor(Math.random() * 28);
      var pLeft  = (pi / PETAL_COUNT) * 94 + 3 + (Math.random() - 0.5) * 8;
      pLeft = Math.max(3, Math.min(90, pLeft));
      var pDur   = 14 + Math.random() * 8;
      var pDelay = -(Math.random() * pDur);
      var pAnim  = petalAnims[pi % petalAnims.length];
      // Distribute petal tops evenly across the post-hero area
      var topFrac = (pi + 0.5 + (Math.random() - 0.5) * 0.7) / PETAL_COUNT;
      topFrac = Math.max(0, Math.min(0.95, topFrac));
      var topPx = heroH + topFrac * zoneH;
      pel.style.cssText = 'width:' + pSize + 'px;left:' + pLeft.toFixed(1) + '%;top:' + Math.round(topPx) + 'px;animation:' + pAnim + ' ' + pDur.toFixed(1) + 's ease-in-out infinite ' + pDelay.toFixed(1) + 's';
      petalsLayer.appendChild(pel);
    }
  }

}());
