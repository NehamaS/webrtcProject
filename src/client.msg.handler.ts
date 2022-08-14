import {HttpException, HttpStatus, Injectable, OnApplicationBootstrap} from '@nestjs/common';
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {ApiGwDto} from "./dto/api.gw.dto";
import {DbService} from "./common/db/db.service";
import {WsDispatcher} from "./ws.dispatcher";
import {ApiGwFormatDto} from "./dto/apiGwFormatDto";
import {CallServiceApiImpl} from "./callserviceapi/call.service.api";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {PushNotificationService} from "./push/push.notification.service";
import {
    ANSWER_ACTION,
    API_GW_BAD_FORBIDDEN,
    API_GW_BAD_REQUEST,
    API_GW_BUSY_HERE,
    API_GW_NORMAL,
    API_GW_NOT_FOUND,
    API_GW_RINGING,
    API_GW_UNAUTHORIZED,
    CALL_SERVICE_BAD_EVENT,
    CALL_SERVICE_OK,
    CALL_SERVICE_RINGING,
    CALL_SERVICE_TYPE,
    CONFERENCE_TYPE,
    CREATE_CONFERENCE_ACTION,
    CREATE_CONFERENCE_ACTION_ACK,
    DESTROY_CONFERENCE_ACTION,
    DESTROY_CONFERENCE_ACTION_ACK,
    getMessageId,
    HOLD_ACTION,
    HOLD_ACTION_ACK,
    JOIN_REASON,
    MODIFY_ACTION,
    MODIFY_ACTION_ACK,
    MODIFY_CONNECTION_ACTION,
    MODIFY_CONNECTION_ACTION_ACK,
    NO_CONNECTION,
    REGISTER_ACTION,
    REGISTER_ACTION_ACK,
    RESUME_ACTION,
    RESUME_ACTION_ACK,
    START_ACTION,
    START_SCREEN_SHARE_ACTION,
    START_SCREEN_SHARE_ACTION_ACK,
    STATUS_ACTION,
    STOP_SCREEN_SHARE_ACTION,
    STOP_SCREEN_SHARE_ACTION_ACK,
    TERMINATE_ACK_ACTION,
    TERMINATE_ACTION,
    TERMINATE_CONNECTION_ACTION,
    TERMINATE_CONNECTION_ACTION_ACK,
    UNREGISTER_ACTION,
    VIDEO_START_ACTION,
    VIDEO_START_ACTION_ACK,
    WEBRTC_GW_VERSION,
    ADD_PARTICIPANT_ACTION,
    JOIN_CONFERENCE_ACTION,
    JOIN_CONFERENCE_ACTION_ACK,
    ADD_PARTICIPANT_ACTION_ACK
} from "./common/constants";
import {WsRequestDto} from "./dto/ws.request.dto";
import {UserDataDto} from "./dto/user.data.dto";
import {SessionDto} from "./dto/session.dto";
import {ValidatorsFactory} from "./common/validators/validators.factory";
import {IValidator} from "./common/validators/validator";
import {ErrorBuilder} from "./common/error.builder";
import {promisify} from "util";
import {CdrService} from "./cdr/cdr.service";
import {CounterService} from "./metrics/counter.service";
import {CounterType} from "service-infrastructure/dd-metrics/metrics.service";
import * as _ from 'lodash'

@Injectable()
export class ClientMsgHandler implements OnApplicationBootstrap {
    private persist: boolean;
    private useLocalWs: boolean;
    private pushNotify: boolean;

    constructor(private readonly logger: MculoggerService,
                private readonly dbService: DbService,
                private readonly wsDispatcher: WsDispatcher,
                private readonly callService: CallServiceApiImpl,
                private readonly validatorsFactory: ValidatorsFactory,
                private readonly errorBuilder: ErrorBuilder,
                private readonly config: ConfigurationService,
                private readonly notification: PushNotificationService,
                private readonly cdrService: CdrService,
                private readonly counterService: CounterService) {
    }

    onApplicationBootstrap() {
        this.persist = this.config.get("auth.token.persist", false);
        this.useLocalWs = this.config.get("websocket.ws.enabled", false);
        this.pushNotify = this.config.get("pushNotification.enabled", false);

        this.logger.info({service: 'ClientMsgHandler', persist: this.persist, localWS: this.useLocalWs, pushNotify: this.pushNotify});
    }

    // Events from AWS API GW
    public async wsDisconnect(connId: string): Promise<boolean> {
        return this.onDisconnect(connId);
    }

    public async handleMsg(event: WsRequestDto): Promise<void> {
        this.logger.info({func: 'handleMsg', event: event});

        try { //Return an error in cas of validator failure
            let action: string = event.dto.type === REGISTER_ACTION ? REGISTER_ACTION : event.dto.body.action
            let validator: IValidator = this.validatorsFactory.getValidator(action)
            validator.validate(event.dto)
        } catch (e) {
            let errorMsg: ApiGwDto = this.errorBuilder.buildErrorResponseWsRequestDto(event, HttpStatus.BAD_REQUEST.toString(), e.message)
            this.counterService.setCounter(CounterType.incrementCounter,  errorMsg)
            await this.wsDispatcher.sendMessage(event.connectionId, errorMsg)
            // throw new HttpException( errorMsg,HttpStatus.BAD_REQUEST) //Dispatcher
            return
        }

        try {
            switch (event.dto.type) {
                case REGISTER_ACTION:
                    this.preformAction(this.onRegister, event)
                    break;
                case UNREGISTER_ACTION:
                    this.preformAction(this.onUnregister, event)
                    break;
                case CONFERENCE_TYPE:
                    await this.conferenceAction(event);
                    break;
                case CALL_SERVICE_TYPE:

                    //let persist: boolean = this.config.get("auth.token.persist", false);
                    let callData: ApiGwDto
                    if(this.persist){
                        callData = await this.getUserData(event)
                        if (callData === undefined) {
                            let error: string = `No data found in DynamoDb for connectionId ${event.connectionId}`
                            this.logger.error({action: `${START_ACTION} failed`, reason: error})
                            return //Error sent via Dispatcher in getUserData methods
                            // throw new Error("Connection Id not found in DynamoDb")
                        }
                        event = _.merge(event, callData)
                    }

                    //let callData: ApiGwDto = await this.getUserData(event)
                    //this.logger.debug(callData);
                    switch (event.dto.body.action) {
                        case START_ACTION:
                            //Save session data
                            if(!this.persist) { //@TODO remove this condition block when persist configuration will remove in future
                                callData = await this.getUserData(event)
                                if (callData === undefined) {
                                    let error: string = `No data found in DynamoDb for connectionId ${event.connectionId}`
                                    this.logger.error({action: `${START_ACTION} failed`, reason: error})
                                    return //Error sent via Dispatcher in getUserData methods
                                    // throw new Error("Connection Id not found")
                                }
                            }
                            let sessionData: SessionDto = new SessionDto()
                            sessionData.callId = event.dto.callId
                            if (event.dto.meetingId) {
                                sessionData.meetingId = event.dto.meetingId
                            }
                            sessionData.deviceId = callData.body.deviceId
                            sessionData.userId = callData.body.userId

                            // setStartTime4SessData store the sessionData in dbService
                            await this.cdrService.setStartTime4SessData(event, callData, sessionData);

                            if(event.dto.body.reason === JOIN_REASON) {
                                this.counterService.setCounter(CounterType.incrementCounter,event.dto)
                            }
                            this.preformAction(this.onCallStart, callData)
                            break;
                        case STATUS_ACTION:
                            await this.preformAction(this.onCallStatus, event.dto)
                            break;
                        case ANSWER_ACTION:
                            this.preformAction(this.onAnswer, event.dto)
                            break;
                        case TERMINATE_ACTION:
                            this.counterService.setCounter( CounterType.incrementCounter, event.dto)
                            this.preformAction(this.onTerminate, event.dto)
                            break;
                        case TERMINATE_ACK_ACTION:
                            this.counterService.setCounter( CounterType.incrementCounter, event.dto)
                            this.preformAction(this.onTerminateAck, event.dto)
                            break;
                        case HOLD_ACTION:
                        case RESUME_ACTION:
                        case MODIFY_ACTION:
                            this.preformAction(this.onModify, event.dto)
                            break;
                        case HOLD_ACTION_ACK:
                        case RESUME_ACTION_ACK:
                        case MODIFY_ACTION_ACK:
                            this.preformAction(this.onModifyAck, event.dto)
                            break;
                        default:
                            throw new Error(`func: handleMsg error, action: ${event.dto.body.action} is not supported`)
                    }
                    break;
                default:
                    let message: string = `handleMsg error, type: ${event.dto.type} is not supported`
                    this.logger.error({error: message})
                    throw new Error(message)

            }
        } catch (e) {

            // event.dto.body.statusCode = HttpStatus.BAD_REQUEST.toString()
            this.logger.error({error: e.message ? e.message : e})
            let errorMsg:ApiGwDto = this.errorBuilder.buildErrorResponseWsRequestDto(event, HttpStatus.BAD_REQUEST.toString(), e.message)
            this.counterService.setCounter(CounterType.incrementCounter,errorMsg)
            await this.wsDispatcher.sendMessage(event.connectionId, errorMsg)
        }
    }

    private async getUserData(wsRequest: WsRequestDto): Promise<ApiGwDto> {
        let userData: UserDataDto = await this.dbService.getByConnectionId(wsRequest.connectionId)

        if (userData === undefined) {
            let error: string = `No data found in DynamoDb for connectionId ${wsRequest.connectionId}`
            this.logger.error({action: "getUserData", reason: error})
            let errorMsg: ApiGwDto = this.errorBuilder.buildErrorResponseWsRequestDto(wsRequest, HttpStatus.BAD_REQUEST.toString(), error)
            this.counterService.setCounter(CounterType.incrementCounter, errorMsg)
            await this.wsDispatcher.sendMessage(wsRequest.connectionId, errorMsg)
            return undefined
        }

        /** UserDataDto
         deviceId: string;
         userId: string //*tel || email*;
         connectionId: string;
         protocolVersion?: string;
         accessToken?: string
         PNSToken?: string
         deviceType?: "ANDROID"|"IOS"|"WEB_BROWSER"|"WEB_DESKTOP";
         organizationSid?: string;
         accountSid?: string;
         appSid?: string;
         */

        wsRequest.dto.body.deviceId = userData.deviceId
        wsRequest.dto.body.userId = userData.userId
        wsRequest.dto.body.accessToken = userData.accessToken
        wsRequest.dto.body.appSid = userData.appSid
        wsRequest.dto.body.organizationId = userData.organizationSid
        wsRequest.dto.body.accountId = userData.accountSid
        wsRequest.dto.body.deviceType = userData.deviceType

        return wsRequest.dto
    }

    // Responses From RestCommService on StartCall
    public async ring(rsp: ApiGwFormatDto): Promise<void> {
        this.logger.info({func: 'ring', rsp: rsp});
        await this.ringCall(rsp);
    }

    public async connect(rsp: ApiGwFormatDto): Promise<void> {
        this.logger.info({func: 'connect', rsp: rsp});
        await this.answerCall(rsp);
    }

    public async reject(rsp: ApiGwFormatDto): Promise<void> {
        this.logger.info({func: 'reject', rsp: rsp});
        return await this.rejectCall(rsp);
    }

    public endCallAck(rsp: ApiGwFormatDto): void {
        this.logger.info({func: 'endCallAck', rsp: rsp});
    }

    public async updateAck(rsp: ApiGwFormatDto): Promise<void> {
        this.logger.info({func: 'updateAck', rsp: rsp});
        await this.modifyResponse(rsp);
    }

    // Requests From RestCommService
    public async call(req: ApiGwFormatDto): Promise<void> {
        this.logger.info({func: 'call', request: req});
        await this.startCall(req);
    }

    public async update(req: ApiGwFormatDto): Promise<void> {
        this.logger.info({func: 'update', request: req});
        await this.modifyCall(req);
    }

    public async disconnect(req: ApiGwFormatDto): Promise<void> {
        this.logger.info({func: 'disconnect', msg: req});
        await this.endCall(req);
    }

    public async onDisconnect(connId: string): Promise<boolean> {
        this.logger.info({func: 'onDisconnect', connId: connId});

        let userData: UserDataDto = await this.dbService.getByConnectionId(connId);
        if (userData !== undefined) {
            let data: UserDataDto = new UserDataDto()
            data.connectionId = 'none';
            data.userId = userData.userId;
            data.deviceId = userData.deviceId
            return await this.dbService.updateUsersData(data);
        }

        this.logger.warn({func: 'onDisconnect', connId: connId, desc: 'not present in db'});
        return false;
    }

    public async onRegister(event: WsRequestDto): Promise<void> {
        this.logger.info({func: 'onRegister', event: event});

        try {
            let userData: UserDataDto = {
                userId: event.dto.source,
                deviceId: event.dto.body.deviceId,
                connectionId: event.connectionId,
                deviceType: event.dto.body.deviceType,
                protocolVersion: event.dto.body.protocolVersion,
                PNSToken: event.dto.body.PNSToken,
                appSid: event.dto.body.appSid
            }

            //let persist: boolean = this.config.get("auth.token.persist", false);
            if (this.persist && !this.useLocalWs) {
                await this.dbService.updateUsersData(userData) //Update UserDataDto - Set was done in guard
            } else {
                let user: UserDataDto = await this.dbService.getByConnectionId(userData.connectionId);
                if (user !== undefined) {
                    userData.accessToken = user.accessToken;
                    userData.appSid = user.appSid;
                    userData.organizationSid = user.organizationSid;
                    userData.accountSid = user.accountSid;
                }
                await this.dbService.setUser(userData) //Save UserDataDto
            }

            // send success response to User
            let msg: ApiGwDto = {
                callId: event.dto.callId,
                messageId: getMessageId(event.dto.messageId),
                source: 'GW',
                destination: event.dto.source,
                ts: new Date().getTime(),
                type: REGISTER_ACTION_ACK,
                meetingId: event.dto.meetingId,
                body: {
                    requestMessageId: event.dto.messageId,
                    GWVersion: WEBRTC_GW_VERSION
                }
            }

            this.logger.info({func: 'onRegister', response: msg});
            await this.wsDispatcher.sendMessage(event.connectionId, msg);
        } catch (e) {
            this.logger.error({msg: 'register failed', error: e.message})
            throw new HttpException(`Register failed ${e.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async onUnregister(event: WsRequestDto): Promise<void> {
        this.logger.info({func: 'onUnregister', event: event});

        try {
            let userData: UserDataDto = {
                userId: event.dto.source,
                deviceId: event.dto.body.deviceId,
                connectionId: event.connectionId,
                deviceType: event.dto.body.deviceType,
                protocolVersion: event.dto.body.protocolVersion,
                PNSToken: event.dto.body.PNSToken,
                appSid: event.dto.body.appSid
            }

            let isUserDataDelete: boolean = await this.dbService.delUsersData(userData.userId, userData.deviceId);
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
        } catch (e) {
            this.logger.error({msg: 'Unregister failed', error: e.message})
            throw new HttpException(`Unregister failed ${e.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public convert2ApiGwFormat(event: ApiGwDto): ApiGwFormatDto {
        let request: ApiGwFormatDto = {
            caller: event.source,
            callee: event.destination,
            callId: event.callId,
            sequence: event.messageId,
            accessToken: event.body.accessToken,
            appSid: event.body.appSid,
            reason: event.body.reason
        };

        if (event.body.requestMessageId != undefined) {
            //request.requestMessageId = event.body.requestMessageId;
            let index = event.body.requestMessageId.lastIndexOf("_");
            if (index != -1) {
                request.sequence = event.body.requestMessageId.substring(index + 1);
            } else {
                request.sequence = event.body.requestMessageId;
            }
        }

        if (event.body.service != undefined) {
            request.service = event.body.service;

            if (request.service == 'P2M') {
                if (event.body.action == START_SCREEN_SHARE_ACTION || event.body.action == STOP_SCREEN_SHARE_ACTION) {
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
                case  ANSWER_ACTION:
                    request.method = 'call';
                    break;
                case HOLD_ACTION_ACK:
                case RESUME_ACTION_ACK:
                case MODIFY_ACTION_ACK:
                    request.method = 'update';
                    break;
                default:
                    break;
            }

            switch (event.body.statusCode) {
                case API_GW_NORMAL.CODE:
                    if (event.body.action !== TERMINATE_ACK_ACTION && event.body.action !== TERMINATE_ACTION) {
                        request.status = {code: CALL_SERVICE_RINGING.CODE, desc: CALL_SERVICE_RINGING.DESC};
                    } else {
                        request.status = {code: CALL_SERVICE_OK.CODE, desc: CALL_SERVICE_OK.DESC};
                    }
                    break;
                case API_GW_BAD_REQUEST.CODE:
                case API_GW_UNAUTHORIZED.CODE:
                case API_GW_BAD_FORBIDDEN.CODE:
                case API_GW_NOT_FOUND.CODE:
                case API_GW_BUSY_HERE.CODE:
                    request.status = {code: event.body.statusCode, desc: event.body.description};
                    break;
                default:
                    request.status = {code: CALL_SERVICE_BAD_EVENT.CODE, desc: CALL_SERVICE_BAD_EVENT.DESC};
                    break;
            }
        }

        return request;
    }

    public async onCallStart(event: ApiGwDto): Promise<void> {
        try {
            this.logger.debug({func: 'onCallStart', event: event});

            let req: ApiGwFormatDto = this.convert2ApiGwFormat(event);
            this.logger.info({func: 'onCallStart', request: req});

            if (event.body.reason === JOIN_REASON) {
                await this.callService.makeCall(req);
            } else { // Reconnect
                let seq: string = event.messageId
                await this.dbService.setAction(event.callId, seq, event.body.action);
                await this.callService.updateCall(req);
            }
        } catch (e) {
            this.logger.error({msg: e.message, event: event})
            //@TODO clear DB and send WS error
        }
    }

    public async onModify(event: ApiGwDto): Promise<void> {
        this.logger.debug({func: 'onModify', event: event});

        let req: ApiGwFormatDto = this.convert2ApiGwFormat(event);
        this.logger.info({func: 'onModify', request: req});
        await this.dbService.setAction(event.callId, event.messageId, event.body.action);
        await this.callService.updateCall(req);
    }

    public async onTerminate(event: ApiGwDto): Promise<void> {
        this.logger.debug({func: 'onTerminate', event: event});

        let req: ApiGwFormatDto = this.convert2ApiGwFormat(event);
        this.logger.info({func: 'onTerminate', request: req});

        // CDR
        await Promise.all([this.cdrService.writeCdr(req), this.callService.endCall(req)]);
    }

    public async onTerminateAck(event: ApiGwDto): Promise<void> {
        this.logger.info({func: 'onTerminateAck', event: event});

        let req: ApiGwFormatDto = this.convert2ApiGwFormat(event);
        this.logger.info({func: 'onTerminateAck', request: req});

        await this.callService.endCallResponse(req); //200 OK on BYE already send
    }

    public async onCallStatus(event: ApiGwDto): Promise<void> {
        this.logger.debug({func: 'onCallStatus', event: event});

        let rsp: ApiGwFormatDto = this.convert2ApiGwFormat(event);
        this.logger.info({func: 'onCallStatus', response: rsp});

        if (rsp.status.code === CALL_SERVICE_RINGING.CODE) {
            await this.callService.ringingResponse(rsp);
            return;
        }

        this.counterService.setCounter(CounterType.incrementCounter, event)
        await this.callService.rejectResponse(rsp);
    }

    public async onAnswer(event: ApiGwDto): Promise<void> {
        this.logger.debug({func: 'onAnswer', event: event});

        let rsp: ApiGwFormatDto = this.convert2ApiGwFormat(event);
        this.logger.info({func: 'onAnswer', response: rsp});

        // CDR
        await this.cdrService.setAnswerTime4SessData(event);

        await this.callService.connectResponse(rsp);
    }

    public async onModifyAck(event: ApiGwDto): Promise<void> {
        this.logger.debug({func: 'onModifyAck', event: event});

        let rsp: ApiGwFormatDto = this.convert2ApiGwFormat(event);
        this.logger.info({func: 'onModifyAck', response: rsp});

        await this.callService.updateResponse(rsp);
    }

    public convert2ApiGwDto(msg: ApiGwFormatDto, action: string): ApiGwDto {
        let event: ApiGwDto = {
            // source: (action === TERMINATE_ACTION) ? msg.caller : msg.callee,
            // destination: (action === TERMINATE_ACTION) ? msg.callee : msg.caller,
            source: msg.caller,
            destination: msg.callee,
            callId: msg.callId,
            ts: new Date().getTime(),
            type: CALL_SERVICE_TYPE,
            messageId: getMessageId(msg.sequence, msg.service),
            body: {
                action: action
            }
        };

        // conference
        switch (action) {
            case CREATE_CONFERENCE_ACTION_ACK:
            case VIDEO_START_ACTION_ACK:
            case MODIFY_CONNECTION_ACTION_ACK:
            case TERMINATE_CONNECTION_ACTION_ACK:
            case DESTROY_CONFERENCE_ACTION_ACK:
            case START_SCREEN_SHARE_ACTION_ACK:
            case STOP_SCREEN_SHARE_ACTION_ACK:
                if (msg.service == 'P2M') {
                    event.type = CONFERENCE_TYPE;
                }
                break;
            default:
                break;
        }

        if (msg.meetingId != undefined) {
            event.meetingId = msg.meetingId;
        }

        let requestMessageId: string = msg.requestMessageId ? msg.requestMessageId : msg.sequence;

        switch (action) {
            case STATUS_ACTION:
                if (msg.status.code === CALL_SERVICE_RINGING.CODE) {
                    event.body = {
                        action: action, requestMessageId: requestMessageId,
                        statusCode: API_GW_RINGING.CODE, description: API_GW_RINGING.DESC
                    };
                } else {
                    event.body = {
                        action: action, requestMessageId: requestMessageId,
                        statusCode: msg.status.code, description: msg.status.desc
                    };
                }
                break;

            case ANSWER_ACTION:
            case HOLD_ACTION_ACK:
            case RESUME_ACTION_ACK:
            case MODIFY_ACTION_ACK:
            case CREATE_CONFERENCE_ACTION_ACK:
            case VIDEO_START_ACTION_ACK:
            case MODIFY_CONNECTION_ACTION_ACK:
            case TERMINATE_CONNECTION_ACTION_ACK:
            case DESTROY_CONFERENCE_ACTION_ACK:
            case START_SCREEN_SHARE_ACTION_ACK:
            case STOP_SCREEN_SHARE_ACTION_ACK:

                if (msg.status != undefined && msg.status.code != CALL_SERVICE_OK.CODE) {
                    event.body = {action: action, statusCode: msg.status.code, description: msg.status.desc};
                } else {
                    event.body = {action: action, requestMessageId: requestMessageId};
                    if (msg.sdp != undefined) {
                        event.body.sdp = msg.sdp;
                    }
                }

                if (event.type == CONFERENCE_TYPE && msg.meetingId != undefined) {
                    event.body.meetingId = msg.meetingId;
                }
                break;

            case START_ACTION:
            case HOLD_ACTION:
            case RESUME_ACTION:
            case MODIFY_ACTION:
                event.body = {action: action, sdp: msg.sdp};
                break;

            case TERMINATE_ACTION:
                if (msg.status != undefined && msg.status.code != undefined) {
                    event.body = {action: action, statusCode: msg.status.code, description: msg.status.desc};
                } else {
                    event.body = {action: action, statusCode: API_GW_NORMAL.CODE, description: API_GW_NORMAL.DESC};
                }
                break;

            default:
                this.logger.error({func: 'convert2ApiGwDto', action: action, desc: 'action not supported'});

                if (msg.status != undefined && msg.status.code != undefined) {
                    event.body = {
                        action: action,
                        requestMessageId: requestMessageId,
                        statusCode: msg.status.code,
                        description: msg.status.desc
                    };
                } else {
                    event.body = {action: action, requestMessageId: requestMessageId};
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

    public buildErrRsp(req: ApiGwFormatDto, code: string, desc: string): ApiGwFormatDto {
        let rsp: ApiGwFormatDto = {
            caller: req.callee, callee: req.caller,
            callId: req.callId, sequence: req.sequence,
            status: {
                code: code,
                desc: desc
            }
        };
        if(req.service && req.service != undefined) {
            rsp.service = req.service;
        }
        if(req.meetingId && req.meetingId != undefined) {
            rsp.meetingId = req.meetingId;
        }

        rsp.reason = desc;

        return rsp;
    }

    public async userNotFound(action: string, dest: string, req: ApiGwFormatDto): Promise<void> {
        this.logger.error({func: 'userNotFound', action: action, user: dest, err: 'get user ws connection failed'});
        let rsp: ApiGwFormatDto = this.buildErrRsp(req, "404", 'Not Found');
        if (action == MODIFY_ACTION) {
            await this.callService.updateRejectResponse(rsp);
        } else {
            await this.callService.rejectResponse(rsp);
        }
    }

    public async callUser(req: ApiGwFormatDto, action: string): Promise<void> {
        let request: ApiGwDto = this.convert2ApiGwDto(req, action);
        this.logger.info({func: 'callUser', action: action, request: request});

        if (action == START_ACTION) {
            let connectionId: string = await this.getConnIdForStartCall(req);
            if (connectionId) {
                await this.wsDispatcher.sendMessage(connectionId, request);
                return;
            }
            else {
                if (this.pushNotify) {
                    connectionId = await this.sendPushNotification(req);
                    if(connectionId) {
                        await this.wsDispatcher.sendMessage(connectionId, request);
                        return;
                    }
                }
            }
        } else {
            let sessionData: SessionDto = await this.dbService.getSessionData(request.callId);
            if (sessionData) {
                this.logger.info({msg: "callUser", sessionData: sessionData});
                let userData: UserDataDto = await this.dbService.getUserData(sessionData.userId, sessionData.deviceId)
                this.logger.info({msg: "callUser", userSessionData: userData});
                if (userData && userData.connectionId && userData.connectionId != NO_CONNECTION) {
                    await this.wsDispatcher.sendMessage(userData.connectionId, request);
                    return;
                }
            }
        }

        this.logger.info({msg: "callUser", user: req.callee, desc: 'disconnected', action: action, callId: req.callId});
        await this.userNotFound(action, request.destination, req);
    }

    public async getConnIdForStartCall(req: ApiGwFormatDto): Promise<string> {

        let userDataArr: Array<UserDataDto> = await this.dbService.getByUserId(req.callee);
        this.logger.info({msg: "callUser - START_ACTION", getByUserId: req.callee, userDataArr: userDataArr});

        if (Array.isArray(userDataArr) && userDataArr.length !== 0) {
            let userData: UserDataDto = userDataArr.find(data => {
                if (data && data.connectionId && data.connectionId !== NO_CONNECTION) {
                    return data;
                }
            });

            this.logger.info({msg: "callUser - START_ACTION", userData: userData});

            if (userData && userData.deviceType) { //userData.deviceType undefined when client made connection but no register

                req.accessToken = userData.accessToken;

                //create user session for the leg
                let sessionData: SessionDto = new SessionDto()
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

    public async sendPushNotification(req: ApiGwFormatDto): Promise<string> {
        this.logger.info({func: 'sendPushNotification', request: req});

        let userSessionData: Array<UserDataDto> = await this.dbService.getByUserId(req.callee);
        this.logger.info({msg: "sendPushNotification", userSessionData: userSessionData});

        if (Array.isArray(userSessionData) && userSessionData.length != 0) {
            userSessionData.forEach((userData) => {
                this.notification.sendNotification(req.caller, userData);
            });

            let timeout: number = this.config.get("pushNotification.timeout", 1000);
            let retry: number = this.config.get("pushNotification.retry", 20);
            let self = this;

            const sleep = promisify(setTimeout)
            while (retry > 0) {
                await sleep(timeout)
                self.logger.info({
                    msg: "notification timer expired, check if the client already connected",
                    timer: timeout,
                    userId: req.callee
                });
                let connectionId: string = await this.getConnIdForStartCall(req);
                if (connectionId) {
                    return connectionId
                }
                retry--
            }
        }
        this.logger.error({func: 'sendPushNotification: user was not found', userId: req.callee, callId: req.callId});
    }

    public async startCall(req: ApiGwFormatDto): Promise<void> {
        await this.callUser(req, START_ACTION);
    }

    public async modifyCall(req: ApiGwFormatDto): Promise<void> {
        await this.callUser(req, MODIFY_ACTION);
    }

    public async endCall(req: ApiGwFormatDto): Promise<void> {
        await this.callUser(req, TERMINATE_ACTION);
    }

    public async buildErrReq(rsp: ApiGwFormatDto): Promise<ApiGwFormatDto> {
        return  <ApiGwFormatDto> {
            caller: rsp.callee,
            callee: rsp.caller,
            callId: rsp.callId,
            sequence: rsp.sequence + 1,
        };
    }

    public async cancelCall(action: string, dest: string, rsp: ApiGwFormatDto): Promise<void> {
        this.logger.error({func: 'cancelCall', action: action, user: dest, err: 'get user ws connection failed'});
        let req: ApiGwFormatDto = await this.buildErrReq(rsp);
        await this.callService.endCall(req);
    }

    public async response2User(rsp: ApiGwFormatDto, reqAction: string, rspAction: string): Promise<void> {
        let response: ApiGwDto = this.convert2ApiGwDto(rsp, reqAction);

        //In Incoming response there is mix between source and destination
        response.destination = rsp.caller
        response.source = rsp.callee

        this.logger.info({func: 'response2User', reqAction: reqAction, rspAction: rspAction, response: response});

        let sessionData: SessionDto = await this.dbService.getSessionData(response.callId);
        if (sessionData) {
            let userData: UserDataDto = await this.dbService.getUserData(sessionData.userId, sessionData.deviceId)

            if (userData !== undefined && userData.connectionId !== undefined) {
                return await this.wsDispatcher.sendMessage(userData.connectionId, response);
            } else {

                this.logger.error({
                    func: 'response2User',
                    user: response.destination,
                    err: `userData does not exist for userId: ${sessionData.userId} and deviceId: ${sessionData.deviceId}`
                });
            }

        } else {
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

    public async ringCall(rsp: ApiGwFormatDto): Promise<void> {
        return await this.response2User(rsp, STATUS_ACTION, 'ringCall');
    }

    public async answerCall(rsp: ApiGwFormatDto): Promise<void> {
        return await this.response2User(rsp, ANSWER_ACTION, 'answerCall');
    }

    public async modifyResponse(rsp: ApiGwFormatDto): Promise<void> {
        let action: string = await this.dbService.getAction(rsp.callId, rsp.sequence);
        return await this.response2User(rsp, action, 'modifyResponse');
    }

    public async rejectCall(rsp: ApiGwFormatDto): Promise<void> {
        await this.response2User(rsp, STATUS_ACTION, 'rejectCall');
        await this.clearDb(rsp.callId) //clear db
    }

    private preformAction(action: Function, event: WsRequestDto | ApiGwDto): void {
        setImmediate(async () => {
            try {
                await action.call(this, event)
            } catch (e) {
                let error: string = e.message ? e.message : e
                this.logger.error({action: "preformAction", error: error, event: event})

                //@TODO return WS error via dispatcher - but not in any cases
                let errorMsg: ApiGwDto
                if (event.hasOwnProperty('connectionId'))
                    errorMsg = this.errorBuilder.buildErrorResponseWsRequestDto(<WsRequestDto>event, HttpStatus.INTERNAL_SERVER_ERROR.toString(), error)
                else {
                    errorMsg = this.errorBuilder.buildErrorResponseApiGwDto(<ApiGwDto>event, HttpStatus.INTERNAL_SERVER_ERROR.toString(), error)
                }

                let connectionId: string
                if (event instanceof WsRequestDto) {
                    connectionId = event.connectionId
                } else {
                    let callId = event.callId
                    let sessionData: SessionDto = await this.dbService.getSessionData(callId)
                    if (sessionData != undefined) {
                        let userData: UserDataDto = await this.dbService.getUserData(sessionData.userId, sessionData.deviceId)
                        connectionId = userData.connectionId
                    } else {
                        this.logger.error({action: "preformAction", error: 'get session data fail', event: event})
                    }

                }
                setImmediate(async ()=> {
                    await this.wsDispatcher.sendMessage(connectionId, errorMsg);
                })

            }
        })
    }

    async clearDb(callId: string): Promise<void> {
        this.logger.info({action: "clearDb", callId: callId});
        await this.dbService.delSessionData(callId);
    }

    // Conference
    private async updateSessionData(event: WsRequestDto) : Promise<boolean> {
        let callData: ApiGwDto = await this.getUserData(event);
        if (callData === undefined) {
            this.logger.error({action: `getSessionData`, conn: event.connectionId, desc: 'get data failed'});
            await this.sendRejectResponse(event, event.dto.type, 'CreateAck', '500', 'User Not Register');
            return false;
        }

        let sessionData: SessionDto = new SessionDto();
        sessionData.callId = event.dto.callId;
        if(event.dto.meetingId) {
            sessionData.meetingId = event.dto.meetingId;
        }

        sessionData.deviceId = callData.body.deviceId;
        sessionData.userId = callData.body.userId;
        sessionData.serviceType = event.dto.type;

        await this.dbService.setSessionData(sessionData);
        return true;
    }

    private async sendRejectResponse(event: WsRequestDto, type: string, action: string, code: string, desc: string) {
        let rsp: ApiGwDto = {
            destination: event.dto.source,
            source: event.dto.destination,
            callId: event.dto.callId,
            messageId: '1',
            ts: new Date().getTime()/1000,
            type: type,
            body: {
                requestMessageId: event.dto.messageId,
                action : action,
                statusCode: code,
                description: desc
            }
        };

        this.counterService.setCounter(CounterType.incrementCounter, rsp) //Send reject response
        await this.wsDispatcher.sendMessage(event.connectionId, rsp);
    }

    private getResponseAction(action: string) : string {
        switch(action) {
            case CREATE_CONFERENCE_ACTION:
                return CREATE_CONFERENCE_ACTION_ACK;
            case VIDEO_START_ACTION:
                return VIDEO_START_ACTION_ACK;
            case MODIFY_CONNECTION_ACTION:
                return MODIFY_CONNECTION_ACTION_ACK;
            case TERMINATE_CONNECTION_ACTION:
                return TERMINATE_CONNECTION_ACTION_ACK;
            case DESTROY_CONFERENCE_ACTION:
                return DESTROY_CONFERENCE_ACTION_ACK;
            case START_SCREEN_SHARE_ACTION:
                return START_SCREEN_SHARE_ACTION_ACK;
            case STOP_SCREEN_SHARE_ACTION:
                return STOP_SCREEN_SHARE_ACTION_ACK;
            default:
                return 'Undefined';
        }
    }

    private getActionFunction(action: string) : Function {
        switch(action) {
            case CREATE_CONFERENCE_ACTION:
                return this.onCreateConference;
            case VIDEO_START_ACTION:
                return this.onConnectConference;
            case MODIFY_CONNECTION_ACTION:
                return this.onModifyConnection;
            case TERMINATE_CONNECTION_ACTION:
                return this.onCloseConnection;
            case DESTROY_CONFERENCE_ACTION:
                return this.onDestroyConference;
            case START_SCREEN_SHARE_ACTION:
                return this.onCreatePublisher;
            case STOP_SCREEN_SHARE_ACTION:
                return this.onStopPublisher;
            case ADD_PARTICIPANT_ACTION:
                return this.onAddParticipants;
            case JOIN_CONFERENCE_ACTION:
                return this.onJoinConference;
            default:
                return this.onUnsupportedAction;
        }
    }

    public async conferenceAction(event: WsRequestDto): Promise<void> {
        this.logger.info({func: 'conferenceAction', action: event.dto.body.action});

        let status: boolean;
        switch (event.dto.body.action) {
            case ADD_PARTICIPANT_ACTION:
                this.preformAction(this.getActionFunction(event.dto.body.action), event.dto);
                break;
            case JOIN_CONFERENCE_ACTION:
                this.preformAction(this.getActionFunction(event.dto.body.action), event.dto);
                break;
            case JOIN_CONFERENCE_ACTION_ACK:
                break;
            case CREATE_CONFERENCE_ACTION:
            case VIDEO_START_ACTION:
            case MODIFY_CONNECTION_ACTION:
            case TERMINATE_CONNECTION_ACTION:
            case DESTROY_CONFERENCE_ACTION:
            case START_SCREEN_SHARE_ACTION:
            case STOP_SCREEN_SHARE_ACTION:

                status = await this.updateSessionData(event);
                if (status) {
                    this.preformAction(this.getActionFunction(event.dto.body.action), event.dto);
                }
                else {
                    await this.sendRejectResponse(event, CONFERENCE_TYPE, this.getResponseAction(event.dto.body.action), '500', 'User Not Register');
                }
                break;
            default:
                this.logger.error({func: 'conferenceAction', action: event.dto.body.action, desc: 'not supported'});
                await this.sendRejectResponse(event, 'Video', event.dto.body.action, '500', 'Action Not Supported');
                break;
        }
    }

    // no action
    public async onUnsupportedAction(event: ApiGwDto): Promise<void> {
        this.logger.info({func: 'onUnsupportedAction', event: event});
    }

    public async onCreateConference(event: ApiGwDto): Promise<void> {
        try {
            let req: ApiGwFormatDto = this.convert2ApiGwFormat(event);
            this.logger.info({func: 'onCreateConference', request: req});

            await this.callService.createRoom(req);
        } catch (e) {
            this.logger.error({msg: e.message, event: event})
        }
    }

    public async onConnectConference(event: ApiGwDto): Promise<void> {
        try {
            let req: ApiGwFormatDto = this.convert2ApiGwFormat(event);
            this.logger.info({func: 'onConnectConference', request: req});

            if (event.body.reason == 'Join') {
                await this.callService.makeCall(req);
            }
            else {
                await this.callService.updateCall(req);
            }

            if (event.body.participantsList != undefined) {
                await this.onAddParticipants(event);
            }
        } catch (e) {
            this.logger.error({msg: e.message, event: event})
        }
    }

    public async onModifyConnection(event: ApiGwDto): Promise<void> {
        try {
            let req: ApiGwFormatDto = this.convert2ApiGwFormat(event);
            this.logger.info({func: 'onModifyConference', request: req});

            await this.callService.updateCall(req);
        } catch (e) {
            this.logger.error({msg: e.message, event: event})
        }
    }

    public async onCloseConnection(event: ApiGwDto): Promise<void> {
        try {
            let req: ApiGwFormatDto = this.convert2ApiGwFormat(event);
            this.logger.info({func: 'onCloseConnection', request: req});

            await this.callService.endCall(req);
        } catch (e) {
            this.logger.error({msg: e.message, event: event})
        }
    }

    public async onDestroyConference(event: ApiGwDto): Promise<void> {
        try {
            let req: ApiGwFormatDto = this.convert2ApiGwFormat(event);
            this.logger.info({func: 'onDestroyConference', request: req});

            await this.callService.closeRoom(req);
        } catch (e) {
            this.logger.error({msg: e.message, event: event})
        }
    }

    public async onCreatePublisher(event: ApiGwDto): Promise<void> {
        try {
            let req: ApiGwFormatDto = this.convert2ApiGwFormat(event);
            this.logger.info({func: 'onCreatePublisher', request: req});

            await this.callService.makeCall(req);
        } catch (e) {
            this.logger.error({msg: e.message, event: event})
        }
    }

    public async onStopPublisher(event: ApiGwDto): Promise<void> {
        try {
            let req: ApiGwFormatDto = this.convert2ApiGwFormat(event);
            this.logger.info({func: 'onStopPublisher', request: req});

            await this.callService.endCall(req);
        } catch (e) {
            this.logger.error({msg: e.message, event: event})
        }
    }

    public buildJoinConferenceMsg(event: ApiGwDto, index: number): ApiGwDto{
        return {
            callId : event.callId,
            messageId: '1',
            meetingId: event.meetingId,
            source: event.source,
            destination: event.body.participantsList[index],
            ts: new Date().getTime(),
            type: 'Video',
            body: {
                meetingName: event.body.meetingName,
                action: JOIN_CONFERENCE_ACTION,
                service: 'P2M'
            }
        };
    }

    public buildAddParticipantsAckMsg(event: ApiGwDto): ApiGwDto {
        return  {
            callId : event.callId,
            messageId: '1',
            meetingId: event.meetingId,
            source: event.destination,
            destination: event.source,
            ts: event.ts,
            type: 'Video',
            body: {
                meetingName: event.body.meetingName,
                action: ADD_PARTICIPANT_ACTION_ACK,
                service: 'P2M',
                requestMessageId: event.messageId
            }
        };
    }

    public async onJoinConference(event: ApiGwDto): Promise<void> {
        let req: ApiGwFormatDto = {
            caller: event.source,
            callee: event.destination,
            callId: event.callId,
            meetingId: event.meetingId,
            service: event.body.service
        }

        this.logger.info({func: 'onJoinConference', req: req});

        let connId: string = await this.getConnIdForStartCall(req);
        if (connId) {
            // for local debug only
            // event.body.action = 'JoinConferenceLocal';
            await this.wsDispatcher.sendMessage(connId, event);
        }
        else {
            this.logger.error({func: 'onJoinConference', calle: event.destination, err: 'get connection failed'});
        }
    }

    public async onAddParticipants(event: ApiGwDto): Promise<void> {
        let req: ApiGwFormatDto = this.convert2ApiGwFormat(event);
        this.logger.info({func: 'onAddParticipants', req: req});

        if (event.body.participantsList !== undefined) {
            for (let i: number = 0; i < event.body.participantsList.length; i++) {
                req.callee = event.body.participantsList[i];
                let connId: string = await this.getConnIdForStartCall(req);
                if (connId) {
                    let joinReq: ApiGwDto = this.buildJoinConferenceMsg(event, i);
                    await this.wsDispatcher.sendMessage(connId, joinReq);
                }
                else {
                    this.logger.warn({func: 'onAddParticipants', user: event.body.participantsList[i], desc: 'offline', pushNotification: this.pushNotify});

                    if (this.pushNotify) {
                        let req: ApiGwFormatDto = {
                            caller: event.source,
                            callee: event.body.participantsList[i],
                            callId: event.callId,
                            meetingId: event.meetingId,
                            service: event.body.service
                        }

                        let connId: string = await this.sendPushNotification(req);
                        if (connId) {
                            let joinReq: ApiGwDto = this.buildJoinConferenceMsg(event, i);
                            await this.wsDispatcher.sendMessage(connId, joinReq);
                        }
                    }
                }
            }
        }

        if (event.body.action !== ADD_PARTICIPANT_ACTION) {
            return;
        }

        req.callee = event.source;
        let rspConnId: string = await this.getConnIdForStartCall(req);
        if (rspConnId) {
            let addPartAck: ApiGwDto = this.buildAddParticipantsAckMsg(event);
            await this.wsDispatcher.sendMessage(rspConnId, addPartAck);
        }
    }

    // Responses From MSMl on Conference Requests
    public async createConferenceAck(rsp: ApiGwFormatDto): Promise<void> {
        this.logger.info({func: 'createConferenceAck', rsp: rsp});
        return await this.response2User(rsp, CREATE_CONFERENCE_ACTION_ACK, 'createConference');
    }

    public async joinConferenceAck(rsp: ApiGwFormatDto): Promise<void> {
        this.logger.info({func: 'JoinConferenceACK', rsp: rsp});
        return await this.response2User(rsp, VIDEO_START_ACTION_ACK, 'JoinConference');
    }

    public async modifyConnectionAck(rsp: ApiGwFormatDto): Promise<void> {
        this.logger.info({func: 'modifyConnectionAck', rsp: rsp});
        return await this.response2User(rsp, MODIFY_CONNECTION_ACTION_ACK, 'modifyConnection');
    }

    public async closeConnectionAck(rsp: ApiGwFormatDto): Promise<void> {
        this.logger.info({func: 'closeConnectionAck', rsp: rsp});
        return await this.response2User(rsp, TERMINATE_CONNECTION_ACTION_ACK, 'terminateConnection');
    }

    public async destroyConferenceAck(rsp: ApiGwFormatDto): Promise<void> {
        this.logger.info({func: 'destroyConferenceAck', rsp: rsp});
        return await this.response2User(rsp, DESTROY_CONFERENCE_ACTION_ACK, 'destroyConference');
    }

    public async createPublisherAck(rsp: ApiGwFormatDto): Promise<void> {
        this.logger.info({func: 'createPublisherAck', rsp: rsp});
        return await this.response2User(rsp, START_SCREEN_SHARE_ACTION_ACK, 'startScreenShare');
    }

    public async stopPublisherAck(rsp: ApiGwFormatDto): Promise<void> {
        this.logger.info({func: 'stopPublisherAck', rsp: rsp});
        return await this.response2User(rsp, STOP_SCREEN_SHARE_ACTION_ACK, 'stopScreenShare');
    }

}
