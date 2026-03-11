# LocalSkillHub - Database Schema Reference

All collections use MongoDB + Mongoose. Default currency: INR.

---

## 1. users

| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | auto-generated |
| name | String | required, max 100 |
| email | String | required, unique, lowercase |
| passwordHash | String | auto-hashed bcryptjs on pre-save hook |
| role | String | required: client / freelancer / both |
| avatar | String | URL |
| location | Object | {city, state, country, coordinates(GeoJSON Point [lng,lat])} |
| bio | String | max 500 |
| phone | String | |
| isEmailVerified | Boolean | default false |
| isPhoneVerified | Boolean | default false |
| verifiedBadges | Array | [{type, verifiedAt}] |
| socialLinks | Object | {github, linkedin, portfolio, instagram} |
| interests | [String] | |
| followers | [ObjectId] | ref: User |
| following | [ObjectId] | ref: User |
| lastActive | Date | |
| createdAt / updatedAt | Date | auto |

---

## 2. freelancerprofiles

| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | auto |
| userId | ObjectId | ref: User, unique (1-to-1 with User) |
| title | String | required, max 100 |
| bio | String | required, max 2000 |
| skills | Array | [{name, level(beginner/intermediate/expert), yearsOfExperience}] |
| portfolio | Array | [{title, description, images[], link, category, completedAt, tags[]}] |
| rates | Object | {minRate, maxRate, currency, rateType(hourly/fixed/both)} |
| availability | Object | {status(available/busy/unavailable), hoursPerWeek, timezone} |
| localScore | Number | 0-100 |
| globalScore | Number | 0-100 |
| completedJobs | Number | default 0 |
| ratings | Object | {average, count} |
| languages | Array | [{language, proficiency(basic/conversational/fluent/native)}] |
| education | Array | [{institution, degree, field, startYear, endYear}] |
| certifications | Array | [{name, issuedBy, issuedDate, expiryDate}] |
| profileViews | Number | default 0 |
| responseTime | Number | avg hours |
| totalEarnings | Number | |
| successRate | Number | percentage |

---

## 3. jobs

| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | auto |
| clientId | ObjectId | required, ref: User |
| title | String | required, max 200 |
| description | String | required, max 5000 |
| category | String | required (e.g. web-development, graphic-design) |
| skills | [String] | |
| location | Object | {city, state, country} |
| remoteAllowed | Boolean | default false |
| budget | Object | {type(fixed/hourly), amount, currency, min, max} |
| duration | String | short / medium / long |
| experienceLevel | String | beginner / intermediate / expert |
| status | String | draft / open / in-progress / completed / cancelled |
| hiredFreelancer | ObjectId | ref: User |
| proposals | [ObjectId] | ref: Proposal |
| milestones | Array | [{title, amount, dueDate, status(pending/in-progress/submitted/approved/paid)}] |
| createdAt | Date | auto |

---

## 4. proposals

| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | auto |
| jobId | ObjectId | required, ref: Job |
| freelancerId | ObjectId | required, ref: User |
| coverLetter | String | required, max 2000 |
| proposedRate | Object | {amount, type(hourly/fixed), currency} |
| estimatedDuration | Object | {value, unit(days/weeks/months)} |
| status | String | sent / viewed / shortlisted / accepted / rejected / withdrawn |
| viewedAt | Date | |
| milestones | Array | [{title, amount, deliveryDate}] |
| createdAt | Date | auto |

Unique compound index: { jobId + freelancerId }

---

## 5. contracts

| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | auto |
| jobId | ObjectId | required, ref: Job |
| proposalId | ObjectId | ref: Proposal |
| clientId | ObjectId | required, ref: User |
| freelancerId | ObjectId | required, ref: User |
| title | String | required |
| description | String | |
| amount | Object | {total, type(fixed/hourly), currency} |
| milestones | Array | [{title, amount, dueDate, status, approvedAt, paidAt}] |
| status | String | draft / active / completed / cancelled |
| paymentStatus | String | pending / escrow / released |
| startDate / endDate | Date | |
| actualEndDate | Date | |
| signatures | Object | {client:{signed,signedAt}, freelancer:{signed,signedAt}} |
| terms | String | |
| createdAt | Date | auto |

---

## 6. reviews

| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | auto |
| contractId | ObjectId | required, ref: Contract |
| jobId | ObjectId | required, ref: Job |
| reviewerId | ObjectId | required, ref: User |
| reviewedUserId | ObjectId | required, ref: User |
| reviewerType | String | client / freelancer |
| rating | Object | {overall, communication, quality, professionalism, deadlineCompliance, valueForMoney} each 1-5 |
| reviewText | String | required, max 1000 |
| pros | [String] | |
| cons | [String] | |
| wouldRecommend | Boolean | default true |
| isPublic | Boolean | default true |
| createdAt | Date | auto |

---

## 7. messages

| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | auto |
| conversationId | String | sorted([userId1, userId2]).join('_') |
| senderId | ObjectId | required, ref: User |
| receiverId | ObjectId | required, ref: User |
| content | String | required, max 5000 |
| messageType | String | text / file / proposal (default: text) |
| isRead | Boolean | default false |
| readAt | Date | |
| createdAt | Date | auto |

Index: { conversationId, createdAt }

---

## Entity Relationships

```
User(client) ---< Job ---< Proposal >--- User(freelancer)
              |                                |
              +---< Contract ----------------+
                        |
                      Review

User >---< User               (followers/following many-to-many)
User ---< Message >--- User   (via conversationId string)
User(freelancer) ---- FreelancerProfile  (1-to-1 via userId)
```

---

## Seed Test Accounts  (password: password123)

| Role | Email |
|---|---|
| Client | rajesh@example.com |
| Client | kavya@example.com |
| Client | vikram@example.com |
| Client | ananya@example.com |
| Client | suresh@example.com |
| Freelancer | priya@example.com |
| Freelancer | arjun@example.com |
| Freelancer | meera@example.com |
| Freelancer | rohan@example.com |
| Freelancer | sanjay@example.com |
| Freelancer | divya@example.com |
| Freelancer | kiran@example.com |
| Freelancer | neha@example.com |
