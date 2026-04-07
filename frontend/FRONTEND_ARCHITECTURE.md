# Frontend Architecture - Smart Campus Operations Hub

## Layers

- `app`: app-level wiring (router, providers, global stores)
- `core`: cross-cutting concerns (api client, auth, config, utils)
- `features`: domain modules (dashboard, bookings, tickets, admin, auth)
- `shared`: reusable UI primitives and cross-feature components
- `assets`: global styles and static resources

## Feature-First Structure

Each feature owns:
- `pages`: route-level containers
- `components`: feature-specific UI pieces
- `services`: API wrappers for that feature
- `hooks`: feature-level state logic (optional)

## State Management (Zustand)

- `useAuthStore`: session and authentication state
- `useUiStore`: global UI state (sidebar toggle, etc.)

Keep API data close to features. Move cross-feature state into `app/store` only when multiple modules share it.

## Routing

- Public route: `/login`, `/auth/callback`
- Protected routes: `/dashboard`, `/bookings`, `/tickets`, `/admin`
- `ProtectedRoute` enforces auth boundary in router.

## Service Pattern

- All HTTP logic goes through `core/api/httpClient.js`
- Feature services call `apiFetch` and export semantic methods (`fetchTickets`, `fetchBookings`)
- JWT token is attached centrally in one place

## UI Composition

- `core/layouts/AppShell` provides shell structure
- `shared/components/navigation/*` provides sidebar/topbar
- Pages compose cards/sections and remain thin

This organization keeps the codebase modular, discoverable, and scalable for enterprise team development.
