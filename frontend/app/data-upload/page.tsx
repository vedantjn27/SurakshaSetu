'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ingestionAPI } from '@/lib/api';
import { Upload, Check, X, AlertCircle, Loader2 } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

interface Job {
  id: string;
  type: 'master' | 'events';
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  rows_processed: number;
  total_rows: number;
  started_at: string;
}

export default function DataUploadPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [uploadType, setUploadType] = useState<'master' | 'events'>('master');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a CSV file');
      setFile(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setError('');
    } else {
      setError('Please drop a CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      const response = await ingestionAPI.uploadCSV(file, uploadType);
      const newJob = {
        id: response.data.job_id,
        type: uploadType,
        status: 'processing' as const,
        progress: 0,
        rows_processed: 0,
        total_rows: response.data.total_rows || 0,
        started_at: new Date().toISOString(),
      };
      setJobs([newJob, ...jobs]);
      setFile(null);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6 sm:p-8 lg:p-10">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {t('ingestion.title')}
          </h1>
          <p className="text-muted-foreground">
            Upload and manage your identity data
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 card-base space-y-6"
          >
            {/* Upload Type Selector */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-4">
                {t('ingestion.uploadMaster')}
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'master' as const, label: t('ingestion.uploadMaster') },
                  { value: 'events' as const, label: t('ingestion.uploadEvents') },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setUploadType(option.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      uploadType === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <p className="font-semibold text-foreground">{option.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer block">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold text-foreground mb-2">
                  {t('ingestion.selectFile')}
                </p>
                <p className="text-muted-foreground text-sm">
                  {t('ingestion.dragDrop')}
                </p>
              </label>
            </div>

            {/* File Selected */}
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">{file.name}</p>
                    <p className="text-sm text-green-700">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </motion.div>
            )}

            {/* Upload Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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
                t('ingestion.uploadButton')
              )}
            </motion.button>
          </motion.div>

          {/* Jobs List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-base"
          >
            <h2 className="text-xl font-bold text-foreground mb-4">
              {t('ingestion.jobProgress')}
            </h2>

            <div className="space-y-3">
              {jobs.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No jobs yet
                </p>
              ) : (
                jobs.map((job) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-lg bg-muted space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        {job.type === 'master' ? 'Master Data' : 'Events Data'}
                      </p>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        job.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        job.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-2">
                      <motion.div
                        className="bg-primary h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${job.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {job.rows_processed} / {job.total_rows} rows
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
