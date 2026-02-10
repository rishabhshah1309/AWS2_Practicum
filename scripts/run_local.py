from pathlib import Path
import sys

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

from src.pipeline import run_all
from src.config import OUTPUT_DIR


if __name__ == "__main__":
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    results = run_all(OUTPUT_DIR)
    print(f"Generated outputs for {len(results)} episodes in {OUTPUT_DIR}")
