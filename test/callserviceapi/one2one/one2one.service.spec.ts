import {Test, TestingModule} from "@nestjs/testing";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {loggerServiceMock} from "../../testutils/test.mock";
import {ClientMsgHandler} from "../../../src/client.msg.handler";
import {ApiGwFormatDto} from "../../../src/dto/apiGwFormatDto";
import {One2OneService} from "../../../src/callserviceapi/one2one/one2one.service";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";

let callIdSuffix = "_leg2";


const configServiceMock = {
    get: jest.fn().mockImplementation((name, defVal) => {
        switch (name) {
            case 'one2one.callIdSuffix':
                return "_leg2";
            default :
                return defVal;
        }
    })
};

let dataObj = {
    callIdLeg1: "test1@mavenir.com7777777-11111",
    callIdLeg2: "test1@mavenir.com7777777-11111" + callIdSuffix,
    test1Leg1: {
        caller: "user1@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test1@mavenir.com7777777-11111",
        accessToken: "token-111",
        sequence: "1",
        sdp: "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n",
    },
    test2Leg1: {
        caller: "user1@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test1@mavenir.com7777777-11111",
        accessToken: "token-111",
        sequence: "2",
        sdp: "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n",
    },
    test22Leg1: {
        caller: "user1@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test1@mavenir.com7777777-11111",
        accessToken: "token-111",
        sequence: "2",
        sdp: "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n",
    },
    test3Leg2: {
        caller: "user1@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test1@mavenir.com7777777-11111" + callIdSuffix,
        accessToken: "token-111",
        sequence: "1",
        sdp: "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n",
    },
    test33Leg2: {
        caller: "user1@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test1@mavenir.com7777777-11111" + callIdSuffix,
        accessToken: "token-111",
        sequence: "1",
        sdp: "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n",
    },
    test4Leg2: {
        caller: "user1@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test1@mavenir.com7777777-11111" + callIdSuffix,
        accessToken: "token-111",
        sequence: "1"
    },
    test5Leg2: {
        caller: "user1@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test1@mavenir.com7777777-11111" + callIdSuffix,
        accessToken: "token-111",
        sequence: "2",
        sdp: "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n",
    },
    test6Leg1: {
        caller: "user1@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test1@mavenir.com7777777-11111",
        accessToken: "token-111",
        sequence: "2",
        sdp: "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n",
    },
    test66Leg1: {
        caller: "user1@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test1@mavenir.com7777777-11111",
        accessToken: "token-111",
        sequence: "2",
        sdp: "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n",
    },
    test6Leg2: {
        caller: "user1@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test1@mavenir.com7777777-11111" + callIdSuffix,
        accessToken: "token-111",
        sequence: "4",
        sdp: "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n",
    },
    test66Leg2: {
        caller: "user1@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test1@mavenir.com7777777-11111" + callIdSuffix,
        accessToken: "token-111",
        sequence: "4",
        sdp: "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n",
    },
    test7Leg1: {
        caller: "user1@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test1@mavenir.com7777777-11111",
        accessToken: "token-111",
        sequence: "3",
        status: {
            code: "400",
            desc: "Bad Request"
        }
    },
    test7Leg2: {
        caller: "user1@mavenir.com",
        callee: "user2@mavenir.com",
        callId: "test1@mavenir.com7777777-11111" + callIdSuffix,
        accessToken: "token-111",
        sequence: "2",
        status: {
            code: "400",
            desc: "Bad Request"
        }
    }
};

let mockClientMsgHandler = {

    call: jest.fn().mockImplementation((request: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.call:, ${JSON.stringify(request)}`);
        expect(request.caller).toEqual(dataObj.test1Leg1.caller);
        expect(request.callee).toEqual(dataObj.test1Leg1.callee);
        expect(request.callId).toEqual(dataObj.callIdLeg2);
        expect(request.sequence).toEqual(dataObj.test1Leg1.sequence);
        expect(request.accessToken).toEqual(dataObj.test1Leg1.accessToken);
        expect(request.sdp).toEqual(dataObj.test1Leg1.sdp);

    }),
    update: jest.fn().mockImplementation((request: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.update:, ${JSON.stringify(request)}`);
        expect(request.caller).toEqual(dataObj.test2Leg1.caller);
        expect(request.callee).toEqual(dataObj.test2Leg1.callee);
        expect(request.accessToken).toEqual(dataObj.test2Leg1.accessToken);
        expect(request.sdp).toEqual(dataObj.test2Leg1.sdp);
        if((parseInt(request.sequence)) == 1) {
            expect(request.callId).toEqual(dataObj.callIdLeg1);
        }
        else {
            expect(request.callId).toEqual(dataObj.callIdLeg2);
        }
    }),
    disconnect: jest.fn().mockImplementation((request: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.disconnect:, ${JSON.stringify(request)}`);
        expect(request.caller).toEqual(dataObj.test2Leg1.caller);
        expect(request.callee).toEqual(dataObj.test2Leg1.callee);
        expect(request.accessToken).toEqual(dataObj.test2Leg1.accessToken);
        expect(request.sdp).toEqual(dataObj.test2Leg1.sdp);
        if(parseInt(request.sequence) == 1) {
            expect(request.callId).toEqual(dataObj.callIdLeg1);
        }
        else {
            expect(request.callId).toEqual(dataObj.callIdLeg2);
        }
    }),
    ring: jest.fn().mockImplementation((response: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.ring:, ${JSON.stringify(response)}`);
        expect(response.caller).toEqual(dataObj.test4Leg2.caller);
        expect(response.callee).toEqual(dataObj.test4Leg2.callee);
        expect(response.callId).toEqual(dataObj.callIdLeg1);
        expect(response.sequence).toEqual(dataObj.test4Leg2.sequence);
        expect(response.accessToken).toEqual(dataObj.test4Leg2.accessToken);
    }),
    connect: jest.fn().mockImplementation((response: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.connect:, ${JSON.stringify(response)}`);
        expect(response.caller).toEqual(dataObj.test5Leg2.caller);
        expect(response.callee).toEqual(dataObj.test5Leg2.callee);
        expect(response.callId).toEqual(dataObj.callIdLeg1);
        expect(response.sdp).toEqual(dataObj.test5Leg2.sdp);
        expect(response.sequence).toEqual(dataObj.test5Leg2.sequence);
        expect(response.accessToken).toEqual(dataObj.test5Leg2.accessToken);
    }),
    reject: jest.fn().mockImplementation((response: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.reject:, ${JSON.stringify(response)}`);
        expect(response.caller).toEqual(dataObj.test7Leg2.caller);
        expect(response.callee).toEqual(dataObj.test7Leg2.callee);
        expect(response.callId).toEqual(dataObj.callIdLeg1);
        expect(response.status).toEqual(dataObj.test7Leg2.status);
        expect(response.sequence).toEqual(dataObj.test7Leg2.sequence);
        expect(response.accessToken).toEqual(dataObj.test7Leg2.accessToken);
    }),
    updateAck: jest.fn().mockImplementation((response: ApiGwFormatDto) => {
        console.log(`mockClientMsgHandler.updateAck:, ${JSON.stringify(response)}`);
        expect(response.caller).toEqual(dataObj.test6Leg1.caller);
        expect(response.callee).toEqual(dataObj.test6Leg1.callee);
        //expect(response.sdp).toEqual(dataObj.test6Leg1.sdp);
        expect(response.accessToken).toEqual(dataObj.test6Leg1.accessToken);
        let seq: number = parseInt(response.sequence);
        if(seq == 1 || seq == 4) {
            expect(response.callId).toEqual(dataObj.callIdLeg1);
        }
        if(seq == 2 || seq == 3) {
            expect(response.callId).toEqual(dataObj.callIdLeg2);
        }
    }),
};



describe('one2OneService', () => {
    let one2OneService: One2OneService;

    beforeAll(async () => {
        const app: TestingModule = await Test.createTestingModule({
            providers: [One2OneService,
                {provide: MculoggerService, useValue: loggerServiceMock},
                {provide: ConfigurationService, useValue: configServiceMock},
                {provide: ClientMsgHandler, useValue: mockClientMsgHandler}
            ],
        }).compile();

        one2OneService = app.get<One2OneService>(One2OneService);

        function clearMocks() {
        }

        clearMocks();

    });

    afterEach(() => {
        jest.clearAllMocks();
    });


    it('One2OneService constructions', () => {
        expect(one2OneService).toBeDefined();
    });

    it('One2OneService: make call', async () => {

        let obj: ApiGwFormatDto = dataObj.test1Leg1;

        console.info("************* makeCall: " + obj);
        await one2OneService.makeCall(obj);
        expect(mockClientMsgHandler.call).toHaveBeenCalledTimes(1);
    });

    it('One2OneService: updateCall - legA', async () => {

        let obj: ApiGwFormatDto = dataObj.test2Leg1;

        console.info("************* updateCall: " + obj);
        await one2OneService.updateCall(obj);
        expect(mockClientMsgHandler.update).toHaveBeenCalledTimes(1);
    });

    it('One2OneService: updateCall - legB', async () => {

        let obj: ApiGwFormatDto = dataObj.test3Leg2;

        console.info("************* updateCall: " + obj);
        await one2OneService.updateCall(obj);
        expect(mockClientMsgHandler.update).toHaveBeenCalledTimes(1);
    });

    it('One2OneService: endCall - legA', async () => {

        let obj: ApiGwFormatDto = dataObj.test22Leg1;

        console.info("************* endCall: " + obj);
        await one2OneService.endCall(obj);
        expect(mockClientMsgHandler.disconnect).toHaveBeenCalledTimes(1);
    });

    it('One2OneService: endCall - legB', async () => {

        let obj: ApiGwFormatDto = dataObj.test33Leg2;

        console.info("************* endCall: " + obj);
        await one2OneService.endCall(obj);
        expect(mockClientMsgHandler.disconnect).toHaveBeenCalledTimes(1);
    });

    //Responses
    it('One2OneService: ringingResponse', async () => {

        let obj: ApiGwFormatDto = dataObj.test4Leg2;

        console.info("************* ringingResponse: " + obj);
        await one2OneService.ringingResponse(obj);
        expect(mockClientMsgHandler.ring).toHaveBeenCalledTimes(1);
    });

    it('One2OneService: connectResponse - updateResponse - legA', async () => {

        let obj: ApiGwFormatDto = dataObj.test66Leg1;

        console.info("************* connectResponse: " + obj);
        await one2OneService.updateResponse(obj);
        expect(mockClientMsgHandler.updateAck).toHaveBeenCalledTimes(1);
    });

    it('One2OneService: connectResponse - connect - legB', async () => {

        let obj: ApiGwFormatDto = dataObj.test5Leg2;

        console.info("************* connectResponse legB: " + obj);
        await one2OneService.connectResponse(obj);
        expect(mockClientMsgHandler.connect).toHaveBeenCalledTimes(1);
    });

    it('One2OneService: connectResponse - updateAck', async () => {

        let obj: ApiGwFormatDto = dataObj.test6Leg2;

        console.info("************* connectResponse: " + obj);
        await one2OneService.updateResponse(obj);
        expect(mockClientMsgHandler.updateAck).toHaveBeenCalledTimes(1);
    });

    it('One2OneService: rejectResponse - reject - legB', async () => {

        let obj: ApiGwFormatDto = dataObj.test7Leg2;

        console.info("************* rejectResponse legB: " + obj);
        await one2OneService.rejectResponse(obj);
        expect(mockClientMsgHandler.reject).toHaveBeenCalledTimes(1);
    });

    it('One2OneService: rejectResponse - updateAck - legA', async () => {

        let obj: ApiGwFormatDto = dataObj.test7Leg1;

        console.info("************* rejectResponse: " + obj);
        await one2OneService.updateRejectResponse(obj);
        expect(mockClientMsgHandler.updateAck).toHaveBeenCalledTimes(1);
    });

    it('One2OneService: rejectResponse - updateAck - legB', async () => {

        let obj: ApiGwFormatDto = dataObj.test66Leg2;

        console.info("************* rejectResponse legB: " + obj);
        await one2OneService.updateRejectResponse(obj);
        expect(mockClientMsgHandler.updateAck).toHaveBeenCalledTimes(1);
    });


})

