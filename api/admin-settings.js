// api/admin-settings.js
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { verifyToken } from './admin-auth.js';

const _c = (s) => Buffer.from(s, 'base64').toString('utf8');

const CFG = {
  accountId:   process.env.R2_ACCOUNT_ID        || _c('ODM0Y2RkNmFjYjdmYzI0MzQyMTk3NDk0OTQ1Yjk4YWU='),
  accessKeyId: process.env.R2_ACCESS_KEY_ID      || _c('OTI2N2QxNzI5NTk5ZTViY2Q5ODIxNmIwYmU2M2RhNTM='),
  secretKey:   process.env.R2_SECRET_ACCESS_KEY  || _c('MGFhOWU4Nzk1ZjIwMzQ2ZWYyODBmMWI0YzEwNGQzNDdlNDkxMDRmYzI5MjJiZmYwYmZkYTQxMTFjNWM4NGU1ZA=='),
  bucket:      process.env.R2_BUCKET_NAME        || _c('Z2FsbGVyeQ=='),
};

const CONFIG_KEY = '_config.json';
const DEFAULT_CONFIG = { mainPageEnabled: true, dataLimitGB: 0 };

function getClient() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${CFG.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: CFG.accessKeyId, secretAccessKey: CFG.secretKey },
  });
}

async function readConfig(client) {
  try {
    const r = await client.send(new GetObjectCommand({ Bucket: CFG.bucket, Key: CONFIG_KEY }));
    const body = await r.Body.transformToString();
    return { ...DEFAULT_CONFIG, ...JSON.parse(body) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

async function writeConfig(client, config) {
  await client.send(new PutObjectCommand({
    Bucket: CFG.bucket,
    Key: CONFIG_KEY,
    Body: JSON.stringify(config),
    ContentType: 'application/json',
  }));
}

// Manually parse JSON body since Vercel doesn't auto-parse
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
  // CORS for same-origin
  res.setHeader('Cache-Control', 'no-store');

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const payload = verifyToken(token);

  if (!payload || payload.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const client = getClient();

  if (req.method === 'GET') {
    const config = await readConfig(client);
    return res.status(200).json(config);
  }

  if (req.method === 'POST') {
    const body = await parseBody(req);
    const current = await readConfig(client);

    const updated = {
      ...current,
      ...(typeof body.mainPageEnabled === 'boolean' ? { mainPageEnabled: body.mainPageEnabled } : {}),
      ...(typeof body.dataLimitGB === 'number'      ? { dataLimitGB: body.dataLimitGB }         : {}),
    };

    await writeConfig(client, updated);
    return res.status(200).json({ ok: true, config: updated });
  }

  return res.status(405).end();
}
