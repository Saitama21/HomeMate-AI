# HomeMate AI v0.1.1 Railway Fix

- Fixed Railway build failure caused by mise Python 3.12.7 artifact verification.
- Removed runtime.txt.
- Added Dockerfile with python:3.12-slim.
- Added railway.json with Dockerfile builder and /api/health healthcheck.
- Kept $PORT-compatible uvicorn startup.
- Updated app version to v0.1.1.
