import {Test, TestingModule} from '@nestjs/testing';
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {RestcommService} from "../../../src/callserviceapi/restcomm/restcomm.service";
import {ApiGwFormatDto} from "../../../src/dto/apiGwFormatDto";
import {SipSession} from "../../../src/callserviceapi/sip/common/sipSessionDTO";
import {RequestDTO, ResponseDTO} from "../../../src/callserviceapi/sip/common/sipMessageDTO";
import {SipService} from "../../../src/callserviceapi/sip/sip.service";
import {RestcommDbService} from "../../../src/common/db/restcomm.db.service";
import {MessageFactory} from "../../../src/callserviceapi/sip/massagefactory/message.factory";
import {ClientMsgHandler} from "../../../src/client.msg.handler";
import * as sip from "sip";
import {SipUtils} from "../../../src/callserviceapi/sip/common/sip.utils";
import {configServiceMock, loggerServiceMock} from "../../testutils/test.mock";
import {sleep} from "../../testutils/test.utils";
import {DbService} from "../../../src/common/db/db.service";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {DynamoDbService} from "../../../src/common/db/dynamo.db.service";
import {DynamoDBServiceMock} from "../../common/mocks";
import {Retransmissions} from "../../../src/callserviceapi/sip/massagefactory/retransmissions";

const crypto = require('crypto');

let extension = {
    content: "",
    headers: {
        'Content-Type' : "application/sdp"
    }
};

let utils: SipUtils = new SipUtils()

const buildCaller = (rUri, toUri ): string => { //return the user part from RURI and Domain from to uri header
    let reqUri: string = getUserPart(rUri)
    let toDomain: string = toUri.includes("@") ? toUri.split("@")[1] : utils.getDomain(toUri)
    return `${reqUri}@${toDomain}`
}

const getUserPart = (uri: string): string => {
    let user: string = uri.split('@')[0]
    return user.includes("sip:") ? user.split(":")[1] : user
}

let mockDBSrv = {
    setUserSession: jest.fn().mockImplementation( (session: SipSession) => {
        console.log(`setUserSession, ${session.callId}, session: ${JSON.stringify(session)}`)
        console.log(`setUserSession, ${session.callId}, session: %j}`, session)
        if(session.callId == "test11@mavenir.com7777777-11111"){
            expect(session.callId).toEqual(dataObj.test11.callId);
            expect(session.from.uri).toEqual("sip:" + dataObj.test11.caller);
            expect(session.to.uri).toEqual("sip:" + dataObj.test11.callee);
            expect(session.seqNumber).toEqual(1);
        }
        else if(session.callId == "inTest13848276298220188511@atlanta.example.com1122") {
            expect(session.callId).toEqual(sipObj.inTest1.headers['call-id']);
            expect(session.from).toEqual(sipObj.inTest1.headers.to);
            expect(session.to).toEqual(sipObj.inTest1.headers.from);
            expect(session.seqNumber).toEqual(0);
            expect(session.meetingId).toEqual(sipObj.inTest1.headers["x-meetingid"]);
            expect(session.seqNumber).toEqual(sipObj.inTest1.headers["x-service-type"]);
        }
    }),
    getUserSession: jest.fn().mockImplementation((callId: string) => {
        console.log(`getUserSession, ${callId}`)
        let userSession;
        switch (callId) {
            case "test2-7777777-22222":
                userSession = {
                    callId: "test2-7777777-22222",
                    from: {"uri":"sip:test2@mavenir.com","params":{"tag":"1643197928210"}},
                    to: {"uri":"sip:user2@mavenir.com","params":{"tag":"613773"}},
                    destContact: "sip:22222test@10.106.146.13:5060",
                    seqNumber: 2
                }
                console.log(`getUserSession, ${userSession}`)
                return userSession;
                break;
            case "test222-7777777-22222":
                userSession = {
                    callId: "test222-7777777-22222",
                    from: {"uri":"sip:test222@mavenir.com","params":{"tag":"1643197928210"}},
                    to: {"uri":"sip:user2@mavenir.com","params":{"tag":"613773"}},
                    destContact: "sip:22222test@10.106.146.13:5060",
                    seqNumber: 2
                }
                console.log(`getUserSession, ${userSession}`)
                return userSession;
                break;
            case "test3-7777777-22222":
                 userSession = {
                    callId: "test3-7777777-22222",
                    from: {"uri":"sip:test3@mavenir.com","params":{"tag":"1643197928210"}},
                    to: {"uri":"sip:user2@mavenir.com","params":{"tag":"613773"}},
                    destContact: "sip:22222test@10.106.146.13:5060",
                    seqNumber: 2
                }
                console.log(`getUserSession, ${userSession}`)
                return userSession;
                break;
            case "test33-7777777-22222":
                userSession = {
                    callId: "test33-7777777-22222",
                    from: {"uri":"sip:test33@mavenir.com","params":{"tag":"1643197928210"}},
                    to: {"uri":"sip:user2@mavenir.com","params":{"tag":"613773"}},
                    destContact: "sip:22222test@10.106.146.13:5060",
                    seqNumber: 2
                }
                console.log(`getUserSession, ${userSession}`)
                return userSession;
                break;
            case "test22@mavenir.com":
            case "test333@mavenir.com":
                return null;
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
        else if(callId == "inTest23848276298220188511@atlanta.example.com1122") {
            expect(sequence).toEqual("2");
            expect(request).toEqual(sipObj.inTest2);
        }
        else if(callId == "inTest33848276298220188511@atlanta.example.com1122") {
            expect(sequence).toEqual("3");
            expect(request).toEqual(sipObj.inTest3);
        }
        else if(callId == "inTest33848276298220188511@atlanta.example.com112277") {
            expect(sequence).toEqual("1");
        }
    }),
    getSipRequest: jest.fn().mockImplementation((callId: string, sequence: string) => {
        console.log(`setSipRequest, ${callId}`)
        if(callId == "inTest13848276298220188511@atlanta.example.com1122") {
            return sipObj.inTest1;
        }
        else if(callId == "inTest23848276298220188511@atlanta.example.com1122") {
            return sipObj.inTest2;
        }
        else if(callId == "inTest33848276298220188511@atlanta.example.com1122") {
            return sipObj.inTest3;
        }
        else if(callId == "error-inTest13848276298220188511@atlanta.example.com1122") {
            return null
        }
        else if(callId == "error-inTest23848276298220188511@atlanta.example.com1122") {
            return null;
        }
        else if(callId == "error-inTest33848276298220188511@atlanta.example.com1122") {
            return null;
        }
    }),
    deleteSipRequest: jest.fn().mockImplementation((callId: string, sequence: string) => {
        console.log(`deleteSipRequest, ${callId}`)
    }),
};

let mockSipService = {
    send: jest.fn().mockImplementation((sipRequest: RequestDTO, cb) => {
        console.log(`mockSipService.send:, ${JSON.stringify(sipRequest)}`);
        if(sipRequest.method !== 'ACK') {

            let response: ResponseDTO;
            switch (sipRequest.headers.from.uri) {
                case "sip:test1@mavenir.com":
                    extension.content = dataObj.sdpAnswer1;
                    response = sip.makeResponse(sipRequest, 200, "OK", extension);
                    response.headers.contact = [{uri: "sip:22222test@10.106.146.13:5060"}];
                    return cb(null, response);
                    break;
                case "sip:testMeetingId@mavenir.com":
                    extension.content = dataObj.sdpAnswer1;
                    response = sip.makeResponse(sipRequest, 200, "OK", extension);
                    response.headers.contact = [{uri: "sip:22222test@10.106.146.13:5060"}];
                    expect(sipRequest.headers["X-MeetingId"]).toEqual(dataObj.testMeetingId.meetingId);
                    expect(sipRequest.headers["X-Service-Type"]).toEqual(dataObj.testMeetingId.service);
                    return cb(null, response);
                    break;
                case "sip:test11@mavenir.com":
                    response = sip.makeResponse(sipRequest, 180, "Ringing");
                    response.headers.contact = [{uri: "sip:22222test@10.106.146.13:5060"}];
                    cb(null, response);
                    extension.content = dataObj.sdpAnswer1;
                    response = sip.makeResponse(sipRequest, 200, "OK", extension);
                    response.headers.contact = [{uri: "sip:22222test@10.106.146.13:5060"}];
                    return cb(null, response);
                    break;
                case "sip:test111@mavenir.com":
                    response = sip.makeResponse(sipRequest, 500, "Server Internal Error");
                    response.headers.contact = [{uri: "sip:22222test@10.106.146.13:5060"}];
                    return cb(null, response);
                    break;
                case "sip:test2@mavenir.com":
                    extension.content = dataObj.sdpAnswer2;
                    response = sip.makeResponse(sipRequest, 200, "OK", extension);
                    return cb(null, response);
                    break;
                case "sip:test222@mavenir.com":
                    response = sip.makeResponse(sipRequest, 400, "Bad Request");
                    return cb(null, response);
                    break;
                case "sip:test3@mavenir.com":
                    response = sip.makeResponse(sipRequest, 200, "OK");
                    return cb(null, response);
                    break;
                case "sip:test33@mavenir.com":
                    response = sip.makeResponse(sipRequest, 404, "Not Found");
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
    ring: jest.fn().mockImplementation((response: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.ring:, ${response}`);
        expect(response.caller).toEqual(dataObj.test11.caller);
        expect(response.callee).toEqual(dataObj.test11.callee);
        expect(response.callId).toEqual(dataObj.test11.callId);
        expect(response.sequence).toEqual("1");
        expect(response.accessToken).toEqual(dataObj.test11.accessToken);
        expect(response.status.code).toEqual("180");
        expect(response.status.desc).toEqual("Ringing");
    }),
    connect: jest.fn().mockImplementation((response: ApiGwFormatDto) => {
        if(response.callId == "test11@mavenir.com7777777-11111") {
            console.log(`mockClientMsgHandler.connect:, ${response}`);
            expect(response.caller).toEqual(dataObj.test11.caller);
            expect(response.callee).toEqual(dataObj.test11.callee);
            expect(response.callId).toEqual(dataObj.test11.callId);
            expect(response.sequence).toEqual("1");
            expect(response.accessToken).toEqual(dataObj.test11.accessToken);
            expect(response.sdp).toEqual(dataObj.sdpAnswer1);
            expect(response.status.code).toEqual("200");
            expect(response.status.desc).toEqual("OK");
        }
        else if (response.callId == "test1@mavenir.com7777777-11111") {
            console.log(`mockClientMsgHandler.connect:, ${response}`);
            console.log(`mockClientMsgHandler.connect1111:, ${response}`);
            expect(response.caller).toEqual(dataObj.test1.caller);
            expect(response.callee).toEqual(dataObj.test1.callee);
            expect(response.callId).toEqual(dataObj.test1.callId);
            expect(response.sequence).toEqual("1");
            expect(response.accessToken).toEqual(dataObj.test1.accessToken);
            expect(response.sdp).toEqual(dataObj.sdpAnswer1);
            expect(response.status.code).toEqual("200");
            expect(response.status.desc).toEqual("OK");
        }
    }),
    reject: jest.fn().mockImplementation((response: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.reject:, ${response}`);
        if(response.caller == "sip:sipError@atlanta.example.com") {
            expect(response.caller).toEqual(dataObj.testSipError.caller);
            expect(response.callId).toEqual(dataObj.testSipError.callId);
            expect(response.callee).toEqual(dataObj.testSipError.callee);
            expect(response.sequence).toEqual("2");
        }
        else {
            expect(response.caller).toEqual(dataObj.test111.caller);
            expect(response.callId).toEqual(dataObj.test111.callId);
            expect(response.callee).toEqual(dataObj.test111.callee);
            expect(response.sequence).toEqual("1");
            expect(response.accessToken).toEqual(dataObj.test1.accessToken);
        }
        expect(response.status.code).toEqual("500");
        expect(response.status.desc).toEqual("Server Internal Error");
    }),
    updateAck: jest.fn().mockImplementation((response: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.updateAck:, ${response}`);
        if(response.caller == "test2@mavenir.com") {
            expect(response.caller).toEqual(dataObj.test2.caller);
            expect(response.callee).toEqual(dataObj.test2.callee);
            expect(response.callId).toEqual(dataObj.test2.callId);
            expect(response.sequence).toEqual("2");
            expect(response.accessToken).toEqual(dataObj.test2.accessToken);
            expect(response.sdp).toEqual(dataObj.sdpAnswer2);
            expect(response.status.code).toEqual("200");
            expect(response.status.desc).toEqual("OK");
        }
        else if(response.caller == "test222@mavenir.com"){
            expect(response.caller).toEqual(dataObj.test222.caller);
            expect(response.callee).toEqual(dataObj.test222.callee);
            expect(response.callId).toEqual(dataObj.test222.callId);
            expect(response.sequence).toEqual("2");
            expect(response.accessToken).toEqual(dataObj.test222.accessToken);
            expect(response.status.code).toEqual("400");
            expect(response.status.desc).toEqual("Bad Request");
        }
    }),
    endCallAck: jest.fn().mockImplementation((response: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.endCallAck:, ${response}`);
        if(response.caller == "test3@mavenir.com") {
            expect(response.caller).toEqual(dataObj.test3.caller);
            expect(response.callee).toEqual(dataObj.test3.callee);
            expect(response.callId).toEqual(dataObj.test3.callId);
            expect(response.sequence).toEqual("2");
            expect(response.accessToken).toEqual(dataObj.test3.accessToken);
            expect(response.status.code).toEqual("200");
            expect(response.status.desc).toEqual("OK");
        }
        else if(response.caller == "test33@mavenir.com"){
            expect(response.caller).toEqual(dataObj.test33.caller);
            expect(response.callee).toEqual(dataObj.test33.callee);
            expect(response.callId).toEqual(dataObj.test33.callId);
            expect(response.sequence).toEqual("2");
            expect(response.accessToken).toEqual(dataObj.test33.accessToken);
            expect(response.status.code).toEqual("404");
            expect(response.status.desc).toEqual("Not Found");
        }
    }),
    call: jest.fn().mockImplementation((request: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.call:, ${JSON.stringify(request)}`);
        expect(request.caller).toEqual(sipObj.inTest1.headers.from.uri.split("sip:")[1]);
        expect(request.callee).toEqual(sipObj.inTest1.headers.to.uri.split("sip:")[1]);
        expect(request.callId).toEqual(sipObj.inTest1.headers['call-id']);
        expect(request.meetingId).toEqual(sipObj.inTest1.headers["x-meetingid"]);
        expect(request.service).toEqual(sipObj.inTest1.headers["x-service-type"]);
        expect(request.sequence).toEqual("1");
        expect(request.sdp).toEqual(sipObj.inTest2.content);
    }),
    update: jest.fn().mockImplementation((request: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.update:, ${JSON.stringify(request)}`);
        expect(request.caller).toEqual(sipObj.inTest2.headers.from.uri.split("sip:")[1]);
        expect(request.callee).toEqual(sipObj.inTest2.headers.to.uri.split("sip:")[1]);
        expect(request.callId).toEqual(sipObj.inTest2.headers['call-id']);
        expect(request.sequence).toEqual("2");
        expect(request.sdp).toEqual(sipObj.inTest2.content);
    }),
    disconnect: jest.fn().mockImplementation((request: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.disconnect:, ${JSON.stringify(request)}`);
        if(request.caller == "sip:test444errCall@atlanta.example.com") {
            expect(request.caller).toEqual(dataObj.test444errCall.caller);
            expect(request.callee).toEqual(dataObj.test444errCall.callee);
            expect(request.callId).toEqual(dataObj.test444errCall.callId);
            expect(request.sequence).toEqual("3");
            expect(request.status.code).toEqual("500");
            expect(request.status.desc).toEqual("Failed to get Sip Request from DB");
        }else {
            // expect(request.caller).toEqual(sipObj.inTest3.headers.from.uri.split("sip:")[1]);
            expect(request.caller).toEqual(buildCaller(sipObj.inTest3.uri, sipObj.inTest3.headers.from.uri))
            expect(request.callee).toEqual(sipObj.inTest3.headers.to.uri.split("sip:")[1]);
            expect(request.callId).toEqual(sipObj.inTest3.headers['call-id']);
            expect(request.sequence).toEqual("3");
        }
    }),

}

let mockMessageFactory = {
    getRestcomServerAddress: jest.fn().mockImplementation((uri : any) => {
     return uri;
    }),
    createInvite: jest.fn().mockImplementation((apiRequestDTO: ApiGwFormatDto) => {
        console.log(`mockMessageFactory.createInvite:, ${apiRequestDTO}`);

        if(apiRequestDTO.caller == dataObj.testSipError.caller) {
            let request: any = {"method":"INVITE","uri":"sip:test@10.106.146.13:5060","version":"2.0",
                "headers":{//"to":{"uri": "sip:" + apiRequestDTO.callee},
                    "from":{"uri": "sip:" + apiRequestDTO.caller,"params":{"tag":"1643562178866"}},
                    "call-id": apiRequestDTO.callId,"cseq":{"method":"INVITE","seq":1},
                    "contact":[{"uri":"sip:webRtcGW@10.9.251.133:5060"}],
                    "Authorization": apiRequestDTO.accessToken,
                    "via":[{"params":{"branch":"z9hG4bK73928","rport":null},"host":"10.9.251.133","port":5060,"protocol":"UDP"}],
                    "Content-Type":"application/json"},
                "content": apiRequestDTO.sdp }
            return request;
        }

        let request: RequestDTO = {"method":"INVITE","uri":"sip:test@10.106.146.13:5060","version":"2.0",
            "headers":{"to":{"uri": "sip:" + apiRequestDTO.callee},
                "from":{"uri": "sip:" + apiRequestDTO.caller,"params":{"tag":"1643562178866"}},
                "call-id": apiRequestDTO.callId,"cseq":{"method":"INVITE","seq":1},
                "contact":[{"uri":"sip:webRtcGW@10.9.251.133:5060"}],
                "authorization": apiRequestDTO.accessToken,
                "via":[{"params":{"branch":"z9hG4bK73928","rport":null},"host":"10.9.251.133","port":5060,"protocol":"UDP"}],
                "content-type":"application/json"},
            "content": apiRequestDTO.sdp }
        return request;
    }),

    createReInvite: jest.fn().mockImplementation((session: SipSession, sdp: string) => {
        console.log(`mockMessageFactory.createInvite:, ${session}`);

        let request: RequestDTO = {"method":"INVITE","uri":session.destContact,"version":"2.0",
            "headers":{"to":session.to,
                "from":session.from,
                "call-id":session.callId,"cseq":{"method":"INVITE","seq":session.seqNumber},
                "contact":[{"uri":"sip:webRtcGW@10.9.251.133:5060"}],
                "via":[{"params":{"branch":"z9hG4bK73928","rport":null},"host":"10.9.251.133","port":5060,"protocol":"UDP"}],
                "content-type":"application/json"},
            "content": sdp }
        return request;

    }),

    createMessage: jest.fn().mockImplementation((method: string, session: SipSession,) => {
        console.log(`mockMessageFactory.createMessage:, ${method}`);
        let request: RequestDTO;

        if(method == "ACK") {
            request = {"method":"ACK","uri":session.destContact,"version":"2.0",
                "headers":{"to":session.to,
                    "from":session.from,
                    "call-id":session.callId,"cseq":{"method":"ACK","seq":session.seqNumber},
                    "contact":[{"uri":"sip:webRtcGW@10.9.251.133:5060"}],
                    "via":[{"params":{"branch":"z9hG4bK575412","rport":null},"host":"10.9.251.133","port":5060,"protocol":"UDP"}]}};

        }
        else if(method == "BYE") {
            request = {"method":"BYE","uri":session.destContact,"version":"2.0",
                "headers":{"to":session.to,
                    "from":session.from,
                    "call-id":session.callId,"cseq":{"method":"BYE","seq":session.seqNumber},
                    "contact":[{"uri":"sip:webRtcGW@10.9.251.133:5060"}],
                    "via":[{"params":{"branch":"z9hG4bK370209","rport":null},"host":"10.9.251.133","port":5060,"protocol":"UDP"}]}};

        }
        return request;
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
    test1 : {
        caller: "test1@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test1@mavenir.com7777777-11111",
        accessToken: "token-111",
        sequence: "1",
        sdp: "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n",
    },
    testMeetingId : {
        caller: "sip:testMeetingId@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test1@mavenir.com7777777-11111456",
        accessToken: "token-111",
        sequence: "1",
        meetingId: "test1@mavenir.com77777772222",
        service: "P2P",
        sdp: "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n",
    },
    test11 : {
        caller: "test11@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test11@mavenir.com7777777-11111",
        accessToken: "token-111",
        sequence: "1",
        sdp: "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n",
    },
    test111 : {
        caller: "test111@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "7777777-11111",
        accessToken: "token-111",
        sequence: "1",
        sdp: "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n",
    },
    sdpAnswer1: "v=0\\r\\no=- 14305329 14305329 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\\r\\ns=- c=IN IP4 10.174.20.152\\r\\nt=0 0\\r\\na=sendrecv\\r\\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\\r\\nc=IN IP4 10.174.20.152\\r\\na=rtpmap:96 AMR-WB/16000\\r\\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\\r\\na=rtpmap:97 AMR/8000\\r\\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\\r\\na=rtpmap:98 AMR/8000\\r\\na=fmtp:98 mode-set=7;max-red=0\\r\\na=rtpmap:0 PCMU/8000\\r\\na=rtpmap:99 telephone-event/16000\\r\\na=fmtp:99 0-15\\r\\na=rtpmap:100 telephone-event/8000\\r\\na=fmtp:100 0-15\\r\\na=maxptime:40\\r\\na=rtpmap:111 opus/48000/2\\r\\na=rtcp-fb:111 transport-cc\\r\\na=fmtp:111 minptime=10;useinbandfec=1\\r\\n\\r\\n",
    test2: {
        caller: "test2@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test2-7777777-22222",
        accessToken: "token-222",
        sequence: "2",
        sdp: "v=0\r\no=- 14305330 14305330 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n"
    },
    sdpAnswer2: "v=0\r\no=- 14305331 14305331 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n",
    test22: {
        caller: "test22@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test22-7777777-22222",
        accessToken: "token-222",
        sequence: "2",
        sdp: "v=0\r\no=- 14305332 14305332 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n"
    },
    test222: {
        caller: "test222@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test222-7777777-22222",
        accessToken: "token-222",
        sequence: "2",
        sdp: "v=0\r\no=- 14305332 14305332 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n"
    },
    test3: {
        caller: "test3@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test3-7777777-22222",
        accessToken: "token-222",
        sequence: "2",
    },
    test33: {
        caller: "test33@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test33-7777777-22222",
        accessToken: "token-222",
        sequence: "2",
    },
    test333: {
        caller: "test333@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test333-7777777-22222",
        accessToken: "token-222",
        sequence: "2",
    },
    test4: {
        caller: "sip:test4@atlanta.example.com",
        callee: "sip:inTest1@atlanta.example.com",
        callId: "inTest13848276298220188511@atlanta.example.com1122",
       //accessToken: "token-444",
        sequence: "1",
        status: {
            code: "180",
            desc: "Ringing"
        }
    },
    test4err: {
        caller: "sip:test4@atlanta.example.com",
        callee: "sip:inTest1@atlanta.example.com",
        callId: "error-inTest13848276298220188511@atlanta.example.com1122",
        //accessToken: "token-444",
        sequence: "1",
        status: {
            code: "180",
            desc: "Ringing"
        }
    },
    test44: {
        caller: "sip:test44@atlanta.example.com",
        callee: "sip:inTest1@atlanta.example.com",
        callId: "inTest13848276298220188511@atlanta.example.com1122",
        //accessToken: "token-444",
        sequence: "1",
        status: {
            code: "200",
            desc: "Ringing"
        }
    },
    test44err: {
        caller: "sip:test44@atlanta.example.com",
        callee: "sip:inTest1@atlanta.example.com",
        callId: "error-inTest13848276298220188511@atlanta.example.com1122",
        //accessToken: "token-444",
        sequence: "1",
        status: {
            code: "200",
            desc: "Ringing"
        }
    },
    test444: {
        caller: "sip:test444@atlanta.example.com",
        callee: "sip:inTest1@atlanta.example.com",
        callId: "inTest13848276298220188511@atlanta.example.com1122",
        //accessToken: "token-444",
        sequence: "1",
        status: {
            code: "400",
            desc: "Ringing"
        }
    },
    test444err: {
        caller: "sip:test444@atlanta.example.com",
        callee: "sip:inTest1@atlanta.example.com",
        callId: "error-inTest13848276298220188511@atlanta.example.com1122",
        //accessToken: "token-444",
        sequence: "1",
        status: {
            code: "400",
            desc: "Ringing"
        }
    },
    test444errCall: {
        caller: "sip:test444errCall@atlanta.example.com",
        callee: "sip:inTest1@atlanta.example.com",
        callId: "error-inTest13848276298220188511@atlanta.example.com1122",
        //accessToken: "token-444",
        sequence: "3",
        method: <const> "call",
        status: {
            code: "200",
            desc: "OK"
        }
    },
    test444errUpdate: {
        caller: "sip:test444@atlanta.example.com",
        callee: "sip:inTest1@atlanta.example.com",
        callId: "error-inTest13848276298220188511@atlanta.example.com1122",
        //accessToken: "token-444",
        sequence: "1",
        method: <const> "update",
        status: {
            code: "200",
            desc: "OK"
        }
    },
    test4444: {
        caller: "sip:test4444@atlanta.example.com",
        callee: "sip:inTest1@atlanta.example.com",
        callId: "inTest13848276298220188511@atlanta.example.com1122",
        //accessToken: "token-444",
        sequence: "1",
        status: {
            code: "486",
            desc: "Ringing"
        }
    },
    test5: {
        caller: "sip:test5@atlanta.example.com",
        callee: "sip:inTest1@atlanta.example.com",
        callId: "inTest33848276298220188511@atlanta.example.com1122",
        //accessToken: "token-444",
        sequence: "2",
        status: {
            code: "200",
            desc: "Ok"
        }
    },
    testSipError: {
        caller: "sip:sipError@atlanta.example.com",
        callee: "sip:inTest1@atlanta.example.com",
        callId: "inTest33848276298220188511@atlanta.example.com112277",
        //accessToken: "token-444",
        sequence: "2",
        status: {
            code: "200",
            desc: "Ok"
        }
    }
}

let sipObj = {
    inTest1: {"method":"INVITE","uri":"sip:bob@biloxi.example.com","version":"2.0",
        "headers":{"via":[{"version":"2.0","protocol":"UDP","host":"127.0.0.1","port":5062,"params":{"branch":"z9hG4bK74bf9","received":"10.9.251.227"}}],
            "max-forwards":"70",
            "from":{"name":"Alice","uri":"sip:Alice@atlanta.example.com","params":{"tag":"9fxced76sl"}},
            "to":{"name":"Bob","uri":"sip:Bob@atlanta.example.com","params":{"tag":"1643724674594"}},
            "call-id":"inTest13848276298220188511@atlanta.example.com1122","cseq":{"seq":1,"method":"INVITE"},
            "x-meetingid": "inTest13848276298220188511@atlanta.example.com1122-7777777777",
            "x-service-type": "A2P",
            "content-type":"application/sdp","content-length":972},
            "content":"v=0\r\no=ccs-0-349-1 03461877975095 1575903885 IN IP4 10.1.63.13\r\ns=-\r\nc=IN IP4 10.1.63.13\r\nb=AS:80\r\nb=RS:1000\r\nb=RR:3000\r\nt=0 0\r\nm=audio 12150 RTP/AVP 111 0 112 101\r\nb=AS:80\r\nb=RS:1000\r\nb=RR:3000\r\na=ptime:20\r\na=sendrecv\r\na=msi:mavodi-0-14d-9-1-ffffffff-12dc3509-@10.1.63.13\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\na=rtpmap:0 PCMU/8000/1\r\na=rtpmap:112 AMR/8000/1\r\na=fmtp:112 octet-align=1\r\na=rtpmap:101 telephone-event/8000/1\r\na=fmtp:101 0-15\r\na=ice-ufrag:+nlh\r\na=ice-pwd:WKff96YVemit8QcF72Xhtl\r\na=ice-options:trickle\r\na=fingerprint:sha-256 D2:B9:31:8F:DF:24:D8:0E:ED:D2:EF:25:9E:AF:6F:B8:34:AE:53:9C:E6:F3:8F:F2:64:15:FA:E8:7F:53:2D:38\r\nm=video 12154 RTP/AVP 125\r\nc=IN IP4 10.1.63.13\r\na=sendrecv\r\na=rtpmap:125 H264/90000\r\na=ice-ufrag:+nlh\r\na=ice-pwd:WKff96YVemit8QcF72Xhtl\r\na=ice-options:trickle\r\na=fingerprint:sha-256 D2:B9:31:8F:DF:24:D8:0E:ED:D2:EF:25:9E:AF:6F:B8:34:AE:53:9C:E6:F3:8F:F2:64:15:FA:E8:7F:53:2D:38\r\n\r\n"
    },

    inTest2 : {"method":"INVITE","uri":"sip:bob@biloxi.example.com","version":"2.0",
        "headers":{"via":[{"version":"2.0","protocol":"UDP","host":"127.0.0.1","port":5062,"params":{"branch":"z9hG4bK74bf9","received":"10.9.251.227"}}],
            "max-forwards":"70","from":{"name":"Alice","uri":"sip:alice@atlanta.example.com","params":{"tag":"9fxced76sl"}},
            "to":{"name":"Bob","uri":"sip:bob@biloxi.example.com","params":{"tag":"234234234234"}},
            "call-id":"inTest23848276298220188511@atlanta.example.com1122","cseq":{"seq":2,"method":"INVITE"},
            "content-type":"application/sdp","content-length":972},
            "content":"v=0\r\no=ccs-0-349-1 03461877975095 1575903885 IN IP4 10.1.63.13\r\ns=-\r\nc=IN IP4 10.1.63.13\r\nb=AS:80\r\nb=RS:1000\r\nb=RR:3000\r\nt=0 0\r\nm=audio 12150 RTP/AVP 111 0 112 101\r\nb=AS:80\r\nb=RS:1000\r\nb=RR:3000\r\na=ptime:20\r\na=sendrecv\r\na=msi:mavodi-0-14d-9-1-ffffffff-12dc3509-@10.1.63.13\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\na=rtpmap:0 PCMU/8000/1\r\na=rtpmap:112 AMR/8000/1\r\na=fmtp:112 octet-align=1\r\na=rtpmap:101 telephone-event/8000/1\r\na=fmtp:101 0-15\r\na=ice-ufrag:+nlh\r\na=ice-pwd:WKff96YVemit8QcF72Xhtl\r\na=ice-options:trickle\r\na=fingerprint:sha-256 D2:B9:31:8F:DF:24:D8:0E:ED:D2:EF:25:9E:AF:6F:B8:34:AE:53:9C:E6:F3:8F:F2:64:15:FA:E8:7F:53:2D:38\r\nm=video 12154 RTP/AVP 125\r\nc=IN IP4 10.1.63.13\r\na=sendrecv\r\na=rtpmap:125 H264/90000\r\na=ice-ufrag:+nlh\r\na=ice-pwd:WKff96YVemit8QcF72Xhtl\r\na=ice-options:trickle\r\na=fingerprint:sha-256 D2:B9:31:8F:DF:24:D8:0E:ED:D2:EF:25:9E:AF:6F:B8:34:AE:53:9C:E6:F3:8F:F2:64:15:FA:E8:7F:53:2D:38\r\n\r\n"
    },

    inTest3 : {"method":"BYE","uri":"sip:bob@biloxi.example.com","version":"2.0",
        "headers":{"via":[{"version":"2.0","protocol":"UDP","host":"127.0.0.1","port":5062,"params":{"branch":"z9hG4bK74bf9","received":"10.9.251.227"}}],
            "max-forwards":"70","from":{"name":"Bob","uri":"sip:appSid@atlanta.example.com","params":{"tag":"9fxced76sl"}},
            "to":{"name":"Alice","uri":"sip:alice@biloxi.example.com","params":{"tag":"234234234234"}},
            "call-id":"inTest33848276298220188511@atlanta.example.com1122","cseq":{"seq":3,"method":"BYE"}},
            "content":""}

}

describe('restComService', () => {
    let restcommService: RestcommService;


    beforeAll(async () => {
        const app: TestingModule = await Test.createTestingModule({
            providers: [RestcommService, DbService,
                {provide: MculoggerService, useValue: loggerServiceMock},
                {provide: SipService, useValue: mockSipService},
                {provide: MessageFactory, useValue: mockMessageFactory},
                {provide: RestcommDbService, useValue: mockDBSrv},
                {provide: ClientMsgHandler, useValue: mockClientMsgHandler},
                {provide: ConfigurationService, useValue: configServiceMock},
                {provide: DynamoDbService, useValue: DynamoDBServiceMock},
                {provide: SipUtils, useValue : new SipUtils() /*use real class of utils*/}
            ],
        }).compile();

        restcommService = app.get<RestcommService>(RestcommService);

        function clearMocks() {
        }

        clearMocks();

    });

    afterEach(() => {
        jest.clearAllMocks();
    });


    it('RestComService constructions', () => {
        expect(restcommService).toBeDefined();
    });

    it('RestComService: make call - sip response: 200', async() => {

        let obj: ApiGwFormatDto = dataObj.test1;

        console.info("************* makeCall: " + obj);
        restcommService.makeCall(obj);

        await sleep(1000)

        expect(mockSipService.send).toHaveBeenCalledTimes(2);
        expect(mockDBSrv.setUserSession).toHaveBeenCalledTimes(2);
        expect(mockClientMsgHandler.connect).toHaveBeenCalledTimes(1);

    });

    it('RestComService: make call - meetingId and service-type', async() => {

        let obj: ApiGwFormatDto = <ApiGwFormatDto> dataObj.testMeetingId;

        console.info("************* makeCall: " + obj);
        restcommService.makeCall(obj);

        await sleep(1000)

        expect(mockSipService.send).toHaveBeenCalledTimes(2);
        expect(mockDBSrv.setUserSession).toHaveBeenCalledTimes(2);
        expect(mockClientMsgHandler.connect).toHaveBeenCalledTimes(1);

    });

    it('RestComService: make call - sip response: 180 and 200', async() => {

        let obj: ApiGwFormatDto = dataObj.test11;

        console.info("************* makeCall: " + obj);
        restcommService.makeCall(obj);

        await sleep(1000)

        expect(mockSipService.send).toHaveBeenCalledTimes(2);
        expect(mockDBSrv.setUserSession).toHaveBeenCalledTimes(2);
        expect(mockClientMsgHandler.ring).toHaveBeenCalledTimes(1);
        expect(mockClientMsgHandler.connect).toHaveBeenCalledTimes(1);

    });

    it('RestComService: make call - sip response: 500', async() => {

        let obj: ApiGwFormatDto = dataObj.test111;

        console.info("************* makeCall: " + obj);
        restcommService.makeCall(obj);

        await sleep(1000)

        expect(mockSipService.send).toHaveBeenCalledTimes(1);
        expect(mockDBSrv.setUserSession).toHaveBeenCalledTimes(1);
        expect(mockClientMsgHandler.reject).toHaveBeenCalledTimes(1);

    });

    it('RestComService: updateCall  - 200 OK', async() => {

        let obj: ApiGwFormatDto =dataObj.test2;

        console.info("************* updateCall: " + obj);
        await restcommService.updateCall(obj);

        expect(mockSipService.send).toHaveBeenCalledTimes(2);
        expect(mockDBSrv.setUserSession).toHaveBeenCalledTimes(1);
        expect(mockDBSrv.getUserSession).toHaveBeenCalledTimes(1);
        expect(mockClientMsgHandler.updateAck).toHaveBeenCalledTimes(1);

    });

    it('RestComService: updateCall: error - no userSession in DB', async() => {

        let obj: ApiGwFormatDto = dataObj.test22;

        console.info("************* makeCall: " + obj);
        await restcommService.updateCall(obj);

        expect(mockSipService.send).toHaveBeenCalledTimes(0);
        expect(mockDBSrv.setUserSession).toHaveBeenCalledTimes(0);
        expect(mockDBSrv.getUserSession).toHaveBeenCalledTimes(1);
        expect(mockClientMsgHandler.updateAck).toHaveBeenCalledTimes(1);

    });


    it('RestComService: updateCall  - reject', async() => {

        let obj: ApiGwFormatDto =dataObj.test222;

        console.info("************* updateCall: " + obj);
        await restcommService.updateCall(obj);

        expect(mockSipService.send).toHaveBeenCalledTimes(1);
        expect(mockDBSrv.setUserSession).toHaveBeenCalledTimes(1);
        expect(mockDBSrv.getUserSession).toHaveBeenCalledTimes(1);
        expect(mockClientMsgHandler.updateAck).toHaveBeenCalledTimes(1);

    });

    it('RestComService: endCall - 200 OK', async() => {

        let obj: ApiGwFormatDto =dataObj.test3

        console.info("************* endCall: " + obj);
        await restcommService.endCall(obj);

        expect(mockSipService.send).toHaveBeenCalledTimes(1);
        expect(mockDBSrv.getUserSession).toHaveBeenCalledTimes(1);
        expect(mockDBSrv.deleteUserSession).toHaveBeenCalledTimes(1);
        expect(mockClientMsgHandler.endCallAck).toHaveBeenCalledTimes(1);

    });

    it('RestComService: endCall - reject', async() => {

        let obj: ApiGwFormatDto =dataObj.test33

        console.info("************* endCall: " + obj);
        await restcommService.endCall(obj);

        expect(mockSipService.send).toHaveBeenCalledTimes(1);
        expect(mockDBSrv.getUserSession).toHaveBeenCalledTimes(1);
        expect(mockDBSrv.deleteUserSession).toHaveBeenCalledTimes(1);
        expect(mockClientMsgHandler.endCallAck).toHaveBeenCalledTimes(1);

    });

    it('RestComService: endCall - error - no userSession in DB', async() => {

        let obj: ApiGwFormatDto =dataObj.test333

        console.info("************* endCall: " + obj);
        await restcommService.endCall(obj);

        expect(mockSipService.send).toHaveBeenCalledTimes(0);
        expect(mockDBSrv.getUserSession).toHaveBeenCalledTimes(1);
        expect(mockDBSrv.deleteUserSession).toHaveBeenCalledTimes(1);
        expect(mockClientMsgHandler.endCallAck).toHaveBeenCalledTimes(1);

    });

    it.skip('RestComService: addUser', async() => {

        let inviteReq: any = sipObj.inTest1;

        console.info("************* addUser: " + inviteReq);
        await restcommService.addUser(inviteReq);

        expect(mockDBSrv.setUserSession).toHaveBeenCalledTimes(1);
        expect(mockDBSrv.setSipRequest).toHaveBeenCalledTimes(1);
        expect(mockClientMsgHandler.call).toHaveBeenCalledTimes(1);
    });

    it.skip('RestComService: updateUser', async() => {

        let inviteReq: any =sipObj.inTest2;

        console.info("************* updateUser: " + inviteReq);
        await restcommService.updateUser(inviteReq);

        expect(mockDBSrv.setSipRequest).toHaveBeenCalledTimes(1);
        expect(mockClientMsgHandler.update).toHaveBeenCalledTimes(1);
    });

    it('RestComService: disconnectUser', async() => {

        let byeReq: any = sipObj.inTest3;

        console.info("************* disconnectUser: " + byeReq);
        await restcommService.disconnectUser(byeReq);

        expect(mockDBSrv.deleteUserSession).toHaveBeenCalledTimes(1);
        expect(mockClientMsgHandler.disconnect).toHaveBeenCalledTimes(1);
    });

    it('RestComService: ringingResponse', async() => {

        let response: ApiGwFormatDto = dataObj.test4;

        console.info("************* ringingResponse: " + response);
        await restcommService.ringingResponse(response);

        expect(mockDBSrv.getSipRequest).toHaveBeenCalledTimes(1);
        expect(mockSipService.buildAndSendResponse).toHaveBeenCalledTimes(1);
    });

    it('RestComService: ringingResponse - error - noRequest in DB', async() => {

        let response: ApiGwFormatDto = dataObj.test4err;

        console.info("************* ringingResponse: " + response);
        await restcommService.ringingResponse(response);

        expect(mockDBSrv.getSipRequest).toHaveBeenCalledTimes(1);
        expect(mockSipService.buildAndSendResponse).toHaveBeenCalledTimes(0);
    });

    it('RestComService: connectResponse', async() => {

        let response: ApiGwFormatDto = dataObj.test44;

        console.info("************* connectResponse: " + response);
        await restcommService.ringingResponse(response);

        expect(mockDBSrv.getSipRequest).toHaveBeenCalledTimes(1);
        expect(mockSipService.buildAndSendResponse).toHaveBeenCalledTimes(1);
    });

    it('RestComService: connectResponse - error - noRequest in DB - method "call"', async() => {

        let response: ApiGwFormatDto = dataObj.test444errCall;

        console.info("************* connectResponse: " + response);
        await restcommService.connectResponse(response);

        expect(mockDBSrv.getSipRequest).toHaveBeenCalledTimes(1);
        expect(mockSipService.buildAndSendResponse).toHaveBeenCalledTimes(0);
        expect(mockClientMsgHandler.disconnect).toHaveBeenCalledTimes(1);

    });

    it('RestComService: connectResponse - error - noRequest in DB - method "update"', async() => {

        let response: ApiGwFormatDto = dataObj.test444errUpdate;

        console.info("************* connectResponse: " + response);
        await restcommService.ringingResponse(response);

        expect(mockDBSrv.getSipRequest).toHaveBeenCalledTimes(1);
        expect(mockSipService.buildAndSendResponse).toHaveBeenCalledTimes(0);
        expect(mockClientMsgHandler.disconnect).toHaveBeenCalledTimes(0);

    });

    it('RestComService: rejectResponse - 400 error', async() => {

        let response: ApiGwFormatDto = dataObj.test444;

        console.info("************* rejectResponse: " + response);
        await restcommService.ringingResponse(response);

        expect(mockDBSrv.getSipRequest).toHaveBeenCalledTimes(1);
        expect(mockSipService.buildAndSendResponse).toHaveBeenCalledTimes(1);
    });

    it('RestComService: rejectResponse - 400 error && error - noRequest in DB', async() => {

        let response: ApiGwFormatDto = dataObj.test444err;

        console.info("************* rejectResponse: " + response);
        await restcommService.ringingResponse(response);

        expect(mockDBSrv.getSipRequest).toHaveBeenCalledTimes(1);
        expect(mockSipService.buildAndSendResponse).toHaveBeenCalledTimes(0);
    });

    it('RestComService: rejectResponse - 486 error', async() => {

        let response: ApiGwFormatDto = dataObj.test4444;

        console.info("************* rejectResponse: " + response);
        await restcommService.ringingResponse(response);

        expect(mockDBSrv.getSipRequest).toHaveBeenCalledTimes(1);
        expect(mockSipService.buildAndSendResponse).toHaveBeenCalledTimes(1);
    });

    it('RestComService: endCallResponse', async() => {

        let response: ApiGwFormatDto = dataObj.test5;

        console.info("************* endCallResponse: " + response);
        await restcommService.endCallResponse(response);

        expect(mockDBSrv.getSipRequest).toHaveBeenCalledTimes(1);
        expect(mockSipService.buildAndSendResponse).toHaveBeenCalledTimes(1);
        expect(mockDBSrv.deleteUserSession).toHaveBeenCalledTimes(1);
        expect(mockDBSrv.deleteSipRequest).toHaveBeenCalledTimes(1);
    });

})


describe('restComService', () => {
    let restcommService: RestcommService;


    beforeAll(async () => {
        const app: TestingModule = await Test.createTestingModule({
            providers: [RestcommService, DbService, SipService, Retransmissions,
                {provide: MculoggerService, useValue: loggerServiceMock},
                //{provide: SipService, useValue: mockSipService},
                {provide: MessageFactory, useValue: mockMessageFactory},
                {provide: RestcommDbService, useValue: mockDBSrv},
                {provide: ClientMsgHandler, useValue: mockClientMsgHandler},
                {provide: ConfigurationService, useValue: configServiceMock},
                {provide: DynamoDbService, useValue: DynamoDBServiceMock},
                {provide: SipUtils, useValue : new SipUtils() /*use real class of utils*/}
            ],
        }).compile();

        restcommService = app.get<RestcommService>(RestcommService);

        function clearMocks() {
        }

        clearMocks();

    });

    afterEach(() => {
        jest.clearAllMocks();
    });


    it('RestComService constructions', () => {
        expect(restcommService).toBeDefined();
    });

    it('RestComService: make call - sip error', async() => {

        let obj: ApiGwFormatDto = dataObj.testSipError;

        console.info("************* makeCall: " + obj);
        restcommService.makeCall(obj);

        await sleep(1000)

        expect(mockDBSrv.setUserSession).toHaveBeenCalledTimes(1);
        expect(mockClientMsgHandler.connect).toHaveBeenCalledTimes(0);
        expect(mockClientMsgHandler.reject).toHaveBeenCalledTimes(1);

    });

})
