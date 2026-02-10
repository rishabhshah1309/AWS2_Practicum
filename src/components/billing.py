from typing import Dict, List
from collections import defaultdict


def reconcile_billing(bills: List[Dict], eob: Dict) -> Dict:
    grouped = defaultdict(list)
    for bill in bills:
        grouped[bill.get("bill_type", "Unknown")].append(bill)

    totals = {k: round(sum(b.get("amount", 0) for b in v), 2) for k, v in grouped.items()}

    return {
        "grouped_charges": grouped,
        "totals_by_type": totals,
        "total_billed": eob.get("total_billed"),
        "patient_responsibility": eob.get("patient_responsibility"),
        "verification_checklist": [
            "Verify dates of service and provider entity",
            "Check for duplicate charges",
            "Confirm network status for each biller",
        ],
    }
