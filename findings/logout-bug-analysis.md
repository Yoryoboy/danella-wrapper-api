# Logout Bug Analysis — Session Not Actually Terminated

**Date:** 2026-03-04  
**Severity:** 🔴 CRITICAL  
**Status:** Discovered, Pending Fix

---

## Executive Summary

The logout endpoint (`/api/v1/auth/logout`) **incorrectly reports success** when the upstream Danella-X server returns HTTP 404. This causes clients to believe their session is terminated when it actually remains active and valid.

---

## The Problem

### What Happens

1. **Client calls logout:**
   ```
   POST /api/v1/auth/logout
   Headers: x-danella-cookie: .AspNetCore.Session=...; .AspNetCore.Antiforgery=...
   ```

2. **API forwards to Danella-X:**
   ```
   GET https://danella-x.com/Home/Logout
   Headers: Cookie: [same cookies from client]
   ```

3. **Danella-X responds with 404:**
   ```
   HTTP 404 Not Found
   ```

4. **API returns to client:**
   ```json
   {
     "success": true,
     "loggedOut": true,
     "upstream": {
       "status": 404,
       "url": "https://danella-x.com/Home/Logout"
     }
   }
   ```

5. **Client thinks logout succeeded** ❌ **BUT...**

6. **Session is still valid:**
   ```
   POST /api/v1/auth/validate
   Headers: x-danella-cookie: [same cookies]
   
   Response:
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

---

## Root Cause

### Current Implementation

`src/modules/auth/infrastructure/danella-auth.client.ts:217-236`

```typescript
async logout(input: CookieAuthInput): Promise<LogoutResult> {
  try {
    const url = toAbsoluteUrl(env.danella.baseUrl, env.danella.logoutPath);
    const response = await this.http.get<string>(url, {
      headers: { Cookie: input.cookieHeader },
      maxRedirects: 0,
      validateStatus: () => true,
    });

    if (response.status >= 500) {
      throw new UpstreamUnavailableError("Upstream logout endpoint is unavailable");
    }

    return {
      loggedOut: true,  // ❌ ALWAYS TRUE
      upstream: {
        status: response.status,
        url,
      },
    };
  } catch (error) {
    // error handling...
  }
}
```

### The Bug

**Line 231:** `loggedOut: true` is **hardcoded** and returned regardless of:
- Whether the upstream endpoint exists (404 means it doesn't)
- Whether the session was actually cleared
- Whether Danella-X redirected to login
- Whether the response contains login HTML

---

## Why This Happens

### Danella-X Logout Behavior

The `/Home/Logout` endpoint in Danella-X **may not be a simple GET endpoint**. Possible reasons for 404:

1. **Endpoint doesn't exist** — Danella-X might not have a logout endpoint
2. **Wrong HTTP method** — Might require POST instead of GET
3. **Missing parameters** — Might require query params or body data
4. **Redirect behavior** — Might redirect before returning 404
5. **Session invalidation happens server-side** — The 404 might be intentional (session cleared, endpoint not found)

**The key issue:** We don't validate whether the logout actually worked.

---

## Comparison with Other Methods

### `login()` — Does validate properly ✅

```typescript
const hasSessionCookie = mergedCookies.has(".AspNetCore.Session");

if (loginResponse.status !== 302 || !hasSessionCookie) {
  throw new InvalidCredentialsError();  // ❌ Fails if conditions not met
}
```

**Result:** Only returns success if:
- Status is 302 (redirect)
- Session cookie is present

### `validate()` — Does validate properly ✅

```typescript
const redirectedToLogin =
  response.status >= 300 &&
  response.status < 400 &&
  typeof response.headers.location === "string" &&
  response.headers.location.toLowerCase().includes("/home/login");

const looksLikeLoginHtml = typeof response.data === "string" && isLoginHtml(response.data);
const valid = !redirectedToLogin && !looksLikeLoginHtml;
```

**Result:** Only returns `valid: true` if:
- NOT redirected to login
- Response is NOT login HTML

### `logout()` — Does NOT validate ❌

```typescript
return {
  loggedOut: true,  // ❌ Always true, no validation
  upstream: { status: response.status, url },
};
```

**Result:** Always returns `loggedOut: true` regardless of upstream response.

---

## Test Evidence

### Test Sequence (2026-03-04)

**Step 1: Login**
```
POST /api/v1/auth/login
Body: { "username": "jdiaz", "password": "nomaianomaly" }

Response: 200 OK
{
  "success": true,
  "auth": {
    "type": "cookie_passthrough",
    "cookieHeader": ".AspNetCore.Antiforgery.cdV5uW_Ejgc=...; .AspNetCore.Session=...",
    "obtainedAt": "2026-03-04T10:00:00Z"
  }
}
```

**Step 2: Logout (with cookies from Step 1)**
```
POST /api/v1/auth/logout
Headers: x-danella-cookie: [cookies from Step 1]

Response: 200 OK
{
  "success": true,
  "loggedOut": true,
  "upstream": {
    "status": 404,  ← DANELLA-X RETURNED 404
    "url": "https://danella-x.com/Home/Logout"
  }
}
```

**Step 3: Validate Session (with same cookies)**
```
POST /api/v1/auth/validate
Headers: x-danella-cookie: [same cookies from Step 1]

Response: 200 OK
{
  "success": true,
  "valid": true,  ← SESSION STILL VALID!
  "reason": "SESSION_VALID",
  "upstream": {
    "status": 200,
    "url": "https://danella-x.com/Task/MyTasks"
  }
}
```

**Conclusion:** Logout reported success (Step 2) but session remained valid (Step 3).

---

## Security Impact

### Risk Level: HIGH

1. **False Security:** Users believe they're logged out when they're not
2. **Session Hijacking:** Attacker could use the same cookies after user thinks they logged out
3. **Compliance:** May violate security/privacy regulations requiring proper logout
4. **API Contract Violation:** API promises `loggedOut: true` but doesn't deliver

---

## Solution

### Proposed Fix

Validate logout success by checking:

```typescript
async logout(input: CookieAuthInput): Promise<LogoutResult> {
  try {
    const url = toAbsoluteUrl(env.danella.baseUrl, env.danella.logoutPath);
    const response = await this.http.get<string>(url, {
      headers: { Cookie: input.cookieHeader },
      maxRedirects: 0,
      validateStatus: () => true,
    });

    if (response.status >= 500) {
      throw new UpstreamUnavailableError("Upstream logout endpoint is unavailable");
    }

    // ✅ VALIDATE: Check if logout actually worked
    const redirectedToLogin =
      response.status >= 300 &&
      response.status < 400 &&
      typeof response.headers.location === "string" &&
      response.headers.location.toLowerCase().includes("/home/login");

    const looksLikeLoginHtml = 
      typeof response.data === "string" && isLoginHtml(response.data);

    const loggedOut = redirectedToLogin || looksLikeLoginHtml;

    return {
      loggedOut,  // ✅ Only true if validation passed
      upstream: {
        status: response.status,
        url,
      },
    };
  } catch (error) {
    // error handling...
  }
}
```

### Expected Behavior After Fix

**Step 2 (Logout) — After Fix:**
```json
{
  "success": true,
  "loggedOut": false,  // ✅ Correctly reports failure
  "upstream": {
    "status": 404,
    "url": "https://danella-x.com/Home/Logout"
  }
}
```

**Step 3 (Validate) — After Fix:**
```json
{
  "success": true,
  "valid": true,  // ✅ Session still valid (as expected)
  "reason": "SESSION_VALID",
  "upstream": { "status": 200, "url": "..." }
}
```

---

## Acceptance Criteria

- [ ] Logout returns `loggedOut: false` when upstream returns 404
- [ ] Logout returns `loggedOut: true` only when session is actually terminated
- [ ] Subsequent validate calls return `valid: false` after successful logout
- [ ] Behavior is consistent with `login()` and `validate()` validation patterns
- [ ] Test case added to smoke tests or integration tests
- [ ] Finding documented in discovery-log.md

---

## Related Files

- `src/modules/auth/infrastructure/danella-auth.client.ts` — Implementation
- `src/modules/auth/domain/auth.types.ts` — LogoutResult type
- `CLEANUP_TODO.md` — Tracked as critical bug

