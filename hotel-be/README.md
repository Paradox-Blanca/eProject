# Grand Hotel API

Spring Boot 3 API for authentication and RBAC. It uses PostgreSQL, BCrypt, short-lived JWT access tokens and rotating refresh tokens stored in an HttpOnly cookie.

## Run locally

1. Start PostgreSQL: `docker compose up -d`.
2. Copy `.env.example` to `.env` and set a cryptographically random `APP_JWT_SECRET`.
3. Export variables from `.env` in your shell, then run `mvn spring-boot:run`.

The development seed creates the accounts listed in `login.md`, each with password `123456`. Do not enable `APP_SEED_DEMO_DATA` in production.

Endpoints are rooted at `/api/v1`: `POST /auth/login`, `POST /auth/refresh-token`, `POST /auth/logout`, `GET /auth/me`, and `POST /auth/register`.

The registration endpoint creates a customer account. Connecting a real email/SMS provider and OTP-verification workflow remains a deployment-specific integration.
