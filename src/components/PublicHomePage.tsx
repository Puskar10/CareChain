import React from 'react';
import { LogIn, Play, LayoutDashboard } from 'lucide-react';
import { useCareChain } from '../context/CareChainContext';
import { HeroCard } from './HeroCard';
import { BrandLink } from './BrandLink';
import { DEMO_EVENTS } from '../data/demoData';
import { navigateTo } from '../lib/route';
import type { AppTab } from '../types';

/** Public header: same liquid-glass wrapper as the app navbar, with homepage entry points. */
const PublicHeader: React.FC<{ onOpenDemo: () => void }> = ({ onOpenDemo }) => {
  const { user, openAuthModal } = useCareChain();

  return (
    <header className="nav-wrapper max-w-full overflow-x-clip">
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-13 gap-2 sm:gap-3">
          <BrandLink />

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {user ? (
              <button
                onClick={() => navigateTo('app')}
                className="btn-cyan flex items-center gap-1.5 !px-3 !py-1.5 !text-xs pressable shrink-0 cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                <span>Open Dashboard</span>
              </button>
            ) : (
              <>
                <button
                  onClick={openAuthModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all pressable shrink-0 cursor-pointer"
                  style={{
                    background: 'rgba(255,255,255,0.65)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.85)',
                    color: 'var(--ink-primary)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                  title="Sign In / Register"
                >
                  <LogIn className="w-3.5 h-3.5 text-accent-cyan" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={onOpenDemo}
                  className="btn-cyan flex items-center gap-1.5 !px-3 !py-1.5 !text-xs pressable shrink-0 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current shrink-0" />
                  <span>Try Demo</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

/**
 * Public landing page (route "/"): the original CareChain hero card with its anatomy video.
 * It always shows the bundled sample case, never a signed-in user's records.
 */
export const PublicHomePage: React.FC = () => {
  const { user, enterDemoMode, startDemoStory, setActiveTab } = useCareChain();

  // Entering demo mode re-syncs the active tab to the role dashboard in a context effect,
  // so a requested landing tab is applied one tick later to win over that default.
  const openApp = (tab: AppTab, enter?: () => void) => {
    enter?.();
    navigateTo('app');
    setTimeout(() => setActiveTab(tab), 0);
  };

  const handleOpenDemo = () => {
    enterDemoMode('doctor');
    navigateTo('app');
  };

  return (
    <div>
      <PublicHeader onOpenDemo={handleOpenDemo} />
      <HeroCard
        events={DEMO_EVENTS}
        onViewHandover={() => openApp('handover', user ? undefined : () => enterDemoMode('doctor'))}
        onRunDemo={() => openApp('timeline', startDemoStory)}
        onViewTimeline={() => openApp('timeline', user ? undefined : () => enterDemoMode('doctor'))}
      />
    </div>
  );
};
