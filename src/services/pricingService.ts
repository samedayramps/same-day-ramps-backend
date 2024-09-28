// src/services/pricingService.ts

import { RampConfiguration } from '../types/Job';
import { PricingVariables } from '../models/PricingVariables';
import { Job } from '../models/Job';
import axios from 'axios';
import logger from '../utils/logger';

interface PricingCalculation {
  deliveryFee: number;
  installFee: number;
  monthlyRate: number;
  upfrontFee: number;
}

interface DistanceMatrix {
  distance: { value: number; text: string };
  duration: { value: number; text: string };
}

const calculateDistance = async (origin: string, destination: string): Promise<number> => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    logger.error('Google Maps API key is missing');
    throw new Error('Google Maps API key is not configured');
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
    origin
  )}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;
    if (!data.rows || !data.rows[0] || !data.rows[0].elements || !data.rows[0].elements[0]) {
      logger.error('Invalid response from Google Maps API', data);
      throw new Error('Invalid response from Google Maps API');
    }
    const distanceMatrix: DistanceMatrix = data.rows[0].elements[0];
    return distanceMatrix.distance.value / 1609.34; // Convert meters to miles
  } catch (error) {
    logger.error('Error calculating distance:', error);
    throw new Error('Failed to calculate distance');
  }
};

export const calculatePricingService = async (
  rampConfiguration: RampConfiguration,
  installAddress: string,
  warehouseAddress: string
): Promise<PricingCalculation> => {
  logger.info('Starting pricing calculation', { rampConfiguration, installAddress, warehouseAddress });

  const pricingVars = await PricingVariables.findOne();
  if (!pricingVars) {
    logger.error('Pricing variables not set');
    throw new Error('Pricing variables not set');
  }

  logger.info('Pricing variables found', pricingVars);

  try {
    const distanceInMiles = await calculateDistance(warehouseAddress, installAddress);
    logger.info('Distance calculated', { distanceInMiles });

    const deliveryFee =
      pricingVars.baseDeliveryFee + pricingVars.deliveryFeePerMile * distanceInMiles;
      const installFee =
      pricingVars.baseInstallFee +
      pricingVars.installFeePerComponent * rampConfiguration.components.reduce((total, component) => total + component.quantity, 0);
    
    // Calculate monthlyRate only if totalLength is available
    let monthlyRate = 0;
    if (rampConfiguration.totalLength) {
      monthlyRate = pricingVars.rentalRatePerFt * rampConfiguration.totalLength;
    }

    const upfrontFee = deliveryFee + installFee;

    const pricing = {
      deliveryFee: Math.round(deliveryFee),
      installFee: Math.round(installFee),
      monthlyRate: Math.round(monthlyRate),
      upfrontFee: Math.round(upfrontFee),
    };

    logger.info('Pricing calculation completed', pricing);
    return pricing;
  } catch (error) {
    logger.error('Error in pricing calculation', error);
    throw error;
  }
};

export const estimateRemovalCost = async (jobId: string): Promise<number> => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new Error('Job not found');
  }

  const pricingVars = await PricingVariables.findOne();
  if (!pricingVars) {
    throw new Error('Pricing variables not set');
  }

  if (!pricingVars.warehouseAddress) {
    throw new Error('Warehouse address is missing in pricing variables.');
  }

  if (!job.customerInfo || !job.customerInfo.installAddress) {
    throw new Error('Customer install address is missing.');
  }

  const distanceInMiles = await calculateDistance(
    pricingVars.warehouseAddress,
    job.customerInfo.installAddress
  );

  const removalFee =
    pricingVars.baseDeliveryFee + pricingVars.deliveryFeePerMile * distanceInMiles;

  return removalFee;
};