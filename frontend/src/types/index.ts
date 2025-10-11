/**
 * Shared type definitions for the DriveGuard AI application
 */

export interface Driver {
  id: string;
  name: string;
  email: string;
  license: string;
  joinDate: string;
  assignedVehicle?: string;
  totalAnalyses: number;
  averageScore: number;
  lastAnalysis?: string;
  status: 'active' | 'inactive';
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  year: number;
  assignedDriverId?: string;
  insuranceAmount?: number;
}

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  accountType: 'individual' | 'enterprise';
  carNumber?: string;
  affiliatedOrganizationId?: string;
  affiliatedOrganizationName?: string;
  affiliatedOrganizationType?: 'insurance' | 'fleet-operator';
  organizationId?: string;
}

export interface AnalysisRecord {
  id: string;
  fileName: string;
  date: string;
  score: number;
  duration: string;
  carNumber?: string;
  driverId?: string;
  vehicleId?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  organizationId?: string;
  organizationName?: string;
  isFromAffiliatedUser?: boolean;
}

export interface OrganizationAffiliation {
  organizationId: string;
  organizationName: string;
  organizationType: 'insurance' | 'fleet-operator';
  affiliationCode: string;
  isActive: boolean;
}
