'use client';
/**
 * PDF Savings Plan generator.
 * Uses @react-pdf/renderer to produce a downloadable PDF entirely in the browser.
 * The tax data comes from the backend — this component only handles layout/styling.
 */
import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, pdf,
  Font,
} from '@react-pdf/renderer';
import type { CalculateResult, CalculateInput } from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page:        { backgroundColor: '#FFFFFF', padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#0F1410' },
  header:      { backgroundColor: '#0B6E4F', borderRadius: 8, padding: '16 20', marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', fontFamily: 'Helvetica-Bold', letterSpacing: -0.5 },
  headerSub:   { fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  fy:          { fontSize: 8, color: '#D4FF4F', marginTop: 3, fontFamily: 'Helvetica-Bold' },

  section:     { marginBottom: 16 },
  sectionTitle: { fontSize: 8, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, fontFamily: 'Helvetica-Bold' },

  winnerBox:   { backgroundColor: '#E6F2EC', borderRadius: 6, padding: '12 14', marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#0B6E4F' },
  winnerLabel: { fontSize: 9, color: '#0B6E4F', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'Helvetica-Bold' },
  winnerRegime: { fontSize: 18, fontWeight: 'bold', color: '#063D2C', marginTop: 3, fontFamily: 'Helvetica-Bold' },
  winnerSaving: { fontSize: 10, color: '#0B6E4F', marginTop: 4 },

  twoCol:      { flexDirection: 'row', gap: 10, marginBottom: 12 },
  card:        { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: '10 12' },
  cardActive:  { borderColor: '#0B6E4F', backgroundColor: '#F0FAF5' },
  cardLabel:   { fontSize: 8, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Helvetica-Bold' },
  cardValue:   { fontSize: 15, fontWeight: 'bold', color: '#0F1410', marginTop: 3, fontFamily: 'Helvetica-Bold' },
  cardSub:     { fontSize: 8, color: '#6B7280', marginTop: 2 },

  row:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowLabel:    { fontSize: 9, color: '#374151', flex: 1 },
  rowValue:    { fontSize: 9, color: '#0F1410', fontFamily: 'Helvetica-Bold' },
  rowGreen:    { fontSize: 9, color: '#0B6E4F', fontFamily: 'Helvetica-Bold' },
  rowRed:      { fontSize: 9, color: '#C5341B', fontFamily: 'Helvetica-Bold' },

  recItem:     { flexDirection: 'row', gap: 10, marginBottom: 10 },
  recBadge:    { width: 28, height: 28, backgroundColor: '#E6F2EC', borderRadius: 4, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  recBadgeHigh: { backgroundColor: '#0B6E4F' },
  recCode:     { fontSize: 7, color: '#0B6E4F', fontFamily: 'Helvetica-Bold' },
  recCodeHigh: { color: '#FFFFFF' },
  recTitle:    { fontSize: 10, fontWeight: 'bold', color: '#0F1410', fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  recAction:   { fontSize: 9, color: '#6B7280', lineHeight: 1.5 },
  recSaving:   { marginLeft: 'auto', flexShrink: 0, textAlign: 'right' },
  recSavingLabel: { fontSize: 7, color: '#9CA3AF', textTransform: 'uppercase', fontFamily: 'Helvetica-Bold' },
  recSavingAmt:   { fontSize: 11, color: '#0B6E4F', fontFamily: 'Helvetica-Bold', marginTop: 1 },

  gapBar:      { height: 5, borderRadius: 2, backgroundColor: '#F3F4F6', marginTop: 4, marginBottom: 2 },
  gapFill:     { height: 5, borderRadius: 2, backgroundColor: '#F59E0B' },
  gapFillFull: { backgroundColor: '#0B6E4F' },
  gapMeta:     { flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#9CA3AF' },

  footer:      { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#9CA3AF', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8 },
  zeroTaxBox:  { backgroundColor: '#ECFDF5', borderRadius: 8, padding: '20 20', textAlign: 'center' },
  zeroTaxEmoji: { fontSize: 28, textAlign: 'center', marginBottom: 8 },
  zeroTaxTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#065F46', textAlign: 'center' },
  zeroTaxSub:  { fontSize: 9, color: '#6B7280', textAlign: 'center', marginTop: 6, lineHeight: 1.6 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function inr(n: number): string {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(Math.round(n));
  const s = abs.toString();
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3;
  return (n < 0 ? '-' : '') + '₹' + grouped;
}

function inrShort(n: number): string {
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
  if (n >= 1000)   return '₹' + (n / 1000).toFixed(0) + 'K';
  return inr(n);
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF Document
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  result: CalculateResult;
  input: CalculateInput;
  generatedAt: string;
}

export function SavingsPlanDocument({ result, input, generatedAt }: Props) {
  const { zeroTax, winner, savings, monthlyDelta, gaps, recommendations, old: oldR, new: newR } = result;
  const winnerData = winner === 'old' ? oldR : newR;
  const winnerLabel = winner === 'old' ? 'Old Regime' : 'New Regime';

  return (
    <Document title="Taxly — Tax Savings Plan" author="Taxly" subject={`FY 2025-26 Tax Savings Plan`}>
      <Page size="A4" style={S.page}>

        {/* Header */}
        <View style={S.header}>
          <Text style={S.headerTitle}>Your Tax Savings Plan</Text>
          <Text style={S.headerSub}>Personalised based on your inputs · FY 2025-26 (AY 2026-27)</Text>
          <Text style={S.fy}>IT Act 2025 · Budget 2026: no slab changes</Text>
        </View>

        {zeroTax ? (
          // Zero-tax case — simplified report
          <View style={S.zeroTaxBox}>
            <Text style={S.zeroTaxTitle}>🎉 Zero Tax — You Owe Nothing!</Text>
            <Text style={S.zeroTaxSub}>
              Your taxable income is ₹{newR.taxable.toLocaleString('en-IN')} — under the ₹12L threshold.{'\n'}
              The 87A rebate under the New Regime wipes your entire tax liability.{'\n\n'}
              Stay on the New Regime. Contribute to NPS/PPF to build wealth tax-free.{'\n'}
              File your ITR by 31 July 2026 to document this.
            </Text>
          </View>
        ) : (
          <>
            {/* Winner */}
            <View style={S.winnerBox}>
              <Text style={S.winnerLabel}>Recommended regime</Text>
              <Text style={S.winnerRegime}>✓ {winnerLabel}</Text>
              <Text style={S.winnerSaving}>
                Saves {inr(savings)}/year · Extra {inr(monthlyDelta)}/month in hand
              </Text>
            </View>

            {/* Regime comparison */}
            <View style={S.section}>
              <Text style={S.sectionTitle}>Regime Comparison</Text>
              <View style={S.twoCol}>
                <View style={winner === 'old' ? [S.card, S.cardActive] : S.card}>
                  <Text style={S.cardLabel}>{winner === 'old' ? '✓ Old Regime (Best)' : 'Old Regime'}</Text>
                  <Text style={S.cardValue}>{inr(oldR.tax)}</Text>
                  <Text style={S.cardSub}>In hand: {inr(oldR.monthlyInHand)}/mo</Text>
                  {oldR.surcharge.rate > 0 && <Text style={S.cardSub}>+ {Math.round(oldR.surcharge.rate * 100)}% surcharge</Text>}
                </View>
                <View style={winner === 'new' ? [S.card, S.cardActive] : S.card}>
                  <Text style={S.cardLabel}>{winner === 'new' ? '✓ New Regime (Best)' : 'New Regime'}</Text>
                  <Text style={S.cardValue}>{inr(newR.tax)}</Text>
                  <Text style={S.cardSub}>In hand: {inr(newR.monthlyInHand)}/mo</Text>
                  {newR.surcharge.rate > 0 && <Text style={S.cardSub}>+ {Math.round(newR.surcharge.rate * 100)}% surcharge</Text>}
                </View>
              </View>
            </View>

            {/* Tax calculation breakdown */}
            <View style={S.section}>
              <Text style={S.sectionTitle}>{winnerLabel} — Full Calculation</Text>
              {[
                { label: 'Gross income',            value: inr(winnerData.deductionsUsed.standardDed + winnerData.taxable + (winner === 'old' ? (winnerData.deductionsUsed.hraExempt + winnerData.deductionsUsed.sec80C + winnerData.deductionsUsed.sec80D + winnerData.deductionsUsed.sec80CCD1B + winnerData.deductionsUsed.homeLoanInterest + winnerData.deductionsUsed.sec80TTA_TTB + winnerData.deductionsUsed.professional) : 0)) },
                { label: 'Standard deduction (Sec 22)', value: `−${inr(winnerData.deductionsUsed.standardDed)}`, green: true },
                ...(winner === 'old' && winnerData.deductionsUsed.hraExempt > 0    ? [{ label: 'HRA exemption (Sec 18)',        value: `−${inr(winnerData.deductionsUsed.hraExempt)}`, green: true }] : []),
                ...(winner === 'old' && winnerData.deductionsUsed.sec80C > 0       ? [{ label: '80C (Sec 123)',                 value: `−${inr(winnerData.deductionsUsed.sec80C)}`, green: true }] : []),
                ...(winner === 'old' && winnerData.deductionsUsed.sec80D > 0       ? [{ label: '80D (Sec 126)',                 value: `−${inr(winnerData.deductionsUsed.sec80D)}`, green: true }] : []),
                ...(winner === 'old' && winnerData.deductionsUsed.sec80CCD1B > 0   ? [{ label: '80CCD(1B) (Sec 124)',           value: `−${inr(winnerData.deductionsUsed.sec80CCD1B)}`, green: true }] : []),
                ...(winner === 'old' && winnerData.deductionsUsed.homeLoanInterest > 0 ? [{ label: '24(b) home loan (Sec 72)',  value: `−${inr(winnerData.deductionsUsed.homeLoanInterest)}`, green: true }] : []),
                ...(winner === 'old' && winnerData.deductionsUsed.sec80TTA_TTB > 0 ? [{ label: '80TTA/TTB (Sec 128)',           value: `−${inr(winnerData.deductionsUsed.sec80TTA_TTB)}`, green: true }] : []),
                { label: 'Taxable income',           value: inr(winnerData.taxable), bold: true },
                ...(winnerData.rebate > 0            ? [{ label: '87A rebate (Sec 191)',             value: `−${inr(winnerData.rebate)}`, green: true }] : []),
                ...(winnerData.marginalRelief > 0    ? [{ label: 'Marginal relief',                  value: `−${inr(winnerData.marginalRelief)}`, green: true }] : []),
                { label: 'Tax + 4% cess',            value: inr(winnerData.tax), red: true, bold: true },
              ].map((r, i) => (
                <View key={i} style={S.row}>
                  <Text style={S.rowLabel}>{r.label}</Text>
                  <Text style={r.green ? S.rowGreen : r.red ? S.rowRed : (r.bold ? { ...S.rowValue, fontFamily: 'Helvetica-Bold' } : S.rowValue)}>{r.value}</Text>
                </View>
              ))}
            </View>

            {/* Action items */}
            {recommendations.length > 0 && (
              <View style={S.section}>
                <Text style={S.sectionTitle}>
                  Action Items — Save up to {inrShort(result.totalGapSaving)} more
                </Text>
                {recommendations.map((r, i) => (
                  <View key={i} style={S.recItem}>
                    <View style={[S.recBadge, r.priority === 'high' ? S.recBadgeHigh : {}]}>
                      <Text style={[S.recCode, r.priority === 'high' ? S.recCodeHigh : {}]}>{r.code.slice(0, 5)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={S.recTitle}>{r.title}</Text>
                      <Text style={S.recAction}>{r.action}</Text>
                      {r.deadline && <Text style={{ fontSize: 8, color: '#F59E0B', marginTop: 2, fontFamily: 'Helvetica-Bold' }}>⏰ Deadline: {r.deadline}</Text>}
                    </View>
                    {r.potentialSaving > 0 && (
                      <View style={S.recSaving}>
                        <Text style={S.recSavingLabel}>Save</Text>
                        <Text style={S.recSavingAmt}>+{inrShort(r.potentialSaving)}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Deduction gaps */}
            {gaps.length > 0 && (
              <View style={S.section}>
                <Text style={S.sectionTitle}>Unused Deduction Headroom (Old Regime)</Text>
                {gaps.map((g, i) => {
                  const pct = Math.min(100, Math.round((g.used / g.maxLimit) * 100));
                  return (
                    <View key={i} style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <Text style={{ fontSize: 8, color: '#6B7280', backgroundColor: '#F3F4F6', padding: '2 4', borderRadius: 2 }}>{g.code}</Text>
                          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0F1410' }}>{g.name}</Text>
                        </View>
                        <Text style={{ fontSize: 9, color: '#0B6E4F', fontFamily: 'Helvetica-Bold' }}>+{inrShort(g.taxSaved)}</Text>
                      </View>
                      <View style={S.gapBar}>
                        <View style={[S.gapFill, { width: `${pct}%` }, pct >= 100 ? S.gapFillFull : {}]} />
                      </View>
                      <View style={S.gapMeta}>
                        <Text>Used {inr(g.used)}</Text>
                        <Text>Max {inr(g.maxLimit)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text>Generated by Taxly · {generatedAt}</Text>
          <Text>FY 2025-26 · IT Act 2025 · For reference only — consult a CA for filing</Text>
        </View>
      </Page>
    </Document>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Download trigger
// ─────────────────────────────────────────────────────────────────────────────

export async function downloadSavingsPlan(result: CalculateResult, input: CalculateInput) {
  const generatedAt = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const blob = await pdf(<SavingsPlanDocument result={result} input={input} generatedAt={generatedAt} />).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `taxly-savings-plan-fy2025-26.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
