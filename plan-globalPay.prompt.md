# Plan: GlobalPay AI Tool Allocation & Prompting Strategy

## TL;DR

GlobalPay is a P2P money transfer platform with 8 core components. Recommended approach:
- **Lovable** for frontend UI/UX (dashboard, forms, real-time updates) — lowest friction for visual design
- **Copilot** for backend APIs & Supabase connections — integrations, database schemas, business logic
- **Bolt** as a fallback for complex frontend features if Lovable hits constraints
- **Claude (on copilot-instructions)** for ML fraud detection & matching algorithm logic — requires reasoning

---

## AI Tool Allocation by Component

### Frontend Layer (→ Lovable)
**Components:** Dashboard, Auth UI, KYC Forms, Payment Forms, Transaction History, Real-time Exchange Rates Display

**Why Lovable:**
- Excels at interactive UIs with real-time updates
- Built-in design system → faster polish
- Strong TypeScript/React generation
- Easier to iterate on layout/UX

### Backend APIs & Database Layer (→ Copilot)
**Components:** REST APIs, Supabase schemas, Auth service, Payment Processing, P2P Matching Engine interface

**Why Copilot:**
- SQL/TypeScript integration-focused
- Supabase-specific expertise (migrations, RLS, auth)
- Integrates well with your preferred stack
- Excellent for business logic and connections

### Complex Logic Layer (→ Copilot OR Claude via .instructions)
**Components:** P2P Matching Engine, ML Fraud Detection pre-processing, Exchange rate calculations

**Why Split:**
- Matching engine: Copilot handles the query/ranking logic
- ML fraud prep: Claude (via .instructions.md) handles algorithm reasoning

---

## Confirmed Decisions ✓

1. **Blockchain/Escrow:** Deferred to Phase 2 → Phase 1 uses simple transaction status flow (pending → completed)
2. **Exchange Rates:** Free API (`exchangerate-api.com`) → no hardcoding, backend fetches live rates
3. **Frontend Host:** Vercel → integrates seamlessly with Lovable output
4. **KYC Verification:** Instant approval → form upload stored directly, no manual review needed
5. **Supabase Tier:** Free tier → optimize for query efficiency, avoid heavy indexing

---

## Simplified Phase 1 Transaction Flow (No Escrow)

```
User A sends $100 USD→INR
    ↓
Match with User B (wants INR→USD)
    ↓ 
Both confirm + complete immediately
    ↓
Balances update in db
    ↓
Transaction marked "completed"
```
*(Escrow comes in Phase 2 when blockchain is added)*

---

## ✅ Ready-to-Use Prompts (Phase 1 Optimized)

### PROMPT 1️⃣ — Supabase Schema (→ Copilot)
```
Design Supabase database schema for GlobalPay MVP (free tier optimized).

Tables needed:
1. users (id, email, password_hash, phone, kyc_verified, created_at)
2. wallets (user_id, currency, balance, last_updated)
3. transactions (id, sender_id, receiver_id, amount_sent, amount_received, from_currency, to_currency, exchange_rate_used, status, created_at)
4. matches (match_id, user_a_id, user_b_id, match_score, currency_pair, matched_at, expires_at)

Requirements:
- Foreign key constraints on all relationships
- Row-level security: users can only query their own data
- Timestamps with auto-defaults
- Transaction status enum: pending, completed, cancelled
- Basic indexes on: user_id, sender_id, receiver_id (avoid over-indexing for free tier)

Generate SQL migration for Supabase. No blockchain fields yet—keep it simple.
```

### PROMPT 2️⃣ — REST API Endpoints (→ Copilot)
```
Build Node.js + Express REST API for GlobalPay with Supabase integration.

Endpoints needed:
- POST /auth/signup (email, password, phone) → create user + empty wallets for USD/EUR/INR/GBP
- POST /auth/login (email, password) → return JWT token
- POST /kyc/verify (user_id, form_data) → mark kyc_verified=true instantly (no manual review)
- GET /wallet/:currency (JWT auth) → return {currency, balance}
- POST /wallet/deposit (currency, amount) → add to balance (mock for MVP)
- GET /exchange-rates (from_currency, to_currency) → fetch from exchangerate-api.com, cache 5 minutes
- POST /match/find (from_currency, to_currency, amount) → find P2P matches from users table
- POST /transactions/create (receiver_id, amount_send, from_currency, to_currency) → create transaction + update balances
- GET /transactions (JWT auth) → return user's transaction history (paginated, limit 20)

Requirements:
- JWT token valid for 7 days
- Zod for input validation
- Error handling: return proper HTTP status codes (400, 401, 404, 500)
- All database queries via Supabase client
- Environment variables: SUPABASE_URL, SUPABASE_KEY, JWT_SECRET

Keep it simple for MVP.
```

### PROMPT 3️⃣ — Frontend Dashboard (→ Lovable)
```
Create a responsive React dashboard for GlobalPay with these pages:

1. Authentication (login/signup with email, password, phone)
2. KYC Form (name, ID type dropdown, file upload for ID image)
3. Wallet Dashboard (show balances in USD, EUR, INR, GBP with "Add Funds" button)
4. Send Money (from_currency dropdown, to_currency dropdown, amount input → shows live exchange rate)
5. Transaction History (list all past transactions with date, amount, status, filter by currency)
6. Match Status (when transaction pending, show "Waiting for match..." or matched user info)

Requirements:
- TypeScript + React 18+
- Tailwind CSS for styling
- React Router for navigation (login → dashboard → send money → history)
- Zustand for state management (user profile, wallets, transactions)
- Fetch exchange rates every 60 seconds from /exchange-rates endpoint
- Show loading spinners & error messages
- Mobile-responsive (test on phone)
- Vercel-ready

Design: Clean, professional. Use lucide-react for icons. Color scheme: blue/white/green.
```

### PROMPT 4️⃣ — P2P Matching Engine (→ Copilot)
```
Implement P2P matching algorithm:

Logic:
- User A: sends USD 100 → receives INR
- Find: users who send INR → receive USD, amount 5000-6500 INR (±10% of $100)

Matching criteria (scored):
1. Currency pair exact match (required)
2. Amount proximity ±10% (score 100 if exact, 50 if within 10%)
3. Both users KYC verified (required)
4. User success rate: prefer >80% completed / total transactions
5. Neither has pending transaction in same currency pair

Return top 3 matches sorted by score. Store in matches table with 30-min expiry.

Endpoint: POST /match/find
Input: {from_currency, to_currency, amount}
Output: [{match_id, user_id, match_score, their_amount}, ...]

Optimize for free tier: use simple SQL, avoid heavy joins.
```

### PROMPT 5️⃣ — Real-Time Transaction Flow (→ Lovable)
```
Add real-time transaction flow to GlobalPay dashboard:

Flow:
1. User fills "Send Money" form → clicks "Find Match"
2. Frontend calls POST /transactions/create
3. Backend creates transaction (status: "pending") + auto-matches if possible
4. Frontend polls GET /transactions/:id every 2 seconds
5. When status → "completed", show success modal + refresh wallet balances
6. If no match in 30 sec, show "No matches available"

Requirements:
- Add "Transaction Pending" modal with cancel button
- Refresh wallet balances after each transaction
- Show transaction in history immediately with "pending" badge
- Use React hooks for polling (useEffect + setInterval with cleanup)
- Disable "Send Money" button if balance < amount
- Show error messages clearly
```

---

## Execution Checklist (Phase 1)

**Week 1: Foundation**
- [ ] Create Supabase project (free tier)
- [ ] Use PROMPT 1️⃣ → Run in Copilot → create schema in Supabase dashboard
- [ ] Use PROMPT 2️⃣ → Run in Copilot → build API locally
- [ ] Use PROMPT 3️⃣ → Run in Lovable → generate frontend scaffold

**Week 1-2: Integration**
- [ ] Connect frontend to backend endpoints (auth, wallet, transactions)
- [ ] Use PROMPT 4️⃣ → Run in Copilot → add matching engine to API
- [ ] Test signup → login → see wallet balances

**Week 2-3: End-to-End**
- [ ] Use PROMPT 5️⃣ → Run in Lovable → add real-time transaction UI
- [ ] Create 2-3 test users, test send/receive flow
- [ ] Deploy frontend to Vercel
- [ ] Deploy API backend (Vercel, Railway, or Render)

**Week 3: Polish & Manual Testing**
- [ ] Test on mobile (iPhone + Android chrome)
- [ ] Test error scenarios (insufficient balance, no matches, network errors)
- [ ] Clean up console errors & warnings
- [ ] Get feedback from friends/classmates

---

## Critical Notes for Each AI Tool

**Copilot Tips:**
- Show SQL output for verification before implementing
- Ask for `.env.example` file in each prompt
- Request migration rollback strategy

**Lovable Tips:**
- Export as GitHub repo → clone locally
- Ask to add Prettier/ESLint config
- Request "dark mode toggle" if you want it (easy add later)

**When Things Don't Work:**
- If Lovable output has styling issues → use Bolt instead (full-stack override)
- If API is slow → Copilot can optimize SQL queries
- If matching doesn't work as expected → ask Copilot to debug with test data

---

## Phase 2 (After Submission)

Not included in this plan but for reference:
- Blockchain escrow (Polygon, smart contracts)
- ML fraud detection (Python service + Copilot integration)
- Admin dashboard (review KYC uploads, dispute resolution)
- Push notifications (transaction updates)
