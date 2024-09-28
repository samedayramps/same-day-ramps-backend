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
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeJob = exports.markAsRemoved = exports.scheduleRemoval = exports.markAsInstalled = exports.scheduleInstallation = exports.calculatePricing = exports.updateJobStage = exports.acceptQuote = exports.sendQuote = exports.deleteJob = exports.updateJob = exports.createJob = exports.getJobById = exports.getAllJobs = void 0;
const Job_1 = require("../models/Job");
const pricingService_1 = require("../services/pricingService");
const emailService_1 = require("../services/emailService");
const Job_2 = require("../types/Job");
const getAllJobs = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const jobs = yield Job_1.Job.find();
        res.json(jobs);
    }
    catch (error) {
        next(error);
    }
});
exports.getAllJobs = getAllJobs;
const getJobById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const job = yield Job_1.Job.findById(req.params.id);
        if (!job) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }
        res.json(job);
    }
    catch (error) {
        next(error);
    }
});
exports.getJobById = getJobById;
const createJob = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const jobData = req.body;
        const job = new Job_1.Job(jobData);
        yield job.save();
        res.status(201).json(job);
    }
    catch (error) {
        next(error);
    }
});
exports.createJob = createJob;
const updateJob = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const job = yield Job_1.Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!job) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }
        res.json(job);
    }
    catch (error) {
        next(error);
    }
});
exports.updateJob = updateJob;
const deleteJob = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const job = yield Job_1.Job.findByIdAndDelete(req.params.id);
        if (!job) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }
        res.json({ message: 'Job deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteJob = deleteJob;
const sendQuote = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const job = yield Job_1.Job.findById(req.params.id);
        if (!job) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }
        // Generate quote link or PDF (implementation depends on eSignatures service)
        const quoteLink = 'http://example.com/quote'; // Placeholder
        job.quote.eSignaturesLink = quoteLink;
        job.stage = Job_2.JobStage.QUOTE_SENT;
        yield job.save();
        // Send email to customer
        yield (0, emailService_1.sendQuoteEmail)(job._id.toString(), job.customerInfo.email);
        res.json({ message: 'Quote sent successfully', quoteLink });
    }
    catch (error) {
        next(error);
    }
});
exports.sendQuote = sendQuote;
const acceptQuote = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const job = yield Job_1.Job.findById(req.params.id);
        if (!job) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }
        job.stage = Job_2.JobStage.QUOTE_ACCEPTED;
        // Update agreement status if necessary
        yield job.save();
        res.json({ message: 'Quote accepted successfully' });
    }
    catch (error) {
        next(error);
    }
});
exports.acceptQuote = acceptQuote;
const updateJobStage = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { stage } = req.body;
        const job = yield Job_1.Job.findByIdAndUpdate(req.params.id, { stage }, { new: true });
        if (!job) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }
        res.json(job);
    }
    catch (error) {
        next(error);
    }
});
exports.updateJobStage = updateJobStage;
const calculatePricing = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { rampConfiguration, installAddress, warehouseAddress } = req.body;
        const pricing = yield (0, pricingService_1.calculatePricingService)(rampConfiguration, installAddress, warehouseAddress);
        res.json(pricing);
    }
    catch (error) {
        next(error);
    }
});
exports.calculatePricing = calculatePricing;
const scheduleInstallation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { installationDate, timeSlot } = req.body;
        const job = yield Job_1.Job.findById(id);
        if (!job) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }
        job.installationSchedule = { date: new Date(installationDate), timeSlot };
        job.stage = Job_2.JobStage.SCHEDULED;
        yield job.save();
        yield (0, emailService_1.sendInstallationConfirmationEmail)(job._id.toString(), job.customerInfo.email, job.installationSchedule);
        res.json({ message: 'Installation scheduled successfully', job });
    }
    catch (error) {
        next(error);
    }
});
exports.scheduleInstallation = scheduleInstallation;
const markAsInstalled = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { installationNotes } = req.body;
        const job = yield Job_1.Job.findById(id);
        if (!job) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }
        job.stage = Job_2.JobStage.INSTALLED;
        job.communicationLog.push({
            date: new Date(),
            type: 'system',
            notes: `Ramp installed. Notes: ${installationNotes}`,
        });
        yield job.save();
        res.json({ message: 'Job marked as installed', job });
    }
    catch (error) {
        next(error);
    }
});
exports.markAsInstalled = markAsInstalled;
const scheduleRemoval = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { removalDate, timeSlot } = req.body;
        const job = yield Job_1.Job.findById(id);
        if (!job) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }
        const removalCost = yield (0, pricingService_1.estimateRemovalCost)(id);
        job.removalSchedule = { date: new Date(removalDate), timeSlot };
        job.stage = Job_2.JobStage.REMOVAL_SCHEDULED;
        job.quote.removalFee = removalCost;
        yield job.save();
        yield (0, emailService_1.sendRemovalConfirmationEmail)(job._id.toString(), job.customerInfo.email, job.removalSchedule, removalCost);
        res.json({ message: 'Removal scheduled successfully', job });
    }
    catch (error) {
        next(error);
    }
});
exports.scheduleRemoval = scheduleRemoval;
const markAsRemoved = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { removalNotes } = req.body;
        const job = yield Job_1.Job.findById(id);
        if (!job) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }
        job.stage = Job_2.JobStage.REMOVED;
        job.communicationLog.push({
            date: new Date(),
            type: 'system',
            notes: `Ramp removed. Notes: ${removalNotes}`,
        });
        yield job.save();
        res.json({ message: 'Job marked as removed', job });
    }
    catch (error) {
        next(error);
    }
});
exports.markAsRemoved = markAsRemoved;
const completeJob = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const job = yield Job_1.Job.findById(id);
        if (!job) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }
        job.stage = Job_2.JobStage.COMPLETED;
        job.communicationLog.push({
            date: new Date(),
            type: 'system',
            notes: 'Job completed',
        });
        yield job.save();
        yield (0, emailService_1.sendJobCompletionEmail)(job._id.toString(), job.customerInfo.email);
        res.json({ message: 'Job marked as completed', job });
    }
    catch (error) {
        next(error);
    }
});
exports.completeJob = completeJob;
