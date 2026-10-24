# CounterPuff on GoDaddy Windows Plesk

CounterPuff is a **Node.js (Next.js) web application**, not a static HTML or PHP site. Windows Plesk can host it only if **Node.js** is enabled for the domain.

It also needs a **PostgreSQL** database. Typical GoDaddy Windows shared plans include MySQL, not PostgreSQL. Use one of:

- A Plesk VPS where you install PostgreSQL
- A hosted PostgreSQL service (for example Neon, Supabase, or Amazon RDS)
- Then put that connection string in `DATABASE_URL`

Do not upload this app to a PHP-only or static-only hosting plan. It will not run.

## 1. What to upload

From the project root, upload **everything except**:

- `node_modules/`
- `.next/`
- `.env` (create this on the server; never upload secrets in a public zip if you can avoid it)
- `.git/`

Keep these on the server:

- `src/`
- `public/`
- `private/` (after you generate or upload the eBook PDF)
- `scripts/`
- `sql/`
- `server.js`  ← Plesk startup file
- `package.json` and `package-lock.json`
- `next.config.ts`
- `tsconfig.json`
- `drizzle.config.json`
- `postcss.config.mjs`
- `eslint.config.mjs`

Optional: `deploy/plesk/web.config` only if you are wiring IIS HttpPlatformHandler yourself.

## 2. Plesk Node.js (preferred on GoDaddy)

1. In Plesk, open the domain → **Node.js**.
2. **Enable Node.js**. Choose the newest available Node 20 or 22.
3. Set:
   - **Document root** / application root: the folder that contains `server.js` and `package.json`
   - **Application startup file:** `server.js`
   - **Application mode:** `production`
4. Click **NPM Install**.
5. Open **Run Node.js commands** (or SSH if you have it) and run:

```bat
npm run build
node scripts/generate-pdf.mjs
```

6. Add environment variables in Plesk Node.js → Custom environment variables:

```
NODE_ENV=production
PORT= (leave to Plesk if it sets PORT for you)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
AUTH_SECRET=long-random-string-at-least-32-characters
APP_URL=https://your-domain.com
EMAIL_FROM=writetoinktitle@gmail.com
ADMIN_BOOTSTRAP_EMAIL=admin@counterpuff.app
ADMIN_BOOTSTRAP_PASSWORD=choose-a-strong-password
```

SMTP (optional, otherwise emails are logged as not sent):

```
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
```

7. Restart the Node.js app.

8. Apply the database schema and seed the admin user (from the app folder, with `DATABASE_URL` set):

```bat
npx drizzle-kit push
node scripts/seed.mjs
```

9. Visit `https://your-domain.com/api/health` — it must return `{"ok":true}`.

10. Admin login:

- URL: `https://your-domain.com/login`
- After sign-in: `https://your-domain.com/admin`

## 3. Database notes

- This codebase talks to **PostgreSQL** through Drizzle.
- `sql/mysql-schema.sql` is only a portable sketch if you later move to MySQL. The live app will not use MySQL until the data layer is rewritten.
- Open inbound PostgreSQL access from the Plesk server IP if the database is remote.
- After first deploy, change `ADMIN_BOOTSTRAP_PASSWORD` and re-run seed only if you still need that account reset.

## 4. eBook file

Place the authorized manuscript as an administrator after login:

**Admin → eBook & content → Replace authorized eBook**

or generate the companion placeholder:

```bat
node scripts/generate-pdf.mjs
```

The PDF is served from `private/ebooks/` and is not a public URL.

## 5. Build on your PC, then upload (alternative)

If Plesk memory is too low to build:

On a Windows PC with Node 20+:

```bat
npm install
npm run build
node scripts/generate-pdf.mjs
```

Upload the project **including** `node_modules` and `.next` (large). Then on Plesk set startup file to `server.js` and skip `npm run build` on the server.

## 6. Common Plesk failures

| Symptom | Likely cause |
| --- | --- |
| Site shows default Plesk page | Node.js not enabled, or document root is `httpdocs` while the app is in a subfolder |
| 502 / 503 | App crashed. Check Node.js logs. Usually missing `AUTH_SECRET` or `DATABASE_URL` |
| `/api/health` is false | PostgreSQL not reachable from the Plesk server |
| Static CSS missing | Build was not run, or `.next` was not uploaded |
| Cannot sign in as admin | Seed was not run, or email/password env vars differ from what you typed |

## 7. GoDaddy plan check

In GoDaddy / Plesk, confirm:

1. **Node.js** appears under the domain.
2. You can set environment variables.
3. You have a PostgreSQL URL, not only phpMyAdmin/MySQL.

If Node.js is missing, this application needs a VPS, a Node host (Railway, Render, Azure App Service, Cloud Run), or a plan upgrade. Uploading these files to a classic ASP/PHP Windows hosting root will not start CounterPuff.
