# Cosmirror

Monorepo: Next.js frontend + Django API.

```
.
├── src/          # Next.js app (landing)
├── api/          # Django + DRF backend
└── public/
```

## Frontend

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Backend

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_onboarding
python manage.py createsuperuser
python manage.py runserver 8000
```

- Admin: http://127.0.0.1:8000/admin/
- Health: http://127.0.0.1:8000/api/health/

See `api/README.md` for domain model and full API list.
