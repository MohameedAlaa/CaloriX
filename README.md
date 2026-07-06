# CaloriX 🔥

A full-stack calorie tracking application built with modern technologies.

## Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| **Frontend**   | React 18 + Vite + TailwindCSS      |
| **Backend**    | FastAPI + Pydantic                  |
| **Database**   | SQLite + SQLAlchemy ORM             |
| **Auth**       | JWT (python-jose) + bcrypt          |

## Project Structure

```
calorixx/
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers
│   │   ├── auth/         # Auth dependencies & guards
│   │   ├── core/         # Config, security utilities
│   │   ├── database/     # SQLAlchemy engine & session
│   │   ├── models/       # ORM models
│   │   ├── schemas/      # Pydantic validation schemas
│   │   ├── services/     # Business logic layer
│   │   ├── utils/        # Shared helpers
│   │   └── main.py       # App factory
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # React context providers
│   │   ├── hooks/        # Custom hooks
│   │   ├── layouts/      # Page layouts
│   │   ├── pages/        # Route pages
│   │   └── services/     # API client & service functions
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # Edit secrets!
uvicorn app.main:app --reload
```

API docs available at **http://127.0.0.1:8000/docs**

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at **http://localhost:5173**

## Development

- The Vite dev server proxies `/api` requests to the FastAPI backend.
- SQLite database is auto-created on first startup.
- Generate a strong `SECRET_KEY` before production:
  ```bash
  openssl rand -hex 32
  ```

## License

MIT
