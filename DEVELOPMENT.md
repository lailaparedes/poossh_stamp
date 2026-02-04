# 🛠️ Local Development Guide

## Quick Start (Development Mode)

### Option 1: Development with Hot Reload (Recommended)

**Terminal 1 - Backend:**
```bash
npm run dev:backend
# Or: cd backend && node server.js
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
# Or: cd frontend && npm start
```

- **Backend:** http://localhost:3000
- **Frontend:** http://localhost:3001 (opens automatically)
- **Hot Reload:** ✅ Frontend changes appear instantly

---

### Option 2: Test Production Build Locally

Test exactly what will deploy to Render:

```bash
npm run test:local
```

This will:
1. Build the frontend (production build)
2. Start the server
3. Serve at: http://localhost:3000

---

## 📁 Project Structure

```
webpage/
├── frontend/          # React app
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   └── App.js
│   ├── build/         # Production build (created by npm run build)
│   └── package.json
│
├── backend/           # Express server (or use root-level files)
│   ├── routes/
│   ├── config/
│   ├── middleware/
│   ├── utils/
│   └── server.js
│
├── server.js          # Main server file (in root)
├── routes/            # API routes
├── config/            # Configuration
└── package.json       # Root package.json
```

---

## 🔄 Typical Development Workflow

### 1. **Start Development Servers**
```bash
# Terminal 1
npm run dev:backend

# Terminal 2  
npm run dev:frontend
```

### 2. **Make Changes**
- Edit React components → Changes appear instantly
- Edit backend routes → Restart backend server

### 3. **Test Locally**
- Test all features work
- Check console for errors
- Verify API calls work

### 4. **Build & Test Production**
```bash
npm run test:local
```

### 5. **Commit & Push**
```bash
git add .
git commit -m "Description of changes"
git push
```

### 6. **Render Auto-Deploys** 🚀
- Render detects push
- Builds automatically
- Deploys to production

---

## 🧪 Testing Checklist

Before deploying, test locally:

- [ ] Login/Signup works
- [ ] Dashboard loads correctly
- [ ] My Cards page shows all cards
- [ ] Create new card works
- [ ] Switch between cards works
- [ ] Delete card works
- [ ] QR code generation works
- [ ] Logout works
- [ ] No console errors
- [ ] All routes work

---

## 🐛 Common Issues

### Frontend won't start
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Backend won't start
```bash
# Check if port 3000 is in use
lsof -ti:3000 | xargs kill -9

# Start again
npm run dev:backend
```

### Changes not appearing
- Frontend: Should hot reload automatically
- Backend: Restart the server (Ctrl+C, then run again)

### "Cannot find module"
```bash
# Install dependencies
npm run build:backend
npm run build:frontend
```

---

## 🔌 Environment Variables

Make sure `backend/.env` exists:

```env
SUPABASE_URL=https://ntxpoezharyyftyuywgu.supabase.co
SUPABASE_ANON_KEY=your-key-here
JWT_SECRET=punchme-merchant-secret-key-change-in-production-2024
PORT=3000
NODE_ENV=development
```

---

## 📦 Install Dependencies

### First Time Setup
```bash
# Root dependencies (if any)
npm install

# Backend dependencies
cd backend && npm install && cd ..

# Frontend dependencies
cd frontend && npm install && cd ..
```

---

## 🚀 Deployment Workflow

### Best Practice:

1. **Develop Locally** → Make changes, test with hot reload
2. **Test Production Build** → `npm run test:local`
3. **Commit Changes** → `git add . && git commit -m "message"`
4. **Push to GitHub** → `git push`
5. **Render Auto-Deploys** → Wait 3-5 minutes
6. **Verify Production** → Test on live site

### Emergency Rollback

If deployment breaks:

```bash
# Revert last commit
git revert HEAD
git push

# Or go back to specific commit
git reset --hard <commit-hash>
git push --force
```

---

## 📊 Monitoring

### Local Development
- Check terminal output for errors
- Check browser console (F12)
- Check Network tab for API calls

### Production (Render)
- **Logs:** Render Dashboard → Logs
- **Metrics:** Render Dashboard → Metrics
- **Health:** https://punchme-merchant-portal.onrender.com/api/health

---

## 💡 Pro Tips

### Use nodemon for auto-restart
```bash
cd backend
npm install -g nodemon
nodemon server.js
```

### Use React DevTools
- Install React Developer Tools extension
- Inspect component state/props

### Use Postman/Thunder Client
Test API endpoints directly:
- POST http://localhost:3000/api/auth/login
- GET http://localhost:3000/api/merchants
- GET http://localhost:3000/api/analytics/dashboard

---

## 📝 Quick Commands

```bash
# Start development
npm run dev:backend        # Backend only
npm run dev:frontend       # Frontend only (both needed)

# Build for production
npm run build:all          # Build both

# Test production locally
npm run test:local         # Build + serve

# Deploy
git add . && git commit -m "message" && git push
```

---

## 🆘 Need Help?

1. Check terminal output for errors
2. Check browser console (F12)
3. Check Render logs if deployed
4. Verify environment variables are set
5. Clear browser cache (Cmd+Shift+R)
