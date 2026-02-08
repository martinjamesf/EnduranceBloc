import torch
import torch.nn as nn

class WorkoutTranslator(nn.Module):
    def __init__(self, vocab_size: int = 4096, hidden_dim: int = 256, num_types: int = 4, num_subtypes: int = 8):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, hidden_dim)
        self.encoder = nn.LSTM(hidden_dim, hidden_dim, batch_first=True, bidirectional=True)
        enc_out_dim = hidden_dim * 2
        # Heads: type (class), subtype (class), duration (regression), distance (regression)
        self.type_head = nn.Linear(enc_out_dim, num_types)
        self.subtype_head = nn.Linear(enc_out_dim, num_subtypes)
        self.duration_head = nn.Linear(enc_out_dim, 1)
        self.distance_head = nn.Linear(enc_out_dim, 1)

    def forward(self, x):
        # x: (B, T) token ids
        emb = self.embedding(x)
        out, (h, c) = self.encoder(emb)
        # Take last timestep
        last = out[:, -1, :]
        return {
            'type_logits': self.type_head(last),
            'subtype_logits': self.subtype_head(last),
            'duration': self.duration_head(last).squeeze(-1),
            'distance': self.distance_head(last).squeeze(-1),
        }
