# Calibration Usage in Translator Service

The translator service reads confidence calibration thresholds from a JSON file and returns per-field confidence values under `metadata.confidence`.

## Path Resolution
- Default path: `services/training/artifacts/calibration.json`
- Override via env var: `CALIBRATION_PATH`

## Response Schema Additions
- `metadata.confidence`: `{ type, subtype, duration_min, distance_km }` (floats 0.0-1.0)
- `metadata.calibration`: copy of loaded calibration (optional)

## Confidence Rules (current)
- Classification (`type`, `subtype`): heuristic confidence (keywords in title) clamped to at least calibration threshold.
- Regression (`duration_min`, `distance_km`): high confidence if numeric present in raw payload, otherwise low.

Future versions will use model logits and regression errors vs thresholds to produce calibrated confidence scores.
