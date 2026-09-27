/* ==========================================================================
   PUZZLE INTRO — Drag-and-drop & Tap-to-place jigsaw gate before site access
   Image: assets/images/lyka.jpg  •  Grid: 2 × 4  (8 pieces, Compact & Responsive)
   ========================================================================== */

(function () {
  'use strict';

  /* ── Config ──────────────────────────────────────────────────────────── */
  const IMG_SRC  = 'assets/images/lyka.jpg';
  const COLS     = 2;
  const ROWS     = 4;
  const TOTAL    = COLS * ROWS; // 8 pieces

  /* Exact image slice ratio: (952 / 2) / (1560 / 4) = 476 / 390 ≈ 1.2205 */
  const SLICE_RATIO = (952 / COLS) / (1560 / ROWS);

  /* Compact responsive piece sizing */
  function calcPieceDims() {
    const vw = window.innerWidth;
    let w;
    if (vw <= 360) {
      w = 44;
    } else if (vw <= 480) {
      w = 48;
    } else if (vw <= 768) {
      w = 54;
    } else {
      w = 60;
    }
    const h = Math.round(w / SLICE_RATIO);
    return { w, h };
  }

  let { w: PIECE_W, h: PIECE_H } = calcPieceDims();

  /* ── State ───────────────────────────────────────────────────────────── */
  let pieces          = [];   // { id, el, canvas, slotIndex }
  let slots           = [];   // { el, occupant: id | null }
  let trayPieces      = [];   // ids currently in tray
  let correctCount    = 0;
  let draggedId       = null;
  let touchPiece      = null;
  let touchClone      = null;
  let selectedPieceId = null; // for tap-to-select and tap-to-place
  let img             = null;

  /* ── DOM refs ────────────────────────────────────────────────────────── */
  let overlay, board, tray, progressFill, progressLabel;
  let questionModal;

  /* ── Unlock Key ──────────────────────────────────────────────────────── */
  const UNLOCKED_KEY = 'love_surprise_puzzle_unlocked';

  /* ── Entry point ─────────────────────────────────────────────────────── */
  function init() {
    if (document.documentElement.classList.contains('puzzle-already-unlocked') ||
        sessionStorage.getItem(UNLOCKED_KEY) === 'true') {
      const ov = document.getElementById('puzzle-overlay');
      const qm = document.getElementById('puzzle-question-modal');
      if (ov) ov.remove();
      if (qm) qm.remove();
      return;
    }
    buildDOM();
    loadImage();
    spawnHearts();
  }

  /* ── Build overlay DOM ───────────────────────────────────────────────── */
  function buildDOM() {
    overlay = document.getElementById('puzzle-overlay');
    if (!overlay) return;

    board          = overlay.querySelector('.puzzle-board');
    tray           = overlay.querySelector('.puzzle-tray');
    progressFill   = overlay.querySelector('.puzzle-progress-fill');
    progressLabel  = overlay.querySelector('.puzzle-progress-label');
    questionModal  = document.getElementById('puzzle-question-modal');

    /* Tray grid: 2 columns */
    tray.style.gridTemplateColumns = `repeat(${COLS}, ${PIECE_W}px)`;

    /* Board grid: 2 × 4 */
    board.style.gridTemplateColumns = `repeat(${COLS}, ${PIECE_W}px)`;
    board.style.gridTemplateRows    = `repeat(${ROWS}, ${PIECE_H}px)`;

    /* Create board drop slots */
    for (let i = 0; i < TOTAL; i++) {
      const slot = document.createElement('div');
      slot.className   = 'puzzle-slot';
      slot.dataset.idx = i;
      slot.style.width  = PIECE_W + 'px';
      slot.style.height = PIECE_H + 'px';
      setupSlotDrop(slot, i);
      board.appendChild(slot);
      slots.push({ el: slot, occupant: null });
    }

    /* Reset button */
    const resetBtn = overlay.querySelector('#puzzle-reset-btn') || overlay.querySelector('.puzzle-shuffle-btn');
    if (resetBtn) resetBtn.addEventListener('click', reshuffleTray);

    /* Question modal buttons */
    if (questionModal) {
      const yesBtn = questionModal.querySelector('#pq-yes-btn') || questionModal.querySelector('.question-btn.yes');
      const noBtn  = questionModal.querySelector('#pq-no-btn')  || questionModal.querySelector('.question-btn.no');

      if (yesBtn) yesBtn.addEventListener('click', onAnswerYes);
      if (noBtn)  noBtn.addEventListener('click', onAnswerNo);
    }
  }

  /* ── Load image & slice into canvases ───────────────────────────────── */
  function loadImage() {
    img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      createPieces();
      shuffleAndRender();
    };
    img.onerror = () => {
      // Fallback: colorful numbered pieces
      createFallbackPieces();
      shuffleAndRender();
    };
    img.src = IMG_SRC;
  }

  function createPieces() {
    pieces = [];
    trayPieces = [];
    for (let i = 0; i < TOTAL; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const canvas = document.createElement('canvas');
      canvas.width  = PIECE_W;
      canvas.height = PIECE_H;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        img,
        col * (img.naturalWidth  / COLS),
        row * (img.naturalHeight / ROWS),
        img.naturalWidth  / COLS,
        img.naturalHeight / ROWS,
        0, 0, PIECE_W, PIECE_H
      );
      const el = makePieceEl(i, canvas);
      pieces.push({ id: i, el, canvas, slotIndex: -1 });
      trayPieces.push(i);
    }
  }

  function createFallbackPieces() {
    const colors = [
      '#ff4d6d','#f4c27f','#a855f7','#3b82f6','#10b981','#f59e0b','#ec4899','#06b6d4'
    ];
    pieces = [];
    trayPieces = [];
    for (let i = 0; i < TOTAL; i++) {
      const canvas = document.createElement('canvas');
      canvas.width  = PIECE_W;
      canvas.height = PIECE_H;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(0, 0, PIECE_W, PIECE_H);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = `bold ${Math.round(PIECE_H * 0.4)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i + 1, PIECE_W / 2, PIECE_H / 2);
      const el = makePieceEl(i, canvas);
      pieces.push({ id: i, el, canvas, slotIndex: -1 });
      trayPieces.push(i);
    }
  }

  function makePieceEl(id, canvas) {
    const el = document.createElement('div');
    el.className        = 'puzzle-piece';
    el.dataset.pieceId  = id;
    el.style.width      = PIECE_W + 'px';
    el.style.height     = PIECE_H + 'px';
    el.appendChild(canvas);

    setupPieceDrag(el, id);
    setupPieceTouch(el, id);
    setupPieceClick(el, id);

    return el;
  }

  /* ── Click / Tap to select a piece ───────────────────────────────────── */
  function setupPieceClick(el, id) {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (selectedPieceId === id) {
        // Deselect
        deselectAll();
      } else {
        // Select this piece
        selectPiece(id);
      }
    });
  }

  function selectPiece(id) {
    deselectAll();
    selectedPieceId = id;
    const piece = pieces[id];
    if (piece && piece.el) {
      piece.el.classList.add('selected-piece');
    }
  }

  function deselectAll() {
    selectedPieceId = null;
    pieces.forEach(p => {
      if (p.el) p.el.classList.remove('selected-piece');
    });
  }

  /* ── Shuffle & place in tray ─────────────────────────────────────────── */
  function shuffleAndRender() {
    // Fisher–Yates shuffle
    for (let i = trayPieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [trayPieces[i], trayPieces[j]] = [trayPieces[j], trayPieces[i]];
    }
    tray.innerHTML = '';
    trayPieces.forEach(id => {
      const piece = pieces[id];
      piece.slotIndex = -1;
      tray.appendChild(piece.el);
    });
  }

  function reshuffleTray() {
    deselectAll();
    // Return all pieces from board back to tray
    slots.forEach((slot, idx) => {
      if (slot.occupant !== null) {
        const pid = slot.occupant;
        const piece = pieces[pid];
        if (piece.slotIndex === idx) piece.slotIndex = -1;
        slot.el.innerHTML = '';
        slot.el.classList.remove('filled', 'correct');
        slot.occupant = null;
        trayPieces.push(pid);
      }
    });
    correctCount = 0;
    updateProgress();
    shuffleAndRender();
  }

  /* ── Drag-and-drop (desktop) ─────────────────────────────────────────── */
  function setupPieceDrag(el, id) {
    el.setAttribute('draggable', 'true');

    el.addEventListener('dragstart', e => {
      draggedId = id;
      selectPiece(id);
      el.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
    });

    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
      draggedId = null;
    });
  }

  function setupSlotDrop(slotEl, idx) {
    slotEl.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      slotEl.classList.add('drag-over');
    });

    slotEl.addEventListener('dragleave', () => {
      slotEl.classList.remove('drag-over');
    });

    slotEl.addEventListener('drop', e => {
      e.preventDefault();
      slotEl.classList.remove('drag-over');
      const pid = parseInt(e.dataTransfer.getData('text/plain'), 10);
      placePiece(pid, idx);
      deselectAll();
    });

    /* Slot Click: if a piece is selected, place it here; else return occupant to tray */
    slotEl.addEventListener('click', (e) => {
      if (selectedPieceId !== null) {
        // Place selected piece into this slot
        placePiece(selectedPieceId, idx);
        deselectAll();
      } else if (slots[idx].occupant !== null) {
        // Return this piece to tray
        returnToTray(idx);
      }
    });
  }

  /* ── Touch drag (mobile) ─────────────────────────────────────────────── */
  function setupPieceTouch(el, id) {
    let moved = false;

    el.addEventListener('touchstart', e => {
      moved = false;
      touchPiece = { id, originEl: el };

      // Create floating ghost
      const rc = el.getBoundingClientRect();
      touchClone = el.cloneNode(true);
      touchClone.style.cssText = `
        position: fixed;
        width: ${PIECE_W}px;
        height: ${PIECE_H}px;
        left: ${rc.left}px;
        top: ${rc.top}px;
        z-index: 100000;
        opacity: 0.8;
        pointer-events: none;
        border-radius: 5px;
        box-shadow: 0 10px 24px rgba(255,77,109,0.6);
        transition: none;
      `;
      document.body.appendChild(touchClone);
      el.classList.add('dragging');
    }, { passive: true });

    el.addEventListener('touchmove', e => {
      moved = true;
      if (!touchClone) return;
      const t = e.touches[0];
      touchClone.style.left = (t.clientX - PIECE_W / 2) + 'px';
      touchClone.style.top  = (t.clientY - PIECE_H / 2) + 'px';

      // Highlight slot under finger
      touchClone.style.display = 'none';
      const target = document.elementFromPoint(t.clientX, t.clientY);
      touchClone.style.display = '';
      document.querySelectorAll('.puzzle-slot').forEach(s => s.classList.remove('drag-over'));
      const slotEl = target && target.closest('.puzzle-slot');
      if (slotEl) slotEl.classList.add('drag-over');
    }, { passive: true });

    el.addEventListener('touchend', e => {
      if (!touchClone || !touchPiece) return;
      const t = e.changedTouches[0];
      touchClone.remove();
      touchClone = null;
      touchPiece.originEl.classList.remove('dragging');

      if (moved) {
        // Find slot under finger
        const target = document.elementFromPoint(t.clientX, t.clientY);
        const slotEl = target && target.closest('.puzzle-slot');
        document.querySelectorAll('.puzzle-slot').forEach(s => s.classList.remove('drag-over'));

        if (slotEl) {
          const idx = parseInt(slotEl.dataset.idx, 10);
          placePiece(touchPiece.id, idx);
          deselectAll();
        }
      }
      touchPiece = null;
    }, { passive: true });
  }

  /* ── Core: place a piece into a slot ────────────────────────────────── */
  function placePiece(pid, slotIdx) {
    const slot  = slots[slotIdx];
    const piece = pieces[pid];

    // If slot already has this piece → nothing
    if (slot.occupant === pid) return;

    // If slot is occupied by another piece → return that piece to tray first
    if (slot.occupant !== null) returnToTray(slotIdx);

    // Remove from tray if present
    const trayIdx = trayPieces.indexOf(pid);
    if (trayIdx !== -1) {
      trayPieces.splice(trayIdx, 1);
      piece.el.remove();
    }

    // Remove from previous slot
    if (piece.slotIndex !== -1 && piece.slotIndex !== slotIdx) {
      const prevSlot = slots[piece.slotIndex];
      prevSlot.el.innerHTML = '';
      prevSlot.el.classList.remove('filled', 'correct');
      if (prevSlot.occupant === pid) {
        prevSlot.occupant = null;
        if (piece.slotIndex === pid) {
          correctCount = Math.max(0, correctCount - 1);
        }
      }
    }

    // Place into target slot
    slot.el.innerHTML = '';
    slot.el.appendChild(piece.el);
    slot.el.classList.add('filled');
    slot.occupant   = pid;
    piece.slotIndex = slotIdx;

    // Check correctness (correct slot index === piece id)
    if (slotIdx === pid) {
      slot.el.classList.add('correct');
      correctCount++;
    } else {
      slot.el.classList.remove('correct');
    }

    updateProgress();
    if (correctCount === TOTAL) onPuzzleComplete();
  }

  function returnToTray(slotIdx) {
    const slot = slots[slotIdx];
    if (slot.occupant === null) return;
    const pid   = slot.occupant;
    const piece = pieces[pid];

    if (slotIdx === pid) {
      correctCount = Math.max(0, correctCount - 1);
    }
    slot.el.innerHTML = '';
    slot.el.classList.remove('filled', 'correct');
    slot.occupant    = null;
    piece.slotIndex  = -1;
    trayPieces.push(pid);
    tray.appendChild(piece.el);
    updateProgress();
  }

  /* ── Progress ────────────────────────────────────────────────────────── */
  function updateProgress() {
    const pct = Math.round((correctCount / TOTAL) * 100);
    if (progressFill)  progressFill.style.width = pct + '%';
    if (progressLabel) progressLabel.textContent = `${correctCount} / ${TOTAL} pieces placed`;
  }

  /* ── Puzzle complete → show question ─────────────────────────────────── */
  function onPuzzleComplete() {
    spawnConfetti();
    setTimeout(() => {
      if (questionModal) {
        questionModal.classList.add('show');
        questionModal.setAttribute('aria-hidden', 'false');
      }
    }, 550);
  }

  /* ── Question answer handlers ────────────────────────────────────────── */
  function onAnswerYes() {
    sessionStorage.setItem(UNLOCKED_KEY, 'true');
    localStorage.setItem(UNLOCKED_KEY, 'true');
    document.documentElement.classList.add('puzzle-already-unlocked');
    spawnConfetti();

    // Trigger music to start as the entire website is now unlocked
    window.dispatchEvent(new CustomEvent('puzzleUnlockedStartMusic'));

    // Dismiss question modal and puzzle overlay to reveal website
    if (questionModal) questionModal.classList.remove('show');
    setTimeout(() => {
      overlay.classList.add('hidden');
      setTimeout(() => {
        overlay.remove();
        if (questionModal) questionModal.remove();
      }, 700);
    }, 250);
  }

  const wrongHints = [
    'Wrong answer! Dili ka maka-access 🙅‍♀️',
    'Hala, sayop! Reconsider palihog 💕',
    'Dili pwede mosud kung dili ikaw Liks! 🥺',
    'Sure ka? Try again~ Click Yes aron maka-access! 😘',
  ];
  let wrongCount = 0;

  function onAnswerNo() {
    const noBtn   = questionModal.querySelector('.question-btn.no');
    const hintEl  = questionModal.querySelector('.wrong-hint');

    noBtn.classList.remove('shake');
    void noBtn.offsetWidth; // trigger reflow
    noBtn.classList.add('shake');

    wrongCount++;
    if (hintEl) {
      hintEl.textContent = wrongHints[(wrongCount - 1) % wrongHints.length];
    }

    // After wrong answers, draw attention to the Yes button
    if (wrongCount >= 2) {
      const yesBtn = questionModal.querySelector('.question-btn.yes');
      if (yesBtn) {
        yesBtn.style.animation = 'questionIconBounce 0.8s ease infinite';
      }
    }
  }

  /* ── Confetti burst ──────────────────────────────────────────────────── */
  const confettiColors = [
    '#ff4d6d','#f4c27f','#a855f7','#60a5fa','#34d399',
    '#fbbf24','#f472b6','#38bdf8'
  ];

  function spawnConfetti() {
    for (let i = 0; i < 45; i++) {
      setTimeout(() => {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left  = Math.random() * 100 + 'vw';
        piece.style.top   = (Math.random() * 35 + 10) + 'vh';
        piece.style.background = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        piece.style.animationDuration = (0.8 + Math.random() * 0.7) + 's';
        piece.style.animationDelay    = (Math.random() * 0.25) + 's';
        document.body.appendChild(piece);
        piece.addEventListener('animationend', () => piece.remove());
      }, i * 16);
    }
  }

  /* ── Floating hearts ─────────────────────────────────────────────────── */
  function spawnHearts() {
    const heartChars = ['💖','💗','💓','✨','🌸'];
    for (let i = 0; i < 12; i++) {
      const h = document.createElement('div');
      h.className   = 'puzzle-heart';
      h.textContent = heartChars[Math.floor(Math.random() * heartChars.length)];
      h.style.left  = Math.random() * 100 + 'vw';
      h.style.bottom = '-20px';
      h.style.animationDelay    = (Math.random() * 5) + 's';
      h.style.animationDuration = (5 + Math.random() * 4) + 's';
      h.style.fontSize = (11 + Math.random() * 12) + 'px';
      overlay.appendChild(h);
    }
  }

  /* ── Kick off ────────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();


