# Testing Guide - LocalSkillHub Platform Upgrade

## 🎯 Overview
This guide will help you test all the new features added to the LocalSkillHub platform.

## ✅ Features to Test

### 1. **Identity Verification System**
- Multi-layered verification (8 types)
- Auto-scoring (0-100)
- Verification levels (Unverified → Basic → Standard → Advanced → Premium)

### 2. **Reputation System**
- 3-tier scoring: Overall | Local Trust | Skill Trust
- Dynamic recalculation
- Achievement awards
- Score breakdown

### 3. **Geolocation Features**
- Nearby freelancer/job search
- City-based filtering
- Distance calculation
- Interactive map view

---

## 🚀 Setup Instructions

### 1. **Backend Setup**

```powershell
# Navigate to backend
cd backend

# Install dependencies (if not already done)
npm install

# Ensure .env file is configured
# Copy .env.example to .env and update values:
# - MONGODB_URI (MongoDB Atlas or local)
# - REDIS_HOST, REDIS_PORT (Redis/Memurai)
# - EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD (for email verification)

# Start backend server
npm run dev
```

Backend should start on: `http://localhost:5000`

### 2. **Frontend Setup**

```powershell
# Navigate to frontend
cd frontend

# Install dependencies (if not already done)
npm install

# Start frontend dev server
npm run dev
```

Frontend should start on: `http://localhost:5173`

---

## 🧪 Testing Procedures

### **Test 1: Verification Dashboard**

1. **Access Verification Page**
   - Navigate to: `http://localhost:5173/verification`
   - Should see verification dashboard with progress bar

2. **Email Verification**
   - Click "Send Verification Email" button
   - Check console/logs for email (or actual inbox if SMTP configured)
   - Click verification link in email
   - Refresh dashboard - should show email verified with checkmark
   - Score should increase by +10 points

3. **Phone Verification**
   - Enter phone number in phone verification card
   - Click "Send OTP"
   - Check console for OTP (or SMS if configured)
   - Enter OTP and click "Verify OTP"
   - Should show success message
   - Score should increase by +10 points

4. **Social Connections**
   - Click "Connect LinkedIn" - should show coming soon alert
   - Click "Connect GitHub" - should show coming soon alert
   - (OAuth integration needed for full functionality)

5. **Verification Level**
   - As you complete verifications, watch verification level badge update:
     - 0-20 points: Unverified
     - 20-40 points: Basic
     - 40-60 points: Standard
     - 60-80 points: Advanced
     - 80-100 points: Premium

**Expected API Calls:**
- `GET /api/verify/status` - Get current status
- `POST /api/verify/email/send` - Send email
- `POST /api/verify/phone/send` - Send OTP
- `POST /api/verify/phone/verify` - Verify OTP

---

### **Test 2: Reputation Display**

1. **Compact View (Profile Cards)**
   - Reputation component should show in freelancer profiles
   - Display: Overall score + progress bar + level badge
   - Trending indicator (rising/falling/stable)

2. **Full View (Dedicated Page)**
   - Can be integrated into freelancer dashboard
   - Should show:
     - 3 main scores (Overall, Local Trust, Skill Trust)
     - Score breakdown pie chart
     - Achievements section
     - Performance statistics

3. **Test Reputation API**
   ```bash
   # Using PowerShell or terminal
   curl http://localhost:5000/api/verify/reputation
   # Should return reputation data
   ```

**Expected API Calls:**
- `GET /api/verify/reputation` - Get current user's reputation
- `GET /api/verify/reputation/:userId` - Get specific user's reputation
- `POST /api/verify/reputation/recalculate` - Trigger recalculation

---

### **Test 3: Interactive Map View**

1. **Access Map Page**
   - Navigate to: `http://localhost:5173/map`
   - Should see map view with toggle for Freelancers/Jobs

2. **Location Permission**
   - Browser should ask for location access
   - Grant permission to see your current location
   - Map should center on your coordinates

3. **Search Nearby Freelancers**
   - Select "Freelancers" view
   - Adjust radius (10km, 25km, 50km, 100km, 200km)
   - Should see markers on map
   - Click marker to view freelancer details

4. **Search Nearby Jobs**
   - Select "Jobs" view
   - Adjust radius
   - Should see job markers
   - Click marker to view job details

5. **Filters**
   - Click "Filters" button
   - For Freelancers: filter by rating, availability
   - For Jobs: filter by budget range, remote options
   - Click "Apply" and see updated results

6. **Distance Calculation**
   - Each marker should show distance from your location
   - Distance should be in kilometers

**Expected API Calls:**
- `GET /api/geo/freelancers/nearby?latitude=X&longitude=Y&radius=50`
- `GET /api/geo/jobs/nearby?latitude=X&longitude=Y&radius=50`
- `GET /api/geo/map/clusters?type=freelancers&zoom=10`
- `GET /api/geo/cities/popular?type=freelancers`

---

### **Test 4: Backend API Endpoints**

#### **Verification Endpoints**

```powershell
# Set your auth token
$token = "YOUR_JWT_TOKEN"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Get verification status
Invoke-RestMethod -Uri "http://localhost:5000/api/verify/status" -Headers $headers

# Send email verification
Invoke-RestMethod -Uri "http://localhost:5000/api/verify/email/send" -Method POST -Headers $headers

# Send phone OTP
Invoke-RestMethod -Uri "http://localhost:5000/api/verify/phone/send" -Method POST -Headers $headers -Body (@{phoneNumber="+1234567890"} | ConvertTo-Json)

# Verify phone OTP
Invoke-RestMethod -Uri "http://localhost:5000/api/verify/phone/verify" -Method POST -Headers $headers -Body (@{phoneNumber="+1234567890"; otp="123456"} | ConvertTo-Json)

# Get reputation
Invoke-RestMethod -Uri "http://localhost:5000/api/verify/reputation" -Headers $headers

# Recalculate reputation
Invoke-RestMethod -Uri "http://localhost:5000/api/verify/reputation/recalculate" -Method POST -Headers $headers
```

#### **Geolocation Endpoints**

```powershell
# Find nearby freelancers
Invoke-RestMethod -Uri "http://localhost:5000/api/geo/freelancers/nearby?latitude=28.6139&longitude=77.2090&radius=50"

# Find nearby jobs
Invoke-RestMethod -Uri "http://localhost:5000/api/geo/jobs/nearby?latitude=28.6139&longitude=77.2090&radius=50"

# Get freelancers by city
Invoke-RestMethod -Uri "http://localhost:5000/api/geo/freelancers/city/Delhi"

# Get jobs by city
Invoke-RestMethod -Uri "http://localhost:5000/api/geo/jobs/city/Mumbai"

# Get map clusters
Invoke-RestMethod -Uri "http://localhost:5000/api/geo/map/clusters?type=freelancers&zoom=10"

# Get popular cities
Invoke-RestMethod -Uri "http://localhost:5000/api/geo/cities/popular?type=freelancers&limit=10"

# Geocode address
Invoke-RestMethod -Uri "http://localhost:5000/api/geo/map/geocode?address=Connaught Place, New Delhi"
```

---

## 📊 Test Data Requirements

### **For Full Testing, You Need:**

1. **Users with Locations**
   - Create test users with different geographic coordinates
   - Use real city coordinates for accurate testing

2. **Freelancer Profiles**
   - At least 5-10 freelancer profiles with:
     - Location coordinates
     - Skills array
     - Rating (1-5)
     - Availability status

3. **Job Listings**
   - At least 5-10 job listings with:
     - Location coordinates
     - Category
     - Skills required
     - Budget range

### **Sample Test Data**

```javascript
// Sample coordinates for Indian cities
const cities = {
  delhi: { lat: 28.6139, lng: 77.2090 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  hyderabad: { lat: 17.3850, lng: 78.4867 },
  chennai: { lat: 13.0827, lng: 80.2707 }
};

// Sample freelancer
{
  name: "John Doe",
  skills: ["React", "Node.js", "MongoDB"],
  location: {
    type: "Point",
    coordinates: [77.2090, 28.6139], // [lng, lat]
    city: "Delhi",
    state: "Delhi"
  },
  rating: 4.5,
  available: true
}

// Sample job
{
  title: "Build E-commerce Website",
  category: "Web Development",
  skills: ["React", "Node.js"],
  location: {
    type: "Point",
    coordinates: [77.5946, 12.9716], // Bangalore
    city: "Bangalore",
    state: "Karnataka"
  },
  budget: 50000,
  remote: false
}
```

---

## 🔍 Verification Checklist

### **Backend Tests**
- [ ] MongoDB connection established
- [ ] Redis/Memurai connection established
- [ ] All 10 verification endpoints respond
- [ ] All 7 geolocation endpoints respond
- [ ] Verification model auto-calculates score
- [ ] Reputation model auto-calculates scores
- [ ] Geospatial queries work (2dsphere index)
- [ ] Email sending works (or logs email)
- [ ] OTP generation works

### **Frontend Tests**
- [ ] Verification dashboard loads
- [ ] Email verification flow works
- [ ] Phone OTP flow works
- [ ] Progress bar updates correctly
- [ ] Verification level badge updates
- [ ] Map page loads
- [ ] Location permission requested
- [ ] Markers display on map
- [ ] Filters work correctly
- [ ] Reputation scores display
- [ ] API calls work from frontend

### **Integration Tests**
- [ ] Verification updates trigger reputation recalculation
- [ ] Nearby search returns correct results
- [ ] Distance calculations are accurate
- [ ] Score updates reflect in UI
- [ ] Real-time updates work (if using Socket.IO)

---

## 🐛 Common Issues & Solutions

### **Issue: "Cannot connect to MongoDB"**
**Solution:** 
- Check MongoDB Atlas connection string in `.env`
- Ensure IP whitelist includes your IP
- Verify username/password are correct

### **Issue: "Cannot connect to Redis"**
**Solution:**
- Ensure Redis/Memurai is running
- Check REDIS_HOST and REDIS_PORT in `.env`
- On Windows, use Memurai instead of Redis

### **Issue: "Email verification not sending"**
**Solution:**
- Configure EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD in `.env`
- For Gmail: enable "Less secure app access" or use App Password
- Check backend console for email content (logged if SMTP not configured)

### **Issue: "No markers showing on map"**
**Solution:**
- Ensure test data has location coordinates
- Check MongoDB 2dsphere indexes are created
- Verify geolocation API calls are successful
- Check browser console for errors

### **Issue: "Verification score not updating"**
**Solution:**
- Check Verification model pre-save hooks are executing
- Verify frontend is calling getVerificationStatus after verification
- Check backend logs for errors during score calculation

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

VERIFICATION TESTS:
[ ] Email verification: PASS / FAIL - Notes: __________
[ ] Phone verification: PASS / FAIL - Notes: __________
[ ] Social connections: PASS / FAIL - Notes: __________
[ ] Score calculation: PASS / FAIL - Notes: __________
[ ] Level updates: PASS / FAIL - Notes: __________

REPUTATION TESTS:
[ ] Reputation display: PASS / FAIL - Notes: __________
[ ] Score breakdown: PASS / FAIL - Notes: __________
[ ] Achievements: PASS / FAIL - Notes: __________
[ ] Recalculation: PASS / FAIL - Notes: __________

GEOLOCATION TESTS:
[ ] Map loads: PASS / FAIL - Notes: __________
[ ] Location access: PASS / FAIL - Notes: __________
[ ] Nearby search: PASS / FAIL - Notes: __________
[ ] Distance calculation: PASS / FAIL - Notes: __________
[ ] Filters: PASS / FAIL - Notes: __________
[ ] City search: PASS / FAIL - Notes: __________

OVERALL STATUS: PASS / FAIL
Additional Notes:
_________________________________
```

---

## 🎉 Success Criteria

All features pass when:
1. ✅ All verification methods complete successfully
2. ✅ Scores calculate and update correctly
3. ✅ Reputation displays with accurate data
4. ✅ Map shows nearby freelancers/jobs
5. ✅ Distance calculations are accurate
6. ✅ Filters work as expected
7. ✅ No console errors
8. ✅ All API endpoints respond correctly

---

## 📞 Support

If you encounter issues:
1. Check backend console logs
2. Check frontend browser console
3. Verify MongoDB and Redis are running
4. Ensure all environment variables are set
5. Check this testing guide for common solutions

Happy Testing! 🚀
