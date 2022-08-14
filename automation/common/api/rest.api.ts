import { ApiFactory } from "./api.factory";
import { ApiGwDto } from "../dto/api.gw.dto";
import { LOCAL_HOST } from "../constants";
import { WsRequestDto } from "../dto/ws.request.dto";
import { Session } from "../dto/sipSessionDTO";
import request from "supertest";
import { Context } from "../context";

export class RestApi extends ApiFactory {
  constructor() {
    super();
  }

  public async send(msg: ApiGwDto, session: Session, context: Context) {
    global.logger.debug({
      test: global.logger["context"].current,
      step:this.send.name,
      action: `send http request to POST TO CONNECTION MOCK...  connectionId: ${session.connectionId}`
    });
    const httpRes = await request(`${LOCAL_HOST}:9001`)
        .post("/actions")
        .set("Accept", "application/json")
        .send(<WsRequestDto>{ connectionId: session.connectionId, dto: msg });
    return httpRes;
  }
}