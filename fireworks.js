// Fireworks
const cvs = document.getElementById('fw-canvas');
const cx  = cvs.getContext('2d');
function resizeFireworksCanvas() {
  const pixelRatio = window.devicePixelRatio || 1;

  cvs.width = window.innerWidth * pixelRatio;
  cvs.height = window.innerHeight * pixelRatio;

  cvs.style.width = `${window.innerWidth}px`;
  cvs.style.height = `${window.innerHeight}px`;

  cx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}
let fwParts = [];
let fwTimer, stopTimer;

function launchFireworks() {
  resizeFireworksCanvas();
  cvs.classList.add('show');
  for (let i = 0; i < 4; i++) setTimeout(burst, i * 180);
  fwTimer = setInterval(burst, 420);
  stopTimer = setTimeout(endFW, 2500);
  drawFW();
}

const FW_HUES = [36, 45, 130, 55, 28, 160, 50];

function burst() {
  const x = window.innerWidth * (0.1 + Math.random() * 0.8);
  const y = window.innerHeight * (0.05 + Math.random() * 0.5);
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
  setTimeout(() => { document.getElementById('env-wrap').classList.add('show'); }, 400);
}

window.addEventListener('resize', resizeFireworksCanvas);
