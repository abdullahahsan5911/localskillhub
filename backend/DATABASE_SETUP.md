# MongoDB Setup Guide

## Option 1: MongoDB Atlas (Cloud)

### Steps:
1. Visit https://www.mongodb.com/cloud/atlas
2. Sign up / Log in
3. Create a new cluster (Free tier available)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Update your `.env` file:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/localskillhub?retryWrites=true&w=majority
```

Replace `<username>` and `<password>` with your credentials.

### Whitelist IP:
- Go to Network Access
- Add IP Address (0.0.0.0/0 for development, specific IP for production)

---

## Option 2: Local MongoDB (Development)

### Windows:
```powershell
# Using Chocolatey
choco install mongodb

# Or download from: https://www.mongodb.com/try/download/community

# Start MongoDB
mongod --dbpath "C:\data\db"
```

### macOS:
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

### Linux:
```bash
# Ubuntu/Debian
sudo apt-get install -y mongodb

# Start MongoDB
sudo systemctl start mongodb
```

### Update `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/localskillhub
```

---

## Option 3: Docker (Quick Setup)

Create `docker-compose.yml` in backend folder:

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: localskillhub
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

Run:
```bash
docker-compose up -d
```

Update `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/localskillhub
```

---

## Verify Connection

After setup, start your backend:
```bash
cd backend
npm run dev
```

You should see:
```
✅ MongoDB Connected: cluster0-xxxxx.mongodb.net
✅ Server running on port 5000 in development mode
```

---

## Seed Initial Data (Optional)

Create sample data for testing - coming soon!
