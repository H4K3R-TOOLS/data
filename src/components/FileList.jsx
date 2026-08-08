import React, { useState, useMemo } from 'react';
import { Search, Download, ArrowUpDown } from 'lucide-react';

export default function FileList({ files }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('size-desc');
  const [page, setPage] = useState(1);
  const PER_PAGE = 30;

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let list = files.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.type.toLowerCase().includes(q)
    );
    if (sort === 'size-desc') list.sort((a, b) => b.size - a.size);
    else if (sort === 'size-asc') list.sort((a, b) => a.size - b.size);
    else if (sort === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [files, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1 }}>
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path stroke="currentColor" strokeWidth="2" d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Search files..."
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            style={{ maxWidth: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowUpDown size={13} color="var(--text-muted)" />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text)',
              padding: '7px 10px',
              fontSize: 12,
              outline: 'none'
            }}
          >
            <option value="size-desc">Largest first</option>
            <option value="size-asc">Smallest first</option>
            <option value="name-asc">Name A–Z</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="file-table-wrap">
        <table className="file-table">
          <thead>
            <tr>
              <th>#</th>
              <th>File Name</th>
              <th>Type</th>
              <th>Size</th>
              <th>Modified</th>
              <th style={{ textAlign: 'right' }}>Download</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                  No files found
                </td>
              </tr>
            )}
            {visible.map((file, i) => (
              <tr key={file.key}>
                <td style={{ color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: 11 }}>
                  {(page - 1) * PER_PAGE + i + 1}
                </td>
                <td>
                  <span className="fname" title={file.key}>{file.name}</span>
                </td>
                <td><span className="ftype">{file.type}</span></td>
                <td><span className="fsize">{file.formattedSize}</span></td>
                <td><span className="fdate">{file.lastModified}</span></td>
                <td style={{ textAlign: 'right' }}>
                  {file.url ? (
                    <a href={file.url} download={file.name} className="btn-link" title={`Download ${file.name}`}>
                      <Download size={12} />
                      Download
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>No URL</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="pagination">
          <span>{filtered.length} files</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <span style={{ fontFamily: 'monospace' }}>Page {page} / {totalPages}</span>
            <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
