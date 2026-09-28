/**
 * ============================================================================
 * "FOR YOU" INTERACTIVE SURPRISE PAGE — MASTER SCRIPT
 * ============================================================================
 * 
 * Implements:
 * 1. Infinite continuous falling media rain with lane management
 * 2. Click-to-freeze & full preview lightbox modal
 * 3. Live "Together Since" counter (days, hours, mins, secs)
 * 4. Dynamic responsive media gallery with category filtering
 * 5. Floating 💌 Love notes envelope modal with heart burst confetti
 * 6. Ambient background music player with smart Web Audio synth fallback
 * 7. Keyboard navigation (Esc, Arrow keys) & accessibility
 */

(function () {
  'use strict';

  // Fallback config if not defined
  const cfg = window.CONFIG || {
    partnerName: "Lyka Macabudbud",
    enableMusic: true,
    musicSrc: "assets/audio/song.mp3",
    media: [],
    notes: ["I love you! 💖"]
  };

  // State Management
  let isRainPaused = false;
  let currentModalIndex = 0;
  let isMusicPlaying = false;
  let audioPlayer = null;
  let synthAudioCtx = null;
  let synthInterval = null;
  let currentTrackIndex = 0;
  let isSeeking = false;
  let hasAutoStarted = false;
  let wasMusicPlayingBeforeVideo = false;
  let isPlaybackPositionRestored = true;
  let targetSavedTime = 0;

  // Playlist array from config or fallback
  const playlist = (cfg.playlist && cfg.playlist.length > 0) ? cfg.playlist : [
    {
      id: "track-1",
      title: "Fallin",
      artist: "Ex Battalion",
      src: cfg.musicSrc || "assets/audio/Ex Battalion - Fallin (Lyrics).mp3",
      cover: "assets/images/image7.jpg"
    }
  ];

  // DOM Elements
  const rainContainer = document.getElementById('rain-container');
  const partnerNameEl = document.getElementById('partner-name-display');
  const daysEl = document.getElementById('count-days');
  const hoursEl = document.getElementById('count-hours');
  const minutesEl = document.getElementById('count-minutes');
  const secondsEl = document.getElementById('count-seconds');
  const galleryGrid = document.getElementById('gallery-grid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryUploadPhotoBtn = document.getElementById('gallery-upload-photo-btn');
  const galleryUploadVideoBtn = document.getElementById('gallery-upload-video-btn');
  const galleryPhotoInput = document.getElementById('gallery-photo-input');
  const galleryVideoInput = document.getElementById('gallery-video-input');
  
  // Media Modal Elements
  const mediaModal = document.getElementById('media-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalMediaStage = document.getElementById('modal-media-stage');
  const modalCaption = document.getElementById('modal-caption');
  const modalCounter = document.getElementById('modal-counter');
  const modalDeleteBtn = document.getElementById('modal-delete-btn');
  const modalPrevBtn = document.getElementById('modal-prev-btn');
  const modalNextBtn = document.getElementById('modal-next-btn');

  // Gallery Delete Confirmation Modal Elements
  const galleryDeleteModal = document.getElementById('gallery-delete-modal');
  const galleryDeleteTitle = document.getElementById('gallery-delete-title');
  const galleryDeleteDesc = document.getElementById('gallery-delete-desc');
  const galleryDeleteConfirmBtn = document.getElementById('gallery-delete-confirm-btn');
  const galleryDeleteCancelBtn = document.getElementById('gallery-delete-cancel-btn');

  // Note Modal Elements
  const noteModal = document.getElementById('note-modal');
  const floatingNoteBtn = document.getElementById('floating-note-btn');
  const noteTextEl = document.getElementById('note-text');
  const noteNextBtn = document.getElementById('note-next-btn');
  const noteCloseBtn = document.getElementById('note-close-btn');

  // Control Buttons
  const rainToggleBtn = document.getElementById('rain-toggle-btn');
  const rainToggleText = document.getElementById('rain-toggle-text');
  const musicToggleBtn = document.getElementById('music-toggle-btn');
  const musicPlaylistTriggerBtn = document.getElementById('music-playlist-trigger-btn');
  const topBarTrackTitle = document.getElementById('top-bar-track-title');
  const topBarCoverImg = document.getElementById('top-bar-cover-img');

  // Playlist Modal Elements
  const playlistModal = document.getElementById('playlist-modal');
  const playlistCloseBtn = document.getElementById('playlist-close-btn');
  const playlistTracksContainer = document.getElementById('playlist-tracks-container');
  const bannerCover = document.getElementById('banner-cover');
  const bannerTitle = document.getElementById('banner-title');
  const bannerArtist = document.getElementById('banner-artist');
  const bannerStatusPill = document.getElementById('banner-status-pill');
  const bannerTrackCount = document.getElementById('banner-track-count');
  const uploadMusicBtn = document.getElementById('upload-music-btn');
  const musicUploadInput = document.getElementById('music-upload-input');
  const playerProgressBar = document.getElementById('player-progress-bar');
  const playerTimeCurrent = document.getElementById('player-time-current');
  const playerTimeDuration = document.getElementById('player-time-duration');
  const ctrlPrevBtn = document.getElementById('ctrl-prev-btn');
  const ctrlPlayPauseBtn = document.getElementById('ctrl-play-pause-btn');
  const ctrlNextBtn = document.getElementById('ctrl-next-btn');
  const playerVolumeSlider = document.getElementById('player-volume-slider');

  // Global Site Toast Notification
  let siteToastTimeout = null;
  function showSiteToast(msg, icon = '✨') {
    let toastEl = document.getElementById('pbooth-toast');
    let toastIcon = document.getElementById('pbooth-toast-icon');
    let toastMsg = document.getElementById('pbooth-toast-msg');
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'pbooth-toast';
      toastEl.className = 'site-toast-notification';
      toastEl.innerHTML = `<span id="pbooth-toast-icon" class="site-toast-icon">${icon}</span><span id="pbooth-toast-msg" class="site-toast-msg">${msg}</span>`;
      document.body.appendChild(toastEl);
      toastIcon = document.getElementById('pbooth-toast-icon');
      toastMsg = document.getElementById('pbooth-toast-msg');
    }
    if (siteToastTimeout) clearTimeout(siteToastTimeout);
    if (toastIcon) toastIcon.textContent = icon;
    if (toastMsg) toastMsg.textContent = msg;
    toastEl.classList.add('show');
    siteToastTimeout = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 3200);
  }

  /* ==========================================================================
     1. INITIALIZATION & HERO SETUP
     ========================================================================== */
  function init() {
    // 1. Set personalized names
    if (partnerNameEl && cfg.partnerName) {
      partnerNameEl.textContent = cfg.partnerName;
    }
    const noteGreeting = document.getElementById('note-greeting');
    if (noteGreeting) {
      noteGreeting.textContent = "Future cumlaude, lyka 💖";
    }

    // 2. Start Together Since Counter
    initCounter();

    // 3. Populate Gallery & Typewriter Title
    initGallery();
    initTypewriter();

    // 4. Setup Falling Media Rain & Love Emojis Shower
    initRain();
    initEmojiRain();

    // 5. Setup Music Player
    initMusic();

    // 6. Setup Event Listeners & Modals
    setupEventListeners();

    // 7. Setup Photobooth Studio & Snaps History
    initPhotobooth();

    // 8. Accessibility
    // Rain flows smoothly by default, and user can freeze/resume at any time with the top button
  }

  /* ==========================================================================
     2. LIVE "WHAT TIME IS NOW" CLOCK & REAL-TIME DISPLAY
     ========================================================================== */
  function initCounter() {
    // Elements for live clock pill
    const liveTimeNowEl = document.getElementById('live-time-now');
    const liveAmpmNowEl = document.getElementById('live-ampm-now');
    const liveDateNowEl = document.getElementById('live-date-now');
    const counterHeadingText = document.getElementById('counter-heading-text');

    // Box label elements
    const labelBox1 = document.getElementById('label-box-1');
    const labelBox2 = document.getElementById('label-box-2');
    const labelBox3 = document.getElementById('label-box-3');
    const labelBox4 = document.getElementById('label-box-4');

    // Tick function updating every second
    function tickCounter() {
      const now = new Date();

      // 1. Update Live Clock Pill ("What time is now")
      let h24 = now.getHours();
      const ampm = h24 >= 12 ? 'PM' : 'AM';
      let h12 = h24 % 12;
      h12 = h12 ? h12 : 12; // 0 becomes 12
      const h12Str = String(h12).padStart(2, '0');
      const mStr = String(now.getMinutes()).padStart(2, '0');
      const sStr = String(now.getSeconds()).padStart(2, '0');
      const weekdayStr = now.toLocaleDateString(undefined, { weekday: 'long' }); // e.g., "Friday"

      if (liveTimeNowEl) liveTimeNowEl.textContent = `${h12Str}:${mStr}:${sStr}`;
      if (liveAmpmNowEl) liveAmpmNowEl.textContent = ampm;
      if (liveDateNowEl) {
        liveDateNowEl.textContent = now.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
      }

      // 2. Update Main 4 Counter Boxes: Week Day, Hours, Minutes, Seconds
      if (daysEl) {
        daysEl.textContent = weekdayStr;
        daysEl.classList.add('is-weekday');
      }
      if (hoursEl) hoursEl.textContent = h12Str;
      if (minutesEl) minutesEl.textContent = mStr;
      if (secondsEl) secondsEl.textContent = sStr;

      if (labelBox1) labelBox1.textContent = "Week Day";
      if (labelBox2) labelBox2.textContent = `Hours (${ampm})`;
      if (labelBox3) labelBox3.textContent = "Minutes";
      if (labelBox4) labelBox4.textContent = "Seconds";

      if (counterHeadingText) {
        counterHeadingText.textContent = `Cherishing Every Second With ${cfg.partnerName || "Lyka Macabudbud"}`;
      }
    }

    // Initial tick & interval
    tickCounter();
    setInterval(tickCounter, 1000);
  }

  /* ==========================================================================
     3. SLOW 16-SECOND NON-OVERLAPPING MEMORY RAIN (ZERO DUPLICATES ON SCREEN)
     ========================================================================== */
  const RAIN_DURATION = 16; // Strictly 16 seconds slow, gentle romantic fall
  const activeImageSrcs = new Set();
  let recentImageHistory = [];
  let currentActiveLaneCount = 0;

  function getAvailableRainImage() {
    const poolSource = (galleryMedia && galleryMedia.length > 0) ? galleryMedia : (cfg.media || []);
    const allImages = poolSource.filter(m => m.type === 'image');

    if (allImages.length === 0) {
      return cfg.media[0] || { type: 'image', src: 'assets/images/image1.jpg', caption: 'Our Memory' };
    }

    // Strictly exclude images currently visible on screen to guarantee NO duplicates!
    let available = allImages.filter(item => !activeImageSrcs.has(item.src));
    if (available.length === 0) {
      available = allImages;
    }

    // Prefer images that were not in recent history so all 13 photos cycle evenly
    const fresh = available.filter(item => !recentImageHistory.includes(item.src));
    const pool = fresh.length > 0 ? fresh : available;

    const selectedItem = pool[Math.floor(Math.random() * pool.length)];

    activeImageSrcs.add(selectedItem.src);
    recentImageHistory.push(selectedItem.src);
    if (recentImageHistory.length > 8) {
      recentImageHistory.shift();
    }

    return selectedItem;
  }

  function releaseRainImage(src) {
    if (src) {
      activeImageSrcs.delete(src);
    }
  }

  function getLaneCount() {
    const width = window.innerWidth;
    if (width < 500) return 2;       // Mobile: 2 dedicated columns
    if (width < 800) return 3;       // Tablet / Wide Phone: 3 dedicated columns
    if (width < 1150) return 4;      // Small Desktop: 4 dedicated columns
    return cfg.rainLanes || 5;       // Desktop: 5 dedicated columns
  }

  function initRain() {
    if (!rainContainer || !cfg.media || cfg.media.length === 0) return;

    rainContainer.innerHTML = '';
    activeImageSrcs.clear();
    recentImageHistory = [];

    const laneCount = getLaneCount();
    currentActiveLaneCount = laneCount;

    // Staggered initial heights so images are smoothly distributed across the screen:
    // Exactly 1 card per lane, eliminating vertical stacking!
    const staggerFractions = [0.15, 0.70, 0.35, 0.85, 0.50];

    for (let lane = 0; lane < laneCount; lane++) {
      const fraction = staggerFractions[lane % staggerFractions.length];
      spawnCardForLane(lane, laneCount, true, fraction);
    }

    // Smooth resize handler
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newCount = getLaneCount();
        if (newCount !== currentActiveLaneCount) {
          initRain();
        }
      }, 400);
    });
  }

  function spawnCardForLane(laneIndex, laneCount, isPrePopulate = false, prePopulateFraction = 0.5) {
    if (!rainContainer || isRainPaused) return;

    const mediaItem = getAvailableRainImage();
    const mediaIndex = cfg.media.indexOf(mediaItem);

    // Create Card element
    const card = document.createElement('div');
    card.className = 'falling-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Falling memory: ${mediaItem.caption || 'Memory'}`);

    // Strictly locked to its own dedicated lane column center:
    // Eliminates horizontal drift into adjacent lanes ("dili mag sapawsapaw")
    const centerPct = ((laneIndex + 0.5) / laneCount) * 100;
    card.style.left = `${centerPct}%`;

    // Subtle gentle tilt within safe non-overlapping bounds
    const rotStart = -3 + Math.random() * 6;
    const rotEnd = -3 + Math.random() * 6;
    const cardRot = -2 + Math.random() * 4;

    card.style.setProperty('--rot-start', `${rotStart}deg`);
    card.style.setProperty('--rot-end', `${rotEnd}deg`);
    card.style.setProperty('--rot', `${cardRot}deg`);

    // Strictly 16 seconds slow, graceful romantic fall!
    card.style.animationDuration = `${RAIN_DURATION}s`;

    if (isPrePopulate) {
      // Negative delay places the card already mid-flight down the screen on initial load
      const initialOffset = -(RAIN_DURATION * prePopulateFraction);
      card.style.animationDelay = `${initialOffset}s`;
    } else {
      card.style.animationDelay = `0s`;
    }

    // Card Inner Structure (Polaroid Frame)
    const inner = document.createElement('div');
    inner.className = 'falling-inner';

    const pin = document.createElement('span');
    pin.className = 'falling-pin';
    pin.textContent = '🤍';
    inner.appendChild(pin);

    const mediaWrapper = document.createElement('div');
    mediaWrapper.className = 'falling-media-wrapper';

    // Pure image element for all falling memories
    const img = document.createElement('img');
    img.src = mediaItem.src;
    img.alt = mediaItem.caption || "Romantic memory";
    img.loading = "eager";

    img.addEventListener('error', () => {
      mediaWrapper.innerHTML = `
        <div class="heart-placeholder">
          <span>🤍</span>
        </div>
      `;
    });
    mediaWrapper.appendChild(img);
    inner.appendChild(mediaWrapper);

    if (mediaItem.caption) {
      const tag = document.createElement('div');
      tag.className = 'falling-tag';
      tag.textContent = mediaItem.caption;
      inner.appendChild(tag);
    }

    card.appendChild(inner);

    // CLICK EVENT: Open modal lightbox!
    const openCardMemory = (e) => {
      e.stopPropagation();
      const curIdx = galleryMedia.findIndex(m => (m.src && m.src === mediaItem.src) || (m.id && m.id === mediaItem.id));
      openModal(curIdx >= 0 ? curIdx : (mediaIndex >= 0 ? mediaIndex : 0));
    };

    card.addEventListener('click', openCardMemory);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openCardMemory(e);
      }
    });

    // When the 16s falling animation completes, remove card, release image from active pool,
    // and spawn the next unique memory in this exact lane without any overlap!
    card.addEventListener('animationend', () => {
      card.remove();
      releaseRainImage(mediaItem.src);

      // Brief gentle pause before launching the next card in this lane
      const pauseMs = 300 + Math.random() * 500;
      setTimeout(() => {
        if (!isRainPaused) {
          spawnCardForLane(laneIndex, laneCount, false, 0);
        } else {
          const checkUnpause = setInterval(() => {
            if (!isRainPaused) {
              clearInterval(checkUnpause);
              spawnCardForLane(laneIndex, laneCount, false, 0);
            }
          }, 400);
        }
      }, pauseMs);
    });

    rainContainer.appendChild(card);
  }

  function pauseRain() {
    isRainPaused = true;
    if (rainContainer) {
      rainContainer.classList.add('paused');
    }
    const emojiRainContainer = document.getElementById('emoji-rain-container');
    if (emojiRainContainer) {
      emojiRainContainer.classList.add('paused');
    }
    if (rainToggleBtn) {
      rainToggleBtn.classList.add('is-paused');
      rainToggleBtn.setAttribute('title', 'Resume Rain');
      rainToggleBtn.setAttribute('aria-label', 'Resume falling rain');
      if (rainToggleText) rainToggleText.textContent = "Resume Rain";
      const iconBadge = rainToggleBtn.querySelector('.rain-icon-badge');
      if (iconBadge) {
        iconBadge.innerHTML = `<svg class="rain-svg-icon" viewBox="0 0 24 24" width="11" height="11" fill="#000000" aria-hidden="true" style="margin-left: 1px;"><path d="M8 5v14l11-7z"/></svg>`;
      }
    }
  }

  function resumeRain() {
    isRainPaused = false;
    if (rainContainer) {
      rainContainer.classList.remove('paused');
    }
    const emojiRainContainer = document.getElementById('emoji-rain-container');
    if (emojiRainContainer) {
      emojiRainContainer.classList.remove('paused');
    }
    if (rainToggleBtn) {
      rainToggleBtn.classList.remove('is-paused');
      rainToggleBtn.setAttribute('title', 'Freeze Rain');
      rainToggleBtn.setAttribute('aria-label', 'Freeze falling rain');
      if (rainToggleText) rainToggleText.textContent = "Freeze Rain";
      const iconBadge = rainToggleBtn.querySelector('.rain-icon-badge');
      if (iconBadge) {
        iconBadge.innerHTML = `<svg class="rain-svg-icon" viewBox="0 0 24 24" width="11" height="11" fill="#000000" aria-hidden="true" style="margin-left: 1px;"><path d="M8 5v14l11-7z"/></svg>`;
      }
    }
  }

  function toggleRainManual() {
    if (isRainPaused) {
      resumeRain();
    } else {
      pauseRain();
    }
  }

  /* ==========================================================================
     3b. FALLING LOVE EMOJIS RAIN SYSTEM (Roses, Hearts & Love Icons)
     ========================================================================== */
  function initEmojiRain() {
    const container = document.getElementById('emoji-rain-container');
    if (!container) return;

    if (cfg.enableFallingEmojis === false) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = '';

    const emojis = (cfg.fallingEmojis && cfg.fallingEmojis.length > 0)
      ? cfg.fallingEmojis
      : ['🌹', '💖',  '🌷', '💓',  '💐', '🤍', '💗', '🌺', '💘', '💝'];

    const count = cfg.fallingEmojiCount || 24;

    for (let i = 0; i < count; i++) {
      const emojiEl = document.createElement('span');
      emojiEl.className = 'falling-emoji';

      const emojiChar = emojis[i % emojis.length];
      emojiEl.textContent = emojiChar;
      emojiEl.setAttribute('aria-hidden', 'true');

      // Random horizontal spread across screen (2% to 98%)
      const leftPct = (i / count) * 94 + (Math.random() * 5) + 1;
      emojiEl.style.left = `${leftPct.toFixed(2)}%`;

      // Varied duration (12s to 20s) for a gentle, romantic pace
      const duration = 12 + Math.random() * 8;
      emojiEl.style.animationDuration = `${duration.toFixed(2)}s`;

      // Negative delay pre-populates the screen immediately on page load
      const delay = -(Math.random() * duration);
      emojiEl.style.animationDelay = `${delay.toFixed(2)}s`;

      // Varied size: clamp between 18px and 30px
      const isLarge = emojiChar === '🌹' || emojiChar === '💐' || emojiChar === '💌' || emojiChar === '💝';
      const fontSize = isLarge ? (22 + Math.random() * 8) : (18 + Math.random() * 8);
      emojiEl.style.fontSize = `${fontSize.toFixed(1)}px`;

      // Random scale (0.85 to 1.15)
      const scale = 0.85 + Math.random() * 0.3;
      emojiEl.style.setProperty('--scale', scale.toFixed(2));

      // Random sway amounts (left and right drift)
      const sway1 = (Math.random() - 0.5) * 50;
      const sway2 = (Math.random() - 0.5) * 60;
      const sway3 = (Math.random() - 0.5) * 50;
      const sway4 = (Math.random() - 0.5) * 40;
      emojiEl.style.setProperty('--sway-1', `${sway1.toFixed(1)}px`);
      emojiEl.style.setProperty('--sway-2', `${sway2.toFixed(1)}px`);
      emojiEl.style.setProperty('--sway-3', `${sway3.toFixed(1)}px`);
      emojiEl.style.setProperty('--sway-4', `${sway4.toFixed(1)}px`);

      // Random rotation
      const rotStart = (Math.random() - 0.5) * 40;
      const rotMid1 = rotStart + (Math.random() - 0.5) * 70;
      const rotMid2 = rotMid1 + (Math.random() - 0.5) * 70;
      const rotMid3 = rotMid2 + (Math.random() - 0.5) * 70;
      const rotEnd = rotMid3 + (Math.random() - 0.5) * 70;
      emojiEl.style.setProperty('--rot-start', `${rotStart.toFixed(1)}deg`);
      emojiEl.style.setProperty('--rot-mid1', `${rotMid1.toFixed(1)}deg`);
      emojiEl.style.setProperty('--rot-mid2', `${rotMid2.toFixed(1)}deg`);
      emojiEl.style.setProperty('--rot-mid3', `${rotMid3.toFixed(1)}deg`);
      emojiEl.style.setProperty('--rot-end', `${rotEnd.toFixed(1)}deg`);

      // Gentle max opacity (0.7 to 0.95)
      const maxOpacity = 0.7 + Math.random() * 0.25;
      emojiEl.style.setProperty('--max-opacity', maxOpacity.toFixed(2));

      // Interactive: clicking an emoji triggers a delightful little heart burst!
      emojiEl.addEventListener('click', (e) => {
        e.stopPropagation();
        createHeartBurst(e.clientX, e.clientY);
        emojiEl.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        emojiEl.style.transform = 'scale(1.8)';
        emojiEl.style.opacity = '0';
        setTimeout(() => {
          emojiEl.style.transition = '';
        }, 400);
      });

      container.appendChild(emojiEl);
    }
  }

  /* ==========================================================================
     TYPEWRITER ANIMATION FOR "TREASURED MOMENTS" SECTION TITLE
     ========================================================================== */
  function initTypewriter() {
    const el = document.getElementById('gallery-typewriter-text');
    if (!el) return;

    // Romantic words that alternate dynamically with "Treasured ..."
    const words = [
      'Moments',
      'Memories',
      'Smiles',
      'Adventures',
      'Laughter',
      'Sweet Days',
      'Love Stories',
      'Chapters',
      'Keepsakes',
      'Forever'
    ];

    let wordIdx = 0;
    let charIdx = words[0].length;
    let isDeleting = true;

    // Let user see initial word "Moments" before the first backspace
    setTimeout(() => {
      tick();
    }, 2400);

    function tick() {
      const currentWord = words[wordIdx];

      if (isDeleting) {
        charIdx--;
        el.textContent = currentWord.substring(0, charIdx);

        if (charIdx <= 0) {
          isDeleting = false;
          wordIdx = (wordIdx + 1) % words.length;
          // Short pause after backspacing before typing next word
          setTimeout(tick, 380);
          return;
        }

        // Fast deleting speed with subtle human variation
        const deleteSpeed = 40 + Math.random() * 25;
        setTimeout(tick, deleteSpeed);
      } else {
        charIdx++;
        el.textContent = currentWord.substring(0, charIdx);

        if (charIdx === currentWord.length) {
          isDeleting = true;
          // Hold completed word for user to appreciate
          setTimeout(tick, 2200);
          return;
        }

        // Natural typing rhythm
        const typeSpeed = 75 + Math.random() * 55;
        setTimeout(tick, typeSpeed);
      }
    }
  }

  /* ==========================================================================
     4. GALLERY COMPONENT & REALTIME PERSISTENT STORAGE (IndexedDB)
     ========================================================================== */
  const GALLERY_DB_NAME = 'RomanceGalleryDB';
  const GALLERY_DB_VERSION = 1;
  const GALLERY_STORE_NAME = 'custom_gallery_media';
  const DELETED_DEFAULT_KEYS_STORAGE = 'lyka_deleted_default_gallery_media_v1';

  let galleryMedia = [];
  let currentActiveFilter = 'all';
  let galleryItemPendingDelete = null;
  let galleryCardPendingDeleteEl = null;

  function openGalleryDB() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      const request = indexedDB.open(GALLERY_DB_NAME, GALLERY_DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(GALLERY_STORE_NAME)) {
          db.createObjectStore(GALLERY_STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => {
        console.warn('Gallery IndexedDB open error:', e);
        resolve(null);
      };
    });
  }

  function saveGalleryItemToIndexedDB(item, fileBlob) {
    return new Promise(async (resolve) => {
      try {
        const db = await openGalleryDB();
        if (!db) { resolve(false); return; }
        const tx = db.transaction(GALLERY_STORE_NAME, 'readwrite');
        const store = tx.objectStore(GALLERY_STORE_NAME);

        let safeBlob = fileBlob;
        try {
          if (fileBlob && typeof fileBlob.slice === 'function') {
            safeBlob = fileBlob.slice(0, fileBlob.size, fileBlob.type);
          }
        } catch (err) {
          safeBlob = fileBlob;
        }

        const record = {
          id: item.id,
          type: item.type,
          caption: item.caption,
          poster: item.poster || '',
          filename: item.filename || '',
          blob: safeBlob,
          timestamp: item.timestamp || Date.now()
        };

        const req = store.put(record);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        console.warn('Gallery IndexedDB save error:', e);
        resolve(false);
      }
    });
  }

  async function loadGalleryItemsFromIndexedDB() {
    try {
      const db = await openGalleryDB();
      if (!db) return [];
      return new Promise((resolve) => {
        const tx = db.transaction(GALLERY_STORE_NAME, 'readonly');
        const store = tx.objectStore(GALLERY_STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const results = req.result || [];
          // Sort newest uploads first
          results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

          const items = results.map(item => {
            let src = '';
            if (item.blob) {
              try {
                src = URL.createObjectURL(item.blob);
              } catch (e) {
                console.warn('Blob URL create error:', e);
              }
            }
            return {
              id: item.id,
              type: item.type,
              caption: item.caption,
              src: src,
              poster: item.poster || '',
              filename: item.filename,
              isUserUploaded: true,
              timestamp: item.timestamp || Date.now(),
              blob: item.blob
            };
          }).filter(it => Boolean(it.src));
          resolve(items);
        };
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      console.warn('Gallery IndexedDB load error:', e);
      return [];
    }
  }

  function deleteGalleryItemFromIndexedDB(id) {
    return new Promise(async (resolve) => {
      try {
        const db = await openGalleryDB();
        if (!db) { resolve(false); return; }
        const tx = db.transaction(GALLERY_STORE_NAME, 'readwrite');
        const store = tx.objectStore(GALLERY_STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        console.warn('Gallery IndexedDB delete error:', e);
        resolve(false);
      }
    });
  }

  function getDeletedDefaultKeys() {
    try {
      const raw = localStorage.getItem(DELETED_DEFAULT_KEYS_STORAGE);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (e) {
      return new Set();
    }
  }

  function addDeletedDefaultKey(key) {
    try {
      const set = getDeletedDefaultKeys();
      set.add(key);
      localStorage.setItem(DELETED_DEFAULT_KEYS_STORAGE, JSON.stringify(Array.from(set)));
    } catch (e) {}
  }

  function createGalleryCard(item, index) {
    const galleryItem = document.createElement('article');
    galleryItem.className = 'gallery-item';
    galleryItem.setAttribute('data-type', item.type);
    galleryItem.setAttribute('data-id', item.id || item.src);
    galleryItem.setAttribute('tabindex', '0');
    galleryItem.setAttribute('role', 'button');
    galleryItem.setAttribute('aria-label', `View ${item.caption || (item.type === 'video' ? 'video' : 'photo') + ' ' + (index + 1)}`);

    const thumbWrapper = document.createElement('div');
    thumbWrapper.className = 'gallery-media-thumb';

    if (item.type === 'video') {
      if (item.poster) {
        const posterImg = document.createElement('img');
        posterImg.src = item.poster;
        posterImg.alt = item.caption || `Video ${index + 1}`;
        posterImg.loading = 'lazy';
        thumbWrapper.appendChild(posterImg);
      } else {
        const vid = document.createElement('video');
        vid.src = item.src + '#t=0.001';
        vid.muted = true;
        vid.playsInline = true;
        vid.preload = 'metadata';
        thumbWrapper.appendChild(vid);
      }

      const badge = document.createElement('div');
      badge.className = 'gallery-badge';
      badge.innerHTML = `<span>▶</span> Video`;
      thumbWrapper.appendChild(badge);
    } else {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.caption || `Photo ${index + 1}`;
      img.loading = 'lazy';
      thumbWrapper.appendChild(img);

      const badge = document.createElement('div');
      badge.className = 'gallery-badge';
      badge.innerHTML = `<span>📷</span> Photo`;
      thumbWrapper.appendChild(badge);
    }

    const infoBox = document.createElement('div');
    infoBox.className = 'gallery-info';

    const caption = document.createElement('div');
    caption.className = 'gallery-caption';
    caption.textContent = item.caption || `Cherished Moment #${index + 1}`;

    const meta = document.createElement('div');
    meta.className = 'gallery-meta';
    meta.innerHTML = `<span class="gallery-action-hint">Enlarge ↗</span>`;

    infoBox.appendChild(caption);
    infoBox.appendChild(meta);

    galleryItem.appendChild(thumbWrapper);
    galleryItem.appendChild(infoBox);

    // Open Modal on click
    galleryItem.addEventListener('click', () => {
      const curIndex = galleryMedia.findIndex(m => (m.id && m.id === item.id) || m.src === item.src);
      openModal(curIndex >= 0 ? curIndex : index);
    });

    galleryItem.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const curIndex = galleryMedia.findIndex(m => (m.id && m.id === item.id) || m.src === item.src);
        openModal(curIndex >= 0 ? curIndex : index);
      }
    });

    return galleryItem;
  }

  function renderGalleryCards() {
    if (!galleryGrid) return;
    galleryGrid.innerHTML = '';

    galleryMedia.forEach((item, index) => {
      const card = createGalleryCard(item, index);
      if (currentActiveFilter !== 'all' && item.type !== currentActiveFilter) {
        card.style.display = 'none';
      }
      galleryGrid.appendChild(card);
    });
  }

  function applyGalleryFilter(filter) {
    if (!filter) return;
    currentActiveFilter = filter;
    filterBtns.forEach(b => {
      const f = b.getAttribute('data-filter');
      if (f) {
        if (f === filter) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      }
    });

    const items = galleryGrid ? galleryGrid.querySelectorAll('.gallery-item') : [];
    items.forEach(item => {
      if (filter === 'all' || item.getAttribute('data-type') === filter) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  }

  /* ==========================================================================
     AUTOMATIC ROMANTIC CAPTIONS LIBRARY (For uploaded photos & videos)
     ========================================================================== */
  const ROMANTIC_PHOTO_CAPTIONS = [
    "You make every ordinary moment feel extraordinary ✨",
    "My favorite view in the entire world will always be you 💖",
    "A sweet smile that brightens my whole universe 🌸",
    "Holding onto this precious memory forever and always 💕",
    "Every single second with you is a gift I cherish 🌷",
    "The prettiest, sweetest soul I have ever known ✨",
    "You and me, making memories to last a lifetime 💫",
    "My heart will always find its way back to you 💖",
    "Forever grateful for your laughter, warmth, and love ☀️",
    "Can't help but fall in love with you all over again 💕",
    "A beautiful glimpse of our endless love story 📸",
    "With you, every day feels like a dream come true ✨",
    "The reason behind all my happiest, warmest smiles 🌹",
    "Simply irreplaceable and precious in every single way 💖",
    "Capturing the magic and pure bliss of us together 💫",
    "Forever my favorite person, today and for all days 🌸",
    "In your gentle eyes, I found my peaceful home 💖",
    "Proof that fairy tales and true love really do exist ✨",
    "Endlessly proud of you, endlessly in love with you 💕",
    "My sweetest forever, yesterday, today, and always 🍯💖",
    "A radiant snapshot of pure happiness with you 🌟",
    "No camera could ever fully capture how gorgeous you are 🌷",
    "Your happiness is the most beautiful thing in the world 💖",
    "Just looking at you makes my day instantly brighter ✨",
    "The love of my life, captured in a perfect frame 📸💕"
  ];

  const ROMANTIC_VIDEO_CAPTIONS = [
    "A moving memory full of genuine joy and laughter 🎥✨",
    "Reliving our sweetest smiles and candid giggles over and over 💖",
    "Every heartbeat, every smile, forever saved in my heart 💫",
    "A priceless, heartwarming glimpse of our happiest days 🌸",
    "My heart skips a beat every time I watch this video 💕",
    "Forever replaying this precious moment together ✨",
    "The sweetest moving frames in our forever love story 🎬💖",
    "Pure joy, warmth, and laughter captured in motion 🌷",
    "Unforgettable memories that continue to light up my world 🌟",
    "Nothing brings me deeper peace than your bright laughter 💖",
    "Forever my absolute favorite video clip in the world 🎥💕",
    "A little piece of heaven and happiness with you ✨",
    "Listening to your laugh is my favorite soundtrack in life 🎵💖",
    "Every frame proves how deeply blessed I am to have you 🌸",
    "Our candid love in real motion, treasured forever 🎬💫"
  ];

  let autoCaptionPhotoIdx = Math.floor(Math.random() * ROMANTIC_PHOTO_CAPTIONS.length);
  let autoCaptionVideoIdx = Math.floor(Math.random() * ROMANTIC_VIDEO_CAPTIONS.length);

  function getAutoRomanticCaption(type) {
    if (type === 'video') {
      const caption = ROMANTIC_VIDEO_CAPTIONS[autoCaptionVideoIdx % ROMANTIC_VIDEO_CAPTIONS.length];
      autoCaptionVideoIdx++;
      return caption;
    } else {
      const caption = ROMANTIC_PHOTO_CAPTIONS[autoCaptionPhotoIdx % ROMANTIC_PHOTO_CAPTIONS.length];
      autoCaptionPhotoIdx++;
      return caption;
    }
  }

  function generateVideoThumbnail(file) {
    return new Promise((resolve) => {
      try {
        const vid = document.createElement('video');
        vid.muted = true;
        vid.playsInline = true;
        vid.preload = 'metadata';
        const url = URL.createObjectURL(file);
        vid.src = url;

        let resolved = false;
        const finish = (result) => {
          if (!resolved) {
            resolved = true;
            URL.revokeObjectURL(url);
            resolve(result);
          }
        };

        const timer = setTimeout(() => finish(null), 3000);

        vid.onloadeddata = () => {
          try {
            vid.currentTime = Math.min(0.5, (vid.duration || 1) / 2);
          } catch (e) {
            clearTimeout(timer);
            finish(null);
          }
        };

        vid.onseeked = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = vid.videoWidth || 360;
            canvas.height = vid.videoHeight || 640;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            clearTimeout(timer);
            finish(dataUrl);
          } catch (err) {
            clearTimeout(timer);
            finish(null);
          }
        };

        vid.onerror = () => {
          clearTimeout(timer);
          finish(null);
        };
      } catch (e) {
        resolve(null);
      }
    });
  }

  function setupGalleryUploads() {
    // Reset file input values before selection to ensure the 'change' event fires even when selecting the same file
    if (galleryPhotoInput) {
      galleryPhotoInput.addEventListener('click', () => {
        galleryPhotoInput.value = '';
      });
    }
    if (galleryVideoInput) {
      galleryVideoInput.addEventListener('click', () => {
        galleryVideoInput.value = '';
      });
    }

    // Keyboard accessibility for upload labels/buttons
    if (galleryUploadPhotoBtn && galleryPhotoInput) {
      galleryUploadPhotoBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          galleryPhotoInput.click();
        }
      });
    }
    if (galleryUploadVideoBtn && galleryVideoInput) {
      galleryUploadVideoBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          galleryVideoInput.click();
        }
      });
    }

    // 1. Photo input change handler (realtime on any device)
    if (galleryPhotoInput) {
      galleryPhotoInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newItems = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileUrl = URL.createObjectURL(file);
          const autoCaption = getAutoRomanticCaption('image');
          const newItem = {
            id: `user-gallery-photo-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
            type: 'image',
            src: fileUrl,
            caption: autoCaption,
            filename: file.name,
            isUserUploaded: true,
            timestamp: Date.now() + i,
            blob: file
          };

          // Add to front of array in realtime
          galleryMedia.unshift(newItem);
          newItems.push(newItem);

          // Persist in IndexedDB permanently (will not disappear on refresh)
          await saveGalleryItemToIndexedDB(newItem, file);
        }

        // Switch filter so new photo is immediately visible
        if (currentActiveFilter === 'video') {
          applyGalleryFilter('all');
        }

        // Re-render gallery grid in real time
        renderGalleryCards();

        const toastMsg = newItems.length > 1 
          ? `${newItems.length} Photos uploaded with automatic captions! 📸💖`
          : `Photo added: "${newItems[0].caption}" 📸💖`;
        showSiteToast(toastMsg, '📸');
        galleryPhotoInput.value = '';
      });
    }

    // 2. Video input change handler (realtime on any device)
    if (galleryVideoInput) {
      galleryVideoInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newItems = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileUrl = URL.createObjectURL(file);
          const autoCaption = getAutoRomanticCaption('video');
          const posterDataUrl = await generateVideoThumbnail(file);
          const newItem = {
            id: `user-gallery-video-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
            type: 'video',
            src: fileUrl,
            poster: posterDataUrl || '',
            caption: autoCaption,
            filename: file.name,
            isUserUploaded: true,
            timestamp: Date.now() + i,
            blob: file
          };

          // Add to front of array in realtime
          galleryMedia.unshift(newItem);
          newItems.push(newItem);

          // Persist in IndexedDB permanently (will not disappear on refresh)
          await saveGalleryItemToIndexedDB(newItem, file);
        }

        // Switch filter so new video is immediately visible
        if (currentActiveFilter === 'image') {
          applyGalleryFilter('all');
        }

        // Re-render gallery grid in real time
        renderGalleryCards();

        const toastMsg = newItems.length > 1
          ? `${newItems.length} Videos uploaded with automatic captions! 🎥💖`
          : `Video added: "${newItems[0].caption}" 🎥💖`;
        showSiteToast(toastMsg, '🎥');
        galleryVideoInput.value = '';
      });
    }
  }

  function openGalleryDeleteModal(item, cardEl = null) {
    if (!item) return;
    galleryItemPendingDelete = item;
    galleryCardPendingDeleteEl = cardEl;

    if (galleryDeleteTitle) {
      galleryDeleteTitle.textContent = `Delete ${item.type === 'video' ? 'Video' : 'Photo'}?`;
    }
    if (galleryDeleteDesc) {
      galleryDeleteDesc.textContent = `"${item.caption || (item.type === 'video' ? 'This video' : 'This photo')}" will be deleted permanently from your gallery and cannot be recovered.`;
    }

    if (galleryDeleteModal) {
      galleryDeleteModal.classList.add('active');
      galleryDeleteModal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeGalleryDeleteModal() {
    if (galleryDeleteModal) {
      galleryDeleteModal.classList.remove('active');
      galleryDeleteModal.setAttribute('aria-hidden', 'true');
    }
    galleryItemPendingDelete = null;
    galleryCardPendingDeleteEl = null;
  }

  async function executeGalleryDelete() {
    if (!galleryItemPendingDelete) return;

    const target = galleryItemPendingDelete;
    const isVideo = target.type === 'video';

    // 1. Delete permanently from browser persistence
    if (target.isUserUploaded) {
      await deleteGalleryItemFromIndexedDB(target.id);
    } else {
      addDeletedDefaultKey(target.src || target.id || target.caption);
    }

    // 2. Remove from active galleryMedia array
    const targetIdx = galleryMedia.findIndex(m => (m.id && m.id === target.id) || m.src === target.src);
    if (targetIdx >= 0) {
      galleryMedia.splice(targetIdx, 1);
    }

    // 3. Remove DOM element smoothly using safe attribute match (immune to special characters)
    const targetKey = String(target.id || target.src || '');
    const cardEl = galleryCardPendingDeleteEl || (galleryGrid ? Array.from(galleryGrid.querySelectorAll('.gallery-item')).find(el => el.getAttribute('data-id') === targetKey) : null);
    
    if (cardEl) {
      cardEl.style.transition = 'all 0.3s ease';
      cardEl.style.opacity = '0';
      cardEl.style.transform = 'scale(0.85)';
      setTimeout(() => {
        if (cardEl && cardEl.parentNode) cardEl.remove();
        renderGalleryCards();
      }, 300);
    } else {
      renderGalleryCards();
    }

    // 4. Update or close Lightbox modal if open
    if (mediaModal && mediaModal.classList.contains('active')) {
      if (galleryMedia.length === 0) {
        closeModal();
      } else {
        if (currentModalIndex >= galleryMedia.length) {
          currentModalIndex = Math.max(0, galleryMedia.length - 1);
        }
        updateModalContent();
      }
    }

    closeGalleryDeleteModal();
    showSiteToast(`${isVideo ? 'Video' : 'Photo'} deleted permanently 🗑️`, '🗑️');
  }

  function setupGalleryDeleteModal() {
    // 1. Delete button inside the enlarged media lightbox modal (user requested: only shows when photo/video is clicked)
    if (modalDeleteBtn) {
      modalDeleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!galleryMedia || galleryMedia.length === 0) return;
        const currentItem = galleryMedia[currentModalIndex];
        if (currentItem) {
          const targetKey = String(currentItem.id || currentItem.src || '');
          const cardEl = galleryGrid ? Array.from(galleryGrid.querySelectorAll('.gallery-item')).find(el => el.getAttribute('data-id') === targetKey) : null;
          openGalleryDeleteModal(currentItem, cardEl);
        }
      });
    }

    // 2. Confirm delete button inside the confirmation dialog
    if (galleryDeleteConfirmBtn) {
      galleryDeleteConfirmBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        executeGalleryDelete();
      });
    }

    // 3. Cancel delete button
    if (galleryDeleteCancelBtn) {
      galleryDeleteCancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeGalleryDeleteModal();
      });
    }

    // 4. Backdrop click on delete modal to dismiss
    if (galleryDeleteModal) {
      galleryDeleteModal.addEventListener('click', (e) => {
        if (e.target === galleryDeleteModal) {
          closeGalleryDeleteModal();
        }
      });
    }
  }

  function initGallery() {
    if (!galleryGrid) return;

    // 1. Initial synchronous paint from defaults minus deleted items (zero delay)
    const deletedKeys = getDeletedDefaultKeys();
    const defaultItems = (cfg.media || []).filter(item => {
      const key = item.src || item.id || item.caption;
      return !deletedKeys.has(key);
    });
    galleryMedia = [...defaultItems];
    renderGalleryCards();

    // 2. Setup Category Filters
    filterBtns.forEach(btn => {
      const filter = btn.getAttribute('data-filter');
      if (!filter) return;
      btn.addEventListener('click', () => {
        applyGalleryFilter(filter);
      });
    });

    // 3. Setup Realtime Uploads & Delete Modals
    setupGalleryUploads();
    setupGalleryDeleteModal();

    // 4. Asynchronously load user-uploaded media from IndexedDB & merge
    loadGalleryItemsFromIndexedDB().then(customItems => {
      if (customItems && customItems.length > 0) {
        galleryMedia = [...customItems, ...defaultItems];
        renderGalleryCards();
      }
    });
  }

  /* ==========================================================================
     5. LIGHTBOX MODAL (AUTO-PAUSES MUSIC ON VIDEOS, RESUMES ON CLOSE, RAIN CONTINUES)
     ========================================================================== */
  function openModal(index) {
    if (!galleryMedia || galleryMedia.length === 0) return;

    currentModalIndex = (index + galleryMedia.length) % galleryMedia.length;
    const item = galleryMedia[currentModalIndex];

    // Automatically pause background music if opening a video
    if (item && item.type === 'video') {
      if (isMusicPlaying) {
        wasMusicPlayingBeforeVideo = true;
        stopMusic();
      } else if (cfg.autoPlayOnFirstClick && !hasAutoStarted) {
        hasAutoStarted = true;
        wasMusicPlayingBeforeVideo = true;
      }
    } else {
      wasMusicPlayingBeforeVideo = false;
    }

    // Raining images KEEP RAINING in the background without pausing!
    updateModalContent();

    if (mediaModal) {
      mediaModal.classList.add('active');
      mediaModal.setAttribute('aria-hidden', 'false');
      if (modalCloseBtn) modalCloseBtn.focus();
    }
  }

  function closeModal() {
    if (mediaModal) {
      mediaModal.classList.remove('active');
      mediaModal.setAttribute('aria-hidden', 'true');
    }

    // Stop and unload any playing video inside modal
    if (modalMediaStage) {
      const playingVid = modalMediaStage.querySelector('video');
      if (playingVid) {
        playingVid.pause();
      }
      modalMediaStage.innerHTML = '';
    }

    // Automatically resume music if it was playing before viewing the video!
    if (wasMusicPlayingBeforeVideo) {
      wasMusicPlayingBeforeVideo = false;
      startMusic();
    }
  }

  function updateModalContent() {
    if (!modalMediaStage || !galleryMedia || galleryMedia.length === 0) return;

    if (currentModalIndex >= galleryMedia.length) {
      currentModalIndex = 0;
    }

    const item = galleryMedia[currentModalIndex];
    if (!item) return;

    modalMediaStage.innerHTML = '';

    if (item.type === 'video') {
      const vid = document.createElement('video');
      vid.src = item.src;
      if (item.poster) {
        vid.poster = item.poster;
      }
      vid.controls = true;
      vid.autoplay = true;
      vid.playsInline = true;
      vid.style.maxHeight = '65vh';
      vid.style.maxWidth = '100%';

      vid.addEventListener('play', () => {
        if (isMusicPlaying) {
          wasMusicPlayingBeforeVideo = true;
          stopMusic();
        }
      });

      vid.addEventListener('ended', () => {
        if (wasMusicPlayingBeforeVideo) {
          wasMusicPlayingBeforeVideo = false;
          startMusic();
        }
      });

      modalMediaStage.appendChild(vid);
    } else {
      if (wasMusicPlayingBeforeVideo) {
        wasMusicPlayingBeforeVideo = false;
        startMusic();
      }

      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.caption || "Enlarged photo";
      img.style.maxHeight = '65vh';
      img.style.maxWidth = '100%';
      modalMediaStage.appendChild(img);
    }

    if (modalCaption) {
      modalCaption.textContent = item.caption || `Moment #${currentModalIndex + 1}`;
    }
    if (modalCounter) {
      modalCounter.textContent = `${currentModalIndex + 1} of ${galleryMedia.length}`;
    }
  }

  function nextModalItem() {
    if (!galleryMedia || galleryMedia.length === 0) return;
    const prevItem = galleryMedia[currentModalIndex];
    if (prevItem && prevItem.type === 'video' && modalMediaStage) {
      const vid = modalMediaStage.querySelector('video');
      if (vid) vid.pause();
    }

    currentModalIndex = (currentModalIndex + 1) % galleryMedia.length;
    const nextItem = galleryMedia[currentModalIndex];

    if (nextItem && nextItem.type === 'video') {
      if (isMusicPlaying) {
        wasMusicPlayingBeforeVideo = true;
        stopMusic();
      }
    } else {
      if (wasMusicPlayingBeforeVideo) {
        wasMusicPlayingBeforeVideo = false;
        startMusic();
      }
    }

    updateModalContent();
  }

  function prevModalItem() {
    if (!galleryMedia || galleryMedia.length === 0) return;
    const prevItem = galleryMedia[currentModalIndex];
    if (prevItem && prevItem.type === 'video' && modalMediaStage) {
      const vid = modalMediaStage.querySelector('video');
      if (vid) vid.pause();
    }

    currentModalIndex = (currentModalIndex - 1 + galleryMedia.length) % galleryMedia.length;
    const nextItem = galleryMedia[currentModalIndex];

    if (nextItem && nextItem.type === 'video') {
      if (isMusicPlaying) {
        wasMusicPlayingBeforeVideo = true;
        stopMusic();
      }
    } else {
      if (wasMusicPlayingBeforeVideo) {
        wasMusicPlayingBeforeVideo = false;
        startMusic();
      }
    }

    updateModalContent();
  }

  /* ==========================================================================
     6. ENVELOPE SURPRISE & LOVE NOTES MODAL
     ========================================================================== */
  let lastNoteIndex = -1;
  let isEnvelopeOpened = false;

  function triggerEnvelopeOpening() {
    if (isEnvelopeOpened) return;
    isEnvelopeOpened = true;

    const envelopeContainer = document.getElementById('envelope-container');
    if (envelopeContainer) {
      envelopeContainer.classList.add('is-opening');

      const sealBtn = document.getElementById('envelope-seal-btn');
      if (sealBtn) {
        const rect = sealBtn.getBoundingClientRect();
        createHeartBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
      } else {
        createHeartBurst(window.innerWidth / 2, window.innerHeight / 2);
      }

      setTimeout(() => {
        envelopeContainer.classList.add('is-open');
      }, 550);
    }
  }

  function openNoteModal(mode = 'cumlaude') {
    isEnvelopeOpened = false;
    const envelopeContainer = document.getElementById('envelope-container');
    if (envelopeContainer) {
      envelopeContainer.classList.remove('is-opening', 'is-open');
    }

    if (mode === 'floating') {
      displayFloatingNote();
    } else {
      // Begin with note index 0 (Cum Laude inspirational quote)
      lastNoteIndex = 0;
      displayNoteAtIndex(0);
    }

    if (noteModal) {
      noteModal.classList.add('active');
      noteModal.setAttribute('aria-hidden', 'false');
    }
  }

  function displayFloatingNote() {
    if (!noteTextEl) return;
    const noteAuthorEl = document.getElementById('note-author');
    const noteGreetingEl = document.getElementById('note-greeting');

    const floatingCfg = (cfg && cfg.floatingNote) || {};
    const text = typeof floatingCfg === 'object' && floatingCfg.text 
      ? floatingCfg.text 
      : (typeof floatingCfg === 'string' ? floatingCfg : "dili manglood kay sayang ka gwapa HAHAHH");
    const greeting = (typeof floatingCfg === 'object' && floatingCfg.greeting) 
      ? floatingCfg.greeting 
      : "For Lyka 💖";
    const author = (typeof floatingCfg === 'object' && floatingCfg.author !== undefined) 
      ? floatingCfg.author 
      : "Forever yours 💖";

    noteTextEl.style.opacity = '0';
    if (noteAuthorEl) noteAuthorEl.style.opacity = '0';

    setTimeout(() => {
      noteTextEl.textContent = `"${text}"`;
      if (noteGreetingEl) {
        noteGreetingEl.textContent = greeting;
      }
      if (noteAuthorEl) {
        if (author) {
          noteAuthorEl.textContent = `— ${author}`;
          noteAuthorEl.style.display = 'block';
          noteAuthorEl.style.opacity = '1';
        } else {
          noteAuthorEl.style.display = 'none';
        }
      }
      noteTextEl.style.opacity = '1';
    }, 150);
  }

  function closeNoteModal() {
    if (noteModal) {
      noteModal.classList.remove('active');
      noteModal.setAttribute('aria-hidden', 'true');
    }
    const envelopeContainer = document.getElementById('envelope-container');
    if (envelopeContainer) {
      envelopeContainer.classList.remove('is-opening', 'is-open');
    }
    isEnvelopeOpened = false;
  }

  function displayNoteAtIndex(index) {
    if (!noteTextEl) return;
    const noteAuthorEl = document.getElementById('note-author');
    const noteGreetingEl = document.getElementById('note-greeting');

    const note = (cfg.notes && cfg.notes[index]) || cfg.notes[0];
    if (!note) return;

    noteTextEl.style.opacity = '0';
    if (noteAuthorEl) noteAuthorEl.style.opacity = '0';

    setTimeout(() => {
      if (typeof note === 'object' && note.text) {
        noteTextEl.textContent = `"${note.text}"`;
        if (noteAuthorEl) {
          noteAuthorEl.textContent = `— ${note.author}`;
          noteAuthorEl.style.display = 'block';
          noteAuthorEl.style.opacity = '1';
        }
        if (noteGreetingEl) noteGreetingEl.textContent = "Future cumlaude, lyka 💖";
      } else {
        noteTextEl.textContent = `"${note}"`;
        if (noteAuthorEl) {
          noteAuthorEl.textContent = `— Forever yours 💖`;
          noteAuthorEl.style.display = 'block';
          noteAuthorEl.style.opacity = '1';
        }
        if (noteGreetingEl) noteGreetingEl.textContent = "For My Love";
      }
      noteTextEl.style.opacity = '1';
    }, 150);
  }

  function displayRandomNote() {
    const notes = cfg.notes;
    if (!notes || notes.length === 0) return;

    let newIndex;
    if (notes.length === 1) {
      newIndex = 0;
    } else {
      do {
        newIndex = Math.floor(Math.random() * notes.length);
      } while (newIndex === lastNoteIndex);
    }

    lastNoteIndex = newIndex;
    displayNoteAtIndex(newIndex);
  }

  function createHeartBurst(x, y) {
    const emojis = ['💖', '💕', '✨', '🌹', '🤍', '🥰'];
    const count = 12;

    for (let i = 0; i < count; i++) {
      const heart = document.createElement('span');
      heart.className = 'heart-burst';
      heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      heart.style.left = `${x}px`;
      heart.style.top = `${y}px`;

      const angle = (i / count) * 2 * Math.PI;
      const distance = 80 + Math.random() * 80;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      heart.style.setProperty('--tx', `${tx}px`);
      heart.style.setProperty('--ty', `${ty}px`);

      document.body.appendChild(heart);

      setTimeout(() => {
        heart.remove();
      }, 1000);
    }
  }

  /* ==========================================================================
     7. ROMANTIC PLAYLIST & MUSIC SYSTEM (IndexedDB + Physical Audio Directory Sync)
     ========================================================================== */
  const MUSIC_DB_NAME = 'RomanceMusicDB';
  const MUSIC_DB_VERSION = 1;
  const MUSIC_STORE_NAME = 'uploaded_tracks';

  function openMusicDB() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      const request = indexedDB.open(MUSIC_DB_NAME, MUSIC_DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(MUSIC_STORE_NAME)) {
          db.createObjectStore(MUSIC_STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => {
        console.warn('IndexedDB open error:', e);
        resolve(null);
      };
    });
  }

  async function saveTrackToIndexedDB(trackMeta, audioBlob) {
    try {
      const db = await openMusicDB();
      if (!db) return;
      const tx = db.transaction(MUSIC_STORE_NAME, 'readwrite');
      const store = tx.objectStore(MUSIC_STORE_NAME);
      store.put({
        id: trackMeta.id,
        title: trackMeta.title,
        artist: trackMeta.artist,
        filename: trackMeta.filename,
        cover: trackMeta.cover,
        blob: audioBlob,
        timestamp: Date.now()
      });
    } catch (e) {
      console.warn('IndexedDB save error:', e);
    }
  }

  async function loadTracksFromIndexedDB() {
    try {
      const db = await openMusicDB();
      if (!db) return [];
      return new Promise((resolve) => {
        const tx = db.transaction(MUSIC_STORE_NAME, 'readonly');
        const store = tx.objectStore(MUSIC_STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const results = req.result || [];
          const tracks = results.map(item => {
            let src = `assets/audio/${encodeURIComponent(item.filename || item.title + '.mp3')}`;
            if (item.blob) {
              src = URL.createObjectURL(item.blob);
            }
            return {
              id: item.id,
              title: item.title,
              artist: item.artist,
              src: src,
              cover: item.cover,
              filename: item.filename,
              isUserUploaded: true
            };
          });
          resolve(tracks);
        };
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      console.warn('IndexedDB load error:', e);
      return [];
    }
  }

  async function clearOldUploadedSoundtracks() {
    try {
      const db = await openMusicDB();
      if (db && db.objectStoreNames.contains(MUSIC_STORE_NAME)) {
        const tx = db.transaction(MUSIC_STORE_NAME, 'readwrite');
        const store = tx.objectStore(MUSIC_STORE_NAME);
        store.clear();
      }
    } catch (e) {
      console.warn("Could not clear old uploaded tracks from IndexedDB:", e);
    }

    // Clean up localStorage if it pointed to a blob URL, old uploaded track, or nonexistent src
    try {
      const savedSrc = localStorage.getItem('love_surprise_track_src');
      const savedId = localStorage.getItem('love_surprise_track_id');
      const isCustomBlob = savedSrc && (savedSrc.startsWith('blob:') || savedSrc.includes('user-track-'));
      const isCustomId = savedId && savedId.startsWith('user-track-');
      const isValidSrc = playlist.some(t => t.src === savedSrc);

      if (isCustomBlob || isCustomId || (savedSrc && !isValidSrc)) {
        console.log("[Soundtrack] Purging old uploaded track pointer in storage, resetting to default track");
        localStorage.removeItem('love_surprise_track_src');
        localStorage.removeItem('love_surprise_track_id');
        localStorage.removeItem('love_surprise_track_title');
        localStorage.setItem('love_surprise_track_index', '0');
        localStorage.setItem('love_surprise_track_time', '0');
      }
    } catch (e) {}
  }

  function seekToSavedTime() {
    if (isPlaybackPositionRestored || targetSavedTime <= 0) {
      isPlaybackPositionRestored = true;
      return;
    }
    if (audioPlayer && !isNaN(audioPlayer.duration) && audioPlayer.duration > 0) {
      // Ensure target time does not overshoot track end to prevent false 'ended' triggers
      const safeTime = Math.min(targetSavedTime, Math.max(0, audioPlayer.duration - 2));
      try {
        audioPlayer.currentTime = safeTime;
        isPlaybackPositionRestored = true;
        console.log(`[Soundtrack] Resumed exact position: ${safeTime.toFixed(1)}s / ${audioPlayer.duration.toFixed(1)}s`);
      } catch (e) {
        console.warn("[Soundtrack] Seeking deferred until ready:", e);
      }
    }
  }

  function savePlaybackState() {
    try {
      const track = playlist[currentTrackIndex];
      if (track) {
        localStorage.setItem('love_surprise_track_id', track.id || '');
        localStorage.setItem('love_surprise_track_src', track.src || '');
        localStorage.setItem('love_surprise_track_title', track.title || '');
      }
      localStorage.setItem('love_surprise_track_index', String(currentTrackIndex));

      // CRITICAL: Only save currentTime if it has already been restored and is valid!
      // This prevents saving 0 on initial page load / refresh!
      if (audioPlayer && isPlaybackPositionRestored && !isNaN(audioPlayer.currentTime) && audioPlayer.currentTime > 0) {
        localStorage.setItem('love_surprise_track_time', String(audioPlayer.currentTime));
      }
      localStorage.setItem('love_surprise_music_was_playing', isMusicPlaying ? 'true' : 'false');
    } catch (e) {
      console.warn("Could not save playback state:", e);
    }
  }

  function initMusic() {
    if (!cfg.enableMusic) {
      if (musicToggleBtn) musicToggleBtn.style.display = 'none';
      if (musicPlaylistTriggerBtn) musicPlaylistTriggerBtn.style.display = 'none';
      return;
    }

    // Clean up any old user-uploaded songs from IndexedDB & storage so only the 12 assets/audio songs play
    clearOldUploadedSoundtracks();

    // 1. Restore saved track and playback time from localStorage across refreshes
    let savedTrackIndex = -1;
    targetSavedTime = 0;
    let shouldAutoResume = true;

    try {
      const savedSrc = localStorage.getItem('love_surprise_track_src');
      const savedTitle = localStorage.getItem('love_surprise_track_title');
      const savedId = localStorage.getItem('love_surprise_track_id');
      const savedIdx = parseInt(localStorage.getItem('love_surprise_track_index'), 10);
      const rawTime = parseFloat(localStorage.getItem('love_surprise_track_time') || '0');
      const rawPlaying = localStorage.getItem('love_surprise_music_was_playing');

      if (!isNaN(rawTime) && rawTime > 0) {
        targetSavedTime = rawTime;
        isPlaybackPositionRestored = false;
      } else {
        isPlaybackPositionRestored = true;
      }

      if (rawPlaying === 'false') {
        shouldAutoResume = false;
      }

      // Match by exact ID, title, or src so reordering tracks or additions don't break
      if (savedId) {
        const foundId = playlist.findIndex(t => t.id === savedId);
        if (foundId !== -1) savedTrackIndex = foundId;
      }
      if (savedTrackIndex === -1 && savedTitle) {
        const foundTitle = playlist.findIndex(t => t.title === savedTitle);
        if (foundTitle !== -1) savedTrackIndex = foundTitle;
      }
      if (savedTrackIndex === -1 && savedSrc) {
        const foundSrc = playlist.findIndex(t => t.src === savedSrc);
        if (foundSrc !== -1) savedTrackIndex = foundSrc;
      }
      if (savedTrackIndex === -1 && !isNaN(savedIdx) && savedIdx >= 0 && savedIdx < playlist.length) {
        savedTrackIndex = savedIdx;
      }
    } catch (e) {
      console.warn("Could not read saved playback state:", e);
      isPlaybackPositionRestored = true;
    }

    if (savedTrackIndex !== -1) {
      currentTrackIndex = savedTrackIndex;
    } else {
      currentTrackIndex = cfg.defaultTrackIndex || 0;
    }

    const initialTrack = playlist[currentTrackIndex] || playlist[0];

    // Prepare HTML5 Audio
    audioPlayer = new Audio();
    audioPlayer.src = encodeURI(initialTrack.src);
    audioPlayer.loop = false; // Strictly false so track finishes naturally
    audioPlayer.volume = 0.65;
    audioPlayer.preload = 'auto';

    // Show initial saved elapsed time in UI immediately (don't show 0:00 when reloading mid-song!)
    if (targetSavedTime > 0 && playerTimeCurrent) {
      playerTimeCurrent.textContent = formatTime(targetSavedTime);
    }

    // Attach seeking listener on every media event where currentTime can be safely applied
    ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'playing'].forEach(evt => {
      audioPlayer.addEventListener(evt, () => {
        if (!isPlaybackPositionRestored) {
          seekToSavedTime();
        }
      });
    });

    audioPlayer.addEventListener('loadedmetadata', () => {
      if (playerTimeDuration && !isNaN(audioPlayer.duration)) {
        playerTimeDuration.textContent = formatTime(audioPlayer.duration);
      }
      if (playerProgressBar && targetSavedTime > 0 && audioPlayer.duration > 0) {
        playerProgressBar.value = (targetSavedTime / audioPlayer.duration) * 100;
      }
    });

    // Auto-advance to next song ONLY when track genuinely finishes playing naturally to the very end
    audioPlayer.addEventListener('ended', () => {
      // Guard against false triggers during seek, init, or reload
      if (!isPlaybackPositionRestored) return;
      if (!audioPlayer.duration || audioPlayer.duration < 5) return;
      if (audioPlayer.currentTime < audioPlayer.duration - 2) return;

      console.log(`[Soundtrack] Track finished naturally: ${playlist[currentTrackIndex]?.title}. Advancing to next song...`);
      targetSavedTime = 0;
      try {
        localStorage.setItem('love_surprise_track_time', '0');
      } catch (e) {}
      nextTrack();
    });

    // Time update for timeline scrubber & elapsed counters + progress persistence
    audioPlayer.addEventListener('timeupdate', () => {
      if (!audioPlayer || isNaN(audioPlayer.duration)) return;

      // If position has not yet been applied, seek first and do NOT overwrite storage with 0!
      if (!isPlaybackPositionRestored) {
        seekToSavedTime();
        return;
      }

      const cur = audioPlayer.currentTime;
      const dur = audioPlayer.duration;
      if (playerTimeCurrent) playerTimeCurrent.textContent = formatTime(cur);
      if (playerTimeDuration) playerTimeDuration.textContent = formatTime(dur);
      if (playerProgressBar && !isSeeking) {
        playerProgressBar.value = (cur / dur) * 100;
      }

      // Persist current playback time periodically ONLY after restored and while actively playing
      if (cur > 0 && isMusicPlaying) {
        try {
          localStorage.setItem('love_surprise_track_time', String(cur));
          localStorage.setItem('love_surprise_track_index', String(currentTrackIndex));
          const t = playlist[currentTrackIndex];
          if (t) {
            localStorage.setItem('love_surprise_track_id', t.id || '');
            localStorage.setItem('love_surprise_track_src', t.src || '');
            localStorage.setItem('love_surprise_track_title', t.title || '');
          }
        } catch (e) {}
      }
    });

    // Fallback to Web Audio synthesized ambient melody if audio file errors
    audioPlayer.addEventListener('error', (e) => {
      console.warn("Audio file could not be loaded, activating romantic ambient synth fallback", e);
      if (isMusicPlaying) {
        startSynthRomanticMelody();
      }
    });

    // Populate the song cards in the playlist modal
    renderPlaylistCards();

    // Update UI elements with initial track info
    updateTrackUI();

    // Save state on tab close or navigation
    window.addEventListener('beforeunload', savePlaybackState);
    window.addEventListener('pagehide', savePlaybackState);

    // Floating autoplay resume prompt
    let autoplayPromptEl = null;

    function showAutoplayResumePrompt() {
      if (document.getElementById('music-resume-prompt')) return;
      autoplayPromptEl = document.createElement('div');
      autoplayPromptEl.id = 'music-resume-prompt';
      autoplayPromptEl.className = 'music-resume-floating-prompt';
      autoplayPromptEl.setAttribute('role', 'button');
      autoplayPromptEl.setAttribute('tabindex', '0');
      autoplayPromptEl.setAttribute('aria-label', 'Click anywhere to resume music');
      autoplayPromptEl.innerHTML = `
        <div class="music-resume-prompt-content">
          <span class="music-resume-prompt-icon">🎵</span>
          <span class="music-resume-prompt-text">Tap anywhere to resume music</span>
          <span class="music-resume-prompt-sparkle">💖</span>
        </div>
      `;
      autoplayPromptEl.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerAutoplayOnGesture({ isTrusted: true });
      });
      document.body.appendChild(autoplayPromptEl);
      requestAnimationFrame(() => {
        if (autoplayPromptEl) autoplayPromptEl.classList.add('active');
      });
    }

    function removeAutoplayResumePrompt() {
      const prompt = document.getElementById('music-resume-prompt');
      if (prompt) {
        prompt.classList.remove('active');
        setTimeout(() => {
          if (prompt.parentNode) prompt.parentNode.removeChild(prompt);
        }, 350);
      }
    }

    function triggerAutoplayOnGesture(e) {
      // Discard synthetic or programmatic events (e.g., window.scrollTo)
      if (e && !e.isTrusted) return;
      if (isPuzzleLocked()) return;

      const isVideoTarget = e && e.target && e.target.closest && (
        e.target.closest('[data-type="video"]') || 
        e.target.closest('video')
      );
      if (isVideoTarget) {
        hasAutoStarted = true;
        wasMusicPlayingBeforeVideo = true;
      } else {
        seekToSavedTime();
        startMusic();
      }

      removeAutoplayResumePrompt();
      ['pointerdown', 'click', 'touchstart', 'keydown'].forEach(evt => {
        window.removeEventListener(evt, triggerAutoplayOnGesture, { capture: true });
      });
    }

    // AUTOMATIC PLAY ON OPEN / RESUME:
    // Only play once the entire website is open (never during the puzzle/question screen)
    const isPuzzleLocked = () => {
      return !document.documentElement.classList.contains('puzzle-already-unlocked') &&
             sessionStorage.getItem('love_surprise_puzzle_unlocked') !== 'true' &&
             !!document.getElementById('puzzle-overlay');
    };

    const tryAutoPlayImmediately = () => {
      if (audioPlayer && audioPlayer.src && shouldAutoResume) {
        // Attempt immediate playback
        const playPromise = audioPlayer.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            isMusicPlaying = true;
            hasAutoStarted = true;
            seekToSavedTime();
            savePlaybackState();
            updateTrackUI();
            removeAutoplayResumePrompt();
          }).catch((err) => {
            console.log("Browser policy held auto-resume until user interaction:", err);
            // Crucial: keep playing intention so UI and localStorage reflect active music
            isMusicPlaying = true;
            updateTrackUI();

            // Setup listeners for genuine user interactions ONLY (no scroll!)
            ['pointerdown', 'click', 'touchstart', 'keydown'].forEach(evt => {
              window.addEventListener(evt, triggerAutoplayOnGesture, { capture: true, once: true });
            });

            // Show floating interactive pill prompt
            showAutoplayResumePrompt();
          });
        }
      }
    };

    // Listen for when she answers "Yes" to officially open the entire website
    window.addEventListener('puzzleUnlockedStartMusic', () => {
      seekToSavedTime();
      startMusic();
    }, { once: true });

    if (isPuzzleLocked()) {
      // Do not play music during the puzzle or question modal
      console.log("Puzzle active: waiting for entire website to unlock before playing music");
    } else {
      tryAutoPlayImmediately();
    }
  }

  function formatTime(sec) {
    if (isNaN(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const SVG_ICONS = {
    play: `<svg class="ui-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`,
    pause: `<svg class="ui-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
  };

  function updatePlaylistCount() {
    if (bannerTrackCount) {
      bannerTrackCount.textContent = `${playlist.length} Songs`;
    }
  }

  function renderPlaylistCards() {
    if (!playlistTracksContainer) return;
    playlistTracksContainer.innerHTML = '';
    updatePlaylistCount();

    playlist.forEach((track, index) => {
      const card = document.createElement('div');
      card.className = `track-item-card ${index === currentTrackIndex ? 'is-active' : ''}`;
      card.setAttribute('data-index', index);
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Play ${track.title} by ${track.artist}`);

      card.innerHTML = `
        <div class="track-thumb-wrapper">
          <img src="${track.cover}" alt="${track.title} cover" class="track-thumb-img" loading="lazy">
          <div class="track-play-overlay">
            <span class="track-play-icon">${(index === currentTrackIndex && isMusicPlaying) ? SVG_ICONS.pause : SVG_ICONS.play}</span>
          </div>
        </div>
        <div class="track-info">
          <div class="track-title">${track.title}</div>
          <div class="track-artist">${track.artist}</div>
        </div>
        <div class="track-equalizer-badge" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
      `;

      const playThisTrack = (e) => {
        e.stopPropagation();
        if (index === currentTrackIndex) {
          toggleMusic();
        } else {
          selectTrack(index, true);
        }
      };

      card.addEventListener('click', playThisTrack);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          playThisTrack(e);
        }
      });

      playlistTracksContainer.appendChild(card);
    });
  }

  function selectTrack(index, autoPlay = true) {
    if (!playlist || playlist.length === 0) return;
    currentTrackIndex = (index + playlist.length) % playlist.length;
    const track = playlist[currentTrackIndex];

    stopSynthRomanticMelody();

    // Since the user explicitly selected a new track, reset saved time
    isPlaybackPositionRestored = true;
    targetSavedTime = 0;
    try {
      localStorage.setItem('love_surprise_track_time', '0');
    } catch (e) {}

    if (audioPlayer) {
      // Pause current track
      audioPlayer.pause();

      // Encode URI to handle spaces and accents seamlessly
      audioPlayer.src = encodeURI(track.src);
      audioPlayer.currentTime = 0;
      savePlaybackState();

      updateTrackUI();

      if (autoPlay || isMusicPlaying) {
        isMusicPlaying = true;

        const playPromise = audioPlayer.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            isMusicPlaying = true;
            savePlaybackState();
            updateTrackUI();
          }).catch((err) => {
            console.warn("Autoplay waiting for buffer, queuing canplay event:", err);
            const onCanPlay = () => {
              if (isMusicPlaying) {
                audioPlayer.play().then(() => {
                  savePlaybackState();
                  updateTrackUI();
                }).catch((e) => {
                  console.warn("Audio playback error, using synth fallback:", e);
                  startSynthRomanticMelody();
                });
              }
            };
            audioPlayer.addEventListener('canplay', onCanPlay, { once: true });
          });
        }
      }
    } else {
      updateTrackUI();
    }
  }

  function nextTrack() {
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    selectTrack(nextIndex, true);
  }

  function prevTrack() {
    if (audioPlayer && audioPlayer.currentTime > 3) {
      audioPlayer.currentTime = 0;
      targetSavedTime = 0;
      try {
        localStorage.setItem('love_surprise_track_time', '0');
      } catch (e) {}
      savePlaybackState();
    } else {
      const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
      selectTrack(prevIndex, true);
    }
  }

  function startMusic() {
    isMusicPlaying = true;
    hasAutoStarted = true;

    // Apply saved seek position if resuming on reload
    if (!isPlaybackPositionRestored) {
      seekToSavedTime();
    }

    savePlaybackState();

    // Attempt HTML5 audio play
    if (audioPlayer && audioPlayer.src) {
      const playPromise = audioPlayer.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          if (!isPlaybackPositionRestored) {
            seekToSavedTime();
          }
          savePlaybackState();
          updateTrackUI();
        }).catch((err) => {
          console.warn("HTML5 audio playback restricted or missing, falling back to Web Audio synth:", err);
          startSynthRomanticMelody();
        });
      }
    } else {
      startSynthRomanticMelody();
    }

    updateTrackUI();
  }

  function stopMusic() {
    isMusicPlaying = false;
    savePlaybackState();
    if (audioPlayer) {
      audioPlayer.pause();
    }
    stopSynthRomanticMelody();
    updateTrackUI();
  }

  function toggleMusic() {
    if (isMusicPlaying) {
      stopMusic();
    } else {
      startMusic();
    }
  }

  function updateTrackUI() {
    const track = playlist[currentTrackIndex] || playlist[0];
    if (!track) return;

    // Top-bar Quick Toggle text & visualizer
    if (musicToggleBtn) {
      const text = musicToggleBtn.querySelector('.music-toggle-text');
      if (isMusicPlaying) {
        musicToggleBtn.classList.add('is-playing');
        if (text) text.textContent = "Music: Playing";
      } else {
        musicToggleBtn.classList.remove('is-playing');
        if (text) text.textContent = "Music: Off";
      }
    }

    // Top-bar playlist trigger info
    if (topBarTrackTitle) {
      topBarTrackTitle.textContent = track.title;
    }
    if (topBarCoverImg) {
      topBarCoverImg.src = track.cover;
    }

    // Modal Banner updates
    if (bannerCover) {
      bannerCover.src = track.cover;
      if (isMusicPlaying) {
        bannerCover.classList.add('is-spinning');
      } else {
        bannerCover.classList.remove('is-spinning');
      }
    }
    if (bannerTitle) bannerTitle.textContent = track.title;
    if (bannerArtist) bannerArtist.textContent = track.artist;
    if (bannerStatusPill) {
      bannerStatusPill.textContent = isMusicPlaying ? "Now Playing" : "Paused";
      bannerStatusPill.style.color = isMusicPlaying ? "var(--accent-gold)" : "var(--text-muted)";
    }

    // Modal Play/Pause button icon with clean SVG
    if (ctrlPlayPauseBtn) {
      ctrlPlayPauseBtn.innerHTML = isMusicPlaying ? SVG_ICONS.pause : SVG_ICONS.play;
      ctrlPlayPauseBtn.setAttribute('aria-label', isMusicPlaying ? "Pause music" : "Play music");
    }

    // Update track cards in modal
    if (playlistTracksContainer) {
      const cards = playlistTracksContainer.querySelectorAll('.track-item-card');
      cards.forEach((card, idx) => {
        const playIcon = card.querySelector('.track-play-icon');
        if (idx === currentTrackIndex) {
          card.classList.add('is-active');
          if (isMusicPlaying) {
            card.classList.add('is-playing-now');
            if (playIcon) playIcon.innerHTML = SVG_ICONS.pause;
          } else {
            card.classList.remove('is-playing-now');
            if (playIcon) playIcon.innerHTML = SVG_ICONS.play;
          }
        } else {
          card.classList.remove('is-active', 'is-playing-now');
          if (playIcon) playIcon.innerHTML = SVG_ICONS.play;
        }
      });
    }
  }

  function openPlaylistModal() {
    if (playlistModal) {
      playlistModal.classList.add('active');
      playlistModal.setAttribute('aria-hidden', 'false');
      if (musicPlaylistTriggerBtn) {
        musicPlaylistTriggerBtn.classList.add('is-active');
      }
      if (playlistCloseBtn) playlistCloseBtn.focus();
    }
  }

  function closePlaylistModal() {
    if (playlistModal) {
      playlistModal.classList.remove('active');
      playlistModal.setAttribute('aria-hidden', 'true');
      if (musicPlaylistTriggerBtn) {
        musicPlaylistTriggerBtn.classList.remove('is-active');
      }
    }
  }

  function togglePlaylistModal() {
    if (playlistModal && playlistModal.classList.contains('active')) {
      closePlaylistModal();
    } else {
      openPlaylistModal();
    }
  }

  // Generative Romantic Ambient Chords (Harp/Piano Tone using Web Audio API Fallback)
  function startSynthRomanticMelody() {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!synthAudioCtx) {
        synthAudioCtx = new AudioCtxClass();
      }
      if (synthAudioCtx.state === 'suspended') {
        synthAudioCtx.resume();
      }

      // Romantic chord progression frequencies: Cmaj9 -> Am9 -> Fmaj7 -> Gsus4
      const chords = [
        [261.63, 329.63, 392.00, 493.88, 587.33], // C, E, G, B, D
        [220.00, 261.63, 329.63, 392.00, 493.88], // A, C, E, G, B
        [174.61, 261.63, 329.63, 349.23, 440.00], // F, C, E, F, A
        [196.00, 261.63, 293.66, 392.00, 523.25]  // G, C, D, G, C
      ];

      let chordIdx = 0;
      let noteIdx = 0;

      function playNote() {
        if (!isMusicPlaying || !synthAudioCtx) return;

        const currentChord = chords[chordIdx];
        const freq = currentChord[noteIdx];

        const osc = synthAudioCtx.createOscillator();
        const gain = synthAudioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, synthAudioCtx.currentTime);

        // Soft gentle bell/piano envelope
        gain.gain.setValueAtTime(0, synthAudioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, synthAudioCtx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, synthAudioCtx.currentTime + 2.2);

        osc.connect(gain);
        gain.connect(synthAudioCtx.destination);

        osc.start();
        osc.stop(synthAudioCtx.currentTime + 2.3);

        noteIdx++;
        if (noteIdx >= currentChord.length) {
          noteIdx = 0;
          chordIdx = (chordIdx + 1) % chords.length;
        }
      }

      playNote();
      synthInterval = setInterval(playNote, 600);
    } catch (e) {
      console.warn("Web Audio ambient synth unavailable:", e);
    }
  }

  function stopSynthRomanticMelody() {
    if (synthInterval) {
      clearInterval(synthInterval);
      synthInterval = null;
    }
  }

  /* ==========================================================================
     8. GLOBAL EVENT LISTENERS & SHORTCUTS
     ========================================================================== */
  function setupEventListeners() {
    // Rain Toggle Button
    if (rainToggleBtn) {
      rainToggleBtn.addEventListener('click', toggleRainManual);
    }

    // Music Quick Toggle Button
    if (musicToggleBtn) {
      musicToggleBtn.addEventListener('click', toggleMusic);
    }

    // Music Playlist Trigger Button & Close
    if (musicPlaylistTriggerBtn) {
      musicPlaylistTriggerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlaylistModal();
      });
    }
    if (playlistCloseBtn) {
      playlistCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closePlaylistModal();
      });
    }
    if (playlistModal) {
      playlistModal.addEventListener('click', (e) => {
        if (e.target === playlistModal) {
          closePlaylistModal();
        }
      });
    }

    // Close playlist on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && playlistModal && playlistModal.classList.contains('active')) {
        closePlaylistModal();
      }
    });

    // Realtime Music Upload Button & File Input
    if (uploadMusicBtn && musicUploadInput) {
      uploadMusicBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        musicUploadInput.click();
      });

      musicUploadInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        try {
          const fileUrl = URL.createObjectURL(file);
          const rawName = file.name.replace(/\.[^/.]+$/, "");
          let trackTitle = rawName;
          let trackArtist = "Uploaded Song";

          if (rawName.includes(" - ")) {
            const parts = rawName.split(" - ");
            trackArtist = parts[0].trim();
            trackTitle = parts.slice(1).join(" - ").trim();
          }

          // Cycle through romantic photo collection for artwork
          const covers = [
            'assets/images/image1.jpg',
            'assets/images/image2.jpg',
            'assets/images/image3.jpg',
            'assets/images/image4.jpg',
            'assets/images/image5.jpg',
            'assets/images/image6.jpg'
          ];
          const assignedCover = covers[playlist.length % covers.length];

          const newTrack = {
            id: `user-track-${Date.now()}`,
            title: trackTitle,
            artist: trackArtist,
            src: fileUrl,
            cover: assignedCover,
            filename: file.name,
            isUserUploaded: true
          };

          // 1. Instantly add to playlist and start playing with zero latency
          playlist.unshift(newTrack);
          updatePlaylistCount();
          renderPlaylistCards();
          selectTrack(0, true);

          // 2. Persist in browser IndexedDB immediately (dili mawala bisag i-refresh)
          saveTrackToIndexedDB(newTrack, file);
        } catch (err) {
          console.error("Error loading uploaded audio:", err);
        }

        // Reset input to allow selecting the same file again if desired
        musicUploadInput.value = '';
      });
    }

    // Playlist Controls (Prev, Next, Play/Pause)
    if (ctrlPrevBtn) {
      ctrlPrevBtn.addEventListener('click', prevTrack);
    }
    if (ctrlPlayPauseBtn) {
      ctrlPlayPauseBtn.addEventListener('click', toggleMusic);
    }
    if (ctrlNextBtn) {
      ctrlNextBtn.addEventListener('click', nextTrack);
    }

    // Volume Slider
    if (playerVolumeSlider) {
      playerVolumeSlider.addEventListener('input', (e) => {
        const vol = parseFloat(e.target.value);
        if (audioPlayer) audioPlayer.volume = vol;
      });
    }

    // Progress Bar Scrubber
    if (playerProgressBar) {
      playerProgressBar.addEventListener('mousedown', () => { isSeeking = true; });
      playerProgressBar.addEventListener('touchstart', () => { isSeeking = true; });

      playerProgressBar.addEventListener('change', () => {
        if (audioPlayer && !isNaN(audioPlayer.duration)) {
          audioPlayer.currentTime = (playerProgressBar.value / 100) * audioPlayer.duration;
        }
        isSeeking = false;
      });

      playerProgressBar.addEventListener('mouseup', () => { isSeeking = false; });
      playerProgressBar.addEventListener('touchend', () => { isSeeking = false; });
    }

    // Lightbox Controls
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeModal);
    }
    if (modalPrevBtn) {
      modalPrevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        prevModalItem();
      });
    }
    if (modalNextBtn) {
      modalNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        nextModalItem();
      });
    }
    if (mediaModal) {
      mediaModal.addEventListener('click', (e) => {
        if (e.target === mediaModal) {
          closeModal();
        }
      });
    }

    // Love Notes Controls
    if (floatingNoteBtn) {
      floatingNoteBtn.addEventListener('click', () => openNoteModal('floating'));
    }
    const heroNoteBtn = document.getElementById('hero-note-btn');
    if (heroNoteBtn) {
      heroNoteBtn.addEventListener('click', () => openNoteModal('cumlaude'));
    }
    const envelopeSealBtn = document.getElementById('envelope-seal-btn');
    if (envelopeSealBtn) {
      envelopeSealBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerEnvelopeOpening();
      });
    }
    const envelopeOuter = document.getElementById('envelope-outer');
    if (envelopeOuter) {
      envelopeOuter.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerEnvelopeOpening();
      });
    }
    if (noteNextBtn) {
      noteNextBtn.addEventListener('click', () => {
        displayRandomNote();
        const rect = noteNextBtn.getBoundingClientRect();
        createHeartBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
      });
    }
    if (noteCloseBtn) {
      noteCloseBtn.addEventListener('click', closeNoteModal);
    }
    if (noteModal) {
      noteModal.addEventListener('click', (e) => {
        if (e.target === noteModal) {
          closeNoteModal();
        }
      });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Escape key closes modals
      if (e.key === 'Escape') {
        if (galleryDeleteModal && galleryDeleteModal.classList.contains('active')) {
          closeGalleryDeleteModal();
          return;
        }
        if (mediaModal && mediaModal.classList.contains('active')) {
          closeModal();
        }
        if (noteModal && noteModal.classList.contains('active')) {
          closeNoteModal();
        }
        if (playlistModal && playlistModal.classList.contains('active')) {
          closePlaylistModal();
        }
        if (typeof closePhotoboothModal === 'function') {
          closePhotoboothModal();
        }
      }

      // Soft Refresh (F5 / Ctrl+R / Cmd+R) — Refresh website smoothly while music keeps playing without interruption!
      const isRefreshKey = (e.key === 'F5') || 
                           ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r');
      if (isRefreshKey && !e.shiftKey) {
        e.preventDefault();
        performSoftRefresh();
        return;
      }

      // Arrow navigation in media lightbox
      if (mediaModal && mediaModal.classList.contains('active')) {
        if (e.key === 'ArrowRight') {
          nextModalItem();
        } else if (e.key === 'ArrowLeft') {
          prevModalItem();
        }
      }
    });

  /* ==========================================================================
     SOFT REFRESH (F5 / CTRL+R) — Refresh website without stopping music!
     ========================================================================== */
  function performSoftRefresh() {
    // 1. Keep audioPlayer playing uninterrupted!
    // 2. Re-trigger rain of falling emojis and memory polaroids
    initRain();
    initEmojiRain();

    // 3. Re-run live counter / clock
    initCounter();

    // 4. Smoothly scroll back to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 5. Shuffle and update love notes
    if (typeof displayRandomNote === 'function') {
      displayRandomNote();
    }

    // 6. Update track UI in case anything changed
    updateTrackUI();

    // 7. Show gorgeous floating feedback toast
    showSiteToast("Refreshed! Music uninterrupted 🎵💖", "✨");
  }

    // Prevent sticky active/focus states on buttons after mouse click or tap
    document.addEventListener('mouseup', (e) => {
      if (e.target && e.target.closest) {
        const btn = e.target.closest('button, .btn-primary, .btn-secondary, a.btn-primary');
        if (btn && typeof btn.blur === 'function') {
          btn.blur();
        }
      }
    });
  }

  /* ==========================================================================
     16. PHOTOBOOTH STUDIO & SNAPS HISTORY SYSTEM
     ========================================================================== */
  let closePhotoboothModal = null;

  function initPhotobooth() {
    // DOM Elements
    const openPboothBtn = document.getElementById('open-pbooth-btn');
    const pboothModal = document.getElementById('pbooth-modal');
    const pboothCloseBtn = document.getElementById('pbooth-close-btn');

    // Tab buttons & panels
    const tabBoothBtn = document.getElementById('tab-booth-btn');
    const tabHistoryBtn = document.getElementById('tab-history-btn');
    const panelBooth = document.getElementById('pbooth-panel-booth');
    const panelHistory = document.getElementById('pbooth-panel-history');
    const historyBadge = document.getElementById('pbooth-history-badge');

    // Options
    const layoutBtns = document.querySelectorAll('#pbooth-layout-select .pbooth-pill-btn');
    const frameThumbs = document.querySelectorAll('#pbooth-frames-list .pbooth-frame-thumb');

    // Template Picker Modal elements
    const chooseTemplateBtn = document.getElementById('pbooth-choose-template-btn');
    const activeTemplateBadge = document.getElementById('pbooth-active-template-badge');
    const templatesModal = document.getElementById('pbooth-templates-modal');
    const templatesCloseBtn = document.getElementById('pbooth-templates-close-btn');
    const templateChoiceCards = document.querySelectorAll('.template-choice-card');

    // 11 Aesthetic Templates dictionary (5 Reference Templates + 6 Original Frames)
    const frameNames = {
      snoopy: '🎀 Polaroid & Snoopy',
      retro: '🎱 Retro 70s/90s Pop',
      scrapbook: '📎 Memory Book',
      spiderman: '🕷️ Spider-Man Comic',
      gridticket: '🎟️ Pixtab Grid Ticket',
      spotify: '🎵 Spotify Strip',
      pixelbooth: '🎟️ Special Day Ticket',
      pink: '🌸 Sweet Pink',
      film: '🎞️ Vintage Film',
      korean: '✨ Korean Pastel',
      minimal: '🖤 Minimalist Chic'
    };

    // Viewfinder & capture elements
    const pboothVideo = document.getElementById('pbooth-video');
    const pboothFlash = document.getElementById('pbooth-flash');
    const pboothShotsTracker = document.getElementById('pbooth-shots-tracker');
    const pboothLiveStamp = document.getElementById('pbooth-live-stamp');
    const pboothStampText = document.getElementById('pbooth-stamp-text');
    const pboothCameraFallback = document.getElementById('pbooth-camera-fallback');
    const pboothStartCamBtn = document.getElementById('pbooth-start-cam-btn');
    const pboothUploadPhotoBtn = document.getElementById('pbooth-upload-photo-btn');
    const pboothFileInput = document.getElementById('pbooth-file-input');

    // Result stage
    const pboothViewfinder = document.getElementById('pbooth-viewfinder');
    const pboothResultStage = document.getElementById('pbooth-result-stage');
    const pboothResultImg = document.getElementById('pbooth-result-img');
    const pboothDownloadBtn = document.getElementById('pbooth-download-btn');
    const pboothRetakeBtn = document.getElementById('pbooth-retake-btn');
    const pboothSaveBtn = document.getElementById('pbooth-save-btn');
    const pboothSaveBtnText = document.getElementById('pbooth-save-btn-text');
    const pboothViewHistoryShortcutBtn = document.getElementById('pbooth-view-history-shortcut-btn');

    // Controls
    const pboothControlsBar = document.getElementById('pbooth-controls-bar');
    const pboothSnapBtn = document.getElementById('pbooth-snap-btn');
    const pboothResetShotsBtn = document.getElementById('pbooth-reset-shots-btn');
    const pboothMirrorBtn = document.getElementById('pbooth-mirror-btn');
    const pboothFlipCamBtn = document.getElementById('pbooth-flip-cam-btn');
    const pboothFloatingFlipBtn = document.getElementById('pbooth-floating-flip-btn');
    const pboothFlipBadge = document.getElementById('pbooth-flip-badge');

    // History elements
    const historyGrid = document.getElementById('pbooth-history-grid');
    const historyEmpty = document.getElementById('pbooth-history-empty');
    const emptyTakeBtn = document.getElementById('pbooth-empty-take-btn');

    // Delete modal elements
    const deleteModal = document.getElementById('pbooth-delete-modal');
    const deleteConfirmBtn = document.getElementById('pbooth-delete-confirm-btn');
    const deleteCancelBtn = document.getElementById('pbooth-delete-cancel-btn');

    // Toast elements
    const pboothToast = document.getElementById('pbooth-toast');
    const pboothToastIcon = document.getElementById('pbooth-toast-icon');
    const pboothToastMsg = document.getElementById('pbooth-toast-msg');

    // State
    let currentLayout = '3'; // Default: 3-Shot Strip
    let currentFrame = 'snoopy'; // Default: Polaroid OneStep2 & Snoopy Cupid!
    let isMirrored = true;
    let facingMode = 'user'; // 'user' or 'environment'
    let cameraStream = null;
    let isTakingPhoto = false;
    let capturedShots = []; // Holds synchronous in-memory canvas frames
    let lastRenderedDataUrl = null;
    let isCurrentSnapSaved = false;
    let itemToDeleteId = null;
    let toastTimeout = null;

    const STORAGE_KEY = 'lyka_photobooth_snaps_v1';

    // Helper: Show toast notification
    function showToast(msg, icon = '✨') {
      showSiteToast(msg, icon);
    }

    // Helper: Format real-time day and date
    function getUpdatedDateInfo() {
      const now = new Date();
      const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
      const monthDayYear = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      return {
        weekday: weekday,
        dateFormatted: monthDayYear,
        timeFormatted: timeStr,
        fullStamp: `${weekday}, ${monthDayYear}`,
        yearShort: String(now.getFullYear()).slice(-2),
        monthNum: String(now.getMonth() + 1).padStart(2, '0'),
        dayNum: String(now.getDate()).padStart(2, '0')
      };
    }

    // Update live stamp in viewfinder
    function updateLiveStamp() {
      if (pboothStampText) {
        const info = getUpdatedDateInfo();
        pboothStampText.textContent = info.fullStamp;
      }
    }
    updateLiveStamp();
    setInterval(updateLiveStamp, 30000);

    // Camera Management - Realtime Phone & Laptop Support
    async function startCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (pboothCameraFallback) pboothCameraFallback.style.display = 'flex';
        return;
      }

      try {
        stopCamera();
        let stream = null;

        // Try ideal HD resolution with facingMode
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: false
          });
        } catch (strictErr) {
          try {
            // Fallback for mobile devices
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: facingMode },
              audio: false
            });
          } catch (midErr) {
            // Minimal fallback constraint
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false
            });
          }
        }

        cameraStream = stream;

        if (pboothVideo) {
          pboothVideo.srcObject = cameraStream;
          pboothVideo.style.display = 'block';
          pboothVideo.classList.toggle('is-mirrored', isMirrored);
          try {
            await pboothVideo.play();
          } catch (playErr) {
            console.log('Video play pending user gesture:', playErr);
          }
        }
        if (pboothCameraFallback) {
          pboothCameraFallback.style.display = 'none';
        }
      } catch (err) {
        console.warn('Realtime camera access error or permission denied:', err);
        if (pboothCameraFallback) {
          pboothCameraFallback.style.display = 'flex';
        }
        if (pboothVideo) {
          pboothVideo.style.display = 'none';
        }
      }
    }

    function stopCamera() {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
      }
      if (pboothVideo) {
        pboothVideo.srcObject = null;
      }
    }

    // Toggle Camera Flip (Switch between Front / Back Camera for mobile & desktop)
    async function toggleCameraFlip() {
      facingMode = (facingMode === 'user') ? 'environment' : 'user';
      const isFront = (facingMode === 'user');

      // Rear/back camera should not be mirrored; front selfie camera defaults to mirrored
      isMirrored = isFront;
      if (pboothMirrorBtn) {
        pboothMirrorBtn.classList.toggle('active', isMirrored);
      }
      if (pboothVideo) {
        pboothVideo.classList.toggle('is-mirrored', isMirrored);
      }

      // Update badge and button indicators
      if (pboothFlipBadge) {
        pboothFlipBadge.textContent = isFront ? 'FRONT' : 'BACK';
      }
      if (pboothFlipCamBtn) {
        pboothFlipCamBtn.classList.toggle('active', !isFront);
      }

      showToast(isFront ? 'Front Selfie Camera Active 🤳' : 'Back / Rear Camera Active 📷', '🔄');
      await startCamera();
    }

    // Open & Close Modal
    function openModal() {
      if (!pboothModal) return;
      pboothModal.classList.add('active');
      pboothModal.setAttribute('aria-hidden', 'false');
      // Default to Booth tab with active strip
      switchTab('booth');
      showViewfinder();
      startCamera();
      capturedShots = [];
      updateShotsUI();
      loadHistoryFromStorage();
    }

    function closeModal() {
      if (!pboothModal) return;
      pboothModal.classList.remove('active');
      pboothModal.setAttribute('aria-hidden', 'true');
      stopCamera();
      closeDeleteModal();
      closeTemplatesModal();
    }
    closePhotoboothModal = closeModal;

    // Tab Switcher
    function switchTab(tabName) {
      if (tabName === 'booth') {
        tabBoothBtn.classList.add('active');
        tabHistoryBtn.classList.remove('active');
        panelBooth.classList.add('active');
        panelHistory.classList.remove('active');
        panelHistory.style.display = 'none';
        panelBooth.style.display = 'block';
        if (!cameraStream && pboothResultStage && pboothResultStage.style.display !== 'flex') {
          startCamera();
        }
      } else {
        tabHistoryBtn.classList.add('active');
        tabBoothBtn.classList.remove('active');
        panelHistory.classList.add('active');
        panelBooth.classList.remove('active');
        panelBooth.style.display = 'none';
        panelHistory.style.display = 'block';
        stopCamera();
        renderHistoryGrid();
      }
    }

    // Show Viewfinder vs Result
    function showViewfinder() {
      if (pboothViewfinder) pboothViewfinder.style.display = 'flex';
      if (pboothControlsBar) pboothControlsBar.style.display = 'flex';
      if (pboothResultStage) pboothResultStage.style.display = 'none';
      isTakingPhoto = false;
      if (pboothSnapBtn) pboothSnapBtn.disabled = false;
    }

    function showResult(dataUrl) {
      if (pboothViewfinder) pboothViewfinder.style.display = 'none';
      if (pboothControlsBar) pboothControlsBar.style.display = 'none';
      if (pboothResultStage) {
        pboothResultStage.style.display = 'flex';
        pboothResultImg.src = dataUrl;
      }
      lastRenderedDataUrl = dataUrl;
      isCurrentSnapSaved = false;

      // Reset save button state so user has choice to save or retake
      if (pboothSaveBtn) {
        pboothSaveBtn.classList.remove('is-saved');
        pboothSaveBtn.innerHTML = '<span>💾</span><span id="pbooth-save-btn-text">Save Photo</span>';
      }
    }

    // Layout Selector
    layoutBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        layoutBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentLayout = btn.dataset.layout || '3';
        capturedShots = [];
        updateShotsUI();
        const label = currentLayout === '1' ? '1 Shot' : (currentLayout === '3' ? '3-Shot Strip' : '4-Shot Grid');
        showToast(`Layout set to ${label} 📐`, '📸');
      });
    });

    // ------------------------------------------------------------------------
    // FRAME & TEMPLATE SELECTION SYSTEM (11 Aesthetic Choices: 5 Reference + 6 Original)
    // ------------------------------------------------------------------------
    function selectFrame(frameKey) {
      if (!frameNames[frameKey]) frameKey = 'snoopy';
      currentFrame = frameKey;

      // Update active template badge in toolbar
      if (activeTemplateBadge) {
        activeTemplateBadge.textContent = frameNames[frameKey];
      }

      // Default layout:
      // If user has explicitly selected 1-Shot keepsake, preserve it
      // Otherwise, Retro, Spider-Man, and Korean Life 4 Cuts default to 4-shot layout
      // All other templates default to 3-shot vertical strip
      if (currentLayout !== '1') {
        if (frameKey === 'retro' || frameKey === 'spiderman' || frameKey === 'korean') {
          currentLayout = '4';
        } else {
          currentLayout = '3';
        }
      }
      layoutBtns.forEach(b => b.classList.toggle('active', b.dataset.layout === currentLayout));

      // Reset shots and update UI tracker dots immediately
      capturedShots = [];
      updateShotsUI();

      // Sync active state on quick-switch pills
      frameThumbs.forEach(thumb => {
        thumb.classList.toggle('active', thumb.dataset.frame === frameKey);
      });

      // Sync active state on template modal showcase cards
      templateChoiceCards.forEach(card => {
        card.classList.toggle('active', card.dataset.frame === frameKey);
      });

      // Close template modal smoothly
      closeTemplatesModal();

      showToast(`Template: ${frameNames[frameKey]} Selected! ✨`, '🎨');
    }

    function openTemplatesModal() {
      if (templatesModal) {
        templatesModal.classList.add('active');
        templatesModal.setAttribute('aria-hidden', 'false');
      }
    }

    function closeTemplatesModal() {
      if (templatesModal) {
        templatesModal.classList.remove('active');
        templatesModal.setAttribute('aria-hidden', 'true');
      }
    }

    // Open Template Showcase Modal when clicking "Choose Frame / Template"
    if (chooseTemplateBtn) {
      chooseTemplateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openTemplatesModal();
      });
    }

    // Close Template Showcase Modal
    if (templatesCloseBtn) {
      templatesCloseBtn.addEventListener('click', closeTemplatesModal);
    }

    // Template Picker Modal Cards selection
    templateChoiceCards.forEach(card => {
      card.addEventListener('click', () => {
        const frameKey = card.dataset.frame;
        if (frameKey) selectFrame(frameKey);
      });
      const btn = card.querySelector('.btn-select-template');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const frameKey = card.dataset.frame;
          if (frameKey) selectFrame(frameKey);
        });
      }
    });

    // Quick-switch carousel thumbnail pills
    frameThumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const frameKey = thumb.dataset.frame;
        if (frameKey) selectFrame(frameKey);
      });
    });

    // Mirror Toggle
    if (pboothMirrorBtn) {
      pboothMirrorBtn.addEventListener('click', () => {
        isMirrored = !isMirrored;
        pboothMirrorBtn.classList.toggle('active', isMirrored);
        if (pboothVideo) {
          pboothVideo.classList.toggle('is-mirrored', isMirrored);
        }
        showToast(isMirrored ? 'Selfie mirror on' : 'Mirror off', '🪞');
      });
    }

    // Camera Fallback Buttons
    if (pboothStartCamBtn) {
      pboothStartCamBtn.addEventListener('click', startCamera);
    }
    if (pboothUploadPhotoBtn && pboothFileInput) {
      pboothUploadPhotoBtn.addEventListener('click', () => pboothFileInput.click());
    }

    // File Input Upload Fallback
    if (pboothFileInput) {
      pboothFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const shotsNeeded = currentLayout === '1' ? 1 : (currentLayout === '3' ? 3 : 4);
            const shots = [];
            for (let i = 0; i < shotsNeeded; i++) {
              shots.push(img);
            }
            const renderedDataUrl = renderPhotoboothCanvas(shots, currentFrame, currentLayout);
            showResult(renderedDataUrl);
            saveSnapToHistory(renderedDataUrl, currentFrame, currentLayout);
            showToast('Uploaded & styled in photobooth template! 💖', '✨');
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    // Update Shots Tracker UI & Button Label
    function updateShotsUI() {
      const totalNeeded = currentLayout === '1' ? 1 : (currentLayout === '3' ? 3 : 4);
      const shotsDone = capturedShots.length;

      // Update progress tracker dots (Clean, tiny dot indicators)
      if (pboothShotsTracker) {
        pboothShotsTracker.innerHTML = '';
        for (let i = 0; i < totalNeeded; i++) {
          const slot = document.createElement('div');
          slot.className = 'tracker-slot';
          if (i < shotsDone) {
            slot.classList.add('done');
            slot.textContent = '✓';
            slot.title = `Shot ${i + 1} Captured`;
          } else if (i === shotsDone) {
            slot.classList.add('active');
            slot.textContent = String(i + 1);
            slot.title = `Current: Shot ${i + 1}`;
          } else {
            slot.textContent = String(i + 1);
            slot.title = `Upcoming: Shot ${i + 1}`;
          }
          pboothShotsTracker.appendChild(slot);
        }
      }

      // Show/Hide Reset Button
      if (pboothResetShotsBtn) {
        pboothResetShotsBtn.style.display = shotsDone > 0 ? 'inline-flex' : 'none';
      }
    }

    // Reset shots in progress
    function resetShots() {
      capturedShots = [];
      updateShotsUI();
      showToast('Shots reset. Ready for Shot 1! 📸', '🔄');
    }

    if (pboothResetShotsBtn) {
      pboothResetShotsBtn.addEventListener('click', resetShots);
    }

    // Manual Shutter Snap Action (User clicks whenever ready!)
    function handleManualSnap() {
      if (isTakingPhoto) return;

      const totalNeeded = currentLayout === '1' ? 1 : (currentLayout === '3' ? 3 : 4);

      // Instantaneous shutter flash
      triggerFlash();

      // Grab current frame synchronously into memory canvas (Guarantees image 1, 2, 3 all render!)
      let shotCanvas;
      try {
        shotCanvas = grabVideoFrame();
      } catch (err) {
        console.error('Could not grab video frame:', err);
        showToast('Camera frame grab failed. Make sure camera is active! 📸', '⚠️');
        return;
      }
      capturedShots.push(shotCanvas);

      updateShotsUI();

      // If all shots for this layout have been snapped
      if (capturedShots.length >= totalNeeded) {
        isTakingPhoto = true;
        if (pboothSnapBtn) pboothSnapBtn.disabled = true;

        // Render composite photobooth strip with all shots!
        try {
          const finalDataUrl = renderPhotoboothCanvas(capturedShots, currentFrame, currentLayout);
          if (!finalDataUrl || finalDataUrl === 'data:,') {
            throw new Error('Canvas rendered empty data URL');
          }
          showResult(finalDataUrl);
          showToast('Picture ready! Save it or Take Again 📸✨', '💖');
        } catch (renderErr) {
          console.error('Photobooth canvas render error:', renderErr);
          showToast('Photo render failed! Please try again 🔄', '⚠️');
        }

        // Reset in-memory shots so user can retake or save as they choose
        capturedShots = [];
        updateShotsUI();
        isTakingPhoto = false;
        if (pboothSnapBtn) pboothSnapBtn.disabled = false;
      } else {
        const nextShotNum = capturedShots.length + 1;
        showToast(`Shot ${capturedShots.length} captured! Ready for shot ${nextShotNum} ✨`, '📸');
      }
    }

    // Shutter button click listener
    if (pboothSnapBtn) {
      pboothSnapBtn.addEventListener('click', handleManualSnap);
    }

    // Flash Trigger
    function triggerFlash() {
      if (!pboothFlash) return;
      pboothFlash.classList.add('flashing');
      setTimeout(() => {
        pboothFlash.classList.remove('flashing');
      }, 160);
    }

    // Synchronous Frame Grabber (Returns in-memory canvas element with known dimensions)
    function grabVideoFrame() {
      const snapCanvas = document.createElement('canvas');
      const vw = pboothVideo.videoWidth || 640;
      const vh = pboothVideo.videoHeight || 480;
      snapCanvas.width = vw;
      snapCanvas.height = vh;
      const ctx = snapCanvas.getContext('2d');

      if (isMirrored) {
        ctx.translate(vw, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(pboothVideo, 0, 0, vw, vh);

      return snapCanvas; // IN-MEMORY SYNCHRONOUS CANVAS ELEMENT!
    }

    // Draw image with object-fit: cover math (Handles canvas, image, bitmap safely)
    function drawImageCover(ctx, img, targetX, targetY, targetW, targetH) {
      if (!img) return;
      const imgW = img.naturalWidth || img.videoWidth || img.width || 0;
      const imgH = img.naturalHeight || img.videoHeight || img.height || 0;
      if (!imgW || !imgH) {
        try {
          ctx.drawImage(img, targetX, targetY, targetW, targetH);
        } catch (e) {
          console.warn('Could not draw image:', e);
        }
        return;
      }

      const imgRatio = imgW / imgH;
      const targetRatio = targetW / targetH;
      let sX, sY, sW, sH;

      if (imgRatio > targetRatio) {
        sH = imgH;
        sW = imgH * targetRatio;
        sX = (imgW - sW) / 2;
        sY = 0;
      } else {
        sW = imgW;
        sH = imgW / targetRatio;
        sX = 0;
        // Bias crop slightly toward top so the user's face and eyes remain centered!
        sY = Math.max(0, (imgH - sH) * 0.35);
      }

      ctx.drawImage(img, sX, sY, sW, sH, targetX, targetY, targetW, targetH);
    }

    // Canvas Photobooth Frame & Template Rendering
    // Canvas Photobooth Frame & Template Rendering (100% Replication of 5 User Reference Templates)
    function renderPhotoboothCanvas(shots, frameKey, layout) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const dateInfo = getUpdatedDateInfo();

      // Configure dimensions per layout:
      // 1-Shot Keepsake: 600x920 (perfect postcard/keepsake ratio, prevents face crop and keeps all captions visible)
      // 3-Shot Strip / 4-Shot Strip: 600x1760 (classic vertical photobooth strip)
      if (layout === '1') {
        canvas.width = 600;
        canvas.height = 920;
      } else {
        canvas.width = 600;
        canvas.height = 1760;
      }

      const W = canvas.width;
      const H = canvas.height;

      // Helper: Draw rounded rectangle path
      function roundRect(x, y, w, h, r) {
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, w, h, r);
        } else {
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + w - r, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + r);
          ctx.lineTo(x + w, y + h - r);
          ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          ctx.lineTo(x + r, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
          ctx.closePath();
        }
      }

      // Helper: Draw realistic vertical barcode
      function drawBarcode(bx, by, bw, bh, darkColor = '#000000', serialText = '') {
        ctx.fillStyle = darkColor;
        const barPatterns = [3, 1, 2, 1, 4, 1, 2, 3, 1, 1, 3, 2, 1, 4, 1, 2, 1, 3, 4, 2, 1, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3];
        let currX = bx;
        const totalUnits = barPatterns.reduce((a, b) => a + b, 0);
        const unitWidth = bw / (totalUnits * 1.4);

        ctx.beginPath();
        for (let i = 0; i < barPatterns.length; i++) {
          const barW = barPatterns[i] * unitWidth;
          if (i % 2 === 0) {
            ctx.fillRect(currX, by, barW, bh);
          }
          currX += barW + unitWidth;
          if (currX > bx + bw) break;
        }

        if (serialText) {
          ctx.fillStyle = darkColor;
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(serialText, bx + bw / 2, by + bh + 14);
        }
      }

      // Helper: Compute photo coordinates for 1, 3, or 4 shots
      function computePhotoRects(count, margin, startY, totalH, gap) {
        if (count === 1) {
          return [{ x: margin, y: startY, w: W - (margin * 2), h: totalH, idx: 0 }];
        }
        if (count === 4) {
          // Vertical 4-shot stack (exact match to Life 4 Cuts!)
          const pw = W - (margin * 2);
          const ph = Math.floor((totalH - (gap * 3)) / 4);
          return [
            { x: margin, y: startY, w: pw, h: ph, idx: 0 },
            { x: margin, y: startY + ph + gap, w: pw, h: ph, idx: 1 },
            { x: margin, y: startY + (ph + gap) * 2, w: pw, h: ph, idx: 2 },
            { x: margin, y: startY + (ph + gap) * 3, w: pw, h: ph, idx: 3 }
          ];
        }
        // count === 3 (vertical strip)
        const pw = W - (margin * 2);
        const ph = Math.floor((totalH - (gap * 2)) / 3);
        return [
          { x: margin, y: startY, w: pw, h: ph, idx: 0 },
          { x: margin, y: startY + ph + gap, w: pw, h: ph, idx: 1 },
          { x: margin, y: startY + (ph + gap) * 2, w: pw, h: ph, idx: 2 }
        ];
      }

      // ======================================================================
      // 1. TEMPLATE 1: 🎀 POLAROID ONESETP 2 & SNOOPY CUPID (`snoopy`)
      // ======================================================================
      if (frameKey === 'snoopy') {
        // Deep wine / burgundy background matching reference image 1
        ctx.fillStyle = '#5c1220';
        ctx.fillRect(0, 0, W, H);

        // Top Polaroid OneStep 2 Camera Graphic
        const camW = 440;
        const camH = 240;
        const camX = (W - camW) / 2;
        const camY = 16;

        // Camera shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        roundRect(camX - 2, camY + 6, camW + 4, camH, 20);
        ctx.fill();

        // Camera body (crisp off-white)
        ctx.fillStyle = '#f8f8fa';
        ctx.beginPath();
        roundRect(camX, camY, camW, camH, 20);
        ctx.fill();
        ctx.strokeStyle = '#e0dede';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dark grey camera eject mouth / slot at bottom
        ctx.fillStyle = '#222026';
        ctx.beginPath();
        roundRect(camX + 10, camY + camH - 42, camW - 20, 42, 6);
        ctx.fill();
        // Camera bottom slot groove
        ctx.fillStyle = '#111014';
        ctx.fillRect(camX + 30, camY + camH - 14, camW - 60, 6);

        // Main concentric circular lens at center
        const lensX = camX + (camW / 2);
        const lensY = camY + (camH / 2) - 10;
        const lensR = 64;

        ctx.fillStyle = '#111114';
        ctx.beginPath();
        ctx.arc(lensX, lensY, lensR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#26242c';
        ctx.beginPath();
        ctx.arc(lensX, lensY, lensR - 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#15131a';
        ctx.beginPath();
        ctx.arc(lensX, lensY, lensR - 22, 0, Math.PI * 2);
        ctx.fill();

        // Glass reflection arcs (cyan/amber flare)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(lensX - 6, lensY - 6, 22, 0.7 * Math.PI, 1.35 * Math.PI);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(80, 180, 255, 0.4)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(lensX + 6, lensY + 6, 26, -0.3 * Math.PI, 0.3 * Math.PI);
        ctx.stroke();

        // Flash unit window (top-left of camera)
        ctx.fillStyle = '#232029';
        ctx.beginPath();
        roundRect(camX + 28, camY + 28, 62, 54, 6);
        ctx.fill();
        ctx.fillStyle = '#edeaf2';
        for (let fx = camX + 32; fx < camX + 86; fx += 7) {
          ctx.fillRect(fx, camY + 32, 4, 46);
        }

        // Red circular shutter button
        ctx.fillStyle = '#e61e2a';
        ctx.beginPath();
        ctx.arc(camX + 46, camY + camH - 68, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c01520';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Square optical viewfinder (top-right of camera)
        ctx.fillStyle = '#232029';
        ctx.beginPath();
        roundRect(camX + camW - 84, camY + 28, 54, 52, 8);
        ctx.fill();
        ctx.fillStyle = '#5c95ff';
        ctx.beginPath();
        roundRect(camX + camW - 78, camY + 34, 42, 40, 5);
        ctx.fill();

        // Yellow toggle switch next to viewfinder
        ctx.fillStyle = '#f8b400';
        ctx.beginPath();
        roundRect(camX + camW - 118, camY + 70, 28, 14, 7);
        ctx.fill();

        // "OneStep 2" logo on camera
        ctx.fillStyle = '#111111';
        ctx.font = '900 16px Outfit, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('One', camX + camW - 36, camY + camH - 68);
        ctx.fillStyle = '#111111';
        ctx.font = '800 14px Outfit, sans-serif';
        ctx.fillText('Step', camX + camW - 36, camY + camH - 52);
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('2', camX + camW - 25, camY + camH - 52);

        // Tied Red Satin Ribbon Bow (Top-Left of Camera)
        ctx.font = '54px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎀', camX + 16, camY + 24);

        // Cherries sticker hanging top-left under camera
        ctx.font = '44px sans-serif';
        ctx.fillText('🍒', camX + 42, camY + camH + 42);

        // Deep red flower sticker on top-right under camera
        ctx.fillText('🌺', camX + camW - 30, camY + camH + 44);

        // Photo Cutouts (Dynamic: 1 keepsake photo or 3/4-strip photos)
        const isOneShot = layout === '1';
        const photoCount = isOneShot ? 1 : (layout === '4' ? 4 : 3);
        const margin = 55;
        const startY = camY + camH + (isOneShot ? 18 : 28);
        const totalH = isOneShot ? 400 : 1200;
        const gap = layout === '4' ? 18 : 24;
        const rects = computePhotoRects(photoCount, margin, startY, totalH, gap);

        rects.forEach((r, i) => {
          const img = shots[i] || shots[shots.length - 1] || shots[0];
          // White Polaroid frame border
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(r.x - 8, r.y - 8, r.w + 16, r.h + 16);

          // Dark maroon inner border
          ctx.strokeStyle = '#430913';
          ctx.lineWidth = 3;
          ctx.strokeRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2);

          // User live photo
          drawImageCover(ctx, img, r.x, r.y, r.w, r.h);
        });

        // Snoopy Cupid drawing bow & arrow with heart tip (Left edge of photo)
        const snoopyY = startY + (totalH / (isOneShot ? 2 : 3)) + (isOneShot ? 0 : 20);
        ctx.font = '48px sans-serif';
        ctx.fillText('🏹', margin - 28, snoopyY);
        ctx.fillText('❤️', margin - 6, snoopyY + 6);
        ctx.fillText('🐶', margin - 22, snoopyY - 32);

        // Stitched Apple slice sticker (Right edge of photo)
        ctx.fillText('🍎', W - margin + 30, snoopyY);

        if (!isOneShot) {
          // Stack of 3 Coffee Cups with splash droplets (Right edge between photo 2 & 3)
          const coffeeY = startY + (totalH * 2 / 3) + 20;
          ctx.fillText('☕', W - margin + 30, coffeeY);
          ctx.fillText('🤎', W - margin + 36, coffeeY + 36);
        }

        // Bottom Section: Teddy bear wearing party hat, present box, vintage ticket, cake slice
        const bottomY = startY + totalH + (isOneShot ? 16 : 20);

        // Teddy bear with party cone hat and gift box (bottom-left)
        ctx.font = isOneShot ? '46px sans-serif' : '56px sans-serif';
        ctx.fillText('🧸', margin + 14, bottomY + (isOneShot ? 58 : 70));
        ctx.font = isOneShot ? '30px sans-serif' : '36px sans-serif';
        ctx.fillText('🎉', margin + 10, bottomY + (isOneShot ? 18 : 20));
        ctx.fillText('🎁', margin - 24, bottomY + (isOneShot ? 68 : 80));

        // Vintage Admission Ticket: "good things are coming" (Built-in description + dynamic date)
        const ticketW = 240;
        const ticketH = isOneShot ? 72 : 80;
        const ticketX = (W - ticketW) / 2 + 10;
        const ticketY = bottomY + (isOneShot ? 6 : 8);

        ctx.fillStyle = '#f6f0e6';
        ctx.beginPath();
        roundRect(ticketX, ticketY, ticketW, ticketH, 8);
        ctx.fill();
        ctx.strokeStyle = '#c5283d';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Ticket serial rotated vertically on left
        ctx.save();
        ctx.translate(ticketX + 16, ticketY + 65);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = '#c5283d';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('48645235', 0, 0);
        ctx.restore();

        // Divider in ticket
        ctx.strokeStyle = '#c5283d';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ticketX + 26, ticketY + 6);
        ctx.lineTo(ticketX + 26, ticketY + ticketH - 6);
        ctx.stroke();

        // Ticket center text
        ctx.fillStyle = '#2b231d';
        ctx.font = 'bold 16px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('good things', ticketX + 36, ticketY + 28);
        ctx.fillText('are coming', ticketX + 36, ticketY + 47);

        // Real-time dynamic date stamp
        ctx.fillStyle = '#c5283d';
        ctx.font = '600 11px monospace';
        ctx.fillText(`${dateInfo.weekday.slice(0, 3).toUpperCase()} • ${dateInfo.dateFormatted.toUpperCase()}`, ticketX + 36, ticketY + 66);

        // Chocolate Cake Slice with cherry (bottom-right)
        ctx.font = isOneShot ? '44px sans-serif' : '52px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🍰', W - margin - 15, bottomY + (isOneShot ? 58 : 65));

      // ======================================================================
      // 2. TEMPLATE 2: 🎱 70s / 90s RETRO POP (`retro`)
      // ======================================================================
      } else if (frameKey === 'retro') {
        // Deep crimson / burgundy background
        ctx.fillStyle = '#6a121d';
        ctx.fillRect(0, 0, W, H);

        // Retro Checkerboard Columns on Left & Right Sides (Alternating Crimson and Yellow/Orange)
        const checkW = 20;
        const checkH = 20;
        const checkCols = 2;
        const checkColorA = '#6a121d';
        const checkColorB = '#f59e0b'; // Warm golden yellow/orange from reference 2

        for (let y = 0; y < H; y += checkH) {
          const row = Math.floor(y / checkH);
          for (let col = 0; col < checkCols; col++) {
            const isYellow = (row + col) % 2 === 0;
            ctx.fillStyle = isYellow ? checkColorB : checkColorA;
            // Left column
            ctx.fillRect(col * checkW, y, checkW, checkH);
            // Right column
            ctx.fillRect(W - (checkCols - col) * checkW, y, checkW, checkH);
          }
        }

        // Top Section: "70s" typography + 35mm Rangefinder Camera
        // "70s" white bubble font with red drop shadow
        ctx.fillStyle = '#3a070e';
        ctx.font = 'italic 900 48px "Arial Black", Impact, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('70s', 54, 76);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('70s', 50, 72);

        // Vintage 35mm Rangefinder Camera (silver and brown leatherette)
        const camW = 190;
        const camH = 95;
        const camX = W - camW - 50;
        const camY = 16;

        // Camera top chrome plate
        ctx.fillStyle = '#dcd8d8';
        ctx.beginPath();
        roundRect(camX, camY, camW, 30, 6);
        ctx.fill();

        // Camera brown leatherette body
        ctx.fillStyle = '#612a1d';
        ctx.beginPath();
        roundRect(camX, camY + 28, camW, camH - 28, 6);
        ctx.fill();

        // Round lens
        const camLensX = camX + (camW / 2);
        const camLensY = camY + (camH / 2) + 12;
        ctx.fillStyle = '#1a181c';
        ctx.beginPath();
        ctx.arc(camLensX, camLensY, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c4c0c0';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#0a080c';
        ctx.beginPath();
        ctx.arc(camLensX, camLensY, 20, 0, Math.PI * 2);
        ctx.fill();

        // Red dot logo (Leica style)
        ctx.fillStyle = '#e61e2a';
        ctx.beginPath();
        ctx.arc(camX + 38, camY + 44, 7, 0, Math.PI * 2);
        ctx.fill();

        // Rangefinder viewfinder window
        ctx.fillStyle = '#222';
        ctx.fillRect(camX + camW - 46, camY + 6, 26, 16);
        ctx.fillStyle = '#6db4ff';
        ctx.fillRect(camX + camW - 43, camY + 9, 20, 10);

        // Photo Slots (Dynamic: 1 keepsake photo, 3 or 4 strip photos)
        const isOneShot = layout === '1';
        const photoCount = isOneShot ? 1 : (layout === '3' ? 3 : 4);
        const margin = 56;
        const startY = camY + camH + (isOneShot ? 16 : 20);
        const totalH = isOneShot ? 430 : 1180;
        const gap = isOneShot ? 0 : (layout === '3' ? 24 : 18);
        const rects = computePhotoRects(photoCount, margin, startY, totalH, gap);

        rects.forEach((r, i) => {
          const img = shots[i] || shots[shots.length - 1] || shots[0];
          // Outer black/dark red border
          ctx.fillStyle = '#1c0407';
          ctx.fillRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8);
          drawImageCover(ctx, img, r.x, r.y, r.w, r.h);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(r.x, r.y, r.w, r.h);
        });

        // Pop stickers
        // Above photo 1: Movie clapperboard on left, Mario mushroom on right
        ctx.font = '36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎬', margin + 14, startY - 8);
        ctx.fillText('🍄', W - margin - 14, startY + 14);

        if (isOneShot) {
          // Billiard 7-ball (red) on left of photo
          const p1Mid = rects[0].y + (rects[0].h / 2);
          ctx.fillStyle = '#e61e2a';
          ctx.beginPath();
          ctx.arc(margin - 12, p1Mid - 20, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(margin - 12, p1Mid - 20, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#111111';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText('7', margin - 12, p1Mid - 15);

          // Billiard 8-ball (black) on right of photo
          ctx.fillStyle = '#111111';
          ctx.beginPath();
          ctx.arc(W - margin + 12, p1Mid - 20, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(W - margin + 12, p1Mid - 20, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#111111';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText('8', W - margin + 12, p1Mid - 15);

          ctx.font = '34px sans-serif';
          ctx.fillText('🎨', margin - 8, p1Mid + 60);
          ctx.fillText('👟', W - margin + 14, p1Mid + 60);
        } else {
          // Between photo 1 & 2: Billiard 7-ball (red) on left
          const p1Bottom = rects[0].y + rects[0].h;
          ctx.fillStyle = '#e61e2a';
          ctx.beginPath();
          ctx.arc(margin - 10, p1Bottom + 8, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(margin - 10, p1Bottom + 8, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#111111';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText('7', margin - 10, p1Bottom + 13);

          // Between photo 2 & 3: Billiard 8-ball (black) on right
          const p2Bottom = rects[1] ? (rects[1].y + rects[1].h) : (startY + 400);
          ctx.fillStyle = '#111111';
          ctx.beginPath();
          ctx.arc(W - margin + 12, p2Bottom + 6, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(W - margin + 12, p2Bottom + 6, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#111111';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText('8', W - margin + 12, p2Bottom + 11);

          // Paint palette on left of photo 3 & Blue Converse sneaker on right
          const p3Top = rects[2] ? rects[2].y : (startY + 600);
          ctx.font = '34px sans-serif';
          ctx.fillText('🎨', margin - 8, p3Top + 60);
          ctx.fillText('👟', W - margin + 14, p3Top + 60);

          // Between photo 3 & 4: Red movie ticket #7 on left & Vinyl record on right
          const p3Bottom = rects[2] ? (rects[2].y + rects[2].h) : (startY + 800);
          ctx.fillText('🎟️', margin - 6, p3Bottom + 16);
          ctx.fillText('💿', W - margin + 12, p3Bottom + 16);
        }

        // Bottom Section: Yellow "BOOM CHUTE" ticket, bold "RETRO 1990'S", and retro comic eyes
        const bottomY = startY + totalH + 16;

        // Yellow Concert Admission Ticket: "BOOM CHUTE"
        const ticketW = 240;
        const ticketH = 62;
        const ticketX = (W - ticketW) / 2;
        const ticketY = bottomY + 2;

        ctx.fillStyle = '#f5d547';
        ctx.beginPath();
        roundRect(ticketX, ticketY, ticketW, ticketH, 4);
        ctx.fill();
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#111';
        ctx.font = '900 15px "Arial Black", Impact, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('BOOM CHUTE', ticketX + 16, ticketY + 25);
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`ADMIT ONE • #${dateInfo.yearShort}${dateInfo.monthNum}`, ticketX + 16, ticketY + 42);
        ctx.fillText(`${dateInfo.weekday.toUpperCase()}, ${dateInfo.dateFormatted.toUpperCase()}`, ticketX + 16, ticketY + 54);

        // Right stub with barcode lines
        drawBarcode(ticketX + ticketW - 60, ticketY + 12, 48, 38, '#111');

        // Bold distressed white script "RETRO" with red outline & "1990'S"
        const retroY = bottomY + (isOneShot ? 95 : 115);
        ctx.font = 'italic 900 68px "Arial Black", Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#220306';
        ctx.fillText('RETRO', W / 2 + 3, retroY + 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('RETRO', W / 2, retroY);

        // White underline & 1990'S
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo((W / 2) - 140, retroY + 14);
        ctx.lineTo((W / 2) + 140, retroY + 14);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 17px "Arial Black", Impact, sans-serif';
        ctx.fillText("1990'S", W / 2, retroY + 34);

        // Two Retro Pop Comic Eyes looking down at very bottom
        ctx.font = '48px sans-serif';
        ctx.fillText('👁️', (W / 2) - 48, H - (isOneShot ? 30 : 36));
        ctx.fillText('👁️', (W / 2) + 48, H - (isOneShot ? 30 : 36));

      // ======================================================================
      // 3. TEMPLATE 3: 📎 MEMORY BOOK SCRAPBOOK (`scrapbook`)
      // ======================================================================
      } else if (frameKey === 'scrapbook') {
        // Textured memory photo street/campus background with soft vignette
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#2c3539');
        grad.addColorStop(0.3, '#3b444b');
        grad.addColorStop(0.7, '#2f353b');
        grad.addColorStop(1, '#1e2428');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Vignette overlay
        const vigGrad = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 900);
        vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
        vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, W, H);

        // Top Header: White paper note with colorful cut-out letters "memory book"
        const noteX = 40;
        const noteY = 32;
        const noteW = 200;
        const noteH = 110;

        // Paper drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        roundRect(noteX + 4, noteY + 4, noteW, noteH, 6);
        ctx.fill();

        // White paper note
        ctx.fillStyle = '#fdfbf7';
        ctx.beginPath();
        roundRect(noteX, noteY, noteW, noteH, 6);
        ctx.fill();

        // Chrome Safety Pin fastening the paper at top
        ctx.save();
        ctx.translate(noteX + noteW - 20, noteY - 10);
        ctx.rotate(-0.15);
        ctx.strokeStyle = '#c5c8cb';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(0, 20, 10, 36, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Pin head
        ctx.fillStyle = '#e4e7eb';
        ctx.beginPath();
        roundRect(-10, -4, 20, 20, 4);
        ctx.fill();
        ctx.restore();

        // Colorful cut-out letters spelling "memory book"
        const lettersRow1 = [
          { char: 'm', bg: '#ff758f', fg: '#fff' },
          { char: 'e', bg: '#ffd166', fg: '#222' },
          { char: 'm', bg: '#06d6a0', fg: '#fff' },
          { char: 'o', bg: '#118ab2', fg: '#fff' },
          { char: 'r', bg: '#f78c6b', fg: '#fff' },
          { char: 'y', bg: '#8338ec', fg: '#fff' }
        ];
        const lettersRow2 = [
          { char: 'b', bg: '#3a86ff', fg: '#fff' },
          { char: 'o', bg: '#ff006e', fg: '#fff' },
          { char: 'o', bg: '#ffbe0b', fg: '#222' },
          { char: 'k', bg: '#fb5607', fg: '#fff' }
        ];

        let lx = noteX + 16;
        lettersRow1.forEach(l => {
          ctx.fillStyle = l.bg;
          roundRect(lx, noteY + 22, 24, 28, 4);
          ctx.fill();
          ctx.fillStyle = l.fg;
          ctx.font = 'bold 18px "Arial Black", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(l.char, lx + 12, noteY + 43);
          lx += 28;
        });

        lx = noteX + 38;
        lettersRow2.forEach(l => {
          ctx.fillStyle = l.bg;
          roundRect(lx, noteY + 56, 26, 30, 4);
          ctx.fill();
          ctx.fillStyle = l.fg;
          ctx.font = 'bold 20px "Arial Black", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(l.char, lx + 13, noteY + 79);
          lx += 30;
        });

        // Gold star sparkles around title
        ctx.fillStyle = '#ffd166';
        ctx.font = '16px sans-serif';
        ctx.fillText('✨', noteX + 22, noteY + 18);
        ctx.fillText('⭐', noteX + noteW - 24, noteY + 80);

        // Polaroid Frames & Scrapbook layout (Dynamic: 1 keepsake photo or 3/4-strip photos)
        const isOneShot = layout === '1';
        const photoCount = isOneShot ? 1 : (layout === '4' ? 4 : 3);

        if (isOneShot) {
          // 1 Centered tilted Polaroid frame with deckle paper border
          const pw = 470;
          const ph = 390;
          const center = { x: W / 2, y: 395 };
          const img = shots[0];

          ctx.save();
          ctx.translate(center.x, center.y);
          ctx.rotate(0.015);

          // Torn deckle paper drop shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
          roundRect(-pw / 2 + 8, -ph / 2 + 10, pw, ph, 8);
          ctx.fill();

          // Cream watercolor paper frame
          ctx.fillStyle = '#faf8f2';
          roundRect(-pw / 2, -ph / 2, pw, ph, 8);
          ctx.fill();

          // Scalloped / deckle paper edge detail
          ctx.strokeStyle = '#e5dfd2';
          ctx.lineWidth = 3;
          roundRect(-pw / 2, -ph / 2, pw, ph, 8);
          ctx.stroke();

          // Photo cutout
          const innerW = pw - 44;
          const innerH = ph - 54;
          const innerX = -innerW / 2;
          const innerY = -innerH / 2 - 4;

          ctx.fillStyle = '#111';
          ctx.fillRect(innerX, innerY, innerW, innerH);
          drawImageCover(ctx, img, innerX, innerY, innerW, innerH);

          ctx.restore();

          // Embellishments positioned around single keepsake frame:
          ctx.font = '54px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🌺', 70, 280);

          ctx.fillStyle = '#d4af37';
          ctx.beginPath();
          roundRect(28, 430, 68, 85, 6);
          ctx.fill();
          ctx.strokeStyle = '#aa820a';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = '#222';
          ctx.fillRect(36, 438, 52, 69);
          ctx.font = '36px sans-serif';
          ctx.fillText('🎓', 62, 484);

          // Silver camera
          ctx.fillStyle = '#c5c8cb';
          ctx.beginPath();
          roundRect(W - 100, 260, 78, 115, 10);
          ctx.fill();
          ctx.strokeStyle = '#999e82';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#111';
          ctx.fillRect(W - 90, 275, 58, 48);
          ctx.beginPath();
          ctx.arc(W - 61, 346, 16, 0, Math.PI * 2);
          ctx.fill();

          // Cute tabby cat reading book
          ctx.font = '50px sans-serif';
          ctx.fillText('🐱', W - 75, 480);
          ctx.font = '32px sans-serif';
          ctx.fillText('📖', W - 105, 495);

          // Red satin ribbon
          ctx.font = '46px sans-serif';
          ctx.fillText('🎀', W - 80, 590);
        } else {
          // 3 or 4 Tilted Polaroid Frames with torn / deckle paper borders
          const pCenters = photoCount === 4
            ? [{ x: 300, y: 290 }, { x: 300, y: 670 }, { x: 300, y: 1050 }, { x: 300, y: 1430 }]
            : [{ x: 300, y: 350 }, { x: 300, y: 850 }, { x: 300, y: 1350 }];
          const angles = photoCount === 4 ? [-0.06, 0.05, -0.04, 0.05] : [-0.075, 0.005, 0.065];
          const pw = 430;
          const ph = photoCount === 4 ? 300 : 340;

          for (let i = 0; i < photoCount; i++) {
            const center = pCenters[i];
            const angle = angles[i];
            const img = shots[i] || shots[shots.length - 1] || shots[0];

            ctx.save();
            ctx.translate(center.x, center.y);
            ctx.rotate(angle);

            // Torn deckle paper drop shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
            roundRect(-pw / 2 + 8, -ph / 2 + 10, pw, ph, 8);
            ctx.fill();

            // Cream watercolor paper frame
            ctx.fillStyle = '#faf8f2';
            roundRect(-pw / 2, -ph / 2, pw, ph, 8);
            ctx.fill();

            // Scalloped / deckle paper edge detail
            ctx.strokeStyle = '#e5dfd2';
            ctx.lineWidth = 3;
            roundRect(-pw / 2, -ph / 2, pw, ph, 8);
            ctx.stroke();

            // Photo cutout
            const innerW = pw - 44;
            const innerH = ph - 54;
            const innerX = -innerW / 2;
            const innerY = -innerH / 2 - 4;

            ctx.fillStyle = '#111';
            ctx.fillRect(innerX, innerY, innerW, innerH);
            drawImageCover(ctx, img, innerX, innerY, innerW, innerH);

            ctx.restore();
          }

          // Embellishment 1: Tropical White Hibiscus Flower with crimson center (left of middle photo)
          ctx.font = '64px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🌺', 75, 710);

          // Embellishment 2: Mini ornate framed graduation portrait
          ctx.fillStyle = '#d4af37';
          ctx.beginPath();
          roundRect(32, 800, 68, 85, 6);
          ctx.fill();
          ctx.strokeStyle = '#aa820a';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = '#222';
          ctx.fillRect(40, 808, 52, 69);
          ctx.font = '36px sans-serif';
          ctx.fillText('🎓', 66, 854);

          // Embellishment 3: Retro silver compact digital camera with flash (right of middle photo)
          ctx.fillStyle = '#c5c8cb';
          ctx.beginPath();
          roundRect(W - 105, 770, 78, 115, 10);
          ctx.fill();
          ctx.strokeStyle = '#999e82';
          ctx.lineWidth = 2;
          ctx.stroke();
          // Camera screen & lens
          ctx.fillStyle = '#111';
          ctx.fillRect(W - 95, 785, 58, 48);
          ctx.beginPath();
          ctx.arc(W - 66, 856, 16, 0, Math.PI * 2);
          ctx.fill();

          // Embellishment 4: Cute ginger tabby cat reading a book (bottom-right of photo 3)
          ctx.font = '54px sans-serif';
          ctx.fillText('🐱', W - 80, 1220);
          ctx.font = '36px sans-serif';
          ctx.fillText('📖', W - 110, 1235);

          // Embellishment 5: Red satin ribbon bow tied on bottom frame corner
          ctx.font = '48px sans-serif';
          ctx.fillText('🎀', W - 85, 1420);
        }

        // Torn paper label with real-time dynamic date stamp (bottom)
        const dateTagW = 320;
        const dateTagH = 46;
        const dateTagX = (W - dateTagW) / 2;
        const dateTagY = H - 65;

        ctx.fillStyle = '#fdfbf7';
        roundRect(dateTagX, dateTagY, dateTagW, dateTagH, 6);
        ctx.fill();
        ctx.strokeStyle = '#c5bfb2';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#423c34';
        ctx.font = 'italic 700 16px "Playfair Display", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Memory Book • ${dateInfo.weekday}, ${dateInfo.dateFormatted}`, W / 2, dateTagY + 28);

      // ======================================================================
      // 4. TEMPLATE 4: 🕷️ MARVEL SPIDER-MAN & GWEN COMIC (`spiderman`)
      // ======================================================================
      } else if (frameKey === 'spiderman') {
        // Black and white comic book background filled with classic action panels and webs
        ctx.fillStyle = '#f4f4f4';
        ctx.fillRect(0, 0, W, H);

        // Halftone comic grid and spiderwebs across background
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1.5;
        for (let y = 0; y < H; y += 45) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }
        for (let x = 0; x < W; x += 45) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, H);
          ctx.stroke();
        }

        // Spiderweb decorative lines in corners
        function drawSpiderWeb(cx, cy, radius) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
          ctx.lineWidth = 1.5;
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
            ctx.stroke();
          }
          for (let r = 25; r <= radius; r += 25) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        drawSpiderWeb(60, 60, 110);
        drawSpiderWeb(W - 60, 60, 110);
        drawSpiderWeb(60, H - 60, 110);
        drawSpiderWeb(W - 60, H - 60, 110);

        // Photo Slots (Dynamic: 1 keepsake photo, 3 or 4 strip photos)
        const isOneShot = layout === '1';
        const photoCount = isOneShot ? 1 : (layout === '3' ? 3 : 4);
        const margin = 48;
        const startY = 32;
        const totalH = isOneShot ? 440 : 1380;
        const gap = isOneShot ? 0 : (layout === '3' ? 24 : 20);
        const rects = computePhotoRects(photoCount, margin, startY, totalH, gap);

        rects.forEach((r, i) => {
          const img = shots[i] || shots[shots.length - 1] || shots[0];

          // Bold Marvel Comic Red border
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(r.x - 7, r.y - 7, r.w + 14, r.h + 14);

          // Inner white bevel
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4);

          // User photo
          drawImageCover(ctx, img, r.x, r.y, r.w, r.h);

          // Comic black outline
          ctx.strokeStyle = '#111111';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(r.x - 7, r.y - 7, r.w + 14, r.h + 14);
        });

        // Superhero Stickers matching reference image 4:
        // Top-left: Spider-Gwen hanging upside down by a web line
        const gwenTopY = startY + (isOneShot ? 10 : 20);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(35, 0);
        ctx.lineTo(35, gwenTopY + 30);
        ctx.stroke();
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = '52px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🕷️', 35, gwenTopY + 70);
        ctx.font = '36px sans-serif';
        ctx.fillText('🤍', 35, gwenTopY + 110);

        // Middle-right: Spider-Gwen shooting a web strand
        const webShootY = startY + (isOneShot ? (totalH * 0.45) : (totalH * 2 / 4)) + 30;
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(W - 25, webShootY);
        ctx.lineTo(margin + 50, webShootY - 70);
        ctx.stroke();

        ctx.font = '48px sans-serif';
        ctx.fillText('🕸️', W - 32, webShootY);
        ctx.font = '38px sans-serif';
        ctx.fillText('⚡', W - 32, webShootY - 40);

        // Bottom-left: Spider-Gwen crouching ready for action
        const crouchY = startY + (isOneShot ? (totalH - 30) : (totalH - 60));
        ctx.font = '54px sans-serif';
        ctx.fillText('🦸‍♀️', 38, crouchY);

        // Bottom Area: Official MARVEL box logo + 3D SPIDER-MAN title + Date
        const logoY = startY + totalH + (isOneShot ? 22 : 28);

        // Official Red MARVEL box logo
        const marvelW = 95;
        const marvelH = 34;
        const marvelX = (W - marvelW) / 2;
        ctx.fillStyle = '#e61e2a';
        ctx.fillRect(marvelX, logoY, marvelW, marvelH);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 24px "Arial Black", Impact, sans-serif';
        ctx.letterSpacing = '1px';
        ctx.fillText('MARVEL', W / 2, logoY + 26);

        // Iconic 3D Comic Title: "SPIDER-MAN"
        const titleY = logoY + 74;
        ctx.textAlign = 'center';
        ctx.font = 'italic 900 58px "Arial Black", Impact, sans-serif';

        // 3D Drop shadow
        ctx.fillStyle = '#111111';
        ctx.fillText('SPIDER-MAN', W / 2 + 4, titleY + 4);
        // Red Comic Outline
        ctx.fillStyle = '#dc2626';
        ctx.fillText('SPIDER-MAN', W / 2 + 2, titleY + 2);
        // White Letter Fill
        ctx.fillStyle = '#ffffff';
        ctx.fillText('SPIDER-MAN', W / 2, titleY);

        // Comic Narration Box with Dynamic Date Stamp
        const captionW = 380;
        const captionH = 34;
        const captionX = (W - captionW) / 2;
        const captionY = titleY + 20;

        ctx.fillStyle = '#fde047'; // Vintage comic yellow narration box
        ctx.fillRect(captionX, captionY, captionW, captionH);
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 2;
        ctx.strokeRect(captionX, captionY, captionW, captionH);

        ctx.fillStyle = '#111111';
        ctx.font = 'bold 12px "Arial Black", monospace';
        ctx.fillText(`SPECIAL EDITION • ${dateInfo.weekday.toUpperCase()}, ${dateInfo.dateFormatted.toUpperCase()}`, W / 2, captionY + 22);

      // ======================================================================
      // 5. TEMPLATE 5: 🎟️ PIXTAB GRID TICKET (`gridticket`)
      // ======================================================================
      } else if (frameKey === 'gridticket') {
        // Warm ivory paper with brown graph paper grid lines (reference image 5)
        ctx.fillStyle = '#fbf8f3';
        ctx.fillRect(0, 0, W, H);

        // Brown Notebook Grid Lines
        ctx.strokeStyle = '#e8ded2';
        ctx.lineWidth = 1;
        const gridSize = 24;
        for (let x = 0; x < W; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, H);
          ctx.stroke();
        }
        for (let y = 0; y < H; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }

        // Left Border: 35mm film strip with dark brown sprocket hole perforations
        const filmW = 36;
        ctx.fillStyle = '#422116';
        ctx.fillRect(0, 0, filmW, H);

        ctx.fillStyle = '#fbf8f3';
        const holeW = 14;
        const holeH = 20;
        const holeStep = 34;
        for (let y = 14; y < H - 14; y += holeStep) {
          roundRect(11, y, holeW, holeH, 3);
          ctx.fill();
        }

        // Top Header: "pixtab .sub" branding
        ctx.fillStyle = '#6e3218';
        ctx.font = 'bold 24px "Playfair Display", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '1px';
        ctx.fillText('pixtab', (W + filmW) / 2, 48);
        ctx.font = '500 13px sans-serif';
        ctx.fillText('.sub', (W + filmW) / 2 + 56, 42);

        // Outer rounded terracotta/caramel rectangle containing all photos
        const frameMargin = filmW + 20;
        const isOneShot = layout === '1';
        const frameW = W - frameMargin - 20;
        const frameY = isOneShot ? 50 : 70;
        const photoCount = isOneShot ? 1 : (layout === '4' ? 4 : 3);
        const photoMargin = frameMargin + 14;
        const startY = frameY + 16;
        const totalH = isOneShot ? 440 : (layout === '4' ? 1220 : 1348);
        const frameH = totalH + 32;
        const frameRadius = 20;

        ctx.strokeStyle = '#b85d34';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        roundRect(frameMargin, frameY, frameW, frameH, frameRadius);
        ctx.stroke();

        // Photo Slots (Dynamic: 1 keepsake photo or 3/4-strip photos)
        const gap = isOneShot ? 0 : (layout === '4' ? 16 : 20);
        const rects = computePhotoRects(photoCount, photoMargin, startY, totalH, gap);

        rects.forEach((r, i) => {
          const img = shots[i] || shots[shots.length - 1] || shots[0];

          // White inner matting
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6);
          drawImageCover(ctx, img, r.x, r.y, r.w, r.h);

          // Subtle brown photo stroke
          ctx.strokeStyle = 'rgba(184, 93, 52, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(r.x, r.y, r.w, r.h);
        });

        // Hand-drawn sketch star doodle on right edge
        const starX = W - 26;
        const starY = startY + (isOneShot ? (totalH * 0.5) : (totalH * 2 / 3));
        ctx.strokeStyle = '#8c3d19';
        ctx.lineWidth = 2.5;
        function drawSketchStar(cx, cy, r) {
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const a1 = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const px = cx + Math.cos(a1) * r;
            const py = cy + Math.sin(a1) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
          // Sketch marks
          ctx.beginPath();
          ctx.moveTo(cx - r - 6, cy);
          ctx.lineTo(cx + r + 6, cy);
          ctx.moveTo(cx, cy - r - 6);
          ctx.lineTo(cx, cy + r + 6);
          ctx.stroke();
        }
        drawSketchStar(starX, starY, 32);

        // Dashed Perforated Tear Line across the bottom
        const tearY = frameY + frameH + (isOneShot ? 16 : 28);
        ctx.strokeStyle = '#b85d34';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(frameMargin - 6, tearY);
        ctx.lineTo(W - 14, tearY);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash

        // Warm Caramel / Terracotta Ticket Block at bottom
        const ticketY = tearY + (isOneShot ? 14 : 22);
        const ticketW = frameW + 12;
        const ticketX = frameMargin - 6;
        const ticketH = isOneShot ? 165 : 190;

        ctx.fillStyle = '#b85d34';
        ctx.beginPath();
        roundRect(ticketX, ticketY, ticketW, ticketH, 14);
        ctx.fill();

        // Realistic tall dark brown vertical barcode lines inside ticket block
        drawBarcode(ticketX + 28, ticketY + (isOneShot ? 18 : 24), ticketW - 56, isOneShot ? 60 : 75, '#421a0f');

        // Solid dark brown horizontal divider line
        const barLineY = ticketY + (isOneShot ? 98 : 118);
        ctx.fillStyle = '#591f10';
        ctx.fillRect(ticketX + 24, barLineY, ticketW - 48, 8);

        // Three dark brown stars ★ ★ ★
        ctx.fillStyle = '#591f10';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★   ★   ★', ticketX + (ticketW / 2), barLineY + 36);

        // Dynamic real-time date stamp on ticket stub
        ctx.fillStyle = '#fbf8f3';
        ctx.font = 'bold 12px monospace';
        ctx.letterSpacing = '2px';
        ctx.fillText(`${dateInfo.weekday.toUpperCase()} • ${dateInfo.dateFormatted.toUpperCase()}`, ticketX + (ticketW / 2), ticketY + ticketH - 8);

      // ======================================================================
      // 6. TEMPLATE 6: 🎵 SPOTIFY MUSIC PLAYER STRIP (`spotify`)
      // ======================================================================
      } else if (frameKey === 'spotify') {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#100d14');
        bgGrad.addColorStop(0.7, '#140c16');
        bgGrad.addColorStop(1, '#220814');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Header minimal tag
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '600 13px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '3px';
        ctx.fillText('SPOTIFY PHOTOBOOTH • SPECIAL MEMORIES', W / 2, 28);

        const isOneShot = layout === '1';
        // Photo slots (Dynamic: 1 keepsake photo or 3/4-strip photos)
        const photoMargin = 38;
        const photoW = W - (photoMargin * 2);
        const startY = 42;
        const drawCount = isOneShot ? 1 : (layout === '4' ? 4 : 3);
        const photoGap = isOneShot ? 0 : (layout === '4' ? 14 : 18);
        const photoH = isOneShot ? 420 : (layout === '4' ? 270 : 365);
        const totalH = isOneShot ? photoH : (photoH * drawCount + photoGap * (drawCount - 1));

        const rects = computePhotoRects(drawCount, photoMargin, startY, totalH, photoGap);

        rects.forEach((r, i) => {
          const img = shots[i] || shots[shots.length - 1] || shots[0];

          // Dark outer frame border
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.beginPath();
          roundRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8, 16);
          ctx.fill();

          // Clip photo with smooth 12px rounded corners
          ctx.save();
          ctx.beginPath();
          roundRect(r.x, r.y, r.w, r.h, 12);
          ctx.clip();
          drawImageCover(ctx, img, r.x, r.y, r.w, r.h);
          ctx.restore();

          // Stroke border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          roundRect(r.x, r.y, r.w, r.h, 12);
          ctx.stroke();
        });

        // Spotify Music Player Widget Card (Below the photos)
        const playerY = startY + totalH + 14;
        const playerW = photoW;
        const playerH = isOneShot ? 340 : (H - playerY - 30);

        if (playerH > 80) {
          // Player background card with glassmorphic border
          ctx.fillStyle = 'rgba(24, 20, 28, 0.95)';
          ctx.beginPath();
          roundRect(photoMargin, playerY, playerW, playerH, 18);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // 1. Device label
          ctx.fillStyle = '#8e8b94';
          ctx.font = '500 12px Outfit, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('iPad', photoMargin + 24, playerY + 34);

          // 2. Track Title
          const activeSong = (typeof topBarTrackTitle !== 'undefined' && topBarTrackTitle && topBarTrackTitle.textContent && topBarTrackTitle.textContent !== 'Choose Song')
            ? topBarTrackTitle.textContent
            : 'Stuck with U';
          ctx.fillStyle = '#ffffff';
          ctx.font = '700 22px Outfit, sans-serif';
          ctx.fillText(activeSong, photoMargin + 24, playerY + 68);

          // 3. Artist subtitle
          ctx.fillStyle = '#a6a2af';
          ctx.font = '400 15px Outfit, sans-serif';
          ctx.fillText('Ariana Grande & Justin Bieber', photoMargin + 24, playerY + 92);

          // 4. Progress Scrubber Bar
          const barY = playerY + 130;
          const barStartX = photoMargin + 24;
          const barEndX = photoMargin + playerW - 24;
          const barWidth = barEndX - barStartX;

          // Scrubber background track
          ctx.fillStyle = '#3a3442';
          ctx.beginPath();
          roundRect(barStartX, barY, barWidth, 4, 2);
          ctx.fill();

          // Scrubber active progress (68%)
          const progressW = barWidth * 0.68;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          roundRect(barStartX, barY, progressW, 4, 2);
          ctx.fill();

          // Scrubber thumb circle
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(barStartX + progressW, barY + 2, 5.5, 0, Math.PI * 2);
          ctx.fill();

          // Time indicators: 3:07 left, -0:40 right
          ctx.fillStyle = '#8e8b94';
          ctx.font = '500 12px Outfit, monospace';
          ctx.textAlign = 'left';
          ctx.fillText('3:07', barStartX, barY + 24);
          ctx.textAlign = 'right';
          ctx.fillText('-0:40', barEndX, barY + 24);

          // 5. Media Player Controls Row
          const ctrlY = barY + 70;
          const centerX = photoMargin + (playerW / 2);

          // Favorite Heart
          ctx.fillStyle = '#ff758f';
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('♡', centerX - 140, ctrlY + 6);

          // Previous Button
          ctx.fillStyle = '#ffffff';
          ctx.font = '22px sans-serif';
          ctx.fillText('⏮', centerX - 70, ctrlY + 6);

          // Main Pause/Play Round Button
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(centerX, ctrlY, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText('❚❚', centerX, ctrlY + 6);

          // Next Button
          ctx.fillStyle = '#ffffff';
          ctx.font = '22px sans-serif';
          ctx.fillText('⏭', centerX + 70, ctrlY + 6);

          // Airplay icon
          ctx.fillStyle = '#a6a2af';
          ctx.font = '18px sans-serif';
          ctx.fillText('⎋', centerX + 140, ctrlY + 6);
        }

        // 6. Bottom Stamp on strip with dynamic real-time date
        ctx.fillStyle = '#c9184a';
        ctx.font = 'bold 14px Outfit, sans-serif';
        ctx.letterSpacing = '2px';
        ctx.textAlign = 'center';
        ctx.fillText(`SELF PHOTO • ${dateInfo.weekday.toUpperCase()} • ${dateInfo.dateFormatted.toUpperCase()}`, W / 2, H - 14);

      // ======================================================================
      // 7. TEMPLATE 7: 🎟️ SPECIAL DAY TICKET (`pixelbooth`)
      // ======================================================================
      } else if (frameKey === 'pixelbooth') {
        // Deep rich burgundy border background
        ctx.fillStyle = '#591321';
        ctx.fillRect(0, 0, W, H);

        // White Ticket Body
        const ticketMargin = 22;
        const ticketX = ticketMargin;
        const ticketY = 16;
        const ticketW = W - (ticketMargin * 2);
        const ticketH = H - 32;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        roundRect(ticketX, ticketY, ticketW, ticketH, 18);
        ctx.fill();

        // Photobooth Ticket Punch Cutouts (Half circles on edges)
        const isOneShot = layout === '1';
        ctx.fillStyle = '#591321';
        const cutoutR = 18;
        // Top edge notches
        ctx.beginPath();
        ctx.arc(ticketX, ticketY + 110, cutoutR, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ticketX + ticketW, ticketY + 110, cutoutR, Math.PI / 2, -Math.PI / 2);
        ctx.fill();

        // Bottom edge notches
        const bottomNotchY = isOneShot ? (ticketY + ticketH - 120) : (ticketY + ticketH - 170);
        ctx.beginPath();
        ctx.arc(ticketX, bottomNotchY, cutoutR, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ticketX + ticketW, bottomNotchY, cutoutR, Math.PI / 2, -Math.PI / 2);
        ctx.fill();

        // Top Header
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ticketX + 80, 0, ticketW - 160, 24);
        ctx.fillStyle = '#591321';
        ctx.font = 'bold 15px Outfit, sans-serif';
        ctx.letterSpacing = '6px';
        ctx.textAlign = 'center';
        ctx.fillText('P I X E L B O O T H', W / 2, 28);

        // Realistic Barcode at Top
        drawBarcode(ticketX + 35, ticketY + 36, ticketW - 70, 52, '#000000', `* ${dateInfo.dateFormatted.toUpperCase()} • PHOTOBOOTH *`);

        // Dashed tear line 1
        ctx.strokeStyle = '#591321';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.moveTo(ticketX + 20, ticketY + 110);
        ctx.lineTo(ticketX + ticketW - 20, ticketY + 110);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash

        // Photos in Ticket Frame (Dynamic: 1 keepsake photo or 3/4-strip photos)
        const photoMargin = ticketX + 22;
        const photoW = ticketW - 44;
        const photoCount = isOneShot ? 1 : (layout === '4' ? 4 : 3);
        const photoGap = 16;
        const photoH = isOneShot ? 440 : (layout === '4' ? 285 : 370);
        const totalH = isOneShot ? photoH : (photoH * photoCount + photoGap * (photoCount - 1));
        const startY = ticketY + 125;

        const rects = computePhotoRects(photoCount, photoMargin, startY, totalH, photoGap);

        rects.forEach((r, i) => {
          const img = shots[i] || shots[shots.length - 1] || shots[0];

          // Subtle photo shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
          ctx.fillRect(r.x + 2, r.y + 2, r.w, r.h);

          // Photo
          drawImageCover(ctx, img, r.x, r.y, r.w, r.h);

          // Clean photo border
          ctx.strokeStyle = '#e2d7d9';
          ctx.lineWidth = 2;
          ctx.strokeRect(r.x, r.y, r.w, r.h);
        });

        // Dashed tear line 2 - positioned right after the photos
        const tearLine2Y = startY + totalH + 14;
        ctx.strokeStyle = '#591321';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.moveTo(ticketX + 20, tearLine2Y);
        ctx.lineTo(ticketX + ticketW - 20, tearLine2Y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Bottom Section: "Special Day" flowing calligraphy script — CENTERED
        ctx.fillStyle = '#591321';
        ctx.font = 'italic 700 44px "Playfair Display", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('Special Day', W / 2, tearLine2Y + 54);

        // Retro brown camera sticker with pink hearts (right side)
        ctx.font = '36px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('📷', ticketX + ticketW - 38, tearLine2Y + 64);
        ctx.font = '20px sans-serif';
        ctx.fillText('💕', ticketX + ticketW - 30, tearLine2Y + 38);

        // Date & Weekday Stamp — centered below Special Day
        ctx.fillStyle = '#591321';
        ctx.font = 'bold 14px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${dateInfo.weekday}, ${dateInfo.dateFormatted} • ${dateInfo.timeFormatted}`, W / 2, tearLine2Y + 92);

        ctx.fillStyle = '#591321';
        ctx.font = 'bold 13px Outfit, sans-serif';
        ctx.letterSpacing = '5px';
        ctx.fillText('P I X E L B O O T H', W / 2, H - 24);

      // ======================================================================
      // 8. TEMPLATE 8: 🌸 SWEET PINK LOVE (`pink`)
      // ======================================================================
      } else if (frameKey === 'pink') {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#ffe5ec');
        grad.addColorStop(0.5, '#ffccd5');
        grad.addColorStop(1, '#ffb3c1');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(12, 12, W - 24, H - 24);

        ctx.fillStyle = '#c9184a';
        ctx.font = 'bold 22px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '3px';
        ctx.fillText('♡ SWEET MEMORIES ♡', W / 2, 45);

        const isOneShot = layout === '1';
        const photoMargin = 32;
        const photoCount = isOneShot ? 1 : (layout === '4' ? 4 : 3);
        const photoGap = 20;
        const photoH = isOneShot ? 480 : (layout === '4' ? 290 : 370);
        const startY = 65;
        const totalH = isOneShot ? photoH : (photoH * photoCount + photoGap * (photoCount - 1));

        const rects = computePhotoRects(photoCount, photoMargin, startY, totalH, photoGap);

        rects.forEach((r, i) => {
          const img = shots[i] || shots[shots.length - 1] || shots[0];
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8);
          drawImageCover(ctx, img, r.x, r.y, r.w, r.h);
        });

        ctx.fillStyle = '#800f2f';
        ctx.font = '600 19px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${dateInfo.weekday}, ${dateInfo.dateFormatted}`, W / 2, H - 65);
        ctx.fillStyle = '#a4133c';
        ctx.font = '400 16px Outfit, sans-serif';
        ctx.fillText(`${dateInfo.timeFormatted} • Sweet Love Forever 💖`, W / 2, H - 35);

      // ======================================================================
      // 9. TEMPLATE 9: 🎞️ VINTAGE 35MM FILM (`film`)
      // ======================================================================
      } else if (frameKey === 'film') {
        ctx.fillStyle = '#18141c';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = '#ffffff';
        const holeW = 12;
        const holeH = 18;
        const holeStep = 32;
        for (let y = 30; y < H - 30; y += holeStep) {
          ctx.fillRect(8, y, holeW, holeH);
          ctx.fillRect(W - 20, y, holeW, holeH);
        }

        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '3px';
        ctx.fillText('KODAK MEMORIES 400', W / 2, 42);

        const isOneShot = layout === '1';
        const photoMargin = 38;
        const photoCount = isOneShot ? 1 : (layout === '4' ? 4 : 3);
        const photoGap = 20;
        const photoH = isOneShot ? 480 : (layout === '4' ? 290 : 370);
        const startY = 65;
        const totalH = isOneShot ? photoH : (photoH * photoCount + photoGap * (photoCount - 1));

        const rects = computePhotoRects(photoCount, photoMargin, startY, totalH, photoGap);

        rects.forEach((r, i) => {
          const img = shots[i] || shots[shots.length - 1] || shots[0];
          drawImageCover(ctx, img, r.x, r.y, r.w, r.h);

          // Film frame index
          ctx.fillStyle = '#f4c27f';
          ctx.font = '10px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`▸ 0${i + 1}A`, r.x - 8, r.y + 20);
        });

        ctx.fillStyle = '#ff9f1c';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`'${dateInfo.yearShort} ${dateInfo.monthNum} ${dateInfo.dayNum} ${dateInfo.weekday.slice(0, 3).toUpperCase()}`, W / 2, H - 65);
        ctx.fillStyle = '#ffd166';
        ctx.font = '15px monospace';
        ctx.fillText(`${dateInfo.timeFormatted} • ISO 400 FILM`, W / 2, H - 35);

      // ======================================================================
      // 10. TEMPLATE 10: ✨ KOREAN PASTEL DREAM (인생네컷) (`korean`)
      // ======================================================================
      } else if (frameKey === 'korean') {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#e2d4f8');
        grad.addColorStop(0.5, '#d0e1fd');
        grad.addColorStop(1, '#ffd8ea');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Header: Korean text & sparkles
        ctx.fillStyle = '#4a2574';
        ctx.font = 'bold 22px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '2px';
        ctx.fillText('우리의 순간 ✨', W / 2, 42);

        const isOneShot = layout === '1';
        const photoMargin = 36;
        const photoCount = isOneShot ? 1 : (layout === '4' ? 4 : 3);
        const photoGap = 18;
        const photoH = isOneShot ? 480 : (layout === '4' ? 290 : 370);
        const startY = 62;
        const totalH = isOneShot ? photoH : (photoH * photoCount + photoGap * (photoCount - 1));

        const rects = computePhotoRects(photoCount, photoMargin, startY, totalH, photoGap);

        rects.forEach((r, i) => {
          const img = shots[i] || shots[shots.length - 1] || shots[0];

          // White pastel card matting
          ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
          ctx.beginPath();
          roundRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12, 12);
          ctx.fill();

          // Photo with rounded corners
          ctx.save();
          ctx.beginPath();
          roundRect(r.x, r.y, r.w, r.h, 8);
          ctx.clip();
          drawImageCover(ctx, img, r.x, r.y, r.w, r.h);
          ctx.restore();

          // Delicate border
          ctx.strokeStyle = 'rgba(180, 150, 220, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          roundRect(r.x, r.y, r.w, r.h, 8);
          ctx.stroke();
        });

        // Cute side stickers
        if (isOneShot) {
          ctx.font = '28px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⭐', photoMargin - 15, startY + 60);
          ctx.fillText('🎀', W - photoMargin + 15, startY + 220);
          ctx.fillText('💖', photoMargin - 15, startY + 400);
        } else {
          ctx.font = '28px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⭐', photoMargin - 15, startY + 120);
          ctx.fillText('🎀', W - photoMargin + 15, startY + 360);
          ctx.fillText('💖', photoMargin - 15, startY + 600);
        }

        // Footer Korean Life 4 Cuts tag
        ctx.fillStyle = '#4a2574';
        ctx.font = 'bold 16px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '3px';
        ctx.fillText(isOneShot ? 'LIFE 4 CUTS • OUR MOMENT' : 'LIFE 4 CUTS • OUR MEMORY', W / 2, H - 60);

        ctx.fillStyle = '#6b439c';
        ctx.font = '500 14px Outfit, sans-serif';
        ctx.letterSpacing = '1px';
        ctx.fillText(`${dateInfo.weekday}, ${dateInfo.dateFormatted} • Photobooth Memories`, W / 2, H - 32);

      // ======================================================================
      // 11. TEMPLATE 11: 🖤 MINIMALIST CHIC EDITORIAL (`minimal` & Fallback)
      // ======================================================================
      } else {
        ctx.fillStyle = '#f7f5f0';
        ctx.fillRect(0, 0, W, H);

        // Outer sleek dark line
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(16, 16, W - 32, H - 32);

        // Header: High fashion editorial typography
        ctx.fillStyle = '#111111';
        ctx.font = '700 24px "Playfair Display", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '8px';
        ctx.fillText('M O M E N T S', W / 2, 54);

        const isOneShot = layout === '1';
        const photoMargin = 40;
        const photoCount = isOneShot ? 1 : (layout === '4' ? 4 : 3);
        const photoGap = 20;
        const photoH = isOneShot ? 480 : (layout === '4' ? 290 : 370);
        const startY = 74;
        const totalH = isOneShot ? photoH : (photoH * photoCount + photoGap * (photoCount - 1));

        const rects = computePhotoRects(photoCount, photoMargin, startY, totalH, photoGap);

        rects.forEach((r, i) => {
          const img = shots[i] || shots[shots.length - 1] || shots[0];

          // Clean black matting border
          ctx.strokeStyle = '#222222';
          ctx.lineWidth = 1;
          ctx.strokeRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6);

          drawImageCover(ctx, img, r.x, r.y, r.w, r.h);
        });

        // Editorial footer
        ctx.fillStyle = '#222222';
        ctx.font = '600 12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '4px';
        ctx.fillText(isOneShot ? 'COLLECTION NO. 01 • EDITORIAL KEEPSAKE' : 'COLLECTION NO. 01 • EDITORIAL STRIP', W / 2, H - 65);

        ctx.fillStyle = '#555555';
        ctx.font = '500 13px Outfit, sans-serif';
        ctx.letterSpacing = '2px';
        ctx.fillText(`${dateInfo.weekday.toUpperCase()}, ${dateInfo.dateFormatted.toUpperCase()}`, W / 2, H - 35);
      }

      return canvas.toDataURL('image/jpeg', 0.94);
    }

    // Download Photobooth Picture
    function downloadImage(dataUrl) {
      if (!dataUrl) dataUrl = lastRenderedDataUrl;
      if (!dataUrl) return;

      const dateStr = new Date().toISOString().slice(0, 10);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `photobooth_snap_${dateStr}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Photobooth photo downloaded! ⬇️', '📸');
    }

    // LocalStorage Snaps History Management
    function loadHistoryFromStorage() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const list = raw ? JSON.parse(raw) : [];
        if (historyBadge) {
          historyBadge.textContent = list.length;
        }
        return list;
      } catch (err) {
        console.warn('Error loading photobooth history from localStorage:', err);
        return [];
      }
    }

    function saveSnapToHistory(dataUrl, frameKey, layout) {
      try {
        const list = loadHistoryFromStorage();
        const dateInfo = getUpdatedDateInfo();
        const newSnap = {
          id: 'snap_' + Date.now(),
          dataUrl: dataUrl,
          weekday: dateInfo.weekday,
          dateStr: dateInfo.dateFormatted,
          timeStr: dateInfo.timeFormatted,
          frame: frameKey,
          layout: layout,
          timestamp: Date.now()
        };

        list.unshift(newSnap);

        // Keep maximum 25 snaps to respect localStorage quota
        if (list.length > 25) {
          list.pop();
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        if (historyBadge) {
          historyBadge.textContent = list.length;
        }
      } catch (err) {
        console.warn('Storage quota reached or error saving snap:', err);
      }
    }

    function renderHistoryGrid() {
      if (!historyGrid || !historyEmpty) return;
      const list = loadHistoryFromStorage();

      if (list.length === 0) {
        historyGrid.innerHTML = '';
        historyEmpty.style.display = 'flex';
        return;
      }

      historyEmpty.style.display = 'none';
      historyGrid.innerHTML = '';

      list.forEach(item => {
        const card = document.createElement('div');
        card.className = 'pbooth-history-card';
        card.setAttribute('role', 'article');
        card.setAttribute('aria-label', `Photobooth photo from ${item.weekday}, ${item.dateStr}`);

        card.innerHTML = `
          <div class="history-thumb-wrapper" title="Click to view full image">
            <img src="${item.dataUrl}" alt="Photobooth memory from ${item.weekday}" loading="lazy">
          </div>
          <div class="history-card-body">
            <span class="history-card-date">${item.weekday}, ${item.dateStr}</span>
            <span class="history-card-time">${item.timeStr} • ${frameNames[item.frame] || 'Photobooth'}</span>
            <div class="history-card-actions">
              <button type="button" class="btn-history-action btn-history-download" title="Download this photo">
                <span>⬇️</span>
                <span>Download</span>
              </button>
              <button type="button" class="btn-history-action btn-history-delete btn-delete-icon-only" title="Delete permanently" aria-label="Delete photo permanently">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
          </div>
        `;

        // Click thumbnail to preview
        const thumb = card.querySelector('.history-thumb-wrapper');
        thumb.addEventListener('click', () => {
          showResult(item.dataUrl);
          switchTab('booth');
        });

        // Download button
        const dlBtn = card.querySelector('.btn-history-download');
        dlBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          downloadImage(item.dataUrl);
        });

        // Permanent Delete button
        const delBtn = card.querySelector('.btn-history-delete');
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openDeleteModal(item.id);
        });

        historyGrid.appendChild(card);
      });
    }

    // Permanent Delete Confirmation Modal
    function openDeleteModal(id) {
      itemToDeleteId = id;
      if (deleteModal) {
        deleteModal.classList.add('active');
        deleteModal.setAttribute('aria-hidden', 'false');
      }
    }

    function closeDeleteModal() {
      itemToDeleteId = null;
      if (deleteModal) {
        deleteModal.classList.remove('active');
        deleteModal.setAttribute('aria-hidden', 'true');
      }
    }

    function confirmDeletePermanently() {
      if (!itemToDeleteId) return;
      try {
        let list = loadHistoryFromStorage();
        list = list.filter(item => item.id !== itemToDeleteId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        if (historyBadge) historyBadge.textContent = list.length;
        closeDeleteModal();
        renderHistoryGrid();
        showToast('Photo deleted permanently 🗑️', '✓');
      } catch (err) {
        console.warn('Error deleting photo:', err);
        closeDeleteModal();
      }
    }

    // Event Listeners for Photobooth
    if (openPboothBtn) {
      openPboothBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    }

    if (pboothCloseBtn) {
      pboothCloseBtn.addEventListener('click', closeModal);
    }

    if (tabBoothBtn) {
      tabBoothBtn.addEventListener('click', () => switchTab('booth'));
    }

    if (tabHistoryBtn) {
      tabHistoryBtn.addEventListener('click', () => switchTab('history'));
    }

    // Save to Snaps History Button
    if (pboothSaveBtn) {
      pboothSaveBtn.addEventListener('click', () => {
        if (!lastRenderedDataUrl) return;
        if (!isCurrentSnapSaved) {
          saveSnapToHistory(lastRenderedDataUrl, currentFrame, currentLayout);
          isCurrentSnapSaved = true;
          pboothSaveBtn.classList.add('is-saved');
          pboothSaveBtn.innerHTML = '<span>✓</span><span>Saved to Snaps!</span>';
          showToast('Photo saved to Snaps History! 💖💾', '✓');
        } else {
          showToast('Already saved in Snaps History! 🎞️', '✓');
        }
      });
    }

    if (pboothDownloadBtn) {
      pboothDownloadBtn.addEventListener('click', () => {
        if (!lastRenderedDataUrl) return;
        downloadImage(lastRenderedDataUrl);
        // Also ensure it is recorded in history upon downloading
        if (!isCurrentSnapSaved) {
          saveSnapToHistory(lastRenderedDataUrl, currentFrame, currentLayout);
          isCurrentSnapSaved = true;
          if (pboothSaveBtn) {
            pboothSaveBtn.classList.add('is-saved');
            pboothSaveBtn.innerHTML = '<span>✓</span><span>Saved to Snaps!</span>';
          }
        }
      });
    }

    // Retake / Take Again Button (Discards current take and returns to live camera)
    if (pboothRetakeBtn) {
      pboothRetakeBtn.addEventListener('click', () => {
        capturedShots = [];
        updateShotsUI();
        showViewfinder();
        startCamera();
        showToast('Ready to take a new picture! 📸', '✨');
      });
    }

    // Flip Camera Button (Bottom Controls & Floating Overlay)
    if (pboothFlipCamBtn) {
      pboothFlipCamBtn.addEventListener('click', toggleCameraFlip);
    }
    if (pboothFloatingFlipBtn) {
      pboothFloatingFlipBtn.addEventListener('click', toggleCameraFlip);
    }

    if (pboothViewHistoryShortcutBtn) {
      pboothViewHistoryShortcutBtn.addEventListener('click', () => {
        switchTab('history');
      });
    }

    if (emptyTakeBtn) {
      emptyTakeBtn.addEventListener('click', () => switchTab('booth'));
    }

    // Delete confirmation listeners
    if (deleteConfirmBtn) {
      deleteConfirmBtn.addEventListener('click', confirmDeletePermanently);
    }
    if (deleteCancelBtn) {
      deleteCancelBtn.addEventListener('click', closeDeleteModal);
    }

    // Backdrop click dismissals
    if (pboothModal) {
      pboothModal.addEventListener('click', (e) => {
        if (e.target === pboothModal) {
          closeModal();
        }
      });
    }

    if (deleteModal) {
      deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
          closeDeleteModal();
        }
      });
    }

    if (templatesModal) {
      templatesModal.addEventListener('click', (e) => {
        if (e.target === templatesModal) {
          closeTemplatesModal();
        }
      });
    }

    // Initialize history badge on page load
    loadHistoryFromStorage();

    // Preserve scroll position on refresh if already unlocked
    const isUnlocked = document.documentElement.classList.contains('puzzle-already-unlocked') ||
                       sessionStorage.getItem('love_surprise_puzzle_unlocked') === 'true';
    if (isUnlocked) {
      const savedPos = sessionStorage.getItem('love_surprise_scroll_pos');
      if (savedPos !== null && parseInt(savedPos, 10) > 0) {
        setTimeout(() => {
          window.scrollTo({ top: parseInt(savedPos, 10), behavior: 'instant' });
        }, 60);
      }
    }
  }

  // Save scroll position for refresh restoration
  window.addEventListener('scroll', () => {
    if (sessionStorage.getItem('love_surprise_puzzle_unlocked') === 'true' ||
        document.documentElement.classList.contains('puzzle-already-unlocked')) {
      sessionStorage.setItem('love_surprise_scroll_pos', window.scrollY);
    }
  }, { passive: true });

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
