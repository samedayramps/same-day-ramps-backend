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
exports.Job = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const Job_1 = require("../types/Job");
const JobSchema = new mongoose_1.Schema({
    stage: {
        type: String,
        enum: Object.values(Job_1.JobStage),
        default: Job_1.JobStage.REQUESTED,
    },
    customerInfo: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, required: true },
        installAddress: { type: String, required: true },
        mobilityAids: [{ type: String }],
        notes: { type: String },
    },
    rampConfiguration: {
        components: [
            {
                type: { type: String, enum: ['ramp', 'landing'], required: true },
                length: { type: Number, required: true },
                width: { type: Number },
                quantity: { type: Number, required: true },
            },
        ],
        totalLength: { type: Number, required: true },
        rentalDuration: { type: Number, required: true },
    },
    quote: {
        deliveryFee: { type: Number, required: true },
        installFee: { type: Number, required: true },
        monthlyRate: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        totalUpfront: { type: Number, required: true },
        removalFee: { type: Number },
        stripePaymentLink: { type: String },
        eSignaturesLink: { type: String },
        paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
        agreementStatus: { type: String, enum: ['pending', 'signed'], default: 'pending' },
    },
    installationSchedule: {
        date: { type: Date, required: true },
        timeSlot: { type: String, required: true },
    },
    removalSchedule: {
        date: { type: Date },
        timeSlot: { type: String },
    },
    communicationLog: [
        {
            date: { type: Date, default: Date.now },
            type: { type: String, enum: ['email', 'phone', 'in-person', 'system'], required: true },
            notes: { type: String, required: true },
        },
    ],
}, { timestamps: true });
exports.Job = mongoose_1.default.model('Job', JobSchema);
