import { ApiGwDto } from "../dto/api.gw.dto";
import { Session } from "../dto/sipSessionDTO";
import { WsRequestDto } from "../dto/ws.request.dto";
import { Context } from "../context";

export interface Validator {
  validate(session: Session, context: Context): void;
}

export abstract class BaseValidator implements Validator {
  abstract validate(session: Session, context: Context): void;
}
