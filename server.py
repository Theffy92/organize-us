from flask import Flask, request, jsonify
from flask_cors import CORS
from model import run_model

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
    """Receives a message from the user, processes it using the model, and returns the model's response."""
    data = request.get_json(silent=True) or {}
    message = data.get("message")

    if not isinstance(message, str) or not message.strip():
        return jsonify({"error": "Invalid input. Please provide a non-empty message."}), 400

    message = message.strip()

    if len(message) > 2000:
        return jsonify({"error": "Input message is too long. Please limit to 2000 characters."}), 400

    try:
        reply = run_model(message)
        return jsonify({"response": reply})
    except Exception:
        app.logger.exception("The Groq API request failed.")
        return jsonify(
            {
                "error": "The assistant is temporarily unavailable. Please try again later."
            }
        ), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)