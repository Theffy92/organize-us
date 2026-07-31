from flask import Flask, request, jsonify
from flask_cors import CORS

from model import run_model

app = Flask(__name__)
CORS(app) # lets GitHub access the API

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()

    if not data or "message" not in data:
        return jsonify({"error": "Missing message"}), 400

    reply = run_model(data["message"])

    return jsonify({
        "response": reply
    })

if __name__ == "__main__":
    app.run(debug=True)