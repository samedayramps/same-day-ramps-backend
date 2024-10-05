import mongoose, { Document, Schema } from 'mongoose';
import { JobStage, RampConfiguration, CustomerInfo, Schedule } from '../types/Job';

export interface IJob extends Document {
  _id: mongoose.Types.ObjectId;
  stage: JobStage;
  customerInfo?: CustomerInfo;
  rampConfiguration?: RampConfiguration;
  pricing?: {
    deliveryFee?: number;
    installFee?: number;
    monthlyRate?: number;
    upfrontFee?: number;
  };
  installationSchedule?: Schedule;
  removalSchedule?: Schedule;
  communicationLog?: Array<{
    date: Date;
    type: 'email' | 'phone' | 'in-person' | 'system';
    notes: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  paymentLinkUrl?: string;
  agreementLink?: string;
}

const JobSchema: Schema = new Schema(
  {
    stage: {
      type: String,
      enum: Object.values(JobStage),
      default: JobStage.REQUESTED,
      required: true,
    },
    customerInfo: {
      firstName: { type: String },
      lastName: { type: String },
      phone: { type: String },
      email: { type: String },
      installAddress: { type: String },
      mobilityAids: [{ type: String }],
      notes: { type: String },
    },
    rampConfiguration: {
      components: [
        {
          type: { type: String, enum: ['ramp', 'landing'] },
          size: { type: String },
          quantity: { type: Number },
          width: { type: Number },
        },
      ],
      totalLength: { type: Number },
      rentalDuration: { type: Number },
    },
    pricing: {
      deliveryFee: { type: Number },
      installFee: { type: Number },
      monthlyRate: { type: Number },
      upfrontFee: { type: Number },
    },
    installationSchedule: {
      date: { type: Date },
      timeSlot: { type: String },
    },
    removalSchedule: {
      date: { type: Date },
      timeSlot: { type: String },
    },
    communicationLog: [
      {
        date: { type: Date, default: Date.now },
        type: { 
          type: String, 
          enum: ['email', 'phone', 'in-person', 'system'],
        },
        notes: { type: String },
      },
    ],
    paymentLinkUrl: { type: String },
    agreementLink: { type: String },
  },
  { timestamps: true }
);

export const Job = mongoose.model<IJob>('Job', JobSchema);