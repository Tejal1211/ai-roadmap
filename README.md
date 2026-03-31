# 🧠 AI Personalized Learning Roadmap Generator

> A production-ready AI agent built with **Gemini 2.0 Flash** + **Flask** that generates fully personalized learning roadmaps. Features user authentication, a creative tech dashboard with sidebar navigation, and full Cloud Run deployment support.

---

## ✨ Features

| Feature | Description |
|---|---|
| 👤 User Auth | Register / Login with session management |
| 🎯 Priority Topics | The 20% that gives 80% of results |
| 🚫 Skip Optimizer | Topics to avoid to save time |
| ✅ Feasibility Check | Is your goal realistic? |
| 🤖 Level Auto-Detection | AI detects your actual skill level |
| ❤️ Burnout Guard | Pacing and mental health tips |
| 📅 Time-Based Plan | Daily or weekly schedule |
| 🔁 Revision Strategy | Spaced repetition built in |
| 💪 Practice Planning | Milestones and project ideas |
| 💡 Smart Tips | Goal-specific expert advice |
| 📊 Analytics | Track your learning history |
| 🗂 History | View all past roadmaps |

---

## 📦 Project Structure

```
ai-roadmap-generator/
├── app.py                    # Flask backend (auth + Gemini API)
├── templates/
│   ├── login.html            # Login / Register page
│   └── dashboard.html        # Main dashboard with sidebar
├── static/
│   ├── style.css             # Light tech animated UI styles
│   └── script.js             # Dashboard logic + rendering
├── requirements.txt          # Python dependencies
├── Dockerfile                # Cloud Run deployment
├── .env.example              # Environment variable template
└── README.md                 # This file
```

---

## 🛠️ Local Setup

### Step 1: Create project folder and extract files

```bash
mkdir ai-roadmap-generator
cd ai-roadmap-generator
# Extract or copy all files here
```

### Step 2: Create Python virtual environment

```bash
python -m venv venv

# Activate:
# Mac/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

### Step 3: Install dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Get Gemini API Key

1. Go to: https://aistudio.google.com/app/apikey
2. Click **Create API Key**
3. Copy the key

### Step 5: Set up environment

```bash
cp .env.example .env
# Edit .env:
GEMINI_API_KEY=your_key_here
SECRET_KEY=any_random_string_here
```

### Step 6: Run the app

```bash
python app.py
```

Open **http://localhost:8080**

---

## 👤 Demo Account

On the login page, click **"Fill demo credentials"** to auto-fill:
- Email: `demo@roadmap.ai`
- Password: `demo123`

Or create your own account with the **Register** tab.

---

## 🌐 API Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/login` | GET | No | Login page |
| `/login` | POST | No | Authenticate user |
| `/register` | POST | No | Create account |
| `/logout` | GET | Yes | Sign out |
| `/dashboard` | GET | Yes | Main dashboard |
| `/roadmap` | POST | Yes | Generate roadmap |
| `/history` | GET | Yes | List past roadmaps |
| `/history/<id>` | GET | Yes | Get specific roadmap |
| `/stats` | GET | Yes | User analytics |
| `/health` | GET | No | Health check |

### POST /roadmap

**Request:**
```json
{
  "goal": "Learn Python for data science",
  "time_available": "3 months, 2 hours/day",
  "current_level": "Beginner",
  "extra_notes": "I know basic math"
}
```

**Response:**
```json
{
  "success": true,
  "input": { ... },
  "roadmap": {
    "level_detected": "Beginner",
    "feasibility": { "verdict": "Realistic", "explanation": "..." },
    "priority_topics": [ ... ],
    "topics_to_skip": [ ... ],
    "roadmap": [ ... ],
    "burnout_aware_tips": [ ... ],
    "revision_strategy": { ... },
    "practice_plan": { ... },
    "smart_tips": [ ... ],
    "motivational_message": "..."
  }
}
```

---

## 🐳 Docker (Local)

```bash
# Build
docker build -t ai-roadmap-generator .

# Run
docker run -p 8080:8080 \
  -e GEMINI_API_KEY=your_key_here \
  -e SECRET_KEY=any_secret \
  ai-roadmap-generator
```

Visit **http://localhost:8080**

---

## ☁️ Deploy to Google Cloud Run

### Prerequisites
- Google Cloud account with a project
- [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed

### Step 1: Authenticate

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com
```

### Step 2: Build & Push

```bash
export PROJECT_ID=$(gcloud config get-value project)
export IMAGE=ai-roadmap-generator
export REGION=us-central1

gcloud builds submit --tag gcr.io/$PROJECT_ID/$IMAGE .
```

### Step 3: Deploy

```bash
gcloud run deploy $IMAGE \
  --image gcr.io/$PROJECT_ID/$IMAGE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --timeout 120 \
  --set-env-vars GEMINI_API_KEY=your_key_here,SECRET_KEY=your_secret_here
```

### Step 4: Get URL

```bash
gcloud run services describe $IMAGE \
  --platform managed \
  --region $REGION \
  --format 'value(status.url)'
```

---

## 🧪 Test with curl

```bash
# First login to get session cookie
curl -c cookies.txt -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@roadmap.ai","password":"demo123"}'

# Then generate roadmap
curl -b cookies.txt -X POST http://localhost:8080/roadmap \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Learn React.js to build web apps",
    "time_available": "6 weeks, 1.5 hours/day",
    "current_level": "Beginner",
    "extra_notes": "I know basic HTML/CSS"
  }'
```

---

## 💡 Tech Stack

- **Backend**: Python 3.11 + Flask 3.0
- **AI Agent**: Google Gemini 2.0 Flash (via google-generativeai)
- **Frontend**: Vanilla HTML/CSS/JS (Space Grotesk + JetBrains Mono)
- **Auth**: Flask sessions (SHA-256 password hashing)
- **Deployment**: Docker + Google Cloud Run
- **UI Design**: Light tech aesthetic with CSS animations

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Gemini API key from Google AI Studio |
| `SECRET_KEY` | ✅ | Flask session secret (any random string) |
| `PORT` | No | Server port (default: 8080) |

---

Built with ❤️ for the AI Hackathon · Powered by Gemini 2.0 Flash
