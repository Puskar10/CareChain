import React from 'react';
import { navigateTo } from '../lib/route';

/**
 * CareChain logo + wordmark + tagline, rendered as a real link to the public homepage.
 * Plain clicks are handled in-app (no reload); modified clicks (new tab, etc.) fall
 * through to the browser via the real href.
 */
export const BrandLink: React.FC = () => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigateTo('home');
  };

  return (
    <a
      href="/"
      onClick={handleClick}
      aria-label="CareChain — go to homepage"
      className="flex items-center gap-2 shrink-0 group pressable cursor-pointer"
      style={{ textDecoration: 'none' }}
    >
      <img
        src="/assets/Logo.png"
        alt=""
        style={{
          height: '32px',
          width: 'auto',
          objectFit: 'contain',
          objectPosition: 'center',
          display: 'block',
          flexShrink: 0,
        }}
      />
      <div style={{ lineHeight: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px' }}>
        <span
          style={{
            fontFamily: "'Carmen Sans', 'Manrope', system-ui, sans-serif",
            fontWeight: 800,
            fontSize: '0.9375rem',
            letterSpacing: '-0.025em',
            color: 'var(--ink-primary)',
            lineHeight: 1,
            display: 'block',
          }}
        >
          CareChain
        </span>
        <span
          className="hidden sm:block"
          style={{
            fontFamily: "'Manrope', system-ui, sans-serif",
            fontWeight: 400,
            fontSize: '0.625rem',
            letterSpacing: '0.02em',
            color: 'var(--ink-secondary)',
            lineHeight: 1,
            display: 'block',
            marginTop: '2px',
          }}
        >
          Connect. Analyse. Save.
        </span>
      </div>
    </a>
  );
};
