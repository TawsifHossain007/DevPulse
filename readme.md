# DevPulse

A RESTful issue tracking API built with Node.js, Express, and PostgreSQL. Supports role-based access control for contributors and maintainers to report, manage, and resolve project issues.

**Live URL:** `https://devpulse-snowy.vercel.app/`

---

## Features

- User authentication with JWT (signup, login)
- Role-based access control — `contributor` and `maintainer` roles
- Create, read, update, and delete issues
- Contributors can only update their own open issues
- Maintainers have full access to all issues
- Reporter details attached to each issue response
- Passwords hashed with bcrypt

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Language | TypeScript |
| Database | PostgreSQL (via `pg`) |
| Auth | JSON Web Tokens (`jsonwebtoken`) |
| Password Hashing | `bcryptjs` |
| Dev Server | `tsx` |

---

## Setup

### Prerequisites

- Node.js v18+
- PostgreSQL database

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/TawsifHossain007/DevPulse
cd devpulse

# 2. Install dependencies
npm install

# 3. Create a .env file in the root directory
cp .env.example .env
```

Fill in your `.env`:

```env
CONNECTION_STRING=postgresql://user:password@localhost:5432/devpulse
PORT=5000
SECRET=your_jwt_secret
REFRESH_SECRET=your_refresh_secret
```

```bash
# 4. Start the development server
npm run dev

# The server will initialize the database tables automatically on first run.
```

---

## API Endpoints

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login and receive a JWT |

#### Signup body
```json
{
  "name": "Tawsif Hossain",
  "email": "tawsif@example.com",
  "password": "secret123",
  "role": "contributor"
}
```

#### Login body
```json
{
  "email": "tawsif@example.com",
  "password": "secret123"
}
```

---

### Issues

Pass the JWT from login in the `Authorization` header for protected routes.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/issues` | Public | Get all issues with reporter details |
| GET | `/api/issues/:id` | Public | Get a single issue with reporter details |
| POST | `/api/issues` | Authenticated | Create a new issue |
| PUT | `/api/issues/:id` | Contributor (own, open issues) / Maintainer (any) | Update an issue |
| DELETE | `/api/issues/:id` | Maintainer only | Delete an issue |

#### Create / Update issue body
```json
{
  "title": "Login page crashes on Safari",
  "description": "Steps to reproduce...",
  "type": "bug",
  "status": "open"
}
```

Allowed values:
- `type`: `bug`, `feature_request`
- `status`: `open`, `in_progress`, `resolved`

---

## Database Schema

### `users`

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | Primary key |
| name | VARCHAR(50) | Required |
| email | VARCHAR(255) | Unique, required |
| password | TEXT | Bcrypt hashed |
| role | VARCHAR(20) | `contributor` (default) or `maintainer` |
| created_at | TIMESTAMP | Auto-set on insert |
| updated_at | TIMESTAMP | Auto-set on insert |

### `issues`

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | Primary key |
| title | VARCHAR(150) | Required |
| description | TEXT | Required |
| type | VARCHAR(20) | `bug` or `feature_request` |
| status | VARCHAR(20) | `open` (default), `in_progress`, `resolved` |
| reporter_id | INT | Foreign key → `users.id` (CASCADE delete) |
| created_at | TIMESTAMP | Auto-set on insert |
| updated_at | TIMESTAMP | Updated manually on each update |

---

## Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Compile TypeScript to dist/
npm run start    # Run compiled output
```

---

## Author

**Tawsif Hossain**