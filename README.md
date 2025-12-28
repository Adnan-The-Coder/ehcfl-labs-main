# EHCF Labs - Healthcare Booking Platform

<div align="center">

<img alt="Status" src="https://img.shields.io/badge/status-under--development-orange" />

**A Modern Healthcare Test Booking Platform with Healthians API Integration**

[![React](https://img.shields.io/badge/React-18.3-blue?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.x-purple?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.x-blue?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange?style=for-the-badge&logo=cloudflare)](https://workers.cloudflare.com)
[![Hono](https://img.shields.io/badge/Hono-4.x-orange?style=for-the-badge&logo=hono)](https://hono.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-green?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-green?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team)
[![Bun](https://img.shields.io/badge/Bun-1.x-black?style=for-the-badge&logo=bun)](https://bun.sh)
[![React Query](https://img.shields.io/badge/React%20Query-5.x-red?style=for-the-badge&logo=reactquery)](https://tanstack.com/query)
[![Razorpay](https://img.shields.io/badge/Razorpay%20-green?style=for-the-badge&logo=razorpay)]()
[![Radix UI](https://img.shields.io/badge/Radix%20UI-1.x-black?style=for-the-badge&logo=radixui)](https://radix-ui.com)

</div>

## 🌟 Overview

EHCF Labs is a comprehensive healthcare test booking platform that allows users to book diagnostic tests and health packages with home sample collection. The platform integrates with the **Healthians API** for real-time package data, serviceability checks, and booking management.

### Key Highlights

- **Home Sample Collection**: Book health tests with doorstep sample pickup
- **Real-time Serviceability**: Check if services are available in your pincode
- **Multiple Test Packages**: Browse and book from various health packages
- **Order Tracking**: Track your booking status from confirmation to report delivery
- **Cart Management**: Add multiple tests, apply coupons, and checkout seamlessly

## 📁 Project Structure

```
ehcflabs-main/
├── cf-api/                     # Cloudflare Workers API (Hono + Drizzle)
│   ├── src/
│   │   ├── index.ts            # Main Hono app entry point
│   │   ├── controllers/        # API controllers
│   │   │   ├── booking/        # Booking management
│   │   │   ├── payment/        # Razorpay payment integration
│   │   │   └── user/           # User authentication
│   │   ├── db/                 # Database configuration
│   │   │   ├── schema.ts       # Drizzle ORM schema
│   │   │   └── index.ts        # D1 database connection
│   │   └── routes/             # API route handlers
│   │       ├── bookings.ts     # Booking CRUD operations
│   │       ├── payment.ts      # Payment endpoints
│   │       └── user.auth.ts    # Auth routes
│   ├── drizzle/                # Database migrations
│   ├── wrangler.jsonc          # Cloudflare Workers config
│   └── package.json            # Backend dependencies
├── backend/                    # Legacy Express.js Backend (deprecated)
│   ├── server.js               # Main server entry point
│   ├── models/                 # MongoDB Mongoose models
│   │   ├── Booking.js          # Booking schema
│   │   ├── BookingStatusHistory.js
│   │   └── WebhookLog.js       # Webhook logging
│   └── routes/                 # API route handlers
│       ├── auth.js             # Healthians authentication
│       ├── bookings.js         # Booking CRUD operations
│       ├── packages.js         # Health packages API
│       ├── serviceability.js   # Pincode serviceability
│       ├── timeslots.js        # Available time slots
│       └── webhooks.js         # Webhook handlers
├── src/                        # React Frontend Application
│   ├── components/             # Reusable UI components
│   │   ├── booking/            # Booking flow components
│   │   ├── tests/              # Test listing components
│   │   └── ui/                 # shadcn/ui components
│   ├── contexts/               # React Context providers
│   │   ├── CartContext.tsx     # Shopping cart state
│   │   └── PincodeContext.tsx  # Pincode/serviceability state
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities and mock data
│   ├── pages/                  # Page components
│   │   ├── Index.tsx           # Landing page
│   │   ├── Tests.tsx           # Test packages listing
│   │   ├── Cart.tsx            # Shopping cart
│   │   ├── Booking.tsx         # Multi-step booking flow
│   │   ├── Confirmation.tsx    # Booking confirmation
│   │   ├── Track.tsx           # Order tracking
│   │   ├── MyOrders.tsx        # Order history
│   │   └── AuthCallback.tsx    # OAuth callback handler
│   ├── services/               # API service layer
│   │   └── healthiansApi.ts    # Healthians API integration
│   └── utils/                  # Utility functions
│       ├── razorpay.ts         # Razorpay payment helpers
│       └── supabase/           # Supabase client config
├── public/                     # Static assets
└── package.json                # Project dependencies
```

## ✨ Features

### Frontend Features
- **Landing Page**: Hero section with pincode check, category grid, popular packages
- **Test Packages Browse**: Search, filter, and explore health test packages
- **Shopping Cart**: Add/remove items, apply coupons, view discounts
- **Authentication**: Google OAuth and email/password via Supabase Auth
- **User Profiles**: Auto-created profiles with geolocation tracking
- **Multi-step Booking Flow**:
  - Customer details entry
  - Address collection
  - Date & time slot selection
  - Review and payment (Razorpay integration)
- **Payment Gateway**: Secure online payments with Razorpay
- **Order Tracking**: Real-time status updates with visual timeline
- **Order Management**: View, reschedule, cancel, or add tests to bookings
- **Responsive Design**: Mobile-first UI with Tailwind CSS

### Backend Features
- **Cloudflare Workers**: Serverless edge computing with Hono.js
- **D1 Database**: SQLite database at the edge with Drizzle ORM
- **User Authentication**: Bearer token validation with UUID lookup
- **Booking Management**: Create, update, track bookings with API
- **Payment Processing**: Razorpay order creation and signature verification
- **Healthians API Integration**: OAuth authentication, packages, serviceability (legacy)
- **Webhook Support**: Real-time status updates from Healthians (legacy)

### UI/UX
- **shadcn/ui Components**: Modern, accessible component library
- **Dark Mode Support**: Theme switching with next-themes
- **Toast Notifications**: User feedback with Sonner
- **Form Validation**: React Hook Form with Zod schemas

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ or **Bun 1.x** (recommended)
- Cloudflare account for D1 database and Workers deployment
- Supabase account for authentication
- Healthians API credentials (legacy)
- Razorpay account for payment gateway

### 1. Clone the Repository

```bash
git clone <repo-url>
cd ehcflabs-main
```

### 2. Install Dependencies

Using Bun (recommended):
```bash
bun install
cd cf-api && bun install
```

Or using npm:
```bash
npm install
cd cf-api && npm install
```

### 3. Environment Setup

**Frontend `.env` file in root directory:**

```env
# Supabase Authentication
VITE_PUBLIC_SUPABASE_URL=your_supabase_project_url
VITE_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API
VITE_BACKEND_API_BASE_URL=http://127.0.0.1:8787

# IPInfo for Geolocation
VITE_PUBLIC_IP_INFO_TOKEN=your_ipinfo_token

# Razorpay Payment Gateway
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
```

**Backend `cf-api/.env` file:**

```env
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_DETAILED_LOGGING=true
accountId=your_cloudflare_account_id
databaseId=your_d1_database_id

# Razorpay Credentials
RAZORPAY_LIVE_KEY_ID=rzp_test_your_key_id
RAZORPAY_LIVE_KEY_SECRET=your_secret_key
```

### 4. Database Setup

**Create D1 Database:**
```bash
cd cf-api
npx wrangler d1 create ehcflabs
```

**Run Migrations:**
```bash
bun migrate
# or
npm run migrate
```

### 5. Run the Application

**Start the Backend (Cloudflare Workers):**
```bash
cd cf-api
bun run dev
# or
npm run dev
```
The backend will run on `http://localhost:8787`

**Start the Frontend Development Server:**
```bash
bun run dev
# or
npm run dev
```
The frontend will run on `http://localhost:5173`

## 📦 Available Scripts

### Frontend Scripts
| Script | Description |
|--------|-------------|
| `bun run dev` | Start Vite frontend development server |
| `bun run build` | Build frontend for production |
| `bun run build:dev` | Build frontend in development mode |
| `bun run lint` | Run ESLint on the codebase |
| `bun run preview` | Preview production build |

### Backend Scripts (cf-api)
| Script | Description |
|--------|-------------|
| `bun run dev` | Start Cloudflare Workers dev server (Wrangler) |
| `bun run deploy` | Deploy to Cloudflare Workers (production) |
| `bun run migrate` | Run D1 database migrations |
| `bun run generate` | Generate Drizzle migrations from schema |
| `bun run studio` | Open Drizzle Studio (database GUI) |

## 🛣️ Application Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Index | Landing page with hero, categories, packages |
| `/tests` | Tests | Browse and search health packages |
| `/cart` | Cart | View cart items and apply coupons |
| `/booking` | Booking | Multi-step booking flow with payment |
| `/confirmation` | Confirmation | Booking success page |
| `/track` | Track | Track order status by ID or phone |
| `/my-orders` | MyOrders | View and manage all bookings |
| `/auth/callback` | AuthCallback | OAuth redirect handler (Google) |

## 🔌 API Endpoints

The Cloudflare Workers backend (Hono.js) provides the following API routes:

### User Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/users` | POST | Create user profile with geolocation |
| `/users` | GET | Get all user profiles |
| `/users/:uuid` | GET | Get user profile by UUID |
| `/users/:uuid` | PATCH | Update user profile |

### Booking Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/bookings` | POST | Create a new booking |
| `/bookings` | GET | Get all bookings |
| `/bookings/:bookingId` | GET | Get booking by ID |
| `/bookings/user/:userUuid` | GET | Get all bookings for a user |
| `/bookings/:bookingId` | PUT/PATCH | Update booking status |
| `/bookings/:bookingId` | DELETE | Delete a booking |

### Payment Processing
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/payment/create-order` | POST | Bearer | Create Razorpay order |
| `/payment/verify-order` | POST | Bearer | Verify payment signature |

### Legacy Healthians API (backend/)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/healthians-auth` | POST | Get Healthians access token |
| `/api/healthians-packages` | POST | Fetch available health packages |
| `/api/healthians-serviceability` | POST | Check pincode serviceability |
| `/api/healthians-timeslots` | POST | Get available time slots |
| `/api/healthians-create-booking` | POST | Create a new booking |
| `/api/healthians-webhook` | POST | Receive status updates |

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **React Router v6** - Client-side routing
- **TanStack Query** - Server state management
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Accessible component library (Radix UI)
- **React Hook Form** - Form handling with Zod validation
- **Lucide React** - Icon library
- **Recharts** - Charting library
- **date-fns** - Date utility library
- **Sonner** - Toast notifications
- **Supabase** - Authentication (Google OAuth + Email/Password)
- **Razorpay** - Payment gateway integration

### Backend
- **Cloudflare Workers** - Serverless edge computing platform
- **Hono.js 4** - Fast, lightweight web framework for edge
- **Cloudflare D1** - SQLite database at the edge
- **Drizzle ORM** - Type-safe SQL ORM with migrations
- **Bun** - Fast JavaScript runtime (development)
- **Razorpay SDK** - Payment processing with signature verification
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### DevOps & Deployment
- **GitHub Actions** - CI/CD pipeline automation
- **Cloudflare Pages** - Frontend hosting and deployment
- **Wrangler** - Cloudflare Workers CLI and local development
- **Drizzle Kit** - Database migration management

### Authentication & Security
- **Supabase Auth** - User authentication with Google OAuth
- **Bearer Token** - API authentication with UUID validation
- **HMAC SHA256** - Payment signature verification
- **IPInfo.io** - Geolocation tracking for user profiles

## 📱 Pages Overview

### Landing Page (`/`)
- Hero section with pincode serviceability check
- Category grid for quick navigation
- Popular packages showcase
- "How It Works" section
- "Why Choose Us" features
- Footer with links

### Tests Page (`/tests`)
- Search and filter health packages
- Package cards with pricing and details
- Add to cart functionality
- Skeleton loading states

### Cart Page (`/cart`)
- View cart items with quantity controls
- Apply coupon codes
- View MRP, discount, and final price
- Proceed to booking

### Booking Page (`/booking`)
- **Step 1**: Customer details (name, age, gender, phone, email)
- **Step 2**: Address collection (full address with pincode)
- **Step 3**: Date and time slot selection
- **Step 4**: Review order and confirm booking

### Tracking Page (`/track`)
- Search by booking ID or phone number
- Visual status timeline
- Status stages: Confirmed → Scheduled → Reached → Collected → Lab → Testing → Ready

### My Orders Page (`/my-orders`)
- Tabs: Active, Completed, Cancelled
- Reschedule bookings
- Cancel bookings
- Add more tests to existing bookings
- Download reports

## 🔧 Troubleshooting

**D1 Database Issues:**
- Ensure migrations have been run: `cd cf-api && bun migrate`
- Check `databaseId` in `cf-api/.env` matches your D1 database
- Verify D1 database exists: `npx wrangler d1 list`

**Cloudflare Workers Errors:**
- Check `compatibility_flags` includes `nodejs_compat` in `wrangler.jsonc`
- Verify environment variables in `cf-api/.env`
- Check logs: `npx wrangler tail`

**Supabase Authentication Issues:**
- Verify `VITE_PUBLIC_SUPABASE_URL` and `VITE_PUBLIC_SUPABASE_ANON_KEY` in `.env`
- Check OAuth redirect URLs configured in Supabase dashboard
- Ensure Google OAuth credentials are set up correctly

**Razorpay Payment Errors:**
- Use test keys during development: `rzp_test_xxxxx`
- Verify keys in both frontend `.env` and `cf-api/.env`
- Check CORS allows your frontend origin in `cf-api/src/index.ts`

**API Errors:**
- Check `VITE_BACKEND_API_BASE_URL` points to your Workers API
- Verify backend is running: `cd cf-api && bun run dev`
- Check browser console for CORS errors

**Port Conflicts:**
- Frontend runs on port 5173 by default (Vite)
- Backend runs on port 8787 by default (Wrangler)
- Modify in `vite.config.ts` or `wrangler.jsonc`

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Branch Naming
- `feat/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/update-description` - Documentation
- `refactor/code-area` - Code refactoring

### Commit Messages
Use conventional commits:
- `feat: add user authentication`
- `fix: resolve cart calculation bug`
- `docs: update README`
- `refactor: optimize API calls`

### Pull Request Process
1. Create branch from `main` or `dev`
2. Make changes and test locally
3. Submit PR with clear description
4. Wait for review and approval

## 📄 License

This project is proprietary software. All rights reserved.

---

<div align="center">

**EHCF Labs** - Your Trusted Healthcare Partner

Built with ❤️ using React, Cloudflare Workers, Hono.js, Drizzle ORM, and Supabase

</div>

## 👨‍💻 Author **[Adnan](https://github.com/Adnan-the-coder)**
