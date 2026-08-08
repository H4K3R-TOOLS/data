import React, { useState, useEffect } from 'react';
import { Lock, LogOut, ToggleLeft, ToggleRight, Save, Shield, HardDrive, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(() => sessionStorage.getItem('adm_tok') || '');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [config, setConfig] = useState({ mainPageEnabled: true, dataLimitGB: 0 });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);

  // Check if already have token in session
  useEffect(() => {
    if (token) {
      loadConfig(token);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setLoginError('Wrong password. Try again.');
        return;
      }
      const { token: tok } = await res.json();
      sessionStorage.setItem('adm_tok', tok);
      setToken(tok);
      setAuthed(true);
      loadConfig(tok);
    } catch (err) {
      setLoginError('Connection error. Try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const loadConfig = async (tok) => {
    setConfigLoading(true);
    try {
      const res = await fetch('/api/admin-settings', {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.status === 403) {
        // Token expired
        sessionStorage.removeItem('adm_tok');
        setToken('');
        setAuthed(false);
        return;
      }
      const data = await res.json();
      setConfig(data);
      setAuthed(true);
    } catch (err) {
      console.error(err);
    } finally {
      setConfigLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/admin-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      alert('Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adm_tok');
    setToken('');
    setAuthed(false);
    setPassword('');
  };

  const LIMIT_OPTIONS = [
    { value: 0,  label: 'Show All Data' },
    { value: 10, label: '10 GB' },
    { value: 20, label: '20 GB' },
    { value: 30, label: '30 GB' },
    { value: 50, label: '50 GB' },
  ];

  // ── Login Screen ──────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14,
          padding: '40px 36px', width: '100%', maxWidth: 380, boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'var(--orange-dim)', border: '1px solid var(--orange-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px', color: 'var(--orange)',
            }}>
              <Shield size={22} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Admin Panel</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Enter your password to continue</p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Admin password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                  borderRadius: 9, padding: '11px 42px 11px 14px', fontSize: 13,
                  color: 'var(--text)', outline: 'none', transition: 'border-color 0.15s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  padding: 0,
                }}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {loginError && (
              <div style={{
                fontSize: 12, color: '#f87171', background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)', borderRadius: 7, padding: '8px 12px',
                marginBottom: 12,
              }}>
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading || !password}
              className="btn btn-orange"
              style={{ width: '100%', justifyContent: 'center', padding: '11px' }}
            >
              {loginLoading ? <Loader2 size={14} className="spin" /> : <Lock size={14} />}
              {loginLoading ? 'Verifying…' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Admin Dashboard ───────────────────────────────────────────
  return (
    <div className="app-wrap" style={{ maxWidth: 700 }}>
      {/* Header */}
      <div className="topbar">
        <div className="topbar-title">
          <div className="topbar-icon">
            <Shield size={18} />
          </div>
          <div>
            <h1>Admin Panel</h1>
            <p>Control what the main page shows</p>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={handleLogout}>
          <LogOut size={13} />
          Logout
        </button>
      </div>

      {configLoading ? (
        <div className="loading-center">
          <Loader2 size={28} style={{ color: 'var(--orange)' }} className="spin" />
          <span>Loading settings…</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Card 1: Main Page Toggle */}
          <div style={{
            background: 'var(--bg-card)', border: `1px solid ${config.mainPageEnabled ? 'var(--border)' : 'rgba(248,113,113,0.3)'}`,
            borderRadius: 12, padding: '22px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginBottom: 4 }}>
                  Main Page Visibility
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {config.mainPageEnabled
                    ? 'Main page is live. Visitors can see and download files.'
                    : 'Main page is OFF. Visitors see a blank/blocked response. No bypass possible — enforced server-side.'}
                </div>
              </div>
              <button
                onClick={() => setConfig(c => ({ ...c, mainPageEnabled: !c.mainPageEnabled }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
              >
                {config.mainPageEnabled
                  ? <ToggleRight size={44} style={{ color: 'var(--orange)' }} />
                  : <ToggleLeft size={44} style={{ color: 'var(--text-muted)' }} />}
              </button>
            </div>

            <div style={{
              marginTop: 14, padding: '10px 14px', borderRadius: 8, fontSize: 12,
              background: config.mainPageEnabled ? 'rgba(34,197,94,0.07)' : 'rgba(248,113,113,0.07)',
              border: `1px solid ${config.mainPageEnabled ? 'rgba(34,197,94,0.2)' : 'rgba(248,113,113,0.2)'}`,
              color: config.mainPageEnabled ? '#4ade80' : '#f87171',
              fontWeight: 600,
            }}>
              Status: {config.mainPageEnabled ? '✓ ENABLED — main page is accessible' : '✗ DISABLED — main page returns 403 for all visitors'}
            </div>
          </div>

          {/* Card 2: Data Limit */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '22px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <HardDrive size={16} style={{ color: 'var(--orange)' }} />
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>Data Limit on Main Page</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>
              Control how much of the bucket data is visible to visitors. Limit is applied server-side — users only receive files up to this total size.
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {LIMIT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setConfig(c => ({ ...c, dataLimitGB: opt.value }))}
                  style={{
                    padding: '10px 20px', borderRadius: 9, border: '1px solid',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                    borderColor: config.dataLimitGB === opt.value ? 'var(--orange)' : 'var(--border)',
                    background: config.dataLimitGB === opt.value ? 'var(--orange-dim)' : 'transparent',
                    color: config.dataLimitGB === opt.value ? 'var(--orange)' : 'var(--text-muted)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div style={{
              marginTop: 16, fontSize: 12, color: 'var(--text-muted)',
              padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8,
            }}>
              {config.dataLimitGB === 0
                ? 'All bucket data will be shown to visitors.'
                : `Visitors will only see up to ${config.dataLimitGB} GB of bucket data (sorted by order in bucket).`}
            </div>
          </div>

          {/* Save Button */}
          <button
            className="btn btn-orange"
            onClick={handleSave}
            disabled={saving}
            style={{ alignSelf: 'flex-end', padding: '11px 28px', fontSize: 13 }}
          >
            {saving ? (
              <><Loader2 size={14} className="spin" /> Saving…</>
            ) : saved ? (
              <><CheckCircle size={14} /> Saved!</>
            ) : (
              <><Save size={14} /> Save Settings</>
            )}
          </button>

        </div>
      )}
    </div>
  );
}
