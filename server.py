from flask import Flask, request, jsonify
from flask_cors import CORS
from model import run_onboarding_model, run_assistant_model

app = Flask(__name__)
CORS(
    app,
    origins=[
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://theffy92.github.io",
    ],
)
# CORS(app,
#     resources={
#         r"/*": {
#             "origins": [
#                 "http://localhost:8000",
#                 "http://127.0.0.1:8000",
#                 "https://theffy92.github.io",
#             ]
#                 }
#             },
#     ) # Allows the GitHub Pages frontend to make requests to the Flask backend

@app.get("/health")
def health():
    """Returns a simple JSON response indicating the server is healthy."""
    return jsonify({"status": "healthy"}) 

@app.post("/chat")
def chat():
    """Generate the next AI-guided onboarding message."""
    data = request.get_json(silent=True) or {}

    step = data.get("step")
    profile = data.get("profile")

    if not isinstance(step, str) or not step.strip():
        return jsonify({"error": "A valid onboarding step is required."}), 400

    if not isinstance(profile, dict):
        return jsonify({"error": "A valid profile object is required."}), 400

    try:
        reply = run_onboarding_model(step.strip(), profile)
        return jsonify({"response": reply})
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except Exception:
        app.logger.exception("The Groq API request failed.")

        return jsonify(
            {
                "error": (
                    "The assistant is temporarily unavailable. "
                    "Please try again later."
                )
            }
        ), 500

@app.post("/assistant")
def assistant():
    """Answer a post-onboarding AI assistant question."""
    data = request.get_json(silent=True) or {}

    message = data.get("message")
    profile = data.get("profile")
    documents = data.get("documents")

    if not isinstance(message, str) or not message.strip():
        return jsonify({"error": "A non-empty message is required."}), 400

    if not isinstance(profile, dict):
        return jsonify({"error": "A valid profile object is required."}), 400

    if not isinstance(documents, list):
        return jsonify({"error": "A valid documents list is required."}), 400

    try:
        reply = run_assistant_model(message.strip(), profile, documents)
        return jsonify({"response": reply})
    except Exception:
        app.logger.exception("The post-onboarding assistant request failed.")

        return jsonify(
            {
                "error": (
                    "The assistant is temporarily unavailable. "
                    "Please try again later."
                )
            }
        ), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)