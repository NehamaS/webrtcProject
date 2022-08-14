import {Test, TestingModule} from "@nestjs/testing";
import {HttpStatus, INestApplication} from "@nestjs/common";
import {ClientMsgHandler} from "../../src/client.msg.handler";
import {SipService} from "../../src/callserviceapi/sip/sip.service";
import {SipUtils} from "../../src/callserviceapi/sip/common/sip.utils";
import {ApiGwDto} from "../../src/dto/api.gw.dto";
import {NestFactory} from "@nestjs/core";
import {E2eModule} from "./simulators/e2e.module";
import {WsSimController} from "./simulators/ws.sim.controller";
import {WebrtcModule} from "../../src/webrtc.module";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {loggerServiceMock, MetricsServiceMock, RetransmissionsMock} from "../testutils/test.mock";
import {Retransmissions} from "../../src/callserviceapi/sip/massagefactory/retransmissions";
import {callAnswerResponse, callStartRequest, conn, registerRequest, terminateRequest, ringCallResponse, source} from "../msghandler/messages";
import {
    ANSWER_ACTION,
    REGISTER_ACTION,
    SIP_PORT,
    TERMINATE_ACTION,
    TERMINATE_ACK_ACTION,
    START_ACTION, CALL_SERVICE_TYPE, STATUS_ACTION
} from "../../src/common/constants";
import request from "supertest";
import {sleep} from "../testutils/test.utils";
import {WsRequestDto} from "../../src/dto/ws.request.dto";

import {makeResponseMock, SIP, sipSendMock, TO_TAG} from "../common/sip/sip.mock";
import * as path from "path";
import * as ip from "ip";
import {ACCESS_TOKEN} from "../testutils/constants";
import {
    USER_AGENT,
    FROM_TAG,
    MessageFactory
} from "../../src/callserviceapi/sip/massagefactory/message.factory";
import {MetricsService} from "service-infrastructure/dd-metrics/metrics.service";

const getCallId = (): string => {
    return Math.floor(Math.random()*1e12).toString();
}

const buildRegisterRsp = (registerRequest: WsRequestDto): any => {
    let rsp = {
        source: registerRequest.dto.source,
        destination: registerRequest.dto.destination,
        callId: registerRequest.dto.callId,
        messageId: registerRequest.dto.messageId,
        action: REGISTER_ACTION
    }

    return rsp;
}

process.env.SRV_CONF_PATH = `${__dirname}${path.sep}config.json`;
process.env.CONF_PATH = `${__dirname}${path.sep}config.json`


let incInviteRequest = {
    method: 'INVITE',
    uri: 'sip:972545461300@192.168.1.116:5060',
    version: '2.0',
    headers: {
        to: {uri: 'sip:972545461300@gmail.com'},
        from: {uri: 'sip:972545461255@gmail.com', params: {tag: getCallId()}},
        'call-id': getCallId(),
        cseq: {method: 'INVITE', seq: 1},
        contact: [{uri: 'sip:972545461255@gmail.com'}],
        'x-restcomm-callsid': "callSid-777777",
        via: [],
        'content-type': 'application/sdp'
    },
    content:
        'Offer SDP'
};

let incByeRequest = {
    method: 'BYE',
    uri: 'sip:972545461300@192.168.1.116:5060',
    version: '2.0',
    headers: {
        to: {uri: 'sip:972545461300@gmail.com', params: {tag: TO_TAG}},
        from: {uri: 'sip:972545461255@gmail.com', params: {tag: incInviteRequest.headers.from.params.tag}},
        'call-id': incInviteRequest.headers["call-id"],
        cseq: {method: 'BYE', seq: 2},
        via: [],
    }
};

let incCancelRequest = {
    method: 'CANCEL',
    uri: 'sip:972545461300@192.168.1.116:5060',
    version: '2.0',
    headers: {
        to: {uri: 'sip:972545461300@gmail.com', params: {tag: TO_TAG}},
        from: {uri: 'sip:972545461255@gmail.com', params: {tag: incInviteRequest.headers.from.params.tag}},
        'call-id': incInviteRequest.headers["call-id"],
        cseq: {method: 'CANCEL', seq: 1},
        via: [],
    }
};

let callerTag = getCallId();

let incInviteResponse = {
    status: 200,
    reason: 'OK',
    version: '2.0',
    headers: {
        to: {uri: 'sip:972545461255@gmail.com',  params: {tag: incInviteRequest.headers.from.params.tag}},
        from: {uri: 'sip:972545461300@gmail.com', params: {tag: callerTag}},
        'call-id': incInviteRequest.headers["call-id"],
        cseq: {method: 'INVITE', seq: 1},
        contact: [{uri: 'sip:972545461300@gmail.com'}],
        via: [],
        'content-type': 'application/sdp'
    },
    content:
        'Answer SDP'
};




let addr = process.env.SIP_ADDRESS ? process.env.SIP_ADDRESS : ip.address();

let outByeRequest = {
    method: 'BYE',
    uri: 'sip:972545461255@gmail.com',
    version: '2.0',
    headers: {
        to: {uri: 'sip:972545461255@gmail.com', params: {tag: incInviteRequest.headers.from.params.tag}},
        from: {uri: 'sip:972545461300@gmail.com', params: {tag: TO_TAG}},
        'call-id': incInviteRequest.headers["call-id"],
        'Max-Forwards': 70,
        cseq: {method: 'BYE', seq: 1},
        contact: [{uri: 'sip:' + addr + ':' + SIP_PORT}],
        via: [],
    }
};

describe('test incoming call flows', () => {

    jest.setTimeout(10000)
    let moduleFixture: TestingModule
    let app: INestApplication;
    let testApp: INestApplication;
    let msgHandler: ClientMsgHandler;
    let sipServer: SipService;
    let sipUtils: SipUtils
    let contextMap: Map<string, Array<ApiGwDto>> = new Map<string, Array<ApiGwDto>>();
    let msgFactory: MessageFactory;

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
                {provide: MetricsService, useValue: MetricsServiceMock},
                {provide: Retransmissions, useValue: RetransmissionsMock}
            ]
        }).compile();

        app = moduleFixture.createNestApplication();
        msgHandler = app.get<ClientMsgHandler>(ClientMsgHandler);
        sipServer = app.get<SipService>(SipService);
        sipUtils = app.get<SipUtils>(SipUtils);
        msgFactory = app.get<MessageFactory>(MessageFactory);

        sipServer.setSipApi(SIP);

        process.env.SIP_RETRASMISSION = 'false';
        process.env.SIP_USE_TEST_TAG = 'true';

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
        //isCancelFlow = false

    });

    afterEach(async () => {
    });

    // Test Incoming Calls
    it('Test User Not Found', async () => {
        sipServer["sipMessageHandler"]((incInviteRequest));

        expect(makeResponseMock).toHaveBeenNthCalledWith(1, incInviteRequest, 100, 'Trying');

        await sleep(200);

        expect(makeResponseMock).toHaveBeenNthCalledWith(2, incInviteRequest, 404, 'Not Found');
        expect(sipSendMock).toHaveBeenCalledTimes(2);

        await sleep(200);

    });

    it('Test Call to Disconnect User', async () => {

        registerRequest.connectionId = '12345';
        registerRequest.dto.callId = getCallId();
        registerRequest.dto.source = '972545461300@gmail.com';

        let registerResponse = buildRegisterRsp(registerRequest);

        await request(app.getHttpServer())
            .post(`/actions`)
            .set('Content-type', 'application/json')
            .send(registerRequest)
            .expect(HttpStatus.ACCEPTED, registerResponse);

        await sleep(200);

        let disconnectReq = {
            connectionId: '12345',
            dto: {}
        }

        await request(app.getHttpServer())
            .post(`/disconnect`)
            .set('Content-type', 'application/json')
            .send(disconnectReq)
            .expect(HttpStatus.CREATED);

        sipServer["sipMessageHandler"]((incInviteRequest));

        expect(makeResponseMock).toHaveBeenNthCalledWith(1, incInviteRequest, 100, 'Trying');

        await sleep(200);

        expect(makeResponseMock).toHaveBeenNthCalledWith(2, incInviteRequest, 404, 'Not Found');
        expect(sipSendMock).toHaveBeenCalledTimes(2);

        await sleep(200);

        // connect user from other device
        registerRequest.connectionId = '56789';
        registerRequest.dto.callId = getCallId();
        registerRequest.dto.body.deviceType = 'ANDROID';
        registerRequest.dto.body.deviceId = 'deviceId-22222';

        registerResponse = buildRegisterRsp(registerRequest);

        await request(app.getHttpServer())
            .post(`/actions`)
            .set('Content-type', 'application/json')
            .send(registerRequest)
            .expect(HttpStatus.ACCEPTED, registerResponse);

        await sleep(200);

        sipServer["sipMessageHandler"]((incInviteRequest));

        expect(makeResponseMock).toHaveBeenNthCalledWith(3, incInviteRequest, 100, 'Trying');

        await sleep(200);

        callAnswerResponse.destination = incInviteRequest.headers.from.uri.substring(4);
        callAnswerResponse.source = incInviteRequest.headers.to.uri.substring(4);
        callAnswerResponse.callId = incInviteRequest.headers["call-id"];
        callAnswerResponse.messageId = '1';
        callAnswerResponse.body.sdp = 'Answer SDP';

        let answerRsp: WsRequestDto = {
            connectionId: '56789',
            dto: callAnswerResponse
        };

        let answerAccept = {
            source: incInviteRequest.headers.to.uri.substring(4),
            destination: incInviteRequest.headers.from.uri.substring(4),
            callId: incInviteRequest.headers["call-id"],
            messageId: callAnswerResponse.messageId,
            action: ANSWER_ACTION
        }

        await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(answerRsp)
            .expect(HttpStatus.ACCEPTED, answerAccept);

        await sleep(500);

        let extension = {
            content: 'Answer SDP',
            headers: {
                'Content-Type': "application/sdp"
            }
        }

        expect(makeResponseMock).toHaveBeenLastCalledWith(incInviteRequest, 200, 'OK', extension);

        await sleep(300);

        sipServer["sipMessageHandler"]((incByeRequest));
        expect(makeResponseMock).toHaveBeenLastCalledWith(incByeRequest, 200, 'OK');

        await sleep(300);

    })

    it('Test User Answer, callee end call', async () => {

        registerRequest.connectionId = '12345';
        registerRequest.dto.callId = getCallId();
        registerRequest.dto.source = '972545461300@gmail.com';

        let registerResponse = {
            source: registerRequest.dto.source,
            destination: registerRequest.dto.destination,
            callId: registerRequest.dto.callId,
            messageId: registerRequest.dto.messageId,
            action: REGISTER_ACTION
        }

        await request(app.getHttpServer())
            .post(`/actions`)
            .set('Content-type', 'application/json')
            .send(registerRequest)
            .expect(HttpStatus.ACCEPTED, registerResponse);

        await sleep(2);

        sipServer["sipMessageHandler"]((incInviteRequest));

        expect(makeResponseMock).toHaveBeenNthCalledWith(1, incInviteRequest, 100, 'Trying');

        callAnswerResponse.destination = incInviteRequest.headers.from.uri.substring(4);
        callAnswerResponse.source = incInviteRequest.headers.to.uri.substring(4);
        callAnswerResponse.callId = incInviteRequest.headers["call-id"];
        callAnswerResponse.messageId = '1';
        callAnswerResponse.body.sdp = 'Answer SDP';

        let answerRsp: WsRequestDto = {
            connectionId: '12345',
            dto: callAnswerResponse
        };

        let answerAccept = {
            source: incInviteRequest.headers.to.uri.substring(4),
            destination: incInviteRequest.headers.from.uri.substring(4),
            callId: incInviteRequest.headers["call-id"],
            messageId: callAnswerResponse.messageId,
            action: ANSWER_ACTION
        }

        await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(answerRsp)
            .expect(HttpStatus.ACCEPTED, answerAccept);

        await sleep(500);

        let extension = {
            content: 'Answer SDP',
            headers: {
                'Content-Type': "application/sdp"
            }
        }

        expect(makeResponseMock).toHaveBeenLastCalledWith(incInviteRequest, 200, 'OK', extension);

        terminateRequest.connectionId = '12345';
        terminateRequest.dto.destination = incInviteRequest.headers.from.uri.substring(4);
        terminateRequest.dto.source = incInviteRequest.headers.to.uri.substring(4);
        terminateRequest.dto.callId = incInviteRequest.headers["call-id"];
        terminateRequest.dto.messageId = '2';

        let terminateAccept = {
            source: incInviteRequest.headers.to.uri.substring(4),
            destination: incInviteRequest.headers.from.uri.substring(4),
            callId: incInviteRequest.headers["call-id"],
            messageId: terminateRequest.dto.messageId,
            action: TERMINATE_ACTION
        }

        await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(terminateRequest)
            .expect(HttpStatus.ACCEPTED, terminateAccept);

        process.env.SIP_CONTACT_ADDR = 'e2e.webrtc.gw.com';
        let contactUri = msgFactory.getContactUri();
        expect(contactUri).toEqual('sip:e2e.webrtc.gw.com');

        let outByeRequest = {
            method: 'BYE',
            uri: 'sip:972545461255@gmail.com',
            version: '2.0',
            headers: {
                to: {uri: 'sip:972545461255@gmail.com', params: {tag: incInviteRequest.headers.from.params.tag}},
                from: {uri: 'sip:972545461300@gmail.com', params: {tag: TO_TAG}},
                'call-id': incInviteRequest.headers["call-id"],
                'Max-Forwards': 70,
                "X-RestComm-CallSid": "callSid-777777",
                cseq: {method: 'BYE', seq: 1},
                contact: [{uri: contactUri}],
                via: [],
            }
        };

        expect(sipSendMock).toHaveBeenLastCalledWith(outByeRequest, expect.any(Function));

        await sleep(300);
    })

    it('Test User Answer, caller end call', async () => {

        registerRequest.connectionId = '12345';
        registerRequest.dto.callId = getCallId();
        registerRequest.dto.source = '972545461300@gmail.com';

        let registerResponse = {
            source: registerRequest.dto.source,
            destination: registerRequest.dto.destination,
            callId: registerRequest.dto.callId,
            messageId: registerRequest.dto.messageId,
            action: REGISTER_ACTION
        }

        await request(app.getHttpServer())
            .post(`/actions`)
            .set('Content-type', 'application/json')
            .send(registerRequest)
            .expect(HttpStatus.ACCEPTED, registerResponse);

        await sleep(2);

        sipServer["sipMessageHandler"]((incInviteRequest));

        expect(makeResponseMock).toHaveBeenNthCalledWith(1, incInviteRequest, 100, 'Trying');

        callAnswerResponse.destination = incInviteRequest.headers.from.uri.substring(4); //'972545461255@gmail.com';
        callAnswerResponse.source = incInviteRequest.headers.to.uri.substring(4); //'972545461300@gmail.com';
        callAnswerResponse.callId = incInviteRequest.headers["call-id"];
        callAnswerResponse.messageId = '1';
        callAnswerResponse.body.sdp = 'Answer SDP';

        let answerRsp: WsRequestDto = {
            connectionId: '12345',
            dto: callAnswerResponse
        };

        let answerAccept = {
            source: incInviteRequest.headers.to.uri.substring(4),
            destination: incInviteRequest.headers.from.uri.substring(4),
            callId: incInviteRequest.headers["call-id"],
            messageId: callAnswerResponse.messageId,
            action: ANSWER_ACTION
        }

        await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(answerRsp)
            .expect(HttpStatus.ACCEPTED, answerAccept);

        await sleep(500);

        let extension = {
            content: 'Answer SDP',
            headers: {
                'Content-Type': "application/sdp"
            }
        }

        expect(makeResponseMock).toHaveBeenLastCalledWith(incInviteRequest, 200, 'OK', extension);

        await sleep(300);

        sipServer["sipMessageHandler"]((incByeRequest));
        expect(makeResponseMock).toHaveBeenLastCalledWith(incByeRequest, 200, 'OK');

        await sleep(300);
    })

    it('Cancel call', async () => {

        registerRequest.connectionId = '12345';
        registerRequest.dto.callId = getCallId();
        registerRequest.dto.source = '972545461300@gmail.com';

        let registerResponse = {
            source: registerRequest.dto.source,
            destination: registerRequest.dto.destination,
            callId: registerRequest.dto.callId,
            messageId: registerRequest.dto.messageId,
            action: REGISTER_ACTION
        }

        await request(app.getHttpServer())
            .post(`/actions`)
            .set('Content-type', 'application/json')
            .send(registerRequest)
            .expect(HttpStatus.ACCEPTED, registerResponse);

        await sleep(2);

        sipServer["sipMessageHandler"]((incInviteRequest));
        expect(makeResponseMock).toHaveBeenNthCalledWith(1, incInviteRequest, 100, 'Trying');

        await sleep(1000);

        sipServer["sipMessageHandler"]((incCancelRequest));
        expect(makeResponseMock).toHaveBeenNthCalledWith(2, incCancelRequest, 200, 'OK');

        const terminateAck: WsRequestDto = {
            connectionId: '12345',
            dto: {
                "source": incInviteRequest.headers.from.uri.substring(4),
                "destination": incInviteRequest.headers.to.uri.substring(4),
                "callId": incInviteRequest.headers["call-id"],
                "messageId": '1',
                "ts": 123,
                "type": 'Call',
                //"service": 'A2P',
                "body": {
                    "action": TERMINATE_ACK_ACTION,
                    "statusCode": '200',
                    "requestMessageId": '1'
                }
            }
        };

        let terminateAckRsp = {
            source: terminateAck.dto.source,
            destination: terminateAck.dto.destination,
            callId: terminateAck.dto.callId,
            messageId: terminateAck.dto.messageId,
            action: TERMINATE_ACK_ACTION
        };

        await request(app.getHttpServer())
            .post(`/actions`)
            .set('Content-type', 'application/json')
            .send(terminateAck)
            .expect(HttpStatus.ACCEPTED, terminateAckRsp);

        expect(makeResponseMock).toHaveBeenNthCalledWith(3, incInviteRequest, 487, 'Request Terminated');

        await sleep(300);
    })

    it('Test reject call', async () => {

        registerRequest.connectionId = '12345';
        registerRequest.dto.callId = getCallId();
        registerRequest.dto.source = '972545461300@gmail.com';

        let registerResponse = {
            source: registerRequest.dto.source,
            destination: registerRequest.dto.destination,
            callId: registerRequest.dto.callId,
            messageId: registerRequest.dto.messageId,
            action: REGISTER_ACTION
        }

        await request(app.getHttpServer())
            .post(`/actions`)
            .set('Content-type', 'application/json')
            .send(registerRequest)
            .expect(HttpStatus.ACCEPTED, registerResponse);

        await sleep(200);

        sipServer["sipMessageHandler"]((incInviteRequest));

        expect(makeResponseMock).toHaveBeenNthCalledWith(1, incInviteRequest, 100, 'Trying');

        callAnswerResponse.destination = incInviteRequest.headers.from.uri.substring(4);
        callAnswerResponse.source = incInviteRequest.headers.to.uri.substring(4);
        callAnswerResponse.callId = incInviteRequest.headers["call-id"];
        callAnswerResponse.messageId = '1';
        callAnswerResponse.body.sdp = undefined;
        callAnswerResponse.body.statusCode = '403';
        callAnswerResponse.body.description = 'Forbidden';

        let answerRsp: WsRequestDto = {
            connectionId: '12345',
            dto: callAnswerResponse
        };

        let answerAccept = {
            source: incInviteRequest.headers.to.uri.substring(4),
            destination: incInviteRequest.headers.from.uri.substring(4),
            callId: incInviteRequest.headers["call-id"],
            messageId: callAnswerResponse.messageId,
            action: ANSWER_ACTION
        }

        await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(answerRsp)
            .expect(HttpStatus.ACCEPTED, answerAccept);

        await sleep(200);

        expect(makeResponseMock).toHaveBeenLastCalledWith(incInviteRequest, 403, 'Forbidden');

        await sleep(300);
    })

    xit('Test Access Token', async () => { //@TODO Fix and retest - it's imported TC
        let connectionId: string = '12345678901'
        let deviceId: string = '1656494358657159' //as display in access token
        let appSid : string = "AP4434355tomer"
        registerRequest.dto.source = source //as display in access token
        registerRequest.connectionId = connectionId;
        registerRequest.dto.callId = getCallId()
        registerRequest.dto.body.deviceId = deviceId
        registerRequest.dto.body.appSid =  appSid

        let connectReq = {
            connectionId: connectionId,
            userId: registerRequest.dto.source,
            deviceId: deviceId ,
            dto: {}
        }

        await request(app.getHttpServer())
            .post(`/connect`)
            .set('Content-type', 'application/json')
            .set('Authorization', ACCESS_TOKEN)
            .send(connectReq)
            .expect(HttpStatus.CREATED)

        let registerResponse = {
            source: registerRequest.dto.source,
            destination: registerRequest.dto.destination,
            callId: registerRequest.dto.callId,
            messageId: registerRequest.dto.messageId,
            action: REGISTER_ACTION
        }

        await request(app.getHttpServer())
            .post(`/actions`)
            .set('Content-type', 'application/json')
            .send(registerRequest)
            .expect(HttpStatus.ACCEPTED, registerResponse);

        await sleep(200);

        callStartRequest.connectionId = connectionId;
        callStartRequest.dto.source = source //'972545461300@gmail.com';
        callStartRequest.dto.destination = '972545461255@gmail.com';
        callStartRequest.dto.callId = getCallId();
        callStartRequest.dto.body.sdp = 'Test Offer SDP';

        let startResponse = {
            source: callStartRequest.dto.source,
            destination: callStartRequest.dto.destination,
            callId: callStartRequest.dto.callId,
            messageId: callStartRequest.dto.messageId,
            action: START_ACTION
        }

        await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(callStartRequest)
            .expect(HttpStatus.ACCEPTED, startResponse);

        await sleep(100);

        delete process.env.SIP_CONTACT_ADDR;
        let contactUri = msgFactory.getContactUri('972545461255');
        expect(contactUri).toEqual('sip:972545461255@e2e.webrtc.gw.com' +':' + SIP_PORT);

        let outInviteRequest = {
            method: 'INVITE',
            uri: 'sip:972545461255@gmail.com',
            version: '2.0',
            headers: {
                to: {uri: 'sip:AP4434355tomer@gmail.com'}, //userAppSid set to true and getting in jwt
                from: {uri: `sip:${source}`, params: {tag: FROM_TAG}},
                'call-id': callStartRequest.dto.callId,
                'Max-Forwards': 70,
                'X-Service-Type': 'P2A',
                cseq: {method: 'INVITE', seq: 1},
                contact: [{uri: contactUri}],
                via: [],
                'User-Agent': USER_AGENT,
                'X-Called-Party-ID': 'sip:972545461255@gmail.com',
                /*RC does not pass Authorization header, we can get it from ws connect (jwt token) */
                'Content-Type': 'application/sdp',
            },
            content:
                'Test Offer SDP'
        };

        expect(sipSendMock).toHaveBeenNthCalledWith(1, outInviteRequest, expect.any(Function));

        await sleep(100);

        let disconnectReq = {
            connectionId: connectionId,
            dto: {}
        }

        await request(app.getHttpServer())
            .post(`/disconnect`)
            .set('Content-type', 'application/json')
            .send(disconnectReq)
            .expect(HttpStatus.CREATED);

        await sleep(100);

    })

    it('Test User Ring  and Answer, caller end call', async () => {

        registerRequest.connectionId = '12345';
        registerRequest.dto.callId = getCallId();
        registerRequest.dto.source = '972545461300@gmail.com';

        let registerResponse = {
            source: registerRequest.dto.source,
            destination: registerRequest.dto.destination,
            callId: registerRequest.dto.callId,
            messageId: registerRequest.dto.messageId,
            action: REGISTER_ACTION
        }

        await request(app.getHttpServer())
            .post(`/actions`)
            .set('Content-type', 'application/json')
            .send(registerRequest)
            .expect(HttpStatus.ACCEPTED, registerResponse);

        await sleep(2);

        sipServer["sipMessageHandler"]((incInviteRequest));

        expect(makeResponseMock).toHaveBeenNthCalledWith(1, incInviteRequest, 100, 'Trying');

        // Ringing
        let ringCallResponse: WsRequestDto = {
            "connectionId": "12345",
            dto: {
                "source": incInviteRequest.headers.from.uri.substring(4),
                "destination": incInviteRequest.headers.to.uri.substring(4),
                "callId": incInviteRequest.headers["call-id"],
                "messageId": "1",
                "ts": 12345,
                "type": CALL_SERVICE_TYPE,
                "body": {
                    "action": STATUS_ACTION,
                    "statusCode": "200",
                    "description": "Ringing"
                }
            }
        };

        let ringingAccept = {
            source: ringCallResponse.dto.source,
            destination: ringCallResponse.dto.destination,
            callId: ringCallResponse.dto.callId,
            messageId: ringCallResponse.dto.messageId,
            action: STATUS_ACTION
        }

        await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(ringCallResponse)
            .expect(HttpStatus.ACCEPTED, ringingAccept);

        await sleep(500);

        expect(makeResponseMock).toHaveBeenNthCalledWith(2, incInviteRequest, 180, 'Ringing');

        callAnswerResponse.destination = incInviteRequest.headers.from.uri.substring(4);
        callAnswerResponse.source = incInviteRequest.headers.to.uri.substring(4);
        callAnswerResponse.callId = incInviteRequest.headers["call-id"];
        callAnswerResponse.messageId = '1';
        callAnswerResponse.body.sdp = 'Answer SDP';

        let answerRsp: WsRequestDto = {
            connectionId: '12345',
            dto: callAnswerResponse
        };

        let answerAccept = {
            source: incInviteRequest.headers.to.uri.substring(4),
            destination: incInviteRequest.headers.from.uri.substring(4),
            callId: incInviteRequest.headers["call-id"],
            messageId: callAnswerResponse.messageId,
            action: ANSWER_ACTION
        }

        await request(app.getHttpServer())
            .post('/actions')
            .set('Accept', 'application/json')
            .send(answerRsp)
            .expect(HttpStatus.ACCEPTED, answerAccept);

        await sleep(500);

        let extension = {
            content: 'Answer SDP',
            headers: {
                'Content-Type': "application/sdp"
            }
        }

        expect(makeResponseMock).toHaveBeenNthCalledWith(3, incInviteRequest, 200, 'OK', extension);

        await sleep(300);

        sipServer["sipMessageHandler"]((incByeRequest));
        expect(makeResponseMock).toHaveBeenLastCalledWith(incByeRequest, 200, 'OK');

        await sleep(300);
    })

});
