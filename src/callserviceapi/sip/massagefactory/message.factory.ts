import {RequestDTO} from "../common/sipMessageDTO";
import {SipSession} from "../common/sipSessionDTO";
import {ApiGwFormatDto} from "../../../dto/apiGwFormatDto";
import * as ip from "ip";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {Injectable} from "@nestjs/common";
import {SIP_PORT} from "../../../common/constants";
import {SipURI, SipUtils} from "../common/sip.utils";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {listPolicyGrantingServiceAccessResponseListType} from "aws-sdk/clients/iam";

export const METHOD_INVITE = "INVITE";
export const METHOD_ACK = "ACK";
export const METHOD_INFO = "INFO";
export const METHOD_BYE = "BYE";
export const METHOD_CANCEL = "CANCEL"
export const METHOD_OPTIONS = "OPTIONS";
export const CONTENT_TYPE_APP_JSON = "application/json";
export const CONTENT_TYPE_APP_SDP = "application/sdp";
export const HEADER_X_MEETINGID = "x-meetingid";
export const HEADER_X_ROOMID = "x-roomid";
export const HEADER_X_DEVICEID = "x-deviceid";
export const HEADER_DIALOGUE_TYPE = "x-dialogue-type";
export const HEADER_X_CALLER_ID = "x-caller-id";
export const HEADER_X_SERVICE_TYPE = "x-service-type";
export const HEADER_X_RESTCOMM_CALLSID = "x-restcomm-callsid";
export const HEADER_CONTENT_TYPE = "content-type";
export const USER_AGENT = "Restcomm WebRTC Demo/2.3.2-274";
export const FROM_TAG = '55667788';
export const CONTENT_MSML = "application/msml+xml";


const SIP_ADDRESS = process.env.SIP_ADDRESS ? process.env.SIP_ADDRESS : ip.address();

@Injectable()
export class MessageFactory {

    constructor(private readonly config: ConfigurationService,
                private readonly utils: SipUtils,
                private readonly logger: MculoggerService) {
    }

    /**
     * INVITE with below parameters:
     * from:  <source/caller>@<custom.domain.restcomm.com>
     * to: <appSid>@<custom.domain.restcomm.com>
     * requestURI: <dest/callee>@<custom.domain.restcomm.com>
     */
    public createInvite(request: ApiGwFormatDto): RequestDTO {
        try {

            let useAppId = this.config.get("useAppId", true)
            let userAgent = this.config.get("userAgent", USER_AGENT)
            let uri;
            if(request.service == "P2M") {
                uri = this.getMcuAddress();
            }
            else {
                uri = this.getRestcomServerAddress(this.utils.getURI(request.callee));
            }

            let fromTag = this.getTag();
            if (process.env.SIP_USE_TEST_TAG == 'true'){
                fromTag = FROM_TAG;
            }

            const fromUri = this.utils.getURI(request.caller);
            const toUri = useAppId ? this.utils.getURI(request.callee, request.appSid) : uri; // !this.useAppId and not this.useAppId for simplify the UT


            let inviteReq: RequestDTO = {
                method: METHOD_INVITE,
                uri: uri,
                version: "2.0",
                headers: {
                    to: {uri: toUri},
                    from: {uri: fromUri, params: {tag: fromTag}},
                    "call-id": request.callId,
                    cseq: {method: METHOD_INVITE, seq: 1},
                    contact: [{uri: this.getContactUri(this.utils.getUserPart(request.callee))}],
                    authorization: request.accessToken,
                    "user-agent": userAgent,
                    "max-forwards": 70,
                    via: [],
                    "content-type": CONTENT_TYPE_APP_SDP,
                    "x-called-party-id": uri
                },
                content: request.sdp
            };

            if(request.meetingId && request.meetingId != undefined) {
                inviteReq.headers[HEADER_X_MEETINGID] = request.meetingId;
            }
            if(request.service && request.service != undefined) {
                inviteReq.headers[HEADER_X_SERVICE_TYPE] = request.service;
            }
            if(request.deviceId && request.deviceId != undefined) {
                inviteReq.headers[HEADER_X_DEVICEID] = request.deviceId;
            }
            if(request.service == "P2M") {
                inviteReq.headers[HEADER_X_CALLER_ID] = request.caller;
                inviteReq.headers[HEADER_DIALOGUE_TYPE] = 0;
            }

            return inviteReq;
        } catch (e) {
            this.logger.error({action: 'createMessage', error: e.message ? e.message : e})
        }
    }

    public createCancel(inviteReq: RequestDTO): RequestDTO {
        /*
        From RFC 3261
            The following procedures are used to construct a CANCEL request.
            The Request-URI, Call-ID, To, the numeric part of CSeq, and From header fields in the CANCEL request MUST be identical to those in the request being cancelled,
             including tags.
             A CANCEL constructed by a client MUST have only a single Via header field value matching the top Via value in the request being cancelled
         */
        try {
            let cancelReq: RequestDTO = {
                method: METHOD_CANCEL,
                uri: inviteReq.uri,
                version: "2.0",
                headers: {
                    to: inviteReq.headers.to,
                    from: inviteReq.headers.from,
                    "call-id": inviteReq.headers["call-id"],
                    cseq: {method: METHOD_CANCEL, seq: inviteReq.headers.cseq.seq},
                    via: [inviteReq.headers.via[0]],
                    "max-forwards": 70
                }
            };

            if(inviteReq.headers[HEADER_X_MEETINGID]) {
                cancelReq.headers[HEADER_X_MEETINGID] = inviteReq.headers[HEADER_X_MEETINGID];
            }
            if(inviteReq.headers[HEADER_X_SERVICE_TYPE]) {
                cancelReq.headers[HEADER_X_SERVICE_TYPE] = inviteReq.headers[HEADER_X_SERVICE_TYPE];
            }

            return cancelReq;

        } catch (e) {
            this.logger.error({action: 'createMessage', error: e.message ? e.message : e})
        }
    }

    public createReInvite(session: SipSession, sdp: string): RequestDTO {
        try {

            let userAgent = this.config.get("userAgent", USER_AGENT)

            let reInviteReq: RequestDTO = {
                method: METHOD_INVITE,
                uri: session.destContact,
                version: "2.0",
                headers: {
                    to: session.to,
                    from: session.from,
                    "call-id": session.callId,
                    cseq: {method: METHOD_INVITE, seq: Number(session.seqNumber)},
                    contact: session.contact ? session.contact : [{uri: this.getContactUri()}],
                    via: [],
                    "user-agent": userAgent,
                    "max-forwards": 70,
                    "content-type": CONTENT_TYPE_APP_SDP,
                    "x-called-party-id": session.destContact,
                },
                content: sdp
            };

            if(session.meetingId && session.meetingId != undefined) {
                reInviteReq.headers[HEADER_X_MEETINGID] = session.meetingId;
            }
            if(session.service && session.service != undefined) {
                reInviteReq.headers[HEADER_X_SERVICE_TYPE] = session.service;
            }
            if(session.callSid && session.callSid != undefined) {
                reInviteReq.headers[HEADER_X_RESTCOMM_CALLSID] = session.callSid;
            }

            return reInviteReq;
        } catch (e) {
            this.logger.error({action: 'createMessage', error: e.message ? e.message : e})
        }

    }

    public createMessage(method: string, session: SipSession,  body?: any): RequestDTO {

        try {
            let sipRequest: RequestDTO = {
                method: method,
                uri: session.destContact,
                version: "2.0",
                headers: {
                    to: session.to,
                    from: session.from,
                    "call-id": session.callId,
                    "max-forwards": 70,
                    cseq: {method: method, seq: Number(session.seqNumber)},
                    contact: session.contact ? session.contact : [{uri: this.getContactUri()}],
                    via: []
                }
            };

            if(session.meetingId && session.meetingId != undefined) {
                sipRequest.headers[HEADER_X_MEETINGID] = session.meetingId;
            }
            if(session.service && session.service != undefined) {
                sipRequest.headers[HEADER_X_SERVICE_TYPE] = session.service;
            }
            if(session.callSid && session.callSid != undefined) {
                sipRequest.headers[HEADER_X_RESTCOMM_CALLSID] = session.callSid;
            }

            if(body && body != undefined) {
                sipRequest.headers[HEADER_CONTENT_TYPE] = CONTENT_MSML;
                sipRequest.content = body;
            }

            return sipRequest;
        } catch (e) {
            this.logger.error({action: 'createMessage', error: e.message ? e.message : e})
        }

    }

    public createRoomInvite(request: ApiGwFormatDto): RequestDTO {
        try {

            const uri = this.getMcuAddress();
            let fromTag = this.getTag();
            if (process.env.SIP_USE_TEST_TAG == 'true'){
                fromTag = FROM_TAG;
            }

            const fromUri = this.utils.getURI(request.caller);
            const toUri = this.utils.getURI(request.callee) ; // !this.useAppId and not this.useAppId for simplify the UT
            let sdp: string =  'v=0\r\no=user 1 1 IN IP4 0.0.0.0\r\ns=CallControl\r\nc=IN IP4 0.0.0.0\r\nt=0 0\r\nm=audio 9 RTP/AVP 0 8\r\na=inactive\r\n\r\n';

            let inviteReq: RequestDTO = {
                method: METHOD_INVITE,
                uri: uri,
                version: "2.0",
                headers: {
                    to: {uri: toUri},
                    from: {uri: fromUri, params: {tag: fromTag}},
                    "call-id": request.meetingId + "_" + request.roomType,
                    cseq: {method: METHOD_INVITE, seq: 1},
                    contact: [{uri: this.getContactUri(this.utils.getUserPart(request.callee))}],
                    authorization: request.accessToken,
                    'x-call-control': true,
                    'x-meetingid': request.meetingId,
                    "max-forwards": 70,
                    via: [],
                    "x-called-party-id": uri
                },
                content: sdp
            };

            if(request.service && request.service != undefined) {
                inviteReq.headers[HEADER_X_SERVICE_TYPE] = request.service;
            }
            if(request.service == "P2M") {
                let dialogType: number = (request.roomType && request.roomType == "ss") ? 1 : 2;
                inviteReq.headers[HEADER_DIALOGUE_TYPE] = dialogType;
            }

            return inviteReq;
        } catch (e) {
            this.logger.error({action: 'createRoomInvite', error: e.message ? e.message : e})
        }
    }

    public getTag() {
        let date = Date.now();
        let tag = String(date);
        return tag;
    }

    public getContactUri(user?: string) {
        // sip listen address (port and address)
        let port: number = process.env.SIP_PORT ? parseInt(process.env.SIP_PORT) : SIP_PORT;
        let address: string = process.env.SIP_ADDRESS? process.env.SIP_ADDRESS: `${ip.address()}`;

        // get config value - default is sip listen address
        let configAddress: string = this.config.get("sip.contact", `${address}:${port}`);

        // if SIP_CONTACT_ADDR exists it's first priority!!
        let addressValue: string = process.env.SIP_CONTACT_ADDR ? process.env.SIP_CONTACT_ADDR : configAddress;

        let contactUri: string = user ? `sip:${user}@${addressValue}` : `sip:${addressValue}`;
        return contactUri;
    }

    public getRestcomServerAddress(toUri: string): string {
        let restCommDomain: string | undefined = undefined;
        let isUrlConfEnabled: boolean = <boolean>this.config.get("restcomm.url.enabled", false);
        if (isUrlConfEnabled) {
            restCommDomain = process.env.RESTCOM_ADDRESS;
            if (!restCommDomain) {
                //No default value for port
                let port: number = <number>this.config.get("restcomm.port");
                let restcommAddress: string = this.config.get("restcomm.url.fqdn", process.env.SIP_ADDRESS? process.env.SIP_ADDRESS: ip.address());
                //let restcommAddress: string = this.config.get("restcomm.url", "127.0.0.1");
                restCommDomain = port ? `${restcommAddress}:${port}` : restcommAddress;
            }
        }

        return this.getRequestUri(toUri, restCommDomain);
    }

    public getMcuAddress(): string {
        let defaultAddress: string = this.config.get("mcu.fgdn", "127.0.0.1:5080");
        let address: string = process.env.MCU_ADDRESS ? process.env.MCU_ADDRESS : defaultAddress;
        let mcuAddress: string = "sip:mcu@" + address;
        return mcuAddress;
    }

    public getRequestUri(toUri: any, requestUriDomain: string | undefined): any {
        let toUriObj: SipURI = this.utils.parseUri(toUri);
        let requestUriUser = (toUriObj && toUriObj.user) ? toUriObj.user : this.config.get("restcomm.defAppId", "restcomm");

        toUriObj.user = requestUriUser;
        toUriObj.host = requestUriDomain ? requestUriDomain : toUriObj.host;

        let restComAddressUri = this.utils.uriToString(toUriObj);
        return restComAddressUri;
    }
}
