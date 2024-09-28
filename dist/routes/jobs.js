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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jobController = __importStar(require("../controllers/jobController"));
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const Job_1 = require("../types/Job");
const router = express_1.default.Router();
// Helper function to wrap controller functions
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
router.get('/', asyncHandler(jobController.getAllJobs));
router.get('/:id', asyncHandler(jobController.getJobById));
router.post('/', validationMiddleware_1.validateJobCreation, asyncHandler(jobController.createJob));
router.put('/:id', validationMiddleware_1.validateJobUpdate, asyncHandler(jobController.updateJob));
router.delete('/:id', asyncHandler(jobController.deleteJob));
router.post('/:id/send-quote', asyncHandler(jobController.sendQuote));
router.post('/:id/accept-quote', asyncHandler(jobController.acceptQuote));
router.put('/:id/stage', asyncHandler(jobController.updateJobStage));
router.post('/calculate-pricing', asyncHandler(jobController.calculatePricing));
router.post('/:id/schedule-installation', validationMiddleware_1.validateScheduleInstallation, (0, validationMiddleware_1.validateJobStage)([Job_1.JobStage.PAID]), asyncHandler(jobController.scheduleInstallation));
router.post('/:id/mark-installed', validationMiddleware_1.validateMarkAsInstalled, (0, validationMiddleware_1.validateJobStage)([Job_1.JobStage.SCHEDULED]), asyncHandler(jobController.markAsInstalled));
router.post('/:id/schedule-removal', validationMiddleware_1.validateScheduleRemoval, (0, validationMiddleware_1.validateJobStage)([Job_1.JobStage.INSTALLED]), asyncHandler(jobController.scheduleRemoval));
router.post('/:id/mark-removed', validationMiddleware_1.validateMarkAsRemoved, (0, validationMiddleware_1.validateJobStage)([Job_1.JobStage.REMOVAL_SCHEDULED]), asyncHandler(jobController.markAsRemoved));
router.post('/:id/complete', validationMiddleware_1.validateCompleteJob, (0, validationMiddleware_1.validateJobStage)([Job_1.JobStage.REMOVED]), asyncHandler(jobController.completeJob));
exports.default = router;
