import { Tags } from 'hot-shots';
export declare const SIP_PORT = 5060;
export declare const WS_PORT: number;
export declare const WSS_PORT: number;
export declare const REGISTER_ACTION: string;
export declare const UNREGISTER_ACTION: string;
export declare const REGISTER_ACTION_ACK: string;
export declare const START_ACTION: string;
export declare const STATUS_ACTION: string;
export declare const ANSWER_ACTION: string;
export declare const TERMINATE_ACTION: string;
export declare const TERMINATE_ACK_ACTION: string;
export declare const HOLD_ACTION: string;
export declare const HOLD_ACTION_ACK: string;
export declare const RESUME_ACTION: string;
export declare const RESUME_ACTION_ACK: string;
export declare const MODIFY_ACTION: string;
export declare const MODIFY_ACTION_ACK: string;
export declare const UNDEFINED_ACTION: string;
export declare const JOIN_REASON: string;
export declare const RECONNECT_REASON: string;
export declare const CREATE_CONFERENCE_ACTION: string;
export declare const CREATE_CONFERENCE_ACTION_ACK: string;
export declare const VIDEO_START_ACTION: string;
export declare const VIDEO_START_ACTION_ACK: string;
export declare const TERMINATE_CONNECTION_ACTION: string;
export declare const TERMINATE_CONNECTION_ACTION_ACK: string;
export declare const MODIFY_CONNECTION_ACTION: string;
export declare const MODIFY_CONNECTION_ACTION_ACK: string;
export declare const DESTROY_CONFERENCE_ACTION: string;
export declare const DESTROY_CONFERENCE_ACTION_ACK: string;
export declare const START_SCREEN_SHARE_ACTION: string;
export declare const START_SCREEN_SHARE_ACTION_ACK: string;
export declare const STOP_SCREEN_SHARE_ACTION: string;
export declare const STOP_SCREEN_SHARE_ACTION_ACK: string;
export declare const AWS_API_VERSION: string;
export declare const WEBRTC_GW_VERSION: string;
export declare const CALL_SERVICE_TYPE: string;
export declare const UPDATE_CALL_TYPE: string;
export declare const CONFERENCE_TYPE: string;
export interface ErrorCode {
    CODE: string;
    DESC: string;
}
export declare const API_GW_RINGING: ErrorCode;
export declare const API_GW_NORMAL: ErrorCode;
export declare const API_GW_BAD_REQUEST: ErrorCode;
export declare const API_GW_UNAUTHORIZED: ErrorCode;
export declare const API_GW_BAD_FORBIDDEN: ErrorCode;
export declare const API_GW_NOT_FOUND: ErrorCode;
export declare const API_GW_GONE: ErrorCode;
export declare const API_GW_BUSY_HERE: ErrorCode;
export declare const API_GW_REQUEST_TERMINATE: ErrorCode;
export declare const CALL_SERVICE_RINGING: {
    CODE: string;
    DESC: string;
};
export declare const CALL_SERVICE_OK: {
    CODE: string;
    DESC: string;
};
export declare const CALL_SERVICE_BAD_EVENT: {
    CODE: string;
    DESC: string;
};
export declare const CONNECTION_ID = "connectionId";
export declare const DEVICE_ID = "deviceId";
export declare const ACCESS_TOKEN: string;
export declare const APP_SID: string;
export declare const USER_ID: string;
export declare const AUTH_HEADER: string;
export declare const SESSION_TABLE: string;
export declare const SIP_TABLE: string;
export declare const ACTION_TABLE: string;
export declare const USERS_TABLE: string;
export declare const NO_CONNECTION: string;
export declare const getMessageId: (messageId: string, srvType?: string) => string;
export interface UserInfo {
    organizationSid: string;
    accountSid: string;
    applicationSid: string;
    tag?: Tags;
}
export declare enum CounterName {
    startCall = "startCall",
    endCall = "endCall",
    rejectCall = "rejectCall",
    acceptCall = "acceptCall",
    wsConnectionAccepted = "wsConnectionAccepted",
    wsConnectionRejected = "wsConnectionRejected"
}
export declare enum RejectCallReason {
    noRecordInDB = "noRecordInDB",
    errorResponse = "errorResponse"
}
export interface CounterData {
    appSid: string;
    organizationId: string;
    accountId: string;
    tags?: Tags;
    value?: number;
}
export declare const enum SrvType {
    P2P = 0,
    P2A = 1,
    A2P = 2
}
