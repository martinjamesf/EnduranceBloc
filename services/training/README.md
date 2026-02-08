# EnduranceBloc Training Skeleton

Minimal PyTorch training scaffolding for the translator model.

## Setup
```powershell
python -m venv .venv
& .venv/Scripts/Activate.ps1
pip install -r services/training/requirements.txt
```

Note: Installing `torch` on Windows may require appropriate wheels. Alternatively, use WSL or Docker.

## Run
```powershell
python services/training/train.py --train_path services/training/dataset/train.jsonl --val_path services/training/dataset/val.jsonl --epochs 1 --batch_size 16
```

## Next Steps
- Replace `SimpleTokenizer` with a robust tokenizer.
- Add attention layers and proper JSON field encoding.
- Implement evaluation (accuracy/F1 for classes; MAE for regression) and confidence calibration.
- Evaluation outputs are saved to services/training/artifacts/calibration.json with thresholds and metrics.
- Save model checkpoints and export to the FastAPI service.
