# Smart Campus Operations Hub - Contribution Mapping

This document defines clear ownership boundaries for enterprise modules and APIs.

## Member 1 - Facilities and Resource Management

### Ownership
- Facility catalog and availability management
- Resource CRUD workflows
- Floor/type/room structure alignment for campus spaces

### Backend scope
- Endpoints under `node-backend/src/routes/facilityRoutes.js`
- Controller logic in `node-backend/src/controllers/facilityController.js`
- Model in `node-backend/src/models/Facility.js`

### Frontend scope
- Admin resource UI in `frontend/src/features/admin/pages/AdminFacilitiesPage.jsx`
- Facility API service in `frontend/src/features/facilities/services/facilityApi.js`

### Delivered outcomes
- Add/Edit/Delete/View facilities
- Availability status tracking (`Available` / `Unavailable`)
- Admin-only mutation permissions

## Member 2 - Booking System and Conflict Logic

### Ownership
- Lecturer booking workflow
- Time conflict prevention and anti-double-booking safeguards
- Availability and booked-slot visibility

### Backend scope
- Endpoints under `node-backend/src/routes/bookingRoutes.js`
- Controller logic in `node-backend/src/controllers/bookingController.js`
- Model/index rules in `node-backend/src/models/Booking.js`

### Frontend scope
- Lecturer booking UX in `frontend/src/features/lecturer/pages/LecturerBookingsPage.jsx`
- Admin booking review in `frontend/src/features/admin/pages/AdminBookingsPage.jsx`
- Booking API layer in `frontend/src/features/bookings/services/bookingApi.js`

### Delivered outcomes
- Floor -> room type -> room cascading
- Department -> course mapping
- Past date and past time protection
- Overlap rejection and duplicate-slot hardening
- Booked slots, available slots, and nearest slot suggestion
- Workflow status (`Pending` / `Approved` / `Rejected`)

## Member 3 - Incident Management and Technician Flow

### Ownership
- Incident (ticket) lifecycle
- Attachment handling and technician updates
- Operational status transitions and comments

### Backend scope
- Endpoints under `node-backend/src/routes/ticketRoutes.js`
- Controller logic in `node-backend/src/controllers/ticketController.js`
- Model in `node-backend/src/models/Ticket.js`

### Frontend scope
- Lecturer incident creation in `frontend/src/features/lecturer/pages/Dashboard.jsx`
- Technician operations in `frontend/src/features/technician/pages/TechnicianTicketsPage.jsx`
- Technician KPI view in `frontend/src/features/technician/pages/TechnicianOverview.jsx`
- Ticket API layer in `frontend/src/features/tickets/services/ticketApi.js`

### Delivered outcomes
- Incident create/list/update/delete lifecycle
- Priority levels (`Low` / `Medium` / `High`)
- Attachment validation with file upload support
- Technician notes and status updates
- Lifecycle labels aligned to enterprise flow (`Open` / `In Progress` / `Resolved`)

## Member 4 - Notifications, Auth, and Role Security

### Ownership
- Authentication and registration restrictions
- Role-based access control and protected routing
- Notification delivery/read-state lifecycle

### Backend scope
- Auth endpoints and guards in:
  - `node-backend/src/controllers/authController.js`
  - `node-backend/src/middleware/authMiddleware.js`
  - `node-backend/src/routes/authRoutes.js`
- Notification APIs in:
  - `node-backend/src/controllers/notificationController.js`
  - `node-backend/src/routes/notificationRoutes.js`
- Role/user constraints in `node-backend/src/models/User.js`

### Frontend scope
- Route protection in:
  - `frontend/src/app/router/AppRouter.jsx`
  - `frontend/src/app/router/ProtectedRoute.jsx`
  - `frontend/src/app/router/PublicOnlyRoute.jsx`
- Auth context/store in `frontend/src/features/auth/context/AuthContext.jsx`
- Notification UI in `frontend/src/features/student/pages/StudentNotificationsPage.jsx`
- Sidebar role routing in `frontend/src/components/sidebarConfig.js`

### Delivered outcomes
- Secure login and role-aware access
- Restricted public registration (non-admin roles)
- Session/JWT enforcement
- Notification create/read/delete flow with in-app list behavior

## Cross-Module Integration Responsibility

- Shared UI shell, profile/settings, and visual consistency
- Empty-state coverage and non-blank dashboard behavior
- End-to-end test and acceptance verification for module interactions
