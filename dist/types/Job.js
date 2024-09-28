"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobStage = void 0;
var JobStage;
(function (JobStage) {
    JobStage["REQUESTED"] = "REQUESTED";
    JobStage["CONTACTED"] = "CONTACTED";
    JobStage["QUOTE_SENT"] = "QUOTE_SENT";
    JobStage["QUOTE_ACCEPTED"] = "QUOTE_ACCEPTED";
    JobStage["PAID"] = "PAID";
    JobStage["SCHEDULED"] = "SCHEDULED";
    JobStage["INSTALLED"] = "INSTALLED";
    JobStage["REMOVAL_SCHEDULED"] = "REMOVAL_SCHEDULED";
    JobStage["REMOVED"] = "REMOVED";
    JobStage["COMPLETED"] = "COMPLETED";
})(JobStage || (exports.JobStage = JobStage = {}));
