# EHCF Labs - Healthcare Booking Platform

<div align="center">

<img alt="Status" src="https://img.shields.io/badge/status-under--development-orange" />

**A Modern Healthcare Test Booking Platform with Healthians API Integration**

[![React](https://img.shields.io/badge/React-18.3-blue?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.x-purple?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.x-blue?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5.x-black?style=for-the-badge&logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green?style=for-the-badge&logo=mongodb)](https://mongodb.com)
[![React Query](https://img.shields.io/badge/React%20Query-5.x-red?style=for-the-badge&logo=reactquery)](https://tanstack.com/query)
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
├── backend/                    # Express.js Backend Server
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
│   │   └── MyOrders.tsx        # Order history
│   └── services/               # API service layer
│       └── healthiansApi.ts    # Healthians API integration
├── public/                     # Static assets
└── package.json                # Project dependencies
```

## ✨ Features

### Frontend Features
- **Landing Page**: Hero section with pincode check, category grid, popular packages
- **Test Packages Browse**: Search, filter, and explore health test packages
- **Shopping Cart**: Add/remove items, apply coupons, view discounts
- **Multi-step Booking Flow**:
  - Customer details entry
  - Address collection
  - Date & time slot selection
  - Review and payment
- **Order Tracking**: Real-time status updates with visual timeline
- **Order Management**: View, reschedule, cancel, or add tests to bookings
- **Responsive Design**: Mobile-first UI with Tailwind CSS

### Backend Features
- **Healthians API Integration**: OAuth authentication, packages, serviceability
- **Booking Management**: Create, update, track bookings
- **Webhook Support**: Real-time status updates from Healthians
- **MongoDB Storage**: Persistent booking and status history

### UI/UX
- **shadcn/ui Components**: Modern, accessible component library
- **Dark Mode Support**: Theme switching with next-themes
- **Toast Notifications**: User feedback with Sonner
- **Form Validation**: React Hook Form with Zod schemas

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB instance (local or cloud)
- Healthians API credentials

### 1. Clone the Repository

```bash
git clone <repo-url>
cd ehcflabs-main
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Or using Bun:
```bash
bun install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Backend
MONGODB_URI=mongodb://localhost:27017/healthcare_booking
PORT=3001

# Healthians API
HEALTHIANS_CLIENT_ID=your_client_id
HEALTHIANS_CLIENT_SECRET=your_client_secret
HEALTHIANS_API_URL=https://api.healthians.com

# Frontend (Vite)
VITE_API_URL=http://localhost:3001/api
```

### 4. Run the Application

**Start the Backend Server:**
```bash
npm run server
```
The backend will run on `http://localhost:3001`

**Start the Frontend Development Server:**
```bash
npm run dev
```
The frontend will run on `http://localhost:8080`

**Run Both Concurrently:**
You can run both servers in separate terminals or use a process manager.

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite frontend development server |
| `npm run server` | Start Express backend server with nodemon |
| `npm run build` | Build frontend for production |
| `npm run build:dev` | Build frontend in development mode |
| `npm run lint` | Run ESLint on the codebase |
| `npm run preview` | Preview production build |

## 🛣️ Application Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Index | Landing page with hero, categories, packages |
| `/tests` | Tests | Browse and search health packages |
| `/cart` | Cart | View cart items and apply coupons |
| `/booking` | Booking | Multi-step booking flow |
| `/confirmation` | Confirmation | Booking success page |
| `/track` | Track | Track order status |
| `/my-orders` | MyOrders | View and manage all bookings |

## 🔌 API Endpoints

The backend provides the following API routes:

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

### Backend
- **Express 5** - Node.js web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

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

**MongoDB Connection Issues:**
- Ensure MongoDB is running locally or cloud URI is correct
- Check `MONGODB_URI` in `.env` file

**API Errors:**
- Verify Healthians API credentials
- Check `VITE_API_URL` points to your backend

**Port Conflicts:**
- Frontend runs on port 8080 by default
- Backend runs on port 3001 by default
- Modify in `vite.config.ts` or server configuration

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

Built with ❤️ using React, Express, and MongoDB

</div>

## 👨‍💻 Author **[Adnan](https://github.com/Adnan-the-coder)**
