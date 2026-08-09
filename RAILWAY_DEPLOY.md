# Railway deployment — HomeMate AI v0.1.2

## Root cause fixed
Deploy logs showed:

`Error: Invalid value for '--port': '$PORT' is not a valid integer.`

The previous Railway `startCommand` passed `$PORT` literally to Uvicorn.

## v0.1.2 startup path
Railway -> Dockerfile -> `/app/start.sh` -> Uvicorn

`start.sh` expands `${PORT:-8000}` before starting Uvicorn and rejects non-numeric PORT values.

## Important Railway settings
- Builder: Dockerfile (provided by railway.json)
- Health check: `/api/health`
- Do NOT add a custom Start Command in Railway Settings.
- Do NOT create your own PORT variable. Railway provides PORT automatically.
- If an old Start Command is still saved in Railway UI, clear it so Docker CMD can run.

## GitHub Desktop -> Railway
1. Replace repository contents with this ZIP's clean root.
2. Commit.
3. Push to `main`.
4. Railway redeploys automatically.
5. Expected deploy log includes:
   `Starting HomeMate AI on 0.0.0.0:<number>`
6. Healthcheck should then pass on `/api/health`.
