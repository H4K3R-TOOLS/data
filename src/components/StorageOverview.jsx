import React from 'react';
import { Database, Package, Archive, HardDrive, PieChart, Layers, Download, CheckCircle2 } from 'lucide-react';
import { formatBytes } from '../services/r2Service';

export default function StorageOverview({ totalSizeBytes, fileCount, chunks, onSelectTab }) {
  // Free tier benchmark or total storage benchmark (e.g. 50 GB benchmark for visual progress)
  const maxQuotaBytes = Math.max(totalSizeBytes * 1.2, 50 * 1024 * 1024 * 1024);
  const usedPercentage = Math.min(100, Math.round((totalSizeBytes / maxQuotaBytes) * 100));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      
      {/* Card 1: Total Bucket Size */}
      <div className="glass-panel p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Storage Data</span>
          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <h2 className="text-3xl font-extrabold text-white tracking-tight font-heading">
            {formatBytes(totalSizeBytes)}
          </h2>
          <span className="text-xs text-orange-400 font-medium">Stored</span>
        </div>

        {/* Custom Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-mono">
            <span>Bucket Usage</span>
            <span>{usedPercentage}% of {formatBytes(maxQuotaBytes)}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 shadow-sm transition-all duration-700"
              style={{ width: `${Math.max(4, usedPercentage)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Card 2: Total Files */}
      <div className="glass-panel p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Objects</span>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Package className="w-5 h-5" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight font-heading">
          {fileCount.toLocaleString()}
        </h2>
        <p className="text-xs text-slate-400 mt-2">
          Active files in Cloudflare R2 bucket
        </p>
      </div>

      {/* Card 3: 5GB Chunk Partition Count */}
      <div className="glass-panel p-5 relative overflow-hidden group border-orange-500/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-orange-400 font-semibold">5 GB Download Bundles</span>
          <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <Layers className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <h2 className="text-3xl font-extrabold text-orange-300 tracking-tight font-heading">
            {chunks.length} Parts
          </h2>
          <span className="text-xs text-slate-400">5GB each</span>
        </div>
        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
          <span>Split automatically for fast zip download</span>
        </p>
      </div>

      {/* Card 4: Quick Action Card */}
      <div className="glass-panel p-5 flex flex-col justify-between border-slate-700/60 bg-slate-900/60">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Batch Downloader</span>
          <h3 className="text-sm font-bold text-slate-100 mt-1">Download in 5GB Zips</h3>
          <p className="text-xs text-slate-400 mt-1">
            Easily download high-volume data in manageable 5 GB bundles.
          </p>
        </div>
        <button
          onClick={() => onSelectTab('chunks')}
          className="btn-primary text-xs w-full justify-center mt-3 py-2"
        >
          <Download className="w-4 h-4" />
          <span>View 5 GB Bundles</span>
        </button>
      </div>

    </div>
  );
}
