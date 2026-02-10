from typing import Dict


def plain_language_summary(transcript: Dict, note: Dict, discharge: Dict) -> Dict:
    summary_parts = []

    transcript_text = transcript.get("transcript")
    if transcript_text:
        summary_parts.append("Visit summary: " + transcript_text)

    assessment = note.get("assessment")
    if assessment:
        summary_parts.append("Assessment: " + assessment)

    follow_up = note.get("follow_up")
    if follow_up:
        summary_parts.append("Follow-up: " + follow_up)

    instructions = discharge.get("instructions", [])
    if instructions:
        summary_parts.append("Discharge instructions: " + "; ".join(instructions))

    red_flags = discharge.get("red_flags", [])
    if red_flags:
        summary_parts.append("Watch-outs: " + ", ".join(red_flags))

    return {
        "plain_language_summary": " ".join(summary_parts).strip(),
        "source_based_only": True,
    }
