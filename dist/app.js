"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const jobs_1 = __importDefault(require("./routes/jobs"));
const rentalRequests_1 = __importDefault(require("./routes/rentalRequests"));
const pricingVariables_1 = __importDefault(require("./routes/pricingVariables"));
const errorHandler_1 = require("./middlewares/errorHandler");
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
// Swagger setup
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Same Day Ramps API',
            version: '1.0.0',
        },
    },
    apis: ['./routes/*.ts'], // Path to the API docs
};
const specs = (0, swagger_jsdoc_1.default)(options);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs));
// Routes
app.use('/api/jobs', jobs_1.default);
app.use('/api/rental-requests', rentalRequests_1.default);
app.use('/api/pricing-variables', pricingVariables_1.default);
// Error Handling
app.use(errorHandler_1.errorHandler);
exports.default = app;
