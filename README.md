# LocalSkillHub

A multi-role, region-specific freelancer and services marketplace that connects clients with freelancers and companies. LocalSkillHub provides a platform for discovering services, posting jobs, managing projects and contracts, communicating in real time, and processing payments through Stripe.

## Overview

LocalSkillHub is designed to connect clients with skilled professionals and companies through a unified marketplace.

The platform supports multiple user roles, each with dedicated functionality:

* **Client** — Find and hire service providers, post jobs, manage projects and contracts, communicate with providers, and manage payments.
* **Freelancer** — Create service offerings, submit proposals, manage projects and contracts, communicate with clients, and manage earnings.
* **Company** — Create and manage company services, handle projects and contracts, and manage relationships with clients.
* **Super Admin** — Manage users, companies, freelancers, services, payments, commissions, platform settings, disputes, and overall platform activity.

## Main Features

### Authentication & Authorization

* User registration and login
* JWT-based authentication
* Password hashing with bcrypt
* Role-based access control
* Protected routes
* Secure authentication middleware
* User and account management

### Client Features

Clients can:

* Browse available services
* Search for freelancers and companies
* View service and provider profiles
* Post jobs
* Receive and manage proposals
* Hire freelancers or companies
* Create and manage contracts
* Track project progress
* Manage payments
* Communicate with service providers
* Leave reviews and ratings
* Manage account settings

### Freelancer Features

Freelancers can:

* Create and manage freelancer profiles
* Create service offerings
* Browse available jobs
* Submit proposals
* Manage projects
* Manage contracts
* Communicate with clients
* Manage earnings and transactions
* Build their professional profile and reputation
* Receive reviews and ratings

### Company Features

Companies can:

* Create and manage company profiles
* Offer services
* Manage projects
* Manage contracts
* Handle client requests
* Manage company information
* Build company reputation
* Receive reviews

### Super Admin Dashboard

The Super Admin provides centralized platform management, including:

* User management
* Freelancer management
* Company management
* Service management
* Job management
* Proposal management
* Contract management
* Payment and transaction management
* Platform commission configuration
* Dispute management
* Verification management
* Platform settings
* Notifications and administrative activity
* Analytics and platform monitoring

## Jobs, Proposals & Contracts

The backend contains dedicated models and controllers for jobs, proposals, contracts, transactions, reviews, and related platform functionality.

## Payment System

LocalSkillHub uses Stripe for payment processing.

The platform supports project-related payment workflows and transactions, with platform commission settings managed through the administrative system.

The Super Admin can configure platform commission settings.

Payment and escrow behavior depends on the current Stripe implementation and configuration.

## Real-Time Chat

LocalSkillHub implements real-time communication using Socket.IO.

Features include:

* Real-time communication between clients and freelancers
* Sending and receiving text messages
* Media and file sharing
* Support for images, documents, and ZIP files
* Persistent conversation and message records
* Cloud-based file storage through Cloudinary

MongoDB stores conversations, messages, and associated metadata, while Cloudinary handles uploaded media and files.

The backend contains dedicated Conversation and Message models as well as a Socket.IO implementation.

## Media Management

Cloudinary is used for cloud-based media and file storage.

Uploaded media can include:

* Profile images
* Service images
* Company images
* Portfolio/project images
* Documents
* Chat attachments
* Other application media

The backend also contains dedicated upload functionality for handling application media.

## Reviews & Reputation

The platform includes a reputation and review system for users and companies.

Features include:

* User reviews
* Company reviews
* Ratings
* Reputation tracking
* Review management

The backend includes dedicated models for reviews, company reviews, and reputation data.

## Dispute Management

LocalSkillHub includes functionality for handling project/payment disputes.

The platform contains a dedicated dispute model and administrative functionality for managing disputes.

## Notifications

The application includes notification functionality for keeping users informed about relevant platform activity.

The backend contains dedicated notification and administrative notification models and controllers.

## Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Zod
* Leaflet
* Stripe.js
* Socket.IO Client
* Firebase

The frontend uses a component-based architecture with dedicated components, pages, contexts, hooks, utilities, and libraries.

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* REST API
* JWT
* Socket.IO
* Stripe
* Cloudinary
* Redis
* Nodemailer
* Twilio

Additional backend infrastructure includes CORS, request validation, rate limiting, compression, logging, and environment configuration.

The repository follows a frontend/backend separation, and the backend contains dedicated modules for controllers, models, middleware, jobs, services, routes, and Socket.IO.
