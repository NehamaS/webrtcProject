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
exports.ConferenceService = void 0;
const common_1 = require("@nestjs/common");
const client_msg_handler_1 = require("../../client.msg.handler");
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const configuration_service_1 = require("service-infrastructure/common/config/configuration.service");
const message_factory_1 = require("../sip/massagefactory/message.factory");
const constants_1 = require("../../common/constants");
const restcomm_db_service_1 = require("../../common/db/restcomm.db.service");
const sip_service_1 = require("../sip/sip.service");
const sip_utils_1 = require("../sip/common/sip.utils");
const msml_factory_1 = require("../sip/massagefactory/msml.factory");
let ConferenceService = class ConferenceService {
    constructor(clientMsgHandler, sipService, logger, config, messageFactory, msmlFactory, restcommDbService, utils) {
        this.clientMsgHandler = clientMsgHandler;
        this.sipService = sipService;
        this.logger = logger;
        this.config = config;
        this.messageFactory = messageFactory;
        this.msmlFactory = msmlFactory;
        this.restcommDbService = restcommDbService;
        this.utils = utils;
        this.logger.debug("ConferenceService started");
    }
    async makeCall(request) {
        this.logger.info({ msg: "clientHand ---------> makeCall - conference", request: request });
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
            service: request.service,
            roomType: request.roomType
        };
        self.logger.info({ msg: "setUserSession before response", sipSession: sipSession });
        await self.restcommDbService.setUserSession(sipSession);
        await this.restcommDbService.setSipRequest(inviteReq.headers["call-id"], inviteReq.headers.cseq.seq.toString(), inviteReq);
        await self.sipService.send(inviteReq, async (err, sipResponse) => {
            if (!sipResponse) {
                response = self.buildResponse(request, null, err);
                await self.clientMsgHandler.joinConferenceAck(response);
                return;
            }
            response = self.buildResponse(request, sipResponse);
            if (sipResponse && sipResponse.status < 400) {
                sipSession.to = sipResponse.headers.to;
                sipSession.destContact = self.getContact(sipResponse.headers.contact, sipResponse.headers.to.uri);
                sipSession.roomId = sipResponse.headers[message_factory_1.HEADER_X_ROOMID];
                sipSession.userId = sipResponse.headers.to.params.tag;
                self.logger.info({ msg: "setUserSession after final response", sipSession: sipSession });
                await self.restcommDbService.setUserSession(sipSession);
                await this.restcommDbService.deleteSipRequest(sipResponse.headers["call-id"], sipResponse.headers.cseq.seq.toString());
                let ackReq = self.messageFactory.createMessage(message_factory_1.METHOD_ACK, sipSession);
                await self.sipService.send(ackReq, function () {
                });
                let roomSession = await self.restcommDbService.getUserSession(sipSession.meetingId + "_" + sipSession.roomType);
                let infoBody = self.msmlFactory.join(sipSession.roomId, sipSession.userId);
                let infoReq = self.messageFactory.createMessage(message_factory_1.METHOD_INFO, roomSession, infoBody);
                await self.sipService.send(infoReq, async (err, sipInfoResponse) => {
                    if (!sipInfoResponse) {
                        response = self.buildResponse(request, null, err);
                        await self.clientMsgHandler.joinConferenceAck(response);
                        return;
                    }
                    if (sipInfoResponse && sipInfoResponse.status < 400) {
                        self.logger.info({ msg: "clientHand <--------- joinConferenceAck - conference", response: response });
                        await self.clientMsgHandler.joinConferenceAck(response);
                    }
                    else {
                        self.logger.info({ msg: "clientHand <--------- joinConferenceAck (reject) - conference", response: response });
                        await self.clientMsgHandler.joinConferenceAck(response);
                    }
                });
            }
            else {
                self.logger.info({ msg: "clientHand <--------- joinConferenceAck (reject) - conference", response: response });
                if (sipResponse.status === constants_1.API_GW_REQUEST_TERMINATE.CODE) {
                    return;
                }
                else {
                    await self.clientMsgHandler.joinConferenceAck(response);
                }
            }
            return;
        });
    }
    async updateCall(request) {
        this.logger.info({ msg: "clientHand ---------> updateCall - conference", request: request });
    }
    async endCall(request) {
        this.logger.info({ msg: "clientHand ---------> endCall - conference", request: request });
        let inviteReq = await this.restcommDbService.getSipRequest(request.callId, "1");
        if (inviteReq && inviteReq.method === 'INVITE') {
            await this.restcommDbService.deleteSipRequest(inviteReq.headers["call-id"], inviteReq.headers.cseq.seq.toString());
            await this.sipService.cancelFlow(inviteReq);
            return;
        }
        let response;
        let userSession = await this.restcommDbService.getUserSession(request.callId);
        let roomSession = await this.restcommDbService.getUserSession(request.meetingId + "_" + request.roomType);
        if (userSession && roomSession) {
            roomSession.seqNumber++;
            this.logger.info({ msg: "get userSession", userSession: userSession });
            this.logger.info({ msg: "get roomSession", roomSession: userSession });
            let infoBody = this.msmlFactory.unjoin(userSession.roomId, userSession.userId);
            let infoReq = this.messageFactory.createMessage(message_factory_1.METHOD_INFO, roomSession, infoBody);
            this.logger.info({ msg: "byeReq", infoReq: infoReq });
            const self = this;
            await self.sipService.send(infoReq, (err, sipResponse) => {
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
                self.logger.info({ msg: "clientHand <--------- closeConnectionAck - conference", response: response });
                self.clientMsgHandler.closeConnectionAck(response);
                userSession.seqNumber++;
                this.logger.info({ msg: "get userSession", userSession: userSession });
                let byeReq = this.messageFactory.createMessage(message_factory_1.METHOD_BYE, userSession);
                this.logger.info({ msg: "byeReq", byeReq: byeReq });
                self.sipService.send(byeReq, function (err, sipByeResponse) {
                    if (!sipByeResponse) {
                        self.logger.error({ msg: "response on BYE was not received" });
                    }
                });
                self.restcommDbService.deleteUserSession(request.callId);
            });
        }
        else {
            response = this.buildResponse(request);
            response.status = {
                code: "500",
                desc: "Failed to get sipUserSession or sipRoomSession from DB"
            };
            this.logger.info({ msg: "clientHand <--------- closeConnectionAck (reject)- conference", response: response });
            await this.clientMsgHandler.closeConnectionAck(response);
            await this.restcommDbService.deleteUserSession(request.callId);
        }
    }
    disconnectUser(request) {
        this.logger.info({ msg: "clientHand <--------- disconnectUser - conference", request: request });
    }
    async endCallResponse(apiGwResponse) {
        this.logger.info({ msg: "clientHand ---------> endCallResponse - conference", apiGwResponse: apiGwResponse });
    }
    async createRoom(request) {
        this.logger.info({ msg: "clientHand ---------> createRoom - conference", request: request });
        let meeingId = this.createMeetingId();
        request.meetingId = meeingId;
        let inviteReq = this.messageFactory.createRoomInvite(request);
        this.logger.info({ msg: "inviteReq", inviteReq: inviteReq });
        let response;
        const self = this;
        let sipSession = {
            callId: inviteReq.headers['call-id'],
            from: inviteReq.headers.from,
            to: inviteReq.headers.to,
            contact: inviteReq.headers.contact,
            meetingId: meeingId,
            destContact: null,
            seqNumber: inviteReq.headers.cseq.seq,
            service: request.service,
            roomType: request.roomType
        };
        await this.restcommDbService.setSipRequest(inviteReq.headers["call-id"], inviteReq.headers.cseq.seq.toString(), inviteReq);
        await self.sipService.send(inviteReq, async (err, sipResponse) => {
            if (!sipResponse) {
                response = self.buildResponse(request, null, err);
                await self.clientMsgHandler.createConferenceAck(response);
                return;
            }
            response = self.buildResponse(request, sipResponse);
            let ackReq;
            if (sipResponse && sipResponse.status < 400) {
                await this.restcommDbService.deleteSipRequest(sipResponse.headers["call-id"], sipResponse.headers.cseq.seq.toString());
                sipSession.to = sipResponse.headers.to;
                sipSession.destContact = self.getContact(sipResponse.headers.contact, sipResponse.headers.to.uri);
                sipSession.roomId = sipResponse.headers.to.params.tag;
                self.logger.info({ msg: "setRoomSession", sipSession: sipSession });
                await self.restcommDbService.setUserSession(sipSession);
                ackReq = self.messageFactory.createMessage(message_factory_1.METHOD_ACK, sipSession);
                await self.sipService.send(ackReq, function () { });
                let infoBody = self.msmlFactory.createConference(sipSession.roomId);
                let infoReq = self.messageFactory.createMessage(message_factory_1.METHOD_INFO, sipSession, infoBody);
                await self.sipService.send(infoReq, async (err, sipInfoResponse) => {
                    if (!sipInfoResponse) {
                        self.logger.error({ msg: "INFO create conf was not received" });
                        return;
                    }
                    self.logger.info({ msg: "INFO create conf response was received" });
                    return;
                });
                response.meetingId = sipSession.meetingId;
                self.logger.info({ msg: "clientHand <--------- createConferenceAck - conference", response: response });
                await self.clientMsgHandler.createConferenceAck(response);
            }
            else {
                self.logger.info({ msg: "clientHand <--------- createConferenceAck (reject)- conference", response: response });
                if (sipResponse.status === constants_1.API_GW_REQUEST_TERMINATE.CODE) {
                    return;
                }
                else {
                    await self.clientMsgHandler.createConferenceAck(response);
                }
            }
            return;
        });
    }
    async closeRoom(request) {
        this.logger.info({ msg: "clientHand ---------> closeRoom - conference", request: request });
    }
    async cleanRoom(request) {
        this.logger.info({ msg: "clientHand <--------- cleanRoom - conference", request: request });
    }
    async ringingResponse(apiGwResponse) {
        this.logger.info({ msg: "clientHand ---------> ringingResponse - conference", apiGwResponse: apiGwResponse });
    }
    async connectResponse(apiGwResponse) {
        this.logger.info({ msg: "clientHand ---------> connectResponse - conference", apiGwResponse: apiGwResponse });
    }
    async updateResponse(apiGwResponse) {
        this.logger.info({ msg: "clientHand ---------> updateResponse - conference", apiGwResponse: apiGwResponse });
    }
    async rejectResponse(apiGwResponse) {
        this.logger.info({ msg: "clientHand ---------> rejectResponse - conference", apiGwResponse: apiGwResponse });
    }
    async updateRejectResponse(apiGwResponse) {
        this.logger.info({
            msg: "clientHand ---------> updateRejectResponse - conference",
            apiGwResponse: apiGwResponse
        });
    }
    async addUser(request) {
        this.logger.info({ msg: "One2OneService: addUser", request: request });
    }
    updateUser(request) {
        this.logger.info({ msg: "One2OneService: updateUser", request: request });
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
    getContact(contactUri, toUri) {
        if (contactUri && contactUri[0] && contactUri[0].uri) {
            let contact = contactUri[0].uri;
            if (contact.includes("@")) {
                return contact;
            }
            else {
                let contactDomainName = this.utils.getDomain(contact);
                return this.messageFactory.getMcuAddress();
            }
        }
        else {
            return this.messageFactory.getMcuAddress();
        }
    }
    createMeetingId() {
        this.logger.debug({ msg: "function createMeetingId" });
        let meetingId = String(Date.now()) + String(Math.floor((Math.random() * 10000) + 1));
        this.logger.info({ msg: "createMeetingId", meetingId: meetingId });
        return meetingId;
    }
};
ConferenceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => client_msg_handler_1.ClientMsgHandler))),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => sip_service_1.SipService))),
    __metadata("design:paramtypes", [client_msg_handler_1.ClientMsgHandler,
        sip_service_1.SipService,
        mculogger_service_1.MculoggerService,
        configuration_service_1.ConfigurationService,
        message_factory_1.MessageFactory,
        msml_factory_1.MsmlFactory,
        restcomm_db_service_1.RestcommDbService,
        sip_utils_1.SipUtils])
], ConferenceService);
exports.ConferenceService = ConferenceService;
//# sourceMappingURL=conference.service.js.map