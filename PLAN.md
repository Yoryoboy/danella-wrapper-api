## Plan: Replace `Task Deployment` With Unified `Get Task` Endpoint

### Summary
Migrate from a deployment-focused endpoint (`GET /api/v1/tasks/deployment`) to a single task-detail endpoint (`GET /api/v1/tasks/:taskId`) that returns the full task view in normalized JSON.

The goal is to expose all relevant data a client sees in Danella `DeploymentProject`:
- primary task details
- secondary fields
- assignment control
- available and assigned project codes
- attachments
- optional task messages

This is a deliberate contract change. No backward-compatibility bridge is required because the API is not deployed and has no consumers yet.

---

## Locked Decisions
- Remove/deprecate `Task Deployment` endpoint contract.
- New canonical endpoint: `GET /api/v1/tasks/:taskId`.
- Keep wrapper query-param mapping rule where needed, but task detail uses path param for resource identity.
- Return stable sectioned response with predictable null/empty semantics.
- Preserve upstream raw formatting for date/currency strings to avoid locale parsing regressions.

---

## Why This Change
1. `deployment` naming is too narrow and currently surfaces mostly code-related arrays.
2. Consumers need a real `get task` contract with full detail for one `taskId`.
3. Upstream page is SSR + embedded JS; centralizing parsing in wrapper prevents frontend scraping duplication.
4. Single endpoint simplifies client integration and caching boundaries.

---

## Final Public Contract (Target)

### Endpoint
- `GET /api/v1/tasks/:taskId`
- Auth: `x-danella-cookie` (or `Cookie`)

### Response shape (`200`)
```json
{
  "success": true,
  "data": {
    "taskId": 8713,
    "primaryDetails": {},
    "secondaryFields": [],
    "assignmentControl": {},
    "projectCodes": {
      "available": [],
      "assigned": []
    },
    "attachments": [],
    "messages": []
  },
  "upstream": {
    "deployment": {
      "status": 200,
      "url": "https://danella-x.com/Task/DeploymentProject?TaskID=8713"
    },
    "attachments": {
      "status": 200,
      "url": "https://danella-x.com/Task/GetAttachments?taskID=8713"
    },
    "messages": {
      "status": 200,
      "url": "https://danella-x.com/Task/GetMessagesByTaskID?taskID=8713"
    }
  }
}
```

### Null/Empty Rules
- Missing scalar field: `null`
- Missing list/table: `[]`
- Unknown primary labels: keep under `primaryDetails.extra`

---

## Data Source Mapping
1. `GET /Task/DeploymentProject?TaskID={taskId}` (HTML)
   - `#tablaTaskDetail` -> `primaryDetails`
   - `#tablaSecondaryFields` -> `secondaryFields`
   - `#tablaAssignment` + vendor blocks -> `assignmentControl`
   - `const portfolioList = [...]` -> `projectCodes.available`
   - `const assigned = [...]` -> `projectCodes.assigned`
2. `GET /Task/GetAttachments?taskID={taskId}` (JSON) -> `attachments`
3. `GET /Task/GetMessagesByTaskID?taskID={taskId}` (JSON) -> `messages`

---

## Typing Plan

### Domain types (`src/modules/tasks/domain/task.types.ts`)
- Add:
  - `GetTaskDetailInput`
  - `GetTaskDetailResult`
  - `TaskPrimaryDetails`
  - `TaskSecondaryField`
  - `TaskAssignmentControl`
  - `TaskVendorAssignment`
  - `TaskMessage`

### Repository contract (`src/modules/tasks/domain/task-repository.ts`)
- Add `getTaskDetail(input: GetTaskDetailInput): Promise<GetTaskDetailResult>`
- Remove `getDeployment` contract after migration.

### Use case (`src/modules/tasks/application`)
- Add `get-task-detail.use-case.ts` with validation and repository call.
- Remove old `get-task-deployment.use-case.ts` wiring once new route is live.

---

## Interface/Routing Plan

### Routes (`src/modules/tasks/interfaces/tasks.routes.ts`)
- Add `router.get("/:taskId", tasksController.getById)`.
- Remove `router.get("/deployment", ...)` and `router.get("/:taskId/deployment", ...)`.

### Controller (`src/modules/tasks/interfaces/tasks.controller.ts`)
- Add `getById` handler.
- Keep attachments endpoint unchanged.
- Remove deployment handler and related imports.

### Schemas (`src/modules/tasks/interfaces/tasks.schemas.ts`)
- Reuse `taskIdParamsSchema`.
- Remove deployment-specific query usage.

---

## Infrastructure Parsing Plan

### `src/modules/tasks/infrastructure/danella-task.client.ts`
- Implement `getTaskDetail` that:
  1. Fetches deployment HTML.
  2. Parses primary/secondary/assignment/vendor sections with `cheerio`.
  3. Parses `portfolioList` and `assigned` with existing `extractConstArray`.
  4. Fetches attachments and messages JSON.
  5. Returns normalized aggregate result.

### Shared HTML parser utilities
- Add reusable helpers for:
  - pair-table extraction
  - day-column assignment extraction
  - label normalization and safe null conversion

---

## Documentation & Migration Deliverables

### README
- Remove `GET /api/v1/tasks/deployment` docs.
- Add `GET /api/v1/tasks/:taskId` docs with full response and field semantics.
- Update examples to reflect new contract.

### Postman (required)
- In collection `danella-wrapper-api`:
  - remove or mark deprecated request: `Task Deployment`
  - add new request: `Get Task`
  - include params/auth/example response/errors
  - add deprecation note in description: "Task Deployment replaced by Get Task"

### Findings
- Update `findings/endpoint-behavior.md` with new parsing strategy.
- Update `findings/discovery-log.md` with run evidence from real task example.

---

## Validation & Acceptance Criteria
1. `npx tsc --noEmit` passes.
2. `GET /api/v1/tasks/:taskId` returns:
   - empty-friendly response for sparse task (example: recent/new task)
   - populated response for real task with assignments/codes/attachments.
3. Old deployment endpoint removed from routes and docs.
4. Postman collection updated in same change.
5. README/findings/Postman are synchronized with implementation.

---

## Execution Order
1. Domain + repository types/contracts.
2. Application use case.
3. Infrastructure parser + upstream calls.
4. Controller/routes/schemas migration.
5. README/findings updates.
6. Postman collection update.
7. Typecheck and smoke verification.
