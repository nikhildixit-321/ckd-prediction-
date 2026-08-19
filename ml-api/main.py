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
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

warnings.filterwarnings("ignore")

app = FastAPI(
    title="CKD Prediction ML API",
    description="API for Chronic Kidney Disease Prediction with SHAP Explainability",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Paths & Artifacts ────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
MODEL_DIR = BASE_DIR / "models"

print("Loading artifacts...")
try:
    models = {
        "rf": joblib.load(MODEL_DIR / "ckd_random_forest_tuned.joblib"),
        "xgb": joblib.load(MODEL_DIR / "ckd_xgboost_tuned.joblib"),
        "lr": joblib.load(MODEL_DIR / "ckd_logistic_regression_tuned.joblib"),
        "svm": joblib.load(MODEL_DIR / "ckd_svm_tuned.joblib"),
        "dt": joblib.load(MODEL_DIR / "ckd_decision_tree_tuned.joblib"),
    }
except FileNotFoundError as e:
    print(f"Error loading models: {e}")
    models = {}

MODEL_NAMES = {
    "rf": "Random Forest",
    "xgb": "XGBoost",
    "lr": "Logistic Regression",
    "svm": "SVM",
    "dt": "Decision Tree",
}

try:
    preprocessor = joblib.load(MODEL_DIR / "preprocessor.joblib")
    X_train = np.load(MODEL_DIR / "X_train_processed.npy")
    X_test = np.load(MODEL_DIR / "X_test_processed.npy")
    y_train = np.load(MODEL_DIR / "y_train.npy")
    y_test = np.load(MODEL_DIR / "y_test.npy")
    feature_names = pd.read_csv(MODEL_DIR / "feature_names.csv")["feature"].tolist()
except Exception as e:
    print(f"Error loading auxiliary data: {e}")
    preprocessor = None
    X_train, X_test, y_train, y_test, feature_names = [], [], [], [], []

# Precomputed SHAP values for global feature importance fallback
shap_values = {}
for m in ["rf", "xgb"]:
    for split in ["test", "train"]:
        fpath = MODEL_DIR / f"{m}_shap_values_{split}.npy"
        if fpath.exists():
            sv = np.load(fpath)
            if sv.ndim == 3:
                sv = sv[:, :, 1]
            shap_values[f"{m}_{split}"] = sv

explainers = {}
for tree_key in ("rf", "xgb", "dt"):
    if tree_key in models:
        explainers[tree_key] = shap.TreeExplainer(models[tree_key])

y_preds = {k: m.predict(X_test) for k, m in models.items()} if len(X_test) > 0 else {}
y_probas = {k: m.predict_proba(X_test)[:, 1] for k, m in models.items()} if len(X_test) > 0 else {}

print(f"Models loaded: {list(models.keys())} | Features: {len(feature_names)}")
print("ML API ready.\n")


# ── Pydantic Request Schema (18 non-leakage clinical features) ───────────────
class PredictionRequest(BaseModel):
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


# ── Endpoints ────────────────────────────────────────────────────────────────
@app.get("/")
def health_check():
    return {
        "status": "ok",
        "message": "CKD Prediction ML API is running.",
        "models": list(models.keys()),
    }


@app.post("/predict")
def predict(data: PredictionRequest):
    if not preprocessor:
        raise HTTPException(status_code=500, detail="Preprocessor not loaded.")

    req_dict = data.model_dump()
    model_key = req_dict.pop("model_key", "rf")

    model = models.get(model_key)
    if not model:
        raise HTTPException(
            status_code=400,
            detail=f"Model '{model_key}' not found. Available: {list(models.keys())}",
        )

    raw_df = pd.DataFrame([req_dict])
    try:
        X_proc = preprocessor.transform(raw_df)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Preprocessing failed: {e}")

    pred = int(model.predict(X_proc)[0])
    prob = float(model.predict_proba(X_proc)[0][1])

    explainer = explainers.get(model_key)
    if explainer:
        sv = explainer.shap_values(X_proc)
        if isinstance(sv, list):
            sv = sv[1]
        sv = np.array(sv)
        if sv.ndim == 3:
            sv = sv[:, :, 1]
        shap_vals = sv[0].ravel().tolist()
        bv = explainer.expected_value
        bv = float(bv[1]) if isinstance(bv, (list, np.ndarray)) else float(bv)
    elif model_key == "lr" and hasattr(model, "coef_") and len(X_train) > 0:
        # Exact linear SHAP approximation under feature independence
        mean_train = np.mean(X_train, axis=0)
        shap_vals = (model.coef_[0] * (X_proc[0] - mean_train)).tolist()
        bv = float(model.intercept_[0] + np.dot(model.coef_[0], mean_train))
    else:
        shap_vals = [0.0] * len(feature_names)
        bv = 0.5

    return {
        "prediction": pred,
        "probability": prob,
        "model": model_key,
        "shap_values": shap_vals,
        "base_value": bv,
        "feature_names": feature_names,
        "feature_values": X_proc[0].tolist(),
    }


@app.get("/metrics")
def get_metrics():
    results = []
    for key in models:
        if key not in y_preds or key not in y_probas:
            continue
        yp = y_preds[key]
        ypr = y_probas[key]
        results.append(
            {
                "Key": key,
                "Model": MODEL_NAMES.get(key, key),
                "Accuracy": round(accuracy_score(y_test, yp), 3),
                "Precision": round(precision_score(y_test, yp), 3),
                "Recall": round(recall_score(y_test, yp), 3),
                "F1_Score": round(f1_score(y_test, yp), 3),
                "ROC_AUC": round(roc_auc_score(y_test, ypr), 3),
            }
        )
    results.sort(key=lambda x: x["ROC_AUC"], reverse=True)
    return {"metrics": results}


@app.get("/feature_importance")
def get_feature_importance():
    result = {}
    for key, model in models.items():
        if hasattr(model, "feature_importances_"):
            imp = model.feature_importances_
        elif hasattr(model, "coef_"):
            imp = np.abs(model.coef_[0])
        elif f"{key}_test" in shap_values:
            imp = np.abs(shap_values[f"{key}_test"]).mean(axis=0).ravel()
        else:
            imp = np.zeros(len(feature_names))

        sum_imp = imp.sum()
        imp_list = (imp / sum_imp).tolist() if sum_imp > 0 else imp.tolist()
        result[key] = {"name": MODEL_NAMES.get(key, key), "importance": imp_list}
    return {"features": feature_names, "models": result}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
