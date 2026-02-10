from pathlib import Path
from typing import Dict, List

from .config import DATASET_DIR, OUTPUT_DIR
from .io_utils import read_json, write_json
from .components.triage import triage_from_intake
from .components.provider_match import match_providers
from .components.summarize import plain_language_summary
from .components.extract import structured_extraction
from .components.consent import consent_review
from .components.billing import reconcile_billing
from .components.action_plan import personalize_action_plan


def load_episode_inputs(episode_id: str) -> Dict:
    base = DATASET_DIR
    return {
        "intake": read_json(base / "intake" / f"{episode_id}.json"),
        "transcript": read_json(base / "transcripts" / f"{episode_id}.json"),
        "clinical_note": read_json(base / "clinical_notes" / f"{episode_id}.json"),
        "discharge": read_json(base / "discharge" / f"{episode_id}.json"),
        "consent": read_json(base / "consent" / f"{episode_id}.json"),
        "billing": read_json(base / "billing" / f"{episode_id}.json"),
        "eob": read_json(base / "eob" / f"{episode_id}.json"),
    }


def run_episode(
    episode: Dict,
    patient: Dict,
    providers: List[Dict],
    output_dir: Path = OUTPUT_DIR,
) -> Dict:
    episode_id = episode["episode_id"]
    inputs = load_episode_inputs(episode_id)

    triage = triage_from_intake(inputs["intake"])
    provider_shortlist = match_providers(patient, providers, triage["suggested_specialties"])
    summary = plain_language_summary(inputs["transcript"], inputs["clinical_note"], inputs["discharge"])
    structured = structured_extraction(inputs["intake"], inputs["clinical_note"], inputs["discharge"])
    consent = consent_review(inputs["consent"])
    billing = reconcile_billing(inputs["billing"], inputs["eob"])

    preferences = read_json(DATASET_DIR / "preferences" / f"{patient['patient_id']}.json")
    action_plan = personalize_action_plan(inputs["discharge"], inputs["clinical_note"], preferences)

    episode_output = {
        "episode_id": episode_id,
        "patient_id": patient["patient_id"],
        "triage": triage,
        "provider_matching": provider_shortlist,
        "summary": summary,
        "structured_extraction": structured,
        "consent_review": consent,
        "billing_reconciliation": billing,
        "action_plan": action_plan,
    }

    write_json(output_dir / "episodes" / f"{episode_id}.json", episode_output)
    return episode_output


def run_all(output_dir: Path = OUTPUT_DIR) -> List[Dict]:
    metadata_dir = DATASET_DIR / "metadata"
    patients = read_json(metadata_dir / "patients.json")
    providers = read_json(metadata_dir / "providers.json")
    episodes = read_json(metadata_dir / "episodes.json")

    patient_lookup = {p["patient_id"]: p for p in patients}

    results = []
    for episode in episodes:
        patient = patient_lookup.get(episode["patient_id"])
        if not patient:
            continue
        results.append(run_episode(episode, patient, providers, output_dir))

    episode_files = sorted(p.name for p in (output_dir / "episodes").glob("*.json"))
    write_json(output_dir / "episodes" / "index.json", {
        "episodes": episode_files,
        "total": len(episode_files),
    })

    write_json(output_dir / "summary.json", {
        "total_episodes": len(results),
        "output_dir": str(output_dir),
    })
    return results
