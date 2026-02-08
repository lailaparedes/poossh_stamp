# 🚀 How to Run Poossh Stamp Merchant Portal Locally

## Quick Start (Copy & Paste This)

```bash
# 1. Navigate to project root
cd /Users/lailaparedes/OfficialStamp/webpage

# 2. Stop any running servers
killall node

# 3. Build the frontend (only needed once, or after frontend changes)
npm run build:frontend

# 4. Start the server
npm start
```

Then open: **http://localhost:3000**

---

## Detailed Steps

### Step 1: Stop Any Running Servers
```bash
killall node
```

### Step 2: Make Sure You're in the Root Directory
```bash
cd /Users/lailaparedes/OfficialStamp/webpage
pwd  # Should show: /Users/lailaparedes/OfficialStamp/webpage
```

### Step 3: Build the Frontend (First Time Only)
```bash
npm run build:frontend
```

This will:
- Install frontend dependencies
- Build the React app
- Create `frontend/build` folder

**Note:** Only run this again if you make changes to the frontend code.

### Step 4: Start the Server
```bash
npm start
```

You should see:
```
📁 Serving frontend from: /Users/lailaparedes/OfficialStamp/webpage/frontend/build
🚀 Server running on port 3000
📊 Dashboard: http://localhost:3000
🔌 API: http://localhost:3000/api
```

### Step 5: Open in Browser
Go to: **http://localhost:3000**

---

## Development Mode (Two Separate Processes)

If you want to develop and see changes in real-time:

### Terminal 1 - Start Backend:
```bash
cd /Users/lailaparedes/OfficialStamp/webpage
npm run dev:backend
```

### Terminal 2 - Start Frontend Dev Server:
```bash
cd /Users/lailaparedes/OfficialStamp/webpage
npm run dev:frontend
```

Then open: **http://localhost:3001** (frontend dev server)

---

## Troubleshooting

### Error: "Cannot find module 'express'"
```bash
cd /Users/lailaparedes/OfficialStamp/webpage
npm install
```

### Error: "ENOENT: no such file or directory, stat '.../frontend/build/index.html'"
```bash
# You need to build the frontend first
npm run build:frontend
```

### Error: "listen EADDRINUSE: address already in use :::3000"
```bash
# Port 3000 is already in use, kill the process:
killall node

# Or find and kill specific process:
lsof -ti:3000 | xargs kill -9
```

### Error: "Missing Supabase credentials"
Make sure `.env` file exists in the root with:
```
SUPABASE_URL=https://ntxpoezharyyftyuywgu.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

---

## Common Commands

| Command | What It Does |
|---------|-------------|
| `npm start` | Start server (production mode) |
| `npm run dev` | Start server (development mode) |
| `npm run dev:backend` | Start backend only |
| `npm run dev:frontend` | Start frontend dev server only |
| `npm run build:frontend` | Build frontend for production |
| `npm run build:all` | Install everything and build |
| `killall node` | Stop all Node.js processes |

---

## Quick Reset (If Something Goes Wrong)

```bash
# Stop everything
killall node

# Go to root directory
cd /Users/lailaparedes/OfficialStamp/webpage

# Rebuild everything
npm install
npm run build:frontend

# Start server
npm start
```

---

**Your server will be at:** http://localhost:3000  
**API endpoints at:** http://localhost:3000/api
