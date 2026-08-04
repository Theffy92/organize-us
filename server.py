from flask import Flask, request, jsonify
from flask_cors import CORS
from model import run_onboarding_model

app = Flask(__name__)
CORS(app,
    resources={
        r"/chat": {
            "origins": [
                "http://localhost:8000",
                "https://theffy92.github.io",
            ]
                }
            },
    ) # Allows the GitHub Pages frontend to make requests to the Flask backend

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

if __name__ == "__main__":
    app.run(debug=True, port=5000)