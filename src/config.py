from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DATASET_DIR = BASE_DIR / "Synthetic Dataset Build" / "synthetic_dataset"
OUTPUT_DIR = BASE_DIR / "outputs"

CATEGORIES = [
    "metadata",
    "intake",
    "transcripts",
    "clinical_notes",
    "discharge",
    "consent",
    "billing",
    "eob",
    "preferences",
]
