'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Shield, Lock, TrendingUp, Database, ArrowRight, Check } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: 'easeOut' },
  },
};

const featureVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export default function BrandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  // No auto-redirect so users can always see the branding page

  const features = [
    {
      icon: Database,
      title: t('branding.feature1Title'),
      description: t('branding.feature1Desc'),
    },
    {
      icon: TrendingUp,
      title: t('branding.feature2Title'),
      description: t('branding.feature2Desc'),
    },
    {
      icon: Shield,
      title: t('branding.feature3Title'),
      description: t('branding.feature3Desc'),
    },
    {
      icon: Lock,
      title: t('branding.feature4Title'),
      description: t('branding.feature4Desc'),
    },
  ];

  const steps = [
    { icon: '📤', title: t('branding.step1'), desc: t('branding.step1Desc') },
    { icon: '🔗', title: t('branding.step2'), desc: t('branding.step2Desc') },
    { icon: '👁️', title: t('branding.step3'), desc: t('branding.step3Desc') },
    { icon: '✅', title: t('branding.step4'), desc: t('branding.step4Desc') },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <motion.section
        className="relative h-screen flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Language & Theme Switcher in top right */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <Image
          src="/images/hero-bg.jpg"
          alt="Hero Background"
          fill
          className="object-cover absolute inset-0 z-0"
          priority
        />
        <div className="absolute inset-0 bg-black/40 z-1"></div>

        <motion.div
          className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="flex justify-center mb-8">
            <Image
              src="/images/logo.png"
              alt="SurakshaSetu Logo"
              width={120}
              height={120}
              className="rounded-2xl shadow-2xl"
            />
          </motion.div>
          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 text-balance"
          >
            {t('branding.title')}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl sm:text-2xl text-gray-200 mb-4"
          >
            {t('branding.tagline')}
          </motion.p>

          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-gray-300 mb-8"
          >
            {t('branding.subtitle')}
          </motion.p>

          <motion.button
            variants={itemVariants}
            onClick={() => router.push('/login')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary text-lg inline-flex items-center gap-2"
          >
            {t('branding.heroCTA')}
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-4xl font-bold text-center mb-16 text-foreground"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {t('branding.feature1Title').split(' ')[0]} {t('branding.feature1Title').split(' ')[1]}
          </motion.h2>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={featureVariants}
                  className="card-hover group"
                >
                  <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section
        className="py-20 px-4 sm:px-6 lg:px-8 bg-background"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-4xl font-bold text-center mb-16 text-foreground"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {t('branding.howItWorks')}
          </motion.h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="relative aspect-square w-full max-w-md mx-auto lg:max-w-none"
            >
              <Image
                src="/images/how_it_works.png"
                alt="How It Works Illustration"
                fill
                className="object-cover rounded-2xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-2xl"></div>
            </motion.div>

            <motion.div
              className="space-y-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  variants={featureVariants}
                  className="relative pl-12"
                >
                  <div className="absolute left-0 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/30">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground flex items-center gap-3">
                    <span className="text-2xl drop-shadow-md">{step.icon}</span>
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Benefits Section */}
      <motion.section
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted to-background"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.h2
            className="text-3xl font-bold text-center mb-12 text-foreground"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {t('branding.benefitsTitle')}
          </motion.h2>

          <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              t('branding.benefit1'),
              t('branding.benefit2'),
              t('branding.benefit3'),
              t('branding.benefit4'),
              t('branding.benefit5'),
              t('branding.benefit6'),
            ].map((benefit, index) => (
              <motion.div
                key={index}
                variants={featureVariants}
                className="flex items-center gap-4 p-4 rounded-lg bg-background border border-border"
              >
                <Check className="w-6 h-6 text-secondary flex-shrink-0" />
                <span className="text-lg text-foreground">{benefit}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Footer */}
      <motion.section
        className="relative py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground text-center overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <Image
          src="/images/secure_identity_network.png"
          alt="Secure Network"
          fill
          className="object-cover absolute inset-0 z-0 mix-blend-overlay opacity-30"
        />
        <div className="absolute inset-0 bg-primary/70 z-10"></div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative z-20"
        >
          <motion.h2 variants={itemVariants} className="text-4xl font-bold mb-6">
            {t('branding.ctaTitle')}
          </motion.h2>
          <motion.p variants={itemVariants} className="text-lg mb-8 opacity-90">
            {t('branding.ctaSubtitle')}
          </motion.p>
          <motion.button
            variants={itemVariants}
            onClick={() => router.push('/login')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-primary px-8 py-3 rounded-lg font-semibold inline-flex items-center gap-2 hover:bg-gray-100 transition-colors"
          >
            {t('branding.heroCTA')}
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </motion.section>
    </div>
  );
}
