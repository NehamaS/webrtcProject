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
exports.One2OneService = void 0;
const common_1 = require("@nestjs/common");
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const client_msg_handler_1 = require("../../client.msg.handler");
const configuration_service_1 = require("service-infrastructure/common/config/configuration.service");
let One2OneService = class One2OneService {
    constructor(clientMsgHandler, logger, config) {
        this.clientMsgHandler = clientMsgHandler;
        this.logger = logger;
        this.config = config;
        this.callIdSuffix = "";
        this.callIdSuffixLength = 0;
        this.callIdSuffix = this.config.get("one2one.callIdSuffix", "_leg2");
        this.callIdSuffixLength = -Math.abs(this.callIdSuffix.length);
        this.logger.debug("One2OneService started");
    }
    async makeCall(request) {
        this.logger.info({ msg: "clientHand ---------> makeCall - one2one", request: request });
        request.callId = this.handleCallId(request.callId);
        await this.clientMsgHandler.call(request);
    }
    async updateCall(request) {
        this.logger.info({ msg: "clientHand ---------> updateCall - one2one", request: request });
        request.callId = this.handleCallId(request.callId);
        await this.clientMsgHandler.update(request);
    }
    async endCall(request) {
        this.logger.info({ msg: "clientHand ---------> endCall - one2one", request: request });
        request.callId = this.handleCallId(request.callId);
        await this.clientMsgHandler.disconnect(request);
    }
    async createRoom(request) {
        this.logger.info({ msg: "clientHand ---------> createRoom - one2one", request: request });
    }
    async closeRoom(request) {
        this.logger.info({ msg: "clientHand ---------> closeRoom - one2one", request: request });
    }
    async ringingResponse(apiGwResponse) {
        this.logger.info({ msg: "clientHand ---------> ringingResponse - one2one", apiGwResponse: apiGwResponse });
        apiGwResponse.callId = this.handleCallId(apiGwResponse.callId);
        await this.clientMsgHandler.ring(apiGwResponse);
    }
    async connectResponse(apiGwResponse) {
        this.logger.info({ msg: "clientHand ---------> connectResponse - one2one", apiGwResponse: apiGwResponse });
        apiGwResponse.callId = this.handleCallId(apiGwResponse.callId);
        await this.clientMsgHandler.connect(apiGwResponse);
    }
    async updateResponse(apiGwResponse) {
        this.logger.info({ msg: "clientHand ---------> updateResponse - one2one", apiGwResponse: apiGwResponse });
        apiGwResponse.callId = this.handleCallId(apiGwResponse.callId);
        await this.clientMsgHandler.updateAck(apiGwResponse);
    }
    async rejectResponse(apiGwResponse) {
        this.logger.info({ msg: "clientHand ---------> rejectResponse - one2one", apiGwResponse: apiGwResponse });
        apiGwResponse.callId = this.handleCallId(apiGwResponse.callId);
        await this.clientMsgHandler.reject(apiGwResponse);
    }
    async updateRejectResponse(apiGwResponse) {
        this.logger.info({ msg: "clientHand ---------> updateRejectResponse - one2one", apiGwResponse: apiGwResponse });
        apiGwResponse.callId = this.handleCallId(apiGwResponse.callId);
        await this.clientMsgHandler.updateAck(apiGwResponse);
    }
    async endCallResponse(apiGwResponse) {
        this.logger.info({ msg: "clientHand ---------> endCallResponse - one2one", apiGwResponse: apiGwResponse });
        apiGwResponse.callId = this.handleCallId(apiGwResponse.callId);
        await this.clientMsgHandler.endCallAck(apiGwResponse);
    }
    handleCallId(callId) {
        let callIdValue;
        if (callId.endsWith(this.callIdSuffix)) {
            callIdValue = callId.slice(0, this.callIdSuffixLength);
        }
        else {
            callIdValue = callId + this.callIdSuffix;
        }
        this.logger.info("callIdValue " + callIdValue);
        return callIdValue;
    }
    async addUser(request) {
        this.logger.info({ msg: "One2OneService: addUser", request: request });
    }
    updateUser(request) {
        this.logger.info({ msg: "One2OneService: updateUser", request: request });
    }
    disconnectUser(request) {
        this.logger.info({ msg: "One2OneService: disconnectUser", request: request });
    }
    async cleanRoom(request) {
        this.logger.info({ msg: "One2OneService: cleanRoom", request: request });
    }
};
One2OneService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => client_msg_handler_1.ClientMsgHandler))),
    __metadata("design:paramtypes", [client_msg_handler_1.ClientMsgHandler,
        mculogger_service_1.MculoggerService,
        configuration_service_1.ConfigurationService])
], One2OneService);
exports.One2OneService = One2OneService;
//# sourceMappingURL=one2one.service.js.map