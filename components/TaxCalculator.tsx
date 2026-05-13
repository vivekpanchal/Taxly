'use client';
import React, { useState, useCallback } from 'react';
import { calculate, type CalculateInput, type CalculateResult, type AgeGroup, type MetroCity } from '@/lib/api';
import { fmtINR, fmtINRShort } from '@/lib/formatters';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

function n(s: string): number {
  const v = Number(String(s).replace(/[^0-9.]/g, '').trim());
  return isFinite(v) ? v : 0;
}

const SLAB_COLORS = ['#C8EDD8','#8FD4AA','#5DB87E','#3DA767','#208C50','#0B6E4F','#074433'];

const METRO_CITIES: MetroCity[] = ['Delhi','Mumbai','Chennai','Kolkata','Bengaluru','Hyderabad','Pune','Ahmedabad','Other'];

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

function formToInput(f: Form): CalculateInput {
  const gross = n(f.gross);
  const basic = n(f.basic) || Math.round(gross * 0.4);
  const hra   = n(f.hra)   || Math.round(gross * 0.2);
  const pf    = n(f.pf)    || Math.round(basic * 0.12);
  return {
    salary: { gross, basic, hra, pf },
    age: f.age, city: f.city,
    rentPaid:         n(f.rentPaid),
    sec80C:           n(f.sec80C),
    sec80D:           n(f.sec80D),
    sec80D_parents:   n(f.sec80D_parents),
    sec80CCD1B:       n(f.sec80CCD1B),
    homeLoanInterest: n(f.homeLoanInterest),
    sec80TTA:         n(f.sec80TTA),
    sec80TTB:         n(f.sec80TTB),
    sec80E:           n(f.sec80E),
    sec80G:           0,
    otherIncome:      n(f.otherIncome),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────

export function TaxCalculator() {
  const [form, setForm]     = useState<Form>(INIT);
  const [result, setResult] = useState<CalculateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const upd = useCallback(<K extends keyof Form>(k: K, v: Form[K]) =>
    setForm(f => ({ ...f, [k]: v })), []);

  const gross    = n(form.gross);
  const basic    = n(form.basic) || Math.round(gross * 0.4);
  const hra      = n(form.hra)   || Math.round(gross * 0.2);
  const hasGross = gross > 0;
  const isMetro  = form.city !== 'Other';

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await calculate(formToInput(form));
      setResult(res);
      // scroll to results
      setTimeout(() => document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Calculation failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setResult(null); setError(null); };

  const handleDownloadPDF = async () => {
    if (!result) return;
    setPdfLoading(true);
    setError(null);
    try {
      const { downloadSavingsPlan } = await import('@/components/SavingsPlanPDF');
      await downloadSavingsPlan(result, formToInput(form));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[PDF] generation failed:', e);
      setError(`PDF generation failed: ${msg}. Open browser console for details.`);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>

      {/* NAVBAR */}
      <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge label="FY 2025-26" />
            <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>IT Act 2025 · Budget 2026: no slab changes</span>
            {result && (
              <button onClick={handleReset} style={{ marginLeft: 8, fontSize: 12, color: 'var(--brand)', background: 'transparent', border: '1px solid var(--brand)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}>
                ← Edit inputs
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: 'var(--brand)', padding: '32px 24px 36px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <h1 style={{ margin: 0, color: '#fff', fontSize: 'clamp(24px, 3vw, 40px)', fontWeight: 700, letterSpacing: -0.8, lineHeight: 1.15 }}>
            {result ? 'Your Tax Verdict' : 'Old vs New regime — which one saves you more?'}
          </h1>
          <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.72)', fontSize: 14, maxWidth: 500, lineHeight: 1.65 }}>
            {result ? 'Based on your inputs for FY 2025-26 (AY 2026-27)' : 'Fill in your salary details and click Calculate to see your personalised verdict.'}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 24px 80px' }}>
        {!result ? (
          /* ═══ FORM ════════════════════════════════════════════════════ */
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,360px)', gap: 28, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

              {/* STEP 1 */}
              <StepCard step={1} title="About you" sub="Age affects old-regime slabs · city affects HRA exemption rate">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <Label>Age group</Label>
                    <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                      {([
                        { v: 'below60', label: 'Below 60',  sub: 'Standard' },
                        { v: '60to80',  label: '60 – 80',   sub: 'Senior' },
                        { v: 'above80', label: '80+',        sub: 'Super senior' },
                      ] as const).map(o => (
                        <AgeBtn key={o.v} label={o.label} sub={o.sub} active={form.age === o.v} onClick={() => upd('age', o.v)} />
                      ))}
                    </div>
                    {form.age !== 'below60' && (
                      <Callout icon="ℹ️" style={{ marginTop: 8 }}>
                        {form.age === '60to80'
                          ? 'Old regime: 0% up to ₹3L · 80D limit ₹50K · 80TTB ₹50K (savings+FD interest)'
                          : 'Old regime: 0% up to ₹5L · no 87A rebate · 80D ₹50K · 80TTB ₹50K'}
                      </Callout>
                    )}
                  </div>
                  <div>
                    <Label>City <span style={{ fontSize: 10, color: 'var(--ink-soft)', fontWeight: 400 }}>— affects HRA %</span></Label>
                    <select value={form.city} onChange={e => upd('city', e.target.value as MetroCity)}
                      style={{ marginTop: 6, width: '100%', height: 42, borderRadius: 9, padding: '0 12px', border: '1.5px solid var(--line-strong)', background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'inherit', fontSize: 14, outline: 'none', cursor: 'pointer' }}>
                      <optgroup label="Metro cities — 50% HRA (IT Act 2025)">
                        {METRO_CITIES.filter(c => c !== 'Other').map(c => <option key={c} value={c}>{c}</option>)}
                      </optgroup>
                      <optgroup label="Other — 40% HRA">
                        <option value="Other">Other city</option>
                      </optgroup>
                    </select>
                    <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4 }}>
                      {isMetro ? `✓ ${form.city}: HRA exemption = 50% of basic` : 'Non-metro: HRA exemption = 40% of basic'}
                    </div>
                  </div>
                </div>
              </StepCard>

              {/* STEP 2 */}
              <StepCard step={2} title="Your income" sub="Gross annual CTC — basic, HRA & PF auto-fill if blank">
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
                    <FieldWrap label="PF contribution" hint="Auto: 12% of basic">
                      <Inp value={form.pf} onChange={v => upd('pf', v)} placeholder={basic ? String(Math.round(basic * 0.12)) : '86,400'} />
                    </FieldWrap>
                    <FieldWrap label="Other income" hint="FD interest, capital gains…">
                      <Inp value={form.otherIncome} onChange={v => upd('otherIncome', v)} placeholder="0" />
                    </FieldWrap>
                  </TwoCol>
                  <Callout icon="💡">PF auto-counted in 80C. Standard deduction ₹75,000 applied in both regimes.</Callout>
                </div>
              </StepCard>

              {/* STEP 3 — HRA (conditional) */}
              {hasGross && (
                <StepCard step={3} title="Rent & HRA" sub="Skip if you own your home">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <FieldWrap label="Annual rent paid" hint="Actual rent paid to landlord">
                      <Inp value={form.rentPaid} onChange={v => upd('rentPaid', v)} placeholder="0" />
                    </FieldWrap>
                    {n(form.rentPaid) === 0 && hra > 0 && (
                      <Callout icon="⚠️" warn>
                        You have HRA of {fmtINR(hra)} in your CTC. Enter rent paid to unlock HRA exemption.
                      </Callout>
                    )}
                  </div>
                </StepCard>
              )}

              {/* STEP 4 — Deductions */}
              <StepCard step={hasGross ? 4 : 3} title="Deductions" sub="Only apply in Old regime — new section numbers shown for IT Act 2025">
                <Callout icon="ℹ️" style={{ marginBottom: 12 }}>Old regime only. New regime ignores all deductions except ₹75K standard.</Callout>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <TwoCol>
                    <FieldWrap label="80C / §123 — Investments" hint="ELSS/PPF/LIC · Max ₹1.5L (PF auto-added)">
                      <Inp value={form.sec80C} onChange={v => upd('sec80C', v)} placeholder="0" max={150000} />
                    </FieldWrap>
                    <FieldWrap label={`80D / §126 — Health (self)`} hint={`Max ₹${form.age === 'below60' ? '25K' : '50K'}`}>
                      <Inp value={form.sec80D} onChange={v => upd('sec80D', v)} placeholder="0" max={form.age === 'below60' ? 25000 : 50000} />
                    </FieldWrap>
                  </TwoCol>
                  <TwoCol>
                    <FieldWrap label="80D (parents)" hint={`Max ₹${form.age !== 'below60' ? '50K' : '25K'} (₹50K if parents 60+)`}>
                      <Inp value={form.sec80D_parents} onChange={v => upd('sec80D_parents', v)} placeholder="0" max={form.age !== 'below60' ? 50000 : 25000} />
                    </FieldWrap>
                    <FieldWrap label="80CCD(1B) / §124 — NPS" hint="Extra ₹50K over 80C">
                      <Inp value={form.sec80CCD1B} onChange={v => upd('sec80CCD1B', v)} placeholder="0" max={50000} />
                    </FieldWrap>
                  </TwoCol>
                  <TwoCol>
                    <FieldWrap label="24(b) / §72 — Home loan interest" hint="Self-occupied · Max ₹2L">
                      <Inp value={form.homeLoanInterest} onChange={v => upd('homeLoanInterest', v)} placeholder="0" max={200000} />
                    </FieldWrap>
                    {form.age === 'below60'
                      ? <FieldWrap label="80TTA / §128 — Savings interest" hint="Bank savings · Max ₹10K">
                          <Inp value={form.sec80TTA} onChange={v => upd('sec80TTA', v)} placeholder="0" max={10000} />
                        </FieldWrap>
                      : <FieldWrap label="80TTB / §128 — Savings+FD interest" hint="Senior · Max ₹50K">
                          <Inp value={form.sec80TTB} onChange={v => upd('sec80TTB', v)} placeholder="0" max={50000} />
                        </FieldWrap>
                    }
                  </TwoCol>
                  <FieldWrap label="80E / §129 — Education loan interest" hint="No cap · Max 8 years">
                    <Inp value={form.sec80E} onChange={v => upd('sec80E', v)} placeholder="0" />
                  </FieldWrap>
                </div>
              </StepCard>

              {error && (
                <div style={{ padding: '12px 16px', background: 'var(--danger-soft)', borderRadius: 10, color: 'var(--danger)', fontSize: 13, border: '1px solid var(--danger)' }}>
                  ⚠️ {error}
                </div>
              )}

              {/* CALCULATE BUTTON */}
              <button
                onClick={handleCalculate}
                disabled={!hasGross || loading}
                style={{ height: 56, borderRadius: 14, background: hasGross && !loading ? 'var(--brand)' : 'var(--surface-alt)', color: hasGross && !loading ? '#fff' : 'var(--ink-soft)', border: 0, fontSize: 16, fontWeight: 700, letterSpacing: -0.3, cursor: hasGross && !loading ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all .2s', boxShadow: hasGross && !loading ? '0 4px 20px rgba(11,110,79,0.3)' : 'none', fontFamily: 'inherit' }}>
                {loading ? (
                  <><Spinner /> Calculating...</>
                ) : (
                  <>{!hasGross ? 'Enter gross salary first' : '→ Calculate my tax verdict'}</>
                )}
              </button>
              <p style={{ fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.7, padding: '0 2px', margin: '4px 0 0', textAlign: 'center' }}>
                Slabs: FY 2025-26 · Budget 2026: no changes · Surcharge + marginal relief included
              </p>
            </div>

            {/* Right column — preview hints */}
            <div style={{ position: 'sticky', top: 68 }}>
              <div style={{ padding: 24, background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--line)', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
                <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>Your verdict appears here</div>
                <div style={{ fontSize: 12, color: 'var(--ink-mid)', marginTop: 6, lineHeight: 1.7 }}>
                  Fill in your salary above, then click{' '}
                  <strong style={{ color: 'var(--brand)' }}>Calculate</strong> to see:
                </div>
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
                  {['✓ Best regime for your income', '✓ Annual + monthly tax savings', '✓ Full deduction breakdown', '✓ Surcharge + marginal relief', '✓ Action items to save more', '✓ Downloadable PDF savings plan'].map((item, i) => (
                    <div key={i} style={{ fontSize: 13, color: 'var(--ink-mid)', padding: '8px 12px', background: 'var(--surface-alt)', borderRadius: 8 }}>{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ═══ RESULTS ═════════════════════════════════════════════════ */
          <div id="results-section" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {result.zeroTax ? (
              /* ── ZERO TAX ── */
              <ZeroTaxCard gross={n(form.gross)} taxable={result.new.taxable} />
            ) : (
              /* ── FULL RESULTS ── */
              <>
                <WinnerCard result={result} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <RegimeTable result={result} />
                  <BreakdownCard result={result} />
                </div>
                <SlabBar result={result} age={form.age} />
                <SavingsPanel result={result} />
              </>
            )}

            {/* PDF BUTTON */}
            <div style={{ marginTop: 8, padding: '20px 24px', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.3 }}>Generate Savings Plan PDF</div>
                <div style={{ fontSize: 12, color: 'var(--ink-mid)', marginTop: 3, lineHeight: 1.5 }}>
                  Personalised report with your tax breakdown, best regime verdict, and ranked action items to maximise savings.
                </div>
              </div>
              <button onClick={handleDownloadPDF} disabled={pdfLoading}
                style={{ flexShrink: 0, height: 48, padding: '0 24px', borderRadius: 12, background: pdfLoading ? 'var(--surface-alt)' : 'var(--brand)', color: pdfLoading ? 'var(--ink-soft)' : '#fff', border: 0, fontSize: 14, fontWeight: 700, cursor: pdfLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', boxShadow: pdfLoading ? 'none' : '0 4px 14px rgba(11,110,79,0.3)' }}>
                {pdfLoading ? <><Spinner />Generating…</> : <>📄 Download PDF</>}
              </button>
            </div>

            {error && (
              <div style={{ padding: '12px 16px', background: 'var(--danger-soft)', borderRadius: 10, color: 'var(--danger)', fontSize: 13, border: '1px solid var(--danger)' }}>
                ⚠️ {error}
              </div>
            )}

            <button onClick={handleReset}
              style={{ height: 44, borderRadius: 10, background: 'transparent', border: '1px solid var(--line)', color: 'var(--ink-mid)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              ← Recalculate with different inputs
            </button>
          </div>
        )}
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

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </svg>
  );
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
  return <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{children}</div>;
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
    <button onClick={onClick} style={{ flex: 1, appearance: 'none', cursor: 'pointer', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${active ? 'var(--brand)' : 'var(--line)'}`, background: active ? 'var(--brand-soft)' : 'var(--surface)', textAlign: 'left', transition: 'all .15s', fontFamily: 'inherit' }}>
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
      <span style={{ flexShrink: 0 }}>{icon}</span><span>{children}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Zero-tax screen
// ─────────────────────────────────────────────────────────────────────────────

function ZeroTaxCard({ gross, taxable }: { gross: number; taxable: number }) {
  return (
    <div style={{ padding: '40px 32px', background: 'var(--surface)', borderRadius: 20, border: '2px solid var(--brand)', textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.6, color: 'var(--brand)' }}>You owe zero tax!</div>
      <div style={{ fontSize: 15, color: 'var(--ink-mid)', marginTop: 8, lineHeight: 1.7, maxWidth: 480, margin: '12px auto 0' }}>
        Your taxable income is{' '}
        <strong style={{ color: 'var(--ink)' }}>{fmtINR(taxable)}</strong> — below the ₹12 lakh threshold.
        The 87A rebate under the <strong>New Regime</strong> wipes your entire tax liability.
      </div>
      <div style={{ marginTop: 24, padding: '16px 20px', background: 'var(--brand-soft)', borderRadius: 14, textAlign: 'left', maxWidth: 480, margin: '24px auto 0' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-ink)', marginBottom: 8 }}>What to do:</div>
        {[
          'Stay on New regime — no deductions needed, you pay ₹0 either way',
          'Use NPS/PPF to grow wealth tax-free even if you don\'t need the deduction now',
          'File your ITR by 31 July 2026 to document your tax-free status',
          'If your income grows past ₹12L, revisit Old vs New with our calculator',
        ].map((tip, i) => (
          <div key={i} style={{ fontSize: 12, color: 'var(--brand-ink)', marginBottom: 6, display: 'flex', gap: 8 }}>
            <span>✓</span><span>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Results components
// ─────────────────────────────────────────────────────────────────────────────

function WinnerCard({ result }: { result: CalculateResult }) {
  const { winner, savings, monthlyDelta, old: oldR, new: newR } = result;
  const label  = winner === 'new' ? 'New Regime' : 'Old Regime';
  const reason = winner === 'new'
    ? 'Lower flat slabs outweigh your deductions at this income level.'
    : 'Your deductions (HRA, 80C, etc.) reduce taxable income enough to beat the new slabs.';
  const winnerData = winner === 'old' ? oldR : newR;

  return (
    <div style={{ borderRadius: 18, padding: '22px 24px', background: 'linear-gradient(145deg,#0B6E4F,#063D2C)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,rgba(212,255,79,.2) 0%,transparent 65%)', top: -70, right: -40, pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,.55)' }}>Recommended for you</div>
        <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.8, marginTop: 2, lineHeight: 1.1 }}>✓ {label}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', marginTop: 5, lineHeight: 1.55 }}>{reason}</div>
        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr', gap: 14, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>Save vs other</div>
            <div style={{ fontFamily: 'Geist Mono,monospace', fontSize: 24, fontWeight: 700, color: '#D4FF4F', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(savings)}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>per year</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.12)', height: 36 }} />
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>Extra/month</div>
            <div style={{ fontFamily: 'Geist Mono,monospace', fontSize: 24, fontWeight: 700, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(monthlyDelta)}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>in hand</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.12)', height: 36 }} />
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>Tax payable</div>
            <div style={{ fontFamily: 'Geist Mono,monospace', fontSize: 24, fontWeight: 700, color: '#fff', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(winnerData.tax)}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>this year</div>
          </div>
        </div>
        {(winnerData.marginalRelief > 0) && (
          <div style={{ marginTop: 10, padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,.1)', fontSize: 11, color: 'rgba(255,255,255,.8)' }}>
            💡 Marginal relief applied — extra tax capped to extra income above threshold
          </div>
        )}
        {winnerData.surcharge.rate > 0 && (
          <div style={{ marginTop: 6, padding: '7px 10px', borderRadius: 8, background: 'rgba(212,255,79,.1)', fontSize: 11, color: 'rgba(255,255,255,.8)' }}>
            ⚠️ Surcharge at {Math.round(winnerData.surcharge.rate * 100)}% — income exceeds ₹50L
          </div>
        )}
      </div>
    </div>
  );
}

function RegimeTable({ result }: { result: CalculateResult }) {
  const { winner, old: oldR, new: newR } = result;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {([
        { key: 'old' as const, label: 'Old regime', sub: 'Deductions allowed',  res: oldR },
        { key: 'new' as const, label: 'New regime', sub: 'Lower flat slabs',     res: newR },
      ]).map(({ key, label, sub, res }) => {
        const win = key === winner;
        return (
          <div key={key} style={{ borderRadius: 13, padding: '14px 16px', position: 'relative', background: win ? 'var(--brand-soft)' : 'var(--surface)', border: `1.5px solid ${win ? 'var(--brand)' : 'var(--line)'}` }}>
            {win && <div style={{ position: 'absolute', top: -8, right: 10, background: 'var(--brand)', color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 5 }}>✓ BEST</div>}
            <div style={{ fontSize: 12, fontWeight: 700, color: win ? 'var(--brand-ink)' : 'var(--ink)' }}>{label}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 1 }}>{sub}</div>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Annual tax</div>
              <div style={{ fontFamily: 'Geist Mono,monospace', fontSize: 20, fontWeight: 700, letterSpacing: -0.4, color: win ? 'var(--brand-ink)' : 'var(--ink)', fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>{fmtINR(res.tax)}</div>
            </div>
            {res.surcharge.rate > 0 && <div style={{ marginTop: 4, fontSize: 10, color: 'var(--warn)' }}>+ {Math.round(res.surcharge.rate * 100)}% surcharge</div>}
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${win ? 'rgba(11,110,79,.2)' : 'var(--line)'}`, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, color: 'var(--ink-soft)' }}>In-hand / month</span>
              <span style={{ fontFamily: 'Geist Mono,monospace', fontSize: 12, fontWeight: 600, color: win ? 'var(--brand)' : 'var(--ink-mid)', fontVariantNumeric: 'tabular-nums' }}>{fmtINR(res.monthlyInHand)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BreakdownCard({ result }: { result: CalculateResult }) {
  const { winner, old: oldR, new: newR } = result;
  const res = winner === 'old' ? oldR : newR;
  const d   = res.deductionsUsed;

  type R = { label: string; value: number; sub?: string; accent?: boolean; bold?: boolean; red?: boolean };
  const rows: R[] = [
    { label: 'Gross income',   value: res.taxable + d.standardDed + (winner === 'old' ? d.hraExempt + d.sec80C + d.sec80D + d.sec80CCD1B + d.homeLoanInterest + d.sec80TTA_TTB + d.professional : 0) },
    { label: 'Standard deduction', value: -d.standardDed, accent: true },
    ...(winner === 'old' && d.hraExempt > 0       ? [{ label: 'HRA exemption §18',     value: -d.hraExempt, accent: true }] : []),
    ...(winner === 'old' && d.sec80C > 0           ? [{ label: '80C §123',              value: -d.sec80C, accent: true }] : []),
    ...(winner === 'old' && d.sec80D > 0           ? [{ label: '80D §126',              value: -d.sec80D, accent: true }] : []),
    ...(winner === 'old' && d.sec80CCD1B > 0       ? [{ label: '80CCD(1B) §124',        value: -d.sec80CCD1B, accent: true }] : []),
    ...(winner === 'old' && d.homeLoanInterest > 0 ? [{ label: '24(b) §72',             value: -d.homeLoanInterest, accent: true }] : []),
    ...(winner === 'old' && d.sec80TTA_TTB > 0     ? [{ label: '80TTA/TTB §128',        value: -d.sec80TTA_TTB, accent: true }] : []),
    { label: 'Taxable income', value: res.taxable, bold: true },
    ...(res.rebate > 0           ? [{ label: '87A rebate §191', value: -res.rebate, accent: true }] : []),
    ...(res.marginalRelief > 0   ? [{ label: 'Marginal relief',  value: -res.marginalRelief, accent: true }] : []),
    ...(res.surcharge.amount > 0 ? [{ label: `Surcharge ${Math.round(res.surcharge.rate * 100)}%`, value: res.surcharge.amount }] : []),
    { label: 'Tax + 4% cess', value: res.tax, red: true, bold: true },
  ];

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 13, border: '1px solid var(--line)', overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px 8px', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
        {winner === 'old' ? 'Old' : 'New'} regime — full calculation
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '7px 14px', borderTop: '1px solid var(--line)' }}>
          <div style={{ fontSize: 12, fontWeight: r.bold ? 700 : 400, color: r.red ? 'var(--danger)' : 'var(--ink)' }}>{r.label}</div>
          <div style={{ fontFamily: 'Geist Mono,monospace', fontSize: r.bold ? 13 : 12, fontWeight: r.bold ? 700 : 400, color: r.accent ? 'var(--brand)' : r.red ? 'var(--danger)' : 'var(--ink)', fontVariantNumeric: 'tabular-nums', marginLeft: 12, whiteSpace: 'nowrap' }}>
            {r.value < 0 ? '−' : ''}{fmtINR(Math.abs(r.value))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SlabBar({ result, age }: { result: CalculateResult; age: AgeGroup }) {
  const [hover, setHover] = useState<number | null>(null);
  const { winner, old: oldR, new: newR } = result;
  const slices = (winner === 'old' ? oldR : newR).slices.filter(s => s.amount > 0);
  const taxable = (winner === 'old' ? oldR : newR).taxable;

  if (taxable <= 0 || slices.length === 0) return null;

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 13, border: '1px solid var(--line)', padding: '14px 16px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 10 }}>
        Income by tax band — {winner} regime
      </div>
      <div style={{ height: 32, borderRadius: 7, overflow: 'hidden', display: 'flex', background: 'var(--surface-alt)' }}>
        {slices.map((s, i) => {
          const pct = (s.amount / taxable) * 100;
          const col = SLAB_COLORS[Math.min(SLAB_COLORS.length - 1, i)];
          return (
            <div key={i}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              onClick={() => setHover(hover === i ? null : i)}
              style={{ width: `${pct}%`, background: col, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: i < slices.length - 1 ? '1px solid rgba(255,255,255,.25)' : undefined, filter: hover != null && hover !== i ? 'saturate(.3)' : undefined, transition: 'filter .1s' }}>
              {pct > 10 && <span style={{ fontFamily: 'Geist Mono,monospace', fontSize: 9, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.3)' }}>{Math.round(s.rate * 100)}%</span>}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 8, minHeight: 20, fontSize: 11 }}>
        {hover != null && slices[hover]
          ? <span><strong>{slices[hover].label}</strong> · {fmtINRShort(slices[hover].amount)} here · tax: <strong style={{ color: slices[hover].rate === 0 ? 'var(--brand)' : 'var(--ink)' }}>{slices[hover].rate === 0 ? '₹0 free' : fmtINR(slices[hover].tax)}</strong></span>
          : <span style={{ color: 'var(--ink-soft)' }}>Hover a band to inspect</span>}
      </div>
    </div>
  );
}

function SavingsPanel({ result }: { result: CalculateResult }) {
  const { recommendations, gaps, totalGapSaving, winner } = result;

  if (recommendations.length === 0 && gaps.length === 0) {
    return (
      <div style={{ padding: '16px 18px', background: 'var(--brand-soft)', borderRadius: 13, border: '1px solid rgba(11,110,79,.15)', fontSize: 13, color: 'var(--brand-ink)', lineHeight: 1.6 }}>
        ✅ <strong>Well optimised.</strong> Deductions maxed. Keep NPS contributions going.
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 13, border: '1px solid var(--line)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid var(--line)', background: totalGapSaving > 0 ? '#FFFBEA' : 'var(--surface)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#B7791F' }}>💡 How to save more</div>
        {totalGapSaving > 0 && winner === 'old' && (
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginTop: 3, letterSpacing: -0.4 }}>
            Up to <span style={{ color: 'var(--brand)' }}>{fmtINR(totalGapSaving)}</span> more within reach
          </div>
        )}
      </div>

      {recommendations.map((r, i) => (
        <div key={i} style={{ padding: '12px 16px', borderTop: i === 0 ? undefined : '1px solid var(--line)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 40 }}>
            <div style={{ width: 32, height: 32, borderRadius: 7, background: r.priority === 'high' ? 'var(--brand)' : 'var(--brand-soft)', color: r.priority === 'high' ? '#fff' : 'var(--brand)', display: 'grid', placeItems: 'center', margin: '0 auto', fontSize: 9, fontWeight: 800, fontFamily: 'Geist Mono,monospace' }}>{r.code.slice(0,5)}</div>
            {r.newCode && <div style={{ fontSize: 8, color: 'var(--ink-soft)', marginTop: 2 }}>§{r.newCode}</div>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.2 }}>{r.title}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-mid)', marginTop: 2, lineHeight: 1.5 }}>{r.action}</div>
            {r.deadline && <div style={{ fontSize: 10, color: 'var(--warn)', marginTop: 3, fontWeight: 700 }}>⏰ Deadline: {r.deadline}</div>}
          </div>
          {r.potentialSaving > 0 && (
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: 'var(--ink-soft)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>Save</div>
              <div style={{ fontFamily: 'Geist Mono,monospace', fontSize: 14, fontWeight: 700, color: 'var(--brand)', fontVariantNumeric: 'tabular-nums' }}>+{fmtINR(r.potentialSaving)}</div>
            </div>
          )}
        </div>
      ))}

      {winner === 'old' && gaps.length > 0 && (
        <div style={{ borderTop: '1px solid var(--line)' }}>
          <div style={{ padding: '10px 16px 6px', fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink-soft)' }}>Deduction headroom</div>
          {gaps.map(g => {
            const pct = Math.min(100, Math.round((g.used / g.maxLimit) * 100));
            return (
              <div key={g.code} style={{ padding: '9px 16px', borderTop: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'Geist Mono,monospace', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'var(--surface-alt)', color: 'var(--ink-mid)' }}>{g.code}</span>
                    {g.newCode && <span style={{ fontSize: 9, color: 'var(--ink-soft)' }}>§{g.newCode}</span>}
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
          <div style={{ borderTop: '1px solid var(--line)', padding: '9px 16px', background: 'var(--brand-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-ink)' }}>Total extra savings available</span>
            <span style={{ fontFamily: 'Geist Mono,monospace', fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>{fmtINR(totalGapSaving)}</span>
          </div>
        </div>
      )}

      {winner === 'new' && (
        <div style={{ borderTop: '1px solid var(--line)', padding: '10px 16px', background: 'var(--surface-alt)', fontSize: 11, color: 'var(--ink-mid)', lineHeight: 1.6 }}>
          💡 If you max out deductions in Old regime, you might save more. Fill in 80C/HRA/NPS above and recalculate.
        </div>
      )}
    </div>
  );
}
