# GlobalPay Backend - Complete Documentation & Queries

---

## Table of Contents
1. [Database Schema](#database-schema)
2. [SQL Queries](#sql-queries)
3. [API Endpoints](#api-endpoints)
4. [Authentication Flow](#authentication-flow)
5. [Error Handling](#error-handling)
6. [Environment Variables](#environment-variables)

---

## Database Schema

### 1. Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  kyc_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

**Fields:**
- `id`: Unique identifier (auto-generated UUID)
- `email`: User email (must be unique)
- `password_hash`: Bcrypt hashed password
- `phone`: Phone number (unique for recovery)
- `kyc_verified`: KYC status (true = instant approved)
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

**Indexes:**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_kyc_verified ON users(kyc_verified);
```

---

### 2. Wallets Table
```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency VARCHAR(3) NOT NULL,
  balance DECIMAL(18, 2) DEFAULT 0.00,
  last_updated TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, currency)
);
```

**Fields:**
- `id`: Unique wallet identifier
- `user_id`: Reference to users table
- `currency`: ISO currency code (USD, EUR, INR, GBP)
- `balance`: Current account balance
- `last_updated`: Last balance update time

**Indexes:**
```sql
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_currency ON wallets(currency);
```

---

### 3. Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_sent DECIMAL(18, 2) NOT NULL,
  amount_received DECIMAL(18, 2) NOT NULL,
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  exchange_rate_used DECIMAL(18, 6) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  match_id UUID REFERENCES matches(match_id),
  created_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP
);
```

**Fields:**
- `id`: Unique transaction identifier
- `sender_id`: User initiating transfer
- `receiver_id`: User receiving transfer
- `amount_sent`: Amount sent by sender (in from_currency)
- `amount_received`: Amount received by receiver (in to_currency)
- `from_currency`: Sender's currency
- `to_currency`: Receiver's currency
- `exchange_rate_used`: Exchange rate locked at transaction time
- `status`: Transaction state (pending → completed or cancelled)
- `match_id`: Link to the match that facilitated this transaction
- `created_at`, `completed_at`, `cancelled_at`: Timestamps for each stage

**Indexes:**
```sql
CREATE INDEX idx_transactions_sender_id ON transactions(sender_id);
CREATE INDEX idx_transactions_receiver_id ON transactions(receiver_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_match_id ON transactions(match_id);
```

---

### 4. Matches Table
```sql
CREATE TABLE matches (
  match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_score DECIMAL(5, 2) NOT NULL,
  currency_pair VARCHAR(7) NOT NULL,
  user_a_amount DECIMAL(18, 2) NOT NULL,
  user_b_amount DECIMAL(18, 2) NOT NULL,
  matched_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled'))
);
```

**Fields:**
- `match_id`: Unique match identifier
- `user_a_id`, `user_b_id`: Two users in the match
- `match_score`: Quality score (0-100)
- `currency_pair`: Currency pair (e.g., "USD-INR")
- `user_a_amount`, `user_b_amount`: Amounts for each user
- `matched_at`: When match was created
- `expires_at`: When match becomes invalid (30 min from creation)
- `status`: Match state (active → completed or expired)

**Indexes:**
```sql
CREATE INDEX idx_matches_user_a_id ON matches(user_a_id);
CREATE INDEX idx_matches_user_b_id ON matches(user_b_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_expires_at ON matches(expires_at);
```

---

### 5. Row-Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY users_own_profile ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Users can only see their own wallets
CREATE POLICY wallets_own_data ON wallets
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can see transactions where they are sender or receiver
CREATE POLICY transactions_own_data ON transactions
  FOR SELECT USING (
    auth.uid()::text = sender_id::text 
    OR auth.uid()::text = receiver_id::text
  );

-- Users can see their matches
CREATE POLICY matches_own_data ON matches
  FOR SELECT USING (
    auth.uid()::text = user_a_id::text 
    OR auth.uid()::text = user_b_id::text
  );
```

---

## SQL Queries

### 1. Authentication Queries

#### Create User
```sql
INSERT INTO users (email, password_hash, phone)
VALUES ($1, $2, $3)
RETURNING id, email, phone, kyc_verified, created_at;
```

**Parameters:**
- `$1`: email (string)
- `$2`: password_hash (bcrypted)
- `$3`: phone (string)

#### Get User by Email
```sql
SELECT id, email, phone, kyc_verified, created_at
FROM users
WHERE email = $1;
```

#### Get User by ID
```sql
SELECT id, email, phone, kyc_verified, created_at, updated_at
FROM users
WHERE id = $1;
```

#### Update KYC Status
```sql
UPDATE users
SET kyc_verified = TRUE, updated_at = now()
WHERE id = $1
RETURNING id, email, kyc_verified;
```

---

### 2. Wallet Queries

#### Create Empty Wallets on Signup
```sql
INSERT INTO wallets (user_id, currency, balance)
VALUES 
  ($1, 'USD', 0.00),
  ($1, 'EUR', 0.00),
  ($1, 'INR', 0.00),
  ($1, 'GBP', 0.00)
RETURNING id, user_id, currency, balance;
```

#### Get User's Wallet by Currency
```sql
SELECT id, user_id, currency, balance, last_updated
FROM wallets
WHERE user_id = $1 AND currency = $2;
```

#### Get All User's Wallets
```sql
SELECT id, user_id, currency, balance, last_updated
FROM wallets
WHERE user_id = $1
ORDER BY currency DESC;
```

#### Deposit to Wallet
```sql
UPDATE wallets
SET balance = balance + $1, last_updated = now()
WHERE user_id = $2 AND currency = $3
RETURNING id, user_id, currency, balance;
```

#### Deduct from Wallet (for sending)
```sql
UPDATE wallets
SET balance = balance - $1, last_updated = now()
WHERE user_id = $2 AND currency = $3 AND balance >= $1
RETURNING id, user_id, currency, balance;
```

#### Check Wallet Balance
```sql
SELECT balance
FROM wallets
WHERE user_id = $1 AND currency = $2;
```

---

### 3. Transaction Queries

#### Create Transaction (Pending)
```sql
INSERT INTO transactions (sender_id, receiver_id, amount_sent, amount_received, from_currency, to_currency, exchange_rate_used, status)
VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
RETURNING id, sender_id, receiver_id, amount_sent, amount_received, from_currency, to_currency, status, created_at;
```

**Parameters:**
- `$1`: sender_id (UUID)
- `$2`: receiver_id (UUID)
- `$3`: amount_sent (decimal)
- `$4`: amount_received (decimal)
- `$5`: from_currency (string)
- `$6`: to_currency (string)
- `$7`: exchange_rate_used (decimal)

#### Complete Transaction
```sql
UPDATE transactions
SET status = 'completed', completed_at = now()
WHERE id = $1
RETURNING id, status, completed_at;
```

#### Cancel Transaction (Refund)
```sql
UPDATE transactions
SET status = 'cancelled', cancelled_at = now()
WHERE id = $1 AND status = 'pending'
RETURNING id, status, cancelled_at;
```

#### Get Transaction by ID
```sql
SELECT id, sender_id, receiver_id, amount_sent, amount_received, from_currency, to_currency, exchange_rate_used, status, created_at, completed_at
FROM transactions
WHERE id = $1;
```

#### Get User's Transaction History (Paginated)
```sql
SELECT id, sender_id, receiver_id, amount_sent, amount_received, from_currency, to_currency, status, created_at, completed_at
FROM transactions
WHERE sender_id = $1 OR receiver_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
```

**Parameters:**
- `$1`: user_id (UUID)
- `$2`: limit (integer, default 20)
- `$3`: offset (integer, default 0)

#### Get Pending Transactions (for matching)
```sql
SELECT id, sender_id, receiver_id, amount_sent, from_currency, to_currency, status
FROM transactions
WHERE status = 'pending'
AND created_at > now() - INTERVAL '30 minutes'
ORDER BY created_at DESC;
```

---

### 4. Matching Queries

#### Create Match
```sql
INSERT INTO matches (user_a_id, user_b_id, match_score, currency_pair, user_a_amount, user_b_amount, expires_at)
VALUES ($1, $2, $3, $4, $5, $6, now() + INTERVAL '30 minutes')
RETURNING match_id, user_a_id, user_b_id, match_score, currency_pair, matched_at, expires_at;
```

#### Find Potential Matches
```sql
WITH target_user AS (
  SELECT 
    u.id,
    w.balance,
    w.currency
  FROM users u
  JOIN wallets w ON u.id = w.user_id
  WHERE u.id = $1 AND u.kyc_verified = TRUE
)
SELECT 
  u.id as match_user_id,
  w.balance as match_balance,
  (w.balance / $3) as match_score_proximity,
  (CASE WHEN u.id IN (
    SELECT user_a_id FROM transactions WHERE status = 'completed'
    UNION
    SELECT receiver_id FROM transactions WHERE status = 'completed'
  ) THEN 50 ELSE 100 END) as reliability_score
FROM users u
JOIN wallets w ON u.id = w.user_id
WHERE u.kyc_verified = TRUE
AND u.id != $1
AND w.currency = $2
AND w.balance BETWEEN ($3 * 0.9) AND ($3 * 1.1)
AND u.id NOT IN (
  SELECT user_a_id FROM matches WHERE status = 'active' AND expires_at > now()
  UNION
  SELECT user_b_id FROM matches WHERE status = 'active' AND expires_at > now()
)
ORDER BY match_score_proximity DESC, reliability_score DESC
LIMIT 3;
```

**Parameters:**
- `$1`: user_id (UUID)
- `$2`: opposite_currency (string)
- `$3`: amount (decimal)

#### Update Match Status
```sql
UPDATE matches
SET status = $2
WHERE match_id = $1
RETURNING match_id, status;
```

#### Expire Old Matches
```sql
UPDATE matches
SET status = 'expired'
WHERE status = 'active' AND expires_at < now()
RETURNING match_id;
```

---

### 5. Analytics Queries

#### User Success Rate
```sql
SELECT 
  user_id,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
  COUNT(*) as total_count,
  ROUND(
    COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*),
    2
  ) as success_rate
FROM (
  SELECT sender_id as user_id, status FROM transactions
  UNION ALL
  SELECT receiver_id as user_id, status FROM transactions
) stats
WHERE user_id = $1
GROUP BY user_id;
```

#### Total Transactions by User
```sql
SELECT 
  COUNT(*) as total_transactions,
  SUM(amount_sent) as total_sent,
  AVG(amount_sent) as avg_transaction,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
FROM transactions
WHERE sender_id = $1 OR receiver_id = $1;
```

#### Most Active Currency Pairs
```sql
SELECT 
  from_currency || '-' || to_currency as currency_pair,
  COUNT(*) as transaction_count,
  AVG(exchange_rate_used) as avg_rate
FROM transactions
WHERE status = 'completed'
GROUP BY from_currency, to_currency
ORDER BY transaction_count DESC
LIMIT 10;
```

---

## API Endpoints

### 1. Authentication Endpoints

#### POST /auth/signup
**Description:** Create new user account

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "phone": "+1234567890"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "phone": "+1234567890",
  "kyc_verified": false,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "created_at": "2024-03-13T10:30:00Z"
}
```

**Error (400):**
```json
{
  "error": "Email already exists",
  "code": "EMAIL_CONFLICT"
}
```

---

#### POST /auth/login
**Description:** Login with email and password

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "kyc_verified": false
}
```

**Error (401):**
```json
{
  "error": "Invalid credentials",
  "code": "AUTH_FAILED"
}
```

---

### 2. KYC Endpoint

#### POST /kyc/verify
**Description:** Submit KYC information (instant approval)

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body:**
```json
{
  "full_name": "John Doe",
  "id_type": "passport",
  "id_number": "AB123456",
  "id_image": <file_upload>
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "kyc_verified": true,
  "message": "KYC verified successfully"
}
```

**Error (400):**
```json
{
  "error": "Missing required fields",
  "code": "VALIDATION_ERROR"
}
```

---

### 3. Wallet Endpoints

#### GET /wallet/:currency
**Description:** Get wallet balance for specific currency

**Headers:**
```
Authorization: Bearer {token}
```

**Path Parameter:**
- `currency`: USD, EUR, INR, or GBP

**Response (200):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "currency": "USD",
  "balance": 500.00,
  "last_updated": "2024-03-13T10:30:00Z"
}
```

---

#### GET /wallet
**Description:** Get all wallets for current user

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "wallets": [
    {
      "currency": "USD",
      "balance": 500.00
    },
    {
      "currency": "EUR",
      "balance": 200.00
    },
    {
      "currency": "INR",
      "balance": 5000.00
    },
    {
      "currency": "GBP",
      "balance": 0.00
    }
  ]
}
```

---

#### POST /wallet/deposit
**Description:** Deposit mock funds to wallet (for MVP testing)

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "currency": "USD",
  "amount": 100.00
}
```

**Response (201):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "currency": "USD",
  "balance": 600.00,
  "message": "Deposit successful"
}
```

---

### 4. Exchange Rate Endpoint

#### GET /exchange-rates?from=USD&to=INR
**Description:** Get current exchange rate from external API

**Query Parameters:**
- `from`: Source currency (USD, EUR, INR, GBP)
- `to`: Target currency (USD, EUR, INR, GBP)

**Response (200):**
```json
{
  "from": "USD",
  "to": "INR",
  "rate": 82.45,
  "timestamp": "2024-03-13T10:35:00Z",
  "cached": false
}
```

---

### 5. Transaction Endpoints

#### POST /transactions/create
**Description:** Initiate a money transfer

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "from_currency": "USD",
  "to_currency": "INR",
  "amount": 100.00
}
```

**Response (201):**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "sender_id": "550e8400-e29b-41d4-a716-446655440000",
  "from_currency": "USD",
  "to_currency": "INR",
  "amount_sent": 100.00,
  "amount_received": 8245.00,
  "exchange_rate_used": 82.45,
  "status": "pending",
  "created_at": "2024-03-13T10:40:00Z"
}
```

**Error (400):**
```json
{
  "error": "Insufficient balance",
  "code": "INSUFFICIENT_FUNDS"
}
```

---

#### GET /transactions?limit=20&offset=0
**Description:** Get user's transaction history (paginated)

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit`: Number of transactions per page (default: 20, max: 100)
- `offset`: Pagination offset (default: 0)

**Response (200):**
```json
{
  "transactions": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "sender_id": "550e8400-e29b-41d4-a716-446655440000",
      "receiver_id": "880e8400-e29b-41d4-a716-446655440003",
      "amount_sent": 100.00,
      "amount_received": 8245.00,
      "from_currency": "USD",
      "to_currency": "INR",
      "status": "completed",
      "created_at": "2024-03-13T10:40:00Z",
      "completed_at": "2024-03-13T10:42:00Z"
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

---

#### GET /transactions/:id
**Description:** Get specific transaction details

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "sender_id": "550e8400-e29b-41d4-a716-446655440000",
  "receiver_id": "880e8400-e29b-41d4-a716-446655440003",
  "amount_sent": 100.00,
  "amount_received": 8245.00,
  "from_currency": "USD",
  "to_currency": "INR",
  "exchange_rate_used": 82.45,
  "status": "completed",
  "match_id": "990e8400-e29b-41d4-a716-446655440004",
  "created_at": "2024-03-13T10:40:00Z",
  "completed_at": "2024-03-13T10:42:00Z"
}
```

---

#### POST /transactions/:id/cancel
**Description:** Cancel pending transaction (refund wallet)

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "status": "cancelled",
  "cancelled_at": "2024-03-13T10:45:00Z",
  "refund_amount": 100.00,
  "refund_currency": "USD"
}
```

---

### 6. Matching Endpoint

#### POST /match/find
**Description:** Find P2P matches for user's transaction

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "from_currency": "USD",
  "to_currency": "INR",
  "amount": 100.00
}
```

**Response (200):**
```json
{
  "matches": [
    {
      "match_id": "990e8400-e29b-41d4-a716-446655440004",
      "user_id": "880e8400-e29b-41d4-a716-446655440003",
      "match_score": 95.5,
      "their_amount": 8245.00,
      "their_currency": "INR",
      "currency_pair": "USD-INR"
    },
    {
      "match_id": "001e8400-e29b-41d4-a716-446655440005",
      "user_id": "112e8400-e29b-41d4-a716-446655440006",
      "match_score": 87.0,
      "their_amount": 8200.00,
      "their_currency": "INR",
      "currency_pair": "USD-INR"
    }
  ],
  "found": true,
  "message": "2 matches found"
}
```

**Response (404):**
```json
{
  "matches": [],
  "found": false,
  "message": "No matches available at this time"
}
```

---

## Authentication Flow

### JWT Token Structure
```
Header: {
  "alg": "HS256",
  "typ": "JWT"
}

Payload: {
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "kyc_verified": true,
  "iat": 1710328200,
  "exp": 1710414600
}

Signature: HMAC-SHA256(header.payload, JWT_SECRET)
```

### Token Expiry
- **Issue time:** When user logs in
- **Expiry time:** 7 days (604,800 seconds)
- **Refresh:** User must login again to get new token

### Headers for Protected Endpoints
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Middleware Flow
1. Extract token from `Authorization` header
2. Verify signature with `JWT_SECRET`
3. Check token expiry
4. Extract `sub` (user_id) from payload
5. Attach `req.user.id` to request
6. Continue to route handler

---

## Error Handling

### Standard Error Response Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "status": 400,
  "timestamp": "2024-03-13T10:50:00Z"
}
```

### Common Error Codes

| HTTP | Code | Message |
|------|------|---------|
| 400 | VALIDATION_ERROR | Invalid input data |
| 400 | EMAIL_CONFLICT | Email already registered |
| 400 | INSUFFICIENT_FUNDS | Wallet balance too low |
| 401 | AUTH_FAILED | Invalid credentials |
| 401 | TOKEN_EXPIRED | JWT token has expired |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 404 | NOT_FOUND | Resource not found |
| 404 | USER_NOT_FOUND | User does not exist |
| 404 | TRANSACTION_NOT_FOUND | Transaction not found |
| 409 | CONFLICT | KYC already verified |
| 500 | INTERNAL_ERROR | Server error |

### Error Handling Best Practices

**Input Validation (Zod)**
```typescript
const SignupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be 8+ chars'),
  phone: z.string().regex(/^\+\d{10,}$/, 'Invalid phone')
});
```

**Try-Catch Pattern**
```typescript
try {
  const result = await db.query(...);
  return res.json(result);
} catch (error) {
  if (error.code === '23505') {
    return res.status(400).json({
      error: 'Email already exists',
      code: 'EMAIL_CONFLICT'
    });
  }
  return res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
}
```

---

## Environment Variables

**Backend `.env` file:**
```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Authentication
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRY=604800

# Exchange Rates API
EXCHANGE_RATE_API_KEY=your-exchangerate-api-key
EXCHANGE_RATE_API_URL=https://api.exchangerate-api.com/v4/latest

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com

# Database Connection Pool
DB_POOL_MIN=2
DB_POOL_MAX=20
```

### Required Keys:
- `SUPABASE_URL`: Get from Supabase project settings
- `SUPABASE_KEY`: Anon public key from Supabase
- `JWT_SECRET`: Generate with: `openssl rand -base64 32`
- `EXCHANGE_RATE_API_KEY`: Free from exchangerate-api.com

---

## Quick Setup Checklist

- [ ] Create Supabase project (free tier)
- [ ] Copy all SQL schemas into Supabase SQL editor
- [ ] Enable RLS policies
- [ ] Generate JWT_SECRET
- [ ] Get EXCHANGE_RATE_API_KEY from exchangerate-api.com
- [ ] Create `.env` file with all variables
- [ ] Install Node.js packages: `npm install express supabase jsonwebtoken bcryptjs zod cors`
- [ ] Build Express server with all endpoints
- [ ] Test with Postman/Insomnia
- [ ] Deploy to Vercel or Railway
