-- CareChain: Patient Health Event Timeline & 60-Second Handover Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/twtcstrnyomwilqtkhwf/sql)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Patients Table
create table if not exists public.patients (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    age integer not null,
    sex text not null,
    blood_group text,
    conditions text[] default '{}',
    allergies text[] default '{}',
    emergency_contact jsonb default '{}',
    primary_physician text,
    status text default 'Stable', -- 'Stable', 'Needs Attention', 'Critical'
    created_at timestamptz default now()
);

-- 2. Health Events Table (The central event store)
create table if not exists public.health_events (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid references public.patients(id) on delete cascade,
    type text not null, -- 'symptom', 'medication', 'vital', 'visit', 'report', 'emergency'
    timestamp timestamptz not null default now(),
    severity text not null default 'normal', -- 'normal', 'mild', 'moderate', 'severe', 'critical'
    title text not null,
    description text,
    source text not null default 'Patient', -- 'Patient', 'Family / Caregiver', 'Clinician', 'Device', 'Report'
    created_by text,
    metadata jsonb default '{}', -- stores specific fields (e.g. temp, bp, dose, test values)
    attachments jsonb default '[]',
    verified boolean default false,
    created_at timestamptz default now()
);

-- 3. Medications Table
create table if not exists public.medications (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid references public.patients(id) on delete cascade,
    name text not null,
    dose text not null,
    frequency text not null,
    schedule_times jsonb default '[]', -- e.g. [{"time": "08:00 AM", "status": "taken"}, {"time": "02:00 PM", "status": "taken"}, {"time": "08:00 PM", "status": "pending"}]
    status text default 'active', -- 'active', 'paused', 'completed'
    notes text,
    created_at timestamptz default now()
);

-- 4. Medical Reports Table
create table if not exists public.reports (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid references public.patients(id) on delete cascade,
    title text not null,
    report_type text not null, -- 'CBC Report', 'Prescription', 'Discharge Summary', 'Imaging', 'Biochemistry'
    file_name text,
    file_url text,
    extracted_data jsonb default '{}', -- e.g. {"Hemoglobin": "11.2 g/dL", "WBC": "13,400 /µL", "Platelets": "180,000 /µL"}
    summary text,
    uploaded_at timestamptz default now()
);

-- 5. Vitals Log Table
create table if not exists public.vitals (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid references public.patients(id) on delete cascade,
    timestamp timestamptz default now(),
    temperature numeric(4,1), -- in Fahrenheit, e.g. 102.6
    bp_systolic integer,
    bp_diastolic integer,
    heart_rate integer, -- pulse bpm
    spo2 integer, -- %
    respiratory_rate integer,
    blood_glucose integer,
    notes text,
    created_at timestamptz default now()
);

-- 6. Handover Secure Shares Table
create table if not exists public.handover_shares (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid references public.patients(id) on delete cascade,
    share_token text unique not null,
    scope text not null default '72h', -- '60s_summary', '24h', '72h', 'full'
    expires_at timestamptz not null,
    access_count integer default 0,
    created_at timestamptz default now()
);

-- 7. Audit Log Table
create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid references public.patients(id) on delete cascade,
    actor_name text not null,
    actor_role text not null, -- 'Doctor', 'Family Member', 'Patient', 'System'
    action text not null, -- 'Viewed patient timeline', 'Added symptom', 'Generated emergency link', etc.
    details text,
    created_at timestamptz default now()
);

-- Indexes for lightning fast queries
create index if not exists idx_health_events_patient_time on public.health_events(patient_id, timestamp desc);
create index if not exists idx_vitals_patient_time on public.vitals(patient_id, timestamp desc);
create index if not exists idx_medications_patient on public.medications(patient_id);
create index if not exists idx_reports_patient on public.reports(patient_id);

-- Enable RLS and create permissive public access policies for Hackathon Demo / Publishable Key
alter table public.patients enable row level security;
alter table public.health_events enable row level security;
alter table public.medications enable row level security;
alter table public.reports enable row level security;
alter table public.vitals enable row level security;
alter table public.handover_shares enable row level security;
alter table public.audit_logs enable row level security;

create policy "Allow all actions for anon users on patients" on public.patients for all using (true) with check (true);
create policy "Allow all actions for anon users on health_events" on public.health_events for all using (true) with check (true);
create policy "Allow all actions for anon users on medications" on public.medications for all using (true) with check (true);
create policy "Allow all actions for anon users on reports" on public.reports for all using (true) with check (true);
create policy "Allow all actions for anon users on vitals" on public.vitals for all using (true) with check (true);
create policy "Allow all actions for anon users on handover_shares" on public.handover_shares for all using (true) with check (true);
create policy "Allow all actions for anon users on audit_logs" on public.audit_logs for all using (true) with check (true);

-- Seed Initial Demo Patient: Rahul Sharma (from product specification)
insert into public.patients (id, full_name, age, sex, blood_group, conditions, allergies, emergency_contact, primary_physician, status)
values (
    'a1111111-1111-1111-1111-111111111111',
    'Rahul Sharma',
    42,
    'Male',
    'B+',
    array['Mild Hypertension', 'Seasonal Allergies'],
    array['Penicillin', 'Sulfa Drugs'],
    '{"name": "Pooja Sharma (Wife)", "phone": "+1 (555) 234-8901", "relationship": "Spouse"}'::jsonb,
    'Dr. Arvind Mehta (Cardiology)',
    'Needs Attention'
) on conflict (id) do nothing;

-- 8. User Profiles Table (for Google OAuth & Role Persistence)
create table if not exists public.profiles (
    id uuid primary key default gen_random_uuid(),
    email text unique not null,
    full_name text not null,
    role text not null default 'patient', -- 'patient', 'family', 'doctor', 'ems'
    avatar_url text,
    phone text,
    title text,
    verified boolean default false,
    created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Allow all actions for anon users on profiles" on public.profiles for all using (true) with check (true);

