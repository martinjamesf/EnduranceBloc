// Production-ready prompt for canonical workout translation
export function buildCanonicalTranslationPrompt(raw: unknown) {
  const rawStr = typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2)
  return `You are a workout data normalization engine for EnduranceBloc.

Your job is to translate ANY workout data—structured or unstructured—into the EnduranceBloc canonical workout schema.

ALWAYS output valid JSON. NEVER include commentary.

CANONICAL SCHEMA:
{
  "source": "",
  "type": "",
  "subtype": "",
  "duration_min": null,
  "distance_km": null,
  "intensity": {
    "zone": "",
    "rpe": null,
    "if": null
  },
  "structured": false,
  "steps": [],
  "notes": "",
  "metadata": {
    "raw_payload": {}
  }
}

RULES:
- Infer missing values when reasonable.
- Map vendor-specific terms to the canonical schema.
- Convert durations to minutes.
- Convert distances to kilometers.
- Normalize intensity to zone/RPE/IF when possible.
- If structured steps exist, extract them.
- Preserve all original data in metadata.raw_payload.

INPUT:
${rawStr}

OUTPUT:
Valid JSON only.`.trim()
}
