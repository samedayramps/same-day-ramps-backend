// src/types/Job.ts

export enum JobStage {
  REQUESTED = 'REQUESTED',
  CONTACTED = 'CONTACTED',
  QUOTE_SENT = 'QUOTE_SENT',
  QUOTE_ACCEPTED = 'QUOTE_ACCEPTED',
  PAID = 'PAID',
  SCHEDULED = 'SCHEDULED',
  INSTALLED = 'INSTALLED',
  REMOVAL_SCHEDULED = 'REMOVAL_SCHEDULED',
  REMOVED = 'REMOVED',
  COMPLETED = 'COMPLETED'
}

export interface RampComponent {
  type: 'ramp' | 'landing';
  size: string;
  quantity: number;
  width?: number; // Optional width for landings
}

export interface RampConfiguration {
  components: RampComponent[];
  totalLength: number;
  rentalDuration: number;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  installAddress: string;
  mobilityAids?: string[];
  notes?: string;
}

export interface Schedule {
  date: Date | null;
  timeSlot: string;
}

export interface Job {
  _id: string;
  stage: JobStage;
  customerInfo: CustomerInfo;
  rampConfiguration: RampConfiguration;
  pricing: {
    deliveryFee: number;
    installFee: number;
    monthlyRate: number;
    upfrontFee: number;
  };
  installationSchedule?: Schedule;
  removalSchedule?: Schedule;
  communicationLog?: Array<{
    date: string;
    type: 'email' | 'phone' | 'in-person' | 'system';
    notes: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobForBackend extends Omit<Job, 'installationSchedule' | 'removalSchedule'> {
  installationSchedule?: {
    date: string | null;
    timeSlot?: string;
  };
  removalSchedule?: {
    date: string | null;
    timeSlot?: string;
  };
}