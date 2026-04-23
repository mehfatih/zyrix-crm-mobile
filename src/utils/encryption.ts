/**
 * Local data encryption helpers. Used to protect cached PII (e.g.
 * customer detail snapshots) before persisting to AsyncStorage.
 *
 * The implementation here is a base64-encoded XOR cipher keyed by an
 * `encryptionKey` from SecureStore — strong enough to keep casual
 * inspection out, weak enough to not require native crypto. When
 * `expo-crypto` lands in the bundle we'll swap this for
 * `Crypto.digest`-derived AES-GCM. The API contract stays the same.
 */

import { SECURE_KEYS, getToken, storeToken } from './secureStorage';

const utf8 = (input: string): number[] =>
  Array.from(unescape(encodeURIComponent(input))).map((c) => c.charCodeAt(0));

const fromUtf8 = (bytes: number[]): string =>
  decodeURIComponent(escape(String.fromCharCode(...bytes)));

const base64Chars =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const toBase64 = (bytes: number[]): string => {
  let output = '';
  let i = 0;
  while (i < bytes.length) {
    const b1 = bytes[i++] ?? 0;
    const b2 = bytes[i++] ?? 0;
    const b3 = bytes[i++] ?? 0;
    const triplet = (b1 << 16) + (b2 << 8) + b3;
    output += base64Chars.charAt((triplet >> 18) & 0x3f);
    output += base64Chars.charAt((triplet >> 12) & 0x3f);
    output += i - 2 > bytes.length ? '=' : base64Chars.charAt((triplet >> 6) & 0x3f);
    output += i - 1 > bytes.length ? '=' : base64Chars.charAt(triplet & 0x3f);
  }
  return output;
};

const fromBase64 = (input: string): number[] => {
  const cleaned = input.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 4) {
    const a = base64Chars.indexOf(cleaned.charAt(i));
    const b = base64Chars.indexOf(cleaned.charAt(i + 1));
    const c = base64Chars.indexOf(cleaned.charAt(i + 2));
    const d = base64Chars.indexOf(cleaned.charAt(i + 3));
    const triplet = (a << 18) | (b << 12) | (c << 6) | d;
    bytes.push((triplet >> 16) & 0xff);
    bytes.push((triplet >> 8) & 0xff);
    bytes.push(triplet & 0xff);
  }
  return bytes;
};

const xor = (data: number[], key: number[]): number[] =>
  data.map((byte, idx) => byte ^ (key[idx % key.length] ?? 0));

const randomKey = (length = 32): string => {
  const bytes: number[] = [];
  for (let i = 0; i < length; i += 1) {
    bytes.push(Math.floor(Math.random() * 256));
  }
  return toBase64(bytes);
};

export const generateEncryptionKey = async (): Promise<string> => {
  const existing = await getToken(SECURE_KEYS.encryptionKey);
  if (existing) return existing;
  const next = randomKey();
  await storeToken(SECURE_KEYS.encryptionKey, next);
  return next;
};

export const encryptLocalData = async (
  data: string,
  key?: string
): Promise<string> => {
  const useKey = key ?? (await generateEncryptionKey());
  const dataBytes = utf8(data);
  const keyBytes = fromBase64(useKey);
  return toBase64(xor(dataBytes, keyBytes));
};

export const decryptLocalData = async (
  encrypted: string,
  key?: string
): Promise<string> => {
  const useKey = key ?? (await generateEncryptionKey());
  const dataBytes = fromBase64(encrypted);
  const keyBytes = fromBase64(useKey);
  return fromUtf8(xor(dataBytes, keyBytes));
};
