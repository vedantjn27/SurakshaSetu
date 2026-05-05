import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'SurakshaSetu - Identity Verification & Fraud Detection',
  description: 'Enterprise platform for identity verification and fraud detection across government departments',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className="bg-background" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#1e40af" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
