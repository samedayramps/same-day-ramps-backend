import express from 'express';
import * as pricingVariablesController from '../controllers/pricingVariablesController';
import { Request, Response, NextFunction } from 'express';

const router = express.Router();

type ControllerFunction = (req: Request, res: Response, next: NextFunction) => Promise<void>;

const asyncHandler = (fn: ControllerFunction) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/', asyncHandler(pricingVariablesController.getPricingVariables));
router.put('/', asyncHandler(pricingVariablesController.updatePricingVariables));

export default router;