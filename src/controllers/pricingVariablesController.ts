import { Request, Response, NextFunction } from 'express';
import { PricingVariables, IPricingVariables } from '../models/PricingVariables';

export const getPricingVariables = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pricingVariables = await PricingVariables.findOne();
    if (!pricingVariables) {
      res.status(404).json({ message: 'Pricing variables not found' });
      return;
    }
    res.json(pricingVariables);
  } catch (error) {
    next(error);
  }
};

export const updatePricingVariables = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pricingVariablesData: Partial<IPricingVariables> = req.body;
    const pricingVariables = await PricingVariables.findOneAndUpdate({}, pricingVariablesData, {
      new: true,
      upsert: true,
    });
    res.json(pricingVariables);
  } catch (error) {
    next(error);
  }
};