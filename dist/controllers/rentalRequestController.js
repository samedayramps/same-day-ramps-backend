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
exports.deleteRentalRequest = exports.archiveRentalRequest = exports.createRentalRequest = exports.getRentalRequestById = exports.getAllRentalRequests = void 0;
const RentalRequest_1 = require("../models/RentalRequest");
const getAllRentalRequests = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rentalRequests = yield RentalRequest_1.RentalRequest.find();
        res.json(rentalRequests);
    }
    catch (error) {
        next(error);
    }
});
exports.getAllRentalRequests = getAllRentalRequests;
const getRentalRequestById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rentalRequest = yield RentalRequest_1.RentalRequest.findById(req.params.id);
        if (!rentalRequest) {
            res.status(404).json({ message: 'Rental request not found' });
            return;
        }
        res.json(rentalRequest);
    }
    catch (error) {
        next(error);
    }
});
exports.getRentalRequestById = getRentalRequestById;
const createRentalRequest = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rentalRequestData = req.body;
        const rentalRequest = new RentalRequest_1.RentalRequest(rentalRequestData);
        yield rentalRequest.save();
        res.status(201).json(rentalRequest);
    }
    catch (error) {
        next(error);
    }
});
exports.createRentalRequest = createRentalRequest;
const archiveRentalRequest = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rentalRequest = yield RentalRequest_1.RentalRequest.findByIdAndUpdate(req.params.id, { status: 'archived' }, { new: true });
        if (!rentalRequest) {
            res.status(404).json({ message: 'Rental request not found' });
            return;
        }
        res.json(rentalRequest);
    }
    catch (error) {
        next(error);
    }
});
exports.archiveRentalRequest = archiveRentalRequest;
const deleteRentalRequest = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rentalRequest = yield RentalRequest_1.RentalRequest.findByIdAndDelete(req.params.id);
        if (!rentalRequest) {
            res.status(404).json({ message: 'Rental request not found' });
            return;
        }
        res.json({ message: 'Rental request deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteRentalRequest = deleteRentalRequest;
