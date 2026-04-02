![Finovo AI Hero](docs/assets/dashboard.png)

# 🏦 Finovo AI

<div align="center">
  <h3>Your Premium Financial Intelligence Platform</h3>
  <p>An enterprise-grade, multi-agent AI system predicting financial velocity, automating insights, and dynamically visualizing wealth portfolios.</p>

  <p>
    <a href="#demo"><strong>Watch the Demo</strong></a> · 
    <a href="#features"><strong>Features</strong></a> · 
    <a href="#tech-stack"><strong>Tech Stack</strong></a> · 
    <a href="#quickstart"><strong>Quickstart</strong></a>
  </p>
</div>

<br />

## 🔮 Interactive Demo
> ⚡ **Powered by Multi-Agent AI:** View the incredible interactive capabilities spanning UI rendering, predictive analytics, and conversational intelligence.

<div align="center">
  <img src="docs/assets/demo.webp" alt="Finovo AI Demo Recording" width="800">
</div>

---

## ✦ Core Intelligence Features

| Feature | Description |
| --- | --- |
| **Glassmorphic Insights & Dashboard** | A stunningly premium, Stripe-like dashboard featuring a **live Stability Score**, intelligent grid metrics, and real-time behavioral insights dynamically reflecting your financial health. |
| **Generative Multi-Agent Chat** | Connects to a robust **Advisor Node**, **Risk Engine**, and **Predictive Model**. Send complex queries in natural language to experience the agents coordinating your requests live. |
| **Interactive Recharts Visualization** | An animated **Forecast Line Chart** comparing current vs. predicted spend, and an interactive **Category Breakdown Pie Chart** powered natively by dynamic analytics. |
| **Portfolio Tracker API** | Seamlessly add Crypto or Stock assets. Monitor absolute gains/losses supported by instant AI advice regarding current portfolio distributions. |

---

## 🎨 Visual Showcase

### 1. Dashboard & Smart Analytics Grid
Live AI metrics evaluating real-time savings rates, systemic risk, and 30-day forecast horizons combined with user-friendly onboarding flows.

<img src="docs/assets/dashboard.png" alt="Finovo Dashboard Experience" width="700" style="border-radius: 12px; margin-bottom: 24px;">

### 2. Neural Interaction Interface (Multi-Agent Chat)
Streamed, localized financial context evaluated across coordinated NLP agents representing distinct nodes: Advisor (🧠) Risk (💰) and Future prediction (🔮).

<img src="docs/assets/chat.png" alt="Multi-Agent Chat View" width="700" style="border-radius: 12px; margin-bottom: 24px;">

---

## 🛠 Tech Stack Stack
**Frontend Architecture:**
* React + Vite (Fast HMR)
* Framer Motion (Micro-interactions & transitions)
* Recharts (Responsive data visualization)
* Vanilla CSS (Tailored UI Tokens without bloat)

**Backend Architecture:**
* Node.js + Express (Firebase Functions deployment)
* Firebase Auth (JWT Security)
* Firestore DB (Real-time NoSQL streaming)
* NVIDIA AI APIs (NIM Inference for Multi-Agent logic)

---

## 🚀 Quickstart

### Prerequisites:
- Node.js `v18+`
- Environment Variables representing valid LLM keys and Firebase credentials

### Running the Environment:
_Split your terminal and initialize both instances:_

#### Backend (Microservices)
```bash
cd backend
npm install
npm run serve
```

#### Frontend (UI)
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173` (or `5174`) to access the interface!

> **Demo Mode Support:** If Firebase isn't securely configured locally, Finovo AI dynamically defaults into a full **Mock Data Mode**, allowing you to experience the UX bypassing active DB operations.

---
_Developed for next-generation intelligence-led financial tracking._
