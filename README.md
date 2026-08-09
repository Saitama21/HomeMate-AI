# HomeMate AI v0.2.1 Knowledge Catalog

Liquid Glass home assistant with UA/RU/EN localization.

## Catalog
- 80 plants
- 22 plant problems/pests
- 62 normalized food ingredients
- 58 structured recipes

## AI Vision
If `OPENAI_API_KEY` is configured in Railway Variables, plant photo diagnosis uses the OpenAI Responses API with image input.
Optional:
`OPENAI_MODEL=gpt-5-mini`

Without a key, HomeMate AI falls back to the local symptom knowledge base.

## Railway
This version keeps the proven v0.1.2 startup:
Dockerfile -> start.sh -> Uvicorn -> Railway PORT
Healthcheck: `/api/health`
Do not set a custom Railway Start Command.


## v0.2.1
Full localization of catalog enum values for Ukrainian, Russian and English. Ukrainian mode no longer exposes English plant care/category labels.
