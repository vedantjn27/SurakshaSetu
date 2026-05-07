'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  UserPlus,
  Users,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  RefreshCw,
  Crown,
  UserCog,
  User,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ManagedUser {
  username: string;
  role: string;
  full_name?: string;
  email?: string;
  is_active?: boolean;
  created_at?: string;
}

const ROLE_META = {
  admin: {
    label: 'Admin',
    icon: Crown,
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-700',
    desc: 'Full system access — ingest, review, PII, model retraining, user management',
  },
  reviewer: {
    label: 'Reviewer',
    icon: UserCog,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    desc: 'Data ingestion, review workflow, orphan resolution, UBID management',
  },
  analyst: {
    label: 'Analyst',
    icon: User,
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    badge: 'bg-green-100 text-green-700',
    desc: 'Read-only — UBID lookup, AI queries, audit logs, privacy playground',
  },
};

export default function UserManagementPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Form state
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'reviewer' | 'analyst'>('reviewer');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Guard: redirect non-admins
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get(`${API}/api/v1/admin/users`);
      setUsers(res.data);
    } catch {
      // endpoint may not be implemented yet — silent fail
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') fetchUsers();
  }, [user, fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (username.trim().length < 3) {
      setFormError('Username must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setCreating(true);
    try {
      const res = await axios.post(`${API}/api/v1/auth/admin/register`, {
        username: username.trim(),
        password,
        role,
        full_name: fullName.trim() || undefined,
        email: email.trim() || undefined,
      });
      setFormSuccess(`✓ ${res.data.message}`);
      // Reset form
      setUsername('');
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRole('reviewer');
      // Refresh list
      fetchUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  const RoleMeta = ROLE_META[role];

  return (
    <div className="p-6 sm:p-8 lg:p-10 min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t('userManagement.title', 'User Management')}</h1>
        </div>
        <p className="text-muted-foreground ml-14">
          {t('userManagement.subtitle', 'Create and manage system users. Only Admins can access this page.')}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* ── Create User Form ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="card-base"
        >
          <div className="flex items-center gap-3 mb-6">
            <UserPlus className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">{t('userManagement.createNew', 'Create New User')}</h2>
          </div>

          {/* Role picker */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-foreground mb-3">{t('userManagement.selectRole', 'Select Role')}</p>
            <div className="space-y-2">
              {(Object.entries(ROLE_META) as [keyof typeof ROLE_META, typeof ROLE_META[keyof typeof ROLE_META]][]).map(
                ([key, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <motion.button
                      key={key}
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setRole(key)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        role === key
                          ? `border-primary ${meta.bg}`
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${meta.color}`} />
                        <div>
                          <span className="font-semibold text-foreground">{meta.label}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">{meta.desc}</p>
                        </div>
                        {role === key && (
                          <CheckCircle className="w-5 h-5 text-primary ml-auto flex-shrink-0" />
                        )}
                      </div>
                    </motion.button>
                  );
                }
              )}
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">
                {t('auth.username', 'Username')} <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('userManagement.uniqueUsernamePlaceholder', 'Unique username (min. 3 chars)')}
                className="input-base"
                required
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">
                {t('userManagement.fullNameOptional', 'Full Name (optional)')}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('userManagement.fullNamePlaceholder', 'Your full name')}
                className="input-base"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">
                {t('userManagement.emailOptional', 'Email (optional)')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@department.gov.in"
                className="input-base"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">
                {t('auth.password', 'Password')} <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('userManagement.passwordMinLength', 'At least 6 characters')}
                  className="input-base pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">
                {t('userManagement.confirmPassword', 'Confirm Password')} <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('userManagement.reenterPassword', 'Re-enter password')}
                  className="input-base pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {formError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30"
                >
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{formError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success */}
            <AnimatePresence>
              {formSuccess && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30"
                >
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-700 dark:text-green-400">{formSuccess}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={creating}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create {ROLE_META[role].label} Account
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* ── Existing Users List ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="card-base"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">{t('userManagement.systemUsers', 'System Users')}</h2>
            </div>
            <button
              onClick={fetchUsers}
              className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {t('userManagement.noUsersLoaded', 'No users loaded.')}
                <span className="text-xs">
                  (Requires <code className="bg-muted px-1 rounded">GET /api/v1/admin/users</code> endpoint)
                </span>
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {users.map((u) => {
                const meta = ROLE_META[u.role as keyof typeof ROLE_META] || ROLE_META.analyst;
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={u.username}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${meta.bg}`}>
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{u.username}</p>
                      {u.full_name && (
                        <p className="text-xs text-muted-foreground truncate">{u.full_name}</p>
                      )}
                      {u.email && (
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${meta.badge} flex-shrink-0`}>
                      {meta.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Info box */}
          <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-800 font-semibold mb-1">{t('userManagement.howFirstAdmin', 'How does first Admin get created?')}</p>
            <p className="text-xs text-amber-700">
              {t('userManagement.adminSeedText', 'The seed script creates the initial accounts. After that, only Admins can create new accounts.')}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
