// Backend media/image URLs occasionally arrive with stray embedded whitespace
// (e.g. a trailing newline baked into an env var used to build the URL),
// which silently breaks image loading. Valid URLs never contain literal
// whitespace, so stripping it out entirely is a safe, generic defensive fix.
export const sanitizeUrl = (url) => (typeof url === 'string' ? url.replace(/\s+/g, '') : url);
