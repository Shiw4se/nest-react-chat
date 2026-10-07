# Deployment

Two ways to run the whole stack outside your dev machine.

| Option | What you get | Cost |
|---|---|---|
| Docker Compose | Postgres, API and the built SPA behind nginx on one host | Any VPS or your own machine |
| Render + Neon + Cloudflare R2 | Public demo URL with no server to maintain | Free tiers (check current limits) |

## Option 1: Docker Compose

```bash
docker compose up --build
```

Open http://localhost:8080. Swagger is at http://localhost:8080/docs.

- nginx serves the SPA and proxies `/v1`, `/socket.io`, `/uploads` and `/docs` to the API, so the browser talks to a single origin.
- The API applies migrations on start and, with `SEED_DEMO=true` (the default here), recreates the demo accounts: `demo`, `alex`, `maria`, `sam`, `yuki`, password `Demo1234`.
- Data lives in the `db-data` and `uploads` volumes. `docker compose down -v` wipes them.
- Set `JWT_SECRET` in your shell or an `.env` file next to `docker-compose.yml` before exposing it to the internet.

## Option 2: Render + Neon + Cloudflare R2

Free web services on Render sleep after a period of inactivity and take
roughly a minute to wake up, and their disk is wiped on every deploy. That is
why the database lives on Neon and uploaded images on R2.

### 1. Database: Neon

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the connection string. It looks like
   `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`.

### 2. File storage: Cloudflare R2

1. In the Cloudflare dashboard open **R2** and create a bucket, for example `chat-uploads`.
2. In the bucket settings enable **Public access** (the `r2.dev` subdomain) or attach a custom domain. Copy that public URL.
3. Under **R2 → Manage API tokens** create a token with *Object Read & Write* for the bucket. Copy the access key ID, the secret, and the S3 endpoint `https://<account-id>.r2.cloudflarestorage.com`.

Any S3-compatible store works the same way (AWS S3, Backblaze B2, MinIO).

### 3. Backend and frontend: Render

1. Push this repository to GitHub.
2. In Render choose **New → Blueprint** and select the repository. Render reads `render.yaml` and proposes two services.
3. Fill in the values it asks for:

| Variable | Service | Value |
|---|---|---|
| `DATABASE_URL` | chat-backend | Neon connection string |
| `FRONTEND_URL` | chat-backend | URL of the frontend service, e.g. `https://chat-frontend.onrender.com` |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` | chat-backend | From the R2 steps |
| `VITE_API_URL`, `VITE_WS_URL` | chat-frontend | URL of the backend service, e.g. `https://chat-backend.onrender.com` |

`JWT_SECRET` is generated automatically. Service URLs are shown on each
service page; if you only learn them after the first deploy, set them and
redeploy (the frontend needs a rebuild because Vite inlines `VITE_*` values).

4. Check `https://<backend>/v1/health`. It should return `{"status":"ok","database":"up"}`.

### Demo data

`SEED_DEMO=true` resets the demo accounts on every backend start, which keeps
a public demo tidy. Real accounts are never touched. Set it to `false` to keep
demo data between restarts, or remove the `VITE_DEMO_*` variables to hide the
demo login button.

## Environment reference

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | required | API port (Render sets it automatically) |
| `DATABASE_URL` | required | PostgreSQL connection string |
| `JWT_SECRET` | required | Token signing secret |
| `FRONTEND_URL` | required | Allowed CORS origin |
| `TRUST_PROXY` | unset | Number of proxies in front, for real client IPs in rate limiting |
| `STORAGE_DRIVER` | `local` | `local` or `s3` |
| `UPLOADS_DIR` | `./uploads` | Local driver directory |
| `S3_*` | | S3 driver settings, see `backend/.env.example` |
| `SEED_DEMO` | unset | `true` recreates demo data on start (Docker entrypoint) |
| `NODE_ENV` | | `production` hides Swagger |
