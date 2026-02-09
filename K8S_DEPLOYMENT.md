# Kubernetes Deployment for Pyramid

## Context

The Pyramid tennis ranking app is currently deployed on Vercel with Neon (serverless PostgreSQL) and Resend (transactional email). Goal: make it deployable to an existing K8s cluster with a standard PostgreSQL instance.

## Current State

- **Frontend**: Next.js 14.2.4 (App Router), React 18, TypeScript, Tailwind CSS
- **Database**: Neon via `@neondatabase/serverless` (HTTP/WebSocket protocol)
- **Auth**: Magic link passwordless auth with database-backed sessions
- **Email**: Resend for magic link emails
- **Package manager**: pnpm (on `magic-link-auth` branch)
- **Env vars**: `DATABASE_URL`, `RESEND_API_KEY`, `APP_URL`, `NODE_ENV`

## Pre-requisite: Merge magic-link-auth

The `magic-link-auth` branch (2 commits ahead of main) contains DB, auth, and email code. It uses pnpm and has files at repo root (vs inside `deployment/`). Must be merged/rebased first.

## What Needs to Happen

### 1. Replace `@neondatabase/serverless` with `postgres` (postgres.js)

`@neondatabase/serverless` uses HTTP/WebSocket — **not** the standard PostgreSQL wire protocol. It cannot connect to a regular PostgreSQL instance.

**postgres.js** is the best replacement because it also uses tagged template literals — nearly identical API. Migration is minimal:

**Before** (`app/lib/db.ts`):
```ts
import { neon, NeonQueryFunction } from "@neondatabase/serverless";
let _sql: NeonQueryFunction<false, false> | null = null;
export function sql(...) { _sql = neon(process.env.DATABASE_URL); ... }
```

**After**:
```ts
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL!);
export { sql };
```

All existing queries in `app/lib/auth.ts` work unchanged — both drivers return row arrays.

### 2. Add `output: "standalone"` to next.config.mjs

Produces a self-contained `.next/standalone/` with `server.js` + minimal node_modules. Reduces Docker image from ~500MB to ~100MB.

### 3. Create Health Check Endpoint

`GET /api/health` returning `{ status: "ok" }`. No DB dependency — keeps liveness probe independent of database availability.

### 4. Create Dockerfile

Multi-stage build (3 stages):

1. **deps** — Node 20 Alpine + pnpm, `pnpm install --frozen-lockfile`
2. **builder** — Copy deps + source, `pnpm run build`
3. **runner** — Copy standalone output + public + static, run as non-root user

Key details:
- `HOSTNAME="0.0.0.0"` required (Next.js standalone defaults to localhost)
- Non-root `nextjs` user for security
- No secrets baked in — env vars injected at runtime by K8s

### 5. Create Kubernetes Manifests

| File | Purpose |
|------|---------|
| `k8s/namespace.yaml` | `pyramid` namespace |
| `k8s/configmap.yaml` | `APP_URL`, `NODE_ENV` |
| `k8s/secret.yaml` | `DATABASE_URL`, `RESEND_API_KEY` (placeholder) |
| `k8s/deployment.yaml` | App pods (2 replicas, probes, resource limits) |
| `k8s/service.yaml` | ClusterIP on port 80 → 3000 |
| `k8s/ingress.yaml` | Ingress with TLS (nginx + cert-manager) |
| `k8s/postgres.yaml` | PostgreSQL StatefulSet + Service + PVC |
| `k8s/db-init-configmap.yaml` | DB schema init from `db.sql` |

**PostgreSQL in-cluster**: StatefulSet with `postgres:16-alpine`, PVC for data, init from `db.sql`.

**App resources**: 100m/500m CPU, 128Mi/256Mi memory.

**DATABASE_URL**: `postgresql://pyramid:$PASSWORD@pyramid-postgres:5432/pyramid?sslmode=disable`

## Files to Create/Modify

| Action | File |
|--------|------|
| Modify | `package.json` — swap `@neondatabase/serverless` → `postgres` |
| Modify | `app/lib/db.ts` — swap driver |
| Modify | `next.config.mjs` — add `output: "standalone"` |
| Create | `app/api/health/route.ts` |
| Create | `.dockerignore` |
| Create | `Dockerfile` |
| Create | `k8s/namespace.yaml` |
| Create | `k8s/configmap.yaml` |
| Create | `k8s/secret.yaml` |
| Create | `k8s/deployment.yaml` |
| Create | `k8s/service.yaml` |
| Create | `k8s/ingress.yaml` |
| Create | `k8s/postgres.yaml` |
| Create | `k8s/db-init-configmap.yaml` |

## Notes

- **Vercel packages** (`@vercel/analytics`, `@vercel/speed-insights`) are no-ops outside Vercel — no changes needed
- **Session stickiness not required** — sessions are stored in PostgreSQL, any pod can serve any request
- **`APP_URL` must match Ingress host** — magic link emails contain this URL
- **pnpm version**: pin in Dockerfile for reproducible builds (check local version with `pnpm --version`)

## Verification

```bash
# Docker build
docker build -t pyramid:test .

# Local run
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e RESEND_API_KEY="..." \
  -e APP_URL="http://localhost:3000" \
  pyramid:test

# Health check
curl http://localhost:3000/api/health

# K8s deploy
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
kubectl -n pyramid get pods
kubectl -n pyramid port-forward svc/pyramid 3000:80
```
