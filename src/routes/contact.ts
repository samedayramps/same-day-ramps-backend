import express from 'express';
import { handleContactFormSubmission } from '../controllers/contactController';
import { handleValidation } from '../middlewares/validationMiddleware';

const router = express.Router();

router.post('/', handleValidation, handleContactFormSubmission);

export default router;
