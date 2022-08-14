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
exports.SipService = void 0;
const common_1 = require("@nestjs/common");
const sip = require("sip");
const ip = __importStar(require("ip"));
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const __ = __importStar(require("lodash"));
const restcomm_service_1 = require("../restcomm/restcomm.service");
const message_factory_1 = require("./massagefactory/message.factory");
const retransmissions_1 = require("./massagefactory/retransmissions");
const constants_1 = require("../../common/constants");
const sipCodes = {
    180: "Ringing",
    200: "OK",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    410: "Gone",
    486: "Busy Here",
    487: "Request Terminated",
    489: "Bad Event",
    500: "Server Internal Error",
    503: "Service Unavailable"
};
const sipHeadersMapping = new Map([
    ["x-meetingid", 'X-MeetingId'],
    ["x-service-type", 'X-Service-Type'],
    ['content-type', 'Content-Type'],
    ["x-restcomm-callsid", 'X-RestComm-CallSid'],
    ["max-forwards", 'Max-Forwards'],
    ['user-agent', 'User-Agent'],
    ["x-called-party-id", 'X-Called-Party-ID'],
    ["x-call-control", "X-Call-Control"],
    ["x-dialogue-type", "X-Dialogue-Type"]
]);
let SipService = class SipService {
    constructor(restcommService, messageFactory, retransmissions, logger) {
        this.restcommService = restcommService;
        this.messageFactory = messageFactory;
        this.retransmissions = retransmissions;
        this.logger = logger;
        this.sipApi = sip;
        this.start = () => {
            const options = {
                protocol: "UDP",
                address: this.address,
                port: this.port
            };
            this.logger.info({ action: "Start SipClient", data: options });
            this.sipApi.start(options, this.sipMessageHandler.bind(this));
        };
        this.stop = () => {
            this.sipApi.stop();
        };
        if (process.env.DEFAULT_SIP && process.env.DEFAULT_SIP == "false") {
            this.sipApi = require('../../../test/lib/sip.js');
        }
        this.port = process.env.SIP_PORT ? parseInt(process.env.SIP_PORT) : constants_1.SIP_PORT;
        this.address = process.env.SIP_ADDRESS ? process.env.SIP_ADDRESS : ip.address();
        this.logger.info("SipService started");
    }
    setSipApi(api) {
        this.sipApi = api;
    }
    async onApplicationBootstrap() {
        this.start();
    }
    onModuleInit() {
    }
    onModuleDestroy() {
        this.stop();
    }
    sipMessageHandler(request) {
        let rs;
        this.logger.info({ msg: " <========= " + request.method + " ", request: request });
        switch (request.method) {
            case "INVITE":
                rs = this.sipApi.makeResponse(request, 100, 'Trying');
                this.sipApi.send(rs);
                if (__.has(request, 'headers.to.params.tag')) {
                    this.restcommService.updateUser(request);
                }
                else {
                    this.restcommService.addUser(request);
                }
                break;
            case "ACK":
                let callId = request.headers['call-id'];
                let toTag = request.headers.to.params.tag;
                this.retransmissions.handleAckRequest(callId, toTag);
                break;
            case "INFO":
                rs = this.sipApi.makeResponse(request, 200, "Ok");
                this.sipApi.send(rs);
                this.logger.info({ msg: " =========> " + rs.status + " on " + rs.headers.cseq.method + " ", response: rs });
                break;
            case "BYE":
                rs = this.sipApi.makeResponse(request, 200, "OK");
                this.sipApi.send(rs);
                this.restcommService.disconnectUser(request);
                break;
            case "CANCEL":
                rs = this.sipApi.makeResponse(request, 200, "OK");
                this.sipApi.send(rs);
                this.restcommService.disconnectUser(request);
                break;
            default:
                break;
        }
    }
    async send(sipRequest, cb) {
        this.logger.info({ msg: " =========> " + sipRequest.method + " ", request: sipRequest });
        const self = this;
        try {
            sipRequest = this.fixSipHeadersFormat(sipRequest, sipHeadersMapping);
            this.sipApi.send(sipRequest, (response) => {
                if (response && response.status) {
                    self.logger.info({ msg: " <========= " + response.status + " on " + response.headers.cseq.method + " ", response: response });
                    if (response.status == 100) {
                    }
                    else if (response.status < 200) {
                        return cb(null, response);
                    }
                    else {
                        return cb(null, response);
                    }
                }
                else {
                    let errorResponse = this.buildErrorResponse(500, "Server Internal Error");
                    self.logger.error({ action: "received response error", error: "response wasn't received" });
                    return cb(errorResponse);
                }
            });
        }
        catch (e) {
            self.logger.error({ error: e });
            let errorResponse = this.buildErrorResponse(500, "Server Internal Error");
            self.logger.error({ action: "SipService send", error: "failed to send a request" });
            return cb(errorResponse);
        }
    }
    buildErrorResponse(code, reason) {
        let status = {
            status: code,
            reason: reason
        };
        return status;
    }
    async buildAndSendResponse(sipRequest, apiGwResponse) {
        let sipResponse;
        if (apiGwResponse.sdp) {
            let extension = {
                content: apiGwResponse.sdp,
                headers: {
                    'Content-Type': "application/sdp"
                }
            };
            sipResponse = this.sipApi.makeResponse(sipRequest, 200, sipCodes[200], extension);
        }
        else {
            if (apiGwResponse.status.code === '200') {
                if (sipRequest.headers.cseq.method === 'INVITE') {
                    sipResponse = this.sipApi.makeResponse(sipRequest, parseInt(constants_1.API_GW_REQUEST_TERMINATE.CODE, 10), constants_1.API_GW_REQUEST_TERMINATE.DESC);
                }
                else {
                    sipResponse = this.sipApi.makeResponse(sipRequest, parseInt(constants_1.CALL_SERVICE_OK.CODE, 10), constants_1.CALL_SERVICE_OK.DESC);
                }
            }
            else {
                sipResponse = this.sipApi.makeResponse(sipRequest, parseInt(apiGwResponse.status.code, 10), sipCodes[parseInt(apiGwResponse.status.code, 10)]);
            }
        }
        if (!__.has(sipResponse, 'headers.to.params.tag')) {
            if (sipResponse.headers.to.params != undefined) {
                sipResponse.headers.to.params.tag = this.messageFactory.getTag();
            }
        }
        if (sipRequest.headers[message_factory_1.HEADER_X_RESTCOMM_CALLSID]) {
            sipResponse.headers[message_factory_1.HEADER_X_RESTCOMM_CALLSID] = sipRequest.headers[message_factory_1.HEADER_X_RESTCOMM_CALLSID];
        }
        sipResponse.headers.contact = [{ uri: this.messageFactory.getContactUri() }];
        this.logger.info({ msg: " =========> " + sipResponse.status + " on " + sipResponse.headers.cseq.method + " ", response: sipResponse });
        sipResponse = this.fixSipHeadersFormat(sipResponse, sipHeadersMapping);
        this.sipApi.send(sipResponse);
        if (sipResponse.headers.cseq.method == "INVITE" && sipResponse.status == 200) {
            await this.setRetransmission(sipResponse);
        }
        return sipResponse;
    }
    async setRetransmission(response) {
        if (this.sipApi.setRetransmission != undefined && process.env.SIP_RETRASMISSION == 'false') {
            await this.sipApi.setRetransmission(response);
        }
        else {
            await this.retransmissions.setRetransmissionTimer(response);
        }
    }
    async sendRetryResponse(response) {
        this.logger.info({ msg: " ==== r =====> " + response.status + " on " + response.headers.cseq.method + " ", response: response });
        this.sipApi.send(response);
    }
    fixSipHeadersFormat(obj, headersToFix) {
        let headers = obj['headers'];
        let fixedHeaders = {};
        Object.entries(headers)
            .forEach(([header, value]) => {
            if (headersToFix.has(header)) {
                const fixedHeader = headersToFix.get(header);
                fixedHeaders[fixedHeader] = value;
            }
            else {
                fixedHeaders[header] = value;
            }
        });
        const fixedObject = Object.assign({}, obj);
        fixedObject['headers'] = fixedHeaders;
        return fixedObject;
    }
    async cancelFlow(inviteReq) {
        let cancelRequest = this.messageFactory.createCancel(inviteReq);
        this.logger.info({ msg: "cancelRequest", cancelRequest: cancelRequest });
        this.send(cancelRequest, (err, sipResponse) => {
            if (err) {
                this.logger.error({ action: "cancelFlow", err: err.msg ? err.msg : err, sipResponse: sipResponse });
                return;
            }
            else if (sipResponse && sipResponse.status) {
                this.logger.info({ msg: "cancelRequest", cancelResponse: sipResponse });
                return;
            }
            else {
                this.logger.info({ msg: "cancelRequest", cancelResponse: 'no response for cancel' });
                return;
            }
        });
    }
};
SipService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => restcomm_service_1.RestcommService))),
    __metadata("design:paramtypes", [restcomm_service_1.RestcommService,
        message_factory_1.MessageFactory,
        retransmissions_1.Retransmissions,
        mculogger_service_1.MculoggerService])
], SipService);
exports.SipService = SipService;
//# sourceMappingURL=sip.service.js.map