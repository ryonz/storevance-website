import { pagePaths } from '/meo-personal/routes.mjs';
const pages = {
  [pagePaths.login]: ['ログイン', 'ログイン機能は準備中です。ご利用については、お問い合わせください。'],
  [pagePaths.passwordReset]: ['パスワードの再設定', 'パスワード再設定機能は準備中です。'],
  [pagePaths.privacy]: ['プライバシーポリシー', '正式なプライバシーポリシーは公開準備中です。お問い合わせ先：contact@storevance.com'],
  [pagePaths.terms]: ['利用規約', 'サービスの利用規約は公開準備中です。'],
  [pagePaths.legal]: ['特定商取引法に基づく表記', '正式な事業者情報・取引条件は公開準備中です。'],
  [pagePaths.contactComplete]: sessionStorage.getItem('meo-contact-accepted') === '1' ? ['お問い合わせを受け付けました', 'お問い合わせありがとうございます。内容を確認し、ご入力いただいたメールアドレスへご連絡します。'] : ['お問い合わせ', '導入のご相談・無料体験のご希望は、お問い合わせページからお送りください。']
};
const [title, description] = pages[location.pathname.replace(/\/$/, '')] || ['ページが見つかりません', 'トップページからお進みください。'];
document.title = `${title}｜MEOパーソナル`;
document.querySelector('#page-title').textContent = title;
document.querySelector('#page-description').textContent = description;
if (location.pathname === pagePaths.contactComplete) sessionStorage.removeItem('meo-contact-accepted');
