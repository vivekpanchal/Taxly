'use client';
import React, { useState, useMemo, useCallback } from 'react';
import {
  calcOldRegime, calcNewRegime, calcDeductionGaps,
  sliceBySlabs, SLABS_NEW, getOldSlabs, HRA_METRO_CITIES,
  type UserInput, type AgeGroup, type MetroCity,
} from '@/lib/taxCalc';
import { fmtINR, fmtINRShort } from '@/lib/formatters';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function n(s: string): number {
  const v = Number(String(s).replace(/[^0-9.]/g, '').trim());
  return isFinite(v) ? v : 0;
}

const SLAB_COLORS = ['#C8EDD8','#8FD4AA','#5DB87E','#3DA767','#208C50','#0B6E4F','#074433'];
const ALL_CITIES: MetroCity[] = [...HRA_METRO_CITIES, 'Other'];

// ─────────────────────────────────────────────────────────────────────────────
// Form state
// ─────────────────────────────────────────────────────────────────────────────

interface Form {
  age: AgeGroup;
  city: MetroCity;
  gross: string;
  basic: string;
  hra: string;
  pf: string;
  otherIncome: string;
  rentPaid: string;
  sec80C: string;
  sec80D: string;
  sec80D_parents: string;
  sec80CCD1B: string;
  homeLoanInterest: string;
  sec80TTA: string;
  sec80TTB: string;
  sec80E: string;
}

const INIT: Form = {
  age: 'below60', city: 'Other',
  gross: '', basic: '', hra: '', pf: '', otherIncome: '',
  rentPaid: '',
  sec80C: '', sec80D: '', sec80D_parents: '', sec80CCD1B: '',
  homeLoanInterest: '', sec80TTA: '', sec80TTB: '', sec80E: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────

export function TaxCalculator() {
  const [form, setForm] = useState<Form>(INIT);
  const upd = useCallback(<K extends keyof Form>(k: K, v: Form[K]) =>
    setForm(f => ({ ...f, [k]: v })), []);

  const gross   = n(form.gross);
  const basic   = n(form.basic)  || Math.round(gross * 0.40);
  const hra     = n(form.hra)    || Math.round(gross * 0.20);
  const pf      = n(form.pf)     || Math.round(basic * 0.12);
  const hasGross = gross > 0;

  const input = useMemo<UserInput>(() => ({
    salary: { gross, basic, hra, pf, professional: 2400, standardDed: 75000 },
    age: form.age,
    city: form.city,
    rentPaid: n(form.rentPaid),
    sec80C: n(form.sec80C),
    sec80D: n(form.sec80D),
    sec80D_parents: n(form.sec80D_parents),
    sec80CCD1B: n(form.sec80CCD1B),
    homeLoanInterest: n(form.homeLoanInterest),
    sec80TTA: n(form.sec80TTA),
    sec80TTB: n(form.sec80TTB),
    sec80E: n(form.sec80E),
    sec80G: 0,
    otherIncome: n(form.otherIncome),
  }), [gross, basic, hra, pf, form.age, form.city, form.rentPaid,
       form.sec80C, form.sec80D, form.sec80D_parents, form.sec80CCD1B,
       form.homeLoanInterest, form.sec80TTA, form.sec80TTB, form.sec80E,
       form.otherIncome]);

  const old  = useMemo(() => calcOldRegime(input), [input]);
  const nw   = useMemo(() => calcNewRegime(input),  [input]);
  const gaps = useMemo(() => calcDeductionGaps(input, old), [input, old]);

  const winner: 'old' | 'new' = old.tax <= nw.tax ? 'old' : 'new';
  const savings      = Math.round(Math.abs(old.tax - nw.tax));
  const monthlyDelta = Math.round(savings / 12);
  const totalGapSave = Math.round(gaps.reduce((s, g) => s + g.taxSaved, 0));

  // HRA preview — computed once, passed down (no duplication)
  const hraPreview = useMemo(() => {
    if (!hasGross || n(form.rentPaid) === 0) return null;
    return old.hraExempt;
  }, [hasGross, form.rentPaid, old.hraExempt]);

  const isMetro = ALL_CITIES.includes(form.city) && form.city !== 'Other';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>

      {/* NAVBAR */}
      <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Badge label="FY 2025-26" />
            <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>IT Act 2025 · Budget 2026: no slab changes</span>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: 'var(--brand)', padding: '32px 24px 36px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <h1 style={{ margin: 0, color: '#fff', fontSize: 'clamp(24px, 3vw, 40px)', fontWeight: 700, letterSpacing: -0.8, lineHeight: 1.15 }}>
            Old vs New regime — which one saves you more?
          </h1>
          <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.72)', fontSize: 14, maxWidth: 500, lineHeight: 1.65 }}>
            Enter your salary details. Live comparison — no signup needed.
            Updated for IT Act 2025 (new section numbers) + 8-city HRA metro expansion.
          </p>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT */}
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 24px 80px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,420px)', gap: 28, alignItems: 'start' }}>

        {/* ═══ LEFT — FORM ═════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

          {/* STEP 1 — Basic info */}
          <StepCard step={1} title="About you" sub="Age affects old-regime slabs · city affects HRA exemption rate">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <Label>Age group</Label>
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  {([
                    { v: 'below60', label: 'Below 60',  sub: 'Standard slabs' },
                    { v: '60to80',  label: '60 – 80',   sub: 'Senior citizen' },
                    { v: 'above80', label: '80+',        sub: 'Super senior' },
                  ] as const).map(o => (
                    <AgeBtn key={o.v} label={o.label} sub={o.sub}
                      active={form.age === o.v} onClick={() => upd('age', o.v)} />
                  ))}
                </div>
                {form.age !== 'below60' && (
                  <Callout icon="ℹ️" style={{ marginTop: 8 }}>
                    {form.age === '60to80'
                      ? 'Old regime: 0% slab up to ₹3L (not ₹2.5L) · 80D limit ₹50K · 80TTA replaced by 80TTB (₹50K on FD + savings interest)'
                      : 'Old regime: 0% slab up to ₹5L · no 87A rebate · 80D limit ₹50K · 80TTB ₹50K'}
                  </Callout>
                )}
              </div>

              <div>
                <Label>City <span style={{ fontSize: 10, color: 'var(--ink-soft)', fontWeight: 400 }}>— affects HRA exemption rate</span></Label>
                <select value={form.city} onChange={e => upd('city', e.target.value as MetroCity)}
                  style={{ marginTop: 6, width: '100%', height: 42, borderRadius: 9, padding: '0 12px', border: '1.5px solid var(--line-strong)', background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'var(--font-geist-sans), system-ui', fontSize: 14, outline: 'none', cursor: 'pointer' }}>
                  <optgroup label="Metro cities — 50% HRA exemption (IT Act 2025)">
                    {HRA_METRO_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                  <optgroup label="Other cities — 40% HRA exemption">
                    <option value="Other">Other city</option>
                  </optgroup>
                </select>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 5 }}>
                  {isMetro
                    ? `✓ ${form.city} is a metro — HRA exemption = 50% of basic salary`
                    : 'Non-metro — HRA exemption = 40% of basic salary'}
                </div>
              </div>
            </div>
          </StepCard>

          {/* STEP 2 — Income */}
          <StepCard step={2} title="Your income" sub="Gross annual CTC — basic, HRA & PF auto-fill if left blank">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <FieldWrap label="Gross annual salary" hint="Total CTC before deductions" required>
                <Inp value={form.gross} onChange={v => upd('gross', v)} placeholder="e.g. 1800000" autoFocus />
              </FieldWrap>
              <TwoCol>
                <FieldWrap label="Basic salary" hint="Auto: 40% of gross">
                  <Inp value={form.basic} onChange={v => upd('basic', v)} placeholder={gross ? String(Math.round(gross * 0.4)) : '7,20,000'} />
                </FieldWrap>
                <FieldWrap label="HRA component" hint="Auto: 20% of gross">
                  <Inp value={form.hra} onChange={v => upd('hra', v)} placeholder={gross ? String(Math.round(gross * 0.2)) : '3,60,000'} />
                </FieldWrap>
              </TwoCol>
              <TwoCol>
                <FieldWrap label="PF contribution (yours)" hint="Auto: 12% of basic">
                  <Inp value={form.pf} onChange={v => upd('pf', v)} placeholder={basic ? String(Math.round(basic * 0.12)) : '86,400'} />
                </FieldWrap>
                <FieldWrap label="Other income" hint="FD interest, capital gains…">
                  <Inp value={form.otherIncome} onChange={v => upd('otherIncome', v)} placeholder="0" />
                </FieldWrap>
              </TwoCol>
              <Callout icon="💡">
                PF auto-counted in 80C. Standard deduction ₹75,000 applied in both regimes (Section 22, IT Act 2025).
              </Callout>
            </div>
          </StepCard>

          {/* STEP 3 — HRA / Rent (conditional) */}
          {hasGross && (
            <StepCard step={3} title="Rent & HRA" sub="Only fills in if you actually pay rent — skip if you own">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <FieldWrap label="Annual rent paid" hint="Actual rent paid to landlord">
                  <Inp value={form.rentPaid} onChange={v => upd('rentPaid', v)} placeholder="0" />
                </FieldWrap>
                {n(form.rentPaid) > 0 && hraPreview !== null && hraPreview > 0 && (
                  <Callout icon="✅" green>
                    HRA exemption: <strong>{fmtINR(hraPreview)}</strong>
                    {' '}(min of: HRA received, {isMetro ? '50%' : '40%'} of basic, rent − 10% of basic)
                  </Callout>
                )}
                {n(form.rentPaid) === 0 && hra > 0 && (
                  <Callout icon="⚠️" warn>
                    You have HRA of {fmtINR(hra)} in your salary. Enter rent paid to claim exemption and potentially save {fmtINR(Math.round(hra * 0.3 * 1.04))}+.
                  </Callout>
                )}
              </div>
            </StepCard>
          )}

          {/* STEP 4 — Deductions */}
          <StepCard step={hasGross ? 4 : 3} title="Deductions" sub="Only apply in Old regime — skip if comparing New regime only">
            <Callout icon="ℹ️" style={{ marginBottom: 12 }}>
              These are <strong>Old regime only</strong>. New regime ignores all of these except the ₹75K standard deduction.
              Section numbers shown: old Act 1961 → new IT Act 2025 (effective FY 2026-27).
            </Callout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <TwoCol>
                <FieldWrap label="80C / Sec 123 — Investments" hint="ELSS/PPF/LIC · Max ₹1.5L (PF auto-added)">
                  <Inp value={form.sec80C} onChange={v => upd('sec80C', v)} placeholder="0" max={150000} />
                </FieldWrap>
                <FieldWrap label={`80D / Sec 126 — Health insurance (self)`} hint={`Self+family · Max ₹${form.age === 'below60' ? '25K' : '50K'}`}>
                  <Inp value={form.sec80D} onChange={v => upd('sec80D', v)} placeholder="0" max={form.age === 'below60' ? 25000 : 50000} />
                </FieldWrap>
              </TwoCol>
              <TwoCol>
                <FieldWrap label="80D (parents)" hint={`Parents · Max ₹${form.age !== 'below60' ? '50K' : '25K'} (₹50K if parents senior)`}>
                  <Inp value={form.sec80D_parents} onChange={v => upd('sec80D_parents', v)} placeholder="0" max={form.age !== 'below60' ? 50000 : 25000} />
                </FieldWrap>
                <FieldWrap label="80CCD(1B) / Sec 124 — NPS" hint="Extra ₹50K over 80C">
                  <Inp value={form.sec80CCD1B} onChange={v => upd('sec80CCD1B', v)} placeholder="0" max={50000} />
                </FieldWrap>
              </TwoCol>
              <TwoCol>
                <FieldWrap label="24(b) / Sec 72 — Home loan interest" hint="Self-occupied · Max ₹2L">
                  <Inp value={form.homeLoanInterest} onChange={v => upd('homeLoanInterest', v)} placeholder="0" max={200000} />
                </FieldWrap>
                {form.age === 'below60'
                  ? (
                    <FieldWrap label="80TTA / Sec 128 — Savings interest" hint="Bank savings a/c · Max ₹10K">
                      <Inp value={form.sec80TTA} onChange={v => upd('sec80TTA', v)} placeholder="0" max={10000} />
                    </FieldWrap>
                  ) : (
                    <FieldWrap label="80TTB / Sec 128 — Savings + FD interest" hint="Bank savings + FD + PO · Max ₹50K (60+)">
                      <Inp value={form.sec80TTB} onChange={v => upd('sec80TTB', v)} placeholder="0" max={50000} />
                    </FieldWrap>
                  )
                }
              </TwoCol>
              <FieldWrap label="80E / Sec 129 — Education loan interest" hint="Higher education · No cap · Max 8 years">
                <Inp value={form.sec80E} onChange={v => upd('sec80E', v)} placeholder="0" />
              </FieldWrap>
            </div>
          </StepCard>

          <p style={{ fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.7, padding: '0 2px', margin: '4px 0 0' }}>
            Slabs: FY 2025-26 · Budget 2026 no changes · New regime 87A ≤ ₹12L taxable (₹60K rebate + marginal relief) ·
            Old regime 87A ≤ ₹5L (₹12.5K) · Surcharge &gt;₹50L · 8-city HRA metro expansion (IT Act 2025)
          </p>
        </div>

        {/* ═══ RIGHT — LIVE RESULTS ════════════════════════════════════════ */}
        <div style={{ position: 'sticky', top: 68, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!hasGross
            ? <EmptyState />
            : <>
                <WinnerCard winner={winner} savings={savings} monthlyDelta={monthlyDelta} old={old} nw={nw} />
                <RegimeTable old={old} nw={nw} winner={winner} />
                <BreakdownCard winner={winner} old={old} nw={nw} />
                <SlabBar
                  taxable={winner === 'old' ? old.taxable : nw.taxable}
                  slabs={winner === 'old' ? getOldSlabs(form.age) : SLABS_NEW}
                  regime={winner}
                />
                <SavingsPanel gaps={gaps} totalGapSave={totalGapSave} winner={winner} input={input} />
              </>
          }
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Brand
// ─────────────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width="26" height="26" viewBox="0 0 64 64" fill="none">
        <rect x="2" y="2" width="60" height="60" rx="15" fill="#0B6E4F" />
        <path d="M22 18h22M22 26h22M28 18c5 0 9 3 9 8s-4 8-9 8h-3l13 12"
          stroke="#D4FF4F" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.5, color: 'var(--ink)' }}>taxly</span>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: 'var(--brand-soft)', color: 'var(--brand)', letterSpacing: 0.3 }}>{label}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Form atoms
// ─────────────────────────────────────────────────────────────────────────────

function StepCard({ step, title, sub, children }: { step: number; title: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--line)', overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 24, height: 24, borderRadius: 12, background: 'var(--brand)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>{step}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.2 }}>{title}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 1 }}>{sub}</div>
        </div>
      </div>
      <div style={{ padding: '14px 20px 18px' }}>{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.1 }}>{children}</div>;
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>;
}

function FieldWrap({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.1 }}>
          {label}{required && <span style={{ color: 'var(--brand)', marginLeft: 2 }}>*</span>}
        </span>
        {hint && <span style={{ fontSize: 10, color: 'var(--ink-soft)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Inp({ value, onChange, placeholder, autoFocus, max }: {
  value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean; max?: number;
}) {
  const [focus, setFocus] = useState(false);
  const val = n(value);
  const over = max != null && val > 0 && val > max;
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: 42, borderRadius: 9, padding: '0 11px', border: `1.5px solid ${over ? 'var(--danger)' : focus ? 'var(--brand)' : 'var(--line-strong)'}`, background: 'var(--bg)', gap: 5, transition: 'border-color .15s' }}>
      <span style={{ color: 'var(--ink-mid)', fontFamily: 'Geist Mono,monospace', fontSize: 13, userSelect: 'none', flexShrink: 0 }}>₹</span>
      <input type="text" inputMode="numeric" autoFocus={autoFocus}
        value={value}
        onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        placeholder={placeholder}
        style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', fontFamily: 'Geist Mono,monospace', fontSize: 14, fontWeight: 500, color: 'var(--ink)', minWidth: 0 }} />
      {over && <span style={{ fontSize: 9, color: 'var(--danger)', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>MAX {fmtINRShort(max!)}</span>}
    </div>
  );
}

function AgeBtn({ label, sub, active, onClick }: { label: string; sub: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ flex: 1, appearance: 'none', cursor: 'pointer', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${active ? 'var(--brand)' : 'var(--line)'}`, background: active ? 'var(--brand-soft)' : 'var(--surface)', textAlign: 'left', transition: 'all .15s' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--brand-ink)' : 'var(--ink)' }}>{label}</div>
      <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 2 }}>{sub}</div>
    </button>
  );
}

function Callout({ icon, children, green, warn, style }: { icon: string; children: React.ReactNode; green?: boolean; warn?: boolean; style?: React.CSSProperties }) {
  const bg    = green ? 'var(--brand-soft)' : warn ? 'var(--warn-soft)' : '#F0F4F8';
  const color = green ? 'var(--brand-ink)'  : warn ? 'var(--warn)'       : 'var(--ink-mid)';
  return (
    <div style={{ padding: '8px 11px', borderRadius: 8, background: bg, color, fontSize: 12, lineHeight: 1.6, display: 'flex', gap: 7, alignItems: 'flex-start', ...style }}>
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <span>{children}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ padding: '48px 24px', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--line)', textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
      <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>Enter gross salary to see results</div>
      <div style={{ fontSize: 12, color: 'var(--ink-mid)', marginTop: 6, lineHeight: 1.7 }}>
        Live comparison · Surcharge · Marginal relief · 8-city HRA
      </div>
    </div>
  );
}

function WinnerCard({ winner, savings, monthlyDelta, old, nw }: {
  winner: 'old' | 'new'; savings: number; monthlyDelta: number;
  old: ReturnType<typeof calcOldRegime>; nw: ReturnType<typeof calcNewRegime>;
}) {
  const label  = winner === 'new' ? 'New regime' : 'Old regime';
  const reason = winner === 'new'
    ? 'Lower flat slabs outweigh your deductions at this income.'
    : 'Your deductions (HRA, 80C etc.) reduce taxable income enough to beat new slabs.';

  return (
    <div style={{ borderRadius: 18, padding: '20px 22px', background: 'linear-gradient(145deg,#0B6E4F,#063D2C)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(212,255,79,.2) 0%,transparent 65%)', top: -60, right: -30, pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,.55)' }}>Recommended for you</div>
        <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.8, marginTop: 2, lineHeight: 1.1 }}>✓ {label}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', marginTop: 5, lineHeight: 1.55 }}>{reason}</div>
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 12, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>Save vs other regime</div>
            <div style={{ fontFamily: 'Geist Mono,monospace', fontSize: 22, fontWeight: 700, color: '#D4FF4F', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(savings)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.12)', height: 32 }} />
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>Extra / month</div>
            <div style={{ fontFamily: 'Geist Mono,monospace', fontSize: 22, fontWeight: 700, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(monthlyDelta)}</div>
          </div>
        </div>
        {/* Marginal relief notice */}
        {(old.marginalRelief87A > 0 || nw.marginalRelief87A > 0) && (
          <div style={{ marginTop: 10, padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,.1)', fontSize: 11, color: 'rgba(255,255,255,.8)', lineHeight: 1.5 }}>
            💡 Marginal relief applied — your income is just above the 87A threshold so extra tax ≤ extra income
          </div>
        )}
        {/* Surcharge notice */}
        {(old.surcharge.rate > 0 || nw.surcharge.rate > 0) && (
          <div style={{ marginTop: 6, padding: '7px 10px', borderRadius: 8, background: 'rgba(212,255,79,.12)', fontSize: 11, color: 'rgba(255,255,255,.8)', lineHeight: 1.5 }}>
            ⚠️ Surcharge applies at {Math.round((winner === 'old' ? old : nw).surcharge.rate * 100)}% — income exceeds ₹50L
          </div>
        )}
      </div>
    </div>
  );
}

function RegimeTable({ old, nw, winner }: { old: ReturnType<typeof calcOldRegime>; nw: ReturnType<typeof calcNewRegime>; winner: 'old'|'new' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {([
        { key: 'old' as const, label: 'Old regime', sub: 'Deductions allowed',  res: old },
        { key: 'new' as const, label: 'New regime', sub: 'Lower flat slabs',     res: nw  },
      ]).map(({ key, label, sub, res }) => {
        const win     = key === winner;
        const inHand  = Math.round((res.gross - res.tax) / 12);
        return (
          <div key={key} style={{ borderRadius: 13, padding: '13px 14px', position: 'relative', background: win ? 'var(--brand-soft)' : 'var(--surface)', border: `1.5px solid ${win ? 'var(--brand)' : 'var(--line)'}` }}>
            {win && <div style={{ position: 'absolute', top: -8, right: 10, background: 'var(--brand)', color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 5 }}>✓ BEST</div>}
            <div style={{ fontSize: 12, fontWeight: 700, color: win ? 'var(--brand-ink)' : 'var(--ink)' }}>{label}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 1 }}>{sub}</div>
            <div style={{ marginTop: 9 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Annual tax</div>
              <div style={{ fontFamily: 'Geist Mono,monospace', fontSize: 18, fontWeight: 700, letterSpacing: -0.4, color: win ? 'var(--brand-ink)' : 'var(--ink)', fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>{fmtINR(res.tax)}</div>
            </div>
            {res.surcharge.rate > 0 && (
              <div style={{ marginTop: 4, fontSize: 10, color: 'var(--warn)' }}>
                + surcharge {Math.round(res.surcharge.rate * 100)}%
              </div>
            )}
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${win ? 'rgba(11,110,79,.2)' : 'var(--line)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 10, color: 'var(--ink-soft)' }}>In-hand / mo</span>
              <span style={{ fontFamily: 'Geist Mono,monospace', fontSize: 12, fontWeight: 600, color: win ? 'var(--brand)' : 'var(--ink-mid)', fontVariantNumeric: 'tabular-nums' }}>{fmtINR(inHand)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BreakdownCard({ winner, old, nw }: { winner: 'old'|'new'; old: ReturnType<typeof calcOldRegime>; nw: ReturnType<typeof calcNewRegime> }) {
  const res = winner === 'old' ? old : nw;
  const d   = res.deductionsUsed;

  type R = { label: string; value: number; sub?: string; accent?: boolean; bold?: boolean; red?: boolean };
  const rows: R[] = [
    { label: 'Gross income', value: res.gross },
    { label: 'Standard deduction', value: -d.standardDed, accent: true, sub: 'Sec 22 (IT Act 2025) · both regimes' },
    ...(winner === 'old' && d.hraExempt > 0           ? [{ label: 'HRA exemption', value: -d.hraExempt, accent: true, sub: 'Sec 18' }] : []),
    ...(winner === 'old' && d.professional > 0         ? [{ label: 'Prof. tax', value: -d.professional, accent: true }] : []),
    ...(winner === 'old' && d.sec80C > 0               ? [{ label: '80C / Sec 123', value: -d.sec80C, accent: true, sub: 'PF + investments, capped ₹1.5L' }] : []),
    ...(winner === 'old' && d.sec80D > 0               ? [{ label: '80D / Sec 126', value: -d.sec80D, accent: true }] : []),
    ...(winner === 'old' && d.sec80CCD1B > 0           ? [{ label: '80CCD(1B) / Sec 124', value: -d.sec80CCD1B, accent: true }] : []),
    ...(winner === 'old' && d.homeLoanInterest > 0     ? [{ label: '24(b) / Sec 72', value: -d.homeLoanInterest, accent: true }] : []),
    ...(winner === 'old' && d.sec80TTA_TTB > 0         ? [{ label: '80TTA/TTB / Sec 128', value: -d.sec80TTA_TTB, accent: true }] : []),
    ...(winner === 'old' && d.sec80E > 0               ? [{ label: '80E / Sec 129', value: -d.sec80E, accent: true }] : []),
    { label: 'Taxable income', value: res.taxable, bold: true },
    ...(res.rebate > 0               ? [{ label: '87A rebate / Sec 191', value: -res.rebate, accent: true, sub: winner === 'new' ? 'Nil tax ≤ ₹12L' : 'Nil tax ≤ ₹5L' }] : []),
    ...(res.marginalRelief87A > 0    ? [{ label: 'Marginal relief', value: -res.marginalRelief87A, accent: true, sub: 'Extra tax capped to extra income' }] : []),
    ...(res.surcharge.amount > 0     ? [{ label: `Surcharge (${Math.round(res.surcharge.rate * 100)}%)`, value: res.surcharge.amount }] : []),
    ...(res.surcharge.marginalRelief > 0 ? [{ label: 'Surcharge marginal relief', value: -res.surcharge.marginalRelief, accent: true }] : []),
    { label: 'Tax + 4% cess', value: res.tax, red: true, bold: true, sub: `Base ${fmtINR(res.baseTax)} + cess ${fmtINR(res.cess)}` },
  ];

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 13, border: '1px solid var(--line)', overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px 8px', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
        {winner === 'old' ? 'Old' : 'New'} regime — full calculation
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '7px 14px', borderTop: '1px solid var(--line)' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: r.bold ? 700 : 400, color: r.red ? 'var(--danger)' : 'var(--ink)' }}>{r.label}</div>
            {r.sub && <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 1 }}>{r.sub}</div>}
          </div>
          <div style={{ fontFamily: 'Geist Mono,monospace', fontSize: r.bold ? 13 : 12, fontWeight: r.bold ? 700 : 400, color: r.accent ? 'var(--brand)' : r.red ? 'var(--danger)' : 'var(--ink)', fontVariantNumeric: 'tabular-nums', marginLeft: 12, whiteSpace: 'nowrap' }}>
            {r.value < 0 ? '−' : ''}{fmtINR(Math.abs(r.value))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SlabBar({ taxable, slabs, regime }: { taxable: number; slabs: ReturnType<typeof getOldSlabs>; regime: 'old'|'new' }) {
  const [hover, setHover] = useState<number|null>(null);
  const slices = useMemo(() => sliceBySlabs(taxable, slabs).filter(s => s.amount > 0), [taxable, slabs]);
  if (taxable <= 0 || slices.length === 0) return null;

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 13, border: '1px solid var(--line)', padding: '12px 14px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 8 }}>
        Income by tax band — {regime} regime
      </div>
      <div style={{ height: 30, borderRadius: 6, overflow: 'hidden', display: 'flex', background: 'var(--surface-alt)' }}>
        {slices.map((s, i) => {
          const pct  = (s.amount / taxable) * 100;
          const cidx = slabs.findIndex(x => x.upto === s.upto);
          const col  = SLAB_COLORS[Math.min(SLAB_COLORS.length - 1, cidx)];
          return (
            <div key={i} title={`${s.label} · ${Math.round(s.rate * 100)}%`}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              onClick={() => setHover(hover === i ? null : i)}
              style={{ width: `${pct}%`, background: col, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: i < slices.length - 1 ? '1px solid rgba(255,255,255,.25)' : undefined, filter: hover != null && hover !== i ? 'saturate(.3)' : undefined, transition: 'filter .1s' }}>
              {pct > 10 && <span style={{ fontFamily: 'Geist Mono,monospace', fontSize: 9, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.3)' }}>{Math.round(s.rate * 100)}%</span>}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 6, minHeight: 18, fontSize: 11 }}>
        {hover != null && slices[hover]
          ? <span><strong>{slices[hover].label}</strong> · {fmtINRShort(slices[hover].amount)} here · tax: <strong style={{ color: slices[hover].rate === 0 ? 'var(--brand)' : 'var(--ink)' }}>{slices[hover].rate === 0 ? '₹0 free' : fmtINR(slices[hover].tax)}</strong></span>
          : <span style={{ color: 'var(--ink-soft)' }}>Hover a band to inspect</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Savings panel
// ─────────────────────────────────────────────────────────────────────────────

function SavingsPanel({ gaps, totalGapSave, winner, input }: {
  gaps: ReturnType<typeof calcDeductionGaps>;
  totalGapSave: number;
  winner: 'old'|'new';
  input: UserInput;
}) {
  type Tip = { priority: 'high'|'med'; code: string; newCode: string; title: string; saving: number; action: string };
  const tips: Tip[] = [];

  if (winner === 'old') {
    for (const g of gaps) {
      if (g.code === '80C')
        tips.push({ priority: 'high', code: '80C', newCode: g.newCode, title: 'Top up 80C (Sec 123)', saving: g.taxSaved, action: `Invest ₹${fmtINRShort(g.gap)} in ELSS/PPF/NSC before 31 March.` });
      if (g.code === '80CCD(1B)')
        tips.push({ priority: 'high', code: 'NPS', newCode: g.newCode, title: 'Top up NPS (Sec 124)', saving: g.taxSaved, action: `Put ₹${fmtINRShort(g.gap)} in NPS Tier-1 — extra over 80C, saves ${fmtINR(g.taxSaved)}.` });
      if (g.code === '80D' || g.code === '80D (parents)')
        tips.push({ priority: 'med', code: '80D', newCode: g.newCode, title: 'Buy/top up health insurance (Sec 126)', saving: g.taxSaved, action: `A premium of ₹${fmtINRShort(g.gap)} fills the gap → saves ${fmtINR(g.taxSaved)}.` });
      if (g.code === 'HRA' && input.rentPaid === 0)
        tips.push({ priority: 'high', code: 'HRA', newCode: g.newCode, title: 'Submit rent receipts (Sec 18)', saving: g.taxSaved, action: 'Collect rent receipts + landlord PAN and submit to HR before Feb.' });
      if (g.code === '80TTB' || g.code === '80TTA')
        tips.push({ priority: 'med', code: g.code, newCode: g.newCode, title: `Declare ${g.code} interest (Sec 128)`, saving: g.taxSaved, action: `Interest income of up to ₹${fmtINRShort(g.maxLimit)} can be claimed. Ensure it's included in ITR.` });
    }
  }

  if (winner === 'new') {
    const empNPS      = Math.round(input.salary.basic * 0.10);
    const empNPSSave  = Math.round(empNPS * 0.30 * 1.04);
    tips.push({ priority: 'high', code: '80CCD(2)', newCode: '125', title: 'Employer NPS — no cap (Sec 125)', saving: empNPSSave, action: `Ask HR to route ≈${fmtINRShort(empNPS)}/yr (10% of basic) into NPS via employer contribution. Only unrestricted deduction in new regime.` });
  }

  const allGood = tips.length === 0 && gaps.length === 0;

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 13, border: '1px solid var(--line)', overflow: 'hidden' }}>
      <div style={{ padding: '11px 14px 9px', borderBottom: '1px solid var(--line)', background: totalGapSave > 0 ? '#FFFBEA' : 'var(--surface)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#B7791F' }}>💡 How to save more</div>
        {totalGapSave > 0 && winner === 'old' && (
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginTop: 3, letterSpacing: -0.4 }}>
            Up to <span style={{ color: 'var(--brand)' }}>{fmtINR(totalGapSave)}</span> more within reach
          </div>
        )}
      </div>

      {allGood ? (
        <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--ink-mid)', lineHeight: 1.6 }}>
          ✅ <strong style={{ color: 'var(--ink)' }}>Well optimised.</strong> Deductions maxed. Keep NPS contributions coming.
        </div>
      ) : (
        <>
          {tips.map((t, i) => (
            <div key={t.code + i} style={{ padding: '11px 14px', borderTop: i === 0 ? undefined : '1px solid var(--line)', display: 'flex', gap: 11, alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 40 }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, background: t.priority === 'high' ? 'var(--brand-soft)' : 'var(--surface-alt)', color: 'var(--brand)', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 800, fontFamily: 'Geist Mono,monospace', margin: '0 auto' }}>{t.code.slice(0,5)}</div>
                <div style={{ fontSize: 8, color: 'var(--ink-soft)', marginTop: 2 }}>§{t.newCode}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.2 }}>{t.title}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-mid)', marginTop: 2, lineHeight: 1.5 }}>{t.action}</div>
              </div>
              {t.saving > 0 && (
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: 'var(--ink-soft)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>Save</div>
                  <div style={{ fontFamily: 'Geist Mono,monospace', fontSize: 13, fontWeight: 700, color: 'var(--brand)', fontVariantNumeric: 'tabular-nums' }}>+{fmtINR(t.saving)}</div>
                </div>
              )}
            </div>
          ))}

          {winner === 'old' && gaps.length > 0 && (
            <div style={{ borderTop: '1px solid var(--line)' }}>
              <div style={{ padding: '9px 14px 5px', fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink-soft)' }}>Unused deduction headroom</div>
              {gaps.map(g => {
                const pct = Math.min(100, Math.round((g.used / g.maxLimit) * 100));
                return (
                  <div key={g.code} style={{ padding: '9px 14px', borderTop: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'Geist Mono,monospace', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'var(--surface-alt)', color: 'var(--ink-mid)' }}>{g.code}</span>
                        <span style={{ fontSize: 10, color: 'var(--ink-soft)' }}>§{g.newCode}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{g.name}</span>
                      </div>
                      <span style={{ fontFamily: 'Geist Mono,monospace', fontSize: 12, fontWeight: 700, color: 'var(--brand)' }}>+{fmtINR(g.taxSaved)}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--surface-alt)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? 'var(--brand)' : 'var(--warn)', borderRadius: 2, transition: 'width .4s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 10, color: 'var(--ink-soft)', fontFamily: 'Geist Mono,monospace' }}>
                      <span>Used {fmtINR(g.used)}</span><span>Max {fmtINR(g.maxLimit)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {winner === 'new' && gaps.length > 0 && (
            <div style={{ borderTop: '1px solid var(--line)', padding: '10px 14px', background: 'var(--surface-alt)', fontSize: 11, color: 'var(--ink-mid)', lineHeight: 1.6 }}>
              💡 If you claimed all deductions in Old regime, you could save <strong style={{ color: 'var(--brand)' }}>{fmtINR(Math.round(gaps.reduce((s,g) => s+g.taxSaved, 0)))}</strong> extra. Fill in 80C/HRA/NPS above to compare.
            </div>
          )}

          {totalGapSave > 0 && winner === 'old' && (
            <div style={{ borderTop: '1px solid var(--line)', padding: '9px 14px', background: 'var(--brand-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-ink)' }}>Total extra savings available</span>
              <span style={{ fontFamily: 'Geist Mono,monospace', fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>{fmtINR(totalGapSave)}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
