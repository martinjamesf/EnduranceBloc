from typing import List, Tuple
import math
import torch
import torch.nn.functional as F


def classification_metrics(logits: torch.Tensor, targets: torch.Tensor) -> Tuple[float, float]:
    """
    Returns (accuracy, macro_f1)
    logits: (N, C)
    targets: (N,) class indices
    """
    preds = torch.argmax(logits, dim=-1)
    correct = (preds == targets).sum().item()
    acc = correct / max(1, targets.numel())

    # Macro F1 without sklearn
    num_classes = logits.size(-1)
    f1s: List[float] = []
    for c in range(num_classes):
        tp = ((preds == c) & (targets == c)).sum().item()
        fp = ((preds == c) & (targets != c)).sum().item()
        fn = ((preds != c) & (targets == c)).sum().item()
        precision = tp / max(1, tp + fp)
        recall = tp / max(1, tp + fn)
        if precision + recall == 0:
            f1 = 0.0
        else:
            f1 = 2 * precision * recall / (precision + recall)
        f1s.append(f1)
    macro_f1 = sum(f1s) / max(1, len(f1s))
    return acc, macro_f1


def mae(preds: torch.Tensor, targets: torch.Tensor) -> float:
    return torch.mean(torch.abs(preds - targets)).item()


def max_softmax_confidence(logits: torch.Tensor) -> torch.Tensor:
    probs = F.softmax(logits, dim=-1)
    return torch.max(probs, dim=-1).values


def percentile(values: List[float], p: float) -> float:
    if not values:
        return 0.0
    values = sorted(values)
    k = int(math.floor((p / 100.0) * (len(values) - 1)))
    return values[k]
