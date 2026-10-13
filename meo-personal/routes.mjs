export const basePath = '/meo-personal';
export const canonicalOrigin = 'https://storevance.com';
export const appPages = { home: 'dashboard', rankings: 'rankings', proposals: 'suggestions', posts: 'posts', reviews: 'reviews', settings: 'settings', account: 'stores' };
export const pagePaths = {
  landing: basePath,
  contact: `${basePath}/contact`,
  contactComplete: `${basePath}/contact/thanks`,
  login: `${basePath}/login`,
  passwordReset: `${basePath}/password-reset`,
  privacy: `${basePath}/privacy`,
  terms: `${basePath}/terms`,
  legal: `${basePath}/legal`,
  ...Object.fromEntries(Object.entries(appPages).map(([key, slug]) => [key, `${basePath}/${slug}`]))
};
