# Smart Campus Operations Hub - Enterprise System Blueprint

This blueprint summarizes the delivered enterprise modules and architecture.

## 1. Core Modules

### A. Facilities and Resource Management
- Campus resources modeled and managed:
  - Lecture halls
  - Smart classrooms
  - Classrooms
  - Labs
- Structured floor/type/room handling in booking workflows
- Admin CRUD and availability controls available

### B. Booking Workflow System
- Lecturer-only booking creation
- Booking form supports:
  - Floor -> room type -> room number
  - Department -> course
  - Date and time range
  - Purpose
- Enforced protections:
  - No past-date booking
  - No past-time booking for today
  - No overlap conflict
  - No duplicate same-slot booking
- Availability UX:
  - Already booked slots
  - Available slots
  - Suggested nearest free slot
- Status flow:
  - `Pending` / `Approved` / `Rejected`

### C. Incident Management
- Incident ticket creation and lifecycle handling
- Fields:
  - Title
  - Description
  - Priority
  - Attachment
- Technician operations:
  - Status updates
  - Technician comments
- Lifecycle states:
  - `Open` / `In Progress` / `Resolved`

### D. Notifications
- In-app notifications triggered by:
  - Booking workflow updates
  - Ticket assignment and status updates
- User capabilities:
  - List notifications
  - Mark read
  - Delete notification

### E. Authentication and Role Management
- Roles supported:
  - `admin`
  - `lecturer`
  - `student`
  - `technician`
  - `super_admin` (internal hierarchy)
- Role-based route protection and API authorization
- Restricted public registration (admin not publicly registerable)
- JWT session validation

### F. Auth Improvements
- Password policy validation implemented
- Forgot-password page available in frontend auth flows
- OAuth is optional in project scope and can be added as a controlled extension

## 2. Dashboards

### Admin Dashboard
- User management
- Booking approvals
- Incident visibility
- Facilities management
- Analytics summary

### Lecturer Dashboard
- Booking creation and tracking
- Incident reporting with attachments
- Materials/courses/students views

### Student Dashboard
- Academic and notification views
- Booking/schedule visibility where applicable

### Technician Dashboard
- Assigned incident queue
- Status transitions and notes
- Incident KPI overview

## 3. Profile and Settings
- Shared profile for all roles with editable personal details
- Settings include account/security preferences
- Header cleaned (no signed-in identity banner)

## 4. UI and UX Standards
- Sidebar role navigation with active state
- Responsive layouts for desktop/mobile
- Empty states provided to avoid blank screens
- Animated modern auth and dashboard experiences

## 5. Validation and Security Controls
- Booking date/time safeguards
- Overlap conflict logic
- Required field validations
- Attachment file/type/size validation for incidents
- Role-based endpoint restrictions

## 6. Data Model Overview

Collections in active Node backend:
- `users`
- `facilities`
- `bookings`
- `tickets` (incident module)
- `notifications`

Relational mapping equivalents for reporting or migration:
- `users`
- `roles`
- `facilities`
- `bookings`
- `incidents`
- `notifications`

## 7. Production Readiness Notes
- Module interactions are integrated across booking, incidents, and notifications
- APIs and route guards enforce core RBAC constraints
- Remaining optional enterprise extensions can be added incrementally:
  - OAuth provider integration (Google)
  - WebSocket real-time notification push
  - Object storage for binary attachment persistence
