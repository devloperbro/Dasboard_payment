# Payment Gateway Dashboard - Architecture & Design Guide

## 📐 System Architecture Overview

This is a **MERN** application with **Role-Based Access Control (RBAC)**. The system separates users into three distinct roles, each with different capabilities and dashboards.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Frontend - React)                │
│                      (http://localhost:5173)                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    JWT Token Auth
                    + Role Validation
                         │
┌────────────────────────▼────────────────────────────────────────┐
│               API Server (Backend - Express)                    │
│                  (http://localhost:3000)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Routes: /api/auth, /api/admin, /api/users, /api/agents  │  │
│  │ Middleware: JWT Auth, Role Authorization, Logging       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
┌────────▼─────┐ ┌──────▼──────┐ ┌─────▼────────┐
│   MySQL DB   │ │  MongoDB    │ │    Redis     │
│   (Primary)  │ │ (Secondary) │ │  (Job Queue) │
└──────────────┘ └─────────────┘ └──────────────┘
```

---

## 🔐 Authentication & Authorization Flow

### Login Flow

```
1. User enters credentials (username, password) on Login Page
2. Frontend sends POST /api/auth/login to Backend
3. Backend:
   - Looks up user in MySQL by username
   - Compares password (bcrypt)
   - Generates JWT token with user_id and user_type
   - Returns { token, user }
4. Frontend stores token in localStorage
5. Frontend sets Authorization header: "Bearer {token}"
6. Frontend routes user to dashboard based on user_type:
   - user_type === 'admin'   → /admin
   - user_type === 'agent'   → /agent
   - other types            → /user
```

### Protected Route Check (Frontend)

Every route is wrapped in `ProtectedRoute` component that:
1. Checks if user is authenticated (has token)
2. Verifies user_type matches required role
3. Redirects to appropriate dashboard or login
4. Shows loading spinner while checking auth

### API Authorization (Backend)

Each endpoint uses middleware to verify:
```javascript
router.use(auth, authorize('admin')); // Only admin can access
```

---

## 👨‍💼 ADMIN ROLE

### Powers & Capabilities

The **Admin** is the master control of the system with complete access:

#### 1. **User Management**
- ✅ View all users
- ✅ Create new users (merchants/agents)
- ✅ Edit user details
- ✅ View user information
- ✅ Set KYC status
- ✅ Manage user IP whitelist

**API Endpoints:**
```
GET    /api/admin/users                    → Get all users
POST   /api/admin/users/register           → Create user
PUT    /api/admin/users/:userId            → Update user
GET    /api/admin/users/:userId            → Get user details
POST   /api/admin/users/:userId/ips        → Add user IP
DELETE /api/admin/users/:userId/ips/:ipId  → Remove IP
```

#### 2. **Wallet Management**
- ✅ View user wallets
- ✅ Add funds to user wallet
- ✅ Manage fund requests
- ✅ Process settlements

**API Endpoints:**
```
GET    /api/admin/users/:userId/wallet      → Check wallet balance
POST   /api/admin/users/:userId/wallet      → Add funds
GET    /api/admin/manage-fund-request       → View fund requests
POST   /api/admin/settle-amount             → Settle amount
```

#### 3. **Payout Management**
- ✅ View all payouts
- ✅ Create single payout
- ✅ Create bulk payouts
- ✅ Track payout status

**API Endpoints:**
```
GET    /api/admin/manage-payout            → View all payouts
POST   /api/admin/manage-payout            → Create payout
GET    /api/admin/payout-report            → Payout reports
```

#### 4. **Chargeback Management**
- ✅ View chargebacks
- ✅ Manage chargeback disputes
- ✅ View chargeback reports

**API Endpoints:**
```
GET    /api/admin/chargeback               → View chargebacks
POST   /api/admin/chargeback               → Create chargeback
GET    /api/admin/chargeback-report        → Chargeback reports
```

#### 5. **Charges Configuration**
- ✅ Set platform-wide charges
- ✅ Set per-merchant charges
- ✅ Set mode-specific charges (payin/payout)
- ✅ Configure commission percentages

**API Endpoints:**
```
GET    /api/admin/platform-charges         → View platform charges
POST   /api/admin/platform-charges         → Add charge
DELETE /api/admin/platform-charges/:id     → Remove charge
GET    /api/admin/users/:id/merchant-charges
POST   /api/admin/merchant-charges         → Set merchant charges
```

#### 6. **Staff Management**
- ✅ Create staff members
- ✅ Manage staff roles
- ✅ Control staff access

**API Endpoints:**
```
GET    /api/admin/manage-staff             → View staff
POST   /api/admin/manage-staff             → Create staff
```

#### 7. **Reports & Analytics**
- ✅ Dashboard with KPIs (Total Users, Transactions, etc.)
- ✅ Wallet transaction reports
- ✅ Payout reports
- ✅ Settlement history
- ✅ Financial summaries

**API Endpoints:**
```
GET    /api/admin/dashboard                → Admin dashboard metrics
GET    /api/admin/wallet-transactions      → Transaction details
GET    /api/admin/settlement-history/:userId
```

---

## 👤 USER ROLE (Regular Merchant/Payin-Payout)

### Powers & Capabilities

**Users** have **limited self-service** capabilities:

#### 1. **Profile Management**
- ✅ View own profile
- ✅ Update own information
- ❌ Cannot create other users
- ❌ Cannot modify other user accounts

**API Endpoints:**
```
GET    /api/users/profile                  → Get own profile
PUT    /api/users/profile                  → Update own profile
```

#### 2. **Wallet Operations**
- ✅ View own wallet balance
- ✅ Request funds (admin must approve)
- ✅ View wallet transactions

**API Endpoints:**
```
GET    /api/users/wallet                   → View balance
POST   /api/users/fund-request             → Request funds
GET    /api/users/transactions             → View history
```

#### 3. **Payout Management**
- ✅ View own payouts
- ✅ View payout reports
- ✅ Track payout status
- ❌ Cannot create payouts (admin does it)

**API Endpoints:**
```
GET    /api/users/payout-report            → View payouts
GET    /api/users/payouts/:id              → Check status
```

#### 4. **Developer/Integration**
- ✅ View API documentation
- ✅ Access API keys/credentials
- ✅ Manage webhook callbacks
- ✅ Configure webhooks

**API Endpoints:**
```
GET    /api/users/developer-settings       → Get API credentials
POST   /api/users/developer-settings       → Update settings
GET    /api/users/development-docs         → Get integration docs
POST   /api/users/:userId/callback/payin   → Set payin callback
POST   /api/users/:userId/callback/payout  → Set payout callback
```

#### 5. **Data Visibility**
- ✅ Can only see own data
- ❌ Cannot see other users' data
- ❌ Cannot see other users' transactions
- ❌ Cannot see other users' wallet

---

## 🤝 AGENT ROLE

### Powers & Capabilities

**Agents** are **distributors/sub-dealers** with **middle-level** access:

#### 1. **User Registration** (Optional - depends on setup)
- ✅ Can register users under them
- ✅ Can view their own registered users
- ❌ Cannot edit users created by admin
- ❌ Cannot access other agents' users

#### 2. **Own Wallet & Payouts**
- ✅ View own wallet
- ✅ View own payouts
- ✅ Request funds
- ✅ Track transactions
- ❌ Cannot manage other agents' wallets

**API Endpoints:**
```
GET    /api/agent/wallet-report            → View own wallet
GET    /api/agent/payout-report            → View payouts
POST   /api/agent/fund-request             → Request funds
```

#### 3. **Developer Access**
- ✅ View API documentation
- ✅ Manage own API credentials
- ✅ Configure own webhooks

**API Endpoints:**
```
GET    /api/agent/developer-settings       → Get API keys
POST   /api/agent/developer-settings       → Update settings
GET    /api/agent/development-docs         → Get docs
```

#### 4. **Dashboard**
- ✅ View own dashboard with personal metrics
- ✅ See own transactions
- ✅ See own fund requests
- ❌ Cannot see other agents' data

---

## 🗄️ Database Model

### User Model (MySQL)

```sql
Users Table:
┌─────────────────────────────────┐
│ id (PK)                         │
│ name                            │
│ user_name (UNIQUE)              │
│ password (HASHED)               │
│ email (UNIQUE)                  │
│ mobile                          │
│ company_name                    │
│ aadhaar_card, pancard          │
│ address, city, state, pincode  │
│ gst_no                         │
│ business_type (enum)           │
│ user_type (enum) ← KEY FIELD   │
│   - 'admin'                    │
│   - 'payin_payout' (Regular)   │
│   - 'agent'                    │
│   - 'staff'                    │
│   - 'payout_only'              │
│ agent_id (FK) ← For sub-users  │
│ created_by (FK) ← Who created  │
│ created_at, updated_at         │
└─────────────────────────────────┘
```

### Key Relationships

```
Admin User (user_type='admin')
├── Can manage any User
└── Can create Agents

Agent User (user_type='agent')
├── Has own Wallet
├── Can have sub-Users (agent_id)
└── Has own Payouts

Regular User (user_type='payin_payout')
├── Has own Wallet
├── Has own Transactions
└── created_by points to Admin or Agent

Wallet → Belongs to User
Transaction → Has Payer & Payee (both Users)
MerchantDetails → Belongs to User
Settlement → References User
```

---

## 🔒 Permission Enforcement

### Frontend Level (Route Protection)

```typescript
// ProtectedRoute Component
<ProtectedRoute role="admin">
  <AdminDashboard />
</ProtectedRoute>
```

Logic:
1. Check if token exists → if no, redirect to login
2. Parse token → extract user_type
3. Map user_type to role (payin_payout → 'user')
4. Compare with required role
5. If mismatch → redirect to appropriate dashboard
6. If match → render component

### Backend Level (API Protection)

```javascript
// Middleware Chain
router.use(auth, authorize('admin'));

// auth middleware: Verifies JWT token
// authorize middleware: Checks user_type
```

---

## 📊 Frontend Structure

### Route Organization

```
/login                    ← Public (no protection)

/admin/*                  ← Admin only
  /admin                  → Dashboard
  /admin/manage-user      → User CRUD
  /admin/manage-payout    → Payout management
  /admin/settlement       → Settlement
  /admin/chargeback       → Chargeback management

/user/*                   ← User only
  /user                   → User Dashboard
  /user/wallet-report     → Wallet info
  /user/payout-report     → Payouts
  /user/fund-request      → Request funds
  /user/developer-settings → API credentials

/agent/*                  ← Agent only
  /agent                  → Agent Dashboard
  /agent/wallet-report    → Wallet info
  /agent/payout-report    → Payouts
  /agent/developer-settings → API credentials
```

---

## 🛣️ Backend Route Organization

```
/api/auth
  POST /login             ← Login (public)
  POST /logout            ← Logout

/api/admin/*              ← Admin only
  GET    /users           → List users
  POST   /users/register  → Create user
  PUT    /users/:id       → Update user
  GET    /users/:id       → Get user details
  POST   /manage-payout   → Create payout
  GET    /dashboard       → Admin metrics

/api/users/*              ← User only
  GET    /profile         → Own profile
  PUT    /profile         → Update profile
  GET    /wallet          → Own wallet
  GET    /transactions    → Own transactions

/api/agents/*             ← Agent only
  GET    /wallet          → Own wallet
  GET    /payouts         → Own payouts
```

---

## 🔄 Data Flow Example: Create User (Admin Only)

### Step 1: Frontend
```
AdminDashboard → AddUser Form
User fills: name, email, username, password, user_type
Clicks "Create User"
```

### Step 2: Frontend sends API Request
```javascript
POST /api/admin/users/register
Headers: { Authorization: "Bearer {token}" }
Body: {
  name: "John Doe",
  email: "john@example.com",
  user_name: "johndoe",
  password: "secure123",
  user_type: "payin_payout"  // or "agent"
}
```

### Step 3: Backend processes
```
1. Middleware: auth() → Verify token, get admin user
2. Middleware: authorize('admin') → Check user_type === 'admin'
3. Controller: registerUser()
   - Validate input
   - Check if username unique
   - Hash password using bcryptjs
   - Save to MySQL Users table
   - set created_by = admin's id
4. Return: { success: true, user: {...} }
```

### Step 4: Frontend receives response
```
- Update user list
- Show success toast
- Navigate back to user list
```

---

## 🔄 Data Flow Example: Regular User Login

### Step 1: User enters credentials
```
Username: testuser
Password: password123
```

### Step 2: Frontend sends login
```
POST /api/auth/login
Body: { user_name: "testuser", password: "password123" }
```

### Step 3: Backend validates
```
1. Find user by username in MySQL
2. Compare password (bcryptjs)
3. Generate JWT: { id: 2, user_type: 'payin_payout' }
4. Return: { token: "...", user: { id, name, user_type, ... } }
```

### Step 4: Frontend processes
```
1. Store token in localStorage
2. Set Authorization header for all future requests
3. Detect user_type: 'payin_payout' → map to 'user'
4. Redirect to /user
```

### Step 5: User Dashboard loads
```
1. ProtectedRoute checks: role required = 'user', user_type = 'payin_payout'
2. Maps user_type to 'user' role
3. Matches! → Render UserDashboard
4. Dashboard makes API calls to /api/users/wallet, /api/users/transactions
5. Backend middleware verifies token for each request
```

---

## 🎯 Permission Matrix

| Feature | Admin | User | Agent |
|---------|:-----:|:----:|:-----:|
| **User Management** | | | |
| Create Users | ✅ | ❌ | ❌ |
| Edit Users | ✅ | ❌ | ❌ |
| View All Users | ✅ | ❌ | ❌ |
| View Own Profile | ✅ | ✅ | ✅ |
| **Wallet** | | | |
| View Own Wallet | ✅ | ✅ | ✅ |
| Add Funds to User | ✅ | ❌ | ❌ |
| Request Funds | ✅ | ✅ | ✅ |
| **Payout** | | | |
| Create Payout | ✅ | ❌ | ❌ |
| Bulk Payout | ✅ | ❌ | ❌ |
| View Own Payouts | ✅ | ✅ | ✅ |
| View All Payouts | ✅ | ❌ | ❌ |
| **Charges** | | | |
| Set Platform Charges | ✅ | ❌ | ❌ |
| Set Merchant Charges | ✅ | ❌ | ❌ |
| **Settlement** | | | |
| Process Settlement | ✅ | ❌ | ❌ |
| View Settlement | ✅ | ❌ | ❌ |
| **Chargeback** | | | |
| Manage Chargebacks | ✅ | ❌ | ❌ |
| **Reports** | | | |
| View Dashboard | ✅ | ✅ | ✅ |
| View Reports | ✅ | ✅ | ✅ |
| **Developer** | | | |
| API Credentials | ✅ | ✅ | ✅ |
| Webhooks Config | ✅ | ✅ | ✅ |

---

## 🚀 Quick Reference for Future Questions

### Key Concepts:
- **user_type**: Database field that determines role
- **JWT Token**: Stateless authentication (contains user_id & user_type)
- **ProtectedRoute**: Frontend guard for routes
- **Middleware**: Backend guard for API endpoints
- **RBAC**: Role-Based Access Control - different users, different permissions

### Files to Know:
- **Frontend Auth**: `/frontend/src/context/AuthContext.tsx`
- **Frontend Routing**: `/frontend/src/App.tsx`
- **Backend Auth**: `/src/controllers/auth.controller.js`
- **Backend Middleware**: `/src/middleware/auth.middleware.js`
- **Admin Routes**: `/src/routes/admin.routes.js`
- **User Model**: `/src/models/User.js`

---

Feel free to ask any follow-up questions! I'm ready to help with specific features, fixes, or enhancements. 🎯
