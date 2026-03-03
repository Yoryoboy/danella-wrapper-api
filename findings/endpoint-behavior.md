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

## `/Task/TaskSubProject?SubProjectID={id}` (GET)

- Status (authenticated): `200`
- Content type: `text/html; charset=utf-8`
- Request parameter: `SubProjectID` (query string)
- Data source on page: JavaScript variable `tasksData` embedded in HTML (`var tasksData = [...]`)
- Observed sample: `SubProjectID=45`, `tasksData.length=7`

Interpretation:
- This is the key upstream request used to render the tasks list for a selected sub-project.
- Task data is not returned as standalone JSON; wrapper must parse `tasksData` from HTML.

## `/Task/DeploymentProject?TaskID={id}` (GET)

- Status (authenticated): `200`
- Content type: `text/html; charset=utf-8`
- Request parameter: `TaskID` (query string)
- Embedded page datasets observed:
  - `const portfolioList = [...]`
  - `const assigned = [...]` (task project/billing codes currently assigned)

Interpretation:
- This is the key upstream endpoint for task deployment/detail context.
- Wrapper should parse embedded arrays from HTML script blocks.

## `/Task/GetAttachments?taskID={id}` (GET)

- Status (authenticated): `200`
- Content type: `application/json; charset=utf-8`
- Request parameter: `taskID` (query string)

Interpretation:
- Attachments are served by a direct JSON endpoint and can be proxied without HTML scraping.

## `/Task/DeleteTaskProjectCode` (POST)

- Status observed: `200`
- Content type: `application/json; charset=utf-8`
- Request body shape:
  - `{"taskProjectCodeID": <number>}`

Interpretation:
- Upstream uses `POST` for deletion.
- Wrapper can expose REST `DELETE` and internally translate to this upstream POST contract.
