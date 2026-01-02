# Daily Time Block Planner – MVP Specifications

## Goals
- Help users plan and execute their day using visual time blocks.
- Fast, accessible, reliable, and works offline with seamless sync.

## Core Features
- Time blocks: create/edit/delete with start/end, duration, title, notes.
- Drag-and-drop and resize; snap-to-grid; keyboard accessible.
- Conflict/overlap detection with warnings and quick resolve.
- Priorities, tags, colors; status (planned/in-progress/done/skipped).
- Recurrence and templates for common routines.
- Focus mode/Pomodoro and reminders.
- Views: daily (primary) and weekly overview; timezone support.

## Data Model (MVP)
- Day: { id, date, timezone }
- Block: { id, dayId, title, notes, start, end, duration, status, recurrence, tags, color, priority }

## Architecture & UX
- Frontend: React + TypeScript (TanStack Start), mobile-first and responsive.
- SSR/SSG: Leverage TanStack Start for server-side rendering/static generation, file-based routing, and server functions/actions for auth, CRUD, and data ops.
- Data loading: Integrate TanStack Query for caching and optimistic updates; use streaming/partial hydration where applicable.
- Accessibility: WCAG 2.1 AA; full keyboard navigation; ARIA for timeline.
- Rendering: CSS Grid for timeline with 15-min slots; virtualization for long lists.
- Offline-first: local storage/IndexedDB; conflict-free merges on sync.
- Real-time: AWS API Gateway WebSocket + Lambda (via CDK) for live updates; connection registry in DynamoDB; rooms keyed by dayId.
- Backend (later phase): Node/Express + Postgres; REST + WebSocket.

## Integrations & Ops
- Calendar sync (Google/Outlook) via OAuth; import/export.
- Web Push notifications for reminders.
- Auth: JWT; secure storage; encryption in transit; privacy/GDPR.
- Observability: telemetry, error logging, crash reporting.
- Testing: unit, integration, e2e (Playwright/Cypress).
- CI/CD: build, test, deploy; feature flags for gradual rollouts.

## MVP Roadmap
1) Local-first MVP
- Timeline UI, create/edit/delete blocks, drag/resize, conflict warnings.
- Tags/colors, basic search/filter, local persistence.
- Accessibility pass and keyboard shortcuts; mobile layout.

2) Backend + Sync
- Auth, CRUD API, IndexedDB ↔ server sync, WebSocket live updates.
- Basic sharing (future): read-only links.

3) Integrations
- Calendar import/export; web push reminders.

4) Advanced
- Templates and recurrence, Pomodoro/focus, analytics/insights.
- Auto-scheduling suggestions; capacity planning.

## Non-Functional Requirements
- Performance: common interactions <50ms; initial load <2s on mid-range phone.
- Reliability: offline resilience; conflict resolution strategy documented.
- Security: OWASP ASVS baseline; rate limiting; input validation.
- Internationalization: time formats and locale-aware parsing.
