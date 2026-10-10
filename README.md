# CareChain 🩺⚡
> **"What happened before the patient reached the hospital?"**

CareChain reconstructs a patient’s pre-hospital health journey across symptoms, medications, vitals, lab reports, and emergency events — synthesizing it into a concise, doctor-ready **60-second emergency handover**.

[![GitHub Repository](https://img.shields.io/badge/GitHub-deb76796%2FCarechain-0d9488?logo=github)](https://github.com/deb76796/Carechain)
[![Supabase](https://img.shields.io/badge/Supabase-Connected-3ecf8e?logo=supabase)](https://twtcstrnyomwilqtkhwf.supabase.co)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com)

---

## 🎯 The Core Problem
During emergencies, doctors and family members often do not know what happened to a patient in the critical hours or days before reaching the hospital. Vital clues — such as irregular medication intake, gradual fever climbs, missed antibiotics, or subtle dizzy episodes — are scattered across memory and paper slips.

### The Key Differentiator
Most health apps are:
> **Record → Store → Display**

**CareChain is:**
> **Event → Timeline → Understand → Handover**

The timeline remains the immutable source of truth; AI is strictly responsible for organizing and summarizing it rather than inventing a diagnosis.

---

## 🚀 Key Features

### 1. ⚡ 60-Second Patient Handover (The Centerpiece)
- Summarizes the complete 72-hour progression into an executive clinical narrative tailored for emergency physicians.
- Highlights:
  - Timeline Progression & Fever Onset
  - Medication Adherence & Missed Doses
  - Latest Vitals & Hemodynamic Instability
  - Acute Symptom Trigger & ER Transport Reason

### 2. 🔍 Explainable AI: "Why am I seeing this?"
- AI is never a black box.
- Every clinical insight (e.g., *"Temperature increased 2.2°F over 3 days"*) features a **"Why am I seeing this?"** button.
- Clicking reveals the exact supporting evidence breakdown (e.g. *14 health events · 3 days history · 4 medication logs · 5 vitals · 2 reports*) and highlights the causal events directly on the timeline.

### 3. 🛡️ Healthcare Safety Matrix: Clinical Source Classification
CareChain strictly distinguishes:
1. **Recorded Fact:** *Temperature recorded as 102.6°F at 8:20 AM.*
2. **Patient-Reported Symptom:** *Patient reported dizziness at 11:45 AM.*
3. **AI-Generated Interpretation:** *Symptoms appear to have worsened over the preceding 24 hours.*
> *Guiding Principle: CareChain connects events into a story without pretending to be a doctor or fabricating diagnoses.*

### 4. 🚨 Emergency Rapid Assessment Mode
- High-contrast, high-urgency ER triage layout (Level 2 Emergent).
- Rapid glance at acute vital abnormalities (Temp 102.6°F, Pulse 108 bpm, SpO2 96%, BP 140/90).
- Immediate highlight of documented allergies (e.g., **Penicillin**, **Sulfa Drugs**).
- One-tap ER QR code generator and self-destructing secure handover link.

### 5. 💊 Medication Adherence Tracker
- Tracks doses as **Taken (✓)**, **Missed (✗)**, or **Delayed (⏱)**.
- Captures clinical reasons for missed doses (e.g., *Amoxicillin missed due to severe nausea*), immediately feeding the doctor's handover summary.

### 6. 📈 Physiological Trajectory (Vitals & Trends)
- Interactive visual curves mapping fever progression (100.4°F → 101.8°F → 102.1°F → 102.6°F).
- Tachycardia tracking (resting 78 bpm climbing to 108 bpm).

### 7. 📑 Medical Reports & OCR Extraction
- Connects uploaded diagnostic PDFs (CBC panels, prescriptions) directly to the timeline.
- Parses laboratory values (WBC 13,400 /µL, Hemoglobin 11.2 g/dL, Platelets 180,000 /µL) with clear labeling as machine-extracted facts.

### 8. 🩺 Dedicated Doctor Clinical Cockpit
- Attending emergency physician checklist to verify raw events before entering clinical disposition.
- One-click copy for EHR integration.

### 9. 🔐 Privacy, Sharing & Access Audit Trail
- Share handover with granular scope (60s summary, 24h, 72h, full timeline).
- Configurable expiration (1h, 24h, 72h).
- Immutable access log documenting which clinician or family member accessed the record.

---

## 🎬 The "Killer Demo Story" (Interactive Walkthrough)
CareChain features a built-in interactive demo controller in the top navbar:
- **Scene 1:** Patient develops fever (Sept 25, 100.4°F with chills).
- **Scene 2:** Family adds medication events (Paracetamol & Amoxicillin prescribed).
- **Scene 3:** Vitals start worsening (Fever climbs to 101.8°F, antibiotic missed due to nausea).
- **Scene 4:** Acute dizziness reported (Sept 28, 11:45 AM orthostatic vertigo + 108 bpm pulse).
- **Scene 5:** Family transports patient to Hospital ER (Emergency Mode triggered).
- **Scene 6:** Doctor opens CareChain (60-Second Handover loads, doctor clicks "Show Evidence" revealing the exact causal events!).

---

## 🛠️ Technology Stack
- **Frontend:** React 19, TypeScript, Vite
- **Styling & Aesthetics:** Tailwind CSS, Plus Jakarta Sans typography, sleek clinical glassmorphism (`Apple Health × Linear`)
- **Icons & Animation:** Lucide Icons, Canvas Confetti
- **Backend & Database:** Supabase (PostgreSQL, Row Level Security, Storage)
  - Supabase URL: `https://twtcstrnyomwilqtkhwf.supabase.co`
  - Client-side Anon Key: `sb_publishable_53Gl9SyjeTjIgOalh5o45A_c6XwVHn1`
- **Resilience:** Automatic fallback to pre-seeded local storage state if network or Supabase tables are offline.

---

## ⚡ Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/deb76796/Carechain.git
cd Carechain
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file (or use `.env.example`):
```env
VITE_SUPABASE_URL=https://twtcstrnyomwilqtkhwf.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_53Gl9SyjeTjIgOalh5o45A_c6XwVHn1
```

### 4. Supabase Database Schema
Copy and execute `supabase/schema.sql` inside your [Supabase SQL Editor](https://supabase.com/dashboard/project/twtcstrnyomwilqtkhwf/sql) to set up tables, indexes, and RLS policies.

### 5. Run the application
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

---

## 📄 License
MIT © CareChain
