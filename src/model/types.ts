// ── Shopper Inputs (Step 1) ──────────────────────────────────────────────────

export type CreditBand = 'excellent' | 'good' | 'fair' | 'rebuilding';
export type PayFrequency = 'monthly' | 'biweekly';
export type Priority = 'reliability' | 'lowest-payment' | 'balanced';
export type VehicleCondition = 'new' | 'certified-preowned' | 'used';

export interface ShopperProfile {
  monthlyBudgetMin: number;
  monthlyBudgetMax: number;
  downPayment: number;
  hasTradeIn: boolean;
  tradeInValue: number;       // 0 if no trade
  tradeInOwed: number;        // 0 if no trade or paid off
  vehicleType: string;        // SUV, Sedan, Truck, etc.
  vehicleCondition: VehicleCondition;
  creditBand: CreditBand;
  payFrequency: PayFrequency;
  ownershipYears: number;     // how long they plan to keep
  priority: Priority;
  monthlyIncome?: number;     // optional, strengthens analysis
}

// ── Vehicle Data ─────────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage: number;
  price: number;
  condition: VehicleCondition;
  type: string;               // SUV, Sedan, Truck, etc.
  mpgCity?: number;
  mpgHighway?: number;
}

// ── Engine Outputs ───────────────────────────────────────────────────────────

export type FitLevel = 'comfortable' | 'stretch' | 'caution';

export interface PaymentEstimate {
  monthlyPayment: number;
  biweeklyPayment: number;
  totalInterest: number;
  totalCost: number;
  termMonths: number;
  apr: number;
}

export interface PaymentFitResult {
  level: FitLevel;
  score: number;                // 0-100
  monthlyPayment: number;
  totalMonthlyBurden: number;
  explanation: string;
}

export interface OwnershipSnapshot {
  estimatedPayment: number;
  estimatedInsurance: number;
  estimatedMaintenance: number;
  estimatedFuel: number;
  totalMonthlyBurden: number;
  burdenAsPercentOfBudget: number;
}

export interface StructureSuggestion {
  id: string;
  type: 'down-payment' | 'term' | 'vehicle-switch' | 'equity-warning' | 'general';
  message: string;
  impact: string;              // e.g. "Could reduce payment by ~$45/mo"
  priority: 'high' | 'medium' | 'low';
}

export type ProtectionLevel = 'recommended' | 'worth-considering' | 'optional' | 'not-priority';

export interface ProtectionRecommendation {
  product: 'gap' | 'service-contract' | 'maintenance-plan';
  level: ProtectionLevel;
  reason: string;
  paymentImpact: number;       // estimated $/mo added
  warningIfAdded?: string;     // if it pushes deal into danger
}

export interface LeadSummary {
  shopperName?: string;
  comfortPaymentRange: { min: number; max: number };
  suggestedDownPayment: number;
  preferredVehicles: string[];
  tradeStatus: string;
  protectionPriorities: string[];
  likelyConcerns: string[];
  appointmentFraming: string;
  visitChecklist: string[];
}

// ── Full Analysis Result ─────────────────────────────────────────────────────

export interface AffordabilityAnalysis {
  paymentFit: PaymentFitResult;
  ownership: OwnershipSnapshot;
  structureSuggestions: StructureSuggestion[];
  protections: ProtectionRecommendation[];
  leadSummary: LeadSummary;
  paymentEstimate: PaymentEstimate;
}
