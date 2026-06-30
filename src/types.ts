export type IssueCategory = 'pothole' | 'water_leak' | 'streetlight' | 'garbage' | 'other';

export type IssueStatus = 'OPEN' | 'ESCALATED' | 'RESOLVED';

export interface IssueLocation {
  lat: number;
  lng: number;
  name: string;
}

export interface Issue {
  id: string;
  category: IssueCategory;
  severity: number;
  severityReason: string;
  department: string;
  summary: string;
  location: IssueLocation;
  area: string;
  status: IssueStatus;
  reportedAt: number; // timestamp
  reportedBy: 'self' | 'other';
  imageBase64?: string;
  description?: string;
  reportCount?: number;
  collaborators?: number[];
  reporterName?: string;
  reporterIsOfficial?: boolean;
  reporterDepartment?: string;
  photoSource?: 'live' | 'upload' | 'preset';
  photoCapturedAt?: number;
  resolvedAt?: number;
  resolvedBy?: string;
  resolutionImage?: string;
  resolutionNotes?: string;
  isRecurrent?: boolean;
  recurrenceCount?: number;
}

export interface UserProfile {
  name: string;
  area: string;
  email?: string;
  phone?: string;
  isOfficial?: boolean;
  officialDepartment?: string;
  isVerifiedOfficial?: boolean;
}

export interface AppState {
  profile: UserProfile;
  allIssues: Issue[];
  myReports: Issue[];
  selectedIssueId: string | null;
  activeTab: 'map' | 'dashboard' | 'report' | 'profile';
  dashboardToggle: boolean; // false = area only, true = all areas
}

export interface GeminiAnalysisResult {
  isValidIssue: boolean;
  rejectionReason: string | null;
  category: IssueCategory;
  severity: number;
  severityReason: string;
  department: string;
  summary: string;
}
