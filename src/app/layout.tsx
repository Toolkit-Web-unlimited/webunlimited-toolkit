import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Analytics } from '@/components/Analytics';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | Web Unlimited Toolkit',
    default: 'Web Unlimited Toolkit - AI Creative Tools',
  },
  description: 'Professionelle Tools für Creative Professionals: Ad Estimator, Safe Zone Preview, Contrast Checker, Site Analyzer und Copy Booster.',
  keywords: ['creative tools', 'advertising', 'design', 'accessibility', 'seo', 'copywriting'],
  authors: [{ name: 'Web Unlimited' }],
  creator: 'Web Unlimited',
  openGraph: {
    type: 'website',
    locale: 'de_CH',
    url: process.env.SITE_URL || 'https://toolkit.webunlimited.ch',
    title: 'Web Unlimited Toolkit - AI Creative Tools',
    description: 'Professionelle Tools für Creative Professionals: Ad Estimator, Safe Zone Preview, Contrast Checker, Site Analyzer und Copy Booster.',
    siteName: 'Web Unlimited Toolkit',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web Unlimited Toolkit - AI Creative Tools',
    description: 'Professionelle Tools für Creative Professionals: Ad Estimator, Safe Zone Preview, Contrast Checker, Site Analyzer und Copy Booster.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col bg-background">
          <Header />
          <main className="flex-1 container-custom py-4 sm:py-6 lg:py-8">
            {children}
          </main>
          <Footer />
        </div>
        <Analytics />
      </body>
    </html>
  );
}






