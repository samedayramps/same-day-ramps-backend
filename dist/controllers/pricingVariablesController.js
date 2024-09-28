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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePricingVariables = exports.getPricingVariables = void 0;
const PricingVariables_1 = require("../models/PricingVariables");
const getPricingVariables = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pricingVariables = yield PricingVariables_1.PricingVariables.findOne();
        if (!pricingVariables) {
            res.status(404).json({ message: 'Pricing variables not found' });
            return;
        }
        res.json(pricingVariables);
    }
    catch (error) {
        next(error);
    }
});
exports.getPricingVariables = getPricingVariables;
const updatePricingVariables = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pricingVariablesData = req.body;
        const pricingVariables = yield PricingVariables_1.PricingVariables.findOneAndUpdate({}, pricingVariablesData, {
            new: true,
            upsert: true,
        });
        res.json(pricingVariables);
    }
    catch (error) {
        next(error);
    }
});
exports.updatePricingVariables = updatePricingVariables;
