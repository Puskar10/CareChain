import React from 'react';
import { useCareChain } from '../context/CareChainContext';
import { Shield, Copy } from 'lucide-react';

export const SharingAuditView: React.FC = () => {
  const { auditLogs, setIsShareModalOpen, activePatient } = useCareChain();

  const roleColor = (role: string) => {
    if (role === 'Doctor') return '#1677E8';
    if (role === 'Family Member') return '#20D3E8';
    if (role === 'Emergency EMS') return '#C5281A';
    return '#7A858D';
  };

  return (
    <div className="max-w-screen-xl mx-auto page-gutter py-12 space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="label-tag text-ink-muted">DATA GOVERNANCE</span>
          <h1 className="headline-lg text-ink-primary mt-3">Sharing & Audit</h1>
          <p className="text-sm text-ink-secondary mt-2">Complete access log for {activePatient.fullName}'s health data</p>
        </div>
        <button onClick={() => setIsShareModalOpen(true)} className="btn-primary">
          <Shield className="w-3.5 h-3.5"/>
          <span>Grant Access</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL ACCESSES', value: auditLogs.length },
          { label: 'DOCTORS', value: auditLogs.filter(l=>l.actorRole==='Doctor').length },
          { label: 'FAMILY', value: auditLogs.filter(l=>l.actorRole==='Family Member').length },
          { label: 'SYSTEM', value: auditLogs.filter(l=>l.actorRole==='System').length },
        ].map(s => (
          <div key={s.label} className="glass-light p-5 text-center pressable animate-drift-up">
            <p className="text-3xl font-light text-ink-primary" style={{letterSpacing:'-0.04em'}}>{s.value}</p>
            <span className="label-tag text-ink-muted mt-1 block">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Patient consent overview */}
      <div className="glass-light p-7 animate-drift-up">
        <div className="flex items-start justify-between mb-5">
          <div>
            <span className="label-tag text-ink-muted block mb-1">DATA OWNERSHIP</span>
            <p className="text-sm text-ink-secondary">
              {activePatient.fullName} controls access to their health records. All accesses are logged.
            </p>
          </div>
          <span className="pill pill-ok">Consent Active</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Consent Level', value: 'Full Medical', icon: '✓' },
            { label: 'Last Updated', value: new Date().toLocaleDateString('en-US',{month:'long',day:'numeric'}), icon: '📅' },
            { label: 'Authorized Providers', value: `${auditLogs.filter(l=>l.actorRole==='Doctor').length} active`, icon: '👤' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3 p-4 rounded-2xl bg-black/[0.02] border border-black/[0.04]">
              <span className="text-xl">{s.icon}</span>
              <div>
                <span className="label-tag text-ink-muted block mb-0.5">{s.label}</span>
                <p className="text-sm font-medium text-ink-primary">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit log */}
      <div className="glass-light overflow-hidden animate-drift-up">
        <div className="px-7 pt-6 pb-4 border-b border-black/[0.05] flex items-center justify-between">
          <span className="label-tag text-ink-muted">AUDIT LOG · {auditLogs.length} EVENTS</span>
          <button className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-primary transition-colors">
            <Copy className="w-3 h-3"/>
            Export
          </button>
        </div>

        {auditLogs.length === 0 ? (
          <div className="px-7 py-12 text-center">
            <p className="text-sm text-ink-muted">No access events recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04]">
            {[...auditLogs].slice(0, 20).map(log => (
              <div key={log.id} className="flex items-center gap-5 px-7 py-4 hover:bg-black/[0.015] transition-colors">
                <div className="w-2 h-2 rounded-full shrink-0" style={{background: roleColor(log.actorRole)}}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-primary truncate">{log.actorName}</p>
                  <p className="text-xs text-ink-muted">{log.actorRole} · {log.action}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-xs text-ink-muted">{log.timestamp}</span>
                </div>
                <span className={`pill text-[10px] shrink-0 ${
                  log.actorRole === 'Doctor' ? 'pill-cyan' :
                  log.actorRole === 'Emergency EMS' ? 'pill-red' : 'pill-dark'
                }`}>
                  {log.actorRole}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
