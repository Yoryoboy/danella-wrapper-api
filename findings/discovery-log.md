# Danella Endpoint Discovery Log

Initial baseline created on 2026-02-26.
## Run 2026-02-26T18:40:48.175Z

### Auth Flow
- Login page: `https://danella-x.com/Home/Login` -> `200`
- Anti-CSRF token (__RequestVerificationToken): found
- Form action discovered: /Home/Login
- Credential fields detected: user=`Username`, pass=`Password`
- Login page cookies: .AspNetCore.Antiforgery.cdV5uW_Ejgc, .AspNetCore.Mvc.CookieTempDataProvider, ARRAffinity, ARRAffinitySameSite
- Login submit: `https://danella-x.com/Home/Login` -> `200`
- Redirect location: none
- Cookies returned (1): .AspNetCore.Mvc.CookieTempDataProvider

### Task Endpoint Probe
- URL: `https://danella-x.com/Task/MyTasks`
- Status: `200`
- Content-Type: `text/html; charset=utf-8`
- Body type: `string`
- Body shape: `string`
- Extracted tasksData count: `n/a`

### Notes
- No notable warnings.

Artifact JSON: `findings/runs/2026-02-26T18-40-48-175Z-probe.json`

---
## Run 2026-02-26T18:43:17.280Z

### Auth Flow
- Login page: `https://danella-x.com/Home/Login` -> `200`
- Anti-CSRF token (__RequestVerificationToken): found
- Form action discovered: /Home/Login
- Credential fields detected: user=`Username`, pass=`Password`
- Login page cookies: .AspNetCore.Antiforgery.cdV5uW_Ejgc, .AspNetCore.Mvc.CookieTempDataProvider, ARRAffinity, ARRAffinitySameSite
- Login submit: `https://danella-x.com/Home/Login` -> `200`
- Authenticated signal: no
- Redirect location: none
- Cookies returned (1): .AspNetCore.Mvc.CookieTempDataProvider
- Login errors: Usuario y/o contraseña incorrectos.El Usuario y/o Contraseña no son válidos

### Task Endpoint Probe
- URL: `https://danella-x.com/Task/MyTasks`
- Status: `200`
- Content-Type: `text/html; charset=utf-8`
- Body type: `string`
- Body shape: `string`
- Extracted tasksData count: `n/a`

### Notes
- Login returned error text: Usuario y/o contraseña incorrectos.El Usuario y/o Contraseña no son válidos
- Task endpoint returned login HTML; request is unauthenticated.

Artifact JSON: `findings/runs/2026-02-26T18-43-17-280Z-probe.json`

---
## Run 2026-02-27T13:33:49.587Z

### Auth Flow
- Login page: `https://danella-x.com/Home/Login` -> `200`
- Anti-CSRF token (__RequestVerificationToken): found
- Form action discovered: /Home/Login
- Credential fields detected: user=`Username`, pass=`Password`
- Login page cookies: .AspNetCore.Antiforgery.cdV5uW_Ejgc, .AspNetCore.Mvc.CookieTempDataProvider, ARRAffinity, ARRAffinitySameSite
- Login submit: `https://danella-x.com/Home/Login` -> `200`
- Authenticated signal: no
- Redirect location: none
- Cookies returned (1): .AspNetCore.Mvc.CookieTempDataProvider
- Login errors: Usuario y/o contraseña incorrectos.El Usuario y/o Contraseña no son válidos

### Task Endpoint Probe
- URL: `https://danella-x.com/Task/MyTasks`
- Status: `200`
- Content-Type: `text/html; charset=utf-8`
- Body type: `string`
- Body shape: `string`
- Extracted tasksData count: `n/a`

### Notes
- Login returned error text: Usuario y/o contraseña incorrectos.El Usuario y/o Contraseña no son válidos
- Task endpoint returned login HTML; request is unauthenticated.

Artifact JSON: `findings/runs/2026-02-27T13-33-49-587Z-probe.json`

---
## Run 2026-02-27T13:35:39.052Z

### Auth Flow
- Login page: `https://danella-x.com/Home/Login` -> `200`
- Anti-CSRF token (__RequestVerificationToken): found
- Form action discovered: /Home/Login
- Credential fields detected: user=`Username`, pass=`Password`
- Login page cookies: .AspNetCore.Antiforgery.cdV5uW_Ejgc, .AspNetCore.Mvc.CookieTempDataProvider, ARRAffinity, ARRAffinitySameSite
- Login submit: `https://danella-x.com/Home/Login` -> `200`
- Authenticated signal: no
- Redirect location: none
- Cookies returned (1): .AspNetCore.Mvc.CookieTempDataProvider
- Login errors: Usuario y/o contraseña incorrectos.El Usuario y/o Contraseña no son válidos

### Task Endpoint Probe
- URL: `https://danella-x.com/Task/MyTasks`
- Status: `200`
- Content-Type: `text/html; charset=utf-8`
- Body type: `string`
- Body shape: `string`
- Extracted tasksData count: `n/a`

### Notes
- Login returned error text: Usuario y/o contraseña incorrectos.El Usuario y/o Contraseña no son válidos
- Task endpoint returned login HTML; request is unauthenticated.

Artifact JSON: `findings/runs/2026-02-27T13-35-39-052Z-probe.json`

---
## Run 2026-02-27T13:36:04.815Z

### Auth Flow
- Login page: `https://danella-x.com/Home/Login` -> `failed before HTTP response`
- Anti-CSRF token (__RequestVerificationToken): `not reached`
- Form action discovered: `not reached`
- Credential fields detected: `not reached`
- Login page cookies: `not reached`
- Login submit: `not reached`
- Authenticated signal: `not reached`
- Redirect location: `not reached`
- Cookies returned: `not reached`
- Login errors: `not reached`

### Task Endpoint Probe
- URL: `https://danella-x.com/Task/MyTasks`
- Status: `not reached`
- Content-Type: `not reached`
- Body type: `not reached`
- Body shape: `not reached`
- Extracted tasksData count: `not reached`

### Notes
- Probe terminated at Step 1 with `Axios error: connect ECONNREFUSED 127.0.0.1:9`.
- Shell has proxy variables set (`HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`) to `http://127.0.0.1:9`, which is refusing connections.
- Because the request never reached Danella, updated credentials were not validated in this run.

Artifact JSON: `none (run aborted before persistence)`

---
## Run 2026-02-27T13:36:19.231Z

### Auth Flow
- Login page: `https://danella-x.com/Home/Login` -> `200`
- Anti-CSRF token (__RequestVerificationToken): found
- Form action discovered: /Home/Login
- Credential fields detected: user=`Username`, pass=`Password`
- Login page cookies: .AspNetCore.Antiforgery.cdV5uW_Ejgc, .AspNetCore.Mvc.CookieTempDataProvider, ARRAffinity, ARRAffinitySameSite
- Login submit: `https://danella-x.com/Home/Login` -> `200`
- Authenticated signal: no
- Redirect location: none
- Cookies returned (1): .AspNetCore.Mvc.CookieTempDataProvider
- Login errors: Usuario y/o contraseña incorrectos.El Usuario y/o Contraseña no son válidos

### Task Endpoint Probe
- URL: `https://danella-x.com/Task/MyTasks`
- Status: `200`
- Content-Type: `text/html; charset=utf-8`
- Body type: `string`
- Body shape: `string`
- Extracted tasksData count: `n/a`

### Notes
- Login returned error text: Usuario y/o contraseña incorrectos.El Usuario y/o Contraseña no son válidos
- Task endpoint returned login HTML; request is unauthenticated.

Artifact JSON: `findings/runs/2026-02-27T13-36-19-231Z-probe.json`

---
## Run 2026-02-27T13:36:20.712Z

### Auth Flow
- Login page: `https://danella-x.com/Home/Login` -> `200`
- Anti-CSRF token (__RequestVerificationToken): found
- Form action discovered: /Home/Login
- Credential fields detected: user=`Username`, pass=`Password`
- Login page cookies: .AspNetCore.Antiforgery.cdV5uW_Ejgc, .AspNetCore.Mvc.CookieTempDataProvider, ARRAffinity, ARRAffinitySameSite
- Login submit: `https://danella-x.com/Home/Login` -> `200`
- Authenticated signal: no
- Redirect location: none
- Cookies returned (1): .AspNetCore.Mvc.CookieTempDataProvider
- Login errors: Usuario y/o contraseña incorrectos.El Usuario y/o Contraseña no son válidos

### Task Endpoint Probe
- URL: `https://danella-x.com/Task/MyTasks`
- Status: `200`
- Content-Type: `text/html; charset=utf-8`
- Body type: `string`
- Body shape: `string`
- Extracted tasksData count: `n/a`

### Notes
- Login returned error text: Usuario y/o contraseña incorrectos.El Usuario y/o Contraseña no son válidos
- Task endpoint returned login HTML; request is unauthenticated.

Artifact JSON: `findings/runs/2026-02-27T13-36-20-712Z-probe.json`

---
## Run 2026-02-27T13:37:57.639Z

### Auth Flow
- Login page: `https://danella-x.com/Home/Login` -> `200`
- Anti-CSRF token (__RequestVerificationToken): found
- Form action discovered: /Home/Login
- Credential fields detected: user=`Username`, pass=`Password`
- Login page cookies: .AspNetCore.Antiforgery.cdV5uW_Ejgc, .AspNetCore.Mvc.CookieTempDataProvider, ARRAffinity, ARRAffinitySameSite
- Login submit: `https://danella-x.com/Home/Login` -> `200`
- Authenticated signal: no
- Redirect location: none
- Cookies returned (1): .AspNetCore.Mvc.CookieTempDataProvider
- Login errors: Usuario y/o contraseña incorrectos.El Usuario y/o Contraseña no son válidos

### Task Endpoint Probe
- URL: `https://danella-x.com/Task/MyTasks`
- Status: `200`
- Content-Type: `text/html; charset=utf-8`
- Body type: `string`
- Body shape: `string`
- Extracted tasksData count: `n/a`

### Notes
- Login returned error text: Usuario y/o contraseña incorrectos.El Usuario y/o Contraseña no son válidos
- Task endpoint returned login HTML; request is unauthenticated.

Artifact JSON: `findings/runs/2026-02-27T13-37-57-639Z-probe.json`

---
## Run 2026-02-27T13:40:18.079Z

### Auth Flow
- Login page: `https://danella-x.com/Home/Login` -> `200`
- Anti-CSRF token (__RequestVerificationToken): found
- Form action discovered: /Home/Login
- Credential fields detected: user=`Username`, pass=`Password`
- Login page cookies: .AspNetCore.Antiforgery.cdV5uW_Ejgc, .AspNetCore.Mvc.CookieTempDataProvider, ARRAffinity, ARRAffinitySameSite
- Login submit: `https://danella-x.com/Home/Login` -> `200`
- Authenticated signal: no
- Redirect location: none
- Cookies returned (1): .AspNetCore.Mvc.CookieTempDataProvider
- Login errors: Usuario y/o contraseña incorrectos.El Usuario y/o Contraseña no son válidos

### Task Endpoint Probe
- URL: `https://danella-x.com/Task/MyTasks`
- Status: `200`
- Content-Type: `text/html; charset=utf-8`
- Body type: `string`
- Body shape: `string`
- Extracted tasksData count: `n/a`

### Notes
- Login returned error text: Usuario y/o contraseña incorrectos.El Usuario y/o Contraseña no son válidos
- Task endpoint returned login HTML; request is unauthenticated.

Artifact JSON: `findings/runs/2026-02-27T13-40-18-079Z-probe.json`

---
## Run 2026-02-27T13:40:49.089Z

### Auth Flow
- Login page: `https://danella-x.com/Home/Login` -> `200`
- Anti-CSRF token (__RequestVerificationToken): found
- Form action discovered: /Home/Login
- Credential fields detected: user=`Username`, pass=`Password`
- Login page cookies: .AspNetCore.Antiforgery.cdV5uW_Ejgc, .AspNetCore.Mvc.CookieTempDataProvider, ARRAffinity, ARRAffinitySameSite
- Login submit: `https://danella-x.com/Home/Login` -> `200`
- Authenticated signal: no
- Redirect location: none
- Cookies returned (1): .AspNetCore.Mvc.CookieTempDataProvider
- Login errors: Usuario y/o contraseña incorrectos.El Usuario y/o Contraseña no son válidos

### Task Endpoint Probe
- URL: `https://danella-x.com/Task/MyTasks`
- Status: `200`
- Content-Type: `text/html; charset=utf-8`
- Body type: `string`
- Body shape: `string`
- Extracted tasksData count: `n/a`

### Notes
- Login returned error text: Usuario y/o contraseña incorrectos.El Usuario y/o Contraseña no son válidos
- Task endpoint returned login HTML; request is unauthenticated.

Artifact JSON: `findings/runs/2026-02-27T13-40-49-089Z-probe.json`

---
## Run 2026-02-27T14:03:07.993Z

### Auth Flow
- Login page: `https://danella-x.com/Home/Login` -> `200`
- Anti-CSRF token (__RequestVerificationToken): found
- Form action discovered: /Home/Login
- Credential fields detected: user=`Username`, pass=`Password`
- Login page cookies: .AspNetCore.Antiforgery.cdV5uW_Ejgc, .AspNetCore.Mvc.CookieTempDataProvider, ARRAffinity, ARRAffinitySameSite
- Login submit: `https://danella-x.com/Home/Login` -> `200`
- Authenticated signal: no
- Redirect location: none
- Cookies returned (1): .AspNetCore.Mvc.CookieTempDataProvider
- Login errors: Usuario y/o contraseña incorrectos.El Usuario y/o Contraseña no son válidos

### Task Endpoint Probe
- URL: `https://danella-x.com/Task/MyTasks`
- Status: `200`
- Content-Type: `text/html; charset=utf-8`
- Body type: `string`
- Body shape: `string`
- Extracted tasksData count: `n/a`

### Notes
- Login returned error text: Usuario y/o contraseña incorrectos.El Usuario y/o Contraseña no son válidos
- Task endpoint returned login HTML; request is unauthenticated.

Artifact JSON: `findings/runs/2026-02-27T14-03-07-993Z-probe.json`

---
## Run 2026-02-27T14:04:27.683Z

### Auth Flow
- Login page: `https://danella-x.com/Home/Login` -> `200`
- Anti-CSRF token (__RequestVerificationToken): found
- Form action discovered: /Home/Login
- Credential fields detected: user=`Username`, pass=`Password`
- Login page cookies: .AspNetCore.Antiforgery.cdV5uW_Ejgc, .AspNetCore.Mvc.CookieTempDataProvider, ARRAffinity, ARRAffinitySameSite
- Login submit: `https://danella-x.com/Home/Login` -> `200`
- Authenticated signal: no
- Redirect location: none
- Cookies returned (1): .AspNetCore.Mvc.CookieTempDataProvider
- Login errors: Usuario y/o contraseña incorrectos.El Usuario y/o Contraseña no son válidos

### Task Endpoint Probe
- URL: `https://danella-x.com/Task/MyTasks`
- Status: `200`
- Content-Type: `text/html; charset=utf-8`
- Body type: `string`
- Body shape: `string`
- Extracted tasksData count: `n/a`

### Notes
- Login returned error text: Usuario y/o contraseña incorrectos.El Usuario y/o Contraseña no son válidos
- Task endpoint returned login HTML; request is unauthenticated.

Artifact JSON: `findings/runs/2026-02-27T14-04-27-683Z-probe.json`

---
## Run 2026-02-27T14:05:52.680Z

### Auth Flow
- Login page: `https://danella-x.com/Home/Login` -> `200`
- Anti-CSRF token (__RequestVerificationToken): found
- Form action discovered: /Home/Login
- Credential fields detected: user=`Username`, pass=`Password`
- Login page cookies: .AspNetCore.Antiforgery.cdV5uW_Ejgc, .AspNetCore.Mvc.CookieTempDataProvider, ARRAffinity, ARRAffinitySameSite
- Login submit: `https://danella-x.com/Home/Login` -> `302`
- Authenticated signal: yes
- Redirect location: /
- Cookies returned (1): .AspNetCore.Session
- Login errors: none

### Task Endpoint Probe
- URL: `https://danella-x.com/Task/MyTasks`
- Status: `200`
- Content-Type: `text/html; charset=utf-8`
- Body type: `string`
- Body shape: `string`
- Extracted tasksData count: `n/a`

### Notes
- No notable warnings.

Artifact JSON: `findings/runs/2026-02-27T14-05-52-680Z-probe.json`

---
## Run 2026-02-27T14:06:49.015Z

### Auth Flow
- Login page: `https://danella-x.com/Home/Login` -> `200`
- Anti-CSRF token (__RequestVerificationToken): found
- Form action discovered: /Home/Login
- Credential fields detected: user=`Username`, pass=`Password`
- Login page cookies: .AspNetCore.Antiforgery.cdV5uW_Ejgc, .AspNetCore.Mvc.CookieTempDataProvider, ARRAffinity, ARRAffinitySameSite
- Login submit: `https://danella-x.com/Home/Login` -> `302`
- Authenticated signal: yes
- Redirect location: /
- Cookies returned (1): .AspNetCore.Session
- Login errors: none

### Task Endpoint Probe
- URL: `https://danella-x.com/Task/MyTasks`
- Status: `200`
- Content-Type: `text/html; charset=utf-8`
- Body type: `string`
- Body shape: `string`
- Extracted tasksData count: `n/a`

### Notes
- No notable warnings.

Artifact JSON: `findings/runs/2026-02-27T14-06-49-015Z-probe.json`

---
## Run 2026-03-03 (Local Wrapper Smoke)

### Auth Flow via Wrapper
- Local endpoint: `POST http://localhost:3000/api/v1/auth/login`
- Wrapper status: `401`
- Wrapper error code: `INVALID_CREDENTIALS`

### Notes
- Local server boot confirmed with API prefix `/api/v1`.
- Wrapper contract is working (returns standardized JSON error shape on auth failure).
- Upstream credentials currently available in local `.env` did not produce authenticated login in this run.

Artifact JSON: `none (local wrapper smoke test)`

---
## Run 2026-03-03 (Local Wrapper Smoke - Auth Validate/Logout)

### Auth Endpoints via Wrapper
- Local endpoint: `POST http://localhost:3000/api/v1/auth/validate`
- Status without cookie input: `400`
- Error code: `VALIDATION_ERROR`
- Local endpoint: `POST http://localhost:3000/api/v1/auth/logout`
- Status without cookie input: `400`
- Error code: `VALIDATION_ERROR`

### Notes
- Both endpoints are wired and enforce cookie input contract (`auth.cookieHeader` or `x-danella-cookie`).
- Validation behavior without cookie is deterministic and aligned with API error format.

Artifact JSON: `none (local wrapper smoke test)`

---
## Run 2026-03-03 (Local Wrapper Smoke - Full Auth Flow)

### Auth Flow via Wrapper
- Local endpoint: `POST http://localhost:3000/api/v1/auth/login`
- Status: `200`
- Upstream login status observed via wrapper: `302`
- Local endpoint: `POST http://localhost:3000/api/v1/auth/validate`
- Status: `200`
- Session result: `valid=true`, `reason=SESSION_VALID`
- Local endpoint: `POST http://localhost:3000/api/v1/auth/logout`
- Status: `200`
- Logout result: `loggedOut=true`

### Notes
- Full wrapper flow is working end-to-end with current local credentials.
- Validate and logout endpoints interoperate correctly with cookie passthrough from login response.

Artifact JSON: `none (local wrapper smoke test)`

---
## Run 2026-03-03 (Browser Network Inspection - Tasks by SubProject)

### Navigation/Task Request Chain
- Login submit: `POST https://danella-x.com/Home/Login` -> `302`
- Projects page: `GET https://danella-x.com/Projects/ProgramProjects` -> `200`
- Task list page: `GET https://danella-x.com/Task/TaskSubProject?SubProjectID=45` -> `200`

### Data Extraction Findings
- Tasks are embedded in HTML/JS, not returned by a dedicated JSON endpoint.
- Global JS variable found on page: `tasksData`
- Observed `tasksData.length`: `7`
- Sample object fields observed include:
  - `taskID`, `taskCode`, `jobID`, `subProjectID`, `taskStatusName`, `endCustomerName`, `vendorName`, etc.

### Notes
- Key query parameter for upstream page: `SubProjectID`.
- Wrapper endpoint should accept sub-project identifier and parse `tasksData` from HTML.

Artifact JSON: `none (captured from browser devtools inspection)`

---
## Run 2026-03-03 (Local Wrapper Smoke - Tasks Endpoint)

### Wrapper Flow
- Login endpoint: `POST /api/v1/auth/login` -> `200`
- Tasks endpoint: `GET /api/v1/tasks?subProjectId=45&page=1&limit=50` -> `200`
- Extracted tasks count from wrapper response: `7`
- First task code in response: `SYS-006342`

### Notes
- Wrapper tasks endpoint successfully parsed upstream `tasksData` from HTML.
- Observed count matched browser inspection for `SubProjectID=45`.

Artifact JSON: `none (local wrapper smoke test)`

---
## Run 2026-03-03 (Browser Network Inspection - Task Detail and Billing Code Delete)

### Observed Requests
- Detail page open: `GET https://danella-x.com/Task/DeploymentProject?TaskID=6342` -> `200`
- Attachments load: `GET https://danella-x.com/Task/GetAttachments?taskID=6342` -> `200`
- Billing code delete action: `POST https://danella-x.com/Task/DeleteTaskProjectCode` -> `200`
- Delete payload observed: `{"taskProjectCodeID":5158}`
- Post-delete refresh: `GET https://danella-x.com/Task/DeploymentProject?TaskID=6342` -> `200`

### Embedded Detail Data
- In `DeploymentProject` HTML scripts:
  - `const portfolioList = [...]`
  - `const assigned = [...]`

### Notes
- Upstream deletion is non-REST (`POST`), wrapper should map to RESTful `DELETE`.
- Attachments endpoint is direct JSON and lower parsing risk than HTML-based endpoints.

Artifact JSON: `none (captured from browser devtools inspection)`

---
## Run 2026-03-03 (Browser Network Inspection - Add Project Code Flow)

### Observed Requests
- Deployment page: `GET https://danella-x.com/Task/DeploymentProject?TaskID=6342` -> `200`
- Portfolio detail lookup on modal selection: `GET https://danella-x.com/Task/GetPortfolioByID?portfolioID=98` -> `200`
- Add project code submit: `POST https://danella-x.com/Task/AddPortfolioToTask` -> `200`
- Add payload observed: `{"taskID":"6342","portfolioID":"98","quantity":5,"footage":2}`
- Post-add refresh: `GET https://danella-x.com/Task/DeploymentProject?TaskID=6342` -> `200`

### Embedded Detail Data
- In `DeploymentProject` HTML scripts:
  - `const portfolioList = [...]` (available codes in modal)
  - `const assigned = [...]` (currently assigned task codes)

### Notes
- No separate endpoint call is required to open the modal list; available codes are preloaded in `portfolioList`.
- `GetPortfolioByID` is used for detail enrichment when a code is selected.
- `AddPortfolioToTask` returns JSON consumed by frontend with `success` and `message`.

Artifact JSON: `none (captured from browser devtools inspection)`

---
## Run 2026-03-03 (Local Wrapper Smoke - Task Detail Endpoints)

### Wrapper Flow
- Login endpoint: `POST /api/v1/auth/login` -> `200`
- Deployment endpoint: `GET /api/v1/tasks/6342/deployment` -> `200`
- Attachments endpoint: `GET /api/v1/tasks/6342/attachments` -> `200`
- Safe validation of delete route params:
  - `DELETE /api/v1/tasks/6342/project-codes/0` -> `400`, code `VALIDATION_ERROR`

### Notes
- Deployment parsing returned:
  - `portfolioList.length = 4`
  - `assignedProjectCodes.length = 2`
- Attachments endpoint returned JSON array shape (count observed: `0` in this run).
- Destructive delete action was intentionally not executed in smoke test.

Artifact JSON: `none (local wrapper smoke test)`

---
## Run 2026-03-03 (Refactor Validation - Shared Utilities and Stronger Typing)

### Refactor Scope Verified
- Shared utilities introduced and wired in module clients/controllers:
  - URL normalization (`toAbsoluteUrl`)
  - Login HTML detection (`isLoginHtml`)
  - Embedded const array extraction (`extractConstArray`)
  - Redirect-to-login detection (`isRedirectedToLogin`)
  - Upstream error mapping (`toUpstreamAppError`)
  - Common cookie header extraction (`getCookieHeader`)
  - Shared Danella Axios factory (`createDanellaHttpClient`)
- Use-case signatures standardized to object input for:
  - `GetTaskDeploymentUseCase`
  - `GetAvailableCodesUseCase`
  - `DeleteCodeFromTaskUseCase`
- Domain types strengthened with conservative known fields while keeping forward-compatible index signatures.

### Verification Runs
- Typecheck: `pnpm typecheck` -> `pass`
- Smoke auth flow: `pnpm smoke:auth-flow` -> `login 200`, `validate 200 (SESSION_VALID)`, `logout 200`
- Smoke tasks list: `pnpm smoke:tasks-local` -> `status 200`, `count 7`
- Smoke task detail + delete validation: `pnpm smoke:task-detail-local` -> `deployment 200`, `attachments 200`, `delete validation 400 (VALIDATION_ERROR)`

### Notes
- No wrapper endpoint path/contract changes were introduced in this refactor.
- Behavior remained consistent after deduplication and shared utility extraction.

Artifact JSON: `none (local compile/smoke validation)`

---
## Run 2026-03-04 (Browser Inspection - Add Task Form Metadata)

### Observed Upstream Behavior
- Task page load: `GET https://danella-x.com/Task/TaskSubProject?SubProjectID=45` -> `200`
- Add Task save action: `POST https://danella-x.com/Task/InsertTask` -> `200`
- Save payload observed:
  - `{"jobID":"jobtest","endCustomerID":"5","managerAreaID":"5","customerID":"10","projectID":"25","subProjectID":"45","projectTypeID":"2","verifierKeyID":"000","jobTypeID":"2"}`
- Job types lookup endpoint observed in page script:
  - `GET https://danella-x.com/Task/GetJobTypesByProjectType?projectTypeID=2` -> `200`

### Add Task Metadata Extraction Findings
- No separate request is fired when opening Add Task modal for end-customer/manager catalogs.
- The metadata is embedded in `TaskSubProject` HTML:
  - Hidden IDs: `customerID=10`, `projectID=25`, `subProjectID=45`, `projectTypeID=2`, `jobTypeID=2`
  - End-customer options count: `4`
  - Manager area options count: `36`
- Observed label mapping in modal:
  - `Customer: A-NxWs`
  - `Project: NxWs - High Split`
  - `SubProject: NxWs - HS - Asbuilt`
  - `Project Type: High Split`
  - `Job Type: Asbuilt`

### Notes
- `TaskSubProject` is both task-list source (`tasksData`) and Add Task form metadata source.
- `GetJobTypesByProjectType` can be used to enrich `jobTypeID` dictionary data beyond the default hidden value.

Artifact JSON: `none (captured from browser devtools inspection)`

---
## Run 2026-03-04 (Local Wrapper Implementation - Task Form Metadata Endpoint)

### Wrapper Flow
- Typecheck: `pnpm typecheck` -> `pass`
- Existing tasks smoke: `pnpm smoke:tasks-local` -> `status 200`, `count 8`
- New endpoint smoke (local script with in-process app server):
  - Login: `POST /api/v1/auth/login` -> `200`
  - Form metadata: `GET /api/v1/tasks/form-metadata?subProjectId=45` -> `200`
  - Parsed counts observed:
    - `endCustomers=4`
    - `managerAreas=36`
    - `jobTypesByProjectType=6`

### Notes
- New endpoint contract returns dictionary objects (`id`, `name`, `code`) for customer/project/subproject and selectable catalogs.
- Upstream mapping used:
  - `GET /Task/TaskSubProject?SubProjectID={id}`
  - `GET /Task/GetJobTypesByProjectType?projectTypeID={id}`

Artifact JSON: `none (local wrapper smoke + in-process script)`

---
## Run 2026-03-04 (Artifact Hygiene - TaskSubProject Snapshot)

### Action
- Persisted a sanitized HTML evidence artifact from TaskSubProject reverse engineering.
- Redaction applied:
  - Embedded `var tasksData = [...]` replaced with `var tasksData = []; // redacted tasksData`
- Original temporary file removed from `tmp/`.

### Notes
- Purpose: keep traceability artifact in-repo under `findings/runs/` without carrying full task list payloads in `tmp/`.

Artifact file: `findings/runs/2026-03-04-task-subproject-sanitized.html`

---
## Run 2026-03-04T00:00:00.000Z

### Auth Flow
- Logout endpoint probe: `https://danella-x.com/Home/Logout` -> `404`
- Wrapper `logout` contract behavior (before fix): `loggedOut: true` for `404`
- Wrapper `logout` contract behavior (after fix): `loggedOut: false` unless upstream redirects to `/Home/Login` or returns login HTML

### Notes
- Logout success is now determined using the same upstream session-end signals as `validate`: login redirect and login HTML detection.
- A non-terminal response (for example `404`) no longer reports a false-positive logout.

Artifact JSON: `n/a (cleanup/behavior fix)`

---
## Run 2026-03-04 (Local Wrapper Implementation - Task Create Endpoint)

### Wrapper Flow
- Typecheck: `pnpm typecheck` -> `pass`
- New route wired: `POST /api/v1/tasks?subProjectId={id}`
- Wrapper validation added for required fields:
  - `jobId`
  - `verifierKeyId`
  - `endCustomerId`
  - `managerAreaId`
- Wrapper preflight metadata lookup:
  - `GET /Task/TaskSubProject?SubProjectID={id}`
  - `GET /Task/GetJobTypesByProjectType?projectTypeID={id}`
- Upstream create mapping used:
  - `POST /Task/InsertTask`
  - Payload keys: `jobID`, `endCustomerID`, `managerAreaID`, `customerID`, `projectID`, `subProjectID`, `projectTypeID`, `verifierKeyID`, `jobTypeID`
- Local in-process smoke checks:
  - Missing `verifierKeyId` -> `400 VALIDATION_ERROR` (`Invalid request body`)
  - Missing cookie header -> `400 VALIDATION_ERROR`
  - Fake cookie header -> `401 SESSION_EXPIRED`
  - Valid login cookie + invalid catalog IDs -> `400 VALIDATION_ERROR` (`endCustomerId is not valid for this sub-project`)

### Notes
- `jobTypeID` is enforced from upstream metadata default (`jobTypeDefault.id`) and is not client-overridable.
- `endCustomerId` and `managerAreaId` are validated against the metadata catalogs before calling `InsertTask`.
- Wrapper now returns `409` when upstream responds with business non-success (`success: false`) while preserving upstream status/url metadata.

Artifact JSON: `none (local implementation + typecheck)`
