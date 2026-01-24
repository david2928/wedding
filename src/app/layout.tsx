import type { Metadata } from 'next'
import { Poppins, Dancing_Script, Inter, Crimson_Pro } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import QueryProvider from '@/components/providers/QueryProvider'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
})

const dancing = Dancing_Script({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dancing',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
})

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-crimson',
})

export const metadata: Metadata = {
  title: 'David & Chanika - January 31, 2026 - Phuket Wedding',
  description: "David & Chanika's Wedding - Where Dreams Come True. January 31, 2026 at COMO Point Yamu, Phuket, Thailand",
  authors: [{ name: 'David & Chanika' }],
  openGraph: {
    title: 'David & Chanika - Wedding in Phuket',
    description: 'Join us for our fairytale wedding by the ocean in Phuket, Thailand. January 31, 2026 at COMO Point Yamu',
    type: 'website',
    url: 'https://chanikadavidwedding.com',
    siteName: 'David & Chanika Wedding',
    images: [
      {
        url: 'https://chanikadavidwedding.com/android-chrome-512x512.png',
        width: 512,
        height: 512,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'David & Chanika - Wedding in Phuket',
    description: 'Join us for our fairytale wedding by the ocean in Phuket, Thailand. January 31, 2026',
    images: ['https://chanikadavidwedding.com/android-chrome-512x512.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/site.webmanifest',
}

export const viewport = {
  themeColor: '#0077B6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${dancing.variable} ${inter.variable} ${crimsonPro.variable}`}>
      <body className="bg-soft-white min-h-screen">
        <QueryProvider>
          <TooltipProvider>
            {children}
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
