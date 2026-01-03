swa# EnduranceGrid

EnduranceGrid is a smart weekly planning app for endurance athletes. It syncs TrainingPeaks and Outlook calendars, supports a structured Sunday Prep ritual, and uses AI to suggest optimal workout times based on past performance, recovery patterns, and life constraints.

## 🚀 Tech Stack
- Next.js (App Router, TypeScript)
- Supabase (Auth, Database, Realtime)
- Tailwind CSS + CSS Variables (Design Tokens)
- TrainingPeaks API (Workout import)
- Microsoft Graph API (Outlook sync)
- AI Layer (Custom logic + future LLM integration)

## 🎨 Design System
- Primary Color: `#0D1D35`
- Accent Colors: Orange `#FF7A00`, Teal `#00C2A8`
- Sport Colors: Swim `#0077FF`, Bike `#F2C94C`, Run `#EB5757`
- Light + Dark theme support
- Component library aligned with Figma

## 📁 Project Structure
See `/components`, `/app`, `/lib`, `/styles`, and `/supabase/schema.sql`.

## 🧪 Core Features
- Weekly grid with drag‑and‑drop
- Sunday Prep Mode (5‑step flow)
- TrainingPeaks sync
- Outlook sync
- AI workout time suggestions
- Time‑block editor (family, work, sleep, custom)
- Light + dark themes
- Mobile‑optimized layout

## 🛠 Setup
1. Clone repo  
2. Install dependencies  
3. Create `.env.local` with Supabase + API keys (see `.github/docs/SUPABASE_SETUP.md`)
4. Run `npm run dev`  
5. Import Supabase schema (see `.github/docs/SUPABASE_SETUP.md`)  
6. Start building

## 📅 Roadmap
See GitHub Projects board for full breakdown.

## 🏅 License
MIT
