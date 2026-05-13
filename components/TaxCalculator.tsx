'use client';
import React, { useState, useMemo, useCallback } from 'react';
import {
  calcOldRegime, calcNewRegime, calcDeductionGaps,
  sliceBySlabs, SLABS_NEW, SLABS_OLD,
  type UserInput,
} from '@/lib/taxCalc';
import { fmtINR, fmtINRShort } from '@/lib/formatters';

// ── helpers ───────────────────────────────────────────────────────────────────

function parseNum(s: string): number {
  const n = Number(String(s).replace(/,/g, '').trim());
  return isNaN(n) ? 0 : n;
}

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

const INITIAL: FormState = {
  gross: '', basic: '', hra: '', pf: '',
  rentPaid: '', metro: true,
  sec80C: '', sec80D: '', sec80CCD1B: '',
  homeLoanInterest: '', otherIncome: '',
};

// ── main component ────────────────────────────────────────────────────────────

export function TaxCalculator() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [openSection, setOpenSection] = useState<string>('income');

  const setField = useCallback((k: keyof FormState, v: string | boolean) => {
    setForm(f => ({ ...f, [k]: v }));
  }, []);

  const gross = parseNum(form.gross);
  const hasGross = gross > 0;

  // derive sensible defaults for missing fields
  const basic   = parseNum(form.basic)   || Math.round(gross * 0.4);
  const hra     = parseNum(form.hra)     || Math.round(gross * 0.2);
  const pf      = parseNum(form.pf)      || Math.round(basic * 0.12);

  const input = useMemo<UserInput>(() => ({
    salary: { gross, basic, hra, pf, professional: 2400, standardDed: 75000 },
    rentPaid: parseNum(form.rentPaid),
    metro: form.metro,
    sec80C: parseNum(form.sec80C),
    sec80D: parseNum(form.sec80D),
    sec80CCD1B: parseNum(form.sec80CCD1B),
    homeLoanInterest: parseNum(form.homeLoanInterest),
    otherIncome: parseNum(form.otherIncome),
  }), [gross, basic, hra, pf, form.rentPaid, form.metro, form.sec80C, form.sec80D, form.sec80CCD1B, form.homeLoanInterest, form.otherIncome]);

  const old  = useMemo(() => calcOldRegime(input), [input]);
  const nw   = useMemo(() => calcNewRegime(input),  [input]);
  const gaps = useMemo(() => calcDeductionGaps(input, old), [input, old]);

  const winner: 'old' | 'new'  = old.tax <= nw.tax ? 'old' : 'new';
  const savings                 = Math.abs(old.tax - nw.tax);
  const monthlyDelta            = Math.round(savings / 12);
  const totalDeductionSaving    = gaps.reduce((s, g) => s + g.taxSaved, 0);

  // HRA exemption preview for the info box
  const hraExemptPreview = useMemo(() => {
    if (!hasGross || parseNum(form.rentPaid) === 0) return null;
    const hraPct = form.metro ? 0.5 : 0.4;
    return Math.max(0, Math.min(hra, basic * hraPct, Math.max(0, parseNum(form.rentPaid) - basic * 0.1)));
  }, [hasGross, form.rentPaid, form.metro, hra, basic]);

  const toggle = (id: string) => setOpenSection(o => o === id ? '' : id);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid var(--line)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 20, boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <TaxlyMark />
            <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.5 }}>taxly</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Chip label="FY 2025-26" green />
            <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>AY 2026-27</span>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--brand)', padding: '36px 24px 40px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <h1 style={{ margin: 0, color: '#fff', fontSize: 'clamp(26px, 3.5vw, 44px)', fontWeight: 700, letterSpacing: -1, lineHeight: 1.12 }}>
            How much tax are you actually paying?
          </h1>
          <p style={{ margin: '10px 0 0', color: 'rgba(255,255,255,0.75)', fontSize: 15, maxWidth: 480, lineHeight: 1.6 }}>
            Fill in your salary. See Old vs New regime side-by-side, which one saves you more, and every rupee you can still recover.
          </p>
        </div>
      </div>

      {/* ── TWO-COLUMN LAYOUT ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 24px 80px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,400px)', gap: 28, alignItems: 'start' }}>

        {/* ═══ LEFT — FORM ═════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          <SectionCard
            id="income" title="💼  Salary & income" open={openSection === 'income'}
            onToggle={() => toggle('income')}
            badge={hasGross ? fmtINRShort(gross) : undefined} required={!hasGross}
          >
            <Row2>
              <FieldWrap label="Gross annual salary" hint="Total before any deductions" required>
                <AmtInput value={form.gross} onChange={v => setField('gross', v)} placeholder="18,00,000" autoFocus />
              </FieldWrap>
              <FieldWrap label="Basic salary" hint="≈ 40% of gross">
                <AmtInput value={form.basic} onChange={v => setField('basic', v)} placeholder={gross ? String(Math.round(gross * 0.4)) : '7,20,000'} />
              </FieldWrap>
            </Row2>
            <Row2>
              <FieldWrap label="HRA component" hint="House Rent Allowance in CTC">
                <AmtInput value={form.hra} onChange={v => setField('hra', v)} placeholder={gross ? String(Math.round(gross * 0.2)) : '3,60,000'} />
              </FieldWrap>
              <FieldWrap label="Your PF contribution" hint="12% of basic by default">
                <AmtInput value={form.pf} onChange={v => setField('pf', v)} placeholder={basic ? String(Math.round(basic * 0.12)) : '86,400'} />
              </FieldWrap>
            </Row2>
            <FieldWrap label="Other income (optional)" hint="FD interest, capital gains, freelance">
              <AmtInput value={form.otherIncome} onChange={v => setField('otherIncome', v)} placeholder="0" />
            </FieldWrap>
            <Note>PF counts toward your 80C limit. Standard deduction ₹75,000 is auto-applied in both regimes.</Note>
          </SectionCard>

          <SectionCard
            id="rent" title="🏠  Rent & HRA" open={openSection === 'rent'}
            onToggle={() => toggle('rent')}
            badge={parseNum(form.rentPaid) > 0 ? fmtINRShort(parseNum(form.rentPaid)) + '/yr rent' : undefined}
          >
            <FieldWrap label="Annual rent paid" hint="Actual amount you pay your landlord">
              <AmtInput value={form.rentPaid} onChange={v => setField('rentPaid', v)} placeholder="2,64,000" />
            </FieldWrap>
            <Toggle
              label="Living in metro city"
              sub="Delhi · Mumbai · Chennai · Kolkata → 50% HRA exemption (40% for non-metro)"
              value={form.metro}
              onChange={v => setField('metro', v)}
            />
            {hraExemptPreview !== null && (
              <Note green>
                Your HRA exemption: <strong>{fmtINR(hraExemptPreview)}</strong> (least of HRA received, {form.metro ? '50%' : '40%'} of basic, rent − 10% of basic)
              </Note>
            )}
            {parseNum(form.rentPaid) === 0 && (
              <Note>If you pay rent, fill this in — it can save you ₹{fmtINRShort(Math.round(hra * 0.3 * 1.04))} or more in tax.</Note>
            )}
          </SectionCard>

          <SectionCard
            id="deductions" title="📋  Deductions (Old regime)" open={openSection === 'deductions'}
            onToggle={() => toggle('deductions')}
            badge={(() => {
              const t = Math.min(150000, parseNum(form.sec80C) + pf) + Math.min(25000, parseNum(form.sec80D)) + Math.min(50000, parseNum(form.sec80CCD1B)) + Math.min(200000, parseNum(form.homeLoanInterest));
              return t > 0 ? fmtINRShort(t) + ' claimed' : undefined;
            })()}
          >
            <Row2>
              <FieldWrap label="80C — ELSS / PPF / LIC" hint="Max ₹1.5L (PF auto-included)">
                <AmtInput value={form.sec80C} onChange={v => setField('sec80C', v)} placeholder="0" max={150000} />
              </FieldWrap>
              <FieldWrap label="80D — Health insurance" hint="Self + family, max ₹25K">
                <AmtInput value={form.sec80D} onChange={v => setField('sec80D', v)} placeholder="0" max={25000} />
              </FieldWrap>
            </Row2>
            <Row2>
              <FieldWrap label="80CCD(1B) — NPS extra" hint="Additional ₹50K over 80C">
                <AmtInput value={form.sec80CCD1B} onChange={v => setField('sec80CCD1B', v)} placeholder="0" max={50000} />
              </FieldWrap>
              <FieldWrap label="24(b) — Home loan interest" hint="Self-occupied, max ₹2L/yr">
                <AmtInput value={form.homeLoanInterest} onChange={v => setField('homeLoanInterest', v)} placeholder="0" max={200000} />
              </FieldWrap>
            </Row2>
            <Note>These deductions only apply in the Old regime. They don't affect New regime tax.</Note>
          </SectionCard>

          <div style={{ fontSize: 12, color: 'var(--ink-soft)', padding: '2px 4px', lineHeight: 1.7 }}>
            ⓘ  Slabs: FY 2025-26 (AY 2026-27). Budget 2026 made no changes.
            New regime: ₹0 tax up to ₹12L taxable (87A rebate ₹60K).
            Old regime: 87A rebate up to ₹5L taxable (max ₹12.5K).
          </div>
        </div>

        {/* ═══ RIGHT — LIVE RESULTS ════════════════════════════════════════ */}
        <div style={{ position: 'sticky', top: 72, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 'calc(100vh - 90px)', overflowY: 'auto', paddingRight: 2 }}>
          {!hasGross
            ? <Placeholder />
            : <>
                <WinnerCard winner={winner} savings={savings} monthlyDelta={monthlyDelta} oldTax={old.tax} newTax={nw.tax} />
                <Comparison old={old} nw={nw} winner={winner} />
                <BreakdownTable winner={winner} old={old} nw={nw} />
                <SlabBar taxable={winner === 'old' ? old.taxable : nw.taxable} slabs={winner === 'old' ? SLABS_OLD : SLABS_NEW} regime={winner} />
                <SavingsActions gaps={gaps} totalSaving={totalDeductionSaving} winner={winner} input={input} />
              </>
          }
        </div>
      </div>
    </div>
  );
}

// ── Logo ──────────────────────────────────────────────────────────────────────

function TaxlyMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
      <rect x="2" y="2" width="60" height="60" rx="16" fill="#0B6E4F" />
      <path d="M22 18h22M22 26h22M28 18c5 0 9 3 9 8s-4 8-9 8h-3l13 12"
        stroke="#D4FF4F" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Chip({ label, green }: { label: string; green?: boolean }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: 0.5, padding: '3px 9px', borderRadius: 999,
      background: green ? 'var(--brand-soft)' : 'var(--surface-alt)',
      color: green ? 'var(--brand)' : 'var(--ink-mid)',
    }}>{label}</span>
  );
}

// ── Form layout atoms ─────────────────────────────────────────────────────────

function SectionCard({ id, title, open, onToggle, badge, required, children }: {
  id: string; title: string; open: boolean; onToggle: () => void;
  badge?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 14, border: `1.5px solid ${open ? 'var(--brand)' : 'var(--line)'}`, overflow: 'hidden', transition: 'border-color .15s ease' }}>
      <button onClick={onToggle} style={{ appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer', width: '100%', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {required && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', background: 'var(--danger-soft)', padding: '2px 7px', borderRadius: 4 }}>Required</span>}
          {badge && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', fontFamily: 'Geist Mono, monospace' }}>{badge}</span>}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .2s ease', flexShrink: 0 }}>
            <path d="M6 9l6 6 6-6" stroke="var(--ink-soft)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>
      {open && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div style={{ height: 6 }} />
          {children}
        </div>
      )}
    </div>
  );
}

function Row2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>;
}

function FieldWrap({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.1 }}>
          {label}{required && <span style={{ color: 'var(--brand)', marginLeft: 3 }}>*</span>}
        </label>
        {hint && <span style={{ fontSize: 11, color: 'var(--ink-soft)', textAlign: 'right', flexShrink: 0 }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function AmtInput({ value, onChange, placeholder, autoFocus, max }: {
  value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean; max?: number;
}) {
  const [focus, setFocus] = useState(false);
  const n = parseNum(value);
  const over = max != null && n > 0 && n > max;

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: 42, borderRadius: 9, padding: '0 12px', border: `1.5px solid ${over ? 'var(--danger)' : focus ? 'var(--brand)' : 'var(--line-strong)'}`, background: 'var(--bg)', gap: 5, transition: 'border-color .15s ease' }}>
      <span style={{ fontSize: 14, color: 'var(--ink-mid)', fontFamily: 'Geist Mono, monospace', userSelect: 'none' }}>₹</span>
      <input
        type="text" inputMode="numeric" autoFocus={autoFocus}
        value={value}
        onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder={placeholder}
        style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', fontFamily: 'Geist Mono, monospace', fontSize: 14, fontWeight: 500, color: 'var(--ink)', letterSpacing: 0.2 }}
      />
      {over && <span style={{ fontSize: 10, color: 'var(--danger)', fontWeight: 700, flexShrink: 0 }}>MAX {fmtINRShort(max!)}</span>}
    </div>
  );
}

function Toggle({ label, sub, value, onChange }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--ink-mid)', marginTop: 2, lineHeight: 1.5 }}>{sub}</div>}
      </div>
      <button onClick={() => onChange(!value)} style={{ appearance: 'none', border: 0, cursor: 'pointer', width: 42, height: 24, borderRadius: 12, padding: 2, background: value ? 'var(--brand)' : 'var(--line-strong)', transition: 'background .15s ease', flexShrink: 0, position: 'relative' }}>
        <div style={{ width: 20, height: 20, borderRadius: 10, background: '#fff', position: 'absolute', top: 2, left: value ? 20 : 2, transition: 'left .15s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.18)' }} />
      </button>
    </div>
  );
}

function Note({ children, green }: { children: React.ReactNode; green?: boolean }) {
  return (
    <div style={{ padding: '9px 12px', borderRadius: 9, background: green ? 'var(--brand-soft)' : 'var(--surface-alt)', color: green ? 'var(--brand-ink)' : 'var(--ink-mid)', fontSize: 12, lineHeight: 1.6 }}>
      {children}
    </div>
  );
}

// ── Results ───────────────────────────────────────────────────────────────────

function Placeholder() {
  return (
    <div style={{ padding: '40px 24px', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--line)', textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.3 }}>Enter your gross salary to start</div>
      <div style={{ fontSize: 13, color: 'var(--ink-mid)', marginTop: 6, lineHeight: 1.6 }}>
        Your tax comparison appears here<br />in real time as you fill in details.
      </div>
    </div>
  );
}

function WinnerCard({ winner, savings, monthlyDelta, oldTax, newTax }: {
  winner: 'old' | 'new'; savings: number; monthlyDelta: number; oldTax: number; newTax: number;
}) {
  const label = winner === 'new' ? 'New regime' : 'Old regime';
  const reason = winner === 'new'
    ? 'Lower slabs outweigh your deductions at this income level.'
    : 'Your deductions (HRA, 80C, etc.) reduce taxable income enough to beat the new regime.';

  return (
    <div style={{ borderRadius: 18, padding: '20px 22px', background: 'linear-gradient(145deg, #0B6E4F 0%, #063D2C 100%)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      {/* glow */}
      <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,255,79,0.22) 0%, transparent 65%)', top: -50, right: -30, pointerEvents: 'none' }} />

      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>Best for you</div>
        <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1, color: '#fff', marginTop: 2, lineHeight: 1.1 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 6, lineHeight: 1.5, maxWidth: 280 }}>{reason}</div>

        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 14, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>Save vs other regime</div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 24, fontWeight: 700, color: '#D4FF4F', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(savings)}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>per year</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', height: 36 }} />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>Extra in hand</div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 24, fontWeight: 700, color: '#fff', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(monthlyDelta)}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>per month</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Comparison({ old, nw, winner }: { old: ReturnType<typeof calcOldRegime>; nw: ReturnType<typeof calcNewRegime>; winner: 'old' | 'new' }) {
  const cols = [
    { key: 'old' as const, label: 'Old regime', sub: 'Deductions apply', tax: old.tax, monthly: Math.round((old.gross - old.tax) / 12) },
    { key: 'new' as const, label: 'New regime', sub: 'Lower flat slabs',  tax: nw.tax,  monthly: Math.round((nw.gross  - nw.tax)  / 12) },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {cols.map(c => {
        const win = c.key === winner;
        return (
          <div key={c.key} style={{ borderRadius: 13, padding: '13px 14px', position: 'relative', background: win ? 'var(--brand-soft)' : 'var(--surface)', border: `1.5px solid ${win ? 'var(--brand)' : 'var(--line)'}` }}>
            {win && (
              <div style={{ position: 'absolute', top: -8, right: 10, background: 'var(--brand)', color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 5 }}>
                ✓ Winner
              </div>
            )}
            <div style={{ fontSize: 12, fontWeight: 700, color: win ? 'var(--brand-ink)' : 'var(--ink)' }}>{c.label}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 1 }}>{c.sub}</div>
            <div style={{ marginTop: 9 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Tax / year</div>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 18, fontWeight: 700, letterSpacing: -0.4, color: win ? 'var(--brand-ink)' : 'var(--ink)', fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>{fmtINR(c.tax)}</div>
            </div>
            <div style={{ marginTop: 9, paddingTop: 9, borderTop: `1px dashed ${win ? 'rgba(11,110,79,0.25)' : 'var(--line)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 10, color: 'var(--ink-soft)' }}>In-hand / month</span>
              <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, fontWeight: 600, color: win ? 'var(--brand)' : 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{fmtINR(c.monthly)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BreakdownTable({ winner, old, nw }: { winner: 'old' | 'new'; old: ReturnType<typeof calcOldRegime>; nw: ReturnType<typeof calcNewRegime> }) {
  const res = winner === 'old' ? old : nw;
  const d   = res.deductionsUsed;

  type Row = { label: string; value: number; sub?: string; accent?: boolean; bold?: boolean; danger?: boolean };
  const rows: Row[] = [
    { label: 'Gross income',  value: res.gross },
    { label: 'Standard deduction', value: -d.standardDed, accent: true },
    ...(winner === 'old' && d.hraExempt > 0          ? [{ label: 'HRA exemption',      value: -d.hraExempt,          accent: true, sub: 'Rent paid × HRA formula' }] : []),
    ...(winner === 'old' && d.professional > 0        ? [{ label: 'Professional tax',   value: -d.professional,       accent: true }] : []),
    ...(winner === 'old' && d.sec80C > 0              ? [{ label: '80C deduction',       value: -d.sec80C,             accent: true, sub: 'PF + investments, capped ₹1.5L' }] : []),
    ...(winner === 'old' && d.sec80D > 0              ? [{ label: '80D health insur.',   value: -d.sec80D,             accent: true }] : []),
    ...(winner === 'old' && d.sec80CCD1B > 0          ? [{ label: '80CCD(1B) NPS',       value: -d.sec80CCD1B,         accent: true }] : []),
    ...(winner === 'old' && d.homeLoanInterest > 0    ? [{ label: '24(b) home loan',     value: -d.homeLoanInterest,   accent: true }] : []),
    { label: 'Taxable income', value: res.taxable, bold: true },
    ...(res.rebate > 0 ? [{ label: '87A rebate', value: -res.rebate, accent: true, sub: winner === 'new' ? 'Zero tax up to ₹12L taxable' : 'Zero tax up to ₹5L taxable' }] : []),
    { label: 'Tax + 4% cess', value: res.tax, danger: true, bold: true, sub: `Base tax ${fmtINR(res.baseTax)} + cess ${fmtINR(res.cess)}` },
  ];

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--line)', overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px 8px', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
        {winner === 'old' ? 'Old' : 'New'} regime — full calculation
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 14px', borderTop: '1px solid var(--line)' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: r.bold ? 700 : 400, color: r.danger ? 'var(--danger)' : 'var(--ink)' }}>{r.label}</div>
            {r.sub && <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 1 }}>{r.sub}</div>}
          </div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: r.bold ? 13 : 12, fontWeight: r.bold ? 700 : 500, color: r.accent ? 'var(--brand)' : r.danger ? 'var(--danger)' : 'var(--ink)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', marginLeft: 12 }}>
            {r.value < 0 ? '−' : ''}{fmtINR(Math.abs(r.value))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SlabBar({ taxable, slabs, regime }: { taxable: number; slabs: typeof SLABS_NEW; regime: 'old' | 'new' }) {
  const [hover, setHover] = useState<number | null>(null);
  const slices = useMemo(() => sliceBySlabs(taxable, slabs).filter(s => s.amount > 0), [taxable, slabs]);

  if (taxable <= 0 || slices.length === 0) return null;

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--line)', padding: '12px 14px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 9 }}>
        Income split by tax band — {regime} regime
      </div>
      <div style={{ height: 32, borderRadius: 7, overflow: 'hidden', display: 'flex', background: 'var(--surface-alt)' }}>
        {slices.map((s, i) => {
          const pct = (s.amount / taxable) * 100;
          const col = SLAB_COLORS[Math.min(SLAB_COLORS.length - 1, slabs.findIndex(x => x.upto === s.upto))];
          return (
            <div key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => setHover(hover === i ? null : i)}
              style={{ width: `${pct}%`, background: col, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: i < slices.length - 1 ? '1px solid rgba(255,255,255,0.3)' : undefined, filter: hover != null && hover !== i ? 'saturate(0.3) brightness(1.1)' : undefined, transition: 'filter .1s ease' }}>
              {pct > 10 && <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{Math.round(s.rate * 100)}%</span>}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 7, minHeight: 20, fontSize: 11 }}>
        {hover != null && slices[hover]
          ? (
            <span style={{ color: 'var(--ink)' }}>
              <strong>{slices[hover].label}</strong> · {fmtINRShort(slices[hover].amount)} falls here ·{' '}
              tax on this slice: <strong style={{ color: slices[hover].rate === 0 ? 'var(--brand)' : 'var(--ink)' }}>
                {slices[hover].rate === 0 ? '₹0 (free)' : fmtINR(slices[hover].tax)}
              </strong>
            </span>
          )
          : <span style={{ color: 'var(--ink-soft)' }}>Hover a band to inspect how much income falls there</span>
        }
      </div>
    </div>
  );
}

// ── Savings Actions (the key value-add) ───────────────────────────────────────

function SavingsActions({ gaps, totalSaving, winner, input }: {
  gaps: ReturnType<typeof calcDeductionGaps>;
  totalSaving: number;
  winner: 'old' | 'new';
  input: UserInput;
}) {
  const actionableGaps = gaps.filter(g => g.gap > 0);

  // Build actionable tips specific to the user's situation
  const tips: Array<{ priority: 'high' | 'medium'; code: string; title: string; saving: number; action: string; why: string }> = [];

  // Gap-based tips (only relevant for Old regime)
  if (winner === 'old') {
    for (const g of actionableGaps) {
      if (g.code === '80C' && g.gap > 0) {
        tips.push({ priority: 'high', code: '80C', title: 'Top up your 80C investments', saving: g.taxSaved, action: `Invest ₹${fmtINRShort(g.gap)} more in ELSS, PPF, or NSC before March 31.`, why: `80C gap: ₹${fmtINRShort(g.gap)} unused → saves ₹${fmtINR(g.taxSaved)} tax` });
      }
      if (g.code === '80CCD(1B)' && g.gap > 0) {
        tips.push({ priority: 'high', code: 'NPS', title: 'Open / contribute to NPS', saving: g.taxSaved, action: `Put ₹${fmtINRShort(g.gap)} into NPS Tier-1 (over your 80C).`, why: `Extra deduction over 80C — saves ₹${fmtINR(g.taxSaved)}` });
      }
      if (g.code === '80D' && g.gap > 0) {
        tips.push({ priority: 'medium', code: '80D', title: 'Get health insurance', saving: g.taxSaved, action: `Buy a mediclaim of ₹${fmtINRShort(g.gap)} annual premium or higher.`, why: `₹${fmtINRShort(g.gap)} gap → saves ₹${fmtINR(g.taxSaved)} tax` });
      }
      if (g.code === 'HRA' && g.gap > 0 && input.rentPaid === 0) {
        tips.push({ priority: 'high', code: 'HRA', title: 'Submit rent receipts', saving: g.taxSaved, action: 'Collect rent receipts and submit to employer. If PAN of landlord needed, collect that too.', why: `You have HRA in CTC but no rent entered → potential ₹${fmtINR(g.taxSaved)} saving` });
      }
    }
  }

  // New regime specific tips
  if (winner === 'new') {
    const empNPS = Math.round(input.salary.gross * 0.1); // 10% of gross
    const empNPSTaxSave = Math.round(empNPS * 0.30 * 1.04);
    tips.push({
      priority: 'high', code: '80CCD(2)', title: 'Ask employer for NPS contribution',
      saving: empNPSTaxSave,
      action: `Ask HR to route up to 10% of basic (≈ ${fmtINRShort(empNPS)}/yr) into NPS via 80CCD(2) — no cap, applies in New regime.`,
      why: `Only deduction available in New regime beyond standard ₹75K. Saves ≈ ${fmtINR(empNPSTaxSave)}`
    });
  }

  // Universal tips
  if (input.sec80D < 25000 && winner === 'old') {
    // already covered above via gaps
  }

  // Consider switching regime
  const switchTip = winner === 'new' && actionableGaps.length > 0;
  const switchSaving = actionableGaps.reduce((s, g) => s + g.taxSaved, 0);

  if (tips.length === 0 && actionableGaps.length === 0) {
    return (
      <div style={{ padding: '16px 18px', background: 'var(--brand-soft)', borderRadius: 14, border: '1px solid rgba(11,110,79,0.15)', fontSize: 13, color: 'var(--brand-ink)', lineHeight: 1.6 }}>
        <strong>✅ Well optimised.</strong> You&apos;re using the best regime and your deductions look maxed out. Keep contributing to PPF/NPS before year-end.
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--line)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid var(--line)', background: totalSaving > 0 ? '#FFF8E1' : 'var(--surface-alt)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--warn)' }}>
          💡 How to save more tax
        </div>
        {totalSaving > 0 && winner === 'old' && (
          <div style={{ marginTop: 4, fontSize: 19, fontWeight: 700, letterSpacing: -0.5, color: 'var(--ink)' }}>
            Up to <span style={{ color: 'var(--brand)' }}>{fmtINR(totalSaving)}</span> more savings available
          </div>
        )}
      </div>

      {/* Action items */}
      <div>
        {tips.map((tip, i) => (
          <div key={tip.code} style={{ padding: '12px 16px', borderTop: i === 0 ? undefined : '1px solid var(--line)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: tip.priority === 'high' ? 'var(--brand-soft)' : 'var(--surface-alt)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 10, fontWeight: 800, color: 'var(--brand)', fontFamily: 'Geist Mono, monospace' }}>
              {tip.code.slice(0, 4)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.2 }}>{tip.title}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-mid)', marginTop: 3, lineHeight: 1.5 }}>{tip.action}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 3, fontStyle: 'italic' }}>{tip.why}</div>
            </div>
            {tip.saving > 0 && (
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: 'var(--ink-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Save</div>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 14, fontWeight: 700, color: 'var(--brand)', fontVariantNumeric: 'tabular-nums' }}>+{fmtINR(tip.saving)}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Deduction gaps (Old regime) */}
      {winner === 'old' && actionableGaps.length > 0 && (
        <div style={{ borderTop: '1px solid var(--line)' }}>
          <div style={{ padding: '10px 16px 6px', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink-soft)' }}>Deduction gaps</div>
          {actionableGaps.map((g, i) => {
            const pct = Math.min(100, Math.round((g.used / g.maxLimit) * 100));
            return (
              <div key={g.code} style={{ padding: '10px 16px', borderTop: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 3, background: 'var(--surface-alt)', color: 'var(--ink-mid)' }}>{g.code}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{g.name}</span>
                  </div>
                  <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, fontWeight: 700, color: 'var(--brand)' }}>+{fmtINR(g.taxSaved)}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--surface-alt)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? 'var(--brand)' : 'var(--warn)', borderRadius: 2 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 10, color: 'var(--ink-soft)', fontFamily: 'Geist Mono, monospace' }}>
                  <span>Used {fmtINR(g.used)}</span>
                  <span>Max {fmtINR(g.maxLimit)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Regime-switch nudge */}
      {switchTip && (
        <div style={{ borderTop: '1px solid var(--line)', padding: '12px 16px', background: 'var(--surface-alt)', fontSize: 12, color: 'var(--ink-mid)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--ink)' }}>💡 If you claimed all deductions in Old regime</strong> — you&apos;d save an extra <strong style={{ color: 'var(--brand)' }}>{fmtINR(switchSaving)}</strong> in tax. Fill in your 80C / HRA / NPS in the form above to compare.
        </div>
      )}

      {/* Total */}
      {totalSaving > 0 && winner === 'old' && (
        <div style={{ borderTop: '1px solid var(--line)', padding: '10px 16px', background: 'var(--brand-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-ink)' }}>Total potential extra savings</span>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>{fmtINR(totalSaving)}</span>
        </div>
      )}
    </div>
  );
}
