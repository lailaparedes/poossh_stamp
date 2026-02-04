# Database Setup for Merchant Authentication

## Overview

This directory contains SQL migrations to add merchant authentication to your existing PunchMe database.

## How to Apply

### Step 1: Run the Migration in Supabase

1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Copy the contents of `merchant_auth_migration.sql`
4. Paste and click **Run**

### Step 2: Create Initial Merchant Users

You'll need to create merchant portal accounts. Here's how:

#### Option A: Using Supabase Dashboard

1. Go to **Table Editor** → `merchant_portal_users`
2. Click **Insert row**
3. Fill in:
   - `merchant_id`: Select from your merchants table
   - `email`: Merchant's login email
   - `password_hash`: Generate using bcrypt (see below)
   - `full_name`: Merchant's name
   - `role`: owner/manager/viewer

#### Option B: Using SQL (Recommended)

```sql
-- First, you need to hash the password
-- Use an online bcrypt tool or Node.js to generate:
-- bcrypt.hashSync('password123', 10)

INSERT INTO merchant_portal_users (merchant_id, email, password_hash, full_name, role)
VALUES (
  'your-merchant-uuid-here',
  'merchant@example.com',
  '$2a$10$YourBcryptHashHere',
  'Merchant Name',
  'owner'
);
```

## Security Features

### Row Level Security (RLS)

The migration automatically sets up RLS policies to ensure:
- ✅ Merchants can **only** see their own data
- ✅ No merchant can access another merchant's information
- ✅ API requests are validated against the session token

### Session Management

- Sessions expire after 24 hours (configurable)
- Token-based authentication
- Automatic cleanup of expired sessions

## Tables Added

| Table | Purpose |
|-------|---------|
| `merchant_portal_users` | Login credentials for merchants |
| `merchant_portal_sessions` | Active login sessions with tokens |
| `merchant_dashboard_preferences` | User preferences and settings |

## Testing the Setup

After running the migration:

```sql
-- Check if tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'merchant_portal%';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'merchant_portal%';
```

## Next Steps

1. ✅ Run the SQL migration
2. ✅ Create merchant portal users (with bcrypt hashed passwords)
3. ✅ Update backend to add authentication endpoints
4. ✅ Update frontend to add login page
5. ✅ Test that merchants can only see their own data

## Password Hashing

To generate bcrypt hashes for passwords:

**Using Node.js:**
```javascript
const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync('your-password', 10);
console.log(hash);
```

**Online Tool:**
- Use: https://bcrypt-generator.com/
- Set rounds to: 10
