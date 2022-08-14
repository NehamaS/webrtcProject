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
exports.ErrorBuilder = void 0;
const common_1 = require("@nestjs/common");
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const constants_1 = require("./constants");
let ErrorBuilder = class ErrorBuilder {
    constructor(logger) {
        this.logger = logger;
    }
    buildErrorResponseWsRequestDto(wsRequest, statusCode, description) {
        return this.buildErrorResponseApiGwDto(wsRequest.dto, statusCode, description);
    }
    buildErrorResponseApiGwDto(wsRequest, statusCode, description) {
        try {
            return {
                callId: wsRequest.callId,
                messageId: (0, constants_1.getMessageId)(wsRequest.messageId, wsRequest.body.service),
                source: wsRequest.source,
                destination: wsRequest.destination,
                ts: wsRequest.ts,
                type: wsRequest.type,
                body: {
                    requestMessageId: wsRequest.messageId,
                    action: wsRequest.body.action ? wsRequest.body.action : wsRequest.type,
                    statusCode: statusCode,
                    description: description
                }
            };
        }
        catch (e) {
            this.logger.error({ error: e.message, event: wsRequest });
        }
    }
};
ErrorBuilder = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mculogger_service_1.MculoggerService])
], ErrorBuilder);
exports.ErrorBuilder = ErrorBuilder;
//# sourceMappingURL=error.builder.js.map