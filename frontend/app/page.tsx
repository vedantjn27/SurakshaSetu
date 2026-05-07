'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    router.push('/branding');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
