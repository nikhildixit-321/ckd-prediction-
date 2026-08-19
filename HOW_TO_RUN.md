# CKD Insight — How to Run

This project runs as three services (`backend`, `ml-api`, and `frontend`) plus the `ml-pipeline` notebooks.

## Prerequisites
- **Node.js** 18+ and npm
- **MongoDB** (local or MongoDB Atlas URI in `backend/.env`)
- **Python** 3.10+ (an existing Conda environment is already inside `ml-api/venv`)

---

## 1. Configure Environment (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` if needed and fill in your values:
- `PORT=5000`
- `MONGO_URI=...`
- `JWT_SECRET=...`
- `ML_API_URL=http://localhost:8000/predict`
- `GEMINI_API_KEY=...` (required for the Dr. AI Chatbot)

---

## 2. Start the 3 Services (3 Separate Terminals)

### Terminal 1 — Python FastAPI ML Service (Port 8000)
```powershell
cd ml-api
.\venv\python.exe main.py
```
*(If setting up fresh on another machine: `pip install -r requirements.txt` and `python main.py`.)*

### Terminal 2 — Node.js / Express Backend (Port 5000)
```powershell
cd backend
npm install
npm start
```

### Terminal 3 — React / Vite Frontend (Port 5173)
```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.
