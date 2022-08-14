import {ApiGwDto} from "../../src/dto/api.gw.dto";
import {ApiGwFormatDto} from "../../src/dto/apiGwFormatDto";
import {WsRequestDto} from "../../src/dto/ws.request.dto";
import {
    CALL_SERVICE_TYPE,
    STATUS_ACTION,
    MODIFY_ACTION,
    REGISTER_ACTION,
    START_ACTION,
    ANSWER_ACTION,
    HOLD_ACTION,
    TERMINATE_ACTION,
    JOIN_REASON,
    UNREGISTER_ACTION,
    CREATE_CONFERENCE_ACTION,
    CONFERENCE_TYPE,
    VIDEO_START_ACTION,
    TERMINATE_CONNECTION_ACTION,
    START_SCREEN_SHARE_ACTION,
    ADD_PARTICIPANT_ACTION,
    ADD_PARTICIPANT_ACTION_ACK,
    JOIN_CONFERENCE_ACTION
} from "../../src/common/constants";

// { //Data from current Access token
//     "userId": "Klara@webrtc-dev.restcomm.com",
//     "deviceId": "1656494358657159",
//     "accessToken": "eyJraWQiOiJNY2ZGTUdXNzNDYklKRFBpcGFpTUU0XC92cmE5aHN2ejAzSHo1ZVA2T2RoTT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJlZjQyYTJhNC00YjVjLTQ4N2YtOThjOC04ZDllNmNmZDcxNzUiLCJjb2duaXRvOmdyb3VwcyI6WyJDUFwvQWRtaW5pc3RyYXRvciJdLCJjdXN0b206YXBwbGljYXRpb25TaWQiOiJBUDQ0MzQzNTV0b21lciIsImN1c3RvbTphY2NvdW50U2lkIjoiQUMzYzViNDE3N2U1ZmRkODEzNzIwYmMwZDZkZDdmMDU3ZSIsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC51cy1lYXN0LTEuYW1hem9uYXdzLmNvbVwvdXMtZWFzdC0xX0l4aEFYa3V6WCIsImNvZ25pdG86cm9sZXMiOlsiYXJuOmF3czppYW06OjYwMDg3MzA4MDczNjpyb2xlXC9jb2duaXRvLWNwLWFkbWluaXN0cmF0b3Itcm9sZV91cy1lYXN0LTEiXSwiYXV0aF90aW1lIjoxNjU2NDk0MzYyLCJleHAiOjE2NTY0OTc5NjIsImN1c3RvbTpyb2xlIjoiQ1BcL0FkbWluaXN0cmF0b3IiLCJpYXQiOjE2NTY0OTQzNjIsImp0aSI6IjI4NWZiNmFmLWMzZjktNDc4NC04Y2UxLTVjYTQ2MGY5ZmJhMSIsImVtYWlsIjoid2VicnRjLmRldkBtYXZlbmlyLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJjdXN0b206ZGV2aWNlSWQiOiIxNjU2NDk0MzU4NjU3MTU5IiwiY3VzdG9tOm9yZ2FuaXphdGlvblNpZCI6Ik9SZDczYWFhNDVhODc1NDY2MzkxZmRkZDkwNDE5ZjQxNzYiLCJjb2duaXRvOnVzZXJuYW1lIjoiQUMzYzViNDE3N2U1ZmRkODEzNzIwYmMwZDZkZDdmMDU3ZSIsImdpdmVuX25hbWUiOiJBSzNjNWI0MTc3ZTVmZGQ4MTM3MjBiYzBkNmRkN2YwNTdlIiwiY3VzdG9tOnVzZXJJZCI6IktsYXJhQHdlYnJ0Yy1kZXYucmVzdGNvbW0uY29tIiwib3JpZ2luX2p0aSI6IjlkZjdmMGM4LTYzNzAtNDE2MC05MzBhLWY4OTg5NDMxODNhMCIsImF1ZCI6IjM4ODl2YzJqMDhubjg2bGNib3E0NW42bWIxIiwiZXZlbnRfaWQiOiI4YjRjZGMyOC02YmQ0LTQxZjUtOTQyMy1lM2M5OTNkNjJhMWQiLCJ0b2tlbl91c2UiOiJpZCIsIm5hbWUiOiJXZWJSVEMgRGV2IiwiZmFtaWx5X25hbWUiOiJBQzNjNWI0MTc3ZTVmZGQ4MTM3MjBiYzBkNmRkN2YwNTdlLVVTMTcxYWFjNjg3MmNlOTgyNThiZjljZGQxNDdhODU4NjUifQ.PkPdhngw8-O2n7ZQdl4uiRmmDglU8-z7iH-X3ofSmgnLlgn7sMNSTcf2Qldb2tQfg1bAtG3Q-Ps5twVIHTy4-qqXVCnfRwpbs17UZNINS-ytzHPUIxLcor4TpqrRF2PUb-d9pHMhIgG9IlFunnSuHgJPz3AvdFvoHk6NAo4B96MI_esuveASW10ovA-0IiwbanfUCb_r2RSLGLo9SIuyI2gpGYraTdc9VKNyNX955Ncw_L1WBWpZpaKjJeIuGhUZMbkt5__5NVFp3zNjwL7h9kWRGZef3xkPKwfOeyOwOw_ZfTn8RUxY-Vg35wwNsFaJ97aLcnOIADebNwgRuC3PkA",
//     "organizationSid": "ORd73aaa45a875466391fddd90419f4176",
//     "accountSid": "AC3c5b4177e5fdd813720bc0d6dd7f057e",
//     "appSid": "AP4434355tomer",
// }

let conn: string = "7123901873rhj2357";
let connB: string = "7123901873rhj235777777";
let callId: string = "1234-5678-9010" ;
let callIdB: string = "1234-5678-9010111" ;
let source: string = "Klara@webrtc-dev.restcomm.com" //Taken from Access token
let deviceId: string = '1656494358657159' ///Taken from Access token
let sourceB: string = "testaerB@gmail.com";
let destination: string = "testaerB@gmail.com";

let registerRequest: WsRequestDto = {
    connectionId: conn,
    dto: {
        callId: callId,
        messageId: "1",
        source: source,
        destination: "GW",
        ts: 12345,
        type: REGISTER_ACTION,
        body: {
            protocolVersion: "1.0",
            clientVersion: "1.0",
            deviceId: deviceId,
            deviceType: "WEB_BROWSER",
            PNSToken: "pns-token"
        }
    }
};

let registerRequestB: WsRequestDto = {
    connectionId: connB,
    dto: {
        callId: callIdB,
        messageId: "1",
        source: sourceB,
        destination: "GW",
        ts: 123456,
        type: REGISTER_ACTION,
        body: {
            protocolVersion: "1.0",
            clientVersion: "1.0",
            deviceType: "WEB_BROWSER",
            PNSToken: "pns-token",
            deviceId: "deviceId-1111122"
        }
    }
};

let unregisterRequest: WsRequestDto = {
    connectionId: conn,
    dto: {
        callId: callId,
        messageId: "1",
        source: source,
        destination: "GW",
        ts: 1234567,
        type: UNREGISTER_ACTION,
        body: {
            protocolVersion: "1.0",
            clientVersion: "1.0",
            PNSToken: "pns-token",
            deviceType: "WEB_BROWSER",
            deviceId: deviceId
        }
    }
};

let unregisterRequestB: WsRequestDto = {
    connectionId: connB,
    dto: {
        callId: callIdB,
        messageId: "1",
        source: sourceB,
        destination: "GW",
        ts: 12345678,
        type: UNREGISTER_ACTION,
        body: {
            protocolVersion: "1.0",
            clientVersion: "1.0",
            PNSToken: "pns-token",
            deviceType: "WEB_BROWSER",
            deviceId: deviceId
        }
    }
};

const callStartRequest: WsRequestDto = <WsRequestDto>{
    connectionId: conn,
    dto: <ApiGwDto> {
        source: source,
        destination: destination,
        callId: callId,
        messageId: "2",
        ts: 12345,
        type: CALL_SERVICE_TYPE,
        body: {
            action: START_ACTION,
            reason: JOIN_REASON,
            sdp: "m=audio 123",
            service: "P2A"
            // accessToken: "access",
            // PNSToken: "pns"
        }
    }
};

const callStartRequestOne2One: WsRequestDto = <WsRequestDto>{
    connectionId: conn,
    dto: {
        source: source,
        destination: destination,
        callId: callId,
        messageId: "2",
        meetingId: callId,
        ts: 12345,
        type: CALL_SERVICE_TYPE,
        body: {
            action: START_ACTION,
            reason: JOIN_REASON,
            sdp: "m=audio 123",
            service: "P2P"
            // accessToken: "access",
            // PNSToken: "pns"
        }
    }
};

const answerResponseOne2One: WsRequestDto = <WsRequestDto>{
    connectionId: connB,
    dto: {
        source: source,
        destination: destination,
        callId: callId + "_leg2",
        messageId: "2",
        meetingId: callId,
        ts: 12345,
        type: CALL_SERVICE_TYPE,
        body: {
            action: ANSWER_ACTION,
            sdp: "m=audio 123",
            service: "P2P"
            // accessToken: "access",
            // PNSToken: "pns"
        }
    }
};

const terminateResponseOne2One: WsRequestDto = <WsRequestDto>{
    connectionId: connB,
    dto: {
        source: source,
        destination: destination,
        callId: callId + "_leg2",
        messageId: "3",
        meetingId: callId,
        ts: 12345,
        type: CALL_SERVICE_TYPE,
        body: {
            action: ANSWER_ACTION,
            service: "P2P"
            //sdp: "m=audio 123"
            // accessToken: "access",
            // PNSToken: "pns"
        }
    }
};


const terminateRequest: WsRequestDto = {
    connectionId: 'ConnectionId-11112233',
    dto: {
        "source": source,
        "destination": destination,
        "callId": callId,
        "messageId": "3",
        "ts": 12345,
        "type": CALL_SERVICE_TYPE,
        "body": {
            "action": TERMINATE_ACTION,
            "statusCode": "200",
            "description": "normal"
        }
    }
};

const terminateRequestOne2One: WsRequestDto = {
    connectionId: conn,
    dto: {
        "source": source,
        "destination": destination,
        "callId": callId,
        "messageId": "3",
        "ts": 12345,
        "meetingId": callId,
        "type": CALL_SERVICE_TYPE,
        "body": {
            "action": TERMINATE_ACTION,
            "statusCode": "200",
            "description": "OK",
            "service": "P2P"
        }
    }
};


const startCallRequest: ApiGwFormatDto = {
    caller: source,
    callee: "testaerB@gmail.com",
    callId: callId,
    sequence: "2",
    sdp: "m=audio 123",
    service: "P2A",
    reason: "Join"
    //accessToken: "access"
};

const startCallRequestNoConnId: ApiGwFormatDto = {
    caller: source,
    callee: "222@gmail.com",
    callId: callId,
    sequence: "2",
    sdp: "m=audio 123",
    service: "P2A",
    reason: "Join"
    //accessToken: "access"
};

const startCallRequestNoConnIdArray: ApiGwFormatDto = {
    caller: source,
    callee: "22277@gmail.com",
    callId: callId,
    sequence: "2",
    sdp: "m=audio 123",
    service: "P2A",
    reason: "Join"
    //accessToken: "access"
};

const startCallRequestNotFound: ApiGwFormatDto = {
    caller: "111@gmail.com",
    callee: "222@gmail.com",
    callId: "111111111",
    sequence: "2",
    sdp: "m=audio 123",
    // accessToken: "access"
};

const ringCallResponse: ApiGwFormatDto = {
    "callee": source,
    "caller": "testaerB@gmail.com",
    "callId": callId,
    "sequence": "2",
    "status": {
        "code": "180",
        "desc": 'Ringing'
    }
};

const UnauthorizedCallResponse: ApiGwFormatDto = {
    "callee": source,
    "caller": "testaerB@gmail.com",
    "callId": callId,
    "sequence": "2",
    "status": {
        "code": "401",
        "desc": 'Unauthorized'
    }
};

const connectCallResponse: ApiGwFormatDto = {
    "caller": source,
    "callee": "testaerB@gmail.com",
    "callId": callId,
    "sequence": "2",
    "status": {
        "code": "200",
        "desc": 'OK'
    },
    "sdp": "answer sdp m=audio 567 ..."
};

const disconnectCallRequest: ApiGwFormatDto = {
    "callee": source,
    "caller": "testaerB@gmail.com",
    "callId": callId,
    "sequence": "1"
};

const callRequest: ApiGwFormatDto = {
    "callee": source,
    "caller": "testaerB@gmail.com",
    "callId": callId,
    "sequence": "1",
    "sdp": "offer sdp m=audio 567 ..."
};

const callStatusResponse: ApiGwDto = {
    "source": "testaerB@gmail.com",
    "destination": source,
    "callId": callId,
    "messageId": "1",
    "ts": 12345,
    "type": CALL_SERVICE_TYPE,
    "body": {
        "action": STATUS_ACTION,
        "requestMessageId": "G1_1",
        "statusCode": "200",
        "description": 'Ringing'
    }
};

const callAnswerResponse: ApiGwDto = {
    "source": "testaerB@gmail.com",
    "destination": source,
    "callId": callId,
    "messageId": "1",
    "ts": 12345,
    "type": CALL_SERVICE_TYPE,
    "body": {
        "action": ANSWER_ACTION,
        "requestMessageId": "G1_1",
        "sdp": "answer sdp m=audio 5678 .."
    }
};


const modifyCallRequest: ApiGwDto = {
    "source": source,
    "destination": "testaerB@gmail.com",
    "callId": callId,
    "messageId": "3",
    "ts": 12345,
    "type": CALL_SERVICE_TYPE,
    "body": {
        "action": MODIFY_ACTION,
        "sdp": "modify sdp, m=audio 123"
    }
};

const modifyCallResponse: ApiGwFormatDto = {
    "callee": source,
    "caller": "testaerB@gmail.com",
    "callId": callId,
    "sequence": "3",
    "sdp": "modify ack sdp m=audio 789 ..."
};

const holdCallRequest: ApiGwDto = {
    "source": source,
    "destination": "testaerB@gmail.com",
    "callId": callId,
    "messageId": "4",
    "ts": 12345,
    "type": CALL_SERVICE_TYPE,
    "body": {
        "action": HOLD_ACTION,
        "sdp": "hold sdp, m=audio 123"
    }
};

const holdCallResponse: ApiGwFormatDto = {
    "callee": source,
    "caller": "testaerB@gmail.com",
    "callId": callId,
    "sequence": "4",
    "sdp": "hold ack sdp m=audio 789 ..."
};

const updateCallRequest: ApiGwFormatDto = {

    "caller": "testaerB@gmail.com",
    "callee": source,
    "callId": callId,
    "sequence": "5",
    "sdp": "update call sdp, m=audio 987"
};

const callRejected: ApiGwFormatDto = {

    "caller": source,
    "callee": "testaerB@gmail.com",
    "callId": callId,
    "sequence": "2",
    "status": {
        "code": "403",
        "desc": 'Forbidden'
    }
};

const modifyRequest: WsRequestDto = <WsRequestDto>{
    connectionId: conn,
    dto: <ApiGwDto>modifyCallRequest
};

const disconnectRequestOne2One: WsRequestDto = {
    connectionId: conn,
    dto: <ApiGwDto>{}
}

const createConference: WsRequestDto = <WsRequestDto>{
    connectionId: conn,
    dto: <ApiGwDto> {
        source: source,
        destination: 'MCU',
        callId: callId,
        messageId: "2",
        ts: 12345,
        type: CONFERENCE_TYPE,
        body: {
            action: CREATE_CONFERENCE_ACTION,
            service: "P2M",
            meetingName: 'test conference'
       }
    }
};

const createConferenceRsp: ApiGwFormatDto = <ApiGwFormatDto>{
    caller: 'MCU',
    callee: source,
    callId: callId,
    meetingId: '1234-5678',
    sequence: "2",
    ts: 12345,
    service: "P2M",
    status: {
        code: '200',
        desc: 'ok'
    }
};

const joinConference: WsRequestDto = <WsRequestDto>{
    connectionId: conn,
    dto: <ApiGwDto> {
        source: source,
        destination: 'MCU',
        callId: callId,
        meetingId: '1234-5678',
        messageId: "3",
        ts: 12345,
        type: CONFERENCE_TYPE,
        body: {
            action: VIDEO_START_ACTION,
            meetingName: 'test conference',
            callerDisplayName: 'Tester',
            service: "P2M",
            participantsList: ['usera@gmil.com', 'userb@walla.com'],
            sdp: 'join sdp ...'
        }
    }
};

const joinConferenceRsp: ApiGwFormatDto = <ApiGwFormatDto>{
    caller: 'MCU',
    callee: source,
    callId: callId,
    meetingId: '1234-5678',
    sequence: "3",
    ts: 12345,
    service: "P2M",
    status: {
        code: '200',
        desc: 'ok'
    },
    sdp: 'join answer sdp'
};

const leaveConference: WsRequestDto = <WsRequestDto>{
    connectionId: conn,
    dto: <ApiGwDto> {
        source: source,
        destination: 'MCU',
        callId: callId,
        meetingId: '1234-5678',
        messageId: "4",
        ts: 12345,
        type: CONFERENCE_TYPE,
        body: {
            action: TERMINATE_CONNECTION_ACTION,
            service: "P2M",
            statusCode: '200',
            description: 'normal'
        }
    }
};

const leaveConferenceRsp: ApiGwFormatDto = <ApiGwFormatDto>{
    caller: 'MCU',
    callee: source,
    callId: callId,
    meetingId: '1234-5678',
    sequence: "4",
    ts: 12345,
    service: "P2M",
    status: {
        code: '200',
        desc: 'ok'
    }
};

const startScreenShare: WsRequestDto = <WsRequestDto>{
    connectionId: conn,
    dto: <ApiGwDto> {
        source: source,
        destination: 'MCU',
        callId: callId,
        meetingId: '1234-5678',
        messageId: "5",
        ts: 12345,
        type: CONFERENCE_TYPE,
        body: {
            action: START_SCREEN_SHARE_ACTION,
            meetingName: 'test conference',
            callerDisplayName: 'Tester',
            service: "P2M",
            sdp: 'Screen Share request sdp ...'
        }
    }
};

const startScreenShareRsp: ApiGwFormatDto = <ApiGwFormatDto>{
    caller: 'MCU',
    callee: source,
    callId: callId,
    meetingId: '1234-5678',
    sequence: "5",
    ts: 12345,
    service: "P2M",
    status: {
        code: '200',
        desc: 'ok'
    },
    sdp: 'Screen Share answer sdp'
};

const addParticipantsReq: ApiGwDto = {
    callId : '12345-6789',
    messageId: '1',
    meetingId: 'meeting-id: 567890',
    source: 'userC@mavenir.com',
    destination: 'mgw@mavenir.com',
    ts: 7378723812,
    type: 'Video',
    body: {
        meetingName: 'my meeting',
        action: ADD_PARTICIPANT_ACTION,
        service: 'P2M',
        participantsList: ['userA@mavenir.com', 'userD@mavenir.com']
    }
}

// missing ts
const addParticipantsRsp = {
    callId : '12345-6789',
    messageId: '1',
    meetingId: 'meeting-id: 567890',
    source: 'mgw@mavenir.com',
    destination: 'userC@mavenir.com',
    type: 'Video',
    body: {
        meetingName: 'my meeting',
        action: ADD_PARTICIPANT_ACTION_ACK,
        service: 'P2M',
        requestMessageId: '1'
    }
}

// missing ts
const joinConferenceReq = {
    callId : '12345-6789',
    messageId: '1',
    meetingId: 'meeting-id: 567890',
    source: 'userC@mavenir.com',
    destination: 'userA@mavenir.com',
    type: 'Video',
    body: {
        meetingName: 'my meeting',
        action: JOIN_CONFERENCE_ACTION,
        service: 'P2M'
    }
}


export {
    registerRequest, registerRequestB, callStartRequest, startCallRequestNoConnId, startCallRequestNoConnIdArray, startCallRequestNotFound, callStartRequestOne2One, startCallRequest, ringCallResponse, connectCallResponse,
    disconnectCallRequest, callRequest, callStatusResponse, callAnswerResponse, terminateRequest, terminateRequestOne2One,
    modifyCallRequest, modifyCallResponse, holdCallRequest, holdCallResponse, updateCallRequest,
    callRejected, modifyRequest, conn, connB, answerResponseOne2One, disconnectRequestOne2One, UnauthorizedCallResponse, unregisterRequest, unregisterRequestB,
    createConference, createConferenceRsp, joinConference, joinConferenceRsp, source, deviceId, leaveConference, leaveConferenceRsp, startScreenShare, startScreenShareRsp,
    addParticipantsReq, addParticipantsRsp, joinConferenceReq
};


