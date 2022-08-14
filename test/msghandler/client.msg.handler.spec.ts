import {Test, TestingModule} from '@nestjs/testing';
import {ClientMsgHandler} from "../../src/client.msg.handler";
import {WsDispatcher} from "../../src/ws.dispatcher";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {ApiGwDto} from "../../src/dto/api.gw.dto";
import {RestcommService} from "../../src/callserviceapi/restcomm/restcomm.service";
import {ApiGwFormatDto} from "../../src/dto/apiGwFormatDto";
import {DbService} from "../../src/common/db/db.service";

import {
    callAnswerResponse,
    callRejected,
    callRequest,
    callStartRequest,
    callStatusResponse,
    connectCallResponse,
    disconnectCallRequest,
    holdCallRequest,
    holdCallResponse,
    modifyCallRequest,
    modifyCallResponse,
    registerRequest,
    ringCallResponse,
    startCallRequest,
    startCallRequestNotFound,
    startCallRequestNoConnId,
    startCallRequestNoConnIdArray,
    terminateRequest,
    updateCallRequest,
    UnauthorizedCallResponse,
    createConference,
    createConferenceRsp,
    joinConference,
    joinConferenceRsp,
    leaveConference,
    leaveConferenceRsp,
    startScreenShare,
    startScreenShareRsp,
    joinConferenceReq,
    addParticipantsReq,
    addParticipantsRsp
} from './messages';
import {configServiceMock, loggerServiceMock, MetricsServiceMock} from "../testutils/test.mock";
import {UserDataDto} from "../../src/dto/user.data.dto";
import {SessionDto} from "../../src/dto/session.dto";
import {
    ANSWER_ACTION,
    API_GW_UNAUTHORIZED,
    CALL_SERVICE_TYPE,
    CONFERENCE_TYPE,
    CREATE_CONFERENCE_ACTION_ACK,
    HOLD_ACTION_ACK,
    VIDEO_START_ACTION_ACK,
    MODIFY_ACTION,
    MODIFY_ACTION_ACK,
    START_ACTION,
    START_SCREEN_SHARE_ACTION_ACK,
    STATUS_ACTION,
    TERMINATE_ACTION,
    TERMINATE_CONNECTION_ACTION_ACK
 } from "../../src/common/constants"
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {WsRequestDto} from "../../src/dto/ws.request.dto";
import {ValidatorsFactory} from "../../src/common/validators/validators.factory";
import {RegisterValidator} from "../../src/common/validators/register.validator";
import {CallStartValidator} from "../../src/common/validators/callstart.validator";
import {BaseValidator} from "../../src/common/validators/base.validator";
import {sleep} from "../testutils/test.utils";
import {CallStatusValidator} from "../../src/common/validators/callstatus.validator";
import {TerminateValidator} from "../../src/common/validators/terminate.validator";
import {AnswerValidator} from "../../src/common/validators/answer.validator";
import {ModifyValidator} from "../../src/common/validators/modify.validator";
import {ModifyAckValidator} from "../../src/common/validators/modifyack.validator";
import {TerminateAckValidator} from "../../src/common/validators/terminateack.validator";
import {ErrorBuilder} from "../../src/common/error.builder";
import {CallServiceApiImpl} from "../../src/callserviceapi/call.service.api";
import {FirebaseService} from "../../src/push/firebase/firebase.service";
import {PushNotificationService} from "../../src/push/push.notification.service";
import {CdrService} from "../../src/cdr/cdr.service";
import {CounterService} from "../../src/metrics/counter.service";
import {MetricsService} from "service-infrastructure/dd-metrics/metrics.service";


process.env.CONF_PATH = `${__dirname}/config.json`;
// jest.useFakeTimers();


export const WsDispatcherMock = {
    sendMessage: jest.fn().mockImplementation((wsConnectionId, msg) => {
        console.debug({msgId: wsConnectionId, msg: msg});
        return 200;
    }),
    sendMessage2WsInterface: jest.fn().mockImplementation((wsConnId, msg) => {
        console.debug({msgId: wsConnId, msg: msg});
        return 200;
    })
}

const wssAdminMock = {
    sendMessage:  jest.fn().mockImplementation((connId, msg) => {})
}

export const RestcommServiceMock = {

    deleteUserSession:  jest.fn().mockImplementation((callId) => {
        console.debug({action: 'clearDb' , callId: callId});
    })

}

export const CallServiceApiImplMock = {
    makeCall: jest.fn().mockImplementation((request) => {
        console.debug({request: request});
    }),

    updateCall: jest.fn().mockImplementation((request) => {
        console.debug({func: 'updateCall', request: request});
    }),

    endCall: jest.fn().mockImplementation((request) => {
        console.debug({request: request});
    }),

    addUser: jest.fn().mockImplementation((request) => {
        console.debug({request: request});
    }),
    updateUser: jest.fn().mockImplementation((request) => {
        console.debug({request: request});
    }),
    disconnectUser: jest.fn().mockImplementation((request) => {
        console.debug({request: request});
    }),

    ringingResponse: jest.fn().mockImplementation((request) => {
        console.debug({request: request});
    }),

    connectResponse: jest.fn().mockImplementation((request) => {
        console.debug({request: request});
    }),

    rejectResponse: jest.fn().mockImplementation((request) => {
        console.debug({request: request});
    }),

    endCallResponse: jest.fn().mockImplementation((request) => {
        console.debug({request: request});
    }),
}

export const PushNotificationServiceMock = {
    sendNotification: jest.fn().mockImplementation((userId, token, accountId:any) => {
        console.debug({userId: userId, token: token});
    })
}

export const DbServiceMock = {
    setAction: jest.fn().mockImplementation((msgId, seq, action) => {
        console.debug({action: action});
    }),
    getAction: jest.fn().mockImplementation((msgId, seq) => {
        console.debug({msgId: msgId, seq: seq});

        switch (seq) {
            case "3":
                return MODIFY_ACTION_ACK;
            case "4":
                return HOLD_ACTION_ACK;
            default:
                return CALL_SERVICE_TYPE;
        }
    }),
    setUser: jest.fn().mockImplementation((user, parameters) => {
        console.debug({user: user});
    }),
    updateUser: jest.fn().mockImplementation((user, parameters) => {
        console.debug({user: user});
    }),
    getUserData: jest.fn().mockImplementation((user, deviceId) => {
         console.debug({user: user});
         return {
            "connectionId": '7123901873rhj235777777',
            "userId": 'testaerB@gmail.com',
            "deviceId": 'deviceId-1111122'
        }
     }),
    getByUserId: jest.fn().mockImplementation((user) => {
        console.debug({user: user});
        if(user == "222@gmail.com"){
            return undefined;
        }
        if(user == "22277@gmail.com"){
            let data: Array<UserDataDto> = new Array<UserDataDto>();
            let userData: UserDataDto = {
                "connectionId": 'none',
                "PNSToken": "token1",
                "userId": 'testaerB@gmail.com',
                "deviceId": 'deviceId-1111122',
                "deviceType": "WEB_BROWSER"
            };
            let userData1: UserDataDto = {
                "connectionId": 'none',
                "PNSToken": "token2",
                "userId": 'testaerB@gmail.com',
                "deviceId": 'deviceId-1111122',
                "deviceType": "WEB_BROWSER"
            };
            let userData2: UserDataDto = {
                "connectionId": '1122334455',
                //"connectionId": 'none',
                "PNSToken": "token3",
                "userId": 'testaerB@gmail.com',
                "deviceId": 'deviceId-1111122',
                "deviceType": "WEB_BROWSER"
            };
            data.push(userData);
            data.push(userData1);
            data.push(userData2);
            return data;
        }

        let data: Array<UserDataDto> = new Array<UserDataDto>();
        let userData: UserDataDto = {
            "connectionId": '12345',
            "userId": 'testaerB@gmail.com',
            "deviceId": 'deviceId-1111122',
            "deviceType": "WEB_BROWSER"
        };
        data.push(userData);
        return data;
    }),
    setUsers: jest.fn().mockImplementation((userData, parameters) => {
        console.debug({userData: JSON.stringify(userData)});
    }),
    setSessionData: jest.fn().mockImplementation((sessionData, parameters) => {
        console.debug({sessionData: JSON.stringify(sessionData)});
    }),
    getSessionData: jest.fn().mockImplementation((callId, parameters) => {
        console.debug({sessionData: JSON.stringify(callId)});
        if(callId == "1234-5678-9010_leg2") {
            return <SessionDto>{
                callId: '1234-5678-9010_leg2',
                userId: 'testaerB@gmail.com',
                deviceId: 'deviceId-1111122'

            }
        }
        else {
            return <SessionDto>{
                callId: '1111',
                userId: 'test@test.com',
                deviceId: '22222'

            }
        }
    }),
    getByConnectionId: jest.fn().mockImplementation((connectionId: string, parameters) => {
        if(connectionId == "7123901873rhj2357") {
            return <UserDataDto>{
                userId: 'testaerB@gmail.com',
                deviceId: 'deviceId-1111122',
            }
        }
       else {
            return <UserDataDto>{
                userId: 'testaerA@gmail.com',
                deviceId: '11111',
            }
        }

    }),

    delSessionData: jest.fn().mockImplementation((callId: string, parameters) => {

    })

}

let FROM_CUSTOM_DOMAIN_ON = undefined;
const configMock = {
    get: jest.fn().mockImplementation((name, defVal) => {
        switch (name) {
            case 'auth.domain.allow':
                return FROM_CUSTOM_DOMAIN_ON != undefined ? FROM_CUSTOM_DOMAIN_ON : defVal;
            default :
                return defVal;
        }
    })
};


describe('Test Client Msg Handler', () => {
    let msgHandler: ClientMsgHandler;
    jest.setTimeout(10000)

    beforeEach(async () => {
        console.log("starting msg handler test");
        jest.clearAllMocks();

        const app: TestingModule = await Test.createTestingModule({
            imports: [],
            providers: [
                ClientMsgHandler,
                ValidatorsFactory,
                RegisterValidator,
                CallStartValidator,
                CallStatusValidator,
                TerminateValidator,
                AnswerValidator,
                ModifyValidator,
                ModifyAckValidator,
                TerminateAckValidator,
                BaseValidator,
                ErrorBuilder,
                CdrService,
                CounterService,
                {provide: MculoggerService, useValue: loggerServiceMock},
                {provide: DbService, useValue: DbServiceMock},
                {provide: WsDispatcher, useValue: WsDispatcherMock},
                {provide: CallServiceApiImpl, useValue: CallServiceApiImplMock},
                {provide: RestcommService, useValue: RestcommServiceMock},
                {provide: ConfigurationService, useValue: configServiceMock},
                {provide: PushNotificationService, useValue: PushNotificationServiceMock},
                {provide: MetricsService, useValue: MetricsServiceMock}
            ]
        }).compile();

        msgHandler = app.get<ClientMsgHandler>(ClientMsgHandler);
    });

    afterAll(async () => {
        console.log("msg handler app closed!");
    })

    // Conference
    it('Test create conference', async () => {
        let req: ApiGwFormatDto = await msgHandler.convert2ApiGwFormat(createConference.dto);

        console.log('createConference: ', req);
        expect(req.callId).toEqual(createConference.dto.callId);
        expect(req.callee).toEqual(createConference.dto.destination);
        expect(req.caller).toEqual(createConference.dto.source);
        expect(req.sequence).toEqual(createConference.dto.messageId);
        expect(req.service).toEqual(createConference.dto.body.service);

        let rsp: ApiGwDto = msgHandler.convert2ApiGwDto(createConferenceRsp, CREATE_CONFERENCE_ACTION_ACK);

        console.log('createConferenceAcK: ', rsp);

        expect(rsp.source).toEqual(createConferenceRsp.caller);
        expect(rsp.destination).toEqual(createConferenceRsp.callee);
        expect(rsp.callId).toEqual(createConferenceRsp.callId);
        expect(rsp.type).toEqual(CONFERENCE_TYPE);
        expect(rsp.meetingId).toEqual(createConferenceRsp.meetingId);
        expect(rsp.body.action).toEqual(CREATE_CONFERENCE_ACTION_ACK);
        expect(rsp.body.meetingId).toEqual(createConferenceRsp.meetingId);

    });

    it('Test Connect to conference', async () => {
        let req: ApiGwFormatDto = await msgHandler.convert2ApiGwFormat(joinConference.dto);

        console.log('connectConference: ', req);

        expect(req.callId).toEqual(joinConference.dto.callId);
        expect(req.callee).toEqual(joinConference.dto.destination);
        expect(req.caller).toEqual(joinConference.dto.source);
        expect(req.sequence).toEqual(joinConference.dto.messageId);
        expect(req.service).toEqual(joinConference.dto.body.service);
        expect(req.roomType).toEqual('av');

        let rsp: ApiGwDto = msgHandler.convert2ApiGwDto(joinConferenceRsp, VIDEO_START_ACTION_ACK);

        console.log('connectConferenceAcK: ', rsp);

        expect(rsp.source).toEqual(joinConferenceRsp.caller);
        expect(rsp.destination).toEqual(joinConferenceRsp.callee);
        expect(rsp.callId).toEqual(joinConferenceRsp.callId);
        expect(rsp.type).toEqual(CONFERENCE_TYPE);
        expect(rsp.meetingId).toEqual(joinConferenceRsp.meetingId);
        expect(rsp.body.action).toEqual(VIDEO_START_ACTION_ACK);
        expect(rsp.body.meetingId).toEqual(joinConferenceRsp.meetingId);
        expect(rsp.body.sdp).toEqual(joinConferenceRsp.sdp);

    });

    it('Test leave conference', async () => {
        let req: ApiGwFormatDto = await msgHandler.convert2ApiGwFormat(leaveConference.dto);

        console.log('leaveConference: ', req);

        expect(req.callId).toEqual(leaveConference.dto.callId);
        expect(req.callee).toEqual(leaveConference.dto.destination);
        expect(req.caller).toEqual(leaveConference.dto.source);
        expect(req.sequence).toEqual(leaveConference.dto.messageId);
        expect(req.service).toEqual(leaveConference.dto.body.service);
        expect(req.roomType).toEqual('av');

        let rsp: ApiGwDto = msgHandler.convert2ApiGwDto(leaveConferenceRsp, TERMINATE_CONNECTION_ACTION_ACK);

         console.log('leaveConferenceAcK: ', rsp);

        expect(rsp.source).toEqual(leaveConferenceRsp.caller);
        expect(rsp.destination).toEqual(leaveConferenceRsp.callee);
        expect(rsp.callId).toEqual(leaveConferenceRsp.callId);
        expect(rsp.type).toEqual(CONFERENCE_TYPE);
        expect(rsp.meetingId).toEqual(leaveConferenceRsp.meetingId);
        expect(rsp.body.action).toEqual(TERMINATE_CONNECTION_ACTION_ACK);
        expect(rsp.body.meetingId).toEqual(leaveConferenceRsp.meetingId);

    });

    it('Test start Screen Share', async () => {
        let req: ApiGwFormatDto = await msgHandler.convert2ApiGwFormat(startScreenShare.dto);

        console.log('startScreenShare: ', req);

        expect(req.callId).toEqual(startScreenShare.dto.callId);
        expect(req.callee).toEqual(startScreenShare.dto.destination);
        expect(req.caller).toEqual(startScreenShare.dto.source);
        expect(req.sequence).toEqual(startScreenShare.dto.messageId);
        expect(req.service).toEqual(startScreenShare.dto.body.service);
        expect(req.roomType).toEqual('ss');

        let rsp: ApiGwDto = msgHandler.convert2ApiGwDto(startScreenShareRsp, START_SCREEN_SHARE_ACTION_ACK);

        console.log('startScreenShareAcK: ', rsp);

        expect(rsp.source).toEqual(startScreenShareRsp.caller);
        expect(rsp.destination).toEqual(startScreenShareRsp.callee);
        expect(rsp.callId).toEqual(startScreenShareRsp.callId);
        expect(rsp.type).toEqual(CONFERENCE_TYPE);
        expect(rsp.meetingId).toEqual(startScreenShareRsp.meetingId);
        expect(rsp.body.action).toEqual(START_SCREEN_SHARE_ACTION_ACK);
        expect(rsp.body.meetingId).toEqual(startScreenShareRsp.meetingId);
        expect(rsp.body.sdp).toEqual(startScreenShareRsp.sdp);

    });

    it('Test Add Participants', async () => {
        const spyDb = jest.spyOn(DbServiceMock, 'getUserData').mockImplementation((userId: string, deviceId: string) => {
            return {connectionId: '12345'};
        });

        const spyWss = jest.spyOn(WsDispatcherMock, 'sendMessage');

        jest.useFakeTimers();

        await msgHandler.onAddParticipants(addParticipantsReq);

        let joinReqA: ApiGwDto = await msgHandler.buildJoinConferenceMsg(addParticipantsReq, 0);
        let joinReqD: ApiGwDto = await msgHandler.buildJoinConferenceMsg(addParticipantsReq, 1);
        let addPartRsp: ApiGwDto = await msgHandler.buildAddParticipantsAckMsg(addParticipantsReq);

        expect(spyWss).toHaveBeenNthCalledWith(1,'12345', joinReqA);
        expect(spyWss).toHaveBeenNthCalledWith(2,'12345', joinReqD);
        expect(spyWss).toHaveBeenNthCalledWith(3,'12345', addPartRsp);

        expect(joinReqA).toMatchObject(joinConferenceReq);
        expect(addPartRsp).toMatchObject(addParticipantsRsp);

        jest.useRealTimers();

    });

    // Outgoing call
    it('Test call from Client to RestComm', async () => {
        let rsp: ApiGwFormatDto = await msgHandler.convert2ApiGwFormat(callStartRequest.dto);

        console.log('rsp: %s', rsp);
        expect(rsp).toEqual(startCallRequest);
    });

    it('Test Ringing to callStatus', async () => {
        let rsp: ApiGwDto = await msgHandler.convert2ApiGwDto(ringCallResponse, STATUS_ACTION);

        console.log('callStatus: %s', rsp);
        console.log('callStatus body: %s', rsp.body);

        expect(rsp.source).toEqual(startCallRequest.callee);
        expect(rsp.destination).toEqual(startCallRequest.caller);
        expect(rsp.callId).toEqual(startCallRequest.callId);
        expect(rsp.body.requestMessageId).toEqual(startCallRequest.sequence);
        expect(rsp.body.action).toEqual(STATUS_ACTION);
        expect(rsp.body.statusCode).toEqual("200");
        expect(rsp.body.description).toEqual('Ringing');

    });

    it('Test 401 Unauthorized', async () => {
        let rsp: ApiGwDto = await msgHandler.convert2ApiGwDto(UnauthorizedCallResponse, STATUS_ACTION);

        console.log('Reject body: %s', rsp.body);

        expect(rsp.source).toEqual(startCallRequest.callee);
        expect(rsp.destination).toEqual(startCallRequest.caller);
        expect(rsp.callId).toEqual(startCallRequest.callId);
        expect(rsp.body.requestMessageId).toEqual(startCallRequest.sequence);
        expect(rsp.body.action).toEqual(STATUS_ACTION);
        expect(rsp.body.statusCode).toEqual(API_GW_UNAUTHORIZED.CODE);
        expect(rsp.body.description).toEqual(API_GW_UNAUTHORIZED.DESC);

    });

    it('Test Connect to answer', async () => {
        let rsp: ApiGwDto = await msgHandler.convert2ApiGwDto(connectCallResponse, ANSWER_ACTION);

        console.log('answer: %s', rsp);
        console.log('answer body: %s', rsp.body);

        expect(rsp.source).toEqual(startCallRequest.caller);
        expect(rsp.destination).toEqual(startCallRequest.callee);
        expect(rsp.callId).toEqual(startCallRequest.callId);
        expect(rsp.body.requestMessageId).toEqual(startCallRequest.sequence);
        expect(rsp.body.action).toEqual(ANSWER_ACTION);
        expect(rsp.body.sdp).toEqual(connectCallResponse.sdp);

    });

    it('Test disconnect to terminate', async () => {
        let req: ApiGwDto = await msgHandler.convert2ApiGwDto(disconnectCallRequest, TERMINATE_ACTION);

        console.log('terminate: %s', req);
        console.log('terminate body: %s', req.body);

        expect(req.source).toEqual(disconnectCallRequest.caller);
        expect(req.destination).toEqual(disconnectCallRequest.callee);
        expect(req.callId).toEqual(disconnectCallRequest.callId);
        expect(req.messageId).toEqual(disconnectCallRequest.sequence);
        expect(req.body.action).toEqual(TERMINATE_ACTION);

    });

    // Incoming call
    it('Test call from RestComm to client', async () => {
        let req: ApiGwDto = await msgHandler.convert2ApiGwDto(callRequest, START_ACTION);

        console.log('callStart: %s', req);
        console.log('callStart body: %s', req.body);

        expect(req.source).toEqual(callRequest.caller);
        expect(req.destination).toEqual(callRequest.callee);
        expect(req.callId).toEqual(callRequest.callId);
        expect(req.messageId).toEqual(callRequest.sequence);
        expect(req.body.action).toEqual(START_ACTION);
        expect(req.body.sdp).toEqual(callRequest.sdp);

    });

    it('Test callStatus(Ringing) to RestComm 180 Ringing', async () => {
        let rsp: ApiGwFormatDto = await msgHandler.convert2ApiGwFormat(callStatusResponse);

        console.log('180 Ringing: %s', rsp);

        expect(rsp.caller).toEqual(callStatusResponse.source);
        expect(rsp.callee).toEqual(callStatusResponse.destination);
        expect(rsp.callId).toEqual(callStatusResponse.callId);
        expect(rsp.sequence).toEqual(callStatusResponse.messageId);

    });

    it('Test answer to RestComm 200 OK', async () => {
        let rsp: ApiGwFormatDto = await msgHandler.convert2ApiGwFormat(callAnswerResponse);

        console.log('200 OK: %s', rsp);

        expect(rsp.caller).toEqual(callAnswerResponse.source);
        expect(rsp.callee).toEqual(callAnswerResponse.destination);
        expect(rsp.callId).toEqual(callAnswerResponse.callId);
        expect(rsp.sequence).toEqual(callAnswerResponse.messageId);
        expect(rsp.sdp).toEqual(callAnswerResponse.body.sdp);

    });

    it('Test terminate to RestComm endCall', async () => {
        let req: ApiGwFormatDto = await msgHandler.convert2ApiGwFormat(terminateRequest.dto);

        console.log('endCall: %s', req);

        expect(req.caller).toEqual(terminateRequest.dto.source);
        expect(req.callee).toEqual(terminateRequest.dto.destination);
        expect(req.callId).toEqual(terminateRequest.dto.callId);
        expect(req.sequence).toEqual(terminateRequest.dto.messageId);

    });

    it('Test Modify flow', async () => {
        await msgHandler.onModify(modifyCallRequest);

        let action: string = await DbServiceMock.getAction(modifyCallRequest.callId, modifyCallRequest.messageId);
        let rsp: ApiGwDto = await msgHandler.convert2ApiGwDto(modifyCallResponse, action);

        console.log('ModifyAck: %s', rsp);
        console.log('ModifyAck, body: %s', rsp.body);

        expect(rsp.source).toEqual(modifyCallRequest.destination);
        expect(rsp.destination).toEqual(modifyCallRequest.source);
        expect(rsp.callId).toEqual(modifyCallRequest.callId);
        expect(rsp.messageId).toEqual(modifyCallRequest.messageId);

        expect(rsp.body.action).toEqual(MODIFY_ACTION_ACK);
        expect(rsp.body.requestMessageId).toEqual(modifyCallRequest.messageId);
        expect(rsp.body.sdp).toEqual(modifyCallResponse.sdp);

    });

    it('Test hold flow', async () => {
        await msgHandler.onModify(holdCallRequest);

        let action: string = await DbServiceMock.getAction(holdCallRequest.callId, holdCallRequest.messageId);
        let rsp: ApiGwDto = await msgHandler.convert2ApiGwDto(holdCallResponse, action);

        console.log('HoldAck: %s', rsp);
        console.log('HoldAck, body: %s', rsp.body);

        expect(rsp.source).toEqual(holdCallRequest.destination);
        expect(rsp.destination).toEqual(holdCallRequest.source);
        expect(rsp.callId).toEqual(holdCallRequest.callId);
        expect(rsp.messageId).toEqual(holdCallRequest.messageId);

        expect(rsp.body.action).toEqual(HOLD_ACTION_ACK);
        expect(rsp.body.sdp).toEqual(holdCallResponse.sdp);

    });

    it('Test update from restComm to modifyCall', async () => {
        let req: ApiGwDto = await msgHandler.convert2ApiGwDto(updateCallRequest, MODIFY_ACTION);

        console.log('modifyCall: %s', req);
        console.log('modifyCall body: %s', req.body);

        expect(req.source).toEqual(updateCallRequest.caller);
        expect(req.destination).toEqual(updateCallRequest.callee);
        expect(req.callId).toEqual(updateCallRequest.callId);
        expect(req.messageId).toEqual(updateCallRequest.sequence);
        expect(req.body.action).toEqual(MODIFY_ACTION);
        expect(req.body.sdp).toEqual(updateCallRequest.sdp);

    });

    it('Test buildErrRsp', async () => {
        let rsp: ApiGwFormatDto = await msgHandler.buildErrRsp(startCallRequest, "404", 'Not Found');

        expect(rsp.caller).toEqual(startCallRequest.callee);
        expect(rsp.callId).toEqual(holdCallRequest.callId);
        expect(rsp.status.code).toEqual("404");
        expect(rsp.status.desc).toEqual('Not Found');

    });

    it('Test userNotFound', async () => {
        const spyBuildErr = jest.spyOn(msgHandler, 'buildErrRsp');
        const spyRejRsp = jest.spyOn(CallServiceApiImplMock, 'rejectResponse');

        await msgHandler.userNotFound(START_ACTION, 'testaerB@gmail.com', startCallRequest);

        expect(spyBuildErr).toHaveBeenCalledTimes(1);
        expect(spyRejRsp).toHaveBeenCalledTimes(1);

        let rsp: ApiGwFormatDto = await msgHandler.buildErrRsp(startCallRequest, "404", 'Not Found');
        expect(spyRejRsp).toHaveBeenCalledWith(rsp);

    });

    it('Test callUser not found', async () => {
        const spyUser = jest.spyOn(msgHandler, 'userNotFound');

        await msgHandler.callUser(startCallRequestNotFound, START_ACTION);
        expect(spyUser).toHaveBeenCalledTimes(1);

    });

    it('Test callUser success - START_ACTION', async () => {
        const spyDb = jest.spyOn(DbServiceMock, 'getUserData').mockImplementation((userId: string, deviceId: string) => {
            return {connectionId: '12345'};
        });
        const spyWss = jest.spyOn(WsDispatcherMock, 'sendMessage');

        await msgHandler.callUser(startCallRequest, START_ACTION);
        //
        let answer: ApiGwDto = await msgHandler.convert2ApiGwDto(startCallRequest, ANSWER_ACTION);
        answer.body.sdp = 'answer sdp';
        expect(spyWss).toHaveBeenCalledWith('12345', { //@simulate a startCall to webrtc from restcomm
            "source": startCallRequest.caller,
            "destination": startCallRequest.callee,
            "callId": startCallRequest.callId,
            "ts": expect.any(Number),
            "type": CALL_SERVICE_TYPE,
            "messageId": startCallRequest.sequence,
            "body": {
                // "accessToken": undefined, //@TODO fix the TC to get accessToken
                "action": START_ACTION,
                "reason": "Join",
                // "appSid": undefined,//@TODO fix the TC to get appSid
                "sdp": startCallRequest.sdp,
                "service": "P2A"
            }
        });

    });

    it('Test callUser success - TERMINATE_ACTION', async () => {
        const spyDb = jest.spyOn(DbServiceMock, 'getUserData').mockImplementation((userId: string, deviceId: string) => {
            return {connectionId: '12345'};
        });
        const spyWss = jest.spyOn(WsDispatcherMock, 'sendMessage');

        await msgHandler.callUser(disconnectCallRequest, TERMINATE_ACTION);
        //
        let answer: ApiGwDto = await msgHandler.convert2ApiGwDto(startCallRequest, ANSWER_ACTION);
        answer.body.sdp = 'answer sdp';
        expect(spyWss).toHaveBeenCalledWith('12345', { //@simulate a startCall to webrtc from restcomm
            "source": disconnectCallRequest.caller,
            "destination": disconnectCallRequest.callee,
            "callId": disconnectCallRequest.callId,
            "ts": expect.any(Number),
            "type": CALL_SERVICE_TYPE,
            "messageId": disconnectCallRequest.sequence,
            "body": {
                // "accessToken": undefined, //@TODO fix the TC to get accessToken
                "action": TERMINATE_ACTION,
                "description": "Normal",
                "statusCode": "200"
            }
        });

    });

    it('Test  getConnIdForStartCall success', async () => {
        const spyDb = jest.spyOn(DbServiceMock, 'getUserData').mockImplementation((userId: string, deviceId: string) => {
            return {connectionId: '12345'};
        });
        const spyWss = jest.spyOn(WsDispatcherMock, 'sendMessage');

        let connectionId: string = await msgHandler.getConnIdForStartCall(startCallRequest);
        expect(connectionId).toEqual('12345');

    });


    it('Test  getConnIdForStartCall success - array', async () => {

        let connectionId: string = await msgHandler.getConnIdForStartCall(startCallRequestNoConnIdArray);
        expect(connectionId).toEqual('1122334455');

    });

    it('Test  getConnIdForStartCall undefined', async () => {

        let connectionId: string = await msgHandler.getConnIdForStartCall(startCallRequestNoConnId);
        expect(connectionId).toEqual(undefined);

    });

    it('Test  sendPushNotification success - array [3]', async () => {

        //const spyBuildErr = jest.spyOn(msgHandler, 'buildErrReq');

        let connectionId: string = await msgHandler.sendPushNotification(startCallRequestNoConnIdArray);
        expect(PushNotificationServiceMock.sendNotification).toHaveBeenCalledTimes(3);
        expect(connectionId).toEqual('1122334455');

    });

    it('Test  sendPushNotification success - array [1]', async () => {

        //const spyBuildErr = jest.spyOn(msgHandler, 'buildErrReq');

        let connectionId: string = await msgHandler.sendPushNotification(startCallRequest);
        expect(PushNotificationServiceMock.sendNotification).toHaveBeenCalledTimes(1);

        expect(connectionId).toEqual('12345');

    });

    it('Test  sendPushNotification no userData', async () => {

        let connectionId: string = await msgHandler.sendPushNotification(startCallRequestNoConnId);
        expect(PushNotificationServiceMock.sendNotification).toHaveBeenCalledTimes(0);
        jest.setTimeout(2000)
        expect(connectionId).toEqual(undefined);

    });

    it('Test cancelCall', async () => {
        const spyBuildErr = jest.spyOn(msgHandler, 'buildErrReq');
        const spyEndCall = jest.spyOn(CallServiceApiImplMock, 'endCall');

        await msgHandler.cancelCall(START_ACTION, 'testaerB@gmail.com', startCallRequest);

        expect(spyBuildErr).toHaveBeenCalledTimes(1);
        expect(spyEndCall).toHaveBeenCalledTimes(1);

        let req: ApiGwFormatDto = await msgHandler.buildErrReq(callRejected);
        expect(spyEndCall).toHaveBeenCalledWith(req);

    });

    it('Test response2User with cancel', async () => {
        const spyCancel = jest.spyOn(msgHandler, 'cancelCall');
        const spyWss = jest.spyOn(WsDispatcherMock, 'sendMessage');
        const spyDb = jest.spyOn(DbServiceMock, 'getUserData').mockImplementation((user: string) => {
            return {connectionId: undefined};
        });

        spyCancel.mockClear();
        spyWss.mockClear();

        await msgHandler.response2User(connectCallResponse, ANSWER_ACTION, 'AnswerCall');

        expect(spyWss).toHaveBeenCalledTimes(0);

        let rsp: ApiGwDto = await msgHandler.convert2ApiGwDto(connectCallResponse, ANSWER_ACTION);
        console.log('rsp: ', rsp);

        expect(spyCancel).toHaveBeenCalledWith('AnswerCall', rsp.source, connectCallResponse);

    });

    it('Test response2User success', async () => {
        const spyDb = jest.spyOn(DbServiceMock, 'getUserData').mockImplementation((user: string) => {
            return {connectionId: '567890'};
        });
        const spyWss = jest.spyOn(WsDispatcherMock, 'sendMessage');

        await msgHandler.response2User(connectCallResponse, ANSWER_ACTION, 'AnswerCall');

        expect(spyWss).toHaveBeenCalledTimes(1);

        let rsp: ApiGwDto = await msgHandler.convert2ApiGwDto(connectCallResponse, ANSWER_ACTION);
        let tmp = {
            source: rsp.destination,
            destination: rsp.source
        }
        rsp.source = tmp.source
        rsp.destination = tmp.destination

        rsp.ts = expect.any(Number)
        expect(spyWss).toHaveBeenCalledWith('567890', rsp);

    });

    it('Test response2User with rejectCall', async () => {
        const spyCancel = jest.spyOn(msgHandler, 'cancelCall');
        const spyDb = jest.spyOn(DbServiceMock, 'getUserData').mockImplementation((user: string) => {
            return {connectionId: undefined};
        });
        const spyWss = jest.spyOn(WsDispatcherMock, 'sendMessage');

        spyCancel.mockClear();
        spyWss.mockClear();

        await msgHandler.response2User(connectCallResponse, STATUS_ACTION, 'rejectCall');

        expect(spyWss).toHaveBeenCalledTimes(0);
        expect(spyCancel).toHaveBeenCalledTimes(0);

    });

    it('Test handleMsg Register Action', async () => {

        const spyDb = jest.spyOn(DbServiceMock, 'getUserData').mockImplementation((user: string) => {
            return {connectionId: '12345', token: {accessToken: "access", PNSToken: "pns", jti: "jti"}};
        });
        const spyWss = jest.spyOn(WsDispatcherMock, 'sendMessage');

        spyWss.mockClear();

        // let req: WsRequestDto = new WsRequestDto();
        // Object.assign(req, registerRequest);

        await msgHandler.handleMsg(registerRequest);
        await sleep(100) //adding the sleep since setImmediate was added
        expect(spyWss).toHaveBeenCalledTimes(1);
    });

    it('Test handleMsg Start Call Action', async () => {
        const spyDb = jest.spyOn(DbServiceMock, 'getUserData').mockImplementation((user: string) => {
            return <UserDataDto>{connectionId: '12345', accessToken: "access", PNSToken: "pns"};
        });
        const spyMakeCall = jest.spyOn(CallServiceApiImplMock, 'makeCall');

        spyMakeCall.mockClear();

        await msgHandler.handleMsg(callStartRequest);
        await sleep(100) //adding the sleep since setImmediate was added

        expect(spyMakeCall).toHaveBeenCalledTimes(1);

        let req: ApiGwFormatDto = await msgHandler.convert2ApiGwFormat(callStartRequest.dto);
        expect(spyMakeCall).toHaveBeenCalledWith(req);

    });

    it('Test handleMsg Terminate Action', async () => {
        const spyDb = jest.spyOn(DbServiceMock, 'getUserData').mockImplementation((user: string) => {
            return {connectionId: '12345'};
        });
        const spyEndCall = jest.spyOn(CallServiceApiImplMock, 'endCall');

        spyEndCall.mockClear();

        await msgHandler.handleMsg(terminateRequest);
        await sleep(100) //adding the sleep since setImmediate was added

        expect(spyEndCall).toHaveBeenCalledTimes(1);

        let req: ApiGwFormatDto = await msgHandler.convert2ApiGwFormat(terminateRequest.dto);
        expect(spyEndCall).toHaveBeenCalledWith(req);
    });
});

xdescribe("Auth / Dto parsing", () => {

    let msgHandler: ClientMsgHandler;

    beforeEach(async () => {
        console.log("starting msg handler test");
        //jest.clearAllMocks();

        const app: TestingModule = await Test.createTestingModule({
            providers: [ClientMsgHandler,
                {provide: MculoggerService, useValue: loggerServiceMock},
                {provide: DbService, useValue: DbServiceMock},
                {provide: WsDispatcher, useValue: WsDispatcherMock},
                {provide: CallServiceApiImpl, useValue: CallServiceApiImplMock},
                {provide: RestcommService, useValue: RestcommServiceMock},
                {provide: ConfigurationService, useValue: configMock}
            ]
        }).compile();

        msgHandler = app.get<ClientMsgHandler>(ClientMsgHandler);
    });

    it('Allow custom domain - default', async () => {
        msgHandler.onRegister = jest.fn();

        let req: WsRequestDto = new WsRequestDto();
        Object.assign(req, registerRequest);

        await msgHandler.handleMsg(req);
        expect(msgHandler.onRegister).toHaveBeenNthCalledWith(1, {
                "connectionId": "7123901873rhj2357",
                "dto": {
                    "callId": "1234-5678-9010",
                    "messageId": "1",
                    "source": "testaerA@gmail.com",
                    "destination": "GW",
                    "ts": 12345,
                    "type": "Register",
                    "body": {
                        "protocolVersion": "1.0",
                        "clientVersion": "1.0",
                        "PNSToken": "pns-token",
                        "deviceType": "WEB_BROWSER",
                        "deviceId": "deviceId-11111",
                        "appSid": "appSid-222222"
                    }
                }
            }
        );
    });

    it('DO NOT Allow custom domain', async () => {
        //############################
        FROM_CUSTOM_DOMAIN_ON = false;
        //############################
        msgHandler.onRegister = jest.fn();

        let req: WsRequestDto = new WsRequestDto();
        Object.assign(req, registerRequest);

        await msgHandler.handleMsg(req);
        expect(msgHandler.onRegister).toHaveBeenNthCalledWith(1, {
                "connectionId": "7123901873rhj2357",
                "dto": {
                    "callId": "1234-5678-9010",
                    "messageId": "1",
                    "source": "testaerA@webrtc.com",
                    "destination": "GW",
                    "ts": 12345,
                    "type": "Register",
                    "body": {
                        "protocolVersion": "1.0",
                        "clientVersion": "1.0",
                        "PNSToken": "pns-token",
                        "deviceType": "WEB_BROWSER",
                        "deviceId": "deviceId-11111",
                        "appSid": "appSid-222222"
                    }
                }
            }
        );
    });
});
