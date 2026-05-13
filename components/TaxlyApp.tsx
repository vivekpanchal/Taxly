'use client';
import React, { useState, useEffect } from 'react';
import { THEME } from '@/lib/theme';
import { SplashScreen } from './screens/SplashScreen';
import { OnboardScreen } from './screens/OnboardScreen';
import { UploadScreen } from './screens/UploadScreen';
import { ManualEntryScreen } from './screens/ManualEntryScreen';
import { VerdictScreen } from './screens/VerdictScreen';
import { DeductionGapScreen } from './screens/DeductionGapScreen';
import { HomeScreen } from './screens/HomeScreen';
import { SignInSheet } from './ui/SignInSheet';

type Screen = 'splash' | 'onboard' | 'upload' | 'manual' | 'verdict' | 'gap' | 'home';
const SCREENS: Screen[] = ['splash', 'onboard', 'upload', 'manual', 'verdict', 'gap', 'home'];

export function TaxlyApp() {
  const [dark, setDark] = useState(false);
  const [screen, setScreen] = useState<Screen>('splash');
  const [signedIn, setSignedIn] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [signInReason, setSignInReason] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  const t = dark ? THEME.dark : THEME.light;

  useEffect(() => {
    const fit = () => {
      const padW = window.innerWidth - 48;
      const padH = window.innerHeight - 48;
      const s = Math.min(padW / 402, padH / 874, 1);
      setScale(s);
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const requestSignIn = (reason: string) => {
    if (signedIn) return;
    setSignInReason(reason);
    setSignInOpen(true);
  };

  const go = (s: Screen) => setScreen(s);

  let body: React.ReactNode = null;
  if (screen === 'splash') {
    body = <SplashScreen t={t} onContinue={() => go('upload')} onSignIn={() => { setSignInReason('Welcome back to Taxly'); setSignInOpen(true); }}/>;
  } else if (screen === 'onboard') {
    body = <OnboardScreen t={t} onContinue={() => go('upload')} onBack={() => go('splash')}/>;
  } else if (screen === 'upload') {
    body = <UploadScreen t={t} onContinue={() => go('verdict')} onBack={() => go('splash')} onManual={() => go('manual')}/>;
  } else if (screen === 'manual') {
    body = <ManualEntryScreen t={t} onContinue={() => go('verdict')} onBack={() => go('upload')}/>;
  } else if (screen === 'verdict') {
    body = <VerdictScreen t={t} onContinue={() => go('gap')} onBack={() => go('upload')}/>;
  } else if (screen === 'gap') {
    body = <DeductionGapScreen t={t} signedIn={signedIn} onSignIn={() => requestSignIn('Sign in to save your plan')} onContinue={() => go('home')} onBack={() => go('verdict')}/>;
  } else if (screen === 'home') {
    body = <HomeScreen t={t} signedIn={signedIn} onSignIn={() => requestSignIn('Save your savings plan')} onJumpUpload={() => go('upload')} onJumpVerdict={() => go('verdict')} onJumpGap={() => go('gap')} onJumpManual={() => go('manual')}/>;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: dark ? '#1A1F1C' : '#E8E6DF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {/* Phone frame */}
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
        <div style={{
          width: 402, height: 874,
          borderRadius: 52,
          background: t.bg,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: dark
            ? '0 0 0 1px rgba(255,255,255,0.08), 0 40px 80px rgba(0,0,0,0.6), 0 0 0 10px #1A1A1A'
            : '0 0 0 1px rgba(0,0,0,0.06), 0 40px 80px rgba(0,0,0,0.18), 0 0 0 10px #2A2A2A',
        }}>
          {/* notch */}
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 126, height: 36, background: '#0F0F0F', borderRadius: '0 0 20px 20px', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#1A1A1A', border: '1px solid #2A2A2A' }}/>
            <div style={{ width: 66, height: 8, borderRadius: 4, background: '#1A1A1A' }}/>
          </div>
          {body}
          <SignInSheet t={t} open={signInOpen} reason={signInReason} onClose={() => setSignInOpen(false)} onSignedIn={() => { setSignedIn(true); setTimeout(() => setSignInOpen(false), 400); }}/>
        </div>
      </div>

      {/* Screen nav pill */}
      <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,20,16,0.85)', color: '#fff', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: 4, borderRadius: 999, display: 'flex', gap: 2, fontFamily: 'var(--font-geist-sans), system-ui', fontSize: 11, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 200 }}>
        {SCREENS.map((s) => (
          <button key={s} onClick={() => go(s)} style={{ appearance: 'none', border: 0, cursor: 'pointer', padding: '6px 11px', borderRadius: 999, background: screen === s ? '#FFFFFF' : 'transparent', color: screen === s ? '#0F1410' : 'rgba(255,255,255,0.75)', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: screen === s ? 600 : 500, textTransform: 'capitalize' }}>{s}</button>
        ))}
      </div>

      {/* Dark mode toggle */}
      <button onClick={() => setDark(!dark)} style={{ position: 'fixed', bottom: 20, right: 20, width: 44, height: 44, borderRadius: 22, background: dark ? '#F4F2EC' : '#0F1410', color: dark ? '#0F1410' : '#F4F2EC', border: 0, cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 18, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 200 }}>
        {dark ? '☀' : '☽'}
      </button>
    </div>
  );
}
