// Firefox's browser namespace is Promise-based; Chromium's modern chrome is too.
export const extensionApi = globalThis.browser || globalThis.chrome;
