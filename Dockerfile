FROM node:20-bookworm-slim AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

COPY frontend/ ./

ARG EXPO_PUBLIC_GOOGLE_MAPS_KEY=""
ARG EXPO_PUBLIC_API_BASE_URL=""

ENV EXPO_PUBLIC_GOOGLE_MAPS_KEY=${EXPO_PUBLIC_GOOGLE_MAPS_KEY}
ENV EXPO_PUBLIC_API_BASE_URL=${EXPO_PUBLIC_API_BASE_URL}

RUN npm run export:web

FROM maven:3.9.9-eclipse-temurin-21 AS backend-build

WORKDIR /app/backend

COPY backend/.mvn .mvn
COPY backend/mvnw backend/pom.xml ./

RUN chmod +x mvnw && ./mvnw -q -DskipTests dependency:go-offline

COPY backend/src src
RUN ./mvnw -DskipTests package

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=backend-build /app/backend/target/*.jar ./app.jar
COPY --from=frontend-build /app/frontend/dist ./frontend-dist

RUN mkdir -p /app/uploads/listings

ENV PORT=8080
ENV FRONTEND_STATIC_DIR=/app/frontend-dist

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
