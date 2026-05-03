# ESI SMQ

Quality management web application with a Django REST API, PostgreSQL, and a React/Vite frontend.

## Project Structure

```text
backend/    Django REST API, Dockerfile, docker-compose.yml, seed data
frontend/   React + Vite frontend
```

## Prerequisites

- Git
- Docker and Docker Compose
- Node.js 18 or newer
- npm

Python is only required for local backend development outside Docker.

## Quick Start With Docker

1. Clone the project:

```bash
git clone https://github.com/m3kido/PRJ-SMQ.git
cd PRJ-SMQ
```

2. Start the database and backend:

```bash
cd backend
docker-compose up --build
```

The backend API will run at:

```text
http://localhost:8500/api
```

3. In a second terminal, start the frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The frontend will run at:

```text
http://localhost:5173
```

## Load Demo Data

After the backend is running, load sample departments, users, ISO criteria, processes, audits, and assignments:

```bash
cd backend
docker-compose exec backend python seeds.py
```

Demo accounts:

```text
admin / admin
gestionnaire / gestionnaire
auditeur_interne / auditeur_interne
auditeur_externe / auditeur_externe
```

## Environment Variables

Backend values are configured in `backend/.env.example` and can also be provided through shell variables when running Docker Compose.

Important backend defaults:

```text
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=*
POSTGRES_DB=smq
POSTGRES_USER=smq
POSTGRES_PASSWORD=smq
POSTGRES_HOST=db
POSTGRES_PORT=5432
```

Frontend API URL:

```text
VITE_API_URL=http://localhost:8500/api
```

For local frontend work, copy `frontend/.env.example` to `frontend/.env`.

## Local Backend Development Without Docker

Use this path only if PostgreSQL is already installed and running locally.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python seeds.py
python manage.py runserver 0.0.0.0:8500
```

If your PostgreSQL credentials are different, edit `backend/.env` before running migrations.

## Frontend Build

```bash
cd frontend
npm install
npm run build
```

The production files are generated in `frontend/dist/`. They are ignored by Git because they can be rebuilt.

## Common Commands

```bash
# Backend checks
cd backend
docker-compose exec backend python manage.py check

# Backend migrations
cd backend
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate

# Frontend dev server
cd frontend
npm run dev

# Frontend production build
cd frontend
npm run build
```

## Sharing Changes

After editing the project, commit and push your changes:

```bash
git status
git add .
git commit -m "Describe your change"
git push
```

Do not commit local `.env` files, uploaded media, virtual environments, `node_modules`, or generated `dist` files.
