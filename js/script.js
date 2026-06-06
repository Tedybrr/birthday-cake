// Particles
const pEl = document.getElementById('particles');
const pColors = ['#c47c1a','#e8a832','#f5c842','#3e7a54','#5a8a60','#f7edd8'];
for (let i = 0; i < 38; i++) {
  const p = document.createElement('div');
  p.className = 'particle';
  const sz = Math.random() * 4 + 1.5;
  const color = pColors[Math.floor(Math.random() * pColors.length)];
  p.style.cssText = `width:${sz}px;height:${sz}px;background:${color};top:${Math.random()*100}%;left:${Math.random()*100}%;--d:${(Math.random()*6+4).toFixed(1)}s;--dl:${(Math.random()*6).toFixed(1)}s`;
  pEl.appendChild(p);
}

// State
let candlesBlown = 0;
const TOTAL = 3;
let detecting = false;

// ── Mic — iOS Safari compatible ──────────────────────────
// Key rules for iOS Safari:
// 1. AudioContext must be created synchronously inside a user gesture handler
// 2. getUserMedia must be called after AudioContext creation
// 3. No await before AudioContext creation
const micBtn  = document.getElementById('micBtn');
const micHint = document.getElementById('micHint');

micBtn.addEventListener('click', startMic);
micBtn.addEventListener('touchend', function(e) {
  e.preventDefault(); // prevent ghost click on iOS
  startMic();
}, { passive: false });

let audioCtx, analyser;

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
  micHint.textContent = '👆 tap each candle to blow it out';
  document.querySelectorAll('.candle').forEach((c, i) => {
    c.style.cursor = 'pointer';
    const handler = () => { blowNext(); c.removeEventListener('click', handler); c.removeEventListener('touchend', handler); };
    c.addEventListener('click', handler);
    c.addEventListener('touchend', handler, { passive: true });
  });
}

// Blow logic
function blowNext() {
  if (candlesBlown >= TOTAL) return;
  const idx = ++candlesBlown;
  extinguish(idx);
  if (candlesBlown >= TOTAL) {
    micBtn.classList.remove('active');
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

// Fireworks
const cvs = document.getElementById('fw-canvas');
const cx  = cvs.getContext('2d');
let fwParts = [];
let fwTimer, stopTimer;

function launchFireworks() {
  cvs.width = window.innerWidth;
  cvs.height = window.innerHeight;
  cvs.classList.add('show');
  for (let i = 0; i < 4; i++) setTimeout(burst, i * 180);
  fwTimer = setInterval(burst, 420);
  stopTimer = setTimeout(endFW, 10000);
  drawFW();
}

const FW_HUES = [36, 45, 130, 55, 28, 160, 50];

function burst() {
  const x = cvs.width  * (.1 + Math.random() * .8);
  const y = cvs.height * (.05 + Math.random() * .5);
  const hue = FW_HUES[Math.floor(Math.random() * FW_HUES.length)];
  const n = 70 + Math.floor(Math.random() * 50);
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 / n) * i + (Math.random() - .5) * .4;
    const spd = 1.8 + Math.random() * 3.8;
    fwParts.push({
      x, y,
      vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
      hue: hue + (Math.random() - .5) * 30,
      alpha: 1, size: 1.5 + Math.random() * 2.5,
      grav: .035 + Math.random() * .04,
      trail: []
    });
  }
}

function drawFW() {
  if (!cvs.classList.contains('show')) return;
  cx.clearRect(0, 0, cvs.width, cvs.height);
  fwParts.forEach(p => {
    p.trail.push({ x: p.x, y: p.y, a: p.alpha });
    if (p.trail.length > 6) p.trail.shift();
    p.x += p.vx; p.y += p.vy;
    p.vy += p.grav; p.vx *= 0.97;
    p.alpha -= 0.017;
    p.trail.forEach((t, ti) => {
      cx.beginPath();
      cx.arc(t.x, t.y, p.size * .4, 0, Math.PI * 2);
      cx.fillStyle = `hsla(${p.hue},65%,65%,${t.a * .25 * ((ti+1)/p.trail.length)})`;
      cx.fill();
    });
    cx.beginPath();
    cx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    cx.fillStyle = `hsla(${p.hue},70%,72%,${p.alpha})`;
    cx.fill();
  });
  fwParts = fwParts.filter(p => p.alpha > 0);
  requestAnimationFrame(drawFW);
}

function endFW() {
  clearInterval(fwTimer);
  cvs.style.transition = 'opacity 1.8s';
  cvs.style.opacity = '0';
  setTimeout(() => { cvs.classList.remove('show'); cvs.style.cssText = ''; }, 1900);
  setTimeout(() => { document.getElementById('env-wrap').classList.add('show'); }, 900);
}

// Letter
function openLetter()  { document.getElementById('letter-overlay').classList.add('show'); }
function closeLetter() { document.getElementById('letter-overlay').classList.remove('show'); }
function handleOverlayClick(e) {
  if (e.target === document.getElementById('letter-overlay')) closeLetter();
}

window.addEventListener('resize', () => {
  cvs.width = window.innerWidth;
  cvs.height = window.innerHeight;
});
