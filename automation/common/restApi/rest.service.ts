import { Session } from "../dto/sipSessionDTO";
import { ActionType, MessageFactory } from "../messages/factory";
import { ApiGwDto } from "../dto/api.gw.dto";
import { RestMessageFactory } from "../messages/rest.message.factory";
import { validate } from "class-validator";
import request from "supertest";
import { LOCAL_HOST } from "../constants";
import { WsRequestDto } from "../dto/ws.request.dto";
import { Validator } from "../validators/validator";
import {Context} from "../context"
import { actionTypeToStr } from "../utils";

export class RestService {

  constructor(/*private validator?: Validator*/){}

  public async buildHttpRequest(action: ActionType, session: Session, context:Context) {
    return await this.performAction(action, session, context)
  }

  // private async performAction(action: ActionType, session: Session): Promise<ApiGwDto> {
  //   const factory: RestcomMessageFactory<any, any> = new RestMessageFactory();
  //   console.info(`perform action...`)
  //   const httpReq: ApiGwDto = factory.message(action, session);
  //   return httpReq;
  // }

  private async performAction(action: ActionType, session: Session, context: Context): Promise<ApiGwDto> {
    // await validate(session);
    const factory: MessageFactory<any, any> = new RestMessageFactory();
    global.debug({
      test: global.logger["context"].current,
      step:this.performAction.name,
      action: `perform ${actionTypeToStr(action)} action...`
    });
    const httpReq: ApiGwDto = factory.message(action, session, context);
    global.debug({
      test: global.logger["context"].current,
      step:this.performAction.name,
      action: `${actionTypeToStr(action)} httpReq ======> ${JSON.stringify(httpReq)}`
    });
    const httpRes = await request(`${LOCAL_HOST}:9001`)
      .post("/actions")
      .set("Accept", "application/json")
      .send(<WsRequestDto>{connectionId: session.connectionId, dto: httpReq});
    // console.log("httpRes: "+JSON.stringify(httpRes))
    // if (this.validator) {
    //   if (Object.getOwnPropertyNames(this.validator).length > 0) {
    //     // @ts-ignore
    //     this.validator.validate(httpReq, httpRes, session);
    //   } else {
    //     console.warn("can't perform validations...");
    //   }
    // }
    // @ts-ignore
    return httpRes;
  }
}