'use client';
import React from 'react';
import type { Theme } from '@/lib/theme';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  t: Theme;
  full?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  style?: React.CSSProperties;
}

export function PrimaryButton({ children, onClick, disabled, t, full = true, leading, trailing, style }: PrimaryButtonProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        appearance: 'none', border: 0, cursor: disabled ? 'default' : 'pointer',
        width: full ? '100%' : undefined,
        height: 56, borderRadius: 16,
        background: disabled ? t.surfaceAlt : t.brand,
        color: disabled ? t.inkSoft : '#FFFFFF',
        fontFamily: 'var(--font-geist-sans), system-ui', fontSize: 16, fontWeight: 600, letterSpacing: -0.2,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'transform .15s ease, background .15s ease',
        boxShadow: disabled ? 'none' : '0 1px 0 rgba(255,255,255,0.16) inset, 0 8px 24px rgba(11,110,79,0.22)',
        ...style,
      }}
      onMouseDown={(e) => !disabled && ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)')}
      onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')}
    >
      {leading}{children}{trailing}
    </button>
  );
}

interface SecondaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  t: Theme;
  full?: boolean;
}

export function SecondaryButton({ children, onClick, t, full = true }: SecondaryButtonProps) {
  return (
    <button onClick={onClick}
      style={{
        appearance: 'none', border: `1px solid ${t.line}`, cursor: 'pointer',
        width: full ? '100%' : undefined,
        height: 56, borderRadius: 16,
        background: 'transparent', color: t.ink,
        fontFamily: 'var(--font-geist-sans), system-ui', fontSize: 16, fontWeight: 500, letterSpacing: -0.2,
      }}>
      {children}
    </button>
  );
}

interface BackButtonProps {
  onClick: () => void;
  t: Theme;
}

export function BackButton({ onClick, t }: BackButtonProps) {
  return (
    <button onClick={onClick} style={{
      width: 40, height: 40, borderRadius: 20, border: `1px solid ${t.line}`,
      background: t.surface, color: t.ink, display: 'grid', placeItems: 'center', cursor: 'pointer',
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M19 12H5m6 6l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}
