# Implementation Tasks

## 0. Project Setup
- [x] Initialize TanStack Start app (npm create tanstack@latest) with TypeScript.
- [x] Configure ESLint + Prettier; add Husky pre-commit (lint/format).
- [x] Install deps: @tanstack/react-router, @tanstack/query, date-fns, idb (or Dexie), zustand/jotai.

## 1. Data Model & Storage (MVP)
- [ ] Define types: Day { id, date, timezone }, Block { id, dayId, title, notes, start, end, duration, status, tags, color, priority }.
- [ ] Validation utils (start < end; non-overlap helper; snap-to-15m).
- [ ] Local persistence: IndexedDB schema (days, blocks); CRUD service with optimistic updates.

## 2. Routing, SSR/SSG, Data Loading
- [ ] File-based routes: /day/:date (primary), /week/:start.
- [ ] Server functions/actions for auth (stub), CRUD (later), and data ops.
- [ ] Integrate TanStack Query for caching, optimistic updates, and invalidation.

## 3. Timeline UI (MVP)
- [ ] Daily timeline using CSS Grid (15-min slots), mobile-first responsive.
- [ ] Block cards: create/edit/delete, notes, color, tags.
- [ ] Drag-and-drop + resize; snap-to-grid; collision warning UI.
- [ ] Keyboard accessibility (move/resize blocks, ARIA roles for grid).
- [ ] Focus/Pomodoro stub (start/stop timer UI only).

## 4. Real-time Sync (AWS API Gateway WebSocket via CDK)
- [ ] Create AWS CDK app (TypeScript) and stacks.
- [ ] DynamoDB tables: connections, (optional) blocks/days for server persistence.
- [ ] API Gateway WebSocket: routes $connect, $disconnect, sendMessage.
- [ ] Lambda handlers: connect/disconnect; broadcast updates by room (dayId); auth stub.
- [ ] Connection registry in DynamoDB; TTL; IAM roles/policies.
- [ ] Frontend WS client: connect/reconnect, subscribe to dayId, handle incoming updates.
- [ ] Sync strategy: apply remote updates to IndexedDB; resolve conflicts (last-write-wins for MVP).

## 5. Auth (Phase 2)
- [ ] Add Cognito User Pool via CDK; JWT validation in Lambdas.
- [ ] Frontend sign-in/sign-up; token storage; attach auth to WS and future REST.

## 6. Integrations (Phase 3)
- [ ] Calendar import/export (Google/Outlook) with OAuth.
- [ ] Web Push reminders for blocks.

## 7. Testing & Quality
- [ ] Unit tests: utils (validation, collision), storage services.
- [ ] Component tests: timeline interactions.
- [ ] E2E: basic flows (create/resize/move/delete) via Playwright.

## 8. Deployment & Ops
- [ ] Host frontend on S3 + CloudFront (CDK) with caching.
- [ ] CI/CD (GitHub Actions): build, test, deploy frontend + CDK stacks.
- [ ] Env management: runtime config for API endpoints and WS URL.
- [ ] Observability: structured logs, error reporting (Sentry or equivalent).

## 9. Performance & Accessibility
- [ ] Ensure critical interactions <50ms; virtualization if many blocks.
- [ ] WCAG 2.1 AA audit; keyboard-only full flow; screen reader labels.

## Milestones
- [ ] MVP Local-first (Sections 1–3).
- [ ] Realtime + Backend sync (Section 4).
- [ ] Auth (Section 5).
- [ ] Integrations (Section 6).