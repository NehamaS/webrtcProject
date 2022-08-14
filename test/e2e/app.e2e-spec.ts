import {Test, TestingModule} from '@nestjs/testing';
import {HttpStatus, INestApplication} from '@nestjs/common';
import request from 'supertest';
import {
    callStartRequest, deviceId,
    modifyRequest,
    registerRequest, source,
    terminateRequest,
    unregisterRequest
} from "../msghandler/messages";
import {ClientMsgHandler} from "../../src/client.msg.handler";
import {WsRequestDto} from "../../src/dto/ws.request.dto";
import {ACCESS_TOKEN} from "../testutils/constants";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {CounterServiceMock, dbMock, loggerServiceMock, MetricsServiceMock} from "../testutils/test.mock";
import {WebrtcModule} from "../../src/webrtc.module";
import {SipService} from "../../src/callserviceapi/sip/sip.service";
import {E2eModule} from "./simulators/e2e.module";
import {NestFactory} from "@nestjs/core";
import {WsSimController} from "./simulators/ws.sim.controller";
import {SipURI, SipUtils} from "../../src/callserviceapi/sip/common/sip.utils";
import {RequestDTO, ResponseDTO} from "../../src/callserviceapi/sip/common/sipMessageDTO";
import {ApiGwDto} from "../../src/dto/api.gw.dto";
import {sleep} from "../testutils/test.utils";
import {
    CALL_SERVICE_TYPE,
    STATUS_ACTION,
    MODIFY_ACTION_ACK,
    REGISTER_ACTION_ACK,
    TERMINATE_ACK_ACTION,
    MODIFY_ACTION,
    ANSWER_ACTION,
    TERMINATE_ACTION,
    REGISTER_ACTION,
    START_ACTION,
    AUTH_HEADER,
    UNREGISTER_ACTION
} from "../../src/common/constants";
import {EventEmitter} from 'events'
import * as path from 'path';
import {finalize, from} from "rxjs";

import {
    ackRequest,
    BPARTY_CONTACT, byeRequest,
    reInviteRequest, SIP,
    sipSendMock,
} from "../common/sip/sip.mock";
import {FirebaseService} from "../../src/push/firebase/firebase.service";
import {DynamoDBServiceMock} from "../common/mocks";
import {DbService} from "service-infrastructure/db/db.service";
import {MetricsService} from "service-infrastructure/dd-metrics/metrics.service";
import {a} from "aws-amplify";
import {JwtAuthGuard} from "../../src/auth/guards/jwt.auth.guard";
import {UserDataDto} from "../../src/dto/user.data.dto";
import * as _ from 'lodash'
import {TOKEN} from "../../src/auth/token";
import {CounterService} from "../../src/metrics/counter.service";

const CONNECTION_ID: string = "423rtwnef23523";
export let isCancelFlow: boolean = false;

process.env.SRV_CONF_PATH = `${__dirname}${path.sep}config.json`;
process.env.CONF_PATH = `${__dirname}${path.sep}config.json`

describe('process.env.POD_UID undefined (integration)', () => {

    jest.setTimeout(10000)
    let moduleFixture: TestingModule
    let app: INestApplication;
    let testApp: INestApplication;
    let msgHandler: ClientMsgHandler;
    let sipServer: SipService;
    let sipUtils: SipUtils
    let firebaseService: FirebaseService;
    let contextMap: Map<string, Array<ApiGwDto>> = new Map<string, Array<ApiGwDto>>();

    let ix: number = 0;

    const initTestApp = async (): Promise<void> => {
        let port: number = 8088;
        testApp = await NestFactory.create(E2eModule);
        testApp.enableCors();

        let wsSimController = testApp.get<WsSimController>(WsSimController);
        wsSimController.setContext(contextMap);

        await testApp.listenAsync(port, "127.0.0.1");
        console.log(`Test app started on: 127.0.0.1:${port}`);

    }


    beforeEach(async () => {

        jest.clearAllMocks()
        contextMap.clear() //clear ws map
        isCancelFlow = false

        console.log("starting test app...");
        moduleFixture = await Test.createTestingModule({
            imports: [WebrtcModule],
            providers: [
                {provide: MculoggerService, useValue: loggerServiceMock},
                {provide: MetricsService, useValue: MetricsServiceMock}
            ]
        }).compile();

        app = await moduleFixture.createNestApplication();
        msgHandler = await app.get<ClientMsgHandler>(ClientMsgHandler);
        sipServer = await app.get<SipService>(SipService);
        sipUtils = await app.get<SipUtils>(SipUtils);
        firebaseService = await app.get<FirebaseService>(FirebaseService);

        process.env.DEFAULT_SIP = "false";

        sipServer.setSipApi(SIP);

        await app.init();

        await initTestApp();
    })
    ;

    afterEach(async () => {
        await app.close();
        await testApp.close();
        console.log("test app closed!");
    })

    let rsp = {statusCode: 200, desc: "OK"};

    it('Test Register Action', async () => {

        registerRequest.connectionId = CONNECTION_ID + ix++
        let callId = `${registerRequest.dto.callId}-register`
        registerRequest.dto.callId = callId

        let registerResponse = {
            source: registerRequest.dto.source,
            destination: registerRequest.dto.destination,
            callId: callId,
            messageId: registerRequest.dto.messageId,
            action: REGISTER_ACTION
        }

        await request(app.getHttpServer())
            .post(`/connect`)
            .set('Content-type', 'application/json')
            .set('Authorization', ACCESS_TOKEN)
            .send(<WsRequestDto>{connectionId: registerRequest.connectionId})
            .expect(HttpStatus.CREATED);

        await sleep(200);

        await request(app.getHttpServer())
            .post(`/actions`)
            .set('Content-type', 'application/json')
            .send(registerRequest)
            .expect(HttpStatus.ACCEPTED, registerResponse);
        expect(sipSendMock).toHaveBeenCalledTimes(0);

        await sleep(200);

        //WS Response
        expect(contextMap.get(registerRequest.connectionId)[0]).toMatchObject({
            "callId": callId,
            "messageId": registerRequest.dto.messageId,
            "source": registerRequest.dto.destination,
            "destination": registerRequest.dto.source,
            "ts": expect.any(Number),
            "type": REGISTER_ACTION_ACK,
            "body": {"requestMessageId": "1", "GWVersion": "1.0"}
        });
    });

    it('Test Register and callStart Actions', async () => {

        let deviceId: string = 'deviceId-1' //set different value for each test

        jest.spyOn(JwtAuthGuard.prototype as any, 'parseToken').mockImplementation(() => {
            let userData: UserDataDto = new UserDataDto()
            userData.userId = source
            userData.deviceId = deviceId
            userData.accessToken = ACCESS_TOKEN
            userData.organizationSid = 'ORd73aaa45a875466391fddd90419f4176'; //Was taken from ACCESS_TOKEN
            userData.accountSid = 'AC3c5b4177e5fdd813720bc0d6dd7f057e'; //Was taken from ACCESS_TOKEN
            userData.appSid = 'AP4434355tomer' //Was taken from ACCESS_TOKEN

            return userData
        })

        let connnectionId = CONNECTION_ID + ix++ + 'callStart'
        registerRequest.connectionId = connnectionId
        callStartRequest.connectionId = connnectionId
        registerRequest.dto.body.deviceId = deviceId

        // callStartRequest.dto.body.sdp = "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n";
        let registerResponse = {
            source: registerRequest.dto.source,
            destination: registerRequest.dto.destination,
            callId: registerRequest.dto.callId,
            messageId: registerRequest.dto.messageId,
            action: REGISTER_ACTION
        }

        let startResponse = {
            source: callStartRequest.dto.source,
            destination: callStartRequest.dto.destination,
            callId: callStartRequest.dto.callId,
            messageId: callStartRequest.dto.messageId,
            action: START_ACTION
        }

        await request(app.getHttpServer())
            .post(`/connect`)
            .set('Content-type', 'application/json')
            .set('Authorization', ACCESS_TOKEN)
            .send(<WsRequestDto>{connectionId: connnectionId})
            .expect(HttpStatus.CREATED);

        await sleep(200);

        await request(app.getHttpServer())
            .post(`/actions`)
            .set('Content-type', 'application/json')
            .send(registerRequest)
            .expect(HttpStatus.ACCEPTED, registerResponse);

        await sleep(1000)

        let result = await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(callStartRequest)
            .expect(HttpStatus.ACCEPTED, startResponse);

        await sleep(200);


        expect(sipSendMock).toHaveBeenCalledTimes(2);

        expect(sipSendMock).toHaveBeenNthCalledWith(1, {
                "method": "INVITE",
                "uri": `sip:${callStartRequest.dto.destination}`,
                "version": "2.0",
                "headers": {
                    "authorization": ACCESS_TOKEN,
                    "to": {
                        "uri": sipUtils.getURI(callStartRequest.dto.destination, 'AP4434355tomer') //AP4434355tomer was taken from AccessToken
                    },
                    "from": {
                        "uri": `sip:${callStartRequest.dto.source}`,
                        "params": {
                            "tag": expect.any(String)
                        }
                    },
                    "call-id": callStartRequest.dto.callId,
                    "cseq": {
                        "method": "INVITE",
                        "seq": 1
                    },
                    "contact": [
                        {
                            "uri": expect.any(String)
                        }
                    ],
                    "via": [],
                    "Content-Type": "application/sdp",
                    "Max-Forwards": 70,
                    "X-Service-Type": "P2A",
                    "User-Agent": "Restcomm WebRTC Demo/2.3.2-274",
                    "X-Called-Party-ID": `sip:${callStartRequest.dto.destination}`
                },
                "content": callStartRequest.dto.body.sdp
            }, expect.any(Function)
        )

        expect(sipSendMock).toHaveBeenNthCalledWith(2, {
            "headers": {
                "call-id": callStartRequest.dto.callId,
                "contact": [
                    {
                        "uri": expect.any(String)
                    }
                ],
                "cseq": {
                    "method": "ACK",
                    "seq": 1
                },
                "from": {
                    "params": {
                        "tag": expect.any(String)
                    },
                    "uri": `sip:${callStartRequest.dto.source}`,
                },
                "to": {
                    "params": {
                        "tag": expect.any(String)
                    },
                    "uri": sipUtils.getURI(callStartRequest.dto.destination, 'AP4434355tomer') //AP4434355tomer was taken from AccessToken
                },
                "via": [],
                "X-Service-Type": "P2A",
                "Max-Forwards": 70
            },
            "method": "ACK",
            "uri": BPARTY_CONTACT, //Contact header value from 200 OK response
            "version": "2.0"
        }, expect.any(Function))
    })

    xit('Test callStart ringing', async () => {
        let connnectionId = CONNECTION_ID + ix++ + 'ring'
        registerRequest.connectionId = connnectionId
        callStartRequest.connectionId = connnectionId

        let ringMock = jest.spyOn(msgHandler, 'ring');
        const callback = jest.fn();

        let startResponse = {
            source: callStartRequest.dto.source,
            destination: callStartRequest.dto.destination,
            callId: callStartRequest.dto.callId,
            messageId: callStartRequest.dto.messageId,
            action: START_ACTION
        }

        //let restCommSrv = new SipRestComServer(180, 'Ringing');

        await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(<WsRequestDto>callStartRequest)
            .expect(HttpStatus.ACCEPTED, startResponse);

        sleep(1000);

        expect(ringMock).toHaveBeenCalledTimes(1);
    });


    it('Test Happy Path (register->start-call-> modifyRequest --> end-call --> unregister)', async () => {

        let deviceId: string = 'deviceId-7' //set different value for each test
        jest.spyOn(JwtAuthGuard.prototype as any, 'parseToken').mockImplementation(() => {
            let userData: UserDataDto = new UserDataDto()
            userData.userId = source
            userData.deviceId = deviceId
            userData.accessToken = ACCESS_TOKEN
            userData.organizationSid = 'ORd73aaa45a875466391fddd90419f4176'; //Was taken from ACCESS_TOKEN
            userData.accountSid = 'AC3c5b4177e5fdd813720bc0d6dd7f057e'; //Was taken from ACCESS_TOKEN
            userData.appSid = 'AP4434355tomer' //Was taken from ACCESS_TOKEN

            return userData
        })


        let registerResponse = {
            source: registerRequest.dto.source,
            destination: registerRequest.dto.destination,
            callId: registerRequest.dto.callId,
            messageId: registerRequest.dto.messageId,
            action: REGISTER_ACTION
        }

        let startResponse = {
            source: callStartRequest.dto.source,
            destination: callStartRequest.dto.destination,
            callId: callStartRequest.dto.callId,
            messageId: callStartRequest.dto.messageId,
            action: START_ACTION
        }

        let modifyResponse = {
            source: modifyRequest.dto.source,
            destination: modifyRequest.dto.destination,
            callId: modifyRequest.dto.callId,
            messageId: modifyRequest.dto.messageId,
            action: MODIFY_ACTION
        }

        let terminateResponse = {
            source: terminateRequest.dto.source,
            destination: terminateRequest.dto.destination,
            callId: terminateRequest.dto.callId,
            messageId: terminateRequest.dto.messageId,
            action: TERMINATE_ACTION
        }

        let unregisterResponse = {
            source: unregisterRequest.dto.source,
            destination: unregisterRequest.dto.destination,
            callId: unregisterRequest.dto.callId,
            messageId: unregisterRequest.dto.messageId,
            action: UNREGISTER_ACTION
        }

        let connnnectionId = CONNECTION_ID + "-unregister";
        registerRequest.connectionId = connnnectionId
        registerRequest.dto.body.deviceId = deviceId
        callStartRequest.connectionId = connnnectionId
        terminateRequest.connectionId = connnnectionId
        modifyRequest.connectionId = connnnectionId
        unregisterRequest.connectionId = connnnectionId
        callStartRequest.dto.body.sdp = "m=audio"

        await request(app.getHttpServer())
            .post(`/connect`)
            .set('Content-type', 'application/json')
            .set('Authorization', ACCESS_TOKEN)
            .send(<WsRequestDto>{connectionId: registerRequest.connectionId})
            .expect(HttpStatus.CREATED);

        await sleep(200);


        await request(app.getHttpServer())
            .post(`/actions`)
            .set('Content-type', 'application/json')
            .send(<WsRequestDto>registerRequest)
            .expect(HttpStatus.ACCEPTED, registerResponse)

        await sleep(200);


        await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(<WsRequestDto>callStartRequest)
            .expect(HttpStatus.ACCEPTED, startResponse);

        await sleep(200);


        await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(<WsRequestDto>modifyRequest)
            .expect(HttpStatus.ACCEPTED, modifyResponse);

        await sleep(1000);

        await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(<WsRequestDto>terminateRequest)
            .expect(HttpStatus.ACCEPTED, terminateResponse);

        await sleep(1000)

        await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(<WsRequestDto>unregisterRequest)
            .expect(HttpStatus.ACCEPTED, unregisterResponse);

        await sleep(1000)

        console.log('!!!!!!!!!!!!!!!!!!!!!!')
        //TODO validate the sip call flow
        expect(sipSendMock).toHaveBeenCalledTimes(5 /*Invite ack, *ReInvite Ack, Bye*/);


        expect(contextMap.get(registerRequest.connectionId).length).toEqual(4)
        //WS Register Responses
        let element = contextMap.get(registerRequest.connectionId)[0]
        expect(element).toMatchObject({
            "callId": registerRequest.dto.callId,
            "messageId": registerRequest.dto.messageId,
            "source": registerRequest.dto.destination,
            "destination": registerRequest.dto.source,
            "ts": expect.any(Number),
            "type": REGISTER_ACTION_ACK,
            "body": {"requestMessageId": "1", "GWVersion": "1.0"}
        });

        // //WS Ring Responses
        element = contextMap.get(callStartRequest.connectionId)[1]
        expect(element).toMatchObject({
            "source": callStartRequest.dto.destination,
            "destination": callStartRequest.dto.source,
            "callId": callStartRequest.dto.callId,
            "ts": expect.any(Number),
            "type": CALL_SERVICE_TYPE,
            "messageId": callStartRequest.dto.messageId,
            "body": {
                "action": STATUS_ACTION,
                "requestMessageId": callStartRequest.dto.messageId,
                "statusCode": "200",
                "description": "Ringing"
            }
        });

        //WS Answer Responses
        element = contextMap.get(callStartRequest.connectionId)[2]
        expect(element).toMatchObject(
            {
                "source": callStartRequest.dto.destination,
                "destination": callStartRequest.dto.source,
                "callId": callStartRequest.dto.callId,
                "ts": expect.any(Number),
                "type": CALL_SERVICE_TYPE,
                "messageId": callStartRequest.dto.messageId,
                "body": {
                    "action": ANSWER_ACTION,
                    "requestMessageId": callStartRequest.dto.messageId,
                    "sdp": callStartRequest.dto.body.sdp //a loop from request was done in mock
                }
            })

        //WS Modify Ack Responses
        element = contextMap.get(modifyRequest.connectionId)[3]
        expect(element).toMatchObject(
            {
                "source": modifyRequest.dto.destination,
                "destination": modifyRequest.dto.source,
                "callId": modifyRequest.dto.callId,
                "ts": expect.any(Number),
                "type": CALL_SERVICE_TYPE,
                "messageId": modifyRequest.dto.messageId,
                "body": {
                    "action": MODIFY_ACTION_ACK,
                    "requestMessageId": modifyRequest.dto.messageId,
                    "sdp": modifyRequest.dto.body.sdp //a loop from request was done in mock
                }
            })
    });

    it('Test Happy Path (register->start-call-> modifyRequest --> end-call)', async () => {

        let deviceId: string = 'deviceId-2' //set different value for each test
        jest.spyOn(JwtAuthGuard.prototype as any, 'parseToken').mockImplementation(() => {
            let userData: UserDataDto = new UserDataDto()
            userData.userId = source
            userData.deviceId = deviceId
            userData.accessToken = ACCESS_TOKEN
            userData.organizationSid = 'ORd73aaa45a875466391fddd90419f4176'; //Was taken from ACCESS_TOKEN
            userData.accountSid = 'AC3c5b4177e5fdd813720bc0d6dd7f057e'; //Was taken from ACCESS_TOKEN
            userData.appSid = 'AP4434355tomer' //Was taken from ACCESS_TOKEN

            return userData
        })


        let registerResponse = {
            source: registerRequest.dto.source,
            destination: registerRequest.dto.destination,
            callId: registerRequest.dto.callId,
            messageId: registerRequest.dto.messageId,
            action: REGISTER_ACTION
        }

        let startResponse = {
            source: callStartRequest.dto.source,
            destination: callStartRequest.dto.destination,
            callId: callStartRequest.dto.callId,
            messageId: callStartRequest.dto.messageId,
            action: START_ACTION
        }

        let modifyResponse = {
            source: modifyRequest.dto.source,
            destination: modifyRequest.dto.destination,
            callId: modifyRequest.dto.callId,
            messageId: modifyRequest.dto.messageId,
            action: MODIFY_ACTION
        }

        let terminateResponse = {
            source: terminateRequest.dto.source,
            destination: terminateRequest.dto.destination,
            callId: terminateRequest.dto.callId,
            messageId: terminateRequest.dto.messageId,
            action: TERMINATE_ACTION
        }


        let connnnectionId = CONNECTION_ID + "-happy-path";
        registerRequest.connectionId = connnnectionId
        registerRequest.dto.body.deviceId = deviceId
        callStartRequest.connectionId = connnnectionId
        terminateRequest.connectionId = connnnectionId
        modifyRequest.connectionId = connnnectionId
        callStartRequest.dto.body.sdp = "m=audio"

        await request(app.getHttpServer())
            .post(`/connect`)
            .set('Content-type', 'application/json')
            .set('Authorization', ACCESS_TOKEN)
            .send(<WsRequestDto>{connectionId: registerRequest.connectionId})
            .expect(HttpStatus.CREATED);

        await sleep(200);


        await request(app.getHttpServer())
            .post(`/actions`)
            .set('Content-type', 'application/json')
            .send(<WsRequestDto>registerRequest)
            .expect(HttpStatus.ACCEPTED, registerResponse)

        await sleep(200);


        await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(<WsRequestDto>callStartRequest)
            .expect(HttpStatus.ACCEPTED, startResponse);

        await sleep(200);


        await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(<WsRequestDto>modifyRequest)
            .expect(HttpStatus.ACCEPTED, modifyResponse);

        await sleep(1000);

        await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(<WsRequestDto>terminateRequest)
            .expect(HttpStatus.ACCEPTED, terminateResponse);

        await sleep(1000)

        console.log('!!!!!!!!!!!!!!!!!!!!!!')
        //TODO validate the sip call flow
        expect(sipSendMock).toHaveBeenCalledTimes(5 /*Invite ack, *ReInvite Ack, Bye*/);


        expect(contextMap.get(registerRequest.connectionId).length).toEqual(4)
        //WS Register Responses
        let element = contextMap.get(registerRequest.connectionId)[0]
        expect(element).toMatchObject({
            "callId": registerRequest.dto.callId,
            "messageId": registerRequest.dto.messageId,
            "source": registerRequest.dto.destination,
            "destination": registerRequest.dto.source,
            "ts": expect.any(Number),
            "type": REGISTER_ACTION_ACK,
            "body": {"requestMessageId": "1", "GWVersion": "1.0"}
        });

        // //WS Ring Responses
        element = contextMap.get(callStartRequest.connectionId)[1]
        expect(element).toMatchObject({
            "source": callStartRequest.dto.destination,
            "destination": callStartRequest.dto.source,
            "callId": callStartRequest.dto.callId,
            "ts": expect.any(Number),
            "type": CALL_SERVICE_TYPE,
            "messageId": callStartRequest.dto.messageId,
            "body": {
                "action": STATUS_ACTION,
                "requestMessageId": callStartRequest.dto.messageId,
                "statusCode": "200",
                "description": "Ringing"
            }
        });

        //WS Answer Responses
        element = contextMap.get(callStartRequest.connectionId)[2]
        expect(element).toMatchObject(
            {
                "source": callStartRequest.dto.destination,
                "destination": callStartRequest.dto.source,
                "callId": callStartRequest.dto.callId,
                "ts": expect.any(Number),
                "type": CALL_SERVICE_TYPE,
                "messageId": callStartRequest.dto.messageId,
                "body": {
                    "action": ANSWER_ACTION,
                    "requestMessageId": callStartRequest.dto.messageId,
                    "sdp": callStartRequest.dto.body.sdp //a loop from request was done in mock
                }
            })

        //WS Modify Ack Responses
        element = contextMap.get(modifyRequest.connectionId)[3]
        expect(element).toMatchObject(
            {
                "source": modifyRequest.dto.destination,
                "destination": modifyRequest.dto.source,
                "callId": modifyRequest.dto.callId,
                "ts": expect.any(Number),
                "type": CALL_SERVICE_TYPE,
                "messageId": modifyRequest.dto.messageId,
                "body": {
                    "action": MODIFY_ACTION_ACK,
                    "requestMessageId": modifyRequest.dto.messageId,
                    "sdp": modifyRequest.dto.body.sdp //a loop from request was done in mock
                }
            })
    });

    it('Test Register and callStart and Terminate(BYE) by B party', async () => {

        let register_A = _.cloneDeep(registerRequest)
        let callStart_A = _.cloneDeep(callStartRequest)

        let deviceId: string = 'deviceId-3' //set different value for each test

        jest.spyOn(JwtAuthGuard.prototype as any, 'parseToken').mockImplementation(() => {
            let userData: UserDataDto = new UserDataDto()
            userData.userId = source
            userData.deviceId = deviceId
            userData.accessToken = ACCESS_TOKEN
            userData.organizationSid = 'ORd73aaa45a875466391fddd90419f4176'; //Was taken from ACCESS_TOKEN
            userData.accountSid = 'AC3c5b4177e5fdd813720bc0d6dd7f057e'; //Was taken from ACCESS_TOKEN
            userData.appSid = 'AP4434355tomer' //Was taken from ACCESS_TOKEN

            return userData
        })

        let registerResponse = {
            source: register_A.dto.source,
            destination: register_A.dto.destination,
            callId: register_A.dto.callId,
            messageId: register_A.dto.messageId,
            action: REGISTER_ACTION
        }

        let startResponse = {
            source: callStart_A.dto.source,
            destination: callStart_A.dto.destination,
            callId: callStart_A.dto.callId,
            messageId: callStart_A.dto.messageId,
            action: START_ACTION
        }

        let sipService: SipService = app.get(SipService)
        let connectionId = CONNECTION_ID + ix++ + 'TerminateBParty'
        register_A.connectionId = connectionId
        callStart_A.connectionId = connectionId
        register_A.dto.body.deviceId = deviceId
        // callStartRequest.dto.body.sdp = "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n";

        await request(app.getHttpServer())
            .post(`/connect`)
            .set('Content-type', 'application/json')
            .set('Authorization', ACCESS_TOKEN)
            .send(<WsRequestDto>{connectionId: register_A.connectionId})
            .expect(HttpStatus.CREATED);


        await request(app.getHttpServer())
            .post(`/actions`)
            .set('Content-type', 'application/json')
            .send(register_A)
            .expect(HttpStatus.ACCEPTED, registerResponse);

        await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(callStart_A)
            .expect(HttpStatus.ACCEPTED, startResponse);

        await sleep(500)
        sipService["sipMessageHandler"]((byeRequest)) //B Party send a BYE request
        await sleep(1000)

        //WS Verification - and reading element paramaters
        let element: ApiGwDto = <ApiGwDto>contextMap.get(callStart_A.connectionId)[3]
        expect(element).toMatchObject({
            "source": callStart_A.dto.destination,
            "destination": callStart_A.dto.source,
            "callId": callStart_A.dto.callId,
            "ts": expect.any(Number),
            "type": CALL_SERVICE_TYPE,
            "messageId": "1", //first message from restcomm side
            "body": {
                "action": TERMINATE_ACTION,
                "statusCode": "200",
                "description": "Normal"
            }
        });

        let terminatedAckRequest: WsRequestDto = {
            connectionId: callStart_A.connectionId,
            dto: {
                "callId": element.callId,
                "messageId": element.messageId,
                "source": element.destination,
                "destination": element.source,
                "ts": 7378725100,
                "type": CALL_SERVICE_TYPE,
                "body": {
                    "action": TERMINATE_ACK_ACTION,
                    "statusCode": "200",
                    "requestMessageId": `G1_${callStartRequest.dto.messageId}`
                }
            }
        }

        let terminatedAckResponse = {
            source: terminatedAckRequest.dto.source,
            destination: terminatedAckRequest.dto.destination,
            callId: terminatedAckRequest.dto.callId,
            messageId: terminatedAckRequest.dto.messageId,
            action: TERMINATE_ACK_ACTION
        }

        await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(terminatedAckRequest)
            .expect(HttpStatus.ACCEPTED, terminatedAckResponse);

        await sleep(1000)


        //SIP Verifications
        expect(sipSendMock).toHaveBeenCalledTimes(3 /*Invite, Ack, 200 OK on BYE*/);
        expect(sipSendMock).toHaveBeenNthCalledWith(3, { //200 OK on BYE
            "headers": {
                "call-id": callStartRequest.dto.callId,
                "X-RestComm-AccountSid": undefined, //@TODO when we will send the accessToken the right value have to be set
                "X-RestComm-ApplicationSid": undefined,//@TODO when we will send the accessToken the right value have to be set
                "X-RestComm-OrganizationSid": undefined,//@TODO when we will send the accessToken the right value have to be set
                "cseq": {
                    "method": "BYE",
                    "seq": 1
                },
                "to": {
                    "params": {
                        "tag": expect.any(String)
                    },
                    "uri": `sip:${callStart_A.dto.source}`,
                },
                "from": {
                    "params": {
                        "tag": expect.any(String)
                    },
                    "uri": sipUtils.getURI(callStart_A.dto.destination, 'AP4434355tomer') //AP4434355tomer was taken from AccessToken
                },
                "via": []
            },
            "reason": "OK",
            "status": 200,
            "version": "2.0"
        })
    })

    it('Test Register and callStart and Reinvite from B party and Terminate(BYE) by A party', async () => {

        let deviceId: string = 'deviceId-4' //set different value for each test
        jest.spyOn(JwtAuthGuard.prototype as any, 'parseToken').mockImplementation(() => {
            let userData: UserDataDto = new UserDataDto()
            userData.userId = source
            userData.deviceId = deviceId
            userData.accessToken = ACCESS_TOKEN
            userData.organizationSid = 'ORd73aaa45a875466391fddd90419f4176'; //Was taken from ACCESS_TOKEN
            userData.accountSid = 'AC3c5b4177e5fdd813720bc0d6dd7f057e'; //Was taken from ACCESS_TOKEN
            userData.appSid = 'AP4434355tomer' //Was taken from ACCESS_TOKEN

            return userData
        })

        let sipService: SipService = app.get(SipService)
        let connectionId = CONNECTION_ID + ix++ + 'ReInvite'
        registerRequest.connectionId = connectionId
        registerRequest.dto.body.deviceId = deviceId
        callStartRequest.connectionId = connectionId
        terminateRequest.connectionId = connectionId

        let callID = 'callID-111'
        registerRequest.dto.callId = callID
        callStartRequest.dto.callId = callID
        terminateRequest.dto.callId = callID

        let registerResponse = {
            source: registerRequest.dto.source,
            destination: registerRequest.dto.destination,
            callId: registerRequest.dto.callId,
            messageId: registerRequest.dto.messageId,
            action: REGISTER_ACTION
        }

        let startResponse = {
            source: callStartRequest.dto.source,
            destination: callStartRequest.dto.destination,
            callId: callStartRequest.dto.callId,
            messageId: callStartRequest.dto.messageId,
            action: START_ACTION
        }

        let terminateResponse = {
            source: terminateRequest.dto.source,
            destination: terminateRequest.dto.destination,
            callId: terminateRequest.dto.callId,
            messageId: terminateRequest.dto.messageId,
            action: TERMINATE_ACTION
        }

        // callStartRequest.dto.body.sdp = "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n";

        await request(app.getHttpServer())
            .post(`/connect`)
            .set('Content-type', 'application/json')
            .set('Authorization', ACCESS_TOKEN)
            .send(<WsRequestDto>{connectionId: registerRequest.connectionId})
            .expect(HttpStatus.CREATED);

        await request(app.getHttpServer())//Register
            .post(`/actions`)
            .set('Content-type', 'application/json')
            .send(registerRequest)
            .expect(HttpStatus.ACCEPTED, registerResponse);

        await request(app.getHttpServer())//A party call Start
            .post('/actions')
            .set('Accept', 'application/json')
            .send(callStartRequest)
            .expect(HttpStatus.ACCEPTED, startResponse);

        await sleep(500)
        sipService["sipMessageHandler"]((reInviteRequest)) //B Party send a ReInvite request
        await sleep(500)


        //WS Verification - and reading element paramaters
        let element: ApiGwDto = <ApiGwDto>contextMap.get(callStartRequest.connectionId)[3]
        expect(element).toMatchObject({
            "source": callStartRequest.dto.destination,
            "destination": callStartRequest.dto.source,
            "callId": callStartRequest.dto.callId,
            "ts": expect.any(Number),
            "type": CALL_SERVICE_TYPE,
            "messageId": "1", //first message from restcomm side
            "body": {
                "action": MODIFY_ACTION,
                "sdp": "SDP reInvite offer m=audio",
            }
        });

        let modifyCallAckRequest: WsRequestDto = {
            connectionId: callStartRequest.connectionId,
            dto: {
                "callId": element.callId,
                "messageId": element.messageId,
                "source": element.destination,
                "destination": element.source,
                "ts": 7378725100,
                "type": CALL_SERVICE_TYPE,
                "body": {
                    "action": MODIFY_ACTION_ACK,
                    "sdp": "SDP reInvite answer m=audio",
                    "requestMessageId": `G1_1`
                }
            }
        }

        let modifyCallAckResponse = {
            source: modifyCallAckRequest.dto.source,
            destination: modifyCallAckRequest.dto.destination,
            callId: modifyCallAckRequest.dto.callId,
            messageId: modifyCallAckRequest.dto.messageId,
            action: MODIFY_ACTION_ACK
        }

        await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(modifyCallAckRequest)
            .expect(HttpStatus.ACCEPTED, modifyCallAckResponse);

        await sleep(250)

        sipService["sipMessageHandler"]((ackRequest)) //ackRequest build as results of Revinvite 200 OK -  B Party send ACK from 200 OK

        await request(app.getHttpServer()) //Terminate by A party
            .post('/actions')
            .set('Accept', 'application/json')
            .send(<WsRequestDto>terminateRequest)
            .expect(HttpStatus.ACCEPTED, terminateResponse);

        await sleep(1000)

        //SIP Verifications
        expect(sipSendMock).toHaveBeenCalledTimes(5 /*Invite + Ack + 200 OK on ReInvite + BYE*/);

        expect(sipSendMock).toHaveBeenNthCalledWith(4, { //200 OK on ReInvite
            "headers": {
                "call-id": callStartRequest.dto.callId,
                "X-RestComm-AccountSid": undefined, //@TODO when we will send the accessToken the right value have to be set
                "X-RestComm-ApplicationSid": undefined,//@TODO when we will send the accessToken the right value have to be set
                "X-RestComm-OrganizationSid": undefined,//@TODO when we will send the accessToken the right value have to be set
                "contact": [{uri: expect.any(String)}],
                "Content-Type": "application/sdp",
                "cseq": {
                    "method": "INVITE",
                    "seq": 1
                },
                "to": {
                    "params": {
                        "tag": expect.any(String)
                    },
                    "uri": `sip:${callStartRequest.dto.source}`,
                },
                "from": {
                    "params": {
                        "tag": expect.any(String)
                    },
                    "uri": sipUtils.getURI(callStartRequest.dto.destination, 'AP4434355tomer') //AP4434355tomer was taken from AccessToken
                },
                "via": []
            },
            "content": "SDP reInvite answer m=audio",
            "reason": "OK",
            "status": 200,
            "version": "2.0"
        })
    })

    /*it('Test Push Api', async () => {
        let accountSid: string = "accountSid";
        let data = {
            userId: "teat1@test.com",
            pushToken: 'PUSH_TOKEN',
            accountSid: accountSid
        }

        let firebaseMock = jest.spyOn(firebaseService, 'sendNotification');
        let response = {};

        await request(app.getHttpServer())
            .post(`/push`)
            .set('Content-type', 'application/json')
            .send(data)
            .expect(HttpStatus.ACCEPTED, response);

        expect(firebaseMock).toHaveBeenCalledTimes(1);

        await firebaseService.deleteClient(accountSid);

        await sleep(200);

    });*/


});

describe('process.env.POD_UID defined (integration)', () => {

    jest.setTimeout(10000)
    let moduleFixture: TestingModule
    let app: INestApplication;
    let testApp: INestApplication;
    let msgHandler: ClientMsgHandler;
    let sipServer: SipService;
    let sipUtils: SipUtils
    let contextMap: Map<string, Array<ApiGwDto>> = new Map<string, Array<ApiGwDto>>();

    let ix: number = 0;

    const initTestApp = async (): Promise<void> => {
        let port: number = 8088;
        testApp = await NestFactory.create(E2eModule);
        testApp.enableCors();

        let wsSimController = testApp.get<WsSimController>(WsSimController);
        wsSimController.setContext(contextMap);

        await testApp.listenAsync(port, "127.0.0.1");
        console.log(`Test app started on: 127.0.0.1:${port}`);

    }


    beforeEach(async () => {

        console.log("starting test app...");
        moduleFixture = await Test.createTestingModule({
            imports: [WebrtcModule],
            providers: [
                {provide: CounterService, useValue: CounterServiceMock},
                {provide: MculoggerService, useValue: loggerServiceMock},
                {provide: MetricsService, useValue: MetricsServiceMock}
            ]
        }).compile();

        app = moduleFixture.createNestApplication();
        msgHandler = app.get<ClientMsgHandler>(ClientMsgHandler);
        sipServer = app.get<SipService>(SipService);
        sipUtils = app.get<SipUtils>(SipUtils);
        process.env.DEFAULT_SIP = "false";

        sipServer.setSipApi(SIP);

        await app.init();

        await initTestApp();
    });

    afterEach(async () => {
        await app.close();
        await testApp.close();
        console.log("test app closed!");
    })

    beforeEach(async () => {
        jest.clearAllMocks()
        contextMap.clear() //clear ws map
        isCancelFlow = false
    });

    afterEach(async () => {
    });

    let rsp = {statusCode: 200, desc: "OK"};

    it('Using process.env.POD_UID (register->start-call-> modifyRequest --> end-call)', async () => {

        try {

            process.env.POD_UID = "11223344"
            let callId: string = `${registerRequest.dto.callId}-${Date.now()}`

            let deviceId: string = 'deviceId-5' //set different value for each test
            jest.spyOn(JwtAuthGuard.prototype as any, 'parseToken').mockImplementation(() => {
                let userData: UserDataDto = new UserDataDto()
                userData.userId = source
                userData.deviceId = deviceId
                userData.accessToken = ACCESS_TOKEN
                userData.organizationSid = 'ORd73aaa45a875466391fddd90419f4176'; //Was taken from ACCESS_TOKEN
                userData.accountSid = 'AC3c5b4177e5fdd813720bc0d6dd7f057e'; //Was taken from ACCESS_TOKEN
                userData.appSid = 'AP4434355tomer' //Was taken from ACCESS_TOKEN

                return userData
            })

            registerRequest.dto.callId = callId
            callStartRequest.dto.callId = callId
            terminateRequest.dto.callId = callId
            modifyRequest.dto.callId = callId

            let registerResponse = {
                source: registerRequest.dto.source,
                destination: registerRequest.dto.destination,
                callId: callId,
                messageId: registerRequest.dto.messageId,
                action: REGISTER_ACTION
            }

            let startResponse = {
                source: callStartRequest.dto.source,
                destination: callStartRequest.dto.destination,
                callId: callId,
                messageId: callStartRequest.dto.messageId,
                action: START_ACTION
            }

            let modifyResponse = {
                source: modifyRequest.dto.source,
                destination: modifyRequest.dto.destination,
                callId: callId,
                messageId: modifyRequest.dto.messageId,
                action: MODIFY_ACTION
            }

            let terminateResponse = {
                source: terminateRequest.dto.source,
                destination: terminateRequest.dto.destination,
                callId: callId,
                messageId: terminateRequest.dto.messageId,
                action: TERMINATE_ACTION
            }


            let connnectionId = CONNECTION_ID + "-happy-path-2";
            registerRequest.connectionId = connnectionId
            registerRequest.dto.body.deviceId = deviceId
            callStartRequest.connectionId = connnectionId
            terminateRequest.connectionId = connnectionId
            modifyRequest.connectionId = connnectionId
            callStartRequest.dto.body.sdp = "m=audio"

            await request(app.getHttpServer())
                .post(`/connect`)
                .set('Content-type', 'application/json')
                .set('Authorization', ACCESS_TOKEN)
                .send(<WsRequestDto>{connectionId: registerRequest.connectionId})
                .expect(HttpStatus.CREATED);

            await request(app.getHttpServer())
                .post(`/actions`)
                .set('Content-type', 'application/json')
                .send(<WsRequestDto>registerRequest)
                .expect(HttpStatus.ACCEPTED, registerResponse)

            await request(app.getHttpServer())
                .post('/actions')
                .set('Accept', 'application/json')
                .send(<WsRequestDto>callStartRequest)
                .expect(HttpStatus.ACCEPTED, startResponse);

            await request(app.getHttpServer())
                .post('/actions')
                .set('Accept', 'application/json')
                .send(<WsRequestDto>modifyRequest)
                .expect(HttpStatus.ACCEPTED, modifyResponse);

            await request(app.getHttpServer())
                .post('/actions')
                .set('Accept', 'application/json')
                .send(<WsRequestDto>terminateRequest)
                .expect(HttpStatus.ACCEPTED, terminateResponse);

            await sleep(3000)

            console.log('!!!!!!!!!!!!!!!!!!!!!!')
            expect(sipSendMock).toHaveBeenCalledTimes(5 /*Invite ack, *ReInvite Ack, Bye*/);


            expect(contextMap.get(registerRequest.connectionId).length).toEqual(4)
            //WS Register Responses
            let element = contextMap.get(registerRequest.connectionId)[0]
            expect(element).toMatchObject({
                "callId": callId,
                "messageId": `${process.env.POD_UID}_${registerRequest.dto.messageId}`,
                "source": registerRequest.dto.destination,
                "destination": registerRequest.dto.source,
                "ts": expect.any(Number),
                "type": REGISTER_ACTION_ACK,
                "body": {"requestMessageId": "1", "GWVersion": "1.0"}
            });

            // WS Ring Responses
            element = contextMap.get(callStartRequest.connectionId)[1]
            expect(element).toMatchObject({
                "source": callStartRequest.dto.destination,
                "destination": callStartRequest.dto.source,
                "callId": callId,
                "ts": expect.any(Number),
                "type": CALL_SERVICE_TYPE,
                "messageId": `${process.env.POD_UID}_${callStartRequest.dto.messageId}`,
                "body": {
                    "action": STATUS_ACTION,
                    "requestMessageId": callStartRequest.dto.messageId,
                    "statusCode": "200",
                    "description": "Ringing"
                }
            });

            //WS Answer Responses
            element = contextMap.get(callStartRequest.connectionId)[2]
            expect(element).toMatchObject(
                {
                    "source": callStartRequest.dto.destination,
                    "destination": callStartRequest.dto.source,
                    "callId": callId,
                    "ts": expect.any(Number),
                    "type": CALL_SERVICE_TYPE,
                    "messageId": `${process.env.POD_UID}_${callStartRequest.dto.messageId}`,
                    "body": {
                        "action": ANSWER_ACTION,
                        "requestMessageId": callStartRequest.dto.messageId,
                        "sdp": callStartRequest.dto.body.sdp //a loop from request was done in mock
                    }
                })

            //WS Modify Ack Responses
            element = contextMap.get(modifyRequest.connectionId)[3]
            expect(element).toMatchObject(
                {
                    "source": modifyRequest.dto.destination,
                    "destination": modifyRequest.dto.source,
                    "callId": callId,
                    "ts": expect.any(Number),
                    "type": CALL_SERVICE_TYPE,
                    "messageId": `${process.env.POD_UID}_${modifyRequest.dto.messageId}`,
                    "body": {
                        "action": MODIFY_ACTION_ACK,
                        "requestMessageId": modifyRequest.dto.messageId,
                        "sdp": modifyRequest.dto.body.sdp //a loop from request was done in mock
                    }
                })
        }
            // catch (e) {
            //     console.error(`Error.......: ${e.message ? e.message : e}`)
            // }
        finally {
            delete process.env.POD_UID
        }

    });

});


describe('WebRTCGateway Cancel flow (integration)', () => {

    jest.setTimeout(10000)
    let moduleFixture: TestingModule
    let app: INestApplication;
    let testApp: INestApplication;
    let msgHandler: ClientMsgHandler;
    let sipServer: SipService;
    let sipUtils: SipUtils
    let contextMap: Map<string, Array<ApiGwDto>> = new Map<string, Array<ApiGwDto>>();

    let ix: number = 0;

    const initTestApp = async (): Promise<void> => {
        let port: number = 8088;
        testApp = await NestFactory.create(E2eModule);
        testApp.enableCors();

        let wsSimController = testApp.get<WsSimController>(WsSimController);
        wsSimController.setContext(contextMap);

        await testApp.listenAsync(port, "127.0.0.1");
        console.log(`Test app started on: 127.0.0.1:${port}`);

    }


    beforeAll(async () => {
        console.log("starting test app...");
        moduleFixture = await Test.createTestingModule({
            imports: [WebrtcModule],
            providers: [
                CounterService,
                {provide: MculoggerService, useValue: loggerServiceMock},
                {provide: MetricsService, useValue: MetricsServiceMock}
            ]
        }).compile();

        app = moduleFixture.createNestApplication();
        msgHandler = app.get<ClientMsgHandler>(ClientMsgHandler);
        sipServer = app.get<SipService>(SipService);
        sipUtils = app.get<SipUtils>(SipUtils);
        process.env.DEFAULT_SIP = "false";

        sipServer.setSipApi(SIP);

        await app.init();

        await initTestApp();
    });

    afterAll(async () => {
        await app.close();
        await testApp.close();
        console.log("test app closed!");
    })

    beforeEach(async () => {
        jest.clearAllMocks()
        contextMap.clear() //clear ws map
        // delete process.env.K8S_POD_ID
    });

    afterEach(async () => {
    });

    let rsp = {statusCode: 200, desc: "OK"};

    it('Cancel Flow (register->start-call-> immediate end-call (Terminate)', async () => {

        isCancelFlow = true

        let deviceId: string = 'deviceId-6' //set different value for each test
        jest.spyOn(JwtAuthGuard.prototype as any, 'parseToken').mockImplementation(() => {
            let userData: UserDataDto = new UserDataDto()
            userData.userId = source
            userData.deviceId = deviceId
            userData.accessToken = ACCESS_TOKEN
            userData.organizationSid = 'ORd73aaa45a875466391fddd90419f4176'; //Was taken from ACCESS_TOKEN
            userData.accountSid = 'AC3c5b4177e5fdd813720bc0d6dd7f057e'; //Was taken from ACCESS_TOKEN
            userData.appSid = 'AP4434355tomer' //Was taken from ACCESS_TOKEN

            return userData
        })

        let connectionId = CONNECTION_ID + "-cancel-flow";
        registerRequest.connectionId = connectionId
        registerRequest.dto.body.deviceId = deviceId
        callStartRequest.connectionId = connectionId
        terminateRequest.connectionId = connectionId

        let callId: string = registerRequest.dto.callId + "-cancel-flow"
        registerRequest.dto.callId = callId
        callStartRequest.dto.callId = callId
        terminateRequest.dto.callId = callId

        callStartRequest.dto.body.sdp = "m=audio"

        let registerResponse = {
            source: registerRequest.dto.source,
            destination: registerRequest.dto.destination,
            callId: registerRequest.dto.callId,
            messageId: registerRequest.dto.messageId,
            action: REGISTER_ACTION
        }

        let startResponse = {
            source: callStartRequest.dto.source,
            destination: callStartRequest.dto.destination,
            callId: callStartRequest.dto.callId,
            messageId: callStartRequest.dto.messageId,
            action: START_ACTION
        }

        let terminateResponse = {
            source: terminateRequest.dto.source,
            destination: terminateRequest.dto.destination,
            callId: terminateRequest.dto.callId,
            messageId: terminateRequest.dto.messageId,
            action: TERMINATE_ACTION
        }

        await request(app.getHttpServer())
            .post(`/connect`)
            .set('Content-type', 'application/json')
            .set('Authorization', ACCESS_TOKEN)
            .send(<WsRequestDto>{connectionId: registerRequest.connectionId})
            .expect(HttpStatus.CREATED);

        await request(app.getHttpServer())
            .post(`/actions`)
            .set('Content-type', 'application/json')
            .send(<WsRequestDto>registerRequest)
            .expect(HttpStatus.ACCEPTED, registerResponse)

        await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(<WsRequestDto>callStartRequest)
            .expect(HttpStatus.ACCEPTED, startResponse);

        await sleep(200)

        await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(<WsRequestDto>terminateRequest)
            .expect(HttpStatus.ACCEPTED, terminateResponse);

        await sleep(3000)

        expect(sipSendMock).toHaveBeenCalledTimes(2) //*Invite, Cancel/);

        expect(contextMap.get(registerRequest.connectionId).length).toEqual(3)
        //WS Register Responses
        let element = contextMap.get(registerRequest.connectionId)[0]
        expect(element).toMatchObject({
            "callId": registerRequest.dto.callId,
            "messageId": registerRequest.dto.messageId,
            "source": registerRequest.dto.destination,
            "destination": registerRequest.dto.source,
            "ts": expect.any(Number),
            "type": REGISTER_ACTION_ACK,
            "body": {"requestMessageId": "1", "GWVersion": "1.0"}
        });

        // //WS Ring Responses
        element = contextMap.get(callStartRequest.connectionId)[1]
        expect(element).toMatchObject({
            "source": callStartRequest.dto.destination,
            "destination": callStartRequest.dto.source,
            "callId": callStartRequest.dto.callId,
            "ts": expect.any(Number),
            "type": CALL_SERVICE_TYPE,
            "messageId": callStartRequest.dto.messageId,
            "body": {
                "action": STATUS_ACTION,
                "requestMessageId": callStartRequest.dto.messageId,
                "statusCode": "200",
                "description": "Ringing"
            }
        });


        element = contextMap.get(callStartRequest.connectionId)[2]
        expect(element).toMatchObject({
            "source": callStartRequest.dto.destination,
            "destination": callStartRequest.dto.source,
            "callId": callStartRequest.dto.callId,
            "ts": expect.any(Number),
            "type": CALL_SERVICE_TYPE,
            "messageId": callStartRequest.dto.messageId,
            "body": {
                "action": STATUS_ACTION,
                "requestMessageId": callStartRequest.dto.messageId,
                "statusCode": "487",
                "description": "Request Terminated"
            }
        });

        let invite = {//INVITE
            "method": "INVITE",
            "uri": `sip:${callStartRequest.dto.destination}`,
            "version": "2.0",
            "headers": {
                "authorization": ACCESS_TOKEN,
                "to": {
                    "uri": sipUtils.getURI(callStartRequest.dto.destination, 'AP4434355tomer')
                },
                "from": {
                    "uri": `sip:${callStartRequest.dto.source}`,
                    "params": {
                        "tag": expect.any(String)
                    }
                },
                "call-id": callStartRequest.dto.callId,
                "X-Called-Party-ID": `sip:${callStartRequest.dto.destination}`,
                "cseq": {
                    "method": "INVITE",
                    "seq": 1
                },
                "contact": [
                    {
                        "uri": expect.any(String)
                    }
                ],
                "via": [],
                "Content-Type": "application/sdp",
                "X-Service-Type": "P2A",
                "Max-Forwards": 70,
                "User-Agent": "Restcomm WebRTC Demo/2.3.2-274"
            },
            "content": callStartRequest.dto.body.sdp
        }

        expect(sipSendMock).toHaveBeenNthCalledWith(1, invite, expect.any(Function)
        )


        expect(sipSendMock).toHaveBeenNthCalledWith(2, {//CANCEL
                "method": "CANCEL",
                "uri": `sip:${callStartRequest.dto.destination}`,
                "version": "2.0",
                "headers": {
                    "to": {
                        "uri": sipUtils.getURI(callStartRequest.dto.destination, 'AP4434355tomer')
                    },
                    "from": {
                        "uri": `sip:${callStartRequest.dto.source}`,
                        "params": {
                            "tag": expect.any(String)
                        }
                    },
                    "call-id": callStartRequest.dto.callId,
                    "cseq": {
                        "method": "CANCEL",
                        "seq": 1
                    },
                    "via": [invite.headers.via[0]],
                    "Max-Forwards": 70,
                    "X-Service-Type": "P2A",

                },
            }, expect.any(Function)
        )

    })

});

describe('Auth jwt token extraction methods', () => {

    jest.setTimeout(10000)
    let moduleFixture: TestingModule
    let app: INestApplication;

    let ix: number = 0;


    beforeAll(async () => {
        moduleFixture = await Test.createTestingModule({
            imports: [WebrtcModule],
            providers: [
                CounterService,
                {provide: MculoggerService, useValue: loggerServiceMock},
                {provide: DbService, useValue: dbMock},
                {provide: CounterService, useValue: CounterServiceMock},
            ]
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
    });

    afterAll(async () => {
        await sleep(1000);
        await app.close();
    })

    beforeEach(async () => {
        jest.clearAllMocks()
    });

    afterEach(async () => {
    });

    it('Connect => valid token (headers)', async () => {
        const res = await request(app.getHttpServer())
            .post(`/connect`)
            .set('Content-type', 'application/json')
            .set('Authorization', ACCESS_TOKEN)
            .send(<WsRequestDto>{connectionId: CONNECTION_ID + ix++})
            .expect(HttpStatus.CREATED);
    });

    it('Connect => valid token (query)', async () => {
        const res = await request(app.getHttpServer())
            .post(`/connect`)
            .set('Content-type', 'application/json')
            .query({'Authorization': ACCESS_TOKEN})
            .send(<WsRequestDto>{connectionId: CONNECTION_ID + ix++})
            .expect(HttpStatus.CREATED);
    });

    it('Connect => missing token', async () => {
        const res = await request(app.getHttpServer())
            .post(`/connect`)
            .set('Content-type', 'application/json')
            .expect(HttpStatus.FORBIDDEN); //send by validator
    });
});


/*describe('test /push api to firebase webrtc class', () => {

    jest.setTimeout(4000);
    let moduleFixture: TestingModule;
    let app: INestApplication;

    let service: FirebaseService;

    let accountSid: string = "accountSid";
    let data = {
        userId: "teat1@test.com",
        pushToken: 'PUSH_TOKEN',
        accountSid: accountSid
    }



    beforeAll(async () => {

        console.log("starting test app...");
        moduleFixture = await Test.createTestingModule({
            imports: [WebrtcModule]
        }).compile();


        app = moduleFixture.createNestApplication();
        service = app.get<FirebaseService>(FirebaseService);
        await app.init();

    });

    afterAll(async () => {
        console.log("test app closed!");
        await app.close();
    })

    let response = {};

    it('Test Push Api', async () => {

        let firebaseMock = jest.spyOn(service, 'sendNotification');
        let response = {};

        await request(app.getHttpServer())
            .post(`/push`)
            .set('Content-type', 'application/json')
            .send(data)
            .expect(HttpStatus.ACCEPTED, response);

        expect(firebaseMock).toHaveBeenCalledTimes(1);

        await service.deleteClient(accountSid);

        await sleep(200);

    });
});*/

