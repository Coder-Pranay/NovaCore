"""Adult-only prompt guard for the Moss photographic LoRA."""

from __future__ import annotations

import re

TRIGGER = "moss_xvstyle"

# Blocks sexual/age-ambiguous prompts involving minors. Adult content is allowed.
_BLOCKED = re.compile(
    r"\b("
    r"child|children|kid|kids|toddler|infant|baby|babies|"
    r"minor|underage|under[\s-]?age|under[\s-]?18|"
    r"teen(?!age adult)|teenager|preteen|pre-teen|"
    r"loli|lolita|shota|shotacon|pedophile|pedo|"
    r"schoolgirl|schoolboy|young girl|young boy|"
    r"age[\s-]?play"
    r")\b",
    re.IGNORECASE,
)


class PromptRejected(ValueError):
    pass


def ensure_adult_prompt(prompt: str) -> str:
    text = (prompt or "").strip()
    if not text:
        raise PromptRejected("Prompt is required")
    if _BLOCKED.search(text):
        raise PromptRejected(
            "This generator only allows clearly adult fictional subjects. "
            "Remove any wording that describes minors or age-ambiguous people."
        )
    if not text.lower().startswith(TRIGGER):
        text = f"{TRIGGER}, {text}"
    return text
