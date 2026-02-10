import json
import random
import uuid
from datetime import datetime, timedelta
from pathlib import Path

# -----------------------------
# Config
# -----------------------------
NUM_PATIENTS = 25
VISITS_PER_PATIENT = (1, 3)
BASE_DIR = Path("synthetic_dataset")

random.seed(42)

# -----------------------------
# Reference Pools
# -----------------------------
SPECIALTIES = [
    "Primary Care", "Cardiology", "Orthopedics",
    "Dermatology", "Gastroenterology", "OB-GYN"
]

SYMPTOMS = [
    ("chest pain", "moderate"),
    ("shortness of breath", "mild"),
    ("knee pain", "severe"),
    ("abdominal discomfort", "moderate"),
    ("skin rash", "mild"),
    ("fatigue", "moderate")
]

MEDS = [
    "ibuprofen", "acetaminophen", "lisinopril",
    "omeprazole", "amoxicillin"
]

CONSENT_TYPES = [
    "Procedure Consent",
    "HIPAA Authorization",
    "Financial Responsibility Agreement"
]

BILL_TYPES = [
    "Facility Fee", "Professional Fee",
    "Laboratory", "Imaging", "Anesthesia"
]

LANGUAGES = ["English", "Spanish"]
SCHEDULES = ["morning", "evening", "flexible"]

# -----------------------------
# Helpers
# -----------------------------
def uid(prefix):
    return f"{prefix}_{uuid.uuid4().hex[:8]}"

def random_date(days_back=90):
    return datetime.today() - timedelta(days=random.randint(1, days_back))

def ensure_dirs():
    for sub in [
        "metadata", "intake", "transcripts", "clinical_notes",
        "discharge", "consent", "billing", "eob", "preferences"
    ]:
        (BASE_DIR / sub).mkdir(parents=True, exist_ok=True)

# -----------------------------
# Generators
# -----------------------------
def generate_patients():
    patients = []
    for _ in range(NUM_PATIENTS):
        pid = uid("patient")
        patients.append({
            "patient_id": pid,
            "age_range": random.choice(["18-30", "31-45", "46-60", "60+"]),
            "language": random.choice(LANGUAGES),
            "caregiver": random.choice([True, False]),
            "insurance_id": uid("plan")
        })
    return patients

def generate_providers():
    providers = []
    for _ in range(15):
        providers.append({
            "provider_id": uid("prov"),
            "specialty": random.choice(SPECIALTIES),
            "location": random.choice(["CA", "NY", "TX"]),
            "in_network_plans": [uid("plan") for _ in range(2)]
        })
    return providers

def generate_episode(patient, providers):
    provider = random.choice(providers)
    visit_date = random_date()
    return {
        "episode_id": uid("episode"),
        "patient_id": patient["patient_id"],
        "provider_id": provider["provider_id"],
        "specialty": provider["specialty"],
        "visit_date": visit_date.strftime("%Y-%m-%d")
    }

def generate_intake(ep):
    symptom, severity = random.choice(SYMPTOMS)
    return {
        "episode_id": ep["episode_id"],
        "reported_symptom": symptom,
        "severity": severity,
        "duration_days": random.randint(1, 30),
        "free_text": f"I have been experiencing {symptom} for a few days."
    }

def generate_transcript(ep):
    return {
        "episode_id": ep["episode_id"],
        "transcript": (
            "Patient describes symptoms. "
            "Provider explains possible causes, "
            "next steps, and follow-up recommendations."
        )
    }

def generate_clinical_note(ep):
    return {
        "episode_id": ep["episode_id"],
        "assessment": "Symptoms reviewed as documented.",
        "medications": random.sample(MEDS, k=2),
        "tests_ordered": ["blood work", "x-ray"],
        "follow_up": "Schedule follow-up in 2 weeks."
    }

def generate_discharge(ep):
    return {
        "episode_id": ep["episode_id"],
        "instructions": [
            "Take medications as prescribed.",
            "Monitor symptoms daily.",
            "Avoid strenuous activity for 7 days."
        ],
        "red_flags": [
            "worsening pain",
            "fever above 101F",
            "shortness of breath"
        ]
    }

def generate_consent(ep):
    return {
        "episode_id": ep["episode_id"],
        "document_type": random.choice(CONSENT_TYPES),
        "clauses": [
            "You may be financially responsible for uncovered services.",
            "This authorization may be revoked at any time in writing."
        ],
        "missing_fields": random.choice([[], ["provider signature", "date"]])
    }

def generate_billing(ep):
    bills = []
    for bill_type in random.sample(BILL_TYPES, k=random.randint(2, 4)):
        bills.append({
            "episode_id": ep["episode_id"],
            "bill_type": bill_type,
            "amount": round(random.uniform(50, 1200), 2),
            "date_of_service": ep["visit_date"]
        })
    return bills

def generate_eob(ep, bills):
    return {
        "episode_id": ep["episode_id"],
        "total_billed": sum(b["amount"] for b in bills),
        "patient_responsibility": round(sum(b["amount"] for b in bills) * 0.2, 2),
        "notes": "Amounts subject to deductible and co-insurance."
    }

def generate_preferences(patient):
    return {
        "patient_id": patient["patient_id"],
        "reminder_time": random.choice(SCHEDULES),
        "detail_level": random.choice(["high", "medium", "low"]),
        "preferred_language": patient["language"]
    }

# -----------------------------
# Main
# -----------------------------
def main():
    ensure_dirs()

    patients = generate_patients()
    providers = generate_providers()

    episodes = []

    for p in patients:
        visits = random.randint(*VISITS_PER_PATIENT)
        for _ in range(visits):
            ep = generate_episode(p, providers)
            episodes.append(ep)

            # Generate docs
            intake = generate_intake(ep)
            transcript = generate_transcript(ep)
            note = generate_clinical_note(ep)
            discharge = generate_discharge(ep)
            consent = generate_consent(ep)
            bills = generate_billing(ep)
            eob = generate_eob(ep, bills)

            # Write files
            def dump(sub, name, obj):
                with open(BASE_DIR / sub / f"{name}.json", "w") as f:
                    json.dump(obj, f, indent=2)

            dump("intake", ep["episode_id"], intake)
            dump("transcripts", ep["episode_id"], transcript)
            dump("clinical_notes", ep["episode_id"], note)
            dump("discharge", ep["episode_id"], discharge)
            dump("consent", ep["episode_id"], consent)
            dump("billing", ep["episode_id"], bills)
            dump("eob", ep["episode_id"], eob)

        pref = generate_preferences(p)
        with open(BASE_DIR / "preferences" / f"{p['patient_id']}.json", "w") as f:
            json.dump(pref, f, indent=2)

    # Metadata
    with open(BASE_DIR / "metadata" / "patients.json", "w") as f:
        json.dump(patients, f, indent=2)

    with open(BASE_DIR / "metadata" / "providers.json", "w") as f:
        json.dump(providers, f, indent=2)

    with open(BASE_DIR / "metadata" / "episodes.json", "w") as f:
        json.dump(episodes, f, indent=2)

    print("✅ Synthetic healthcare dataset generated.")

if __name__ == "__main__":
    main()
