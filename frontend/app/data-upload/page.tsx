'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { ingestionAPI, adminAPI } from '@/lib/api';
import { Upload, Check, X, AlertCircle, Loader2, FileText, ChevronDown } from 'lucide-react';

// Departments supported by the backend rules.yaml
const DEPARTMENTS = [
  { value: 'shop_establishment', label: 'Shop & Establishment' },
  { value: 'factories', label: 'Factories' },
  { value: 'labour', label: 'Labour Department' },
  { value: 'kspcb', label: 'KSPCB (Pollution Control)' },
];

interface JobDetail {
  source_id: string;
  business_name: string;
  decision: 'new' | 'merged' | 'review' | 'skipped';
  reason: string;
  ubid: string | null;
  confidence: number | null;
}

interface Job {
  id: string;
  type: 'master' | 'events';
  department?: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  rows_processed?: number;
  total_rows?: number;
  new_ubids?: number;
  merged?: number;
  review_queued?: number;
  skipped?: number;
  error?: string;
  started_at: string;
  details?: JobDetail[];
}

export default function DataUploadPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [uploadType, setUploadType] = useState<'master' | 'events'>('master');
  const [department, setDepartment] = useState('shop_establishment');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState('');
  const pollingRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // Clean up polling intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(pollingRef.current).forEach(clearInterval);
    };
  }, []);

  const pollJobStatus = (jobId: string) => {
    // Poll every 2 seconds until job is done
    const interval = setInterval(async () => {
      try {
        const res = await ingestionAPI.getJobStatus(jobId);
        const data = res.data;

        setJobs(prev =>
          prev.map(j => {
            if (j.id !== jobId) return j;
            // Backend pipeline returns: ingested, skipped_duplicates, auto_linked, sent_to_review, new_ubids, details
            const result = data.result || {};
            const updated: Job = {
              ...j,
              status: data.status === 'running' ? 'running' : data.status,
              rows_processed: result.ingested ?? j.rows_processed,
              total_rows: (result.ingested ?? 0) + (result.skipped_duplicates ?? 0),
              new_ubids: result.new_ubids,
              merged: result.auto_linked,
              review_queued: result.sent_to_review,
              skipped: result.skipped_duplicates,
              details: result.details,
              error: data.error,
            };
            return updated;
          })
        );

        // Stop polling when job is finished
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(pollingRef.current[jobId]);
          delete pollingRef.current[jobId];
        }
      } catch {
        // Job may not be ready yet — keep polling
      }
    }, 2000);

    pollingRef.current[jobId] = interval;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a valid CSV file.');
      setFile(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setError('');
    } else {
      setError('Please drop a valid CSV file.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setError('');

      const response = await ingestionAPI.uploadCSV(
        file,
        uploadType,
        uploadType === 'master' ? department : undefined
      );

      const data = response.data;

      if (uploadType === 'events') {
        // Events endpoint is synchronous — returns result immediately
        const newJob: Job = {
          id: `evt-${Date.now()}`,
          type: 'events',
          status: 'completed',
          rows_processed: (data.joined ?? 0) + (data.orphaned ?? 0) + (data.errors ?? 0),
          total_rows: (data.joined ?? 0) + (data.orphaned ?? 0) + (data.errors ?? 0),
          new_ubids: data.joined,
          review_queued: data.orphaned,
          started_at: new Date().toISOString(),
        };
        setJobs(prev => [newJob, ...prev]);
      } else {
        // Master data is async — poll for status
        const jobId = data.job_id;
        const newJob: Job = {
          id: jobId,
          type: 'master',
          department,
          status: 'queued',
          rows_processed: 0,
          total_rows: 0,
          started_at: new Date().toISOString(),
        };
        setJobs(prev => [newJob, ...prev]);
        pollJobStatus(jobId);
      }

      setFile(null);
      // Reset file input
      const input = document.getElementById('file-input') as HTMLInputElement;
      if (input) input.value = '';
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
          ? detail.map((d: any) => d.msg).join(', ')
          : 'Upload failed. Please check your file and try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'queued': return 'bg-yellow-100 text-yellow-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
    }
  };

  const getStatusLabel = (status: Job['status']) => {
    switch (status) {
      case 'queued': return '⏳ Queued';
      case 'running': return '⚙️ Processing...';
      case 'completed': return '✅ Completed';
      case 'failed': return '❌ Failed';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6 sm:p-8 lg:p-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">{t('ingestion.title')}</h1>
          <p className="text-muted-foreground">
            Upload department CSV files to ingest business records and activity events into the UBID pipeline.
          </p>
        </div>
        {(user?.role === 'admin' || user?.role === 'reviewer') && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              setRetraining(true);
              try {
                await adminAPI.retrain();
                alert('AI Matcher retrained successfully!');
              } catch (e) {
                console.error(e);
                alert('Failed to retrain AI Matcher.');
              } finally {
                setRetraining(false);
              }
            }}
            disabled={retraining}
            className="btn-primary flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {retraining ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertCircle className="w-5 h-5" />}
            Retrain AI Matcher
          </motion.button>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Upload Section ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 card-base space-y-6"
        >
          {/* Step 1 — Upload Type */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Step 1 — Select ingestion type</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  value: 'master' as const,
                  label: t('ingestion.uploadMaster'),
                  icon: '🏢',
                  desc: 'Department master data (businesses, factories, shops)',
                },
                {
                  value: 'events' as const,
                  label: t('ingestion.uploadEvents'),
                  icon: '📋',
                  desc: 'Activity events (inspections, renewals, filings)',
                },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setUploadType(opt.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    uploadType === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className="text-2xl mb-2">{opt.icon}</div>
                  <p className="font-semibold text-foreground text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 — Department Selector (master only) */}
          <AnimatePresence>
            {uploadType === 'master' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <p className="text-sm font-semibold text-foreground mb-3">Step 2 — Select department</p>
                <div className="relative">
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full appearance-none input-base pr-10"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  The department determines which column mappings and validation rules are applied.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3 — File Drop Zone */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">
              {uploadType === 'master' ? 'Step 3' : 'Step 2'} — Choose CSV file
            </p>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer block">
                <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="text-lg font-semibold text-foreground mb-1">{t('ingestion.selectFile')}</p>
                <p className="text-muted-foreground text-sm">{t('ingestion.dragDrop')}</p>
                <p className="text-xs text-muted-foreground mt-2">Only .csv files are accepted</p>
              </label>
            </div>
          </div>

          {/* File Selected */}
          <AnimatePresence>
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-900">{file.name}</p>
                    <p className="text-sm text-green-700">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button onClick={() => setFile(null)} className="text-green-600 hover:text-green-800 p-1">
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('ingestion.uploading')}
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                {t('ingestion.uploadButton')}
              </>
            )}
          </motion.button>
        </motion.div>

        {/* ── Jobs Panel ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-base"
        >
          <h2 className="text-xl font-bold text-foreground mb-4">{t('ingestion.jobProgress')}</h2>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {jobs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No ingestion jobs yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Upload a file to start.</p>
              </div>
            ) : (
              jobs.map(job => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-xl bg-muted border border-border space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {job.type === 'master' ? '🏢 Business Records' : '📋 Activity Events'}
                      </p>
                      {job.department && (
                        <p className="text-xs text-muted-foreground capitalize">
                          {DEPARTMENTS.find(d => d.value === job.department)?.label ?? job.department}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${getStatusColor(job.status)}`}>
                      {getStatusLabel(job.status)}
                    </span>
                  </div>

                  {/* Progress bar (only for running/queued master jobs) */}
                  {job.type === 'master' && job.status !== 'completed' && job.status !== 'failed' && (
                    <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        className="bg-primary h-full rounded-full"
                        animate={{ width: job.status === 'running' ? '70%' : '10%' }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
                      />
                    </div>
                  )}

                  {/* Results summary */}
                  {job.status === 'completed' && (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                        {job.rows_processed != null && (
                          <div className="bg-background rounded-lg p-2 flex flex-col items-center justify-center border border-border h-full">
                            <p className="font-bold text-foreground text-base leading-none mb-1">{job.rows_processed}</p>
                            <p className="text-muted-foreground text-[11px] sm:text-xs text-center leading-tight">Records</p>
                          </div>
                        )}
                        {job.new_ubids != null && (
                          <div className="bg-background rounded-lg p-2 flex flex-col items-center justify-center border border-border h-full">
                            <p className="font-bold text-primary text-base leading-none mb-1">{job.new_ubids}</p>
                            <p className="text-muted-foreground text-[11px] sm:text-xs text-center leading-tight">{job.type === 'master' ? 'New UBIDs' : 'Events Joined'}</p>
                          </div>
                        )}
                        {job.merged != null && job.type === 'master' && (
                          <div className="bg-background rounded-lg p-2 flex flex-col items-center justify-center border border-border h-full">
                            <p className="font-bold text-blue-600 text-base leading-none mb-1">{job.merged}</p>
                            <p className="text-muted-foreground text-[11px] sm:text-xs text-center leading-tight">Auto-Merged</p>
                          </div>
                        )}
                        {job.review_queued != null && (
                          <div className="bg-background rounded-lg p-2 flex flex-col items-center justify-center border border-border h-full">
                            <p className="font-bold text-yellow-600 text-base leading-none mb-1">{job.review_queued}</p>
                            <p className="text-muted-foreground text-[11px] sm:text-xs text-center leading-tight">{job.type === 'master' ? 'For Review' : 'Orphaned'}</p>
                          </div>
                        )}
                        {job.skipped != null && job.type === 'master' && (
                          <div className="bg-background rounded-lg p-2 flex flex-col items-center justify-center border border-border h-full">
                            <p className="font-bold text-gray-500 text-base leading-none mb-1">{job.skipped}</p>
                            <p className="text-muted-foreground text-[11px] sm:text-xs text-center leading-tight">Skipped</p>
                          </div>
                        )}
                      </div>
                      
                      {job.details && job.details.length > 0 && (
                        <div className="mt-4 border-t border-border pt-3">
                          <p className="text-sm font-semibold mb-2 text-foreground">Detailed Decisions:</p>
                          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {job.details.map((d, i) => (
                              <div key={i} className="text-xs bg-background p-3 rounded-lg border border-border flex flex-col gap-1.5">
                                <div className="flex justify-between items-start gap-4">
                                  <div>
                                    <p className="font-semibold text-foreground text-sm">{d.business_name || 'Unknown Business'}</p>
                                    <p className="text-muted-foreground">Source ID: <span className="font-mono">{d.source_id}</span></p>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    d.decision === 'merged' ? 'bg-blue-100 text-blue-800' :
                                    d.decision === 'new' ? 'bg-green-100 text-green-800' :
                                    d.decision === 'review' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {d.decision}
                                  </span>
                                </div>
                                
                                <div className="mt-1 bg-muted/50 p-2 rounded">
                                  <p className="text-muted-foreground font-medium"><span className="text-foreground">Reason:</span> {d.reason}</p>
                                  {d.ubid && (
                                    <p className="text-muted-foreground mt-0.5">
                                      <span className="text-foreground">UBID:</span> <span className="font-mono text-primary">{d.ubid}</span>
                                    </p>
                                  )}
                                  {d.confidence != null && (
                                    <p className="text-muted-foreground mt-0.5">
                                      <span className="text-foreground">Confidence:</span> {(d.confidence * 100).toFixed(1)}%
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Error message */}
                  {job.status === 'failed' && job.error && (
                    <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{job.error}</p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Job ID: <span className="font-mono">{job.id}</span>
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
