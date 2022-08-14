import {BaseMessageFactory} from "./base.message.factory";
import {ActionType} from "./factory";
import {Session} from "../dto/sipSessionDTO";
import {Context} from "../context";

export class RestMessageFactory extends BaseMessageFactory {
  constructor() {
    super();

  }

  public message(action: ActionType, session: Session, context: Context) {
    switch (action) {
      case ActionType.REGISTER:
        return this.register(session, context);
      case ActionType.START_CALL:
        return this.startCall(session, context);
      case ActionType.END_CALL:
        return this.endCall(session, context);
      case ActionType.END_CALL_BY_USER_B:
        return this.endCallByUserB(session, context);
      case ActionType.ANSWER:
        return this.answerCall(session, context);
      case ActionType.REJECT:
        return this.rejectCall(session, context);
      case ActionType.TERMINATE_ACK:
        return this.terminateAck(session, context);
      case ActionType.RINGING:
        return this.ringing(session, context);
      case ActionType.UNREGISTER:
        return this.unregister(session, context);
      case ActionType.OPEN_ROOM:
        return this.openRoom(session, context);
      case ActionType.START_MCU_CALL:
        return this.mcuStartCall(session, context);
      default:
        throw new Error("not supported action option");
    }
  }
}