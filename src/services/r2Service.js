import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export const formatBytes = (bytes, dec = 2) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dec))} ${sizes[i]}`;
};

// 5 GB per chunk
export const CHUNK_SIZE = 5 * 1024 * 1024 * 1024;

/** Group files into ~5 GB chunks */
export const groupIntoChunks = (files, chunkSize = CHUNK_SIZE) => {
  const chunks = [];
  let cur = { files: [], totalSize: 0 };

  for (const file of files) {
    if (cur.files.length > 0 && cur.totalSize + file.size > chunkSize) {
      chunks.push(cur);
      cur = { files: [], totalSize: 0 };
    }
    cur.files.push(file);
    cur.totalSize += file.size;
  }
  if (cur.files.length > 0) chunks.push(cur);

  return chunks.map((c, i) => ({
    id: `chunk-${i + 1}`,
    index: i + 1,
    files: c.files,
    totalSize: c.totalSize,
    formattedSize: formatBytes(c.totalSize),
    fileCount: c.files.length,
  }));
};

/** Fetch all objects from live Cloudflare R2 bucket using S3 API */
export const fetchR2Objects = async ({ accountId, accessKeyId, secretAccessKey, bucketName, publicUrl }) => {
  if (!secretAccessKey || !accountId || !accessKeyId || !bucketName) {
    return { files: [], totalSize: 0, fileCount: 0, error: 'Missing credentials' };
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const allFiles = [];
  let continuationToken;

  // Handle paginated results (R2 returns max 1000 per call)
  do {
    const cmd = new ListObjectsV2Command({
      Bucket: bucketName,
      ContinuationToken: continuationToken,
    });

    const res = await client.send(cmd);

    for (const obj of res.Contents || []) {
      const key = obj.Key;
      const name = key.split('/').pop() || key;
      const ext = name.includes('.') ? name.split('.').pop().toUpperCase() : 'FILE';
      const base = publicUrl ? publicUrl.replace(/\/$/, '') : '';

      allFiles.push({
        key,
        name,
        size: obj.Size || 0,
        formattedSize: formatBytes(obj.Size || 0),
        lastModified: obj.LastModified ? new Date(obj.LastModified).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
        type: ext,
        // Direct public URL — R2 public bucket link
        url: base ? `${base}/${key}` : '',
      });
    }

    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);

  const totalSize = allFiles.reduce((s, f) => s + f.size, 0);

  return {
    files: allFiles,
    totalSize,
    formattedTotalSize: formatBytes(totalSize),
    fileCount: allFiles.length,
    error: null,
  };
};
