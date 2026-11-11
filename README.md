<div align="center">

<img src="https://img.shields.io/badge/WayPoint-Career%20Readiness%20AI-6366f1?style=for-the-badge&logo=buffer&logoColor=white" alt="WayPoint Banner" />

# 🎯 WayPoint
### *Career Readiness & Adaptive AI Learning Path Recommender*

> An intelligent career guidance platform that assesses your current skills, identifies gaps, and generates a fully personalized, adaptive roadmap to land your dream tech job — powered by Groq LLMs.

### 🚀 Live Application (Vercel)
**Live Link:** [https://waypointwp.vercel.app/](https://waypointwp.vercel.app/)

*(Backend API is hosted on Render: [https://waypoint-backend-4360.onrender.com](https://waypoint-backend-4360.onrender.com))*

---

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Groq](https://img.shields.io/badge/Groq-LLM%20API-F55036?style=flat-square&logo=groq&logoColor=white)](https://groq.com/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

---

## ✨ What is WayPoint?

WayPoint is an AI-powered career readiness platform built for the modern developer. It solves a critical problem: **most developers don't know what to learn next.** WayPoint fixes that.

| Feature | Description |
|---|---|
| 🎯 **Skill Assessment** | Intelligent onboarding quiz that maps your current knowledge level |
| 🗺️ **Adaptive Roadmaps** | Groq LLM generates a personalized, week-by-week learning path |
| 📊 **Progress Dashboard** | Visual heatmap and analytics to track your daily progress |
| 🤖 **AI Career Advisor** | Real-time chat with an AI tutor that knows your specific roadmap |
| ⚡ **Fast & Beautiful** | Sub-second AI responses using Groq's ultra-fast inference engine |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, shadcn/ui |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy, Pydantic |
| **Database** | Supabase (PostgreSQL) — cloud-hosted, no local DB needed |
| **AI / LLM** | Groq API — Qwen 3.8B model for deterministic JSON outputs |
| **Auth** | Custom JWT (bcrypt) + optional Google OAuth |
| **Email** | SMTP (Gmail App Password) for OTP flows |

---

## 🔑 Environment Variables

Before running the project, you must configure the environment variables. Both `.env.example` files are included in the repository as templates.

### Backend (`backend/.env`)

```env
GROQ_API_KEY=your_groq_api_key_here          # Get from: https://console.groq.com
GROQ_MODEL=qwen/qwen3.8-27b                  # LLM model name (keep as-is)
JWT_SECRET=your_jwt_secret_here              # Any long random string (32+ chars)
FRONTEND_ORIGIN=http://localhost:5173        # Keep as-is for local dev
DATABASE_URL=your_supabase_postgres_db_url  # From Supabase > Settings > Database
VITE_SUPABASE_URL=your_supabase_url         # From Supabase > Settings > API
VITE_SUPABASE_ANON_KEY=your_anon_key        # From Supabase > Settings > API
SMTP_EMAIL=your_gmail@gmail.com             # Gmail for sending OTP emails
SMTP_PASSWORD=your_gmail_app_password       # Gmail App Password (NOT account password)
```

### Frontend (`frontend/.env`)

```env
VITE_SUPABASE_URL=your_supabase_url         # Same as backend
VITE_SUPABASE_ANON_KEY=your_anon_key        # Same as backend
```

> **Note:** Copy `.env.example` to `.env` in each folder and fill in your keys. Never commit `.env` files to Git.

---

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) v18 or higher
- [Python](https://www.python.org/) 3.10 or higher
- Git

---

## 🪟 Windows — 1-Click Automated Setup

> The fastest way to get started. One script handles everything automatically.

**Step 1:** Configure your environment variables.
```
backend/.env.example  →  copy to  →  backend/.env   (fill in your keys)
frontend/.env.example →  copy to  →  frontend/.env  (fill in your keys)
```

**Step 2:** Double-click **`setup_and_run.bat`** in the project root.

The script automatically:
- ✅ Creates a Python virtual environment
- ✅ Installs all backend dependencies (`pip install -r requirements.txt`)
- ✅ Installs all frontend dependencies (`npm install`)
- ✅ Launches FastAPI backend on `http://localhost:8000`
- ✅ Launches Vite frontend on `http://localhost:5173`

---

## 🐧 Linux / 🍎 macOS — Manual Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/ShanuPrajapati12005/WayPoint.git
cd WayPoint
```

### Step 2: Backend Setup (FastAPI)

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate          # macOS/Linux
# .venv\Scripts\activate           # Windows (alternative)

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Open .env and fill in your API keys

# Start the backend server
uvicorn main:app --reload --port 8000
```

Backend will be running at: **`http://localhost:8000`**
API Docs available at: **`http://localhost:8000/docs`**

### Step 3: Frontend Setup (React + Vite)

Open a **new terminal window** and run:

```bash
# Navigate to frontend (from project root)
cd frontend

# Install Node.js dependencies
npm install

# Configure environment variables
cp .env.example .env
# Open .env and fill in your Supabase keys

# Start the frontend development server
npm run dev
```

Frontend will be running at: **`http://localhost:5173`**

---

## 🌐 Access the Application

Once both servers are running:

| Service | Local URL | Live URL |
|---|---|---|
| 🖥️ Frontend (React App) | `http://localhost:5173` | [waypointwp.vercel.app](https://waypointwp.vercel.app/) |
| ⚙️ Backend (FastAPI) | `http://localhost:8000` | [waypoint-backend-4360.onrender.com](https://waypoint-backend-4360.onrender.com) |

---

## 📁 Project Structure

```
WayPoint/
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── pages/          # Auth, Dashboard, Onboarding, Roadmap, etc.
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Global state management
│   │   └── services/       # API service layer
│   └── package.json
│
├── backend/                # FastAPI Python application
│   ├── routers/            # API route handlers
│   ├── core/               # Business logic & AI integration
│   ├── db/                 # Database models & sessions
│   ├── services/           # External service integrations
│   ├── main.py             # FastAPI app entry point
│   └── requirements.txt
│
├── setup_and_run.bat       # 1-Click Windows setup script
├── .env.example            # (see backend/ and frontend/ for .env templates)
└── README.md
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|---|---|
| `ModuleNotFoundError` | Ensure virtual environment is activated: `source .venv/bin/activate` |
| `GROQ_API_KEY` error | Get a free key at [console.groq.com](https://console.groq.com) |
| Database connection error | Verify your `DATABASE_URL` is correct in `backend/.env` |
| Frontend shows blank page | Check that backend is running on port 8000 first |
| CORS error in browser | Ensure `FRONTEND_ORIGIN=http://localhost:5173` in `backend/.env` |

---

<div align="center">

**Built with ❤️ for HCL Hackathon**

*WayPoint — Navigate Your Career with AI Precision*

</div>
