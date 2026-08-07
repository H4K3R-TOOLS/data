import React from 'react';
import { Cloud, RefreshCw, Key, ShieldCheck, Database, ExternalLink, Zap } from 'lucide-react';

export default function Header({ config, isMock, onRefresh, onOpenEnvModal, loading }) {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight font-heading">
                Cloudflare R2 Storage Manager
              </h1>
              <span className={`badge ${isMock ? 'badge-amber bg-amber-500/10 text-amber-400 border-amber-500/20' : 'badge-emerald'}`}>
                {isMock ? 'Demo 30GB Mode' : 'Live R2 Connected'}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Bucket:</span>
              <code className="text-orange-400 bg-orange-950/50 px-1.5 py-0.5 rounded font-mono text-[11px]">
                {config.bucketName || 'gallery'}
              </code>
              <span className="text-slate-600">•</span>
              <span>Account:</span>
              <span className="font-mono text-slate-300 text-[11px] truncate max-w-[120px]">
                {config.accountId}
              </span>
            </p>
          </div>
        </div>

        {/* Right Actions & Credentials Button */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn-secondary text-xs py-2 px-3"
            title="Refresh R2 Bucket Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-400' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={onOpenEnvModal}
            className="btn-primary text-xs py-2 px-3.5"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Configure R2 ENV</span>
          </button>

          {config.publicUrl && (
            <a
              href={config.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Open Public R2 Dev Domain"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

      </div>
    </header>
  );
}
