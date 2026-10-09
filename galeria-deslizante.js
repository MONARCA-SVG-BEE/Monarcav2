/* Carrusel de fotografías Monarca */
document.addEventListener('DOMContentLoaded', () => {
  const gallery = document.querySelector('.monarca-gallery');
  if (!gallery) return;
  const track = gallery.querySelector('.monarca-gallery-track');
  const slides = Array.from(track.querySelectorAll('.monarca-gallery-slide'));
  const prev = gallery.querySelector('.monarca-gallery-prev');
  const next = gallery.querySelector('.monarca-gallery-next');
  const counter = gallery.querySelector('#monarcaGalleryCount');
  const dots = gallery.querySelector('#monarcaGalleryDots');
  let current = 0;
  if (!slides.length) return;

  slides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'monarca-gallery-dot';
    dot.setAttribute('aria-label', `Ir a fotografía ${index + 1}`);
    dot.addEventListener('click', () => show(index));
    dots.appendChild(dot);
  });

  function show(index) {
    current = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    counter.textContent = `${current + 1} / ${slides.length}`;
    Array.from(dots.children).forEach((dot, i) => {
      dot.setAttribute('aria-current', String(i === current));
    });
    slides.forEach((slide, i) => slide.setAttribute('aria-hidden', String(i !== current)));
  }
  prev.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));

  let touchX = null;
  track.addEventListener('touchstart', event => {
    touchX = event.changedTouches[0].screenX;
  }, { passive: true });
  track.addEventListener('touchend', event => {
    if (touchX === null) return;
    const delta = touchX - event.changedTouches[0].screenX;
    if (Math.abs(delta) > 40) show(current + (delta > 0 ? 1 : -1));
    touchX = null;
  }, { passive: true });
  gallery.setAttribute('tabindex', '0');
  gallery.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); }
  });
  show(0);
});
