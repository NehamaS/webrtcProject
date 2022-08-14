import {Test, TestingModule} from "@nestjs/testing";
import {DbService} from "../../../src/common/db/db.service";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {configServiceMock, loggerServiceMock} from "../../testutils/test.mock";
import {SipService} from "../../../src/callserviceapi/sip/sip.service";
import {MessageFactory} from "../../../src/callserviceapi/sip/massagefactory/message.factory";
import {RestcommDbService} from "../../../src/common/db/restcomm.db.service";
import {ClientMsgHandler} from "../../../src/client.msg.handler";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {DynamoDbService} from "../../../src/common/db/dynamo.db.service";
import {DynamoDBServiceMock} from "../../common/mocks";
import {SipUtils} from "../../../src/callserviceapi/sip/common/sip.utils";
import {ApiGwFormatDto} from "../../../src/dto/apiGwFormatDto";
import {sleep} from "../../testutils/test.utils";
import {SipSession} from "../../../src/callserviceapi/sip/common/sipSessionDTO";
import {RequestDTO, ResponseDTO} from "../../../src/callserviceapi/sip/common/sipMessageDTO";
import * as sip from "sip";
import {forwardRef, Inject} from "@nestjs/common";
import {MsmlFactory} from "../../../src/callserviceapi/sip/massagefactory/msml.factory";
import {ConferenceService} from "../../../src/callserviceapi/conference/conference.service";

let mockMsmlFactory = {

}


let mockDBSrv = {
    setUserSession: jest.fn().mockImplementation( (session: SipSession) => {
        console.log(`setUserSession, ${session.callId}, session: ${JSON.stringify(session)}`)
        console.log(`setUserSession, ${session.callId}, session: %j}`, session)

    }),
    getUserSession: jest.fn().mockImplementation((callId: string) => {
        console.log(`getUserSession, ${callId}`)
        let userSession;
        let roomSession;
        switch (callId) {
            case "test2-7777777-22222":
                userSession = {
                    callId: "test2-7777777-22222",
                    from: {"uri":"sip:test2@mavenir.com","params":{"tag":"1643197928210"}},
                    to: {"uri":"sip:user2@mavenir.com","params":{"tag":"613773"}},
                    meetingId: "556677446677",
                    roomId: "123123123",
                    userId: "77777777",
                    destContact: "sip:22222test@10.106.146.13:5060",
                    roomType: "av",
                    seqNumber: 2
                }
                console.log(`getUserSession, ${userSession}`)
                return userSession;
                break;
            case "test1@mavenir.com7777777-11111":
                userSession = {
                    callId: "test1@mavenir.com7777777-11111",
                    from: {"uri":"sip:test2@mavenir.com","params":{"tag":"1643197928210"}},
                    to: {"uri":"sip:user2@mavenir.com","params":{"tag":"613773"}},
                    meetingId: "556677446677",
                    roomId: "123123123",
                    userId: "77777777",
                    destContact: "sip:22222test@10.106.146.13:5060",
                    roomType: "av",
                    seqNumber: 2
                }
                console.log(`getUserSession, ${userSession}`)
                return userSession;
                break;
            case "556677446677_av":
                roomSession = {
                    callId: "test2-7777777-22222",
                    from: {"uri":"sip:test2@mavenir.com","params":{"tag":"1643197928210"}},
                    to: {"uri":"sip:user2@mavenir.com","params":{"tag":"613773"}},
                    meetingId: "556677446677",
                    roomType: "av",
                    roomId: "123123123",
                    destContact: "sip:22222test@10.106.146.13:5060",
                    seqNumber: 2
                }
                console.log(`getUserSession, ${roomSession}`)
                return roomSession;
                break;
            default:
                console.log(`getUserSession switch default`);
                break;
        }
    }),
    deleteUserSession: jest.fn().mockImplementation((callId: string) => {
        console.log(`deleteUserSession, ${callId}`)
    }),
    setSipRequest: jest.fn().mockImplementation((callId: string, sequence: string, request: RequestDTO) => {
        console.log(`setSipRequest, ${callId}`)
        if(callId == "inTest13848276298220188511@atlanta.example.com1122") {
            expect(sequence).toEqual("1");
            expect(request).toEqual(sipObj.inTest1);
        }
    }),
    getSipRequest: jest.fn().mockImplementation((callId: string, sequence: string) => {
        console.log(`setSipRequest, ${callId}`)
        if(callId == "inTest13848276298220188511@atlanta.example.com1122") {
            return sipObj.inTest1;
        }
    }),
    deleteSipRequest: jest.fn().mockImplementation((callId: string, sequence: string) => {
        console.log(`deleteSipRequest, ${callId}`)
    }),
    setRoomSession: jest.fn().mockImplementation((keyValue: string, session: SipSession) => {
        console.log(`setRoomSession, ${keyValue}`)
    }),
};
let params;
let mockSipService = {
    send: jest.fn().mockImplementation((sipRequest: RequestDTO, cb) => {
        console.log(`mockSipService.send:, ${JSON.stringify(sipRequest)}`);
        if(sipRequest.method !== 'ACK') {

            let response: ResponseDTO;
            switch (sipRequest.headers.from.uri) {
                case "sip:test1@mavenir.com":
                    console.log(`mockSipService: send: answer 200 OK`)
                    response = sip.makeResponse(sipRequest, 200, "OK");
                    console.log({msg: `mockSipService: send: answer 200 OK`, response: JSON.stringify(response)});
                    params = {tag: "Tag123"}
                    response.headers.to.params = params;
                    return cb(null, response);
                    break;
                case "sip:test2@mavenir.com":
                    console.log(`mockSipService: send: answer 200 OK`)
                    response = sip.makeResponse(sipRequest, 200, "OK");
                    console.log({msg: `mockSipService: send: answer 200 OK`, response: JSON.stringify(response)});
                    params = {tag: "Tag123"}
                    response.headers.to.params = params;
                    return cb(null, response);
                    break;

                default:
                    console.log(`mockSipService: send: answer 200 OK`)
                    response = sip.makeResponse(sipRequest, 200, "OK");
                    return cb(null, response);
                    break;
            }
        }
    }),
    buildAndSendResponse: jest.fn().mockImplementation((inviteRequest: RequestDTO, response: ApiGwFormatDto, cb) => {
        console.log(`mockSipService.buildAndSendResponse:, ${JSON.stringify(response)}`);

        if(response.caller == "sip:test4@atlanta.example.com") {
            expect(response.status.code).toEqual("180");
        }
        else if(response.caller == "sip:test44@atlanta.example.com") {
            expect(response.status.code).toEqual("200");
        }
        else if(response.caller == "sip:test444@atlanta.example.com") {
            expect(response.status.code).toEqual("400");
        }
        else if(response.caller == "sip:test4444@atlanta.example.com") {
            expect(response.status.code).toEqual("486");
        }

    }),
}

let mockClientMsgHandler = {
    createConferenceAck: jest.fn().mockImplementation((response: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.createConferenceAck:, ${response}`);

    }),
    connect: jest.fn().mockImplementation((response: ApiGwFormatDto) => {
        if(response.callId == "test11@mavenir.com7777777-11111") {
            console.log(`mockClientMsgHandler.connect:, ${response}`);

        }

    }),
    joinConferenceAck: jest.fn().mockImplementation((response: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.joinConferenceAck:, ${response}`);

    }),
    closeConnectionAck: jest.fn().mockImplementation((response: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.closeConnectionAck:, ${response}`);

    }),
    reject: jest.fn().mockImplementation((response: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.reject:, ${response}`);
        if(response.caller == "sip:sipError@atlanta.example.com") {

        }


    }),
    updateAck: jest.fn().mockImplementation((response: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.updateAck:, ${response}`);

    }),
    endCallAck: jest.fn().mockImplementation((response: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.endCallAck:, ${response}`);

    }),
    call: jest.fn().mockImplementation((request: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.call:, ${JSON.stringify(request)}`);

    }),
    update: jest.fn().mockImplementation((request: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.update:, ${JSON.stringify(request)}`);

    }),
    disconnect: jest.fn().mockImplementation((request: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.disconnect:, ${JSON.stringify(request)}`);

    })
}

let mockMessageFactory = {
    getRestcomServerAddress: jest.fn().mockImplementation((uri : any) => {
        return uri;
    }),
    createInvite: jest.fn().mockImplementation((apiRequestDTO: ApiGwFormatDto) => {
        console.log(`mockMessageFactory.createInvite:, ${apiRequestDTO}`);


    }),

    createRoomInvite: jest.fn().mockImplementation((apiRequestDTO: ApiGwFormatDto) => {
        console.log(`mockMessageFactory.createRoomInvite:, ${apiRequestDTO}`);

        if(apiRequestDTO.caller == dataObj.test1.caller) {
            let request: any = {"method":"INVITE","uri":"sip:test@10.106.146.13:5060","version":"2.0",
                "headers":{"to":{"uri": "sip:" + apiRequestDTO.callee},
                    "from":{"uri": "sip:" + apiRequestDTO.caller,"params":{"tag":"1643562178866"}},
                    "call-id": apiRequestDTO.callId,"cseq":{"method":"INVITE","seq":1},
                    "contact":[{"uri":"sip:webRtcGW@10.9.251.133:5060"}],
                    "x-service-type": "P2M",
                    "via":[{"params":{"branch":"z9hG4bK73928","rport":null},"host":"10.9.251.133","port":5060,"protocol":"UDP"}],
                    "Content-Type":"application/json"},
                "content": apiRequestDTO.sdp }
            return request;
        }
    }),

    createReInvite: jest.fn().mockImplementation((session: SipSession, sdp: string) => {
        console.log(`mockMessageFactory.createInvite:, ${session}`);


    }),

    createMessage: jest.fn().mockImplementation((method: string, session: SipSession,) => {
        console.log(`mockMessageFactory.createMessage:, ${method}`);
        let request: RequestDTO;


    }),
    reject: jest.fn().mockImplementation((response: ApiGwFormatDto) => {
        console.log(`mockMessageFactory.reject:, ${response}`);
    }),

    getUserPart:  jest.fn().mockImplementation((uri) => {
        let user: string = uri.split('@')[0]
        return user.includes("sip:") ? user.split(":")[1] : user
    })
}

let dataObj = {
    test1: {
        caller: "test1@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test1@mavenir.com7777777-11111",
        roomType: "av",
        service: "P2M",
        sequence: "1"
    },
    test2: {
        caller: "test2@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test1@mavenir.com7777777-11111",
        meetingId: "556677446677",
        sequence: "1",
        roomType: "av",
        service: "P2M",
        sdp: "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n",
    }
}

let sipObj = {
    inTest1: {
        "method": "INVITE", "uri": "sip:bob@biloxi.example.com", "version": "2.0",
        "headers": {
            "via": [{
                "version": "2.0",
                "protocol": "UDP",
                "host": "127.0.0.1",
                "port": 5062,
                "params": {"branch": "z9hG4bK74bf9", "received": "10.9.251.227"}
            }],
            "max-forwards": "70",
            "from": {"name": "Alice", "uri": "sip:Alice@atlanta.example.com", "params": {"tag": "9fxced76sl"}},
            "to": {"name": "Bob", "uri": "sip:Bob@atlanta.example.com", "params": {"tag": "1643724674594"}},
            "call-id": "inTest13848276298220188511@atlanta.example.com1122", "cseq": {"seq": 1, "method": "INVITE"},
            "x-meetingid": "inTest13848276298220188511@atlanta.example.com1122-7777777777",
            "x-roomid": "123123123",
            "x-service-type": "A2P",
            "content-type": "application/sdp", "content-length": 972
        },
        "content": "v=0\r\no=ccs-0-349-1 03461877975095 1575903885 IN IP4 10.1.63.13\r\ns=-\r\nc=IN IP4 10.1.63.13\r\nb=AS:80\r\nb=RS:1000\r\nb=RR:3000\r\nt=0 0\r\nm=audio 12150 RTP/AVP 111 0 112 101\r\nb=AS:80\r\nb=RS:1000\r\nb=RR:3000\r\na=ptime:20\r\na=sendrecv\r\na=msi:mavodi-0-14d-9-1-ffffffff-12dc3509-@10.1.63.13\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\na=rtpmap:0 PCMU/8000/1\r\na=rtpmap:112 AMR/8000/1\r\na=fmtp:112 octet-align=1\r\na=rtpmap:101 telephone-event/8000/1\r\na=fmtp:101 0-15\r\na=ice-ufrag:+nlh\r\na=ice-pwd:WKff96YVemit8QcF72Xhtl\r\na=ice-options:trickle\r\na=fingerprint:sha-256 D2:B9:31:8F:DF:24:D8:0E:ED:D2:EF:25:9E:AF:6F:B8:34:AE:53:9C:E6:F3:8F:F2:64:15:FA:E8:7F:53:2D:38\r\nm=video 12154 RTP/AVP 125\r\nc=IN IP4 10.1.63.13\r\na=sendrecv\r\na=rtpmap:125 H264/90000\r\na=ice-ufrag:+nlh\r\na=ice-pwd:WKff96YVemit8QcF72Xhtl\r\na=ice-options:trickle\r\na=fingerprint:sha-256 D2:B9:31:8F:DF:24:D8:0E:ED:D2:EF:25:9E:AF:6F:B8:34:AE:53:9C:E6:F3:8F:F2:64:15:FA:E8:7F:53:2D:38\r\n\r\n"
    }
}

describe('conferenceService', () => {
    let conferenceService: ConferenceService;

    beforeAll(async () => {
        const app: TestingModule = await Test.createTestingModule({
            providers: [DbService, ConferenceService, MsmlFactory, MessageFactory,
                {provide: MculoggerService, useValue: loggerServiceMock},
                {provide: SipService, useValue: mockSipService},
                //{provide: MessageFactory, useValue: mockMessageFactory},
                //{provide: MsmlFactory, useValue: mockMsmlFactory},
                {provide: RestcommDbService, useValue: mockDBSrv},
                {provide: ClientMsgHandler, useValue: mockClientMsgHandler},
                {provide: ConfigurationService, useValue: configServiceMock},
                {provide: DynamoDbService, useValue: DynamoDBServiceMock},
                {provide: SipUtils, useValue: new SipUtils() /*use real class of utils*/}
            ],
        }).compile();

        conferenceService = app.get<ConferenceService>(ConferenceService);

        function clearMocks() {
        }

        clearMocks();

    });

    afterEach(() => {
        jest.clearAllMocks();
    });


    it('ConferenceService constructions', () => {
        expect(conferenceService).toBeDefined();
    });

    it('ConferenceService: createRoom - sip response: 200', async () => {

        let obj: ApiGwFormatDto = <ApiGwFormatDto> dataObj.test1;

        console.info("************* createRoom: " + obj);
        conferenceService.createRoom(obj);

        await sleep(1000)

        expect(mockSipService.send).toHaveBeenCalledTimes(3);
        expect(mockDBSrv.setUserSession).toHaveBeenCalledTimes(1);
        expect(mockClientMsgHandler.createConferenceAck).toHaveBeenCalledTimes(1);

    });

    it('ConferenceService: make call - sip response: 200', async () => {

        let obj: ApiGwFormatDto = <ApiGwFormatDto> dataObj.test2;

        console.info("************* makeCall: " + obj);
        conferenceService.makeCall(obj);

        await sleep(1000)

        expect(mockSipService.send).toHaveBeenCalledTimes(3);
        expect(mockDBSrv.setUserSession).toHaveBeenCalledTimes(2);
        expect(mockDBSrv.getUserSession).toHaveBeenCalledTimes(1);
        expect(mockDBSrv.setSipRequest).toHaveBeenCalledTimes(1);
        expect(mockClientMsgHandler.joinConferenceAck).toHaveBeenCalledTimes(1);
        expect(mockDBSrv.deleteSipRequest).toHaveBeenCalledTimes(1);

    });

    it('ConferenceService: end call - sip response: 200', async () => {

        let obj: ApiGwFormatDto = <ApiGwFormatDto> dataObj.test2;

        console.info("************* makeCall: " + obj);
        conferenceService.endCall(obj);

        await sleep(1000)

        expect(mockSipService.send).toHaveBeenCalledTimes(2);
        expect(mockDBSrv.setUserSession).toHaveBeenCalledTimes(0);
        expect(mockDBSrv.getSipRequest).toHaveBeenCalledTimes(1);
        expect(mockClientMsgHandler.closeConnectionAck).toHaveBeenCalledTimes(1);
        expect(mockDBSrv.getUserSession).toHaveBeenCalledTimes(2);
        expect(mockDBSrv.deleteUserSession).toHaveBeenCalledTimes(1);

    });
})
