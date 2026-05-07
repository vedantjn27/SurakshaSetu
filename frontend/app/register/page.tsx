'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Eye, EyeOff, UserPlus } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const { t } = useTranslation();

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!username.trim() || !password) {
      setError('Username and password are required.');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please check and try again.');
      return;
    }

    try {
      const message = await register(username.trim(), password, fullName.trim(), email.trim());
      setSuccessMessage(message);
      // Redirect to login after 2s
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-background relative">
      <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      {/* Left Side - Background Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <Image
          src="/images/login-bg.jpg"
          alt="Register Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 z-10 bg-black/40 flex flex-col items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-white text-center bg-black/60 backdrop-blur-md p-10 rounded-2xl border border-white/10 shadow-2xl max-w-lg"
          >
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Join SurakshaSetu</h2>
            <p className="text-gray-200 text-lg mb-8">
              Create your Analyst account to start querying the identity
              verification system.
            </p>
            <div className="space-y-5 text-left bg-black/40 p-6 rounded-xl border border-white/5">
              {[
                'View UBID records and status',
                'Run AI-powered analytics queries',
                'Access audit logs and reports',
                'Multi-language interface support',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-gray-200">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-8 text-yellow-300/90 text-sm font-medium bg-yellow-500/10 rounded-lg px-4 py-3 border border-yellow-500/20">
              Note: Analyst role only. Contact your Admin to get Reviewer or Admin access.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          className="w-full max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              {t('branding.title')}
            </h1>
            <p className="text-muted-foreground">Create your Analyst account</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <label htmlFor="reg-username" className="block text-sm font-semibold text-foreground mb-2">
                {t('auth.username', 'Username')} <span className="text-destructive">*</span>
              </label>
              <input
                id="reg-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('userManagement.uniqueUsernamePlaceholder', 'Choose a username (min. 3 chars)')}
                className="input-base"
                autoComplete="username"
                suppressHydrationWarning
              />
            </motion.div>

            {/* Full Name */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <label htmlFor="reg-fullname" className="block text-sm font-semibold text-foreground mb-2">
                {t('userManagement.fullNameOptional', 'Full Name (optional)')}
              </label>
              <input
                id="reg-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('userManagement.fullNamePlaceholder', 'Your full name')}
                className="input-base"
                autoComplete="name"
                suppressHydrationWarning
              />
            </motion.div>

            {/* Email */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <label htmlFor="reg-email" className="block text-sm font-semibold text-foreground mb-2">
                {t('userManagement.emailOptional', 'Email (optional)')}
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input-base"
                autoComplete="email"
                suppressHydrationWarning
              />
            </motion.div>

            {/* Password */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <label htmlFor="reg-password" className="block text-sm font-semibold text-foreground mb-2">
                {t('auth.password', 'Password')} <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('userManagement.passwordMinLength', 'At least 6 characters')}
                  className="input-base pr-10"
                  autoComplete="new-password"
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>

            {/* Confirm Password */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <label htmlFor="reg-confirm" className="block text-sm font-semibold text-foreground mb-2">
                {t('userManagement.confirmPassword', 'Confirm Password')} <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('userManagement.reenterPassword', 'Re-enter your password')}
                  className="input-base pr-10"
                  autoComplete="new-password"
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>

            {/* Role info badge */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-muted-foreground"
            >
              🔐 Self-registration creates an <strong className="text-foreground">Analyst</strong> account
              (read-only access). Contact your administrator for Reviewer or Admin access.
            </motion.div>

            {/* Error */}
            {error && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-4 rounded-lg bg-destructive/10 border border-destructive/50 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-destructive text-sm">{error}</p>
              </motion.div>
            )}

            {/* Success */}
            {successMessage && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-4 rounded-lg bg-green-500/10 border border-green-500/50 flex items-start gap-3"
              >
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-700 dark:text-green-400 text-sm">
                  {successMessage} Redirecting to login...
                </p>
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              type="submit"
              disabled={isLoading || !!successMessage}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </>
              )}
            </motion.button>
          </form>

          {/* Link to Login */}
          <motion.div
            className="mt-6 text-center space-y-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="text-sm text-muted-foreground">
              {t('auth.hasAccount', 'Already have an account?')} {' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                {t('auth.login', 'Sign In')}
              </button>
            </p>
            <button
              type="button"
              onClick={() => router.push('/branding')}
              className="text-primary hover:text-primary/80 text-sm font-semibold transition-colors"
            >
              ← {t('common.back', 'Go Back')}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
