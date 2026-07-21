# Payment Gateway Dashboard

A comprehensive MERN (MongoDB, Express, React, Node.js) application for managing payment transactions, user accounts, and financial operations. This dashboard provides role-based access for **Admins**, **Users**, and **Agents** with complete payment processing capabilities.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [User Roles & Permissions](#user-roles--permissions)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### Admin Features
- 👥 **User Management**: Add, edit, view, and manage merchant users
- 💰 **Wallet Management**: Top up user wallets and manage fund requests
- 💸 **Payout Management**: Process individual and bulk payouts
- 📊 **Reports**: View wallet transactions, payout reports, and chargeback reports
- 🔄 **Settlement**: Manage settlement transactions and history
- 💳 **Chargeback Management**: Handle chargebacks and view chargeback reports
- ⚙️ **Staff Management**: Manage staff members
- 📈 **Dashboard**: Real-time analytics and financial metrics
- 💼 **Charges Configuration**: Set platform and merchant-specific charges

### User Features
- 👤 **Profile Management**: Update personal and business information
- 💰 **Wallet Report**: Track wallet transactions and balance
- 📊 **Payout Report**: View all payout transactions
- 💵 **Fund Requests**: Request additional funds
- 🔑 **Developer Settings**: Manage API credentials
- 📖 **API Documentation**: Access integration guides

### Agent Features
- 💰 **Wallet Report**: View agent wallet and transactions
- 📊 **Payout Report**: Track agent payouts
- 🔑 **Developer Settings**: Manage agent API keys
- 📖 **Development Docs**: Access API integration documentation

## 🛠 Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MySQL** - Primary database (via Sequelize ORM)
- **MongoDB** - Secondary database
- **JWT** - Authentication
- **Bull** - Job queue (with Redis)
- **Winston** - Logging
- **Morgan** - HTTP request logger
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router v6** - Navigation
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications

## 📦 Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MySQL** (v5.7 or higher) - Running locally or on a server
- **MongoDB** - Running locally or Atlas connection
- **Redis** (optional but recommended) - For job queue functionality

## 📁 Project Structure

```
dashboard_mern_payment_app/
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components organized by role
│   │   │   ├── admin/        # Admin dashboard pages
│   │   │   ├── user/         # User dashboard pages
│   │   │   ├── agent/        # Agent dashboard pages
│   │   │   └── auth/         # Authentication pages
│   │   ├── context/          # React context (Auth, etc.)
│   │   ├── utils/            # Utility functions
│   │   ├── types/            # TypeScript types
│   │   └── App.tsx           # Main app component
│   └── package.json
│
├── src/                       # Express backend
│   ├── app.js                # Main Express application
│   ├── config/               # Configuration files
│   │   ├── database.js       # Database setup
│   │   └── sequelize.js      # Sequelize initialization
│   ├── controllers/          # Route controllers
│   │   ├── admin.controller.js
│   │   ├── user.controller.js
│   │   ├── agent.controller.js
│   │   ├── auth.controller.js
│   │   └── payment.controller.js
│   ├── models/               # Sequelize models
│   │   ├── User.js
│   │   ├── transaction.model.js
│   │   ├── MerchantDetails.js
│   │   └── ...
│   ├── routes/               # API routes
│   ├── middleware/           # Express middleware
│   ├── services/             # Business logic services
│   ├── workers/              # Background job workers
│   ├── scripts/              # Utility scripts
│   └── utils/                # Utilities (logger, errors, etc.)
│
├── logs/                      # Application logs
├── .env                      # Environment variables
├── package.json              # Backend dependencies
└── README.md                 # This file
```

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd dashboard_mern_payment_app
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 4. Set Up Databases

#### MySQL Setup (XAMPP)
1. Start XAMPP Control Panel
2. Start Apache and MySQL
3. Create a new database named `techturect`:
   ```sql
   CREATE DATABASE techturect;
   ```

#### MongoDB Setup
- Ensure MongoDB is running locally or have a cloud connection string
- Default connection: `mongodb://localhost:27017/techturect`

#### Redis Setup (Optional)
- Install and start Redis locally
- Default connection: `localhost:6379`

## 🔧 Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MySQL Database (XAMPP defaults)
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=techturect
DB_USERNAME=root
DB_PASSWORD=

# MongoDB
MONGODB_URI=mongodb://localhost:27017/techturect

# JWT Authentication
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Logging
LOG_LEVEL=info

# Optional: Payment Gateway Configuration
PAYMENT_BASE_URL=http://127.0.0.1:5001
```

## ▶️ Running the Application

### Option 1: Run Both Backend and Frontend Simultaneously

From the root directory, run both servers:

```bash
# Terminal 1 - Backend (Node.js/Express)
npm run dev

# Terminal 2 - Frontend (React/Vite)
cd frontend
npm run dev
```

**Access the application:**
- Frontend: http://localhost:5173/
- Backend API: http://localhost:3000/api

### Option 2: Production Build

```bash
# Build frontend
cd frontend
npm run build
npm run preview

# Start backend
cd ..
npm start
```

### Option 3: Using Individual Scripts

**Backend:**
```bash
npm run dev           # Development with nodemon
npm run start         # Production mode
npm run debug         # Debug mode with inspector
npm run create-admin  # Create an admin user
npm run check-db      # Check database connection
```

**Frontend:**
```bash
cd frontend
npm run dev      # Development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Admin Endpoints
- `GET /api/admin/dashboard` - Admin dashboard metrics
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:userId` - Update user details
- `GET /api/admin/users/:userId` - Get user details
- `POST /api/admin/users/:userId/add-fund` - Add funds to user wallet
- `GET /api/admin/wallet-report` - Wallet transaction report
- `GET /api/admin/payout-report` - Payout report
- `POST /api/admin/payouts` - Create payout
- `GET /api/admin/chargebacks` - Get chargebacks
- `POST /api/admin/settlement` - Settle amount

### User Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/wallet` - Get wallet balance
- `GET /api/users/transactions` - Get user transactions
- `POST /api/users/fund-request` - Request funds

### Payment Endpoints
- `POST /api/payments/process` - Process payment
- `GET /api/payments/status/:transactionId` - Check payment status
- `POST /api/payments/refund` - Refund payment

## 💾 Database Models

### User
- Email, password, role (admin/user/agent)
- Merchant details, wallet balance
- KYC verification status

### Transaction
- Payer, payee, amount, currency
- Status, timestamps, transaction type

### MerchantDetails
- Business information
- Bank account details
- Settlement preferences

### Settlement
- Settlement ID, amount, status
- Associated transactions
- Settlement date and time

### Charges
- Platform charges, merchant charges
- Mode-specific charges
- Commission percentages

## 👥 User Roles & Permissions

| Feature | Admin | User | Agent |
|---------|-------|------|-------|
| Manage Users | ✅ | ❌ | ❌ |
| Manage Payouts | ✅ | ❌ | ❌ |
| View Wallet | ✅ | ✅ | ✅ |
| Create Fund Request | ❌ | ✅ | ❌ |
| View Developer Docs | ✅ | ✅ | ✅ |
| Process Settlement | ✅ | ❌ | ❌ |
| View Chargeback | ✅ | ❌ | ❌ |

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control (RBAC)** - Fine-grained permissions
- **Helmet.js** - Security headers
- **CORS** - Cross-origin protection
- **Input Validation** - Express validator middleware
- **Encrypted Passwords** - bcryptjs for password hashing
- **API Logging** - Winston logger for audit trails
- **Rate Limiting** - Prevent abuse

## 🐛 Troubleshooting

### MySQL Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution:** Ensure MySQL is running in XAMPP and the credentials in `.env` are correct.

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Start MongoDB service or update MONGODB_URI with your cloud connection string.

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:** 
```bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>
# Or change PORT in .env
```

### Frontend Build Issues
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Redis Connection Error (Optional)
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution:** Either start Redis or disable Redis-dependent features by checking `queue.config.js`

## 📝 Scripts Reference

### Backend Scripts
```bash
npm run dev           # Start with auto-reload (nodemon)
npm run start         # Start production server
npm run debug         # Start with debugger
npm run create-admin  # Create admin user
npm run check-db      # Verify DB connection
npm run migrate       # Run Sequelize migrations
```

### Frontend Scripts
```bash
npm run dev           # Start dev server (http://localhost:5173)
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Run ESLint
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs in the `logs/` directory
3. Check the browser console for frontend errors
4. Create an issue in the repository

---

**Happy coding! 🚀**
