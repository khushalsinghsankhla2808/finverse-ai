<p align="center">
  <img src="frontend/public/favicon.svg" alt="FinVerse AI Logo" width="80" height="80" />
</p>

<h1 align="center">FinVerse AI</h1>

<p align="center">
  <strong>Your AI-Powered Personal Finance Command Center</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-contributing">Contributing</a> •
  <a href="#-license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Gemini_AI-Powered-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
</p>

---

## 📖 About

**FinVerse AI** is a full-stack personal finance management platform built for the modern Indian investor. It combines intelligent transaction tracking, budget management, investment portfolio monitoring, and savings goal planning — all enhanced by a conversational AI advisor powered by Google Gemini.

The platform features a premium glassmorphic dark-mode UI with 3D visualizations, real-time analytics dashboards, and automated financial report generation in PDF and Excel formats.

---

## ✨ Features

### 💰 Transaction Management
- Full CRUD operations for income and expense transactions
- Category-based organization (Housing, Food, Transport, Shopping, etc.)
- Merchant tracking and notes support
- Recurring transaction patterns
- Bulk filtering, sorting, and search

### 📊 Analytics Dashboard
- **KPI Cards** — Total balance, monthly income/expenses, savings rate
- **Spending Breakdown** — Category-wise donut charts with percentage allocations
- **Income vs. Expense Trends** — Daily, weekly, and monthly trend visualizations
- **Cash Flow Analysis** — 7-day rolling cash flow with income/expense bars
- **Monthly Comparison** — 6-month side-by-side financial performance

### 🎯 Budget Tracking
- Set category-wise monthly spending limits
- Real-time progress bars with overspend alerts
- Automatic budget utilization calculations
- Visual indicators for budget health

### 🏆 Savings Goals
- Create named savings targets with deadlines
- Track progress with percentage completion
- Automated remaining amount and pace calculations
- Goal completion status tracking

### 📈 Investment Portfolio
- Track investments across **6 asset classes**: Stocks, Mutual Funds, Gold, Crypto, Fixed Deposits, and Others
- Auto-calculated gain/loss (₹ and %) via Mongoose virtuals
- Purchase price vs. current price tracking
- Platform and symbol tagging

### 🤖 AI Financial Advisor
- **Conversational Chat** — Natural language financial Q&A powered by Google Gemini 1.5 Flash
- **Context-Aware** — Automatically injects your real financial data (transactions, budgets, goals) into every query
- **Automated Insights** — AI-generated spending warnings, savings milestones, and goal deadline alerts
- **Chat History** — Persistent session-based conversation logs
- **Smart Suggestions** — Pre-built prompt questions like _"Where am I spending the most?"_ and _"Am I on track with my goals?"_
- **Graceful Fallback** — Rule-based mock advisor when Gemini API key is not configured

### 📄 Report Generation
- **PDF Reports** — Branded, multi-page financial statements with cover page, summary metrics, expense allocation tables, and transaction ledgers
- **Excel Reports** — Multi-sheet workbooks (Summary + Transactions) with styled headers
- **CSV Export** — Lightweight data exports
- **Cloud Upload** — Automatic Cloudinary upload with download links (falls back to local file serving)
- **Custom Date Ranges** — Filter reports by date range and specific categories

### 🔐 Authentication & Security
- **JWT Authentication** — Access + refresh token rotation with secure handling
- **Production-Grade Rate Limiting** — Centralized, environment-driven multi-tier limits:
  - *Auth Tier*: Dual-axis per-IP (10 req / 15 min) and per-account failed-attempt limiting (5 fails / 30 min) with exponential backoff and automatic reset.
  - *Public Tier*: Per-IP with burst allowance (60 + 10 requests / min).
  - *Authenticated User Actions*: Per-userId (200 requests / min) tracking separate windows.
- **Strict Input Validation** — Custom validate middleware applying Zod schemas on req.body, req.query, and req.params in strict mode.
- **Secure Error Handling** — Centralized mapping (ValidationError, CastError, MongoError) returning safe client responses with unique, traceable UUID `errorId` for 500 errors.
- **Data Protection** — Automatic redaction of sensitive body fields (passwords, tokens, cards) from backend logs.
- **Path Traversal Mitigation** — Strict validation of filename parameters and path confinement for report downloads.
- **ReDoS Prevention** — Sanitization of user-controlled inputs using RegExp escaping in queries.
- **Dependency Hardening** — Full dependency audit resolution with forced overrides for transitive vulnerabilities and integrated GitHub Actions security audit.


### ⚙️ Settings & Account Management
- **Profile Customization** — Edit display name with validation support.
- **Currency Preferences** — Configure currency with flag representations that instantly synchronize across the application and backend.
- **Password Control** — Update account password with confirmation matching and validation constraints.
- **Cascading Account Deletion** — IRREVERSIBLE delete option that safely wipes user profile, budgets, goals, transactions, investments, notifications, and AI logs in one cascade process.

### 🎨 Premium UI/UX
- **Glassmorphic Dark Theme** — Deep purple palette with frosted glass effects
- **3D Globe Visualization** — Interactive Three.js finance globe on the dashboard
- **Framer Motion Animations** — Page transitions, hover effects, and micro-interactions
- **Responsive Design** — Mobile-first layout with collapsible sidebar
- **Lazy Loading** — Code-split routes with suspense fallbacks
- **Custom 404 Page** — Themed "Lost in the FinVerse" error page

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework with latest concurrent features |
| **TypeScript** | Type-safe development |
| **Vite 8** | Lightning-fast build tooling |
| **Tailwind CSS 4** | Utility-first styling |
| **Zustand** | Lightweight state management |
| **React Router v7** | Client-side routing with protected routes |
| **Recharts** | Data visualization and charting |
| **Framer Motion** | Animations and page transitions |
| **React Three Fiber** | 3D WebGL visualizations |
| **React Hook Form + Zod** | Form handling with schema validation |
| **Axios** | HTTP client for API communication |
| **Lucide React** | Icon library |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **TypeScript** | Type-safe backend |
| **MongoDB + Mongoose** | NoSQL database with schema modeling |
| **Redis (ioredis)** | Caching layer for analytics and AI insights |
| **Google Generative AI** | Gemini 1.5 Flash for AI chat and insights |
| **JWT (jsonwebtoken)** | Authentication tokens |
| **PDFKit** | PDF report generation |
| **ExcelJS** | Excel workbook generation |
| **Cloudinary** | Cloud file storage for reports |
| **Winston + Morgan** | Structured logging |
| **Zod** | Runtime environment and request validation |
| **Helmet** | HTTP security headers |
| **Nodemailer** | Email notifications |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│  React 19 + Vite + Zustand + React Router + Three.js + Recharts │
└──────────────────────────┬───────────────────────────────────────┘
                           │  Axios (REST API)
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    EXPRESS API SERVER (:5000)                     │
│                                                                  │
│  ┌────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │ Helmet │  │ Rate     │  │ Morgan   │  │ JWT Auth           │ │
│  │ CORS   │  │ Limiter  │  │ Logger   │  │ Middleware         │ │
│  └────────┘  └──────────┘  └──────────┘  └────────────────────┘ │
│                                                                  │
│  ┌─────────────────────── ROUTES ──────────────────────────────┐ │
│  │ /auth  /transactions  /budgets  /goals  /investments        │ │
│  │ /analytics  /ai  /reports                                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──── CONTROLLERS ────┐  ┌──── MODELS ────────────────────────┐│
│  │ Auth, Transaction,  │  │ User, Transaction, Budget, Goal,   ││
│  │ Budget, Goal,       │  │ Investment, AIHistory, Notification ││
│  │ Investment, AI,     │  │                                    ││
│  │ Analytics, Report   │  │                                    ││
│  └─────────────────────┘  └────────────────────────────────────┘│
└────────────┬──────────────────────────┬─────────────────────────┘
             │                          │
             ▼                          ▼
┌────────────────────┐    ┌──────────────────────────┐
│   MongoDB Atlas    │    │   Redis Cache            │
│   (Primary DB)     │    │   (Analytics & Insights) │
└────────────────────┘    └──────────────────────────┘
             │
             ▼
┌────────────────────┐    ┌──────────────────────────┐
│   Cloudinary       │    │   Google Gemini AI       │
│   (Report Storage) │    │   (Chat & Insights)      │
└────────────────────┘    └──────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| **Node.js** | v18+ |
| **npm** | v9+ |
| **MongoDB** | Atlas cluster or local instance |
| **Redis** | v6+ (local or cloud) |

### 1. Clone the Repository

```bash
git clone https://github.com/khushalsinghsankhla2808/finverse-ai.git
cd finverse-ai
```

### 2. Install Dependencies

```bash
# Install root workspace dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 3. Configure Environment Variables

Create a `backend/.env` file using the template below:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB (replace with your Atlas connection string)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/FinVerse?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=<your-64-char-hex-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<your-64-char-hex-secret>
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# Cloudinary (optional — falls back to local file storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google Gemini AI (optional — falls back to rule-based advisor)
GEMINI_API_KEY=your-gemini-api-key

# Email (optional — for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173

# Rate Limiting (Optional - defaults mapped automatically)
# RL_AUTH_IP_WINDOW_MS=900000        # 15 minutes
# RL_AUTH_IP_MAX=10                 # 10 requests max
# RL_AUTH_ACCOUNT_WINDOW_MS=1800000 # 30 minutes
# RL_AUTH_ACCOUNT_MAX_FAILED=5      # 5 failures max
# RL_AUTH_BACKOFF_BASE_MS=1000      # 1s base delay
# RL_AUTH_BACKOFF_CEILING_MS=128000 # 128s max ceiling
# RL_PUBLIC_WINDOW_MS=60000         # 1 minute
# RL_PUBLIC_MAX=60                  # 60 requests max
# RL_PUBLIC_BURST=10                # 10 burst allowance
# RL_AUTH_USER_WINDOW_MS=60000      # 1 minute
# RL_AUTH_USER_MAX=200              # 200 requests max
# RL_GLOBAL_WINDOW_MS=900000        # 15 minutes
# RL_GLOBAL_MAX=500                 # 500 requests safety net
```

> **💡 Tip:** Generate secure JWT secrets with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 4. Start Development Servers

```bash
# Start both frontend and backend concurrently
npm run dev:all
```

Or start them individually:

```bash
# Terminal 1 — Backend (Port 5000)
npm run dev:backend

# Terminal 2 — Frontend (Port 5173)
npm run dev:frontend
```

### 5. Open in Browser

Navigate to **[http://localhost:5173](http://localhost:5173)** — register an account and start tracking your finances!

---

## 📡 API Reference

All API routes are prefixed with `/api/v1`. Protected routes require a `Bearer` token in the `Authorization` header.

### Authentication & Account
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Create new user account | ❌ |
| `POST` | `/api/v1/auth/login` | Login and receive tokens | ❌ |
| `POST` | `/api/v1/auth/refresh` | Refresh access token | ❌ |
| `POST` | `/api/v1/auth/logout` | Log out and invalidate session token | ✅ |
| `GET` | `/api/v1/auth/me` | Fetch currently authenticated user profile | ✅ |
| `PUT` | `/api/v1/auth/profile` | Update profile information (name, currency) | ✅ |
| `PUT` | `/api/v1/auth/password` | Change account password securely | ✅ |
| `DELETE` | `/api/v1/auth/account` | Permanently delete account and all data | ✅ |

### Transactions
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/transactions` | List all transactions | ✅ |
| `POST` | `/api/v1/transactions` | Create a transaction | ✅ |
| `PUT` | `/api/v1/transactions/:id` | Update a transaction | ✅ |
| `DELETE` | `/api/v1/transactions/:id` | Delete a transaction | ✅ |

### Budgets
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/budgets` | List all budgets | ✅ |
| `POST` | `/api/v1/budgets` | Create a budget | ✅ |
| `PUT` | `/api/v1/budgets/:id` | Update a budget | ✅ |
| `DELETE` | `/api/v1/budgets/:id` | Delete a budget | ✅ |

### Goals
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/goals` | List all savings goals | ✅ |
| `POST` | `/api/v1/goals` | Create a goal | ✅ |
| `PUT` | `/api/v1/goals/:id` | Update a goal | ✅ |
| `DELETE` | `/api/v1/goals/:id` | Delete a goal | ✅ |

### Investments
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/investments` | List all investments | ✅ |
| `POST` | `/api/v1/investments` | Add an investment | ✅ |
| `PUT` | `/api/v1/investments/:id` | Update an investment | ✅ |
| `DELETE` | `/api/v1/investments/:id` | Delete an investment | ✅ |

### Analytics
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/analytics/dashboard` | Dashboard KPI metrics | ✅ |
| `GET` | `/api/v1/analytics/spending` | Category spending breakdown | ✅ |
| `GET` | `/api/v1/analytics/trends` | Income vs expense trends | ✅ |
| `GET` | `/api/v1/analytics/monthly` | 6-month comparison | ✅ |
| `GET` | `/api/v1/analytics/cashflow` | 7-day cash flow | ✅ |

### AI Assistant
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/ai/chat` | Send message to AI advisor | ✅ |
| `GET` | `/api/v1/ai/history` | Get chat session history | ✅ |
| `DELETE` | `/api/v1/ai/history` | Clear all chat history | ✅ |
| `GET` | `/api/v1/ai/insights` | Get automated AI insights | ✅ |
| `GET` | `/api/v1/ai/suggestions` | Get suggested prompts | ✅ |

### Reports
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/reports/generate` | Generate PDF/Excel/CSV report | ✅ |
| `GET` | `/api/v1/reports/download/:filename` | Download a generated report | ❌ |

### Health Check
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/health` | Server health status | ❌ |

---

## 📁 Project Structure

```
finverse-ai/
├── backend/
│   ├── server.ts                    # Entry point — boots Express + MongoDB
│   ├── .env                         # Environment variables (git-ignored)
│   ├── tsconfig.json                # TypeScript configuration
│   ├── package.json                 # Backend dependencies
│   └── src/
│       ├── app.ts                   # Express app setup, middleware, routes
│       ├── config/
│       │   ├── db.ts                # MongoDB connection
│       │   ├── env.ts               # Zod-validated environment config
│       │   ├── redis.ts             # Redis client setup
│       │   └── cloudinary.ts        # Cloudinary SDK config
│       ├── controllers/
│       │   ├── auth.controller.ts   # Register, login, token refresh
│       │   ├── transaction.controller.ts
│       │   ├── budget.controller.ts
│       │   ├── goal.controller.ts
│       │   ├── investment.controller.ts
│       │   ├── analytics.controller.ts
│       │   ├── ai.controller.ts     # Gemini AI chat + insights
│       │   └── report.controller.ts # PDF/Excel/CSV generation
│       ├── middleware/
│       │   ├── auth.middleware.ts    # JWT verification guard
│       │   ├── error.middleware.ts   # Global error handler
│       │   ├── logger.middleware.ts  # Morgan + Winston logging
│       │   └── validate.middleware.ts # Zod request validation
│       ├── schemas/                 # Strict Zod schemas for input validation
│       │   ├── auth.schema.ts
│       │   ├── transaction.schema.ts
│       │   ├── budget.schema.ts
│       │   ├── goal.schema.ts
│       │   ├── investment.schema.ts
│       │   ├── report.schema.ts
│       │   ├── ai.schema.ts
│       │   └── common.schema.ts
│       ├── models/
│       │   ├── User.model.ts
│       │   ├── Transaction.model.ts
│       │   ├── Budget.model.ts
│       │   ├── Goal.model.ts
│       │   ├── Investment.model.ts  # With computed virtuals
│       │   ├── AIHistory.model.ts   # Chat session persistence
│       │   └── Notification.model.ts
│       ├── routes/                  # Express route definitions
│       └── utils/
│           ├── bcrypt.utils.ts      # Password hashing helpers
│           ├── jwt.utils.ts         # Token sign/verify utilities
│           ├── format.utils.ts      # INR currency formatter
│           └── response.utils.ts    # Standardized API responses
│
├── frontend/
│   ├── index.html                   # HTML entry point
│   ├── vite.config.ts               # Vite build configuration
│   ├── package.json                 # Frontend dependencies
│   ├── public/
│   │   ├── favicon.svg              # App icon
│   │   └── icons.svg                # SVG sprite sheet
│   └── src/
│       ├── main.tsx                 # React DOM render entry
│       ├── App.tsx                  # Root component with RouterProvider
│       ├── index.css                # Global styles
│       ├── router/
│       │   ├── index.tsx            # Route definitions with lazy loading
│       │   └── ProtectedRoute.tsx   # Auth guard wrapper
│       ├── pages/
│       │   ├── auth/                # Login & Register pages
│       │   ├── dashboard/           # Main dashboard
│       │   ├── transactions/        # Transaction management
│       │   ├── analytics/           # Charts & data visualization
│       │   ├── budgets/             # Budget tracking
│       │   ├── goals/               # Savings goals
│       │   ├── investments/         # Portfolio tracker
│       │   ├── ai/                  # AI chat interface
│       │   └── reports/             # Report generation UI
│       ├── components/
│       │   ├── ui/                  # Reusable form inputs
│       │   ├── common/              # PageTransition, shared components
│       │   ├── layout/              # AppLayout, sidebar, header
│       │   ├── dashboard/           # KPI cards, quick actions
│       │   ├── auth/                # Auth form components
│       │   └── three/               # 3D globe visualization
│       ├── stores/
│       │   ├── authStore.ts         # Authentication state (Zustand)
│       │   ├── financeStore.ts      # Finance data state (Zustand)
│       │   ├── currencyStore.ts     # Currency formatting state
│       │   └── uiStore.ts           # UI preferences state
│       ├── services/                # Axios API service layer
│       ├── hooks/                   # Custom React hooks
│       ├── types/                   # TypeScript type definitions
│       ├── styles/                  # Additional CSS modules
│       ├── lib/                     # Utility functions
│       └── assets/                  # Static assets
│
├── package.json                     # Root workspace with concurrent scripts
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
npm run dev             # Development with hot-reload
npm run build           # Compile TypeScript to dist/
npm run start           # Run compiled production build
```

### Frontend
```bash
cd frontend
npm run dev             # Vite dev server with HMR
npm run build           # TypeScript check + Vite production build
npm run preview         # Preview production build locally
npm run lint            # Run Oxlint
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Contribution Guidelines
- Follow existing TypeScript and code style conventions
- Write meaningful commit messages
- Ensure your code builds without errors before submitting
- Add appropriate comments for complex logic

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Khushal Singh Sankhla**

- GitHub: [@khushalsinghsankhla2808](https://github.com/khushalsinghsankhla2808)

---

<p align="center">
  <sub>Built with ❤️ and a lot of ☕ — FinVerse AI © 2025</sub>
</p>
