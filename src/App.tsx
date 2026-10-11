import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { CareChainProvider, useCareChain } from './context/CareChainContext';
import { Navbar } from './components/Navbar';
import { DemoStoryBanner } from './components/DemoStoryBanner';
import { DashboardView } from './components/DashboardView';
import { TimelineView } from './components/TimelineView';
import { HandoverView } from './components/HandoverView';
import { EmergencyView } from './components/EmergencyView';
import { MedicationsView } from './components/MedicationsView';
import { VitalsView } from './components/VitalsView';
import { ReportsView } from './components/ReportsView';
import { DoctorView } from './components/DoctorView';
import { SharingAuditView } from './components/SharingAuditView';
import { WhyModal } from './components/modals/WhyModal';
import { AddEventModal } from './components/modals/AddEventModal';
import { ShareModal } from './components/modals/ShareModal';
import { AuthModal } from './components/modals/AuthModal';
import { PublicHomePage } from './components/PublicHomePage';
import { navigateTo, useRoute } from './lib/route';

import { Activity } from 'lucide-react';
import { DoctorDashboardView } from './components/roles/DoctorDashboardView';
import { CaregiverDashboardView } from './components/roles/CaregiverDashboardView';
import { PatientDashboardView } from './components/roles/PatientDashboardView';
import { EmsDashboardView } from './components/roles/EmsDashboardView';

const MainContent: React.FC = () => {
  const { activeTab, currentRole } = useCareChain();

  return (
    <main className="flex-1">
      {/* Role specific primary dashboards */}
      {(activeTab === 'doctor-dashboard' || (activeTab === 'overview' && currentRole === 'doctor')) && <DoctorDashboardView />}
      {(activeTab === 'caregiver-dashboard' || (activeTab === 'overview' && currentRole === 'family')) && <CaregiverDashboardView />}
      {(activeTab === 'patient-dashboard' || (activeTab === 'overview' && currentRole === 'patient')) && <PatientDashboardView />}
      {(activeTab === 'ems-dashboard' || (activeTab === 'overview' && currentRole === 'ems')) && <EmsDashboardView />}

      {/* Role workflow tab aliases */}
      {activeTab === 'doctor-queue' && <DoctorDashboardView />}
      {activeTab === 'doctor-assessment' && <DoctorView />}
      {activeTab === 'vitals-labs' && <VitalsView />}
      {activeTab === 'caregiver-tasks' && <CaregiverDashboardView />}
      {activeTab === 'caregiver-observations' && <CaregiverDashboardView />}
      {activeTab === 'caregiver-escalate' && <CaregiverDashboardView />}
      {activeTab === 'caregiver-careplan' && <CaregiverDashboardView />}
      {activeTab === 'patient-careplan' && <PatientDashboardView />}
      {activeTab === 'patient-meds' && <MedicationsView />}
      {activeTab === 'patient-appointments' && <PatientDashboardView />}
      {activeTab === 'patient-careteam' && <PatientDashboardView />}
      {activeTab === 'ems-assessment' && <EmsDashboardView />}
      {activeTab === 'ems-vitals-interventions' && <EmsDashboardView />}
      {activeTab === 'ems-handover' && <EmsDashboardView />}

      {/* Shared clinical views */}
      {activeTab === 'timeline'    && <TimelineView />}
      {activeTab === 'handover'    && <HandoverView />}
      {activeTab === 'emergency'   && <EmergencyView />}
      {activeTab === 'medications' && <MedicationsView />}
      {activeTab === 'vitals'      && <VitalsView />}
      {activeTab === 'reports'     && <ReportsView />}
      {activeTab === 'doctor'      && <DoctorView />}
      {activeTab === 'sharing'     && <SharingAuditView />}
    </main>
  );
};

/**
 * Separates the public homepage from the authenticated app using the existing auth state:
 *  - signing in / restoring a session / entering demo mode while on the homepage opens the app
 *  - signing out from the app returns to the homepage
 * Navigating to the homepage manually (logo click) never forces a redirect back.
 */
const AppShell: React.FC = () => {
  const { user, activeTab, profileState, isDemoMode } = useCareChain();
  const route = useRoute();
  const userId = user?.id ?? null;
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    // If user signs in or session is restored while on homepage, open the app
    if (userId && !prevUserId.current && route === 'home') {
      navigateTo('app');
    }
    // If user signs out while in the app, return to homepage
    else if (!userId && prevUserId.current) {
      navigateTo('home');
    }
    // Protected route guard: if user is logged out, not in demo mode, and session check finished, protect /#/app
    else if (!userId && !isDemoMode && profileState === 'ready' && route === 'app') {
      navigateTo('home');
    }
    prevUserId.current = userId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, profileState, isDemoMode, route]);

  // The document is the only scroll container. Reset it when the visible view actually
  // changes (route or active tab), before paint, but not on mount so a browser refresh can
  // still restore its position, and not on unrelated updates (modals, data, role chrome).
  // `instant` bypasses the global `html { scroll-behavior: smooth }`.
  const viewKey = route === 'home' ? 'home' : `app:${activeTab}`;
  const prevViewKey = useRef(viewKey);
  useLayoutEffect(() => {
    if (prevViewKey.current === viewKey) return;
    prevViewKey.current = viewKey;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [viewKey]);

  const isHome = route === 'home';
  // Wait for session restoration before deciding whether user is logged out
  const isRestoringSession = !isDemoMode && profileState === 'authLoading';

  return (
    <div className="app-bg min-h-screen flex flex-col w-full max-w-full overflow-x-clip">
      {isRestoringSession ? (
        <main className="flex-1 flex items-center justify-center min-h-[70vh] px-4 animate-fade-in">
          <div
            className="rounded-3xl p-8 sm:p-12 text-center max-w-md w-full space-y-4"
            style={{
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.85)',
              boxShadow: '0 8px 32px rgba(15,23,42,0.08)'
            }}
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 flex items-center justify-center mx-auto animate-spin">
              <Activity className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-ink-primary font-carmen">
                Verifying Session
              </h3>
              <p className="text-xs text-ink-muted">
                Restoring authenticated clinical profile...
              </p>
            </div>
          </div>
        </main>
      ) : isHome ? (
        <main className="flex-1">
          <PublicHomePage />
        </main>
      ) : (
        <>
          <Navbar />
          <DemoStoryBanner />
          <MainContent />
        </>
      )}
      {/* Global Modals */}
      <WhyModal />
      <AddEventModal />
      <ShareModal />
      <AuthModal />
      {/* Footer - glass */}
      <footer
        className="py-8 page-gutter"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.55)',
          background: 'rgba(234,240,246,0.55)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="label-tag text-ink-secondary">CareChain · Patient Health Intelligence</span>
            <p className="text-xs text-ink-muted mt-1 max-w-sm">
              What happened before the patient reached the hospital?
            </p>
          </div>

        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <CareChainProvider>
      <AppShell />
    </CareChainProvider>
  );
}

export default App;
