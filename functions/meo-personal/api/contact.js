import { sendContact, ContactError } from '../../../lib/meo-contact.mjs';
const attempts = new Map();
const json = (status, body) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function onRequest({ request, env }) {
  const from = env.RESEND_FROM_EMAIL || env.RESEND_FROM;
  if (request.method === 'GET') return json(200, { available: Boolean(env.RESEND_API_KEY && from) });
  if (request.method !== 'POST') return json(405, { error: 'POSTで送信してください。' });
  if (request.headers.get('origin') !== 'https://storevance.com') return json(403, { error: 'アクセス元を確認できません。' });
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json(415, { error: '入力形式を確認してください。' });
  const now = Date.now();
  for (const [key, row] of attempts) if (now - row.at > 180000) attempts.delete(key);
  const key = request.headers.get('cf-connecting-ip') || 'unknown';
  const row = attempts.get(key) || { count: 0, at: now };
  if (row.count >= 5) return json(429, { error: '時間をおいて再度お試しください。' });
  row.count++; attempts.set(key, row);
  try {
    const reader = request.body?.getReader();
    if (!reader) return json(400, { error: '入力内容を確認してください。' });
    const chunks = []; let length = 0;
    while (true) { const { value, done } = await reader.read(); if (done) break; length += value.length; if (length > 20000) { await reader.cancel(); return json(413, { error: '入力内容が長すぎます。' }); } chunks.push(value); }
    const bytes = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const body = JSON.parse(new TextDecoder().decode(bytes));
    return json(200, await sendContact(body, { apiKey: env.RESEND_API_KEY, from }));
  } catch (error) { return json(error instanceof ContactError ? error.status : 400, { error: error instanceof ContactError ? error.message : '入力形式を確認してください。' }); }
}
