// State
let candlesBlown = 0;
const TOTAL = 3;
let detecting = false;
let fallbackEnabled = false;

// ── Mic — iOS Safari compatible ──────────────────────────
// Key rules for iOS Safari:
// 1. AudioContext must be created synchronously inside a user gesture handler
// 2. getUserMedia must be called after AudioContext creation
// 3. No await before AudioContext creation
const micBtn  = document.getElementById('micBtn');
const micHint = document.getElementById('micHint');

micBtn.addEventListener('pointerup', function (event) {
  event.preventDefault();
  startMic();
});

let audioCtx, analyser, micStream;

function startMic() {
  if (detecting) return;

  // Create AudioContext synchronously inside gesture (iOS requirement)
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch(e) { fallbackTap(); return; }

  // Resume if suspended (iOS often starts suspended)
  const resumeAndGetMic = audioCtx.state === 'suspended'
    ? audioCtx.resume()
    : Promise.resolve();

  resumeAndGetMic.then(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      fallbackTap(); return;
    }
    return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  }).then(stream => {
    if (!stream) return;

    micStream = stream;

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.6;
    audioCtx.createMediaStreamSource(stream).connect(analyser);

    detecting = true;
    micBtn.classList.add('active');
    micHint.textContent = '🎤 listening… blow! 💨';
    detectBlow();
  }).catch(() => fallbackTap());
}

function detectBlow() {
  if (candlesBlown >= TOTAL) return;
  const buf = new Uint8Array(analyser.frequencyBinCount);
  let streak = 0;

  function tick() {
    if (candlesBlown >= TOTAL) return;
    analyser.getByteFrequencyData(buf);
    // Blowing creates energy in low-freq bins
    let sum = 0;
    for (let i = 1; i <= 40; i++) sum += buf[i];
    const avg = sum / 40;

    if (avg > 28) {
      streak++;
      if (streak >= 7) { blowNext(); streak = 0; }
    } else {
      streak = Math.max(0, streak - 2);
    }
    requestAnimationFrame(tick);
  }
  tick();
}

function fallbackTap() {
  if (fallbackEnabled) return;

  fallbackEnabled = true;
  detecting = false;
  micBtn.classList.remove('active');
  micHint.textContent = '👆 tap each candle to blow it out';

  document.querySelectorAll('.candle').forEach((candle) => {
    candle.style.cursor = 'pointer';

    const handler = () => {
      blowNext();
      candle.removeEventListener('click', handler);
      candle.removeEventListener('touchend', handler);
    };

    candle.addEventListener('click', handler);
    candle.addEventListener('touchend', handler, { passive: true });
  });
}

function stopMic() {
  detecting = false;
  micBtn.classList.remove('active');

  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }

  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
  }
}

// Blow logic
function blowNext() {
  if (candlesBlown >= TOTAL) return;
  const idx = ++candlesBlown;
  extinguish(idx);
  if (candlesBlown >= TOTAL) {
    stopMic();
    micHint.textContent = '✨ wish made!';
    setTimeout(launchFireworks, 600);
  }
}

function extinguish(idx) {
  const flame = document.getElementById('f' + idx);
  if (!flame) return;
  flame.style.opacity = '0';
  flame.style.transform = 'scaleY(0)';
  const candle = document.getElementById('c' + idx);
  const sm = document.createElement('div');
  sm.className = 'smoke';
  candle.appendChild(sm);
  setTimeout(() => sm.classList.add('puff'), 40);
  setTimeout(() => sm.remove(), 1600);
}
