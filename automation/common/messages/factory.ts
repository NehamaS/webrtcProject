import { Session } from "../dto/sipSessionDTO";
import {Context} from "../context";

export interface MessageFactory<T, K> {
  message(type: T, session:Session, context: Context): K;
}

export enum ActionType {
  REGISTER,
  START_CALL,
  END_CALL,
  ANSWER,
  REJECT,
  END_CALL_BY_USER_B,
  TERMINATE_ACK,
  RINGING,
  OPEN_ROOM,
  UNREGISTER,
  START_MCU_CALL=10,
  MEDIA_STATUS=11

}

export const CALL_START = "CallStart";
export const CALL_END = "CallEnd";
export const ANSWER = "Answer";
export const REJECT = "Reject";
