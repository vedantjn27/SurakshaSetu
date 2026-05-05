'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ubidAPI } from '@/lib/api';
import { formatDate, getStatusBadgeColor } from '@/lib/utils';
import { Search, Loader2, ChevronRight } from 'lucide-react';

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
  status: 'active' | 'dormant';
  record_count: number;
  last_activity: string;
}

export default function UBIDRegistryPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [ubids, setUbids] = useState<UBID[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchUBIDs = async () => {
      try {
        setLoading(true);
        const response = await ubidAPI.list(page, 20, search);
        setUbids(response.data.ubids || []);
        setHasMore(response.data.has_more || false);
      } catch (error) {
        console.error('Failed to fetch UBIDs:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchUBIDs();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [search, page]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6 sm:p-8 lg:p-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-foreground mb-2">
          {t('ubid.title')}
        </h1>
        <p className="text-muted-foreground">
          {ubids.length} {t('ubid.column1')}s found
        </p>
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
                {t('ubid.column2')}
              </th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">
                {t('ubid.column3')}
              </th>
              <th className="text-left p-4 text-sm font-semibold text-foreground">
                {t('ubid.column4')}
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
                <td colSpan={6} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </td>
              </tr>
            ) : ubids.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  No UBIDs found
                </td>
              </tr>
            ) : (
              ubids.map((ubid, index) => (
                <motion.tr
                  key={ubid.id}
                  variants={rowVariants}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="p-4 text-sm font-semibold text-primary">
                    {ubid.ubid_id}
                  </td>
                  <td className="p-4 text-sm text-foreground">{ubid.name}</td>
                  <td className="p-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                        ubid.status
                      )}`}
                    >
                      {ubid.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-foreground">{ubid.record_count}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {formatDate(ubid.last_activity)}
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/ubid-registry/${ubid.id}`}>
                      <motion.button
                        whileHover={{ x: 4 }}
                        className="flex items-center gap-2 text-primary hover:text-primary/80 font-semibold ml-auto"
                      >
                        View
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
          <span className="text-muted-foreground">Page {page}</span>
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
