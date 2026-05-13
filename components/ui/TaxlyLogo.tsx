'use client';
import React from 'react';

interface LogoProps {
  size?: number;
  color?: string;
  accent?: string;
}

export function TaxlyLogo({ size = 40, color = '#0B6E4F', accent = '#D4FF4F' }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="2" y="2" width="60" height="60" rx="18" fill={color}/>
      <path d="M22 18h22M22 26h22M28 18c5 0 9 3 9 8s-4 8-9 8h-3l13 12"
        stroke={accent} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

export function TaxlyWordmark({ color = '#0B6E4F', accent = '#D4FF4F' }: { color?: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <TaxlyLogo size={28} color={color} accent={accent}/>
      <div style={{ fontFamily: 'var(--font-geist-sans), system-ui', fontSize: 22, fontWeight: 600, letterSpacing: -0.6, color }}>
        taxly
      </div>
    </div>
  );
}
