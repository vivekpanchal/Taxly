'use client';
import React, { useState, useMemo } from 'react';
import {
  calcOldRegime, calcNewRegime, calcDeductionGaps,
  sliceBySlabs, SLABS_NEW, SLABS_OLD,
  type UserInput,
} from '@/lib/taxCalc';
import { fmtINR, fmtINRShort } from '@/lib/formatters';

// ── helpers ───────────────────────────────────────────────────────────────────

function num(s: string): number { return Number(s.replace(/,/g, '')) || 0; }

const SLAB_COLORS = ['#A7D9B7','#7FC998','#5DB87E','#3DA767','#208C50','#0B6E4F','#063D2C'];

// ── form state ────────────────────────────────────────────────────────────────

interface FormState {
  gross: string;
  basic: string;
  hra: string;
  pf: string;
  rentPaid: string;
  metro: boolean;
  sec80C: string;
  sec80D: string;
  sec80CCD1B: string;
  homeLoanInterest: string;
  otherIncome: string;
}

const EMPTY: FormState = {
  gross: '', basic: '', hra: '', pf: '',
  rentPaid: '', metro: true,
  sec80C: '', sec80D: '', sec80CCD1B: '',
  homeLoanInterest: '', otherIncome: '',
};

// ── component ─────────────────────────────────────────────────────────────────

export function TaxCalculator() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [activeSection, setActiveSection] = useState<string>('income');

  const set = (k: keyof FormState) => (v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const hasGross = num(form.gross) > 0;

  const input = useMemo<UserInput>(() => ({
    salary: {
      gross: num(form.gross),
      basic: num(form.basic) || Math.round(num(form.gross) * 0.4),
      hra: num(form.hra) || Math.round(num(form.gross) * 0.2),
      pf: num(form.pf) || Math.round(num(form.basic || String(num(form.gross) * 0.4)) * 0.12),
      professional: 2400,
      standardDed: 75000,
    },
    rentPaid: num(form.rentPaid),
    metro: form.metro,
    sec80C: num(form.sec80C),
    sec80D: num(form.sec80D),
    sec80CCD1B: num(form.sec80CCD1B),
    homeLoanInterest: num(form.homeLoanInterest),
    otherIncome: num(form.otherIncome),
  }), [form]);

  const old = useMemo(() => calcOldRegime(input), [input]);
  const nw  = useMemo(() => calcNewRegime(input),  [input]);
  const gaps = useMemo(() => calcDeductionGaps(input, old), [input, old]);

  const winner: 'old' | 'new' = old.tax <= nw.tax ? 'old' : 'new';
  const savings = Math.abs(old.tax - nw.tax);
  const monthlyDelta = savings / 12;
  const totalDeductionSaving = gaps.reduce((s, g) => s + g.taxSaved, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid var(--line)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TaxlyMark/>
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: 'var(--ink)' }}>taxly</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)', background: 'var(--brand-soft)', padding: '3px 10px', borderRadius: 999, letterSpacing: 0.4 }}>FY 2025-26</span>
            <span style={{ fontSize: 12, color: 'var(--ink-mid)' }}>AY 2026-27</span>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--brand)', color: '#fff', padding: '40px 24px 44px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, letterSpacing: -1.2, lineHeight: 1.1 }}>
            How much tax are you<br/>actually paying?
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: 16, color: 'rgba(255,255,255,0.8)', maxWidth: 520 }}>
            Enter your salary details. Instantly see Old vs New regime, which one wins,
            and exactly where you&apos;re leaving money on the table.
          </p>
        </div>
      </div>

      {/* ── MAIN LAYOUT ────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,420px)', gap: 32, alignItems: 'start' }}>

        {/* ═══════════════ LEFT — INPUT FORM ════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Income section */}
          <FormSection
            id="income"
            title="Salary & income"
            active={activeSection === 'income'}
            onToggle={() => setActiveSection(s => s === 'income' ? '' : 'income')}
            badge={hasGross ? fmtINRShort(num(form.gross)) : 'Required'}
            done={hasGross}
          >
            <FieldRow>
              <Field label="Gross annual salary" hint="Total CTC before any deductions" required>
                <MoneyInput value={form.gross} onChange={set('gross')} placeholder="18,00,000" autoFocus/>
              </Field>
              <Field label="Basic salary" hint="Typically 40% of gross">
                <MoneyInput value={form.basic} onChange={set('basic')} placeholder={String(Math.round(num(form.gross) * 0.4) || 720000)}/>
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label="HRA received" hint="House Rent Allowance component">
                <MoneyInput value={form.hra} onChange={set('hra')} placeholder={String(Math.round(num(form.gross) * 0.2) || 360000)}/>
              </Field>
              <Field label="Provident Fund (your share)" hint="12% of basic by default">
                <MoneyInput value={form.pf} onChange={set('pf')} placeholder="86,400"/>
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label="Other income" hint="Interest, capital gains, freelance etc.">
                <MoneyInput value={form.otherIncome} onChange={set('otherIncome')} placeholder="0"/>
              </Field>
            </FieldRow>
          </FormSection>

          {/* HRA / Rent section */}
          <FormSection
            id="hra"
            title="Rent & HRA"
            active={activeSection === 'hra'}
            onToggle={() => setActiveSection(s => s === 'hra' ? '' : 'hra')}
            badge={num(form.rentPaid) > 0 ? fmtINRShort(num(form.rentPaid)) + '/yr' : 'Optional'}
            done={num(form.rentPaid) > 0}
          >
            <Field label="Annual rent paid" hint="Actual rent paid to landlord">
              <MoneyInput value={form.rentPaid} onChange={set('rentPaid')} placeholder="2,64,000"/>
            </Field>
            <ToggleRow
              label="Living in metro city"
              sub="Delhi · Mumbai · Chennai · Kolkata (50% basic exemption)"
              value={form.metro}
              onChange={set('metro') as (v: boolean) => void}
            />
            <InfoBox>
              HRA exemption = least of: (a) HRA received, (b) {form.metro ? '50%' : '40%'} of basic, (c) rent paid − 10% of basic.
              {num(form.rentPaid) > 0 && num(form.basic || String(num(form.gross) * 0.4)) > 0 && (() => {
                const basic = num(form.basic) || Math.round(num(form.gross) * 0.4);
                const hraPct = form.metro ? 0.5 : 0.4;
                const exempt = Math.max(0, Math.min(
                  num(form.hra) || Math.round(num(form.gross) * 0.2),
                  basic * hraPct,
                  Math.max(0, num(form.rentPaid) - basic * 0.1),
                ));
                return <> Your estimated HRA exemption: <strong style={{ color: 'var(--brand)' }}>{fmtINR(exempt)}</strong></>;
              })()}
            </InfoBox>
          </FormSection>

          {/* Deductions section */}
          <FormSection
            id="deductions"
            title="Deductions (Old regime)"
            active={activeSection === 'deductions'}
            onToggle={() => setActiveSection(s => s === 'deductions' ? '' : 'deductions')}
            badge={(() => {
              const total = Math.min(150000, num(form.sec80C) + (num(form.pf) || 0)) + Math.min(25000, num(form.sec80D)) + Math.min(50000, num(form.sec80CCD1B)) + Math.min(200000, num(form.homeLoanInterest));
              return total > 0 ? fmtINRShort(total) + ' claimed' : 'Optional';
            })()}
            done={num(form.sec80C) > 0 || num(form.sec80D) > 0}
          >
            <FieldRow>
              <Field label="80C — ELSS / PPF / LIC" hint="Excl. PF (added above) · Max ₹1.5L">
                <MoneyInput value={form.sec80C} onChange={set('sec80C')} placeholder="0" max={150000}/>
              </Field>
              <Field label="80D — Health insurance" hint="Self + family · Max ₹25K (₹50K if parents senior)">
                <MoneyInput value={form.sec80D} onChange={set('sec80D')} placeholder="0" max={25000}/>
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label="80CCD(1B) — NPS" hint="Extra ₹50K over 80C limit">
                <MoneyInput value={form.sec80CCD1B} onChange={set('sec80CCD1B')} placeholder="0" max={50000}/>
              </Field>
              <Field label="24(b) — Home loan interest" hint="Self-occupied · Max ₹2L/yr">
                <MoneyInput value={form.homeLoanInterest} onChange={set('homeLoanInterest')} placeholder="0" max={200000}/>
              </Field>
            </FieldRow>
            <InfoBox>
              Standard deduction ₹75,000 is auto-applied in <strong>both</strong> regimes. Professional tax ₹2,400 is auto-applied in Old regime only.
            </InfoBox>
          </FormSection>

          {/* FY Note */}
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', padding: '0 4px', lineHeight: 1.6 }}>
            Tax slabs reflect <strong>FY 2025-26 (AY 2026-27)</strong>. Budget 2026 made no changes to income tax rates.
            New regime: ₹0 tax up to ₹12L taxable income (87A rebate ₹60,000). Old regime: 87A rebate up to ₹5L.
          </div>
        </div>

        {/* ═══════════════ RIGHT — RESULTS (sticky) ═════════════════════════ */}
        <div style={{ position: 'sticky', top: 76, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {!hasGross ? (
            <EmptyState/>
          ) : (
            <>
              {/* Winner card */}
              <WinnerCard winner={winner} savings={savings} monthlyDelta={monthlyDelta} oldTax={old.tax} newTax={nw.tax}/>

              {/* Side-by-side */}
              <SideBySide old={old} nw={nw} winner={winner}/>

              {/* Math breakdown */}
              <MathBreakdown winner={winner} old={old} nw={nw}/>

              {/* Slab bar */}
              <SlabBar taxable={winner === 'old' ? old.taxable : nw.taxable} slabs={winner === 'old' ? SLABS_OLD : SLABS_NEW} regime={winner}/>

              {/* Deduction gaps */}
              {winner === 'old' && <DeductionGapPanel gaps={gaps} totalSaving={totalDeductionSaving}/>}

              {/* Switch note for new regime */}
              {winner === 'new' && (
                <div style={{ padding: 14, background: 'var(--brand-soft)', borderRadius: 14, border: '1px solid rgba(11,110,79,0.15)', fontSize: 13, color: 'var(--brand-ink)', lineHeight: 1.6 }}>
                  <strong>New regime wins for you.</strong> The lower slabs outweigh your deductions.
                  Deduction gaps only apply to the Old regime — they&apos;re shown when Old wins.
                  To maximise savings in New regime: maximise NPS via employer (80CCD(2) — no cap).
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Logo mark ─────────────────────────────────────────────────────────────────

function TaxlyMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
      <rect x="2" y="2" width="60" height="60" rx="16" fill="#0B6E4F"/>
      <path d="M22 18h22M22 26h22M28 18c5 0 9 3 9 8s-4 8-9 8h-3l13 12"
        stroke="#D4FF4F" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Form primitives ───────────────────────────────────────────────────────────

function FormSection({ id, title, active, onToggle, badge, done, children }: {
  id: string; title: string; active: boolean; onToggle: () => void;
  badge: string; done?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, border: `1.5px solid ${done ? 'var(--brand)' : 'var(--line)'}`, overflow: 'hidden' }}>
      <button onClick={onToggle} style={{
        appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer',
        width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', textAlign: 'left',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 22, height: 22, borderRadius: 11, border: `2px solid ${done ? 'var(--brand)' : 'var(--line-strong)'}`, background: done ? 'var(--brand)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            {done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.2 }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: done ? 'var(--brand)' : 'var(--ink-soft)', fontFamily: done ? 'Geist Mono, monospace' : undefined }}>{badge}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ transform: active ? 'rotate(180deg)' : undefined, transition: 'transform .2s ease' }}>
            <path d="M6 9l6 6 6-6" stroke="var(--ink-soft)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>
      {active && (
        <div style={{ padding: '4px 20px 20px', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ height: 4 }}/>
          {children}
        </div>
      )}
    </div>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>;
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.1 }}>
          {label}{required && <span style={{ color: 'var(--brand)', marginLeft: 2 }}>*</span>}
        </label>
        {hint && <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function MoneyInput({ value, onChange, placeholder, autoFocus, max }: {
  value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean; max?: number;
}) {
  const [focus, setFocus] = useState(false);
  const n = num(value);
  const over = max != null && n > max;

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: 44, borderRadius: 10, padding: '0 12px', border: `1.5px solid ${over ? 'var(--danger)' : focus ? 'var(--brand)' : 'var(--line-strong)'}`, background: 'var(--bg)', gap: 6, transition: 'border-color .15s ease' }}>
      <span style={{ fontSize: 15, color: 'var(--ink-mid)', fontFamily: 'Geist Mono, monospace' }}>₹</span>
      <input
        type="text"
        inputMode="numeric"
        autoFocus={autoFocus}
        value={value}
        onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder={placeholder}
        style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', fontFamily: 'Geist Mono, monospace', fontSize: 15, fontWeight: 500, color: 'var(--ink)', letterSpacing: 0.2 }}
      />
    </div>
  );
}

function ToggleRow({ label, sub, value, onChange }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--ink-mid)', marginTop: 2 }}>{sub}</div>}
      </div>
      <button onClick={() => onChange(!value)} style={{ appearance: 'none', border: 0, cursor: 'pointer', width: 44, height: 26, borderRadius: 13, padding: 2, background: value ? 'var(--brand)' : 'var(--line-strong)', transition: 'background .15s ease', flexShrink: 0 }}>
        <div style={{ width: 22, height: 22, borderRadius: 11, background: '#fff', transform: value ? 'translateX(18px)' : 'translateX(0)', transition: 'transform .15s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}/>
      </button>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--brand-soft)', color: 'var(--brand-ink)', fontSize: 12, lineHeight: 1.6 }}>
      {children}
    </div>
  );
}

// ── Results components ────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ padding: 32, background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--line)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
      <div style={{ fontSize: 36 }}>🧾</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.3 }}>Enter your gross salary to start</div>
      <div style={{ fontSize: 13, color: 'var(--ink-mid)', maxWidth: 260, lineHeight: 1.6 }}>
        Your tax comparison and savings breakdown will appear here in real time.
      </div>
    </div>
  );
}

function WinnerCard({ winner, savings, monthlyDelta, oldTax, newTax }: { winner: 'old' | 'new'; savings: number; monthlyDelta: number; oldTax: number; newTax: number }) {
  return (
    <div style={{ borderRadius: 20, padding: '22px 24px', background: 'linear-gradient(145deg, #0B6E4F 0%, #074E36 100%)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: 100, background: 'radial-gradient(circle, rgba(212,255,79,0.25) 0%, transparent 65%)', top: -60, right: -40, pointerEvents: 'none' }}/>
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)' }}>Best regime for you</div>
        <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1.2, color: '#fff', marginTop: 4, textTransform: 'capitalize', lineHeight: 1.1 }}>
          {winner} regime
        </div>
        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 16, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>You save / year</div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 28, fontWeight: 700, letterSpacing: -0.8, color: '#D4FF4F', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(savings)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.18)', height: 40 }}/>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>Extra / month</div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 28, fontWeight: 700, letterSpacing: -0.8, color: '#fff', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(monthlyDelta)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SideBySide({ old, nw, winner }: { old: ReturnType<typeof calcOldRegime>; nw: ReturnType<typeof calcNewRegime>; winner: 'old' | 'new' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {[
        { regime: 'old' as const, label: 'Old regime', sub: 'More deductions', tax: old.tax, monthly: (old.gross - old.tax) / 12 },
        { regime: 'new' as const, label: 'New regime', sub: 'Lower slabs', tax: nw.tax, monthly: (nw.gross - nw.tax) / 12 },
      ].map(c => {
        const isWinner = c.regime === winner;
        return (
          <div key={c.regime} style={{ borderRadius: 14, padding: '14px 16px', position: 'relative', background: isWinner ? 'var(--brand-soft)' : 'var(--surface)', border: `1.5px solid ${isWinner ? 'var(--brand)' : 'var(--line)'}` }}>
            {isWinner && (
              <div style={{ position: 'absolute', top: -8, right: 10, background: 'var(--brand)', color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Winner
              </div>
            )}
            <div style={{ fontSize: 12, fontWeight: 700, color: isWinner ? 'var(--brand-ink)' : 'var(--ink)', letterSpacing: -0.1 }}>{c.label}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-mid)', marginTop: 2 }}>{c.sub}</div>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--ink-mid)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Tax / year</div>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 20, fontWeight: 700, color: isWinner ? 'var(--brand-ink)' : 'var(--ink)', fontVariantNumeric: 'tabular-nums', letterSpacing: -0.4 }}>{fmtINR(c.tax)}</div>
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${isWinner ? 'rgba(11,110,79,0.3)' : 'var(--line)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-mid)' }}>In hand/mo</div>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, fontWeight: 600, color: isWinner ? 'var(--brand)' : 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{fmtINR(c.monthly)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MathBreakdown({ winner, old, nw }: { winner: 'old' | 'new'; old: ReturnType<typeof calcOldRegime>; nw: ReturnType<typeof calcNewRegime> }) {
  const res = winner === 'old' ? old : nw;
  const d = res.deductionsUsed;

  const rows: Array<{ label: string; value: number; sub?: string; accent?: boolean; bold?: boolean; danger?: boolean }> = [
    { label: 'Gross income', value: res.gross },
    ...(winner === 'old' ? [
      { label: 'Standard deduction', value: -d.standardDed, accent: true },
      ...(d.hraExempt > 0 ? [{ label: 'HRA exemption', value: -d.hraExempt, accent: true }] : []),
      ...(d.professional > 0 ? [{ label: 'Professional tax', value: -d.professional, accent: true }] : []),
      ...(d.sec80C > 0 ? [{ label: '80C deduction', value: -d.sec80C, accent: true }] : []),
      ...(d.sec80D > 0 ? [{ label: '80D deduction', value: -d.sec80D, accent: true }] : []),
      ...(d.sec80CCD1B > 0 ? [{ label: '80CCD(1B) NPS', value: -d.sec80CCD1B, accent: true }] : []),
      ...(d.homeLoanInterest > 0 ? [{ label: '24(b) home loan', value: -d.homeLoanInterest, accent: true }] : []),
    ] : [
      { label: 'Standard deduction', value: -d.standardDed, accent: true },
    ]),
    { label: 'Taxable income', value: res.taxable, bold: true },
    ...(res.rebate > 0 ? [{ label: '87A rebate', value: -res.rebate, accent: true, sub: winner === 'new' ? 'Budget 2025: nil tax up to ₹12L' : 'nil tax up to ₹5L' }] : []),
    { label: 'Tax + 4% cess', value: res.tax, danger: true, bold: true },
  ];

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px 8px', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink-mid)' }}>
        {winner === 'old' ? 'Old' : 'New'} regime breakdown
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 16px', borderTop: '1px solid var(--line)' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: r.bold ? 700 : 500, color: r.danger ? 'var(--danger)' : 'var(--ink)' }}>{r.label}</div>
            {r.sub && <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 1 }}>{r.sub}</div>}
          </div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: r.bold ? 14 : 13, fontWeight: r.bold ? 700 : 500, color: r.accent ? 'var(--brand)' : r.danger ? 'var(--danger)' : 'var(--ink)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', marginLeft: 16 }}>
            {r.value < 0 ? '−' : ''}{fmtINR(Math.abs(r.value))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SlabBar({ taxable, slabs, regime }: { taxable: number; slabs: typeof SLABS_NEW; regime: 'old' | 'new' }) {
  const slices = sliceBySlabs(taxable, slabs).filter(s => s.amount > 0);
  const [hover, setHover] = useState<number | null>(null);
  if (taxable === 0) return null;

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--line)', padding: '14px 16px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink-mid)', marginBottom: 10 }}>
        How your income is taxed — {regime} regime
      </div>
      <div style={{ height: 36, borderRadius: 8, overflow: 'hidden', display: 'flex', background: 'var(--surface-alt)' }}>
        {slices.map((s, i) => {
          const pct = (s.amount / taxable) * 100;
          const col = SLAB_COLORS[Math.min(SLAB_COLORS.length - 1, slabs.findIndex(x => x.upto === s.upto))];
          return (
            <div key={i}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              onClick={() => setHover(hover === i ? null : i)}
              title={`${s.label} · ${Math.round(s.rate * 100)}% · ${fmtINR(s.amount)}`}
              style={{ width: `${pct}%`, background: col, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: i < slices.length - 1 ? '1px solid rgba(255,255,255,0.35)' : undefined, filter: hover != null && hover !== i ? 'saturate(0.4)' : undefined, transition: 'filter .15s ease' }}>
              {pct > 12 && <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}>{Math.round(s.rate * 100)}%</span>}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-soft)', minHeight: 18 }}>
        {hover != null && slices[hover]
          ? <span style={{ color: 'var(--ink)' }}><strong>{slices[hover].label}</strong> · ₹{fmtINRShort(slices[hover].amount).slice(1)} falls here · tax on this slice: <strong style={{ color: slices[hover].rate === 0 ? 'var(--brand)' : 'var(--ink)' }}>{slices[hover].rate === 0 ? 'FREE' : fmtINR(slices[hover].tax)}</strong></span>
          : 'Hover a band to inspect'}
      </div>
    </div>
  );
}

function DeductionGapPanel({ gaps, totalSaving }: { gaps: ReturnType<typeof calcDeductionGaps>; totalSaving: number }) {
  const actionable = gaps.filter(g => g.gap > 0);
  if (actionable.length === 0) return null;

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--danger)' }}>Money left on the table</div>
        <div style={{ marginTop: 4, fontSize: 22, fontWeight: 700, letterSpacing: -0.6, color: 'var(--ink)' }}>
          You could save <span style={{ color: 'var(--brand)' }}>{fmtINR(totalSaving)}</span> more
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-mid)', marginTop: 4 }}>by claiming unused deductions in the Old regime</div>
      </div>
      <div>
        {actionable.map((g, i) => {
          const pct = Math.round((g.used / g.maxLimit) * 100);
          return (
            <div key={g.code} style={{ padding: '12px 16px', borderTop: i === 0 ? undefined : '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'var(--surface-alt)', color: 'var(--ink-mid)' }}>{g.code}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{g.name}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 3, lineHeight: 1.5 }}>{g.description}</div>
                  <div style={{ marginTop: 8, height: 5, borderRadius: 3, background: 'var(--surface-alt)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? 'var(--brand)' : 'var(--warn)', borderRadius: 3, transition: 'width .4s ease' }}/>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'var(--ink-mid)', fontFamily: 'Geist Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
                    <span>Used {fmtINR(g.used)}</span>
                    <span>Max {fmtINR(g.maxLimit)}</span>
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'var(--ink-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Could save</div>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 16, fontWeight: 700, color: 'var(--brand)', fontVariantNumeric: 'tabular-nums' }}>+{fmtINR(g.taxSaved)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', background: 'var(--brand-soft)' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-ink)' }}>Total potential extra savings</span>
        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 14, fontWeight: 700, color: 'var(--brand)', fontVariantNumeric: 'tabular-nums' }}>{fmtINR(totalSaving)}</span>
      </div>
    </div>
  );
}
