# Smart Campus Operations Hub Architecture

## Backend (Spring Boot)

- Base package: `com.smartcampus.operationshub`
- Packaging style: modular monolith (feature modules with consistent internal layering)
- Each domain module contains:
  - `controller` (REST API layer)
  - `service` (business logic)
  - `repository` (data access)
  - `entity` (JPA models)
  - `dto` (request/response contracts)
  - `mapper` (entity-DTO mapping)
- Shared concerns:
  - `config` (app configuration)
  - `security` (security and auth integration)
  - `common` (exceptions, constants, utilities)
  - `shared` (cross-module DTOs/mappers)

## Frontend (React)

- Structure style: feature-first with shared core services
- `app`: application bootstrapping (router, providers, store)
- `core`: cross-cutting infrastructure (api client, auth, configs, hooks, utils)
- `features`: domain-focused UI modules (`auth`, `resources`, `bookings`, `tickets`, `notifications`, `admin`)
- `shared`: reusable UI components, common types, utility libraries
- `assets`: static images/icons/styles
- `tests`: unit and integration tests

## Conventions

- Naming: lower-case folder names, singular technical layer names, plural business domains (`resources`, `bookings`, `tickets`)
- Separation: no direct controller-to-repository coupling; all flows pass through service layer
- Contracts: API request/response classes in `dto`, not entities
- Evolvability: architecture supports migration to microservices by extracting `modules/*` features
