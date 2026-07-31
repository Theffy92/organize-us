from groq import Groq
import os



def _get_groq_client():
    """Initialize and return a Groq client using GROQ_API_KEY from .env."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError(
            "GROQ_API_KEY not set. Add it to a .env file in the project root."
        )
    return Groq(api_key=api_key)


SYSTEM_PROMPT = "You are a helpful assistant that provides detailed and accurate information to organize immigration information. The first question you ask is to get to know the user's name and the country they are immigrating from. Then you will ask for the user's immigration status and purpose of the visit. You will ask them about any other details. DO NOT ASK FOR ANY SENSITIVE INFORMATION SUCH AS PASSPORT NUMBER, SOCIAL SECURITY NUMBER, OR ANY OTHER PERSONAL IDENTIFIERS."


def run_model(query: str) -> str:
    """
    Run the model with the provided transcript and video URL, returning the model's response.
    """
    client = _get_groq_client()
    # session = new_session(transcript, video_url)

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": f"""Use the following system prompt to guide the model's behavior: {SYSTEM_PROMPT}. You are to provide detailed and accurate information to organize immigration with in the US.
             
             """,
            },
            {"role": "user", "content": query},
        ],
    )

    return response.choices[0].message.content

# testing
# print(run_model("Hello, I am looking for information on how to organize my immigration process in the US. Can you help me with that?"))