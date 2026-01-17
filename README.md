# Chanika & David Wedding Website

A modern wedding website built with Next.js 16, React 19, and Tailwind CSS v4, featuring a beautiful ocean-inspired blue color palette.

**Live Site**: [chanikadavidwedding.com](https://chanikadavidwedding.com)
**Event**: January 31, 2026 at COMO Point Yamu, Phuket, Thailand

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
# Visit http://localhost:3000
```

---

## Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[docs/CLAUDE.md](./docs/CLAUDE.md)** - Complete developer guide for working with this codebase
  - Project overview and architecture
  - Development commands and workflows
  - Common patterns and best practices

- **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Quick deployment reference
  - 3-step deployment to Vercel
  - Environment variable setup
  - Custom domain configuration

- **[docs/MIGRATION.md](./docs/MIGRATION.md)** - Complete migration guide from Vite to Next.js
  - Why we migrated (CSS issues, 1000+ lines of problematic CSS)
  - Architecture changes (Vite → Next.js, Tailwind v3 → v4)
  - Testing checklist and troubleshooting

- **[docs/TECHNICAL_COMPARISON.md](./docs/TECHNICAL_COMPARISON.md)** - Detailed technical analysis
  - Before/after code comparison
  - CSS architecture deep dive
  - Performance metrics

- **[docs/QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md)** - Developer quick reference
  - Common commands and patterns
  - Supabase integration examples

- **[docs/GAMES_SETUP_GUIDE.md](./docs/GAMES_SETUP_GUIDE.md)** - Wedding games feature documentation
  - Game stations setup
  - Photo upload system
  - Quiz functionality

---

## Tech Stack

- **Framework**: [Next.js 16.1.1](https://nextjs.org) with App Router
- **React**: 19.2.3 (latest)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com)
- **Database**: [Supabase](https://supabase.com) with SSR support
- **Forms**: React Hook Form + Zod validation
- **UI Components**: [shadcn/ui](https://ui.shadcn.com) with Radix UI primitives
- **State Management**: TanStack React Query
- **Deployment**: [Vercel](https://vercel.com)

---

## Project Structure

```
wedding/
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── layout.tsx                  # Root layout (fonts, metadata, providers)
│   │   ├── page.tsx                    # Home page
│   │   ├── globals.css                 # Main stylesheet (196 lines)
│   │   ├── not-found.tsx               # 404 page
│   │   ├── games/                      # Wedding games hub
│   │   ├── quiz/                       # Final quiz
│   │   ├── leaderboard/                # Game leaderboard
│   │   ├── guest/[code]/               # Guest info (dynamic route)
│   │   ├── admin-guests/               # Guest admin panel
│   │   ├── admin-games/                # Games admin panel
│   │   └── auth/callback/              # OAuth callback handler
│   ├── components/
│   │   ├── providers/                  # React context providers
│   │   ├── sections/                   # Page sections (Hero, Welcome, etc.)
│   │   ├── games/                      # Game components
│   │   └── ui/                         # Reusable UI components (shadcn/ui)
│   ├── lib/
│   │   ├── supabase/                   # Supabase client & types
│   │   └── utils/                      # Utility functions
│   └── hooks/                          # Custom React hooks
├── public/                             # Static assets
│   ├── games/                          # Game icons and images
│   └── ...
├── docs/                               # Documentation
│   ├── CLAUDE.md                       # Developer guide
│   ├── DEPLOYMENT.md                   # Deployment instructions
│   ├── MIGRATION.md                    # Migration guide
│   ├── GAMES_SETUP_GUIDE.md            # Games documentation
│   └── ...
├── scripts/                            # SQL migrations and scripts
│   ├── supabase_games_migration.sql
│   ├── dev_mode_rls_policies.sql
│   └── ...
└── data/                               # Data files
    └── wedding_seating_chart.csv
```

---

## Key Features

### Clean CSS Architecture
- **196 lines** of well-organized CSS (down from 1,027 in Vite version)
- **Zero !important** usage (eliminated 200+ instances)
- **Tailwind v4** with CSS-first configuration via `@theme inline`
- Clean autofill styling without browser hacks

### Optimized Font Loading
- Self-hosted fonts via `next/font/google`
- Zero external requests (no Google Fonts CDN)
- Automatic font subsetting and optimization
- Zero layout shift with `font-display: swap`

### Modern Architecture
- File-based routing with Next.js App Router
- Server and Client Components for optimal performance
- TypeScript-first with full type safety
- SSR/SSG capabilities for better SEO

### Beautiful Design
- Ocean-inspired blue color palette
- Custom animations (wave, float, sparkle)
- Responsive design (mobile, tablet, desktop)
- Accessible UI components

---

## Available Scripts

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint

# Deployment
vercel               # Deploy to Vercel preview
vercel --prod        # Deploy to production
```

---

## Environment Variables

Required environment variables:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete setup instructions.

---

## Color Palette

Custom ocean-inspired colors defined in `globals.css`:

- **Federal Blue**: `#03045E` - Deep navy
- **Honolulu Blue**: `#0077B6` - Ocean blue
- **Pacific Cyan**: `#00B4D8` - Bright cyan
- **Non-Photo Blue**: `#90E0EF` - Light blue
- **Light Cyan**: `#CAF0F8` - Very light blue
- **Soft White**: `#FDFBF7` - Off-white background

Usage:
```tsx
<div className="bg-ocean-blue text-soft-white">
  Ocean Blue Background
</div>
```

---

## Typography

Three Google Fonts loaded via `next/font/google`:

- **Poppins** (300, 400, 500, 600, 700) - Primary font
- **Dancing Script** (400, 500, 600, 700) - Script font for headings
- **Inter** (300, 400, 500, 600) - Body text font

Usage:
```tsx
<h1 className="font-dancing">Elegant Script</h1>
<p className="font-poppins">Modern Sans-Serif</p>
<span className="font-inter">Clean Body Text</span>
```

---

## Deployment

### GitHub Repository
```bash
# Add remote repository
git remote add origin https://github.com/david2928/wedding.git

# Push to GitHub
git push -u origin master
```

### Deploy to Vercel

This project is optimized for deployment on Vercel:

1. **Push to GitHub** (see above)
2. **Import to Vercel**: [vercel.com/new](https://vercel.com/new)
3. **Add environment variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy**

For detailed instructions, see [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

---

## Migration from Vite

This project was migrated from a Vite-based SPA to Next.js 16. Key improvements:

- **81% CSS reduction**: From 1,027 lines to 196 lines
- **Performance**: 32% faster LCP, 75% better CLS
- **Maintainability**: Eliminated all `!important` usage
- **Modern stack**: React 19, Tailwind v4, Next.js 16

For complete migration details, see [docs/MIGRATION.md](./docs/MIGRATION.md).

---

## Contributing

This is a private wedding website project. For any issues or questions, please contact the repository owner.

---

## License

Private - All Rights Reserved

---

## Credits

**Built by**: David Geieregger
**For**: Chanika & David's Wedding - January 31, 2026
**Framework**: [Next.js](https://nextjs.org) by Vercel
**UI Components**: [shadcn/ui](https://ui.shadcn.com)
**Database**: [Supabase](https://supabase.com)
**Deployment**: [Vercel](https://vercel.com)

---

**Last Updated**: January 17, 2025
