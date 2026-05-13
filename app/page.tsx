'use client';
import dynamic from 'next/dynamic';

// Skip SSR entirely — prevents hydration mismatch on reload.
// TaxCalculator is 100% client-side (no server data needed).
const TaxCalculator = dynamic(
  () => import('@/components/TaxCalculator').then(m => m.TaxCalculator),
  { ssr: false, loading: () => <PageShell /> },
);

export default function Home() {
  return <TaxCalculator />;
}

// Skeleton that matches the nav + hero so there's no layout shift
function PageShell() {
  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F4' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(15,20,16,0.08)', height: 56 }} />
      <div style={{ background: '#0B6E4F', padding: '32px 24px 36px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ height: 44, background: 'rgba(255,255,255,0.12)', borderRadius: 8, maxWidth: 420 }} />
          <div style={{ height: 18, background: 'rgba(255,255,255,0.08)', borderRadius: 6, maxWidth: 300, marginTop: 12 }} />
        </div>
      </div>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,420px)', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[140, 280, 120, 200].map((h, i) => (
            <div key={i} style={{ height: h, background: '#fff', borderRadius: 14, border: '1px solid rgba(15,20,16,0.08)' }} />
          ))}
        </div>
        <div>
          <div style={{ height: 160, background: '#fff', borderRadius: 14, border: '1px solid rgba(15,20,16,0.08)' }} />
        </div>
      </div>
    </div>
  );
}
