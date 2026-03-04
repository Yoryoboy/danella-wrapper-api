# Remaining Cleanup TODO

This file tracks minor cleanup items intentionally deferred after the critical/high refactor pass completed on 2026-03-03.

## 1. Barrel Export Consistency ✅ DONE

- ✅ Applied namespace barrel pattern to `auth` and `tasks` modules
- ✅ Removed `src/modules/codes/index.ts` (was dead code)
- ✅ All three modules now have consistent barrel exports
- Acceptance criteria:
  - ✅ No dead/unused module barrel pattern remains.
  - ✅ Imports are consistent and intentional.

## 2. Remove or Use Unused `z.infer` Types

- Review unused inferred schema types in:
  - [src/modules/auth/interfaces/auth.schemas.ts](src/modules/auth/interfaces/auth.schemas.ts)
  - [src/modules/tasks/interfaces/tasks.schemas.ts](src/modules/tasks/interfaces/tasks.schemas.ts)
  - [src/modules/codes/interfaces/codes.schemas.ts](src/modules/codes/interfaces/codes.schemas.ts)
- Remove exports that are not consumed, or wire them into actual usage.
- Acceptance criteria:
  - No unused inferred type exports remain.
  - Type exports that remain are actively consumed.

## 3. `express-rate-limit` Dependency Decision ✅ DONE

- ✅ Removed `express-rate-limit` from [package.json](package.json)
- ✅ Can be re-added when needed in the future
- Acceptance criteria:
  - ✅ No unused runtime dependency.
  - ✅ If implemented in future, behavior will be documented in README.

## 4. API Prefix / Version Source of Truth

- Align [src/config/constants.ts](src/config/constants.ts) with [src/config/env.ts](src/config/env.ts):
  - Option A: Build prefix from `env.apiVersion` (`/api/${env.apiVersion}`)
  - Option B: Keep static prefix and remove unused env version variable.
- Acceptance criteria:
  - Single source of truth for API version prefixing.
  - Health response/version docs remain accurate.

## 5. Lockfile Policy ✅ DONE

- ✅ Removed `package-lock.json` (npm lockfile)
- ✅ Keeping `pnpm-lock.yaml` as canonical
- Acceptance criteria:
  - ✅ One lockfile in repo.
  - ✅ README/setup commands align with pnpm as package manager.

## 6. `.env.example` Script Variables

- Add script-related placeholders to [.env.example](.env.example):
  - `DANELLA_USERNAME=`
  - `DANELLA_PASSWORD=`
  - `DANELLA_TEST_SUBPROJECT_ID=45`
  - `DANELLA_TEST_TASK_ID=6342` (optional but recommended)
- Acceptance criteria:
  - Smoke/probe script prerequisites are documented.
  - No secrets included.

## 7. Documentation Sync After Cleanup Pass

- Update:
  - [README.md](README.md) if setup/runtime behavior changes.
  - [findings/discovery-log.md](findings/discovery-log.md) with cleanup validation summary.
- Acceptance criteria:
  - Repo docs reflect cleanup outcomes in the same change set.
