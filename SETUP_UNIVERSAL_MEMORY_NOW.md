# Setup Universal Memory - Step-by-Step

Your setup script is ready. Here's how to complete it:

## Step 1: Get Your Supabase Credentials (2 minutes)

Go to: **https://app.supabase.com**

1. Log in to your account
2. Click on your project (or create one if you don't have one)
3. Go to **Settings** → **API**

Copy these three values:
- **Project URL** (looks like: `https://abc123xyz.supabase.co`)
- **Anon Public Key** (long string starting with `eyJ`)
- **Service Role Key** (optional, but recommended)

Keep these visible - you'll paste them into the setup script.

## Step 2: Run the Setup Script

Open Terminal and run:

```bash
cd /Users/bradygeorgen/Dev/openrouter-crew-platform
bash scripts/system/setup-universal-memory.sh
```

The script will:
1. Detect that your .env.local has placeholder credentials
2. Ask you to enter your real Supabase credentials
3. Ask for your OpenRouter API key (optional, for testing)
4. Create `.env.local` files in all dashboard directories
5. Test the connection (or tell you it's OK to continue anyway)

## Step 3: Follow the Prompts

When the script asks:

```
Supabase URL (https://...supabase.co):
```

Paste: `https://abc123xyz.supabase.co`

```
Supabase Anon Key:
```

Paste: `eyJ...` (the long anon key)

```
Supabase Service Role Key (optional):
```

Paste: The service role key (you can press Enter to skip)

```
OpenRouter API Key (optional for local testing):
```

Paste: Your OpenRouter key OR press Enter to skip

## Step 4: Verify Setup Complete

After the script finishes, you should see:

```
✅ Universal Memory Setup Complete!
```

Followed by next steps.

## Step 5: Start the Platform

```bash
# Build
pnpm build

# Start with universal memory
pnpm dev:universal
```

This opens:
- All 4 dashboards (localhost:3000-3004)
- VSCode extension (debug mode F5)
- All connected to **your shared Supabase**

## ✅ You're Done!

Once `pnpm dev:universal` is running, you have:

- ✅ All dashboards connected to shared Supabase
- ✅ VSCode extension ready to create memories
- ✅ Organizational knowledge graph unified
- ✅ Development insights automatically shared

### Test It Works

1. Open http://localhost:3000 (Unified Dashboard)
2. Open VSCode, press F5 to debug extension
3. In VSCode: Command Palette → "Create Memory"
4. Type: "Testing universal memory setup"
5. Check: Memory appears in dashboard

---

## 🆘 If Something Goes Wrong

### "Invalid Supabase URL format"
- Make sure URL is: `https://your-project.supabase.co`
- Not: `https://your-project.supabase.com` (wrong domain)
- Not: `your-project.supabase.co` (missing https://)

### "Connection timeout / couldn't reach Supabase"
- Check your network/VPN
- The script will continue anyway
- Connection will be tested when you run the dashboards

### "Credentials not working in dashboard"
- Double-check you copied the right keys from Supabase
- Go to Supabase → Settings → API again
- Copy fresh and try again

### "pnpm command not found"
- Install pnpm: `npm install -g pnpm`
- Or: `brew install pnpm` (on Mac)

---

## 📝 Summary

```bash
# Terminal 1: Run setup
bash scripts/system/setup-universal-memory.sh
# → Paste Supabase URL + Keys when prompted

# Terminal 2: Build & Start
pnpm build
pnpm dev:universal

# Browser: See all dashboards
# VSCode: F5 to debug extension
# Create memory: See it in dashboard immediately
```

That's it! Your entire team can now share development context across all tiers.

