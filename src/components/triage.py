from typing import Dict, List

SPECIALTY_RULES = {
    "chest pain": ["Cardiology", "Primary Care"],
    "shortness of breath": ["Pulmonology", "Primary Care"],
    "knee pain": ["Orthopedics", "Primary Care"],
    "abdominal": ["Gastroenterology", "Primary Care"],
    "skin": ["Dermatology", "Primary Care"],
    "fatigue": ["Primary Care"],
}

DEFAULT_SPECIALTIES = ["Primary Care"]


def triage_from_intake(intake: Dict) -> Dict:
    symptom = (intake.get("reported_symptom") or "").lower()
    severity = intake.get("severity", "unspecified")
    duration = intake.get("duration_days", "unknown")
    free_text = intake.get("free_text", "").strip()

    suggested: List[str] = []
    for key, options in SPECIALTY_RULES.items():
        if key in symptom:
            suggested = options
            break
    if not suggested:
        suggested = DEFAULT_SPECIALTIES

    summary = (
        f"Reported symptom: {symptom or 'unspecified'} (severity: {severity}, "
        f"duration: {duration} days)."
    )
    if free_text:
        summary += f" Patient notes: {free_text}"

    return {
        "triage_summary": summary,
        "suggested_specialties": suggested,
        "non_diagnostic": True,
    }
