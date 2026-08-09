# HomeMate AI v0.1.2 Railway Healthcheck Fix

- Fixed Uvicorn startup error: `$PORT` was passed literally instead of as an integer.
- Added `start.sh` which safely expands Railway's PORT variable.
- Added validation that PORT is numeric.
- Removed Railway `startCommand` override from `railway.json`.
- Removed `Procfile` to avoid conflicting startup definitions.
- Docker now starts the app only through `/app/start.sh`.
- Kept `/api/health` as Railway healthcheck endpoint.
- Updated HomeMate AI version to v0.1.2.
