import React from 'react';
import { useCareChain } from '../../context/CareChainContext';
import { X, ArrowRight } from 'lucide-react';

export const WhyModal: React.FC = () => {
  const {
    isWhyModalOpen, closeWhyModal, selectedWhyFinding,
    events, setActiveTab, setEvidenceHighlightIds
  } = useCareChain();

  if (!isWhyModalOpen || !selectedWhyFinding) return null;

  const evidenceEvents = events.filter(e => selectedWhyFinding.evidenceEventIds.includes(e.id));

  const handleJumpToTimeline = () => {
    setEvidenceHighlightIds(selectedWhyFinding.evidenceEventIds);
    closeWhyModal();
    setActiveTab('timeline');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="modal-panel w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="p-8 pb-6 border-b border-black/[0.06]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="label-tag text-accent-blue">EXPLAINABLE AI · EVIDENCE TRACEABILITY</span>
              <h2 className="text-xl font-light text-ink-primary mt-2" style={{letterSpacing:'-0.02em'}}>
                Why am I seeing this insight?
              </h2>
              <p className="text-xs text-ink-muted mt-1">
                Every claim traces directly to raw, timestamped timeline events.
              </p>
            </div>
            <button onClick={closeWhyModal} className="p-2 rounded-full text-ink-muted hover:text-ink-primary hover:bg-black/[0.04] transition-all shrink-0">
              <X className="w-4 h-4"/>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-5">

          {/* Finding */}
          <div className="p-5 rounded-2xl bg-black/[0.02] border border-black/[0.06]">
            <span className="label-tag text-ink-muted block mb-2">{selectedWhyFinding.category} FINDING</span>
            <p className="text-sm font-medium text-ink-primary leading-snug mb-3">"{selectedWhyFinding.statement}"</p>
            <div className="pt-3 border-t border-black/[0.05]">
              <p className="text-xs text-ink-secondary leading-relaxed">
                <strong className="text-ink-primary">Clinical Rationale: </strong>
                {selectedWhyFinding.whyExplanation}
              </p>
            </div>
          </div>

          {/* Factual grounding */}
          <div className="p-5 rounded-2xl bg-ok/5 border border-ok/15">
            <span className="label-tag text-ok block mb-1.5">GROUNDED IN RECORDED FACT</span>
            <p className="text-xs text-ink-secondary leading-relaxed">{selectedWhyFinding.factualBasis}</p>
          </div>

          {/* Severity score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="label-tag text-ink-muted">SEVERITY</span>
              <span className="label-tag font-bold text-accent-cyan capitalize">{selectedWhyFinding.severity}</span>
            </div>
            <div className="h-1.5 rounded-full bg-black/[0.05] overflow-hidden">
              <div className="h-full rounded-full bg-accent-cyan transition-all duration-700" style={{width:`${({'critical':100,'severe':75,'moderate':50,'mild':25,'normal':10} as Record<string,number>)[selectedWhyFinding.severity]||50}%`}}/>
            </div>
          </div>

          {/* Evidence events */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="label-tag text-ink-muted">CAUSAL EVENTS ({evidenceEvents.length})</span>
              <span className="label-tag text-ink-muted">Timestamped proof</span>
            </div>
            <div className="space-y-2">
              {evidenceEvents.map(evt => (
                <div key={evt.id} className="flex items-start gap-4 p-4 rounded-2xl border border-black/[0.06] bg-black/[0.015]">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan shrink-0 mt-1.5"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink-primary">{evt.title}</p>
                    <p className="text-xs text-ink-muted mt-0.5 leading-relaxed line-clamp-2">{evt.description}</p>
                    <span className="text-[10px] text-ink-muted">by {evt.createdBy} · {evt.source}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs text-ink-primary block">
                      {new Date(evt.timestamp).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}
                    </span>
                    <span className="font-mono text-[10px] text-ink-muted">
                      {new Date(evt.timestamp).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-black/[0.05] flex items-center justify-between gap-3">
          <p className="text-xs text-ink-muted">CareChain does not invent facts or diagnoses.</p>
          <div className="flex items-center gap-2">
            <button onClick={closeWhyModal} className="btn-ghost">Close</button>
            <button onClick={handleJumpToTimeline} className="btn-primary">
              <span>Highlight on Timeline</span>
              <ArrowRight className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
