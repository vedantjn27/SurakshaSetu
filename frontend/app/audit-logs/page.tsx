'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { adminAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Loader2, Search } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  details: string;
  status: 'success' | 'failure';
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getAuditLogs(page, 20);
        setLogs(response.data.logs || []);
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => fetchLogs(), 300);
    return () => clearTimeout(timer);
  }, [search, page]);

  const getActionColor = (action: string) => {
    if (action.includes('Create')) return 'bg-green-100 text-green-800';
    if (action.includes('Update') || action.includes('Override')) return 'bg-blue-100 text-blue-800';
    if (action.includes('Delete')) return 'bg-red-100 text-red-800';
    if (action.includes('View') || action.includes('Access')) return 'bg-gray-100 text-gray-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6 sm:p-8 lg:p-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-foreground mb-2">
          {t('audit.title')}
        </h1>
        <p className="text-muted-foreground">
          System-wide activity and security logs
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('audit.filter')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input-base pl-10 w-full"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card-base overflow-x-auto"
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 text-sm font-semibold text-foreground">
                {t('audit.timestamp')}
              </th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">
                {t('audit.user')}
              </th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">
                {t('audit.action')}
              </th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">
                {t('audit.resource')}
              </th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">
                {t('audit.details')}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                  {t('audit.noLogs')}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="p-4 text-sm text-muted-foreground">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="p-4 text-sm font-semibold text-foreground">
                    {log.user}
                  </td>
                  <td className="p-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-foreground">{log.resource}</td>
                  <td className="p-4 text-sm text-muted-foreground truncate max-w-xs">
                    {log.details}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>

      {/* Pagination */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-6 flex justify-between items-center"
      >
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-muted-foreground">Page {page}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          className="btn-secondary"
        >
          Next
        </button>
      </motion.div>
    </div>
  );
}
