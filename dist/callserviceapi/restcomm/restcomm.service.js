"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestcommService = void 0;
const common_1 = require("@nestjs/common");
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const message_factory_1 = require("../sip/massagefactory/message.factory");
const sip_service_1 = require("../sip/sip.service");
const restcomm_db_service_1 = require("../../common/db/restcomm.db.service");
const client_msg_handler_1 = require("../../client.msg.handler");
const __ = __importStar(require("lodash"));
const sip_utils_1 = require("../sip/common/sip.utils");
const constants_1 = require("../../common/constants");
const db_service_1 = require("../../common/db/db.service");
let RestcommService = class RestcommService {
    constructor(sipService, clientMsgHandler, logger, messageFactory, restcommDbService, dbService, utils) {
        this.sipService = sipService;
        this.clientMsgHandler = clientMsgHandler;
        this.logger = logger;
        this.messageFactory = messageFactory;
        this.restcommDbService = restcommDbService;
        this.dbService = dbService;
        this.utils = utils;
        this.logger.debug("RestComService started");
    }
    async makeCall(request) {
        this.logger.info({ msg: "clientHand ---------> makeCall", request: request });
        let inviteReq = this.messageFactory.createInvite(request);
        this.logger.info({ msg: "inviteReq", inviteReq: inviteReq });
        let response;
        const self = this;
        let sipSession = {
            callId: inviteReq.headers['call-id'],
            from: inviteReq.headers.from,
            to: inviteReq.headers.to,
            contact: inviteReq.headers.contact,
            destContact: null,
            seqNumber: inviteReq.headers.cseq.seq,
            meetingId: request.meetingId,
            service: request.service
        };
        self.logger.info({ msg: "setUserSession before response", sipSession: sipSession });
        await self.restcommDbService.setUserSession(sipSession);
        await this.restcommDbService.setSipRequest(inviteReq.headers["call-id"], inviteReq.headers.cseq.seq.toString(), inviteReq);
        self.sipService.send(inviteReq, async (err, sipResponse) => {
            if (!sipResponse) {
                response = self.buildResponse(request, null, err);
                self.clientMsgHandler.reject(response);
                return;
            }
            if (sipResponse && sipResponse.status < 200) {
                response = self.buildResponse(request, sipResponse);
                self.logger.info({ msg: "clientHand <--------- ring", response: response });
                self.clientMsgHandler.ring(response);
            }
            else {
                response = self.buildResponse(request, sipResponse);
                let ackReq;
                if (sipResponse && sipResponse.status < 400) {
                    sipSession.to = sipResponse.headers.to;
                    sipSession.destContact = self.getContact(sipResponse.headers.contact, sipResponse.headers.to.uri);
                    if (sipResponse.headers[message_factory_1.HEADER_X_RESTCOMM_CALLSID]) {
                        sipSession.callSid = sipResponse.headers[message_factory_1.HEADER_X_RESTCOMM_CALLSID];
                    }
                    self.logger.info({ msg: "setUserSession after final response", sipSession: sipSession });
                    await self.restcommDbService.setUserSession(sipSession);
                    await this.restcommDbService.deleteSipRequest(sipResponse.headers["call-id"], sipResponse.headers.cseq.seq.toString());
                    self.logger.info({ msg: "clientHand <--------- connect", response: response });
                    self.clientMsgHandler.connect(response);
                    ackReq = self.messageFactory.createMessage(message_factory_1.METHOD_ACK, sipSession);
                    self.sipService.send(ackReq, function () {
                    });
                }
                else {
                    self.logger.info({ msg: "clientHand <--------- reject", response: response });
                    if (sipResponse.status === constants_1.API_GW_REQUEST_TERMINATE.CODE) {
                        return;
                    }
                    else {
                        self.clientMsgHandler.reject(response);
                    }
                }
                return;
            }
        });
    }
    async updateCall(request) {
        this.logger.info({ msg: "clientHand ---------> updateCall", request: request });
        let response;
        let userSession = await this.restcommDbService.getUserSession(request.callId);
        if (userSession) {
            userSession.seqNumber++;
            await this.restcommDbService.setUserSession(userSession);
            let reInviteReq = this.messageFactory.createReInvite(userSession, request.sdp);
            this.logger.info({ msg: "reInviteReq", reInviteReq: reInviteReq });
            const self = this;
            self.sipService.send(reInviteReq, function (err, sipResponse) {
                if (sipResponse && sipResponse.status) {
                    response = self.buildResponse(request, sipResponse);
                    if (sipResponse.status == 180) {
                        self.logger.info({ msg: "received 180 on reInvite" });
                    }
                    else {
                        self.logger.info({ msg: "clientHand <--------- updateAck", response: response });
                        self.clientMsgHandler.updateAck(response);
                        let ackReq;
                        if (sipResponse.status == 200) {
                            ackReq = self.messageFactory.createMessage(message_factory_1.METHOD_ACK, userSession);
                            self.sipService.send(ackReq, function () {
                            });
                            return;
                        }
                    }
                }
                else {
                    response = self.buildResponse(request);
                    response.status = {
                        code: "500",
                        desc: "Response for ReInvite was not received"
                    };
                    self.logger.info({ msg: "clientHand <--------- updateAck", response: response });
                    self.clientMsgHandler.updateAck(response);
                    return;
                }
            });
        }
        else {
            response = this.buildResponse(request);
            response.status = {
                code: "500",
                desc: "Failed to get sipUserSession from DB"
            };
            this.logger.info({ msg: "clientHand <--------- updateAck", response: response });
            this.clientMsgHandler.updateAck(response);
            return;
        }
    }
    async endCall(request) {
        this.logger.info({ msg: "clientHand ---------> endCall", request: request });
        let inviteReq = await this.restcommDbService.getSipRequest(request.callId, "1");
        if (inviteReq && inviteReq.method === 'INVITE') {
            await this.restcommDbService.deleteSipRequest(inviteReq.headers["call-id"], inviteReq.headers.cseq.seq.toString());
            await this.sipService.cancelFlow(inviteReq);
            return;
        }
        let response;
        let userSession = await this.restcommDbService.getUserSession(request.callId);
        if (userSession) {
            userSession.seqNumber++;
            this.logger.info({ msg: "get userSession", userSession: userSession });
            let byeReq = this.messageFactory.createMessage(message_factory_1.METHOD_BYE, userSession);
            this.logger.info({ msg: "byeReq", byeReq: byeReq });
            const self = this;
            self.sipService.send(byeReq, (err, sipResponse) => {
                if (sipResponse && sipResponse.status) {
                    response = self.buildResponse(request, sipResponse);
                }
                else {
                    response = self.buildResponse(request);
                    response.status = {
                        code: "500",
                        desc: "Response for BYE was not received"
                    };
                }
                self.logger.info({ msg: "clientHand <--------- endCallAck", response: response });
                self.clientMsgHandler.endCallAck(response);
                self.restcommDbService.deleteUserSession(request.callId);
            });
        }
        else {
            response = this.buildResponse(request);
            response.status = {
                code: "500",
                desc: "Failed to get sipUserSession from DB"
            };
            this.logger.info({ msg: "clientHand <--------- endCallAck", response: response });
            this.clientMsgHandler.endCallAck(response);
            this.restcommDbService.deleteUserSession(request.callId);
        }
    }
    async createRoom(request) {
        this.logger.info({ msg: "clientHand ---------> createRoom", request: request });
    }
    async closeRoom(request) {
        this.logger.info({ msg: "clientHand ---------> closeRoom", request: request });
    }
    async addUser(request) {
        this.logger.info({ msg: "RestComService: addUser", request: request });
        let requestDto = this.buildRequest(request);
        requestDto.reason = constants_1.JOIN_REASON;
        let userSession = this.buildSipSession(request, false);
        userSession.seqNumber = 0;
        await this.restcommDbService.setUserSession(userSession);
        await this.restcommDbService.setSipRequest(requestDto.callId, requestDto.sequence.toString(), request);
        this.logger.info({ msg: "clientHand <--------- call", requestDto: requestDto });
        await this.clientMsgHandler.call(requestDto);
    }
    updateUser(request) {
        this.logger.info({ msg: "RestComService: updateUser", request: request });
        let requestDto = this.buildRequest(request);
        requestDto.reason = constants_1.RECONNECT_REASON;
        this.restcommDbService.setSipRequest(requestDto.callId, requestDto.sequence.toString(), request);
        this.logger.info({ msg: "clientHand <--------- update", requestDto: requestDto });
        this.clientMsgHandler.update(requestDto);
    }
    async disconnectUser(request) {
        this.logger.info({ msg: "disconnectUser", request: request });
        let requestDto = this.buildRequest(request);
        if (request.method === 'BYE') {
            Promise.all([this.restcommDbService.deleteUserSession(request.headers['call-id']), this.restcommDbService.deleteSipRequest(request.headers['call-id'], request.headers.cseq.seq.toString())])
                .catch(e => {
                this.logger.error({ action: 'disconnectUser', error: e.message ? e.message : e, request: request });
            });
        }
        this.logger.info({ msg: "clientHand <--------- disconnect", requestDto: requestDto });
        await this.clientMsgHandler.disconnect(requestDto);
    }
    async cleanRoom(request) {
        this.logger.info({ msg: "RestComService: cleanRoom", request: request });
    }
    async ringingResponse(apiGwResponse) {
        this.logger.info({ msg: "RestComService: ringingResponse" });
        this.logger.info({ msg: "clientHand ---------> ringingResponse", apiGwResponse: apiGwResponse });
        let inviteRequest = await this.restcommDbService.getSipRequest(apiGwResponse.callId, apiGwResponse.sequence.toString());
        if (inviteRequest) {
            let sipRsp = await this.sipService.buildAndSendResponse(inviteRequest, apiGwResponse);
            let userSession = await this.restcommDbService.getUserSession(apiGwResponse.callId);
            if (userSession) {
                userSession.to = sipRsp.headers.to;
                await this.restcommDbService.setUserSession(userSession);
            }
        }
        else {
            this.logger.error({
                msg: "ringingResponse failed get inviteRequest",
                callId: apiGwResponse.callId,
                sequence: apiGwResponse.sequence
            });
        }
    }
    sendEndCall(request) {
        this.logger.info({ msg: "RestComService: sendEndCall" });
        this.logger.info({ msg: "******************** RestComService: sendEndCall", method: request.method });
        if (request.method && request.method == "call") {
            let response = this.buildResponse(request);
            response.status = {
                code: "500",
                desc: "Failed to get Sip Request from DB"
            };
            this.logger.info({ msg: "clientHand <--------- endCall", response: response });
            this.clientMsgHandler.disconnect(response);
            this.restcommDbService.deleteUserSession(request.callId);
        }
    }
    async connectResponse(apiGwResponse) {
        this.logger.info({ msg: "RestComService: connectResponse" });
        this.logger.info({ msg: "clientHand ---------> connectResponse", apiGwResponse: apiGwResponse });
        await this.sendAnswer(apiGwResponse);
    }
    async updateResponse(apiGwResponse) {
        this.logger.info({ msg: "RestComService: updateResponse" });
        this.logger.info({ msg: "clientHand ---------> updateResponse", apiGwResponse: apiGwResponse });
        await this.sendAnswer(apiGwResponse);
    }
    async sendAnswer(apiGwResponse) {
        let inviteRequest = await this.restcommDbService.getSipRequest(apiGwResponse.callId, apiGwResponse.sequence.toString());
        if (inviteRequest) {
            let sipRsp = await this.sipService.buildAndSendResponse(inviteRequest, apiGwResponse);
            let userSession = await this.restcommDbService.getUserSession(apiGwResponse.callId);
            if (userSession) {
                userSession.from = sipRsp.headers.to;
                await this.restcommDbService.setUserSession(userSession);
            }
        }
        else {
            this.logger.error({
                msg: "connectResponse failed get inviteRequest",
                callId: apiGwResponse.callId,
                sequence: apiGwResponse.sequence
            });
            this.sendEndCall(apiGwResponse);
        }
        await this.restcommDbService.deleteSipRequest(apiGwResponse.callId, apiGwResponse.sequence.toString());
    }
    async rejectResponse(apiGwResponse) {
        this.logger.info({ msg: "RestComService: rejectResponse" });
        this.logger.info({ msg: "clientHand ---------> rejectResponse", apiGwResponse: apiGwResponse });
        await this.handleRejectResponse(apiGwResponse);
    }
    async updateRejectResponse(apiGwResponse) {
        this.logger.info({ msg: "RestComService: updateRejectResponse" });
        this.logger.info({ msg: "clientHand ---------> updateRejectResponse", apiGwResponse: apiGwResponse });
        await this.handleRejectResponse(apiGwResponse);
    }
    async handleRejectResponse(apiGwResponse) {
        let inviteRequest = await this.restcommDbService.getSipRequest(apiGwResponse.callId, apiGwResponse.sequence.toString());
        if (inviteRequest) {
            await this.sipService.buildAndSendResponse(inviteRequest, apiGwResponse);
            this.restcommDbService.deleteSipRequest(apiGwResponse.callId, apiGwResponse.sequence.toString());
            if (!__.has(inviteRequest, 'headers.to.params.tag')) {
                this.restcommDbService.deleteUserSession(apiGwResponse.callId);
            }
        }
        else {
            this.logger.error({
                msg: "rejectResponse failed get inviteRequest",
                callId: apiGwResponse.callId,
                sequence: apiGwResponse.sequence
            });
            this.sendEndCall(apiGwResponse);
        }
    }
    async endCallResponse(apiGwResponse) {
        this.logger.info({ msg: "RestComService: endCallResponse", response: apiGwResponse });
        this.logger.info({ msg: "clientHand ---------> endCallResponse", apiGwResponse: apiGwResponse });
        let byeRequest = await this.restcommDbService.getSipRequest(apiGwResponse.callId, apiGwResponse.sequence.toString());
        if (byeRequest) {
            let sipRsp = await this.sipService.buildAndSendResponse(byeRequest, apiGwResponse);
            this.restcommDbService.deleteSipRequest(apiGwResponse.callId, apiGwResponse.sequence.toString());
            this.restcommDbService.deleteUserSession(apiGwResponse.callId);
            if (sipRsp && sipRsp.status == 487) {
                await this.restcommDbService.deleteSipRequest(byeRequest.headers['call-id'], byeRequest.headers.cseq.seq.toString());
            }
        }
        else {
            this.logger.error({
                msg: "endCallResponse failed get byeRequest",
                callId: apiGwResponse.callId,
                sequence: apiGwResponse.sequence
            });
            this.restcommDbService.deleteUserSession(apiGwResponse.callId);
        }
    }
    buildResponse(request, sipResponse, status) {
        let response = {
            caller: request.caller,
            callee: request.callee,
            callId: request.callId,
            sequence: request.sequence,
            accessToken: request.accessToken
        };
        if (request.service) {
            response.service = request.service;
        }
        if (request.meetingId) {
            response.meetingId = request.meetingId;
        }
        if (sipResponse && sipResponse.content) {
            response.sdp = sipResponse.content;
        }
        if (sipResponse || status) {
            let errorDesc = sipResponse ? sipResponse : status;
            let statusValue = {
                code: errorDesc.status.toString(),
                desc: errorDesc.reason
            };
            response.status = statusValue;
        }
        this.logger.info({ msg: "buildResponse: ApiGwFormatDTO", response: response });
        return response;
    }
    buildRequest(request) {
        let apiGwRequest = {
            callee: this.utils.getDomain(request.headers.to.uri),
            caller: (request.method === "BYE" || request.method === "INVITE" || request.method === "CANCEL") ? this.buildCaller(request.uri, request.headers.from.uri) : this.utils.getDomain(request.headers.from.uri),
            callId: request.headers["call-id"],
            sequence: request.headers.cseq.seq ? request.headers.cseq.seq.toString() : undefined,
            service: request.headers["x-service-type"] ? request.headers["x-service-type"] : "A2P"
        };
        if (request && request.content) {
            apiGwRequest.sdp = request.content;
        }
        if (request && request.headers["x-meetingid"]) {
            apiGwRequest.meetingId = request.headers["x-meetingid"];
        }
        else {
            apiGwRequest.meetingId = request.headers["call-id"];
        }
        return apiGwRequest;
    }
    buildCaller(rUri, toUri) {
        let reqUri = this.utils.getUserPart(rUri);
        let toDomain = toUri.includes("@") ? toUri.split("@")[1] : this.utils.getDomain(toUri);
        return `${reqUri}@${toDomain}`;
    }
    buildSipSession(sipMessage, callFromClient) {
        let sipSession = {
            callId: sipMessage.headers['call-id'],
            from: callFromClient ? sipMessage.headers.from : sipMessage.headers.to,
            to: callFromClient ? sipMessage.headers.to : sipMessage.headers.from,
            destContact: this.getContact(sipMessage.headers.contact, sipMessage.headers.to.uri),
            seqNumber: sipMessage.headers.cseq.seq
        };
        if (sipMessage.headers[message_factory_1.HEADER_X_RESTCOMM_CALLSID]) {
            sipSession.callSid = sipMessage.headers[message_factory_1.HEADER_X_RESTCOMM_CALLSID];
        }
        return sipSession;
    }
    getContact(contactUri, toUri) {
        if (contactUri && contactUri[0] && contactUri[0].uri) {
            let contact = contactUri[0].uri;
            if (contact.includes("@")) {
                return contact;
            }
            else {
                let contactDomainName = this.utils.getDomain(contact);
                return this.messageFactory.getRequestUri(toUri, contactDomainName);
            }
        }
        else {
            return this.messageFactory.getRestcomServerAddress(toUri);
        }
    }
};
RestcommService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => sip_service_1.SipService))),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => client_msg_handler_1.ClientMsgHandler))),
    __metadata("design:paramtypes", [sip_service_1.SipService,
        client_msg_handler_1.ClientMsgHandler,
        mculogger_service_1.MculoggerService,
        message_factory_1.MessageFactory,
        restcomm_db_service_1.RestcommDbService,
        db_service_1.DbService,
        sip_utils_1.SipUtils])
], RestcommService);
exports.RestcommService = RestcommService;
//# sourceMappingURL=restcomm.service.js.map