// Letter
const envelope = document.getElementById('env-wrap');
const letterOverlay = document.getElementById('letter-overlay');
const letterClose = document.querySelector('.letter-close');

function openLetter() {
  letterOverlay.classList.add('show');
}

function closeLetter() {
  letterOverlay.classList.remove('show');
}

envelope.addEventListener('click', openLetter);

letterClose.addEventListener('click', closeLetter);

letterOverlay.addEventListener('click', function (event) {
  if (event.target === letterOverlay) {
    closeLetter();
  }
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    closeLetter();
  }
});
