import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { BusinessProvider } from '@/contexts/business-context';

export const metadata: Metadata = {
  metadataBase: new URL('https://whatsodo.ai'),
  title: {
    default: 'Whatsodo — AI WhatsApp CRM',
    template: '%s | Whatsodo',
  },
  description:
    'Turn WhatsApp conversations into paying customers with AI-powered automation. Capture leads, reply with AI, book appointments, and track your pipeline.',
  keywords: ['WhatsApp CRM', 'AI WhatsApp', 'WhatsApp automation', 'lead management'],
  icons: { icon: '/favicon.ico' },
  openGraph: {
    type: 'website',
    siteName: 'Whatsodo',
    title: 'Whatsodo — AI WhatsApp CRM',
    description:
      'Capture leads, reply with AI, book appointments, and track your pipeline — all through WhatsApp.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Whatsodo — AI WhatsApp CRM',
    description: 'Turn WhatsApp conversations into paying customers with AI.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <BusinessProvider>{children}</BusinessProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
