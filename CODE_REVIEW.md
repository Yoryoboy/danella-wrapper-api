# Code Review — `danella-wrapper-api`

**Fecha:** Marzo 3, 2026  
**Estado:** Análisis Completo  
**Compilación:** ✅ Sin errores TypeScript

---

## ✅ Fortalezas

### 1. Arquitectura Modular (Clean Architecture)
La estructura `domain → application → infrastructure → interfaces` por módulo es **excelente**:
- `domain/` es puro TypeScript sin dependencias de framework
- `application/` contiene use cases que dependen solo de contratos del dominio
- `infrastructure/` implementa los contratos contra Danella-X
- `interfaces/` maneja HTTP (Express)

**Impacto:** Código mantenible, testeable y escalable.

### 2. Inversión de Dependencias
Los use cases reciben interfaces (`AuthRepository`, `TaskRepository`, `CodeRepository`), no implementaciones concretas.

**Impacto:** Facilita testing futuro y cambios de implementación sin afectar la lógica.

### 3. Error Handling Consistente
- `AppError` como base con errores específicos (`InvalidCredentialsError`, `AuthFlowError`, `UpstreamUnavailableError`)
- Error middleware centralizado que maneja `AppError`, `ZodError`, y errores desconocidos
- Formato de error consistente: `{ success: false, error: { code, message, details } }`

**Impacto:** Debugging más fácil, respuestas predecibles.

### 4. Validación con Zod
Schemas de validación en la capa `interfaces/` con tipado automático.

**Impacto:** Validación en tiempo de compilación y runtime.

### 5. TypeScript Strict
`strict: true` en `tsconfig.json`. Compila sin errores.

**Impacto:** Menos bugs en producción.

### 6. Configuración de Entorno Robusta
`env.ts` con helpers `toNumber`, `toList`, `toNonEmpty` y defaults sensatos.

**Impacto:** Configuración flexible y segura.

### 7. Logger Estructurado
JSON logging con timestamps. Simple pero efectivo.

**Impacto:** Logs parseables para análisis.

### 8. Login Robusto
`danella-auth.client.ts` maneja correctamente:
- Extracción del anti-CSRF token
- Merge de cookies iniciales + cookies del login
- Validación de sesión vía redirect detection + HTML heuristics

**Impacto:** Autenticación confiable.

### 9. Scripts de Smoke Test
Buenos para validación manual durante desarrollo.

**Impacto:** Verificación rápida de cambios.

---

## ⚠️ Problemas Críticos

### **CRÍTICO #1: Código Duplicado (DRY Violation)**

#### Problema 1.1 — `getCookieHeader()` copiado 3 veces

**Ubicaciones:**
- `@src/modules/auth/interfaces/auth.controller.ts:14-31`
- `@src/modules/tasks/interfaces/tasks.controller.ts:18-30`
- `@src/modules/codes/interfaces/codes.controller.ts:25-37`

La versión del `AuthController` tiene lógica extra (parsear `cookieAuthBodySchema` del body) pero las de Tasks y Codes son idénticas.

**Solución:**
```typescript
// shared/interfaces/http/get-cookie-header.ts
export const getCookieHeader = (req: Request): string | null => {
  const customHeader = req.header("x-danella-cookie");
  if (typeof customHeader === "string" && customHeader.trim().length > 0) {
    return customHeader.trim();
  }

  const standardCookieHeader = req.header("cookie");
  if (typeof standardCookieHeader === "string" && standardCookieHeader.trim().length > 0) {
    return standardCookieHeader.trim();
  }

  return null;
};
```

**Impacto:** Reducir ~50 líneas de código duplicado.

---

#### Problema 1.2 — `toAbsoluteUrl()` copiado 3 veces

**Ubicaciones:**
- `@src/modules/auth/infrastructure/danella-auth.client.ts:45-51`
- `@src/modules/tasks/infrastructure/danella-task.client.ts:16-22`
- `@src/modules/codes/infrastructure/danella-code.client.ts:17-23`

Función idéntica en los 3 clientes.

**Solución:** Mover a `shared/infrastructure/url.utils.ts`

**Impacto:** Reducir ~20 líneas.

---

#### Problema 1.3 — `isLoginHtml()` copiado 3 veces

**Ubicaciones:**
- `@src/modules/auth/infrastructure/danella-auth.client.ts:65-72`
- `@src/modules/tasks/infrastructure/danella-task.client.ts:24-31`
- `@src/modules/codes/infrastructure/danella-code.client.ts:25-32`

**Solución:** Mover a `shared/infrastructure/html.utils.ts`

**Impacto:** Reducir ~20 líneas.

---

#### Problema 1.4 — `extractConstArray()` copiado 2 veces

**Ubicaciones:**
- `@src/modules/tasks/infrastructure/danella-task.client.ts:50-65`
- `@src/modules/codes/infrastructure/danella-code.client.ts:34-49`

**Solución:** Mover a `shared/infrastructure/html.utils.ts`

**Impacto:** Reducir ~30 líneas.

---

#### Problema 1.5 — Patrón de error handling duplicado en ~10 lugares

Todos los métodos de los 3 clientes tienen exactamente el mismo patrón:

```typescript
} catch (error) {
  if (error instanceof AppError) throw error;
  if (error instanceof AxiosError) throw new AppError(503, ...);
  throw new AppError(503, ...);
}
```

**Solución:**
```typescript
// shared/infrastructure/error-handler.ts
export const wrapUpstreamError = (
  error: unknown,
  context: { endpoint: string; defaultStatus?: number }
): AppError => {
  if (error instanceof AppError) throw error;
  if (error instanceof AxiosError) {
    return new AppError(
      context.defaultStatus ?? 503,
      "UPSTREAM_UNAVAILABLE",
      `Could not reach ${context.endpoint}: ${error.code ?? error.message}`
    );
  }
  return new AppError(
    context.defaultStatus ?? 503,
    "UPSTREAM_UNAVAILABLE",
    `Unknown error while calling ${context.endpoint}`
  );
};
```

**Impacto:** Reducir ~60 líneas de código boilerplate.

---

#### Problema 1.6 — Patrón de detección de redirect-to-login duplicado en ~7 lugares

```typescript
const redirectedToLogin =
  response.status >= 300 &&
  response.status < 400 &&
  typeof response.headers.location === "string" &&
  response.headers.location.toLowerCase().includes("/home/login");
```

**Solución:**
```typescript
// shared/infrastructure/response.utils.ts
export const isRedirectedToLogin = (response: AxiosResponse): boolean => {
  return (
    response.status >= 300 &&
    response.status < 400 &&
    typeof response.headers.location === "string" &&
    response.headers.location.toLowerCase().includes("/home/login")
  );
};
```

**Impacto:** Reducir ~40 líneas, mejorar legibilidad.

---

### **CRÍTICO #2: Inconsistencias de Diseño**

#### Problema 2.1 — `AxiosInstance` se crea 3 veces

Cada client (`DanellaAuthClient`, `DanellaTaskClient`, `DanellaCodeClient`) crea su propio `axios.create()`.

**Problema:**
- Duplicación de configuración
- Imposible agregar interceptores globales (logging, retries)
- Timeout configurado en 3 lugares

**Solución:**
```typescript
// shared/infrastructure/danella-http.client.ts
export const createDanellaHttpClient = (): AxiosInstance => {
  return axios.create({
    baseURL: env.danella.baseUrl,
    timeout: env.danella.timeoutMs,
  });
};

// En cada client:
export class DanellaAuthClient implements AuthRepository {
  private readonly http: AxiosInstance;

  constructor(http?: AxiosInstance) {
    this.http = http ?? createDanellaHttpClient();
  }
  // ...
}
```

**Impacto:** Centralizar configuración, facilitar testing con mock.

---

#### Problema 2.2 — Signatures de use cases inconsistentes

Algunos reciben un input object, otros parámetros sueltos:

**Inconsistente:**
```typescript
// Object (correcto):
loginUseCase.execute(credentials: LoginCredentials)
addCodeToTaskUseCase.execute(input: AddCodeToTaskUseCaseInput)
listTasksUseCase.execute(input: ListTasksInput)

// Parámetros sueltos (inconsistente):
getTaskDeploymentUseCase.execute(taskId: number, cookieHeader: string)
getAvailableCodesUseCase.execute(taskId: number, cookieHeader: string)
deleteCodeFromTaskUseCase.execute(taskProjectCodeId: number, cookieHeader: string)
```

**Solución:** Todos con input object:
```typescript
export class GetTaskDeploymentUseCase {
  async execute(input: GetTaskDeploymentInput): Promise<GetTaskDeploymentResult> {
    // ...
  }
}
```

**Impacto:** Consistencia, escalabilidad, menos errores de parámetros.

---

#### Problema 2.3 — `taskIdQuerySchema` duplicado

**Ubicaciones:**
- `@src/modules/tasks/interfaces/tasks.schemas.ts:24-26`
- `@src/modules/codes/interfaces/codes.schemas.ts:3-5`

**Solución:** Mover a `shared/interfaces/schemas/common.schemas.ts`

**Impacto:** Reducir duplicación, facilitar reutilización.

---

### **CRÍTICO #3: Tipado Débil del Dominio**

#### Problema 3.1 — Tipos genéricos sin estructura

```typescript
export interface UpstreamTask {
  [key: string]: unknown;
}

export interface AvailableCode {
  [key: string]: unknown;
}

export interface CodeDetail {
  [key: string]: unknown;
}

export interface TaskAttachment {
  [key: string]: unknown;
}
```

Estos son esencialmente `Record<string, unknown>`. Ya conoces la estructura de los datos upstream.

**Solución:** Tipar fuerte basado en la estructura real:

```typescript
export interface UpstreamTask {
  taskID: number;
  taskCode: string;
  jobID: string;
  taskStatusName: string;
  endCustomerName: string;
  vendorName: string;
  customerName: string;
  // ... resto de campos
}
```

**Impacto:** Type safety, autocompletar en IDEs, documentación implícita.

---

## 🟡 Problemas Menores

### Problema 4.1 — `.env.example` está en `.gitignore`

```
@.gitignore:4
```

`.env.example` **no debería** estar ignorado — es un archivo de referencia que otros desarrolladores necesitan.

**Solución:** Remover `.env.example` de `.gitignore` (ya hecho ✅)

---

### Problema 4.2 — `codes/index.ts` se usa diferente al resto

```typescript
// src/modules/codes/index.ts
export * as codesApplication from "./application";
export * as codesDomain from "./domain";
export * as codesInfrastructure from "./infrastructure";
export * as codesInterfaces from "./interfaces";
```

Este barrel export con namespaces no se usa en ningún lado. Los otros módulos (`auth`, `tasks`) no tienen este patrón.

**Solución:** Eliminar o aplicar consistentemente a todos los módulos.

**Impacto:** Código muerto, inconsistencia.

---

### Problema 4.3 — Tipos inferred sin uso

```typescript
// auth.schemas.ts
export type LoginBody = z.infer<typeof loginBodySchema>;
export type CookieAuthBody = z.infer<typeof cookieAuthBodySchema>;

// tasks.schemas.ts
export type TaskIdParams = z.infer<typeof taskIdParamsSchema>;
export type TaskIdQuery = z.infer<typeof taskIdQuerySchema>;

// codes.schemas.ts
export type PortfolioIdQuery = z.infer<typeof portfolioIdQuerySchema>;
// ... etc
```

Estos tipos exportados no se importan en ningún lado.

**Solución:** Eliminar o documentar si se usan desde clientes externos.

**Impacto:** Código muerto.

---

### Problema 4.4 — Dependencias sin usar

`express-rate-limit` está en `package.json` pero no se usa en ningún lado.

**Solución:** Remover o implementar rate limiting.

**Impacto:** Dependencia muerta.

---

### Problema 4.5 — `API_PREFIX` no usa `env.apiVersion`

```typescript
// config/constants.ts
export const API_PREFIX = "/api/v1";

// config/env.ts
apiVersion: process.env.API_VERSION ?? "v1",
```

`env.apiVersion` existe pero no se usa para construir el prefix dinámicamente.

**Solución:**
```typescript
// config/constants.ts
export const API_PREFIX = `/api/${env.apiVersion}`;
```

**Impacto:** Configuración más flexible.

---

### Problema 4.6 — Doble lockfile

Tanto `package-lock.json` (npm) como `pnpm-lock.yaml` (pnpm) existen.

**Solución:** Eliminar `package-lock.json` (usas pnpm).

**Impacto:** Evitar confusión, consistencia.

---

### Problema 4.7 — Credenciales en `.env`

```
@.env:2-3
DANELLA_USERNAME=jdiaz
DANELLA_PASSWORD=nomaianomaly
```

Está bien que `.env` está en `.gitignore`, pero estos valores no se usan en la app (solo en scripts). Deberían documentarse en `.env.example`.

**Solución:** Agregar a `.env.example`:
```
# Para scripts de prueba
DANELLA_USERNAME=
DANELLA_PASSWORD=
DANELLA_TEST_SUBPROJECT_ID=45
```

---

## 📊 Resumen de Impacto

| Problema | Severidad | Líneas a Reducir | Esfuerzo |
|---|---|---|---|
| Código duplicado (6 funciones) | 🔴 Crítico | ~200 | 2-3 horas |
| Inconsistencias de diseño | 🔴 Crítico | ~50 | 1-2 horas |
| Tipado débil del dominio | 🟠 Alto | 0 | 2-3 horas |
| Código muerto (tipos, índices) | 🟡 Menor | ~20 | 30 min |
| Configuración inconsistente | 🟡 Menor | 0 | 30 min |

**Total estimado:** ~7-9 horas para resolver todo.

---

## 🎯 Plan de Refactoring Recomendado

### Fase 1: Utilidades Compartidas (2-3 horas)
1. Crear `shared/infrastructure/url.utils.ts` → `toAbsoluteUrl`
2. Crear `shared/infrastructure/html.utils.ts` → `isLoginHtml`, `extractConstArray`
3. Crear `shared/infrastructure/response.utils.ts` → `isRedirectedToLogin`
4. Crear `shared/infrastructure/error-handler.ts` → `wrapUpstreamError`
5. Crear `shared/interfaces/http/get-cookie-header.ts` → `getCookieHeader`
6. Crear `shared/infrastructure/danella-http.client.ts` → `createDanellaHttpClient`

### Fase 2: Consolidación de Schemas (30 min)
1. Crear `shared/interfaces/schemas/common.schemas.ts`
2. Mover `taskIdQuerySchema`, `portfolioIdQuerySchema`
3. Actualizar imports en módulos

### Fase 3: Unificación de Use Cases (1-2 horas)
1. Actualizar `GetTaskDeploymentUseCase` → recibir `GetTaskDeploymentInput`
2. Actualizar `GetAvailableCodesUseCase` → recibir `GetAvailableCodesInput`
3. Actualizar `DeleteCodeFromTaskUseCase` → recibir `DeleteCodeFromTaskInput`
4. Actualizar controllers correspondientes

### Fase 4: Tipado Fuerte del Dominio (2-3 horas)
1. Definir interfaces reales para `UpstreamTask`, `AvailableCode`, etc.
2. Actualizar parsers y validaciones
3. Actualizar tests de smoke

### Fase 5: Limpieza (30 min)
1. Eliminar `codes/index.ts` o aplicar a todos
2. Eliminar tipos inferred sin uso
3. Remover `express-rate-limit` o implementar
4. Actualizar `.env.example`
5. Eliminar `package-lock.json`

---

## ✨ Conclusión

**Estado Actual:** Buena arquitectura base, pero con deuda técnica por duplicación.

**Prioridad:** Resolver Fase 1 (utilidades compartidas) antes de agregar nuevas features.

**Beneficio:** Reducir ~200 líneas, mejorar mantenibilidad, facilitar testing.

