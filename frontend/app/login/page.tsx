'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const roles: { value: UserRole; label: string; desc: string }[] = [
    {
      value: 'admin',
      label: t('auth.adminRole'),
      desc: t('auth.adminDescription'),
    },
    {
      value: 'reviewer',
      label: t('auth.reviewerRole'),
      desc: t('auth.reviewerDescription'),
    },
    {
      value: 'analyst',
      label: t('auth.analystRole'),
      desc: t('auth.analystDescription'),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !selectedRole) {
      setError(t('auth.selectRole'));
      return;
    }

    try {
      await login(email, password, selectedRole);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || t('auth.loginError'));
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-background">
      {/* Left Side - Background Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <Image
          src="/images/login-bg.jpg"
          alt="Login Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30"></div>
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
            {/* Role Selection */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <label className="block text-sm font-semibold text-foreground mb-3">
                {t('auth.role')}
              </label>
              <div className="space-y-2">
                {roles.map((role) => (
                  <motion.button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedRole === role.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="font-semibold text-foreground">{role.label}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {role.desc}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Email Input */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="input-base"
                required
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
                  required
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

            {/* Submit Button */}
            <motion.button
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('common.loading') : t('auth.loginButton')}
            </motion.button>
          </form>

          {/* Back to Branding */}
          <motion.div
            className="mt-6 text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <button
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
