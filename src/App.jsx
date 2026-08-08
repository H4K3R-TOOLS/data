import React, { useState, useEffect, useMemo } from 'react';
import { Cloud, RefreshCw, Layers, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import FileList from './components/FileList';
import ChunkManager from './components/ChunkManager';
import AdminPage from './components/AdminPage';
import { fetchR2Objects, groupIntoChunks, formatBytes } from './services/r2Service';

// Route: /admin322 → Admin panel, everything else → main page
const isAdminRoute = () => window.location.pathname === '/admin322';

export default function App() {
  const [isAdmin] = useState(isAdminRoute);

  // If admin route, render admin panel directly
  if (isAdmin) return <AdminPage />;

  return <MainPage />;
}

function MainPage() {
  const [tab, setTab] = useState('files');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [data, setData] = useState({ files: [], totalSize: 0, fileCount: 0, bucket: '', dataLimitGB: 0 });

  const load = async () => {
    setLoading(true);
    setError(null);
    setDisabled(false);
    try {
      const res = await fetchR2Objects();
      if (res.disabled) {
        setDisabled(true);
      } else {
        setData(res);
      }
    } catch (e) {
      setError(e.message || 'Failed to load bucket data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const chunks = useMemo(() => groupIntoChunks(data.files), [data.files]);

  // ── Site disabled ──────────────────────────────────────────
  if (!loading && disabled) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg)',
      }}>
        {/* Intentionally blank — no information leakage */}
      </div>
    );
  }

  return (
    <div className="app-wrap">

      {/* Top Bar */}
      <div className="topbar">
        <div className="topbar-title">
          <div className="topbar-icon">
            <Cloud size={18} />
          </div>
          <div>
            <h1>R2 Bucket — {data.bucket || 'gallery'}</h1>
            <p>
              Cloudflare R2 Storage Manager
              {data.dataLimitGB > 0 && (
                <span style={{ color: 'var(--orange)', marginLeft: 8 }}>
                  · Showing up to {data.dataLimitGB} GB
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="notice" style={{ marginBottom: 20 }}>
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Stat Cards */}
      {!loading && !error && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Total Storage</div>
            <div className="stat-value">{data.formattedTotalSize || '0 B'}</div>
            <div className="stat-sub">in bucket <strong>{data.bucket}</strong></div>
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

      {/* Tabs */}
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

      {/* Content */}
      {loading ? (
        <div className="loading-center">
          <Loader2 size={32} style={{ color: 'var(--orange)' }} className="spin" />
          <span>Loading bucket data…</span>
        </div>
      ) : error ? (
        <div className="notice">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeWidth="2" d="M12 9v4m0 4h.01M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
          </svg>
          <span>{error}</span>
        </div>
      ) : tab === 'files' ? (
        <FileList files={data.files} />
      ) : (
        <ChunkManager chunks={chunks} />
      )}
    </div>
  );
}
