'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Shield, Lock, TrendingUp, Database, ArrowRight, Check } from 'lucide-react';

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

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

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

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={featureVariants}
                className="relative"
              >
                <div className="text-center">
                  <div className="text-5xl mb-4">{step.icon}</div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{step.desc}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/4 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary to-transparent"></div>
                )}
              </motion.div>
            ))}
          </motion.div>
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
            Why Choose SurakshaSetu?
          </motion.h2>

          <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              'Real-time fraud detection with AI',
              'Secure PII handling and encryption',
              'Role-based access control',
              'Comprehensive audit trails',
              'Multi-language support',
              'Enterprise-grade scalability',
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
        className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h2 variants={itemVariants} className="text-4xl font-bold mb-6">
            Ready to Secure Your Identity Data?
          </motion.h2>
          <motion.p variants={itemVariants} className="text-lg mb-8 opacity-90">
            Join government departments in leveraging SurakshaSetu for fraud-free identity management
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
