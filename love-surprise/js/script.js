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
    partnerName: "My Love",
    sinceDate: "2023-02-14",
    enableMusic: true,
    musicSrc: "assets/audio/song.mp3",
    rainLanes: 6,
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

  // Playlist array from config or fallback
  const playlist = (cfg.playlist && cfg.playlist.length > 0) ? cfg.playlist : [
    {
      id: "track-1",
      title: "Teka Lang",
      artist: "EMMAN",
      src: cfg.musicSrc || "assets/audio/EMMAN - Teka Lang (Official Lyric Video).mp3",
      cover: "assets/images/image1.jpg"
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
  
  // Media Modal Elements
  const mediaModal = document.getElementById('media-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalMediaStage = document.getElementById('modal-media-stage');
  const modalCaption = document.getElementById('modal-caption');
  const modalCounter = document.getElementById('modal-counter');
  const modalPrevBtn = document.getElementById('modal-prev-btn');
  const modalNextBtn = document.getElementById('modal-next-btn');

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

  /* ==========================================================================
     1. INITIALIZATION & HERO SETUP
     ========================================================================== */
  function init() {
    // 1. Set personalized names
    if (partnerNameEl && cfg.partnerName) {
      partnerNameEl.textContent = cfg.partnerName;
    }
    const noteGreeting = document.getElementById('note-greeting');
    if (noteGreeting && cfg.partnerName) {
      noteGreeting.textContent = `For ${cfg.partnerName}`;
    }

    // 2. Start Together Since Counter
    initCounter();

    // 3. Populate Gallery
    initGallery();

    // 4. Setup Falling Media Rain
    initRain();

    // 5. Setup Music Player
    initMusic();

    // 6. Setup Event Listeners & Modals
    setupEventListeners();

    // 7. Accessibility
    // Rain flows smoothly by default, and user can freeze/resume at any time with the top button
  }

  /* ==========================================================================
     2. LIVE "TOGETHER SINCE" COUNTER
     ========================================================================== */
  function initCounter() {
    function updateCounter() {
      const startDate = new Date(cfg.sinceDate).getTime();
      const now = new Date().getTime();
      const diff = now - startDate;

      if (isNaN(startDate)) {
        if (daysEl) daysEl.textContent = "0";
        if (hoursEl) hoursEl.textContent = "00";
        if (minutesEl) minutesEl.textContent = "00";
        if (secondsEl) secondsEl.textContent = "00";
        return;
      }

      const isPast = diff >= 0;
      const totalSeconds = Math.floor(Math.abs(diff) / 1000);

      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);

      if (daysEl) daysEl.textContent = days.toLocaleString();
      if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
      if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
      if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
    }

    updateCounter();
    setInterval(updateCounter, 1000);
  }

  /* ==========================================================================
     3. SLOW 16-SECOND NON-OVERLAPPING MEMORY RAIN (ZERO DUPLICATES ON SCREEN)
     ========================================================================== */
  const RAIN_DURATION = 16; // Strictly 16 seconds slow, gentle romantic fall
  const activeImageSrcs = new Set();
  let recentImageHistory = [];
  let currentActiveLaneCount = 0;

  function getAvailableRainImage() {
    const allImages = (cfg.media && cfg.media.length > 0)
      ? cfg.media.filter(m => m.type === 'image')
      : [];

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
      openModal(mediaIndex >= 0 ? mediaIndex : 0);
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
    if (rainToggleBtn) {
      rainToggleBtn.classList.add('is-paused');
      if (rainToggleText) rainToggleText.textContent = "Resume Rain";
    }
  }

  function resumeRain() {
    isRainPaused = false;
    if (rainContainer) {
      rainContainer.classList.remove('paused');
    }
    if (rainToggleBtn) {
      rainToggleBtn.classList.remove('is-paused');
      if (rainToggleText) rainToggleText.textContent = "Freeze Rain";
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
     4. GALLERY COMPONENT
     ========================================================================== */
  function initGallery() {
    if (!galleryGrid || !cfg.media) return;

    galleryGrid.innerHTML = '';

    cfg.media.forEach((item, index) => {
      const galleryItem = document.createElement('article');
      galleryItem.className = 'gallery-item';
      galleryItem.setAttribute('data-type', item.type);
      galleryItem.setAttribute('tabindex', '0');
      galleryItem.setAttribute('role', 'button');
      galleryItem.setAttribute('aria-label', `View memory ${index + 1}: ${item.caption || ''}`);

      const thumbWrapper = document.createElement('div');
      thumbWrapper.className = 'gallery-media-thumb';

      if (item.type === 'video') {
        const vid = document.createElement('video');
        vid.src = item.src;
        vid.muted = true;
        vid.playsInline = true;
        vid.preload = 'metadata';
        thumbWrapper.appendChild(vid);

        const badge = document.createElement('div');
        badge.className = 'gallery-badge';
        badge.innerHTML = `<span>▶</span> Video`;
        thumbWrapper.appendChild(badge);
      } else {
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.caption || `Memory ${index + 1}`;
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
      meta.innerHTML = `
        <span>Memory #${index + 1}</span>
        <span class="gallery-action-hint">Enlarge ↗</span>
      `;

      infoBox.appendChild(caption);
      infoBox.appendChild(meta);

      galleryItem.appendChild(thumbWrapper);
      galleryItem.appendChild(infoBox);

      // Open Modal on click
      galleryItem.addEventListener('click', () => {
        openModal(index);
      });
      galleryItem.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(index);
        }
      });

      galleryGrid.appendChild(galleryItem);
    });

    // Setup Category Filters
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');
        const items = galleryGrid.querySelectorAll('.gallery-item');

        items.forEach(item => {
          if (filter === 'all' || item.getAttribute('data-type') === filter) {
            item.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  /* ==========================================================================
     5. LIGHTBOX MODAL (AUTO-PAUSES MUSIC ON VIDEOS, RESUMES ON CLOSE, RAIN CONTINUES)
     ========================================================================== */
  function openModal(index) {
    if (!cfg.media || cfg.media.length === 0) return;

    currentModalIndex = index;
    const item = cfg.media[currentModalIndex];

    // Automatically pause background music if opening a video
    if (item && item.type === 'video') {
      if (isMusicPlaying) {
        wasMusicPlayingBeforeVideo = true;
        stopMusic();
      } else if (cfg.autoPlayOnFirstClick && !hasAutoStarted) {
        // If this is the user's first click, don't start music now, but schedule it to start when returning!
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
      // Focus the close button for accessibility
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
    if (!modalMediaStage) return;

    const item = cfg.media[currentModalIndex];
    if (!item) return;

    modalMediaStage.innerHTML = '';

    if (item.type === 'video') {
      const vid = document.createElement('video');
      vid.src = item.src;
      vid.controls = true;
      vid.autoplay = true;
      vid.playsInline = true;
      vid.style.maxHeight = '65vh';
      vid.style.maxWidth = '100%';

      // Ensure background music turns off whenever the video plays
      vid.addEventListener('play', () => {
        if (isMusicPlaying) {
          wasMusicPlayingBeforeVideo = true;
          stopMusic();
        }
      });

      // When the video ends, resume background music
      vid.addEventListener('ended', () => {
        if (wasMusicPlayingBeforeVideo) {
          wasMusicPlayingBeforeVideo = false;
          startMusic();
        }
      });

      modalMediaStage.appendChild(vid);
    } else {
      // If we switched from a video to a photo, resume music
      if (wasMusicPlayingBeforeVideo) {
        wasMusicPlayingBeforeVideo = false;
        startMusic();
      }

      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.caption || "Enlarged Memory";
      img.style.maxHeight = '65vh';
      img.style.maxWidth = '100%';
      modalMediaStage.appendChild(img);
    }

    if (modalCaption) {
      modalCaption.textContent = item.caption || `Moment #${currentModalIndex + 1}`;
    }
    if (modalCounter) {
      modalCounter.textContent = `${currentModalIndex + 1} of ${cfg.media.length}`;
    }
  }

  function nextModalItem() {
    const prevItem = cfg.media[currentModalIndex];
    if (prevItem && prevItem.type === 'video' && modalMediaStage) {
      const vid = modalMediaStage.querySelector('video');
      if (vid) vid.pause();
    }

    currentModalIndex = (currentModalIndex + 1) % cfg.media.length;
    const nextItem = cfg.media[currentModalIndex];

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
    const prevItem = cfg.media[currentModalIndex];
    if (prevItem && prevItem.type === 'video' && modalMediaStage) {
      const vid = modalMediaStage.querySelector('video');
      if (vid) vid.pause();
    }

    currentModalIndex = (currentModalIndex - 1 + cfg.media.length) % cfg.media.length;
    const nextItem = cfg.media[currentModalIndex];

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
     6. FLOATING 💌 LOVE NOTES MODAL
     ========================================================================== */
  let lastNoteIndex = -1;

  function getRandomNote() {
    const notes = cfg.notes;
    if (!notes || notes.length === 0) return "You are loved endlessly! 💖";
    if (notes.length === 1) return notes[0];

    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * notes.length);
    } while (newIndex === lastNoteIndex);

    lastNoteIndex = newIndex;
    return notes[newIndex];
  }

  function openNoteModal() {
    displayRandomNote();

    if (noteModal) {
      noteModal.classList.add('active');
      noteModal.setAttribute('aria-hidden', 'false');
    }

    createHeartBurst(window.innerWidth / 2, window.innerHeight / 2);
  }

  function closeNoteModal() {
    if (noteModal) {
      noteModal.classList.remove('active');
      noteModal.setAttribute('aria-hidden', 'true');
    }
  }

  function displayRandomNote() {
    if (!noteTextEl) return;

    noteTextEl.style.opacity = '0';
    noteTextEl.style.transform = 'translateY(10px)';

    setTimeout(() => {
      noteTextEl.textContent = `"${getRandomNote()}"`;
      noteTextEl.style.opacity = '1';
      noteTextEl.style.transform = 'translateY(0)';
    }, 200);
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
     7. ROMANTIC PLAYLIST & MUSIC SYSTEM (6-Track Audio + Web Audio Synth Fallback)
     ========================================================================== */
  function initMusic() {
    if (!cfg.enableMusic) {
      if (musicToggleBtn) musicToggleBtn.style.display = 'none';
      if (musicPlaylistTriggerBtn) musicPlaylistTriggerBtn.style.display = 'none';
      return;
    }

    currentTrackIndex = cfg.defaultTrackIndex || 0;
    const initialTrack = playlist[currentTrackIndex] || playlist[0];

    // Prepare HTML5 Audio
    audioPlayer = new Audio();
    audioPlayer.src = encodeURI(initialTrack.src);
    audioPlayer.loop = false; // Strictly false so 'ended' event fires to auto-advance to next song
    audioPlayer.volume = 0.65;
    audioPlayer.preload = 'auto';

    // Auto-advance to the next song when current track ends
    audioPlayer.addEventListener('ended', () => {
      console.log(`[Soundtrack] Track finished: ${playlist[currentTrackIndex]?.title}. Automatically advancing to next song...`);
      nextTrack();
    });

    // Time update for timeline scrubber & elapsed counters
    audioPlayer.addEventListener('timeupdate', () => {
      if (!audioPlayer || isNaN(audioPlayer.duration)) return;
      const cur = audioPlayer.currentTime;
      const dur = audioPlayer.duration;
      if (playerTimeCurrent) playerTimeCurrent.textContent = formatTime(cur);
      if (playerTimeDuration) playerTimeDuration.textContent = formatTime(dur);
      if (playerProgressBar && !isSeeking) {
        playerProgressBar.value = (cur / dur) * 100;
      }
    });

    audioPlayer.addEventListener('loadedmetadata', () => {
      if (playerTimeDuration && !isNaN(audioPlayer.duration)) {
        playerTimeDuration.textContent = formatTime(audioPlayer.duration);
      }
    });

    // Fallback to Web Audio synthesized ambient melody if audio file errors
    audioPlayer.addEventListener('error', (e) => {
      console.warn("Audio file could not be loaded, activating romantic ambient synth fallback", e);
      if (isMusicPlaying) {
        startSynthRomanticMelody();
      }
    });

    // Populate the 6 song cards in the playlist modal
    renderPlaylistCards();

    // Update UI elements with initial track info
    updateTrackUI();

    // AUTOMATIC PLAY ON OPEN:
    // Attempt playback immediately when the site opens
    const tryAutoPlayImmediately = () => {
      if (audioPlayer && audioPlayer.src) {
        const playPromise = audioPlayer.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            isMusicPlaying = true;
            hasAutoStarted = true;
            updateTrackUI();
          }).catch((err) => {
            console.log("Browser policy held immediate audio, waiting for user gesture:", err);
            // If the browser held automatic audio on initial page load, arm high-priority listeners
            // for any user interaction (click, touch, pointer, scroll, key) to start immediately
            const triggerAutoplayOnGesture = (e) => {
              const isVideoTarget = e && e.target && e.target.closest && (
                e.target.closest('[data-type="video"]') || 
                e.target.closest('video')
              );
              if (isVideoTarget) {
                hasAutoStarted = true;
                wasMusicPlayingBeforeVideo = true;
              } else if (!isMusicPlaying) {
                startMusic();
              }
              ['click', 'touchstart', 'pointerdown', 'keydown', 'scroll'].forEach(evt => {
                window.removeEventListener(evt, triggerAutoplayOnGesture, { capture: true });
              });
            };

            ['click', 'touchstart', 'pointerdown', 'keydown', 'scroll'].forEach(evt => {
              window.addEventListener(evt, triggerAutoplayOnGesture, { capture: true, once: true });
            });
          });
        }
      }
    };

    tryAutoPlayImmediately();
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

    if (audioPlayer) {
      // Pause current track
      audioPlayer.pause();

      // Encode URI to handle spaces and accents seamlessly
      audioPlayer.src = encodeURI(track.src);
      audioPlayer.currentTime = 0;

      updateTrackUI();

      if (autoPlay || isMusicPlaying) {
        isMusicPlaying = true;

        const playPromise = audioPlayer.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            isMusicPlaying = true;
            updateTrackUI();
          }).catch((err) => {
            console.warn("Autoplay waiting for buffer, queuing canplay event:", err);
            const onCanPlay = () => {
              if (isMusicPlaying) {
                audioPlayer.play().then(() => {
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
    } else {
      const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
      selectTrack(prevIndex, true);
    }
  }

  function startMusic() {
    isMusicPlaying = true;
    hasAutoStarted = true;

    // Attempt HTML5 audio play
    if (audioPlayer && audioPlayer.src) {
      const playPromise = audioPlayer.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
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

      musicUploadInput.addEventListener('change', (e) => {
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
            isUserUploaded: true
          };

          // Add to beginning of playlist for immediate priority
          playlist.unshift(newTrack);

          updatePlaylistCount();
          renderPlaylistCards();

          // Immediately select and start playing the uploaded song in realtime
          selectTrack(0, true);
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
      floatingNoteBtn.addEventListener('click', openNoteModal);
    }
    const heroNoteBtn = document.getElementById('hero-note-btn');
    if (heroNoteBtn) {
      heroNoteBtn.addEventListener('click', openNoteModal);
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
        if (mediaModal && mediaModal.classList.contains('active')) {
          closeModal();
        }
        if (noteModal && noteModal.classList.contains('active')) {
          closeNoteModal();
        }
        if (playlistModal && playlistModal.classList.contains('active')) {
          closePlaylistModal();
        }
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
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
