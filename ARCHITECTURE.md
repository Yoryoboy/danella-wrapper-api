# Danella-X API Wrapper - Arquitectura

## 📋 Resumen Ejecutivo

API REST desarrollada en TypeScript/Express que actúa como wrapper e intérprete de la aplicación web Danella-X. Permite a múltiples usuarios autenticarse con sus propias credenciales mediante **cookie forwarding** y realizar operaciones sobre tareas mediante endpoints JSON limpios, mientras internamente maneja el scraping y parsing de HTML/JavaScript embebido.

> **Enfoque Simplificado:** Esta API utiliza un modelo de autenticación directo donde las cookies de sesión de Danella-X se reenvían entre el cliente y el servidor, eliminando la necesidad de JWT y reduciendo la complejidad.

---

## 🎯 Objetivos

1. **Abstraer la complejidad** del sistema legacy de Danella-X (SSR con datos embebidos en JavaScript)
2. **Proporcionar una API REST moderna** con endpoints JSON para operaciones CRUD de tareas
3. **Simplificar la autenticación** mediante cookie forwarding directo
4. **Mejorar el rendimiento** mediante caché inteligente
5. **Facilitar integraciones** desde frontends modernos con mínima complejidad

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Cliente)                      │
│                   (React/Vue/Next.js)                        │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/JSON
                            │ Cookies (forwarded)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Wrapper (Express)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Service │  │ Cookie Fwd   │  │ Cache Layer  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Task Service │  │ Scraper Svc  │  │ Parser Svc   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/Cookies (forwarded)
                            │ HTML Scraping
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Danella-X (Sistema Legacy)                  │
│              https://danella-x.com                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Sistema de Autenticación (Simplificado)

### **Flujo de Autenticación con Cookie Forwarding**

**Enfoque:** Las cookies de sesión de Danella-X se reenvían directamente entre el cliente y la API, eliminando la necesidad de JWT y gestión compleja de sesiones.

#### **Flujo Completo:**

1. **Cliente → API:** `POST /api/auth/login`

   ```json
   { "username": "jdiaz", "password": "***" }
   ```

2. **API → Danella-X:** Login con credenciales
   - Obtiene página de login para extraer `__RequestVerificationToken`
   - Envía POST con credenciales + token anti-CSRF

3. **Danella-X → API:** Responde con cookies de sesión

   ```
   Set-Cookie: .AspNetCore.Session=...
   Set-Cookie: .AspNetCore.Antiforgery=...
   Set-Cookie: ARRAffinity=...
   ```

4. **API → Cliente:** Devuelve las cookies

   ```json
   {
     "success": true,
     "cookies": {
       ".AspNetCore.Session": "...",
       ".AspNetCore.Antiforgery": "...",
       "ARRAffinity": "...",
       "ARRAffinitySameSite": "..."
     },
     "user": {
       "username": "jdiaz",
       "role": "Manager"
     }
   }
   ```

5. **Cliente guarda cookies** (localStorage/sessionStorage)

6. **Peticiones subsiguientes:** Cliente envía cookies en header `Cookie`

   ```
   Cookie: .AspNetCore.Session=...; .AspNetCore.Antiforgery=...
   ```

7. **API reenvía cookies** a Danella-X en cada operación

### **Estructura de Cookies**

```typescript
interface DanellaCookies {
  ".AspNetCore.Session": string; // Cookie de sesión principal
  ".AspNetCore.Antiforgery": string; // Token anti-CSRF
  ARRAffinity: string; // Balanceo de carga
  ARRAffinitySameSite: string; // Balanceo de carga
}
```

### **Ventajas de este Enfoque**

✅ **Simplicidad:** Sin JWT, sin gestión de tokens, sin encriptación compleja
✅ **Menos código:** Eliminamos toda la capa de JWT y session manager
✅ **Directo:** Las cookies son la autenticación real, no hay abstracción extra
✅ **Desarrollo rápido:** Menos componentes = desarrollo más ágil

### **Consideraciones de Seguridad**

⚠️ **HTTPS en producción:** Obligatorio para proteger cookies en tránsito
⚠️ **CORS restrictivo:** Solo dominios permitidos pueden acceder
⚠️ **Rate limiting:** Protección contra abuso
⚠️ **Validación de cookies:** Verificar formato antes de reenviar

---

## 📁 Estructura del Proyecto

```
danella-x-api/
├── src/
│   ├── config/
│   │   ├── env.ts                 # Variables de entorno
│   │   └── constants.ts           # Constantes de la aplicación
│   │
│   ├── middleware/
│   │   ├── cookies.middleware.ts  # Validación y forwarding de cookies
│   │   ├── error.middleware.ts    # Manejo global de errores
│   │   ├── rateLimit.middleware.ts # Rate limiting
│   │   └── logger.middleware.ts   # Logging de requests
│   │
│   ├── services/
│   │   ├── auth/
│   │   │   └── auth.service.ts    # Lógica de autenticación (login a Danella-X)
│   │   │
│   │   ├── danella/
│   │   │   ├── danella.client.ts  # Cliente HTTP para Danella-X
│   │   │   ├── scraper.service.ts # Scraping de HTML
│   │   │   └── parser.service.ts  # Parsing de datos embebidos
│   │   │
│   │   ├── cache/
│   │   │   └── cache.service.ts   # Sistema de caché
│   │   │
│   │   └── tasks/
│   │       └── task.service.ts    # Lógica de negocio de tareas
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts     # Endpoints de autenticación
│   │   └── task.controller.ts     # Endpoints de tareas
│   │
│   ├── models/
│   │   ├── task.model.ts          # Modelo de tarea normalizado
│   │   ├── cookies.model.ts       # Modelo de cookies de Danella-X
│   │   └── response.model.ts      # Modelos de respuesta API
│   │
│   ├── routes/
│   │   ├── auth.routes.ts         # Rutas de autenticación
│   │   ├── task.routes.ts         # Rutas de tareas
│   │   └── index.ts               # Agregador de rutas
│   │
│   ├── utils/
│   │   ├── logger.util.ts         # Sistema de logs
│   │   └── validator.util.ts      # Validaciones
│   │
│   ├── types/
│   │   └── index.ts               # Tipos TypeScript globales
│   │
│   ├── app.ts                     # Configuración de Express
│   └── server.ts                  # Punto de entrada
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔄 Gestión de Cookies

### **Cookie Forwarding Service**

```typescript
class CookieForwardingService {
  /**
   * Extrae cookies del header de la petición del cliente
   */
  extractCookies(req: Request): DanellaCookies | null {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;

    // Parse y valida cookies
    return this.parseCookies(cookieHeader);
  }

  /**
   * Formatea cookies para enviar a Danella-X
   */
  formatCookiesForDanella(cookies: DanellaCookies): string {
    return Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join("; ");
  }

  /**
   * Valida que las cookies tengan el formato correcto
   */
  validateCookies(cookies: DanellaCookies): boolean {
    const required = [".AspNetCore.Session", ".AspNetCore.Antiforgery"];
    return required.every((key) => cookies[key] && cookies[key].length > 0);
  }
}
```

### **Flujo de Cookie Forwarding**

1. **Cliente envía petición** con cookies en header
2. **Middleware extrae y valida** cookies
3. **API reenvía cookies** a Danella-X en cada operación
4. **No hay gestión de sesión** en el servidor (stateless)

---

## 💾 Sistema de Caché

### **Estrategia de Caché Multi-Nivel**

```typescript
interface CacheConfig {
  tasks: {
    ttl: 2 * 60 * 1000,        // 2 minutos
    invalidateOn: ['create', 'update', 'delete', 'statusChange']
  },
  subprojects: {
    ttl: 10 * 60 * 1000,       // 10 minutos
    invalidateOn: ['create', 'update', 'delete']
  }
}
```

### **Implementación**

- **Caché en memoria** usando `node-cache` o similar
- **Cache key pattern:** `{userId}:{resource}:{id}`
- **Invalidación inteligente:** Al modificar una tarea, invalida el caché de la lista
- **Cache warming:** Pre-cargar datos frecuentes al login

---

## 🌐 Endpoints de la API

### **Autenticación**

```typescript
POST /api/auth/login
Body: { username: string, password: string }
Response: {
  success: boolean,
  cookies: DanellaCookies,
  user: { username: string, role: string }
}

POST /api/auth/logout
Headers: Cookie: <danella-cookies>
Response: { success: boolean }

GET /api/auth/validate
Headers: Cookie: <danella-cookies>
Response: { valid: boolean, user: UserInfo }
```

### **Tareas**

```typescript
// Listar tareas de un subproyecto
GET /api/tasks?subProjectId={id}&page={n}&limit={n}&status={status}
Headers: Cookie: <danella-cookies>
Response: {
  tasks: Task[],
  pagination: { page, limit, total, totalPages },
  cached: boolean
}

// Obtener una tarea específica
GET /api/tasks/{taskId}
Headers: Cookie: <danella-cookies>
Response: { task: Task }

// Crear tarea
POST /api/tasks
Headers: Cookie: <danella-cookies>
Body: {
  jobID: string,
  subProjectID: number,
  // ... otros campos
}
Response: { task: Task, success: boolean }

// Actualizar tarea
PUT /api/tasks/{taskId}
Headers: Cookie: <danella-cookies>
Body: { /* campos a actualizar */ }
Response: { task: Task, success: boolean }

// Eliminar tarea
DELETE /api/tasks/{taskId}
Headers: Cookie: <danella-cookies>
Response: { success: boolean, message: string }

// Cambiar estado de tarea
PATCH /api/tasks/{taskId}/status
Headers: Cookie: <danella-cookies>
Body: { action: 'in_progress' | 'on_hold' | 'cancelled' | 'completed' }
Response: { task: Task, success: boolean }

// Asignar vendor
PATCH /api/tasks/{taskId}/assign
Headers: Cookie: <danella-cookies>
Body: { vendorId: number }
Response: { task: Task, success: boolean }

// Asignación masiva
POST /api/tasks/bulk-assign
Headers: Cookie: <danella-cookies>
Body: { taskIds: number[], vendorId: number }
Response: { success: boolean, updated: number }
```

---

## 📊 Modelo de Datos Normalizado

### **Task Model (Limpio y Normalizado)**

```typescript
interface Task {
  // Identificadores
  id: number; // taskID
  code: string; // taskCode (ej: "SYS-008739")
  jobId: string; // jobID
  verifierKeyId: string; // verifierKeyID (UUID)

  // Proyecto
  subProjectId: number;
  subProjectName: string;
  projectId: number;
  projectName: string;
  projectType: string; // "High Split", etc.

  // Cliente
  customerId: number;
  customerName: string;
  endCustomerName: string;
  legalEntityName: string;

  // Fechas
  creationDate: Date;
  startDate: Date | null;
  estimatedClosingDate: Date | null;
  endDate: Date | null;

  // Estado y asignaciones
  status: {
    id: number;
    name: string; // "Backlog (To Do)", "In Progress", etc.
  };
  supervisor: {
    id: number;
    name: string;
  } | null;
  designer: {
    id: number;
    name: string;
  } | null;
  qualityControl: {
    id: number;
    name: string;
  } | null;
  vendor: {
    id: number;
    name: string;
  } | null;

  // Financiero
  forecastRevenue: number;
  forecastCost: number;
  amount: number | null;
  internalCost: number | null;
  vendorCost: number | null;
  profit: number | null;
  margin: number | null;

  // Metadata
  jobType: string; // "Asbuilt", "Design", etc.
  costCenter: string | null;

  // Timestamps de la API
  fetchedAt: Date; // Cuándo se obtuvo de Danella-X
  cached: boolean; // Si viene del caché
}
```

---

## 🛡️ Manejo de Errores

### **Jerarquía de Errores**

```typescript
class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
}

class AuthenticationError extends ApiError {
  constructor(message = "Authentication failed") {
    super(message);
    this.statusCode = 401;
  }
}

class DanellaError extends ApiError {
  constructor(message: string, originalError?: Error) {
    super(message);
    this.statusCode = 502; // Bad Gateway
    this.originalError = originalError;
  }
}

class ValidationError extends ApiError {
  constructor(message: string, fields?: string[]) {
    super(message);
    this.statusCode = 400;
    this.fields = fields;
  }
}
```

### **Formato de Respuesta de Error**

```typescript
{
  success: false,
  error: {
    code: 'DANELLA_CONNECTION_ERROR',
    message: 'Failed to connect to Danella-X',
    details?: any,
    timestamp: '2026-02-25T10:38:00Z',
    requestId: 'uuid-v4'
  }
}
```

### **Estrategia de Retry**

```typescript
interface RetryConfig {
  maxRetries: 3;
  retryDelay: 1000; // ms
  retryableErrors: ["ECONNREFUSED", "ETIMEDOUT", "SESSION_EXPIRED"];
  exponentialBackoff: true;
}
```

---

## 📝 Sistema de Logs

### **Niveles de Log**

- **ERROR:** Errores críticos que requieren atención
- **WARN:** Situaciones anormales pero manejables
- **INFO:** Eventos importantes (login, operaciones exitosas)
- **DEBUG:** Información detallada para debugging

### **Estructura de Log**

```typescript
{
  timestamp: '2026-02-25T10:38:00Z',
  level: 'INFO',
  userId: 'jdiaz',
  requestId: 'uuid-v4',
  action: 'DELETE_TASK',
  resource: 'tasks/6394',
  duration: 234,                 // ms
  success: true,
  metadata: {
    ip: '192.168.1.1',
    userAgent: 'PostmanRuntime/7.x'
  }
}
```

### **Almacenamiento**

- **Desarrollo:** Console + archivo local
- **Producción:** Supabase (tabla de logs) o servicio externo (Logtail, Datadog)

---

## 🔒 Seguridad

### **Medidas de Seguridad**

1. **HTTP/HTTPS por Ambiente**
   - **Desarrollo:** HTTP en localhost (seguro, no hay riesgo)
   - **Producción:** HTTPS obligatorio para proteger cookies
   - Configuración condicional basada en `NODE_ENV`

2. **Rate Limiting**

   ```typescript
   {
     windowMs: 15 * 60 * 1000,   // 15 minutos
     max: 100,                    // 100 requests por ventana
     message: 'Too many requests'
   }
   ```

3. **CORS**
   - Configurado solo para dominios permitidos
   - Credenciales permitidas solo para orígenes específicos

4. **Helmet.js**
   - Headers de seguridad HTTP
   - XSS protection, CSP, etc.

5. **Validación de Input**
   - Validación con `zod` o `joi`
   - Sanitización de inputs

---

## 🚀 Configuración y Variables de Entorno

```env
# Server
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Danella-X
DANELLA_BASE_URL=https://danella-x.com
DANELLA_MAX_RETRIES=3

# Security
REQUIRE_HTTPS=false  # true en producción
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001

# Cache
CACHE_ENABLED=true
CACHE_TTL_TASKS=2m
CACHE_TTL_PROJECTS=10m

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_TO_FILE=true
LOG_FILE_PATH=./logs/api.log

# Supabase (opcional, para logs)
SUPABASE_URL=
SUPABASE_KEY=

# CORS
CORS_ENABLED=true
```

---

## 📈 Métricas y Monitoreo

### **Métricas a Trackear**

```typescript
interface Metrics {
  requests: {
    total: number;
    byEndpoint: Map<string, number>;
    byUser: Map<string, number>;
    errors: number;
  };
  sessions: {
    active: number;
    expired: number;
    relogins: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  performance: {
    avgResponseTime: number;
    p95ResponseTime: number;
    slowestEndpoints: Array<{ endpoint: string; avgTime: number }>;
  };
}
```

### **Endpoint de Health Check**

```typescript
GET /api/health
Response: {
  status: 'healthy' | 'degraded' | 'unhealthy',
  uptime: number,
  timestamp: Date,
  services: {
    danellaX: 'up' | 'down',
    cache: 'up' | 'down',
    sessions: 'up' | 'down'
  },
  metrics: Metrics
}
```

---

## 🧪 Testing

### **Estrategia de Testing**

1. **Unit Tests**
   - Servicios individuales
   - Parsers y scrapers
   - Utilidades

2. **Integration Tests**
   - Flujo completo de autenticación
   - Operaciones CRUD de tareas
   - Gestión de sesiones

3. **E2E Tests**
   - Flujos de usuario completos
   - Testing contra Danella-X real (ambiente de staging)

### **Herramientas**

- **Jest** para unit/integration tests
- **Supertest** para testing de endpoints
- **Postman/Newman** para E2E y documentación

---

## 🔄 Flujo de Operación Típico

### **Ejemplo: Eliminar una Tarea**

```
1. Cliente → API: DELETE /api/tasks/6394
   Headers: Cookie: .AspNetCore.Session=...; .AspNetCore.Antiforgery=...

2. API: Extrae y valida cookies
   ✓ Cookies presentes y válidas
   ✗ Si no hay cookies → Error 401 Unauthorized

3. API: Reenvía petición a Danella-X
   POST https://danella-x.com/Task/DeleteTask?taskID=6394
   Headers: Cookie: [cookies del cliente]

4. Danella-X: Responde
   { success: true, message: "Task deleted" }

5. API: Invalida caché
   - Elimina cache de task específica
   - Invalida cache de lista de tareas

6. API: Registra log
   INFO: Task 6394 deleted

7. API → Cliente: Responde
   {
     success: true,
     message: "Task deleted successfully",
     taskId: 6394
   }
```

---

## 🎯 Próximos Pasos

1. **Fase 1: Setup Inicial** ✅
   - Estructura de proyecto
   - Configuración de TypeScript/Express
   - Sistema de logging básico

2. **Fase 2: Autenticación** 🔄
   - Implementar login a Danella-X
   - Cookie forwarding middleware
   - Validación de cookies

3. **Fase 3: Operaciones de Tareas** ⏳
   - Listar tareas (con scraping/parsing)
   - Crear/Actualizar/Eliminar
   - Cambiar estados

4. **Fase 4: Optimización** ⏳
   - Sistema de caché
   - Rate limiting
   - Retry logic

5. **Fase 5: Testing & Deploy** ⏳
   - Tests unitarios e integración
   - Documentación con Postman
   - Deploy a cloud

---

## 📚 Stack Tecnológico

### **Core**

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Lenguaje:** TypeScript 5+

### **Dependencias Principales**

```json
{
  "express": "^4.18.0",
  "axios": "^1.6.0", // HTTP client
  "cheerio": "^1.0.0-rc.12", // HTML parsing
  "cookie-parser": "^1.4.6", // Cookie parsing
  "node-cache": "^5.1.2", // Caché en memoria
  "helmet": "^7.1.0", // Seguridad HTTP
  "cors": "^2.8.5", // CORS
  "express-rate-limit": "^7.1.0", // Rate limiting
  "winston": "^3.11.0", // Logging
  "zod": "^3.22.0", // Validación
  "dotenv": "^16.3.0" // Variables de entorno
}
```

### **Dev Dependencies**

```json
{
  "typescript": "^5.3.0",
  "@types/express": "^4.17.0",
  "@types/node": "^20.10.0",
  "jest": "^29.7.0",
  "ts-jest": "^29.1.0",
  "supertest": "^6.3.0",
  "nodemon": "^3.0.0",
  "ts-node": "^10.9.0"
}
```

---

## 🌐 Configuración HTTP/HTTPS por Ambiente

### **Desarrollo Local (HTTP)**

Durante el desarrollo local, **HTTP está perfectamente bien** y es el enfoque recomendado:

```typescript
// config/env.ts
export const config = {
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",

  server: {
    port: process.env.PORT || 3000,
    // Desarrollo: http://localhost:3000
    // Producción: https://tu-api.com
    baseUrl:
      process.env.NODE_ENV === "production"
        ? process.env.API_BASE_URL
        : `http://localhost:${process.env.PORT || 3000}`,
  },

  security: {
    // Solo forzar HTTPS en producción
    requireHttps: process.env.NODE_ENV === "production",

    // Configuración de cookies
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Solo HTTPS en prod
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    },
  },
};
```

### **Middleware de Seguridad Condicional**

```typescript
// middleware/security.middleware.ts
import { Request, Response, NextFunction } from "express";
import { config } from "../config/env";

export const enforceHttps = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Solo en producción
  if (config.security.requireHttps && !req.secure) {
    return res.status(403).json({
      success: false,
      error: {
        code: "HTTPS_REQUIRED",
        message: "HTTPS is required in production environment",
      },
    });
  }
  next();
};

export const configureCors = () => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

  return {
    origin: (origin: string | undefined, callback: Function) => {
      // En desarrollo, permitir requests sin origin (Postman, etc.)
      if (config.isDevelopment && !origin) {
        return callback(null, true);
      }

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Permitir cookies
  };
};
```

### **Flujo por Ambiente**

#### **Desarrollo (localhost)**

```
Cliente (Postman/Frontend local)
  ↓ http://localhost:3000 ✅ HTTP OK
API (Express local)
  ↓ https://danella-x.com ✅ HTTPS (Danella-X siempre)
Danella-X
```

**Características:**

- ✅ HTTP en localhost es seguro (no sale de tu máquina)
- ✅ Cookies funcionan perfectamente
- ✅ No necesitas certificados SSL
- ✅ Desarrollo rápido sin fricción

#### **Producción (cloud)**

```
Cliente (Frontend en Vercel/Netlify)
  ↓ https://tu-frontend.com ✅ HTTPS obligatorio
API (Cloud con SSL)
  ↓ https://danella-x.com ✅ HTTPS
Danella-X
```

**Características:**

- ✅ HTTPS obligatorio (middleware lo valida)
- ✅ Certificados SSL gratuitos (Vercel, Railway, Render, etc.)
- ✅ Cookies seguras con flag `secure: true`
- ✅ CORS restrictivo a dominios específicos

### **Configuración de Express**

```typescript
// app.ts
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config/env";
import { enforceHttps, configureCors } from "./middleware/security.middleware";

const app = express();

// Seguridad básica
app.use(helmet());

// CORS configurado por ambiente
app.use(cors(configureCors()));

// Cookie parser
app.use(cookieParser());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Forzar HTTPS en producción (antes de las rutas)
if (config.isProduction) {
  app.use(enforceHttps);
}

// Rutas
app.use("/api", routes);

export default app;
```

### **Testing con Postman**

Durante desarrollo, puedes probar fácilmente con Postman:

1. **Login:**

   ```
   POST http://localhost:3000/api/auth/login
   Body: { "username": "jdiaz", "password": "***" }
   ```

2. **Guardar cookies de la respuesta**

3. **Usar cookies en requests subsiguientes:**
   ```
   GET http://localhost:3000/api/tasks?subProjectId=15
   Headers:
     Cookie: .AspNetCore.Session=...; .AspNetCore.Antiforgery=...
   ```

### **Deploy a Producción**

Cuando estés listo para producción, simplemente:

1. **Deploy a un servicio con SSL automático:**
   - Railway: SSL gratis automático
   - Render: SSL gratis automático
   - Vercel: SSL gratis automático
   - Fly.io: SSL gratis automático

2. **Configurar variables de entorno:**

   ```env
   NODE_ENV=production
   REQUIRE_HTTPS=true
   ALLOWED_ORIGINS=https://tu-frontend.com
   ```

3. **¡Listo!** El middleware automáticamente:
   - Forzará HTTPS
   - Configurará cookies seguras
   - Aplicará CORS restrictivo

---

## 🤝 Contribución y Mantenimiento

### **Convenciones de Código**

- **ESLint + Prettier** para formateo consistente
- **Conventional Commits** para mensajes de commit
- **Branching:** `main`, `develop`, `feature/*`, `fix/*`

### **Documentación**

- JSDoc para funciones públicas
- README actualizado con ejemplos
- Postman collection para endpoints
- Swagger/OpenAPI (opcional)

---

## 📞 Contacto y Soporte

- **Desarrollador Principal:** [Tu nombre]
- **Repositorio:** [GitHub URL]
- **Documentación:** [Docs URL]

---

**Última actualización:** 2026-02-25
**Versión:** 1.0.0
