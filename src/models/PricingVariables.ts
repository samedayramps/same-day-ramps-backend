import mongoose, { Document, Schema } from 'mongoose';

export interface IPricingVariables extends Document {
  warehouseAddress: string;
  baseDeliveryFee: number;
  deliveryFeePerMile: number;
  baseInstallFee: number;
  installFeePerComponent: number;
  rentalRatePerFt: number;
}

const PricingVariablesSchema: Schema = new Schema({
  warehouseAddress: { type: String, required: true },
  baseDeliveryFee: { type: Number, required: true },
  deliveryFeePerMile: { type: Number, required: true },
  baseInstallFee: { type: Number, required: true },
  installFeePerComponent: { type: Number, required: true },
  rentalRatePerFt: { type: Number, required: true },
}, { timestamps: true });

export const PricingVariables = mongoose.model<IPricingVariables>('PricingVariables', PricingVariablesSchema);