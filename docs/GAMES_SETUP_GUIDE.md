# Wedding Games - Setup Guide

This guide walks you through setting up the wedding gamification system.

## Overview

The wedding games feature adds interactive gamification to your wedding website:
- **6 games** for guests to complete (4 active + 2 placeholders)
- **Photo upload** for sunset game
- **QR code scanning** for quick completion
- **Final quiz** about the couple (unlocked after completing all active games)
- **Leaderboard** with rankings and prizes

---

## Step 1: Database Setup

### Run the Migration Script

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Copy the contents of `supabase_games_migration.sql`
3. Paste into the SQL Editor
4. Click **Run** to execute

This creates:
- `game_stations` table
- `game_completions` table
- `quiz_questions` table
- `quiz_submissions` table
- RLS policies
- Leaderboard view
- Seed data

### Create Storage Bucket

1. Go to **Storage** in Supabase Dashboard
2. Click **New Bucket**
3. Configure:
   - Name: `sunset-photos`
   - Public: **NO** (private bucket)
   - File size limit: `10485760` (10 MB)
   - Allowed MIME types: `image/jpeg,image/png,image/webp`
4. Click **Create bucket**

The SQL migration already includes the storage policies.

---

## Step 2: Customize Quiz Questions

The migration seeds 10 placeholder quiz questions. **You should update these!**

### Edit Questions in Supabase

1. Go to **Table Editor** > `quiz_questions`
2. Edit each question row:
   - Update `question` text
   - Update `option_a`, `option_b`, `option_c`, `option_d`
   - Set the correct answer (`A`, `B`, `C`, or `D`)
   - Adjust `points` if needed (default: 10)
3. Click **Save**

### Example Questions

```
Q: Where did David and Chanika first meet?
A: At a coffee shop
B: Through mutual friends ✓
C: At work
D: On a dating app

Q: What is David's favorite hobby?
A: Golf ✓
B: Cooking
C: Photography
D: Hiking
```

---

## Step 3: Generate QR Codes

### For Each Game Station

You need to generate QR codes for guests to scan at each station.

#### QR Code URLs

- **Golf**: `https://chanikadavidwedding.com/games/complete/golf`
- **Portrait**: `https://chanikadavidwedding.com/games/complete/portrait`
- **Audio**: `https://chanikadavidwedding.com/games/complete/audio`
- **Sunset**: Guests navigate to `/games` and click the card (no QR needed)

#### Generate QR Codes

Option 1 - **Online Generator** (Easiest):
1. Go to https://qrcode.com or https://www.qr-code-generator.com
2. Paste each URL above
3. Download as PNG or SVG
4. Print and place at each station

Option 2 - **Admin Panel**:
1. Go to `/admin-games`
2. Login with password: `wedding2026`
3. Click **QR Codes** tab
4. URLs are displayed (copy to generate)
5. Click **Print QR Codes** for printable sheet

---

## Step 4: Test the Flow

### Test as a Guest

1. **Sign in**: Visit `/games` and sign in with Google
2. **Complete games**:
   - Click a game card (golf, portrait, audio)
   - Or scan a QR code with your phone
   - Verify it marks as complete
3. **Upload photo**: Complete the sunset game by uploading an image
4. **Take quiz**: Once 4/6 games are complete, quiz unlocks
5. **View leaderboard**: Check your ranking at `/leaderboard`

### Test Admin Panel

1. Visit `/admin-games`
2. Password: `wedding2026` (⚠️ **Change this in production!**)
3. Verify stats display correctly
4. Check quiz submissions table

---

## Step 5: Deployment Checklist

### Before Going Live

- [ ] Update all quiz questions with real questions about you and Chanika
- [ ] Change admin password in `src/app/admin-games/page.tsx` (line 32)
- [ ] Generate and print QR codes for all stations
- [ ] Create station signage explaining each game
- [ ] Test photo upload (sunset game) on mobile
- [ ] Test QR scanning on multiple phones
- [ ] Verify leaderboard updates correctly
- [ ] Check all games complete → quiz unlocks

### On Wedding Day

- [ ] Place QR codes at each station
- [ ] Assign staff to verify game completions (if needed)
- [ ] Monitor admin panel for participation
- [ ] Display leaderboard on a screen (optional)

---

## Pages Reference

| URL | Purpose | Auth Required |
|-----|---------|---------------|
| `/games` | Main games hub | Yes |
| `/games/complete/[stationId]` | QR scan completion | Yes |
| `/games/sunset` | Photo upload | Yes |
| `/quiz` | Final trivia quiz | Yes |
| `/leaderboard` | Public rankings | No |
| `/admin-games` | Admin panel | Password |

---

## Configuration

### Admin Password

**Default**: `wedding2026`

**To change**:
1. Edit `src/app/admin-games/page.tsx`
2. Find line ~32: `if (password === 'wedding2026')`
3. Change to your desired password
4. Redeploy

**Better approach** (environment variable):
```typescript
// In src/app/admin-games/page.tsx
if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
  setIsAuthenticated(true)
}
```

Then add to `.env.local` and Vercel:
```
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_password_here
```

### Game Placeholders

Two games are set as "Coming Soon":
- `placeholder5`
- `placeholder6`

**To activate**:
1. In Supabase, edit `game_stations` table
2. Update rows for `placeholder5` and `placeholder6`:
   - Change `name` and `description`
   - Change `icon` (lucide-react icon name)
   - Set `is_active = TRUE`
3. Changes appear immediately

---

## Troubleshooting

### QR Code Not Working
- Verify URL is exactly: `https://chanikadavidwedding.com/games/complete/[station-id]`
- Check station is active in `game_stations` table
- Ensure user is signed in with Google

### Photo Upload Fails
- Check storage bucket exists and is named `sunset-photos`
- Verify RLS policies are set (migration should handle this)
- Check file is under 10MB and correct format (JPEG/PNG/WebP)

### Quiz Won't Unlock
- Verify all **active** games are complete (not placeholders)
- Check `game_completions` table has 4 entries for the party
- Placeholders don't count toward unlock

### Leaderboard Empty
- Ensure quiz has been submitted (not just started)
- Check `quiz_submissions` table for `completed_at` timestamp
- Verify leaderboard view exists in database

---

## Technical Notes

### Database Tables

```
game_stations       - Game definitions (6 games)
game_completions    - Tracks which parties completed which games
quiz_questions      - Trivia questions (10 questions)
quiz_submissions    - Quiz attempts and scores (one per party)
```

### React Query Caching

Data is cached client-side for performance. To force refresh:
- Games hub: Navigate away and back
- Leaderboard: Click "Refresh" button (auto-refreshes every 30s)

### Mobile First

All pages are optimized for mobile (QR scanning use case):
- Large tap targets
- Full-width cards
- Responsive grids
- Touch-friendly buttons

---

## Support

If you encounter issues:
1. Check Supabase logs for errors
2. Check browser console for client errors
3. Verify all migration steps completed
4. Test with incognito mode (clear cookies)

---

**Setup Date**: December 30, 2024
**Wedding Date**: January 31, 2026
**Venue**: COMO Point Yamu, Phuket, Thailand

Good luck and have fun! 🎉
