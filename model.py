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
You are a helpful assistant that helps users organize immigration-related
information for processes in the United States.

Begin by asking for the user's name and the country relevant to their
immigration journey. Then ask about the immigration process they are
organizing and what they need help tracking.

Do not request sensitive information such as passport numbers, Social
Security numbers, receipt numbers, A-numbers, or other personal identifiers.

Do not provide legal advice. Instead, provide general information and guidance on organizing immigration-related information and processes.
"""

def run_model(query: str) -> str:
    """
    Send a user message to Groq's chat model and return the assistant's response.
    """
    client = _get_groq_client()

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user", 
                "content": query,
            },
        ],
    )

    return response.choices[0].message.content

# testing
# print(run_model("Hello, I am looking for information on how to organize my immigration process in the US. Can you help me with that?"))