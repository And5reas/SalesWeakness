# Auth Module (Step 01 Skeleton)

## Responsibilities
Handles authentication, JWT issuance, and validation.

## Current State
- `AuthService` stub created.
- `AuthController` stub created.
- JWT and Roles guards implemented globally in `src/common/guards/`. 
- `JwtPayload` interface defined (`sub`, `tenant_id`, `profile`, `scopes`).

## Next Steps (Step 02)
- Implement `POST /auth/login` to validate credentials against a `User` entity and issue the JWT.
- Configure `PassportModule` and `JwtModule` with `@nestjs/passport`.
- Implement Local and JWT Passport strategies.
