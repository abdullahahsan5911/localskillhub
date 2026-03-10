# Quick Start Guide

## 🚀 First Time Setup (Windows)

Run this PowerShell script to get everything up and running:

```powershell
# 1. Install root dependencies
npm install

# 2. Install all project dependencies
npm run install:all

# 3. Setup backend
cd backend

# 4. Create .env file (copy and paste your MongoDB URI)
Copy-Item .env.example .env
notepad .env

# 5. Seed the database with sample data
npm run seed

# 6. Go back to root
cd ..

# 7. Start both frontend and backend together!
npm run dev
```

## 🎯 What You'll See

- **Backend:** http://localhost:5000/api/health
- **Frontend:** http://localhost:5174
- **API Docs:** http://localhost:5000

## ✅ Verify Setup

1. Open http://localhost:5000/api/health - should show `{"status":"success"}`
2. Open http://localhost:5174 - should show LocalSkillHub homepage
3. Try logging in with test account: `priya@example.com` / `password123`

## 🔧 Manual Commands

If you prefer to run services separately:

**Backend only:**
```powershell
cd backend
npm run dev
```

**Frontend only:**
```powershell
cd frontend
npm run dev
```

## 📝 Database Connection

Make sure your `.env` file in the `backend` folder has:

```env
MONGODB_URI=mongodb+srv://localskill:YOUR_PASSWORD@cluster0.byhsfja.mongodb.net/localskillhub?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secret-key-change-this
```

## 🐛 Troubleshooting

**"Cannot find module..."**
```powershell
npm run install:all
```

**"MongoDB connection failed"**
- Check your MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)
- Verify password in .env file
- Ensure database user exists in Atlas

**"Port 5000 already in use"**
```powershell
# Kill the process
Stop-Process -Name node -Force
# Or change PORT in backend/.env
```

**Frontend not connecting to backend**
- Verify backend is running on port 5000
- Check frontend/.env has `VITE_API_URL=http://localhost:5000/api`

## 🎉 You're Ready!

Your full-stack LocalSkillHub app is now running with:
- ✅ MongoDB database connected
- ✅ Backend API at port 5000
- ✅ Frontend app at port 5174
- ✅ Real-time messaging with Socket.IO
- ✅ Sample data loaded

Happy coding! 🚀
