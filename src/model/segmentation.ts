// ── Consumer Segmentation ────────────────────────────────────────────────────
// Detects shopper archetype from inputs to adapt messaging and thresholds.
// These segments come directly from the product spec.

import type { ShopperProfile } from './types';

export type ShopperSegment =
  | 'payment-focused'
  | 'credit-anxious'
  | 'budget-fragile'
  | 'reliability-maximizer'
  | 'negative-equity'
  | 'biweekly-household';

export interface SegmentProfile {
  segment: ShopperSegment;
  label: string;
  description: string;
  // Adjustments to base thresholds
  comfortBandAdjustment: number;     // multiplier on comfort threshold (< 1 = tighter)
  protectionBias: 'conservative' | 'neutral' | 'protective';
  toneAdjustment: 'reassuring' | 'direct' | 'safety-first';
  showBiweeklySavings: boolean;
}

const SEGMENT_PROFILES: Record<ShopperSegment, Omit<SegmentProfile, 'segment'>> = {
  'payment-focused': {
    label: 'Payment-Focused Buyer',
    description: 'You want the most manageable payment. We\'ll focus on keeping your monthly cost predictable.',
    comfortBandAdjustment: 1.0,
    protectionBias: 'neutral',
    toneAdjustment: 'direct',
    showBiweeklySavings: true,
  },
  'credit-anxious': {
    label: 'Credit-Conscious Buyer',
    description: 'Getting approved can feel uncertain. We\'ll show you realistic options and next steps.',
    comfortBandAdjustment: 0.90,
    protectionBias: 'conservative',
    toneAdjustment: 'reassuring',
    showBiweeklySavings: true,
  },
  'budget-fragile': {
    label: 'Budget-Careful Buyer',
    description: 'Keeping room in your budget is a priority. We\'ll highlight the safest deal structures for you.',
    comfortBandAdjustment: 0.85,
    protectionBias: 'protective',
    toneAdjustment: 'safety-first',
    showBiweeklySavings: true,
  },
  'reliability-maximizer': {
    label: 'Reliability-First Buyer',
    description: 'You want a vehicle you can count on. We\'ll focus on ownership cost predictability.',
    comfortBandAdjustment: 0.95,
    protectionBias: 'protective',
    toneAdjustment: 'direct',
    showBiweeklySavings: false,
  },
  'negative-equity': {
    label: 'Trade-In Buyer with Balance',
    description: 'Rolling a balance from your current vehicle adds complexity. We\'ll help you structure this safely.',
    comfortBandAdjustment: 0.88,
    protectionBias: 'protective',
    toneAdjustment: 'safety-first',
    showBiweeklySavings: true,
  },
  'biweekly-household': {
    label: 'Biweekly-Pay Household',
    description: 'Aligning payments to your paycheck schedule can improve budgeting. We\'ll show you how.',
    comfortBandAdjustment: 1.0,
    protectionBias: 'neutral',
    toneAdjustment: 'direct',
    showBiweeklySavings: true,
  },
};

export function detectSegment(shopper: ShopperProfile): SegmentProfile {
  // Priority-based detection — first match wins
  // These heuristics will be replaced with data-derived classification

  const budgetTightness = shopper.monthlyBudgetMax > 0
    ? (shopper.monthlyBudgetMax - shopper.monthlyBudgetMin) / shopper.monthlyBudgetMax
    : 0;

  const hasNegativeEquity = shopper.hasTradeIn && shopper.tradeInOwed > shopper.tradeInValue;
  const negEquityAmount = hasNegativeEquity ? shopper.tradeInOwed - shopper.tradeInValue : 0;

  let segment: ShopperSegment;

  if (hasNegativeEquity && negEquityAmount > 2000) {
    segment = 'negative-equity';
  } else if (budgetTightness < 0.15 && shopper.monthlyBudgetMax < 400) {
    segment = 'budget-fragile';
  } else if (shopper.creditBand === 'rebuilding' || shopper.creditBand === 'fair') {
    segment = 'credit-anxious';
  } else if (shopper.priority === 'reliability') {
    segment = 'reliability-maximizer';
  } else if (shopper.payFrequency === 'biweekly' && shopper.priority !== 'lowest-payment') {
    segment = 'biweekly-household';
  } else {
    segment = 'payment-focused';
  }

  return { segment, ...SEGMENT_PROFILES[segment] };
}

// Segment-adjusted comfort threshold
export function adjustedComfortMax(shopper: ShopperProfile, segmentProfile: SegmentProfile): number {
  return shopper.monthlyBudgetMax * segmentProfile.comfortBandAdjustment;
}
