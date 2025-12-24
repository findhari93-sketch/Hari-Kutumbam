import type { Metadata, Viewport } from 'next';
import ThemeRegistry from '@/theme/ThemeRegistry';
import LocalizationRegistry from '@/theme/LocalizationRegistry';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Hari Kutumbam',
  description: 'Manage your family finances efficiently',
  manifest: '/manifest.json', // Prepared for PWA
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  }
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
          <LocalizationRegistry>
            <AuthProvider>{children}</AuthProvider>
          </LocalizationRegistry>
        </ThemeRegistry>
      </body>
    </html>
  );
}
