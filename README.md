# Adventurer Guild API

Fastify + SQLite + Drizzle backend workspace for the Adventurer Guild system. Timestamps are stored as UTC ISO-8601 text and all domain identifiers are stable strings.

## Development

```powershell
corepack pnpm install
corepack pnpm db:seed
corepack pnpm dev
```

Development seed accounts:

| Role | Username | Password |
| --- | --- | --- |
| ADMIN | `admin` | `DemoAdmin!2026` |
| DEPARTMENT_LEAD | `cos.lead` | `DemoLead!2026` |
| MEMBER | `cos.member` | `DemoMember!2026` |

These credentials are development-only. With `NODE_ENV=production`, `ADMIN_PASSWORD` and a `SESSION_SECRET` of at least 24 characters are required. The seed contains exactly 82 fictional members and never imports real names.

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before delivery. Session cookies are HttpOnly and SameSite=Strict; production also marks them Secure. Sessions, activation-token hashes, soft-disabled users, soft-deleted file metadata, settings, and audit/contribution events are stored in SQLite.

