import { Request, Response, NextFunction } from 'express';
import { Job, IJob } from '../models/Job';
import {
  calculatePricingService,
  estimateRemovalCost,
} from '../services/pricingService';
import {
  sendQuoteEmail,
  sendInstallationConfirmationEmail,
  sendRemovalConfirmationEmail,
  sendJobCompletionEmail,
} from '../services/emailService';
import { JobStage, RampConfiguration } from '../types/Job';
import logger from '../utils/logger';
import mongoose from 'mongoose'; // Add this import

export const getAllJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (error) {
    logger.error('Error fetching all jobs', error);
    next(error);
  }
};

export const getJobById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      logger.warn(`Job not found with id: ${req.params.id}`);
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    res.json(job);
  } catch (error) {
    logger.error(`Error fetching job with id: ${req.params.id}`, error);
    next(error);
  }
};

export const createJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const jobData = req.body;
    logger.info('Creating new job', { jobData });

    const job = new Job(jobData);

    await job.save();
    logger.info('Job created successfully', { jobId: job._id });
    res.status(201).json(job);
  } catch (error) {
    logger.error('Error creating job', error);
    next(error);
  }
};

export const updateJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const jobId = req.params.id;
    const updates: Partial<IJob> = req.body;

    logger.info(`Updating job ${jobId}`, updates);

    const job = await Job.findById(jobId);
    if (!job) {
      logger.error(`Job not found for ID: ${jobId}`);
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    // Merge updates with existing job data
    Object.assign(job, updates);

    // If rampConfiguration is updated, recalculate pricing
    if (updates.rampConfiguration && job.customerInfo?.installAddress) {
      const pricing = await calculatePricingService(
        updates.rampConfiguration, // Use updates.rampConfiguration instead of job.rampConfiguration
        job.customerInfo.installAddress,
        process.env.WAREHOUSE_ADDRESS || ''
      );
      job.pricing = pricing;
    }

    await job.save();

    logger.info(`Job updated successfully: ${jobId}`, job);
    res.json(job);
  } catch (error) {
    logger.error(`Error updating job ${req.params.id}`, error);
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ message: 'Validation Error', errors: error.errors });
    } else if (error instanceof Error) {
      next(error);
    } else {
      next(new Error('An unknown error occurred'));
    }
  }
};

export const deleteJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      logger.warn(`Attempted to delete non-existent job with id: ${req.params.id}`);
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    logger.info(`Job deleted successfully: ${req.params.id}`);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting job ${req.params.id}`, error);
    next(error);
  }
};

export const sendQuote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      logger.warn(`Attempted to send quote for non-existent job with id: ${req.params.id}`);
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    if (!job.customerInfo?.email) {
      logger.warn(`Cannot send quote: Customer email is missing for job: ${req.params.id}`);
      res.status(400).json({ message: 'Customer email is missing' });
      return;
    }

    // Generate quote link or PDF (implementation depends on eSignatures service)
    const quoteLink = 'http://example.com/quote'; // Placeholder

    job.stage = JobStage.QUOTE_SENT;
    await job.save();

    // Send email to customer
    await sendQuoteEmail(job._id.toString(), job.customerInfo.email);

    logger.info(`Quote sent successfully for job: ${req.params.id}`);
    res.json({ message: 'Quote sent successfully', quoteLink });
  } catch (error) {
    logger.error(`Error sending quote for job ${req.params.id}`, error);
    next(error);
  }
};

export const updateJobStage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { stage } = req.body;
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { stage },
      { new: true }
    );
    if (!job) {
      logger.warn(`Attempted to update stage for non-existent job with id: ${req.params.id}`);
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    logger.info(`Job stage updated successfully for job: ${req.params.id}`, { newStage: stage });
    res.json(job);
  } catch (error) {
    logger.error(`Error updating job stage for job ${req.params.id}`, error);
    next(error);
  }
};

export const calculatePricing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { rampConfiguration, installAddress } = req.body;
    const warehouseAddress = process.env.WAREHOUSE_ADDRESS;
    
    logger.info('Calculating pricing', { rampConfiguration, installAddress, warehouseAddress });

    if (!rampConfiguration || !installAddress || !warehouseAddress) {
      logger.error('Missing required data for pricing calculation', { rampConfiguration, installAddress, warehouseAddress });
      res.status(400).json({ message: 'Missing required data for pricing calculation' });
      return;
    }

    const pricing = await calculatePricingService(
      rampConfiguration,
      installAddress,
      warehouseAddress
    );
    
    logger.info('Pricing calculated successfully', pricing);
    res.json(pricing);
  } catch (error) {
    logger.error('Error calculating pricing', error);
    next(error);
  }
};

// Schedule installation
export const scheduleInstallation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const jobId = req.params.id;
    const { installationDate, timeSlot } = req.body;

    logger.info(`Scheduling installation for job ${jobId}`, {
      installationDate,
      timeSlot
    });

    if (!installationDate || !timeSlot) {
      logger.error(`Missing installation details for job ${jobId}`, req.body);
      res.status(400).json({ message: 'Missing installation details' });
      return;
    }

    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      {
        $set: {
          installationSchedule: {
            date: new Date(installationDate),
            timeSlot: timeSlot,
          },
        },
        stage: JobStage.SCHEDULED,
      },
      { new: true }
    );

    if (!updatedJob) {
      logger.error(`Job not found for ID: ${jobId}`);
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    if (updatedJob.installationSchedule && updatedJob.customerInfo?.email) {
      await sendInstallationConfirmationEmail(
        updatedJob._id.toString(),
        updatedJob.customerInfo.email,
        {
          date: updatedJob.installationSchedule.date as Date, // Type assertion
          timeSlot: updatedJob.installationSchedule.timeSlot
        }
      );
    } else {
      logger.warn(`Could not send installation confirmation email for job ${jobId}: missing email or schedule`);
    }

    logger.info(`Installation scheduled successfully for job ${jobId}`, updatedJob);
    res.status(200).json(updatedJob);
  } catch (error) {
    logger.error(`Error scheduling installation for job ${req.params.id}`, error);
    next(error);
  }
};

// Mark job as installed
export const markAsInstalled = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { installationNotes } = req.body;

    const job = await Job.findById(id);
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    job.stage = JobStage.INSTALLED;
    job.communicationLog = job.communicationLog || [];
    job.communicationLog.push({
      date: new Date(),
      type: 'system',
      notes: `Ramp installed. Notes: ${installationNotes}`,
    });
    await job.save();

    res.json({ message: 'Job marked as installed', job });
  } catch (error) {
    next(error);
  }
};

// Schedule removal
export const scheduleRemoval = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { removalDate, timeSlot } = req.body;

    const job = await Job.findById(id);
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    job.removalSchedule = { 
      date: new Date(removalDate), 
      timeSlot 
    };
    job.stage = JobStage.REMOVAL_SCHEDULED;
    await job.save();

    if (job.removalSchedule && job.customerInfo?.email) {
      await sendRemovalConfirmationEmail(
        job._id.toString(),
        job.customerInfo.email,
        {
          date: job.removalSchedule.date as Date,
          timeSlot: job.removalSchedule.timeSlot
        }
      );
    } else {
      logger.warn(`Could not send removal confirmation email for job ${id}: missing email or removal schedule`);
    }

    res.json({ message: 'Removal scheduled successfully', job });
  } catch (error) {
    logger.error(`Error scheduling removal for job ${req.params.id}`, error);
    next(error);
  }
};

// Mark job as removed
export const markAsRemoved = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { removalNotes } = req.body;

    const job = await Job.findById(id);
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    job.stage = JobStage.REMOVED;
    job.communicationLog = job.communicationLog || [];
    job.communicationLog.push({
      date: new Date(),
      type: 'system',
      notes: `Ramp removed. Notes: ${removalNotes}`,
    });
    await job.save();

    res.json({ message: 'Job marked as removed', job });
  } catch (error) {
    next(error);
  }
};

// Complete the job
export const completeJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    job.stage = JobStage.COMPLETED;
    job.communicationLog = job.communicationLog || [];
    job.communicationLog.push({
      date: new Date(),
      type: 'system',
      notes: 'Job completed',
    });
    await job.save();

    if (job.customerInfo?.email) {
      await sendJobCompletionEmail(
        job._id.toString(),
        job.customerInfo.email
      );
    } else {
      logger.warn(`Could not send job completion email for job ${id}: missing email`);
    }

    res.json({ message: 'Job marked as completed', job });
  } catch (error) {
    next(error);
  }
};
