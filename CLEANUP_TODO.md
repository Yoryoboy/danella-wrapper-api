# Cleanup TODO

Hallazgos de code review (2026-03-04). Ordenados por prioridad. Incluye contexto, causa raíz y solución propuesta para cada caso.

---

## ✅ Ya resueltos

- **Logout bug** (`danella-auth.client.ts`): el método `logout()` ya valida correctamente redirect a login e HTML de login antes de reportar `loggedOut: true`. Corregido en el mismo pass.
- **Barrel exports** (`auth`, `tasks`, `codes`): consistencia de `index.ts` por módulo aplicada.
- **`express-rate-limit`**: dependencia eliminada de `package.json`.
- **`package-lock.json`**: removido. `pnpm-lock.yaml` es el único lockfile.

---

## 🔴 Alta prioridad

### A1. CORS permisivo con `credentials: true` cuando no hay `ALLOWED_ORIGINS`

**Archivo:** `src/app.ts:12-21`

**Problema:** Si `ALLOWED_ORIGINS` no está seteado en el env, el config de CORS cae a `origin: true` (acepta cualquier origen) combinado con `credentials: true`. Esto permite que cualquier sitio web haga requests autenticados con cookies en nombre del usuario. En producción es un riesgo de seguridad real (CSRF-like cross-origin attacks).

```typescript
// Comportamiento actual — peligroso en prod sin ALLOWED_ORIGINS
const corsOptions =
  env.allowedOrigins.length > 0
    ? { origin: env.allowedOrigins, credentials: true }
    : { origin: true, credentials: true }; // ← cualquier origen
```

**Solución:** Si `NODE_ENV === "production"` y `allowedOrigins` está vacío, lanzar error al arrancar (fail-fast) o deshabilitar CORS completamente. En desarrollo, mantener el comportamiento permisivo.

```typescript
if (env.nodeEnv === "production" && env.allowedOrigins.length === 0) {
  throw new Error("ALLOWED_ORIGINS must be set in production");
}
```

**Criterio:** En prod sin `ALLOWED_ORIGINS`, el servidor no arranca (o CORS rechaza todos los orígenes extraños).

---

### A2. Fuente de verdad duplicada para la versión de API

**Archivos:** `src/config/constants.ts:2`, `src/config/env.ts:37`, `src/app.ts:35-40`

**Problema:** `API_PREFIX` está hardcodeado como `"/api/v1"` en `constants.ts`. Simultáneamente existe `env.apiVersion` (leído de `API_VERSION`) que solo se usa en el health-check como metadata informativa. Si alguien cambia `API_VERSION=v2` en el env, el health responde `"api": "/api/v2"` pero las rutas reales siguen en `/api/v1`. El consumidor recibe información falsa.

**Solución (opción preferida — Option B):** Eliminar `API_VERSION` del env y del objeto `env`, y exponer la versión directamente desde la constante:

```typescript
// constants.ts
export const API_VERSION = "v1";
export const API_PREFIX = `/api/${API_VERSION}`;
```

Alternativamente (Option A): construir `API_PREFIX` desde `env.apiVersion`, pero entonces `API_PREFIX` deja de ser una constante en tiempo de compilación, lo que complica el tipado con `as const`.

**Criterio:** Una sola fuente determina el prefijo real y el valor expuesto en el health-check.

---

### A3. Doble validación entre controller y use case — mensajes inconsistentes

**Archivos:** `src/modules/tasks/interfaces/tasks.controller.ts`, `src/modules/tasks/application/*.use-case.ts` (y similares en `codes/`)

**Problema:** Los controllers ya validan con Zod antes de llamar al use case. Los use cases repiten validaciones manuales (`Number.isInteger`, `.trim()`) con mensajes de error distintos al de Zod. Esto genera:

- Divergencias de mensajes (`"cookieHeader is required"` vs `"x-danella-cookie or Cookie header is required"`).
- `GetTaskFormMetadataUseCase` valida `!input.cookieHeader` sin `.trim()`, mientras los demás usan `.trim()`.
- Más código a mantener sin valor adicional.

La única validación legítima en use cases son **reglas de negocio** (ej: `limit <= 200`). El resto es responsabilidad del controller.

**Solución:** Eliminar las validaciones de formato/presencia en use cases. Mantener solo restricciones de negocio. Unificar el mensaje de cookie missing en un único lugar (el helper `getCookieHeader` ya lanza el error o retorna `null`).

**Criterio:** Cada validación existe en un solo lugar. Los mensajes de error son consistentes.

---

### A4. `getTaskDetail` llama attachments y messages en serie (latencia evitable)

**Archivo:** `src/modules/tasks/infrastructure/danella-task.client.ts` (~líneas 715 y 737)

**Problema:** `getTaskDetail` hace tres llamadas upstream secuenciales: primero `deployment` (para extraer el HTML de detalle), luego `attachments` y luego `messages`. Las llamadas de attachments y messages son independientes entre sí una vez validada la sesión, pero se ejecutan una tras otra. Suma innecesaria de latencia en cada GET `/:taskId`.

**Solución:** Tras la llamada inicial a `deployment` (que valida sesión), paralelizar attachments y messages:

```typescript
const [attachmentsResponse, messagesResponse] = await Promise.all([
  this.fetchAttachments(input),
  this.fetchMessages(input),
]);
```

Si una falla, `Promise.all` rechaza inmediatamente (comportamiento deseable — respuesta parcial sería peor).

**Criterio:** `getTaskDetail` hace las tres llamadas y el tiempo total ≈ max(deployment, attachments, messages) en lugar de la suma.

---

## 🟡 Media prioridad

### B1. `taskId` validado en `deleteCodeQuerySchema` pero nunca usado

**Archivos:** `src/modules/codes/interfaces/codes.schemas.ts:17`, `src/modules/codes/interfaces/codes.controller.ts:147`, `src/modules/codes/domain/code.types.ts:68`

**Problema:** El schema de `DELETE /codes` exige `taskId` como query param y lo valida como entero positivo, pero el controller no lo pasa al use case y `DeleteCodeFromTaskInput` solo tiene `taskProjectCodeId`. El `taskId` se recibe, se valida y se descarta silenciosamente. Genera fricción innecesaria para los consumidores de la API.

**Solución:** Decidir una de dos opciones:

- **Opción A:** Si el `taskId` es necesario para validación cruzada upstream, agregarlo a `DeleteCodeFromTaskInput` y usarlo en el cliente Danella.
- **Opción B (preferida si upstream no lo requiere):** Eliminarlo del schema y de la documentación.

**Criterio:** Ningún campo requerido en el schema queda sin usarse en la operación correspondiente.

---

### B2. `AvailableCode` y `CodeDetail` son tipos idénticos; duplican `TaskPortfolioCode`

**Archivos:** `src/modules/codes/domain/code.types.ts:1-21`, `src/modules/tasks/domain/task.types.ts:50-58`

**Problema:** `AvailableCode` y `CodeDetail` en el módulo `codes` tienen exactamente los mismos campos. A su vez, `TaskPortfolioCode` en el módulo `tasks` es estructuralmente idéntico. Son tres definiciones del mismo shape mantenidas por separado.

**Solución:** Definir un tipo base en `shared/domain/` (ej: `PortfolioCode`) y que cada módulo lo importe o lo extienda si necesita diferencias semánticas.

```typescript
// src/shared/domain/portfolio-code.types.ts
export interface PortfolioCode {
  portfolioID?: number;
  code?: string;
  description?: string;
  unit?: string;
  price?: number;
  quantity?: number;
  footage?: number;
  [key: string]: unknown;
}
```

**Criterio:** Un solo tipo base para el shape de portfolio code. Los módulos lo re-exportan o alias-an si lo necesitan.

---

### B3. `CreateTaskUseCaseInput` duplica `CreateTaskInput` del dominio

**Archivos:** `src/modules/tasks/application/create-task.use-case.ts:5-12`, `src/modules/tasks/domain/task.types.ts:15-22`

**Problema:** El use case define una interfaz local `CreateTaskUseCaseInput` con los mismos campos que `CreateTaskInput` ya definida en el dominio. Son idénticas. Lo mismo ocurre con `AddCodeToTaskUseCaseInput` vs `AddCodeToTaskInput` en el módulo `codes`.

**Solución:** Eliminar las interfaces locales de los use cases e importar directamente las del dominio.

**Criterio:** Cero interfaces duplicadas entre application y domain para el mismo concepto.

---

### B4. Firma de `execute()` inconsistente en dos use cases

**Archivos:** `src/modules/tasks/application/get-task-attachments.use-case.ts:8`, `src/modules/codes/application/get-code-detail.use-case.ts:8`

**Problema:** La convención establecida en todos los use cases es `execute(input: SomeInput)` con un objeto. Estos dos reciben parámetros posicionales separados (`execute(taskId, cookieHeader)` y `execute(portfolioId, cookieHeader)`), rompiendo el patrón y dificultando extensiones futuras sin breaking changes.

**Solución:** Cambiar ambos para recibir un objeto input usando los tipos de dominio ya existentes (`GetTaskAttachmentsInput` y `GetCodeDetailInput`).

**Criterio:** Todos los use cases tienen `execute(input: XInput)` como firma uniforme.

---

### B5. Parsing HTML frágil: regex solo cubre `const`, silencio en array vacío

**Archivos:** `src/modules/tasks/infrastructure/danella-task.client.ts` (~línea 38), `src/shared/infrastructure/html.utils.ts:17`

**Problema — parte 1:** El regex en `extractConstArray` solo matchea declaraciones `const varName = [...]`. Si upstream cambia a `var` o `let`, la extracción falla silenciosamente retornando `[]` — que el caller interpreta como "lista vacía exitosa" en lugar de "parsing fallido".

**Problema — parte 2:** `isLoginHtml` usa strings hardcodeados (`"__requestverificationtoken"`, `"/home/login"`, `"name=\"username\""`) que ya están configurables via `env.danella.tokenField` y `env.danella.loginPagePath`. Si upstream cambia el nombre del token o la ruta, hay que actualizar en dos lugares.

**Solución parte 1:** Ampliar el regex para cubrir `var`/`let`/`const`, y/o agregar un modo estricto que lance error si no encuentra el array (en lugar de retornar `[]` silenciosamente para arrays críticos).

**Solución parte 2:** Reemplazar los strings hardcodeados en `isLoginHtml` por los valores de `env.danella.*`.

**Criterio:** Un parsing fallido no puede disfrazarse de lista vacía. Las heurísticas de detección usan la misma fuente de verdad que el cliente HTTP.

---

### B6. Logging ausente para errores upstream en `errorMiddleware`

**Archivo:** `src/shared/interfaces/http/error-middleware.ts:7-18`

**Problema:** Cuando se lanza un `AppError` (incluyendo errores 5xx de upstream como `UPSTREAM_UNAVAILABLE`, `UPSTREAM_PARSE_ERROR`, `SESSION_EXPIRED`), el error se serializa y se devuelve al cliente sin que nada quede en el log del servidor. Solo los errores no clasificados llegan al `logger.error`. En producción, esto significa cero visibilidad sobre fallos upstream.

**Solución:** Agregar logging condicional para `AppError` con `statusCode >= 500`:

```typescript
if (error instanceof AppError) {
  if (error.statusCode >= 500) {
    logger.error("Upstream or server error", {
      code: error.code,
      message: error.message,
      path: req.path,
    });
  }
  res.status(error.statusCode).json({ ... });
  return;
}
```

**Criterio:** Errores 5xx de cualquier tipo dejan rastro en el log del servidor.

---

### B7. Rutas de attachments duplicadas apuntan al mismo handler con lógica interna bifurcada

**Archivos:** `src/modules/tasks/interfaces/tasks.routes.ts:32-34`, `src/modules/tasks/interfaces/tasks.controller.ts:162-180`

**Problema:** Hay dos rutas registradas para attachments:

- `GET /tasks/attachments?taskId=X`
- `GET /tasks/:taskId/attachments`

Ambas llaman al mismo handler, que internamente hace un if/else para determinar de dónde vino el `taskId`. Esto bifurca la lógica innecesariamente y la ruta sin parámetro de path es un anti-patrón REST (parece "obtener todos los attachments").

**Solución:** Mantener solo la ruta RESTful `GET /tasks/:taskId/attachments`. Si existe algún cliente que usa la forma con query param, migrar y deprecar.

**Criterio:** Una sola ruta por recurso. El handler no necesita adivinar la fuente del `taskId`.

---

## 🟢 Baja prioridad

### C1. `cookie-parser` instalado y montado pero `req.cookies` nunca se usa

**Archivos:** `src/app.ts:1,27`, `package.json:25`

**Problema:** `cookie-parser` parsea el header `Cookie` y popula `req.cookies`. Sin embargo, en toda la codebase se accede a las cookies como header string raw via `getCookieHeader(req)` (que lee `req.header("cookie")`), nunca via `req.cookies`. El middleware no tiene efecto práctico.

**Solución:** Remover `cookieParser()` de `app.ts` y desinstalar el paquete (`pnpm remove cookie-parser @types/cookie-parser`). Si en el futuro se necesita parsear cookies individualmente, se puede reinstalar.

**Criterio:** Ningún middleware instalado sin uso activo.

---

### C2. Tipos `z.infer` exportados sin consumidores

**Archivos:** `src/modules/auth/interfaces/auth.schemas.ts:14-15`, `src/modules/tasks/interfaces/tasks.schemas.ts:57-61`, `src/modules/codes/interfaces/codes.schemas.ts:21-24`

**Problema:** Varios tipos inferidos de schemas Zod están exportados pero ningún archivo los importa. Son dead exports que incrementan la superficie pública sin valor.

**Solución:** Verificar con un grep de cada nombre de tipo en el proyecto. Eliminar los que no tengan consumidores, o utilizarlos explícitamente en los tipos de los controllers/use cases si aportan claridad.

**Criterio:** Ningún tipo exportado existe sin al menos un consumidor.

---

### C3. `.env.example` incompleto para scripts de smoke/probe

**Archivos:** `.env.example`, `scripts/smoke-task-detail-local.ts:16`, `scripts/probe-auth-task.ts:72`

**Problema:** Los scripts de smoke y probe leen variables de env que no están documentadas en `.env.example` (ej: `DANELLA_USERNAME`, `DANELLA_PASSWORD`, `DANELLA_TEST_SUBPROJECT_ID`, `DANELLA_TEST_TASK_ID`). Un colaborador nuevo que quiera correr los scripts no sabe qué variables hace falta setear.

**Solución:** Agregar al final de `.env.example` una sección `# Dev / smoke scripts` con placeholders para esas variables.

**Criterio:** Cualquier variable leída por un script del proyecto tiene un placeholder en `.env.example`.

---

### C4. Documentación desincronizada: findings y CLEANUP_TODO referenciaban el logout bug ya corregido

**Archivos:** `findings/logout-bug-analysis.md` (si existe), referencias en `findings/discovery-log.md`

**Problema:** El bug de logout fue corregido pero los findings o docs que lo describían como pendiente pueden quedar como referencia engañosa de un estado que ya no existe.

**Solución:** Agregar una nota de cierre en los findings relevantes indicando fecha de resolución y el commit/PR donde se corrigió.

**Criterio:** Los findings de bugs resueltos tienen un registro de cierre, no quedan abiertos indefinidamente.

---

### C5. Sin suite de tests automatizada

**Archivos:** `package.json:17`, `tests/unit/.gitkeep`, `tests/integration/.gitkeep`

**Problema:** `npm test` solo imprime un placeholder. No hay ningún test unitario ni de integración. El único gate de calidad es `tsc --noEmit`. Los use cases con lógica de validación son buenos candidatos para tests unitarios sin dependencias externas; los clientes Danella son buenos candidatos para tests de integración con mocks de Axios.

**Solución sugerida:**

1. Instalar `vitest` (compatible con ESM/NodeNext sin config extra).
2. Escribir tests unitarios para use cases (`LoginUseCase`, `ListTasksUseCase`, etc.) mockeando el repository.
3. Escribir tests de integración para los clientes Danella con `axios-mock-adapter`.

**Criterio:** Al menos un test por use case que cubra el happy path y el caso de error principal.

---

## Completados en este proyecto

| Item                                   | Estado                                   |
| -------------------------------------- | ---------------------------------------- |
| Logout bug (`loggedOut: true` siempre) | ✅ Corregido en `danella-auth.client.ts` |
| Barrel export consistency              | ✅ Aplicado                              |
| `express-rate-limit` removal           | ✅ Eliminado                             |
| `package-lock.json` removal            | ✅ Eliminado                             |
