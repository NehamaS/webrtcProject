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
exports.ClientMsgHandler = void 0;
const common_1 = require("@nestjs/common");
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const db_service_1 = require("./common/db/db.service");
const ws_dispatcher_1 = require("./ws.dispatcher");
const call_service_api_1 = require("./callserviceapi/call.service.api");
const configuration_service_1 = require("service-infrastructure/common/config/configuration.service");
const push_notification_service_1 = require("./push/push.notification.service");
const constants_1 = require("./common/constants");
const ws_request_dto_1 = require("./dto/ws.request.dto");
const user_data_dto_1 = require("./dto/user.data.dto");
const session_dto_1 = require("./dto/session.dto");
const validators_factory_1 = require("./common/validators/validators.factory");
const error_builder_1 = require("./common/error.builder");
const util_1 = require("util");
const cdr_service_1 = require("./cdr/cdr.service");
const counter_service_1 = require("./metrics/counter.service");
const metrics_service_1 = require("service-infrastructure/dd-metrics/metrics.service");
const _ = __importStar(require("lodash"));
let ClientMsgHandler = class ClientMsgHandler {
    constructor(logger, dbService, wsDispatcher, callService, validatorsFactory, errorBuilder, config, notification, cdrService, counterService) {
        this.logger = logger;
        this.dbService = dbService;
        this.wsDispatcher = wsDispatcher;
        this.callService = callService;
        this.validatorsFactory = validatorsFactory;
        this.errorBuilder = errorBuilder;
        this.config = config;
        this.notification = notification;
        this.cdrService = cdrService;
        this.counterService = counterService;
    }
    onApplicationBootstrap() {
        this.persist = this.config.get("auth.token.persist", false);
        this.useLocalWs = this.config.get("websocket.ws.enabled", false);
        this.logger.info({ service: 'ClientMsgHandler', persist: this.persist, localWS: this.useLocalWs });
    }
    async wsDisconnect(connId) {
        return this.onDisconnect(connId);
    }
    async handleMsg(event) {
        this.logger.info({ func: 'handleMsg', event: event });
        try {
            let action = event.dto.type === constants_1.REGISTER_ACTION ? constants_1.REGISTER_ACTION : event.dto.body.action;
            let validator = this.validatorsFactory.getValidator(action);
            validator.validate(event.dto);
        }
        catch (e) {
            let errorMsg = this.errorBuilder.buildErrorResponseWsRequestDto(event, common_1.HttpStatus.BAD_REQUEST.toString(), e.message);
            this.counterService.setCounter(metrics_service_1.CounterType.incrementCounter, errorMsg);
            await this.wsDispatcher.sendMessage(event.connectionId, errorMsg);
            return;
        }
        try {
            switch (event.dto.type) {
                case constants_1.REGISTER_ACTION:
                    this.preformAction(this.onRegister, event);
                    break;
                case constants_1.UNREGISTER_ACTION:
                    this.preformAction(this.onUnregister, event);
                    break;
                case constants_1.CONFERENCE_TYPE:
                    await this.conferenceAction(event);
                    break;
                case constants_1.CALL_SERVICE_TYPE:
                    let callData;
                    if (this.persist) {
                        callData = await this.getUserData(event);
                        if (callData === undefined) {
                            let error = `No data found in DynamoDb for connectionId ${event.connectionId}`;
                            this.logger.error({ action: `${constants_1.START_ACTION} failed`, reason: error });
                            return;
                        }
                        event = _.merge(event, callData);
                    }
                    switch (event.dto.body.action) {
                        case constants_1.START_ACTION:
                            if (!this.persist) {
                                callData = await this.getUserData(event);
                                if (callData === undefined) {
                                    let error = `No data found in DynamoDb for connectionId ${event.connectionId}`;
                                    this.logger.error({ action: `${constants_1.START_ACTION} failed`, reason: error });
                                    return;
                                }
                            }
                            let sessionData = new session_dto_1.SessionDto();
                            sessionData.callId = event.dto.callId;
                            if (event.dto.meetingId) {
                                sessionData.meetingId = event.dto.meetingId;
                            }
                            sessionData.deviceId = callData.body.deviceId;
                            sessionData.userId = callData.body.userId;
                            await this.cdrService.setStartTime4SessData(event, callData, sessionData);
                            if (event.dto.body.reason === constants_1.JOIN_REASON) {
                                this.counterService.setCounter(metrics_service_1.CounterType.incrementCounter, event.dto);
                            }
                            this.preformAction(this.onCallStart, callData);
                            break;
                        case constants_1.STATUS_ACTION:
                            await this.preformAction(this.onCallStatus, event.dto);
                            break;
                        case constants_1.ANSWER_ACTION:
                            this.preformAction(this.onAnswer, event.dto);
                            break;
                        case constants_1.TERMINATE_ACTION:
                            this.counterService.setCounter(metrics_service_1.CounterType.incrementCounter, event.dto);
                            this.preformAction(this.onTerminate, event.dto);
                            break;
                        case constants_1.TERMINATE_ACK_ACTION:
                            this.counterService.setCounter(metrics_service_1.CounterType.incrementCounter, event.dto);
                            this.preformAction(this.onTerminateAck, event.dto);
                            break;
                        case constants_1.HOLD_ACTION:
                        case constants_1.RESUME_ACTION:
                        case constants_1.MODIFY_ACTION:
                            this.preformAction(this.onModify, event.dto);
                            break;
                        case constants_1.HOLD_ACTION_ACK:
                        case constants_1.RESUME_ACTION_ACK:
                        case constants_1.MODIFY_ACTION_ACK:
                            this.preformAction(this.onModifyAck, event.dto);
                            break;
                        default:
                            throw new Error(`func: handleMsg error, action: ${event.dto.body.action} is not supported`);
                    }
                    break;
                default:
                    let message = `handleMsg error, type: ${event.dto.type} is not supported`;
                    this.logger.error({ error: message });
                    throw new Error(message);
            }
        }
        catch (e) {
            this.logger.error({ error: e.message ? e.message : e });
            let errorMsg = this.errorBuilder.buildErrorResponseWsRequestDto(event, common_1.HttpStatus.BAD_REQUEST.toString(), e.message);
            this.counterService.setCounter(metrics_service_1.CounterType.incrementCounter, errorMsg);
            await this.wsDispatcher.sendMessage(event.connectionId, errorMsg);
        }
    }
    async getUserData(wsRequest) {
        let userData = await this.dbService.getByConnectionId(wsRequest.connectionId);
        if (userData === undefined) {
            let error = `No data found in DynamoDb for connectionId ${wsRequest.connectionId}`;
            this.logger.error({ action: "getUserData", reason: error });
            let errorMsg = this.errorBuilder.buildErrorResponseWsRequestDto(wsRequest, common_1.HttpStatus.BAD_REQUEST.toString(), error);
            this.counterService.setCounter(metrics_service_1.CounterType.incrementCounter, errorMsg);
            await this.wsDispatcher.sendMessage(wsRequest.connectionId, errorMsg);
            return undefined;
        }
        wsRequest.dto.body.deviceId = userData.deviceId;
        wsRequest.dto.body.userId = userData.userId;
        wsRequest.dto.body.accessToken = userData.accessToken;
        wsRequest.dto.body.appSid = userData.appSid;
        wsRequest.dto.body.organizationId = userData.organizationSid;
        wsRequest.dto.body.accountId = userData.accountSid;
        wsRequest.dto.body.deviceType = userData.deviceType;
        return wsRequest.dto;
    }
    async ring(rsp) {
        this.logger.info({ func: 'ring', rsp: rsp });
        await this.ringCall(rsp);
    }
    async connect(rsp) {
        this.logger.info({ func: 'connect', rsp: rsp });
        await this.answerCall(rsp);
    }
    async reject(rsp) {
        this.logger.info({ func: 'reject', rsp: rsp });
        return await this.rejectCall(rsp);
    }
    endCallAck(rsp) {
        this.logger.info({ func: 'endCallAck', rsp: rsp });
    }
    async updateAck(rsp) {
        this.logger.info({ func: 'updateAck', rsp: rsp });
        await this.modifyResponse(rsp);
    }
    async call(req) {
        this.logger.info({ func: 'call', request: req });
        await this.startCall(req);
    }
    async update(req) {
        this.logger.info({ func: 'update', request: req });
        await this.modifyCall(req);
    }
    async disconnect(req) {
        this.logger.info({ func: 'disconnect', msg: req });
        await this.endCall(req);
    }
    async onDisconnect(connId) {
        this.logger.info({ func: 'onDisconnect', connId: connId });
        let userData = await this.dbService.getByConnectionId(connId);
        if (userData !== undefined) {
            let data = new user_data_dto_1.UserDataDto();
            data.connectionId = 'none';
            data.userId = userData.userId;
            data.deviceId = userData.deviceId;
            return await this.dbService.updateUsersData(data);
        }
        this.logger.warn({ func: 'onDisconnect', connId: connId, desc: 'not present in db' });
        return false;
    }
    async onRegister(event) {
        this.logger.info({ func: 'onRegister', event: event });
        try {
            let userData = {
                userId: event.dto.source,
                deviceId: event.dto.body.deviceId,
                connectionId: event.connectionId,
                deviceType: event.dto.body.deviceType,
                protocolVersion: event.dto.body.protocolVersion,
                PNSToken: event.dto.body.PNSToken,
                appSid: event.dto.body.appSid
            };
            if (this.persist && !this.useLocalWs) {
                await this.dbService.updateUsersData(userData);
            }
            else {
                let user = await this.dbService.getByConnectionId(userData.connectionId);
                if (user !== undefined) {
                    userData.accessToken = user.accessToken;
                    userData.appSid = user.appSid;
                    userData.organizationSid = user.organizationSid;
                    userData.accountSid = user.accountSid;
                }
                await this.dbService.setUser(userData);
            }
            let msg = {
                callId: event.dto.callId,
                messageId: (0, constants_1.getMessageId)(event.dto.messageId),
                source: 'GW',
                destination: event.dto.source,
                ts: new Date().getTime(),
                type: constants_1.REGISTER_ACTION_ACK,
                meetingId: event.dto.meetingId,
                body: {
                    requestMessageId: event.dto.messageId,
                    GWVersion: constants_1.WEBRTC_GW_VERSION
                }
            };
            this.logger.info({ func: 'onRegister', response: msg });
            await this.wsDispatcher.sendMessage(event.connectionId, msg);
        }
        catch (e) {
            this.logger.error({ msg: 'register failed', error: e.message });
            throw new common_1.HttpException(`Register failed ${e.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async onUnregister(event) {
        this.logger.info({ func: 'onUnregister', event: event });
        try {
            let userData = {
                userId: event.dto.source,
                deviceId: event.dto.body.deviceId,
                connectionId: event.connectionId,
                deviceType: event.dto.body.deviceType,
                protocolVersion: event.dto.body.protocolVersion,
                PNSToken: event.dto.body.PNSToken,
                appSid: event.dto.body.appSid
            };
            let isUserDataDelete = await this.dbService.delUsersData(userData.userId, userData.deviceId);
            if (!isUserDataDelete) {
                this.logger.error({
                    func: 'onUnregister',
                    user: userData.userId,
                    err: `userData does not exist for userId: ${userData.userId} and deviceId: ${userData.deviceId}`
                });
            }
            this.logger.info({
                func: 'onUnregister',
                user: userData.userId,
                err: `userData: userId: ${userData.userId} and deviceId: ${userData.deviceId} deleted from db..`
            });
        }
        catch (e) {
            this.logger.error({ msg: 'Unregister failed', error: e.message });
            throw new common_1.HttpException(`Unregister failed ${e.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    convert2ApiGwFormat(event) {
        let request = {
            caller: event.source,
            callee: event.destination,
            callId: event.callId,
            sequence: event.messageId,
            accessToken: event.body.accessToken,
            appSid: event.body.appSid,
            reason: event.body.reason
        };
        if (event.body.requestMessageId != undefined) {
            let index = event.body.requestMessageId.lastIndexOf("_");
            if (index != -1) {
                request.sequence = event.body.requestMessageId.substring(index + 1);
            }
            else {
                request.sequence = event.body.requestMessageId;
            }
        }
        if (event.body.service != undefined) {
            request.service = event.body.service;
            if (request.service == 'P2M') {
                if (event.body.action == constants_1.START_SCREEN_SHARE_ACTION || event.body.action == constants_1.STOP_SCREEN_SHARE_ACTION) {
                    request.roomType = 'ss';
                }
                else {
                    request.roomType = 'av';
                }
            }
        }
        if (event.meetingId != undefined) {
            request.meetingId = event.meetingId;
        }
        if (event.body.sdp != undefined) {
            request.sdp = event.body.sdp;
        }
        if (event.body.statusCode != undefined) {
            switch (event.body.action) {
                case constants_1.ANSWER_ACTION:
                    request.method = 'call';
                    break;
                case constants_1.HOLD_ACTION_ACK:
                case constants_1.RESUME_ACTION_ACK:
                case constants_1.MODIFY_ACTION_ACK:
                    request.method = 'update';
                    break;
                default:
                    break;
            }
            switch (event.body.statusCode) {
                case constants_1.API_GW_NORMAL.CODE:
                    if (event.body.action !== constants_1.TERMINATE_ACK_ACTION && event.body.action !== constants_1.TERMINATE_ACTION) {
                        request.status = { code: constants_1.CALL_SERVICE_RINGING.CODE, desc: constants_1.CALL_SERVICE_RINGING.DESC };
                    }
                    else {
                        request.status = { code: constants_1.CALL_SERVICE_OK.CODE, desc: constants_1.CALL_SERVICE_OK.DESC };
                    }
                    break;
                case constants_1.API_GW_BAD_REQUEST.CODE:
                case constants_1.API_GW_UNAUTHORIZED.CODE:
                case constants_1.API_GW_BAD_FORBIDDEN.CODE:
                case constants_1.API_GW_NOT_FOUND.CODE:
                case constants_1.API_GW_BUSY_HERE.CODE:
                    request.status = { code: event.body.statusCode, desc: event.body.description };
                    break;
                default:
                    request.status = { code: constants_1.CALL_SERVICE_BAD_EVENT.CODE, desc: constants_1.CALL_SERVICE_BAD_EVENT.DESC };
                    break;
            }
        }
        return request;
    }
    async onCallStart(event) {
        try {
            this.logger.debug({ func: 'onCallStart', event: event });
            let req = this.convert2ApiGwFormat(event);
            this.logger.info({ func: 'onCallStart', request: req });
            if (event.body.reason === constants_1.JOIN_REASON) {
                await this.callService.makeCall(req);
            }
            else {
                let seq = event.messageId;
                await this.dbService.setAction(event.callId, seq, event.body.action);
                await this.callService.updateCall(req);
            }
        }
        catch (e) {
            this.logger.error({ msg: e.message, event: event });
        }
    }
    async onModify(event) {
        this.logger.debug({ func: 'onModify', event: event });
        let req = this.convert2ApiGwFormat(event);
        this.logger.info({ func: 'onModify', request: req });
        await this.dbService.setAction(event.callId, event.messageId, event.body.action);
        await this.callService.updateCall(req);
    }
    async onTerminate(event) {
        this.logger.debug({ func: 'onTerminate', event: event });
        let req = this.convert2ApiGwFormat(event);
        this.logger.info({ func: 'onTerminate', request: req });
        await Promise.all([this.cdrService.writeCdr(req), this.callService.endCall(req)]);
    }
    async onTerminateAck(event) {
        this.logger.info({ func: 'onTerminateAck', event: event });
        let req = this.convert2ApiGwFormat(event);
        this.logger.info({ func: 'onTerminateAck', request: req });
        await this.callService.endCallResponse(req);
    }
    async onCallStatus(event) {
        this.logger.debug({ func: 'onCallStatus', event: event });
        let rsp = this.convert2ApiGwFormat(event);
        this.logger.info({ func: 'onCallStatus', response: rsp });
        if (rsp.status.code === constants_1.CALL_SERVICE_RINGING.CODE) {
            await this.callService.ringingResponse(rsp);
            return;
        }
        this.counterService.setCounter(metrics_service_1.CounterType.incrementCounter, event);
        await this.callService.rejectResponse(rsp);
    }
    async onAnswer(event) {
        this.logger.debug({ func: 'onAnswer', event: event });
        let rsp = this.convert2ApiGwFormat(event);
        this.logger.info({ func: 'onAnswer', response: rsp });
        await this.cdrService.setAnswerTime4SessData(event);
        await this.callService.connectResponse(rsp);
    }
    async onModifyAck(event) {
        this.logger.debug({ func: 'onModifyAck', event: event });
        let rsp = this.convert2ApiGwFormat(event);
        this.logger.info({ func: 'onModifyAck', response: rsp });
        await this.callService.updateResponse(rsp);
    }
    convert2ApiGwDto(msg, action) {
        let event = {
            source: msg.caller,
            destination: msg.callee,
            callId: msg.callId,
            ts: new Date().getTime(),
            type: constants_1.CALL_SERVICE_TYPE,
            messageId: (0, constants_1.getMessageId)(msg.sequence, msg.service),
            body: {
                action: action
            }
        };
        switch (action) {
            case constants_1.CREATE_CONFERENCE_ACTION_ACK:
            case constants_1.VIDEO_START_ACTION_ACK:
            case constants_1.MODIFY_CONNECTION_ACTION_ACK:
            case constants_1.TERMINATE_CONNECTION_ACTION_ACK:
            case constants_1.DESTROY_CONFERENCE_ACTION_ACK:
            case constants_1.START_SCREEN_SHARE_ACTION_ACK:
            case constants_1.STOP_SCREEN_SHARE_ACTION_ACK:
                if (msg.service == 'P2M') {
                    event.type = constants_1.CONFERENCE_TYPE;
                }
                break;
            default:
                break;
        }
        if (msg.meetingId != undefined) {
            event.meetingId = msg.meetingId;
        }
        let requestMessageId = msg.requestMessageId ? msg.requestMessageId : msg.sequence;
        switch (action) {
            case constants_1.STATUS_ACTION:
                if (msg.status.code === constants_1.CALL_SERVICE_RINGING.CODE) {
                    event.body = {
                        action: action, requestMessageId: requestMessageId,
                        statusCode: constants_1.API_GW_RINGING.CODE, description: constants_1.API_GW_RINGING.DESC
                    };
                }
                else {
                    event.body = {
                        action: action, requestMessageId: requestMessageId,
                        statusCode: msg.status.code, description: msg.status.desc
                    };
                }
                break;
            case constants_1.ANSWER_ACTION:
            case constants_1.HOLD_ACTION_ACK:
            case constants_1.RESUME_ACTION_ACK:
            case constants_1.MODIFY_ACTION_ACK:
            case constants_1.CREATE_CONFERENCE_ACTION_ACK:
            case constants_1.VIDEO_START_ACTION_ACK:
            case constants_1.MODIFY_CONNECTION_ACTION_ACK:
            case constants_1.TERMINATE_CONNECTION_ACTION_ACK:
            case constants_1.DESTROY_CONFERENCE_ACTION_ACK:
            case constants_1.START_SCREEN_SHARE_ACTION_ACK:
            case constants_1.STOP_SCREEN_SHARE_ACTION_ACK:
                if (msg.status != undefined && msg.status.code != constants_1.CALL_SERVICE_OK.CODE) {
                    event.body = { action: action, statusCode: msg.status.code, description: msg.status.desc };
                }
                else {
                    event.body = { action: action, requestMessageId: requestMessageId };
                    if (msg.sdp != undefined) {
                        event.body.sdp = msg.sdp;
                    }
                }
                if (event.type == constants_1.CONFERENCE_TYPE && msg.meetingId != undefined) {
                    event.body.meetingId = msg.meetingId;
                }
                break;
            case constants_1.START_ACTION:
            case constants_1.HOLD_ACTION:
            case constants_1.RESUME_ACTION:
            case constants_1.MODIFY_ACTION:
                event.body = { action: action, sdp: msg.sdp };
                break;
            case constants_1.TERMINATE_ACTION:
                if (msg.status != undefined && msg.status.code != undefined) {
                    event.body = { action: action, statusCode: msg.status.code, description: msg.status.desc };
                }
                else {
                    event.body = { action: action, statusCode: constants_1.API_GW_NORMAL.CODE, description: constants_1.API_GW_NORMAL.DESC };
                }
                break;
            default:
                this.logger.error({ func: 'convert2ApiGwDto', action: action, desc: 'action not supported' });
                if (msg.status != undefined && msg.status.code != undefined) {
                    event.body = {
                        action: action,
                        requestMessageId: requestMessageId,
                        statusCode: msg.status.code,
                        description: msg.status.desc
                    };
                }
                else {
                    event.body = { action: action, requestMessageId: requestMessageId };
                }
                break;
        }
        if (msg.service != undefined) {
            event.body.service = msg.service;
        }
        if (msg.reason != undefined) {
            event.body.reason = msg.reason;
        }
        return event;
    }
    buildErrRsp(req, code, desc) {
        let rsp = {
            caller: req.callee, callee: req.caller,
            callId: req.callId, sequence: req.sequence,
            status: {
                code: code,
                desc: desc
            }
        };
        if (req.service && req.service != undefined) {
            rsp.service = req.service;
        }
        if (req.meetingId && req.meetingId != undefined) {
            rsp.meetingId = req.meetingId;
        }
        rsp.reason = desc;
        return rsp;
    }
    async userNotFound(action, dest, req) {
        this.logger.error({ func: 'userNotFound', action: action, user: dest, err: 'get user ws connection failed' });
        let rsp = this.buildErrRsp(req, "404", 'Not Found');
        if (action == constants_1.MODIFY_ACTION) {
            await this.callService.updateRejectResponse(rsp);
        }
        else {
            await this.callService.rejectResponse(rsp);
        }
    }
    async callUser(req, action) {
        let request = this.convert2ApiGwDto(req, action);
        this.logger.info({ func: 'callUser', action: action, request: request });
        if (action == constants_1.START_ACTION) {
            let connectionId = await this.getConnIdForStartCall(req);
            if (connectionId) {
                await this.wsDispatcher.sendMessage(connectionId, request);
                return;
            }
            else {
                if (this.config.get("pushNotification.enabled", false) == true) {
                    connectionId = await this.sendPushNotification(req);
                    if (connectionId) {
                        await this.wsDispatcher.sendMessage(connectionId, request);
                        return;
                    }
                }
            }
        }
        else {
            let sessionData = await this.dbService.getSessionData(request.callId);
            if (sessionData) {
                this.logger.info({ msg: "callUser", sessionData: sessionData });
                let userData = await this.dbService.getUserData(sessionData.userId, sessionData.deviceId);
                this.logger.info({ msg: "callUser", userSessionData: userData });
                if (userData && userData.connectionId && userData.connectionId != constants_1.NO_CONNECTION) {
                    await this.wsDispatcher.sendMessage(userData.connectionId, request);
                    return;
                }
            }
        }
        this.logger.info({ msg: "callUser", user: req.callee, desc: 'disconnected', action: action, callId: req.callId });
        await this.userNotFound(action, request.destination, req);
    }
    async getConnIdForStartCall(req) {
        let userDataArr = await this.dbService.getByUserId(req.callee);
        this.logger.info({ msg: "callUser - START_ACTION", getByUserId: req.callee, userDataArr: userDataArr });
        if (Array.isArray(userDataArr) && userDataArr.length !== 0) {
            let userData = userDataArr.find(data => {
                if (data && data.connectionId && data.connectionId !== constants_1.NO_CONNECTION) {
                    return data;
                }
            });
            this.logger.info({ msg: "callUser - START_ACTION", userData: userData });
            if (userData && userData.deviceType) {
                req.accessToken = userData.accessToken;
                let sessionData = new session_dto_1.SessionDto();
                sessionData.callId = req.callId;
                if (req.meetingId) {
                    sessionData.meetingId = req.meetingId;
                }
                sessionData.deviceId = userData.deviceId;
                sessionData.userId = req.callee;
                await this.dbService.setSessionData(sessionData);
                return userData.connectionId;
            }
        }
    }
    async sendPushNotification(req) {
        this.logger.info({ func: 'sendPushNotification', request: req });
        let userSessionData = await this.dbService.getByUserId(req.callee);
        this.logger.info({ msg: "sendPushNotification", userSessionData: userSessionData });
        if (Array.isArray(userSessionData) && userSessionData.length != 0) {
            userSessionData.forEach((userData) => {
                this.notification.sendNotification(req.caller, userData);
            });
            let timeout = this.config.get("pushNotification.timeout", 1000);
            let retry = this.config.get("pushNotification.retry", 20);
            let self = this;
            const sleep = (0, util_1.promisify)(setTimeout);
            while (retry > 0) {
                await sleep(timeout);
                self.logger.info({
                    msg: "notification timer expired, check if the client already connected",
                    timer: timeout,
                    userId: req.callee
                });
                let connectionId = await this.getConnIdForStartCall(req);
                if (connectionId) {
                    return connectionId;
                }
                retry--;
            }
        }
        this.logger.error({ func: 'sendPushNotification: user was not found', userId: req.callee, callId: req.callId });
    }
    async startCall(req) {
        await this.callUser(req, constants_1.START_ACTION);
    }
    async modifyCall(req) {
        await this.callUser(req, constants_1.MODIFY_ACTION);
    }
    async endCall(req) {
        await this.callUser(req, constants_1.TERMINATE_ACTION);
    }
    async buildErrReq(rsp) {
        return {
            caller: rsp.callee,
            callee: rsp.caller,
            callId: rsp.callId,
            sequence: rsp.sequence + 1,
        };
    }
    async cancelCall(action, dest, rsp) {
        this.logger.error({ func: 'cancelCall', action: action, user: dest, err: 'get user ws connection failed' });
        let req = await this.buildErrReq(rsp);
        await this.callService.endCall(req);
    }
    async response2User(rsp, reqAction, rspAction) {
        let response = this.convert2ApiGwDto(rsp, reqAction);
        response.destination = rsp.caller;
        response.source = rsp.callee;
        this.logger.info({ func: 'response2User', reqAction: reqAction, rspAction: rspAction, response: response });
        let sessionData = await this.dbService.getSessionData(response.callId);
        if (sessionData) {
            let userData = await this.dbService.getUserData(sessionData.userId, sessionData.deviceId);
            if (userData !== undefined && userData.connectionId !== undefined) {
                return await this.wsDispatcher.sendMessage(userData.connectionId, response);
            }
            else {
                this.logger.error({
                    func: 'response2User',
                    user: response.destination,
                    err: `userData does not exist for userId: ${sessionData.userId} and deviceId: ${sessionData.deviceId}`
                });
            }
        }
        else {
            this.logger.error({
                func: 'response2User',
                user: response.destination,
                err: 'Session data does not exist'
            });
        }
        if (rspAction !== 'rejectCall') {
            await this.cancelCall(rspAction, response.destination, rsp);
            return;
        }
        this.logger.error({
            func: 'response2User',
            user: response.destination,
            err: 'get user ws connection failed'
        });
    }
    async ringCall(rsp) {
        return await this.response2User(rsp, constants_1.STATUS_ACTION, 'ringCall');
    }
    async answerCall(rsp) {
        return await this.response2User(rsp, constants_1.ANSWER_ACTION, 'answerCall');
    }
    async modifyResponse(rsp) {
        let action = await this.dbService.getAction(rsp.callId, rsp.sequence);
        return await this.response2User(rsp, action, 'modifyResponse');
    }
    async rejectCall(rsp) {
        await this.response2User(rsp, constants_1.STATUS_ACTION, 'rejectCall');
        await this.clearDb(rsp.callId);
    }
    preformAction(action, event) {
        setImmediate(async () => {
            try {
                await action.call(this, event);
            }
            catch (e) {
                let error = e.message ? e.message : e;
                this.logger.error({ action: "preformAction", error: error, event: event });
                let errorMsg;
                if (event.hasOwnProperty('connectionId'))
                    errorMsg = this.errorBuilder.buildErrorResponseWsRequestDto(event, common_1.HttpStatus.INTERNAL_SERVER_ERROR.toString(), error);
                else {
                    errorMsg = this.errorBuilder.buildErrorResponseApiGwDto(event, common_1.HttpStatus.INTERNAL_SERVER_ERROR.toString(), error);
                }
                let connectionId;
                if (event instanceof ws_request_dto_1.WsRequestDto) {
                    connectionId = event.connectionId;
                }
                else {
                    let callId = event.callId;
                    let sessionData = await this.dbService.getSessionData(callId);
                    if (sessionData != undefined) {
                        let userData = await this.dbService.getUserData(sessionData.userId, sessionData.deviceId);
                        connectionId = userData.connectionId;
                    }
                    else {
                        this.logger.error({ action: "preformAction", error: 'get session data fail', event: event });
                    }
                }
                setImmediate(async () => {
                    await this.wsDispatcher.sendMessage(connectionId, errorMsg);
                });
            }
        });
    }
    async clearDb(callId) {
        this.logger.info({ action: "clearDb", callId: callId });
        await this.dbService.delSessionData(callId);
    }
    async updateSessionData(event) {
        let callData = await this.getUserData(event);
        if (callData === undefined) {
            this.logger.error({ action: `getSessionData`, conn: event.connectionId, desc: 'get data failed' });
            await this.sendRejectResponse(event, event.dto.type, 'CreateAck', '500', 'User Not Register');
            return false;
        }
        let sessionData = new session_dto_1.SessionDto();
        sessionData.callId = event.dto.callId;
        if (event.dto.meetingId) {
            sessionData.meetingId = event.dto.meetingId;
        }
        sessionData.deviceId = callData.body.deviceId;
        sessionData.userId = callData.body.userId;
        sessionData.serviceType = event.dto.type;
        await this.dbService.setSessionData(sessionData);
        return true;
    }
    async sendRejectResponse(event, type, action, code, desc) {
        let rsp = {
            destination: event.dto.source,
            source: event.dto.destination,
            callId: event.dto.callId,
            messageId: '1',
            ts: new Date().getTime() / 1000,
            type: type,
            body: {
                requestMessageId: event.dto.messageId,
                action: action,
                statusCode: code,
                description: desc
            }
        };
        this.counterService.setCounter(metrics_service_1.CounterType.incrementCounter, rsp);
        await this.wsDispatcher.sendMessage(event.connectionId, rsp);
    }
    getResponseAction(action) {
        switch (action) {
            case constants_1.CREATE_CONFERENCE_ACTION:
                return constants_1.CREATE_CONFERENCE_ACTION_ACK;
            case constants_1.VIDEO_START_ACTION:
                return constants_1.VIDEO_START_ACTION_ACK;
            case constants_1.MODIFY_CONNECTION_ACTION:
                return constants_1.MODIFY_CONNECTION_ACTION_ACK;
            case constants_1.TERMINATE_CONNECTION_ACTION:
                return constants_1.TERMINATE_CONNECTION_ACTION_ACK;
            case constants_1.DESTROY_CONFERENCE_ACTION:
                return constants_1.DESTROY_CONFERENCE_ACTION_ACK;
            case constants_1.START_SCREEN_SHARE_ACTION:
                return constants_1.START_SCREEN_SHARE_ACTION_ACK;
            case constants_1.STOP_SCREEN_SHARE_ACTION:
                return constants_1.STOP_SCREEN_SHARE_ACTION_ACK;
            default:
                return 'Undefined';
        }
    }
    getActionFunction(action) {
        switch (action) {
            case constants_1.CREATE_CONFERENCE_ACTION:
                return this.onCreateConference;
            case constants_1.VIDEO_START_ACTION:
                return this.onJoinConference;
            case constants_1.MODIFY_CONNECTION_ACTION:
                return this.onModifyConnection;
            case constants_1.TERMINATE_CONNECTION_ACTION:
                return this.onCloseConnection;
            case constants_1.DESTROY_CONFERENCE_ACTION:
                return this.onDestroyConference;
            case constants_1.START_SCREEN_SHARE_ACTION:
                return this.onCreatePublisher;
            case constants_1.STOP_SCREEN_SHARE_ACTION:
                return this.onStopPublisher;
            default:
                return this.onUnsupportedAction;
        }
    }
    async conferenceAction(event) {
        this.logger.info({ func: 'conferenceAction', action: event.dto.body.action });
        let status;
        switch (event.dto.body.action) {
            case constants_1.CREATE_CONFERENCE_ACTION:
            case constants_1.VIDEO_START_ACTION:
            case constants_1.TERMINATE_CONNECTION_ACTION:
            case constants_1.DESTROY_CONFERENCE_ACTION:
            case constants_1.START_SCREEN_SHARE_ACTION:
            case constants_1.STOP_SCREEN_SHARE_ACTION:
                status = await this.updateSessionData(event);
                if (status) {
                    this.preformAction(this.getActionFunction(event.dto.body.action), event.dto);
                }
                else {
                    await this.sendRejectResponse(event, constants_1.CONFERENCE_TYPE, this.getResponseAction(event.dto.body.action), '500', 'User Not Register');
                }
                break;
            default:
                this.logger.error({ func: 'conferenceAction', action: event.dto.body.action, desc: 'not supported' });
                await this.sendRejectResponse(event, 'Video', event.dto.body.action, '500', 'Action Not Supported');
                break;
        }
    }
    async onUnsupportedAction(event) {
        this.logger.info({ func: 'onUnsupportedAction', event: event });
    }
    async onCreateConference(event) {
        try {
            let req = this.convert2ApiGwFormat(event);
            this.logger.info({ func: 'onCreateConference', request: req });
            await this.callService.createRoom(req);
        }
        catch (e) {
            this.logger.error({ msg: e.message, event: event });
        }
    }
    addParticipants(participants) {
        this.logger.info({ func: 'addParticipants', participants: participants });
    }
    async onJoinConference(event) {
        try {
            let req = this.convert2ApiGwFormat(event);
            this.logger.info({ func: 'onJoinConference', request: req });
            if (event.body.participantsList != undefined) {
                this.addParticipants(event.body.participantsList);
            }
            if (event.body.reason == 'Join') {
                await this.callService.makeCall(req);
            }
            else {
                await this.callService.updateCall(req);
            }
        }
        catch (e) {
            this.logger.error({ msg: e.message, event: event });
        }
    }
    async onModifyConnection(event) {
        try {
            let req = this.convert2ApiGwFormat(event);
            this.logger.info({ func: 'onModifyConference', request: req });
            await this.callService.updateCall(req);
        }
        catch (e) {
            this.logger.error({ msg: e.message, event: event });
        }
    }
    async onCloseConnection(event) {
        try {
            let req = this.convert2ApiGwFormat(event);
            this.logger.info({ func: 'onCloseConnection', request: req });
            await this.callService.endCall(req);
        }
        catch (e) {
            this.logger.error({ msg: e.message, event: event });
        }
    }
    async onDestroyConference(event) {
        try {
            let req = this.convert2ApiGwFormat(event);
            this.logger.info({ func: 'onDestroyConference', request: req });
            await this.callService.closeRoom(req);
        }
        catch (e) {
            this.logger.error({ msg: e.message, event: event });
        }
    }
    async onCreatePublisher(event) {
        try {
            let req = this.convert2ApiGwFormat(event);
            this.logger.info({ func: 'onCreatePublisher', request: req });
            await this.callService.makeCall(req);
        }
        catch (e) {
            this.logger.error({ msg: e.message, event: event });
        }
    }
    async onStopPublisher(event) {
        try {
            let req = this.convert2ApiGwFormat(event);
            this.logger.info({ func: 'onStopPublisher', request: req });
            await this.callService.endCall(req);
        }
        catch (e) {
            this.logger.error({ msg: e.message, event: event });
        }
    }
    async createConferenceAck(rsp) {
        this.logger.info({ func: 'createConferenceAck', rsp: rsp });
        return await this.response2User(rsp, constants_1.CREATE_CONFERENCE_ACTION_ACK, 'createConference');
    }
    async joinConferenceAck(rsp) {
        this.logger.info({ func: 'JoinConferenceACK', rsp: rsp });
        return await this.response2User(rsp, constants_1.VIDEO_START_ACTION_ACK, 'JoinConference');
    }
    async modifyConnectionAck(rsp) {
        this.logger.info({ func: 'modifyConnectionAck', rsp: rsp });
        return await this.response2User(rsp, constants_1.MODIFY_CONNECTION_ACTION_ACK, 'modifyConnection');
    }
    async closeConnectionAck(rsp) {
        this.logger.info({ func: 'closeConnectionAck', rsp: rsp });
        return await this.response2User(rsp, constants_1.TERMINATE_CONNECTION_ACTION_ACK, 'terminateConnection');
    }
    async destroyConferenceAck(rsp) {
        this.logger.info({ func: 'destroyConferenceAck', rsp: rsp });
        return await this.response2User(rsp, constants_1.DESTROY_CONFERENCE_ACTION_ACK, 'destroyConference');
    }
    async createPublisherAck(rsp) {
        this.logger.info({ func: 'createPublisherAck', rsp: rsp });
        return await this.response2User(rsp, constants_1.START_SCREEN_SHARE_ACTION_ACK, 'startScreenShare');
    }
    async stopPublisherAck(rsp) {
        this.logger.info({ func: 'stopPublisherAck', rsp: rsp });
        return await this.response2User(rsp, constants_1.STOP_SCREEN_SHARE_ACTION_ACK, 'stopScreenShare');
    }
};
ClientMsgHandler = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mculogger_service_1.MculoggerService,
        db_service_1.DbService,
        ws_dispatcher_1.WsDispatcher,
        call_service_api_1.CallServiceApiImpl,
        validators_factory_1.ValidatorsFactory,
        error_builder_1.ErrorBuilder,
        configuration_service_1.ConfigurationService,
        push_notification_service_1.PushNotificationService,
        cdr_service_1.CdrService,
        counter_service_1.CounterService])
], ClientMsgHandler);
exports.ClientMsgHandler = ClientMsgHandler;
//# sourceMappingURL=client.msg.handler.js.map