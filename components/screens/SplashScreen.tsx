'use client';
import React from 'react';
import type { Theme } from '@/lib/theme';
import { TaxlyLogo } from '@/components/ui/TaxlyLogo';
import { PrimaryButton } from '@/components/ui/Buttons';
import { Icons } from '@/components/ui/Icons';

interface SplashScreenProps {
  t: Theme;
  onContinue: () => void;
  onSignIn: () => void;
}

export function SplashScreen({ t, onContinue, onSignIn }: SplashScreenProps) {
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: t.bg, color: t.ink,
      display: 'flex', flexDirection: 'column',
      paddingTop: 80, paddingBottom: 40,
    }}>
      {/* decorative ₹ grid */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0.05 }}>
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: 12 + (i % 4) * 2,
            color: t.ink,
            transform: `rotate(${(i * 17) % 30 - 15}deg)`,
          }}>₹</div>
        ))}
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', padding: '0 32px', position: 'relative', zIndex: 1,
      }}>
        <TaxlyLogo size={80} color={t.brand} accent={t.accent}/>
        <div style={{
          marginTop: 28, fontFamily: 'var(--font-geist-sans), system-ui',
          fontSize: 44, fontWeight: 700, letterSpacing: -1.6, lineHeight: 1.05,
          textAlign: 'center', color: t.ink,
        }}>
          Save more tax.<br/>In 30 seconds.
        </div>
        <div style={{
          marginTop: 14, fontSize: 16, color: t.inkMid, textAlign: 'center',
          letterSpacing: -0.2, lineHeight: 1.5, maxWidth: 280,
        }}>
          Old vs New regime, deduction gaps, and exactly how much more you can save — in plain English.
        </div>
      </div>

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 1 }}>
        <PrimaryButton t={t} onClick={onContinue} trailing={<Icons.arrow stroke="currentColor"/>}>
          Try it free — no signup
        </PrimaryButton>
        <button onClick={onSignIn} style={{
          appearance: 'none', border: 0, background: 'transparent',
          color: t.ink, fontSize: 14, padding: 12, cursor: 'pointer',
          fontFamily: 'var(--font-geist-sans), system-ui', fontWeight: 500,
        }}>I already have an account</button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: t.inkSoft, fontSize: 12, marginTop: 4 }}>
          <Icons.lock stroke="currentColor"/>
          <span>No PAN, email or signup needed to start</span>
        </div>
      </div>
    </div>
  );
}
