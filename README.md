# 🌊 FloodWise: Cross-Agency Flood Analytics System

![FloodWise Concept](https://img.shields.io/badge/Status-Active-brightgreen) ![React](https://img.shields.io/badge/Frontend-React.js-blue) ![Supabase](https://img.shields.io/badge/Backend-Supabase-green) ![AI](https://img.shields.io/badge/AI-Llama_3-purple)

FloodWise is a real-time, interactive analytics system designed to unify critical disaster response data across multiple governmental agencies in Johor, Malaysia. 

By integrating data from **JPS** (Department of Irrigation and Drainage), **JKR** (Public Works Department), and **JKM** (Social Welfare Department), FloodWise provides a single source of truth during flood crises, enhanced by an AI Intelligence Engine that synthesizes data into actionable insights.

## ✨ Features

- **🗺️ Real-Time Interactive Map:** Built with Leaflet and ArcGIS, the map dynamically renders GeoJSON layers based on live flood statuses, road defects, and active evacuation centers (PPS).
- **🔒 Role-Based Access Control (RBAC):** Powered by Supabase, the system strictly enforces role-based data entry. 
  - *Viewers* have global read-only access.
  - *JPS Editors* can only update River Water Levels.
  - *JKR Editors* can only update Road Flood Statuses and Road Defects.
  - *JKM Editors* can only update PPS Logistics and capacities.
- **🤖 AI Crisis Commander:** Integrated with Groq (Llama 3), the AI engine instantly synthesizes cross-agency data (dangerous river levels, closed roads, and PPS capacities) along with external weather APIs to output highly specific, automated intelligence briefs for local authorities.
- **📊 Dynamic Data Synchronization:** Real-time data tables update instantly upon submission. Clicking any location inside a data table automatically snaps and zooms the map to that exact location.
- **📝 Audit Trails:** Every submission is strictly tied to a user’s UUID, maintaining a perfect historical log of all data changes.

## 🛠️ System Architecture

* **Frontend:** React.js (Vite), Tailwind CSS
* **Backend:** Supabase (PostgreSQL, Authentication, Row Level Security)
* **Map Services:** React-Leaflet, ArcGIS REST API
* **AI Engine:** Groq API (Llama 3 70B)

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your system. You will also need a Supabase account and a Groq API key to run the backend and AI features locally.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nassss20/flood-analytics.git
   cd flood-analytics
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root of your project and add your API keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GROQ_API_KEY=your_groq_api_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Navigate to `http://localhost:5173` in your browser.

## 👥 Contributors

Built for the advancement of automated disaster response and crisis management.
