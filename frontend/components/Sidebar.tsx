'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  Upload,
  CheckCircle2,
  FileText,
  Lock,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  roles: ('admin' | 'reviewer' | 'analyst')[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems: MenuItem[] = [
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: t('navigation.dashboard'),
      href: '/dashboard',
      roles: ['admin', 'reviewer', 'analyst'],
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: t('navigation.ubidRegistry'),
      href: '/ubid-registry',
      roles: ['admin', 'reviewer', 'analyst'],
    },
    {
      icon: <Upload className="w-5 h-5" />,
      label: t('navigation.dataUploads'),
      href: '/data-upload',
      roles: ['admin', 'reviewer'],
    },
    {
      icon: <CheckCircle2 className="w-5 h-5" />,
      label: t('navigation.reviewCenter'),
      href: '/review-center',
      roles: ['admin', 'reviewer'],
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: t('navigation.auditLogs'),
      href: '/audit-logs',
      roles: ['admin', 'reviewer', 'analyst'],
    },
    {
      icon: <Lock className="w-5 h-5" />,
      label: t('navigation.privacyPlayground'),
      href: '/privacy-playground',
      roles: ['admin', 'analyst'],
    },
    {
      icon: <UserCog className="w-5 h-5" />,
      label: t('userManagement.title', 'User Management'),
      href: '/user-management',
      roles: ['admin'],
    },
  ];

  const visibleItems = menuItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const isActive = (href: string) => pathname === href || pathname.startsWith(href);

  return (
    <motion.aside
      className={cn(
        'bg-muted border-r border-border flex flex-col transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
      animate={{ width: collapsed ? 80 : 256 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
            <Image
              src="/images/logo.png"
              alt="Logo"
              fill
              className="object-cover"
            />
          </div>
          {!collapsed && (
            <span className="font-bold text-primary truncate">
              SurakshaSetu
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-background rounded-lg transition-colors text-foreground"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {visibleItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <motion.div
              whileHover={{ x: 4 }}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer',
                isActive(item.href)
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-foreground hover:bg-background'
              )}
            >
              {item.icon}
              {!collapsed && <span className="text-sm font-semibold">{item.label}</span>}
              {!collapsed && isActive(item.href) && (
                <motion.div
                  className="ml-auto w-2 h-2 rounded-full bg-primary-foreground"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                />
              )}
            </motion.div>
          </Link>
        ))}

        {/* Admin Only Section */}
        {user?.role === 'admin' && (
          <motion.div
            className="mt-6 pt-6 border-t border-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {!collapsed && (
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-3 px-4">
                {t('sidebar.adminTools', 'Admin Tools')}
              </p>
            )}
            <motion.button
              whileHover={{ x: 4 }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-background transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              {!collapsed && <span className="text-sm font-semibold">{t('sidebar.modelRetraining', 'Model Retraining')}</span>}
            </motion.button>
          </motion.div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className={cn(
          'p-3 rounded-lg bg-background',
          collapsed ? 'flex justify-center' : 'text-center'
        )}>
          {collapsed ? (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xs">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-foreground truncate">{user?.username}</p>
              <p className="text-xs text-muted-foreground mt-1 uppercase">{user?.role}</p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
