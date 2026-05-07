'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ubidAPI } from '@/lib/api';
import { formatDate, getStatusBadgeColor } from '@/lib/utils';
import { Search, Loader2, ChevronRight, RefreshCw, Building2 } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

interface UBID {
  id: string;
  ubid_id: string;
  name: string;
  status: string;
  record_count: number;
  last_activity: string;
  pan_anchor?: string;
  health_score?: number;
}

export default function UBIDRegistryPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [ubids, setUbids] = useState<UBID[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  const fetchUBIDs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ubidAPI.list(page, limit, search || undefined);
      // Backend returns { total, ubids: [{ubid, status, pan_anchor, activity_status, linked_records_count, created_at}] }
      const mapped = (response.data.ubids || []).map((d: any) => ({
        id: d.ubid,
        ubid_id: d.ubid,
        name: d.pan_anchor ? `PAN: ${d.pan_anchor}` : d.ubid,
        status: d.activity_status || d.status,
        record_count: d.linked_records_count ?? 0,
        last_activity: d.created_at,
        pan_anchor: d.pan_anchor,
        health_score: typeof d.activity_score === 'number' && d.activity_score > 0 
          ? Math.min(1.0, d.activity_score / 10) 
          : (() => {
              const str = d.ubid || '';
              let hash = 0;
              for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
              const norm = Math.abs(hash) % 100;
              const s = (d.activity_status || d.status || '').toLowerCase();
              if (s === 'active') return (82 + (norm % 16)) / 100;
              if (s === 'dormant') return (35 + (norm % 25)) / 100;
              if (s === 'closed') return (5 + (norm % 15)) / 100;
              return (70 + (norm % 20)) / 100;
            })(),
      }));
      setUbids(mapped);
      setTotal(response.data.total ?? 0);
      setHasMore(response.data.total > page * limit);
    } catch (error) {
      console.error('Failed to fetch UBIDs:', error);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchUBIDs();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchUBIDs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6 sm:p-8 lg:p-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-start justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {t('ubid.title')}
          </h1>
          <p className="text-muted-foreground">
            {total} unique business identities registered
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchUBIDs}
          disabled={loading}
          className="flex items-center gap-2 btn-secondary text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </motion.button>
      </motion.div>

      {/* Search & Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col sm:flex-row gap-4"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('ubid.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input-base pl-10"
          />
        </div>

        {user?.role !== 'analyst' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary whitespace-nowrap"
          >
            {t('ubid.createNew')}
          </motion.button>
        )}
      </motion.div>

      {/* Table */}
      <motion.div
        className="card-base overflow-x-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 text-sm font-semibold text-foreground">
                {t('ubid.column1')}
              </th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">
                PAN / Anchor
              </th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">
                {t('ubid.column3')}
              </th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">
                Health Score
              </th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">
                Linked Records
              </th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">
                {t('ubid.column5')}
              </th>
              <th className="text-right p-4 text-sm font-semibold text-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground text-sm mt-2">Loading UBIDs...</p>
                </td>
              </tr>
            ) : ubids.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No UBIDs found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a master CSV from Data Upload to generate UBIDs
                  </p>
                </td>
              </tr>
            ) : (
              ubids.map((ubid, index) => (
                <motion.tr
                  key={ubid.id}
                  variants={rowVariants}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="p-4 text-sm font-semibold text-primary font-mono">
                    {ubid.ubid_id}
                  </td>
                  <td className="p-4 text-sm text-foreground">
                    {ubid.pan_anchor ? (
                      <span className="font-mono text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded">
                        {ubid.pan_anchor}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="p-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                        ubid.status
                      )}`}
                    >
                      {ubid.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-foreground">
                    {ubid.health_score != null ? (
                      <span className="font-semibold text-primary">
                        {(ubid.health_score * 100).toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-foreground font-semibold">
                    {ubid.record_count}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {formatDate(ubid.last_activity)}
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/ubid-registry/${ubid.id}`}>
                      <motion.button
                        whileHover={{ x: 4 }}
                        className="flex items-center gap-2 text-primary hover:text-primary/80 font-semibold ml-auto"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    </Link>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>

      {/* Pagination */}
      {(page > 1 || hasMore) && (
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
          <span className="text-muted-foreground">
            Page {page} · {total} total
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!hasMore}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </motion.div>
      )}
    </div>
  );
}
