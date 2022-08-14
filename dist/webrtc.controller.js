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
exports.WebrtcController = void 0;
const common_1 = require("@nestjs/common");
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const client_msg_handler_1 = require("./client.msg.handler");
const ws_request_dto_1 = require("./dto/ws.request.dto");
const validation_pipe_1 = require("./common/pipes/validation.pipe");
const jwt_auth_guard_1 = require("./auth/guards/jwt.auth.guard");
const ws_dispatcher_1 = require("./ws.dispatcher");
const MAX_LOOP = 15;
let WebrtcController = class WebrtcController {
    constructor(logger, msgHandler, wsDispatcher) {
        this.logger = logger;
        this.msgHandler = msgHandler;
        this.wsDispatcher = wsDispatcher;
    }
    getName() {
        this.logger.debug({ ServiceName: "WebRTC Gateway" });
        return "WebRTC Gateway";
    }
    async actions(event) {
        this.logger.debug({ func: 'actions', body: event });
        await this.msgHandler.handleMsg(event);
        let msg = {
            source: event.dto.source,
            destination: event.dto.destination,
            callId: event.dto.callId,
            messageId: event.dto.messageId,
            action: event.dto.body.action ? event.dto.body.action : event.dto.type
        };
        return msg;
    }
    async connect(body) {
        this.logger.debug({ action: "connect", body: body });
        return true;
    }
    async disconnect(body) {
        this.logger.debug({ action: "disconnect", body: body });
        return await this.msgHandler.wsDisconnect(body.connectionId);
    }
};
__decorate([
    (0, common_1.Get)('/name'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WebrtcController.prototype, "getName", null);
__decorate([
    (0, common_1.Post)('/actions'),
    (0, common_1.UsePipes)(validation_pipe_1.ValidationPipe),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ws_request_dto_1.WsRequestDto]),
    __metadata("design:returntype", Promise)
], WebrtcController.prototype, "actions", null);
__decorate([
    (0, common_1.Post)('connect'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ws_request_dto_1.WsRequestDto]),
    __metadata("design:returntype", Promise)
], WebrtcController.prototype, "connect", null);
__decorate([
    (0, common_1.Post)('disconnect'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ws_request_dto_1.WsRequestDto]),
    __metadata("design:returntype", Promise)
], WebrtcController.prototype, "disconnect", null);
WebrtcController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [mculogger_service_1.MculoggerService,
        client_msg_handler_1.ClientMsgHandler,
        ws_dispatcher_1.WsDispatcher])
], WebrtcController);
exports.WebrtcController = WebrtcController;
//# sourceMappingURL=webrtc.controller.js.map