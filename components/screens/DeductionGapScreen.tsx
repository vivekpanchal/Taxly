'use client';
import React, { useState, useEffect } from 'react';
import type { Theme } from '@/lib/theme';
import { PrimaryButton, BackButton } from '@/components/ui/Buttons';
import { Icons } from '@/components/ui/Icons';
import { fmtINR, fmtINRShort } from '@/lib/formatters';

interface DeductionGapScreenProps {
  t: Theme;
  onContinue: () => void;
  onBack: () => void;
  signedIn: boolean;
  onSignIn: () => void;
}

const ITEMS = [
  { code: '80C',       name: 'ELSS / PF / Insurance',  max: 150000, used: 92000 + 86400, bracket: 0.30, meaning: 'Up to ₹1.5L of investments like ELSS mutual funds, PF, LIC and PPF reduce your taxable income.' },
  { code: '80CCD(1B)', name: 'NPS extra ₹50K',          max: 50000,  used: 0,             bracket: 0.30, meaning: 'An extra ₹50K deduction on top of 80C, available only if you invest in the National Pension System.' },
  { code: '80D',       name: 'Health insurance',         max: 25000,  used: 18000,         bracket: 0.30, meaning: 'Medical insurance premiums for yourself, spouse and kids.' },
  { code: 'HRA',       name: 'House rent allowance',     max: 360000, used: 264000,        bracket: 0.30, meaning: 'A part of your salary tagged for rent. Tax-free up to a limit if you pay rent and provide receipts.' },
  { code: '80TTA',     name: 'Savings interest',          max: 10000,  used: 0,             bracket: 0.30, meaning: 'Interest from your savings bank account up to ₹10K/year is tax-free.' },
];

function useCountUpAnim(target: number, duration = 1300) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf: number;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

export function DeductionGapScreen({ t, onContinue, onBack, signedIn, onSignIn }: DeductionGapScreenProps) {
  const totalSaving = ITEMS.reduce((s, i) => {
    const gap = Math.max(0, i.max - i.used);
    return s + gap * i.bracket * 1.04;
  }, 0);
  const animSaving = useCountUpAnim(totalSaving);

  return (
    <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ padding: '60px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton onClick={onBack} t={t}/>
        <div style={{ fontSize: 13, color: t.inkMid, fontWeight: 500 }}>Deduction gap</div>
        <div style={{ width: 40 }}/>
      </div>

      <div style={{ padding: '8px 24px 20px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: t.danger }}>Money on the table</div>
        <div style={{ marginTop: 8, fontFamily: 'var(--font-geist-sans), system-ui', fontSize: 34, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1.15, color: t.ink }}>
          You&apos;re leaving <span style={{ color: t.danger }}>{fmtINR(animSaving)}</span> behind this year.
        </div>
        <div style={{ marginTop: 10, fontSize: 13, color: t.inkMid, lineHeight: 1.5 }}>
          You&apos;ve used <b>{fmtINRShort(ITEMS.reduce((s, i) => s + i.used, 0))}</b> of your possible deductions. Each card below is a different way to lower your tax.
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ITEMS.map((it) => {
          const gap = Math.max(0, it.max - it.used);
          const pct = (it.used / it.max) * 100;
          const saved = gap * it.bracket * 1.04;
          const filled = gap === 0;
          return (
            <div key={it.code} style={{ background: t.surface, borderRadius: 18, padding: 16, border: `1px solid ${t.line}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 11, fontWeight: 700, letterSpacing: 0.4, padding: '3px 7px', borderRadius: 5, background: filled ? t.brandSoft : t.surfaceAlt, color: filled ? t.brand : t.inkMid }}>{it.code}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.1 }}>{it.name}</div>
                </div>
                {filled ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: t.brand, fontWeight: 700 }}>
                    <Icons.check stroke="currentColor" style={{ width: 14, height: 14 }}/>
                    Maxed
                  </div>
                ) : (
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.danger, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-geist-mono), monospace' }}>+{fmtINRShort(saved)}</div>
                )}
              </div>
              <div style={{ marginTop: 12, height: 6, borderRadius: 3, background: t.surfaceAlt, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: filled ? t.brand : t.warn, borderRadius: 3, transition: 'width .4s ease' }}/>
              </div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: t.inkMid, fontFamily: 'var(--font-geist-mono), monospace', fontVariantNumeric: 'tabular-nums' }}>
                <span>Used {fmtINR(it.used)}</span>
                <span>of {fmtINR(it.max)}</span>
              </div>
              {!filled && (
                <button style={{ marginTop: 12, width: '100%', height: 38, borderRadius: 10, border: `1px solid ${t.line}`, background: 'transparent', color: t.ink, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-geist-sans), system-ui', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Icons.spark stroke={t.brand} style={{ width: 14, height: 14 }}/>
                  How to claim {fmtINRShort(it.max - it.used)} more
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: '20px 20px 36px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!signedIn && (
          <button onClick={onSignIn} style={{ appearance: 'none', cursor: 'pointer', background: t.brandSoft, border: `1px solid ${t.brand}33`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: t.brand, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icons.lock stroke="currentColor" style={{ width: 14, height: 14 }}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>Sign in to save your plan</div>
              <div style={{ fontSize: 11, color: t.inkMid, marginTop: 1 }}>Track these gaps year-round</div>
            </div>
            <div style={{ fontSize: 12, color: t.brand, fontWeight: 600, flexShrink: 0 }}>→</div>
          </button>
        )}
        <PrimaryButton t={t} onClick={onContinue}>Continue to dashboard</PrimaryButton>
      </div>
    </div>
  );
}
