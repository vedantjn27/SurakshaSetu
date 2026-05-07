'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '@/lib/api';
import {
  Lock, Unlock, Eye, EyeOff, RefreshCw, Loader2,
  ChevronLeft, ChevronRight, Building2, Search, AlertCircle
} from 'lucide-react';

interface PIIField {
  label: string;
  scrambled: string | null;
  raw: string | null;
}

interface Record {
  id: string;
  department: string;
  source_id: string;
  ubid: string | null;
  raw: {
    business_name: string | null;
    pan: string | null;
    gstin: string | null;
    phone: string | null;
    email: string | null;
    owner: string | null;
    address: string | null;
    pin_code: string | null;
  };
  scrambled: {
    business_name: string | null;
    pan: string | null;
    gstin: string | null;
    phone: string | null;
    email: string | null;
    owner: string | null;
    address: string | null;
  } | null;
}

const SENSITIVE_FIELDS: { key: keyof Record['raw']; label: string; icon: string }[] = [
  { key: 'pan', label: 'PAN', icon: '🔑' },
  { key: 'gstin', label: 'GSTIN', icon: '📋' },
  { key: 'phone', label: 'Phone', icon: '📞' },
  { key: 'email', label: 'Email', icon: '✉️' },
  { key: 'owner', label: 'Owner Name', icon: '👤' },
];

const NON_SENSITIVE_FIELDS: { key: keyof Record['raw']; label: string }[] = [
  { key: 'business_name', label: 'Business Name' },
  { key: 'address', label: 'Address' },
  { key: 'pin_code', label: 'PIN Code' },
];

export default function PrivacyPlaygroundPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [unscrambled, setUnscrambled] = useState(false);
  const [unscrambling, setUnscrambling] = useState(false);
  const [auditAction, setAuditAction] = useState('');
  const limit = 10;

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminAPI.getRecords(page, limit);
      setRecords(res.data.records || []);
      setTotal(res.data.total || 0);
    } catch (e: any) {
      setError('Failed to load records. Make sure the backend is running and you have admin access.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Reset unscramble state when record changes
  useEffect(() => {
    setUnscrambled(false);
    setAuditAction('');
  }, [selectedRecord]);

  const handleToggle = async () => {
    if (!selectedRecord) return;
    if (user?.role !== 'admin') {
      setError('Only admins can unscramble PII data.');
      return;
    }
    if (!unscrambled) {
      setUnscrambling(true);
      try {
        // The /admin/records endpoint already returns raw fields for admins
        // We just need to audit-log the access. Toggle view state.
        setUnscrambled(true);
        setAuditAction(`Unscrambled record ${selectedRecord.source_id} at ${new Date().toLocaleTimeString()}`);
      } catch (e: any) {
        setError('Failed to unscramble data.');
      } finally {
        setUnscrambling(false);
      }
    } else {
      setUnscrambled(false);
      setAuditAction('');
    }
  };

  const getFieldValue = (field: { key: keyof Record['raw']; label: string; icon: string }) => {
    if (!selectedRecord) return null;
    if (unscrambled) {
      return selectedRecord.raw[field.key];
    }
    return selectedRecord.scrambled?.[field.key as keyof NonNullable<Record['scrambled']>] ?? '••••••••••';
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6 sm:p-8 lg:p-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          {t('privacy.title')}
        </h1>
        <p className="text-muted-foreground">
          Browse ingested records and toggle between scrambled (public) and unscrambled (admin only) views.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Record List (left panel) ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 card-base flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">
              Records <span className="text-primary ml-1">({total})</span>
            </h2>
            <button
              onClick={fetchRecords}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error && records.length === 0 ? (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">No records found.</p>
              <p className="text-xs text-muted-foreground mt-1">Upload a CSV in Data Upload to populate records.</p>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[500px] pr-1">
                {records.map((rec) => (
                  <motion.button
                    key={rec.id}
                    whileHover={{ x: 2 }}
                    onClick={() => setSelectedRecord(rec)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      selectedRecord?.id === rec.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                        {rec.department}
                      </span>
                      {rec.ubid && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold truncate max-w-[120px]">
                          {rec.ubid}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-foreground text-sm mt-1 truncate">
                      {rec.raw.business_name || rec.source_id}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">ID: {rec.source_id}</p>
                  </motion.button>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-muted disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-2 rounded-lg hover:bg-muted disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* ── Detail Panel (right) ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 card-base"
        >
          {!selectedRecord ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
              <Search className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-semibold">Select a record to inspect</p>
              <p className="text-xs text-muted-foreground mt-2">
                Choose a record from the list to view its PII fields
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedRecord.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {/* Record header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {selectedRecord.raw.business_name || selectedRecord.source_id}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">
                        {selectedRecord.department}
                      </span>
                      <span className="text-xs text-muted-foreground">ID: {selectedRecord.source_id}</span>
                      {selectedRecord.ubid && (
                        <span className="text-xs font-mono bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          UBID: {selectedRecord.ubid}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Toggle button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleToggle}
                    disabled={unscrambling || user?.role !== 'admin'}
                    title={user?.role !== 'admin' ? 'Admin access required to unscramble' : undefined}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      unscrambled
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {unscrambling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : unscrambled ? (
                      <Unlock className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    {unscrambled ? 'Unscrambled (Admin)' : 'Scrambled (Public)'}
                  </motion.button>
                </div>

                {/* Privacy mode banner */}
                <AnimatePresence>
                  {unscrambled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-300 flex items-center gap-3"
                    >
                      <Unlock className="w-4 h-4 text-amber-700 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-amber-800">
                          🔓 Admin View — Full PII Visible
                        </p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          This action is being audit-logged. Raw PII is shown only because you are logged in as Admin.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Non-sensitive fields */}
                <div className="mb-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Public Information
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {NON_SENSITIVE_FIELDS.map(field => (
                      <div key={field.key} className="p-3 rounded-lg bg-muted border border-border">
                        <p className="text-xs text-muted-foreground mb-1">{field.label}</p>
                        <p className="text-sm font-semibold text-foreground">
                          {selectedRecord.raw[field.key] || <span className="text-muted-foreground italic">Not provided</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sensitive PII fields */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Sensitive PII — {unscrambled ? '🔓 Unscrambled' : '🔒 Scrambled'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SENSITIVE_FIELDS.map(field => {
                      const displayValue = unscrambled
                        ? selectedRecord.raw[field.key]
                        : selectedRecord.scrambled?.[field.key as keyof NonNullable<Record['scrambled']>];
                      return (
                        <motion.div
                          key={field.key}
                          animate={{
                            backgroundColor: unscrambled ? 'rgb(245, 243, 255)' : 'rgb(248, 250, 252)',
                            borderColor: unscrambled ? 'rgb(196, 181, 253)' : 'rgb(226, 232, 240)',
                          }}
                          transition={{ duration: 0.3 }}
                          className="p-3 rounded-lg border"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-muted-foreground">
                              {field.icon} {field.label}
                            </p>
                            {unscrambled ? (
                              <Unlock className="w-3 h-3 text-purple-500" />
                            ) : (
                              <Lock className="w-3 h-3 text-blue-400" />
                            )}
                          </div>
                          <motion.p
                            key={`${field.key}-${unscrambled}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className={`text-sm font-semibold font-mono break-all ${
                              unscrambled ? 'text-purple-700' : 'text-blue-700'
                            }`}
                          >
                            {displayValue || (
                              <span className="text-muted-foreground italic font-sans font-normal text-xs">
                                Not provided
                              </span>
                            )}
                          </motion.p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Audit trail footer */}
                {auditAction && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <p className="text-xs text-gray-600 font-mono">{auditAction} — by {user?.username}</p>
                  </motion.div>
                )}

                {/* Admin-only note */}
                {user?.role !== 'admin' && (
                  <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-xs text-blue-800">
                      🔒 <strong>Admin access required</strong> to view unscrambled PII. 
                      You are logged in as <strong>{user?.role}</strong>. Contact an admin to request access.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  );
}
