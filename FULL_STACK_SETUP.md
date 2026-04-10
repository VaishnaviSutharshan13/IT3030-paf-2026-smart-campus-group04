# Smart Campus Management System - Full Stack Setup

## Tech Stack
- Frontend: React + Vite + CSS
- Backend: Spring Boot REST API
- Database: PostgreSQL + Flyway

## 1. Prerequisites
- Java 17+
- Maven 3.9+
- Node.js 18+
- PostgreSQL 14+

## 2. Database Setup (PostgreSQL)
Run these commands in PostgreSQL:

```sql
CREATE DATABASE smart_campus_hub;
```

If your local PostgreSQL password is not `postgres`, export it before running backend:

```bash
export SPRING_DATASOURCE_PASSWORD=<your_postgres_password>
```

Flyway will automatically create all tables from:
- `backend/src/main/resources/db/migration/V1__create_smart_campus_schema.sql`
- `backend/src/main/resources/db/migration/V2__add_ticket_images.sql`
- `backend/src/main/resources/db/migration/V3__add_booking_status_column_and_seed_users.sql`
- `backend/src/main/resources/db/migration/V4__default_booking_status_id.sql`

## 3. Backend Configuration
Edit `backend/src/main/resources/application.properties`:
- `spring.datasource.username`
- `spring.datasource.password`
- `app.jwt.secret`

Optional CORS setting:
- `app.cors.allowed-origin`

## 4. Run Backend
```bash
cd backend
mvn spring-boot:run
```

Backend base URL:
- `http://localhost:8080/api/v1`

## 5. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend URL:
- `http://localhost:5173`

If needed, set `.env` in `frontend/`:
```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_AUTH_BASE_URL=http://localhost:8080
```

## 6. Seeded Accounts
Flyway migration seeds two users:
- Admin: `admin@campus.edu` / `password`
- User: `user@campus.edu` / `password`

## 7. Implemented Backend Modules
- Authentication: register, login, forgot-password, me
- Bookings: full CRUD + approve/reject/cancel
- Resources: full CRUD
- Tickets: full CRUD + workflow transitions
- Admin: overview + user role management
- Notifications: list + mark read + mark all read

## 8. API Endpoints

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `GET /auth/me`

### Bookings
- `GET /bookings`
- `POST /bookings`
- `GET /bookings/{id}`
- `PUT /bookings/{id}`
- `DELETE /bookings/{id}`
- `PUT /bookings/{id}/approve`
- `PUT /bookings/{id}/reject`
- `PUT /bookings/{id}/cancel`

### Resources
- `GET /resources`
- `GET /resources/{id}`
- `POST /resources`
- `PUT /resources/{id}`
- `DELETE /resources/{id}`

### Tickets
- `GET /tickets`
- `GET /tickets/{id}`
- `POST /tickets`
- `PUT /tickets/{id}`
- `DELETE /tickets/{id}`
- `PUT /tickets/{id}/assign`
- `PUT /tickets/{id}/start-progress`
- `PUT /tickets/{id}/resolve`
- `PUT /tickets/{id}/close`

### Admin
- `GET /admin/overview`
- `GET /admin/users`
- `PUT /admin/users/{userId}/role`

### Notifications
- `GET /notifications`
- `POST /notifications/{notificationId}/read`
- `POST /notifications/read-all`

## 9. Frontend Pages
- Login
- Register
- Forgot Password
- Dashboard
- Bookings
- Resources
- Tickets
- Admin Panel
- Notifications

## 10. Notes
- JWT auth is used for secure API access.
- Passwords are encrypted using BCrypt.
- Frontend has protected routes and logout redirection.
- Toast notifications and loading states are implemented across feature pages.
