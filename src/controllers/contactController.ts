import { Request, Response, NextFunction } from 'express';
import { sendPushoverNotification } from '../utils/pushoverNotification';

export async function handleContactFormSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, phone, message } = req.body;

    // Send Pushover notification
    await sendPushoverNotification({
      token: process.env.PUSHOVER_API_TOKEN || '',
      user: process.env.PUSHOVER_USER_KEY || '',
      message: `New contact form submission from ${name} (${email}, ${phone}): ${message}`,
      title: 'New Contact Form Submission',
    });

    res.status(200).json({ message: 'Contact form submitted successfully' });
  } catch (error) {
    next(error);
  }
}
