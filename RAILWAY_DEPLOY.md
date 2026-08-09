# Railway deployment — HomeMate AI v0.1.1

## Why v0.1.0 failed
Railway selected `mise` to install the exact Python version from `runtime.txt`.
The build stopped while verifying the GitHub artifact for CPython 3.12.7.

## Fix in v0.1.1
- removed `runtime.txt`;
- added a Dockerfile based on `python:3.12-slim`;
- added `railway.json` forcing the Dockerfile builder;
- app listens on Railway's `$PORT`;
- added `/api/health` as the Railway health check.

## GitHub Desktop → Railway
1. Replace the repository contents with the clean contents of this ZIP.
2. Commit and Push to `main`.
3. Railway should detect `railway.json` + `Dockerfile` and build with Docker.
4. No Python version variable is required in Railway.
5. In Railway Variables you do not need to add `PORT`; Railway supplies it automatically.

If an old service still has a custom Build Command or Start Command, remove those overrides
or set the Start Command to:
`uvicorn app.main:app --host 0.0.0.0 --port $PORT`
