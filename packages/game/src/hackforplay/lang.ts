// 暫定的な機能. undefined である可能性を常に考慮して実装すべき
// ユーザーの使用言語を window.lang で取得できる. 日本語シノニムはない

export const langExports: { readonly lang?: string } = {};

Object.defineProperty(langExports, 'lang', {
  configurable: true,
  enumerable: true,
  get: () => {
    const code = window.navigator.language.substr(0, 2).toLowerCase();
    return code;
  }
});
