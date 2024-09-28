"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingVariables = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PricingVariablesSchema = new mongoose_1.Schema({
    warehouseAddress: { type: String, required: true },
    baseDeliveryFee: { type: Number, required: true },
    deliveryFeePerMile: { type: Number, required: true },
    baseInstallFee: { type: Number, required: true },
    installFeePerComponent: { type: Number, required: true },
    rentalRatePerFt: { type: Number, required: true },
}, { timestamps: true });
exports.PricingVariables = mongoose_1.default.model('PricingVariables', PricingVariablesSchema);
