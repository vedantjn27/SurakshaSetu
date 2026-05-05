'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import i18next from '@/lib/i18n';
import { motion } from 'framer-motion';
import { LogOut, Globe, Menu, X } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLanguageChange = (lang: 'en' | 'hi' | 'kn') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const handleLogout = () => {
    logout();
    router.push('/branding');
  };

  const currentLang = i18n.language;
  const langNames: Record<string, string> = { en: 'English', hi: 'हिन्दी', kn: 'ಕನ್ನಡ' };

  return (
    <nav className="bg-background border-b border-border px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-foreground hover:text-primary transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          <h2 className="text-lg font-semibold text-foreground">
            {t('branding.title')}
          </h2>
        </div>

        <div className="flex items-center gap-6">
          {/* Language Selector */}
          <motion.div
            className="relative group"
            whileHover={{ scale: 1.05 }}
          >
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-foreground">
              <Globe className="w-4 h-4" />
              <span className="text-sm font-semibold">{langNames[currentLang]}</span>
            </button>

            <div className="absolute right-0 mt-2 w-32 bg-background border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {(['en', 'hi', 'kn'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`block w-full text-left px-4 py-2 hover:bg-muted transition-colors ${
                    currentLang === lang ? 'text-primary font-semibold' : 'text-foreground'
                  }`}
                >
                  {langNames[lang]}
                </button>
              ))}
            </div>
          </motion.div>

          {/* User Info */}
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg bg-muted">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground uppercase">{user?.role}</p>
            </div>
          </div>

          {/* Logout Button */}
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common.logout')}</span>
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-muted rounded-lg space-y-2 lg:hidden"
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded bg-background">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground uppercase">{user?.role}</p>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
