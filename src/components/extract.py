from typing import Dict


def structured_extraction(intake: Dict, note: Dict, discharge: Dict) -> Dict:
    return {
        "symptoms": [intake.get("reported_symptom")],
        "severity": intake.get("severity"),
        "duration_days": intake.get("duration_days"),
        "conditions_as_written": [note.get("assessment")],
        "medications": note.get("medications", []),
        "tests_ordered": note.get("tests_ordered", []),
        "follow_up": note.get("follow_up"),
        "red_flags": discharge.get("red_flags", []),
    }
