import {One2OneService} from "../../src/callserviceapi/one2one/one2one.service";
import {Test, TestingModule} from "@nestjs/testing";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {loggerServiceMock} from "../testutils/test.mock";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {ClientMsgHandler} from "../../src/client.msg.handler";
import {ApiGwFormatDto} from "../../src/dto/apiGwFormatDto";
import {RestcommService} from "../../src/callserviceapi/restcomm/restcomm.service";
import {CallServiceApiImpl} from "../../src/callserviceapi/call.service.api";
import {ConferenceService} from "../../src/callserviceapi/conference/conference.service";
const P2P_SERVICE = "P2P";


let one2OneServiceMock = {
    makeCall: jest.fn().mockImplementation((request: ApiGwFormatDto) => {
        console.log(`one2OneServiceMock.makeCall:, ${JSON.stringify(request)}`);
    }),
    updateCall: jest.fn().mockImplementation((request: ApiGwFormatDto) => {
        console.log(`one2OneServiceMock.updateCall:, ${JSON.stringify(request)}`);
    }),
    endCall: jest.fn().mockImplementation((request: ApiGwFormatDto) => {
        console.log(`one2OneServiceMock.endCall:, ${JSON.stringify(request)}`);
    }),
    ringingResponse: jest.fn().mockImplementation((resp: ApiGwFormatDto) => {
        console.log(`one2OneServiceMock.ringingResponse:, ${JSON.stringify(resp)}`);
    }),
    connectResponse: jest.fn().mockImplementation((resp: ApiGwFormatDto) => {
        console.log(`one2OneServiceMock.connectResponse:, ${JSON.stringify(resp)}`);
    }),
    rejectResponse: jest.fn().mockImplementation((resp: ApiGwFormatDto) => {
        console.log(`one2OneServiceMock.rejectResponse:, ${JSON.stringify(resp)}`);
    }),
    endCallResponse: jest.fn().mockImplementation((resp: ApiGwFormatDto) => {
        console.log(`one2OneServiceMock.endCallResponse:, ${JSON.stringify(resp)}`);
    })
}

let restcommServiceMock = {
    makeCall: jest.fn().mockImplementation((request: ApiGwFormatDto) => {
        console.log(`restcommServiceMock.makeCall:, ${JSON.stringify(request)}`);
    }),
    updateCall: jest.fn().mockImplementation((request: ApiGwFormatDto) => {
        console.log(`restcommServiceMock.updateCall:, ${JSON.stringify(request)}`);
    }),
    endCall: jest.fn().mockImplementation((request: ApiGwFormatDto) => {
        console.log(`restcommServiceMock.endCall:, ${JSON.stringify(request)}`);
    }),
    ringingResponse: jest.fn().mockImplementation((resp: ApiGwFormatDto) => {
        console.log(`restcommServiceMock.ringingResponse:, ${JSON.stringify(resp)}`);
    }),
    connectResponse: jest.fn().mockImplementation((resp: ApiGwFormatDto) => {
        console.log(`restcommServiceMock.connectResponse:, ${JSON.stringify(resp)}`);
    }),
    updateResponse: jest.fn().mockImplementation((resp: ApiGwFormatDto) => {
        console.log(`restcommServiceMock.updateResponse:, ${JSON.stringify(resp)}`);
    }),
    rejectResponse: jest.fn().mockImplementation((resp: ApiGwFormatDto) => {
        console.log(`restcommServiceMock.rejectResponse:, ${JSON.stringify(resp)}`);
    }),
    updateRejectResponse: jest.fn().mockImplementation((resp: ApiGwFormatDto) => {
        console.log(`restcommServiceMock.updateRejectResponse:, ${JSON.stringify(resp)}`);
    }),
    endCallResponse: jest.fn().mockImplementation((resp: ApiGwFormatDto) => {
        console.log(`restcommServiceMock.endCallResponse:, ${JSON.stringify(resp)}`);
    })
}

let conferenceServiceMock = {
    makeCall: jest.fn().mockImplementation((request: ApiGwFormatDto) => {
        console.log(`conferenceServiceMock.makeCall:, ${JSON.stringify(request)}`);
    })
}

let dataObj = {
    test1: {
        caller: "user1@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test1@mavenir.com7777777-11111",
        accessToken: "token-111",
        sequence: "1",
        sdp: "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n",
    },
    test2: {
        caller: "user1@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test1@mavenir.com7777777-11111",
        accessToken: "token-111",
        sequence: "1",
        sdp: "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n",
    }
}

describe('CallServiceApiImpl', () => {
    let callServiceApiImpl: CallServiceApiImpl;

    beforeAll(async () => {
        const app: TestingModule = await Test.createTestingModule({
            providers: [CallServiceApiImpl,
                {provide: MculoggerService, useValue: loggerServiceMock},
                {provide: RestcommService, useValue: restcommServiceMock},
                {provide: One2OneService, useValue: one2OneServiceMock},
                {provide: ConferenceService, useValue: conferenceServiceMock}
            ],
        }).compile();

        callServiceApiImpl = app.get<CallServiceApiImpl>(CallServiceApiImpl);

        function clearMocks() {
        }

        clearMocks();

    });

    afterEach(() => {
        jest.clearAllMocks();
    });


    it('CallServiceApiImpl constructions', () => {
        expect(callServiceApiImpl).toBeDefined();
    });

    it('CallServiceApiImpl: make call - one2one', async () => {

        let obj: ApiGwFormatDto = dataObj.test1;
        obj.service = P2P_SERVICE;

        console.info("************* makeCall: " + obj);
        await callServiceApiImpl.makeCall(obj);
        expect(one2OneServiceMock.makeCall).toHaveBeenCalledTimes(1);
    });

    it('CallServiceApiImpl: make call - restcomm', async () => {

        let obj: ApiGwFormatDto = dataObj.test2;

        console.info("************* makeCall: " + obj);
        await callServiceApiImpl.makeCall(obj);
        expect(restcommServiceMock.makeCall).toHaveBeenCalledTimes(1);
    });

    it('CallServiceApiImpl: updateCall - one2one', async () => {

        let obj: ApiGwFormatDto = dataObj.test1;
        obj.service = P2P_SERVICE;

        console.info("************* updateCall: " + obj);
        await callServiceApiImpl.updateCall(obj);
        expect(one2OneServiceMock.updateCall).toHaveBeenCalledTimes(1);
    });

    it('CallServiceApiImpl: updateCall - restcomm', async () => {

        let obj: ApiGwFormatDto = dataObj.test2;

        console.info("************* updateCall: " + obj);
        await callServiceApiImpl.updateCall(obj);
        expect(restcommServiceMock.updateCall).toHaveBeenCalledTimes(1);
    });
    it('CallServiceApiImpl: endCall - one2one', async () => {

        let obj: ApiGwFormatDto = dataObj.test1;
        obj.service = P2P_SERVICE;

        console.info("************* endCall: " + obj);
        await callServiceApiImpl.endCall(obj);
        expect(one2OneServiceMock.endCall).toHaveBeenCalledTimes(1);
    });

    it('CallServiceApiImpl: endCall - restcomm', async () => {

        let obj: ApiGwFormatDto = dataObj.test2;

        console.info("************* endCall: " + obj);
        await callServiceApiImpl.endCall(obj);
        expect(restcommServiceMock.endCall).toHaveBeenCalledTimes(1);
    });

    it('CallServiceApiImpl: ringingResponse - one2one', async () => {

        let obj: ApiGwFormatDto = dataObj.test1;
        obj.service = P2P_SERVICE;

        console.info("************* ringingResponse: " + obj);
        await callServiceApiImpl.ringingResponse(obj);
        expect(one2OneServiceMock.ringingResponse).toHaveBeenCalledTimes(1);
    });

    it('CallServiceApiImpl: ringingResponse - restcomm', async () => {

        let obj: ApiGwFormatDto = dataObj.test2;

        console.info("************* ringingResponse: " + obj);
        await callServiceApiImpl.ringingResponse(obj);
        expect(restcommServiceMock.ringingResponse).toHaveBeenCalledTimes(1);
    });

    it('CallServiceApiImpl: connectResponse - one2one', async () => {

        let obj: ApiGwFormatDto = dataObj.test1;
        obj.service = P2P_SERVICE;

        console.info("************* connectResponse: " + obj);
        await callServiceApiImpl.connectResponse(obj);
        expect(one2OneServiceMock.connectResponse).toHaveBeenCalledTimes(1);
    });

    it('CallServiceApiImpl: connectResponse - restcomm', async () => {

        let obj: ApiGwFormatDto = dataObj.test2;

        console.info("************* connectResponse: " + obj);
        await callServiceApiImpl.connectResponse(obj);
        expect(restcommServiceMock.connectResponse).toHaveBeenCalledTimes(1);
    });

    it('CallServiceApiImpl: rejectResponse - one2one', async () => {

        let obj: ApiGwFormatDto = dataObj.test1;
        obj.service = P2P_SERVICE;

        console.info("************* rejectResponse: " + obj);
        await callServiceApiImpl.rejectResponse(obj);
        expect(one2OneServiceMock.rejectResponse).toHaveBeenCalledTimes(1);
    });

    it('CallServiceApiImpl: rejectResponse - restcomm', async () => {

        let obj: ApiGwFormatDto = dataObj.test2;

        console.info("************* rejectResponse: " + obj);
        await callServiceApiImpl.rejectResponse(obj);
        expect(restcommServiceMock.rejectResponse).toHaveBeenCalledTimes(1);
    });

    it('CallServiceApiImpl: endCallResponse - one2one', async () => {

        let obj: ApiGwFormatDto = dataObj.test1;
        obj.service = P2P_SERVICE;

        console.info("************* endCallResponse: " + obj);
        await callServiceApiImpl.endCallResponse(obj);
        expect(one2OneServiceMock.endCallResponse).toHaveBeenCalledTimes(1);
    });

    it('CallServiceApiImpl: endCallResponse - restcomm', async () => {

        let obj: ApiGwFormatDto = dataObj.test2;

        console.info("************* endCallResponse: " + obj);
        await callServiceApiImpl.endCallResponse(obj);
        expect(restcommServiceMock.endCallResponse).toHaveBeenCalledTimes(1);
    });

})