'use client';
import React, { useState } from 'react';
import type { Theme } from '@/lib/theme';
import { PrimaryButton, BackButton } from '@/components/ui/Buttons';
import { Icons } from '@/components/ui/Icons';
import { fmtINRShort } from '@/lib/formatters';

interface ManualEntryScreenProps {
  t: Theme;
  onContinue: () => void;
  onBack: () => void;
}

interface FormData {
  grossSalary: string;
  basicSalary: string;
  hraReceived: string;
  rentPaid: string;
  metro: boolean;
  sec80C: string;
  sec80D: string;
  sec80CCD: string;
  homeLoanInt: string;
  interestIncome: string;
  capitalGains: string;
  tdsDeducted: string;
  advanceTax: string;
}

export function ManualEntryScreen({ t, onContinue, onBack }: ManualEntryScreenProps) {
  const [open, setOpen] = useState<string | null>('salary');
  const [data, setData] = useState<FormData>({
    grossSalary: '', basicSalary: '', hraReceived: '', rentPaid: '', metro: true,
    sec80C: '', sec80D: '', sec80CCD: '', homeLoanInt: '',
    interestIncome: '', capitalGains: '',
    tdsDeducted: '', advanceTax: '',
  });

  const set = (k: keyof FormData, v: string | boolean) =>
    setData((d) => ({ ...d, [k]: v }));
  const num = (k: keyof FormData) => Number(data[k]) || 0;

  const salaryDone = num('grossSalary') > 0;
  const deductionsDone = num('sec80C') > 0 || num('sec80D') > 0 || num('homeLoanInt') > 0 || num('sec80CCD') > 0;
  const otherDone = data.interestIncome !== '' || data.capitalGains !== '';
  const taxesDone = num('tdsDeducted') > 0 || num('advanceTax') > 0;

  const progress = [salaryDone, deductionsDone, otherDone, taxesDone].filter(Boolean).length;
  const totalDeductions = num('sec80C') + num('sec80D') + num('sec80CCD') + num('homeLoanInt');
  const totalIncome = num('grossSalary') + num('interestIncome') + num('capitalGains');

  return (
    <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '60px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton onClick={onBack} t={t}/>
        <div style={{ fontSize: 13, color: t.inkMid, fontWeight: 500 }}>Manual entry</div>
        <div style={{ width: 40 }}/>
      </div>

      <div style={{ padding: '8px 24px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.brand, letterSpacing: 1, textTransform: 'uppercase' }}>No Form 16? No worries</div>
        <div style={{ marginTop: 8, fontSize: 30, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1.1, color: t.ink }}>Enter the bits you know.</div>
        <div style={{ marginTop: 10, fontSize: 15, color: t.inkMid, lineHeight: 1.5 }}>Skip anything you don&apos;t remember — we&apos;ll still figure out the best regime for you.</div>
      </div>

      {/* Running summary */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ background: t.brandSoft, borderRadius: 16, padding: 14, display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: t.brand }}>Running totals</div>
            <div style={{ display: 'flex', gap: 16, marginTop: 6, fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, color: t.brandInk }}>
              <span>Income: <b>{totalIncome ? fmtINRShort(totalIncome) : '—'}</b></span>
              <span>Deductions: <b>{totalDeductions ? fmtINRShort(totalDeductions) : '—'}</b></span>
            </div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: t.brand, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 12, fontWeight: 700 }}>{progress}/4</div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' }}>
        <Section t={t} id="salary" open={open === 'salary'} setOpen={setOpen} title="Salary income" complete={salaryDone} chip={salaryDone ? fmtINRShort(num('grossSalary')) : 'Required'}>
          <SmallField t={t} label="Gross annual salary" value={data.grossSalary} onChange={(v) => set('grossSalary', v)} placeholder="18,00,000" prefix="₹"/>
          <SmallField t={t} label="Basic salary" value={data.basicSalary} onChange={(v) => set('basicSalary', v)} placeholder="7,20,000" prefix="₹" hint="Usually 40% of gross"/>
          <SmallField t={t} label="HRA received" value={data.hraReceived} onChange={(v) => set('hraReceived', v)} placeholder="3,60,000" prefix="₹"/>
          <SmallField t={t} label="Rent paid (annual)" value={data.rentPaid} onChange={(v) => set('rentPaid', v)} placeholder="2,64,000" prefix="₹"/>
          <Toggle t={t} label="Living in metro city" sub="Mumbai · Delhi · Kolkata · Chennai" value={data.metro} onChange={(v) => set('metro', v)}/>
        </Section>

        <Section t={t} id="deductions" open={open === 'deductions'} setOpen={setOpen} title="Deductions (Old regime)" complete={deductionsDone} chip={deductionsDone ? fmtINRShort(totalDeductions) : 'Optional'}>
          <SmallField t={t} label="80C — PF, ELSS, LIC, PPF" value={data.sec80C} onChange={(v) => set('sec80C', v)} placeholder="1,50,000" prefix="₹" hint="Max ₹1.5L"/>
          <SmallField t={t} label="80D — Health insurance" value={data.sec80D} onChange={(v) => set('sec80D', v)} placeholder="25,000" prefix="₹" hint="Max ₹25K"/>
          <SmallField t={t} label="80CCD(1B) — NPS extra" value={data.sec80CCD} onChange={(v) => set('sec80CCD', v)} placeholder="50,000" prefix="₹" hint="Max ₹50K"/>
          <SmallField t={t} label="Home loan interest (24b)" value={data.homeLoanInt} onChange={(v) => set('homeLoanInt', v)} placeholder="0" prefix="₹" hint="Max ₹2L"/>
        </Section>

        <Section t={t} id="other" open={open === 'other'} setOpen={setOpen} title="Other income" complete={otherDone} chip="Optional">
          <SmallField t={t} label="Savings/FD interest" value={data.interestIncome} onChange={(v) => set('interestIncome', v)} placeholder="12,000" prefix="₹"/>
          <SmallField t={t} label="Capital gains (stocks/MF)" value={data.capitalGains} onChange={(v) => set('capitalGains', v)} placeholder="0" prefix="₹"/>
        </Section>

        <Section t={t} id="taxes" open={open === 'taxes'} setOpen={setOpen} title="Taxes already paid" complete={taxesDone} chip={taxesDone ? fmtINRShort(num('tdsDeducted') + num('advanceTax')) : 'Optional'}>
          <SmallField t={t} label="TDS deducted by employer" value={data.tdsDeducted} onChange={(v) => set('tdsDeducted', v)} placeholder="1,87,200" prefix="₹"/>
          <SmallField t={t} label="Advance tax paid" value={data.advanceTax} onChange={(v) => set('advanceTax', v)} placeholder="0" prefix="₹"/>
        </Section>

        <div style={{ margin: '8px 4px 12px', padding: 14, borderRadius: 14, background: t.surface, border: `1px dashed ${t.line}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 14, background: t.brandSoft, color: t.brand, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icons.chat stroke="currentColor" style={{ width: 16, height: 16 }}/>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.ink, letterSpacing: -0.1 }}>Stuck on a number?</div>
            <div style={{ fontSize: 12, color: t.inkMid, marginTop: 3, lineHeight: 1.5 }}>Ask our CA on chat — most queries answered in under 3 minutes.</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 24px 32px', background: `linear-gradient(180deg, transparent 0%, ${t.bg} 30%)` }}>
        <PrimaryButton t={t} onClick={onContinue} disabled={!salaryDone} trailing={<Icons.arrow stroke="currentColor"/>}>
          {salaryDone ? 'Calculate my verdict' : 'Enter salary to continue'}
        </PrimaryButton>
      </div>
    </div>
  );
}

function Section({ t, id, open, setOpen, title, complete, chip, children }: {
  t: Theme; id: string; open: boolean; setOpen: (v: string | null) => void;
  title: string; complete: boolean; chip: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background: t.surface, borderRadius: 18, border: `1px solid ${complete ? t.brand : t.line}`, overflow: 'hidden' }}>
      <button onClick={() => setOpen(open ? null : id)} style={{
        appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer',
        width: '100%', padding: '16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 22, height: 22, borderRadius: 11, border: `2px solid ${complete ? t.brand : t.lineStrong}`, background: complete ? t.brand : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            {complete && <Icons.check stroke="#fff" style={{ width: 12, height: 12 }}/>}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: t.ink, letterSpacing: -0.2 }}>{title}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: complete ? t.brand : t.inkSoft }}>{chip}</div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }}>
            <path d="M6 9l6 6 6-6" stroke={t.inkSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>
      {open && (
        <div style={{ padding: '4px 16px 16px', borderTop: `1px solid ${t.line}`, display: 'flex', flexDirection: 'column', gap: 14, animation: 'taxlyFadeIn .25s ease' }}>
          <div style={{ height: 8 }}/>
          {children}
        </div>
      )}
    </div>
  );
}

function SmallField({ t, label, value, onChange, placeholder, prefix, hint }: {
  t: Theme; label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; prefix?: string; hint?: string;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <div style={{ fontSize: 12, color: t.ink, fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: t.inkSoft }}>{hint}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', height: 46, borderRadius: 12, padding: '0 14px', border: `1.5px solid ${focus ? t.brand : t.line}`, background: t.bg, transition: 'border-color .15s ease' }}>
        {prefix && <div style={{ fontSize: 16, color: t.inkMid, fontWeight: 500, marginRight: 6, fontFamily: 'var(--font-geist-mono), monospace' }}>{prefix}</div>}
        <input type="text" inputMode="numeric" value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          placeholder={placeholder}
          style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', color: t.ink, fontFamily: 'var(--font-geist-mono), monospace', fontSize: 16, fontWeight: 500, letterSpacing: 0.2 }}/>
      </div>
    </div>
  );
}

function Toggle({ t, label, sub, value, onChange }: { t: Theme; label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{ fontSize: 13, color: t.ink, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: t.inkMid, marginTop: 2 }}>{sub}</div>}
      </div>
      <button onClick={() => onChange(!value)} style={{ appearance: 'none', border: 0, cursor: 'pointer', width: 44, height: 26, borderRadius: 13, padding: 2, background: value ? t.brand : t.lineStrong, transition: 'background .15s ease', position: 'relative' }}>
        <div style={{ width: 22, height: 22, borderRadius: 11, background: '#fff', transform: value ? 'translateX(18px)' : 'translateX(0)', transition: 'transform .15s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}/>
      </button>
    </div>
  );
}
