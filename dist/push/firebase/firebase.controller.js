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
exports.FirebaseController = void 0;
const common_1 = require("@nestjs/common");
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const firebase_service_1 = require("./firebase.service");
let FirebaseController = class FirebaseController {
    constructor(logger, firebaseService) {
        this.logger = logger;
        this.firebaseService = firebaseService;
    }
    async push(event) {
        this.logger.info({ func: 'actions', body: event });
        await this.firebaseService.sendNotification(event.callerUserId, event.userData);
        return true;
    }
};
__decorate([
    (0, common_1.Post)('/push'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FirebaseController.prototype, "push", null);
FirebaseController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [mculogger_service_1.MculoggerService,
        firebase_service_1.FirebaseService])
], FirebaseController);
exports.FirebaseController = FirebaseController;
//# sourceMappingURL=firebase.controller.js.map