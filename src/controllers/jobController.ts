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
  sendEmail, // Ensure you have a function to send emails
} from '../services/emailService';
import { JobStage, RampConfiguration } from '../types/Job';
import logger from '../utils/logger';
import mongoose from 'mongoose'; // Add this import
import Stripe from 'stripe';
import { CustomError } from '../utils/customError';
import axios from 'axios';
import { sendPushoverNotification } from '../utils/pushoverNotification';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20', // Update to the latest API version
});

// Add this near the top of the file, after other imports
const ESIGNATURES_API_KEY = process.env.ESIGNATURES_API_KEY;
const ESIGNATURES_API_URL = 'https://esignatures.io/api'; // Ensure this is the correct URL

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

export const createPaymentLink = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const jobId = req.params.id;
  
  try {
    logger.info(`Attempting to create payment link for job ${jobId}`);

    const job = await Job.findById(jobId);

    if (!job) {
      logger.warn(`Job not found for ID: ${jobId}`);
      throw new CustomError('Job not found', 404);
    }

    if (!job.pricing || !job.pricing.upfrontFee) {
      logger.error(`Job ${jobId} is missing pricing information`);
      throw new CustomError('Job is missing pricing information', 400);
    }

    if (job.paymentLinkUrl) {
      logger.info(`Payment link already exists for job ${jobId}`);
      res.json({ paymentLinkUrl: job.paymentLinkUrl });
      return;
    }

    // Create a price object first
    const price = await stripe.prices.create({
      unit_amount: Math.round(job.pricing.upfrontFee * 100), // Convert to cents
      currency: 'usd',
      product_data: {
        name: `Ramp Rental - Job ${jobId}`,
      },
    });

    // Validate the frontend URL
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl || !/^https?:\/\/.+/.test(frontendUrl)) {
      logger.error(`Invalid FRONTEND_URL: ${frontendUrl}`);
      throw new CustomError('Invalid frontend URL configuration', 500);
    }

    // Create the payment link using the price ID
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      after_completion: { type: 'redirect', redirect: { url: `${frontendUrl}/jobs/${jobId}` } },
    });

    // Save the payment link URL to the job in the database
    job.paymentLinkUrl = paymentLink.url;
    job.stage = JobStage.QUOTE_SENT;
    await job.save(); // Ensure this line is executed

    logger.info(`Payment link created successfully for job ${jobId}`, { paymentLinkUrl: paymentLink.url });
    res.json({ paymentLinkUrl: paymentLink.url });
  } catch (error) {
    if (error instanceof CustomError) {
      logger.warn(`Custom error in createPaymentLink for job ${jobId}: ${error.message}`);
      res.status(error.statusCode).json({ message: error.message });
    } else if (error instanceof Stripe.errors.StripeError) {
      logger.error(`Stripe error in createPaymentLink for job ${jobId}:`, error);
      res.status(500).json({ message: 'An error occurred while processing the payment link' });
    } else {
      logger.error(`Unexpected error in createPaymentLink for job ${jobId}:`, error);
      next(error);
    }
  }
};

export const createAgreementLink = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const jobId = req.params.id;

  try {
    logger.info(`Attempting to create agreement link for job ${jobId}`);

    const job = await Job.findById(jobId);

    if (!job) {
      logger.warn(`Job not found for ID: ${jobId}`);
      throw new CustomError('Job not found', 404);
    }

    if (!job.customerInfo || !job.customerInfo.email) {
      logger.error(`Job ${jobId} is missing customer information`);
      throw new CustomError('Job is missing customer information', 400);
    }

    // Prepare the variables to pass to the template
    const variables = {
      date: new Date().toLocaleDateString(),
      customerName: `${job.customerInfo.firstName} ${job.customerInfo.lastName}`,
      totalLength: job.rampConfiguration?.totalLength || 'N/A',
      'number-of-landings': job.rampConfiguration?.components?.filter(c => c.type === 'landing').reduce((sum, c) => sum + (c.quantity || 0), 0) || 0,
      monthlyRentalRate: job.pricing?.monthlyRate?.toFixed(2) || '0.00',
      totalUpfront: job.pricing?.upfrontFee?.toFixed(2) || '0.00',
      installAddress: job.customerInfo.installAddress || 'N/A',
    };

    const requestBody = {
      template_id: '4d28517b-968e-4973-a8fc-d1900e82e093',
      signers: [
        {
          name: variables.customerName,
          email: job.customerInfo.email,
        },
      ],
      fields: variables, // Pass the variables here
      test: 'yes',
    };

    const requestHeaders = {
      'Content-Type': 'application/json',
    };

    logger.info('eSignatures.io API request payload:', requestBody);
    logger.info('eSignatures.io API request headers:', requestHeaders);

    // Create agreement link using eSignatures.io API
    const response = await axios.post(
      `${ESIGNATURES_API_URL}/contracts?token=${ESIGNATURES_API_KEY}`,
      requestBody,
      { headers: requestHeaders }
    );

    logger.info('eSignatures.io API response:', response.data);

    // Safely extract the agreement link
    const agreementLink = response.data.data?.contract?.signers?.[0]?.sign_page_url;

    if (!agreementLink) {
      logger.error(`Agreement link not found in API response for job ${jobId}`);
      throw new CustomError('Failed to retrieve agreement link from API response', 500);
    }

    // Save the agreement link to the job in the database
    job.agreementLink = agreementLink;
    await job.save();

    logger.info(`Agreement link created successfully for job ${jobId}`, { agreementLink });
    res.json({ agreementLink });
  } catch (error) {
    if (error instanceof CustomError) {
      logger.warn(`Custom error in createAgreementLink for job ${jobId}: ${error.message}`);
      res.status(error.statusCode).json({ message: error.message });
    } else if (axios.isAxiosError(error)) {
      logger.error(`eSignatures.io API error in createAgreementLink for job ${jobId}:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      });
      res.status(500).json({ message: 'An error occurred while creating the agreement link' });
    } else {
      const err = error as Error;
      logger.error(`Unexpected error in createAgreementLink for job ${jobId}:`, {
        message: err.message,
        stack: err.stack,
      });
      next(err);
    }
  }
};

export const generateAndSendQuote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const jobId = req.params.id;

  try {
    const job = await Job.findById(jobId);

    if (!job) {
      logger.warn(`Job not found for ID: ${jobId}`);
      throw new CustomError('Job not found', 404);
    }

    if (!job.customerInfo?.email) {
      logger.warn(`Customer email is missing for job: ${jobId}`);
      throw new CustomError('Customer email is missing', 400);
    }

    const quoteHtml = `
      <h1>Quote for Ramp Rental</h1>
      <p>Dear ${job.customerInfo.firstName} ${job.customerInfo.lastName},</p>
      <p>Here are the details of your ramp rental:</p>
      <ul>
        <li>Total Length: ${job.rampConfiguration?.totalLength ?? 'N/A'} ft</li>
        <li>Components: ${job.rampConfiguration?.components?.map(c => `${c.quantity} x ${c.type} (${c.size})`).join(', ') ?? 'N/A'}</li>
        <li>Monthly Rate: $${job.pricing?.monthlyRate?.toFixed(2) ?? 'N/A'}</li>
        <li>Upfront Fee: $${job.pricing?.upfrontFee?.toFixed(2) ?? 'N/A'}</li>
      </ul>
      <p>If you wish to accept this quote, please click the button below:</p>
      <a href="${process.env.FRONTEND_URL}/accept-quote/${jobId}" style="display: inline-block; padding: 10px 20px; color: white; background-color: green; text-decoration: none;">Accept Quote</a>
    `;

    await sendEmail({
      to: job.customerInfo.email,
      subject: 'Your Ramp Rental Quote',
      html: quoteHtml,
    });

    logger.info(`Quote email sent successfully for job: ${jobId}`);
    res.json({ message: 'Quote email sent successfully' });
  } catch (error) {
    logger.error(`Error generating and sending quote for job ${jobId}`, error);
    next(error);
  }
};

export const generateQuote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const jobId = req.params.id;

  try {
    console.log(`Generating quote for job ${jobId}`);

    const job = await Job.findById(jobId);

    if (!job) {
      logger.warn(`Job not found for ID: ${jobId}`);
      throw new CustomError('Job not found', 404);
    }

    const quoteHtml = `
      <h1>Quote for Ramp Rental</h1>
      <p>Dear ${job.customerInfo?.firstName ?? 'Customer'} ${job.customerInfo?.lastName ?? ''},</p>
      <p>Here are the details of your ramp rental:</p>
      <ul>
        <li>Total Length: ${job.rampConfiguration?.totalLength ?? 'N/A'} ft</li>
        <li>Components: ${job.rampConfiguration?.components?.map(c => `${c.quantity} x ${c.type} (${c.size})`).join(', ') ?? 'N/A'}</li>
        <li>Monthly Rate: $${job.pricing?.monthlyRate?.toFixed(2) ?? 'N/A'}</li>
        <li>Upfront Fee: $${job.pricing?.upfrontFee?.toFixed(2) ?? 'N/A'}</li>
      </ul>
      <p><strong>Please note:</strong> The pricing provided in this quote is subject to change depending on the final configuration of the ramp based on your specific needs and site requirements.</p>
      <p>By accepting this quote:</p>
      <ul>
        <li>We will contact you to schedule an installation date and time that works best for you.</li>
        <li>We will send you an invoice for the upfront fee and a rental agreement for your review and signature.</li>
        <li>Our team will conduct a final assessment to ensure the ramp configuration meets your needs and complies with safety standards.</li>
      </ul>
      <p>If you have any questions or need to discuss any specifics of the quote, please don't hesitate to contact us.</p>
      <p>If you wish to accept this quote and proceed with the ramp rental, please click the button below:</p>
      <a href="${process.env.FRONTEND_URL}/jobs/${jobId}/accept-quote" style="display: inline-block; padding: 10px 20px; color: white; background-color: green; text-decoration: none;">Accept Quote</a>
      <p>Thank you for choosing Same Day Ramps. We look forward to serving you!</p>
    `;

    console.log('Generated quote HTML:', quoteHtml);

    job.quoteHtml = quoteHtml;
    await job.save();

    console.log('Quote saved to job');

    logger.info(`Quote generated successfully for job: ${jobId}`);
    res.json({ message: 'Quote generated successfully', quoteHtml });
  } catch (error) {
    logger.error(`Error generating quote for job ${jobId}`, error);
    console.error('Detailed error:', error);
    next(error);
  }
};

export const sendGeneratedQuote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const jobId = req.params.id;

  try {
    console.log(`Attempting to send generated quote for job ${jobId}`);

    const job = await Job.findById(jobId);
    console.log('Job found:', job);

    if (!job || !job.quoteHtml) {
      logger.warn(`Quote not found for job ID: ${jobId}`);
      throw new CustomError('Quote not found', 404);
    }

    if (!job.customerInfo?.email) {
      logger.warn(`Customer email is missing for job: ${jobId}`);
      throw new CustomError('Customer email is missing', 400);
    }

    const quoteHtml = `
      <h1>Quote for Ramp Rental</h1>
      <p>Dear ${job.customerInfo.firstName} ${job.customerInfo.lastName},</p>
      <p>Here are the details of your ramp rental:</p>
      <ul>
        <li>Total Length: ${job.rampConfiguration?.totalLength ?? 'N/A'} ft</li>
        <li>Components: ${job.rampConfiguration?.components?.map(c => `${c.quantity} x ${c.type} (${c.size})`).join(', ') ?? 'N/A'}</li>
        <li>Monthly Rate: $${job.pricing?.monthlyRate?.toFixed(2) ?? 'N/A'}</li>
        <li>Upfront Fee: $${job.pricing?.upfrontFee?.toFixed(2) ?? 'N/A'}</li>
      </ul>
      <p><strong>Please note:</strong> The pricing provided in this quote is subject to change depending on the final configuration of the ramp based on your specific needs and site requirements.</p>
      <p>By accepting this quote:</p>
      <ul>
        <li>We will contact you to schedule an installation date and time that works best for you.</li>
        <li>We will send you an invoice for the upfront fee and a rental agreement for your review and signature.</li>
        <li>Our team will conduct a final assessment to ensure the ramp configuration meets your needs and complies with safety standards.</li>
      </ul>
      <p>If you have any questions or need to discuss any specifics of the quote, please don't hesitate to contact us.</p>
      <p>If you wish to accept this quote and proceed with the ramp rental, please click the button below:</p>
      <a href="${process.env.FRONTEND_URL}/jobs/${jobId}/accept-quote" style="display: inline-block; padding: 10px 20px; color: white; background-color: green; text-decoration: none;">Accept Quote</a>
      <p>Thank you for choosing Same Day Ramps. We look forward to serving you!</p>
    `;

    console.log('Sending email with quote HTML:', quoteHtml);

    await sendEmail({
      to: job.customerInfo.email,
      subject: 'Your Ramp Rental Quote - Same Day Ramps',
      html: quoteHtml,
    });

    // Update the job's quoteHtml field with the new content
    job.quoteHtml = quoteHtml;
    await job.save();

    logger.info(`Quote email sent successfully for job: ${jobId}`);
    res.json({ message: 'Quote email sent successfully' });
  } catch (error) {
    logger.error(`Error sending quote for job ${jobId}`, error);
    console.error('Detailed error:', error);
    next(error);
  }
};

export const acceptQuote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const jobId = req.params.id;

  try {
    const job = await Job.findById(jobId);

    if (!job) {
      logger.warn(`Job not found for ID: ${jobId}`);
      throw new CustomError('Job not found', 404);
    }

    // Check if the job is in a valid stage for accepting a quote
    const validStages = [JobStage.REQUESTED, JobStage.QUOTE_SENT, JobStage.QUOTE_ACCEPTED];
    if (!validStages.includes(job.stage)) {
      logger.warn(`Invalid job stage for accepting quote: ${job.stage}`);
      throw new CustomError('Quote cannot be accepted at this stage', 400);
    }

    // Update job stage if it's not already QUOTE_ACCEPTED
    if (job.stage !== JobStage.QUOTE_ACCEPTED) {
      job.stage = JobStage.QUOTE_ACCEPTED;
      await job.save();
      logger.info(`Job stage updated to QUOTE_ACCEPTED for job: ${jobId}`);
    } else {
      logger.info(`Quote already accepted for job: ${jobId}`);
    }

    // Send Pushover notification
    const pushoverToken = process.env.PUSHOVER_API_TOKEN;
    const pushoverUser = process.env.PUSHOVER_USER_KEY;

    if (!pushoverToken || !pushoverUser) {
      logger.error('Pushover credentials are missing');
    } else {
      try {
        await sendPushoverNotification({
          token: pushoverToken,
          user: pushoverUser,
          message: `Quote accepted for Job ${jobId}`,
          title: 'Quote Accepted',
        });
        logger.info(`Pushover notification sent for job: ${jobId}`);
      } catch (notificationError) {
        logger.error(`Failed to send Pushover notification for job ${jobId}`, notificationError);
        // We don't throw here to avoid failing the whole operation if just the notification fails
      }
    }

    res.json({ message: 'Quote accepted successfully' });

  } catch (error) {
    logger.error(`Error accepting quote for job ${jobId}`, error);
    next(error);
  }
};