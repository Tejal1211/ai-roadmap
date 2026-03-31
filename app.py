"""
AI Personalized Learning Roadmap Generator
Flask backend using Gemini API with User Login & Dashboard
"""

import os
import json
import re
import hashlib
from datetime import datetime
from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from google import genai
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "ai-roadmap-secret-key-2024")

# ==================== GEMINI CONFIG ====================

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("⚠️ WARNING: GEMINI_API_KEY not set")

client = genai.Client(api_key=GEMINI_API_KEY)


# ==================== ADK AGENT ====================

class RoadmapAgent:
    def __init__(self):
        self.client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

    def generate_roadmap(self, goal, time_available, current_level, extra_notes):
        prompt = build_prompt(goal, time_available, current_level, extra_notes)

        response = self.client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )

        return parse_gemini_response(response.text)

# Create agent instance (reuse)
agent = RoadmapAgent()

# ==================== IN-MEMORY STORAGE ====================

USERS = {}
ROADMAP_HISTORY = {}

# ==================== UTIL FUNCTIONS ====================

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def build_prompt(goal: str, time_available: str, current_level: str, extra_notes: str) -> str:
    return f"""
You are an expert learning coach and AI tutor.

LEARNER PROFILE:
- Goal: {goal}
- Time Available: {time_available}
- Level: {current_level}
- Notes: {extra_notes if extra_notes else "None"}

Respond ONLY in JSON:

{{
  "level_detected": "",
  "feasibility": {{"verdict": "", "explanation": ""}},
  "priority_topics": [],
  "topics_to_skip": [],
  "roadmap": [],
  "burnout_aware_tips": [],
  "revision_strategy": {{}},
  "practice_plan": {{}},
  "smart_tips": [],
  "motivational_message": ""
}}
"""

def parse_gemini_response(raw_text: str) -> dict:
    cleaned = re.sub(r"```(?:json)?\s*", "", raw_text).strip()
    cleaned = re.sub(r"```\s*$", "", cleaned).strip()
    try:
        return json.loads(cleaned)
    except:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError("Invalid JSON from Gemini")

# ==================== AUTH ====================

@app.route("/")
def index():
    if "user_id" not in session:
        return redirect(url_for("login"))
    return redirect(url_for("dashboard"))

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")

    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = USERS.get(email)
    if not user or user["password"] != hash_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    session["user_id"] = email
    session["username"] = user["name"]

    return jsonify({"success": True})

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    USERS[email] = {
        "name": name,
        "email": email,
        "password": hash_password(password),
        "created_at": datetime.now().isoformat()
    }

    ROADMAP_HISTORY[email] = []

    session["user_id"] = email
    session["username"] = name

    return jsonify({"success": True})

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

# ==================== DASHBOARD ====================

@app.route("/dashboard")
def dashboard():
    if "user_id" not in session:
        return redirect(url_for("login"))
    return render_template("dashboard.html", username=session["username"])

# ==================== MAIN API ====================

@app.route("/roadmap", methods=["POST"])
def roadmap():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()

    goal = data.get("goal")
    time_available = data.get("time_available")
    current_level = data.get("current_level", "Beginner")
    extra_notes = data.get("extra_notes", "")

    try:
        roadmap_data = agent.generate_roadmap(
            goal, time_available, current_level, extra_notes
        )

        user_id = session["user_id"]
        ROADMAP_HISTORY[user_id].append({
            "goal": goal,
            "time": time_available,
            "roadmap": roadmap_data
        })

        return jsonify({
            "success": True,
            "roadmap": roadmap_data
        })

    except Exception as e:   # ✅ CORRECT POSITION
        error_msg = str(e)

        # 🔥 Handle Gemini quota error (429)
        if "RESOURCE_EXHAUSTED" in error_msg or "quota" in error_msg.lower():
            return jsonify({
                "error": "⚠️ You have reached the free usage limit. Please try again later."
            }), 429

        # Optional: API key error
        if "API key not valid" in error_msg:
            return jsonify({
                "error": "❌ Invalid API key. Please check configuration."
            }), 401

        # Default error
        return jsonify({
            "error": "Something went wrong. Please try again."
        }), 500
# ==================== HISTORY ====================

@app.route("/history")
def history():
    user_id = session.get("user_id")
    return jsonify(ROADMAP_HISTORY.get(user_id, []))

# ==================== HEALTH ====================

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

# ==================== RUN ====================

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)