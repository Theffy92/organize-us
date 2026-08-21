import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

def _get_groq_client():
    """Initialize and return a Groq client using GROQ_API_KEY from .env."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError(
            "GROQ_API_KEY not set. Add it to a .env file in the project root."
            "or deployment environment variables."
        )
    return Groq(api_key=api_key)


SYSTEM_PROMPT = """
You are the AI onboarding guide for OrganizeUS, an immigration
organization application.

Your role is to guide users through a short onboarding flow so the
application can personalize their checklist and organization tools.

Rules:
- Keep responses brief and friendly.
- Ask only one question at a time.
- Do not provide legal advice.
- Do not determine eligibility.
- Do not request sensitive identifiers such as Social Security numbers,
passport numbers, A-numbers, or receipt numbers.
- The prototype currently supports Permanent Residency, Naturalization,
and F-1 Student Visa.
"""
def build_onboarding_prompt(step: str, profile: dict) -> str:
    """Create the prompt for the current onboarding transition."""
    name = profile.get("name", "").strip()
    country = profile.get("country", "").strip()
    process = profile.get("immigrationProcess", "").strip()

    process_labels = {
        "permanent-residency": "Permanent Residency",
        "naturalization": "Naturalization",
        "f1-visa": "F-1 Student Visa",
    }

    if step == "name-completed":
        return (
            f"The user's profile name is {name}. "
            "Briefly greet them by name and ask which country is relevant "
            "to their U.S. immigration journey."
        )

    if step == "country-completed":
        return (
            f"The user's name is {name}, and the country relevant to their "
            f"immigration journey is {country}. Briefly acknowledge their "
            "answer and ask which immigration process they are organizing. "
            "Mention that the available options are Permanent Residency, "
            "Naturalization, and F-1 Student Visa."
        )

    if step == "process-completed":
        selected_process = process_labels.get(process, process)

        return (
            f"The user's name is {name}, the relevant country is {country}, "
            f"and they selected {selected_process}. Confirm their selection "
            "in one or two short sentences. Explain that OrganizeUS will "
            "prepare a personalized checklist and organization tools."
        )

    raise ValueError("Unsupported onboarding step.")


def run_onboarding_model(step: str, profile: dict) -> str:
    """Generate the AI message for an onboarding transition."""
    client = _get_groq_client()
    user_prompt = build_onboarding_prompt(step, profile)

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        reasoning_effort="low",
        include_reasoning=False,
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ],
    )

    return response.choices[0].message.content

ASSISTANT_SYSTEM_PROMPT = """
You are the OrganizeUS AI assistant.

Your role is to help users organize immigration-related information.

You may:
- Explain immigration terminology in plain language.
- Explain why a document may be useful for organizing a process.
- Suggest organizational next steps based on the user's saved checklist.
- Answer general immigration-process questions.

Rules:
- Do not provide legal advice.
- Do not determine eligibility.
- Do not tell users what they must file.
- Encourage users to verify requirements with official government sources.
- Do not request sensitive identifiers such as Social Security numbers,
passport numbers, A-numbers, or receipt numbers.
- Keep responses concise and easy to understand.
"""

def run_assistant_model(message: str, profile: dict, documents: list) -> str:
    """Answer a post-onboarding question using the user's saved app context."""
    client = _get_groq_client()

    # Build the context for the assistant model
    context = {
        "profile": profile,
        "documents": documents,
    }

    response = client.chat.completions.create(
        reasoning_effort="low",
        include_reasoning=False,
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": ASSISTANT_SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": (
                    f"Application context: {context}\n\n"
                    f"User question: {message}"
                ),
            },
        ],
    )

    return response.choices[0].message.content