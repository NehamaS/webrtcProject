import {Test, TestingModule} from '@nestjs/testing';
import * as ip from "ip";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {MessageFactory} from "../../../../src/callserviceapi/sip/massagefactory/message.factory";
import {SipSession} from "../../../../src/callserviceapi/sip/common/sipSessionDTO";
import {RequestDTO} from "../../../../src/callserviceapi/sip/common/sipMessageDTO";
import {ApiGwFormatDto} from "../../../../src/dto/apiGwFormatDto";
import {loggerServiceMock} from "../../../testutils/test.mock";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {SipUtils} from "../../../../src/callserviceapi/sip/common/sip.utils";

let SIP_CONTACT : any = undefined;
let RESTCOMM : any = undefined;
let RESTCOMM_PORT : any = undefined;
let RESTCOMM_URL_ENABLED : any = undefined;
let sipAddress : string = process.env.SIP_ADDRESS ? process.env.SIP_ADDRESS : ip.address();

const configServiceMock = {
    get: jest.fn().mockImplementation((name, defVal) => {
        switch (name) {
            case 'sip.contact':
                return SIP_CONTACT ? SIP_CONTACT : defVal;
            case 'restcomm.url.enabled':
                return RESTCOMM_URL_ENABLED ? RESTCOMM_URL_ENABLED : defVal;
            case 'restcomm.url.fqdn':
                return RESTCOMM ? RESTCOMM : defVal;
            case 'restcomm.port':
                return RESTCOMM_PORT ? RESTCOMM_PORT : defVal;
            default :
                return defVal;
        }
    })
};

describe('MessageFactory', () => {
    let service: MessageFactory;

    beforeAll(async () => {
        const app: TestingModule = await Test.createTestingModule({
            providers: [MessageFactory,
                {provide: MculoggerService, useValue: loggerServiceMock},
                {provide: ConfigurationService, useValue: configServiceMock},
                {provide: SipUtils, useValue : new SipUtils() /*use real class of a utils*/}
            ],
        }).compile();

        service = app.get<MessageFactory>(MessageFactory);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });


    it('RestcomMessageFactory constructions', () => {
        expect(service).toBeDefined();
    });

    it('RestcomMessageFactory: createInvite', async () => {

        let obj: ApiGwFormatDto = {
            caller: "test1@mavenir.com",
            callee: "user2@mavenir.com",
            callId: "7777777-22222",
            accessToken: "token-222",
            sdp: "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n",
            appSid: "appUber"
        }
        let invite: RequestDTO = service.createInvite(obj);

        expect(invite.method).toEqual("INVITE");
        expect(invite.uri).toEqual("sip:user2@mavenir.com");
        expect(invite.version).toEqual("2.0");
        expect(invite.headers.to).toEqual({"uri": "sip:appUber@mavenir.com"});
        expect(invite.headers.from.uri).toEqual("sip:test1@mavenir.com");
        expect(invite.headers.from.params.tag).toBeDefined();
        expect(invite.headers["call-id"]).toBeDefined();
        expect(invite.headers.cseq.seq).toEqual(1);
        expect(invite.headers.cseq.method).toEqual("INVITE");
        expect(invite.headers.contact[0].uri).toContain("sip:user2@");
        expect(invite.headers.via).toBeDefined();
        expect(invite.headers["content-type"]).toEqual("application/sdp");
        expect(invite.content).toEqual(obj.sdp);
        expect(invite.headers["x-called-party-id"]).toEqual("sip:user2@mavenir.com");
    });

    it('RestcomMessageFactory: createInvite (ip:port)', async () => {

        //custome domain is simple ip:port
        let obj: ApiGwFormatDto = {
            caller: "test1@127.0.0.1:5080",
            callee: "user2@127.0.0.1:5080",
            callId: "7777777-22222",
            accessToken: "token-222",
            sdp: "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n",
            appSid: "appUber"
        }
        let invite: RequestDTO = service.createInvite(obj);

        expect(invite.method).toEqual("INVITE");
        expect(invite.uri).toEqual("sip:user2@127.0.0.1:5080");
        expect(invite.version).toEqual("2.0");
        expect(invite.headers.to).toEqual({"uri": "sip:appUber@127.0.0.1:5080"});
        expect(invite.headers.from.uri).toEqual("sip:test1@127.0.0.1:5080");
        expect(invite.headers.from.params.tag).toBeDefined();
        expect(invite.headers["call-id"]).toBeDefined();
        expect(invite.headers.cseq.seq).toEqual(1);
        expect(invite.headers.cseq.method).toEqual("INVITE");
        expect(invite.headers.contact[0].uri).toContain("sip:user2@");
        expect(invite.headers.via).toBeDefined();
        expect(invite.headers["content-type"]).toEqual("application/sdp");
        expect(invite.content).toEqual(obj.sdp);
        expect(invite.headers["x-called-party-id"]).toEqual("sip:user2@127.0.0.1:5080");
    });

    it('RestcomMessageFactory: createReInvite', async () => {

        let sdp: "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n"

        let sipSession: SipSession = {
            callId: "7777777-22222",
            from: {"uri": "sip:user1@mavenir.com", "params": {"tag": "1643276181847"}},
            to: {"uri": "sip:user2@mavenir.com", "params": {"tag": "45454545454545"}},
            destContact: {"uri": "sip:22222test@10.106.146.13:5060"},
            seqNumber: 2,

        }

        let invite: RequestDTO = service.createReInvite(sipSession, sdp);

        expect(invite.method).toEqual("INVITE");
        expect(invite.uri).toEqual(sipSession.destContact);
        expect(invite.version).toEqual("2.0");
        expect(invite.headers.to).toEqual(sipSession.to);
        expect(invite.headers.from).toEqual(sipSession.from);
        expect(invite.headers["call-id"]).toEqual(sipSession.callId);
        expect(invite.headers.cseq.seq).toEqual(2);
        expect(invite.headers.cseq.method).toEqual("INVITE");
        expect(invite.headers.contact[0].uri).toEqual(service.getContactUri());
        expect(invite.headers.via).toBeDefined();
        expect(invite.headers["content-type"]).toEqual("application/sdp");
        expect(invite.content).toEqual(sdp);
        expect(invite.headers["x-called-party-id"]).toEqual(sipSession.destContact);

    });

    it('RestcomMessageFactory: createMessage: Ack for 200 OK', async () => {

        let sipSession: SipSession = {
            callId: "7777777-22222",
            from: {"uri": "sip:user1@mavenir.com", "params": {"tag": "1643276181847"}},
            to: {"uri": "sip:user2@mavenir.com", "params": {"tag": "45454545454545"}},
            destContact: {"uri": "sip:22222test@10.106.146.13:5060"},
            seqNumber: 2
        }

        let invite: RequestDTO = service.createMessage("ACK", sipSession);

        expect(invite.method).toEqual("ACK");
        expect(invite.uri).toEqual(sipSession.destContact);
        expect(invite.version).toEqual("2.0");
        expect(invite.headers.to).toEqual(sipSession.to);
        expect(invite.headers.from).toEqual(sipSession.from);
        expect(invite.headers["call-id"]).toEqual(sipSession.callId);
        expect(invite.headers.cseq.seq).toEqual(2);
        expect(invite.headers.cseq.method).toEqual("ACK");
        expect(invite.headers.contact[0].uri).toEqual(service.getContactUri());
        expect(invite.headers.via).toBeDefined();

    });

    it('RestcomMessageFactory: createMessage: Ack for reject', async () => {

        let sipSession: SipSession = {
            callId: "7777777-22222",
            from: {"uri": "sip:user1@mavenir.com", "params": {"tag": "1643276181847"}},
            to: {"uri": "sip:user2@mavenir.com", "params": {"tag": "45454545454545"}},
            destContact: {"uri": "sip:22222test@10.106.146.13:5060"},
            seqNumber: 2
        }
        let via = [{
            "version": "2.0",
            "protocol": "UDP",
            "host": "10.9.251.177",
            "port": 5060,
            "params": {"branch": "z9hG4bK17281", "rport": 5060, "received": "10.9.251.177"}
        }];

        let ack: RequestDTO = service.createMessage("ACK", sipSession, via);

        expect(ack.method).toEqual("ACK");
        expect(ack.uri).toEqual(sipSession.destContact);
        expect(ack.version).toEqual("2.0");
        expect(ack.headers.to).toEqual(sipSession.to);
        expect(ack.headers.from).toEqual(sipSession.from);
        expect(ack.headers["call-id"]).toEqual(sipSession.callId);
        expect(ack.headers.cseq.seq).toEqual(2);
        expect(ack.headers.cseq.method).toEqual("ACK");
        expect(ack.headers.contact[0].uri).toEqual(service.getContactUri());
        expect(ack.headers.via).toEqual([]);

    });

    it('RestcomMessageFactory: createMessage: BYE', async () => {

        let sipSession: SipSession = {
            callId: "7777777-22222",
            from: {"uri": "sip:user1@mavenir.com", "params": {"tag": "1643276181847"}},
            to: {"uri": "sip:user2@mavenir.com", "params": {"tag": "45454545454545"}},
            destContact: {"uri": "sip:22222test@10.106.146.13:5060"},
            seqNumber: 3
        }

        let invite: RequestDTO = service.createMessage("BYE", sipSession);

        expect(invite.method).toEqual("BYE");
        expect(invite.uri).toEqual(sipSession.destContact);
        expect(invite.version).toEqual("2.0");
        expect(invite.headers.to).toEqual(sipSession.to);
        expect(invite.headers.from).toEqual(sipSession.from);
        expect(invite.headers["call-id"]).toEqual(sipSession.callId);
        expect(invite.headers.cseq.seq).toEqual(3);
        expect(invite.headers.cseq.method).toEqual("BYE");
        expect(invite.headers.contact[0].uri).toEqual(service.getContactUri());
        expect(invite.headers.via).toBeDefined();

    });

    it('getContactUri', () => {
        //Override sip port
        //Config contact name
        //SIP_CONTACT = "webrtc.com";
        process.env.SIP_PORT = "5270";
        process.env.SIP_CONTACT_ADDR = "webrtc.gw.com:5260";
        let uri: string = service.getContactUri();
        //expect(uri).toEqual("sip:webrtc.com:5260");
        expect(uri).toEqual('sip:' + process.env.SIP_CONTACT_ADDR);

        //Override sip port
        //NO Config for contact name!
        //SIP_CONTACT = undefined;
        delete process.env.SIP_CONTACT_ADDR;
        uri = service.getContactUri();
        expect(uri).toEqual(`sip:${sipAddress}:5270`);

        //No Override sip port
        //NO Config for contact name!
        //SIP_CONTACT = undefined;
        delete process.env.SIP_PORT
        uri = service.getContactUri();
        expect(uri).toEqual(`sip:${sipAddress}:5060`);
    });

    it('RestcomMessageFactory getRestcomServerAddress - use configured url', () => {
        RESTCOMM_URL_ENABLED = true;
        //Override restcomm address - Env Param
        process.env.RESTCOM_ADDRESS = "aws.restromm.com:5020";
        let uri: string = service.getRestcomServerAddress("sip:test@mavenir.com");
        expect(uri).toEqual("sip:test@aws.restromm.com:5020");

        //Override restcomm address - Config
        delete process.env.RESTCOM_ADDRESS;
        RESTCOMM = "aws.restcom.com"
        uri = service.getRestcomServerAddress("sip:1800-777-777@mavenir.com");
        expect(uri).toEqual("sip:1800-777-777@aws.restcom.com");

        //Override restcomm address & port - Config
        delete process.env.RESTCOM_ADDRESS;
        RESTCOMM = "aws.restcom.com"
        RESTCOMM_PORT = 4560;
        uri = service.getRestcomServerAddress("sip:1800-777-777@mavenir.com");
        expect(uri).toEqual("sip:1800-777-777@aws.restcom.com:4560");
    });

    it('RestcomMessageFactory getRestcomServerAddress - get domain from to address', () => {
        /*To address is the exprected input parameter*/
        RESTCOMM_URL_ENABLED = undefined;
        let uri: string = service.getRestcomServerAddress("sip:test@mavenir.com");
        expect(uri).toEqual("sip:test@mavenir.com");
    });

});
