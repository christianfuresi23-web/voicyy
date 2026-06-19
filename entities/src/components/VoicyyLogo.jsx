import React from 'react';

// Voicyy logo - waveform bars + VOICYY text, transparent background
export default function VoicyyLogo({ size = 'md', className = '' }) {
  const scales = { sm: 0.7, md: 1, lg: 1.4, xl: 1.8 };
  const s = scales[size] || 1;
  const w = Math.round(180 * s);
  const h = Math.round(50 * s);

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 180 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Waveform bars - gradient cyan to blue */}
      <defs>
        <linearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00e5ff" />
          <stop offset="100%" stopColor="#0077b6" />
        </linearGradient>
      </defs>
      {/* Bar 1 - short */}
      <rect x="2" y="19" width="5" height="12" rx="2.5" fill="url(#waveGrad)" />
      {/* Bar 2 - medium */}
      <rect x="11" y="13" width="5" height="24" rx="2.5" fill="url(#waveGrad)" />
      {/* Bar 3 - tall */}
      <rect x="20" y="7" width="5" height="36" rx="2.5" fill="url(#waveGrad)" />
      {/* Bar 4 - tallest */}
      <rect x="29" y="3" width="5" height="44" rx="2.5" fill="url(#waveGrad)" />
      {/* Bar 5 - tall */}
      <rect x="38" y="7" width="5" height="36" rx="2.5" fill="url(#waveGrad)" />
      {/* Bar 6 - medium-short */}
      <rect x="47" y="16" width="5" height="18" rx="2.5" fill="url(#waveGrad)" />
      {/* Bar 7 - short */}
      <rect x="56" y="20" width="5" height="10" rx="2.5" fill="url(#waveGrad)" />

      {/* VOICYY text */}
      <text
        x="72"
        y="34"
        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif"
        fontWeight="700"
        fontSize="22"
        letterSpacing="3"
        fill="#2d2d2f"
      >
        VOICYY
      </text>
    </svg>
  );
}