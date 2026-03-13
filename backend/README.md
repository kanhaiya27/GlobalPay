# GlobalPay Backend

Express.js REST API for peer-to-peer international money transfers with Supabase and JWT authentication.

## 🚀 Quick Start

### 1. Install Dependencies
```powershell
cd backend
npm install
```

### 2. Configure Environment Variables
```powershell
# Copy the example file
Copy-Item .env.example .env

# Edit .env with your values
# SUPABASE_URL: Your Supabase project URL
# SUPABASE_KEY: Your Supabase anon key
# JWT_SECRET: Generate with: openssl rand -base64 32
# EXCHANGE_RATE_API_KEY: From exchangerate-api.com
```

### 3. Start the Server

**Development (with auto-reload):**
```powershell
npm run dev
```

**Production:**
```powershell
npm start
```

Server will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /auth/signup` - Create new account
- `POST /auth/login` - Login and get JWT token
- `POST /kyc/verify` - Verify KYC (instant approval)

### Wallets
- `GET /wallet` - Get all wallets
- `GET /wallet/:currency` - Get specific wallet balance
- `POST /wallet/deposit` - Deposit mock funds

### Exchange Rates
- `GET /exchange-rates?from=USD&to=INR` - Get current rate (cached 5 min)

### Matching
- `POST /match/find` - Find P2P matches for transaction

### Transactions
- `POST /transactions/create` - Create and complete transaction
- `GET /transactions` - Get transaction history (paginated)
- `GET /transactions/:id` - Get transaction details
- `POST /transactions/:id/cancel` - Cancel pending transaction

## Environment Setup

### Required for Supabase
1. Create free Supabase project: https://supabase.com
2. Run all SQL from `BACKEND_QUERIES_AND_DOCS.md` in Supabase SQL editor
3. Copy URL and anon key to `.env`

### Required for Exchange Rates
1. Get free API key: https://exchangerate-api.com
2. Add to `.env` as `EXCHANGE_RATE_API_KEY`

### JWT Secret Generation
```powershell
# Windows (requires OpenSSL)
openssl rand -base64 32

# Or use Node directly
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Project Structure
```
backend/
├── server.js           # Main Express app
├── package.json        # Dependencies
├── .env                # Environment variables
├── middleware/
│   └── auth.js        # JWT & error handling
├── routes/
│   ├── auth.js        # Authentication endpoints
│   ├── wallet.js      # Wallet endpoints
│   ├── exchangeRates.js  # Exchange rate endpoint
│   ├── match.js       # Matching endpoint
│   └── transactions.js # Transaction endpoints
└── utils/
    ├── supabase.js    # Supabase client config
    ├── jwt.js         # JWT token management
    ├── exchangeRate.js # Exchange rate caching
    └── validation.js  # Zod schemas
```

## Testing Endpoints

### Signup
```powershell
curl -X POST http://localhost:3000/auth/signup `
  -H "Content-Type: application/json" `
  -d '{
    "email": "user@example.com",
    "password": "TestPass123",
    "phone": "+11234567890"
  }'
```

### Login
```powershell
curl -X POST http://localhost:3000/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "user@example.com",
    "password": "TestPass123"
  }'
```

### Get Wallet (use token from login)
```powershell
curl -X GET http://localhost:3000/wallet/USD `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Deposit
```powershell
curl -X POST http://localhost:3000/wallet/deposit `
  -H "Authorization: Bearer YOUR_TOKEN_HERE" `
  -H "Content-Type: application/json" `
  -d '{
    "currency": "USD",
    "amount": 100
  }'
```

### Get Exchange Rate
```powershell
curl -X GET "http://localhost:3000/exchange-rates?from=USD&to=INR"
```

## Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| EMAIL_CONFLICT | 400 | Email already registered |
| INSUFFICIENT_FUNDS | 400 | Balance too low |
| VALIDATION_ERROR | 400 | Invalid input |
| AUTH_FAILED | 401 | Wrong credentials |
| UNAUTHORIZED | 401 | Missing token |
| TOKEN_EXPIRED | 401 | Token expired |
| NOT_FOUND | 404 | Resource not found |
| INTERNAL_ERROR | 500 | Server error |

## Notes

- JWT tokens valid for 7 days
- Exchange rates cached for 5 minutes
- All database queries through Supabase
- Instant KYC approval for MVP (no manual review)
- Transactions auto-complete after balance verification
