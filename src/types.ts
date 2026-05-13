export interface Hazard {
  id: string;
  name: string;
  description: string;
  location: string;
  photo?: string;
  category: HazardCategory;
}

export type HazardCategory =
  | 'physical'
  | 'chemical'
  | 'biological'
  | 'ergonomic'
  | 'psychological'
  | 'electrical'
  | 'fire'
  | 'mechanical';

export interface RiskAssessment {
  id: string;
  hazard: Hazard;
  affectedPersons: string[];
  damageType: string;
  existingControls: string[];
  initialRisk: RiskLevel;
  additionalControls: string[];
  residualRisk: RiskLevel;
  responsiblePerson: string;
  deadline: string;
  reviewDate: string;
  createdAt: string;
}

export interface RiskLevel {
  probability: number; // 1-5
  severity: number; // 1-5
  rating: number; // probability * severity
  category: RiskCategory;
}

export type RiskCategory = 'low' | 'medium' | 'high' | 'critical';

export interface ControlMeasure {
  id: string;
  type: ControlType;
  description: string;
  effectiveness: 'high' | 'medium' | 'low';
}

export type ControlType =
  | 'elimination'
  | 'substitution'
  | 'engineering'
  | 'administrative'
  | 'ppe';

// Video Analysis Types
export interface VideoFrame {
  timestamp: number;
  imageData: string; // base64
  width: number;
  height: number;
}

export interface VideoAnalysisResult {
  id: string;
  frameTimestamp: number;
  capturedAt: string;
  imageData: string;
  hazardName: string;
  description: string;
  category: HazardCategory;
  location: string;
  affectedPersons: string;
  damageType: string;
  probability: number;
  severity: number;
  riskRating: number;
  riskCategory: RiskCategory;
  controlMeasures: {
    elimination: string;
    substitution: string;
    engineering: string;
    administrative: string;
    ppe: string;
  };
  recommendations: string;
  confidence: number;
}

export interface VideoAnalysisSession {
  id: string;
  startedAt: string;
  location: string;
  results: VideoAnalysisResult[];
  status: 'recording' | 'analyzing' | 'completed' | 'paused';
}

export const PROBABILITY_LABELS: Record<number, string> = {
  1: 'ძალიან საეჭვო',
  2: 'საეჭვო',
  3: 'შესაძლებელი',
  4: 'სავარაუდო',
  5: 'განსაზღვრული'
};

export const SEVERITY_LABELS: Record<number, string> = {
  1: 'უმნიშვნელო',
  2: 'მცირე',
  3: 'ზომიერი',
  4: 'სერიოზული',
  5: 'კატასტროფული'
};

export const HAZARD_CATEGORIES: Record<HazardCategory, string> = {
  physical: 'ფიზიკური',
  chemical: 'ქიმიური',
  biological: 'ბიოლოგიური',
  ergonomic: 'ერგონომიული',
  psychological: 'ფსიქოლოგიური',
  electrical: 'ელექტრული',
  fire: 'ხანძარი',
  mechanical: 'მექანიკური'
};

export const CONTROL_TYPES: Record<ControlType, { label: string; description: string }> = {
  elimination: {
    label: 'აღმოფხვრა',
    description: 'საფრთხის სრული აღმოფხვრა'
  },
  substitution: {
    label: 'შემცირება',
    description: 'საფრთხის შემცველი ფაქტორის ჩანაცვლება'
  },
  engineering: {
    label: 'იზოლირება',
    description: 'საინჟინრო-ტექნიკური ღონისძიებები'
  },
  administrative: {
    label: 'პროცედურები',
    description: 'ადმინისტრაციული კონტროლი'
  },
  ppe: {
    label: 'ინდ. დაცვა',
    description: 'ინდივიდუალური დაცვის საშუალებები'
  }
};

export function calculateRiskCategory(rating: number): RiskCategory {
  if (rating >= 15) return 'critical';
  if (rating >= 9) return 'high';
  if (rating >= 5) return 'medium';
  return 'low';
}

export function getRiskColor(category: RiskCategory): string {
  switch (category) {
    case 'critical': return 'bg-red-600';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
  }
}

export function getRiskTextColor(category: RiskCategory): string {
  switch (category) {
    case 'critical': return 'text-red-500';
    case 'high': return 'text-orange-500';
    case 'medium': return 'text-yellow-500';
    case 'low': return 'text-green-500';
  }
}

export function getRiskBorderColor(category: RiskCategory): string {
  switch (category) {
    case 'critical': return 'border-red-500';
    case 'high': return 'border-orange-500';
    case 'medium': return 'border-yellow-500';
    case 'low': return 'border-green-500';
  }
}

export const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  critical: 'კრიტიკული',
  high: 'მაღალი',
  medium: 'საშუალო',
  low: 'დაბალი'
};
