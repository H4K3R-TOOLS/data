import React, { useState } from 'react';
import { Download, ChevronDown, ChevronUp, Link2, Loader2 } from 'lucide-react';

export default function ChunkManager({ chunks }) {
  const [expanded, setExpanded] = useState(chunks[0]?.id || null);
  const [downloading, setDownloading] = useState(null);

  const downloadLinkFile = (chunk) => {
    const lines = chunk.files.map(f => f.url || `# ${f.name} (no public URL)`).join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `r2_part_${chunk.index}_urls.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

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
    <div className="chunks-grid">

      {/* Info notice */}
      <div className="notice" style={{ marginBottom: 0 }}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
        </svg>
        <span>
          <strong>Download Links</strong> → .txt file with direct URLs (paste into IDM/wget/aria2).
          {' '}<strong>Download All Files</strong> → triggers each file individually in your browser.
        </span>
      </div>

      {/* Chunk cards */}
      {chunks.map((chunk) => {
        const isOpen = expanded === chunk.id;
        const isDownloading = downloading === chunk.id;

        return (
          <div key={chunk.id} className="chunk-card">

            {/* Header row */}
            <div className="chunk-head">
              <div className="chunk-meta">
                <div className="chunk-num">P{chunk.index}</div>
                <div className="chunk-info">
                  <h3>Part {chunk.index}</h3>
                  <p>{chunk.fileCount} files</p>
                </div>
              </div>
              <span className="chunk-size-badge">{chunk.formattedSize}</span>
            </div>

            {/* Action buttons */}
            <div className="chunk-actions">
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
              >
                {isDownloading
                  ? <Loader2 size={12} className="spin" />
                  : <Download size={12} />}
                {isDownloading ? 'Downloading...' : 'Download All Files'}
              </button>

              <button
                onClick={() => setExpanded(isOpen ? null : chunk.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: '4px', marginLeft: 'auto'
                }}
              >
                {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </div>

            {/* Collapsible file list */}
            {isOpen && (
              <div className="chunk-files-list">
                {chunk.files.map((file, i) => (
                  <div key={file.key} className="chunk-file-row">
                    <span className="chunk-file-name" title={file.name}>
                      <span style={{ color: 'var(--text-dim)', marginRight: 8, fontSize: 10 }}>
                        {i + 1}.
                      </span>
                      {file.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span className="chunk-file-size">{file.formattedSize}</span>
                      {file.url && (
                        <a
                          href={file.url}
                          download={file.name}
                          className="btn-link"
                          title="Download"
                        >
                          <Download size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Download status bar */}
            {isDownloading && (
              <div className="dl-progress">
                Sending file downloads to browser — check your downloads bar…
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}
