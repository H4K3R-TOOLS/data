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
    files: c.files.map(f => ({
      ...f,
      formattedSize: formatBytes(f.size),
    })),
    totalSize: c.totalSize,
    formattedSize: formatBytes(c.totalSize),
    fileCount: c.files.length,
  }));
};

/**
 * Fetch R2 objects via Vercel serverless API route.
 * The actual S3 call happens server-side → no CORS issues.
 */
export const fetchR2Objects = async () => {
  const res = await fetch('/api/list-files');

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Server error ${res.status}`);
  }

  const data = await res.json();

  // Attach formatted size to each file
  const files = (data.files || []).map(f => ({
    ...f,
    formattedSize: formatBytes(f.size),
  }));

  return {
    files,
    totalSize: data.totalSize || 0,
    formattedTotalSize: formatBytes(data.totalSize || 0),
    fileCount: data.fileCount || 0,
    bucket: data.bucket || '',
  };
};
