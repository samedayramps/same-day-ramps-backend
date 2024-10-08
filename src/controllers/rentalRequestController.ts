// src/controllers/rentalRequestController.ts

import { Request, Response, NextFunction } from 'express';
import { RentalRequest, IRentalRequest } from '../models/RentalRequest';
import { Job } from '../models/Job';
import { SalesStage } from '../types/RentalRequest';
import { JobStage } from '../types/Job';
import { sendPushoverNotification } from '../utils/pushoverNotification';

export const getAllRentalRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rentalRequests = await RentalRequest.find();
    res.json(rentalRequests);
  } catch (error) {
    next(error);
  }
};

export const getRentalRequestById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rentalRequest = await RentalRequest.findById(req.params.id);
    if (!rentalRequest) {
      res.status(404).json({ message: 'Rental request not found' });
      return;
    }
    res.json(rentalRequest);
  } catch (error) {
    next(error);
  }
};

export const createRentalRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rentalRequestData: Partial<IRentalRequest> = req.body;
    const rentalRequest = new RentalRequest(rentalRequestData);
    await rentalRequest.save();

    // Send Pushover notification
    const notificationMessage = `
New Rental Request:
Name: ${rentalRequest.customerInfo.firstName} ${rentalRequest.customerInfo.lastName}
Email: ${rentalRequest.customerInfo.email}
Phone: ${rentalRequest.customerInfo.phone}
Address: ${rentalRequest.installAddress}
Ramp Length: ${rentalRequest.rampDetails.rampLength || 'Unknown'}
Rental Duration: ${rentalRequest.rampDetails.rentalDuration || 'Unknown'}
Install Timeframe: ${rentalRequest.rampDetails.installTimeframe}
    `.trim();

    await sendPushoverNotification({
      token: process.env.PUSHOVER_API_TOKEN || '',
      user: process.env.PUSHOVER_USER_KEY || '',
      message: notificationMessage,
      title: 'New Rental Request',
    });

    res.status(201).json(rentalRequest);
  } catch (error) {
    next(error);
  }
};

export const archiveRentalRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rentalRequest = await RentalRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'archived' },
      { new: true }
    );
    if (!rentalRequest) {
      res.status(404).json({ message: 'Rental request not found' });
      return;
    }
    res.json(rentalRequest);
  } catch (error) {
    next(error);
  }
};

export const deleteRentalRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rentalRequest = await RentalRequest.findByIdAndDelete(req.params.id);
    if (!rentalRequest) {
      res.status(404).json({ message: 'Rental request not found' });
      return;
    }
    res.json({ message: 'Rental request deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Function to create a job from a rental request
export const createJobFromRentalRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rentalRequestId = req.params.id;

    // Fetch the rental request
    const rentalRequest = await RentalRequest.findById(rentalRequestId);
    if (!rentalRequest) {
      res.status(404).json({ message: 'Rental request not found' });
      return;
    }

    // Check if a job has already been created from this rental request
    if (rentalRequest.jobId) {
      res.status(400).json({ message: 'A job has already been created from this rental request' });
      return;
    }

    // Map rental request data to job data
    const jobData = {
      stage: JobStage.REQUESTED,
      customerInfo: {
        ...rentalRequest.customerInfo,
        installAddress: rentalRequest.installAddress,
        mobilityAids: rentalRequest.rampDetails.mobilityAids,
      },
      rampConfiguration: {
        rentalDuration: rentalRequest.rampDetails.rentalDuration || 1,
        totalLength: rentalRequest.rampDetails.rampLength || 0,
        components: [],
      },
    };

    // Create the new job
    const newJob = new Job(jobData);
    await newJob.save();

    // Update the rental request to reference the new job
    rentalRequest.jobId = newJob._id;
    rentalRequest.salesStage = SalesStage.JOB_CREATED;
    rentalRequest.status = 'job created'; // Update the status here
    await rentalRequest.save();

    res.status(201).json(newJob);
  } catch (error) {
    console.error('Error creating job from rental request:', error);
    next(error);
  }
};