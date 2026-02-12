<div align="center">
  <a href="https://gemsofindia.org/">
    <img src="https://gemsofindia.org/logo.png" alt="Gems of India" width="50" height="50">
    <h1 style="margin-bottom: 0">gemsofindia.org</h1>
   </a>
    <h2 style="margin-top: 0">High Level Design</h2>
    <p>This document provides a HLD overview of the Gems-of-India application architecture.</p>
</div>

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Module Reference](#module-reference)
3. [Core Components](#core-components)
4. [Data Flow](#data-flow)
5. [API Endpoints](#api-endpoints)
6. [Database Schema](#database-schema)
7. [Authentication Flow](#authentication-flow)
8. [Deployment Microservices Architecture](#deployment-microservices-architecture)
9. [Additional Documentation](#additional-documentation)

## System Architecture

### Directory Structure with Key Files

```bash
gems-of-india/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/page.tsx         # Login page with email/password and OAuth
│   │   ├── sign-up/page.tsx         # User registration
│   │   ├── forgot-password/page.tsx # Password recovery
│   │   └── verify-email/            # Email verification flow
│   │       ├── page.tsx
│   │       ├── sent/page.tsx
│   │       └── success/page.tsx
│   │
│   ├── (entities)/
│   │   ├── [slug]/                 # Dynamic entity pages
│   │   │   ├── page.tsx            # Entity detail view
│   │   │   ├── edit/page.tsx       # Edit entity form
│   │   │   └── members/page.tsx    # Entity members management
│   │   └── submit/page.tsx         # New entity submission
│   │
│   ├── api/                        # API routes
│   │   ├── entities/               # Entity CRUD operations
│   │   │   ├── [entityId]/route.ts
│   │   │   └── check-url/route.ts  # URL availability check
│   │   ├── reviews/                # Review management
│   │   └── uploadthing/            # File uploads
│   │
│   ├── admin/                      # Admin dashboard
│   │   ├── page.tsx
│   │   └── moderation/page.tsx     # Content moderation
│   │
│   ├── dashboard/                  # User dashboard
│   │   └── page.tsx
│   │
│   └── ...
│
├── components/
│   ├── entity/                    # Entity-related components
│   │   ├── EntityCard.tsx         # Entity preview card
│   │   ├── EntityForm.tsx         # Create/Edit entity form
│   │   └── review-display/        # Review components
│   │       ├── ReviewList.tsx
│   │       └── ReviewForm.tsx
│   │
│   ├── ui/                        # Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   │
│   └── ...
│
├── docs/                          # Project documentations
|
|
├── lib/
│   ├── db/
│   │   ├── index.ts               # Database client
│   │   └── schema.ts              # Database schema
│   │
│   ├── auth/
│   │   ├── options.ts             # NextAuth config
│   │   └── providers.ts           # Auth providers
│   │
│   └── validations/               # Form validations
│
└── ...
├── public/                # Static assets
└── drizzle/               # Database migrations and schema
```

## Module Reference

> ### 1. Authentication Module

- **Path**: `/app/(auth)/**`
- **Components**:
  - `sign-in/page.tsx` - Login with email/password and OAuth providers
  - `sign-up/page.tsx` - New user registration form
  - `forgot-password/page.tsx` - Password reset flow
  - `verify-email/` - Email verification flow
    - `page.tsx` - Verification form
    - `sent/page.tsx` - Verification email sent confirmation
    - `success/page.tsx` - Successful verification page
- **Configuration**:
  - `/lib/auth/options.ts` - NextAuth configuration
  - `/lib/auth/providers.ts` - OAuth and email providers setup
  - `/lib/validations/auth.ts` - Form validations using Zod
- **Key Features**:
  - Email/Password authentication
  - Social logins (Google, GitHub, etc.)
  - Email verification
  - Password reset flow
  - Session management

> ### 2. Entity Management

- **Path**: `/app/(entities)/**`
- **Components**:
  - `[slug]/page.tsx` - Entity detail view with tabs for info, reviews, and activity
  - `[slug]/edit/page.tsx` - Edit entity details (admin/moderator only)
  - `[slug]/members/page.tsx` - Manage entity members and roles
  - `submit/page.tsx` - Form for submitting new entities
- **API Endpoints**:
  - `POST /api/entities` - Create new entity
  - `GET /api/entities/[id]` - Get entity details
  - `PUT /api/entities/[id]` - Update entity
  - `GET /api/entities/check-url` - Check URL availability
- **Key Features**:
  - Rich text editing with Tiptap
  - Image uploads with UploadThing
  - URL slug generation
  - Version history
  - Moderation workflow

> ### 3. Review System

- **Path**: `/app/reviews/**`
- **Components**:
  - `[id]/page.tsx` - Review detail view with comments
  - `new/page.tsx` - Create new review
  - `components/ReviewCard.tsx` - Review display component
  - `components/ReviewForm.tsx` - Review submission form
- **API Endpoints**:
  - `POST /api/reviews` - Submit new review
  - `GET /api/reviews/[id]` - Get review details
  - `PUT /api/reviews/[id]` - Update review
  - `POST /api/reviews/[id]/vote` - Vote on review
- **Features**:
  - Rich text reviews with markdown support
  - Rating system (1-5 stars)
  - Review reactions (helpful/not helpful)
  - Comment threads
  - Review moderation
- **Path**: `/app/reviews/**`
- **Components**:
  - `new/page.tsx` - Create new review
  - `[id]/page.tsx` - Review detail view
- **API**: `/app/api/reviews/route.ts` - Review management

> ### 4. Admin Dashboard

- **Path**: `/app/admin/**`
- **Components**:
  - `page.tsx` - Main admin dashboard with stats overview
  - `users/page.tsx` - User management
  - `moderation/page.tsx` - Content moderation queue
  - `settings/page.tsx` - System settings
- **API Endpoints**:
  - `GET /api/admin/stats` - System statistics
  - `GET /api/admin/users` - List users with filters
  - `PUT /api/admin/users/[id]` - Update user roles/status
  - `GET /api/admin/moderation` - Get items for moderation
  - `POST /api/admin/moderation/approve` - Approve content
  - `POST /api/admin/moderation/reject` - Reject content
- **Features**:
  - User role management (admin, moderator, user)
  - Content moderation workflow
  - System health monitoring
  - Audit logs
  - Email template management

## Core Components

> ### 1. Database Layer

- **Location**: `/drizzle/`
- **Schema**: `drizzle/schema.ts` - Database schema definition
- **Migrations**: `drizzle/migrations/` - Database version control
- **Client**: `lib/db/index.ts` - Database client initialization

> ### 2. API Layer

- **Location**: `/app/api/**`
- **Key Endpoints**:
  - `/api/auth/*` - Authentication endpoints
  - `/api/entities/*` - Entity management
  - `/api/reviews/*` - Review operations
  - `/api/admin/*` - Admin endpoints

> ### 3. UI Components

- **Location**: `/components/`
- **Key Components**:
  - `EntityCard.tsx` - Displays entity information
  - `ReviewForm.tsx` - Form for submitting reviews
  - `RatingComponent.tsx` - Star rating component
  - `SearchBar.tsx` - Global search functionality

## Data Flow

1. **User Authentication**

   ```
   Frontend → /app/(auth)/login → /api/auth/[...nextauth] → Database
   ```

2. **Entity Creation**

   ```
   /app/(entities)/new → /api/entities → Database
   ```

3. **Review Submission**
   ```
   /app/reviews/new → /api/reviews → Database
   ```

## API Endpoints

> ### Authentication

- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/session` - Get current session

> ### Entities

- `GET /api/entities` - List entities
- `POST /api/entities` - Create entity
- `GET /api/entities/[id]` - Get entity details
- `PUT /api/entities/[id]` - Update entity

> ### Reviews

- `GET /api/reviews` - List reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/[id]` - Get review details
- `DELETE /api/reviews/[id]` - Delete review

## Database Schema

Kindly take look into the [SCHEMA.md](./SCHEMA.md) for more information.

## Authentication Flow

1. User submits credentials
2. NextAuth.js validates credentials
3. Session token is generated and stored
4. Token is used for subsequent requests
5. Middleware protects routes based on roles

![auth_signin_flow_img](./assets/sign-in-flow.jpg)
![auth_signup_flow_img](./assets/sign-up-flow.jpg)

## Deployment Microservices Architecture

### Development

Sample docker compose

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/gems_dev
  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=gems_dev
```

### Production

- Containerized deployment
- Load balancing
- Database replication
- CDN for static assets
- Monitoring and logging

## Additional Documentation

- [LLD](./LLD.md)
- [Database Schema](./SCHEMA.md)
- [Deployment Guide](./DEPLOYMENT.md)
