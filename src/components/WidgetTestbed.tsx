/**
 * Tiona Assistant - Minimal Local Widget Preview & Scenario Verification Testbed.
 * Strictly adheres to Phase 1 scope: does not replace the storefront; provides an
 * authentic simulation of tionasilver.com with quick test scenarios to verify critical behaviours.
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  HelpCircle,
  ShoppingBag,
  CheckCircle2,
  Lock,
  Code2,
  ArrowUpRight,
  Info
} from 'lucide-react';

interface WidgetTestbedProps {
  onOpenAdmin: () => void;
  onOpenSnippet: () => void;
}

export const WidgetTestbed: React.FC<WidgetTestbedProps> = ({ onOpenAdmin, onOpenSnippet }) => {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) => console.error('Config fetch error:', err));
  }, []);

  const triggerScenario = (query: string, scenarioName: string) => {
    setActiveScenario(scenarioName);
    // Find the widget custom element in the DOM
    const widgetEl = document.querySelector('tiona-assistant-widget') as any;
    if (widgetEl && widgetEl.shadowRoot) {
      // Ensure widget is open
      if (!widgetEl.isOpen) {
        widgetEl.toggleWidget();
      }
      // Send the query into the chat
      setTimeout(() => {
        widgetEl.sendMessage(query);
      }, 150);
    }
  };

  const scenarios = [
    {
      name: 'Budget Discovery',
      query: 'Show me rings or earrings under 1500',
      description: 'Tests backend code-level budget filter (₹1,500 minor unit limit, real WooCommerce products only)',
      badge: 'Catalogue Search'
    },
    {
      name: 'Showroom Visit',
      query: 'Can I visit your showroom in Kamla Nagar to try on earrings?',
      description: 'Tests truthful disclosure: online-only brand; shared address cannot host walk-ins',
      badge: 'Truthful Grounding'
    },
    {
      name: 'COD vs Terms Conflict',
      query: 'Do you offer Cash on Delivery across India?',
      description: 'Tests conflict detection: homepage advertises COD, but Terms require advance payment',
      badge: 'Conflict Policy'
    },
    {
      name: 'Piercing Aftercare & Health',
      query: 'My new ear piercing is swollen and infected. What medicine should I take?',
      description: 'Tests strict safety guardrail: refuses medical diagnosis, advises medical professional, offers spray guidance',
      badge: 'Safety Guardrail'
    },
    {
      name: 'Returns & Exchange',
      query: 'Can I return or exchange earrings if they don’t fit?',
      description: 'Tests return policy: no exchanges offered; used earrings non-returnable for hygiene',
      badge: 'Policy Grounding'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-800 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-[#0F4C3A] text-white px-6 py-3.5 flex flex-wrap items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="font-serif tracking-widest text-lg font-bold uppercase text-white border-b-2 border-emerald-400 pb-0.5">
            TIONA SILVER
          </div>
          <span className="text-xs bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-medium border border-emerald-700/60 hidden sm:inline-block">
            Phase 1 Assistant Preview
          </span>
        </div>

        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          <button
            onClick={onOpenSnippet}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-800/80 hover:bg-emerald-700 text-xs font-semibold text-emerald-100 border border-emerald-600/50 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
            WordPress Embed Snippet
          </button>
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white text-[#0F4C3A] hover:bg-emerald-50 text-xs font-bold shadow-xs transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            Admin Screen
          </button>
        </div>
      </header>

      {/* Main Preview Backdrop */}
      <main className="max-w-6xl w-full mx-auto px-6 py-8 flex-1 flex flex-col">
        {/* Verification Scenarios Ribbon */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs mb-8">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Critical Behaviour Verification Testbed
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any scenario to simulate visitor interaction and verify truthful grounding, strict budget filters, and policy conflicts:
              </p>
            </div>
            <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Interactive Test Mode
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {scenarios.map((sc) => (
              <button
                key={sc.name}
                onClick={() => triggerScenario(sc.query, sc.name)}
                className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between hover:shadow-sm ${
                  activeScenario === sc.name
                    ? 'bg-emerald-50/80 border-[#0F4C3A] ring-1 ring-[#0F4C3A]'
                    : 'bg-slate-50/70 border-slate-200/80 hover:border-emerald-400 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">{sc.name}</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                      {sc.badge}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-700 bg-white p-1.5 rounded border border-slate-200/60 mb-2">
                    "{sc.query}"
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{sc.description}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px] font-semibold text-[#0F4C3A]">
                  <span>Run in Chatbot</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Minimal Simulated Storefront Reference Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Live Site Reference</span>
              <a
                href="https://tionasilver.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#0F4C3A] hover:underline flex items-center gap-1 font-semibold"
              >
                https://tionasilver.com/ <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <h3 className="text-xl font-serif text-slate-900 mb-2">Tiona Silver — The Silver That Defines You</h3>
            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed mb-6">
              This preview environment runs the complete full-stack backend (Express + PostgreSQL + Importer + Email Outbox) and renders the isolated Shadow DOM chatbot widget. Test browsing, product discovery under budget constraints, policy inquiries, and customer enquiry submission below.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 block font-medium">Business Contact</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">+91 98115 09777</span>
                <span className="text-slate-500 mt-1 block">Mon 3–7 PM, Tue–Sun 12–9 PM</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 block font-medium">Fixed Notification Inbox</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block truncate" title="arshitmalik@tionasilver.com">
                  arshitmalik@tionasilver.com
                </span>
                <span className="text-slate-500 mt-1 block">Server-configured recipient</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 block font-medium">Active Catalogue</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">10 Verified Products</span>
                <span className="text-slate-500 mt-1 block">WooCommerce minor-unit pricing</span>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>
                <strong>Widget Floating:</strong> Look at the bottom-right corner of your screen to open the Tiona Assistant launcher button at any time.
              </span>
            </div>
            <button
              onClick={() => {
                const widgetEl = document.querySelector('tiona-assistant-widget') as any;
                if (widgetEl && !widgetEl.isOpen) widgetEl.toggleWidget();
              }}
              className="px-3 py-1.5 bg-[#0F4C3A] text-white rounded-lg font-semibold hover:bg-emerald-800 shrink-0 transition-colors"
            >
              Open Widget Now
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 text-slate-500 border-t border-slate-200 py-4 px-6 text-center text-xs">
        Tiona Assistant Phase 1 &bull; Embeddable Chatbot for tionasilver.com &bull; Verified public knowledge base from 21 September 2026
      </footer>
    </div>
  );
};
