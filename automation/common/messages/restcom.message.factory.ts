
import {RequestDTO,Uri} from "../dto/sipMessageDTO";
import {Session}  from "../dto/sipSessionDTO";
import {Context} from "../context";
import * as ip from "ip";
import {SipMethod} from "../factory"
import {METHOD_BYE,METHOD_INVITE,METHOD_ACK,WebTRCGW_PORT,LOCAL_HOST,RESTCOM_PORT,SDP} from "../constants"


export const CONTENT_TYPE_APP_JSON = "application/json";
const webRtcGW_name="webRtcGW"
const restcomm_name="restcomm"

export const restComAddressUri:string = `sip:${restcomm_name}@"${LOCAL_HOST}:${RESTCOM_PORT}`;
export const webRtcGWUri: string = `sip:${webRtcGW_name}@"${LOCAL_HOST}:${WebTRCGW_PORT}`;

export class RestcomMessageFactory {

    constructor() {

    }

    public message(method: SipMethod, session:Session,context:Context) {
        switch (method) {
            case SipMethod.CREATE_INVITE:
                return this.createInvite(session,context);

            default:
                throw new Error("not supported option");
        }
    }

    public createInvite(session:Session,context:Context): RequestDTO {

        const fromTag = this.getTag();
        const fromUri = this.getUri(session.destUser,RESTCOM_PORT,LOCAL_HOST);
        const toUri = this.getUri(session.srcUser,WebTRCGW_PORT,LOCAL_HOST);
        const inviteReq: RequestDTO = <RequestDTO>{
            method: METHOD_INVITE,
            uri: toUri,
            version: "2.0",
            headers: {
                to: {"uri":toUri},
                from: {"uri":fromUri,"params":{"tag":fromTag}},
                "call-id": session.callId,
                cseq: { method: METHOD_INVITE, seq: 1 },
                contact: [{uri: fromUri}],
                "X-RestComm-OrganizationSid": session.OrganizationSid,
                "X-RestComm-AccountSid": session.AccountSid,
                "X-RestComm-ApplicationSid": session.AppSid,
                via: [],
                "Content-Type": CONTENT_TYPE_APP_JSON,
            },
            content:   "v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n",

    };
        return inviteReq;
    }

    public createByeToA(session: Session, context: Context): RequestDTO {

        const request: RequestDTO = <RequestDTO>{
            method: METHOD_BYE,
            uri: `sip:${session.srcUser}@${LOCAL_HOST}:${WebTRCGW_PORT}`,
            version: "2.0",
            headers: {
                to: {uri: context.to.uri, params: context.to.params},
                from: {uri: context.from.uri, params: context.from.params},
                "call-id": context.callId,
                "cseq": {method: METHOD_BYE, seq: session.seqNumber},
                contact: [{uri: `sip:${session.destUser}@${context.cpaasAppUrl}`}],
                via: []
            }
        };
        return request;
    }
    public createReInviteToA(session:Session, context:Context): RequestDTO {
        const inviteReq: RequestDTO = <RequestDTO>{
            method: METHOD_INVITE,
            uri: session.destContact,
            version: "2.0",
            headers: {
                to: session.from,
                from: session.to,
                "call-id": session.callId,
                "cseq": {method: METHOD_INVITE, seq: session.seqNumber},
                contact: [{uri: this.getUri(session.srcUser,RESTCOM_PORT,LOCAL_HOST)}],
                via: [],
                "Content-Type": CONTENT_TYPE_APP_JSON,
            },
            content: SDP
        };
        return inviteReq;
    }


    private getUri(userId,port,host) {
        let uri:Uri=new Uri();
        uri.user=userId;
        uri.port=port;
        uri.domain=host;

        return uri.uri()

    }

    public getTag() {
        let date = Date.now();
        let tag =  String(date);
        return tag;
    }


}