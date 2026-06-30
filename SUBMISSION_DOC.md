# Vibe 2 Ship Hackathon Submission: Civicpluse

**Project Name:** Civicpluse  
**Tagline:** Bridging the gap between citizen reporting and municipal accountability using AI.

---

## 🌟 Executive Summary

Civic reporting apps usually fail because of a lack of two-sided accountability. Citizens post photos of potholed roads, broken streetlights, or water leakage, but these reports sit passively in database records without being routed to the correct departments or verified upon completion.

**Civicpluse** transforms the civic reporting cycle into a fully authenticated, two-sided workflow:
1.  **AI-Powered Intake:** When a resident snaps a photo, **Google Gemini 2.5 Flash** validates whether the hazard is a real civic issue, details the severity, explains the risks, and automatically routes the ticket to the correct department.
2.  **Safety Navigation:** A **Safe Route Planner** allows users to map a path across the city and scan for active on-route hazards, calculating a Route Safety Index (0-100%) and offering safety recommendations.
3.  **Role-Locked Resolution:** Resolution of issues is restricted to verified municipal officers (using security checks and passcode `VIZAG-GOV-2026`). Officers must upload photographic validation of the fix to close a ticket, closing the loop.
4.  **Recurrence Tracking:** If a previously fixed hazard returns, the system automatically flags it as a `⚠️ Double Issue` and escalates its priority.

---

## 🛠️ Technology Stack & APIs

*   **Frontend Framework:** React 19, TypeScript, Tailwind CSS V4.
*   **Map Rendering:** `@vis.gl/react-google-maps` (Google Maps JS API wrapper) with custom fallback simulators for testing off-network or offline.
*   **Backend Server:** Express.js (Node.js) compiled with `esbuild` for production bundles.
*   **AI Engine:** **Google Gemini 2.5 Flash API** (`@google/genai` SDK) for multi-modal analysis (image + description + location metadata).
*   **Routing & Scan Algorithms:** Custom JavaScript implementation of the **Haversine formula** to measure distances along polyline coordinates for the safe travel corridor scan.

---

## 🏛️ Key Features (What Makes it Unique)

### 1. Multi-Modal Intake & Auto-Routing (Gemini 2.5 Flash)
*   Instead of users manual-tagging departments, the Gemini API reviews the image and automatically classifies it into `pothole`, `water_leak`, `streetlight`, `garbage`, or `other`.
*   Routes to: `Roads Department`, `Water Supply & Sewerage`, `Electricity Board`, `Sanitation & Health`.

### 2. Civic Safe Route Planner (Travel Scan)
*   Enter a **Start** and **Destination** (e.g. *MVP Colony Market* to *Beach Road Bus Stop*).
*   The map draws the route and calculates a corridor of 400m around the path.
*   The system scans active issues, lists what's on your route, details how far they are, and provides travel warnings (e.g. *Slippery road due to water leakage ahead*).

### 3. Verification & Resolution Proof (Role Lock)
*   Resolution is locked. Citizens can report but cannot close tickets.
*   Municipal officers check a checkbox: "Verify as Official Representative", pick their department, and log in with passcode `VIZAG-GOV-2026`.
*   The dashboard automatically adapts, filtering the view to show only their department's inbox.
*   To resolve, the officer must select the ticket, upload **photographic proof of the completed repair**, and write action notes.

### 4. Recurrent Hazard ("Double Issue") Warning
*   If a user submits an issue close to a previously resolved one, the app flags it as a `⚠️ Double Issue` (warning badge on map and dashboard).
*   The system increases the severity of the ticket by $+1$, signaling to the department that their previous fix failed.

### 5. Filing-to-Resolution Timeline Tracker
*   Tracks exact duration between reporting and resolution.
*   Displays timeline: `Published Time` ➔ `Solved Time` ➔ `⏱ Solve Duration: X hours Y mins`.

---

## 🚀 Google Cloud Deployment Guide

We have pre-configured files to deploy this project to the cloud:
1.  **Google App Engine (GAE):** Configured in [app.yaml](file:///d:/New%20folder/community-hero/app.yaml) for Node.js 20.
2.  **Google Cloud Run:** Configured in [Dockerfile](file:///d:/New%20folder/community-hero/Dockerfile) using a lightweight Node-Alpine container.

### Deploying to App Engine (Easiest)
Make sure you have Google Cloud SDK installed, then run:
```bash
# Login and set your project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Deploy the app (Vite build runs automatically during setup)
gcloud app deploy
```

### Deploying to Cloud Run (Recommended for serverless scalability)
```bash
# Build and submit the container to Artifact Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/civicpluse

# Deploy on Cloud Run (Exposes on Port 8080)
gcloud run deploy civicpluse \
  --image gcr.io/YOUR_PROJECT_ID/civicpluse \
  --platform managed \
  --allow-unauthenticated
```

*Note: Configure `GEMINI_API_KEY` and `GOOGLE_MAPS_PLATFORM_KEY` in your Cloud Run or App Engine dashboard settings under environment variables.*

---

## 💻 Running the Project Locally

```bash
# 1. Install dependencies
npm install

# 2. Add API keys in .env file:
# GEMINI_API_KEY=your_gemini_key
# GOOGLE_MAPS_PLATFORM_KEY=your_maps_key

# 3. Start development environment
npm run dev
```
Open `http://localhost:3000` to test.

---

## 🏛️ Vibe 2 Ship Hackathon Alignment
This project aligns directly with the "Vibe 2 Ship" directive by going from a simple conceptual UI mock to a **fully functioning, end-to-end two-sided civic workspace** with working AI routing, route security algorithms, and official resolution loops.
