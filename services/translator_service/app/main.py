from typing import Any, Dict, List, Optional
import os
import json
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="EnduranceBloc Translator Service", version="0.1.0")

# Load calibration thresholds
CALIBRATION_PATH = os.environ.get("CALIBRATION_PATH") or os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "..", "training", "artifacts", "calibration.json"
)

def load_calibration(path: str) -> Dict[str, Any]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

CALIBRATION = load_calibration(CALIBRATION_PATH)

# Pydantic models mirroring CanonicalWorkout in TS
class IntensitySpec(BaseModel):
    zone: Optional[str] = None
    rpe: Optional[float] = None
    if_: Optional[float] = Field(default=None, alias="if")

    class Config:
        populate_by_name = True

class WorkoutStep(BaseModel):
    kind: str
    duration_min: Optional[float] = None
    distance_km: Optional[float] = None
    target: Optional[IntensitySpec] = None
    notes: Optional[str] = None

class Metadata(BaseModel):
    raw_payload: Dict[str, Any]
    raw_workout_id: Optional[str] = None
    external_id: Optional[str] = None
    confidence: Optional[Dict[str, float]] = None
    calibration: Optional[Dict[str, Any]] = None

class CanonicalWorkout(BaseModel):
    source: str
    type: str
    subtype: Optional[str] = None
    duration_min: Optional[float] = None
    distance_km: Optional[float] = None
    intensity: Optional[IntensitySpec] = None
    structured: bool
    steps: List[WorkoutStep]
    notes: Optional[str] = None
    metadata: Metadata

class TranslateRequest(BaseModel):
    source: Optional[str] = None
    payload: Dict[str, Any]

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/translate", response_model=CanonicalWorkout)
async def translate(req: TranslateRequest):
    # Minimal heuristic/mocked mapping; replace with real model later
    source = req.source or "unknown"
    raw = req.payload or {}

    # Infer type/subtype from common fields
    title = str(raw.get("title", "")).lower()
    inferred_type = "run" if "run" in title else "bike" if "ride" in title or "bike" in title else "swim" if "swim" in title else "other"
    inferred_subtype = "endurance" if any(k in title for k in ["easy", "endurance", "aerobic", "tempo", "threshold", "interval"]) else None

    # Duration/distance parsing (very naive)
    duration_min = None
    distance_km = None
    if isinstance(raw.get("duration"), (int, float)):
        duration_min = float(raw["duration"])  # assume minutes
    if isinstance(raw.get("distance"), (int, float)):
        distance_km = float(raw["distance"])  # assume km
    if distance_km is None and isinstance(raw.get("distance_km"), (int, float)):
        distance_km = float(raw["distance_km"])  # km

    notes = raw.get("notes") if isinstance(raw.get("notes"), str) else None

    # Confidence estimation using heuristics + calibration thresholds
    def compute_confidence(_source: str, _title: str, _raw: Dict[str, Any]) -> Dict[str, float]:
        title_lc = (_title or "").lower()
        type_conf = 0.6
        subtype_conf = 0.5
        if "run" in title_lc or "swim" in title_lc or "ride" in title_lc or "bike" in title_lc:
            type_conf = 0.85
        if any(k in title_lc for k in ["easy", "endurance", "aerobic", "tempo", "threshold", "interval"]):
            subtype_conf = 0.75
        # Regression confidences: presence-driven for now
        duration_conf = 0.9 if isinstance(_raw.get("duration"), (int, float)) else 0.3
        distance_conf = 0.9 if isinstance(_raw.get("distance"), (int, float)) or isinstance(_raw.get("distance_km"), (int, float)) else 0.3
        # Clamp with calibration thresholds if present
        try:
            t_thr = float(CALIBRATION.get("type", {}).get("confidence_threshold", 0.6))
            st_thr = float(CALIBRATION.get("subtype", {}).get("confidence_threshold", 0.6))
            type_conf = max(type_conf, t_thr)
            subtype_conf = max(subtype_conf, st_thr)
        except Exception:
            pass
        return {
            "type": float(type_conf),
            "subtype": float(subtype_conf),
            "duration_min": float(duration_conf),
            "distance_km": float(distance_conf),
        }

    confidence = compute_confidence(source, title, raw)

    canonical = CanonicalWorkout(
        source=source,
        type=inferred_type,
        subtype=inferred_subtype,
        duration_min=duration_min,
        distance_km=distance_km,
        intensity=None,
        structured=False,
        steps=[],
        notes=notes,
        metadata=Metadata(raw_payload=raw, confidence=confidence, calibration=CALIBRATION if CALIBRATION else None),
    )

    return canonical

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
