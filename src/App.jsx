import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import StorageOverview from './components/StorageOverview';
import ChunkManager from './components/ChunkManager';
import FileList from './components/FileList';
import EnvConfigModal from './components/EnvConfigModal';
import { fetchR2Objects, groupFilesIntoChunks } from './services/r2Service';
import { Layers, HardDrive, FileText, AlertTriangle, ShieldCheck, Sparkles, Server } from 'lucide-react';

export default function App() {
  // Read config from process.env / import.meta.env
  const [config, setConfig] = useState({
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucketName: process.env.R2_BUCKET_NAME || '',
    publicUrl: process.env.R2_PUBLIC_URL || ''
  });

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'chunks' | 'files'
  const [data, setData] = useState({
    files: [],
    totalSizeBytes: 0,
    fileCount: 0,
    isMock: true,
    error: null
  });
  const [loading, setLoading] = useState(true);
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false);

  // Fetch R2 bucket data
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchR2Objects(config);
      setData(res);
    } catch (err) {
      console.error('Error loading R2 data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [config]);

  // Compute 5 GB Chunks
  const chunks = useMemo(() => {
    return groupFilesIntoChunks(data.files);
  }, [data.files]);

  return (
    <div className="min-h-screen flex flex-col selection:bg-orange-500/30 selection:text-orange-200">
      
      {/* Navigation Header */}
      <Header
        config={config}
        isMock={data.isMock}
        onRefresh={loadData}
        onOpenEnvModal={() => setIsEnvModalOpen(true)}
        loading={loading}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Connection Notice / Warning if Secret Key missing */}
        {data.isMock && (
          <div className="glass-panel p-4 mb-6 border-amber-500/30 bg-amber-950/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-300">
                <span className="font-bold text-amber-400">Showing 30 GB Realistic Demo Mode:</span> Live Cloudflare R2 bucket listing requires <code className="text-orange-400 font-mono">R2_SECRET_ACCESS_KEY</code> in environment variables.
              </div>
            </div>
            <button
              onClick={() => setIsEnvModalOpen(true)}
              className="btn-primary text-xs py-1.5 px-3 shrink-0"
            >
              Add Secret Key
            </button>
          </div>
        )}

        {/* Tab Navigation Controls */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-md shadow-orange-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Storage Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('chunks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'chunks'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-md shadow-orange-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>5 GB Download Bundles ({chunks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('files')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'files'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-md shadow-orange-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>All Objects ({data.fileCount})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span>Region: auto • S3 API v2</span>
          </div>
        </div>

        {/* Tab 1: Overview Dashboard */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in">
            <StorageOverview
              totalSizeBytes={data.totalSizeBytes}
              fileCount={data.fileCount}
              chunks={chunks}
              onSelectTab={setActiveTab}
            />

            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-100 font-heading flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-400" />
                  <span>Available 5 GB Zip Download Bundles</span>
                </h3>
                <button
                  onClick={() => setActiveTab('chunks')}
                  className="text-xs text-orange-400 hover:underline font-medium"
                >
                  Manage all {chunks.length} bundles &rarr;
                </button>
              </div>

              <ChunkManager chunks={chunks} isMock={data.isMock} />
            </div>
          </div>
        )}

        {/* Tab 2: 5 GB Chunk Partition Manager */}
        {activeTab === 'chunks' && (
          <div className="animate-fade-in">
            <ChunkManager chunks={chunks} isMock={data.isMock} />
          </div>
        )}

        {/* Tab 3: All Files Table */}
        {activeTab === 'files' && (
          <div className="animate-fade-in">
            <FileList files={data.files} isMock={data.isMock} />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>© 2026 Cloudflare R2 Storage Manager • Optimized for Vercel Deployment</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Bucket: <code className="text-orange-400">{config.bucketName}</code></span>
            <span>•</span>
            <button onClick={() => setIsEnvModalOpen(true)} className="hover:text-orange-400 transition-colors">
              ENV Settings
            </button>
          </div>
        </div>
      </footer>

      {/* Environment Config Modal */}
      <EnvConfigModal
        config={config}
        isOpen={isEnvModalOpen}
        onClose={() => setIsEnvModalOpen(false)}
        onSave={(newConfig) => {
          setConfig(newConfig);
          setIsEnvModalOpen(false);
        }}
      />

    </div>
  );
}
