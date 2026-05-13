'use client';
import React, { useState } from 'react';
import type { Theme } from '@/lib/theme';
import { PrimaryButton, BackButton } from '@/components/ui/Buttons';
import { Icons } from '@/components/ui/Icons';

type Phase = 'idle' | 'uploading' | 'parsing' | 'done';

interface UploadScreenProps {
  t: Theme;
  onContinue: () => void;
  onBack: () => void;
  onManual: () => void;
}

const PARSE_LINES = [
  'Reading PDF…',
  'Found Cohera Systems Pvt. Ltd. ✓',
  'Gross salary — ₹18,00,000 ✓',
  'TDS deducted — ₹1,87,200 ✓',
  'Section 80C — ₹92,000 ✓',
  'HRA paid — ₹3,60,000 ✓',
];

export function UploadScreen({ t, onContinue, onBack, onManual }: UploadScreenProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);

  const start = () => {
    setPhase('uploading');
    let p = 0;
    const upInt = setInterval(() => {
      p += 8 + Math.random() * 12;
      if (p >= 100) {
        p = 100;
        clearInterval(upInt);
        setProgress(100);
        setTimeout(() => {
          setPhase('parsing');
          let i = 0;
          const ln = setInterval(() => {
            i += 1;
            setVisibleLines(i);
            if (i >= PARSE_LINES.length) {
              clearInterval(ln);
              setTimeout(() => setPhase('done'), 500);
            }
          }, 380);
        }, 280);
      } else setProgress(p);
    }, 90);
  };

  return (
    <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '60px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton onClick={onBack} t={t}/>
        <div style={{ fontSize: 13, color: t.inkMid, fontWeight: 500 }}>Form 16</div>
        <button style={{ appearance: 'none', border: 0, background: 'transparent', color: t.inkMid, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Skip</button>
      </div>

      <div style={{ padding: '8px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.brand, letterSpacing: 1, textTransform: 'uppercase' }}>Almost there</div>
          <div style={{ marginTop: 8, fontSize: 30, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1.1, color: t.ink }}>Upload your Form 16.</div>
          <div style={{ marginTop: 10, fontSize: 15, color: t.inkMid, lineHeight: 1.5 }}>Auto-fills your salary, deductions and TDS. Or enter manually below.</div>
        </div>

        <div style={{ flex: 1, marginTop: 24, display: 'flex', flexDirection: 'column' }}>
          {phase === 'idle' && (
            <div onClick={start} style={{
              flex: 1, minHeight: 240, borderRadius: 22,
              border: `2px dashed ${t.lineStrong}`, background: t.surface,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 16, cursor: 'pointer', padding: 24, textAlign: 'center',
            }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: t.brandSoft, color: t.brand, display: 'grid', placeItems: 'center' }}>
                <Icons.upload stroke="currentColor" style={{ width: 28, height: 28 }}/>
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.3 }}>Tap to upload Form 16</div>
                <div style={{ marginTop: 4, fontSize: 13, color: t.inkMid }}>PDF · max 10 MB · password-protected OK</div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                {['HDFC', 'ICICI', 'SBI', 'IT Dept'].map((s) => (
                  <div key={s} style={{ fontSize: 11, padding: '6px 10px', borderRadius: 999, background: t.surfaceAlt, color: t.inkMid, fontWeight: 500 }}>{s}</div>
                ))}
              </div>
            </div>
          )}

          {phase === 'idle' && (
            <button onClick={(e) => { e.stopPropagation(); onManual(); }} style={{
              marginTop: 14, appearance: 'none', cursor: 'pointer',
              background: 'transparent', border: `1px solid ${t.line}`,
              borderRadius: 14, padding: '14px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              color: t.ink, textAlign: 'left',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: t.surfaceAlt, color: t.ink, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icons.plus stroke="currentColor"/>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>Don&apos;t have Form 16?</div>
                  <div style={{ fontSize: 12, color: t.inkMid, marginTop: 2 }}>Enter your details manually</div>
                </div>
              </div>
              <Icons.arrow stroke={t.inkMid} style={{ width: 18, height: 18 }}/>
            </button>
          )}

          {phase !== 'idle' && (
            <div style={{
              flex: 1, borderRadius: 22, background: t.surface,
              border: `1px solid ${t.line}`, padding: 20,
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 56, borderRadius: 8, background: t.dangerSoft, color: t.danger, display: 'grid', placeItems: 'center', flexShrink: 0, position: 'relative' }}>
                  <Icons.doc stroke="currentColor"/>
                  <div style={{ position: 'absolute', bottom: 4, left: 4, right: 4, fontSize: 8, fontWeight: 700, textAlign: 'center', color: t.danger, letterSpacing: 0.5 }}>PDF</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Form16_Cohera_FY2526.pdf</div>
                  <div style={{ fontSize: 12, color: t.inkMid, marginTop: 2 }}>
                    {phase === 'uploading' && `Uploading… ${Math.round(progress)}%`}
                    {phase === 'parsing' && 'Parsing with AI'}
                    {phase === 'done' && 'Parsed · 9 fields detected'}
                  </div>
                </div>
                {phase === 'done' && (
                  <div style={{ width: 28, height: 28, borderRadius: 14, background: t.brand, color: '#fff', display: 'grid', placeItems: 'center' }}>
                    <Icons.check stroke="currentColor" style={{ width: 18, height: 18 }}/>
                  </div>
                )}
              </div>

              <div style={{ height: 4, borderRadius: 2, background: t.surfaceAlt, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: phase === 'uploading' ? `${progress}%` : '100%', background: t.brand, transition: 'width .15s ease' }}/>
              </div>

              {phase !== 'uploading' && (
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'var(--font-geist-mono), monospace', fontSize: 12 }}>
                  {PARSE_LINES.slice(0, visibleLines).map((l, i) => (
                    <div key={i} style={{ color: l.includes('✓') ? t.brand : t.inkMid, animation: 'taxlyFadeIn .3s ease' }}>{l}</div>
                  ))}
                  {phase === 'parsing' && visibleLines < PARSE_LINES.length && (
                    <div style={{ color: t.inkSoft, display: 'flex', gap: 4 }}>
                      <span style={{ animation: 'taxlyBlink 1s infinite' }}>▋</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '12px 24px 32px' }}>
        <PrimaryButton t={t} disabled={phase !== 'done'} onClick={onContinue} trailing={<Icons.arrow stroke="currentColor"/>}>
          {phase === 'done' ? 'See my verdict' : 'Waiting for upload…'}
        </PrimaryButton>
      </div>
    </div>
  );
}
