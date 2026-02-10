from typing import Dict


def consent_review(consent: Dict) -> Dict:
    clauses = consent.get("clauses", [])
    missing = consent.get("missing_fields", [])

    before_you_sign = {
        "key_commitments": clauses[:1],
        "confusing_or_vague": clauses[1:2],
        "missing_fields": missing,
        "questions_to_ask": [
            "What costs are my responsibility?",
            "Who should I contact with billing questions?",
        ]
    }

    return {
        "document_type": consent.get("document_type"),
        "summary": "; ".join(clauses),
        "before_you_sign": before_you_sign,
    }
