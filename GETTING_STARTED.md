# 🌍 GlobalPay - Setup & Run Guide

## Overview
GlobalPay is a peer-to-peer international money transfer platform with a React frontend and Node.js/Express backend, both containerized with Docker.

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start with Docker](#quick-start-with-docker)
3. [Manual Setup (Without Docker)](#manual-setup-without-docker)
4. [Project Structure](#project-structure)
5. [Environment Configuration](#environment-configuration)
6. [Accessing the Application](#accessing-the-application)
7. [Available Commands](#available-commands)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### For Docker (Recommended)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
- **Docker Compose** - Usually included with Docker Desktop

### For Manual Setup
- **Node.js** 18+ - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)

### Required Accounts
- **Supabase** - [Create account](https://supabase.com)
- **ExchangeRate API** - [Get API key](https://www.exchangerate-api.com/)

---

## 🚀 Quick Start with Docker

### 1. Clone the Repository
```bash
git clone https://github.com/kanhaiya27/GlobalPay.git
cd GlobalPay
git submodule update --init --recursive
```

### 2. Setup Environment File
Create `.env` file in the root directory (copy from `.env.example`):
```bash
cp .env.example .env
```

Then edit `.env` and add your actual credentials:
```bash
# Update these with your actual values
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
JWT_SECRET=your-secret-key-min-32-chars
EXCHANGE_RATE_API_KEY=your-api-key
```

### 3. Start Services
```bash
docker-compose up
```

This will:
- Build backend Docker image
- Build frontend Docker image
- Start both services on their respective ports
- Create a shared Docker network

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

### 5. Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# View all logs
docker-compose logs

# View specific service
docker-compose logs backend
docker-compose logs frontend

# Follow logs (live)
docker-compose logs -f backend
```

---

## Manual Setup (Without Docker)

### Backend Setup

#### 1. Navigate to Backend Directory
```bash
cd GlobalPay/backend
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Create Environment File
```bash
cp .env.example .env
# Edit .env with your Supabase and API keys
```

#### 4. Start Backend Server
```bash
npm start          # Production mode
npm run dev        # Development mode with auto-reload (requires nodemon)
```

Backend runs on: **http://localhost:3000**

### Frontend Setup

#### 1. Navigate to Frontend Directory
```bash
cd GlobalPay/frontend
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Create Environment File
```bash
# Create .env file in frontend root
echo "VITE_API_URL=http://localhost:3000" > .env
```

#### 4. Start Frontend Server
```bash
npm run dev
```

Frontend runs on: **http://localhost:5173**

---

## Project Structure

```
GlobalPay/
├── backend/                    # Node.js/Express server
│   ├── server.js              # Main entry point
│   ├── package.json
│   ├── Dockerfile             # Docker configuration
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   └── test/
│
├── frontend/                   # React + TypeScript frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   └── store/            # State management
│   ├── package.json
│   ├── Dockerfile            # Frontend Docker config
│   ├── nginx.conf            # Nginx configuration
│   └── vite.config.ts        # Vite configuration
│
├── docker-compose.yml         # Docker Compose configuration
├── .dockerignore              # Docker build exclusions
├── .env.example               # Environment template
├── .gitignore                 # Git exclusions
└── README.md                  # Project documentation
```

---

## Environment Configuration

### Create `.env` File

Copy the template and add your credentials:

```bash
# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Authentication
JWT_SECRET=your-super-secret-key-min-32-characters-long
JWT_EXPIRY=604800

# Exchange Rates API
EXCHANGE_RATE_API_KEY=your-api-key-from-exchangerate-api
EXCHANGE_RATE_API_URL=https://api.exchangerate-api.com/v4/latest

# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Frontend Configuration
VITE_API_URL=http://localhost:3000
```

### Obtaining Credentials

#### Supabase Credentials
1. Create account at [Supabase](https://supabase.com)
2. Create a new project
3. Go to **Settings > API**
4. Copy `Project URL` and `Anon Key`

#### Exchange Rate API Key
1. Visit [exchangerate-api.com](https://www.exchangerate-api.com/)
2. Sign up for free account
3. Get your API key from dashboard

#### JWT Secret
Generate a random 32+ character string:
```bash
# On Windows PowerShell
$bytes = New-Object byte[] 32
([Security.Cryptography.RNGCryptoServiceProvider]::new()).GetBytes($bytes)
[Convert]::ToBase64String($bytes)

# On Linux/Mac
openssl rand -base64 32
```

---

## Accessing the Application

### Frontend
- **URL**: http://localhost:5173
- **Pages Available**:
  - Login/Signup page
  - Dashboard with wallet balances
  - Send money page
  - Transaction history
  - KYC verification

### Backend API
- **Base URL**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

### API Documentation
See [API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md) for complete API reference including:
- Authentication endpoints
- Wallet management
- Money transfer
- Transaction history
- KYC verification

---

## Available Commands

### Docker Commands
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

# Remove everything (including volumes)
docker-compose down -v
```

### Backend Commands
```bash
# Install dependencies
npm install

# Start server
npm start                           # Production
npm run dev                         # Development with nodemon

# Run tests
node test-api.js                   # Run API test suite
```

### Frontend Commands
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test                       # Run tests once
npm run test:watch                # Watch mode
```

---

## Troubleshooting

### Docker Issues

**Error: "Cannot connect to Docker daemon"**
- Ensure Docker Desktop is running
- On Windows: Check Docker Desktop is started in system tray

**Error: "Port 3000 or 5173 already in use"**
```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change port in docker-compose.yml or .env
```

**Slow Docker builds**
- Make sure `.dockerignore` exists
- Remove node_modules before building: `rm -r backend/node_modules frontend/node_modules`

### Backend Issues

**Error: "JWT_SECRET not found"**
- Ensure `.env` file exists in root and backend directories
- Check `.env` has JWT_SECRET=your-secret

**Error: "Supabase connection failed"**
- Verify SUPABASE_URL and SUPABASE_KEY are correct
- Check internet connection
- Verify Supabase project is active

**Error: "Exchange rate API failed"**
- Verify EXCHANGE_RATE_API_KEY is correct
- Check API key has valid requests remaining

### Frontend Issues

**Error: "Cannot GET /api/..."**
- Ensure backend is running and accessible
- Check VITE_API_URL in frontend .env
- Verify CORS is enabled in backend

**Error: "Module not found"**
- Run `npm install` in frontend directory
- Delete node_modules and package-lock.json, then reinstall:
  ```bash
  rm -r node_modules package-lock.json
  npm install
  ```

**Blank page in browser**
- Check browser console for errors (F12)
- Verify backend is running: http://localhost:3000/health
- Clear browser cache and hard refresh (Ctrl+Shift+R)

### Database Issues

**Error: "RLS policies not configured"**
- Run SQL from `SETUP_RLS_POLICIES.sql` in Supabase SQL editor
- See `RLS_FIX.md` for detailed instructions

---

## Development Workflow

### 1. Start Services
```bash
docker-compose up
```

### 2. Make Changes
- Edit files in `backend/` or `frontend/`
- Changes are reflected immediately (volume mounts enabled)

### 3. Test Changes
- Frontend: http://localhost:5173
- Backend: http://localhost:3000/health

### 4. View Logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 5. Commit and Push
```bash
git add .
git commit -m "Description of changes"
git push
```

---

## Performance Tips

1. **Use Docker for consistent environment** - Avoids "works on my machine" issues
2. **Keep `.env` out of git** - Never commit credentials
3. **Use `.dockerignore`** - Reduces build context size
4. **Enable volume mounts** - Hot reload during development
5. **Monitor logs** - Quickly identify issues

---

## Additional Resources

- **API Documentation**: [API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md)
- **Backend README**: [backend/README.md](./backend/README.md)
- **Frontend README**: [frontend/README.md](./frontend/README.md)
- **Database Setup**: [SETUP_RLS_POLICIES.sql](./SETUP_RLS_POLICIES.sql)

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review API documentation
3. Check Docker logs
4. Open GitHub issue with error details

---

**Last Updated**: March 13, 2026  
**Status**: ✅ Ready to Run
