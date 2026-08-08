import React, { useState } from 'react';
import { Download, ChevronDown, ChevronUp, Link2, FileText, Loader2, ExternalLink } from 'lucide-react';
import { formatBytes } from '../services/r2Service';

/**
 * For 5GB chunks we offer two options:
 * 1. Download link-list (.txt) — user pastes in IDM / wget / aria2 to batch-download
 * 2. Sequential browser downloads — triggers <a download> for each file one by one
 *
 * We do NOT try to zip files in the browser — fetching 5GB to RAM would crash the tab.
 */
export default function ChunkManager({ chunks }) {
  const [expanded, setExpanded] = useState(chunks[0]?.id || null);
  const [downloading, setDownloading] = useState(null);

  // Export a plain-text list of direct URLs for this chunk (IDM/wget compatible)
  const downloadLinkFile = (chunk) => {
    const lines = chunk.files.map(f => f.url || `# ${f.name} (no public URL)`).join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `r2_part_${chunk.index}_urls.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Trigger sequential browser downloads for every file in chunk
  const downloadAllFiles = async (chunk) => {
    setDownloading(chunk.id);
    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    for (const file of chunk.files) {
      if (!file.url) continue;
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.name;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Small delay so browser doesn't block multiple tabs
      await delay(600);
    }

    setDownloading(null);
  };

  if (!chunks.length) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: 24 }}>
        No files found in bucket.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Info notice */}
      <div className="notice" style={{ marginBottom: 4 }}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
        <span>
          <strong>How 5 GB bundles work:</strong> Files are partitioned by size. Click <em>"Download Links"</em> to get a .txt with direct URLs — paste into <strong>IDM / wget / aria2</strong> for real parallel downloading. Or click <em>"Download All Files"</em> to trigger each file download individually in your browser.
        </span>
      </div>

      {/* Chunk cards */}
      {chunks.map((chunk) => {
        const isOpen = expanded === chunk.id;
        const isDownloading = downloading === chunk.id;

        return (
          <div key={chunk.id} className="chunk-card">
            
            {/* Header */}
            <div className="chunk-head">
              <div className="chunk-meta">
                <div className="chunk-num">P{chunk.index}</div>
                <div className="chunk-info">
                  <h3>Part {chunk.index}</h3>
                  <p>{chunk.fileCount} files</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="chunk-size-badge">{chunk.formattedSize}</span>

                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => downloadLinkFile(chunk)}
                  title="Download list of direct URLs (.txt)"
                >
                  <Link2 size={12} />
                  Download Links
                </button>

                <button
                  className="btn btn-orange btn-sm"
                  onClick={() => downloadAllFiles(chunk)}
                  disabled={isDownloading}
                  title="Trigger browser download for every file in this bundle"
                >
                  {isDownloading ? <Loader2 size={12} className="spin" /> : <Download size={12} />}
                  {isDownloading ? 'Downloading...' : 'Download All Files'}
                </button>

                <button
                  onClick={() => setExpanded(isOpen ? null : chunk.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                >
                  {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
              </div>
            </div>

            {/* File list (collapsible) */}
            {isOpen && (
              <div className="chunk-files-list">
                {chunk.files.map((file, i) => (
                  <div key={file.key} className="chunk-file-row">
                    <span className="chunk-file-name" title={file.name}>
                      <span style={{ color: 'var(--text-dim)', marginRight: 8, fontSize: 10 }}>{i + 1}.</span>
                      {file.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span className="chunk-file-size">{file.formattedSize}</span>
                      {file.url && (
                        <a
                          href={file.url}
                          download={file.name}
                          className="btn-link"
                          title="Download this file"
                        >
                          <Download size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Active download status */}
            {isDownloading && (
              <div className="dl-progress">
                Sending individual file downloads to browser — check your downloads bar…
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
