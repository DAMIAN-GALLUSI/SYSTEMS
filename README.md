# Mobile Money Agent Management System

A comprehensive full-stack application for managing mobile money agent operations with user authentication, dashboard analytics, and transaction tracking.

## 🚀 Features

### ✨ Core Functionality
- **User Authentication**: Secure JWT-based login and registration
- **Role-Based Access**: Owner and Employee roles with different permissions
- **Dashboard Analytics**: Real-time profit/loss visualization with interactive line charts
- **Service Cards**: 8 mobile money services with official brand colors:
  - Vodacom (Red: #E60000)
  - Airtel (Red: #E30613)
  - Tigo (Blue: #0066CC)
  - Halotel (Orange: #FF6B00)
  - Lipa Namba variants for each service
- **Transaction Management**: Easy entry and tracking of deposits, withdrawals, and transfers
- **Report Generation**: Comprehensive reports with CSV download (Owner only)
- **Cash Tracking**: Real-time cash in hand monitoring for each service

### 📊 Dashboard Features
- Profit/Loss trend line graph (7, 30, or 90 days)
- Total cash in hand summary
- Service-wise cash balance display
- Beautiful color-coded service cards

### 🔐 User Roles
- **Owner**: Full access including report generation and download
- **Employee**: Can enter transactions and view dashboard

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Recharts for data visualization
- React Router for navigation
- Axios for API calls
- Modern CSS with responsive design

### Backend
- Node.js with Express
- TypeScript for type safety
- PostgreSQL database
- JWT authentication
- bcryptjs for password hashing
- Express Validator for input validation

## 📁 Project Structure

```
mobile-money-agent/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── report.controller.ts
│   │   │   └── transaction.controller.ts
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   ├── report.routes.ts
│   │   │   └── transaction.routes.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   └── ServiceCard.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── TransactionEntry.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── constants.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── database/
    ├── schema.sql
    └── README.md
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL 12+ installed
- npm or yarn package manager

### 1. Database Setup

```bash
# Create database
psql -U postgres
CREATE DATABASE mobile_money_db;
\q

# Run schema
cd database
psql -U postgres -d mobile_money_db -f schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your database credentials:
# DATABASE_URL=postgresql://postgres:your_password@localhost:5432/mobile_money_db
# JWT_SECRET=your-secret-key-change-this
# PORT=5000

# Start development server
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## 📱 Usage

### For Employees:
1. Register with role "Employee"
2. Login to access dashboard
3. View profit/loss trends and service balances
4. Enter transactions for each mobile money service
5. Track cash in hand for each service

### For Business Owners:
1. Register with role "Business Owner"
2. All employee features plus:
3. Access to Reports section
4. Generate filtered reports by date and service
5. Download comprehensive CSV reports
6. View detailed transaction history

## 🎨 Service Colors

The system uses official brand colors:
- **Vodacom**: Red (#E60000)
- **Airtel**: Red (#E30613)
- **Tigo**: Blue (#0066CC)
- **Halotel**: Orange (#FF6B00)
- **Lipa Namba services**: Same colors as parent brands

## 🔒 Security Features

- Passwords hashed with bcryptjs
- JWT tokens for authentication
- Protected API routes with middleware
- Role-based authorization
- SQL injection prevention with parameterized queries
- Input validation on all forms

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Transactions
- `POST /api/transactions` - Create transaction (protected)
- `GET /api/transactions` - Get all transactions (protected)
- `GET /api/transactions/service/:serviceType` - Get by service (protected)

### Dashboard
- `GET /api/dashboard/data` - Get dashboard summary (protected)
- `GET /api/dashboard/profit-loss` - Get profit/loss data (protected)

### Reports
- `GET /api/reports/generate` - Generate report (owner only)
- `GET /api/reports/download` - Download CSV (owner only)

## 🧪 Development

### Build for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 📝 Environment Variables

### Backend (.env)
```
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/mobile_money_db
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

## 🤝 Contributing

This is a custom business application. For feature requests or issues, please contact the development team.

## 📄 License

MIT License - feel free to use this project for your business needs.

## 👥 Support

For support or questions, contact your system administrator.

---

**Built with ❤️ for Mobile Money Agents**
