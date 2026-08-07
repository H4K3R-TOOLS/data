import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Helper to format bytes into readable string (e.g., 5.42 GB, 320 MB)
export const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Target size per chunk in bytes (5 GB = 5 * 1024 * 1024 * 1024)
export const CHUNK_SIZE_BYTES = 5 * 1024 * 1024 * 1024;

/**
 * Categorize files into 5GB chunks
 */
export const groupFilesIntoChunks = (files, chunkSize = CHUNK_SIZE_BYTES) => {
  if (!files || files.length === 0) return [];

  const chunks = [];
  let currentChunkFiles = [];
  let currentChunkSize = 0;
  let chunkIndex = 1;

  files.forEach((file) => {
    // If adding this file exceeds chunk limit AND current chunk has files, seal current chunk
    if (currentChunkSize + file.size > chunkSize && currentChunkFiles.length > 0) {
      chunks.push({
        id: `chunk-${chunkIndex}`,
        index: chunkIndex,
        title: `Chunk Part ${chunkIndex} (5 GB Max)`,
        files: currentChunkFiles,
        totalSize: currentChunkSize,
        formattedSize: formatBytes(currentChunkSize),
        fileCount: currentChunkFiles.length
      });

      chunkIndex++;
      currentChunkFiles = [];
      currentChunkSize = 0;
    }

    currentChunkFiles.push(file);
    currentChunkSize += file.size;
  });

  // Push remaining files as final chunk
  if (currentChunkFiles.length > 0) {
    chunks.push({
      id: `chunk-${chunkIndex}`,
      index: chunkIndex,
      title: `Chunk Part ${chunkIndex} (${formatBytes(currentChunkSize)})`,
      files: currentChunkFiles,
      totalSize: currentChunkSize,
      formattedSize: formatBytes(currentChunkSize),
      fileCount: currentChunkFiles.length
    });
  }

  return chunks;
};

/**
 * Helper to generate 30GB realistic mock dataset when R2 credentials aren't full
 */
export const generateMockR2Data = () => {
  const categories = [
    { ext: 'mp4', type: 'Video', mime: 'video/mp4', icon: 'film' },
    { ext: 'zip', type: 'Archive', mime: 'application/zip', icon: 'archive' },
    { ext: 'jpg', type: 'Image', mime: 'image/jpeg', icon: 'image' },
    { ext: 'png', type: 'Image', mime: 'image/png', icon: 'image' },
    { ext: 'iso', type: 'Disk Image', mime: 'application/octet-stream', icon: 'database' },
    { ext: 'raw', type: 'RAW Media', mime: 'image/x-adobe-dng', icon: 'file' }
  ];

  const mockFiles = [];
  let totalBytes = 0;
  const targetTotal = 30.5 * 1024 * 1024 * 1024; // ~30.5 GB total data
  let idCounter = 1;

  // Create ~180 mock high-resolution files & heavy video archives
  while (totalBytes < targetTotal) {
    const cat = categories[Math.floor(Math.random() * categories.length)];
    // Random file size between 50MB and 650MB
    const size = Math.floor(Math.random() * 600 * 1024 * 1024) + (50 * 1024 * 1024);
    
    const fileId = `file-${idCounter}`;
    const filename = `gallery_media_archive_2026_${String(idCounter).padStart(3, '0')}.${cat.ext}`;
    const lastModified = new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString();

    mockFiles.push({
      key: `media/hd/${filename}`,
      name: filename,
      size: size,
      formattedSize: formatBytes(size),
      lastModified: lastModified,
      type: cat.type,
      mime: cat.mime,
      url: `https://pub-5b4a6b6f87d24e218dc9dcd6a47ec39b.r2.dev/media/hd/${filename}`
    });

    totalBytes += size;
    idCounter++;
  }

  return {
    files: mockFiles,
    totalSizeBytes: totalBytes,
    formattedTotalSize: formatBytes(totalBytes),
    fileCount: mockFiles.length,
    isMock: true
  };
};

/**
 * Create S3 Client for Cloudflare R2
 */
export const createR2Client = (accountId, accessKeyId, secretAccessKey) => {
  if (!accountId || !accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey
    }
  });
};

/**
 * Fetch objects from live Cloudflare R2 bucket
 */
export const fetchR2Objects = async (config) => {
  const { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl } = config;

  // If secret key is not set, fallback to realistic mock 30GB demo mode
  if (!secretAccessKey) {
    console.warn('[R2 Service] R2_SECRET_ACCESS_KEY missing. Using 30GB simulation mode.');
    return generateMockR2Data();
  }

  try {
    const s3Client = createR2Client(accountId, accessKeyId, secretAccessKey);
    if (!s3Client) return generateMockR2Data();

    const command = new ListObjectsV2Command({
      Bucket: bucketName
    });

    const response = await s3Client.send(command);
    const contents = response.Contents || [];

    let totalSizeBytes = 0;
    const files = await Promise.all(
      contents.map(async (item) => {
        totalSizeBytes += item.Size || 0;
        const key = item.Key;
        const name = key.split('/').pop() || key;

        // Generate download URL (either public R2 URL or presigned S3 URL)
        let downloadUrl = publicUrl ? `${publicUrl.replace(/\/$/, '')}/${key}` : '';
        
        try {
          if (!downloadUrl && s3Client) {
            const getObjCmd = new GetObjectCommand({ Bucket: bucketName, Key: key });
            downloadUrl = await getSignedUrl(s3Client, getObjCmd, { expiresIn: 3600 });
          }
        } catch (e) {
          console.error('Error generating presigned URL:', e);
        }

        const ext = name.split('.').pop()?.toLowerCase() || 'file';

        return {
          key: key,
          name: name,
          size: item.Size || 0,
          formattedSize: formatBytes(item.Size || 0),
          lastModified: item.LastModified ? new Date(item.LastModified).toISOString() : new Date().toISOString(),
          type: ext.toUpperCase(),
          url: downloadUrl
        };
      })
    );

    return {
      files: files,
      totalSizeBytes: totalSizeBytes,
      formattedTotalSize: formatBytes(totalSizeBytes),
      fileCount: files.length,
      isMock: false
    };

  } catch (error) {
    console.error('[R2 Service] Error fetching live R2 bucket data:', error);
    // Fallback to simulation mode if network / CORS fails
    const mock = generateMockR2Data();
    mock.error = error.message || 'Failed to connect to R2 bucket. Showing demo data.';
    return mock;
  }
};
