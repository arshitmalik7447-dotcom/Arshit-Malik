/**
 * Tiona Assistant - Root React Application
 * Orchestrates the minimal local widget preview testbed, protected admin portal,
 * and WordPress embed code generation modal.
 */

import React, { useState, useEffect } from 'react';
import { WidgetTestbed } from './components/WidgetTestbed.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';
import { EmbedSnippetModal } from './components/EmbedSnippetModal.tsx';
import { Lock, KeyRound, AlertCircle } from 'lucide-react';

export function App() {
  const [currentView, setCurrentView] = useState<'testbed' | 'admin'>('testbed');
  const [adminKey, setAdminKey] = useState<string>(() => sessionStorage.getItem('tiona_admin_key') || 'tiona-admin-secret-2026');
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [adminKeyInput, setAdminKeyInput] = useState<string>('tiona-admin-secret-2026');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState<boolean>(false);

  // Load widget script into document if not already loaded
  useEffect(() => {
    if (!document.querySelector('script[src*="widget.js"]')) {
      const script = document.createElement('script');
      script.src = '/widget.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleOpenAdmin = () => {
    if (adminKey) {
      setCurrentView('admin');
    } else {
      setShowAdminLogin(true);
    }
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKeyInput.trim()) {
      setLoginError('Please enter your admin secret key.');
      return;
    }

    // Verify key against server
    fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${adminKeyInput.trim()}` }
    })
      .then((res) => {
        if (res.ok) {
          setAdminKey(adminKeyInput.trim());
          sessionStorage.setItem('tiona_admin_key', adminKeyInput.trim());
          setShowAdminLogin(false);
          setCurrentView('admin');
          setLoginError(null);
        } else {
          setLoginError('Invalid administrative key. Please check your credentials.');
        }
      })
      .catch(() => {
        setLoginError('Could not reach backend to verify admin key.');
      });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('tiona_admin_key');
    setAdminKey('');
    setCurrentView('testbed');
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800">
      {currentView === 'testbed' ? (
        <WidgetTestbed
          onOpenAdmin={handleOpenAdmin}
          onOpenSnippet={() => setIsSnippetModalOpen(true)}
        />
      ) : (
        <AdminPortal
          adminKey={adminKey}
          onLogout={handleLogout}
          onOpenSnippet={() => setIsSnippetModalOpen(true)}
        />
      )}

      {/* WordPress Embed Snippet Modal */}
      <EmbedSnippetModal
        isOpen={isSnippetModalOpen}
        onClose={() => setIsSnippetModalOpen(false)}
      />

      {/* Admin Login Dialog */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-100 text-[#0F4C3A] rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Protected Operations Portal</h3>
                <p className="text-xs text-slate-500">Tiona Assistant Operational Screen</p>
              </div>
            </div>

            {loginError && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admin API Key</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={adminKeyInput}
                    onChange={(e) => setAdminKeyInput(e.target.value)}
                    placeholder="Enter admin secret key"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-[#0F4C3A]"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Default development key: <code className="bg-slate-100 px-1 py-0.5 rounded">tiona-admin-secret-2026</code>
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminLogin(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F4C3A] text-white rounded-lg text-xs font-semibold hover:bg-emerald-800"
                >
                  Enter Portal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
