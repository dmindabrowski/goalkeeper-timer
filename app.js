(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const timeEl = $('time');
  const statusEl = $('statusLabel');
  const rotationEl = $('rotationCount');
  const ringEl = $('ringProgress');
  const startPauseBtn = $('startPauseBtn');
  const startPauseLabel = $('startPauseLabel');
  const resetBtn = $('resetBtn');
  const nextBtn = $('nextBtn');
  const minutesInput = $('minutesInput');
  const secondsInput = $('secondsInput');
  const warnInput = $('warnInput');
  const testSoundBtn = $('testSoundBtn');
  const soundSelect = $('soundSelect');
  const autoRestartInput = $('autoRestart');
  const vibrateInput = $('vibrate');
  const wakeLockInput = $('wakeLock');
  const fullscreenBtn = $('focusBtn');
  const langBtn = $('langBtn');
  const langLabel = $('langLabel');
  const copyYear = $('copyYear');
  const modeBadge = $('modeBadge');
  const modeBadgeText = $('modeBadgeText');
  const passwordModal = $('passwordModal');
  const passwordInput = $('passwordInput');
  const passwordError = $('passwordError');
  const passwordSubmit = $('passwordSubmit');
  const passwordCancel = $('passwordCancel');
  const hostInvite = $('hostInvite');
  const qrContainer = $('qrContainer');
  const inviteUrl = $('inviteUrl');
  const copyUrlBtn = $('copyUrlBtn');
  const clientCountEl = $('clientCount');
  const timerCard = document.querySelector('.timer-card');
  const presetBtns = document.querySelectorAll('.chip[data-preset]');
  const modeChips = document.querySelectorAll('.mode-chip[data-mode]');

  const HOST_PASSWORD = 'dd';
  const MODE_KEY = 'gk-timer-mode-v1';

  const RING_CIRC = 2 * Math.PI * 92; // 578.05
  ringEl.style.strokeDasharray = String(RING_CIRC);

  const STORE_KEY = 'gk-timer-settings-v1';
  const defaults = {
    duration: 300,
    warn: 10,
    autoRestart: true,
    vibrate: true,
    wakeLock: true,
    sound: 'alarm',
  };

  const state = {
    duration: defaults.duration,
    remainingMs: defaults.duration * 1000,
    running: false,
    rafId: null,
    lastTick: 0,
    endAt: 0,
    warnSec: defaults.warn,
    warnedAt: null,
    finished: false,
    rotation: 0,
    wakeLock: null,
    sound: 'alarm',
    lang: 'pl',
    mode: 'local',
  };

  // ---------- i18n ----------
  const I18N = {
    pl: {
      modeGame: 'Gra',
      modeSettings: 'Ustawienia',
      statusReady: 'Gotowe',
      statusCountdown: 'Odliczanie',
      statusPaused: 'Pauza',
      statusFinished: 'Zmiana!',
      btnStart: 'Start',
      btnResume: 'Wznów',
      btnPause: 'Pauza',
      btnReset: 'Reset',
      btnNext: 'Następna zmiana',
      btnPlaySound: 'Odtwórz dźwięk',
      labelDuration: 'Czas zmiany',
      labelWarning: 'Sygnał dźwiękowy przed końcem',
      labelSoundType: 'Rodzaj dźwięku',
      labelAutoRestart: 'Auto-restart po zmianie',
      labelVibration: 'Wibracje (mobile)',
      labelWakeLock: 'Nie usypiaj ekranu',
      labelRotation: 'Zmiana',
      unitMin: 'min',
      unitSec: 'sek',
      soundAlarm: 'Alarm',
      soundWhistle: 'Gwizdek',
      soundSiren: 'Syrena',
      titleSuffix: 'Goalkeeper Timer',
      labelMode: 'Tryb',
      modeLocal: 'Lokalny',
      modeHost: 'Host',
      modeClient: 'Klient',
      badgeHosting: 'Nadawanie',
      badgeViewing: 'Podgląd',
      btnExit: 'Wyjdź',
      btnCancel: 'Anuluj',
      btnOk: 'OK',
      hostPasswordTitle: 'Hasło hosta',
      hostPasswordHint: 'Podaj hasło, żeby uruchomić tryb Host.',
      hostPasswordWrong: 'Nieprawidłowe hasło.',
      modeLocalHint: 'Timer działa tylko na tym urządzeniu. Nic nie jest wysyłane.',
      modeHostHint: 'Nadaje stan timera do wszystkich urządzeń w trybie Klient (wymaga hasła).',
      modeClientHint: 'Widok tylko-do-odczytu timera hosta — bez ustawień, bez przycisków.',
      labelInvite: 'Zaproś klientów',
      inviteHint: 'Zeskanuj QR aby dołączyć jako klient',
      btnCopy: 'Kopiuj',
      btnCopied: 'Skopiowano',
    },
    en: {
      modeGame: 'Game',
      modeSettings: 'Settings',
      statusReady: 'Ready',
      statusCountdown: 'Counting down',
      statusPaused: 'Paused',
      statusFinished: 'Rotate!',
      btnStart: 'Start',
      btnResume: 'Resume',
      btnPause: 'Pause',
      btnReset: 'Reset',
      btnNext: 'Next rotation',
      btnPlaySound: 'Play sound',
      labelDuration: 'Rotation time',
      labelWarning: 'End warning sound',
      labelSoundType: 'Sound type',
      labelAutoRestart: 'Auto-restart after rotation',
      labelVibration: 'Vibration (mobile)',
      labelWakeLock: 'Keep screen awake',
      labelRotation: 'Rotation',
      unitMin: 'min',
      unitSec: 'sec',
      soundAlarm: 'Alarm',
      soundWhistle: 'Whistle',
      soundSiren: 'Siren',
      titleSuffix: 'Goalkeeper Timer',
      labelMode: 'Mode',
      modeLocal: 'Local',
      modeHost: 'Host',
      modeClient: 'Client',
      badgeHosting: 'Broadcasting',
      badgeViewing: 'Viewing',
      btnExit: 'Exit',
      btnCancel: 'Cancel',
      btnOk: 'OK',
      hostPasswordTitle: 'Host password',
      hostPasswordHint: 'Enter password to enable Host mode.',
      hostPasswordWrong: 'Wrong password.',
      modeLocalHint: 'Timer runs only on this device. Nothing is broadcast.',
      modeHostHint: 'Broadcasts timer state to every Client device (password required).',
      modeClientHint: 'Read-only view of host timer — no settings, no buttons.',
      labelInvite: 'Invite clients',
      inviteHint: 'Scan the QR to join as a client',
      btnCopy: 'Copy',
      btnCopied: 'Copied',
    },
  };

  function t(key) {
    const dict = I18N[state.lang] || I18N.pl;
    return dict[key] || key;
  }

  function applyTranslations() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (key) el.setAttribute('title', t(key));
    });
    const otherLang = state.lang === 'pl' ? 'EN' : 'PL';
    if (langLabel) langLabel.textContent = otherLang;
    updateModeUI();
    render();
  }

  // ---------- Persistence ----------
  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (Number.isFinite(s.duration) && s.duration > 0) state.duration = s.duration;
      if (Number.isFinite(s.warn) && s.warn > 0) state.warnSec = s.warn;
      if (typeof s.autoRestart === 'boolean') autoRestartInput.checked = s.autoRestart;
      if (typeof s.vibrate === 'boolean') vibrateInput.checked = s.vibrate;
      if (typeof s.wakeLock === 'boolean') wakeLockInput.checked = s.wakeLock;
      if (typeof s.sound === 'string' && SOUNDS[s.sound]) state.sound = s.sound;
      if (s.lang === 'pl' || s.lang === 'en') state.lang = s.lang;
    } catch { /* ignore */ }
  }
  function saveSettings() {
    const s = {
      duration: state.duration,
      warn: state.warnSec,
      autoRestart: autoRestartInput.checked,
      vibrate: vibrateInput.checked,
      wakeLock: wakeLockInput.checked,
      sound: state.sound,
      lang: state.lang,
    };
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
  }

  // ---------- Firebase realtime (Host / Client) ----------
  let fbApp = null;
  let fbDb = null;
  let stateRef = null;
  let presenceRef = null;
  let clientsRef = null;
  let clientEntryRef = null;
  let clientsListener = null;
  let unsubscribeState = null;
  let serverTimeOffset = 0;
  let suppressPublish = false;

  function now() { return Date.now() + serverTimeOffset; }

  function ensureFirebase() {
    if (fbApp) return fbApp;
    if (typeof firebase === 'undefined' || !window.__FIREBASE_CONFIG__) return null;
    try {
      fbApp = firebase.initializeApp(window.__FIREBASE_CONFIG__);
      fbDb = firebase.database();
      stateRef = fbDb.ref('session/state');
      presenceRef = fbDb.ref('session/hostPresence');
      clientsRef = fbDb.ref('session/clients');
      fbDb.ref('.info/serverTimeOffset').on('value', (snap) => {
        serverTimeOffset = snap.val() || 0;
      });
      return fbApp;
    } catch (err) {
      console.warn('[firebase] init failed:', err);
      return null;
    }
  }

  function publishState() {
    if (state.mode !== 'host' || !stateRef) return;
    const payload = {
      running: !!state.running,
      endAt: state.running ? state.endAt : null,
      remainingMs: state.remainingMs,
      duration: state.duration,
      warnSec: state.warnSec,
      sound: state.sound,
      rotation: state.rotation,
      finished: !!state.finished,
      hostAt: firebase.database.ServerValue.TIMESTAMP,
    };
    stateRef.set(payload).catch((err) => console.warn('[firebase] publish:', err));
  }

  function applyRemoteState(s) {
    if (!s) return;
    suppressPublish = true;
    try {
      if (SOUNDS[s.sound]) state.sound = s.sound;
      if (Number.isFinite(s.duration) && s.duration > 0) state.duration = s.duration;
      if (Number.isFinite(s.warnSec) && s.warnSec > 0) state.warnSec = s.warnSec;
      if (Number.isFinite(s.rotation)) state.rotation = s.rotation;
      const wasRunning = state.running;
      const wasFinished = state.finished;
      state.finished = !!s.finished;

      if (s.running && Number.isFinite(s.endAt)) {
        state.running = true;
        state.endAt = s.endAt;
        state.remainingMs = Math.max(0, s.endAt - now());
        state.warnedAt = state.remainingMs / 1000 <= state.warnSec ? now() : null;
        if (!wasRunning) {
          ensureAudio();
          state.rafId = requestAnimationFrame(tick);
        }
      } else {
        state.running = false;
        cancelAnimationFrame(state.rafId);
        state.remainingMs = Number.isFinite(s.remainingMs) ? s.remainingMs : state.duration * 1000;
      }

      if (state.finished && !wasFinished) {
        timerCard.classList.remove('flash');
        void timerCard.offsetWidth;
        timerCard.classList.add('flash');
        vibrate([500, 100, 500]);
      }

      minutesInput.value = String(Math.floor(state.duration / 60));
      secondsInput.value = String(state.duration % 60);
      warnInput.value = String(state.warnSec);
      soundSelect.value = state.sound;
      updatePresetActive();
      render();
    } finally {
      suppressPublish = false;
    }
  }

  function subscribeAsClient() {
    if (!stateRef) return;
    unsubscribeClient();
    unsubscribeState = stateRef.on('value', (snap) => applyRemoteState(snap.val()));
  }

  function unsubscribeClient() {
    if (stateRef && unsubscribeState) {
      stateRef.off('value', unsubscribeState);
      unsubscribeState = null;
    }
  }

  function setHostPresence(online) {
    if (!presenceRef) return;
    if (online) {
      presenceRef.set({ online: true, lastSeen: firebase.database.ServerValue.TIMESTAMP });
      presenceRef.onDisconnect().set({ online: false, lastSeen: firebase.database.ServerValue.TIMESTAMP });
    } else {
      presenceRef.set({ online: false, lastSeen: firebase.database.ServerValue.TIMESTAMP });
      presenceRef.onDisconnect().cancel();
    }
  }

  function registerClientPresence() {
    if (!clientsRef || clientEntryRef) return;
    clientEntryRef = clientsRef.push();
    clientEntryRef.set({ joinedAt: firebase.database.ServerValue.TIMESTAMP });
    clientEntryRef.onDisconnect().remove();
  }

  function unregisterClientPresence() {
    if (!clientEntryRef) return;
    try { clientEntryRef.onDisconnect().cancel(); } catch { /* ignore */ }
    clientEntryRef.remove().catch(() => {});
    clientEntryRef = null;
  }

  function subscribeClientCount() {
    if (!clientsRef || clientsListener) return;
    clientsListener = clientsRef.on('value', (snap) => {
      if (clientCountEl) clientCountEl.textContent = String(snap.numChildren() || 0);
    });
  }

  function unsubscribeClientCount() {
    if (clientsRef && clientsListener) {
      clientsRef.off('value', clientsListener);
      clientsListener = null;
    }
    if (clientCountEl) clientCountEl.textContent = '0';
  }

  function buildClientUrl() {
    const url = new URL(window.location.href);
    url.search = '?mode=client';
    url.hash = '';
    return url.toString();
  }

  function generateInviteQR() {
    if (!qrContainer) return;
    const clientUrl = buildClientUrl();
    if (inviteUrl) inviteUrl.value = clientUrl;
    if (typeof window.qrcode === 'function') {
      try {
        const qr = window.qrcode(0, 'M');
        qr.addData(clientUrl);
        qr.make();
        qrContainer.innerHTML = qr.createSvgTag({ margin: 2, scalable: true });
      } catch (err) {
        console.warn('[qr] generation failed:', err);
        qrContainer.textContent = clientUrl;
      }
    } else {
      qrContainer.textContent = clientUrl;
    }
  }

  function updateModeUI() {
    document.body.classList.toggle('host-mode', state.mode === 'host');
    document.body.classList.toggle('client-mode', state.mode === 'client');
    if (modeBadge) {
      modeBadge.classList.remove('badge-local', 'badge-host', 'badge-client');
      modeBadge.classList.add('badge-' + state.mode);
    }
    if (modeBadgeText) {
      const key = state.mode === 'host' ? 'modeHost'
                : state.mode === 'client' ? 'modeClient'
                : 'modeLocal';
      modeBadgeText.textContent = t(key);
    }
    if (hostInvite) hostInvite.hidden = state.mode !== 'host';
    if (state.mode === 'client') {
      document.body.classList.add('focus-mode');
    }
    modeChips.forEach((c) => c.classList.toggle('active', c.dataset.mode === state.mode));
  }

  function enterMode(newMode) {
    if (state.mode === newMode) return;

    // Tear down previous mode
    if (state.mode === 'host') {
      setHostPresence(false);
      unsubscribeClientCount();
    }
    if (state.mode === 'client') {
      unsubscribeClient();
      unregisterClientPresence();
      // Reset visible timer so a stale broadcast state doesn't linger.
      cancelAnimationFrame(state.rafId);
      state.running = false;
      state.finished = false;
      state.remainingMs = state.duration * 1000;
    }

    state.mode = newMode;
    try { localStorage.setItem(MODE_KEY, newMode); } catch { /* ignore */ }

    // Set up new mode
    if (newMode === 'host' || newMode === 'client') {
      if (!ensureFirebase()) {
        console.warn('[firebase] not available; falling back to local mode');
        state.mode = 'local';
        try { localStorage.setItem(MODE_KEY, 'local'); } catch { /* ignore */ }
      }
    }

    if (state.mode === 'host') {
      setHostPresence(true);
      publishState();
      generateInviteQR();
      subscribeClientCount();
    } else if (state.mode === 'client') {
      ensureAudio();
      subscribeAsClient();
      registerClientPresence();
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    updateModeUI();
    render();
  }

  function openPasswordModal() {
    if (!passwordModal) return;
    passwordModal.hidden = false;
    if (passwordError) passwordError.hidden = true;
    if (passwordInput) {
      passwordInput.value = '';
      setTimeout(() => passwordInput.focus(), 30);
    }
  }

  function closePasswordModal() {
    if (passwordModal) passwordModal.hidden = true;
  }

  function submitPassword() {
    const val = passwordInput ? passwordInput.value.trim() : '';
    if (val === HOST_PASSWORD) {
      closePasswordModal();
      enterMode('host');
    } else {
      if (passwordError) passwordError.hidden = false;
      if (passwordInput) passwordInput.select();
    }
  }

  // ---------- Audio ----------
  let audioCtx = null;
  const audioBuffers = {};   // decoded AudioBuffers, keyed by sound name
  const rawBuffers = {};     // fetched ArrayBuffers waiting for decode
  const sampleState = {};    // per-sample status: 'loading' | 'ready' | 'error:<msg>'

  const SAMPLES = {
    alarm:   { url: 'sounds/alarm.m4a',   pipDuration: 0.25, startOffset: 0,   leadTime: 0 },
    whistle: { url: 'sounds/gwizdek.m4a', pipDuration: 0.30, startOffset: 0,   leadTime: 3.0 },
    siren:   { url: 'sounds/syrena.m4a',  pipDuration: 0.25, startOffset: 3.0, leadTime: 0 },
  };

  function updateSoundStatus() {
    const el = document.getElementById('soundStatus');
    if (!el) return;
    const st = sampleState[state.sound];
    const cfg = SAMPLES[state.sound];
    if (!st) { el.textContent = ''; el.className = 'sound-status'; return; }
    if (st === 'ready') {
      const buf = audioBuffers[state.sound];
      const dur = buf ? buf.duration.toFixed(2) : '?';
      el.textContent = `✓ ${cfg.url} · ${dur}s`;
      el.className = 'sound-status ok';
    } else if (st === 'loading') {
      el.textContent = `… wczytuję ${cfg.url}`;
      el.className = 'sound-status';
    } else {
      el.textContent = `✗ ${cfg.url} — ${st.replace(/^error:/, '')}`;
      el.className = 'sound-status err';
    }
  }

  // Fetch raw bytes for all samples immediately (no AudioContext needed for fetch).
  function fetchSamples() {
    Object.entries(SAMPLES).forEach(([key, cfg]) => {
      sampleState[key] = 'loading';
      fetch(cfg.url, { cache: 'no-cache' })
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.arrayBuffer();
        })
        .then((buf) => {
          rawBuffers[key] = buf;
          if (audioCtx) decodeOne(key);
          else { sampleState[key] = 'loading'; updateSoundStatus(); }
        })
        .catch((err) => {
          sampleState[key] = 'error:' + (err && err.message ? err.message : String(err));
          console.warn(`[audio] fetch ${cfg.url}:`, err);
          updateSoundStatus();
        });
    });
  }

  function decodeOne(key) {
    if (!audioCtx || !rawBuffers[key]) return;
    const bytes = rawBuffers[key].slice(0); // clone: decodeAudioData detaches the buffer
    audioCtx.decodeAudioData(
      bytes,
      (decoded) => {
        audioBuffers[key] = decoded;
        sampleState[key] = 'ready';
        updateSoundStatus();
      },
      (err) => {
        sampleState[key] = 'error:decodeAudioData ' + (err && err.message ? err.message : 'nieznany bład');
        console.warn(`[audio] decode ${SAMPLES[key].url}:`, err);
        updateSoundStatus();
      }
    );
  }

  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
      if (audioCtx) {
        Object.keys(SAMPLES).forEach((k) => {
          if (rawBuffers[k] && !audioBuffers[k]) decodeOne(k);
        });
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  // Simple fallback pip for when a sample hasn't loaded yet.
  function tone(ctx, { freq = 880, duration = 0.15, type = 'sine', gain = 0.22, when = 0, attack = 0.02 } = {}) {
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  function playSample(ctx, key, when, maxDuration = null, gain = 1.0) {
    const buffer = audioBuffers[key];
    if (!buffer) {
      tone(ctx, { freq: 880, duration: maxDuration || 0.4, when });
      return;
    }
    const t0 = ctx.currentTime + when;
    const offset = Math.min(SAMPLES[key].startOffset || 0, Math.max(0, buffer.duration - 0.05));
    const available = buffer.duration - offset;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(ctx.destination);
    src.start(t0, offset);
    if (maxDuration !== null && maxDuration < available) {
      g.gain.setValueAtTime(gain, t0 + Math.max(0, maxDuration - 0.03));
      g.gain.linearRampToValueAtTime(0.0001, t0 + maxDuration);
      src.stop(t0 + maxDuration + 0.02);
    } else {
      src.stop(t0 + available + 0.05);
    }
  }

  // ---------- Sound presets ----------
  const SOUNDS = {
    alarm: {
      warn: (ctx, when) => playSample(ctx, 'alarm', when, SAMPLES.alarm.pipDuration, 0.9),
      end:  (ctx, when) => playSample(ctx, 'alarm', when, null, 1.0),
    },
    whistle: {
      warn: (ctx, when) => playSample(ctx, 'whistle', when, SAMPLES.whistle.pipDuration, 0.9),
      end:  (ctx, when) => playSample(ctx, 'whistle', when, null, 1.0),
    },
    siren: {
      warn: (ctx, when) => playSample(ctx, 'siren', when, SAMPLES.siren.pipDuration, 0.9),
      end:  (ctx, when) => playSample(ctx, 'siren', when, null, 1.0),
    },
  };

  function playWarningSequence(secondsLeft) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const preset = SOUNDS[state.sound] || SOUNDS.alarm;
    const cfg = SAMPLES[state.sound] || {};
    const leadTime = cfg.leadTime || 0;
    // Pips only fire before the end sound starts; when the sample IS the
    // countdown (leadTime > 0) there are fewer or no pips.
    const pipSeconds = Math.max(0, Math.floor(secondsLeft - leadTime));
    for (let i = 0; i < pipSeconds; i++) preset.warn(ctx, i * 1.0);
    preset.end(ctx, Math.max(0, secondsLeft - leadTime));
    scheduleVibration(secondsLeft);
  }

  function playEndOnly() {
    const ctx = ensureAudio();
    if (!ctx) return;
    (SOUNDS[state.sound] || SOUNDS.alarm).end(ctx, 0);
    vibrate([300, 120, 300, 120, 500]);
  }

  // ---------- Vibration (Android; iOS Safari does not support it) ----------
  function canVibrate() {
    return vibrateInput.checked && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  }

  function vibrate(pattern) {
    if (!canVibrate()) return false;
    try { return navigator.vibrate(pattern); } catch { return false; }
  }

  function scheduleVibration(secondsLeft) {
    if (!canVibrate()) return;
    // Build a single interleaved on/off pattern: short pulses for each warning second, then a strong final buzz.
    const pattern = [];
    for (let i = 0; i < secondsLeft; i++) {
      pattern.push(120);   // vibrate 120 ms
      pattern.push(880);   // wait ~880 ms — sums with 120 to ~1 s cadence
    }
    pattern.push(500);     // final long buzz
    pattern.push(100);
    pattern.push(500);
    navigator.vibrate(pattern);
  }

  // ---------- Wake Lock ----------
  async function requestWakeLock() {
    const shouldAcquire = state.mode === 'client' || wakeLockInput.checked;
    if (!shouldAcquire) return;
    if (!('wakeLock' in navigator)) return;
    try {
      state.wakeLock = await navigator.wakeLock.request('screen');
      state.wakeLock.addEventListener('release', () => { state.wakeLock = null; });
    } catch { /* ignored */ }
  }
  function releaseWakeLock() {
    if (state.wakeLock) {
      state.wakeLock.release().catch(() => {});
      state.wakeLock = null;
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && (state.running || state.mode === 'client')) requestWakeLock();
  });

  // ---------- Rendering ----------
  function fmt(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function render() {
    timeEl.textContent = fmt(state.remainingMs);
    const progress = Math.max(0, Math.min(1, state.remainingMs / (state.duration * 1000)));
    ringEl.style.strokeDashoffset = String(RING_CIRC * (1 - progress));

    const secLeft = state.remainingMs / 1000;
    timerCard.classList.toggle('state-warn', state.running && secLeft > 0 && secLeft <= state.warnSec);
    timerCard.classList.toggle('state-done', state.finished);
    timeEl.classList.toggle('pulse', state.running && secLeft > 0 && secLeft <= state.warnSec);

    if (state.finished) statusEl.textContent = t('statusFinished');
    else if (state.running) statusEl.textContent = t('statusCountdown');
    else if (state.remainingMs === state.duration * 1000) statusEl.textContent = t('statusReady');
    else statusEl.textContent = t('statusPaused');

    startPauseLabel.textContent = state.running
      ? t('btnPause')
      : (state.remainingMs === state.duration * 1000 ? t('btnStart') : t('btnResume'));
    startPauseBtn.classList.toggle('paused', !state.running && state.remainingMs !== state.duration * 1000 && !state.finished);

    rotationEl.textContent = String(state.rotation);
    document.title = `${fmt(state.remainingMs)} · ${t('titleSuffix')}`;
  }

  // ---------- Loop ----------
  function tick(ts) {
    if (!state.running) return;
    const t = now();
    state.remainingMs = Math.max(0, state.endAt - t);

    // Warning sound: trigger once when we cross into the warning window
    const secLeft = state.remainingMs / 1000;
    if (!state.warnedAt && secLeft > 0 && secLeft <= state.warnSec + 0.05) {
      state.warnedAt = t;
      const wholeSecondsLeft = Math.max(1, Math.ceil(secLeft));
      playWarningSequence(wholeSecondsLeft);
    }

    if (state.remainingMs <= 0) {
      finish();
      return;
    }
    render();
    state.rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (state.mode === 'client') return;
    if (state.running) return;
    if (state.finished) resetTimer(false);
    ensureAudio();
    if (canVibrate()) { try { navigator.vibrate(1); } catch { /* ignore */ } }
    state.running = true;
    state.endAt = now() + state.remainingMs;
    if (state.remainingMs > state.warnSec * 1000) state.warnedAt = null;
    requestWakeLock();
    state.rafId = requestAnimationFrame(tick);
    render();
    publishState();
  }

  function pause() {
    if (state.mode === 'client') return;
    if (!state.running) return;
    state.running = false;
    cancelAnimationFrame(state.rafId);
    releaseWakeLock();
    render();
    publishState();
  }

  function toggleStartPause() {
    if (state.running) pause(); else start();
  }

  function finish() {
    if (state.finished) return;
    state.running = false;
    state.finished = true;
    state.remainingMs = 0;
    cancelAnimationFrame(state.rafId);
    state.rotation += 1;

    if (!state.warnedAt) playEndOnly();
    else vibrate([500, 100, 500]);
    timerCard.classList.remove('flash');
    void timerCard.offsetWidth;
    timerCard.classList.add('flash');

    render();

    if (state.mode === 'client') return; // host drives the reset+start

    publishState();

    if (autoRestartInput.checked) {
      setTimeout(() => {
        resetTimer(false);
        start();
      }, 1200);
    } else {
      releaseWakeLock();
    }
  }

  function resetTimer(fullReset = true) {
    if (state.mode === 'client') return;
    cancelAnimationFrame(state.rafId);
    state.running = false;
    state.finished = false;
    state.warnedAt = null;
    state.remainingMs = state.duration * 1000;
    if (fullReset) state.rotation = 0;
    releaseWakeLock();
    render();
    publishState();
  }

  function nextRotation() {
    if (state.mode === 'client') return;
    cancelAnimationFrame(state.rafId);
    const wasRunning = state.running;
    state.running = false;
    state.finished = false;
    state.warnedAt = null;
    state.remainingMs = state.duration * 1000;
    state.rotation += 1;
    render();
    if (wasRunning) start();
    else publishState();
  }

  // ---------- Inputs ----------
  function readDurationFromInputs() {
    const m = Math.max(0, Math.min(60, parseInt(minutesInput.value || '0', 10) || 0));
    const s = Math.max(0, Math.min(59, parseInt(secondsInput.value || '0', 10) || 0));
    return Math.max(1, m * 60 + s);
  }

  function applyDuration(seconds, { fromPreset = false } = {}) {
    if (state.mode === 'client') return;
    state.duration = seconds;
    minutesInput.value = String(Math.floor(seconds / 60));
    secondsInput.value = String(seconds % 60);
    if (!state.running) {
      state.remainingMs = seconds * 1000;
      state.finished = false;
    }
    updatePresetActive(fromPreset ? seconds : null);
    saveSettings();
    render();
    publishState();
  }

  function updatePresetActive(matchSeconds) {
    presetBtns.forEach((b) => {
      const v = parseInt(b.dataset.preset, 10);
      b.classList.toggle('active', v === (matchSeconds ?? state.duration));
    });
  }

  minutesInput.addEventListener('change', () => applyDuration(readDurationFromInputs()));
  secondsInput.addEventListener('change', () => applyDuration(readDurationFromInputs()));
  minutesInput.addEventListener('input', () => applyDuration(readDurationFromInputs()));
  secondsInput.addEventListener('input', () => applyDuration(readDurationFromInputs()));

  warnInput.addEventListener('change', () => {
    const w = Math.max(1, Math.min(30, parseInt(warnInput.value || '5', 10) || 5));
    warnInput.value = String(w);
    state.warnSec = w;
    saveSettings();
    publishState();
  });

  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const v = parseInt(btn.dataset.preset, 10);
      applyDuration(v, { fromPreset: true });
    });
  });

  autoRestartInput.addEventListener('change', saveSettings);
  vibrateInput.addEventListener('change', () => {
    saveSettings();
    if (vibrateInput.checked && canVibrate()) { try { navigator.vibrate(60); } catch { /* ignore */ } }
  });
  wakeLockInput.addEventListener('change', () => {
    saveSettings();
    if (wakeLockInput.checked && state.running) requestWakeLock();
    else releaseWakeLock();
  });

  soundSelect.addEventListener('change', () => {
    if (SOUNDS[soundSelect.value]) {
      state.sound = soundSelect.value;
      saveSettings();
      updateSoundStatus();
      publishState();
    }
  });

  modeChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const target = chip.dataset.mode;
      if (target === state.mode) return;
      if (target === 'host') openPasswordModal();
      else if (target === 'local' || target === 'client') enterMode(target);
    });
  });

  copyUrlBtn && copyUrlBtn.addEventListener('click', async () => {
    if (!inviteUrl) return;
    const url = inviteUrl.value;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      inviteUrl.select();
      try { document.execCommand('copy'); } catch { /* ignore */ }
    }
    copyUrlBtn.classList.add('copied');
    copyUrlBtn.textContent = t('btnCopied');
    setTimeout(() => {
      copyUrlBtn.classList.remove('copied');
      copyUrlBtn.textContent = t('btnCopy');
    }, 1500);
  });

  passwordSubmit && passwordSubmit.addEventListener('click', submitPassword);
  passwordCancel && passwordCancel.addEventListener('click', closePasswordModal);
  passwordInput && passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submitPassword(); }
    else if (e.key === 'Escape') { e.preventDefault(); closePasswordModal(); }
  });

  // Fallback exit gesture in Client mode: 5 rapid taps on the timer.
  let clientTapTimes = [];
  timerCard && timerCard.addEventListener('click', () => {
    if (state.mode !== 'client') return;
    const t0 = Date.now();
    clientTapTimes = clientTapTimes.filter((t) => t0 - t < 2000);
    clientTapTimes.push(t0);
    if (clientTapTimes.length >= 5) {
      clientTapTimes = [];
      document.body.classList.remove('focus-mode');
      enterMode('local');
    }
  });

  startPauseBtn.addEventListener('click', toggleStartPause);
  resetBtn.addEventListener('click', () => resetTimer(true));
  nextBtn.addEventListener('click', nextRotation);
  testSoundBtn.addEventListener('click', () => {
    ensureAudio();
    playWarningSequence(3);
  });

  langBtn && langBtn.addEventListener('click', () => {
    state.lang = state.lang === 'pl' ? 'en' : 'pl';
    saveSettings();
    applyTranslations();
  });

  fullscreenBtn.addEventListener('click', async () => {
    if (state.mode === 'client') {
      document.body.classList.remove('focus-mode');
      enterMode('local');
      if (document.fullscreenElement) {
        try { await document.exitFullscreen(); } catch { /* ignore */ }
      }
      return;
    }
    const entering = !document.body.classList.contains('focus-mode');
    document.body.classList.toggle('focus-mode', entering);
    try {
      if (entering && !document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (!entering && document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch { /* iOS Safari has no requestFullscreen; focus-mode class still enlarges the UI */ }
  });
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) document.body.classList.remove('focus-mode');
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (state.mode === 'client') {
      if (e.key === 'Escape') {
        document.body.classList.remove('focus-mode');
        enterMode('local');
      }
      return;
    }
    if (e.code === 'Space') { e.preventDefault(); toggleStartPause(); }
    else if (e.key === 'r' || e.key === 'R') resetTimer(true);
    else if (e.key === 'n' || e.key === 'N') nextRotation();
    else if (e.key === 'f' || e.key === 'F') fullscreenBtn.click();
  });

  // ---------- Init ----------
  loadSettings();

  // URL ?mode=client takes priority over persisted mode — QR/deep-link join must win.
  const urlMode = new URLSearchParams(window.location.search).get('mode');
  let initialMode = 'local';
  if (urlMode === 'client') {
    initialMode = 'client';
  } else {
    try {
      const savedMode = localStorage.getItem(MODE_KEY);
      if (savedMode === 'host' || savedMode === 'client') initialMode = savedMode;
    } catch { /* ignore */ }
  }
  state.mode = initialMode;
  if (initialMode === 'client') {
    document.body.classList.add('client-mode', 'focus-mode');
  } else if (initialMode === 'host') {
    document.body.classList.add('host-mode');
  }

  minutesInput.value = String(Math.floor(state.duration / 60));
  secondsInput.value = String(state.duration % 60);
  warnInput.value = String(state.warnSec);
  soundSelect.value = state.sound;
  if (copyYear) copyYear.textContent = String(new Date().getFullYear());
  state.remainingMs = state.duration * 1000;
  updatePresetActive();
  applyTranslations();
  fetchSamples();

  // Firebase compat scripts load via defer — wait one tick so ensureFirebase() finds them.
  if (initialMode === 'host' || initialMode === 'client') {
    setTimeout(() => {
      // Bypass enterMode's identity guard so setup actually runs.
      state.mode = 'local';
      enterMode(initialMode);
    }, 0);
  } else {
    updateModeUI();
  }
})();
