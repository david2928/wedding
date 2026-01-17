# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 wedding website for David & Chanika's wedding in Phuket, Thailand (January 31, 2026). The project uses React 19, Next.js App Router, Tailwind CSS v4, Supabase for backend, and shadcn/ui components.

**Migration Context**: This project was migrated from a Vite-based React app to resolve CSS maintenance issues (1000+ lines of CSS hacks with `!important` overrides). See MIGRATION.md for complete migration details.

## Commands

### Development
```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm start            # Run production build locally
npm run lint         # Run ESLint
```

### Deployment (Vercel)
```bash
vercel               # Deploy to preview
vercel --prod        # Deploy to production
vercel env add       # Add environment variable
vercel env ls        # List environment variables
```

### Cleanup & Debugging
```bash
rm -rf .next         # Clear Next.js cache
rm -rf node_modules  # Clear dependencies
npm install          # Reinstall dependencies
npx tsc --noEmit     # Check TypeScript types
```

### Environment Setup
Create `.env.local` with:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://mpxwemjesayzedsuroem.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important**: Never commit `.env.local` to Git. Restart dev server after changing environment variables.

## Architecture

### Next.js App Router Structure

**File-based routing** - No manual route configuration needed:
- `src/app/page.tsx` → Home page (/)
- `src/app/guest/[code]/page.tsx` → Guest info form (/guest/:code)
- `src/app/admin-guests/page.tsx` → Guest admin panel
- `src/app/admin-wedding-2026-reports/page.tsx` → Admin reports
- `src/app/not-found.tsx` → 404 page
- `src/app/auth/callback/route.ts` → OAuth callback API route

### Client vs Server Components

**Default is Server Component**. Use `'use client'` directive when:
- Using React hooks (useState, useEffect, etc.)
- Using event handlers (onClick, onChange, etc.)
- Using browser APIs (window, localStorage, etc.)
- Using client-only libraries (React Query, form libraries)

**Example client component**:
```tsx
'use client'

import { useState } from 'react'

export default function MyComponent() {
  const [state, setState] = useState()
  // ...
}
```

**Server components** (default - no directive needed) are used for static pages and layouts.

### Dynamic Routes

**Next.js 15+ requires awaiting params**:
```tsx
// src/app/guest/[code]/page.tsx
type PageProps = {
  params: Promise<{ code: string }>
}

export default async function GuestInfoPage({ params }: PageProps) {
  const { code } = await params  // Must await in Next.js 15+
  // Use code here
}
```

### Supabase Integration

Uses `@supabase/ssr` for SSR-compatible authentication:
- **Client**: `src/lib/supabase/client.ts` - Browser client using `createBrowserClient`
- **Server**: `src/app/auth/callback/route.ts` - Server client using `createServerClient` with cookie management
- **Types**: `src/lib/supabase/types.ts` - TypeScript database schema

OAuth flow:
1. User authenticates → Supabase redirects to `/auth/callback?code=...`
2. Callback route exchanges code for session via cookies
3. Redirects to home or specified `next` parameter

### State Management

**React Query** (TanStack Query) is configured via `src/components/providers/QueryProvider.tsx`:
- Wrapped in root layout (`src/app/layout.tsx`)
- Client component that provides QueryClient to app
- Used for server state management and data fetching

### UI Components

**shadcn/ui components** in `src/components/ui/`:
- 45+ pre-built components (Button, Card, Dialog, Form, etc.)
- Styled with Tailwind CSS
- All components are customizable

**Page sections** in `src/components/sections/`:
- Navigation, HeroSection, WelcomeSection, EventSchedule, etc.
- Modular sections composing the landing page

### CSS Architecture (Tailwind v4)

**Configuration is CSS-first** in `src/app/globals.css`:

```css
@import "tailwindcss";

:root {
  /* CSS custom properties for colors */
  --background: 253 251 247;
  --primary: 14 165 233;
  /* ... */
}

@theme inline {
  /* Tailwind theme defined in CSS */
  --color-federal-blue: #03045E;
  --font-family-poppins: 'Poppins', sans-serif;
  --animate-wave: wave 2s ease-in-out infinite;

  @keyframes wave { /* ... */ }
}
```

**Key CSS features**:
- Single `:root` declaration (no conflicts)
- Wedding color palette: federal-blue, ocean-blue, sky-blue, soft-white
- Custom animations: wave, float, sparkle, fade-in-up
- Clean autofill styling (NO `!important` usage)

**Font loading** via `next/font/google` in `src/app/layout.tsx`:
- Poppins (weights: 300, 400, 500, 600, 700)
- Dancing Script (weights: 400, 500, 600, 700)
- Inter (weights: 300, 400, 500, 600)
- Loaded as CSS variables: `var(--font-poppins)`, `var(--font-dancing)`, `var(--font-inter)`

Use utility classes:
```tsx
<h1 className="font-dancing">Wedding Title</h1>
<p className="font-poppins">Body text</p>
```

### TypeScript Configuration

Path aliases configured in `tsconfig.json`:
```tsx
import Component from '@/components/ui/button'  // Resolves to src/components/ui/button
```

## Common Development Tasks

### Adding a New Static Page

1. Create file: `src/app/your-route/page.tsx`
```tsx
export default function YourPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-poppins">Your Page</h1>
    </div>
  )
}
```

2. Optionally add metadata:
```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Your Page Title',
  description: 'Page description',
}
```

### Adding a Dynamic Route

1. Create file: `src/app/your-route/[param]/page.tsx`
```tsx
type PageProps = {
  params: Promise<{ param: string }>
}

export default async function YourPage({ params }: PageProps) {
  const { param } = await params

  return (
    <div>
      <h1>Param: {param}</h1>
    </div>
  )
}
```

### Adding an API Route

1. Create file: `src/app/api/your-endpoint/route.ts`
```tsx
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  return NextResponse.json({ message: 'Hello' })
}

export async function POST(request: Request) {
  const body = await request.json()
  return NextResponse.json({ received: body })
}
```

### Adding a New Font

1. Edit `src/app/layout.tsx`:
```tsx
import { Roboto } from 'next/font/google'

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-roboto',
})

// Add to className
<html className={`${poppins.variable} ${roboto.variable} ...`}>
```

2. Add utility in `src/app/globals.css`:
```css
@layer utilities {
  .font-roboto {
    font-family: var(--font-roboto), 'Roboto', sans-serif;
  }
}
```

### Adding a Custom Color

Add to `@theme inline` in `src/app/globals.css`:
```css
@theme inline {
  --color-your-color: #123456;
}
```

Then use: `bg-your-color` or `text-your-color`

## Important Patterns

### Metadata for SEO

Define metadata in `layout.tsx` or `page.tsx`:
```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
  openGraph: { /* ... */ },
}
```

Root metadata is in `src/app/layout.tsx` with complete SEO configuration.

### Provider Architecture

Root layout wraps app with providers in this order:
1. `QueryProvider` - React Query client
2. `TooltipProvider` - shadcn/ui tooltips
3. `Toaster` components - Toast notifications

All defined in `src/app/layout.tsx`.

### Form Validation

Uses `zod` for schema validation and `react-hook-form` with `@hookform/resolvers`:
```tsx
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
})

type FormData = z.infer<typeof schema>

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema)
})
```

### Supabase Query Patterns

**Client-side query with React Query**:
```tsx
'use client'

import { supabase } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

const { data, isLoading, error } = useQuery({
  queryKey: ['guests'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
    if (error) throw error
    return data
  }
})
```

**Insert/Update with mutation**:
```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()

const mutation = useMutation({
  mutationFn: async (newGuest) => {
    const { data, error } = await supabase
      .from('guests')
      .insert([newGuest])
    if (error) throw error
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['guests'] })
  }
})
```

### Common Styling Patterns

**Available custom colors** (defined in globals.css):
- `bg-ocean-blue`, `bg-sky-blue`, `bg-navy-blue`, `bg-soft-white`
- `text-federal-blue`, `text-ocean-blue`, etc.

**Available gradients**:
- `gradient-ocean`, `gradient-sky`
- `text-ocean-gradient` (for gradient text)

**Available animations**:
- `animate-wave`, `animate-float`, `animate-sparkle`, `animate-fade-in-up`

**Responsive design**:
```tsx
<div className="text-sm md:text-base lg:text-lg">
  Responsive text
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  Responsive grid
</div>
```

## Deployment

**Platform**: Vercel (optimized for Next.js)

**Environment Variables** (required):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

**Quick Deploy**:
1. Push to GitHub
2. Import to Vercel from dashboard
3. Add environment variables
4. Deploy automatically

See DEPLOYMENT.md for detailed deployment guide.

**Domain**: chanikadavidwedding.com

**Supabase OAuth Configuration**:
- Site URL: `https://chanikadavidwedding.com`
- Redirect URLs: `https://chanikadavidwedding.com/auth/callback`

**Rollback**: Vercel keeps all previous deployments. To rollback:
1. Go to Vercel dashboard → Deployments tab
2. Find working deployment
3. Click "..." → "Promote to Production"

## Known Tailwind v4 Limitations

### Custom Color Usage in Gradients

**Issue**: Colors defined in `@theme inline` as `--color-*` are NOT automatically available to Tailwind utilities like `bg-sky-blue` or gradient classes like `from-sky-blue to-non-photo-blue`.

**Solution**: Use direct CSS in `@layer components` instead:
```css
.gradient-sky {
  background: linear-gradient(135deg, #CAF0F8 0%, #90E0EF 30%, #DBEAFE 70%, #F0F9FF 100%);
}
```

**Why**: Tailwind v4's `@theme inline` architecture doesn't expose custom colors to utility classes the same way v3 did. Inline styles or CSS gradients are more reliable.

### Browser Autofill Yellow Background

**Issue**: Chrome applies yellow background to autofilled inputs with `!important`, which cannot be overridden without also using `!important`.

**Solution**: The Input and Textarea components use inline styles + global CSS with `!important`:
```tsx
style={{
  WebkitBoxShadow: '0 0 0 1000px white inset',
  WebkitTextFillColor: 'rgb(15, 23, 42)',
  backgroundColor: 'white',
  border: '1px solid rgb(219, 234, 254)',
}}
```

**Note**: This is the ONLY acceptable use of `!important` in the project - to override browser defaults.

## Common Issues & Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Working
- Restart dev server after changing `.env.local`
- Check variable names start with `NEXT_PUBLIC_`
- Verify Vercel environment variables are set (Dashboard → Settings → Environment Variables)

### Yellow Autofill Backgrounds Appearing
- Ensure `globals.css` has autofill styles in `@layer base`
- Verify no conflicting CSS from old files
- Test in incognito mode (browser extensions can interfere)
- Check that NO `!important` declarations were added

### Dynamic Route Not Working (`/guest/[code]`)
Ensure params are awaited (Next.js 15+):
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

### Build Succeeds Locally but Fails on Vercel
- Check Node version compatibility (Vercel uses Node 20 by default)
- Verify environment variables are set in Vercel dashboard
- Ensure no hardcoded local file paths
- All dependencies should be in `package.json`, not just `devDependencies`

### CSS Not Updating in Production
```bash
# Clear Next.js cache and redeploy
rm -rf .next
npm run build
vercel --prod
```

### Supabase Connection Issues
- Verify environment variables: `echo $NEXT_PUBLIC_SUPABASE_URL`
- Check Supabase dashboard for correct credentials
- Ensure Supabase project is not paused
- Check network tab for CORS errors

## Development Notes

### CSS Maintenance
- **Avoid `!important` except for browser overrides** - Only use `!important` to override browser defaults (like autofill styling). Never use it for application styles.
- Autofill styling requires `!important` to override Chrome's built-in styles
- Tailwind v4 config is minimal - most configuration in CSS via `@theme inline`
- **Custom colors in gradients**: Use direct CSS `linear-gradient()` instead of Tailwind utilities (see Known Limitations above)

### Component Development
- Prefer Server Components by default
- Only add `'use client'` when necessary
- Keep client boundaries minimal for better performance

### Git Workflow
Current branch: `master`
- No tests configured yet
- ESLint configured for code quality

## Project History

**Migrated from Vite** (December 30, 2024):
- Eliminated 81% of CSS (1027 lines → 196 lines)
- Removed 200+ `!important` declarations
- Migrated to React 19 and Next.js 16
- Upgraded to Tailwind CSS v4

See MIGRATION.md for complete migration documentation.

## Key Package Versions

- **Framework**: Next.js 16.1.1, React 19.2.3
- **Styling**: Tailwind CSS v4, @tailwindcss/postcss v4
- **Database**: @supabase/ssr 0.8.0, @supabase/supabase-js 2.89.0
- **State**: @tanstack/react-query 5.90.15
- **Forms**: react-hook-form 7.69.0, @hookform/resolvers 5.2.2, zod 4.2.1
- **UI**: 40+ @radix-ui components, shadcn/ui components
- **Date**: date-fns 4.1.0, react-day-picker 9.13.0

## Performance Targets

Target Lighthouse scores (current production):
- **Performance**: 94+ (current: 94)
- **Accessibility**: 95+ (current: 95)
- **Best Practices**: 100 (current: 100)
- **SEO**: 100 (current: 100)

Core Web Vitals targets:
- **LCP** (Largest Contentful Paint): < 2.5s (current: 1.9s)
- **FID** (First Input Delay): < 100ms (current: 35ms)
- **CLS** (Cumulative Layout Shift): < 0.1 (current: 0.02)

## Additional Documentation

- **DEPLOYMENT.md** - Complete deployment guide for Vercel
- **MIGRATION.md** - Detailed Vite to Next.js migration documentation
- **QUICK_REFERENCE.md** - Quick lookup for common tasks and patterns
- **TECHNICAL_COMPARISON.md** - Technical comparison of Vite vs Next.js implementation

## Support Resources

- Next.js Documentation: https://nextjs.org/docs
- Tailwind CSS v4: https://tailwindcss.com/docs
- Supabase Documentation: https://supabase.com/docs
- React Query (TanStack): https://tanstack.com/query/latest
- shadcn/ui: https://ui.shadcn.com
