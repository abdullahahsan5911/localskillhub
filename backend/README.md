# LocalSkillHub Backend

Backend API for LocalSkillHub - A region-specific freelancer marketplace platform.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Real-time**: Socket.IO
- **Payments**: Stripe
- **File Upload**: Cloudinary

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update environment variables in `.env`:
   - MongoDB URI
   - JWT Secret
   - Stripe Keys (if using payments)
   - Cloudinary credentials (if using file uploads)

4. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /logout` - Logout user
- `GET /me` - Get current user
- `PUT /update-profile` - Update profile
- `PUT /change-password` - Change password

### Users (`/api/users`)
- `GET /` - Get all users
- `GET /:id` - Get single user
- `PUT /:id` - Update user
- `DELETE /:id` - Delete/deactivate user

### Freelancers (`/api/freelancers`)
- `GET /` - Get all freelancers
- `GET /search` - Search freelancers
- `GET /:id` - Get freelancer profile
- `POST /profile` - Create freelancer profile
- `PUT /profile` - Update freelancer profile
- `POST /portfolio` - Add portfolio item
- `POST /:id/endorse` - Endorse freelancer

### Jobs (`/api/jobs`)
- `GET /` - Get all jobs
- `GET /search` - Search jobs
- `GET /nearby` - Get nearby jobs
- `GET /:id` - Get single job
- `POST /` - Create job
- `PUT /:id` - Update job
- `DELETE /:id` - Delete job
- `POST /:id/invite` - Invite freelancers

### Proposals (`/api/proposals`)
- `GET /` - Get proposals
- `GET /:id` - Get single proposal
- `POST /` - Create proposal
- `PUT /:id` - Update proposal
- `POST /:id/accept` - Accept proposal
- `POST /:id/reject` - Reject proposal
- `POST /:id/negotiate` - Add negotiation

### Contracts (`/api/contracts`)
- `GET /` - Get contracts
- `GET /:id` - Get single contract
- `POST /` - Create contract
- `POST /:id/sign` - Sign contract
- `POST /:id/milestones/:milestoneId/submit` - Submit milestone
- `POST /:id/milestones/:milestoneId/approve` - Approve milestone
- `POST /:id/milestones/:milestoneId/release-payment` - Release payment

### Messages (`/api/messages`)
- `GET /conversations` - Get conversations
- `GET /:conversationId` - Get messages
- `POST /` - Send message
- `PUT /:messageId/read` - Mark as read

### Reviews (`/api/reviews`)
- `GET /` - Get reviews
- `POST /` - Create review
- `POST /:id/respond` - Respond to review
- `POST /:id/helpful` - Mark review helpful

### Verification (`/api/verification`)
- `POST /phone` - Send phone verification
- `POST /phone/verify` - Verify phone code
- `POST /email` - Verify email
- `POST /id` - Verify ID
- `POST /badge` - Add badge

### Community (`/api/community`)
- `GET /leaderboard` - Get leaderboard
- `GET /badges` - Get available badges
- `GET /events` - Get events
- `GET /rank` - Get user rank

### Analytics (`/api/analytics`)
- `GET /freelancer` - Freelancer analytics
- `GET /client` - Client analytics
- `GET /platform` - Platform stats

## Socket.IO Events

### Client → Server:
- `join` - Join with user ID
- `joinConversation` - Join conversation room
- `sendMessage` - Send message
- `typing` - Start typing indicator
- `stopTyping` - Stop typing indicator

### Server → Client:
- `newMessage` - New message received
- `notification` - New notification
- `userTyping` - User is typing
- `userStoppedTyping` - User stopped typing

## Development

```bash
# Start dev server with nodemon
npm run dev

# Start production server
npm start
```

## License

MIT
