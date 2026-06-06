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
