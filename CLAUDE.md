# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RiverEye Backend — a Node.js/Express REST API for water level monitoring stations in Indonesia. It ingests sensor readings from IoT hardware, stores ML predictions, and serves data to a companion React Native mobile app.

## Commands

```bash
# Install dependencies
npm install

# Development (hot-reload via --watch)
npm run dev

# Production
npm start

# One-time database setup (run in order)
node src/scripts/initDB.js   # creates tables
node src/scripts/seedDB.js   # seeds 3 Indonesian monitoring stations
```

No linting or test runner is currently configured.

## Environment Variables

Create a `.env` file with:

```
DATABASE_URL=postgresql://user:password@host:port/database
HARDWARE_API_KEY=<key for IoT sensor hardware>
ML_API_KEY=<key for ML prediction service>
PORT=3000   # optional, defaults to 3000
```

The project uses self-hosted PostgreSQL.

## Architecture

**Request flow:**

```
index.js (Express app + CORS + JSON)
  → src/routes/index.js (aggregates all route modules)
    → Route modules (location, log, prediction)
      → Middlewares (API key auth, input validation)
        → Controllers (raw SQL via pg pool)
          → PostgreSQL (src/config/db.js connection pool)
```

**Three resources:**

| Resource | Routes | Auth Required |
|---|---|---|
| Locations | `GET /api/locations` | None |
| Sensor Logs | `GET /api/logs`, `POST /api/logs` | `HARDWARE_API_KEY` on POST |
| ML Predictions | `GET /api/predictions`, `POST /api/predictions` | `ML_API_KEY` on POST |

**Authentication** is header-based (`x-api-key`). Two separate keys exist: one for hardware (POST `/logs`) and one for the ML service (POST `/predictions`). GET endpoints are public.

**Validation** uses `express-validator`. Each POST route has a dedicated validation middleware in `src/middlewares/` that runs before the controller.

**No ORM** — all database queries are raw SQL strings inside controller functions. There are no migration files; schema lives in `src/scripts/initDB.js`.

## Database Schema

```sql
locations (id, name, latitude, longitude, elevation)
sensor_logs (id, location_id FK, water_level_cm, status, timestamp)
ml_predictions (id, location_id FK, predicted_level_cm, prediction_for_time, timestamp)
```

Foreign keys use `ON DELETE CASCADE`.
