import React, { useState, useEffect, useMemo } from 'react';
import { Cloud, RefreshCw, Layers, HardDrive, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import FileList from './components/FileList';
import ChunkManager from './components/ChunkManager';
import { fetchR2Objects, groupIntoChunks, formatBytes } from './services/r2Service';

// Config comes 100% from environment variables (set in .env or Vercel dashboard)
const ENV = {
  accountId:       process.env.R2_ACCOUNT_ID        || '',
  accessKeyId:     process.env.R2_ACCESS_KEY_ID      || '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY  || '',
  bucketName:      process.env.R2_BUCKET_NAME        || '',
  publicUrl:       process.env.R2_PUBLIC_URL         || '',
};

export default function App() {
  const [tab, setTab] = useState('files');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ files: [], totalSize: 0, fileCount: 0 });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchR2Objects(ENV);
      if (res.error) setError(res.error);
      else setData(res);
    } catch (e) {
      setError(e.message || 'Failed to connect to R2 bucket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const chunks = useMemo(() => groupIntoChunks(data.files), [data.files]);

  return (
    <div className="app-wrap">

      {/* ── Top Bar ────────────────── */}
      <div className="topbar">
        <div className="topbar-title">
          <div className="topbar-icon">
            <Cloud size={18} />
          </div>
          <div>
            <h1>R2 Bucket — {ENV.bucketName || 'gallery'}</h1>
            <p>Cloudflare R2 Storage Manager</p>
          </div>
        </div>

        <div className="topbar-right">
          <button className="btn btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Error notice ───────────── */}
      {error && (
        <div className="notice" style={{ marginBottom: 20 }}>
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Stat cards ─────────────── */}
      {!loading && !error && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Total Storage</div>
            <div className="stat-value">{data.formattedTotalSize || '0 B'}</div>
            <div className="stat-sub">in bucket <strong>{ENV.bucketName}</strong></div>
            <div className="prog-bar">
              <div
                className="prog-fill"
                style={{ width: `${Math.min(100, (data.totalSize / (50 * 1024 ** 3)) * 100)}%` }}
              />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Total Files</div>
            <div className="stat-value">{data.fileCount.toLocaleString()}</div>
            <div className="stat-sub">objects in R2 bucket</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">5 GB Bundles</div>
            <div className="stat-value" style={{ color: 'var(--orange)' }}>
              {chunks.length} <span>parts</span>
            </div>
            <div className="stat-sub">~5 GB per downloadable part</div>
          </div>
        </div>
      )}

      {/* ── Tabs ───────────────────── */}
      <div className="tabs">
        <button
          className={`tab-btn ${tab === 'files' ? 'active' : ''}`}
          onClick={() => setTab('files')}
        >
          <FileText size={14} />
          All Files {!loading && `(${data.fileCount})`}
        </button>
        <button
          className={`tab-btn ${tab === 'chunks' ? 'active' : ''}`}
          onClick={() => setTab('chunks')}
        >
          <Layers size={14} />
          5 GB Bundles {!loading && `(${chunks.length})`}
        </button>
      </div>

      {/* ── Content ────────────────── */}
      {loading ? (
        <div className="loading-center">
          <Loader2 size={32} style={{ color: 'var(--orange)' }} className="spin" />
          <span>Loading bucket data…</span>
        </div>
      ) : error ? (
        <div style={{ color: 'var(--text-muted)', padding: 24, fontSize: 13 }}>
          Could not load bucket. Check that your <code>R2_SECRET_ACCESS_KEY</code> is set in environment variables and R2 CORS is configured.
        </div>
      ) : tab === 'files' ? (
        <FileList files={data.files} />
      ) : (
        <ChunkManager chunks={chunks} />
      )}
    </div>
  );
}
