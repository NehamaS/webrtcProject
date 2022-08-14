"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccesslogService = void 0;
const common_1 = require("@nestjs/common");
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const configuration_service_1 = require("service-infrastructure/common/config/configuration.service");
let AccesslogService = class AccesslogService {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;
    }
    use(req, res, next) {
        res.on('finish', () => {
            this.logger.info({
                Path: req.path,
                Request: { headers: req.headers, body: req.body, ctx: req["context"] },
                Response: { StatusCode: res.statusCode, body: res.statusMessage }
            });
        });
        next();
    }
};
AccesslogService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(mculogger_service_1.MculoggerService)),
    __param(1, (0, common_1.Inject)(mculogger_service_1.MculoggerService)),
    __metadata("design:paramtypes", [mculogger_service_1.MculoggerService,
        configuration_service_1.ConfigurationService])
], AccesslogService);
exports.AccesslogService = AccesslogService;
//# sourceMappingURL=accesslog.service.js.map