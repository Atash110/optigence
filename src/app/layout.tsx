import type { Metadata, Viewport } from "next";
import { Inter, Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Layout from "@/components/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
import { TranslationProvider } from "@/contexts/TranslationContext";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: {
    default: "Optigence - Supercharge Your Productivity with Intelligent AI Modules | OptiMail & More",
    template: "%s | Optigence - Supercharge Productivity with AI"
  },
  description: "Supercharge your productivity with intelligent AI modules. Explore powerful AI solutions: OptiMail (AI-powered email assistant for composing, drafting & automation), OptiShop (smart shopping companion), OptiHire (career advancement), and OptiTrip (travel planning). Transform your workflow with multilingual AI support.",
  keywords: [
    "supercharge productivity", "intelligent AI modules", "OptiMail", "AI-powered email assistant", 
    "email composing AI", "email drafting automation", "productivity tools", "AI assistant",
    "OptiMail", "OptiShop", "OptiHire", "OptiTrip", "Optigence", "explore modules",
    "powerful AI modules", "business automation", "smart email management", "AI email composer",
    "email productivity", "intelligent automation", "AI workflow optimization", "email AI tools",
    "multilingual AI", "business solutions", "AI platform", "enterprise productivity",
    "AI modules", "smart assistant", "email efficiency", "automated email writing"
  ],
  authors: [{ name: "Optigence Team", url: "https://optigence.tech" }],
  creator: "Optigence",
  publisher: "Optigence",
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://optigence.tech',
    title: 'Optigence - Supercharge Your Productivity with Intelligent AI Modules',
    description: 'Supercharge your productivity with intelligent AI modules. Explore powerful AI solutions including OptiMail (AI-powered email assistant for composing & automation) and more productivity tools.',
    siteName: 'Optigence',
    images: [
      {
        url: 'https://optigence.tech/logo.svg',
        width: 1200,
        height: 630,
        alt: 'Optigence - Supercharge Productivity with AI Modules',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Optigence - Supercharge Your Productivity with Intelligent AI Modules',
    description: 'Supercharge your productivity with intelligent AI modules. Explore OptiMail and other powerful AI tools for email, shopping, career, and travel.',
    images: ['https://optigence.tech/logo.svg'],
    creator: '@optigence',
  },
  alternates: {
    canonical: 'https://optigence.tech',
    languages: {
      'en': 'https://optigence.tech',
      'az': 'https://optigence.tech?lang=az',
      'tr': 'https://optigence.tech?lang=tr',
      'es': 'https://optigence.tech?lang=es',
      'zh': 'https://optigence.tech?lang=zh',
      'de': 'https://optigence.tech?lang=de',
      'fr': 'https://optigence.tech?lang=fr',
      'ru': 'https://optigence.tech?lang=ru',
      'hi': 'https://optigence.tech?lang=hi',
      'ar': 'https://optigence.tech?lang=ar',
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
    other: {
      bing: ['your-bing-verification-code'],
    },
  },
  category: 'technology',
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Optigence",
    "description": "Supercharge your productivity with intelligent AI modules. Explore powerful AI solutions including OptiMail (AI-powered email assistant for composing, drafting & automation), OptiShop (smart shopping), OptiHire (career advancement), and OptiTrip (travel planning).",
    "url": "https://optigence.tech",
    "applicationCategory": "ProductivityApplication",
    "operatingSystem": "Web, iOS, Android",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/ComingSoon"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Optigence",
      "url": "https://optigence.tech",
      "logo": {
        "@type": "ImageObject",
        "url": "https://optigence.tech/logo.svg"
      }
    },
    "featureList": [
      "OptiMail - AI-Powered Email Assistant for Composing and Automation",
      "OptiShop - Intelligent Shopping Companion with AI Recommendations", 
      "OptiHire - Career Advancement Tools with AI Job Matching",
      "OptiTrip - Smart Travel Planning with AI Itinerary Generation",
      "Multilingual Support (10+ languages)",
      "Advanced Intent Detection AI",
      "Smart Productivity Predictions",
      "Voice and Text Input Support",
      "Intelligent Workflow Automation"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "127"
    },
    "keywords": "supercharge productivity, intelligent AI modules, OptiMail, AI email assistant, productivity tools, email automation, AI modules",
    "inLanguage": ["en", "az", "tr", "es", "zh", "de", "fr", "ru", "hi", "ar"]
  };

  return (
    <html lang="en" dir="ltr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1f2937" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.variable} ${geist.variable} ${inter.className} antialiased overflow-x-hidden`}>
        <main className="w-full min-h-screen overflow-auto">
          {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
            <Script
              src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
              strategy="afterInteractive"
            />
          )}
          <AuthProvider>
            <TranslationProvider>
              <Layout>
                {children}
              </Layout>
            </TranslationProvider>
          </AuthProvider>
        </main>
      </body>
    </html>
  );
}
