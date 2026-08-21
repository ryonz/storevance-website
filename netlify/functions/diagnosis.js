const RESEND_API_URL = 'https://api.resend.com/emails';
const RECIPIENT = 'ryo.okube@storevance.com';

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { message: 'Method not allowed.' });

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return json(503, { message: '現在フォーム送信の準備中です。時間をおいて再度お試しください。' });
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { message: '入力内容を確認してください。' });
  }

  const { store, name, email, area, message = '', website = '' } = data;
  if (website) return json(200, { ok: true });
  if (![store, name, email, area].every((value) => typeof value === 'string' && value.trim())) {
    return json(400, { message: '必須項目を入力してください。' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) return json(400, { message: 'メールアドレスを確認してください。' });

  const safe = {
    store: escapeHtml(store.trim()),
    name: escapeHtml(name.trim()),
    email: escapeHtml(email.trim()),
    area: escapeHtml(area.trim()),
    message: escapeHtml(message.trim()).replace(/\n/g, '<br>') || '（記載なし）',
  };

  const adminEmail = {
    from: process.env.RESEND_FROM_EMAIL,
    to: [RECIPIENT],
    reply_to: email.trim(),
    subject: `【無料店舗診断】${store.trim()}様からのお申し込み`,
    html: `<h1>無料店舗診断のお申し込み</h1><p><b>店舗名：</b>${safe.store}</p><p><b>担当者名：</b>${safe.name}</p><p><b>メールアドレス：</b>${safe.email}</p><p><b>店舗エリア：</b>${safe.area}</p><p><b>相談内容：</b><br>${safe.message}</p>`,
  };

  const confirmationEmail = {
    from: process.env.RESEND_FROM_EMAIL,
    to: [email.trim()],
    subject: '【Night SEO】無料店舗診断のお申し込みを受け付けました',
    html: `<p>${safe.name} 様</p><p>無料店舗診断へお申し込みいただき、ありがとうございます。</p><p>内容を確認のうえ、<strong>3営業日以内に担当者からお電話またはメールいたします。</strong></p><p>Night SEO<br>ナイトワーク専門集客サポート</p>`,
  };

  const send = async (payload) => fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  try {
    const [adminResponse, confirmationResponse] = await Promise.all([send(adminEmail), send(confirmationEmail)]);
    if (!adminResponse.ok || !confirmationResponse.ok) throw new Error('Resend request failed');
    return json(200, { ok: true });
  } catch {
    return json(502, { message: '送信に失敗しました。時間をおいて再度お試しください。' });
  }
};
