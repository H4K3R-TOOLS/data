// api/list-files.js — Vercel Serverless Function
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';

const _c = (s) => Buffer.from(s, 'base64').toString('utf8');

const CFG = {
  accountId:   _c('ODM0Y2RkNmFjYjdmYzI0MzQyMTk3NDk0OTQ1Yjk4YWU='),
  accessKeyId: _c('OTI2N2QxNzI5NTk5ZTViY2Q5ODIxNmIwYmU2M2RhNTM='),
  secretKey:   _c('MGFhOWU4Nzk1ZjIwMzQ2ZWYyODBmMWI0YzEwNGQzNDdlNDkxMDRmYzI5MjJiZmYwYmZkYTQxMTFjNWM4NGU1ZA=='),
  bucket:      _c('Z2FsbGVyeQ=='),
  publicUrl:   _c('aHR0cHM6Ly9wdWItNWI0YTZiNmY4N2QyNGUyMThkYzlkY2Q2YTQ3ZWMzOWIucjIuZGV2'),
};

const CONFIG_KEY = '_config.json';
const DEFAULT_CONFIG = { mainPageEnabled: true, dataLimitGB: 0 };

function getClient() {
  const accountId   = process.env.R2_ACCOUNT_ID        || CFG.accountId;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID      || CFG.accessKeyId;
  const secretKey   = process.env.R2_SECRET_ACCESS_KEY  || CFG.secretKey;
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey: secretKey },
  });
}

async function readSiteConfig(client, bucket) {
  try {
    const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: CONFIG_KEY }));
    const body = await res.Body.transformToString();
    return { ...DEFAULT_CONFIG, ...JSON.parse(body) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const accountId = process.env.R2_ACCOUNT_ID  || CFG.accountId;
  const bucket    = process.env.R2_BUCKET_NAME || CFG.bucket;
  const publicUrl = process.env.R2_PUBLIC_URL  || CFG.publicUrl;

  try {
    const client = getClient();

    // ── Read site config (server-side, no bypass possible) ──
    const siteConfig = await readSiteConfig(client, bucket);

    // Main page is disabled by admin
    if (!siteConfig.mainPageEnabled) {
      return res.status(403).json({ disabled: true, message: 'Site is currently unavailable.' });
    }

    // Fetch all objects
    const allFiles = [];
    let token;

    do {
      const result = await client.send(
        new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token })
      );

      for (const obj of result.Contents || []) {
        const key  = obj.Key;
        // Skip internal config file
        if (key === CONFIG_KEY) continue;
        const name = key.split('/').pop() || key;
        const ext  = name.includes('.') ? name.split('.').pop().toUpperCase() : 'FILE';
        const base = publicUrl.replace(/\/$/, '');

        allFiles.push({
          key,
          name,
          size: obj.Size || 0,
          lastModified: obj.LastModified
            ? new Date(obj.LastModified).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—',
          type: ext,
          url: `${base}/${key}`,
        });
      }

      token = result.IsTruncated ? result.NextContinuationToken : undefined;
    } while (token);

    // ── Apply data limit (server-side) ──
    const limitBytes = siteConfig.dataLimitGB > 0
      ? siteConfig.dataLimitGB * 1024 * 1024 * 1024
      : Infinity;

    const limitedFiles = [];
    let runningTotal = 0;

    for (const file of allFiles) {
      if (runningTotal + file.size > limitBytes) break;
      limitedFiles.push(file);
      runningTotal += file.size;
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      files: limitedFiles,
      totalSize: runningTotal,
      totalSizeAll: allFiles.reduce((s, f) => s + f.size, 0),
      fileCount: limitedFiles.length,
      bucket,
      dataLimitGB: siteConfig.dataLimitGB,
    });

  } catch (err) {
    console.error('[R2]', err);
    return res.status(500).json({ error: err.message });
  }
}
