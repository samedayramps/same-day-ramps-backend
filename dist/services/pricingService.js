"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateRemovalCost = exports.calculatePricingService = void 0;
const PricingVariables_1 = require("../models/PricingVariables");
const Job_1 = require("../models/Job");
const axios_1 = __importDefault(require("axios"));
const calculateDistance = (origin, destination) => __awaiter(void 0, void 0, void 0, function* () {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;
    try {
        const response = yield axios_1.default.get(url);
        const data = response.data;
        const distanceMatrix = data.rows[0].elements[0];
        return distanceMatrix.distance.value / 1609.34; // Convert meters to miles
    }
    catch (error) {
        console.error('Error calculating distance:', error);
        throw new Error('Failed to calculate distance');
    }
});
const calculatePricingService = (rampConfiguration, installAddress, warehouseAddress) => __awaiter(void 0, void 0, void 0, function* () {
    const pricingVars = yield PricingVariables_1.PricingVariables.findOne();
    if (!pricingVars) {
        throw new Error('Pricing variables not set');
    }
    const distanceInMiles = yield calculateDistance(warehouseAddress, installAddress);
    const deliveryFee = pricingVars.baseDeliveryFee + pricingVars.deliveryFeePerMile * distanceInMiles;
    const installFee = pricingVars.baseInstallFee + pricingVars.installFeePerComponent * rampConfiguration.components.length;
    const monthlyRate = pricingVars.rentalRatePerFt * rampConfiguration.totalLength;
    // Apply discounts based on rental duration
    let discount = 0;
    if (rampConfiguration.rentalDuration >= 6) {
        discount = 0.1; // 10% discount for 6+ months
    }
    else if (rampConfiguration.rentalDuration >= 3) {
        discount = 0.05; // 5% discount for 3-5 months
    }
    const discountedMonthlyRate = monthlyRate * (1 - discount);
    const totalUpfront = deliveryFee + installFee;
    return {
        deliveryFee,
        installFee,
        monthlyRate: discountedMonthlyRate,
        discount: discount * 100, // Convert to percentage
        totalUpfront,
    };
});
exports.calculatePricingService = calculatePricingService;
const estimateRemovalCost = (jobId) => __awaiter(void 0, void 0, void 0, function* () {
    const job = yield Job_1.Job.findById(jobId);
    if (!job) {
        throw new Error('Job not found');
    }
    const pricingVars = yield PricingVariables_1.PricingVariables.findOne();
    if (!pricingVars) {
        throw new Error('Pricing variables not set');
    }
    const distanceInMiles = yield calculateDistance(pricingVars.warehouseAddress, job.customerInfo.installAddress);
    const removalFee = pricingVars.baseDeliveryFee + pricingVars.deliveryFeePerMile * distanceInMiles;
    return removalFee;
});
exports.estimateRemovalCost = estimateRemovalCost;
