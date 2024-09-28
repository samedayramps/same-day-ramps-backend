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
exports.RentalRequest = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const RentalRequest_1 = require("../types/RentalRequest");
const RentalRequestSchema = new mongoose_1.Schema({
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
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'archived'], default: 'pending' },
    salesStage: { type: String, enum: Object.values(RentalRequest_1.SalesStage), default: RentalRequest_1.SalesStage.RENTAL_REQUEST },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer' },
    quoteId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Quote' },
    jobId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Job' },
}, { timestamps: true });
exports.RentalRequest = mongoose_1.default.model('RentalRequest', RentalRequestSchema);
