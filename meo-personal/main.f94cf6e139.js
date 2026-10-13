const form = document.querySelector('#contact-form');
const dialog = document.querySelector('#confirm-dialog');
const error = document.querySelector('#form-error');
const sendError = document.querySelector('#send-error');
const sendButton = document.querySelector('#send-contact');
const fields = { name: 'お名前', email: 'メールアドレス', store: '店舗名', purpose: 'ご相談内容', message: 'お問い合わせ内容' };
let payload, signature = '', requestId, sending = false;
form.addEventListener('submit', event => {
  event.preventDefault();
  error.textContent = '';
  for (const input of form.querySelectorAll('input,select,textarea')) {
    if (input.type !== 'checkbox') input.value = input.value.trim();
    input.removeAttribute('aria-invalid');
  }
  const invalid = [...form.querySelectorAll('input,select,textarea')].find(input => !input.validity.valid);
  if (invalid) {
    invalid.setAttribute('aria-invalid', 'true');
    error.textContent = invalid.name === 'consent' ? '個人情報の利用への同意をご確認ください。' : invalid.type === 'email' && invalid.value ? 'メールアドレスの形式をご確認ください。' : `${fields[invalid.name]}を入力・選択してください。`;
    invalid.focus(); return;
  }
  const data = Object.fromEntries(Object.keys(fields).map(name => [name, form.elements[name].value]));
  data.consent = form.elements.consent.checked;
  data.website = form.elements.website.value;
  const next = JSON.stringify(data);
  if (next !== signature) { requestId = crypto.randomUUID(); signature = next; }
  payload = { ...data, requestId };
  const list = document.querySelector('#confirmation-values'); list.replaceChildren();
  for (const [name, label] of Object.entries(fields)) {
    const title = document.createElement('dt'), value = document.createElement('dd');
    title.textContent = label; value.textContent = data[name] || '入力なし'; list.append(title, value);
  }
  sendError.textContent = ''; dialog.showModal();
});
for (const button of dialog.querySelectorAll('.dialog-close,.dialog-back')) button.addEventListener('click', () => { if (!sending) dialog.close(); });
dialog.addEventListener('cancel', event => { if (sending) event.preventDefault(); });
sendButton.addEventListener('click', async () => {
  if (sending || !payload) return;
  sending = true; sendError.textContent = '';
  dialog.querySelectorAll('button').forEach(button => { button.disabled = true; });
  sendButton.textContent = '送信しています…';
  try {
    const response = await fetch('/meo-personal/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(18000) });
    if (response.status === 429) throw new Error('送信回数が多いため、3分ほどお待ちのうえ再試行してください。');
    const result = await response.json();
    if (!response.ok || result.accepted !== true) throw new Error(result.error || '送信を確認できませんでした。時間をおいてお試しください。');
    sessionStorage.setItem('meo-contact-accepted', '1');
    location.assign('/meo-personal/contact/thanks');
  } catch (failure) {
    sendError.textContent = failure.name === 'TimeoutError' ? '送信結果を確認できませんでした。入力内容を変えずに再試行できます。' : failure.message;
  } finally {
    sending = false; dialog.querySelectorAll('button').forEach(button => { button.disabled = false; });
    sendButton.textContent = '問い合わせを送信する →';
  }
});
const floating = document.querySelector('.mobile-cta');
new IntersectionObserver(entries => { floating.classList.toggle('is-hidden', entries[0].isIntersecting); }, { threshold: 0 }).observe(document.querySelector('#contact'));
if (location.pathname.replace(/\/$/, '') === '/meo-personal/contact') document.querySelector('#contact').scrollIntoView();
