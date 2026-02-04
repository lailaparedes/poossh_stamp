<<<<<<< HEAD
# punchme_webpage
=======
# PunchMe Merchant Insights Dashboard

A web application for merchants to view analytics and insights on their loyalty stamp card activity from the PunchMe app.

## Features

- **Active Cards Count** - View total number of active stamp cards
- **New Cards Per Day** - Track new card creation with daily breakdown
- **Rewards Analytics** - Monitor total rewards given out and redemption rates
- **Daily Stamp Activity** - Visualize stamp activity trends with interactive graphs
- **Merchant Profiles** - Browse all merchants and select individual dashboards

## Tech Stack

- **Frontend**: React with React Router and Recharts for data visualization
- **Backend**: Node.js with Express
- **Database**: Supabase (PostgreSQL)

## Project Structure

```
webpage/
├── backend/
│   ├── config/
│   │   └── supabase.js          # Supabase client configuration
│   ├── routes/
│   │   ├── merchants.js         # Merchant endpoints
│   │   └── analytics.js         # Analytics endpoints
│   ├── server.js                # Express server
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── MerchantList.js         # Merchant selection page
    │   │   ├── MerchantList.css
    │   │   ├── MerchantDashboard.js    # Analytics dashboard
    │   │   └── MerchantDashboard.css
    │   ├── App.js                      # Main app component
    │   ├── App.css
    │   ├── index.js
    │   └── index.css
    └── package.json
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account with PunchMe database

### One-Time Setup

1. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

3. **Create `.env` file in backend directory:**
   ```bash
   cd ../backend
   cp .env.example .env
   ```

4. **Add your Supabase credentials to `backend/.env`:**
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   PORT=3000
   ```

5. **Build the React frontend:**
   ```bash
   cd ../frontend
   npm run build
   ```

### 🚀 How to Start the Application

**Single command from backend directory:**

```bash
cd backend
node server.js
```

**Or with auto-restart on code changes:**

```bash
cd backend
npm run dev
```

**Access the dashboard:**
- 🌐 Open your browser to: **http://localhost:3000**
- 🔌 API endpoints available at: **http://localhost:3000/api**

The server runs on port 3000 and serves both the frontend and backend API.

### Troubleshooting

**If port 3000 is already in use:**
```bash
# Kill all processes on port 3000
kill -9 $(lsof -ti:3000)

# Then start the server
cd backend
node server.js
```

**Check if server is running:**
```bash
curl http://localhost:3000/api/health
# Should return: {"status":"ok","message":"PunchMe Merchant API is running"}
```

**Rebuild frontend after making changes:**
```bash
cd frontend
npm run build
```

## API Endpoints

### Merchants

- `GET /api/merchants` - Get all merchants
- `GET /api/merchants/:merchantId` - Get specific merchant

### Analytics

- `GET /api/analytics/:merchantId/dashboard` - Get dashboard summary stats
- `GET /api/analytics/:merchantId/new-cards-daily?days=30` - Get new cards per day
- `GET /api/analytics/:merchantId/stamp-activity?days=30` - Get daily stamp activity
- `GET /api/analytics/:merchantId/top-customers?limit=10` - Get top customers

## Database Schema

The application uses read-only access to the existing PunchMe database tables:

- `merchants` - Merchant profiles
- `users` - Customer profiles
- `stamp_cards` - Active stamp cards
- `stamp_history` - Individual stamp transactions
- `rewards` - Earned and redeemed rewards
- `deleted_stamp_cards` - Historical data

## Usage

1. **Start the server:**
   ```bash
   cd backend
   node server.js
   ```

2. **Open in browser:** http://localhost:3000

3. **Browse merchants:** Select any merchant from the list

4. **View analytics dashboard:**
   - 📇 Active cards count
   - 🎁 Total rewards earned
   - ✅ Redeemed rewards (with redemption rate %)
   - ⏳ Pending rewards
   - 📊 Bar chart: New cards created per day (last 30 days)
   - 📈 Line graph: Daily stamp activity (last 30 days)

## Production Deployment

The application is configured as a single server that serves both the API and frontend.

1. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy the backend** to services like:
   - Heroku
   - Railway
   - DigitalOcean
   - AWS EC2
   - Render

3. **Set environment variables** on your hosting platform:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   PORT=3000
   ```

4. **Start command:** `node backend/server.js`

The server will automatically serve both the API and the built React frontend.

## Future Enhancements

- Merchant authentication
- Custom date range selection
- Export reports to CSV/PDF
- Customer segmentation analysis
- Push notifications for milestones
- Multi-merchant comparison views

## License

Private - PunchMe Internal Use Only
>>>>>>> 1ac8bd2 (Initial commit - PunchMe Merchant Portal)
