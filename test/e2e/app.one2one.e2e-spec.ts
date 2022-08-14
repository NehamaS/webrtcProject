import {Test, TestingModule} from '@nestjs/testing';
import {HttpStatus, INestApplication} from '@nestjs/common';
import request from 'supertest';
import {
    callStartRequestOne2One,
    answerResponseOne2One,
    registerRequest,
    registerRequestB,
    terminateRequestOne2One,
    conn,
    connB
} from "../msghandler/messages";
import {ClientMsgHandler} from "../../src/client.msg.handler";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {loggerServiceMock, MetricsServiceMock} from "../testutils/test.mock";
import {WebrtcModule} from "../../src/webrtc.module";
import {SipService} from "../../src/callserviceapi/sip/sip.service";
import {E2eModule} from "./simulators/e2e.module";
import {NestFactory} from "@nestjs/core";
import {WsSimController} from "./simulators/ws.sim.controller";
import {SipUtils} from "../../src/callserviceapi/sip/common/sip.utils";
import {RequestDTO} from "../../src/callserviceapi/sip/common/sipMessageDTO";
import {ApiGwDto} from "../../src/dto/api.gw.dto";
import {sleep} from "../testutils/test.utils";
import {
    CALL_SERVICE_TYPE,
    REGISTER_ACTION_ACK,
    ANSWER_ACTION,
    TERMINATE_ACTION,
    REGISTER_ACTION,
    START_ACTION
} from "../../src/common/constants";
import {EventEmitter} from 'events'
import * as path from 'path';
import {WsRequestDto} from "../../src/dto/ws.request.dto";
import {MetricsService} from "service-infrastructure/dd-metrics/metrics.service";
import {JwtAuthGuard} from "../../src/auth/guards/jwt.auth.guard";
import {UserDataDto} from "../../src/dto/user.data.dto";
import {ACCESS_TOKEN} from "../testutils/constants";
import * as _ from 'lodash'

let emitter = new EventEmitter()

process.env.SRV_CONF_PATH = `${__dirname}${path.sep}config.json`;
process.env.CONF_PATH = `${__dirname}${path.sep}config.json`
let isCancelFlow: boolean = false

let SIP = {};

describe('One2One', () => {

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
                {provide: MculoggerService, useValue: loggerServiceMock},
                {provide: MetricsService, useValue: MetricsServiceMock}
            ]
        }).compile();

        app = moduleFixture.createNestApplication();
        msgHandler = app.get<ClientMsgHandler>(ClientMsgHandler);
        sipServer = app.get<SipService>(SipService);
        sipUtils = app.get<SipUtils>(SipUtils)

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
        isCancelFlow = false

    });

    afterEach(async () => {
    });

    let rsp = {statusCode: 200, desc: "OK"};

    it('One2One Test Register and callStart and Terminate(BYE) by B party', async () => {

        console.log("++++++++++++++++++++++++ Test One2One Test Register and callStart and Terminate(BYE) by B party ++++++++++++++++++++++++ ");

        let deviceIdA: string = 'p2p-A' //set different value for each test
        let deviceIdB: string = 'p2p-B' //set different value for each test
        let userIdA: string = 'testaerA@test.com'
        let userIdB: string = 'testaerB@test.com'

        let registerRequest_A: WsRequestDto = _.cloneDeep(registerRequest)
        let registerRequest_B: WsRequestDto = _.cloneDeep(registerRequestB)
        let callStartRequestOne2One_A: WsRequestDto = _.cloneDeep(callStartRequestOne2One)
        let terminateRequestOne2One_B: WsRequestDto = _.cloneDeep(terminateRequestOne2One)
        let answerResponseOne2One_B : WsRequestDto= _.cloneDeep(answerResponseOne2One)

        let conn = 'connectionId_A'
        let connB = 'connectionId_b'

        //Device A
        registerRequest_A.connectionId = conn;
        registerRequest_A.dto.body.deviceId = deviceIdA
        registerRequest_A.dto.source = userIdA

        callStartRequestOne2One_A.connectionId = conn;
        callStartRequestOne2One_A.dto.source = userIdA
        callStartRequestOne2One_A.dto.destination = userIdB

        //Device B
        registerRequest_B.connectionId = connB;
        registerRequest_B.dto.body.deviceId = deviceIdB
        registerRequest_B.dto.source = userIdB
        answerResponseOne2One_B.connectionId = connB;
        answerResponseOne2One_B.dto.destination = userIdA
        answerResponseOne2One_B.dto.source = userIdB

        terminateRequestOne2One_B.connectionId = connB;
        terminateRequestOne2One_B.dto.source = userIdA
        terminateRequestOne2One_B.dto.destination = userIdA

        let registerResponse = {
            source: registerRequest_A.dto.source,
            destination: registerRequest_A.dto.destination,
            callId: registerRequest_A.dto.callId,
            messageId: registerRequest_A.dto.messageId,
            action: REGISTER_ACTION
        }

        let registerResponseB = {
            source: registerRequest_B.dto.source,
            destination: registerRequest_B.dto.destination,
            callId: registerRequest_B.dto.callId,
            messageId: registerRequest_B.dto.messageId,
            action: REGISTER_ACTION
        }

        let startResponse = {
            source: callStartRequestOne2One_A.dto.source,
            destination: callStartRequestOne2One_A.dto.destination,
            callId: callStartRequestOne2One_A.dto.callId,
            messageId: callStartRequestOne2One_A.dto.messageId,
            action: START_ACTION
        }

        let answerResponse = {
            source: answerResponseOne2One_B.dto.source,
            destination: answerResponseOne2One_B.dto.destination,
            callId: answerResponseOne2One_B.dto.callId,
            messageId: answerResponseOne2One_B.dto.messageId,
            action: ANSWER_ACTION
        }

        let terminateResponse = {
            source: terminateRequestOne2One_B.dto.source,
            destination: terminateRequestOne2One_B.dto.destination,
            callId: terminateRequestOne2One_B.dto.callId,
            messageId: terminateRequestOne2One_B.dto.messageId,
            action: TERMINATE_ACTION
        }




        jest.spyOn(JwtAuthGuard.prototype as any, 'parseToken').mockImplementation(() => {
            let userData: UserDataDto = new UserDataDto()
            userData.userId = userIdA
            userData.deviceId = deviceIdA
            userData.accessToken = ACCESS_TOKEN
            userData.organizationSid = 'ORd73aaa45a875466391fddd90419f4176'; //Was taken from ACCESS_TOKEN
            userData.accountSid = 'AC3c5b4177e5fdd813720bc0d6dd7f057e'; //Was taken from ACCESS_TOKEN
            userData.appSid = 'AP4434355tomer' //Was taken from ACCESS_TOKEN

            return userData
        })

        await request(app.getHttpServer())
            .post(`/connect`)
            .set('Content-type', 'application/json')
            .set('Authorization', ACCESS_TOKEN)
            .send(<WsRequestDto>{connectionId: conn})
            .expect(HttpStatus.CREATED);

        await request(app.getHttpServer())
            .post(`/actions`)
            .set('Content-type', 'application/json')
            .send(registerRequest_A)
            .expect(HttpStatus.ACCEPTED, registerResponse);

        await sleep(100);

        expect(contextMap.get(conn)[0]).toMatchObject({
            "callId": registerRequest_A.dto.callId,
            "messageId": registerRequest_A.dto.messageId,
            "source": registerRequest_A.dto.destination,
            "destination": registerRequest_A.dto.source,
            "ts": expect.any(Number),
            "type": REGISTER_ACTION_ACK
        });

        jest.spyOn(JwtAuthGuard.prototype as any, 'parseToken').mockImplementation(() => {
            let userData: UserDataDto = new UserDataDto()
            userData.userId = userIdB //SourceB
            userData.deviceId = deviceIdB
            userData.accessToken = ACCESS_TOKEN
            userData.organizationSid = 'ORd73aaa45a875466391fddd90419f4176'; //Was taken from ACCESS_TOKEN
            userData.accountSid = 'AC3c5b4177e5fdd813720bc0d6dd7f057e'; //Was taken from ACCESS_TOKEN
            userData.appSid = 'AP4434355tomer' //Was taken from ACCESS_TOKEN

            return userData
        })

        await request(app.getHttpServer())
            .post(`/connect`)
            .set('Content-type', 'application/json')
            .set('Authorization', ACCESS_TOKEN)
            .send(<WsRequestDto>{connectionId: connB})
            .expect(HttpStatus.CREATED);

        await sleep(200);

        await request(app.getHttpServer())
            .post(`/actions`)
            .set('Content-type', 'application/json')
            .send(registerRequest_B)
            .expect(HttpStatus.ACCEPTED, registerResponseB);

        await sleep(200);

        expect(contextMap.get(connB)[0]).toMatchObject({
            "callId": registerRequest_B.dto.callId,
            "messageId": registerRequest_B.dto.messageId,
            "source": registerRequest_B.dto.destination,
            "destination": registerRequest_B.dto.source,
            "ts": expect.any(Number),
            "type": REGISTER_ACTION_ACK
        });

        //Device A start Call
       await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(callStartRequestOne2One_A)
            .expect(HttpStatus.ACCEPTED, startResponse);

        await sleep(200)


        expect(contextMap.get(connB)[1]).toMatchObject({
            "callId": callStartRequestOne2One_A.dto.callId + "_leg2",
            "messageId": callStartRequestOne2One_A.dto.messageId,
            "source": callStartRequestOne2One_A.dto.source,
            "destination": callStartRequestOne2One_A.dto.destination,
            "meetingId": callStartRequestOne2One_A.dto.meetingId,
            "ts": expect.any(Number),
            "type": CALL_SERVICE_TYPE,
            "body": {
                action: callStartRequestOne2One_A.dto.body.action,
                sdp: callStartRequestOne2One_A.dto.body.sdp
            }
        });

       let result =  await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(answerResponseOne2One_B)
            .expect(HttpStatus.ACCEPTED, answerResponse);

        await sleep(50)

        expect(contextMap.get(conn)[1]).toMatchObject({
            "callId": callStartRequestOne2One_A.dto.callId,
            "messageId": answerResponseOne2One_B.dto.messageId,
            "source": answerResponseOne2One_B.dto.destination,
            "destination": answerResponseOne2One_B.dto.source,
            "meetingId": answerResponseOne2One_B.dto.meetingId,
            "ts": expect.any(Number),
            "type": CALL_SERVICE_TYPE,
            "body": {
                action: answerResponseOne2One_B.dto.body.action,
                sdp: answerResponseOne2One_B.dto.body.sdp
            }
        });

        await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(terminateRequestOne2One_B)
            .expect(HttpStatus.ACCEPTED, terminateResponse);

        await sleep(500)

        expect(contextMap.get(connB)[2]).toMatchObject({
            "callId": terminateRequestOne2One_B.dto.callId + "_leg2",
            "messageId": terminateRequestOne2One_B.dto.messageId,
            "source": terminateRequestOne2One_B.dto.source,
            "destination": terminateRequestOne2One_B.dto.destination,
            "meetingId": terminateRequestOne2One_B.dto.meetingId,
            "ts": expect.any(Number),
            "type": CALL_SERVICE_TYPE,
            "body": {
                action: terminateRequestOne2One_B.dto.body.action,
                statusCode: terminateRequestOne2One_B.dto.body.statusCode,
                description: terminateRequestOne2One_B.dto.body.description
            }
        });
        await sleep(2000)

    });


    it('One2One Test start call twice after disconnect (RTCGW-210)', async () => {
        /*Register twice with same user but with different device =>
        this will result with two records in db only one will have valid connection id*/

        let registerResponse = {
            source: registerRequest.dto.source,
            destination: registerRequest.dto.destination,
            callId: registerRequest.dto.callId,
            messageId: registerRequest.dto.messageId,
            action: REGISTER_ACTION
        }

        let registerResponseB = {
            source: registerRequestB.dto.source,
            destination: registerRequest.dto.destination,
            callId: registerRequestB.dto.callId,
            messageId: registerRequestB.dto.messageId,
            action: REGISTER_ACTION
        }

        let startResponse = {
            source: callStartRequestOne2One.dto.source,
            destination: callStartRequestOne2One.dto.destination,
            callId: callStartRequestOne2One.dto.callId,
            messageId: callStartRequestOne2One.dto.messageId,
            action: START_ACTION
        }

        let answerResponse = {
            source: answerResponseOne2One.dto.source,
            destination: answerResponseOne2One.dto.destination,
            callId: answerResponseOne2One.dto.callId,
            messageId: answerResponseOne2One.dto.messageId,
            action: ANSWER_ACTION
        }

        let terminateResponse = {
            source: terminateRequestOne2One.dto.source,
            destination: terminateRequestOne2One.dto.destination,
            callId: terminateRequestOne2One.dto.callId,
            messageId: terminateRequestOne2One.dto.messageId,
            action: TERMINATE_ACTION
        }

        registerRequest.connectionId = conn;
        registerRequestB.connectionId = connB;
        callStartRequestOne2One.connectionId = conn;
        terminateRequestOne2One.connectionId = conn;
        answerResponseOne2One.connectionId = connB;

        let disconnect: WsRequestDto = {connectionId: conn, dto: <ApiGwDto>{}};
        let disconnectB: WsRequestDto = {connectionId: connB, dto: <ApiGwDto>{}};

        for (let i = 0; i < 2; i++) {
            registerRequest.dto.body.deviceId = `${registerRequest.dto.body.deviceId}-${i}`;
            registerRequestB.dto.body.deviceId = `${registerRequest.dto.body.deviceId}-${i}`;


            await request(app.getHttpServer())
                .post(`/actions`)
                .set('Content-type', 'application/json')
                .send(registerRequest)
                .expect(HttpStatus.ACCEPTED, registerResponse);

            await sleep(50);

            expect(contextMap.get(conn)[0]).toMatchObject({
                "callId": registerRequest.dto.callId,
                "messageId": registerRequest.dto.messageId,
                "source": registerRequest.dto.destination,
                "destination": registerRequest.dto.source,
                "ts": expect.any(Number),
                "type": REGISTER_ACTION_ACK
            });

            await request(app.getHttpServer())
                .post(`/actions`)
                .set('Content-type', 'application/json')
                .send(registerRequestB)
                .expect(HttpStatus.ACCEPTED, registerResponseB);

            await sleep(100);

            expect(contextMap.get(connB)[0]).toMatchObject({
                "callId": registerRequestB.dto.callId,
                "messageId": registerRequestB.dto.messageId,
                "source": registerRequestB.dto.destination,
                "destination": registerRequestB.dto.source,
                "ts": expect.any(Number),
                "type": REGISTER_ACTION_ACK
            });

            await request(app.getHttpServer())
                .post('/actions')
                .set('Accept', 'application/json')
                .send(callStartRequestOne2One)
                .expect(HttpStatus.ACCEPTED, startResponse);

            await sleep(50)


            expect(contextMap.get(connB)[1]).toMatchObject({
                "callId": callStartRequestOne2One.dto.callId + "_leg2",
                "messageId": callStartRequestOne2One.dto.messageId,
                "source": callStartRequestOne2One.dto.source,
                "destination": callStartRequestOne2One.dto.destination,
                "meetingId": callStartRequestOne2One.dto.meetingId,
                "ts": expect.any(Number),
                "type": CALL_SERVICE_TYPE,
                "body": {
                    action: callStartRequestOne2One.dto.body.action,
                    sdp: callStartRequestOne2One.dto.body.sdp
                }
            });

            await request(app.getHttpServer())
                .post('/actions')
                .set('Accept', 'application/json')
                .send(answerResponseOne2One)
                .expect(HttpStatus.ACCEPTED, answerResponse);

            await sleep(50)

            expect(contextMap.get(conn)[1]).toMatchObject({
                "callId": callStartRequestOne2One.dto.callId,
                "messageId": answerResponseOne2One.dto.messageId,
                "source": answerResponseOne2One.dto.destination,
                "destination": answerResponseOne2One.dto.source,
                "meetingId": answerResponseOne2One.dto.meetingId,
                "ts": expect.any(Number),
                "type": CALL_SERVICE_TYPE,
                "body": {
                    action: answerResponseOne2One.dto.body.action,
                    sdp: answerResponseOne2One.dto.body.sdp
                }
            });

            await request(app.getHttpServer())
                .post('/actions')
                .set('Accept', 'application/json')
                .send(terminateRequestOne2One)
                .expect(HttpStatus.ACCEPTED, terminateResponse);

            await sleep(500)

            expect(contextMap.get(connB)[2]).toMatchObject({
                "callId": terminateRequestOne2One.dto.callId + "_leg2",
                "messageId": terminateRequestOne2One.dto.messageId,
                "source": terminateRequestOne2One.dto.source,
                "destination": terminateRequestOne2One.dto.destination,
                "meetingId": terminateRequestOne2One.dto.meetingId,
                "ts": expect.any(Number),
                "type": CALL_SERVICE_TYPE,
                "body": {
                    action: terminateRequestOne2One.dto.body.action,
                    statusCode: terminateRequestOne2One.dto.body.statusCode,
                    description: terminateRequestOne2One.dto.body.description
                }
            });
            await sleep(2000);

            await request(app.getHttpServer())
                .post('/disconnect')
                .set('Accept', 'application/json')
                .send(disconnect)
                .expect(HttpStatus.CREATED, "true");

            await request(app.getHttpServer())
                .post('/disconnect')
                .set('Accept', 'application/json')
                .send(disconnectB)
                .expect(HttpStatus.CREATED, "true");
        }
        await sleep(500);

    });


});
