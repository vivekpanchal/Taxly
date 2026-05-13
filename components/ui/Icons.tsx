'use client';
import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

export const Icons = {
  upload: (p: IconProps) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}><path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  doc: (p: IconProps) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  check: (p: IconProps) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  arrow: (p: IconProps) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}><path d="M5 12h14m-6-6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  back: (p: IconProps) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}><path d="M19 12H5m6 6l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  close: (p: IconProps) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  shield: (p: IconProps) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  spark: (p: IconProps) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}><path d="M12 3v4m0 10v4m9-9h-4M7 12H3m13.5-6.5l-2.8 2.8M9.3 14.7l-2.8 2.8m0-13l2.8 2.8m5.4 5.4l2.8 2.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  trend: (p: IconProps) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}><path d="M3 17l6-6 4 4 8-8m0 0v5m0-5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  cal: (p: IconProps) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M3 10h18M8 3v4m8-4v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  home: (p: IconProps) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...p}><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  chat: (p: IconProps) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...p}><path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8c-1.5 0-2.9-.4-4.1-1.1L4 20l1.1-3.9C4.4 14.9 4 13.5 4 12z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  pie: (p: IconProps) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...p}><path d="M12 3v9h9c0 5-4 9-9 9s-9-4-9-9 4-9 9-9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M14 3v7h7c0-3.9-3.1-7-7-7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  user: (p: IconProps) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  lock: (p: IconProps) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8"/></svg>,
  bolt: (p: IconProps) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill="currentColor"/></svg>,
  info: (p: IconProps) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 11v5m0-8v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  plus: (p: IconProps) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}><path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  chevronDown: (p: IconProps) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};
