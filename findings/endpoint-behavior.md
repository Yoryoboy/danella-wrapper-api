# Endpoint Behavior Notes

Updated: 2026-03-04

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
- Add Task form metadata source on page:
  - Hidden IDs: `customerID`, `projectID`, `subProjectID`, `newProjectTypeID`, `newJobTypeID`
  - Select dictionaries: `#newEndCustomerID option`, `#newManagerAreaID option`
- Observed sample: `SubProjectID=45`, `tasksData.length=8`

Interpretation:
- This is the key upstream request used to render the tasks list for a selected sub-project.
- Task data is not returned as standalone JSON; wrapper must parse `tasksData` from HTML.
- Add Task dictionaries (end customers / manager areas) are preloaded in this HTML; no separate fetch is required to open that modal.

## `/Task/InsertTask` (POST)

- Status observed: `200`
- Content type: `application/json; charset=utf-8`
- Request body shape observed:
  - `{"jobID":"jobtest","endCustomerID":"5","managerAreaID":"5","customerID":"10","projectID":"25","subProjectID":"45","projectTypeID":"2","verifierKeyID":"000","jobTypeID":"2"}`
- Frontend success contract observed:
  - Expects JSON body with `success` (boolean).
  - On success, UI resets modal form and reloads sub-project page.

Interpretation:
- Upstream creation action is non-REST naming.
- Wrapper should expose REST `POST /api/v1/tasks` and internally map body names and IDs to this contract.
- Wrapper implementation notes (2026-03-04):
  - Public query param: `subProjectId`.
  - Public body fields: `jobId`, `verifierKeyId`, `endCustomerId`, `managerAreaId`.
  - Wrapper enforces `jobTypeID` from metadata (`jobTypeDefault.id`) and does not allow client override.
  - Wrapper validates `endCustomerId` and `managerAreaId` against `TaskSubProject` dictionaries before forwarding.

## `/Task/GetJobTypesByProjectType?projectTypeID={id}` (GET)

- Status observed: `200`
- Content type: `application/json; charset=utf-8`
- Request parameter: `projectTypeID` (query string)
- Response shape observed: array of objects with at least:
  - `jobTypeID`
  - `projectTypeID`
  - `projectType`
  - `jobType`

Interpretation:
- This endpoint is the reliable catalog lookup for `jobTypeID` values by `projectTypeID`.
- Wrapper can enrich form metadata with this list to avoid hardcoded job type assumptions.

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

## `/Task/GetPortfolioByID?portfolioID={id}` (GET)

- Status (authenticated): `200`
- Content type: `application/json; charset=utf-8`
- Request parameter: `portfolioID` (query string)
- Usage observed in UI:
  - Triggered when selecting an item in "Add Project Codes" modal.
  - Frontend uses response fields (for example, `unit`) to populate form context.

Interpretation:
- This is the upstream endpoint for per-code detail lookup.
- Wrapper can expose `GET /api/v1/tasks/project-codes/detail?portfolioId=...` and map internally.

## `/Task/AddPortfolioToTask` (POST)

- Status observed: `200`
- Content type: `application/json; charset=utf-8`
- Request body shape observed:
  - `{"taskID":"6342","portfolioID":"98","quantity":5,"footage":2}`
- Frontend success contract observed:
  - Expects JSON with `success` (boolean) and `message` (string).
  - On success, UI reloads deployment page.

Interpretation:
- Upstream creation action is non-REST naming.
- Wrapper should expose RESTful create endpoint and internally translate field names and route.

## Modal Code Source (`Add Project Codes`)

- No dedicated network call observed when opening the modal to load the initial list.
- Available codes are embedded in deployment page HTML script as:
  - `const portfolioList = [...]`
- Current task assigned codes are embedded as:
  - `const assigned = [...]`

Interpretation:
- Wrapper can retrieve available codes by reusing deployment page fetch and parsing `portfolioList`.
