# Database Setup

## Prerequisites
- PostgreSQL 12 or higher installed
- Database client (psql, pgAdmin, or similar)

## Setup Instructions

1. Create the database:
```bash
psql -U postgres
CREATE DATABASE mobile_money_db;
\q
```

2. Run the schema:
```bash
psql -U postgres -d mobile_money_db -f schema.sql
```

3. Update your backend `.env` file with the correct database credentials:
```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/mobile_money_db
```

## Database Schema

### Users Table
- `id`: Primary key
- `email`: User email (unique)
- `password`: Hashed password
- `full_name`: User's full name
- `role`: Either 'owner' or 'employee'
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Transactions Table
- `id`: Primary key
- `user_id`: Foreign key to users
- `service_type`: Mobile money service (vodacom, airtel, tigo, halotel, lipa_namba_*)
- `amount`: Transaction amount
- `transaction_type`: deposit, withdraw, or transfer
- `cash_in_hand`: Current cash balance for that service
- `description`: Optional transaction description
- `created_at`: Timestamp
- `updated_at`: Timestamp
