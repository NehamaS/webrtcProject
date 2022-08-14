import {Tags} from 'hot-shots'
import {Body} from "../dto/api.gw.dto";

// SIP
export const SIP_PORT = 5060;

// WSS
export const WS_PORT : number = 5210;
export const WSS_PORT : number = 5220;

// API GW Actions
export const REGISTER_ACTION: string = 'Register';
export const UNREGISTER_ACTION: string = 'Unregister';
export const REGISTER_ACTION_ACK: string = 'RegisterAck';

export const START_ACTION: string = 'CallStart';
export const STATUS_ACTION: string = 'CallStatus';
export const ANSWER_ACTION: string = 'Answer';
export const TERMINATE_ACTION: string = 'Terminate';
export const TERMINATE_ACK_ACTION: string = 'TerminateAck';

export const HOLD_ACTION: string = 'Hold';
export const HOLD_ACTION_ACK: string = 'HoldAnswer';
export const RESUME_ACTION: string = 'Resume';
export const RESUME_ACTION_ACK: string = 'ResumeAnswer';
export const MODIFY_ACTION: string = 'ModifyCall';
export const MODIFY_ACTION_ACK: string = 'ModifyCallAck';
export const UNDEFINED_ACTION: string = 'Undefined';

export const JOIN_REASON: string = 'Join';
export const RECONNECT_REASON: string = 'Reconnect';

export const ADD_PARTICIPANT_ACTION: string = 'AddParticipants';
export const ADD_PARTICIPANT_ACTION_ACK: string = 'AddParticipantsAck';
export const JOIN_CONFERENCE_ACTION: string = 'Invitation';
export const JOIN_CONFERENCE_ACTION_ACK: string = 'InvitationAck';

// API GW Conference Actions
export const CREATE_CONFERENCE_ACTION: string = 'Create';
export const CREATE_CONFERENCE_ACTION_ACK: string = 'CreateAck';
export const VIDEO_START_ACTION: string = 'VideoStart';
export const VIDEO_START_ACTION_ACK: string = 'Answer';
export const TERMINATE_CONNECTION_ACTION: string = 'Terminate';
export const TERMINATE_CONNECTION_ACTION_ACK: string = 'TerminateAck';
export const MODIFY_CONNECTION_ACTION: string = 'ModifyCall';
export const MODIFY_CONNECTION_ACTION_ACK: string = 'ModifyCallAck';
export const DESTROY_CONFERENCE_ACTION: string = 'Close';
export const DESTROY_CONFERENCE_ACTION_ACK: string = 'CloseAck';
export const START_SCREEN_SHARE_ACTION: string = 'StartScreenShare';
export const START_SCREEN_SHARE_ACTION_ACK: string = 'StartScreenShareAck';
export const STOP_SCREEN_SHARE_ACTION: string = 'StopScreenShare';
export const STOP_SCREEN_SHARE_ACTION_ACK: string = 'StopScreenShareAck';


// AWS Constants
export const AWS_API_VERSION: string = '2018-11-29';
export const WEBRTC_GW_VERSION: string = '1.0';

// API GW services
export const CALL_SERVICE_TYPE: string = 'Call';
export const UPDATE_CALL_TYPE: string = 'UpdateCall';
export const CONFERENCE_TYPE: string = 'Video';


export interface ErrorCode {
    CODE: string;
    DESC: string;
}

// API GW Error Codes
export const API_GW_RINGING: ErrorCode = {CODE: "200", DESC: 'Ringing'}
export const API_GW_NORMAL: ErrorCode = {CODE: "200", DESC: 'Normal'}
export const API_GW_BAD_REQUEST: ErrorCode = {CODE: "400", DESC: 'Bad Request'}
export const API_GW_UNAUTHORIZED: ErrorCode = {CODE: "401", DESC: 'Unauthorized'}
export const API_GW_BAD_FORBIDDEN: ErrorCode = {CODE: "403", DESC: 'Forbidden'}
export const API_GW_NOT_FOUND: ErrorCode = {CODE: "404", DESC: 'Not Found'}
export const API_GW_GONE: ErrorCode = {CODE: "410", DESC: 'Gone'}
export const API_GW_BUSY_HERE: ErrorCode = {CODE: "486", DESC: 'Busy Here'}
export const API_GW_REQUEST_TERMINATE: ErrorCode = {CODE: "487", DESC: 'Request Terminated'}

// Call Service Error Codes
export const CALL_SERVICE_RINGING: { CODE: string, DESC: string } = {CODE: "180", DESC: 'Ringing'}
export const CALL_SERVICE_OK: { CODE: string, DESC: string } = {CODE: "200", DESC: 'OK'}
export const CALL_SERVICE_BAD_EVENT: { CODE: string, DESC: string } = {CODE: "489", DESC: 'Bad Event'}

//Attributes
export const CONNECTION_ID = "connectionId";
export const DEVICE_ID = "deviceId"
export const ACCESS_TOKEN: string = "accessToken"
export const APP_SID: string = "appSid"
export const USER_ID: string = "userId"

//Headers
export const AUTH_HEADER: string = "Authorization";

//DynamoDb tables
export const SESSION_TABLE: string = "webrtc_sessions"
export const SIP_TABLE: string = "webrtc_sip"
export const ACTION_TABLE: string = "webrtc_action"
export const USERS_TABLE: string = "webrtc_users"

export const NO_CONNECTION: string = "none";


export const getMessageId = (messageId: string, srvType?: string): string => {
    switch (srvType) {
        case "P2P":
            return messageId;
        default:
            return process.env.POD_UID ? `${process.env.POD_UID}_${messageId}` : messageId;
    }
    return messageId;
}


export interface UserInfo {
    organizationSid: string
    accountSid: string
    applicationSid: string
    tag?: Tags
}

//Metrics counters
export enum CounterName {
    startCall = 'startCall', //makeCall
    endCall = 'endCall',
    rejectCall = 'rejectCall',
    acceptCall = 'acceptCall',
    wsConnectionAccepted = 'wsConnectionAccepted',
    wsConnectionRejected = 'wsConnectionRejected'

}

export enum RejectCallReason {
    noRecordInDB = 'noRecordInDB',
    errorResponse = 'errorResponse'
}

export interface CounterData {
    appSid: string,
    organizationId: string,
    accountId: string,
    tags?: Tags,
    value?: number
}

export const enum SrvType {
    P2P,
    P2A,
    A2P
}





