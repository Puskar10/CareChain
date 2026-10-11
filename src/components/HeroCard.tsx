import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Pause, Play } from 'lucide-react';
import type { HealthEvent } from '../types';

/* ── Recent event mini card ─────────────────────────────────── */
const MiniEvent: React.FC<{ time: string; title: string; value?: string; severity: string }> = ({ time, title, value, severity }) => {
  const dotColor = severity === 'critical' || severity === 'severe' ? '#BE2418' : severity === 'moderate' ? '#CC7A08' : '#1ECFE0';
  return (
    <div
      className="flex items-start gap-2.5 py-2.5 pressable group"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 transition-transform group-hover:scale-125"
        style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}60` }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] sm:text-xs text-white/80 font-medium truncate">{title}</p>
        <p className="label-tag text-[11px] text-white/50 mt-0.5">{time}</p>
      </div>
      {value && <span className="text-[11px] font-mono text-white/55 shrink-0">{value}</span>}
    </div>
  );
};

/**
 * Anatomy video: autoplaying, looping, muted, inline. It is slow, flash-free content
 * rather than UI motion, so it plays regardless of prefers-reduced-motion. Users who
 * prefer reduced motion (or whose browser blocks autoplay) get a small pause/play
 * control so playback is always under their control; nobody else sees it.
 */
const AnatomyVideo: React.FC = () => {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  );

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedMotion(mq.matches);
    mq?.addEventListener?.('change', onChange);
    return () => mq?.removeEventListener?.('change', onChange);
  }, []);

  const userPaused = useRef(false);

  // Start (or resume) playback. Event-driven, not a retry loop: it runs on mount, when the
  // page becomes visible, and when the video scrolls into view. Browsers refuse to play
  // media in a hidden document, so a rejection there is not treated as "blocked".
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const tryPlay = () => {
      if (userPaused.current || !video.paused) return;
      video.play().catch(() => {
        if (document.visibilityState === 'visible') setBlocked(true);
      });
    };
    const onVisibility = () => { if (document.visibilityState === 'visible') tryPlay(); };
    const observer = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) tryPlay(); })
      : null;
    observer?.observe(video);
    document.addEventListener('visibilitychange', onVisibility);
    tryPlay();
    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      userPaused.current = false;
      video.play().catch(() => setBlocked(true));
    } else {
      userPaused.current = true;
      video.pause();
    }
  };

  return (
    <>
      <video
        ref={ref}
        src="/assets/anatomy_video.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        disablePictureInPicture
        onPlay={() => { setPlaying(true); setBlocked(false); }}
        onPause={() => setPlaying(false)}
        onError={e => { e.currentTarget.style.display = 'none'; }}
        className="absolute inset-0 w-full h-full object-cover scale-[1.10] lg:scale-[1.14] mix-blend-screen opacity-85 pointer-events-none select-none"
        style={{
          maskImage: 'radial-gradient(ellipse at 50% 52%, black 30%, transparent 68%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 52%, black 30%, transparent 68%)',
          filter: 'contrast(1.2) brightness(0.9) hue-rotate(-10deg)',
        }}
      />
      {(reducedMotion || blocked) && (
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pause anatomy animation' : 'Play anatomy animation'}
          className="chip-dark absolute bottom-2 right-2 z-20 w-7 h-7 flex items-center justify-center cursor-pointer"
        >
          {playing ? <Pause className="w-3 h-3 text-white/70" /> : <Play className="w-3 h-3 text-white/70" />}
        </button>
      )}
    </>
  );
};

interface HeroCardProps {
  events: HealthEvent[];
  onViewHandover: () => void;
  onRunDemo: () => void;
  onViewTimeline: () => void;
}

/** The CareChain hero: headline, CTAs, vital metrics, anatomy video and recent events. */
export const HeroCard: React.FC<HeroCardProps> = ({ events, onViewHandover, onRunDemo, onViewTimeline }) => {
  const recentEvents = [...events]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-2 pb-6 sm:pt-3 sm:pb-8 lg:pt-3 lg:pb-8">
      <div className="max-w-screen-xl mx-auto w-full">
        <div
          className="glass-hero w-full relative overflow-hidden flex flex-col lg:flex-row items-stretch"
        >
          {/* Atmospheric background layers */}
          <div className="absolute inset-0 bg-atmo-hero pointer-events-none opacity-70"/>
          <div className="absolute inset-0 bg-noise pointer-events-none opacity-35"/>
          {/* Large glow orbs */}
          <div className="absolute top-[-20%] right-[10%] w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(30,207,224,0.06) 0%, transparent 70%)' }}/>
          <div className="absolute bottom-[-10%] left-[15%] w-[400px] h-[400px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(16,96,216,0.05) 0%, transparent 70%)' }}/>
          {/* Glass sheen stripe across top */}
          <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }}/>

          {/* LEFT: editorial headline + data */}
          <div className="relative z-10 flex-1 flex flex-col justify-between p-6 sm:p-9 lg:p-8 xl:p-10 lg:max-w-[46%] xl:max-w-[48%]">
            <div>
              {/* Status tag - glass float */}
              <div className="flex items-center gap-2.5 mb-7 lg:mb-8">
                <div
                  className="flex items-center gap-2 px-2.5 py-1 rounded-full"
                  style={{
                    background: 'rgba(30,207,224,0.08)',
                    border: '1px solid rgba(30,207,224,0.20)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan" style={{animation: 'pulseDot 2s ease-in-out 3'}}/>
                  <span className="label-tag text-[11px] text-accent-cyan">PATIENT HEALTH INTELLIGENCE</span>
                </div>
                <span className="label-tag text-[11px] text-white/50">CARECHAIN</span>
              </div>

              {/* HEADLINE */}
              <h1 className="headline-display text-white mb-5 animate-fade-up">
                THE STORY
                <br />
                <span className="text-[rgba(255,255,255,0.4)]">BEHIND</span>
                <br />
                <span className="text-white">THE</span>
                <br />
                <span className="shimmer-text">EMERGENCY.</span>
              </h1>

              <p className="text-xs sm:text-[13px] text-white/60 max-w-[270px] leading-relaxed mb-7 lg:mb-8 animate-fade-up animate-fade-up-delay-1">
                Know what happened before the patient reached the hospital.
                72 hours of clinical context, compiled in 60 seconds.
              </p>

              {/* CTA */}
              <div className="flex items-center gap-2.5 flex-wrap animate-fade-up animate-fade-up-delay-2">
                <button onClick={onViewHandover} className="btn-cyan !px-4 !py-2 !text-xs">
                  <span>View 60s Handover</span>
                  <ArrowRight className="w-3 h-3"/>
                </button>
                <button
                  onClick={onRunDemo}
                  className="btn-ghost !px-4 !py-2 !text-xs"
                  style={{color: 'rgba(255,255,255,0.55)', borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)'}}
                >
                  <span>Run Demo Story</span>
                </button>
              </div>
            </div>

            {/* Vital Metrics row */}
            <div
              className="mt-8 pt-6 lg:mt-9 lg:pt-6 grid grid-cols-3 gap-4 sm:gap-5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
            >
              {[
                { label: 'TEMPERATURE', value: '102.6°F', delta: '↑ +2.2°F', color: '#F0685C' },
                { label: 'PULSE', value: '108 bpm', delta: 'Tachycardic', color: '#CC7A08' },
                { label: 'EVENTS', value: String(events.length), delta: 'Last 72h', color: '#1ECFE0' },
              ].map(m => (
                <div key={m.label} className="animate-drift-up">
                  <span className="label-tag text-[11px]" style={{color: 'rgba(255,255,255,0.5)'}}>{m.label}</span>
                  <p className="text-xl sm:text-[1.375rem] font-light text-white mt-1 tracking-tight" style={{letterSpacing: '-0.03em'}}>{m.value}</p>
                  <p className="text-[11px] mt-0.5" style={{color: m.color, opacity: 0.85}}>{m.delta}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Anatomy + recent events */}
          <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center lg:justify-end xl:justify-center gap-4 lg:gap-3 xl:gap-6 p-6 sm:p-8 lg:p-6 lg:pr-8 xl:p-8 xl:pr-10 min-w-0">
            {/* Anatomy visual (Video) */}
            <div className="relative flex items-center justify-center w-full max-w-[280px] lg:max-w-[320px] xl:max-w-[360px] 2xl:max-w-[400px] aspect-[4/5] flex-shrink-0 -translate-x-1 sm:-translate-x-2 lg:-translate-x-1 xl:-translate-x-3 translate-y-1 sm:translate-y-2 lg:translate-y-3">
              <div className="absolute inset-0 rounded-full mix-blend-screen pointer-events-none"
                style={{ background: 'radial-gradient(circle at center, rgba(30,207,224,0.09) 0%, rgba(16,96,216,0.03) 45%, transparent 70%)' }}
              />
              <AnatomyVideo />

              {/* Floating chip - temperature - glass */}
              <div
                className="chip-dark absolute top-6 lg:top-8 right-1 lg:right-2 px-2 py-1 text-right z-10"
              >
                <span className="label-tag text-[11px] text-white/60">TEMP</span>
                <p className="text-sm font-light text-white" style={{letterSpacing: '-0.03em'}}>102.6°F</p>
              </div>

              {/* Floating chip - pulse - glass */}
              <div
                className="chip-dark absolute bottom-1/5 lg:bottom-1/4 -left-1 lg:left-0 px-2 py-1 z-10"
              >
                <span className="label-tag text-[11px] text-white/60">PULSE</span>
                <p className="text-xs font-light text-white" style={{letterSpacing: '-0.03em'}}>108 bpm</p>
              </div>
            </div>

            {/* Recent events mini list */}
            <div className="w-full lg:w-[155px] xl:w-44 2xl:w-48 flex-shrink-0">
              <span className="label-tag text-[11px] text-white/50 block mb-2.5">RECENT EVENTS</span>
              {recentEvents.map(e => (
                <MiniEvent
                  key={e.id}
                  time={new Date(e.timestamp).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'})}
                  title={e.title}
                  value={e.metadata?.temperature ? `${e.metadata.temperature}°F` : undefined}
                  severity={e.severity}
                />
              ))}
              <button
                onClick={onViewTimeline}
                className="mt-3 flex items-center gap-1 text-[11px] text-accent-cyan/70 hover:text-accent-cyan transition-colors pressable"
              >
                <span>Full timeline</span>
                <ArrowRight className="w-3 h-3"/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
