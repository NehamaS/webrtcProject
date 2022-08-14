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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushNotificationService = void 0;
const common_1 = require("@nestjs/common");
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const firebase_service_1 = require("./firebase/firebase.service");
const configuration_service_1 = require("service-infrastructure/common/config/configuration.service");
let PushNotificationService = class PushNotificationService {
    constructor(logger, config, fireBaseService) {
        this.logger = logger;
        this.config = config;
        this.fireBaseService = fireBaseService;
    }
    async sendNotification(callerUserId, userData) {
        return await this.fireBaseService.sendNotification(callerUserId, userData);
    }
};
PushNotificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mculogger_service_1.MculoggerService,
        configuration_service_1.ConfigurationService,
        firebase_service_1.FirebaseService])
], PushNotificationService);
exports.PushNotificationService = PushNotificationService;
//# sourceMappingURL=push.notification.service.js.map