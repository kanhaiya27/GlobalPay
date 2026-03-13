# 🌍 GlobalPay

> A secure peer-to-peer international money transfer platform with real-time exchange rates and KYC verification.

[![GitHub](https://img.shields.io/badge/GitHub-kanhaiya27/GlobalPay-blue?logo=github)](https://github.com/kanhaiya27/GlobalPay)
[![Docker](https://img.shields.io/badge/Docker-Ready-2CA5E0?logo=docker)](./docker-compose.yml)
[![License](https://img.shields.io/badge/License-MIT-green)]()

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Documentation](#-documentation)
- [API Endpoints](#-api-endpoints)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🔐 Security
- JWT-based authentication with 7-day token expiry
- Bcryptjs password hashing (10 salt rounds)
- Row-level security policies on database
- Input validation with Zod schemas
- CORS protection

### 💱 Multi-Currency Support
- **Supported Currencies**: USD, EUR, INR, GBP
- Real-time exchange rates (5-minute caching)
- Automatic rate conversion
- Precise decimal handling

### 👥 P2P Matching
- Smart matching algorithm for direct transfers
- KYC verification requirement
- Balance verification
- Match score calculation

### ✅ Compliance
- KYC (Know Your Customer) verification
- User identity verification
- Compliance tracking
- Transaction history

### 💰 Wallet Management
- Multi-currency wallets (auto-created on signup)
- Balance tracking
- Deposit functionality
- Atomic wallet updates

### 📊 Transaction Management
- Complete transaction lifecycle
- Transaction history with pagination
- Exchange rate logging
- Transaction cancellation/refund

---

## 🛠️ Tech Stack

### Backend
| Component | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18+ | Runtime |
| **Express.js** | 4.18.2 | Web framework |
| **Supabase** | 2.38.0 | Database (PostgreSQL) |
| **JWT** | 9.0.2 | Authentication |
| **Bcryptjs** | 2.4.3 | Password hashing |
| **Zod** | 3.22.4 | Input validation |
| **Axios** | 1.5.0 | HTTP client |
| **Node-cache** | 5.1.2 | Caching |

### Frontend
| Component | Purpose |
|-----------|---------|
| **React** | UI library |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **Shadcn/ui** | Component library |
| **Axios** | API communication |

### Infrastructure
| Component | Purpose |
|-----------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **Nginx** | Frontend server |

---

## 🚀 Quick Start

### Prerequisites
- **Docker** and **Docker Compose** (Recommended)
- OR **Node.js 18+** and **npm** (Manual setup)
- **Git**

### Option 1: Docker (Recommended ⭐)

```bash
# 1. Clone repository
git clone https://github.com/kanhaiya27/GlobalPay.git
cd GlobalPay
git submodule update --init --recursive

# 2. Setup environment
cp .env.example .env
# Edit .env with your credentials (see GETTING_STARTED.md)

# 3. Run with Docker
docker-compose up

# 4. Access application
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

### Option 2: Manual Setup

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm start
# Backend running on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
# Frontend running on http://localhost:5173
```

### Environment Setup

Create `.env` file in project root:

```bash
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# Authentication
JWT_SECRET=your-32-char-secret-key
JWT_EXPIRY=604800

# Exchange Rates
EXCHANGE_RATE_API_KEY=your-api-key

# Server
PORT=3000
NODE_ENV=development
```

For detailed setup instructions, see [GETTING_STARTED.md](./GETTING_STARTED.md)

---

## 📁 Project Structure

```
GlobalPay/
├── backend/                           # Node.js/Express API
│   ├── server.js                     # Main server entry
│   ├── middleware/auth.js            # JWT authentication
│   ├── routes/                       # API endpoints
│   │   ├── auth.js                  # Signup/Login
│   │   ├── wallet.js                # Wallet operations
│   │   ├── transactions.js          # Money transfers
│   │   ├── kyc.js                   # KYC verification
│   │   ├── exchangeRates.js         # Exchange rates
│   │   └── match.js                 # P2P matching
│   ├── utils/
│   │   ├── supabase.js              # DB client
│   │   ├── jwt.js                   # Token handling
│   │   ├── validation.js            # Zod schemas
│   │   └── exchangeRate.js          # Rate caching
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                          # React + TypeScript app
│   ├── src/
│   │   ├── pages/                   # Page components
│   │   │   ├── AuthPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── SendMoneyPage.tsx
│   │   │   ├── TransactionHistoryPage.tsx
│   │   │   └── KycPage.tsx
│   │   ├── components/              # Reusable components
│   │   ├── store/                   # State management
│   │   └── lib/utils.ts
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml               # Container orchestration
├── .dockerignore                    # Docker build exclusions
├── .env.example                     # Configuration template
├── .gitignore
├── GETTING_STARTED.md              # Setup guide
├── README.md                        # This file
└── API_DOCUMENTATION.md            # API reference
```

---

## 📚 Documentation

| Document | Content |
|----------|---------|
| [GETTING_STARTED.md](./GETTING_STARTED.md) | Complete setup & installation guide |
| [API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md) | Full API reference with examples |
| [backend/README.md](./backend/README.md) | Backend-specific documentation |
| [frontend/README.md](./frontend/README.md) | Frontend-specific documentation |
| [SETUP_RLS_POLICIES.sql](./SETUP_RLS_POLICIES.sql) | Database security policies |

---

## 🔌 API Endpoints

### Authentication
- `POST /auth/signup` - Create new account
- `POST /auth/login` - Login with credentials

### Wallet Management
- `GET /wallet` - Get all wallets
- `GET /wallet/:currency` - Get specific wallet
- `POST /wallet/deposit` - Deposit funds

### Money Transfer
- `POST /transactions/create` - Create transfer
- `GET /transactions` - Transaction history
- `GET /transactions/:id` - Transaction details
- `POST /transactions/:id/cancel` - Cancel transfer

### KYC & Verification
- `POST /kyc/verify` - Verify identity

### Exchange Rates
- `GET /exchange-rates?from=USD&to=INR` - Get exchange rate

### Utilities
- `GET /health` - Health check

**Full API documentation**: See [API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md)

---

## 🖼️ Screenshots

### Dashboard
- Multi-currency wallet view
- Current balances
- Recent transactions

### Send Money
- Currency selection
- Exchange rate display
- Recipient selection
- Amount verification

### Transaction History
- Complete transaction log
- Status tracking
- Exchange rates used
- Timestamps

### KYC Verification
- Identity verification
- Document submission
- Verification status

---

## 🐳 Docker Commands

```bash
# Start services
docker-compose up                    # Foreground
docker-compose up -d                 # Background

# Stop services
docker-compose down

# View logs
docker-compose logs -f              # All services
docker-compose logs -f backend      # Specific service

# Rebuild images
docker-compose up --build

# Remove everything
docker-compose down -v
```

---

## 🧪 Testing

### Backend API Tests
```bash
cd backend
node test-api.js
```

**Test Coverage:**
- ✅ User signup
- ✅ User login
- ✅ Wallet operations
- ✅ Money transfers
- ✅ Exchange rate fetching
- ✅ KYC verification
- ✅ Error handling

### Frontend Tests
```bash
cd frontend
npm run test              # Single run
npm run test:watch       # Watch mode
```

---

## 🔒 Security Features

1. **JWT Authentication** - Secure token-based auth
2. **Password Hashing** - Bcryptjs with 10 salt rounds
3. **Input Validation** - Zod schema validation
4. **CORS Protection** - Configurable origins
5. **RLS Policies** - Row-level database security
6. **Environment Variables** - Sensitive data protection
7. **Atomic Transactions** - Database consistency

---

## 📈 Performance Optimizations

- **Exchange Rate Caching** - 5-minute cache to reduce API calls
- **Connection Pooling** - Efficient database connections
- **Pagination** - Limit transaction history queries
- **Input Validation** - Prevent invalid requests
- **Volume Mounts** - Hot reload in development

---

## 🚀 Deployment

### Development
```bash
docker-compose up
NODE_ENV=development
```

### Production
1. Update `.env` with production credentials
2. Set `NODE_ENV=production`
3. Configure environment-specific CORS origins
4. Enable HTTPS
5. Use Docker secrets for sensitive data
6. Configure database backups
7. Set up monitoring and logging

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Code Standards
- Follow existing code style
- Include descriptive commit messages
- Update documentation for new features
- Add tests for new functionality

---

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 🆘 Troubleshooting

### Common Issues

**Backend not connecting to database?**
- Verify SUPABASE_URL and SUPABASE_KEY in `.env`
- Check internet connection
- Ensure Supabase project is active

**Frontend can't reach backend?**
- Verify VITE_API_URL points to backend
- Check backend is running on port 3000
- Verify CORS is enabled

**Docker containers won't start?**
- Ensure Docker Desktop is running
- Check ports 3000 and 5173 are available
- View logs: `docker-compose logs`

For more help, see [GETTING_STARTED.md - Troubleshooting](./GETTING_STARTED.md#troubleshooting)

---

## 📞 Support

- 📖 [Documentation](./GETTING_STARTED.md)
- 🐛 [Report Issues](https://github.com/kanhaiya27/GlobalPay/issues)
- 💬 [Discussions](https://github.com/kanhaiya27/GlobalPay/discussions)

---

## 🎯 Roadmap

- [ ] Mobile app support
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] More currency support
- [ ] Real-time notifications
- [ ] Webhook integrations
- [ ] Admin dashboard

---

## 👨‍💻 Author

**Kanhaiya** - [@kanhaiya27](https://github.com/kanhaiya27)

---

## 📊 Project Stats

- **Backend**: Node.js/Express
- **Frontend**: React + TypeScript
- **Database**: PostgreSQL (Supabase)
- **Deployment**: Docker + Docker Compose
- **Status**: ✅ Production Ready
- **Last Updated**: March 13, 2026

---

<div align="center">

### ⭐ If you find this project helpful, please consider giving it a star!

[⬆ back to top](#-globalpay)

</div>
