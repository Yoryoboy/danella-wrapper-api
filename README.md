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

Query param contract:
- Wrapper endpoints prioritize query params (for example, `taskId`, `taskProjectCodeId`) for caller simplicity.
- Internally, the API maps those params to Danella-X legacy URL shapes (path/query) required by upstream.
- This mapping is intentional and part of the public contract of this wrapper.

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

- `GET /api/v1/tasks/form-metadata?subProjectId=45`
- Description: Returns metadata needed to build the upstream Add Task form for a sub-project. Parses context dictionaries from `TaskSubProject` HTML and enriches job types from `/Task/GetJobTypesByProjectType`.
- Query params:
  - `subProjectId` (required, integer)
  - `projectId` (optional alias for `subProjectId`)
- Auth input:
  - `x-danella-cookie: <cookieHeader>` header, or
  - standard `Cookie` header
- Response `200`:

```json
{
  "success": true,
  "data": {
    "customer": {
      "id": 10,
      "name": "A-NxWs"
    },
    "project": {
      "id": 25,
      "name": "NxWs - High Split"
    },
    "subProject": {
      "id": 45,
      "name": "NxWs - HS - Asbuilt"
    },
    "projectType": {
      "id": 2,
      "name": "High Split"
    },
    "jobTypeDefault": {
      "id": 2,
      "name": "Asbuilt"
    },
    "endCustomers": [
      { "id": 1, "name": "Comcast" }
    ],
    "managerAreas": [
      { "id": 5, "name": "Jorge Diaz" }
    ],
    "jobTypesByProjectType": [
      { "id": 2, "name": "Asbuilt", "projectTypeId": 2 }
    ]
  },
  "meta": {
    "subProjectId": 45,
    "counts": {
      "endCustomers": 4,
      "managerAreas": 36,
      "jobTypesByProjectType": 6
    }
  },
  "upstream": {
    "status": 200,
    "url": "https://danella-x.com/Task/TaskSubProject?SubProjectID=45",
    "jobTypesStatus": 200,
    "jobTypesUrl": "https://danella-x.com/Task/GetJobTypesByProjectType?projectTypeID=2"
  }
}
```

- Response `400`:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters"
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
    "message": "Could not extract task form labels from upstream HTML"
  }
}
```

- Response `503`:

```json
{
  "success": false,
  "error": {
    "code": "UPSTREAM_UNAVAILABLE",
    "message": "Could not reach upstream task form metadata endpoint"
  }
}
```

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

- `GET /api/v1/tasks/deployment?taskId=6342`
- Description: Fetches task deployment detail page (`/Task/DeploymentProject?TaskID={taskId}`) and extracts embedded datasets.
- Auth input:
  - `x-danella-cookie: <cookieHeader>` header, or
  - standard `Cookie` header
- Response `200`:

```json
{
  "success": true,
  "data": {
    "taskId": 6342,
    "portfolioList": [],
    "assignedProjectCodes": []
  },
  "upstream": {
    "status": 200,
    "url": "https://danella-x.com/Task/DeploymentProject?TaskID=6342"
  }
}
```

- `GET /api/v1/tasks/attachments?taskId=6342`
- Description: Fetches task attachments from upstream JSON endpoint `/Task/GetAttachments?taskID={taskId}`.
- Auth input:
  - `x-danella-cookie: <cookieHeader>` header, or
  - standard `Cookie` header
- Response `200`:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "taskId": 6342,
    "count": 0
  },
  "upstream": {
    "status": 200,
    "url": "https://danella-x.com/Task/GetAttachments?taskID=6342"
  }
}
```

- `DELETE /api/v1/tasks?taskId=9373`
- Description: Deletes a task by mapping the wrapper query param to upstream legacy delete action `POST /Task/DeleteTask?taskID={taskId}`.
- Query params:
  - `taskId` (required, integer)
- Auth input:
  - `x-danella-cookie: <cookieHeader>` header, or
  - standard `Cookie` header
- Response `200` (successful upstream delete):

```json
{
  "success": true,
  "message": "Deleted successfully",
  "meta": {
    "taskId": 9373
  },
  "upstream": {
    "status": 200,
    "url": "https://danella-x.com/Task/DeleteTask?taskID=9373"
  }
}
```

- Response `409` (upstream responds non-success):

```json
{
  "success": false,
  "message": "The task could not be deleted.",
  "meta": {
    "taskId": 9373
  },
  "upstream": {
    "status": 200,
    "url": "https://danella-x.com/Task/DeleteTask?taskID=9373"
  }
}
```

- Response `400`:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "x-danella-cookie or Cookie header is required"
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

- Response `503`:

```json
{
  "success": false,
  "error": {
    "code": "UPSTREAM_UNAVAILABLE",
    "message": "Could not reach upstream task delete endpoint"
  }
}
```

### Codes

- `GET /api/v1/codes/available?taskId=6342`
- Description: Returns available project codes for a task by extracting `portfolioList` from upstream deployment page HTML.
- Upstream mapping: `GET /Task/DeploymentProject?TaskID={taskId}` -> parse `const portfolioList = [...]`.
- Auth input:
  - `x-danella-cookie: <cookieHeader>` header, or
  - standard `Cookie` header
- Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "portfolioID": 98,
      "code": "D1-1",
      "description": "Test1",
      "unit": "Un",
      "price": 24
    }
  ],
  "meta": {
    "taskId": 6342,
    "count": 1
  },
  "upstream": {
    "status": 200,
    "url": "https://danella-x.com/Task/DeploymentProject?TaskID=6342"
  }
}
```

- `GET /api/v1/codes/detail?portfolioId=98`
- Description: Returns detail for one portfolio/project code from upstream JSON endpoint.
- Upstream mapping: `GET /Task/GetPortfolioByID?portfolioID={portfolioId}`.
- Auth input:
  - `x-danella-cookie: <cookieHeader>` header, or
  - standard `Cookie` header
- Response `200`:

```json
{
  "success": true,
  "data": {
    "portfolioID": 98,
    "unit": "Un"
  },
  "meta": {
    "portfolioId": 98
  },
  "upstream": {
    "status": 200,
    "url": "https://danella-x.com/Task/GetPortfolioByID?portfolioID=98"
  }
}
```

- `POST /api/v1/codes`
- Description: Adds a project code to a task.
- Upstream mapping: `POST /Task/AddPortfolioToTask` with translated JSON payload (`taskID`, `portfolioID`, `quantity`, `footage`).
- Auth input:
  - `x-danella-cookie: <cookieHeader>` header, or
  - standard `Cookie` header
- Request body:

```json
{
  "taskId": 6342,
  "portfolioId": 98,
  "quantity": 5,
  "footage": 2
}
```

- Response `200` (successful upstream add):

```json
{
  "success": true,
  "message": "Added successfully",
  "upstream": {
    "status": 200,
    "url": "https://danella-x.com/Task/AddPortfolioToTask"
  }
}
```

- Response `409` (upstream responds non-success):

```json
{
  "success": false,
  "message": "Add failed",
  "upstream": {
    "status": 200,
    "url": "https://danella-x.com/Task/AddPortfolioToTask"
  }
}
```

- `DELETE /api/v1/codes?taskId=6342&taskProjectCodeId=5158`
- Description: Deletes a billing/project code relation by mapping to upstream `POST /Task/DeleteTaskProjectCode`.
- Auth input:
  - `x-danella-cookie: <cookieHeader>` header, or
  - standard `Cookie` header
- Response `200` (successful upstream delete):

```json
{
  "success": true,
  "message": "Deleted successfully",
  "upstream": {
    "status": 200,
    "url": "https://danella-x.com/Task/DeleteTaskProjectCode"
  }
}
```

- Response `409` (upstream responds non-success):

```json
{
  "success": false,
  "message": "Delete failed",
  "upstream": {
    "status": 200,
    "url": "https://danella-x.com/Task/DeleteTaskProjectCode"
  }
}
```

- Response `400`:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "taskId/portfolioId/body must be valid and x-danella-cookie or Cookie header is required"
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
    "message": "Could not parse portfolioList payload from upstream HTML"
  }
}
```

- Response `503`:

```json
{
  "success": false,
  "error": {
    "code": "UPSTREAM_UNAVAILABLE",
    "message": "Could not reach upstream codes endpoint"
  }
}
```

## Postman

The endpoints are documented in Postman collection:

- Collection: `danella-wrapper-api`
- Folder: `Auth`
- Request: `Login (Cookie Passthrough)`
- Request: `Validate Session`
- Request: `Logout`
- Folder: `Tasks`
- Request: `Get Task Form Metadata`
- Request: `List Tasks By SubProject`
- Request: `Get Task Deployment`
- Request: `Get Task Attachments`
- Request: `Delete Task`
- Folder: `Codes`
- Request: `Get Available Task Project Codes`
- Request: `Get Task Project Code Detail`
- Request: `Add Task Project Code`
- Request: `Delete Task Project Code`
