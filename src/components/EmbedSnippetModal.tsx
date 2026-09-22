/**
 * WordPress Embed Snippet Modal.
 * Generates the clean, asynchronous embed code snippet and provides
 * explicit step-by-step instructions for Elementor and WordPress sites.
 */

import React, { useState } from 'react';
import { X, Copy, Check, Code, ShieldCheck, HelpCircle } from 'lucide-react';

interface EmbedSnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmbedSnippetModal: React.FC<EmbedSnippetModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = window.location.origin;
  const embedCode = `<!-- Tiona Assistant Chatbot Embed (Encapsulated Shadow DOM) -->
<script async src="${currentOrigin}/widget.js" data-api="${currentOrigin}"></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#0F4C3A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Code className="w-5 h-5 text-emerald-300" />
            <div>
              <h2 className="text-base font-bold">WordPress / Elementor Embed Snippet</h2>
              <p className="text-xs text-emerald-100/80">Single asynchronous script with isolated Shadow DOM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-100 hover:text-white rounded-md hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-slate-700 text-sm overflow-y-auto max-h-[80vh]">
          {/* Zero CSS Collision Guarantee */}
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <strong>Isolated Shadow DOM:</strong> The widget does not affect or inherit your WordPress theme’s global CSS. All styles, fonts, and layouts are securely isolated inside a custom Web Component (`&lt;tiona-assistant-widget&gt;`).
            </div>
          </div>

          {/* Snippet Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">Asynchronous Embed Code:</label>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs font-semibold text-[#0F4C3A] hover:underline"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied to Clipboard!' : 'Copy Snippet'}
              </button>
            </div>
            <div className="relative">
              <pre className="p-3.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto selection:bg-emerald-800">
                {embedCode}
              </pre>
            </div>
          </div>

          {/* Installation Instructions */}
          <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-slate-500" />
              How to add to https://tionasilver.com:
            </h4>

            <div className="space-y-2.5">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <div className="font-semibold text-slate-900">Method 1: Hostinger WordPress + WPCode Plugin (Recommended)</div>
                <p className="text-slate-600 mt-0.5">
                  1. In your Hostinger WordPress Dashboard &rarr; <strong>Plugins &rarr; Add New</strong>, search for <strong>WPCode</strong> (Insert Headers and Footers).<br />
                  2. Open <strong>Code Snippets &rarr; Header &amp; Footer</strong>.<br />
                  3. Paste the snippet into <strong>Footer</strong> &rarr; Click <strong>Save Changes</strong>.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <div className="font-semibold text-slate-900">Method 2: Elementor Custom Code / Footer Widget</div>
                <p className="text-slate-600 mt-0.5">
                  1. In WordPress, navigate to <strong>Elementor &rarr; Custom Code</strong> &rarr; <strong>Add New</strong>.<br />
                  2. Select Location: <strong>End of &lt;body&gt;</strong>.<br />
                  3. Paste the snippet and click <strong>Publish</strong> (Entire Site).
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <div className="font-semibold text-slate-900">Method 3: Hostinger VPS / Node.js Deployment Guide</div>
                <p className="text-slate-600 mt-0.5">
                  See <code>HOSTINGER_DEPLOYMENT.md</code> in the project root for full Hostinger VPS (Ubuntu/PM2), hPanel Node.js Application Manager, and Hostinger Titan Email (SMTP) step-by-step setup.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
