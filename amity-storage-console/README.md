# Amity Storage Console

Management console (UI skeleton) for the **Amity Enterprise File Storage Modernization** platform
described in `../Enterprise_File_Storage_PRD.docx`.

This is a **React UI-only** build running on an **in-memory mock data layer** — no backend
required. Every screen talks to `src/data/api.ts`, which is designed to be swapped for a real
REST/S3 API later without touching the UI.

## Stack

- **React 18 + TypeScript + Vite**
- **react-router-dom** — routing
- **recharts** — dashboard charts
- **lucide-react** — icons
- Hand-rolled CSS design system (`src/styles/global.css`), dark enterprise theme

## Run

```bash
cd amity-storage-console
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
```

## What's covered (mapped to the PRD)

| Area | Screen | PRD refs |
|------|--------|----------|
| Monitoring | **Dashboard** — storage growth, throughput, category split, pipeline health | FR-008, §1.3 metrics |
| Storage | **Buckets** — list, filter, provision, delete | FR-001, FR-002 |
| Storage | **Bucket detail** — object browser, settings, S3 endpoint, lifecycle/policy | FR-002, FR-007 |
| Storage | **All Objects** — cross-bucket browser with enrichment status filters | §6 Asset |
| AI Platform | **Enrichment Pipeline** — 5-stage flow + job queue/DLQ | §4, FR-003/004/005 |
| AI Platform | **Semantic Search** — NL query, ranked, RBAC-filtered | FR-006 |
| Governance | **Access & Keys** — scoped key issuance/revocation | FR-001 |
| Governance | **Policies (RBAC)** — role→bucket permission bindings | §6 AccessPolicy, §4.2 |
| Governance | **Categories** — retention & naming standards | §6 Category, FR-007 |
| Governance | **Audit Log** — immutable action record | §6 AuditLog, §4.2 |

## Project structure

```
src/
  data/        types.ts (domain model) · mock.ts (seed data) · api.ts (service layer)
  components/  Layout, Modal, ui (Card/Badge/Stat/…)
  pages/       one file per screen
  lib/         format.ts (bytes/dates) · status.ts (status→badge tone)
  styles/      global.css (design system)
```

## Swapping in a real backend

Replace the bodies of the functions in `src/data/api.ts` with `fetch('/api/...')` calls.
The function signatures and return types stay the same, so no UI changes are needed.
`src/data/mock.ts` can then be deleted.

## Status

UI skeleton with mock data. Out of scope for this build (per PRD §9 / future phases):
real S3/MinIO wiring, live pipeline execution, generative-AI features, auth/SSO.
