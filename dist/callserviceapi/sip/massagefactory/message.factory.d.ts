import { RequestDTO } from "../common/sipMessageDTO";
import { SipSession } from "../common/sipSessionDTO";
import { ApiGwFormatDto } from "../../../dto/apiGwFormatDto";
import { ConfigurationService } from "service-infrastructure/common/config/configuration.service";
import { SipUtils } from "../common/sip.utils";
import { MculoggerService } from "service-infrastructure/common/logs/mculogger.service";
export declare const METHOD_INVITE = "INVITE";
export declare const METHOD_ACK = "ACK";
export declare const METHOD_INFO = "INFO";
export declare const METHOD_BYE = "BYE";
export declare const METHOD_CANCEL = "CANCEL";
export declare const METHOD_OPTIONS = "OPTIONS";
export declare const CONTENT_TYPE_APP_JSON = "application/json";
export declare const CONTENT_TYPE_APP_SDP = "application/sdp";
export declare const HEADER_X_MEETINGID = "x-meetingid";
export declare const HEADER_X_ROOMID = "x-roomid";
export declare const HEADER_X_DEVICEID = "x-deviceid";
export declare const HEADER_DIALOGUE_TYPE = "x-dialogue-type";
export declare const HEADER_X_CALLER_ID = "x-caller-id";
export declare const HEADER_X_SERVICE_TYPE = "x-service-type";
export declare const HEADER_X_RESTCOMM_CALLSID = "x-restcomm-callsid";
export declare const HEADER_CONTENT_TYPE = "content-type";
export declare const USER_AGENT = "Restcomm WebRTC Demo/2.3.2-274";
export declare const FROM_TAG = "55667788";
export declare const CONTENT_MSML = "application/msml+xml";
export declare class MessageFactory {
    private readonly config;
    private readonly utils;
    private readonly logger;
    constructor(config: ConfigurationService, utils: SipUtils, logger: MculoggerService);
    createInvite(request: ApiGwFormatDto): RequestDTO;
    createCancel(inviteReq: RequestDTO): RequestDTO;
    createReInvite(session: SipSession, sdp: string): RequestDTO;
    createMessage(method: string, session: SipSession, body?: any): RequestDTO;
    createRoomInvite(request: ApiGwFormatDto): RequestDTO;
    getTag(): string;
    getContactUri(user?: string): string;
    getRestcomServerAddress(toUri: string): string;
    getMcuAddress(): string;
    getRequestUri(toUri: any, requestUriDomain: string | undefined): any;
}
