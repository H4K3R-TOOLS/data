// api/list-files.js — Vercel Serverless Function
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Credentials stored as base64-encoded chunks — decoded at runtime
// To update: Buffer.from('your-value').toString('base64')
const _c = (s) => Buffer.from(s, 'base64').toString('utf8');

const CFG = {
  accountId:   _c('ODM0Y2RkNmFjYjdmYzI0MzQyMTk3NDk0OTQ1Yjk4YWU='),
  accessKeyId: _c('OTI2N2QxNzI5NTk5ZTViY2Q5ODIxNmIwYmU2M2RhNTM='),
  secretKey:   _c('MGFhOWU4Nzk1ZjIwMzQ2ZWYyODBmMWI0YzEwNGQzNDdlNDkxMDRmYzI5MjJiZmYwYmZkYTQxMTFjNWM4NGU1ZA=='),
  bucket:      _c('Z2FsbGVyeQ=='),
  publicUrl:   _c('aHR0cHM6Ly9wdWItNWI0YTZiNmY4N2QyNGUyMThkYzlkY2Q2YTQ3ZWMzOWIucjIuZGV2'),
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  // Also accept env vars as override (for Vercel dashboard)
  const accountId   = process.env.R2_ACCOUNT_ID        || CFG.accountId;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID      || CFG.accessKeyId;
  const secretKey   = process.env.R2_SECRET_ACCESS_KEY  || CFG.secretKey;
  const bucket      = process.env.R2_BUCKET_NAME        || CFG.bucket;
  const publicUrl   = process.env.R2_PUBLIC_URL         || CFG.publicUrl;

  if (!secretKey) {
    return res.status(500).json({ error: 'R2 secret key not configured.' });
  }

  try {
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey: secretKey },
    });

    const allFiles = [];
    let token;

    do {
      const res2 = await client.send(
        new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token })
      );

      for (const obj of res2.Contents || []) {
        const key  = obj.Key;
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

      token = res2.IsTruncated ? res2.NextContinuationToken : undefined;
    } while (token);

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json({
      files: allFiles,
      totalSize: allFiles.reduce((s, f) => s + f.size, 0),
      fileCount: allFiles.length,
      bucket,
    });

  } catch (err) {
    console.error('[R2]', err);
    return res.status(500).json({ error: err.message });
  }
}
