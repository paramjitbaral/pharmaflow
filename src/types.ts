export interface HCP {
  id: string;
  name: string;
  title: string;
  facility: string;
  tier: string;
  lastActivity: string;
  initials: string;
  specialty: string;
  location: string;
  loyalty: 'High' | 'Medium' | 'Low';
  lastCallDays: number;
  engagement: 'High' | 'Medium' | 'Low';
  rxPotential: string;
  sentiment: 'Positive' | 'Neutral' | 'Caution';
  sentimentDetails: string;
  recentTopics: string[];
  region?: string;
}

export interface Interaction {
  refId: string;
  hcpId: string;
  hcpName: string;
  specialty: string;
  facility: string;
  location?: string;
  timestamp: string;
  products: string[];
  engagement: string; // e.g. "VEXYL-B / HIGH"
  narrative: string;
  actions: string[];
  complianceVerified: boolean;
}

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  hcpName: string;
  type: string;
}

export type ViewType = 'dashboard' | 'log' | 'directory' | 'interactions' | 'followups' | 'settings';
