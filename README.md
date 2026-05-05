# CampusKonnect

CampusKonnect is a student-focused marketplace app for connecting campus users with services such as tutoring, moving help, errands, and other peer-to-peer offerings. The project includes an Expo/React Native frontend and a Spring Boot backend with authentication, listings, preferences, location-aware search, and AI-assisted listing description improvement.

## Tech Stack

- Frontend: Expo, React Native, Expo Router, TypeScript
- Backend: Spring Boot, Spring Security, Spring Data JPA
- Database: PostgreSQL / Supabase
- Cache/verification storage: Redis
- AI integration: Gemini API
- CI/CD: GitHub Actions, Docker, Docker Compose

## Repository Structure

- `frontend/`: Expo app for web/mobile UI
- `backend/`: Spring Boot API, auth, listings, and persistence logic
- `.github/workflows/`: GitHub Actions workflows for CI and Docker image automation

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run web
```

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

For direct backend runs outside Docker, `backend/.env` can hold local environment variables such as the Supabase connection, JWT secret, and optional Gemini key.

## Docker Demo Setup

This branch packages the Expo web frontend and Spring Boot backend into a single app image, then uses Docker Compose to provide Redis locally while the application connects to a shared/cloud PostgreSQL database such as Supabase.

### How it works

- The frontend is exported as a static web bundle with `expo export --platform web`.
- Spring Boot serves that bundle from `FRONTEND_STATIC_DIR`.
- Protected backend APIs remain under `/api/**`, while browser routes like `/login` and `/search` are served by the frontend app.

### Recommended demo flow

1. Copy `.env.example` to `.env`.
2. Fill in the Supabase database connection values.
3. Optionally add keys for Google Maps, Gemini, or SendGrid.
4. Start everything with Docker Compose.
5. Open `http://localhost:8080`.

Required `.env` values for the shared database:

```bash
SUPABASE_DB_URL=jdbc:postgresql://aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
SUPABASE_DB_USERNAME=postgres.tflsjdlyjnbgxeldaksl
SUPABASE_DB_PASSWORD=your_supabase_password
```

Compose command:

```bash
docker compose up --build
```

This starts:

- `app`: combined frontend + backend container
- `redis`: local Redis instance for email verification codes

### Build just the app image

```bash
docker build -t campuskonnect-fullstack .
```

Optional build args:

```bash
docker build \
  --build-arg EXPO_PUBLIC_GOOGLE_MAPS_KEY=your_maps_key \
  --build-arg EXPO_PUBLIC_API_BASE_URL= \
  -t campuskonnect-fullstack .
```

`EXPO_PUBLIC_API_BASE_URL` is intentionally left blank for the containerized build so the frontend calls the backend on the same origin.

### Run only the app container

```bash
docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e JWT_SECRET=change-me-to-a-long-secret \
  -e SUPABASE_DB_URL=jdbc:postgresql://aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require \
  -e SUPABASE_DB_USERNAME=postgres.tflsjdlyjnbgxeldaksl \
  -e SUPABASE_DB_PASSWORD=your_supabase_password \
  -e REDIS_HOST=host.docker.internal \
  -e REDIS_PORT=6379 \
  -e GEMINI_API_KEY=your_gemini_key \
  campuskonnect-fullstack
```

### Notes

- `docker compose up --build` is the easiest way for instructors or teammates to run the project locally once the Supabase credentials are in `.env`.
- The standalone image expects the cloud PostgreSQL database and Redis to be reachable from the container.
- Use the Supabase shared pooler host shown above for local Docker/IPv4 environments.
- Uploaded listing images are stored under `/app/uploads/listings` inside the container.
- For local non-Docker development, the mobile/web frontend can still use `http://localhost:8080` as its API base automatically.
- `JWT_SECRET` has a demo default so the app can boot without sharing a real secret.
- `GEMINI_API_KEY` and `SENDGRID_API_KEY` are optional. Without them:
  - AI listing improvement will return a friendly unavailable message.
  - verification codes are logged locally instead of being emailed.

## CI/CD

The repository currently contains two GitHub Actions workflows:

- `ci.yml`: runs backend tests and frontend linting on pushes and pull requests to `main`
- `docker.yml`: builds the Docker image for validation and can push to DockerHub on `main` when DockerHub secrets are configured

Required GitHub secrets for DockerHub push:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

## External Services

The project may use these external services depending on the feature set being tested:

- Supabase PostgreSQL for shared cloud data storage
- Redis for verification code storage
- Gemini for AI-assisted description rewriting
- SendGrid for email delivery, though local/demo mode can log verification codes instead
- Google Maps API key for map features in the frontend
