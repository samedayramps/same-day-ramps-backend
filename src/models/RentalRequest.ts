// src/models/RentalRequest.ts

import mongoose, { Document, Schema } from 'mongoose';
import { SalesStage } from '../types/RentalRequest';

export interface IRentalRequest extends Document {
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  rampDetails: {
    knowRampLength: boolean;
    rampLength?: number;
    knowRentalDuration: boolean;
    rentalDuration?: number;
    installTimeframe: string;
    mobilityAids: string[];
  };
  installAddress: string;
  status: 'pending' | 'job created' | 'rejected';
  salesStage: SalesStage;
  customerId?: mongoose.Types.ObjectId;
  quoteId?: mongoose.Types.ObjectId;
  jobId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RentalRequestSchema: Schema = new Schema(
  {
    customerInfo: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    rampDetails: {
      knowRampLength: { type: Boolean, required: true },
      rampLength: { type: Number },
      knowRentalDuration: { type: Boolean, required: true },
      rentalDuration: { type: Number },
      installTimeframe: { type: String, required: true },
      mobilityAids: [{ type: String }],
    },
    installAddress: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'job created', 'rejected'], 
      default: 'pending' 
    },
    salesStage: { type: String, enum: Object.values(SalesStage), default: SalesStage.RENTAL_REQUEST },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    quoteId: { type: Schema.Types.ObjectId, ref: 'Quote' },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
  },
  { timestamps: true }
);

export const RentalRequest = mongoose.model<IRentalRequest>('RentalRequest', RentalRequestSchema);