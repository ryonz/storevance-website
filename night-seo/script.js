const revealItems = document.querySelectorAll('.reveal');
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
  window.setTimeout(() => revealItems.forEach((item) => item.classList.add('is-visible')), 1200);
} else { revealItems.forEach((item) => item.classList.add('is-visible')); }
document.querySelector('.diagnosis-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.form-status');
  const formData = Object.fromEntries(new FormData(form));

  button.disabled = true;
  button.textContent = '送信しています…';
  status.textContent = '';

  try {
    const response = await fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const result = await response.json();

    if (!response.ok) throw new Error(result.message || '送信に失敗しました。');

    form.reset();
    status.textContent = 'お申し込みを受け付けました。確認メールをお送りしました。';
    button.textContent = 'お申し込みを受け付けました';
  } catch (error) {
    status.textContent = error.message || '送信に失敗しました。時間をおいて再度お試しください。';
    button.disabled = false;
    button.innerHTML = '無料で店舗診断を申し込む <span aria-hidden="true">→</span>';
  }
});
document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const track = carousel.querySelector('.store-compare');
  const move = (direction) => track.scrollBy({ left: direction * Math.max(track.clientWidth * 0.82, 240), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  carousel.querySelector('[data-carousel-prev]')?.addEventListener('click', () => move(-1));
  carousel.querySelector('[data-carousel-next]')?.addEventListener('click', () => move(1));
});
