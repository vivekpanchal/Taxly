export interface Theme {
  bg: string;
  surface: string;
  surfaceAlt: string;
  line: string;
  lineStrong: string;
  ink: string;
  inkMid: string;
  inkSoft: string;
  brand: string;
  brandSoft: string;
  brandInk: string;
  accent: string;
  accentInk: string;
  danger: string;
  dangerSoft: string;
  warn: string;
  warnSoft: string;
}

export const THEME = {
  light: {
    bg: '#FAFAF7',
    surface: '#FFFFFF',
    surfaceAlt: '#F2F2EE',
    line: 'rgba(15,20,16,0.08)',
    lineStrong: 'rgba(15,20,16,0.14)',
    ink: '#0F1410',
    inkMid: 'rgba(15,20,16,0.62)',
    inkSoft: 'rgba(15,20,16,0.42)',
    brand: '#0B6E4F',
    brandSoft: '#E6F2EC',
    brandInk: '#063D2C',
    accent: '#D4FF4F',
    accentInk: '#1A2400',
    danger: '#C5341B',
    dangerSoft: '#FBE9E5',
    warn: '#B7791F',
    warnSoft: '#FBF1DD',
  } satisfies Theme,
  dark: {
    bg: '#0B100D',
    surface: '#141A16',
    surfaceAlt: '#1B2220',
    line: 'rgba(255,255,255,0.07)',
    lineStrong: 'rgba(255,255,255,0.14)',
    ink: '#F4F2EC',
    inkMid: 'rgba(244,242,236,0.66)',
    inkSoft: 'rgba(244,242,236,0.42)',
    brand: '#3FD08C',
    brandSoft: 'rgba(63,208,140,0.12)',
    brandInk: '#C7F5DD',
    accent: '#D4FF4F',
    accentInk: '#1A2400',
    danger: '#FF6B57',
    dangerSoft: 'rgba(255,107,87,0.14)',
    warn: '#E5B25E',
    warnSoft: 'rgba(229,178,94,0.14)',
  } satisfies Theme,
};
