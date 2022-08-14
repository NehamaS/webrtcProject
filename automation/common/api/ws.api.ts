import { ApiFactory } from "./api.factory";
import { ApiGwDto } from "../dto/api.gw.dto";
import { Session } from "../dto/sipSessionDTO";
import { Context } from "../context";
import {WsRequestDto} from "../dto/ws.request.dto";
import logger from "cucumber-tsflow/dist/logger";

export class WsApi extends ApiFactory {
  constructor() {
    super();
  }

  public async send(msg: ApiGwDto, session: Session, context: Context) {
    await session.wsClient.send(JSON.stringify(msg));
  }
}