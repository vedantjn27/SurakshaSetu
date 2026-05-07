'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { reviewAPI } from '@/lib/api';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

interface Match {
  id: string;
  record_a: { dept: string; source_id: string };
  record_b: { dept: string; source_id: string };
  confidence_score: number;
  feature_breakdown: Record<string, number>;
  explanation: string;
  created_at: string;
}

interface OrphanEvent {
  id: string;
  orphan_id: string;
  department: string;
  raw_source_id: string;
  event_type: string;
  event_date: string;
  suggested_ubid?: string;
  ai_score?: number;
}

export default function ReviewCenterPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [matches, setMatches] = useState<Match[]>([]);
  const [orphans, setOrphans] = useState<OrphanEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'matches' | 'orphans'>('matches');
  const [loading, setLoading] = useState(true);
  const [aiSuggestionPopup, setAiSuggestionPopup] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (activeTab === 'matches') {
          const response = await reviewAPI.getQueue();
          // Backend returns { total, items: [...] }
          setMatches(
            (response.data.items || []).map((i: any) => ({ ...i, id: i.item_id }))
          );
        } else {
          const response = await reviewAPI.getOrphans();
          // Backend returns { total, items: [...] }
          setOrphans(
            (response.data.items || []).map((i: any) => ({ ...i, id: i.orphan_id }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch review data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  const handleApprove = async (id: string) => {
    try {
      await reviewAPI.approveMatch(id);
      setMatches(matches.filter(m => m.id !== id));
    } catch (error) {
      console.error('Failed to approve match:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await reviewAPI.rejectMatch(id);
      setMatches(matches.filter(m => m.id !== id));
    } catch (error) {
      console.error('Failed to reject match:', error);
    }
  };

  const handleEscalate = async (id: string) => {
    try {
      await reviewAPI.escalateMatch(id);
      setMatches(matches.filter(m => m.id !== id));
    } catch (error) {
      console.error('Failed to escalate match:', error);
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
            {t('review.title')}
          </h1>
          <p className="text-muted-foreground">
            Review and validate identity matches
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-base"
        >
          <div className="border-b border-border flex gap-8 mb-6">
            {[
              { id: 'matches' as const, label: t('review.ambiguousMatches') },
              { id: 'orphans' as const, label: t('review.orphanEvents') },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : activeTab === 'matches' ? (
            // Matches Tab
            <div className="space-y-4">
              {matches.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('review.noMatches')}</p>
                </div>
              ) : (
                matches.map((match) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 rounded-lg bg-muted border border-border hover:border-primary/50 transition-all"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Record A</p>
                        <p className="font-semibold text-foreground">
                          [{match.record_a?.dept}] {match.record_a?.source_id}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Record B</p>
                        <p className="font-semibold text-foreground">
                          [{match.record_b?.dept}] {match.record_b?.source_id}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{t('review.matchScore')}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-300 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-primary to-secondary"
                              initial={{ width: 0 }}
                              animate={{ width: `${match.confidence_score * 100}%` }}
                            />
                          </div>
                          <p className="font-bold text-primary">{(match.confidence_score * 100).toFixed(0)}%</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-foreground mb-4">{match.explanation}</p>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleApprove(match.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-semibold flex-1"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Merge
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleReject(match.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold flex-1"
                      >
                        <XCircle className="w-4 h-4" />
                        {t('review.reject')}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEscalate(match.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 font-semibold flex-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {t('review.escalate')}
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            // Orphans Tab
            <div className="space-y-4">
              {orphans.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('review.noOrphans')}</p>
                </div>
              ) : (
                orphans.map((orphan) => (
                  <motion.div
                    key={orphan.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 rounded-lg bg-muted border border-border hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Department: {orphan.department}</p>
                        <p className="font-semibold text-foreground">ID: {orphan.raw_source_id}</p>
                        <p className="text-xs text-muted-foreground mt-1">{orphan.event_type} — {new Date(orphan.event_date).toLocaleDateString()}</p>
                      </div>
                      {orphan.suggested_ubid && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground mb-1">{t('review.aiSuggestion')}</p>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-primary">{orphan.suggested_ubid}</p>
                            {orphan.ai_score && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                {(orphan.ai_score * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                          try {
                            const res = await reviewAPI.suggestOrphan(orphan.id);
                            setAiSuggestionPopup({
                              orphan,
                              suggested_ubid: res.data.suggested_ubid,
                              ai_score: res.data.confidence,
                              reason: res.data.reason || 'AI determined this is the best match based on event metadata and registry patterns.'
                            });
                          } catch (e) { console.error(e); }
                        }}
                        className="flex-1 px-4 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200 font-semibold text-sm flex items-center justify-center gap-2"
                      >
                        ✨ AI Suggest Match
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* AI Suggestion Modal */}
      {aiSuggestionPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-background rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-xl">✨</span> AI Match Suggestion
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Target UBID Candidate</p>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-primary text-lg">{aiSuggestionPopup.suggested_ubid}</p>
                  {aiSuggestionPopup.ai_score != null && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-semibold">
                      {(aiSuggestionPopup.ai_score * 100).toFixed(0)}% Match
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">AI Explanation</p>
                <div className="p-3 bg-muted rounded-lg border border-border text-sm text-foreground leading-relaxed">
                  {aiSuggestionPopup.reason}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setAiSuggestionPopup(null)} className="btn-secondary">Cancel</button>
              <button 
                disabled={!aiSuggestionPopup.suggested_ubid}
                onClick={async () => {
                  try {
                    await reviewAPI.assignOrphan(aiSuggestionPopup.orphan.id, aiSuggestionPopup.suggested_ubid);
                    setOrphans(prev => prev.filter(o => o.id !== aiSuggestionPopup.orphan.id));
                    setAiSuggestionPopup(null);
                  } catch (e) { console.error(e); }
                }} 
                className="btn-primary"
              >
                Approve
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
