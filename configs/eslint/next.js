module.exports = {
  extends: [
    './base.js',
    'next/core-web-vitals',
  ],
  env: {
    browser: true,
    node: true,
    es2020: true,
  },
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
  },
};
