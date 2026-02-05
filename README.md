# Poossh Stamp Merchant Portal

A web application for merchants to view analytics and insights on their loyalty stamp card activity from the Poossh Stamp app.

## Features

- **Active Cards Count** - View total number of active stamp cards
- **New Cards Per Day** - Track new card creation with daily breakdown
- **Rewards Analytics** - Monitor total rewards given out and redemption rates
- **Daily Stamp Activity** - Visualize stamp activity trends with interactive graphs
- **Merchant Profiles** - Browse all merchants and select individual dashboards
- **Customers Page** - View all customers grouped by loyalty card program
- **QR Code Generation** - Generate and download QR codes for customer enrollment
- **Auto-Refresh** - Dashboard data refreshes automatically every hour

## Tech Stack

- **Frontend**: React with React Router and Recharts for data visualization
- **Backend**: Node.js with Express
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Render.com
- **Domain**: poossh.com

## Project Structure

```
webpage/
├── backend/
│   ├── config/
│   │   └── supabase.js          # Supabase client configuration
│   ├── routes/
│   │   ├── merchants.js         # Merchant endpoints
│   │   ├── analytics.js         # Analytics endpoints
│   │   └── auth.js              # Authentication endpoints
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   ├── utils/
│   │   └── qrcode.js            # QR code generation
│   └── .env.example
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js             # Login page
│   │   │   ├── Signup.js            # Registration page
│   │   │   ├── Dashboard.js         # Main analytics dashboard
│   │   │   ├── MyCards.js           # Loyalty card management
│   │   │   ├── Customers.js         # Customer list by merchant
│   │   │   ├── Sidebar.js           # Navigation sidebar
│   │   │   └── Setup.js             # Initial merchant setup
│   │   ├── contexts/
│   │   │   └── AuthContext.js       # Authentication context
│   │   ├── App.js                   # Main app component
│   │   └── index.css                # Global design system
│   └── package.json
│
├── server.js                        # Express server (root)
├── package.json                     # Root package config
└── render.yaml                      # Render deployment config
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm
- Supabase account with Poossh Stamp database

### One-Time Setup

1. **Install all dependencies:**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

2. **Create `.env` file in backend directory:**
   ```bash
   cd backend
   cp .env.example .env
   ```

3. **Add your Supabase credentials to `backend/.env`:**
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   JWT_SECRET=your_secret_key_here
   PORT=3000
   NODE_ENV=development
   ```

4. **Build the React frontend:**
   ```bash
   npm run build:all
   ```

### 🚀 How to Start the Application

**Single command from root directory:**

```bash
npm start
```

**Or for development with auto-restart:**

```bash
npm run dev
```

**Access the portal:**
- 🌐 Open your browser to: **http://localhost:3000**
- 🔌 API endpoints available at: **http://localhost:3000/api**

The server runs on port 3000 and serves both the frontend and backend API.

### Troubleshooting

**If port 3000 is already in use:**
```bash
# Kill all processes on port 3000
lsof -ti:3000 | xargs kill -9

# Then start the server
npm start
```

**Check if server is running:**
```bash
curl http://localhost:3000/api/health
# Should return: {"status":"ok","message":"Poossh Stamp Merchant API is running"}
```

**Rebuild frontend after making changes:**
```bash
npm run build:frontend
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new merchant account
- `POST /api/auth/login` - Login to merchant portal
- `POST /api/auth/logout` - Logout from portal

### Merchants
- `GET /api/merchants/all` - Get all merchants (authenticated)
- `GET /api/merchants/:id` - Get specific merchant
- `POST /api/merchants` - Create new merchant/loyalty card
- `POST /api/merchants/generate-qr/:id` - Generate QR code for merchant

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard summary stats (authenticated)
- `GET /api/analytics/new-cards-daily?days=30` - Get new cards per day
- `GET /api/analytics/stamp-activity?days=30` - Get daily stamp activity
- `GET /api/analytics/customers` - Get all customers grouped by merchant
- `GET /api/analytics/top-customers?limit=10` - Get top customers

## Database Schema

The application uses the following Poossh Stamp database tables:

- `merchant_portal_users` - Merchant account credentials
- `merchant_portal_sessions` - Active login sessions
- `merchants` - Merchant/loyalty card profiles
- `users` - Customer profiles
- `stamp_cards` - Active stamp cards
- `stamp_history` - Individual stamp transactions
- `rewards` - Earned and redeemed rewards

## Design System

The portal features an iOS-inspired design system:

- **Colors**: iOS Blue (#007AFF) and Purple (#5856D6) accents
- **Typography**: System font stack with SF Pro-inspired sizing
- **Components**: Cards, buttons, and inputs following iOS guidelines
- **Responsive**: Fully responsive across mobile, tablet, and desktop
- **Animations**: Smooth transitions and micro-interactions

## Production Deployment

### Deploying to Render

1. **Push code to GitHub:**
   ```bash
   git push origin main
   ```

2. **Create new Web Service on Render:**
   - Connect GitHub repository
   - Render will detect `render.yaml` automatically
   - Add environment variables

3. **Environment Variables:**
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_key
   JWT_SECRET=auto_generated
   NODE_ENV=production
   PORT=3000
   ```

4. **Custom Domain:**
   - Add `poossh.com` in Render settings
   - Update DNS records in Wix
   - SSL certificate generated automatically

### Continuous Deployment

Every push to `main` branch automatically triggers a new deployment on Render.

## Features

### For Merchants

- 📊 **Analytics Dashboard** - View real-time stats and charts
- 🎴 **Multiple Loyalty Cards** - Create and manage multiple programs
- 👥 **Customer Insights** - See all customers across programs
- 📱 **QR Codes** - Generate enrollment QR codes
- 🔄 **Auto-Refresh** - Data updates automatically every hour
- 📈 **30-Day Charts** - Visualize trends over time

### Security

- JWT-based authentication
- Secure session management
- Environment-based configuration
- Protected API routes

## License

Private - Poossh Stamp Internal Use Only

## Support

For technical support or questions, contact the development team.
