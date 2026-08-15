# OAuth Callback Configuration

## Supabase Dashboard Configuration Required

To complete the OAuth setup, configure these URLs in Supabase Dashboard:

### 1. Go to URL Configuration
https://supabase.com/dashboard/project/vjtwzpnmsdtwmqlsoyos/auth/url-configuration

### 2. Set Site URL
**For local development:**
```
http://localhost:3000
```

**For production:**
```
https://assessment-intelligence.vercel.app
```

> Switch this based on what environment you're testing. For both to work simultaneously, you'll test locally with local Site URL, then change it to production URL when deploying.

### 3. Add Redirect URLs (Wildcard Pattern)
Add both of these to the "Redirect URLs" list:
```
http://localhost:3000/**
https://assessment-intelligence.vercel.app/**
```

The `**` wildcard allows any path including `/auth/callback`.

### 4. Google Cloud Console - OAuth Redirect URIs
Ensure these are also added in Google Cloud Console (APIs & Services → Credentials → OAuth 2.0 Client ID):
```
https://vjtwzpnmsdtwmqlsoyos.supabase.co/auth/v1/callback
```

## Code Changes Made
Updated `src/app/login/page.tsx` to use explicit redirect URLs:
- Local: `http://localhost:3000/auth/callback`
- Production: `https://assessment-intelligence.vercel.app/auth/callback`

This ensures the callback route is correctly targeted regardless of Supabase Site URL configuration.

## Testing
1. **Local:** Sign in at http://localhost:3000/login
   - Should redirect to `/auth/callback` after Google OAuth
   - Then redirect to `/` with active session

2. **Production:** Sign in at https://assessment-intelligence.vercel.app/login
   - Same flow as local

If callback goes to `/` instead of `/auth/callback`, verify:
- Supabase Redirect URLs include the wildcard patterns above
- Google Cloud OAuth redirect URI is correct
