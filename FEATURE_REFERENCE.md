# 🎯 Platform Upgrade - Quick Reference

## 📁 New Files Created

### **Backend** (10 files)
```
backend/src/
├── models/
│   ├── Verification.js          # 8 verification types, auto-scoring
│   ├── Reputation.js            # 3-tier scoring system
│   └── ServicePackage.js        # Tiered service offerings
├── services/
│   ├── verification.service.js  # Email, phone, ID, biometric verification
│   ├── reputation.service.js    # Dynamic reputation calculation
│   └── geolocation.service.js   # Nearby search, map clustering
├── controllers/
│   ├── verificationController.js # 10 verification endpoints
│   └── geolocationController.js  # 7 geolocation endpoints
└── routes/
    ├── verificationRoutes.js    # /api/verify/* routes
    └── geolocationRoutes.js     # /api/geo/* routes
```

### **Frontend** (4 files)
```
frontend/src/
├── components/
│   ├── ReputationDisplay.tsx    # Score visualization component
│   └── MapView.tsx              # Interactive map component
└── pages/
    ├── VerificationDashboard.tsx # Identity verification UI
    └── MapPage.tsx              # Map page layout
```

### **Documentation** (1 file)
```
TESTING_GUIDE.md                 # Comprehensive testing procedures
```

---

## 🔗 New Routes

### **Frontend Routes**
- `/verification` - Identity verification dashboard
- `/map` - Interactive map for nearby discovery

### **Backend API Routes**

#### **Verification Endpoints** (`/api/verify/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/email/send` | Send email verification link |
| GET | `/email/verify/:token` | Verify email with token |
| POST | `/phone/send` | Send phone OTP |
| POST | `/phone/verify` | Verify phone with OTP |
| POST | `/id/submit` | Submit ID documents |
| POST | `/biometric/verify` | Submit selfie for face match |
| POST | `/social/linkedin` | Connect LinkedIn profile |
| POST | `/social/github` | Connect GitHub profile |
| GET | `/status` | Get verification status |
| GET | `/reputation` | Get reputation scores |
| GET | `/reputation/:userId` | Get user's reputation |
| POST | `/reputation/recalculate` | Recalculate reputation |

#### **Geolocation Endpoints** (`/api/geo/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/freelancers/nearby` | Find freelancers by location |
| GET | `/jobs/nearby` | Find jobs by location |
| GET | `/freelancers/city/:city` | Get freelancers in city |
| GET | `/jobs/city/:city` | Get jobs in city |
| GET | `/map/clusters` | Get map clustering data |
| GET | `/cities/popular` | Get popular cities |
| GET | `/map/geocode` | Convert address to coordinates |

---

## 📊 Database Schema Changes

### **Verification Model**
```javascript
{
  userId: ObjectId,
  verificationScore: Number (0-100),
  verificationLevel: String, // unverified | basic | standard | advanced | premium
  verifications: {
    email: { verified: Boolean, verifiedAt: Date, token: String, tokenExpiry: Date },
    phone: { verified: Boolean, verifiedAt: Date, phoneNumber: String, otp: String, otpExpiry: Date },
    identity: { verified: Boolean, documents: [String], submittedAt: Date },
    biometric: { verified: Boolean, selfieUrl: String, matchScore: Number },
    linkedin: { verified: Boolean, profileUrl: String, profileData: Object },
    github: { verified: Boolean, username: String, profileData: Object },
    education: { verified: Boolean, institutions: [Object] },
    employment: { verified: Boolean, employers: [Object] }
  },
  trustBadges: [{ type: String, earnedAt: Date }]
}
```

### **Reputation Model**
```javascript
{
  userId: ObjectId,
  overallScore: Number (0-100),
  localTrustScore: Number (0-100),
  skillTrustScore: Number (0-100),
  level: String, // beginner | intermediate | advanced | expert
  trending: String, // rising | falling | stable
  scores: {
    verification: Number,
    reviews: Number,
    endorsements: Number,
    events: Number,
    employerTrust: Number,
    performance: Number
  },
  regionalScores: Map,
  categoryScores: Map,
  achievements: [{ type: String, earnedAt: Date }]
}
```

### **User Model Updates**
```javascript
{
  // ... existing fields ...
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number], // [longitude, latitude]
    city: String,
    state: String,
    country: String
  }
}
// Indexes: 2dsphere on location.coordinates
```

### **Job Model Updates**
```javascript
{
  // ... existing fields ...
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number], // [longitude, latitude]
    city: String,
    state: String,
    country: String
  },
  remote: Boolean
}
// Indexes: 2dsphere on location.coordinates
```

---

## 🎨 Frontend Components API

### **VerificationDashboard**
```tsx
import VerificationDashboard from '@/pages/VerificationDashboard';

// Usage: <VerificationDashboard />
// Route: /verification
```

**Features:**
- Progress bar (verification score 0-100%)
- 6 verification cards (email, phone, ID, selfie, LinkedIn, GitHub)
- OTP flow for phone verification
- Verification level badges
- Real-time status updates

### **ReputationDisplay**
```tsx
import ReputationDisplay from '@/components/ReputationDisplay';

// Compact mode (for profile cards)
<ReputationDisplay userId={userId} compact />

// Full mode (for dedicated page)
<ReputationDisplay userId={userId} />
```

**Props:**
- `userId?: string` - User ID (optional, uses current user if not provided)
- `compact?: boolean` - Compact view mode (default: false)

**Features:**
- 3 score displays (Overall | Local Trust | Skill Trust)
- Score breakdown visualization
- Achievement badges
- Performance statistics
- Trending indicators

### **MapView**
```tsx
import MapView from '@/components/MapView';

// Freelancers map
<MapView type="freelancers" height="600px" />

// Jobs map
<MapView type="jobs" height="700px" />
```

**Props:**
- `type: 'freelancers' | 'jobs'` - Map content type
- `initialCenter?: { lat: number, lng: number }` - Initial map center
- `height?: string` - Map container height (default: '600px')

**Features:**
- Radius selector (10-200 km)
- Advanced filters
- Click markers for details
- Distance calculation
- Real-time search count

---

## 🛠️ API Library Methods

### **Verification Methods**
```typescript
// Email verification
api.sendEmailVerification()
api.verifyEmail(token: string)

// Phone verification
api.sendPhoneOTP(phoneNumber: string)
api.verifyPhoneOTP(phoneNumber: string, otp: string)

// ID & Biometric
api.submitIDVerification(formData: FormData)
api.submitBiometricVerification(formData: FormData)

// Social connections
api.connectLinkedIn({ profileUrl, profileData? })
api.connectGitHub({ username, profileData? })

// Status & reputation
api.getVerificationStatus()
api.getReputation(userId?: string)
api.recalculateReputation()
```

### **Geolocation Methods**
```typescript
// Nearby search
api.findFreelancersNearby({
  latitude: number,
  longitude: number,
  radius?: number,
  skills?: string[],
  minRating?: number,
  available?: boolean
})

api.findJobsNearby({
  latitude: number,
  longitude: number,
  radius?: number,
  skills?: string[],
  category?: string,
  minBudget?: number,
  maxBudget?: number,
  remote?: boolean
})

// City search
api.getFreelancersByCity(city: string, params?)
api.getJobsByCity(city: string, params?)

// Map features
api.getMapClusters({ type, zoom, bounds? })
api.getPopularCities(type, limit)
api.geocodeAddress(address: string)
```

---

## 🔢 Scoring System

### **Verification Score** (0-100)
- Email: +10 points
- Phone: +10 points
- Identity (ID): +15 points
- Biometric (Selfie): +20 points
- LinkedIn: +15 points
- GitHub: +10 points
- Education: +10 points
- Employment: +10 points

**Levels:**
- 0-20: Unverified
- 20-40: Basic
- 40-60: Standard
- 60-80: Advanced
- 80-100: Premium

### **Reputation Score** (0-100)
**Component Weights:**
- Verification: 25%
- Reviews: 20%
- Endorsements: 15%
- Employer Trust: 15%
- Events: 10%
- Referrals: 10%
- Performance: 5%

**3 Score Types:**
1. **Overall Score**: Weighted average of all components
2. **Local Trust Score**: Region-specific activity + reviews
3. **Skill Trust Score**: Category expertise + endorsements

---

## 🌍 Geolocation Features

### **Distance Calculation**
- Uses Haversine formula
- Returns distance in kilometers
- Accurate for Earth's curvature

### **Nearby Search**
- MongoDB $near query with 2dsphere index
- Configurable radius (10-200 km)
- Sorted by distance (closest first)

### **Map Clustering**
- Groups nearby markers
- Zoom-level based aggregation
- Click cluster to expand

### **Popular Cities**
- Top cities by freelancer/job count
- Cached for performance
- Auto-updates daily

---

## ⚡ Environment Variables

### **Required for New Features**
```env
# Email Verification (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Maps API (Optional - for production map)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Database (Ensure geospatial support)
MONGODB_URI=mongodb+srv://...
```

---

## 📈 Performance Considerations

### **Database Indexes**
```javascript
// User collection
db.users.createIndex({ "location.coordinates": "2dsphere" })

// Job collection
db.jobs.createIndex({ "location.coordinates": "2dsphere" })

// Verification collection
db.verifications.createIndex({ userId: 1 })

// Reputation collection
db.reputations.createIndex({ userId: 1 })
```

### **Caching Strategy**
- Popular cities cached for 24 hours
- Verification status cached for 5 minutes
- Reputation scores cached for 10 minutes
- Map clusters cached based on zoom level

---

## 🚀 Quick Start Commands

```powershell
# Start backend
cd backend
npm install
npm run dev

# Start frontend
cd frontend
npm install
npm run dev

# Test API
curl http://localhost:5000/api/verify/status

# Access app
http://localhost:5173/verification
http://localhost:5173/map
```

---

## 📱 Feature Access

| Feature | Route | Auth Required |
|---------|-------|---------------|
| Verification Dashboard | `/verification` | Yes |
| Map View | `/map` | No (optional) |
| Reputation Display | Component-based | Varies |

---

## 🎯 Next Steps

1. ✅ All features implemented
2. ✅ No compilation errors
3. ⏳ Test features (use TESTING_GUIDE.md)
4. ⏳ Configure email SMTP
5. ⏳ Add test data to database
6. ⏳ Integrate real map library (Leaflet/Google Maps)
7. ⏳ Add OAuth for LinkedIn/GitHub
8. ⏳ Deploy to production

---

## 📞 Reference Links

- **Testing Guide**: `TESTING_GUIDE.md`
- **Backend README**: `backend/README.md`
- **Frontend README**: `frontend/readme.md`
- **Database Setup**: `backend/DATABASE_SETUP.md`
- **Redis Setup**: `backend/REDIS_SETUP.md`

---

**Last Updated**: March 11, 2026
**Version**: 2.0.0 - Platform Upgrade Complete
