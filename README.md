<div align="center">
  <img src="public/favicon.png" alt="Logo" width="120" />

  # 🌿 AI Sustainability Analyzer
  **Optimize AI Prompts. Reduce API Token Costs. Minimize Carbon Footprints.**

  <p align="center">
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
    <a href="https://www.netlify.com/"><img src="https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white" alt="Netlify Functions" /></a>
  </p>
</div>

---

## ⚡ Overview

The **AI Sustainability Analyzer** is a production-ready, full-stack workflow tool designed to analyze and optimize your LLM prompts. By leveraging the NVIDIA NIM API (Qwen 2.5 72B), the application intelligently refactors your prompt to maximize context retention while minimizing token overhead. 

Less tokens mean **lower latency, reduced API expenditure**, and a **smaller carbon footprint**.

## 🚀 Key Features
- **Real-Time Token Economics:** Instantly calculates the precise monetary cost (`USD`) and ecological cost (`mg CO₂`) of running prompts.
- **LLM-Powered Rewriting:** Calls an automated Qwen-72B Instruct workflow to optimize and aggressively compress semantic context without data loss.
- **Client-Side Resilience Backup:** Capable of failing over to a deterministic edge-based RegEx cleanup engine if the AI API is disabled or times out.
- **Data Charting:** Beautiful, real-time comparisons using Recharts (Area & Bar trends) illustrating savings side-by-side.
- **Session History Dashboard:** Uses persistent LocalStorage bindings to display cumulative lifecycle savings across sessions.

---

## 🛠️ Architecture

* **Frontend:** React 19 + TypeScript powered by Vite. Minimal latency and lightning-fast HMR.
* **Styling:** Tailwind CSS integrated with `shadcn/ui` components (Lucide icons, Radix primitives).
* **Backend:** Netlify Edge Functions (`/api/analyze`) serving secure, serverless bridge connections to external AI APIs to obscure API keys.
* **Visualization:** Custom Recharts for direct optimization impact review.

---

## 🏁 Running Locally

### 1. Prerequisites
- Node.js (v18+)
- A valid NVIDIA API key (`NVIDIA_API_KEY`)

### 2. Installation
Clone the repository, then map directly to the directory and install dependencies:
```bash
npm install
```

### 3. Environment Variables
To authenticate with the optimization backend, copy the provided environment template:
```bash
cp .env.example .env
```
Open `.env` and insert your actual `NVIDIA_API_KEY`.

### 4. Start Development Servers
This application requires exactly **two active terminal systems** when running locally because of the Netlify secure backend functions proxy map.

**Terminal 1 — Run the Frontend Dev Server:**
```bash
npm run dev
```

**Terminal 2 — Run the Netlify Serverless Backend:**
```bash
npx netlify-cli dev
```

---

## 🌎 Real-Time Impact
Once running, paste any heavily worded or vague prompt into the system. You'll immediately receive direct optimization metrics proving real-life savings on Token Count, Output Energy (mWh), and Carbon Emissions (mg). Small token differences multiply out across thousands of API endpoints, making significant ecological impacts over time!