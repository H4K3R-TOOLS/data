import React, { useState, useMemo } from 'react';
import { Search, Download, File, Film, Image as ImageIcon, Archive, ArrowUpDown, CheckSquare, Square, ExternalLink } from 'lucide-react';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { formatBytes } from '../services/r2Service';

export default function FileList({ files, isMock }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('size-desc');
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [isPackagingSelected, setIsPackagingSelected] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Filter & Sort Logic
  const filteredFiles = useMemo(() => {
    let result = files.filter(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    result.sort((a, b) => {
      if (sortBy === 'size-desc') return b.size - a.size;
      if (sortBy === 'size-asc') return a.size - b.size;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'date-desc') return new Date(b.lastModified) - new Date(a.lastModified);
      return 0;
    });

    return result;
  }, [files, searchQuery, sortBy]);

  // Paginated subset
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage) || 1;
  const paginatedFiles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFiles.slice(start, start + itemsPerPage);
  }, [filteredFiles, currentPage]);

  // Toggle Selection
  const toggleSelectAll = () => {
    if (selectedKeys.size === paginatedFiles.length) {
      setSelectedKeys(new Set());
    } else {
      const keys = new Set(paginatedFiles.map(f => f.key));
      setSelectedKeys(keys);
    }
  };

  const toggleSelectOne = (key) => {
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedKeys(next);
  };

  // Download custom zip of selected files
  const handleDownloadSelectedZip = async () => {
    if (selectedKeys.size === 0) return;
    setIsPackagingSelected(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder('R2_Selected_Files');

      const selectedFiles = files.filter(f => selectedKeys.has(f.key));
      for (const file of selectedFiles) {
        if (file.url && !isMock) {
          try {
            const res = await fetch(file.url);
            if (res.ok) {
              const blob = await res.blob();
              folder.file(file.name, blob);
              continue;
            }
          } catch (e) {
            console.warn(`Could not fetch ${file.name}, adding placeholder`, e);
          }
        }
        folder.file(file.name, `Cloudflare R2 File metadata:\nName: ${file.name}\nSize: ${file.formattedSize}`);
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Custom_R2_Selection_${selectedKeys.size}_Files.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      confetti({ particleCount: 40, spread: 50 });
    } catch (err) {
      alert(`Error creating custom zip: ${err.message}`);
    } finally {
      setIsPackagingSelected(false);
    }
  };

  const selectedTotalBytes = useMemo(() => {
    return files
      .filter(f => selectedKeys.has(f.key))
      .reduce((acc, curr) => acc + curr.size, 0);
  }, [files, selectedKeys]);

  return (
    <div className="glass-panel overflow-hidden">
      
      {/* Controls Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/50">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search R2 files..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50"
          />
        </div>

        {/* Sort & Multi-Select Zip Trigger */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            >
              <option value="size-desc">Size: Largest First</option>
              <option value="size-asc">Size: Smallest First</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="date-desc">Date: Newest First</option>
            </select>
          </div>

          {selectedKeys.size > 0 && (
            <button
              onClick={handleDownloadSelectedZip}
              disabled={isPackagingSelected}
              className="btn-primary text-xs py-1.5 px-3 animate-fade-in"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Zip Selected ({selectedKeys.size} • {formatBytes(selectedTotalBytes)})</span>
            </button>
          )}

        </div>
      </div>

      {/* File Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="p-3.5 w-10 text-center">
                <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-200">
                  {selectedKeys.size === paginatedFiles.length && paginatedFiles.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-orange-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="p-3.5">Filename</th>
              <th className="p-3.5">Type</th>
              <th className="p-3.5">Size</th>
              <th className="p-3.5">Last Modified</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedFiles.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500">
                  No files match your search criteria.
                </td>
              </tr>
            ) : (
              paginatedFiles.map((file) => {
                const isSelected = selectedKeys.has(file.key);
                return (
                  <tr
                    key={file.key}
                    className={`hover:bg-slate-900/60 transition-colors ${
                      isSelected ? 'bg-orange-500/5' : ''
                    }`}
                  >
                    <td className="p-3.5 text-center">
                      <button onClick={() => toggleSelectOne(file.key)} className="text-slate-400">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-orange-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                        )}
                      </button>
                    </td>
                    <td className="p-3.5 font-mono text-slate-200 max-w-xs truncate font-medium">
                      {file.name}
                    </td>
                    <td className="p-3.5">
                      <span className="badge bg-slate-800 text-slate-300 border-slate-700 font-mono text-[10px]">
                        {file.type}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-orange-400 font-medium">
                      {file.formattedSize}
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      {new Date(file.lastModified).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="p-3.5 text-right">
                      {file.url ? (
                        <a
                          href={file.url}
                          download={file.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-slate-300 hover:text-orange-400 bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-800 transition-colors font-mono text-[11px]"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </a>
                      ) : (
                        <span className="text-slate-600 text-[11px]">Unavailable</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-950/40">
        <span>
          Showing {paginatedFiles.length} of {filteredFiles.length} files
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-secondary text-xs py-1 px-2.5 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="font-mono text-slate-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn-secondary text-xs py-1 px-2.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

    </div>
  );
}
