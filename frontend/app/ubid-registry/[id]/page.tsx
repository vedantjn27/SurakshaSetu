'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ubidAPI } from '@/lib/api';
import { formatDate, getStatusBadgeColor } from '@/lib/utils';
import { ArrowLeft, Loader2, Lock, Network, History } from 'lucide-react';

interface UBIDDetail {
  id: string;
  ubid_id: string;
  name: string;
  status: 'active' | 'dormant';
  record_count: number;
  created_at: string;
  last_updated: string;
  linked_records: any[];
}

export default function UBIDDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [ubid, setUbid] = useState<UBIDDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchUBID = async () => {
      try {
        setLoading(true);
        const response = await ubidAPI.getById(params.id as string);
        setUbid(response.data);
      } catch (error) {
        console.error('Failed to fetch UBID:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUBID();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ubid) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">{t('common.error')}</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: t('ubid.details'), icon: 'ℹ️' },
    { id: 'records', label: t('ubid.linkedRecords'), icon: '📄' },
    { id: 'network', label: t('ubid.networkGraph'), icon: '🔗' },
    { id: 'audit', label: t('ubid.activityHistory'), icon: '📜' },
  ];

  const actions = [
    user?.role === 'admin' && {
      label: t('ubid.unscramble'),
      color: 'bg-purple-600',
      icon: '🔓',
    },
    (user?.role === 'admin' || user?.role === 'reviewer') && {
      label: t('ubid.override'),
      color: 'bg-red-600',
      icon: '⚙️',
    },
    (user?.role === 'admin' || user?.role === 'reviewer') && {
      label: t('ubid.split'),
      color: 'bg-orange-600',
      icon: '✂️',
    },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6 sm:p-8 lg:p-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('common.back')}
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {ubid.name}
            </h1>
            <div className="flex items-center gap-4">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadgeColor(ubid.status)}`}>
                {ubid.status}
              </span>
              <span className="text-muted-foreground text-sm">{ubid.ubid_id}</span>
            </div>
          </div>

          {actions.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2">
              {actions.map((action: any, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${action.color} text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity`}
                >
                  {action.icon} {action.label}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
      >
        <div className="card-base">
          <p className="text-muted-foreground text-sm mb-1">Records</p>
          <p className="text-3xl font-bold text-primary">{ubid.record_count}</p>
        </div>
        <div className="card-base">
          <p className="text-muted-foreground text-sm mb-1">Created</p>
          <p className="text-sm font-semibold text-foreground">{formatDate(ubid.created_at).split(',')[0]}</p>
        </div>
        <div className="card-base">
          <p className="text-muted-foreground text-sm mb-1">Updated</p>
          <p className="text-sm font-semibold text-foreground">{formatDate(ubid.last_updated).split(',')[0]}</p>
        </div>
        <div className="card-base">
          <p className="text-muted-foreground text-sm mb-1">Status</p>
          <p className="text-sm font-semibold text-foreground capitalize">{ubid.status}</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card-base"
      >
        {/* Tab Navigation */}
        <div className="border-b border-border flex gap-8 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">UBID ID</p>
                  <p className="font-semibold text-foreground">{ubid.ubid_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Name</p>
                  <p className="font-semibold text-foreground">{ubid.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Records</p>
                  <p className="font-semibold text-foreground">{ubid.record_count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(ubid.status)}`}>
                    {ubid.status}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'records' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              {ubid.linked_records?.length > 0 ? (
                ubid.linked_records.map((record: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-muted">
                    <p className="font-semibold text-foreground text-sm">{record.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{record.id}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">{t('common.noActivity')}</p>
              )}
            </motion.div>
          )}

          {activeTab === 'network' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Network className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Network visualization loading...</p>
            </motion.div>
          )}

          {activeTab === 'audit' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Activity history loading...</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
