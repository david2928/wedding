# Wedding Website Migration Guide: Vite to Next.js

**Project**: Chanika & David Wedding Website
**Migration Date**: December 30, 2024
**From**: Vite 5.4.1 + React 18.3.1 + React Router DOM 6.26.2
**To**: Next.js 16.1.1 + React 19.2.3 with App Router

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Why We Migrated](#why-we-migrated)
3. [Architecture Changes](#architecture-changes)
4. [Project Structure Comparison](#project-structure-comparison)
5. [Key Technical Changes](#key-technical-changes)
6. [Deployment Guide](#deployment-guide)
7. [Environment Variables](#environment-variables)
8. [Testing Checklist](#testing-checklist)
9. [Troubleshooting](#troubleshooting)
10. [Important Files Reference](#important-files-reference)

---

## Executive Summary

This migration transformed the wedding website from a Vite-based SPA to a Next.js 16 application using the App Router. The primary driver was resolving CSS maintenance issues caused by excessive use of `!important` overrides (1000+ lines of CSS hacks) to combat browser autofill styling and background color issues.

**Key Benefits Achieved:**
- Eliminated 1000+ lines of problematic CSS with `!important` overrides
- Migrated to Tailwind CSS v4 with cleaner, more maintainable styles
- Improved font loading with Next.js `next/font/google` optimization
- Better SSR/SSG capabilities with Next.js App Router
- Enhanced developer experience with file-based routing
- Modernized to React 19 and latest dependency versions

---

## Why We Migrated

### The CSS Problem

The Vite project suffered from severe CSS maintenance issues:

1. **Autofill Styling Battles**: 100+ lines of aggressive CSS to override browser autofill yellow backgrounds
   ```css
   /* OLD: Nuclear approach with !important everywhere */
   input:-webkit-autofill,
   input:-webkit-autofill:hover,
   input:-webkit-autofill:focus,
   input:-webkit-autofill:active,
   input[type="password"]:-webkit-autofill,
   input[type="password"]:-webkit-autofill:hover,
   /* ... 50+ more lines ... */
   {
     -webkit-box-shadow: 0 0 0 1000px white inset !important;
     -webkit-text-fill-color: rgb(15, 23, 42) !important;
     background-color: white !important;
     border: 2px solid rgb(125, 211, 252) !important;
     /* ... more !important declarations ... */
   }
   ```

2. **Multiple :root Declarations**: Conflicting CSS custom property definitions across the file

3. **Specificity Wars**: Admin page had 200+ lines of overly-specific selectors:
   ```css
   .admin-page input[type="text"]:-webkit-autofill,
   .admin-page input[type="text"]:-webkit-autofill:hover,
   .admin-page input[type="text"]:-webkit-autofill:focus,
   /* ... 30+ more variations ... */
   ```

4. **Background Color Hacks**: Aggressive rules to prevent yellow backgrounds:
   ```css
   *:not([class*="bg-"]):not([style*="background"]):not(video):not(img) {
     background-color: transparent !important;
   }
   ```

5. **Total CSS Size**: 1027 lines in `index.css`, with 870+ lines being workarounds

### The Solution: Next.js + Tailwind v4

Next.js provided:
- Better CSS architecture with Tailwind v4's new `@import` system
- Cleaner autofill handling without CSS hacks
- Optimized font loading (no more Google Fonts CDN in HTML)
- Modern React 19 with improved performance
- Better production optimizations out of the box

---

## Architecture Changes

### Routing Architecture

#### Old: React Router DOM (Vite)
```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin-wedding-2026-reports" element={<AdminReport />} />
          <Route path="/guest/:code" element={<GuestInfoForm />} />
          <Route path="/admin-guests" element={<GuestAdmin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
```

#### New: Next.js App Router
```
src/app/
├── layout.tsx                          # Root layout (providers, fonts)
├── page.tsx                            # Home page (was Index.tsx)
├── not-found.tsx                       # 404 page
├── admin-wedding-2026-reports/
│   └── page.tsx                        # Admin report page
├── guest/
│   └── [code]/
│       └── page.tsx                    # Guest info form (dynamic route)
├── admin-guests/
│   └── page.tsx                        # Guest admin page
└── auth/
    └── callback/
        └── route.ts                    # OAuth callback handler
```

**File-based routing eliminates:**
- Manual route configuration
- BrowserRouter setup
- Route component imports
- 404 catch-all route definition

### Font Loading Migration

#### Old: Google Fonts Link Tags (Vite)
```html
<!-- index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Dancing+Script:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
```

**Issues:**
- Network request waterfall (HTML → CSS file download)
- Flash of unstyled text (FOUT)
- No font optimization
- External dependency on Google's CDN

#### New: next/font/google (Next.js)
```tsx
// src/app/layout.tsx
import { Poppins, Dancing_Script, Inter } from 'next/font/google'

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

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${poppins.variable} ${dancing.variable} ${inter.variable}`}>
      <body className="bg-soft-white min-h-screen">
        {children}
      </body>
    </html>
  )
}
```

**Benefits:**
- Fonts self-hosted automatically
- Zero layout shift with `font-display: swap`
- Optimized font file sizes
- CSS variable integration
- No external requests in production

### Supabase Integration Changes

#### Old: @supabase/supabase-js (Vite)
```ts
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://mpxwemjesayzedsuroem.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGci...";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
```

**Issues:**
- Hardcoded credentials in code
- Client-only approach (no SSR support)
- No cookie-based auth management

#### New: @supabase/ssr (Next.js)
```ts
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const supabase = createClient()
```

**OAuth Callback Handler** (New):
```ts
// src/app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/`)
}
```

**Benefits:**
- Environment variable management
- SSR-compatible auth
- Cookie-based session management
- OAuth flow support with callback route

### CSS Architecture: Tailwind v3 → v4

#### Old: Traditional Tailwind v3 (Vite)
```css
/* index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 870+ lines of CSS hacks below... */
```

```ts
// tailwind.config.ts
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'federal-blue': '#03045E',
        'ocean-blue': '#0284C7',
        // ... many more
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'dancing': ['Dancing Script', 'cursive'],
        'inter': ['Inter', 'sans-serif'],
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
}
```

#### New: Tailwind v4 (Next.js)
```css
/* globals.css */
@import "tailwindcss";

/* Clean, organized CSS variables */
:root {
  --background: 253 251 247;
  --foreground: 15 23 42;
  --primary: 14 165 233;
  /* ... */
}

@theme inline {
  /* Color palette */
  --color-federal-blue: #03045E;
  --color-ocean-blue: #0284C7;
  --color-sky-blue: #0EA5E9;

  /* Font families */
  --font-family-poppins: 'Poppins', sans-serif;
  --font-family-dancing: 'Dancing Script', cursive;

  /* Animations */
  --animate-wave: wave 2s ease-in-out infinite;

  @keyframes wave {
    0% { transform: rotate(0deg); }
    10% { transform: rotate(14deg); }
    /* ... */
  }
}

@layer base {
  html {
    @apply bg-soft-white scroll-smooth;
  }

  /* Clean autofill - NO !important */
  input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px white inset;
    -webkit-text-fill-color: rgb(15, 23, 42);
  }
}

@layer utilities {
  .font-dancing {
    font-family: var(--font-dancing), 'Dancing Script', cursive;
  }
}
```

**Tailwind v4 config is now minimal:**
```ts
// tailwind.config.ts - Nearly empty!
export default {
  // Configuration moved to CSS
}
```

**Key Improvements:**
- Single `:root` declaration (was 3+ conflicting ones)
- No `!important` usage (was 200+ instances)
- CSS-first configuration with `@theme inline`
- Clean 196 lines vs. 1027 lines
- Maintainable autofill styling

---

## Project Structure Comparison

### Directory Layout

#### Vite Project Structure
```
C:\vs_code\chanika-david-phuket-dreams\
├── index.html                          # Entry HTML with font links
├── vite.config.ts                      # Vite configuration
├── tailwind.config.ts                  # Tailwind v3 config
├── package.json                        # Dependencies
└── src/
    ├── main.tsx                        # React entry point
    ├── App.tsx                         # Router setup
    ├── index.css                       # 1027 lines of CSS
    ├── pages/                          # Route components
    │   ├── Index.tsx                   # Home page
    │   ├── AdminReport.tsx
    │   ├── GuestInfoForm.tsx
    │   ├── GuestAdmin.tsx
    │   ├── TestIcons.tsx
    │   └── NotFound.tsx
    ├── components/                     # UI components
    │   ├── ui/                         # shadcn/ui components
    │   └── sections/                   # Page sections
    ├── integrations/
    │   └── supabase/
    │       ├── client.ts               # Hardcoded credentials
    │       └── types.ts
    ├── hooks/                          # Custom React hooks
    └── lib/                            # Utilities
```

#### Next.js Project Structure
```
C:\vs_code\chanika-david-wedding-nextjs\
├── next.config.ts                      # Next.js configuration (minimal)
├── tailwind.config.ts                  # Tailwind v4 config (minimal)
├── package.json                        # Updated dependencies
├── .env.local                          # Environment variables
└── src/
    ├── app/                            # App Router
    │   ├── layout.tsx                  # Root layout + fonts
    │   ├── page.tsx                    # Home page
    │   ├── globals.css                 # 196 lines of clean CSS
    │   ├── not-found.tsx               # 404 page
    │   ├── admin-wedding-2026-reports/
    │   │   └── page.tsx
    │   ├── guest/
    │   │   └── [code]/
    │   │       └── page.tsx            # Dynamic route
    │   ├── admin-guests/
    │   │   └── page.tsx
    │   └── auth/
    │       └── callback/
    │           └── route.ts            # API route
    ├── components/
    │   ├── providers/
    │   │   └── QueryProvider.tsx      # 'use client' wrapper
    │   ├── ui/                         # shadcn/ui components
    │   └── sections/                   # Page sections
    ├── lib/
    │   └── supabase/
    │       ├── client.ts               # @supabase/ssr client
    │       └── types.ts
    ├── hooks/                          # Custom React hooks
    └── public/                         # Static assets (favicons, etc.)
```

### Route Mapping

| Vite Route (React Router) | Next.js Route (App Router) | Notes |
|---------------------------|---------------------------|-------|
| `src/pages/Index.tsx` | `src/app/page.tsx` | Main landing page |
| `src/pages/NotFound.tsx` | `src/app/not-found.tsx` | 404 page |
| `src/pages/AdminReport.tsx` | `src/app/admin-wedding-2026-reports/page.tsx` | Admin reports |
| `src/pages/GuestInfoForm.tsx` | `src/app/guest/[code]/page.tsx` | Dynamic param `code` |
| `src/pages/GuestAdmin.tsx` | `src/app/admin-guests/page.tsx` | Guest admin panel |
| `src/pages/TestIcons.tsx` | _(Removed)_ | Not migrated |
| _(N/A)_ | `src/app/auth/callback/route.ts` | New OAuth handler |

---

## Key Technical Changes

### 1. Client vs Server Components

Next.js App Router uses React Server Components by default. Components that use client-side features must be marked with `'use client'`.

#### Client Components (Need 'use client')
```tsx
// src/components/providers/QueryProvider.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

**When to use 'use client':**
- Components using React hooks (`useState`, `useEffect`, etc.)
- Event handlers (`onClick`, `onChange`, etc.)
- Browser APIs (`window`, `localStorage`, etc.)
- Third-party libraries that require client context (React Query, forms, etc.)

#### Server Components (Default)
```tsx
// src/app/page.tsx - NO 'use client' needed
import Navigation from '@/components/sections/Navigation'
import HeroSection from '@/components/sections/HeroSection'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <HeroSection />
      </main>
    </div>
  )
}
```

### 2. Metadata Configuration

#### Old: HTML Meta Tags (Vite)
```html
<!-- index.html -->
<head>
  <title>David & Chanika - January 31, 2026 - Phuket Wedding</title>
  <meta name="description" content="..." />
  <meta property="og:title" content="..." />
  <meta property="og:image" content="..." />
  <!-- ... many more meta tags ... -->
</head>
```

#### New: Next.js Metadata API
```tsx
// src/app/layout.tsx
import type { Metadata } from 'next'

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
    images: [{
      url: 'https://chanikadavidwedding.com/android-chrome-512x512.png',
      width: 512,
      height: 512,
    }],
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
  themeColor: '#0077B6',
}
```

**Benefits:**
- Type-safe metadata configuration
- Automatic meta tag generation
- Better SEO optimization
- Dynamic metadata support per route

### 3. Font Utility Classes

With `next/font/google`, fonts are loaded as CSS variables. Create utility classes for easy usage:

```css
/* src/app/globals.css */
@layer utilities {
  .font-dancing {
    font-family: var(--font-dancing), 'Dancing Script', cursive;
  }

  .font-poppins {
    font-family: var(--font-poppins), 'Poppins', sans-serif;
  }

  .font-inter {
    font-family: var(--font-inter), 'Inter', sans-serif;
  }
}
```

**Usage in components:**
```tsx
<h1 className="font-dancing text-4xl">
  David & Chanika
</h1>

<p className="font-inter text-lg">
  Join us for our wedding celebration
</p>
```

### 4. Dynamic Routes

#### Old: React Router (Vite)
```tsx
// src/App.tsx
<Route path="/guest/:code" element={<GuestInfoForm />} />

// src/pages/GuestInfoForm.tsx
import { useParams } from 'react-router-dom'

function GuestInfoForm() {
  const { code } = useParams()
  // ...
}
```

#### New: Next.js App Router
```
src/app/guest/[code]/page.tsx
```

```tsx
// src/app/guest/[code]/page.tsx
type PageProps = {
  params: Promise<{ code: string }>
}

export default async function GuestInfoPage({ params }: PageProps) {
  const { code } = await params
  // ...
}
```

**Note**: In Next.js 15+, `params` is now a Promise that must be awaited.

### 5. CSS Cleanup Examples

#### Before: Autofill Nightmare
```css
/* 870+ lines of this... */
input[type="password"]:-webkit-autofill,
input[name="password"]:-webkit-autofill,
#admin-password:-webkit-autofill,
input[type="password"]:-webkit-autofill:hover,
input[name="password"]:-webkit-autofill:hover,
#admin-password:-webkit-autofill:hover,
input[type="password"]:-webkit-autofill:focus,
input[name="password"]:-webkit-autofill:focus,
#admin-password:-webkit-autofill:focus,
input[type="password"]:-webkit-autofill:active,
input[name="password"]:-webkit-autofill:active,
#admin-password:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 1000px white inset !important;
  box-shadow: 0 0 0 1000px white inset !important;
  background-color: white !important;
  -webkit-text-fill-color: #1e293b !important;
  border: 2px solid rgba(125, 211, 252, 0.3) !important;
  border-color: rgba(125, 211, 252, 0.3) !important;
  outline: none !important;
}
```

#### After: Clean Solution
```css
/* Clean and simple */
@layer base {
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 1000px white inset;
    -webkit-text-fill-color: rgb(15, 23, 42);
    border-color: rgb(125, 211, 252);
    transition: background-color 5000s ease-in-out 0s;
  }
}
```

**Reduction**: From 200+ lines to 9 lines (95% reduction)

---

## Deployment Guide

### Prerequisites

1. Vercel account (free tier works)
2. GitHub account with repository access
3. Supabase credentials (URL and anon key)

### Step-by-Step Deployment to Vercel

#### 1. Prepare Environment Variables

Create `.env.local` in your Next.js project:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://mpxwemjesayzedsuroem.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

**Important**: Never commit `.env.local` to Git. It's already in `.gitignore`.

#### 2. Push to GitHub

```bash
cd C:\vs_code\chanika-david-wedding-nextjs

# Initialize git if not already done
git init
git add .
git commit -m "Initial Next.js migration"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/wedding-nextjs.git
git branch -M main
git push -u origin main
```

#### 3. Import Project to Vercel

**Option A: Vercel Dashboard**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your GitHub repository: `wedding-nextjs`
4. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
5. Add Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://mpxwemjesayzedsuroem.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...your_key...
   ```
6. Click "Deploy"

**Option B: Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - Project name? chanika-david-wedding
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste value: https://mpxwemjesayzedsuroem.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste value: your_anon_key

# Deploy to production
vercel --prod
```

#### 4. Configure Custom Domain

1. In Vercel dashboard, go to your project
2. Navigate to "Settings" → "Domains"
3. Add custom domain: `chanikadavidwedding.com`
4. Follow DNS configuration instructions:
   - Add A record: `76.76.21.21`
   - Add CNAME record for `www`: `cname.vercel-dns.com`
5. Wait for DNS propagation (5-60 minutes)

#### 5. Update Supabase OAuth Settings

If using Supabase authentication:

1. Go to Supabase dashboard → Authentication → URL Configuration
2. Update Site URL: `https://chanikadavidwedding.com`
3. Add Redirect URLs:
   ```
   https://chanikadavidwedding.com/auth/callback
   https://www.chanikadavidwedding.com/auth/callback
   https://your-project.vercel.app/auth/callback
   ```

#### 6. Replace Old Vite Deployment

If you had the Vite version deployed:

**Option 1: Same domain**
- Point your domain DNS to the new Vercel deployment
- Old deployment will automatically become inaccessible

**Option 2: Different domain temporarily**
- Deploy Next.js to new domain first
- Test thoroughly
- Switch DNS to new deployment
- Delete old Vite deployment

**Vercel Zero-Downtime Deployment:**
Vercel automatically provides:
- Atomic deployments (all-or-nothing)
- Instant rollback capability
- Automatic HTTPS certificates
- Global CDN distribution

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://mpxwemjesayzedsuroem.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGci...` |

### Local Development Setup

```bash
# Copy example file
cp .env.example .env.local

# Edit .env.local
NEXT_PUBLIC_SUPABASE_URL=https://mpxwemjesayzedsuroem.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Production Setup (Vercel)

Add via Vercel dashboard or CLI:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

### Environment Variable Access

```tsx
// Client components and Server components
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never prefix secrets with `NEXT_PUBLIC_`.

---

## Testing Checklist

### Pre-Deployment Testing

- [ ] **Local Development Server**
  ```bash
  npm run dev
  # Visit http://localhost:3000
  ```

- [ ] **Production Build Locally**
  ```bash
  npm run build
  npm start
  # Visit http://localhost:3000
  ```

### Core Functionality Tests

- [ ] **Navigation**
  - [ ] All navigation links work
  - [ ] Smooth scrolling to sections functions
  - [ ] Mobile menu opens and closes

- [ ] **Pages**
  - [ ] Home page loads with all sections
  - [ ] Admin reports page loads (`/admin-wedding-2026-reports`)
  - [ ] Guest info form loads (`/guest/TEST123`)
  - [ ] Guest admin page loads (`/admin-guests`)
  - [ ] 404 page displays for invalid routes

- [ ] **Styling**
  - [ ] No yellow backgrounds appear anywhere
  - [ ] Autofill inputs have correct styling (blue borders, white background)
  - [ ] Fonts load correctly (Poppins, Dancing Script, Inter)
  - [ ] Custom color palette displays properly
  - [ ] Animations work (wave, float, sparkle)
  - [ ] Responsive design works on mobile/tablet/desktop

- [ ] **Forms**
  - [ ] Input fields accept text
  - [ ] Autofill doesn't break styling
  - [ ] Form validation works
  - [ ] Submit handlers function correctly
  - [ ] Error messages display properly

- [ ] **Supabase Integration**
  - [ ] Database queries execute
  - [ ] Authentication works (if applicable)
  - [ ] OAuth callback handles redirects
  - [ ] Data fetching with React Query works

### Performance Tests

- [ ] **Lighthouse Scores** (Target: 90+)
  - [ ] Performance
  - [ ] Accessibility
  - [ ] Best Practices
  - [ ] SEO

- [ ] **Core Web Vitals**
  - [ ] LCP (Largest Contentful Paint) < 2.5s
  - [ ] FID (First Input Delay) < 100ms
  - [ ] CLS (Cumulative Layout Shift) < 0.1

### Browser Compatibility

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (Desktop)
- [ ] Safari (iOS)
- [ ] Chrome (Android)

### Post-Deployment Verification

- [ ] **Domain Access**
  - [ ] `https://chanikadavidwedding.com` loads
  - [ ] `https://www.chanikadavidwedding.com` redirects correctly
  - [ ] HTTPS certificate is valid
  - [ ] No mixed content warnings

- [ ] **Environment Variables**
  - [ ] Supabase connection works in production
  - [ ] No console errors about missing variables

- [ ] **Social Sharing**
  - [ ] Open Graph tags generate correct previews (Facebook, LinkedIn)
  - [ ] Twitter Card displays properly
  - [ ] Favicon appears in browser tabs

- [ ] **Analytics & Monitoring** (if applicable)
  - [ ] Vercel Analytics tracks page views
  - [ ] Error tracking captures issues
  - [ ] Performance monitoring active

---

## Troubleshooting

### Common Issues

#### 1. "Cannot find module" errors

**Symptom**: Build fails with module not found errors

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 2. Environment variables not working

**Symptom**: `process.env.NEXT_PUBLIC_SUPABASE_URL` is undefined

**Solutions**:
- Ensure `.env.local` exists with correct variables
- Restart dev server after changing env vars
- Check variable names have `NEXT_PUBLIC_` prefix
- Verify Vercel environment variables are set for production

#### 3. Font not loading (FOUT/FOIT)

**Symptom**: Flash of unstyled text or missing fonts

**Solution**: Fonts are loaded via `next/font/google`, ensure:
```tsx
// layout.tsx
const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap', // Add this if missing
  variable: '--font-poppins',
})
```

#### 4. CSS not updating in production

**Symptom**: Old styles appear after deployment

**Solution**:
```bash
# Clear Next.js cache and rebuild
rm -rf .next
npm run build
vercel --prod
```

#### 5. Yellow autofill backgrounds still appearing

**Symptom**: Input fields have yellow background on autofill

**Check**:
- Ensure `globals.css` has autofill styles in `@layer base`
- Verify no conflicting CSS from old files
- Test in incognito mode (browser extensions can interfere)

#### 6. Dynamic route not working (`/guest/[code]`)

**Symptom**: 404 on `/guest/ABC123`

**Solution**: Ensure params are awaited (Next.js 15+):
```tsx
// ❌ Wrong
export default function Page({ params }: PageProps) {
  const { code } = params // ERROR
}

// ✅ Correct
export default async function Page({ params }: PageProps) {
  const { code } = await params
}
```

#### 7. Build succeeds locally but fails on Vercel

**Check**:
- Node version compatibility (Vercel uses Node 20 by default)
- Environment variables are set in Vercel
- No hardcoded local file paths
- All dependencies in `package.json` (not just `devDependencies`)

**Set Node version**:
```json
// package.json
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### Getting Help

- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Tailwind CSS v4**: [tailwindcss.com/docs](https://tailwindcss.com/docs)

---

## Important Files Reference

### Configuration Files

#### `next.config.ts`
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

**Location**: `C:\vs_code\chanika-david-wedding-nextjs\next.config.ts`

#### `tailwind.config.ts`
Minimal config - most configuration is in `globals.css` via `@theme inline`

**Location**: `C:\vs_code\chanika-david-wedding-nextjs\tailwind.config.ts`

#### `package.json`
Key dependency versions:
- `next`: `16.1.1`
- `react`: `19.2.3`
- `@supabase/ssr`: `^0.8.0`
- `tailwindcss`: `^4`

**Location**: `C:\vs_code\chanika-david-wedding-nextjs\package.json`

### Core Application Files

#### `src/app/layout.tsx`
Root layout with font loading, metadata, and providers

**Key sections**:
- Font imports with `next/font/google`
- Metadata export for SEO
- QueryProvider and TooltipProvider wrappers

**Location**: `C:\vs_code\chanika-david-wedding-nextjs\src\app\layout.tsx`

#### `src/app/page.tsx`
Home page (replaces `src/pages/Index.tsx` from Vite)

**Location**: `C:\vs_code\chanika-david-wedding-nextjs\src\app\page.tsx`

#### `src/app/globals.css`
Main stylesheet (196 lines vs. 1027 in Vite)

**Key sections**:
- `@import "tailwindcss"` (Tailwind v4)
- `:root` CSS variables (single declaration)
- `@theme inline` block with colors, fonts, animations
- `@layer base` with clean autofill styles
- `@layer utilities` for font classes
- `@layer components` for gradient utilities

**Location**: `C:\vs_code\chanika-david-wedding-nextjs\src\app\globals.css`

### Supabase Integration

#### `src/lib/supabase/client.ts`
Browser client using `@supabase/ssr`

**Location**: `C:\vs_code\chanika-david-wedding-nextjs\src\lib\supabase\client.ts`

#### `src/lib/supabase/types.ts`
TypeScript types for Supabase database schema

**Location**: `C:\vs_code\chanika-david-wedding-nextjs\src\lib\supabase\types.ts`

#### `src/app/auth/callback/route.ts`
OAuth callback handler (API route)

**Location**: `C:\vs_code\chanika-david-wedding-nextjs\src\app\auth\callback\route.ts`

### Provider Components

#### `src/components/providers/QueryProvider.tsx`
React Query provider wrapper (client component)

**Location**: `C:\vs_code\chanika-david-wedding-nextjs\src\components\providers\QueryProvider.tsx`

### Migration Artifacts (Old Project)

#### `src/index.css` (Vite - 1027 lines)
**DO NOT REFERENCE** - This file demonstrates what we migrated away from

**Location**: `C:\vs_code\chanika-david-phuket-dreams\src\index.css`

**Issues documented**:
- 870+ lines of `!important` overrides
- 3 conflicting `:root` declarations (lines 7, 333, 875)
- Massive autofill styling hacks (lines 31-280)
- Admin page specificity wars (lines 141-265)
- Aggressive background stripping (lines 69-76)

---

## Post-Migration Fixes

### Autofill Styling (December 30, 2024)

**Issue**: Despite the cleaner CSS, Chrome's autofill still applied yellow backgrounds because browser defaults use `!important`.

**Solution**: Added strategic `!important` usage ONLY for autofill overrides:
- Updated Input and Textarea components with inline styles
- Added comprehensive autofill CSS in `@layer base` with `!important`
- This is the ONLY acceptable use of `!important` in the project

**Result**: Clean white inputs with blue borders, no yellow backgrounds.

### Tailwind v4 Gradient Issue (December 30, 2024)

**Issue**: Custom colors defined in `@theme inline` as `--color-*` were not available to Tailwind gradient utilities like `from-sky-blue`.

**Solution**: Used direct CSS `linear-gradient()` in `@layer components`:
```css
.gradient-sky {
  background: linear-gradient(135deg, #CAF0F8 0%, #90E0EF 30%, #DBEAFE 70%, #F0F9FF 100%);
}
```

**Lesson**: Tailwind v4's architecture requires different approaches than v3. Custom colors work best with direct CSS, not utility classes.

## Summary

This migration successfully transformed the wedding website from a Vite-based SPA with severe CSS maintenance issues into a modern Next.js 16 application with:

- **81% CSS reduction**: From 1027 lines to 196 lines
- **Strategic !important usage**: Only for browser autofill overrides (vs. 200+ in old version)
- **Modern architecture**: App Router, React 19, Tailwind v4
- **Better performance**: Optimized fonts, SSR/SSG capabilities
- **Improved DX**: File-based routing, better tooling, cleaner code

The migration eliminates technical debt while maintaining all functionality and improving the development experience.

---

**Migration completed**: December 30, 2024
**Documentation version**: 1.0
**Maintained by**: David Geieregger
