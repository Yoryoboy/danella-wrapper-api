# Authentication Design Decisions (Passthrough Mode)

## Scope
This document defines how authentication will work for the wrapper API while integrating with Danella web endpoints (HTML/session-based). The goal is to keep client integration JSON-only and simple.

## Context: How Danella Auth Actually Works
Danella is not exposing a standard token-based API for the flows we need. The current login and protected pages behave as a server-rendered web application:

- Login page is HTML at `/Home/Login`.
- Authentication uses a form POST (`application/x-www-form-urlencoded`), not JSON.
- Login requires anti-forgery token `__RequestVerificationToken` from the HTML form.
- Session is established with cookies (not JWT bearer tokens).
- Successful login returns HTTP `302` redirect and sets `.AspNetCore.Session`.
- Protected routes (for example `/Task/MyTasks`) return HTML pages.
- When unauthenticated, upstream commonly returns login HTML/redirect, not a clean JSON error contract.

Observed in testing:
- Invalid credentials: `POST /Home/Login` returns `200` with login HTML + error message.
- Valid credentials: `POST /Home/Login` returns `302` and sets session cookie.

Because upstream auth is cookie-session + HTML forms (not REST auth), the wrapper must translate that behavior into a JSON contract for clients.

## Decision Summary
- We will use `cookie passthrough` for now.
- We will NOT implement JWT for wrapper auth in this phase.
- The wrapper will return the upstream Danella session cookies as a single `cookieHeader` string.
- The client (or SDK) must send `cookieHeader` in each protected request.
- This decision is directly based on upstream behavior: Danella already authenticates via cookies and redirects, so passthrough preserves the real auth mechanism with minimal extra abstraction.

## Why This Approach
- Fastest path to production for current needs.
- Minimal wrapper-side state.
- No extra token service complexity.
- Good fit because this is an integration utility over a third-party web app.

## Tradeoffs Accepted
- Client is coupled to Danella cookie/session behavior.
- Session expiry handling is client-driven (re-login + retry).
- Less abstraction than managed sessions/JWT.

## API Contract

### 1) Login
`POST /auth/login`

Request JSON:
```json
{
  "username": "jdiaz",
  "password": "nomaianomaly"
}
```

Success response (`200`):
```json
{
  "success": true,
  "auth": {
    "type": "cookie_passthrough",
    "cookieHeader": ".AspNetCore.Session=...; ARRAffinity=...; ARRAffinitySameSite=...",
    "obtainedAt": "2026-02-27T14:05:52.680Z"
  },
  "upstream": {
    "loginStatus": 302,
    "redirectLocation": "/"
  }
}
```

Error response (`401`):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username or password"
  }
}
```

Error response (`503`):
```json
{
  "success": false,
  "error": {
    "code": "UPSTREAM_UNAVAILABLE",
    "message": "Could not reach upstream login"
  }
}
```

### 2) Protected Endpoints
All endpoints that require auth must accept this shape:

```json
{
  "auth": {
    "cookieHeader": ".AspNetCore.Session=...; ARRAffinity=...; ARRAffinitySameSite=..."
  },
  "params": {}
}
```

If using HTTP headers instead of body is preferred, the equivalent is:
- Header: `x-danella-cookie: <cookieHeader>`

### 3) Session Expired Contract
When upstream indicates unauthenticated access, wrapper returns `401`:

```json
{
  "success": false,
  "error": {
    "code": "SESSION_EXPIRED",
    "message": "Danella session is expired or invalid"
  }
}
```

## Upstream Auth Logic (Inside Wrapper)
For `POST /auth/login`, wrapper must:
1. `GET /Home/Login`
2. Parse hidden `__RequestVerificationToken`
3. Capture initial cookies (`.AspNetCore.Antiforgery.*`, `ARRAffinity`, `ARRAffinitySameSite`)
4. `POST /Home/Login` with form-urlencoded fields:
- `Username`
- `Password`
- `__RequestVerificationToken`
5. Determine success by:
- HTTP `302` redirect to `/` (or non-login page), and
- Presence of `.AspNetCore.Session` in `Set-Cookie`
6. Build and return `cookieHeader` from required cookies.

## Unauthenticated Detection Rules
For protected wrapper calls, treat response as unauthenticated when any condition is true:
- Redirect chain points to `/Home/Login`
- Response HTML includes login markers (e.g. `__RequestVerificationToken`, login form/action)
- No valid session cookie available

Then return `401 SESSION_EXPIRED`.

## Client Usage Pattern
1. Call `POST /auth/login` with credentials.
2. Save `auth.cookieHeader` in memory/secure local storage.
3. Send `cookieHeader` in every protected wrapper request.
4. If `SESSION_EXPIRED`, call login again and retry once.

## Security/Operational Rules
- Never log raw `password`.
- Never log full `cookieHeader` (mask values).
- Do not persist cookies in plaintext logs.
- Add request timeout and retry policy for upstream network errors.

## Future Evolution (Optional)
- Add SDK to centralize re-login/retry automatically.
- Optionally add `managed session` mode later (`sessionId` abstraction) without breaking current passthrough clients by versioning endpoints.
