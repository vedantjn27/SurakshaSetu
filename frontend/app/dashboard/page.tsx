'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { dashboardAPI } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { TrendingUp, Users, CheckCircle2, Clock, Send, Loader2 } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
  hover: {
    scale: 1.05,
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    transition: { duration: 0.3 },
  },
};

interface Stats {
  totalUBIDs: number;
  activeRecords: number;
  dormantRecords: number;
  pendingMatches: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [query, setQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getStats();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleAIQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setQueryLoading(true);
      const response = await dashboardAPI.aiQuery(query);
      setAiResponse(response.data.response);
      setQuery('');
    } catch (error) {
      console.error('AI query failed:', error);
      setAiResponse('Error processing query. Please try again.');
    } finally {
      setQueryLoading(false);
    }
  };

  const kpiCards = [
    {
      title: t('dashboard.totalUBIDs'),
      value: stats?.totalUBIDs || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: t('dashboard.activeRecords'),
      value: stats?.activeRecords || 0,
      icon: CheckCircle2,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: t('dashboard.dormantRecords'),
      value: stats?.dormantRecords || 0,
      icon: Clock,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: t('dashboard.pendingMatches'),
      value: stats?.pendingMatches || 0,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <div className="relative">
        <Image
          src="/images/dashboard-bg.jpg"
          alt="Dashboard Background"
          fill
          className="object-cover absolute inset-0 opacity-30 z-0"
          priority
        />
        <div className="absolute inset-0 bg-white/50 dark:bg-black/30 z-1"></div>
      </div>

      <div className="relative z-10 p-6 sm:p-8 lg:p-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {t('dashboard.welcome')}, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-muted-foreground">{t('dashboard.overview')}</p>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {kpiCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover="hover"
                className="card-base overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium mb-2">
                      {card.title}
                    </p>
                    <h3 className="text-4xl font-bold text-foreground">
                      <motion.span
                        key={stats ? formatNumber(card.value) : 0}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        {formatNumber(card.value)}
                      </motion.span>
                    </h3>
                  </div>
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <Icon className={`w-6 h-6 text-${card.color.split('-')[1]}-600`} />
                  </div>
                </div>
                <div className={`h-1 bg-gradient-to-r ${card.color} rounded-full`}></div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* AI Search Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* AI Query */}
          <motion.div
            variants={cardVariants}
            className="lg:col-span-2 card-base"
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {t('dashboard.aiSearch')}
            </h2>

            <form onSubmit={handleAIQuery} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('dashboard.searchPlaceholder')}
                  className="input-base pr-12"
                  disabled={queryLoading}
                />
                <motion.button
                  type="submit"
                  disabled={queryLoading || !query.trim()}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {queryLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </motion.button>
              </div>

              {aiResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-primary/10 border border-primary/20"
                >
                  <p className="text-sm text-foreground">{aiResponse}</p>
                </motion.div>
              )}
            </form>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            variants={cardVariants}
            className="card-base"
          >
            <h2 className="text-xl font-bold text-foreground mb-6">
              {t('dashboard.recentActivity')}
            </h2>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-foreground font-semibold">
                  Data Ingestion Job Completed
                </p>
                <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-foreground font-semibold">
                  New Ambiguous Matches Found
                </p>
                <p className="text-xs text-muted-foreground mt-1">4 hours ago</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-foreground font-semibold">
                  System Audit Completed
                </p>
                <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              {t('dashboard.noActivity')}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
