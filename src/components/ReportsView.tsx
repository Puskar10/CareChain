import React from 'react';
import { useCareChain } from '../context/CareChainContext';
import { ArrowUpRight, ArrowRight, ClipboardList, FileSignature, FileText, FlaskConical, Paperclip, ScanLine } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { reports } = useCareChain();

  const typeIcon = (t: string) => {
    const cls = 'w-[1em] h-[1em] inline-block align-[-0.125em]';
    if (t === 'CBC Report' || t === 'Lab Report' || t === 'Biochemistry') return <FlaskConical className={cls} aria-hidden="true" />;
    if (t === 'Imaging') return <ScanLine className={cls} aria-hidden="true" />;
    if (t === 'Discharge Summary') return <ClipboardList className={cls} aria-hidden="true" />;
    if (t === 'Prescription') return <FileSignature className={cls} aria-hidden="true" />;
    return <FileText className={cls} aria-hidden="true" />;
  };

  const grouped: Record<string, typeof reports> = {};
  reports.forEach(r => { (grouped[r.reportType] ||= []).push(r); });

  return (
    <div className="max-w-screen-xl mx-auto page-gutter py-12 space-y-10">

      {/* Header */}
      <div>
        <span className="label-tag text-ink-muted">MEDICAL DOCUMENTATION</span>
        <h1 className="headline-lg text-ink-primary mt-3">Reports & Records</h1>
        <p className="text-sm text-ink-secondary mt-2">{reports.length} documents across {Object.keys(grouped).length} categories</p>
      </div>

      {/* Category sections */}
      {Object.entries(grouped).map(([type, docs]) => (
        <div key={type}>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-lg">{typeIcon(type)}</span>
            <span className="label-tag-lg text-ink-primary capitalize">{type}</span>
            <span className="label-tag text-ink-muted">({docs.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {docs.map((report, idx) => (
              <div key={report.id} className="glass-light p-6 pressable group animate-drift-up" style={{borderRadius:'1.5rem', animationDelay:`${idx*0.06}s`}}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{background:'rgba(0,0,0,0.04)',border:'1px solid rgba(0,0,0,0.06)'}}>
                    {typeIcon(report.reportType)}
                  </div>
                  <div className="flex items-center gap-2">
                    {report.aiVerified && (
                      <span className="pill pill-cyan text-[11px]">AI Verified</span>
                    )}
                    {report.fileUrl && (
                      <a href={report.fileUrl} target="_blank" rel="noreferrer"
                        className="p-1.5 text-ink-muted hover:text-ink-primary transition-colors opacity-0 group-hover:opacity-100">
                        <ArrowUpRight className="w-3.5 h-3.5"/>
                      </a>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-ink-primary leading-snug mb-1" style={{letterSpacing:'-0.01em'}}>
                  {report.title}
                </h3>
                <p className="font-mono text-xs text-ink-muted">
                  {report.uploadedAt}
                </p>

                {/* Summary */}
                {report.summary && (
                  <p className="text-xs text-ink-secondary mt-3 leading-relaxed line-clamp-3">{report.summary}</p>
                )}

                {/* Key extracted values */}
                {report.extractedData && Object.keys(report.extractedData).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-black/[0.05] grid grid-cols-2 gap-2">
                    {Object.entries(report.extractedData).slice(0, 6).map(([k,v]) => (
                      <div key={k} className="flex items-start justify-between gap-1">
                        <span className="text-[11px] text-ink-muted truncate">{k}</span>
                        <span className="font-mono text-[11px] text-ink-primary font-medium ml-1 shrink-0 text-right" style={{maxWidth:'50%'}}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* File name */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[11px] text-ink-muted inline-flex items-center gap-1"><Paperclip className="w-3 h-3" aria-hidden="true" />{report.fileName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {reports.length === 0 && (
        <div className="glass-light p-16 text-center">
          <p className="text-sm text-ink-muted">No reports on file.</p>
        </div>
      )}

    </div>
  );
};
