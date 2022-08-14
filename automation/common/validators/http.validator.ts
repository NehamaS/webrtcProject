import { BaseValidator } from "./validator";
import { WsRequestDto } from "../dto/ws.request.dto";
import { ApiGwDto } from "../dto/api.gw.dto";
import { Session } from "../dto/sipSessionDTO";
import { Context } from "../context";
import {
  ANSWER_ACTION,
  CALL_SERVICE_TYPE,
  FORBIDDEN_RESPONSE,
  REGISTER_ACTION,
  REGISTER_ACTION_ACK,
  SDP, STATUS_ACTION
} from "../constants";
import {strToAction} from "../utils";
import logger from "cucumber-tsflow/dist/logger";

export class HttpValidator extends BaseValidator {
  private sdp: any;
  constructor() {
    super();
    this.sdp = "HELLO"
  }

  public validate(session: Session, context: Context): void {
    if(context.errorCaseResponse.status >= 100) {
      switch (session.action) {
        case "Reject":
          expect(context.errorCaseResponse.status).toEqual(403);
          expect(context.errorCaseResponse.reason).toEqual(FORBIDDEN_RESPONSE);
          break;
        case "Busy":
          break;
        case "Not Found":
          expect(context.errorCaseResponse.status).toEqual(404);
          expect(context.errorCaseResponse.reason).toEqual(strToAction(session.action));
          break;
        default:
          throw new Error(`Unsupported action type [${session.action}]`);
      }
    } else if(session.wsResponse) {
    global.logger.debug({
        test:  global.logger["context"].current,
        step:this.validate.name,
        action: `validate ${session.action} headers response`
      });
      let res;
      if(session.action == REGISTER_ACTION) {
        res = session.wsResponse[REGISTER_ACTION_ACK.toLowerCase()];
      } else {
        res = session.wsResponse[(session.description).toLowerCase()];
      }
      expect(res.connectionId).toEqual(session.connectionId);
      expect(res.dto.callId).toEqual(session.callId);
      // expect(res.dto.source).toEqual(session.createResponses[session.action].dto.destination) //.toEqual(session.createResponses.Register.dto.destination);
      // expect(res.dto.destination).toEqual(session.createResponses.Register.dto.source);
      switch (session.action) {
        case "CreateRoom":
          expect(res.dto.type).toEqual("Video");
          session.meetingId=res.dto.meetingId
          //expect(res.dto.meetingId).toEqual(session.meetingId);
          break;
        case "Register":
          expect(res.dto.type).toEqual(REGISTER_ACTION_ACK);
          break;
        case "Start_Call":
          switch (session.description) {
            case "reject":
              expect(res.dto.body.description.toLowerCase()).toEqual(session.description);
              expect(res.dto.body.statusCode).toEqual("500");
              break;
            case "ringing":
              if(res.dto.body.action == ANSWER_ACTION){
                break;
              }
              expect(res.dto.body.action).toEqual(STATUS_ACTION);
              expect(res.dto.body.description.toLowerCase()).toEqual(session.description);
              expect(res.dto.body.statusCode).toEqual("200");
              break;
            case "answer":
              expect(res.dto.body.action).toEqual(ANSWER_ACTION);
              //expect(res.dto.body.sdp).toEqual(SDP);
              break;
          }
          break;
        case "End call":
          break;
      }
    }
  }
}