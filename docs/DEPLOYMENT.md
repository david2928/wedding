# Quick Deployment Guide - Wedding Website

This is a streamlined deployment guide for the Chanika & David wedding website. For complete migration details, see [MIGRATION.md](./MIGRATION.md).

---

## Prerequisites

- [ ] Vercel account ([sign up free](https://vercel.com/signup))
- [ ] GitHub repository with your code
- [ ] Supabase credentials:
  - URL: `https://mpxwemjesayzedsuroem.supabase.co`
  - Anon Key: (from your Supabase dashboard)

---

## Quick Deploy (3 Steps)

### Step 1: Push to GitHub

```bash
cd C:\vs_code\chanika-david-wedding-nextjs

# First time setup
git init
git add .
git commit -m "Initial commit - Next.js wedding website"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/wedding-nextjs.git
git push -u origin main
```

### Step 2: Deploy to Vercel

#### Option A: Vercel Dashboard (Recommended)

1. Visit [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your GitHub repo
4. **Add Environment Variables**:
   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: https://mpxwemjesayzedsuroem.supabase.co

   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: [paste your anon key here]
   ```
5. Click "Deploy"
6. Wait 2-3 minutes for deployment

#### Option B: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste: https://mpxwemjesayzedsuroem.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste: your_anon_key

# Deploy to production
vercel --prod
```

### Step 3: Configure Custom Domain

1. In Vercel dashboard → Project Settings → Domains
2. Add domain: `chanikadavidwedding.com`
3. Update DNS records at your registrar:
   - **A Record**: `@` → `76.76.21.21`
   - **CNAME**: `www` → `cname.vercel-dns.com`
4. Wait for DNS propagation (5-60 minutes)

---

## Environment Variables

Create `.env.local` for local development:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://mpxwemjesayzedsuroem.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important**: Never commit `.env.local` to Git!

---

## Update Supabase OAuth (If Using Auth)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Your Project → Authentication → URL Configuration
3. Update:
   - **Site URL**: `https://chanikadavidwedding.com`
   - **Redirect URLs** (add all):
     ```
     https://chanikadavidwedding.com/auth/callback
     https://www.chanikadavidwedding.com/auth/callback
     https://your-project.vercel.app/auth/callback
     ```

---

## Replacing Old Vite Deployment

If you had the old Vite version deployed and want to replace it:

1. Deploy the new Next.js version to Vercel (steps above)
2. Test thoroughly on the Vercel preview URL
3. Point your domain DNS to the new Vercel deployment
4. Old deployment becomes inaccessible automatically
5. Delete old deployment from hosting provider

**Zero Downtime**: Vercel handles atomic deployments - no downtime during updates.

---

## Post-Deployment Checklist

- [ ] Site loads at your custom domain
- [ ] HTTPS works (automatic with Vercel)
- [ ] All pages accessible:
  - [ ] `/` (home)
  - [ ] `/admin-wedding-2026-reports`
  - [ ] `/guest/TEST123`
  - [ ] `/admin-guests`
- [ ] Fonts display correctly (Poppins, Dancing Script, Inter)
- [ ] No yellow backgrounds on inputs
- [ ] Supabase connection works
- [ ] Forms submit properly
- [ ] Mobile responsive design works

---

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
# Visit http://localhost:3000

# Build for production (test locally)
npm run build
npm start
```

---

## Common Issues

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

### Yellow Backgrounds Still Appear

- Clear browser cache
- Try incognito mode (browser extensions can interfere)
- Check `globals.css` has autofill styles

### Domain Not Working

- DNS propagation takes 5-60 minutes
- Verify DNS records are correct at your registrar
- Check Vercel domain settings

---

## Vercel Dashboard Quick Links

- **Project Dashboard**: `https://vercel.com/your-username/wedding-nextjs`
- **Deployments**: View all deployments and rollback if needed
- **Environment Variables**: Settings → Environment Variables
- **Domains**: Settings → Domains
- **Analytics**: Analytics tab (free tier includes basic analytics)

---

## Rollback (If Needed)

Vercel keeps all previous deployments:

1. Go to Deployments tab
2. Find working deployment
3. Click "..." → "Promote to Production"
4. Instant rollback complete

---

## Performance Optimization

Already optimized by Next.js:

- ✅ Automatic code splitting
- ✅ Image optimization (use `next/image`)
- ✅ Font optimization with `next/font`
- ✅ Static generation where possible
- ✅ Global CDN distribution
- ✅ Automatic caching

---

## Support

- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)

---

**Last Updated**: December 30, 2024
