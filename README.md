<p align="center">
  <img src="frontend/public/favicon.svg" alt="FinVerse AI Logo" width="80" height="80" />
</p>

<h1 align="center">FinVerse AI</h1>

<p align="center">
  <strong>Your AI-Powered Personal Finance Command Center</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-environment-variables">Environment Variables</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-security">Security</a> •
  <a href="#-contributing">Contributing</a> •
  <a href="#-license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=white" alt="Firebase Auth" />
  <img src="https://img.shields.io/badge/Gemini_AI-Powered-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
</p>

---

## 📖 About

**FinVerse AI** is a full-stack personal finance management platform built for the modern Indian investor. It combines intelligent transaction tracking, budget management, investment portfolio monitoring, and savings goal planning — all enhanced by a conversational AI advisor powered by Google Gemini.

The platform features a premium glassmorphic dark-mode UI with 3D visualizations, real-time analytics dashboards, and automated financial report generation in PDF and Excel formats.

---

## 🖼️ Screenshots

<table>
  <tr>
    <td align="center" width="50%">
      <img src="screenshots/login.png" alt="Sign in screen" width="100%" />
      <br /><sub><b>Sign In</b> — glassmorphic auth screen with email/password + Google</sub>
    </td>
    <td align="center" width="50%">
      <img src="screenshots/register.png" alt="Create account screen" width="100%" />
      <br /><sub><b>Create Account</b> — registration with terms acceptance</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="screenshots/dashboard.png" alt="Dashboard financial overview" width="100%" />
      <br /><sub><b>Dashboard</b> — KPI cards, 3D financial globe, quick actions, and cash flow</sub>
    </td>
    <td align="center" width="50%">
      <img src="screenshots/ai-assistant.png" alt="FinVerse AI Assistant chat" width="100%" />
      <br /><sub><b>AI Assistant</b> — Gemini-powered chat with auto-generated spending insights</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="screenshots/settings-profile.png" alt="Settings profile screen" width="100%" />
      <br /><sub><b>Settings</b> — profile management and account security</sub>
    </td>
    <td align="center" width="50%">
      <img src="screenshots/settings-currency.png" alt="Currency preferences" width="100%" />
      <br /><sub><b>Preferences</b> — multi-currency support (INR, USD, EUR, GBP, JPY, BTC)</sub>
    </td>
  </tr>
</table>

---

## ✨ Features

### 💰 Transaction Management
- Full CRUD operations for income and expense transactions
- Category-based organization (Housing, Food, Transport, Shopping, etc.)
- Merchant tracking and notes support
- Bulk delete and monthly summary endpoints
- Filtering, sorting, and full-text search (name, merchant, note)

### 📊 Analytics Dashboard
- **KPI Cards** — Total balance, monthly income/expenses, savings rate
- **Spending Breakdown** — Category-wise donut charts with percentage allocations
- **Income vs. Expense Trends** — Daily, weekly, and monthly trend visualizations
- **Cash Flow Analysis** — 7-day rolling cash flow with income/expense bars
- **Monthly Comparison** — 6-month side-by-side financial performance

### 🎯 Budget Tracking
- Set category-wise monthly spending limits
- Real-time progress bars with overspend alerts
- One-click reset of a budget's spent amount each cycle
- Automatic budget utilization calculations

### 🏆 Savings Goals
- Create named savings targets with deadlines
- Add money directly to a goal and track progress live
- Automated remaining amount and pace calculations
- Goal completion status tracking

### 📈 Investment Portfolio
- Track investments across **6 asset classes**: Stocks, Mutual Funds, Gold, Crypto, Fixed Deposits, and Others
- Auto-calculated `totalInvested`, `currentValue`, `gainLoss`, and `gainLossPercent` via Mongoose virtuals
- Purchase price vs. current price tracking
- Platform and symbol tagging

### 🤖 AI Financial Advisor
- **Conversational Chat** — Natural language financial Q&A powered by Google Gemini 1.5 Flash
- **Context-Aware** — Automatically injects your real financial data (last 30 days of transactions, active budgets, active goals) into every query
- **Automated Insights** — AI-generated spending warnings, savings milestones, and goal deadline alerts
- **Chat History** — Persistent, per-user conversation logs stored in MongoDB
- **Smart Suggestions** — Pre-built prompt questions like _"Where am I spending the most?"_ and _"Am I on track with my goals?"_
- **Graceful Fallback** — Rule-based mock advisor automatically kicks in when `GEMINI_API_KEY` is not configured, so the app is fully demoable without a live key

### 📄 Report Generation
- **PDF Reports** — Branded, multi-page financial statements with cover page, summary metrics, expense allocation tables, and transaction ledgers (via PDFKit)
- **Excel Reports** — Multi-sheet workbooks (Summary + Transactions) with styled headers (via ExcelJS)
- **CSV Export** — Lightweight data exports
- **Cloud Upload** — Automatic Cloudinary upload with download links (falls back to local file serving when Cloudinary isn't configured)
- **Custom Date Ranges** — Filter reports by date range and specific categories
- **Path-Safe Downloads** — Report filenames are strictly validated to prevent path traversal on the public download endpoint

### 🔐 Authentication & Account Management
- **Firebase Authentication** — Email/password and Google sign-in handled client-side by Firebase; the backend verifies Firebase ID tokens on every request (no passwords ever touch the Express server)
- **Auto-Sync & Legacy Migration** — `/auth/sync` creates or links a MongoDB user profile to a Firebase UID the first time a user signs in, including a safe migration path for pre-Firebase accounts (only allowed once the email is verified or the sign-in came from Google)
- **Currency Preferences** — Per-user currency setting synchronized across app and backend
- **Cascading Account Deletion** — Irreversible delete that wipes the user profile, budgets, goals, transactions, investments, notifications, and AI chat history in one cascade

### 🎨 Premium UI/UX
- **Glassmorphic Dark Theme** — Deep purple palette with frosted-glass effects
- **3D Globe Visualization** — Interactive Three.js finance globe on the dashboard, wrapped in its own error boundary
- **Framer Motion Animations** — Page transitions, hover effects, and micro-interactions
- **Responsive Design** — Mobile-first layout with a collapsible sidebar and dedicated mobile nav
- **Lazy Loading** — Code-split routes with suspense fallbacks and skeleton loaders

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework with latest concurrent features |
| **TypeScript** | Type-safe development |
| **Vite 8** | Build tooling & dev server |
| **Tailwind CSS 4** | Utility-first styling |
| **Zustand** | Lightweight state management |
| **React Router v7** | Client-side routing with protected routes |
| **Firebase (client SDK)** | Authentication (email/password + Google) |
| **Recharts** | Data visualization and charting |
| **Framer Motion** | Animations and page transitions |
| **React Three Fiber / Drei** | 3D WebGL visualizations |
| **React Hook Form + Zod** | Form handling with schema validation |
| **Axios** | HTTP client for API communication |
| **Lucide React** | Icon library |
| **Vitest** | Unit testing |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **TypeScript** | Type-safe backend |
| **MongoDB + Mongoose** | NoSQL database with schema modeling & virtuals |
| **Firebase Admin SDK** | Server-side verification of Firebase ID tokens |
| **Redis (ioredis)** | Caching layer for analytics/AI data, invalidated per-user on writes |
| **Google Generative AI** | Gemini 1.5 Flash for AI chat and insights |
| **PDFKit** | PDF report generation |
| **ExcelJS** | Excel workbook generation |
| **Cloudinary** | Cloud storage for generated reports |
| **Winston + Morgan** | Structured logging with sensitive-field redaction |
| **Zod** | Runtime environment and request validation |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | Tiered, environment-driven rate limiting |
| **Nodemailer** | Email notifications |

---

## 🏗 Architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│  React 19 + Vite + Zustand + React Router + Three.js + Recharts  │
│  Firebase Client SDK (Auth)                                      │
└──────────────────────────┬───────────────────────────────────────┘
                            │  Axios (REST API, Bearer <Firebase ID Token>)
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    EXPRESS API SERVER (:5000)                     │
│                                                                    │
│  ┌────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────────┐ │
│  │ Helmet │  │ Rate     │  │ Morgan/  │  │ Firebase Token       │ │
│  │ CORS   │  │ Limiter  │  │ Winston  │  │ Verification (protect)│ │
│  └────────┘  └──────────┘  └──────────┘  └─────────────────────┘ │
│                                                                    │
│  ┌─────────────────────── ROUTES ──────────────────────────────┐ │
│  │ /auth  /transactions  /budgets  /goals  /investments         │ │
│  │ /analytics  /ai  /reports                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──── CONTROLLERS ────┐  ┌──── MODELS ────────────────────────┐ │
│  │ Auth, Transaction,  │  │ User, Transaction, Budget, Goal,    │ │
│  │ Budget, Goal,       │  │ Investment, AIHistory, Notification │ │
│  │ Investment, AI,     │  │                                     │ │
│  │ Analytics, Report   │  │                                     │ │
│  └─────────────────────┘  └────────────────────────────────────┘ │
└────────────┬──────────────────────────┬───────────────────────────┘
             │                          │
             ▼                          ▼
┌────────────────────┐    ┌──────────────────────────┐
│   MongoDB Atlas     │    │   Redis Cache             │
│   (Primary DB)      │    │   (Analytics & AI cache)  │
└────────────────────┘    └──────────────────────────┘
             │
             ▼
┌────────────────────┐    ┌──────────────────────────┐
│   Cloudinary        │    │   Google Gemini AI        │
│   (Report Storage)  │    │   (Chat & Insights)       │
└────────────────────┘    └──────────────────────────┘
             │
             ▼
┌────────────────────┐
│   Firebase Auth      │
│   (Identity Provider) │
└────────────────────┘
```

**Auth flow in one line:** the browser signs in with Firebase → gets a short-lived ID token → sends it as `Authorization: Bearer <token>` on every API call → Express verifies it with the Firebase Admin SDK → the request is mapped to (or auto-creates) a MongoDB `User` document via `firebaseUid`.

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| **Node.js** | v18+ |
| **npm** | v9+ |
| **MongoDB** | Atlas cluster or local instance |
| **Redis** | v6+ (local or cloud, e.g. Upstash) |
| **Firebase project** | with Email/Password and Google sign-in enabled |

### 1. Clone the Repository

```bash
git clone https://github.com/khushalsinghsankhla2808/finverse-ai.git
cd finverse-ai
```

### 2. Install Dependencies

```bash
# Root workspace (adds `concurrently` for running both apps together)
npm install

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 3. Configure Environment Variables

See the [Environment Variables](#-environment-variables) section below for the full list. At minimum you need a MongoDB URI and a Firebase project (client + admin credentials) to run the app; Redis, Gemini, Cloudinary, and email are optional and degrade gracefully.

### 4. Start Development Servers

```bash
# From the repo root — runs both frontend and backend concurrently
npm run dev:all
```

Or run them individually:

```bash
# Terminal 1 — Backend (http://localhost:5000)
npm run dev:backend

# Terminal 2 — Frontend (http://localhost:5173)
npm run dev:frontend
```

### 5. Open in Browser

Navigate to **[http://localhost:5173](http://localhost:5173)**, sign up (email/password or Google), and start tracking your finances.

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and fill in the values:

```env
# ── Server ─────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ── Database ───────────────────────────────────────
# MongoDB Atlas connection string — whitelist 0.0.0.0/0 for cloud hosts
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/FinVerse

# ── Redis ──────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── Google Gemini AI (optional — falls back to rule-based advisor) ──
GEMINI_API_KEY=

# ── Cloudinary (optional — falls back to local file storage) ──
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ── Email (optional, for notifications) ────────────
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=

# ── CORS ───────────────────────────────────────────
CLIENT_URL=http://localhost:5173

# ── Firebase Admin SDK ─────────────────────────────
# From Firebase Console → Project Settings → Service Accounts → Generate new private key
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ── Rate Limiting (optional — sensible defaults are built in) ──
# RL_AUTH_IP_WINDOW_MS=900000        # 15 min
# RL_AUTH_IP_MAX=10
# RL_AUTH_ACCOUNT_WINDOW_MS=1800000  # 30 min
# RL_AUTH_ACCOUNT_MAX_FAILED=5
# RL_AUTH_BACKOFF_BASE_MS=1000
# RL_AUTH_BACKOFF_CEILING_MS=128000
# RL_PUBLIC_WINDOW_MS=60000
# RL_PUBLIC_MAX=60
# RL_PUBLIC_BURST=10
# RL_AUTH_USER_WINDOW_MS=60000
# RL_AUTH_USER_MAX=200
# RL_GLOBAL_WINDOW_MS=900000
# RL_GLOBAL_MAX=500
```

### Frontend (`frontend/.env`)

The frontend uses the Firebase **client** SDK and fails fast at startup if any of these are missing:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Base URL of the backend API
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

> **Note:** `FIREBASE_PROJECT_ID` (backend) and `VITE_FIREBASE_PROJECT_ID` (frontend) must point to the **same** Firebase project so ID tokens issued client-side validate correctly server-side.

---

## 📡 API Reference

All routes are prefixed with `/api/v1` and require `Authorization: Bearer <Firebase ID Token>` unless marked otherwise.

### Auth & Account
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/sync` | Verify a Firebase ID token and create/link the MongoDB user profile | ❌ (token in header) |
| `POST` | `/auth/logout` | Log out (client-side Firebase sign-out; server just acknowledges) | ✅ |
| `GET` | `/auth/me` | Get the current authenticated user's profile | ✅ |
| `PUT` | `/auth/profile` | Update display name and/or currency | ✅ |
| `DELETE` | `/auth/account` | Permanently delete the account and cascade-delete all related data | ✅ |

### Transactions
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/transactions` | List transactions (filter by type/category/date, search, paginate, sort) | ✅ |
| `POST` | `/transactions` | Create a transaction | ✅ |
| `GET` | `/transactions/summary/month` | Get current-month income/expense summary | ✅ |
| `DELETE` | `/transactions/bulk` | Delete multiple transactions at once | ✅ |
| `GET` | `/transactions/:id` | Get a single transaction | ✅ |
| `PUT` | `/transactions/:id` | Update a transaction | ✅ |
| `DELETE` | `/transactions/:id` | Delete a transaction | ✅ |

### Budgets
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/budgets` | List all budgets | ✅ |
| `POST` | `/budgets` | Create a budget | ✅ |
| `PUT` | `/budgets/:id` | Update a budget | ✅ |
| `DELETE` | `/budgets/:id` | Delete a budget | ✅ |
| `POST` | `/budgets/:id/reset` | Reset a budget's spent amount | ✅ |

### Goals
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/goals` | List all savings goals | ✅ |
| `POST` | `/goals` | Create a goal | ✅ |
| `PUT` | `/goals/:id` | Update a goal | ✅ |
| `DELETE` | `/goals/:id` | Delete a goal | ✅ |
| `POST` | `/goals/:id/add-money` | Add money toward a goal | ✅ |

### Investments
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/investments` | List all investments | ✅ |
| `POST` | `/investments` | Add an investment | ✅ |
| `PUT` | `/investments/:id` | Update an investment | ✅ |
| `DELETE` | `/investments/:id` | Delete an investment | ✅ |

### Analytics
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/analytics/dashboard` | Dashboard KPI metrics | ✅ |
| `GET` | `/analytics/spending` | Category spending breakdown | ✅ |
| `GET` | `/analytics/trends` | Income vs. expense trends | ✅ |
| `GET` | `/analytics/monthly` | 6-month comparison | ✅ |
| `GET` | `/analytics/cashflow` | 7-day rolling cash flow | ✅ |

### AI Assistant
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/ai/suggestions` | Get suggested prompt questions | ❌ |
| `POST` | `/ai/chat` | Send a message to the AI advisor | ✅ |
| `GET` | `/ai/history` | Get chat session history | ✅ |
| `DELETE` | `/ai/history` | Clear all chat history | ✅ |
| `GET` | `/ai/insights` | Get automated AI-generated insights | ✅ |

### Reports
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/reports/generate` | Generate a PDF, Excel, or CSV report | ✅ |
| `GET` | `/reports/download/:filename` | Download a generated report (filename strictly validated) | ❌ |

### Health Check
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/health` | Server health status | ❌ |

---

## 📁 Project Structure

```text
finverse-ai/
├── backend/
│   ├── server.ts                     # Entry point — boots Express + MongoDB
│   ├── .env.example                  # Environment variable template
│   ├── tsconfig.json
│   ├── package.json
│   └── src/
│       ├── app.ts                    # Express app setup, middleware, routing map
│       ├── config/
│       │   ├── db.ts                 # MongoDB connection
│       │   ├── env.ts                # Zod-validated environment config
│       │   ├── redis.ts              # Redis client setup
│       │   ├── firebase.ts           # Firebase Admin SDK init
│       │   ├── cloudinary.ts         # Cloudinary SDK config
│       │   └── rateLimits.ts         # Centralized, env-driven rate-limit tiers
│       ├── controllers/
│       │   ├── auth.controller.ts    # Firebase sync, profile, account deletion
│       │   ├── transaction.controller.ts
│       │   ├── budget.controller.ts
│       │   ├── goal.controller.ts
│       │   ├── investment.controller.ts
│       │   ├── analytics.controller.ts
│       │   ├── ai.controller.ts      # Gemini AI chat + insights
│       │   └── report.controller.ts  # PDF/Excel/CSV generation
│       ├── middleware/
│       │   ├── auth.middleware.ts    # Firebase ID token verification guard
│       │   ├── error.middleware.ts   # Global error handler
│       │   ├── logger.middleware.ts  # Morgan + Winston, redacts sensitive fields
│       │   ├── rateLimiter.middleware.ts
│       │   ├── rateLimitStore.ts
│       │   └── validate.middleware.ts # Zod request validation (body/query/params)
│       ├── schemas/                  # Zod schemas for every route
│       ├── models/
│       │   ├── User.model.ts
│       │   ├── Transaction.model.ts
│       │   ├── Budget.model.ts
│       │   ├── Goal.model.ts
│       │   ├── Investment.model.ts   # totalInvested/currentValue/gainLoss virtuals
│       │   ├── AIHistory.model.ts    # Chat session persistence
│       │   └── Notification.model.ts
│       ├── routes/                   # Express route definitions, one file per resource
│       └── utils/
│           ├── format.utils.ts       # INR currency formatting
│           └── response.utils.ts     # Standardized API response helpers
│
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg                 # SVG sprite sheet
│   └── src/
│       ├── main.tsx                  # React DOM render entry
│       ├── App.tsx                   # Root component with RouterProvider
│       ├── router/
│       │   ├── index.tsx             # Route definitions with lazy loading
│       │   └── ProtectedRoute.tsx    # Auth guard wrapper
│       ├── pages/
│       │   ├── auth/                 # Login & register pages
│       │   ├── dashboard/            # Main dashboard
│       │   ├── transactions/
│       │   ├── analytics/
│       │   ├── budgets/
│       │   ├── goals/
│       │   ├── investments/
│       │   ├── ai/                   # AI chat interface
│       │   ├── reports/
│       │   └── settings/
│       ├── components/
│       │   ├── ui/                   # Reusable inputs, checkboxes, etc.
│       │   ├── common/                # Modal, ToastContainer, EmptyState, etc.
│       │   ├── layout/                # AppLayout, Sidebar, Topbar, MobileNav
│       │   ├── dashboard/             # KPICard, QuickActions
│       │   ├── auth/                  # Login/Register forms, AuthLayout
│       │   └── three/                 # FinanceGlobe + its error boundary
│       ├── stores/                    # Zustand stores: auth, finance, ui, currency
│       ├── services/                  # Axios service layer, one file per resource
│       ├── hooks/                     # useAuth, useTheme, useToast, useSidebar
│       ├── config/firebase.ts         # Firebase client SDK init
│       ├── types/                     # Shared TypeScript types
│       ├── lib/                       # axios instance, constants, utils
│       ├── styles/                    # Global & animation CSS
│       ├── __tests__/                 # Vitest unit tests
│       └── assets/
│
├── .github/workflows/security-audit.yml  # Weekly + on-push npm audit CI
├── package.json                          # Root workspace scripts
├── .gitignore
└── README.md
```

---

## 🧪 Scripts Reference

### Root (Workspace)
```bash
npm run dev:frontend    # Start Vite dev server (frontend)
npm run dev:backend     # Start nodemon + ts-node (backend)
npm run dev:all         # Start both concurrently
```

### Backend
```bash
cd backend
npm run dev             # Development with hot-reload (nodemon + ts-node)
npm run build           # Compile TypeScript to dist/
npm run start           # Run the compiled production build
```

### Frontend
```bash
cd frontend
npm run dev             # Vite dev server with HMR
npm run build           # TypeScript check + Vite production build
npm run preview         # Preview production build locally
npm run lint            # Run Oxlint
npm run test            # Run Vitest once
npm run test:watch      # Run Vitest in watch mode
npm run test:ui         # Run Vitest with the interactive UI
```

---

## 🔐 Security

FinVerse AI ships with several production-oriented protections out of the box:

- **Firebase-verified auth** — the backend never stores or handles passwords; every request is authenticated by verifying a Firebase ID token server-side.
- **Tiered rate limiting** — dual-axis per-IP + per-account limiting with exponential backoff on auth routes, per-user limits on authenticated routes, and a generous global fallback, all environment-configurable (see `rateLimits.ts`).
- **Strict input validation** — every route body/query/params is validated against a Zod schema in strict mode before it reaches a controller.
- **Data isolation** — every database query is scoped to `req.user.id`, so one user can never read or modify another user's data.
- **ReDoS-safe search** — user-supplied search strings are regex-escaped before being used in MongoDB queries.
- **Path-traversal-safe downloads** — report filenames are validated against a strict schema before being read from disk.
- **Log redaction** — sensitive fields (passwords, tokens, card numbers) are automatically stripped from request logs.
- **Security headers** — `helmet()` is applied globally; CORS is locked to an explicit `CLIENT_URL` allow-list.
- **Automated dependency audits** — a GitHub Actions workflow (`security-audit.yml`) runs `npm audit` on both the frontend and backend on every push/PR and weekly on a schedule, failing the build on high/critical vulnerabilities.

If you discover a security issue, please open a private security advisory on GitHub rather than a public issue.

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Contribution Guidelines
- Follow existing TypeScript and code style conventions (`oxlint` for the frontend)
- Write meaningful commit messages
- Ensure `npm run build` succeeds for both `frontend` and `backend` before submitting
- Add or update Vitest tests for any logic you touch
- Add appropriate comments for complex logic

---

## 📜 License

This project does not yet include a `LICENSE` file. Until one is added, all rights are reserved by the author. If you intend to open-source it, adding an [MIT License](https://choosealicense.com/licenses/mit/) file at the repository root is a common, permissive choice.

---

# 🌐 Connect With Me

<div align="center">

## 👨‍💻 Khushal Singh Sankhla

<p align="center">

  <a href="https://github.com/khushalsinghsankhla2808" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-khushalsinghsankhla2808-181717?style=for-the-badge&logo=github&logoColor=white" />
  </a>

  <a href="https://www.linkedin.com/in/khushal-singh-sankhla" target="_blank">
    <img src="https://img.shields.io/badge/LinkedIn-Khushal%20Singh%20Sankhla-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" />
  </a>

  <a href="mailto:khushalsinghsankhla203@gmail.com">
    <img src="https://img.shields.io/badge/Email-Contact-D14836?style=for-the-badge&logo=gmail&logoColor=white" />
  </a>

</p>

</div>

---

<p align="center">
  <sub>Built with ❤️ and a lot of ☕ — FinVerse AI</sub>
</p>
