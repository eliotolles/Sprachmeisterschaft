// Adapted from ElioEinfachlernen- cloudflare-return, bd5179107363ebcc19764454b08d7c94acd1a289.
// Preserve Elio's existing PBKDF2 encoding; do not reset or rewrite legacy passwords.
const encoder = new TextEncoder();
const hex = bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
export const randomToken = () => hex(crypto.getRandomValues(new Uint8Array(32)));
export async function digest(value) {
  return hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}
export async function passwordHash(password, salt = randomToken()) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  return 'pbkdf2$100000$' + salt + '$' + hex(await crypto.subtle.deriveBits({
    name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256',
  }, key, 256));
}
export function supportedPassword(hash) {
  return typeof hash === 'string' && (/^pbkdf2\$100000\$[a-f0-9]{64}\$[a-f0-9]{64}$/.test(hash) || /^[a-f0-9]{64}:[a-f0-9]{64}$/.test(hash));
}
export async function passwordMatches(password, stored) {
  if (!supportedPassword(stored)) return false;
  // ElioEinfach worker/index.js at 423250a356f38f187b42810d4bcc98bae5a01ac2
  // encodes the same PBKDF2-SHA256/100000 derivation as salt:hash.
  // Verify that exact format only; never rewrite stored credentials on login.
  const legacy = stored.includes(':');
  const salt = legacy ? stored.split(':')[0] : stored.split('$')[2];
  const modern = await passwordHash(password, salt);
  const candidate = legacy ? salt + ':' + modern.split('$')[3] : modern;
  let difference = candidate.length ^ stored.length;
  for (let i = 0; i < candidate.length; i++) difference |= candidate.charCodeAt(i) ^ (stored.charCodeAt(i) || 0);
  return difference === 0;
}
