import os
import warnings
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import shap
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

warnings.filterwarnings("ignore")

app = FastAPI(title="CKD Prediction ML API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load trained ML models, preprocessor, and feature names on startup
MODEL_DIR = Path(__file__).parent / "models"

models = {
    "rf": joblib.load(MODEL_DIR / "ckd_random_forest_tuned.joblib"),
    "xgb": joblib.load(MODEL_DIR / "ckd_xgboost_tuned.joblib"),
    "lr": joblib.load(MODEL_DIR / "ckd_logistic_regression_tuned.joblib"),
    "svm": joblib.load(MODEL_DIR / "ckd_svm_tuned.joblib"),
    "dt": joblib.load(MODEL_DIR / "ckd_decision_tree_tuned.joblib"),
}
MODEL_NAMES = {
    "rf": "Random Forest",
    "xgb": "XGBoost",
    "lr": "Logistic Regression",
    "svm": "SVM",
    "dt": "Decision Tree",
}
preprocessor = joblib.load(MODEL_DIR / "preprocessor.joblib")
feature_names = pd.read_csv(MODEL_DIR / "feature_names.csv")["feature"].tolist()

# SHAP explainers for tree-based models
explainers = {
    "rf": shap.TreeExplainer(models["rf"]),
    "xgb": shap.TreeExplainer(models["xgb"]),
    "dt": shap.TreeExplainer(models["dt"]),
}


# Input format: 18 clinical features + selected model
class PatientData(BaseModel):
    model_key: str = "rf"
    age: float = 48.0
    bp: float = 80.0
    sg: float = 1.020
    al: float = 0.0
    su: float = 0.0
    bgr: float = 121.0
    bu: float = 36.0
    sc: float = 1.2
    sod: float = 135.0
    pot: float = 4.5
    hemo: float = 15.4
    pcv: float = 44.0
    wc: float = 7800.0
    rc: float = 5.2
    rbc: str = "normal"
    pc: str = "normal"
    pcc: str = "notpresent"
    ba: str = "notpresent"


@app.get("/")
def health_check():
    return {"status": "ok", "models": list(models.keys())}


@app.post("/predict")
def predict(data: PatientData):
    input_dict = data.model_dump()
    model_key = input_dict.pop("model_key", "rf")

    if model_key not in models:
        raise HTTPException(status_code=400, detail=f"Invalid model '{model_key}'")

    # Preprocess raw patient features into model-ready array
    X_proc = preprocessor.transform(pd.DataFrame([input_dict]))
    model = models[model_key]

    prediction = int(model.predict(X_proc)[0])
    probability = float(model.predict_proba(X_proc)[0][1])

    # Calculate SHAP feature contributions if supported
    if model_key in explainers:
        explainer = explainers[model_key]
        sv = explainer.shap_values(X_proc)
        if isinstance(sv, list):
            sv = sv[1]
        sv = np.array(sv)
        if sv.ndim == 3:
            sv = sv[:, :, 1]
        shap_vals = sv[0].ravel().tolist()
        bv = explainer.expected_value
        base_value = float(bv[1]) if isinstance(bv, (list, np.ndarray)) else float(bv)
    else:
        shap_vals = [0.0] * len(feature_names)
        base_value = 0.5

    return {
        "prediction": prediction,
        "probability": probability,
        "model": model_key,
        "shap_values": shap_vals,
        "base_value": base_value,
        "feature_names": feature_names,
    }


@app.post("/predict-all")
def predict_all(data: PatientData):
    """Run all 5 ML models on the same patient data and return a comparison."""
    input_dict = data.model_dump()
    input_dict.pop("model_key", None)  # We run all models, so ignore model_key

    try:
        X_proc = preprocessor.transform(pd.DataFrame([input_dict]))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Preprocessing failed: {e}")

    results = []
    for key in ["rf", "xgb", "lr", "svm", "dt"]:
        model = models.get(key)
        if not model:
            continue
        pred = int(model.predict(X_proc)[0])
        prob = float(model.predict_proba(X_proc)[0][1])

        explainer = explainers.get(key)
        if explainer:
            sv = explainer.shap_values(X_proc)
            if isinstance(sv, list):
                sv = sv[1]
            sv = np.array(sv)
            if sv.ndim == 3:
                sv = sv[:, :, 1]
            shap_vals = sv[0].ravel().tolist()
        else:
            shap_vals = [0.0] * len(feature_names)

        results.append({
            "key": key,
            "model": MODEL_NAMES.get(key, key),
            "prediction": pred,
            "probability": round(prob * 100, 1),
            "shap_values": shap_vals,
        })

    ckd_votes = sum(1 for r in results if r["prediction"] == 1)
    avg_prob = sum(r["probability"] for r in results) / len(results) if results else 0

    return {
        "results": results,
        "feature_names": feature_names,
        "consensus": "CKD" if ckd_votes > len(results) / 2 else "No CKD",
        "consensus_probability": round(avg_prob, 1),
        "ckd_votes": ckd_votes,
        "total_models": len(results),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
