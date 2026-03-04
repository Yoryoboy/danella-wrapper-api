## Plan: Create Task Endpoint (`POST /api/v1/tasks?subProjectId=...`) — Updated Requirements

### Summary
Implement a wrapper endpoint to create tasks in Danella using existing form metadata as authoritative context.  
This revision locks **both** `verifierKeyId` and `endCustomerId` as **required** inputs.

---

## Locked Decisions
- Path: `POST /api/v1/tasks?subProjectId={id}`
- Input mode: IDs only
- Response mode: minimal + upstream
- `jobTypeDefault` from metadata is enforced (client cannot override)
- Required fields in body:
  - `jobId`
  - `verifierKeyId` (**required**)
  - `endCustomerId` (**required**)
  - `managerAreaId` (required)

---

## Public API Contract

### Endpoint
- `POST /api/v1/tasks?subProjectId=45`
- Auth: `x-danella-cookie` (or `Cookie`)

### Request body
```json
{
  "jobId": "Job Test",
  "verifierKeyId": "000",
  "endCustomerId": 5,
  "managerAreaId": 5
}
```

### Validation rules
- `subProjectId`: required positive integer (query)
- `jobId`: required non-empty string
- `verifierKeyId`: required non-empty string
- `endCustomerId`: required positive integer
- `managerAreaId`: required positive integer

### Response `200`
```json
{
  "success": true,
  "message": "Created successfully",
  "data": {
    "subProjectId": 45,
    "jobId": "Job Test",
    "verifierKeyId": "000",
    "endCustomerId": 5,
    "managerAreaId": 5
  },
  "upstream": {
    "status": 200,
    "url": "https://danella-x.com/Task/InsertTask"
  }
}
```

### Errors
- `400 VALIDATION_ERROR`
- `401 SESSION_EXPIRED`
- `409` upstream business non-success
- `502 UPSTREAM_PARSE_ERROR`
- `503 UPSTREAM_UNAVAILABLE`

---

## Internal Mapping Flow
1. Parse query/body.
2. Read cookie header.
3. Fetch metadata (`getTaskFormMetadata(subProjectId)`).
4. Validate:
   - `endCustomerId` exists in `endCustomers`
   - `managerAreaId` exists in `managerAreas`
5. Build upstream payload:
```json
{
  "jobID": "<jobId>",
  "endCustomerID": "<endCustomerId>",
  "managerAreaID": "<managerAreaId>",
  "customerID": "<metadata.customer.id>",
  "projectID": "<metadata.project.id>",
  "subProjectID": "<metadata.subProject.id>",
  "projectTypeID": "<metadata.projectType.id>",
  "verifierKeyID": "<verifierKeyId>",
  "jobTypeID": "<metadata.jobTypeDefault.id>"
}
```
6. Call `POST /Task/InsertTask`.
7. Normalize success/message/upstream and return wrapper response.

---

## File-Level Change Plan

### Domain
- `src/modules/tasks/domain/task.types.ts`
  - Add `CreateTaskInput`, `CreateTaskResult` with `verifierKeyId` required.
- `src/modules/tasks/domain/task-repository.ts`
  - Add `createTask(input)` method signature.

### Application
- Add `create-task.use-case.ts`
  - Enforce required fields (`verifierKeyId`, `endCustomerId` included).
- Export in `src/modules/tasks/application/index.ts`.

### Infrastructure
- Extend `danella-task.client.ts` with `createTask`.
- Reuse metadata fetch + catalog checks + upstream call.

### Interfaces
- Add schemas in `tasks.schemas.ts`:
  - `createTaskQuerySchema`
  - `createTaskBodySchema` (with required `verifierKeyId`)
- Add controller method `create`.
- Add route in `tasks.routes.ts`:
  - `router.post("/", tasksController.create)`

---

## Tests & Acceptance
- `pnpm typecheck` passes.
- Happy path create with valid cookie + payload returns `200/409` depending upstream.
- Missing `verifierKeyId` => `400`.
- Missing `endCustomerId` => `400`.
- Invalid catalog IDs => `400`.
- Missing cookie => `400`.
- Expired cookie => `401`.

---

## Documentation Deliverables
- Update root `README.md` with full endpoint contract.
- Update Postman collection `danella-wrapper-api` with `Create Task` request + examples.
- Update `findings/endpoint-behavior.md` and `findings/discovery-log.md` with mapping/validation notes.

---

## Assumptions
- `endCustomerId` is the field you referred to as “EncontrarKeyId”.
- `jobTypeDefault` remains non-editable from client side for this endpoint.
