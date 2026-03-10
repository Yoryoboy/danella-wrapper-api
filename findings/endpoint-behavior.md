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
- Structured HTML sections observed:
  - Primary task fields table (`#tablaTaskDetail`)
  - Secondary fields table (`#tablaSecondaryFields`)
  - Assignment control matrix (`#tablaAssignment`) and vendor cards

Interpretation:
- This is the key upstream endpoint for task deployment/detail context.
- Wrapper should parse both embedded arrays and HTML section tables.

## `/Projects/SecondaryFields?ProjectID={id}` (GET)

- Status observed: `200`
- Content type: `text/html; charset=utf-8`
- Request parameter: `ProjectID` (query string)
- Structured HTML sections observed:
  - Project heading in `main h4`
  - Secondary fields table `#tablaSecondaryFields`
- Row actions observed:
  - `JOB NAME` -> `deleteSecondaryField(238)`
  - `NODE ID` -> `deleteSecondaryField(239)`
  - `TASK ID` -> `deleteSecondaryField(240)`
  - `Time Justification` -> `deleteSecondaryField(243)`

Interpretation:
- This page exposes project-level secondary-field metadata.
- The IDs on this page are project-scoped (`projectSecondaryFieldId`) and do not match the task-scoped IDs required by `/Task/UpdateTaskSecondaryFieldsAjax`.
- Wrapper can expose a metadata endpoint keyed by `projectId` to list the configured labels for a project.

## `/Task/UpdateTaskSecondaryFieldsAjax` (POST)

- Status observed: `200`
- Content type: `application/json; charset=utf-8`
- Request content type: `application/x-www-form-urlencoded; charset=UTF-8`
- Request body shape observed:
  - `TaskID=9069`
  - `Fields[166675].TaskSecondaryFieldID=166675`
  - `Fields[166675].Value=test task id`
  - `Fields[166676].TaskSecondaryFieldID=166676`
  - `Fields[166676].Value=test node id`
  - `Fields[166677].TaskSecondaryFieldID=166677`
  - `Fields[166677].Value=test name`
  - `Fields[166678].TaskSecondaryFieldID=166678`
  - `Fields[166678].Value=tst justification`
- Frontend success contract observed:
  - Page serializes `#formEditSecondaryFields` and submits it with `$.post`.
  - Expects JSON with `success` (boolean) and `message` (string).
  - On success, UI shows a success alert and reloads the deployment page.

Interpretation:
- Task secondary-field updates are keyed by task-scoped `TaskSecondaryFieldID`, not by project-scoped field IDs.
- `GET /api/v1/tasks/:taskId` remains the authoritative source for `taskSecondaryFieldId` values needed for an eventual update endpoint.
- Wrapper implementation notes (2026-03-09):
  - Public contract: `PATCH /api/v1/tasks/secondary-fields?taskId={id}`.
  - Public body fields: `fields[].label`, `fields[].value`.
  - Wrapper resolves labels against `GET /api/v1/tasks/{taskId}`, forwards only resolved task-scoped IDs, and refetches the task to verify persistence.
  - Wrapper intentionally does not trust upstream `success=true` without post-update verification because upstream accepts some invalid/no-op payloads.

## `/Task/GetAttachments?taskID={id}` (GET)

- Status (authenticated): `200`
- Content type: `application/json; charset=utf-8`
- Request parameter: `taskID` (query string)

Interpretation:
- Attachments are served by a direct JSON endpoint and can be proxied without HTML scraping.

## `/Task/GetMessagesByTaskID?taskID={id}` (GET)

- Status observed: `200`
- Content type: `application/json; charset=utf-8`
- Request parameter: `taskID` (query string)
- Response shape observed: array (empty array in observed samples)

Interpretation:
- Messages are available from a direct JSON endpoint keyed by task ID.
- Wrapper can include this list in a consolidated task detail contract.

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

## `/Task/SetTaskStatus` (POST)

- Status observed: `200`
- Content type: `application/json; charset=utf-8`
- Request content type: `application/json`
- Request body shape observed:
  - `{"taskID":9373,"action":18}`
  - `{"taskID":9373,"action":19}`
  - `{"taskID":9373,"action":20}`
- Frontend usage observed:
  - Task list page (`/Task/TaskSubProject?SubProjectID=45`) renders buttons:
    - `changeStatus(taskID, 18, 'In Progress', this)`
    - `changeStatus(taskID, 19, 'On Hold', this)`
    - `changeStatus(taskID, 20, 'Cancelled', this)`
  - Frontend posts only `taskID` and `action` and expects JSON with:
    - `success` (boolean)
    - `statusName` (string)
- Response behavior observed on task `9373`:
  - `action: 19` -> `{"success":true,"statusName":"On Hold"}`
  - `action: 20` -> `{"success":true,"statusName":"Cancelled"}`
  - `action: 18` from `On Hold` -> `{"success":true,"statusName":"Backlog (To Do)"}`
  - `action: 18` from `Cancelled` -> `{"success":true,"statusName":"Backlog (To Do)"}`
  - `action: 18` from `Backlog (To Do)` -> `{"success":true,"statusName":"Backlog (To Do)"}`
  - unsupported values such as `3`, `16`, `17` -> `{"success":false,"message":"Invalid action."}`

Interpretation:
- Upstream accepts legacy transition `action` codes, not direct `taskStatusID` values.
- The visible UI label for `action: 18` (`In Progress`) is misleading for the tested task; observed behavior resets or keeps the task in `Backlog (To Do)`.
- Wrapper should model status transitions as an explicit mapping/command layer rather than assuming the UI button label equals the resulting upstream status.

Expanded interpretation from additional browser-side validation:
- Accepted action values observed: `18`, `19`, `20`, `21`
- Invalid action values observed: `1..17`, `22..25`
- `action: 19` consistently maps to `On Hold`
- `action: 20` consistently maps to `Cancelled`
- `action: 21` maps to `Closed`
- `action: 18` is contextual and behaves as “return to this task's base workflow status”, not “set In Progress”

Observed examples of `action: 18`:
- Task `9373` base status: `Backlog (To Do)`
- Task `6342` base status: `In Progress`
- Task `6335` base status: `Ready for Invoicing`
- Task `6337` base status: `Customer Approved / Rejected`

Observed examples after `action: 21` (`Closed`):
- Once a task has been transitioned to `Closed`, later `action: 18` returns it to `Closed`
- This suggests `Closed` becomes the new persisted base/return status for subsequent `18` transitions

## Modal Code Source (`Add Project Codes`)

- No dedicated network call observed when opening the modal to load the initial list.
- Available codes are embedded in deployment page HTML script as:
  - `const portfolioList = [...]`
- Current task assigned codes are embedded as:
  - `const assigned = [...]`

Interpretation:
- Wrapper can retrieve available codes by reusing deployment page fetch and parsing `portfolioList`.

## Wrapper Contract Consolidation (2026-03-04)

- Previous wrapper route `GET /api/v1/tasks/deployment` is replaced by:
  - `GET /api/v1/tasks/{taskId}`
- New wrapper route aggregates:
  - deployment HTML sections (`primaryDetails`, `secondaryFields`, `assignmentControl`)
  - embedded JS arrays (`projectCodes.available`, `projectCodes.assigned`)
  - attachments JSON (`/Task/GetAttachments`)
  - messages JSON (`/Task/GetMessagesByTaskID`)
