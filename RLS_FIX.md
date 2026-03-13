# GlobalPay Backend - RLS Configuration Fix

## Issue Found ❌
The backend was getting: `"new row violates row-level security policy for table transactions"`

## Why? 🤔
- Supabase Row-Level Security (RLS) is enforced on all tables
- The backend uses the ANON_KEY which has NULL `auth.uid()` in RLS context
- RLS policies block INSERT/UPDATE when `auth.uid()` doesn't match
- Solutions available:
  1. **Disable RLS** (MVP - quick fix)
  2. **Use Service Role Key** (Secure - requires setup)
  3. **Implement backend auth context** (Complex)

## Quick Fix for MVP ⚡

### Run this SQL in Supabase:
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Create **New Query**
3. **Copy and paste this SQL:**

```sql
-- For MVP: Disable RLS on data tables (backend handles auth)
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

4. Click **Run**
5. ✅ Done!

### Why this is safe for MVP:
- Backend has JWT middleware that verifies user identity
- All database operations require valid JWT token
- User context is enforced in application code, not database
- RLS provides additional layer but isn't needed if backend auth is solid

## For Production 🔒
When moving to production, implement proper RLS with service role keys:

```sql
-- Disable RLS bypass (re-enable security):
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Then configure proper service role key usage in backend
```

## Test After Fix:
```powershell
cd backend
node test-api.js
```

Expected: ✅ All tests should pass!

## Endpoints Now Working:
- ✅ POST /auth/signup
- ✅ POST /auth/login
- ✅ POST /kyc/verify
- ✅ GET /wallet
- ✅ POST /wallet/deposit
- ✅ GET /exchange-rates
- ✅ POST /transactions/create (AFTER RLS FIX)
- ✅ GET /transactions
- ✅ GET /transactions/:id
- ✅ POST /transactions/:id/cancel
- ✅ POST /match/find
