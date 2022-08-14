import {ApiGwDto} from "./dto/api.gw.dto";
import {ApiGwFormatDto} from "./dto/apiGwFormatDto";
import {WsRequestDto} from "./dto/ws.request.dto";

let conn : string = "7123901873rhj2357";


const callStartRequest: WsRequestDto = <WsRequestDto>{
    connectionId: '11223344',
    type:"call",
    dto: {
        source: "testaerA@gmail.com",
        destination: "testaerB@gmail.com",
        callId: "1234-5678-9010",
        messageId: "2",
        ts: 12345,
        type: "call",
        body: {
            action: "callStart",
            reason: "join",
            sdp: "m=audio 123"
            // accessToken: "access",
            // PNSToken: "pns"
        }
    }
};

const startCallRequest: ApiGwFormatDto = {
    caller: "testaerA@gmail.com",
    callee: "testaerB@gmail.com",
    callId: "1234-5678-9010",
    sequence: 2,
    sdp: "m=audio 123",
    accessToken: "access"
};

const ringCallResponse: ApiGwFormatDto = {
    "callee": "testaerA@gmail.com",
    "caller": "testaerB@gmail.com",
    "callId": "1234-5678-9010",
    "sequence": 2,
    "status": {
        "code": 180,
        "desc": 'Ringing'
    }
};

const connectCallResponse: ApiGwFormatDto = {
    "callee": "testaerA@gmail.com",
    "caller": "testaerB@gmail.com",
    "callId": "1234-5678-9010",
    "sequence": 2,
    "status": {
        "code": 200,
        "desc": 'OK'
    },
    "sdp": "answer sdp m=audio 567 ..."
};

const disconnectCallRequest: ApiGwFormatDto = {
    "callee": "testaerA@gmail.com",
    "caller": "testaerB@gmail.com",
    "callId": "1234-5678-9010",
    "sequence": 1
};

const callRequest: ApiGwFormatDto = {
    "callee": "testaerA@gmail.com",
    "caller": "testaerB@gmail.com",
    "callId": "1234-5678-9010",
    "sequence": 1,
    "sdp": "offer sdp m=audio 567 ..."
};

const callStatusResponse: ApiGwDto = {
    "source": "testaerB@gmail.com",
    "destination": "testaerA@gmail.com",
    "callId": "1234-5678-9010",
    "messageId": "1",
    "ts": 12345,
    "type": "call",
    "body": {
        "action" : "callStatus",
        "requestMessageId": "G1_1",
        "statusCode": "200",
        "description": 'Ringing'
    }
};

const callAnswerResponse: ApiGwDto = {
    "source": "testaerB@gmail.com",
    "destination": "testaerA@gmail.com",
    "callId": "1234-5678-9010",
    "messageId": "1",
    "ts": 12345,
    "type": "call",
    "body": {
        "action" : "answer",
        "requestMessageId": "G1_1",
        "sdp": "answer sdp m=audio 5678 .."
    }
};

const terminateRequest: WsRequestDto = {
    connectionId: 'ConnectionId-11112233',
    dto: {
        "source": "testaerA@gmail.com",
        "destination": "testaerB@gmail.com",
        "callId": "1234-5678-9010",
        "messageId": "2",
        "ts": 12345,
        "type": "call",
        "body": {
            "action": "terminate",
            "statusCode": "200",
            "description": "normal"
        }
    }
};

const modifyCallRequest: ApiGwDto = {
    "source": "testaerA@gmail.com",
    "destination": "testaerB@gmail.com",
    "callId": "1234-5678-9010",
    "messageId": "3",
    "ts": 12345,
    "type": "call",
    "body": {
        "action" : "modifyCall",
        "sdp": "modify sdp, m=audio 123"
    }
};

const modifyCallResponse: ApiGwFormatDto = {
    "callee": "testaerA@gmail.com",
    "caller": "testaerB@gmail.com",
    "callId": "1234-5678-9010",
    "sequence": 3,
    "sdp": "modify ack sdp m=audio 789 ..."
};

const holdCallRequest: ApiGwDto = {
    "source": "testaerA@gmail.com",
    "destination": "testaerB@gmail.com",
    "callId": "1234-5678-9010",
    "messageId": "4",
    "ts": 12345,
    "type": "call",
    "body": {
        "action" : "hold",
        "sdp": "hold sdp, m=audio 123"
    }
};

const holdCallResponse: ApiGwFormatDto = {
    "callee": "testaerA@gmail.com",
    "caller": "testaerB@gmail.com",
    "callId": "1234-5678-9010",
    "sequence": 4,
    "sdp": "hold ack sdp m=audio 789 ..."
};

const updateCallRequest: ApiGwFormatDto = {

    "caller": "testaerB@gmail.com",
    "callee": "testaerA@gmail.com",
    "callId": "1234-5678-9010",
    "sequence": 5,
    "sdp": "update call sdp, m=audio 987"
};

const callRejected: ApiGwFormatDto = {

    "caller": "testaerA@gmail.com",
    "callee": "testaerB@gmail.com",
    "callId": "1234-5678-9010",
    "sequence": 2,
    "status": {
        "code": 403,
        "desc": 'Forbidden'
    }
};



export { callStartRequest, startCallRequest, ringCallResponse, connectCallResponse,
    disconnectCallRequest, callRequest, callStatusResponse, callAnswerResponse, terminateRequest,
    modifyCallRequest, modifyCallResponse, holdCallRequest, holdCallResponse, updateCallRequest,
    callRejected
};


