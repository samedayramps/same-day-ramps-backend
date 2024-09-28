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
exports.validateJobStage = exports.handleValidation = exports.validateCompleteJob = exports.validateMarkAsRemoved = exports.validateScheduleRemoval = exports.validateMarkAsInstalled = exports.validateScheduleInstallation = exports.validateRentalRequestCreation = exports.validateJobUpdate = exports.validateJobCreation = void 0;
const express_validator_1 = require("express-validator");
const Job_1 = require("../types/Job");
const Job_2 = require("../models/Job");
exports.validateJobCreation = [
    (0, express_validator_1.body)('customerInfo.firstName').notEmpty().withMessage('First name is required'),
    (0, express_validator_1.body)('customerInfo.lastName').notEmpty().withMessage('Last name is required'),
    (0, express_validator_1.body)('customerInfo.email').isEmail().withMessage('Invalid email'),
    (0, express_validator_1.body)('customerInfo.phone').notEmpty().withMessage('Phone number is required'),
    (0, express_validator_1.body)('rampConfiguration.rentalDuration')
        .isInt({ min: 1 })
        .withMessage('Rental duration must be a positive integer'),
];
exports.validateJobUpdate = [
    (0, express_validator_1.body)('stage').optional().isIn(Object.values(Job_1.JobStage)).withMessage('Invalid job stage'),
];
exports.validateRentalRequestCreation = [
// Define rules for rental request creation
];
exports.validateScheduleInstallation = [
    (0, express_validator_1.param)('id').isMongoId().withMessage('Invalid job ID'),
    (0, express_validator_1.body)('installationDate')
        .isISO8601()
        .withMessage('Invalid installation date format'),
    (0, express_validator_1.body)('timeSlot')
        .isString()
        .notEmpty()
        .withMessage('Time slot is required'),
];
exports.validateMarkAsInstalled = [
    (0, express_validator_1.param)('id').isMongoId().withMessage('Invalid job ID'),
    (0, express_validator_1.body)('installationNotes')
        .isString()
        .notEmpty()
        .withMessage('Installation notes are required'),
];
exports.validateScheduleRemoval = [
    (0, express_validator_1.param)('id').isMongoId().withMessage('Invalid job ID'),
    (0, express_validator_1.body)('removalDate')
        .isISO8601()
        .withMessage('Invalid removal date format'),
    (0, express_validator_1.body)('timeSlot')
        .isString()
        .notEmpty()
        .withMessage('Time slot is required'),
];
exports.validateMarkAsRemoved = [
    (0, express_validator_1.param)('id').isMongoId().withMessage('Invalid job ID'),
    (0, express_validator_1.body)('removalNotes')
        .isString()
        .notEmpty()
        .withMessage('Removal notes are required'),
];
exports.validateCompleteJob = [
    (0, express_validator_1.param)('id').isMongoId().withMessage('Invalid job ID'),
];
const handleValidation = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};
exports.handleValidation = handleValidation;
const validateJobStage = (allowedStages) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const job = yield Job_2.Job.findById(req.params.id);
            if (!job) {
                res.status(404).json({ message: 'Job not found' });
                return;
            }
            if (!allowedStages.includes(job.stage)) {
                res.status(400).json({ message: `Invalid job stage. Allowed stages: ${allowedStages.join(', ')}` });
                return;
            }
            next();
        }
        catch (error) {
            next(error);
        }
    });
};
exports.validateJobStage = validateJobStage;
