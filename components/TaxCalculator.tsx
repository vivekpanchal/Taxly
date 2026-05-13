'use client';
import React, { useState, useMemo, useCallback } from 'react';
import {
  calcOldRegime, calcNewRegime, calcDeductionGaps,
  sliceBySlabs, SLABS_NEW, getOldSlabs,
  type UserInput, type AgeGroup,
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

// ─────────────────────────────────────────────────────────────────────────────
// Form state
// ─────────────────────────────────────────────────────────────────────────────

interface Form {
  age: AgeGroup;
  gross: string;
  basic: string;
  hra: string;
  pf: string;
  otherIncome: string;
  rentPaid: string;
  metro: boolean;
  sec80C: string;
  sec80D: string;
  sec80CCD1B: string;
  homeLoanInterest: string;
}

const INIT: Form = {
  age: 'below60',
  gross: '', basic: '', hra: '', pf: '', otherIncome: '',
  rentPaid: '', metro: true,
  sec80C: '', sec80D: '', sec80CCD1B: '', homeLoanInterest: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────

export function TaxCalculator() {
  const [form, setForm] = useState<Form>(INIT);
  const upd = useCallback(<K extends keyof Form>(k: K, v: Form[K]) =>
    setForm(f => ({ ...f, [k]: v })), []);

  // Derived salary values with sensible auto-fills
  const gross  = n(form.gross);
  const basic  = n(form.basic)  || Math.round(gross * 0.40);
  const hra    = n(form.hra)    || Math.round(gross * 0.20);
  const pf     = n(form.pf)     || Math.round(basic * 0.12);
  const hasGross = gross > 0;

  const input = useMemo<UserInput>(() => ({
    salary: { gross, basic, hra, pf, professional: 2400, standardDed: 75000 },
    age: form.age,
    rentPaid: n(form.rentPaid),
    metro: form.metro,
    sec80C: n(form.sec80C),
    sec80D: n(form.sec80D),
    sec80CCD1B: n(form.sec80CCD1B),
    homeLoanInterest: n(form.homeLoanInterest),
    otherIncome: n(form.otherIncome),
  }), [gross, basic, hra, pf, form.age, form.rentPaid, form.metro,
       form.sec80C, form.sec80D, form.sec80CCD1B, form.homeLoanInterest, form.otherIncome]);

  const old  = useMemo(() => calcOldRegime(input), [input]);
  const nw   = useMemo(() => calcNewRegime(input),  [input]);
  const gaps = useMemo(() => calcDeductionGaps(input, old), [input, old]);

  const winner: 'old' | 'new' = old.tax <= nw.tax ? 'old' : 'new';
  const savings       = Math.round(Math.abs(old.tax - nw.tax));
  const monthlyDelta  = Math.round(savings / 12);
  const totalGapSave  = Math.round(gaps.reduce((s, g) => s + g.taxSaved, 0));

  // HRA preview (no IIFE — plain function)
  const hraPreview = useMemo(() => {
    if (!hasGross || n(form.rentPaid) === 0) return null;
    const p = form.metro ? 0.5 : 0.4;
    return Math.max(0, Math.min(hra, basic * p, Math.max(0, n(form.rentPaid) - basic * 0.1)));
  }, [hasGross, form.rentPaid, form.metro, hra, basic]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Badge label="FY 2025-26" />
            <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>AY 2026-27 · Budget 2026: no slab changes</span>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--brand)', padding: '32px 24px 36px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <h1 style={{ margin: 0, color: '#fff', fontSize: 'clamp(24px, 3vw, 40px)', fontWeight: 700, letterSpacing: -0.8, lineHeight: 1.15 }}>
            Old vs New regime — which one saves you more?
          </h1>
          <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.72)', fontSize: 14, maxWidth: 480, lineHeight: 1.65 }}>
            Enter your salary details below. Results update live — no signup needed.
          </p>
        </div>
      </div>

      {/* ── TWO COLUMNS ────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 24px 80px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,420px)', gap: 28, alignItems: 'start' }}>

        {/* ═══ LEFT — FORM ═════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

          {/* ── Step 1: Age ────────────────────────────────────────────── */}
          <StepCard step={1} title="Who are you?" sub="Age affects old-regime slabs for senior citizens">
            <div style={{ display: 'flex', gap: 10 }}>
              {([
                { v: 'below60', label: 'Below 60', sub: 'Regular slabs' },
                { v: '60to80',  label: '60 – 80',  sub: 'Senior citizen' },
                { v: 'above80', label: '80+',       sub: 'Super senior' },
              ] as const).map(opt => (
                <AgeCard key={opt.v} label={opt.label} sub={opt.sub}
                  active={form.age === opt.v} onClick={() => upd('age', opt.v)} />
              ))}
            </div>
            {form.age !== 'below60' && (
              <Callout icon="ℹ️">
                {form.age === '60to80'
                  ? 'Senior citizen: Old regime 0% slab starts at ₹3L (not ₹2.5L)'
                  : 'Super senior: Old regime 0% slab starts at ₹5L, no 87A rebate'}
              </Callout>
            )}
          </StepCard>

          {/* ── Step 2: Income ─────────────────────────────────────────── */}
          <StepCard step={2} title="Your income" sub="Enter gross annual (CTC) — we auto-fill basic & HRA if blank">
            <FieldStack>
              <Field label="Gross annual salary" required hint="Total CTC before any deductions">
                <Inp value={form.gross} onChange={v => upd('gross', v)} placeholder="e.g. 1800000" autoFocus />
              </Field>
              <TwoCol>
                <Field label="Basic salary" hint="Auto: 40% of gross if blank">
                  <Inp value={form.basic} onChange={v => upd('basic', v)} placeholder={gross ? String(Math.round(gross * 0.4)) : '7,20,000'} />
                </Field>
                <Field label="HRA component" hint="Auto: 20% of gross if blank">
                  <Inp value={form.hra} onChange={v => upd('hra', v)} placeholder={gross ? String(Math.round(gross * 0.2)) : '3,60,000'} />
                </Field>
              </TwoCol>
              <TwoCol>
                <Field label="Your PF contribution" hint="Auto: 12% of basic if blank">
                  <Inp value={form.pf} onChange={v => upd('pf', v)} placeholder={basic ? String(Math.round(basic * 0.12)) : '86,400'} />
                </Field>
                <Field label="Other income" hint="FD interest, capital gains…">
                  <Inp value={form.otherIncome} onChange={v => upd('otherIncome', v)} placeholder="0" />
                </Field>
              </TwoCol>
            </FieldStack>
            <Callout icon="💡">
              PF counts toward 80C. Standard deduction ₹75,000 applied automatically in both regimes.
            </Callout>
          </StepCard>

          {/* ── Step 3: HRA & Rent (conditional on HRA > 0) ────────────── */}
          {(hasGross || n(form.hra) > 0) && (
            <StepCard step={3} title="Rent & HRA" sub="Only applies if you pay rent — skip if you own your home">
              <FieldStack>
                <Field label="Annual rent paid" hint="What you actually pay your landlord">
                  <Inp value={form.rentPaid} onChange={v => upd('rentPaid', v)} placeholder="0" />
                </Field>
                {n(form.rentPaid) > 0 && (
                  <MetroToggle value={form.metro} onChange={v => upd('metro', v)} />
                )}
              </FieldStack>
              {hraPreview !== null && hraPreview > 0 && (
                <Callout icon="✅" green>
                  HRA exemption: <strong>{fmtINR(hraPreview)}</strong> — least of (HRA received, {form.metro ? '50%' : '40%'} of basic, rent − 10% of basic)
                </Callout>
              )}
              {n(form.rentPaid) === 0 && hra > 0 && (
                <Callout icon="⚠️" warn>
                  You have HRA of {fmtINR(hra)} in your CTC. Enter rent paid above to claim exemption and potentially save {fmtINR(Math.round(hra * 0.3 * 1.04))}+.
                </Callout>
              )}
            </StepCard>
          )}

          {/* ── Step 4: Deductions (Old regime) ────────────────────────── */}
          <StepCard step={n(form.rentPaid) > 0 || hra > 0 ? 4 : 3} title="Deductions" sub="Only matter in Old regime — skip if using New">
            <Callout icon="ℹ️">
              These fields are <strong>only used for Old regime</strong> calculation. New regime ignores all deductions except the ₹75K standard deduction.
            </Callout>
            <FieldStack>
              <TwoCol>
                <Field label="80C investments" hint="ELSS / PPF / LIC · Max ₹1.5L (PF auto-added)">
                  <Inp value={form.sec80C} onChange={v => upd('sec80C', v)} placeholder="0" max={150000} />
                </Field>
                <Field label="80D health insurance" hint="Self + family · Max ₹25K">
                  <Inp value={form.sec80D} onChange={v => upd('sec80D', v)} placeholder="0" max={25000} />
                </Field>
              </TwoCol>
              <TwoCol>
                <Field label="80CCD(1B) — NPS" hint="Extra ₹50K over 80C">
                  <Inp value={form.sec80CCD1B} onChange={v => upd('sec80CCD1B', v)} placeholder="0" max={50000} />
                </Field>
                <Field label="24(b) home loan interest" hint="Self-occupied · Max ₹2L">
                  <Inp value={form.homeLoanInterest} onChange={v => upd('homeLoanInterest', v)} placeholder="0" max={200000} />
                </Field>
              </TwoCol>
            </FieldStack>
          </StepCard>

          <p style={{ fontSize: 11, color: 'var(--ink-soft)', padding: '0 2px', lineHeight: 1.7, margin: '4px 0 0' }}>
            Slabs: FY 2025-26 · Budget 2026 confirmed no changes ·
            New regime 87A rebate: nil tax ≤ ₹12L taxable ·
            Old regime 87A rebate: nil tax ≤ ₹5L (max ₹12,500)
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
                <SlabBar taxable={winner === 'old' ? old.taxable : nw.taxable}
                         slabs={winner === 'old' ? getOldSlabs(form.age) : SLABS_NEW}
                         regime={winner} />
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
// Form layout atoms
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
      <div style={{ padding: '14px 20px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

function FieldStack({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>;
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>;
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
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

function AgeCard({ label, sub, active, onClick }: { label: string; sub: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ flex: 1, appearance: 'none', cursor: 'pointer', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${active ? 'var(--brand)' : 'var(--line)'}`, background: active ? 'var(--brand-soft)' : 'var(--surface)', textAlign: 'left', transition: 'all .15s ease' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--brand-ink)' : 'var(--ink)' }}>{label}</div>
      <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 2 }}>{sub}</div>
    </button>
  );
}

function MetroToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>Living in metro city?</div>
        <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 2 }}>Delhi · Mumbai · Chennai · Kolkata → 50% exemption (40% non-metro)</div>
      </div>
      <button onClick={() => onChange(!value)} style={{ appearance: 'none', border: 0, cursor: 'pointer', width: 42, height: 24, borderRadius: 12, padding: 2, background: value ? 'var(--brand)' : 'var(--line-strong)', transition: 'background .15s', position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 2, left: value ? 18 : 2, width: 20, height: 20, borderRadius: 10, background: '#fff', transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
      </button>
    </div>
  );
}

function Callout({ icon, children, green, warn }: { icon: string; children: React.ReactNode; green?: boolean; warn?: boolean }) {
  const bg = green ? 'var(--brand-soft)' : warn ? 'var(--warn-soft)' : '#F0F4F8';
  const color = green ? 'var(--brand-ink)' : warn ? 'var(--warn)' : 'var(--ink-mid)';
  return (
    <div style={{ padding: '8px 11px', borderRadius: 8, background: bg, color, fontSize: 12, lineHeight: 1.6, display: 'flex', gap: 7, alignItems: 'flex-start' }}>
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
        Tax comparison updates live as you type.<br />No signup, no waiting.
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
    : 'Your deductions reduce taxable income enough to beat the new slabs.';

  return (
    <div style={{ borderRadius: 18, padding: '20px 22px', background: 'linear-gradient(145deg,#0B6E4F,#063D2C)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(212,255,79,.2) 0%,transparent 65%)', top: -60, right: -30, pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,.55)' }}>Recommended for you</div>
        <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.8, color: '#fff', marginTop: 2, lineHeight: 1.1 }}>✓ {label}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', marginTop: 5, lineHeight: 1.55 }}>{reason}</div>
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 12, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>You save / year</div>
            <div style={{ fontFamily: 'Geist Mono,monospace', fontSize: 22, fontWeight: 700, color: '#D4FF4F', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(savings)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.12)', height: 32 }} />
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>Extra / month</div>
            <div style={{ fontFamily: 'Geist Mono,monospace', fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(monthlyDelta)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegimeTable({ old, nw, winner }: { old: ReturnType<typeof calcOldRegime>; nw: ReturnType<typeof calcNewRegime>; winner: 'old'|'new' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {([
        { key: 'old' as const, label: 'Old regime', sub: 'Deductions allowed',      res: old },
        { key: 'new' as const, label: 'New regime', sub: 'Lower flat slabs',         res: nw  },
      ]).map(({ key, label, sub, res }) => {
        const win = key === winner;
        const inHand = Math.round((res.gross - res.tax) / 12);
        return (
          <div key={key} style={{ borderRadius: 13, padding: '13px 14px', position: 'relative', background: win ? 'var(--brand-soft)' : 'var(--surface)', border: `1.5px solid ${win ? 'var(--brand)' : 'var(--line)'}` }}>
            {win && <div style={{ position: 'absolute', top: -8, right: 10, background: 'var(--brand)', color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 5 }}>✓ BEST</div>}
            <div style={{ fontSize: 12, fontWeight: 700, color: win ? 'var(--brand-ink)' : 'var(--ink)' }}>{label}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 1 }}>{sub}</div>
            <div style={{ marginTop: 9 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Annual tax</div>
              <div style={{ fontFamily: 'Geist Mono,monospace', fontSize: 18, fontWeight: 700, letterSpacing: -0.4, color: win ? 'var(--brand-ink)' : 'var(--ink)', fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>{fmtINR(res.tax)}</div>
            </div>
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
    { label: 'Standard deduction', value: -d.standardDed, accent: true },
    ...(winner === 'old' && d.hraExempt > 0       ? [{ label: 'HRA exemption',      value: -d.hraExempt,         accent: true }] : []),
    ...(winner === 'old' && d.professional > 0     ? [{ label: 'Prof. tax',           value: -d.professional,      accent: true }] : []),
    ...(winner === 'old' && d.sec80C > 0           ? [{ label: '80C',                 value: -d.sec80C,            accent: true, sub: 'PF + investments, capped ₹1.5L' }] : []),
    ...(winner === 'old' && d.sec80D > 0           ? [{ label: '80D',                 value: -d.sec80D,            accent: true }] : []),
    ...(winner === 'old' && d.sec80CCD1B > 0       ? [{ label: '80CCD(1B)',            value: -d.sec80CCD1B,        accent: true }] : []),
    ...(winner === 'old' && d.homeLoanInterest > 0 ? [{ label: '24(b) home loan',      value: -d.homeLoanInterest,  accent: true }] : []),
    { label: 'Taxable income', value: res.taxable, bold: true },
    ...(res.rebate > 0 ? [{ label: '87A rebate', value: -res.rebate, accent: true, sub: winner === 'new' ? 'Nil tax ≤ ₹12L' : 'Nil tax ≤ ₹5L' }] : []),
    { label: 'Total tax + 4% cess', value: res.tax, red: true, bold: true, sub: `Base ${fmtINR(res.baseTax)} + cess ${fmtINR(res.cess)}` },
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
  const [hover, setHover] = useState<number | null>(null);
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
// Savings recommendations
// ─────────────────────────────────────────────────────────────────────────────

function SavingsPanel({ gaps, totalGapSave, winner, input }: {
  gaps: ReturnType<typeof calcDeductionGaps>;
  totalGapSave: number;
  winner: 'old' | 'new';
  input: UserInput;
}) {
  type Tip = { priority: 'high'|'med'; code: string; title: string; saving: number; action: string };
  const tips: Tip[] = [];

  if (winner === 'old') {
    for (const g of gaps) {
      if (g.code === '80C')
        tips.push({ priority: 'high', code: '80C', title: 'Top up 80C investments', saving: g.taxSaved, action: `Invest ₹${fmtINRShort(g.gap)} in ELSS/PPF/NSC before 31 March.` });
      if (g.code === '80CCD(1B)')
        tips.push({ priority: 'high', code: 'NPS', title: 'Open / top up NPS', saving: g.taxSaved, action: `Put ₹${fmtINRShort(g.gap)} in NPS Tier-1 — extra over 80C, saves ${fmtINR(g.taxSaved)}.` });
      if (g.code === '80D')
        tips.push({ priority: 'med', code: '80D', title: 'Buy health insurance', saving: g.taxSaved, action: `A mediclaim premium of ₹${fmtINRShort(g.gap)} fills the gap and saves ${fmtINR(g.taxSaved)}.` });
      if (g.code === 'HRA' && input.rentPaid === 0)
        tips.push({ priority: 'high', code: 'HRA', title: 'Submit rent receipts', saving: g.taxSaved, action: 'Collect rent receipts + landlord PAN and submit to HR before Feb.' });
    }
  }

  if (winner === 'new') {
    const empNPS = Math.round(input.salary.basic * 0.10);
    const empNPSSave = Math.round(empNPS * 0.30 * 1.04);
    tips.push({
      priority: 'high', code: '80CCD(2)', title: 'Employer NPS — no cap',
      saving: empNPSSave,
      action: `Ask HR to route ≈${fmtINRShort(empNPS)}/yr (10% of basic) into NPS under 80CCD(2). Only deduction allowed in new regime beyond std ₹75K.`,
    });
  }

  const allGood = tips.length === 0 && gaps.length === 0;

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 13, border: '1px solid var(--line)', overflow: 'hidden' }}>
      {/* header */}
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
          ✅ <strong style={{ color: 'var(--ink)' }}>Well optimised.</strong> Deductions maxed out. Keep contributing to PPF/NPS before year-end.
        </div>
      ) : (
        <>
          {/* Tips */}
          {tips.map((t, i) => (
            <div key={t.code} style={{ padding: '11px 14px', borderTop: i === 0 ? undefined : '1px solid var(--line)', display: 'flex', gap: 11, alignItems: 'flex-start' }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: t.priority === 'high' ? 'var(--brand-soft)' : 'var(--surface-alt)', color: 'var(--brand)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 9, fontWeight: 800, fontFamily: 'Geist Mono,monospace' }}>{t.code.slice(0,5)}</div>
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

          {/* Deduction gap bars (Old regime) */}
          {winner === 'old' && gaps.length > 0 && (
            <div style={{ borderTop: '1px solid var(--line)' }}>
              <div style={{ padding: '9px 14px 5px', fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink-soft)' }}>Unused deduction headroom</div>
              {gaps.map((g, i) => {
                const pct = Math.min(100, Math.round((g.used / g.maxLimit) * 100));
                return (
                  <div key={g.code} style={{ padding: '9px 14px', borderTop: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'Geist Mono,monospace', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'var(--surface-alt)', color: 'var(--ink-mid)' }}>{g.code}</span>
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

          {/* Regime switch nudge */}
          {winner === 'new' && gaps.length > 0 && (
            <div style={{ borderTop: '1px solid var(--line)', padding: '10px 14px', background: 'var(--surface-alt)', fontSize: 11, color: 'var(--ink-mid)', lineHeight: 1.6 }}>
              💡 If you maximise all deductions in Old regime, you could save <strong style={{ color: 'var(--brand)' }}>{fmtINR(Math.round(gaps.reduce((s,g) => s+g.taxSaved, 0)))}</strong> extra. Fill in 80C/HRA/NPS above to compare.
            </div>
          )}

          {/* Total */}
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
