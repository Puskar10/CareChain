import React, { useState } from 'react';
import { useCareChain } from '../../context/CareChainContext';
import { X, Share2, Copy, Check, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] text-sm text-ink-primary bg-white focus:outline-none focus:border-accent-cyan/50 focus:ring-2 focus:ring-accent-cyan/10 transition-all";

export const ShareModal: React.FC = () => {
  const { isShareModalOpen, setIsShareModalOpen, activePatient } = useCareChain();
  const [scope, setScope] = useState('72h');
  const [expiry, setExpiry] = useState('24');
  const [copied, setCopied] = useState(false);

  if (!isShareModalOpen) return null;

  const shareUrl = activePatient ? `https://carechain.health/emergency-handover/${activePatient.id}?scope=${scope}&exp=${expiry}h` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="modal-panel w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="p-7 pb-5 border-b border-black/[0.05]">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-cyan/10 border border-accent-cyan/15 flex items-center justify-center">
                <Share2 className="w-4 h-4 text-accent-blue"/>
              </div>
              <div>
                <span className="label-tag text-ink-muted">SHARE HANDOVER</span>
                <h2 className="text-xl font-light text-ink-primary mt-1" style={{letterSpacing:'-0.02em'}}>
                  Send to Physician
                </h2>
                <p className="text-xs text-ink-muted mt-1">
                  Generate a secure, expiring link for emergency staff.
                </p>
              </div>
            </div>
            <button onClick={() => setIsShareModalOpen(false)} className="p-2 rounded-full text-ink-muted hover:text-ink-primary hover:bg-black/[0.04] transition-all">
              <X className="w-4 h-4"/>
            </button>
          </div>
        </div>

        <div className="p-7 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-tag text-ink-muted block mb-1.5">INFORMATION SCOPE</label>
              <select value={scope} onChange={e => setScope(e.target.value)} className={inputCls}>
                <option value="60s">60-Second Summary only</option>
                <option value="24h">Last 24 Hours</option>
                <option value="72h">Last 72 Hours (Full Case)</option>
                <option value="full">Full Timeline</option>
              </select>
            </div>
            <div>
              <label className="label-tag text-ink-muted block mb-1.5">LINK EXPIRATION</label>
              <select value={expiry} onChange={e => setExpiry(e.target.value)} className={inputCls}>
                <option value="1">1 Hour</option>
                <option value="24">24 Hours</option>
                <option value="72">72 Hours</option>
              </select>
            </div>
          </div>

          {/* Secure URL */}
          <div className="p-4 rounded-2xl bg-accent-cyan/5 border border-accent-cyan/15">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-3 h-3 text-accent-blue"/>
              <span className="label-tag text-accent-blue">SECURE TOKENIZED LINK</span>
            </div>
            <p className="font-mono text-xs text-ink-secondary bg-white p-3 rounded-xl border border-black/[0.06] break-all select-all">
              {shareUrl}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={() => setIsShareModalOpen(false)} className="btn-ghost">Close</button>
            <button onClick={handleCopy} className="btn-primary">
              {copied ? <Check className="w-3.5 h-3.5"/> : <Copy className="w-3.5 h-3.5"/>}
              <span>{copied ? 'Copied!' : 'Copy Doctor Link'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
