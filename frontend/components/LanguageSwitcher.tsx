'use client';

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lang: 'en' | 'hi' | 'kn') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const currentLang = i18n.language || 'en';
  const langNames: Record<string, string> = { en: 'English', hi: 'हिन्दी', kn: 'ಕನ್ನಡ' };

  return (
    <motion.div
      className="relative group inline-block"
      whileHover={{ scale: 1.05 }}
    >
      <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-foreground">
        <Globe className="w-4 h-4" />
        <span className="text-sm font-semibold">{langNames[currentLang] || 'English'}</span>
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
  );
}
