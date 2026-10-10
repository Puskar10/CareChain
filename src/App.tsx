import React from 'react';
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

const MainContent: React.FC = () => {
  const { activeTab } = useCareChain();

  return (
    <main className="flex-1">
      {activeTab === 'overview'    && <DashboardView />}
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

export function App() {
  return (
    <CareChainProvider>
      <div className="app-bg min-h-screen flex flex-col">
        <Navbar />
        <DemoStoryBanner />
        <MainContent />
        {/* Global Modals */}
        <WhyModal />
        <AddEventModal />
        <ShareModal />
        {/* Footer — glass */}
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
            <div className="flex items-center gap-6 text-xs text-ink-muted">
              <a href="https://github.com/deb76796/Carechain" target="_blank" rel="noreferrer" className="hover:text-ink-primary transition-colors pressable">
                github.com/deb76796/Carechain
              </a>
              <span>Supabase · React · TypeScript</span>
            </div>
          </div>
        </footer>

      </div>
    </CareChainProvider>
  );
}

export default App;
