'use client';
import React, { useState, useEffect } from 'react';
import type { Theme } from '@/lib/theme';
import { Icons } from './Icons';
import { PrimaryButton } from './Buttons';

type Phase = 'idle' | 'phone' | 'otp' | 'success';

interface SignInSheetProps {
  t: Theme;
  open: boolean;
  reason?: string | null;
  onClose: () => void;
  onSignedIn: () => void;
}

export function SignInSheet({ t, open, reason, onClose, onSignedIn }: SignInSheetProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (!open) { setPhase('idle'); setPhone(''); setOtp(''); }
  }, [open]);

  if (!open) return null;

  const finish = () => {
    setPhase('success');
    setTimeout(() => onSignedIn(), 700);
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      animation: 'taxlyFadeIn .2s ease',
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(20,28,24,0.5)', backdropFilter: 'blur(4px)',
      }}/>
      <div style={{
        position: 'relative', background: t.bg,
        borderRadius: '28px 28px 0 0',
        padding: '12px 24px 36px',
        boxShadow: '0 -16px 50px rgba(0,0,0,0.18)',
        animation: 'taxlySlideUp .3s cubic-bezier(.2,.8,.2,1)',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: t.lineStrong, margin: '6px auto 18px' }}/>

        {phase === 'idle' && (
          <div>
            <div style={{ fontSize: 11, color: t.brand, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
              {reason ? 'Save to continue' : 'Sign in'}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.6, color: t.ink, marginTop: 6, lineHeight: 1.2 }}>
              {reason || 'Welcome back to Taxly'}
            </div>
            <div style={{ fontSize: 13, color: t.inkMid, marginTop: 8, lineHeight: 1.5 }}>
              Sign in to save your numbers, sync across devices, and pick up where you left off.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
              <button onClick={finish} style={authBtnStyle(t)}>
                <GoogleIcon/>
                <span>Continue with Google</span>
              </button>
              <button onClick={finish} style={authBtnStyle(t)}>
                <AppleIcon color={t.ink}/>
                <span>Continue with Apple</span>
              </button>
              <button onClick={() => setPhase('phone')} style={authBtnStyle(t)}>
                <Icons.user stroke={t.ink} style={{ width: 18, height: 18 }}/>
                <span>Continue with mobile number</span>
              </button>
            </div>
            <button onClick={onClose} style={{
              appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer',
              width: '100%', padding: '14px 0', marginTop: 8,
              color: t.inkMid, fontSize: 13, fontWeight: 500,
            }}>Keep using as guest</button>
            <div style={{ fontSize: 11, color: t.inkSoft, textAlign: 'center', marginTop: 6, lineHeight: 1.5 }}>
              By continuing, you agree to our Terms & Privacy. We never share your data.
            </div>
          </div>
        )}

        {phase === 'phone' && (
          <div>
            <div style={{ fontSize: 11, color: t.brand, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Mobile sign in</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, color: t.ink, marginTop: 6 }}>What&apos;s your number?</div>
            <div style={{ fontSize: 13, color: t.inkMid, marginTop: 8 }}>We&apos;ll send you a 6-digit OTP.</div>
            <div style={{
              marginTop: 20, display: 'flex', alignItems: 'center', height: 52, borderRadius: 14,
              border: `1.5px solid ${t.brand}`, padding: '0 16px', gap: 8, background: t.surface,
            }}>
              <span style={{ fontSize: 16, fontWeight: 500, color: t.ink, fontFamily: 'var(--font-geist-mono), monospace' }}>+91</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                placeholder="98765 43210"
                inputMode="numeric"
                style={{
                  flex: 1, border: 0, outline: 'none', background: 'transparent',
                  fontFamily: 'var(--font-geist-mono), monospace', fontSize: 18, fontWeight: 500,
                  color: t.ink, letterSpacing: 0.5,
                }}/>
            </div>
            <PrimaryButton t={t} onClick={() => setPhase('otp')} disabled={phone.length !== 10}
              trailing={<Icons.arrow stroke="currentColor"/>} style={{ marginTop: 20 }}>
              Send OTP
            </PrimaryButton>
          </div>
        )}

        {phase === 'otp' && (
          <div>
            <div style={{ fontSize: 11, color: t.brand, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Verify OTP</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, color: t.ink, marginTop: 6 }}>Enter the 6-digit code</div>
            <div style={{ fontSize: 13, color: t.inkMid, marginTop: 8 }}>
              Sent to +91 {phone.slice(0, 5)} {phone.slice(5)}
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
              {[0,1,2,3,4,5].map(i => (
                <div key={i} style={{
                  flex: 1, height: 56, borderRadius: 12,
                  border: `1.5px solid ${otp.length === i ? t.brand : t.line}`,
                  background: t.surface,
                  display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--font-geist-mono), monospace', fontSize: 22, fontWeight: 700, color: t.ink,
                }}>{otp[i] || ''}</div>
              ))}
            </div>
            <input autoFocus value={otp}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                setOtp(v);
                if (v.length === 6) setTimeout(finish, 350);
              }}
              inputMode="numeric"
              style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }}/>
          </div>
        )}

        {phase === 'success' && (
          <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 28, background: t.brand, color: '#fff',
              display: 'grid', placeItems: 'center', animation: 'taxlyPop .4s cubic-bezier(.2,.8,.2,1)',
            }}>
              <Icons.check stroke="currentColor" style={{ width: 28, height: 28 }}/>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3, color: t.ink }}>You&apos;re in</div>
            <div style={{ fontSize: 13, color: t.inkMid }}>Your numbers are now saved & synced.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function authBtnStyle(t: Theme): React.CSSProperties {
  return {
    appearance: 'none', cursor: 'pointer', width: '100%',
    height: 52, borderRadius: 14, padding: '0 18px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
    fontFamily: 'var(--font-geist-sans), system-ui', fontSize: 15, fontWeight: 500,
    background: t.surface, border: `1px solid ${t.lineStrong}`,
    color: t.ink,
  };
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function AppleIcon({ color = '#000' }: { color?: string }) {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" fill={color}>
      <path d="M14.94 10.49c-.02-2.18 1.78-3.23 1.86-3.28-1.02-1.49-2.6-1.69-3.16-1.71-1.34-.14-2.62.79-3.31.79-.69 0-1.74-.77-2.86-.75-1.47.02-2.83.85-3.59 2.16C2.3 10.36 3.36 14.45 4.85 16.65c.74 1.08 1.61 2.28 2.74 2.24 1.1-.04 1.52-.71 2.85-.71s1.71.71 2.87.69c1.18-.02 1.93-1.09 2.66-2.18.84-1.25 1.18-2.46 1.2-2.52-.03-.01-2.31-.89-2.34-3.52zM12.78 4.16c.61-.74 1.02-1.77.91-2.79-.88.04-1.95.59-2.58 1.32-.56.65-1.06 1.7-.93 2.7.99.08 1.99-.5 2.6-1.23z"/>
    </svg>
  );
}
