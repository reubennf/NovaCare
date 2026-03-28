# NovaCare Backend

FastAPI backend for the NovaCare elderly care companion app.

## Stack
- FastAPI
- Supabase (Auth, Postgres, Storage)
- SEA-LION v4 (AI companion chat)
- APScheduler (background jobs)

## Setup

1. Clone the repo
2. Create a virtual environment: `python -m venv venv`
3. Activate it: `venv\Scripts\activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and fill in your keys
6. Run: `uvicorn app.main:app --reload`

## API Docs
Visit `http://localhost:8000/docs` when running locally.

## Phases
- Phase 1: Project setup
- Phase 2: Auth + profiles
- Phase 3: Medications + reminders
- Phase 4: Pet companion + chat
- Phase 5: Missions + points + rewards
- Phase 6: Caregiver summaries + risk detection
- Phase 7: Community + social features