// Backend media/image URLs occasionally arrive with a stray newline baked
// into an env var used to build the R2 base URL. Django's storage layer
// percent-encodes that newline when it builds the file URL, so it shows up
// as the literal text "%0A" (not an actual whitespace character) sitting
// between the host and the path, e.g. "...r2.dev%0A/projects/...". That
// breaks URL parsing (invalid host), so the browser never even attempts the
// request. Strip both real whitespace and these encoded whitespace escapes.
export const sanitizeUrl = (url) =>
  (typeof url === 'string' ? url.replace(/\s+/g, '').replace(/%0[AD]/gi, '') : url);
