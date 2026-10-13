import { createHash } from 'node:crypto';
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
export async function sendContact(body, { apiKey = process.env.RESEND_API_KEY, from = process.env.RESEND_FROM, fetcher = fetch } = {}) {
  const data = validateContact(body);
  if (!apiKey || !from) throw new ContactError(503, 'ただいまフォームの送信を受け付けられません。contact@storevance.com へ直接お問い合わせください。');
  const text = ['MEOパーソナルのお問い合わせ', '', `お名前：${data.name}`, `メールアドレス：${data.email}`, `店舗名：${data.store || '未入力'}`, `ご相談内容：${data.purpose}`, '', data.message || 'お問い合わせ本文なし', '', '問い合わせ対応のための個人情報利用に同意済み'].join('\n');
  const payload = { from, to: [CONTACT_TO], reply_to: data.email, subject: `【MEOパーソナル】${data.purpose}`, text };
  const digest = createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 32);
  try {
    const response = await fetcher('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `contact/${data.requestId}/${digest}` }, body: JSON.stringify(payload), signal: AbortSignal.timeout(12000) });
    const result = await response.json();
    if (!response.ok || typeof result.id !== 'string' || !result.id) throw new Error('Provider did not accept request');
    return { accepted: true };
  } catch { throw new ContactError(502, '送信を確認できませんでした。時間をおいて再試行するか、contact@storevance.com へお問い合わせください。'); }
}
export function createContactHandler(options = {}) {
  const attempts = new Map();
  return async (req, res, allowedOrigins) => {
    const json = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return json(405, { error: 'POSTで送信してください。' }); }
    if (!allowedOrigins.includes(req.headers.origin)) return json(403, { error: 'アクセス元を確認できません。' });
    if (!req.headers['content-type']?.startsWith('application/json')) return json(415, { error: 'JSON形式で送信してください。' });
    const now = Date.now();
    for (const [key, row] of attempts) if (now - row.start >= 600000) attempts.delete(key);
    const ip = req.socket.remoteAddress || 'unknown';
    const row = attempts.get(ip) || { start: now, count: 0 };
    if (row.count >= 5) { res.setHeader('Retry-After', '600'); return json(429, { error: '送信回数が多いため、しばらく時間をおいてお試しください。' }); }
    row.count++; attempts.set(ip, row);
    try {
      const chunks = []; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 20000) throw new ContactError(413, '入力内容が長すぎます。'); chunks.push(chunk); }
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      return json(200, await sendContact(body, options));
    } catch (error) { return json(error.status || 400, { error: error instanceof ContactError ? error.message : '入力形式を確認してください。' }); }
  };
}
