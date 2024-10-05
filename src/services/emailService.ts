import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string; // Change 'body' to 'html'
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    console.log('Attempting to send email:', { to, subject });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    };

    console.log('Mail options:', mailOptions);

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error: unknown) {
    console.error('Error sending email:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to send email: ${error.message}`);
    } else {
      throw new Error('Failed to send email: Unknown error');
    }
  }
};

export const sendQuoteEmail = async (jobId: string, email: string) => {
  const quoteLink = `http://your-frontend.com/jobs/${jobId}/quote`;
  const subject = 'Your Ramp Rental Quote';
  const html = `
    <p>Dear Customer,</p>
    <p>Please review your ramp rental quote <a href="${quoteLink}">here</a>.</p>
    <p>Thank you!</p>
  `;
  await sendEmail({ to: email, subject, html });
};

export const sendInstallationConfirmationEmail = async (jobId: string, email: string, installationSchedule: { date: Date; timeSlot: string }) => {
    const subject = 'Your Ramp Installation Confirmation';
    const html = `
      <p>Dear Customer,</p>
      <p>Your ramp installation has been scheduled for ${installationSchedule.date.toLocaleDateString()} during the ${installationSchedule.timeSlot} time slot.</p>
      <p>If you need to reschedule or have any questions, please contact us.</p>
      <p>Thank you for choosing Same Day Ramps!</p>
    `;
    await sendEmail({ to: email, subject, html });
  };
  
export const sendRemovalConfirmationEmail = async (jobId: string, email: string, removalSchedule: { date: Date; timeSlot: string }) => {
  const subject = 'Your Ramp Removal Confirmation';
  const html = `
    <p>Dear Customer,</p>
    <p>Your ramp removal has been scheduled for ${removalSchedule.date.toLocaleDateString()} during the ${removalSchedule.timeSlot} time slot.</p>
    <p>If you need to reschedule or have any questions, please contact us.</p>
    <p>Thank you for choosing Same Day Ramps!</p>
  `;
  await sendEmail({ to: email, subject, html });
};

export const sendJobCompletionEmail = async (jobId: string, email: string) => {
  const subject = 'Your Ramp Rental Service is Complete';
  const html = `
    <p>Dear Customer,</p>
    <p>Your ramp rental service has been completed. The ramp has been successfully removed from your property.</p>
    <p>We hope our service met your expectations. If you have any feedback or questions, please don't hesitate to contact us.</p>
    <p>Thank you for choosing Same Day Ramps. We appreciate your business!</p>
  `;
  await sendEmail({ to: email, subject, html });
};