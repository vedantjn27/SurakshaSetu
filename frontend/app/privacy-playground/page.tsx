'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { adminAPI } from '@/lib/api';
import { Lock, Unlock, Copy, Check, AlertCircle } from 'lucide-react';

export default function PrivacyPlaygroundPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'scramble' | 'unscramble'>('scramble');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScramble = async () => {
    if (!input.trim()) return;

    try {
      setLoading(true);
      const response = await adminAPI.scramble({ pii: input });
      setOutput(response.data.scrambled || '');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Scrambling failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUnscramble = async () => {
    if (!input.trim()) return;

    if (user?.role !== 'admin') {
      setError(t('privacy.adminOnly'));
      return;
    }

    try {
      setLoading(true);
      const response = await adminAPI.unscramble({ scrambled: input });
      setOutput(response.data.unscrambled || '');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unscrambling failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6 sm:p-8 lg:p-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {t('privacy.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('privacy.description')}
          </p>
        </div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-base"
        >
          <div className="border-b border-border flex gap-8 mb-8">
            {[
              { id: 'scramble' as const, label: t('privacy.scrambleTitle'), icon: '🔒' },
              { id: 'unscramble' as const, label: t('privacy.unscrambleTitle'), icon: '🔓', admin: true },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={tab.admin && user?.role !== 'admin'}
                className={`pb-4 font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Input */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                {t('privacy.input')}
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={activeTab === 'scramble' ? 'Enter PII to scramble...' : 'Enter scrambled data...'}
                className="w-full p-4 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={4}
              />
            </div>

            {/* Action Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={activeTab === 'scramble' ? handleScramble : handleUnscramble}
              disabled={!input.trim() || loading}
              className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                activeTab === 'scramble' 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {activeTab === 'scramble' ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
              {loading ? 'Processing...' : activeTab === 'scramble' ? 'Scramble' : 'Unscramble'}
            </motion.button>

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

            {/* Output */}
            {output && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="block text-sm font-semibold text-foreground mb-3">
                  {t('privacy.output')}
                </label>
                <div className="relative">
                  <textarea
                    value={output}
                    readOnly
                    className="w-full p-4 rounded-lg border border-border bg-muted text-foreground focus:outline-none resize-none"
                    rows={4}
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopy}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    {copied ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </motion.button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {copied ? 'Copied to clipboard!' : 'Click to copy'}
                </p>
              </motion.div>
            )}

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 rounded-lg bg-blue-50 border border-blue-200"
            >
              <p className="text-sm text-blue-900">
                {activeTab === 'scramble'
                  ? 'Deterministically scrambles sensitive data for safe sharing and reporting.'
                  : 'Only available to Admin users. Reveals original PII using secure vault lookup.'}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
