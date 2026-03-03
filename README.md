# danella-wrapper-api

Danella-X wrapper API built with TypeScript + Express.

## Requirements

- Node.js 18+
- pnpm

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create your local env file:

```bash
cp .env.example .env
```

3. Update `.env` with valid Danella credentials and config.

## Run Server (Local)

Development mode:

```bash
pnpm dev
```

Build:

```bash
pnpm build
```

Run built server:

```bash
pnpm start
```

Type-check:

```bash
pnpm typecheck
```

Local server default URL:

- `http://localhost:3000`

## Endpoints

Base API prefix: `/api/v1`

### Health/Root

- `GET /`
- Description: Basic service info.
- Response `200`:

```json
{
  "success": true,
  "service": "danella-wrapper-api",
  "api": "/api/v1",
  "version": "v1"
}
```

### Auth

- `POST /api/v1/auth/login`
- Description: Logs into Danella-X and returns cookie passthrough auth data.
- Request body:

```json
{
  "username": "string",
  "password": "string"
}
```

- Response `200`:

```json
{
  "success": true,
  "auth": {
    "type": "cookie_passthrough",
    "cookieHeader": ".AspNetCore.Session=...; ARRAffinity=...; ARRAffinitySameSite=...",
    "obtainedAt": "2026-03-03T14:22:00.000Z"
  },
  "upstream": {
    "loginStatus": 302,
    "redirectLocation": "/"
  }
}
```

- Response `401`:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username or password"
  }
}
```

- Response `503`:

```json
{
  "success": false,
  "error": {
    "code": "UPSTREAM_UNAVAILABLE",
    "message": "Could not reach upstream login"
  }
}
```

### Tasks (Scaffold)

- `GET /api/v1/tasks`
- Description: Placeholder endpoint while tasks module is not implemented.
- Response `501`:

```json
{
  "success": false,
  "error": {
    "code": "NOT_IMPLEMENTED",
    "message": "Tasks module is scaffolded but not implemented yet"
  }
}
```

## Postman

The endpoint `POST /api/v1/auth/login` is documented in Postman collection:

- Collection: `danella-wrapper-api`
- Folder: `Auth`
- Request: `Login (Cookie Passthrough)`
