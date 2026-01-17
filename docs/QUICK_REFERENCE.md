# Quick Reference - Next.js Wedding Website

Fast lookup guide for common tasks and patterns.

---

## Project Info

- **Framework**: Next.js 16.1.1 with App Router
- **React**: 19.2.3
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (SSR mode)
- **Deployment**: Vercel

---

## File Locations Cheat Sheet

```
src/
├── app/
│   ├── layout.tsx              # Root layout (fonts, metadata, providers)
│   ├── page.tsx                # Home page
│   ├── globals.css             # Main stylesheet (196 lines)
│   ├── not-found.tsx           # 404 page
│   ├── [route-name]/
│   │   └── page.tsx            # Route page
│   └── auth/callback/
│       └── route.ts            # OAuth callback API
├── components/
│   ├── providers/
│   │   └── QueryProvider.tsx  # React Query wrapper (needs 'use client')
│   ├── sections/               # Page sections (Hero, Welcome, etc.)
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Supabase browser client
│   │   └── types.ts            # Database types
│   └── utils.ts                # Utility functions
└── hooks/                      # Custom React hooks
```

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint

# Deployment
vercel                   # Deploy to Vercel preview
vercel --prod            # Deploy to production

# Environment
vercel env add           # Add environment variable
vercel env ls            # List environment variables

# Cleanup
rm -rf .next             # Clear build cache
rm -rf node_modules      # Clear dependencies
npm install              # Reinstall dependencies
```

---

## Adding New Pages/Routes

### Static Page

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

### Dynamic Page (with parameters)

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

### API Route

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

---

## Client vs Server Components

### When to use 'use client'

Add `'use client'` at the top of file when using:

- React hooks (`useState`, `useEffect`, `useContext`, etc.)
- Event handlers (`onClick`, `onChange`, etc.)
- Browser APIs (`window`, `localStorage`, `navigator`, etc.)
- Third-party libraries that need browser context

```tsx
'use client'

import { useState } from 'react'

export default function ClientComponent() {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

### Server Components (default)

No need for `'use client'` when:

- Just rendering UI
- Fetching data from database
- Using async/await for data
- No interactivity needed

```tsx
// No 'use client' needed
export default function ServerComponent() {
  return (
    <div>
      <h1>Static content</h1>
    </div>
  )
}
```

---

## Working with Fonts

### Using Built-in Fonts

```tsx
<h1 className="font-poppins text-4xl">Poppins Font</h1>
<h2 className="font-dancing text-3xl">Dancing Script</h2>
<p className="font-inter">Inter Font</p>
```

### Adding New Font

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

---

## Styling Patterns

### Custom Colors

Already defined in `globals.css`:

```tsx
<div className="bg-ocean-blue">Ocean Blue</div>
<div className="bg-sky-blue">Sky Blue</div>
<div className="bg-navy-blue">Navy Blue</div>
<div className="bg-soft-white">Soft White</div>
<div className="text-federal-blue">Federal Blue Text</div>
```

### Gradients

```tsx
<div className="gradient-ocean">Ocean gradient</div>
<div className="gradient-sky">Sky gradient</div>
<div className="text-ocean-gradient">Ocean gradient text</div>
```

### Animations

```tsx
<div className="animate-wave">Wave animation</div>
<div className="animate-float">Float animation</div>
<div className="animate-sparkle">Sparkle animation</div>
<div className="animate-fade-in-up">Fade in up</div>
```

### Responsive Design

```tsx
<div className="text-sm md:text-base lg:text-lg">
  Responsive text
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  Responsive grid
</div>
```

---

## Supabase Integration

### Client-Side Query

```tsx
'use client'

import { supabase } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

export default function DataComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ['table-name'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table_name')
        .select('*')

      if (error) throw error
      return data
    }
  })

  if (isLoading) return <div>Loading...</div>

  return <div>{JSON.stringify(data)}</div>
}
```

### Insert Data

```tsx
const handleSubmit = async (formData) => {
  const { data, error } = await supabase
    .from('table_name')
    .insert([
      { column1: formData.value1, column2: formData.value2 }
    ])

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Success:', data)
}
```

### Update Data

```tsx
const { data, error } = await supabase
  .from('table_name')
  .update({ column: 'new value' })
  .eq('id', recordId)
```

### Real-time Subscription

```tsx
'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function RealtimeComponent() {
  useEffect(() => {
    const channel = supabase
      .channel('table-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'table_name'
      }, (payload) => {
        console.log('Change received!', payload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return <div>Listening for changes...</div>
}
```

---

## React Query Patterns

### Basic Query

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'

const { data, isLoading, error } = useQuery({
  queryKey: ['unique-key'],
  queryFn: async () => {
    const response = await fetch('/api/data')
    return response.json()
  }
})
```

### Mutation (Insert/Update)

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()

const mutation = useMutation({
  mutationFn: async (newData) => {
    const { data, error } = await supabase
      .from('table')
      .insert([newData])

    if (error) throw error
    return data
  },
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['table-data'] })
  }
})

// Usage
mutation.mutate({ name: 'New Item' })
```

---

## Environment Variables

### Local Development

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Access in Code

```tsx
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Production (Vercel)

```bash
# Add via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Or via dashboard
# Settings → Environment Variables
```

---

## Form Handling with React Hook Form

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
})

type FormData = z.infer<typeof schema>

export default function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = (data: FormData) => {
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}

      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <button type="submit">Submit</button>
    </form>
  )
}
```

---

## Metadata for SEO

### Static Metadata (layout.tsx or page.tsx)

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description for SEO',
  openGraph: {
    title: 'OG Title',
    description: 'OG Description',
    images: ['/og-image.png'],
  },
}
```

### Dynamic Metadata

```tsx
type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  return {
    title: `Item ${id}`,
    description: `Details for item ${id}`,
  }
}
```

---

## Common Patterns

### Loading States

```tsx
import { Skeleton } from '@/components/ui/skeleton'

function LoadingComponent() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  )
}
```

### Error Handling

```tsx
'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### Conditional Rendering

```tsx
{isLoading ? (
  <Skeleton />
) : error ? (
  <div>Error: {error.message}</div>
) : data ? (
  <div>{data.name}</div>
) : (
  <div>No data</div>
)}
```

---

## Common Styling Issues

### Tailwind v4 Custom Colors Not Working

If custom colors defined in `@theme inline` don't work in gradients:

```css
/* ❌ Won't work in Tailwind v4 */
.my-class {
  @apply bg-gradient-to-r from-sky-blue to-ocean-blue;
}

/* ✅ Use direct CSS instead */
.my-class {
  background: linear-gradient(to right, #0EA5E9, #0284C7);
}
```

### Preventing Yellow Autofill Backgrounds

Already implemented in Input/Textarea components, but if you create custom inputs:

```tsx
<input
  style={{
    WebkitBoxShadow: '0 0 0 1000px white inset',
    WebkitTextFillColor: 'rgb(15, 23, 42)',
    backgroundColor: 'white',
  }}
/>
```

And in CSS (requires `!important`):
```css
input:-webkit-autofill {
  -webkit-box-shadow: 0 0 0 1000px white inset !important;
  -webkit-text-fill-color: rgb(15, 23, 42) !important;
  background-color: white !important;
}
```

## Debugging Tips

### Check Build Locally

```bash
npm run build
npm start
# Visit http://localhost:3000
```

### Clear Cache

```bash
rm -rf .next
npm run dev
```

### Environment Variables Not Working

```bash
# Restart dev server after changing .env.local
# Verify variable names have NEXT_PUBLIC_ prefix
# Check Vercel dashboard for production vars
```

### TypeScript Errors

```bash
# Check types
npx tsc --noEmit

# Update types
rm -rf node_modules/@types
npm install
```

### Supabase Connection Issues

```bash
# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL

# Check Supabase dashboard for correct credentials
# Ensure Supabase project is not paused
```

---

## Deployment Checklist

Before deploying:

- [ ] Build succeeds locally (`npm run build`)
- [ ] All pages load without errors (`npm start`)
- [ ] Environment variables set in `.env.local`
- [ ] `.env.local` is in `.gitignore`
- [ ] All changes committed to Git
- [ ] Pushed to GitHub
- [ ] Vercel environment variables configured
- [ ] Test deployment on Vercel preview URL
- [ ] Check mobile responsiveness
- [ ] Verify Supabase connection works

After deploying:

- [ ] Production URL loads
- [ ] All routes work
- [ ] Forms submit correctly
- [ ] Fonts display properly
- [ ] Images load
- [ ] No console errors

---

## Help Resources

- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Tailwind v4**: [tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **React Query**: [tanstack.com/query](https://tanstack.com/query/latest)
- **shadcn/ui**: [ui.shadcn.com](https://ui.shadcn.com)

---

**Last Updated**: December 30, 2024
