# Smart Campus Ticket + OAuth2/JWT Implementation Guide

## 1. Configure Google OAuth2

1. Create OAuth credentials in Google Cloud Console.
2. Add authorized redirect URI:
   - `http://localhost:8080/login/oauth2/code/google`
3. Set environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `APP_JWT_SECRET` (at least 32 chars)
   - `APP_FRONTEND_SUCCESS_URL` (default: `http://localhost:5173/auth/callback`)

## 2. Database Migration

- Existing schema: `V1__create_smart_campus_schema.sql`
- Added image support: `V2__add_ticket_images.sql`

Run app once to execute Flyway migrations automatically.

## 3. Auth Flow (Backend)

1. User opens frontend and clicks **Login with Google**.
2. Browser goes to `/oauth2/authorization/google`.
3. Spring Security handles Google login.
4. `OAuth2AuthenticationSuccessHandler`:
   - creates/updates local user + assigns `USER` role if missing
   - generates JWT
   - redirects to frontend callback with `?token=...`
5. Frontend stores token in localStorage.
6. All API calls send `Authorization: Bearer <token>`.

## 4. Role-Based Access

- `USER`, `ADMIN`, `TECHNICIAN` are loaded from `roles` table.
- Ticket endpoints enforce access with `@PreAuthorize`:
  - create ticket: USER/ADMIN/TECHNICIAN
  - assign technician: ADMIN
  - start progress: TECHNICIAN/ADMIN
  - resolve: TECHNICIAN/ADMIN
  - close: ADMIN

## 5. Ticket Workflow

Allowed transitions only:
- `OPEN -> IN_PROGRESS`
- `IN_PROGRESS -> RESOLVED`
- `RESOLVED -> CLOSED`

Invalid transitions throw business-rule errors.

## 6. API Summary

- `POST /api/v1/tickets`
- `PUT /api/v1/tickets/{id}/assign`
- `PUT /api/v1/tickets/{id}/start-progress`
- `PUT /api/v1/tickets/{id}/resolve`
- `PUT /api/v1/tickets/{id}/close`
- `GET /api/v1/tickets`
- `GET /api/v1/tickets/{id}`
- `POST /api/v1/tickets/{id}/comments`
- `GET /api/v1/tickets/{id}/comments`
- `GET /api/v1/auth/me`

## 7. Frontend Integration

- Login URL from `getGoogleLoginUrl()`
- Callback page `OAuthCallbackPage.jsx` reads `token` query param
- Token saved in `tokenStorage.js`
- `apiFetch` attaches bearer token automatically

## 8. Production Notes

- Move JWT secret/client secrets to secure vault.
- Use HTTPS in all environments.
- Replace localStorage token with secure HTTP-only cookie if required by policy.
- Add refresh-token strategy for longer sessions.
