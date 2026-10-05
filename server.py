import hashlib
import os
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from functools import wraps

from flask import Flask, g, jsonify, make_response, request
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

from model import run_assistant_model, run_onboarding_model

app = Flask(__name__)
CORS(
    app,
    origins=[
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://theffy92.github.io",
    ],
    supports_credentials=True,
)

DATABASE_PATH = os.environ.get(
    "ORGANIZE_US_DATABASE",
    os.path.join(os.path.dirname(__file__), "organize_us.db"),
)
SESSION_COOKIE = "organize_us_session"
SESSION_DAYS = 7
SUPPORTED_PROCESSES = {"permanent-residency", "naturalization", "f1-visa"}


def utc_now():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
        g.db.execute("PRAGMA busy_timeout = 5000")
    return g.db


@app.teardown_appcontext
def close_db(_error=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = get_db()
    db.executescript(
        """
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE COLLATE NOCASE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TEXT NOT NULL,
            created_at TEXT NOT NULL,
            revoked_at TEXT
        );
        CREATE TABLE IF NOT EXISTS profiles (
            user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL DEFAULT '',
            country TEXT NOT NULL DEFAULT '',
            immigration_process TEXT NOT NULL DEFAULT '',
            onboarding_completed INTEGER NOT NULL DEFAULT 0,
            travel_reviewed INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            status TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            location TEXT NOT NULL DEFAULT '',
            expiry TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS trips (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            country TEXT NOT NULL,
            departure TEXT NOT NULL,
            return_date TEXT NOT NULL,
            duration INTEGER NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS assistant_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS sessions_token_hash_idx ON sessions(token_hash);
        CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents(user_id);
        CREATE INDEX IF NOT EXISTS trips_user_id_idx ON trips(user_id);
        CREATE INDEX IF NOT EXISTS assistant_messages_user_id_idx ON assistant_messages(user_id);
        """
    )
    db.commit()


def hash_token(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_session(user_id):
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    db = get_db()
    db.execute(
        "INSERT INTO sessions (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)",
        (
            user_id,
            hash_token(token),
            (now + timedelta(days=SESSION_DAYS)).replace(microsecond=0).isoformat(),
            now.replace(microsecond=0).isoformat(),
        ),
    )
    db.commit()
    return token


def current_user():
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None

    user = get_db().execute(
        """
        SELECT users.id, users.email, profiles.name, profiles.country,
               profiles.immigration_process, profiles.onboarding_completed,
               profiles.travel_reviewed
        FROM sessions
        JOIN users ON users.id = sessions.user_id
        JOIN profiles ON profiles.user_id = users.id
        WHERE sessions.token_hash = ?
          AND sessions.revoked_at IS NULL
          AND sessions.expires_at > ?
        """,
        (hash_token(token), utc_now()),
    ).fetchone()
    return user


def require_auth(handler):
    @wraps(handler)
    def wrapped(*args, **kwargs):
        user = current_user()
        if user is None:
            return jsonify({"error": "Authentication is required."}), 401
        g.user = user
        return handler(*args, **kwargs)

    return wrapped


def user_payload(user):
    return {
        "id": user["id"],
        "email": user["email"],
        "profile": {
            "name": user["name"],
            "country": user["country"],
            "immigrationProcess": user["immigration_process"],
            "onboardingCompleted": bool(user["onboarding_completed"]),
            "travelReviewed": bool(user["travel_reviewed"]),
        },
    }


def session_response(payload, token):
    response = make_response(jsonify(payload))
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=SESSION_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=os.environ.get("FLASK_ENV") == "production",
        samesite="None" if os.environ.get("FLASK_ENV") == "production" else "Lax",
        path="/",
    )
    return response


def checklist_for(process):
    names = {
        "naturalization": [
            "Permanent Resident Card (Green Card)",
            "Valid Passport",
            "Tax Records",
        ],
        "permanent-residency": [
            "Identity Document",
            "Valid Passport",
            "Birth Certificate",
            "Proof of Residence",
            "Financial Records",
        ],
        "f1-visa": [
            "I-20 Form",
            "Valid Passport",
            "Financial Support Documents",
            "Visa application form (DS-160)",
        ],
    }
    return names.get(process, [])


@app.before_request
def ensure_database():
    init_db()

@app.get("/health")
def health():
    """Returns a simple JSON response indicating the server is healthy."""
    return jsonify({"status": "healthy"}) 


@app.post("/api/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if "@" not in email or len(email) > 254:
        return jsonify({"error": "Enter a valid email address."}), 422
    if not isinstance(password, str) or len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 422

    now = utc_now()
    db = get_db()
    try:
        cursor = db.execute(
            "INSERT INTO users (email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)",
            (email, generate_password_hash(password, method="scrypt"), now, now),
        )
        user_id = cursor.lastrowid
        db.execute(
            "INSERT INTO profiles (user_id, updated_at) VALUES (?, ?)",
            (user_id, now),
        )
        db.commit()
    except sqlite3.IntegrityError:
        db.rollback()
        return jsonify({"error": "An account with that email already exists."}), 409

    user = db.execute(
        "SELECT users.id, users.email, profiles.name, profiles.country, profiles.immigration_process, profiles.onboarding_completed, profiles.travel_reviewed FROM users JOIN profiles ON profiles.user_id = users.id WHERE users.id = ?",
        (user_id,),
    ).fetchone()
    return session_response({"user": user_payload(user)}, create_session(user_id))


@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    user = get_db().execute(
        "SELECT users.id, users.email, users.password_hash, profiles.name, profiles.country, profiles.immigration_process, profiles.onboarding_completed, profiles.travel_reviewed FROM users JOIN profiles ON profiles.user_id = users.id WHERE users.email = ?",
        (email,),
    ).fetchone()

    if user is None or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Email or password is incorrect."}), 401
    return session_response({"user": user_payload(user)}, create_session(user["id"]))


@app.get("/api/auth/me")
def me():
    user = current_user()
    if user is None:
        return jsonify({"error": "Authentication is required."}), 401
    return jsonify({"user": user_payload(user)})


@app.post("/api/auth/logout")
def logout():
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        get_db().execute(
            "UPDATE sessions SET revoked_at = ? WHERE token_hash = ?",
            (utc_now(), hash_token(token)),
        )
        get_db().commit()
    response = make_response(jsonify({"ok": True}))
    response.delete_cookie(SESSION_COOKIE, path="/")
    return response


@app.post("/api/onboarding/complete")
@require_auth
def complete_onboarding():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    country = data.get("country", "").strip()
    process = data.get("immigrationProcess", "").strip()
    if not name or not country or process not in SUPPORTED_PROCESSES:
        return jsonify({"error": "Complete all onboarding fields."}), 422

    db = get_db()
    now = utc_now()
    try:
        db.execute("BEGIN")
        db.execute(
            "UPDATE profiles SET name = ?, country = ?, immigration_process = ?, onboarding_completed = 1, updated_at = ? WHERE user_id = ?",
            (name[:120], country[:120], process, now, g.user["id"]),
        )
        db.execute("DELETE FROM documents WHERE user_id = ?", (g.user["id"],))
        for document_name in checklist_for(process):
            db.execute(
                "INSERT INTO documents (id, user_id, name, status, created_at, updated_at) VALUES (?, ?, ?, 'Missing', ?, ?)",
                (secrets.token_hex(16), g.user["id"], document_name, now, now),
            )
        db.commit()
    except Exception:
        db.rollback()
        raise
    return app_data_response()


def app_data_response():
    db = get_db()
    profile = db.execute(
        "SELECT name, country, immigration_process, onboarding_completed, travel_reviewed FROM profiles WHERE user_id = ?",
        (g.user["id"],),
    ).fetchone()
    documents = db.execute(
        "SELECT id, name, status, completed, location, expiry FROM documents WHERE user_id = ? ORDER BY created_at",
        (g.user["id"],),
    ).fetchall()
    trips = db.execute(
        "SELECT id, country, departure, return_date AS returnDate, duration FROM trips WHERE user_id = ? ORDER BY departure",
        (g.user["id"],),
    ).fetchall()
    messages = db.execute(
        "SELECT role, content FROM assistant_messages WHERE user_id = ? ORDER BY id",
        (g.user["id"],),
    ).fetchall()
    return jsonify({
        "profile": {
            "name": profile["name"],
            "country": profile["country"],
            "immigrationProcess": profile["immigration_process"],
        },
        "documents": [dict(item) for item in documents],
        "trips": [dict(item) for item in trips],
        "assistant": {"messages": [dict(item) for item in messages]},
        "travelReviewed": bool(profile["travel_reviewed"]),
        "onboardingCompleted": bool(profile["onboarding_completed"]),
    })


@app.get("/api/app-data")
@require_auth
def app_data():
    return app_data_response()


@app.delete("/api/app-data")
@require_auth
def reset_app_data():
    db = get_db()
    db.execute("DELETE FROM documents WHERE user_id = ?", (g.user["id"],))
    db.execute("DELETE FROM trips WHERE user_id = ?", (g.user["id"],))
    db.execute("DELETE FROM assistant_messages WHERE user_id = ?", (g.user["id"],))
    db.execute(
        "UPDATE profiles SET name = '', country = '', immigration_process = '', onboarding_completed = 0, travel_reviewed = 0, updated_at = ? WHERE user_id = ?",
        (utc_now(), g.user["id"]),
    )
    db.commit()
    return jsonify({"ok": True})


@app.post("/api/documents")
@require_auth
def create_document():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    status = str(data.get("status", "Missing")).strip()
    if not name or len(name) > 200:
        return jsonify({"error": "A document name is required."}), 422
    document = {
        "id": secrets.token_hex(16),
        "name": name,
        "status": status[:80],
        "completed": status == "On file",
        "location": str(data.get("location", "")).strip()[:200],
        "expiry": str(data.get("expiry", "")).strip()[:200],
    }
    now = utc_now()
    get_db().execute(
        "INSERT INTO documents (id, user_id, name, status, completed, location, expiry, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (document["id"], g.user["id"], document["name"], document["status"], int(document["completed"]), document["location"], document["expiry"], now, now),
    )
    get_db().commit()
    return jsonify({"document": document}), 201


@app.patch("/api/documents/<document_id>")
@require_auth
def update_document(document_id):
    data = request.get_json(silent=True) or {}
    completed = bool(data.get("completed"))
    status = "On file" if completed else "Missing"
    cursor = get_db().execute(
        "UPDATE documents SET completed = ?, status = ?, updated_at = ? WHERE id = ? AND user_id = ?",
        (int(completed), status, utc_now(), document_id, g.user["id"]),
    )
    get_db().commit()
    if cursor.rowcount == 0:
        return jsonify({"error": "Document not found."}), 404
    return jsonify({"ok": True})


@app.post("/api/trips")
@require_auth
def create_trip():
    data = request.get_json(silent=True) or {}
    country = str(data.get("country", "")).strip()
    departure = str(data.get("departure", "")).strip()
    return_date = str(data.get("returnDate", "")).strip()
    duration = int(data.get("duration", 0) or 0)
    if not country or not departure or not return_date or duration < 1:
        return jsonify({"error": "Complete the trip details."}), 422
    trip = {
        "id": secrets.token_hex(16),
        "country": country[:120],
        "departure": departure,
        "returnDate": return_date,
        "duration": duration,
    }
    get_db().execute(
        "INSERT INTO trips (id, user_id, country, departure, return_date, duration, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (trip["id"], g.user["id"], trip["country"], trip["departure"], trip["returnDate"], trip["duration"], utc_now()),
    )
    get_db().execute(
        "UPDATE profiles SET travel_reviewed = 1, updated_at = ? WHERE user_id = ?",
        (utc_now(), g.user["id"]),
    )
    get_db().commit()
    return jsonify({"trip": trip}), 201


@app.delete("/api/trips/<trip_id>")
@require_auth
def delete_trip(trip_id):
    cursor = get_db().execute(
        "DELETE FROM trips WHERE id = ? AND user_id = ?",
        (trip_id, g.user["id"]),
    )
    get_db().commit()
    if cursor.rowcount == 0:
        return jsonify({"error": "Trip not found."}), 404
    return jsonify({"ok": True})

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
@require_auth
def assistant():
    """Answer a post-onboarding AI assistant question."""
    data = request.get_json(silent=True) or {}

    message = data.get("message")

    if not isinstance(message, str) or not message.strip():
        return jsonify({"error": "A non-empty message is required."}), 400

    profile_row = get_db().execute(
        "SELECT name, country, immigration_process AS immigrationProcess FROM profiles WHERE user_id = ?",
        (g.user["id"],),
    ).fetchone()
    documents = get_db().execute(
        "SELECT id, name, status, completed, location, expiry FROM documents WHERE user_id = ?",
        (g.user["id"],),
    ).fetchall()
    profile = dict(profile_row)
    document_data = [dict(document) for document in documents]

    try:
        reply = run_assistant_model(message.strip(), profile, document_data)
        now = utc_now()
        db = get_db()
        db.executemany(
            "INSERT INTO assistant_messages (user_id, role, content, created_at) VALUES (?, ?, ?, ?)",
            [(g.user["id"], "user", message.strip(), now), (g.user["id"], "assistant", reply, now)],
        )
        db.commit()
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
    app.run(debug=True, port=5050)