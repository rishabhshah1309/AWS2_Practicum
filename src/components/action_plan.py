from typing import Dict, List


def personalize_action_plan(
    discharge: Dict,
    note: Dict,
    preferences: Dict,
) -> Dict:
    instructions = discharge.get("instructions", [])
    red_flags = discharge.get("red_flags", [])
    follow_up = note.get("follow_up")

    reminder_time = preferences.get("reminder_time", "flexible")
    preferred_language = preferences.get("preferred_language", "English")

    checklist: List[str] = []
    if follow_up:
        checklist.append(f"Schedule follow-up: {follow_up}")
    for item in instructions:
        checklist.append(item)

    return {
        "preferred_language": preferred_language,
        "reminder_time": reminder_time,
        "checklist": checklist,
        "watch_outs": red_flags,
        "personalization_notes": [
            "Instructions reformatted from discharge summary.",
            "No new medical advice added.",
        ],
    }
