# Endpoint Behavior Notes

Updated: 2026-02-26

## `/Home/Login` (GET)

- Status: `200`
- Content type: `text/html; charset=utf-8`
- Contains form action `/Home/Login`
- Contains hidden anti-CSRF field `__RequestVerificationToken`
- Login form fields detected: `Username`, `Password`
- Cookies observed on login page:
  - `.AspNetCore.Antiforgery.*`
  - `.AspNetCore.Mvc.CookieTempDataProvider`
  - `ARRAffinity`
  - `ARRAffinitySameSite`

## `/Home/Login` (POST)

- Status observed with tested credentials: `200` (no redirect)
- Auth session signal: not detected (`.AspNetCore.Session` absent)
- Error message in HTML:
  - `Usuario y/o contraseña incorrectos. El Usuario y/o Contraseña no son válidos`

Interpretation:
- A successful login should likely return `302` and/or a new `.AspNetCore.Session` cookie.
- Current credentials are being rejected by server-side validation.

## `/Task/MyTasks` (GET with forwarded cookies)

- Status with failed auth: `200`
- Content type: `text/html; charset=utf-8`
- Returned the login page HTML instead of task data.

Interpretation:
- This endpoint is protected and redirects/renders login when unauthenticated.
