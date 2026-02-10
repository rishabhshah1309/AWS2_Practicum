from typing import Dict, List


def match_providers(
    patient: Dict,
    providers: List[Dict],
    suggested_specialties: List[str],
    limit: int = 5,
) -> Dict:
    insurance_id = patient.get("insurance_id")
    preferred = [p for p in providers if p.get("specialty") in suggested_specialties]

    in_network = [
        p for p in preferred
        if insurance_id and insurance_id in p.get("in_network_plans", [])
    ]

    shortlist = in_network if in_network else preferred
    shortlist = shortlist[:limit]

    return {
        "insurance_id": insurance_id,
        "suggested_specialties": suggested_specialties,
        "providers": shortlist,
        "in_network_only": bool(in_network),
    }
