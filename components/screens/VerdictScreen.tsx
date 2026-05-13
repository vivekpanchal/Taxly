'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Theme } from '@/lib/theme';
import { PrimaryButton, BackButton } from '@/components/ui/Buttons';
import { Icons } from '@/components/ui/Icons';
import { fmtINR, fmtINRShort } from '@/lib/formatters';
import { calcOldRegime, calcNewRegime, sliceBySlabs, SLABS_OLD, SLABS_NEW, DEFAULT_USER } from '@/lib/taxCalc';
import type { SlabDef } from '@/lib/taxCalc';
import { useCountUpRef } from '@/hooks/useCountUp';

const SLAB_COLORS = ['#A7D9B7','#7FC998','#5DB87E','#3DA767','#208C50','#0B6E4F','#063D2C'];

interface VerdictScreenProps {
  t: Theme;
  onContinue: () => void;
  onBack: () => void;
}

export function VerdictScreen({ t, onContinue, onBack }: VerdictScreenProps) {
  const [learn, setLearn] = useState(true);
  const [grossOverride, setGrossOverride] = useState<number | null>(null);

  const gross = grossOverride ?? (DEFAULT_USER.salary.basic + DEFAULT_USER.salary.hra + DEFAULT_USER.salary.lta + DEFAULT_USER.salary.special + DEFAULT_USER.salary.bonus);

  const { old, nw } = useMemo(() => {
    const ratio = gross / 1800000;
    const u = {
      ...DEFAULT_USER,
      salary: {
        basic: Math.round(720000 * ratio),
        hra: Math.round(360000 * ratio),
        lta: Math.round(60000 * ratio),
        special: Math.round(540000 * ratio),
        bonus: Math.round(120000 * ratio),
        pf: Math.round(86400 * ratio),
        professional: 2400,
        standardDed: 75000,
      },
      rentPaid: Math.round(264000 * ratio),
      declared80C: Math.min(150000, Math.round(92000 * ratio)),
      declared80D: 18000,
      nps80CCD1B: 0,
      homeLoanInterest: 0,
    };
    return { old: calcOldRegime(u), nw: calcNewRegime(u) };
  }, [gross]);

  const winner: 'old' | 'new' = old.tax <= nw.tax ? 'old' : 'new';
  const winnerTax = winner === 'old' ? old.tax : nw.tax;
  const loserTax = winner === 'old' ? nw.tax : old.tax;
  const savings = loserTax - winnerTax;
  const monthlyOld = (gross - old.tax) / 12;
  const monthlyNew = (gross - nw.tax) / 12;
  const monthlyDelta = Math.abs(monthlyNew - monthlyOld);

  const savingsRef = useCountUpRef(savings, 1100, fmtINR);

  return (
    <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '60px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton onClick={onBack} t={t}/>
        <div style={{ fontSize: 13, color: t.inkMid, fontWeight: 500 }}>Your verdict · FY 2025-26</div>
        <button onClick={() => setLearn(!learn)} style={{
          height: 32, padding: '0 12px', borderRadius: 16,
          border: `1px solid ${learn ? t.brand : t.lineStrong}`,
          background: learn ? t.brandSoft : 'transparent', color: learn ? t.brand : t.inkMid,
          fontFamily: 'var(--font-geist-sans), system-ui', fontSize: 11, fontWeight: 600,
          letterSpacing: 0.4, textTransform: 'uppercase', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ width: 14, height: 14, borderRadius: 7, display: 'grid', placeItems: 'center', background: learn ? t.brand : t.lineStrong, color: '#fff', fontSize: 9 }}>?</span>
          Learn
        </button>
      </div>

      {/* Hero */}
      <div style={{ padding: '8px 16px 0' }}>
        <div style={{ borderRadius: 28, padding: '22px 22px 24px', background: `linear-gradient(160deg, ${t.brand} 0%, #074E36 100%)`, color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 50px rgba(11,110,79,0.28)' }}>
          <div style={{ position: 'absolute', width: 240, height: 240, borderRadius: 120, background: 'radial-gradient(circle, rgba(212,255,79,0.32) 0%, transparent 65%)', top: -80, right: -80, pointerEvents: 'none' }}/>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: t.accent }}>
              <Icons.bolt fill="currentColor" style={{ width: 14, height: 14 }}/>
              Recommended for you
            </div>
            <div style={{ marginTop: 12, fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>Hi Rohan, go with the</div>
            <div style={{ fontFamily: 'var(--font-geist-sans), system-ui', fontSize: 46, fontWeight: 700, letterSpacing: -1.4, lineHeight: 1.05, color: '#fff', marginTop: 2, textTransform: 'capitalize' }}>
              {winner} regime
            </div>
            <div style={{ marginTop: 18, display: 'flex', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>You save / year</div>
                <div ref={savingsRef as React.RefObject<HTMLDivElement>} style={{ marginTop: 4, fontFamily: 'var(--font-geist-sans), system-ui', fontSize: 30, fontWeight: 700, letterSpacing: -1, color: t.accent, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(savings)}</div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.18)' }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>Extra each month</div>
                <div style={{ marginTop: 4, fontFamily: 'var(--font-geist-sans), system-ui', fontSize: 30, fontWeight: 700, letterSpacing: -1, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{fmtINR(monthlyDelta)}</div>
              </div>
            </div>
            {learn && (
              <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.9)' }}>
                <b style={{ color: t.accent }}>In plain English:</b>{' '}
                {winner === 'new'
                  ? 'The New regime has lower tax rates but doesn\'t let you claim things like rent (HRA) or insurance (80C). For your salary, the lower rates win.'
                  : 'The Old regime has higher rates but lets you reduce tax by claiming HRA, 80C, 80D etc. You\'ve used enough of those to come out ahead.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Budget 2025 callout */}
      <div style={{ padding: '12px 16px 0' }}><BudgetCallout t={t}/></div>

      {/* Side by side */}
      <div style={{ padding: '20px 16px 0' }}>
        <SectionLabel t={t} right={<span style={{ color: t.inkSoft, fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>on {fmtINRShort(gross)} salary</span>}>Side by side</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <RegimeCard t={t} name="Old regime" subtitle="Higher rates, more deductions" tax={old.tax} monthly={monthlyOld} winner={winner === 'old'}/>
          <RegimeCard t={t} name="New regime" subtitle="Lower rates, no deductions" tax={nw.tax} monthly={monthlyNew} winner={winner === 'new'}/>
        </div>
      </div>

      {/* Slab visualizer */}
      <div style={{ padding: '20px 16px 0' }}>
        <SectionLabel t={t}>How your income gets taxed</SectionLabel>
        <div style={{ marginTop: 10, padding: 16, background: t.surface, border: `1px solid ${t.line}`, borderRadius: 22 }}>
          <SlabVisualizer t={t} taxable={winner === 'old' ? old.taxable : nw.taxable} slabs={winner === 'old' ? SLABS_OLD : SLABS_NEW} regimeName={winner}/>
        </div>
      </div>

      {/* Income explorer */}
      <div style={{ padding: '20px 16px 0' }}>
        <SectionLabel t={t} right={<span style={{ color: t.inkSoft, fontWeight: 500, letterSpacing: 0, textTransform: 'none', fontSize: 11 }}>What if your salary was…</span>}>Play with the numbers</SectionLabel>
        <IncomeExplorer t={t} value={gross} onChange={setGrossOverride} oldTax={old.tax} newTax={nw.tax}/>
      </div>

      {/* Tax 101 */}
      {learn && <div style={{ padding: '20px 16px 0' }}><Tax101 t={t}/></div>}

      {/* Full math */}
      <div style={{ padding: '20px 16px 0' }}>
        <SectionLabel t={t}>The full math</SectionLabel>
        <MathBreakdown t={t} winner={winner} old={old} nw={nw} learn={learn}/>
      </div>

      {/* CTAs */}
      <div style={{ padding: '20px 16px 36px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PrimaryButton t={t} onClick={onContinue} trailing={<Icons.arrow stroke="currentColor"/>}>See where else I can save</PrimaryButton>
        <button style={{ appearance: 'none', border: `1px solid ${t.line}`, background: t.surface, color: t.ink, height: 52, borderRadius: 14, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-geist-sans), system-ui', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Icons.chat stroke="currentColor" style={{ width: 18, height: 18 }}/>
          Ask why — chat with a CA
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ t, children, right }: { t: Theme; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: t.inkMid, paddingLeft: 4 }}>
      <span>{children}</span>
      {right}
    </div>
  );
}

function BudgetCallout({ t }: { t: Theme }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 18, overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{ appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer', width: '100%', padding: '12px 14px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: '#FFEFC2', color: '#7A5500', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-geist-sans), system-ui', fontSize: 16 }}>★</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.ink, letterSpacing: -0.1 }}>What changed in Budget 2025</div>
          <div style={{ fontSize: 11, color: t.inkMid, marginTop: 1 }}>New regime is even more generous now — tap to see</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease', flexShrink: 0 }}>
          <path d="M6 9l6 6 6-6" stroke={t.inkSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10, animation: 'taxlyFadeIn .25s ease' }}>
          {[
            { k: '0% slab raised', v: 'Up to ₹4L is now tax-free (was ₹3L)' },
            { k: '87A rebate widened', v: 'No tax up to ₹12L taxable income (was ₹7L)' },
            { k: 'New 25% slab', v: 'Added between ₹20L and ₹24L' },
            { k: 'Standard deduction', v: 'Stays at ₹75,000 for salaried folks' },
          ].map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: t.brand, flexShrink: 0, marginTop: 7 }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.ink }}>{b.k}</div>
                <div style={{ fontSize: 11, color: t.inkMid, marginTop: 1, lineHeight: 1.4 }}>{b.v}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RegimeCard({ t, name, subtitle, tax, monthly, winner }: { t: Theme; name: string; subtitle: string; tax: number; monthly: number; winner: boolean }) {
  return (
    <div style={{ borderRadius: 20, padding: '14px 14px 16px', position: 'relative', background: winner ? t.brandSoft : t.surface, border: `1.5px solid ${winner ? t.brand : t.line}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {winner && <div style={{ position: 'absolute', top: -8, right: 12, background: t.brand, color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
        <svg width="10" height="10" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Winner
      </div>}
      <div style={{ fontSize: 13, fontWeight: 700, color: winner ? t.brandInk : t.ink }}>{name}</div>
      <div style={{ fontSize: 10.5, color: t.inkMid, lineHeight: 1.4, minHeight: 28 }}>{subtitle}</div>
      <div style={{ marginTop: 6 }}>
        <div style={{ fontSize: 10, color: t.inkMid, letterSpacing: 0.4, fontWeight: 600, textTransform: 'uppercase' }}>You pay / year</div>
        <div style={{ fontFamily: 'var(--font-geist-sans), system-ui', fontSize: 22, fontWeight: 700, letterSpacing: -0.6, color: winner ? t.brandInk : t.ink, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(tax)}</div>
      </div>
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${winner ? t.brand + '50' : t.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 11, color: t.inkMid }}>In hand / month</div>
        <div style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, fontWeight: 600, color: winner ? t.brand : t.ink, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(monthly)}</div>
      </div>
    </div>
  );
}

function SlabVisualizer({ t, taxable, slabs, regimeName }: { t: Theme; taxable: number; slabs: SlabDef[]; regimeName: string }) {
  const slices = sliceBySlabs(taxable, slabs);
  const totalTax = slices.reduce((s, x) => s + x.tax, 0);
  const usedSlices = slices.filter((s) => s.amount > 0);
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 11, color: t.inkMid, fontWeight: 500 }}>Your taxable income</div>
        <div style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, fontWeight: 600, color: t.ink, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(taxable)}</div>
      </div>
      <div style={{ marginTop: 10, height: 40, borderRadius: 10, overflow: 'hidden', display: 'flex', background: t.surfaceAlt, boxShadow: `inset 0 0 0 1px ${t.line}` }}>
        {usedSlices.map((s, i) => {
          const pct = (s.amount / taxable) * 100;
          const col = SLAB_COLORS[Math.min(SLAB_COLORS.length - 1, slabs.findIndex(x => x.upto === s.upto))];
          return (
            <div key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(hover === i ? null : i)}
              style={{ width: `${pct}%`, background: col, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: i < usedSlices.length - 1 ? '1px solid rgba(255,255,255,0.4)' : undefined, transition: 'filter .15s ease', filter: hover != null && hover !== i ? 'saturate(0.4) brightness(1.1)' : 'none' }}>
              {pct > 10 && <div style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: 0.5, textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>{Math.round(s.rate * 100)}%</div>}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 10, minHeight: 36 }}>
        {hover != null && usedSlices[hover] ? (() => {
          const s = usedSlices[hover];
          return (
            <div style={{ padding: '8px 10px', borderRadius: 10, background: t.surfaceAlt, display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'taxlyFadeIn .15s ease' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.ink }}>{s.label} · taxed at {Math.round(s.rate * 100)}%</div>
                <div style={{ fontSize: 10.5, color: t.inkMid, marginTop: 1, fontFamily: 'var(--font-geist-mono), monospace' }}>{fmtINR(s.amount)} of your income falls here</div>
              </div>
              <div style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, fontWeight: 700, color: s.rate === 0 ? t.brand : t.ink }}>{s.rate === 0 ? 'FREE' : '+' + fmtINR(s.tax)}</div>
            </div>
          );
        })() : <div style={{ fontSize: 11, color: t.inkSoft, textAlign: 'center', padding: '8px 0', fontStyle: 'italic' }}>Tap a band to see how much falls in that slab</div>}
      </div>
      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 12, borderTop: `1px solid ${t.line}` }}>
        {slabs.map((s, i) => {
          const used = slices.find(x => x.upto === s.upto);
          const active = (used?.amount ?? 0) > 0;
          return (
            <div key={i} style={{ padding: '4px 8px', borderRadius: 6, background: active ? SLAB_COLORS[Math.min(SLAB_COLORS.length - 1, i)] + '22' : 'transparent', border: `1px solid ${active ? SLAB_COLORS[Math.min(SLAB_COLORS.length - 1, i)] + '55' : t.line}`, fontSize: 10, color: active ? t.ink : t.inkSoft, fontWeight: 500, fontFamily: 'var(--font-geist-mono), monospace', display: 'flex', alignItems: 'center', gap: 4, opacity: active ? 1 : 0.5 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: SLAB_COLORS[Math.min(SLAB_COLORS.length - 1, i)], display: 'block' }}/>
              <span>{s.label}</span>
              <span style={{ color: t.inkMid }}>· {Math.round(s.rate * 100)}%</span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 10, background: t.brandSoft, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: t.brandInk, fontWeight: 600 }}>Total tax under {regimeName} regime</div>
        <div style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 15, fontWeight: 700, color: t.brandInk, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(totalTax)} <span style={{ fontSize: 10, color: t.inkMid, fontWeight: 500 }}>+ 4% cess</span></div>
      </div>
    </div>
  );
}

function IncomeExplorer({ t, value, onChange, oldTax, newTax }: { t: Theme; value: number; onChange: (v: number) => void; oldTax: number; newTax: number }) {
  const MIN = 500000, MAX = 5000000, STEP = 50000;
  const pct = ((value - MIN) / (MAX - MIN)) * 100;
  const winner: 'old' | 'new' = oldTax <= newTax ? 'old' : 'new';
  const savings = Math.abs(oldTax - newTax);

  return (
    <div style={{ marginTop: 10, padding: 16, background: t.surface, border: `1px solid ${t.line}`, borderRadius: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 12, color: t.inkMid }}>If your salary was</div>
        <div style={{ fontFamily: 'var(--font-geist-sans), system-ui', fontSize: 22, fontWeight: 700, color: t.ink, letterSpacing: -0.4, fontVariantNumeric: 'tabular-nums' }}>{fmtINRShort(value)}</div>
      </div>
      <div style={{ marginTop: 10, position: 'relative', height: 36 }}>
        <input type="range" min={MIN} max={MAX} step={STEP} value={value} onChange={(e) => onChange(Number(e.target.value))}
          style={{ width: '100%', height: 36, appearance: 'none', background: 'transparent', cursor: 'pointer', margin: 0, padding: 0 }}/>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 16, height: 4, borderRadius: 2, background: t.surfaceAlt, pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', left: 0, top: 16, height: 4, borderRadius: 2, width: `${pct}%`, background: t.brand, pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', left: `${pct}%`, top: 8, width: 20, height: 20, borderRadius: 10, background: t.brand, marginLeft: -10, boxShadow: '0 2px 8px rgba(11,110,79,0.4), 0 0 0 4px rgba(11,110,79,0.12)', pointerEvents: 'none' }}/>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: -2, fontSize: 10, color: t.inkSoft, fontFamily: 'var(--font-geist-mono), monospace' }}>
        <span>₹5L</span><span>₹15L</span><span>₹25L</span><span>₹35L</span><span>₹50L</span>
      </div>
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <MiniStat t={t} label="Old regime" value={fmtINRShort(oldTax)} dim={winner !== 'old'}/>
        <MiniStat t={t} label="New regime" value={fmtINRShort(newTax)} dim={winner !== 'new'}/>
      </div>
      <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: t.brandSoft, fontSize: 12, color: t.brandInk, lineHeight: 1.4 }}>
        <b style={{ textTransform: 'capitalize' }}>{winner}</b> regime is better by <b>{fmtINR(savings)}</b> at this salary.
      </div>
    </div>
  );
}

function MiniStat({ t, label, value, dim }: { t: Theme; label: string; value: string; dim: boolean }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 12, background: dim ? t.surfaceAlt : t.brandSoft, border: `1px solid ${dim ? t.line : t.brand + '40'}`, opacity: dim ? 0.6 : 1 }}>
      <div style={{ fontSize: 10, color: t.inkMid, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ marginTop: 4, fontFamily: 'var(--font-geist-sans), system-ui', fontSize: 17, fontWeight: 700, letterSpacing: -0.4, color: dim ? t.inkMid : t.brandInk, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

function Tax101({ t }: { t: Theme }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 22, overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{ appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer', width: '100%', padding: '14px 16px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, flexShrink: 0, background: t.brandSoft, color: t.brand, display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 700 }}>?</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.ink }}>Wait, how do tax slabs even work?</div>
          <div style={{ fontSize: 11, color: t.inkMid, marginTop: 2 }}>45-second explainer with no jargon</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }}>
          <path d="M6 9l6 6 6-6" stroke={t.inkSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div style={{ padding: '0 16px 18px', display: 'flex', flexDirection: 'column', gap: 14, animation: 'taxlyFadeIn .25s ease' }}>
          <div style={{ fontSize: 13, color: t.inkMid, lineHeight: 1.55 }}>
            Imagine your salary fills up a glass with marked levels. Each level has its own tax rate. You only pay the rate for what&apos;s <i>inside</i> that level — not on your whole salary.
          </div>
          <div style={{ padding: 14, background: t.bg, borderRadius: 14, border: `1px solid ${t.line}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 180 }}>
              <div style={{ position: 'relative', width: 80, height: '100%', display: 'flex', flexDirection: 'column-reverse' }}>
                {[
                  { h: 28, c: SLAB_COLORS[0], r: '0%' },
                  { h: 28, c: SLAB_COLORS[1], r: '5%' },
                  { h: 28, c: SLAB_COLORS[2], r: '10%' },
                  { h: 28, c: SLAB_COLORS[3], r: '15%' },
                  { h: 28, c: SLAB_COLORS[4], r: '20%' },
                  { h: 28, c: SLAB_COLORS[5], r: '25%' },
                ].map((b, i) => (
                  <div key={i} style={{ height: b.h, background: b.c, borderTop: i > 0 ? '1px dashed rgba(255,255,255,0.5)' : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 10, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>{b.r}</div>
                ))}
                <div style={{ position: 'absolute', inset: 0, borderRadius: 8, border: `2px solid ${t.ink}`, pointerEvents: 'none' }}/>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { n: '1', t: 'The first ₹4L is free', s: 'Nothing taxed' },
                  { n: '2', t: 'The next ₹4L pays 5%', s: 'Only on that slice' },
                  { n: '3', t: 'And so on, up the slabs', s: 'Higher slices, higher rates' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 10, background: t.brand, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, fontFamily: 'var(--font-geist-sans), system-ui', fontSize: 11, fontWeight: 700 }}>{s.n}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: t.ink }}>{s.t}</div>
                      <div style={{ fontSize: 11, color: t.inkMid, marginTop: 1 }}>{s.s}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ padding: 12, background: '#FFF8E1', borderRadius: 12, border: '1px solid #F5D87033', fontSize: 12, lineHeight: 1.5, color: '#5C4A00' }}>
            <b>So:</b> moving to the next slab doesn&apos;t mean your <i>whole</i> salary gets taxed at the higher rate — only the part above the line. Promotions are still good.
          </div>
        </div>
      )}
    </div>
  );
}

function MathBreakdown({ t, winner, old, nw, learn }: { t: Theme; winner: 'old' | 'new'; old: ReturnType<typeof calcOldRegime>; nw: ReturnType<typeof calcNewRegime>; learn: boolean }) {
  const rows = [
    { l: 'Gross salary', v: nw.gross, sub: 'From your Form 16' },
    ...(winner === 'old' ? [
      { l: 'HRA exempt', v: -(old.hraExempt ?? 0), accent: true, sub: 'Rent paid in Bengaluru (metro)' },
      { l: 'Standard deduction', v: -75000 },
      { l: '80C (PF + ELSS)', v: -150000, accent: true, sub: 'Maxed at ₹1.5L' },
      { l: '80D (medical)', v: -18000 },
    ] : [
      { l: 'Standard deduction', v: -75000, sub: 'Flat ₹75K — no proof needed' },
    ]),
    { l: 'Taxable income', v: winner === 'old' ? old.taxable : nw.taxable, bold: true, sub: 'After all deductions' },
    { l: 'Tax + 4% cess', v: winner === 'old' ? old.tax : nw.tax, final: true, sub: 'What you actually owe' },
  ];

  return (
    <div style={{ marginTop: 10, background: t.surface, borderRadius: 22, padding: 16, border: `1px solid ${t.line}` }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderTop: i === 0 ? undefined : `1px solid ${t.line}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: (r as any).bold || (r as any).final ? 700 : 500, color: (r as any).final ? t.danger : t.ink }}>{r.l}</div>
            {(r as any).sub && <div style={{ fontSize: 11, color: t.inkMid, marginTop: 2, lineHeight: 1.4 }}>{(r as any).sub}</div>}
          </div>
          <div style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: (r as any).final || (r as any).bold ? 16 : 14, fontWeight: (r as any).final || (r as any).bold ? 700 : 500, color: (r as any).accent ? t.brand : ((r as any).final ? t.danger : t.ink), fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', marginLeft: 12 }}>
            {r.v < 0 ? '-' : ''}{fmtINR(Math.abs(r.v))}
          </div>
        </div>
      ))}
    </div>
  );
}
