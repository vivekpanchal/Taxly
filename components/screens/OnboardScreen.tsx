'use client';
import React, { useState } from 'react';
import type { Theme } from '@/lib/theme';
import { PrimaryButton, BackButton } from '@/components/ui/Buttons';
import { Icons } from '@/components/ui/Icons';

interface OnboardScreenProps {
  t: Theme;
  onContinue: () => void;
  onBack: () => void;
}

export function OnboardScreen({ t, onContinue, onBack }: OnboardScreenProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('Rohan');
  const [pan, setPan] = useState('AXLPI2741K');
  const [income, setIncome] = useState('₹15-25L');

  const next = () => {
    if (step < 2) setStep(step + 1);
    else onContinue();
  };

  return (
    <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '60px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton onClick={step === 0 ? onBack : () => setStep(step - 1)} t={t}/>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: i === step ? 24 : 8, height: 8, borderRadius: 4,
              background: i <= step ? t.brand : t.lineStrong,
              transition: 'all .25s ease',
            }}/>
          ))}
        </div>
        <div style={{ width: 40 }}/>
      </div>

      <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column' }}>
        {step === 0 && <Step0 t={t} name={name} setName={setName} pan={pan} setPan={setPan}/>}
        {step === 1 && <Step1 t={t} income={income} setIncome={setIncome}/>}
        {step === 2 && <Step2 t={t}/>}
      </div>

      <div style={{ padding: '12px 24px 32px' }}>
        <PrimaryButton t={t} onClick={next} trailing={<Icons.arrow stroke="currentColor"/>}>
          {step === 2 ? 'Upload my Form 16' : 'Continue'}
        </PrimaryButton>
      </div>
    </div>
  );
}

function StepHeader({ t, eyebrow, title, sub }: { t: Theme; eyebrow: string; title: string; sub?: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: t.brand, letterSpacing: 1, textTransform: 'uppercase' }}>{eyebrow}</div>
      <div style={{ marginTop: 8, fontSize: 30, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1.1, color: t.ink }}>{title}</div>
      {sub && <div style={{ marginTop: 10, fontSize: 15, color: t.inkMid, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}

function Field({ t, label, value, onChange, placeholder, mono, autoFocus }: {
  t: Theme; label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; mono?: boolean; autoFocus?: boolean;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 12, color: t.inkMid, fontWeight: 500 }}>{label}</div>
      <input
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder={placeholder}
        style={{
          height: 56, borderRadius: 14, padding: '0 16px',
          border: `1.5px solid ${focus ? t.brand : t.line}`,
          background: t.surface, color: t.ink,
          fontFamily: mono ? 'var(--font-geist-mono), monospace' : 'var(--font-geist-sans), system-ui',
          fontSize: 17, fontWeight: 500, letterSpacing: mono ? 1.5 : -0.2,
          textTransform: mono ? 'uppercase' : undefined,
          outline: 'none',
        }}
      />
    </div>
  );
}

function Step0({ t, name, setName, pan, setPan }: { t: Theme; name: string; setName: (v: string) => void; pan: string; setPan: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <StepHeader t={t} eyebrow="Step 1 of 3" title="Hi! Let's start with the basics."
        sub="We use your PAN to pull your tax data securely from the IT department."/>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field t={t} label="Your name" value={name} onChange={setName} autoFocus/>
        <Field t={t} label="PAN" value={pan} onChange={setPan} mono/>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-start',
          padding: 12, borderRadius: 12, background: t.brandSoft, color: t.brandInk,
          fontSize: 12, lineHeight: 1.5,
        }}>
          <Icons.shield stroke="currentColor" style={{ flexShrink: 0, marginTop: 1 }}/>
          <div>Your PAN is encrypted on-device and never sold or shared. We&apos;re an IT-authorised ERI partner.</div>
        </div>
      </div>
    </div>
  );
}

function Step1({ t, income, setIncome }: { t: Theme; income: string; setIncome: (v: string) => void }) {
  const opts = ['< ₹5L', '₹5-10L', '₹10-15L', '₹15-25L', '₹25L+'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <StepHeader t={t} eyebrow="Step 2 of 3" title="What's your annual salary range?"
        sub="Roughly is fine — we'll pull the exact numbers from your Form 16 next."/>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {opts.map((o) => {
          const active = income === o;
          return (
            <button key={o} onClick={() => setIncome(o)} style={{
              appearance: 'none', cursor: 'pointer', textAlign: 'left',
              height: 60, borderRadius: 14, padding: '0 18px',
              border: `1.5px solid ${active ? t.brand : t.line}`,
              background: active ? t.brandSoft : t.surface,
              color: t.ink, fontFamily: 'var(--font-geist-sans), system-ui',
              fontSize: 17, fontWeight: 500, letterSpacing: -0.2,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'all .15s ease',
            }}>
              <span>{o}</span>
              <div style={{
                width: 22, height: 22, borderRadius: 11,
                border: `2px solid ${active ? t.brand : t.lineStrong}`,
                background: active ? t.brand : 'transparent',
                display: 'grid', placeItems: 'center',
              }}>{active && <Icons.check stroke="#fff" style={{ width: 14, height: 14 }}/>}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Step2({ t }: { t: Theme }) {
  const opts = [
    { v: 'old', title: 'Old regime', sub: 'I claim HRA, 80C, 80D etc.' },
    { v: 'new', title: 'New regime', sub: 'Lower slabs, fewer deductions' },
    { v: 'idk', title: "I don't know — please decide", sub: 'Most popular choice', recommended: true },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <StepHeader t={t} eyebrow="Step 3 of 3" title="Old or New regime — which one are you on?"
        sub="Don't worry if you have no idea. We'll calculate both and show you which one saves more, instantly."/>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {opts.map((o) => (
          <button key={o.v} style={{
            appearance: 'none', cursor: 'pointer', textAlign: 'left',
            minHeight: 76, borderRadius: 14, padding: '14px 18px',
            border: `1.5px solid ${o.recommended ? t.brand : t.line}`,
            background: o.recommended ? t.brandSoft : t.surface,
            color: t.ink, fontFamily: 'var(--font-geist-sans), system-ui',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.2 }}>{o.title}</div>
              {o.recommended && (
                <div style={{ background: t.brand, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, letterSpacing: 0.4, textTransform: 'uppercase' }}>Best</div>
              )}
            </div>
            <div style={{ fontSize: 14, color: t.inkMid }}>{o.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
