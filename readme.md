# LocalSkillHub - Full Stack Monorepo

A region-specific freelancer marketplace connecting local talent with clients.

## 📁 Project Structure

```
localskillhub/
├── frontend/          # React + Vite + TypeScript frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and API client
│   │   └── assets/        # Images and static files
│   ├── .env               # Frontend environment variables
│   └── package.json
│
└── backend/           # Node.js + Express + MongoDB backend
    ├── src/
    │   ├── models/        # Mongoose schemas
    │   ├── controllers/   # Business logic
    │   ├── routes/        # API endpoints
    │   ├── middleware/    # Auth, validation, etc.
    │   └── socket/        # Real-time messaging
    ├── .env               # Backend environment variables
    ├── seed.js            # Database seeding script
    └── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Git

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
# Copy .env.example to .env and update values:
# - MONGODB_URI (your MongoDB connection string)
# - JWT_SECRET (random secure string)

# Seed database with sample data
npm run seed

# Start backend server
npm run dev
```

Backend runs on http://localhost:5000

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies  
npm install

# Start development server
npm run dev
```

Frontend runs on http://localhost:5174

## 🔑 Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/localskillhub
JWT_SECRET=your-secret-key
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5174
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 📚 API Endpoints

Base URL: `http://localhost:5000/api`

### Authentication
- `POST /auth/register` - Create new account
- `POST /auth/login` - Sign in
- `GET /auth/me` - Get current user
- `PUT /auth/update-profile` - Update profile

### Jobs
- `GET /jobs` - List all jobs
- `GET /jobs/:id` - Get job details
- `POST /jobs` - Create job (client only)
- `GET /jobs/nearby` - Find nearby jobs

### Freelancers
- `GET /freelancers` - List freelancers
- `GET /freelancers/:id` - Get freelancer profile
- `PUT /freelancers/profile` - Update profile (freelancer only)
- `GET /freelancers/nearby` - Find nearby freelancers

### And more...
See `backend/README.md` for complete API documentation.

## 🧪 Test Accounts

After running `npm run seed` in backend:

**Freelancers:**
- priya@example.com / password123
- arjun@example.com / password123

**Client:**
- rajesh@example.com / password123

## 🛠 Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **UI Components:** shadcn/ui
- **Icons:** react-icons
- **Routing:** React Router v6

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT + bcryptjs
- **Real-time:** Socket.IO
- **Validation:** express-validator
- **Security:** Helmet, CORS, Rate Limiting

## 📖 Features Implemented

✅ User Registration & Login  
✅ Dynamic Onboarding (Role + Interests)  
✅ Job Listings with Search  
✅ Freelancer Browse with Filters  
✅ Real-time Messaging (Socket.IO)  
✅ Geolocation-based Search  
✅ Local & Global Scoring System  
✅ Verification System (Email, Phone, ID)  
✅ Contract Management  
✅ Review & Rating System  
✅ Analytics Dashboard  
✅ Community Leaderboards  

## 🔄 Development Workflow

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Both servers run concurrently
4. Frontend auto-connects to backend API
5. Database changes reflect immediately

## 📦 Deployment

### Backend (Render / Railway / Heroku)
1. Push code to GitHub
2. Connect repository to hosting platform
3. Set environment variables
4. Deploy from `backend` folder

### Frontend (Vercel / Netlify)
1. Connect repository
2. Set build command: `cd frontend && npm run build`
3. Set output directory: `frontend/dist`
4. Set environment variables
5. Deploy

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- shadcn/ui for beautiful components
- MongoDB for database hosting
- Vercel for frontend hosting

---

**Need help?** Check `backend/DATABASE_SETUP.md` for MongoDB setup or `backend/README.md` for API docs.
