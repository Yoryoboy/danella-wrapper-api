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

- `POST /api/v1/auth/validate`
- Description: Validates whether a Danella session cookie is still valid.
- Request body (option 1):

```json
{
  "auth": {
    "cookieHeader": ".AspNetCore.Session=...; ARRAffinity=...; ARRAffinitySameSite=..."
  }
}
```

- Header option (option 2):
  - `x-danella-cookie: <cookieHeader>`
- Response `200`:

```json
{
  "success": true,
  "valid": true,
  "reason": "SESSION_VALID",
  "upstream": {
    "status": 200,
    "url": "https://danella-x.com/Task/MyTasks"
  }
}
```

- Response `200` (expired):

```json
{
  "success": true,
  "valid": false,
  "reason": "SESSION_EXPIRED",
  "upstream": {
    "status": 200,
    "url": "https://danella-x.com/Task/MyTasks"
  }
}
```

- `POST /api/v1/auth/logout`
- Description: Calls Danella logout endpoint with the provided session cookies.
- Request body (option 1):

```json
{
  "auth": {
    "cookieHeader": ".AspNetCore.Session=...; ARRAffinity=...; ARRAffinitySameSite=..."
  }
}
```

- Header option (option 2):
  - `x-danella-cookie: <cookieHeader>`
- Response `200`:

```json
{
  "success": true,
  "loggedOut": true,
  "upstream": {
    "status": 302,
    "url": "https://danella-x.com/Home/Logout"
  }
}
```

- Response `400`:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Provide auth.cookieHeader or x-danella-cookie header"
  }
}
```

### Tasks

- `GET /api/v1/tasks`
- Description: Returns task list for a Danella sub-project by scraping `TaskSubProject` HTML and extracting `tasksData`.
- Query params:
  - `subProjectId` (required, integer)
  - `projectId` (optional alias for `subProjectId`)
  - `page` (optional, default `1`)
  - `limit` (optional, default `50`, max `200`)
  - `status` (optional, contains match against `taskStatusName`)
  - `search` (optional, contains match against `taskCode`, `jobID`, `endCustomerName`, `vendorName`, `customerName`)
- Auth input:
  - `x-danella-cookie: <cookieHeader>` header, or
  - standard `Cookie` header
- Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "taskID": 6342,
      "taskCode": "SYS-006342",
      "jobID": "TEST-001",
      "subProjectID": 45,
      "taskStatusName": "In Progress"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 7,
    "totalPages": 1
  },
  "filters": {
    "subProjectId": 45,
    "status": "In Progress",
    "search": "SYS-"
  },
  "upstream": {
    "status": 200,
    "url": "https://danella-x.com/Task/TaskSubProject?SubProjectID=45"
  }
}
```

- Response `400`:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "subProjectId must be provided and x-danella-cookie or Cookie header is required"
  }
}
```

- Response `401`:

```json
{
  "success": false,
  "error": {
    "code": "SESSION_EXPIRED",
    "message": "Danella session is expired or invalid"
  }
}
```

- Response `502`:

```json
{
  "success": false,
  "error": {
    "code": "UPSTREAM_PARSE_ERROR",
    "message": "Could not extract tasksData from upstream HTML"
  }
}
```

- Response `503`:

```json
{
  "success": false,
  "error": {
    "code": "UPSTREAM_UNAVAILABLE",
    "message": "Could not reach upstream tasks endpoint"
  }
}
```

## Postman

The auth endpoints are documented in Postman collection:

- Collection: `danella-wrapper-api`
- Folder: `Auth`
- Request: `Login (Cookie Passthrough)`
- Request: `Validate Session`
- Request: `Logout`
- Request: `List Tasks By SubProject`
