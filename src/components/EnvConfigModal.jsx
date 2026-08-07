import React, { useState } from 'react';
import { X, Key, Copy, Check, ExternalLink, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

export default function EnvConfigModal({ config, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    accountId: config.accountId || '',
    accessKeyId: config.accessKeyId || '',
    secretAccessKey: config.secretAccessKey || '',
    bucketName: config.bucketName || '',
    publicUrl: config.publicUrl || ''
  });

  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyVercelEnv = () => {
    const envText = `R2_ACCOUNT_ID=${formData.accountId}\nR2_ACCESS_KEY_ID=${formData.accessKeyId}\nR2_SECRET_ACCESS_KEY=${formData.secretAccessKey}\nR2_BUCKET_NAME=${formData.bucketName}\nR2_PUBLIC_URL=${formData.publicUrl}`;
    navigator.clipboard.writeText(envText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-xl p-6 bg-slate-950/90 border-slate-700 shadow-2xl relative">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-heading">
                Cloudflare R2 Credentials & Vercel ENV
              </h2>
              <p className="text-xs text-slate-400">Configure connection settings for live bucket sync</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div>
            <label className="block text-slate-300 font-medium mb-1 font-mono">
              R2_ACCOUNT_ID
            </label>
            <input
              type="text"
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono focus:border-orange-500 focus:outline-none"
              placeholder="e.g. 834cdd6acb7fc24342197494945b98ae"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1 font-mono">
              R2_ACCESS_KEY_ID
            </label>
            <input
              type="text"
              value={formData.accessKeyId}
              onChange={(e) => setFormData({ ...formData, accessKeyId: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono focus:border-orange-500 focus:outline-none"
              placeholder="e.g. 9267d1729599e5bcd98216b0be63da53"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1 font-mono flex items-center justify-between">
              <span>R2_SECRET_ACCESS_KEY</span>
              <span className="text-[10px] text-amber-400">Required for direct S3 fetch</span>
            </label>
            <input
              type="password"
              value={formData.secretAccessKey}
              onChange={(e) => setFormData({ ...formData, secretAccessKey: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono focus:border-orange-500 focus:outline-none"
              placeholder="Enter your Cloudflare R2 secret access key"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1 font-mono">
                R2_BUCKET_NAME
              </label>
              <input
                type="text"
                value={formData.bucketName}
                onChange={(e) => setFormData({ ...formData, bucketName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono focus:border-orange-500 focus:outline-none"
                placeholder="gallery"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1 font-mono">
                R2_PUBLIC_URL
              </label>
              <input
                type="text"
                value={formData.publicUrl}
                onChange={(e) => setFormData({ ...formData, publicUrl: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono focus:border-orange-500 focus:outline-none"
                placeholder="https://pub-...r2.dev"
              />
            </div>
          </div>

          {/* Vercel Deployment Copy Banner */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between mt-2">
            <div>
              <p className="font-semibold text-slate-200">Deploying to Vercel?</p>
              <p className="text-[11px] text-slate-400">Copy pre-formatted variables directly to Vercel Dashboard.</p>
            </div>
            <button
              type="button"
              onClick={handleCopyVercelEnv}
              className="btn-secondary text-[11px] py-1.5 px-3 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy ENV for Vercel'}</span>
            </button>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apply & Save</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
