export const CONTACT_TO = 'contact@storevance.com';
const purposes = ['無料体験を希望', '導入を相談', '料金・機能について', 'その他'];
export class ContactError extends Error { constructor(status, message) { super(message); this.status = status; } }
export function validateContact(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ContactError(400, '入力内容を確認してください。');
  const value = (key, max, required = false) => {
    const raw = body[key] ?? '';
    if (typeof raw !== 'string' || raw.length > max || (required && !raw.trim())) throw new ContactError(400, '入力内容を確認してください。');
    return raw.trim();
  };
  const result = { name: value('name', 100, true), email: value('email', 254, true), store: value('store', 200), purpose: value('purpose', 40, true), message: value('message', 3000) };
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(result.email) || /[\r\n]/.test(result.name) || !purposes.includes(result.purpose) || body.consent !== true || value('website', 200)) throw new ContactError(400, '入力内容と個人情報の利用への同意を確認してください。');
  if (typeof body.requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.requestId)) throw new ContactError(400, '画面を再読み込みしてお試しください。');
  return { ...result, requestId: body.requestId };
}
export async function sendContact(body, { apiKey, from, fetcher = fetch } = {}) {
  const data = validateContact(body);
  if (!apiKey || !from) throw new ContactError(503, 'ただいまフォームの送信を受け付けられません。contact@storevance.com へ直接お問い合わせください。');
  const text = ['MEOパーソナルのお問い合わせ', '', `お名前：${data.name}`, `メールアドレス：${data.email}`, `店舗名：${data.store || '未入力'}`, `ご相談内容：${data.purpose}`, '', data.message || 'お問い合わせ本文なし', '', '問い合わせ対応のための個人情報利用に同意済み'].join('\n');
  const payload = { from, to: [CONTACT_TO], reply_to: data.email, subject: `【MEOパーソナル】${data.purpose}`, text };
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload)));
  const digest = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
  try {
    const response = await fetcher('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `contact/${data.requestId}/${digest}` }, body: JSON.stringify(payload), signal: AbortSignal.timeout(12000) });
    const result = await response.json();
    if (!response.ok || typeof result.id !== 'string' || !result.id) throw new Error('Provider did not accept request');
    return { accepted: true };
  } catch { throw new ContactError(502, '送信を確認できませんでした。時間をおいて再試行するか、contact@storevance.com へお問い合わせください。'); }
}
