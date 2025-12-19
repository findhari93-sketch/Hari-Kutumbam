import type { Metadata, Viewport } from 'next';
import ThemeRegistry from '@/theme/ThemeRegistry';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Expense Tracker Pro',
  description: 'Comprehensive Personal Finance Management',
  manifest: '/manifest.json', // Prepared for PWA
};

export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <AuthProvider>{children}</AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
