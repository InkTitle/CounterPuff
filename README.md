# CounterPuff

Companion web application for *The CounterPuff Method* by Warren Lockhart.

This codebase is a Next.js App Router application with PostgreSQL (Drizzle ORM). The original product brief requested MySQL. This environment provides PostgreSQL only, so PostgreSQL is the live database. A starter MySQL schema lives in `sql/mysql-schema.sql` for a later cutover.

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL`, `AUTH_SECRET`, and `APP_URL`.
3. `npm install`
4. `npx drizzle-kit push`
5. `node scripts/generate-pdf.mjs`
6. `node scripts/seed.mjs`
7. `npm run dev`

Seeded accounts (development only):

- Admin: `admin@counterpuff.app` / `CounterPuff-Admin-2026`
- Active user: `alex@counterpuff.app` / `CounterPuff-User-2026`
- Pending user: `sam@counterpuff.app` / `CounterPuff-User-2026`

There is no public administrator registration route. The first admin is created by `scripts/seed.mjs` using `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD`.

## Email

Registration and password-reset messages are sent from `writetoinktitle@gmail.com` only when SMTP is configured (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`). If SMTP is missing, the app stores an `email_logs` row with status `not_configured` and does **not** claim that mail was sent.

## Payments

No payment provider credentials are configured. Entitlements are stored separately from administrator activation. The app does not pretend a checkout succeeded.

## eBook file

Place the authorized manuscript (`Final_TCPM.pdf`) via **Admin → eBook & content**. Until that upload happens, the reader uses a clearly labeled companion placeholder PDF that only repeats public cover information and blank worksheets.

## Security notes

- Passwords are bcrypt hashed.
- Sessions are httpOnly JWT cookies bound to a server-side session row that can be revoked.
- Sensitive APIs check role and account status on the server.
- Feature flags are enforced in APIs as well as the UI.

## Tests that can be run without a browser

```bash
node scripts/check-calculations.mjs
npx next typegen
npx tsc --noEmit
npm run build
```
