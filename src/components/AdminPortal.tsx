/**
 * Protected Administration Screen for Tiona Assistant.
 * Displays real-time enquiries, email outbox statuses with retries,
 * knowledge source conflicts, catalogue verification, and manual sync controls.
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  RefreshCw,
  AlertTriangle,
  Mail,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  Filter,
  ArrowRight,
  Database,
  Lock,
  Code2,
  FileText
} from 'lucide-react';
import { Enquiry, OutboxJob, KnowledgeSource, Product } from '../types.ts';

interface AdminPortalProps {
  adminKey: string;
  onLogout: () => void;
  onOpenSnippet: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ adminKey, onLogout, onOpenSnippet }) => {
  const [activeTab, setActiveTab] = useState<'enquiries' | 'outbox' | 'sources' | 'catalogue'>('enquiries');
  const [stats, setStats] = useState<any>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [outboxJobs, setOutboxJobs] = useState<OutboxJob[]>([]);
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState<string>('');

  const headers = {
    'Authorization': `Bearer ${adminKey}`,
    'Content-Type': 'application/json'
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchEnquiries = async () => {
    try {
      setIsLoading(true);
      const url = statusFilter === 'all' ? '/api/admin/enquiries' : `/api/admin/enquiries?status=${statusFilter}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setEnquiries(data);
      }
    } catch (err) {
      console.error('Error fetching enquiries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOutbox = async () => {
    try {
      const res = await fetch('/api/admin/outbox', { headers });
      if (res.ok) {
        const data = await res.json();
        setOutboxJobs(data);
      }
    } catch (err) {
      console.error('Error fetching outbox:', err);
    }
  };

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/admin/sources', { headers });
      if (res.ok) {
        const data = await res.json();
        setSources(data);
      }
    } catch (err) {
      console.error('Error fetching sources:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?limit=50');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchEnquiries();
    fetchOutbox();
    fetchSources();
    fetchProducts();
  }, [adminKey, statusFilter]);

  const handleStatusChange = async (enquiryId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus, admin_notes: adminNotesInput })
      });
      if (res.ok) {
        const updated = await res.json();
        setEnquiries((prev) => prev.map((e) => (e.id === enquiryId ? { ...e, ...updated } : e)));
        if (selectedEnquiry && selectedEnquiry.id === enquiryId) {
          setSelectedEnquiry({ ...selectedEnquiry, ...updated });
        }
        fetchStats();
      }
    } catch (err) {
      console.error('Error updating enquiry:', err);
    }
  };

  const handleRetryOutbox = async (jobId: number) => {
    try {
      const res = await fetch(`/api/admin/outbox/${jobId}/retry`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        fetchOutbox();
        fetchStats();
      }
    } catch (err) {
      console.error('Error retrying job:', err);
    }
  };

  const handleManualSync = async () => {
    try {
      setIsLoading(true);
      setSyncMessage('Starting manual WooCommerce and policy sync...');
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers
      });
      const data = await res.json();
      setSyncMessage(`Sync completed: ${data.catalogue?.message || 'Updated.'}`);
      fetchStats();
      fetchProducts();
      fetchSources();
    } catch (err) {
      setSyncMessage('Sync failed. Check console.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-[#0F4C3A] text-white px-6 py-4 flex flex-wrap items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-800 flex items-center justify-center border border-emerald-600/40">
            <Shield className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Tiona Assistant — Operations Control</h1>
            <p className="text-xs text-emerald-200/80">Protected Merchant Administration & Knowledge Monitor</p>
          </div>
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
            onClick={handleManualSync}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Manual Refresh
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            Exit Admin
          </button>
        </div>
      </header>

      {/* Sync Banner Notification */}
      {syncMessage && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 px-6 py-2 text-xs flex justify-between items-center">
          <span>{syncMessage}</span>
          <button onClick={() => setSyncMessage(null)} className="text-emerald-700 font-bold hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Stats Ribbon */}
      <div className="max-w-7xl w-full mx-auto px-6 py-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">New Enquiries</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{stats?.new_enquiries ?? 0}</div>
          <span className="text-[11px] text-slate-500">Awaiting review</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Leads</span>
          <div className="text-2xl font-bold text-slate-800 mt-1">{stats?.total_enquiries ?? 0}</div>
          <span className="text-[11px] text-slate-500">Persisted in database</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Policy Conflicts</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{stats?.flagged_sources ?? 2}</div>
          <span className="text-[11px] text-slate-500">Homepage vs Terms</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Active Products</span>
          <div className="text-2xl font-bold text-slate-800 mt-1">{stats?.active_products ?? 10}</div>
          <span className="text-[11px] text-slate-500">Verified catalogue</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Outbox Recipient</span>
          <div className="text-xs font-bold text-slate-700 mt-1 truncate" title={stats?.fixed_recipient}>
            {stats?.fixed_recipient || 'arshitmalik@tionasilver.com'}
          </div>
          <span className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3 h-3" /> Fixed server target
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto px-6 pb-12 flex-1 flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'enquiries'
                ? 'border-[#0F4C3A] text-[#0F4C3A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-4 h-4" />
            Customer Enquiries ({enquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('outbox')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'outbox'
                ? 'border-[#0F4C3A] text-[#0F4C3A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            Email Outbox ({outboxJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'sources'
                ? 'border-[#0F4C3A] text-[#0F4C3A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Knowledge & Conflicts ({sources.length})
          </button>
          <button
            onClick={() => setActiveTab('catalogue')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'catalogue'
                ? 'border-[#0F4C3A] text-[#0F4C3A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            Verified Catalogue ({products.length})
          </button>
        </div>

        {/* TAB 1: ENQUIRIES */}
        {activeTab === 'enquiries' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
            {/* List column */}
            <div className="lg:col-span-7 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
                  {(['all', 'new', 'in_progress', 'resolved'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                        statusFilter === st
                          ? 'bg-[#0F4C3A] text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-400">Total: {enquiries.length}</span>
              </div>

              <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px]">
                {enquiries.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No customer enquiries found matching the selected filter.
                  </div>
                ) : (
                  enquiries.map((enq) => (
                    <div
                      key={enq.id}
                      onClick={() => {
                        setSelectedEnquiry(enq);
                        setAdminNotesInput(enq.admin_notes || '');
                      }}
                      className={`p-4 cursor-pointer transition-colors hover:bg-emerald-50/30 ${
                        selectedEnquiry?.id === enq.id ? 'bg-emerald-50/60 border-l-4 border-l-[#0F4C3A]' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-700">{enq.reference}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              enq.status === 'new'
                                ? 'bg-emerald-100 text-emerald-800'
                                : enq.status === 'in_progress'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {enq.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(enq.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-sm font-semibold text-slate-900">{enq.name}</div>
                      <div className="text-xs text-slate-600 line-clamp-1 mt-0.5">{enq.message}</div>

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{enq.enquiry_type}</span>
                        {enq.product_name && (
                          <span className="text-emerald-700 font-medium truncate max-w-[200px]">
                            💎 {enq.product_name}
                          </span>
                        )}
                        {enq.email_status && (
                          <span className="ml-auto text-[10px] text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {enq.email_status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Detail column */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col">
              {selectedEnquiry ? (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <span className="text-xs font-mono font-bold text-[#0F4C3A]">{selectedEnquiry.reference}</span>
                      <h2 className="text-base font-bold text-slate-900">{selectedEnquiry.name}</h2>
                    </div>
                    <div className="flex gap-1.5">
                      {(['new', 'in_progress', 'resolved'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(selectedEnquiry.id, s)}
                          className={`px-2 py-1 text-xs font-semibold rounded capitalize ${
                            selectedEnquiry.status === s
                              ? 'bg-[#0F4C3A] text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {s.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="py-4 space-y-3 flex-1 overflow-y-auto text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Contact Method ({selectedEnquiry.reply_method}):</span>
                      <span className="text-slate-800 font-semibold text-sm">{selectedEnquiry.reply_value}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Enquiry Category:</span>
                      <span className="text-slate-800 font-medium">{selectedEnquiry.enquiry_type}</span>
                    </div>

                    {selectedEnquiry.order_reference && (
                      <div>
                        <span className="text-slate-400 block font-medium">Customer Order Reference:</span>
                        <span className="text-slate-800 font-semibold font-mono">{selectedEnquiry.order_reference}</span>
                      </div>
                    )}

                    {selectedEnquiry.product_name && (
                      <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200/70">
                        <span className="text-emerald-800 text-[11px] font-semibold block">Referenced Product:</span>
                        <a
                          href={selectedEnquiry.product_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-900 font-bold hover:underline flex items-center gap-1 mt-0.5 text-xs"
                        >
                          {selectedEnquiry.product_name}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    <div>
                      <span className="text-slate-400 block font-medium mb-1">Customer Message:</span>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 whitespace-pre-wrap leading-relaxed text-xs">
                        {selectedEnquiry.message}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium mb-1">Internal Admin Notes:</span>
                      <textarea
                        rows={2}
                        value={adminNotesInput}
                        onChange={(e) => setAdminNotesInput(e.target.value)}
                        placeholder="Add notes for your team (e.g. Called customer at 4 PM)..."
                        className="w-full p-2 border border-slate-200 rounded-md text-xs outline-none focus:border-[#0F4C3A]"
                      />
                      <button
                        onClick={() => handleStatusChange(selectedEnquiry.id, selectedEnquiry.status)}
                        className="mt-1.5 px-3 py-1 bg-slate-800 text-white rounded text-xs font-semibold hover:bg-slate-700"
                      >
                        Save Notes
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      <div>Consent timestamp: {selectedEnquiry.consent_timestamp}</div>
                      <div>Dispatched to: arshitmalik@tionasilver.com</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center text-xs">
                  <FileText className="w-10 h-10 stroke-1 mb-2 text-slate-300" />
                  Select an enquiry from the list to view complete customer details, referenced products, and update resolution status.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: OUTBOX */}
        {activeTab === 'outbox' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Email Outbox Dispatch Queue</h3>
                <p className="text-xs text-slate-500">
                  Fixed target: <code className="bg-slate-200 px-1 py-0.5 rounded">{stats?.fixed_recipient}</code> (SMTP configured: {stats?.is_smtp_configured ? 'Yes' : 'Development Test Transport'})
                </p>
              </div>
              <button
                onClick={fetchOutbox}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Refresh Outbox
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600">
                    <th className="p-3 font-semibold">Ref</th>
                    <th className="p-3 font-semibold">Recipient</th>
                    <th className="p-3 font-semibold">Subject</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Attempts</th>
                    <th className="p-3 font-semibold">Last Attempt</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {outboxJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-[#0F4C3A]">{job.enquiry_reference}</td>
                      <td className="p-3 font-medium text-slate-700">{job.recipient}</td>
                      <td className="p-3 text-slate-800 max-w-xs truncate">{job.subject}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            job.status === 'provider_accepted' || job.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : job.status === 'queued'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono">{job.attempts} / {job.max_attempts}</td>
                      <td className="p-3 text-slate-400">
                        {job.last_attempt_at ? new Date(job.last_attempt_at).toLocaleTimeString() : 'Pending'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleRetryOutbox(job.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px]"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SOURCES & CONFLICTS */}
        {activeTab === 'sources' && (
          <div className="space-y-6">
            {/* Conflicts Warning Card */}
            <div className="p-5 bg-amber-50/90 border-2 border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-200/80 rounded-lg text-amber-900 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950">Active Website Policy Conflicts Flagged</h3>
                  <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
                    The bot is strictly configured NOT to choose policies silently or promise eligibility. When visitors ask about these topics, the bot explains the discrepancy and immediately hands off to the team via WhatsApp or an enquiry:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div className="p-3 bg-white/80 rounded-lg border border-amber-200/80 text-xs">
                      <div className="font-bold text-amber-950">1. Cash on Delivery vs Payment Confirmation</div>
                      <p className="text-slate-600 mt-1">
                        Homepage advertises COD across India; Terms & Conditions state orders are confirmed after successful payment. Team must confirm for customer’s PIN code.
                      </p>
                    </div>
                    <div className="p-3 bg-white/80 rounded-lg border border-amber-200/80 text-xs">
                      <div className="font-bold text-amber-950">2. Returns vs Exchanges</div>
                      <p className="text-slate-600 mt-1">
                        Homepage explicitly states exchanges are not offered; Terms refer generally to returns/exchanges. Used earrings/piercings are strictly non-returnable unless defective.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sources Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800">Knowledge Sources & Unverified URL Review Queue</h3>
              </div>

              <div className="divide-y divide-slate-100">
                {sources.map((src) => (
                  <div key={src.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{src.title}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            src.approval_status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : src.approval_status === 'conflict'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {src.approval_status}
                        </span>
                      </div>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#0F4C3A] hover:underline flex items-center gap-1 mt-0.5 font-mono"
                      >
                        {src.url} <ExternalLink className="w-3 h-3" />
                      </a>
                      {src.conflict_notes && (
                        <p className="text-xs text-slate-500 mt-1 italic">{src.conflict_notes}</p>
                      )}
                    </div>

                    <div className="text-right text-xs text-slate-400">
                      <div>Status: <span className="font-semibold text-slate-600">{src.sync_status}</span></div>
                      <div>Hash: <span className="font-mono">{src.content_hash}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CATALOGUE */}
        {activeTab === 'catalogue' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Verified Starter WooCommerce Catalogue (10 Products)</h3>
                <p className="text-xs text-slate-500">
                  Checked on 21 September 2026. Stored as integer minor units (paise). Unknown fields strictly preserved as unknown.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {products.map((p) => {
                const img = p.images && p.images[0] ? p.images[0].src : '';
                const price = (p.price_minor / 100).toLocaleString('en-IN');
                const regPrice = p.regular_price_minor ? (p.regular_price_minor / 100).toLocaleString('en-IN') : null;
                return (
                  <div key={p.id} className="border border-slate-200 rounded-lg p-3 flex flex-col justify-between hover:border-emerald-500 transition-colors">
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                        <span>ID #{p.id}</span>
                        <span className="text-emerald-700 font-semibold">{p.in_stock ? 'In Stock' : 'Out of Stock'}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{p.name}</h4>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-sm font-bold text-[#0F4C3A]">₹{price}</span>
                        {regPrice && regPrice !== price && (
                          <span className="text-xs line-through text-slate-400">₹{regPrice}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-1.5">{p.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{p.design_theme || '925 Silver'}</span>
                      <a
                        href={p.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0F4C3A] font-semibold hover:underline flex items-center gap-0.5"
                      >
                        View <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
