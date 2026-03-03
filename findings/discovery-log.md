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
