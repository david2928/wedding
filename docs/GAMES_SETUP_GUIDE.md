# Wedding Games - Setup Guide

This guide walks you through setting up the wedding gamification system.

## Overview

The wedding games feature adds interactive gamification to your wedding website:
- **5 active games** for guests to complete
- **Photo upload games**: Sunset, Portrait, and Selfie with C&D
- **QR code scanning** for quick completion
- **Live Quiz** - Admin-controlled synchronized quiz during dinner (wins prizes!)
- **Bonus points** - Completing all games earns +200 points for the quiz
- **Leaderboard** with rankings

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

### Create Storage Buckets

Create **three** storage buckets for photo upload games:

1. Go to **Storage** in Supabase Dashboard
2. For each bucket, click **New Bucket** and configure:

| Bucket Name | Public | File Size Limit | MIME Types |
|-------------|--------|-----------------|------------|
| `sunset-photos` | YES | 10 MB | `image/jpeg,image/png,image/webp` |
| `portrait-photos` | YES | 10 MB | `image/jpeg,image/png,image/webp` |
| `selfie-photos` | YES | 10 MB | `image/jpeg,image/png,image/webp` |

**Note**: Buckets should be public for images to display on success screens. The SQL migration includes storage policies.

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
- **Audio**: `https://chanikadavidwedding.com/games/complete/audio`
- **Sunset**: `https://chanikadavidwedding.com/games/sunset` (photo upload)
- **Portrait**: `https://chanikadavidwedding.com/games/portrait` (photo upload)
- **Selfie**: `https://chanikadavidwedding.com/games/selfie` (photo upload)

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
   - Click a game card to complete it
   - Or scan a QR code with your phone
   - Verify it marks as complete with green checkmark
3. **Upload photos**: Complete sunset, portrait, and selfie games by uploading images
4. **Earn bonus**: Complete all 5 games to earn +200 bonus points for the quiz
5. **Join quiz**: When the admin starts the live quiz during dinner, join at `/live-quiz`
6. **View leaderboard**: Check rankings at `/leaderboard`

### Test Live Quiz (Admin)

1. Visit `/admin-live-quiz`
2. Enter admin password
3. Click **Create New Session**
4. Wait for guests to join (visible in participant count)
5. Click **Start Quiz** to begin
6. For each question:
   - Question broadcasts to all guests
   - 30-second timer counts down
   - Answer auto-reveals when timer ends
   - Click **Next Question** to continue
7. Click **End Quiz** after last question

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
| `/games/complete/[stationId]` | QR scan completion (golf, audio) | Yes |
| `/games/sunset` | Sunset photo upload | Yes |
| `/games/portrait` | Portrait photo upload | Yes |
| `/games/selfie` | Selfie with C&D photo upload | Yes |
| `/live-quiz` | Live quiz (guest view) | Yes |
| `/leaderboard` | Public rankings | No |
| `/admin-games` | Games admin panel | Password |
| `/admin-live-quiz` | Live quiz admin control | Password |
| `/big-day` | Wedding day info hub | Yes |

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

### Quiz Shows "Coming Soon"
- The live quiz only opens when admin creates and starts a session
- Admin must go to `/admin-live-quiz` and click "Start Quiz"
- Quiz status must be `active` or `showing_answer` for guests to join
- `waiting` status (admin waiting room) does NOT open the quiz to guests

### Leaderboard Empty
- Ensure quiz has been submitted (not just started)
- Check `quiz_submissions` table for `completed_at` timestamp
- Verify leaderboard view exists in database

---

## Technical Notes

### Database Tables

```
game_stations           - Game definitions (5 active games)
game_completions        - Tracks which parties completed which games
quiz_questions          - Trivia questions for the live quiz
live_quiz_sessions      - Live quiz session control (status, current question)
live_quiz_participants  - Participants in each quiz session
live_quiz_answers       - Guest answers per question with timing
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
