import { ActionType, MessageFactory } from "./factory";
import { Session } from "../dto/sipSessionDTO";
import { ApiGwDto } from "../dto/api.gw.dto";
import { rstring } from "../utils";
import { BaseFactory } from "./base.factory";
import {
  START_ACTION,
  OPEN_ROOM_ACTION,
  ANSWER_ACTION,
  CALL_SERVICE_TYPE,
  REGISTER_ACTION,
  TERMINATE_ACTION,
  TERMINATE_ACK_ACTION,
  JOIN,
  SDP,
  P2P,
  REJECT_RESPONSE, MCU_SERVICE_TYPE,
  P2A,
  RINGING_ACTION,
  STATUS_ACTION,
  REJECT_ACTION,
  UNREGISTER_ACTION,
  A2P, CONFERENCE_START_ACTION


} from "../constants";
import {Context} from "../context";

export abstract class BaseMessageFactory extends BaseFactory<ActionType, ApiGwDto> {

  constructor() {
    super();
  }

  protected register(session: Session, context: Context): ApiGwDto {
    const httpReq: ApiGwDto = <ApiGwDto>{
      callId: session.callId,
      messageId: "-1",
      source: `${session.srcUser}@${context.cpaasAppUrl}`,
      destination: session.destUser,
      ts: Date.now(),
      type: REGISTER_ACTION,
      body: {
        protocolVersion: "1.0",
        clientVersion: "1.0",
        appSid: session.AppSid,
        deviceId: session.deviceId,
        PNSToken: session.PNSToken,
        deviceType: session.deviceType,
      }
    };
    return httpReq;
  }

  protected unregister(session: Session, context: Context): ApiGwDto {
    const httpReq: ApiGwDto = <ApiGwDto>{
      callId: session.callId,
      messageId: session.messageId,
      source: `${session.srcUser}@${context.cpaasAppUrl}`,
      destination: session.destUser,
      ts: Date.now(),
      type: UNREGISTER_ACTION,
      body: {
        protocolVersion: "1.0",
        clientVersion: "1.0",
        appSid: session.AppSid,
        deviceId: session.deviceId,
        PNSToken: session.PNSToken,
        deviceType: session.deviceType,
      }
    };
    return httpReq;
  }

  protected startCall(session: Session, context: Context): ApiGwDto {
    const httpReq: ApiGwDto = <ApiGwDto>{
      source: `${session.srcUser}@${context.cpaasAppUrl}`,
      destination: `${session.destUser}@${context.cpaasAppUrl}`,
      callId: session.callId || rstring(),
      messageId: session.messageId,
      ts: Date.now(),
      type: CALL_SERVICE_TYPE,
      body: {
        action: START_ACTION,
        reason: JOIN,
        sdp: SDP,
        service: context.service,
        accessToken: "access",
        PNSToken: session.PNSToken,
      }
    };
    return httpReq;
  }

  protected mcuStartCall(session: Session, context: Context): ApiGwDto {
    const httpReq: ApiGwDto = <ApiGwDto>{
      source: `${session.srcUser}@${context.cpaasAppUrl}`,
      destination: "MCU",
      callId: session.callId || rstring(),
      messageId: session.messageId,
      meetingId: session.meetingId,
      ts: Date.now(),
      type: MCU_SERVICE_TYPE,
      body: {
        action: CONFERENCE_START_ACTION,
        reason: JOIN,
        sdp: SDP,
        service: context.service,
        displayName:session.srcUser,
        participantsList:[`${session.destUser}@gmail.com`],
      }
    };
    return httpReq;
  }

  protected openRoom(session: Session, context: Context): ApiGwDto {
    const httpReq: ApiGwDto = <ApiGwDto>{
      source: `${session.srcUser}@${context.cpaasAppUrl}`,
      destination: "MCU",
      callId: session.callId || rstring(),
      messageId: session.messageId,
      meetingId: session.meetingId,
      ts: Date.now(),
      type: MCU_SERVICE_TYPE,
      body: {
        action:OPEN_ROOM_ACTION,
        service: context.service,
        meetingName:"meeting1"
      }
    };
    return httpReq;
  }


  protected endCall(session: Session, context: Context): ApiGwDto {
    const httpReq: ApiGwDto = <ApiGwDto>{
      "source": `${session.srcUser}@${context.cpaasAppUrl}`,
      "destination": `${session.destUser}@${context.cpaasAppUrl}`,
      "callId": context.service === P2P? `${session.callId}_leg2`: session.callId,
      "messageId": session.messageId,
      "ts": Date.now(),
      "type": CALL_SERVICE_TYPE,
      "body": {
        "action": TERMINATE_ACTION,
        "statusCode": "200",
        "description": "normal",
        "service": context.service
      }
    };
    return httpReq;
  }

  protected endCallByUserB(session: Session, context: Context): ApiGwDto {
    const httpReq: ApiGwDto = <ApiGwDto>{
      "source": `${session.srcUser}@mavenir.com`,
      "destination": `${session.destUser}@${context.cpaasAppUrl}`,
      "callId": session.callId,
      "messageId": session.messageId,
      "ts": Date.now(),
      "type": CALL_SERVICE_TYPE,
      "body": {
        "action": TERMINATE_ACK_ACTION,
        "statusCode": "200",
        "description": "normal"
      }
    };
    return httpReq;
  }

  protected ringing(session: Session, context: Context): ApiGwDto {
    const req: ApiGwDto = <ApiGwDto>{
      "source": `${session.srcUser}@${context.cpaasAppUrl}`,
      "destination": `${session.destUser}@${context.cpaasAppUrl}`,
      "callId": context.service === A2P? `${session.callId}`: `${session.callId}_leg2`,
      "messageId": session.messageId,
      "ts": Date.now(),
      "type": CALL_SERVICE_TYPE,
      "body": {
        "action": STATUS_ACTION,
        // "requestMessageId": context.getSession((`${session.destUser}_${context.currentTest}`)).messageId,
        "statusCode": "200",
        "description": RINGING_ACTION,
        "service": context.service,
        // "sdp": SDP
      }
    };
    return req;
  };

  protected answerCall(session: Session, context: Context): ApiGwDto {
    const httpReq: ApiGwDto = <ApiGwDto>{
      "source": `${session.srcUser}@${context.cpaasAppUrl}`,
      "destination": `${session.destUser}@${context.cpaasAppUrl}`,
      "callId": context.service === A2P? `${session.callId}`: `${session.callId}_leg2`,
      "messageId": context.service === A2P? (parseInt(session.messageId) - 1).toString(): session.messageId,
      "ts": Date.now(),
      "type": CALL_SERVICE_TYPE,
      "body": {
        "action": ANSWER_ACTION,
        // "requestMessageId": context.getSession((`${session.destUser}_${context.currentTest}`)).messageId,
        "sdp": SDP,
        "service": context.service
      }
    };
    return httpReq;
  }

  protected rejectCall(session: Session, context: Context): ApiGwDto {
    const httpReq: ApiGwDto = <ApiGwDto>{
      "source": `${session.srcUser}@${context.cpaasAppUrl}`,
      "destination": `${session.destUser}@${context.cpaasAppUrl}`,
      "callId": context.service === A2P? `${session.callId}`: `${session.callId}_leg2`,
      "messageId": context.service === A2P? (parseInt(session.messageId) - 1).toString(): session.messageId,
      "ts": Date.now(),
      "type": CALL_SERVICE_TYPE,
      "body": {
        "action": STATUS_ACTION,
        "requestMessageId": context.service === P2P? context.getSession((`${session.destUser}_${context.currentTest}`)).messageId: "1",
        "statusCode": "403",
        "service": context.service,
        "description": REJECT_ACTION
      }
    };
    return httpReq;
  }

  protected terminateAck(session: Session, context: Context): ApiGwDto {
    const apiReq: ApiGwDto = <ApiGwDto>{
      "source": `${session.srcUser}@${context.cpaasAppUrl}`,
      "destination": `${session.destUser}@${context.cpaasAppUrl}`,
      "callId": context.service === P2P? `${session.callId}_leg2`: session.callId,
      "messageId": session.messageId,
      "ts": Date.now(),
      "type": CALL_SERVICE_TYPE,
      "body": {
        "action": TERMINATE_ACK_ACTION,
        "statusCode": "200",
        "requestMessageId": context.service === P2P? context.getSession((`${session.destUser}_${context.currentTest}`)).messageId: "1",
        "service": context.service
      }
    }
    return apiReq;
  }
}