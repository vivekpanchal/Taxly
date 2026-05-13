'use client';
import React, { useMemo } from 'react';
import type { Theme } from '@/lib/theme';
import { Icons } from '@/components/ui/Icons';
import { fmtINR, fmtINRShort } from '@/lib/formatters';
import { calcOldRegime, calcNewRegime, DEFAULT_USER } from '@/lib/taxCalc';

interface HomeScreenProps {
  t: Theme;
  signedIn: boolean;
  onSignIn: () => void;
  onJumpUpload: () => void;
  onJumpVerdict: () => void;
  onJumpGap: () => void;
  onJumpManual: () => void;
}

const DEDUCTION_ITEMS = [
  { code: '80C', max: 150000, used: 92000 + 86400 },
  { code: '80CCD(1B)', max: 50000, used: 0 },
  { code: '80D', max: 25000, used: 18000 },
  { code: 'HRA', max: 360000, used: 264000 },
  { code: '80TTA', max: 10000, used: 0 },
];

const QUICK_WINS = [
  { code: '80CCD(1B)', label: 'Open NPS account',       save: 15600, sub: '₹50K/year, locked till 60' },
  { code: 'HRA',       label: 'Submit rent receipts',    save: 28800, sub: 'Up to ₹96K extra HRA exempt' },
  { code: '80TTA',     label: 'Claim savings interest',  save: 3120,  sub: 'Up to ₹10K from bank interest' },
];

export function HomeScreen({ t, signedIn, onSignIn, onJumpUpload, onJumpVerdict, onJumpGap, onJumpManual }: HomeScreenProps) {
  const old = useMemo(() => calcOldRegime(DEFAULT_USER), []);
  const nw = useMemo(() => calcNewRegime(DEFAULT_USER), []);
  const winner: 'old' | 'new' = old.tax <= nw.tax ? 'old' : 'new';
  const regimeSavings = Math.abs(old.tax - nw.tax);
  const deductionSavings = DEDUCTION_ITEMS.reduce((s, i) => s + Math.max(0, i.max - i.used) * 0.3 * 1.04, 0);
  const totalPotential = regimeSavings + deductionSavings;

  return (
    <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '60px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: t.brandSoft, color: t.brand, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 16 }}>
            {signedIn ? 'R' : '?'}
          </div>
          <div>
            <div style={{ fontSize: 12, color: t.inkMid }}>{signedIn ? 'Hey Rohan' : 'Hey there'}</div>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.2 }}>Your savings, FY 25-26</div>
          </div>
        </div>
        <button onClick={!signedIn ? onSignIn : undefined} style={{ width: 40, height: 40, borderRadius: 20, border: `1px solid ${t.line}`, background: t.surface, color: t.inkMid, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
          <Icons.user stroke="currentColor" style={{ width: 18, height: 18 }}/>
        </button>
      </div>

      {/* Guest banner */}
      {!signedIn && (
        <div style={{ padding: '8px 20px 0' }}>
          <button onClick={onSignIn} style={{ appearance: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', background: t.warnSoft, border: `1px solid ${t.warn}33`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: t.warn, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700 }}>!</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>You&apos;re using Taxly as a guest</div>
              <div style={{ fontSize: 11, color: t.inkMid, marginTop: 1 }}>Sign in to save your numbers across devices</div>
            </div>
            <div style={{ fontSize: 12, color: t.brand, fontWeight: 600, flexShrink: 0 }}>Sign in →</div>
          </button>
        </div>
      )}

      {/* Hero */}
      <div style={{ padding: '16px 20px 0' }}>
        <div onClick={onJumpVerdict} style={{ borderRadius: 24, padding: 22, cursor: 'pointer', background: t.brand, color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, background: 'radial-gradient(circle, rgba(212,255,79,0.4) 0%, transparent 70%)', top: -60, right: -60 }}/>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: t.accent, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
              <Icons.bolt fill="currentColor"/>
              You can save up to
            </div>
            <div style={{ fontFamily: 'var(--font-geist-sans), system-ui', fontSize: 48, fontWeight: 700, letterSpacing: -1.8, color: '#fff', marginTop: 8, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {fmtINR(totalPotential)}
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
              ₹{Math.round(regimeSavings/1000)}K from picking the right regime · ₹{Math.round(deductionSavings/1000)}K from unused deductions
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ padding: '12px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button onClick={onJumpVerdict} style={{ appearance: 'none', cursor: 'pointer', textAlign: 'left', background: t.surface, border: `1px solid ${t.line}`, borderRadius: 18, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: t.inkMid, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>
            <Icons.trend stroke="currentColor" style={{ width: 14, height: 14 }}/>
            Best regime
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.6, color: t.ink, textTransform: 'capitalize' }}>{winner} regime</div>
          <div style={{ fontSize: 12, color: t.inkMid }}>Saves <b style={{ color: t.brand, fontFamily: 'var(--font-geist-mono), monospace' }}>{fmtINRShort(regimeSavings)}</b> vs the other</div>
        </button>
        <button onClick={onJumpGap} style={{ appearance: 'none', cursor: 'pointer', textAlign: 'left', background: t.surface, border: `1px solid ${t.line}`, borderRadius: 18, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: t.inkMid, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>
            <Icons.spark stroke="currentColor" style={{ width: 14, height: 14 }}/>
            Deductions left
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.6, color: t.ink }}>{fmtINRShort(deductionSavings)}</div>
          <div style={{ fontSize: 12, color: t.inkMid }}>Across <b>{DEDUCTION_ITEMS.filter(i => i.used < i.max).length} sections</b></div>
        </button>
      </div>

      {/* Quick wins */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: t.inkMid, marginBottom: 10, paddingLeft: 4 }}>Quick wins</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {QUICK_WINS.map((q, i) => (
            <div key={i} style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 16, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: t.brandSoft, color: t.brand, display: 'grid', placeItems: 'center', flexShrink: 0, fontFamily: 'var(--font-geist-mono), monospace', fontSize: 10, fontWeight: 700 }}>{q.code}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2, color: t.ink }}>{q.label}</div>
                <div style={{ fontSize: 12, color: t.inkMid, marginTop: 2 }}>{q.sub}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.brand, fontFamily: 'var(--font-geist-mono), monospace', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>+{fmtINRShort(q.save)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Your inputs */}
      <div style={{ padding: '20px 20px 100px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: t.inkMid, marginBottom: 10, paddingLeft: 4 }}>Your inputs</div>
        <div style={{ background: t.surface, borderRadius: 18, border: `1px solid ${t.line}`, overflow: 'hidden' }}>
          {[
            { l: 'Form 16 — Cohera Systems', sub: 'Auto-filled · 9 fields', action: 'Update', onClick: onJumpUpload },
            { l: 'Manual entries', sub: 'Salary, HRA, deductions', action: 'Edit', onClick: onJumpManual },
          ].map((r, i) => (
            <button key={i} onClick={r.onClick} style={{ appearance: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'transparent', border: 0, borderTop: i === 0 ? undefined : `1px solid ${t.line}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: t.ink }}>{r.l}</div>
                <div style={{ fontSize: 12, color: t.inkMid, marginTop: 2 }}>{r.sub}</div>
              </div>
              <div style={{ fontSize: 12, color: t.brand, fontWeight: 600 }}>{r.action}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <TabBar t={t}/>
    </div>
  );
}

function TabBar({ t }: { t: Theme }) {
  const tabs = [
    { icon: <Icons.home stroke="currentColor"/>, label: 'Savings', active: true },
    { icon: <Icons.trend stroke="currentColor"/>, label: 'Verdict' },
    { icon: <Icons.spark stroke="currentColor"/>, label: 'Plan' },
    { icon: <Icons.user stroke="currentColor"/>, label: 'Profile' },
  ];
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 26, paddingTop: 10, paddingLeft: 16, paddingRight: 16, background: `linear-gradient(180deg, transparent 0%, ${t.bg} 30%)`, pointerEvents: 'auto' }}>
      <div style={{ background: t.surface, borderRadius: 28, border: `1px solid ${t.line}`, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-around', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
        {tabs.map((tab, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: tab.active ? t.brand : t.inkSoft, fontSize: 10, fontWeight: 500, cursor: 'pointer' }}>
            {tab.icon}
            <span>{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
