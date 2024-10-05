import express from 'express';
import * as jobController from '../controllers/jobController';
import {
  validateJobCreation,
  validateJobUpdate,
  validateScheduleInstallation,
  validateMarkAsInstalled,
  validateScheduleRemoval,
  validateMarkAsRemoved,
  validateCompleteJob,
  validateJobStage,
} from '../middlewares/validationMiddleware';
import { JobStage } from '../types/Job';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { Job } from '../models/Job'; // Add this import
import { CustomError } from '../utils/customError'; // Add this import

const router = express.Router();

type ControllerFunction = (req: Request, res: Response, next: NextFunction) => Promise<void>;

const asyncHandler = (fn: ControllerFunction): express.RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      logger.error('Route error:', error);
      next(error);
    });
  };
};

router.get('/', asyncHandler(jobController.getAllJobs));
router.get('/:id', asyncHandler(jobController.getJobById));
router.post('/', validateJobCreation, asyncHandler(jobController.createJob));
router.put('/:id', validateJobUpdate, asyncHandler(jobController.updateJob));
router.delete('/:id', asyncHandler(jobController.deleteJob));
router.post('/:id/send-quote', asyncHandler(jobController.sendQuote));
router.put('/:id/stage', asyncHandler(jobController.updateJobStage));
router.post('/calculate-pricing', asyncHandler(jobController.calculatePricing));

router.post(
  '/:id/schedule-installation',
  validateScheduleInstallation,
  validateJobStage([JobStage.PAID]),
  asyncHandler(jobController.scheduleInstallation)
);

router.post(
  '/:id/mark-installed',
  validateMarkAsInstalled,
  validateJobStage([JobStage.SCHEDULED]),
  asyncHandler(jobController.markAsInstalled)
);

router.post(
  '/:id/schedule-removal',
  validateScheduleRemoval,
  validateJobStage([JobStage.INSTALLED]),
  asyncHandler(jobController.scheduleRemoval)
);

router.post(
  '/:id/mark-removed',
  validateMarkAsRemoved,
  validateJobStage([JobStage.REMOVAL_SCHEDULED]),
  asyncHandler(jobController.markAsRemoved)
);

router.post(
  '/:id/complete',
  validateCompleteJob,
  validateJobStage([JobStage.REMOVED]),
  asyncHandler(jobController.completeJob)
);

router.post(
  '/:id/create-payment-link',
  asyncHandler(jobController.createPaymentLink)
);

router.post(
  '/:id/create-agreement-link',
  asyncHandler(jobController.createAgreementLink)
);

// Route for generating a quote
router.post('/:id/generate-quote', asyncHandler(jobController.generateQuote));

// Route for previewing a quote (if needed)
router.get('/:id/preview-quote', asyncHandler(async (req, res, next) => {
  const jobId = req.params.id;
  try {
    const job = await Job.findById(jobId);
    if (!job || !job.quoteHtml) {
      throw new CustomError('Quote not found', 404);
    }
    res.send(job.quoteHtml);
  } catch (error) {
    next(error);
  }
}));

// Route for sending a generated quote
router.post('/:id/send-generated-quote', asyncHandler(jobController.sendGeneratedQuote));

router.post('/:id/accept-quote', asyncHandler(jobController.acceptQuote));

export default router;