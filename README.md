# CaloriX 🔥🤖

An AI-powered nutrition assistant and calorie tracking platform that combines traditional calorie tracking with machine learning and generative AI to deliver smarter meal recommendations and food analysis.

---

## ✨ Features

### 🔐 Authentication & User Management
- JWT Authentication
- Secure password hashing with bcrypt
- User profiles and nutrition goals
- Personalized calorie and macro targets

### 🍽️ Meal Tracking
- Add meals manually
- Track calories, protein, carbs, and fat
- Categorize meals by type
- Daily nutrition overview

### 🤖 Machine Learning Features
- Food category prediction
- Similar food recommendations using nutritional similarity
- Macro-based recommendation engine

### 🧠 AI Features
- Generate meals from available ingredients using Gemini AI
- Analyze food images using Gemini Vision
- Estimate calories and macros from uploaded food photos
- Personalized meal suggestions based on user goals

### 📊 Analytics
- Daily calorie progress
- Macro distribution tracking
- Nutrition insights

---

# 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | FastAPI + Pydantic |
| Database | SQLite + SQLAlchemy |
| Authentication | JWT + python-jose + bcrypt |
| Machine Learning | Scikit-learn |
| AI Models | Google Gemini 2.5 Flash |
| Computer Vision | Gemini Vision |
| API Documentation | Swagger/OpenAPI |

---

# 🏗️ Project Architecture

```text
CaloriX/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── auth.py
│   │   │       ├── meals.py
│   │   │       ├── profile.py
│   │   │       ├── ml.py
│   │   │       └── ai.py
│   │   │
│   │   ├── auth/
│   │   ├── core/
│   │   ├── database/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── ml_service.py
│   │   │   └── ai_service.py
│   │   │
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ai/
│   │   │
│   │   ├── pages/
│   │   │   └── AIAssistantPage.jsx
│   │   │
│   │   ├── services/
│   │   │   └── aiService.js
│   │   │
│   │   └── layouts/
│   │
│   └── package.json
│
└── README.md
```

---

# 🚀 Quick Start

## Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

copy .env.example .env

python -m uvicorn app.main:app --reload
```

Backend API:

```text
http://127.0.0.1:8000
```

Swagger Documentation:

```text
http://127.0.0.1:8000/docs
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend Application:

```text
http://localhost:5173
```

AI Assistant:

```text
http://localhost:5173/ai-assistant
```

---

# ⚙️ Environment Variables

Create:

```text
backend/.env
```

Example:

```env
APP_NAME=CaloriX
DEBUG=true

DATABASE_URL=sqlite:///./calorixx.db

SECRET_KEY=your-secret-key

CORS_ORIGINS=["http://localhost:5173"]

GEMINI_API_KEY=your-gemini-api-key

REQUIRE_AI_AUTH=false
```

---

# 🤖 AI API Endpoints

## Generate Meal Suggestions

```http
POST /api/v1/ai/suggest-meals
```

Example:

```json
{
  "ingredients": [
    "eggs",
    "tomatoes",
    "cheese"
  ]
}
```

---

## Analyze Food Image

```http
POST /api/v1/ai/analyze-image
```

Accepts:

- Multipart image upload
- Returns estimated nutrition values
- Returns detected ingredients

---

# 🧪 ML Features

### Food Category Prediction

Predicts food categories based on:

- Calories
- Protein
- Carbohydrates
- Fat

---

### Similar Foods Recommendation

Uses:

- Feature scaling
- Euclidean distance similarity
- Category-aware filtering

---

# 🔮 Future Improvements

- Barcode scanner
- Voice food logging
- Weekly meal planner
- AI coach and nutrition chatbot
- Wearables integration
- OpenFoodFacts integration

---

# 📄 License

MIT License
