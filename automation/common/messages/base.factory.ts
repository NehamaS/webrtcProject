import { Session } from "../dto/sipSessionDTO";
import { MessageFactory } from "./factory";
import {Context} from "../context";

export abstract class BaseFactory<T, K> implements MessageFactory<T, K> {
  abstract message(type: T, session:Session, context: Context): K;
}
