# Contributing Guide

## Branch Strategy

- `main`: production-ready branch
- `develop`: integration branch for ongoing work
- Feature branches: `feature/<scope>-<short-description>`
- Bugfix branches: `fix/<scope>-<short-description>`
- Hotfix branches: `hotfix/<scope>-<short-description>`

Examples:
- `feature/ticket-status-workflow`
- `fix/oauth-callback-redirect`

## Commit Structure (Conventional Commits)

Format:

```text
<type>(<scope>): <short summary>
```

Types:
- `feat`: new feature
- `fix`: bug fix
- `refactor`: code restructuring without behavior change
- `test`: tests added/updated
- `docs`: documentation only
- `chore`: tooling/dependency/config updates
- `ci`: CI workflow changes

Examples:

```text
feat(bookings): add conflict validation for overlapping time slots
fix(auth): handle missing oauth token in callback route
ci(repo): add backend and frontend build-test workflow
docs(readme): add local setup and deployment notes
```

## Pull Request Checklist

- Keep PRs focused and small.
- Ensure `mvn test` and `npm run test && npm run build` pass locally.
- Update docs when behavior or setup changes.
- Include screenshots for UI changes.
- Request at least one reviewer.

## Code Quality

- Follow module-based architecture already defined in `ARCHITECTURE.md`.
- Keep controllers thin, business rules in services.
- Validate all request DTOs.
- Do not expose secrets in code or logs.
