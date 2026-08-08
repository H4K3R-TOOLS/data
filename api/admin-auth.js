// api/admin-auth.js — Vercel Serverless: Verify admin password, return signed token
import { createHmac } from 'crypto';

const _c = (s) => Buffer.from(s, 'base64').toString('utf8');

const ADMIN_PASS_ENCODED = 'Y2hhbmdlbWUxMjM='; // "changeme123"
const SIGN_SECRET = _c('MGFhOWU4Nzk1ZjIwMzQ2ZWYyODBmMWI0YzEwNGQzNDdlNDkxMDRmYzI5MjJiZmYwYmZkYTQxMTFjNWM4NGU1ZA==');

export function signToken(payload) {
  const data = JSON.stringify(payload);
  const sig = createHmac('sha256', SIGN_SECRET).update(data).digest('hex');
  return Buffer.from(data).toString('base64') + '.' + sig;
}

export function verifyToken(token) {
  try {
    const [dataB64, sig] = token.split('.');
    const data = Buffer.from(dataB64, 'base64').toString('utf8');
    const expected = createHmac('sha256', SIGN_SECRET).update(data).digest('hex');
    if (sig !== expected) return null;
    const payload = JSON.parse(data);
    if (Date.now() - payload.iat > 12 * 60 * 60 * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

// Manually parse JSON body (Vercel doesn't auto-parse like Express)
async function parseBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(raw)); }
      catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();

  const body = await parseBody(req);
  const { password } = body;
  const correctPass = process.env.ADMIN_PASSWORD || _c(ADMIN_PASS_ENCODED);

  if (!password || password !== correctPass) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = signToken({ role: 'admin', iat: Date.now() });
  return res.status(200).json({ token });
}
