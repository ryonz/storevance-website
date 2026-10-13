import { sendContact, ContactError } from '../lib/meo-contact.mjs';
const json = (status, body) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export default async function handler(request) {
  if (request.method === 'GET') return json(200, { available: Boolean(process.env.RESEND_API_KEY && (process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM)) });
  if (request.method !== 'POST') return json(405, { error: 'POSTで送信してください。' });
  if (request.headers.get('origin') !== 'https://storevance.com') return json(403, { error: 'アクセス元を確認できません。' });
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json(415, { error: '入力形式を確認してください。' });
  try {
    const reader = request.body?.getReader();
    if (!reader) return json(400, { error: '入力内容を確認してください。' });
    const chunks = []; let length = 0;
    while (true) { const { value, done } = await reader.read(); if (done) break; length += value.length; if (length > 20000) { await reader.cancel(); return json(413, { error: '入力内容が長すぎます。' }); } chunks.push(value); }
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    return json(200, await sendContact(body, { from: process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM }));
  } catch (error) { return json(error instanceof ContactError ? error.status : 400, { error: error instanceof ContactError ? error.message : '入力形式を確認してください。' }); }
}
export const config = { path: '/meo-personal/api/contact', rateLimit: { windowLimit: 5, windowSize: 180, aggregateBy: ['ip', 'domain'] } };
