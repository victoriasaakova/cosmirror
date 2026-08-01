# Cosmirror API

Python backend for Cosmirror: Django + Django REST Framework + SQLite + Admin.

## Stack

- Django admin — пользователи, онбординг, waitlist, вводы, астро
- REST API — `/api/...` для Next.js фронта
- SQLite — файл `db.sqlite3` рядом с проектом

## Setup

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

## Domain

| Сущность | Зачем |
|----------|--------|
| **User + Profile** | Пользователь. Регистрация позже (`registration_status`: waitlist → pending → active). Birth data для карты. phone / telegram. |
| **OnboardingStep** | Определение шага. `slug` = URL `/onboarding/<slug>/`. Сколько угодно шагов, порядок через `order`. |
| **OnboardingSession** | Анонимная сессия (UUID token) до регистрации; потом линкуется к User. |
| **OnboardingStepAnswer** | Ответ на каждый шаг (JSON payload), сохраняется отдельно. |
| **WaitlistLead** | email + phone + telegram до регистрации. |
| **UserInput** | Любые вводы в продукте (вопросы безопасности — позже). |
| **NatalChart** | Индивидуальные расчёты по дате рождения (сервис позже). |
| **GlobalPlanetaryCycle** | Общие планетарные циклы для всех (сервис позже). |

## API

| Method | Path | Auth | Описание |
|--------|------|------|----------|
| GET | `/api/health/` | no | ping |
| POST | `/api/waitlist/` | no | `{email, phone?, telegram?, name?, message?}` |
| GET | `/api/me/` | yes | текущий пользователь + профиль |
| GET/POST | `/api/journal/` | yes | дневник |
| GET | `/api/onboarding/steps/` | no | активные шаги (с `url_path`) |
| POST | `/api/onboarding/sessions/` | no | создать сессию → `token` |
| GET | `/api/onboarding/sessions/<token>/` | no | прогресс + ответы |
| PUT | `/api/onboarding/sessions/<token>/steps/<slug>/` | no | сохранить шаг `{payload, completed?}` |
| GET/POST | `/api/inputs/` | yes | вводы в продукте |
| GET | `/api/astro/charts/` | yes | натальные карты пользователя |
| GET | `/api/astro/cycles/` | no | активные глобальные циклы |

### Онбординг (флоу)

1. `POST /api/onboarding/sessions/` → сохранить `token` (localStorage)
2. `GET /api/onboarding/steps/` → роуты `/onboarding/welcome/`, `/onboarding/birth/`, …
3. На каждом экране `PUT .../steps/<slug>/` с `payload`
4. Шаг `birth` → пишет birth_* в сессию + создаёт `NatalChart(pending)`
5. Шаг `contacts` → создаёт/обновляет `WaitlistLead`

Новые шаги добавляются в админке — без деплоя фронтовых констант порядка (фронт читает `order` + `slug`).
