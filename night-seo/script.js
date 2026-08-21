const revealItems = document.querySelectorAll('.reveal');
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
  window.setTimeout(() => revealItems.forEach((item) => item.classList.add('is-visible')), 1200);
} else { revealItems.forEach((item) => item.classList.add('is-visible')); }
document.querySelector('.diagnosis-form')?.addEventListener('submit', (event) => { event.preventDefault(); const button = event.currentTarget.querySelector('button'); button.textContent = '送信ありがとうございます'; button.disabled = true; });
document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const track = carousel.querySelector('.store-compare');
  const move = (direction) => track.scrollBy({ left: direction * Math.max(track.clientWidth * 0.82, 240), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  carousel.querySelector('[data-carousel-prev]')?.addEventListener('click', () => move(-1));
  carousel.querySelector('[data-carousel-next]')?.addEventListener('click', () => move(1));
});
