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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageFactory = exports.CONTENT_MSML = exports.FROM_TAG = exports.USER_AGENT = exports.HEADER_CONTENT_TYPE = exports.HEADER_X_RESTCOMM_CALLSID = exports.HEADER_X_SERVICE_TYPE = exports.HEADER_X_CALLER_ID = exports.HEADER_DIALOGUE_TYPE = exports.HEADER_X_DEVICEID = exports.HEADER_X_ROOMID = exports.HEADER_X_MEETINGID = exports.CONTENT_TYPE_APP_SDP = exports.CONTENT_TYPE_APP_JSON = exports.METHOD_OPTIONS = exports.METHOD_CANCEL = exports.METHOD_BYE = exports.METHOD_INFO = exports.METHOD_ACK = exports.METHOD_INVITE = void 0;
const ip = __importStar(require("ip"));
const configuration_service_1 = require("service-infrastructure/common/config/configuration.service");
const common_1 = require("@nestjs/common");
const constants_1 = require("../../../common/constants");
const sip_utils_1 = require("../common/sip.utils");
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
exports.METHOD_INVITE = "INVITE";
exports.METHOD_ACK = "ACK";
exports.METHOD_INFO = "INFO";
exports.METHOD_BYE = "BYE";
exports.METHOD_CANCEL = "CANCEL";
exports.METHOD_OPTIONS = "OPTIONS";
exports.CONTENT_TYPE_APP_JSON = "application/json";
exports.CONTENT_TYPE_APP_SDP = "application/sdp";
exports.HEADER_X_MEETINGID = "x-meetingid";
exports.HEADER_X_ROOMID = "x-roomid";
exports.HEADER_X_DEVICEID = "x-deviceid";
exports.HEADER_DIALOGUE_TYPE = "x-dialogue-type";
exports.HEADER_X_CALLER_ID = "x-caller-id";
exports.HEADER_X_SERVICE_TYPE = "x-service-type";
exports.HEADER_X_RESTCOMM_CALLSID = "x-restcomm-callsid";
exports.HEADER_CONTENT_TYPE = "content-type";
exports.USER_AGENT = "Restcomm WebRTC Demo/2.3.2-274";
exports.FROM_TAG = '55667788';
exports.CONTENT_MSML = "application/msml+xml";
const SIP_ADDRESS = process.env.SIP_ADDRESS ? process.env.SIP_ADDRESS : ip.address();
let MessageFactory = class MessageFactory {
    constructor(config, utils, logger) {
        this.config = config;
        this.utils = utils;
        this.logger = logger;
    }
    createInvite(request) {
        try {
            let useAppId = this.config.get("useAppId", true);
            let userAgent = this.config.get("userAgent", exports.USER_AGENT);
            let uri;
            if (request.service == "P2M") {
                uri = this.getMcuAddress();
            }
            else {
                uri = this.getRestcomServerAddress(this.utils.getURI(request.callee));
            }
            let fromTag = this.getTag();
            if (process.env.SIP_USE_TEST_TAG == 'true') {
                fromTag = exports.FROM_TAG;
            }
            const fromUri = this.utils.getURI(request.caller);
            const toUri = useAppId ? this.utils.getURI(request.callee, request.appSid) : uri;
            let inviteReq = {
                method: exports.METHOD_INVITE,
                uri: uri,
                version: "2.0",
                headers: {
                    to: { uri: toUri },
                    from: { uri: fromUri, params: { tag: fromTag } },
                    "call-id": request.callId,
                    cseq: { method: exports.METHOD_INVITE, seq: 1 },
                    contact: [{ uri: this.getContactUri(this.utils.getUserPart(request.callee)) }],
                    authorization: request.accessToken,
                    "user-agent": userAgent,
                    "max-forwards": 70,
                    via: [],
                    "content-type": exports.CONTENT_TYPE_APP_SDP,
                    "x-called-party-id": uri
                },
                content: request.sdp
            };
            if (request.meetingId && request.meetingId != undefined) {
                inviteReq.headers[exports.HEADER_X_MEETINGID] = request.meetingId;
            }
            if (request.service && request.service != undefined) {
                inviteReq.headers[exports.HEADER_X_SERVICE_TYPE] = request.service;
            }
            if (request.deviceId && request.deviceId != undefined) {
                inviteReq.headers[exports.HEADER_X_DEVICEID] = request.deviceId;
            }
            if (request.service == "P2M") {
                inviteReq.headers[exports.HEADER_X_CALLER_ID] = request.caller;
                inviteReq.headers[exports.HEADER_DIALOGUE_TYPE] = 0;
            }
            return inviteReq;
        }
        catch (e) {
            this.logger.error({ action: 'createMessage', error: e.message ? e.message : e });
        }
    }
    createCancel(inviteReq) {
        try {
            let cancelReq = {
                method: exports.METHOD_CANCEL,
                uri: inviteReq.uri,
                version: "2.0",
                headers: {
                    to: inviteReq.headers.to,
                    from: inviteReq.headers.from,
                    "call-id": inviteReq.headers["call-id"],
                    cseq: { method: exports.METHOD_CANCEL, seq: inviteReq.headers.cseq.seq },
                    via: [inviteReq.headers.via[0]],
                    "max-forwards": 70
                }
            };
            if (inviteReq.headers[exports.HEADER_X_MEETINGID]) {
                cancelReq.headers[exports.HEADER_X_MEETINGID] = inviteReq.headers[exports.HEADER_X_MEETINGID];
            }
            if (inviteReq.headers[exports.HEADER_X_SERVICE_TYPE]) {
                cancelReq.headers[exports.HEADER_X_SERVICE_TYPE] = inviteReq.headers[exports.HEADER_X_SERVICE_TYPE];
            }
            return cancelReq;
        }
        catch (e) {
            this.logger.error({ action: 'createMessage', error: e.message ? e.message : e });
        }
    }
    createReInvite(session, sdp) {
        try {
            let userAgent = this.config.get("userAgent", exports.USER_AGENT);
            let reInviteReq = {
                method: exports.METHOD_INVITE,
                uri: session.destContact,
                version: "2.0",
                headers: {
                    to: session.to,
                    from: session.from,
                    "call-id": session.callId,
                    cseq: { method: exports.METHOD_INVITE, seq: Number(session.seqNumber) },
                    contact: session.contact ? session.contact : [{ uri: this.getContactUri() }],
                    via: [],
                    "user-agent": userAgent,
                    "max-forwards": 70,
                    "content-type": exports.CONTENT_TYPE_APP_SDP,
                    "x-called-party-id": session.destContact,
                },
                content: sdp
            };
            if (session.meetingId && session.meetingId != undefined) {
                reInviteReq.headers[exports.HEADER_X_MEETINGID] = session.meetingId;
            }
            if (session.service && session.service != undefined) {
                reInviteReq.headers[exports.HEADER_X_SERVICE_TYPE] = session.service;
            }
            if (session.callSid && session.callSid != undefined) {
                reInviteReq.headers[exports.HEADER_X_RESTCOMM_CALLSID] = session.callSid;
            }
            return reInviteReq;
        }
        catch (e) {
            this.logger.error({ action: 'createMessage', error: e.message ? e.message : e });
        }
    }
    createMessage(method, session, body) {
        try {
            let sipRequest = {
                method: method,
                uri: session.destContact,
                version: "2.0",
                headers: {
                    to: session.to,
                    from: session.from,
                    "call-id": session.callId,
                    "max-forwards": 70,
                    cseq: { method: method, seq: Number(session.seqNumber) },
                    contact: session.contact ? session.contact : [{ uri: this.getContactUri() }],
                    via: []
                }
            };
            if (session.meetingId && session.meetingId != undefined) {
                sipRequest.headers[exports.HEADER_X_MEETINGID] = session.meetingId;
            }
            if (session.service && session.service != undefined) {
                sipRequest.headers[exports.HEADER_X_SERVICE_TYPE] = session.service;
            }
            if (session.callSid && session.callSid != undefined) {
                sipRequest.headers[exports.HEADER_X_RESTCOMM_CALLSID] = session.callSid;
            }
            if (body && body != undefined) {
                sipRequest.headers[exports.HEADER_CONTENT_TYPE] = exports.CONTENT_MSML;
                sipRequest.content = body;
            }
            return sipRequest;
        }
        catch (e) {
            this.logger.error({ action: 'createMessage', error: e.message ? e.message : e });
        }
    }
    createRoomInvite(request) {
        try {
            const uri = this.getMcuAddress();
            let fromTag = this.getTag();
            if (process.env.SIP_USE_TEST_TAG == 'true') {
                fromTag = exports.FROM_TAG;
            }
            const fromUri = this.utils.getURI(request.caller);
            const toUri = this.utils.getURI(request.callee);
            let sdp = 'v=0\r\no=user 1 1 IN IP4 0.0.0.0\r\ns=CallControl\r\nc=IN IP4 0.0.0.0\r\nt=0 0\r\nm=audio 9 RTP/AVP 0 8\r\na=inactive\r\n\r\n';
            let inviteReq = {
                method: exports.METHOD_INVITE,
                uri: uri,
                version: "2.0",
                headers: {
                    to: { uri: toUri },
                    from: { uri: fromUri, params: { tag: fromTag } },
                    "call-id": request.meetingId + "_" + request.roomType,
                    cseq: { method: exports.METHOD_INVITE, seq: 1 },
                    contact: [{ uri: this.getContactUri(this.utils.getUserPart(request.callee)) }],
                    authorization: request.accessToken,
                    'x-call-control': true,
                    'x-meetingid': request.meetingId,
                    "max-forwards": 70,
                    via: [],
                    "x-called-party-id": uri
                },
                content: sdp
            };
            if (request.service && request.service != undefined) {
                inviteReq.headers[exports.HEADER_X_SERVICE_TYPE] = request.service;
            }
            if (request.service == "P2M") {
                let dialogType = (request.roomType && request.roomType == "ss") ? 1 : 2;
                inviteReq.headers[exports.HEADER_DIALOGUE_TYPE] = dialogType;
            }
            return inviteReq;
        }
        catch (e) {
            this.logger.error({ action: 'createRoomInvite', error: e.message ? e.message : e });
        }
    }
    getTag() {
        let date = Date.now();
        let tag = String(date);
        return tag;
    }
    getContactUri(user) {
        let port = process.env.SIP_PORT ? parseInt(process.env.SIP_PORT) : constants_1.SIP_PORT;
        let address = process.env.SIP_ADDRESS ? process.env.SIP_ADDRESS : `${ip.address()}`;
        let configAddress = this.config.get("sip.contact", `${address}:${port}`);
        let addressValue = process.env.SIP_CONTACT_ADDR ? process.env.SIP_CONTACT_ADDR : configAddress;
        let contactUri = user ? `sip:${user}@${addressValue}` : `sip:${addressValue}`;
        return contactUri;
    }
    getRestcomServerAddress(toUri) {
        let restCommDomain = undefined;
        let isUrlConfEnabled = this.config.get("restcomm.url.enabled", false);
        if (isUrlConfEnabled) {
            restCommDomain = process.env.RESTCOM_ADDRESS;
            if (!restCommDomain) {
                let port = this.config.get("restcomm.port");
                let restcommAddress = this.config.get("restcomm.url.fqdn", process.env.SIP_ADDRESS ? process.env.SIP_ADDRESS : ip.address());
                restCommDomain = port ? `${restcommAddress}:${port}` : restcommAddress;
            }
        }
        return this.getRequestUri(toUri, restCommDomain);
    }
    getMcuAddress() {
        let defaultAddress = this.config.get("mcu.fgdn", "127.0.0.1:5080");
        let address = process.env.MCU_ADDRESS ? process.env.MCU_ADDRESS : defaultAddress;
        let mcuAddress = "sip:mcu@" + address;
        return mcuAddress;
    }
    getRequestUri(toUri, requestUriDomain) {
        let toUriObj = this.utils.parseUri(toUri);
        let requestUriUser = (toUriObj && toUriObj.user) ? toUriObj.user : this.config.get("restcomm.defAppId", "restcomm");
        toUriObj.user = requestUriUser;
        toUriObj.host = requestUriDomain ? requestUriDomain : toUriObj.host;
        let restComAddressUri = this.utils.uriToString(toUriObj);
        return restComAddressUri;
    }
};
MessageFactory = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [configuration_service_1.ConfigurationService,
        sip_utils_1.SipUtils,
        mculogger_service_1.MculoggerService])
], MessageFactory);
exports.MessageFactory = MessageFactory;
//# sourceMappingURL=message.factory.js.map