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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendJobCompletionEmail = exports.sendRemovalConfirmationEmail = exports.sendInstallationConfirmationEmail = exports.sendQuoteEmail = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const transporter = nodemailer_1.default.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const sendEmail = (_a) => __awaiter(void 0, [_a], void 0, function* ({ to, subject, body }) {
    const mailOptions = {
        from: process.env.EMAIL_FROM, // Sender address
        to,
        subject,
        html: body,
    };
    yield transporter.sendMail(mailOptions);
});
exports.sendEmail = sendEmail;
const sendQuoteEmail = (jobId, email) => __awaiter(void 0, void 0, void 0, function* () {
    const quoteLink = `http://your-frontend.com/jobs/${jobId}/quote`;
    const subject = 'Your Ramp Rental Quote';
    const body = `
    <p>Dear Customer,</p>
    <p>Please review your ramp rental quote <a href="${quoteLink}">here</a>.</p>
    <p>Thank you!</p>
  `;
    yield (0, exports.sendEmail)({ to: email, subject, body });
});
exports.sendQuoteEmail = sendQuoteEmail;
const sendInstallationConfirmationEmail = (jobId, email, installationSchedule) => __awaiter(void 0, void 0, void 0, function* () {
    const subject = 'Your Ramp Installation Confirmation';
    const body = `
      <p>Dear Customer,</p>
      <p>Your ramp installation has been scheduled for ${installationSchedule.date.toLocaleDateString()} during the ${installationSchedule.timeSlot} time slot.</p>
      <p>If you need to reschedule or have any questions, please contact us.</p>
      <p>Thank you for choosing Same Day Ramps!</p>
    `;
    yield (0, exports.sendEmail)({ to: email, subject, body });
});
exports.sendInstallationConfirmationEmail = sendInstallationConfirmationEmail;
const sendRemovalConfirmationEmail = (jobId, email, removalSchedule, removalCost) => __awaiter(void 0, void 0, void 0, function* () {
    const subject = 'Your Ramp Removal Confirmation';
    const body = `
      <p>Dear Customer,</p>
      <p>Your ramp removal has been scheduled for ${removalSchedule.date.toLocaleDateString()} during the ${removalSchedule.timeSlot} time slot.</p>
      <p>The estimated removal cost is $${removalCost.toFixed(2)}. This amount will be charged to your account.</p>
      <p>If you need to reschedule or have any questions, please contact us.</p>
      <p>Thank you for choosing Same Day Ramps!</p>
    `;
    yield (0, exports.sendEmail)({ to: email, subject, body });
});
exports.sendRemovalConfirmationEmail = sendRemovalConfirmationEmail;
const sendJobCompletionEmail = (jobId, email) => __awaiter(void 0, void 0, void 0, function* () {
    const subject = 'Your Ramp Rental Service is Complete';
    const body = `
      <p>Dear Customer,</p>
      <p>Your ramp rental service has been completed. The ramp has been successfully removed from your property.</p>
      <p>We hope our service met your expectations. If you have any feedback or questions, please don't hesitate to contact us.</p>
      <p>Thank you for choosing Same Day Ramps. We appreciate your business!</p>
    `;
    yield (0, exports.sendEmail)({ to: email, subject, body });
});
exports.sendJobCompletionEmail = sendJobCompletionEmail;
