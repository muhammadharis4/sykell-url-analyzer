# Sykell URL Analyzer

Sykell URL Analyzer is a full-stack web application for analyzing, crawling, and managing URLs. It features a Go (Gin) backend, a React/TypeScript frontend, and a MySQL database. Authentication is simple (admin/admin), and the app is ready for local development or deployment with Docker Compose.

## Features

-   Analyze and crawl URLs, view HTML version, internal/external/broken links
-   Simple authentication (admin/admin)
-   Modern React + Material UI dashboard
-   Full Docker Compose support for local or production use

---

## Quick Start (Docker Compose)

1. **Clone the repository:**

    ```sh
    git clone <your-repo-url>
    cd sykell-url-analyzer
    ```

2. **Build and start all services:**

    ```sh
    docker-compose up --build
    ```

    This will start:

    - MySQL database (port 3306)
    - Go backend API (port 8080)
    - React frontend (port 5173)

3. **Access the app:**

    - Frontend: [http://localhost:5173](http://localhost:5173)
    - Backend API: [http://localhost:8080](http://localhost:8080)

4. **Login credentials:**
    - Username: `admin`
    - Password: `admin`

---

## Manual Local Development

### 1. Start MySQL (if not using Docker Compose)

You need a MySQL 8+ instance. Example Docker command:

```sh
docker run --name sykell-db -e MYSQL_ROOT_PASSWORD=rootpass -e MYSQL_DATABASE=sykell_url_analyzer -e MYSQL_USER=sykell_user -e MYSQL_PASSWORD=sykell_pass -p 3306:3306 -d mysql:8.0
```

### 2. Backend (Go)

```sh
cd backend
go run main.go
```

Environment variables (see `docker-compose.yml` for defaults):

-   DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, ENVIRONMENT

### 3. Frontend (React)

```sh
cd frontend
npm install
npm run dev
```

The frontend will be available at [http://localhost:5173](http://localhost:5173)

---

## Project Structure

-   `backend/` - Go Gin API server
-   `frontend/` - React/TypeScript app
-   `docker-compose.yml` - Multi-service orchestration

---

## Environment Variables

See `docker-compose.yml` for all environment variables and their defaults. You can override them in your own `.env` files or via Docker Compose overrides.

---

## Troubleshooting

-   Make sure ports 3306, 8080, and 5173 are free.
-   If you change the database config, update both backend and docker-compose.
-   For development, you can run backend and frontend separately without Docker.

---
