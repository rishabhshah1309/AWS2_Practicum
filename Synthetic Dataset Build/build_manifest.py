import json
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path("synthetic_dataset")
OUTPUT_PATH = BASE_DIR / "manifest.json"


def build_manifest():
    if not BASE_DIR.exists():
        raise FileNotFoundError(f"{BASE_DIR} does not exist")

    categories = {}
    for subdir in sorted(p for p in BASE_DIR.iterdir() if p.is_dir()):
        files = sorted(f.name for f in subdir.glob("*.json"))
        if files:
            categories[subdir.name] = files

    total_files = sum(len(files) for files in categories.values())
    manifest = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "total_files": total_files,
        "categories": categories,
    }

    OUTPUT_PATH.write_text(json.dumps(manifest, indent=2))
    print(f"Wrote {OUTPUT_PATH} with {total_files} files.")


if __name__ == "__main__":
    build_manifest()
