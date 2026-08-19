# CKD-Insight: Explainable ML for Chronic Kidney Disease Prediction

An end-to-end full-stack Chronic Kidney Disease (CKD) risk screening and explainability platform combining a **React + Tailwind** frontend, **Node.js / Express + MongoDB** API, **Python FastAPI + SHAP** ML microservice, and **Google Gemini** nephrology assistant.

---

## Project Structure

```text
ckd-predictor/
├── README.md
├── HOW_TO_RUN.md
├── .gitignore
│
├── frontend/                   # React 19 + Vite + Tailwind CSS v4 UI
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── App.jsx             # Router, navbar & protected routes
│       ├── config.js           # Shared API base URL (VITE_API_URL)
│       ├── components/
│       │   └── Chatbot.jsx     # Floating Gemini AI nephrology assistant
│       └── pages/
│           ├── Login.jsx       # Doctor / Patient auth
│           ├── Dashboard.jsx   # 18-feature form, model selector & SHAP chart
│           └── History.jsx     # Saved prediction history table
│
├── backend/                    # Express 5 + Mongoose 9 REST API
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── models/
│   │   ├── User.js
│   │   └── Prediction.js
│   └── routes/
│       ├── auth.js             # /api/auth/register, /api/auth/login
│       ├── predict.js          # /api/predictions, /api/predictions/history
│       └── chat.js             # /api/chat (Gemini AI proxy)
│
├── ml-api/                     # FastAPI + scikit-learn + XGBoost + SHAP
│   ├── main.py                 # /, /predict, /metrics, /feature_importance
│   ├── requirements.txt
│   ├── data/
│   │   └── ckd_cleaned.csv
│   └── models/                 # Trained .joblib models, preprocessor & .npy artifacts
│
└── ml-pipeline/                # Training & XAI research notebooks (Phases I–III)
    ├── Phase1_CKD_EDA.ipynb
    ├── Phase2_CKD_Modeling.ipynb
    ├── Phase3_CKD_SHAP.ipynb
    └── Demo_CKD_Model.ipynb
```

---

## Clinical Features (18 Non-Leakage Inputs)

The preprocessor and trained models use 18 clinical laboratory features (with post-diagnosis leakage flags dropped):

- **Numeric (14):** `age`, `bp`, `sg`, `al`, `su`, `bgr`, `bu`, `sc`, `sod`, `pot`, `hemo`, `pcv`, `wc`, `rc`
- **Categorical (4):** `rbc` (`normal`/`abnormal`), `pc` (`normal`/`abnormal`), `pcc` (`notpresent`/`present`), `ba` (`notpresent`/`present`)

## Available Models

| Key | Model |
|-----|-------|
| `rf` | Random Forest (default) |
| `xgb` | XGBoost |
| `lr` | Logistic Regression |
| `dt` | Decision Tree |
| `svm` | Support Vector Machine |

---

## Quick Start

See [HOW_TO_RUN.md](./HOW_TO_RUN.md) for step-by-step terminal commands to run all three services locally.
