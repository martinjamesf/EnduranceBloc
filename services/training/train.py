import argparse
import json
import os
from typing import Dict, List

import torch
import torch.nn as nn
import torch.optim as optim

from model import WorkoutTranslator
from metrics import classification_metrics, mae, max_softmax_confidence, percentile

BASE_DIR = os.path.dirname(__file__)
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
DATASET_DIR = os.path.join(BASE_DIR, "dataset")

# Minimal tokenizer stub (replace with real)
class SimpleTokenizer:
    def __init__(self):
        self.vocab = {"<pad>": 0}
    def encode(self, text: str):
        toks = text.lower().split()
        ids = []
        for t in toks:
            if t not in self.vocab:
                self.vocab[t] = len(self.vocab)
            ids.append(self.vocab[t])
        return ids

def load_jsonl(path):
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                yield json.loads(line)

def collate_batch(batch, tokenizer: SimpleTokenizer, max_len: int = 256):
    # Encode raw payload text fields
    encoded = []
    type_targets = []
    subtype_targets = []
    duration_targets = []
    distance_targets = []
    type_map = {"swim":0, "bike":1, "run":2, "other":3}
    subtype_map = {"endurance":0, "tempo":1, "threshold":2, "skills":3, "recovery":4, "race":5, "interval":6, "easy":7}

    for item in batch:
        raw = item.get('metadata', {}).get('raw_payload', {})
        text = json.dumps(raw)
        ids = tokenizer.encode(text)[:max_len]
        encoded.append(ids)
        type_targets.append(type_map.get(item.get('type', 'other'), 3))
        subtype_targets.append(subtype_map.get(item.get('subtype', 'easy'), 7))
        duration_targets.append(float(item.get('duration_min') or 0.0))
        distance_targets.append(float(item.get('distance_km') or 0.0))

    # Pad
    maxT = max(len(x) for x in encoded) if encoded else 1
    padded = [x + [0]*(maxT - len(x)) for x in encoded]
    x = torch.tensor(padded, dtype=torch.long)
    return x, torch.tensor(type_targets), torch.tensor(subtype_targets), torch.tensor(duration_targets), torch.tensor(distance_targets)


def train(cfg: Dict):
    tokenizer = SimpleTokenizer()
    train_path = cfg['train_path']
    model = WorkoutTranslator()
    opt = optim.Adam(model.parameters(), lr=cfg.get('lr', 1e-3))
    ce = nn.CrossEntropyLoss()
    mse = nn.MSELoss()

    # Simple loop over JSONL (no batching for brevity)
    model.train()
    for epoch in range(cfg.get('epochs', 3)):
        losses = []
        batch = []
        for item in load_jsonl(train_path):
            batch.append(item)
            if len(batch) >= cfg.get('batch_size', 16):
                x, t_type, t_subtype, t_dur, t_dist = collate_batch(batch, tokenizer)
                out = model(x)
                loss = (
                    ce(out['type_logits'], t_type) +
                    ce(out['subtype_logits'], t_subtype) +
                    mse(out['duration'], t_dur) +
                    mse(out['distance'], t_dist)
                )
                opt.zero_grad()
                loss.backward()
                opt.step()
                losses.append(loss.item())
                batch = []
        print(f"epoch {epoch} loss={sum(losses)/max(len(losses),1):.4f}")

    # Save model weights
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    torch.save(model.state_dict(), os.path.join(ARTIFACTS_DIR, 'translator.pt'))

    # Evaluate and calibrate if val path exists
    val_path = cfg.get('val_path', os.path.join(DATASET_DIR, 'val.jsonl'))
    if os.path.exists(val_path):
        calibrate(model, tokenizer, val_path)


def calibrate(model: WorkoutTranslator, tokenizer: SimpleTokenizer, val_path: str):
    model.eval()
    type_logits_list: List[torch.Tensor] = []
    subtype_logits_list: List[torch.Tensor] = []
    type_targets: List[int] = []
    subtype_targets: List[int] = []
    durations_pred: List[float] = []
    durations_true: List[float] = []
    distances_pred: List[float] = []
    distances_true: List[float] = []

    type_map = {"swim":0, "bike":1, "run":2, "other":3}
    subtype_map = {"endurance":0, "tempo":1, "threshold":2, "skills":3, "recovery":4, "race":5, "interval":6, "easy":7}

    with torch.no_grad():
        for item in load_jsonl(val_path):
            raw = item.get('metadata', {}).get('raw_payload', {})
            text = json.dumps(raw)
            ids = tokenizer.encode(text)
            x = torch.tensor([ids], dtype=torch.long)
            out = model(x)
            type_logits_list.append(out['type_logits'].squeeze(0))
            subtype_logits_list.append(out['subtype_logits'].squeeze(0))
            type_targets.append(type_map.get(item.get('type', 'other'), 3))
            subtype_targets.append(subtype_map.get(item.get('subtype', 'easy'), 7))
            durations_pred.append(float(out['duration'].item()))
            distances_pred.append(float(out['distance'].item()))
            durations_true.append(float(item.get('duration_min') or 0.0))
            distances_true.append(float(item.get('distance_km') or 0.0))

    type_logits = torch.stack(type_logits_list) if type_logits_list else torch.zeros((1,4))
    subtype_logits = torch.stack(subtype_logits_list) if subtype_logits_list else torch.zeros((1,8))
    type_targets_t = torch.tensor(type_targets, dtype=torch.long) if type_targets else torch.zeros((1,), dtype=torch.long)
    subtype_targets_t = torch.tensor(subtype_targets, dtype=torch.long) if subtype_targets else torch.zeros((1,), dtype=torch.long)

    type_acc, type_f1 = classification_metrics(type_logits, type_targets_t)
    subtype_acc, subtype_f1 = classification_metrics(subtype_logits, subtype_targets_t)

    dur_mae = mae(torch.tensor(durations_pred), torch.tensor(durations_true))
    dist_mae = mae(torch.tensor(distances_pred), torch.tensor(distances_true))

    # Confidence thresholds: 10th percentile of max softmax among correct predictions
    type_conf_all = max_softmax_confidence(type_logits).tolist()
    subtype_conf_all = max_softmax_confidence(subtype_logits).tolist()
    type_preds = torch.argmax(type_logits, dim=-1)
    subtype_preds = torch.argmax(subtype_logits, dim=-1)
    type_correct_conf = [c for c, p, t in zip(type_conf_all, type_preds.tolist(), type_targets_t.tolist()) if p == t]
    subtype_correct_conf = [c for c, p, t in zip(subtype_conf_all, subtype_preds.tolist(), subtype_targets_t.tolist()) if p == t]
    type_threshold = percentile(type_correct_conf, 10.0) if type_correct_conf else 0.6
    subtype_threshold = percentile(subtype_correct_conf, 10.0) if subtype_correct_conf else 0.6

    # Regression confidence uses error relative to 2*MAE
    dur_error_threshold = 2.0 * dur_mae
    dist_error_threshold = 2.0 * dist_mae

    calib = {
        'type': {
            'accuracy': round(type_acc, 4),
            'macro_f1': round(type_f1, 4),
            'confidence_threshold': round(type_threshold, 4)
        },
        'subtype': {
            'accuracy': round(subtype_acc, 4),
            'macro_f1': round(subtype_f1, 4),
            'confidence_threshold': round(subtype_threshold, 4)
        },
        'duration_min': {
            'mae': round(dur_mae, 4),
            'error_threshold': round(dur_error_threshold, 4)
        },
        'distance_km': {
            'mae': round(dist_mae, 4),
            'error_threshold': round(dist_error_threshold, 4)
        }
    }

    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    calib_path = os.path.join(ARTIFACTS_DIR, 'calibration.json')
    with open(calib_path, 'w', encoding='utf-8') as f:
        json.dump(calib, f, indent=2)
    print(f"Saved calibration to {calib_path}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--train_path', type=str, default=os.path.join(DATASET_DIR, 'train.jsonl'))
    parser.add_argument('--val_path', type=str, default=os.path.join(DATASET_DIR, 'val.jsonl'))
    parser.add_argument('--lr', type=float, default=1e-3)
    parser.add_argument('--epochs', type=int, default=3)
    parser.add_argument('--batch_size', type=int, default=16)
    args = parser.parse_args()

    cfg = vars(args)
    train(cfg)
