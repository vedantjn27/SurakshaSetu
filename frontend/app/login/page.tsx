'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
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

export default function LoginPage() {
  const router = useRouter();
  const { login, error: authError, isLoading } = useAuth();
  const { t } = useTranslation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter your username and password.');
      return;
    }

    try {
      await login(username, password, 'analyst');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || t('auth.loginError'));
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
          alt="Login Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 z-10 bg-black/30"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <motion.div
          className="w-full max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo */}
          <motion.div
            className="text-center mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="text-4xl font-bold text-primary mb-2">
              {t('branding.title')}
            </h1>
            <p className="text-muted-foreground">{t('auth.login')}</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Input */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <label htmlFor="username" className="block text-sm font-semibold text-foreground mb-2">
                {t('auth.username')}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('auth.usernamePlaceholder')}
                className="input-base"
                autoComplete="username"
                suppressHydrationWarning
              />
            </motion.div>

            {/* Password Input */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="input-base pr-10"
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Remember Me */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border"
                  defaultChecked
                />
                <span className="text-sm text-foreground">{t('auth.rememberMe')}</span>
              </label>
            </motion.div>

            {/* Error Message */}
            {(error || authError) && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-4 rounded-lg bg-destructive/10 border border-destructive/50 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-destructive">{error || authError}</p>
              </motion.div>
            )}

            <motion.button
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
            >
              {isLoading ? t('common.loading') : t('auth.loginButton')}
            </motion.button>
          </form>

          {/* Link to Register */}
          <motion.div
            className="mt-6 text-center space-y-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="text-sm text-muted-foreground">
              {t('auth.noAccount')}{' '}
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                {t('auth.createOne')}
              </button>
            </p>
            <button
              type="button"
              onClick={() => router.push('/branding')}
              className="text-primary hover:text-primary/80 text-sm font-semibold transition-colors"
            >
              ← {t('common.back')}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
