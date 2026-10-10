import React from 'react';
import { useCareChain } from '../context/CareChainContext';
import { ArrowRight, X } from 'lucide-react';

const SCENES = [
  { num: 1, label: 'Fever onset', detail: 'Sept 25 — 100.4°F with chills' },
  { num: 2, label: 'Medication events', detail: 'Dr. Mehta prescribes antibiotics' },
  { num: 3, label: 'Vitals worsen', detail: '100.4°F → 101.8°F → 102.6°F' },
  { num: 4, label: 'Acute dizziness', detail: '108 bpm + orthostatic vertigo' },
  { num: 5, label: 'Emergency transport', detail: 'City Memorial Hospital ER' },
  { num: 6, label: '60s Handover', detail: 'Doctor opens CareChain evidence' },
];

export const DemoStoryBanner: React.FC = () => {
  const { demoScene, stepDemoScene, resetDemoData } = useCareChain();

  if (demoScene === 0) return null;

  const current = SCENES[demoScene - 1];
  const progress = (demoScene / 6) * 100;

  return (
    <div
      className="px-4 py-2.5"
      style={{
        background: 'rgba(7,8,10,0.85)',
        backdropFilter: 'blur(24px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-screen-xl mx-auto flex items-center gap-4">
        {/* Label */}
        <div className="shrink-0">
          <span className="label-tag text-accent-cyan">DEMO · Scene {demoScene}/6</span>
          <p className="text-xs text-white font-medium mt-0.5">{current.label}</p>
        </div>

        {/* Progress bar */}
        <div className="flex-1 hidden sm:flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-cyan rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-white/40 shrink-0">{current.detail}</span>
        </div>

        {/* Steps */}
        <div className="hidden md:flex items-center gap-1">
          {SCENES.map(s => (
            <button
              key={s.num}
              onClick={() => stepDemoScene(s.num)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                demoScene === s.num ? 'bg-accent-cyan w-4' : demoScene > s.num ? 'bg-white/30' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {demoScene < 6 && (
            <button
              onClick={() => stepDemoScene(demoScene + 1)}
              className="flex items-center gap-1 px-3 py-1.5 bg-accent-cyan text-void rounded-full text-xs font-semibold"
            >
              <span>Next</span>
              <ArrowRight className="w-3 h-3"/>
            </button>
          )}
          <button onClick={resetDemoData} className="p-1.5 text-white/30 hover:text-white/60 transition-colors">
            <X className="w-3.5 h-3.5"/>
          </button>
        </div>
      </div>
    </div>
  );
};
