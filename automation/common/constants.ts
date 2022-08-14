import * as ip from "ip";
import { CognitoDetails} from "../common/dto/sipSessionDTO";

export const METHOD_INVITE : string= "INVITE";
export const METHOD_BYE: string = "BYE";
export const NO_ANSWER_RESPONSE: string = "NO_ANSWER";
export const REJECT_RESPONSE: string = "REJECT";
export const BUSY_RESPONSE: string = "BUSY";
export const OK_RESPONSE: string = "OK";
export const METHOD_ACK: string = "ACK";
export const METHOD_INFO: string = "INFO";
export const NOT_FOUND_RESPONSE: string = "NOT_FOUND";
export const FORBIDDEN_RESPONSE: string = "Forbidden";

export const LOCAL_HOST: string = "127.0.0.1";
export const WebTRCGW_PORT: string = "5060";
export const RESTCOM_PORT: string = "5080";
export const SDP: string ="v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n";
export const P2P: string = "P2P";
export const P2A: string = "P2A";
export const A2P: string = "A2P";

export const REGISTER_ACTION: string = 'Register';
export const REGISTER_ACTION_ACK: string = 'RegisterAck';
export const UNREGISTER_ACTION: string = 'Unregister';

export const CONFERENCE_START_ACTION='VideoStart'
export const START_ACTION: string = 'CallStart';
export const OPEN_ROOM_ACTION: string = 'Create';
export const OPEN_ROOM_RESPONSE_ACTION='CreateAck'
export const STATUS_ACTION: string = 'CallStatus';
export const ANSWER_ACTION: string = 'Answer';
export const TERMINATE_ACTION: string = 'Terminate';
export const TERMINATE_ACK_ACTION: string = 'TerminateAck';
export const RINGING_ACTION: string = "Ringing";
export const REJECT_ACTION: string = "Reject";

export const HOLD_ACTION: string = 'Hold';
export const HOLD_ACTION_ACK: string = 'HoldAnswer';
export const RESUME_ACTION: string = 'Resume';
export const RESUME_ACTION_ACK: string = 'ResumeAnswer';
export const MODIFY_ACTION: string = 'ModifyCall';
export const MODIFY_ACTION_ACK: string = 'ModifyCallAck';
export const UNDEFINED_ACTION: string = 'Undefined';

// AWS Constants
export const AWS_API_VERSION: string = '2018-11-29';
export const WEBRTC_GW_VERSION: string = '1.0';

// API GW services
export const CALL_SERVICE_TYPE: string = 'Call';
export const MCU_SERVICE_TYPE:string = 'Video'
export const JOIN: string = "Join";

export const CALL_ID: string = "CALL_ID";
export const CSEQ: string = "CSEQ";
export const METHOD: string = "METHOD";
export const TAG: string = "TAG";
export const CONTACT: string = "CONTACT";
export const SEQ: string = "SEQ";
export const TO: string = "TO";
export const FROM: string = "FROM";
export const URI: string = "URI";
export const USER: string = "USER";
export const PORT: string = "PORT";
export const HOST: string = "HOST";



export const REGION: string = "us-east-1"
export const USER_SRP_AUTH: string ="USER_SRP_AUTH"
export const COMPONENT_CPASS:string="componentCPAAS"



export const DEV_ENV: CognitoDetails = <CognitoDetails>{
    name: "webrtc-dev.restcomm.com",
    cognito: {
        AccountId: 'AC3c5b4177e5fdd813720bc0d6dd7f057e',
        AccountToken: 'c8b0fca2c59d9198b641ce60fe9b501b',
        userPoolId:'us-east-1_IxhAXkuzX',
        userPoolWebClientId:'3889vc2j08nn86lcboq45n6mb1'
    },
    restcommApplication: {
        appSid: 'AP4434355tomer'
    },
};


export const STAGING_ENV: CognitoDetails = <CognitoDetails>{
    name: "webrtc-staging.restcomm.com",
    cognito: {
        AccountId: 'AC3c5b4177e5fdd813720bc0d6dd7f057e',
        AccountToken: 'c8b0fca2c59d9198b641ce60fe9b501b',
        userPoolId:'us-east-1_IxhAXkuzX',
        userPoolWebClientId:'3889vc2j08nn86lcboq45n6mb1'
    },
    restcommApplication: {
        appSid: 'AP4434355tomer'
    },
};


export const COGNITO_DETAILS_ENV = [
    DEV_ENV,
    STAGING_ENV
]
