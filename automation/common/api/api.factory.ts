import { Session } from "../dto/sipSessionDTO";
import { ActionType, MessageFactory } from "../messages/factory";
import { ApiGwDto } from "../dto/api.gw.dto";
import { RestMessageFactory } from "../messages/rest.message.factory";
import {Context} from "../context"
import { actionTypeToStr } from "../utils";
import { HttpClientServer } from "../http-client/http-client.server";

export abstract class ApiFactory {

  protected constructor(){}
  abstract send(msg: ApiGwDto, session: Session, context: Context);

  public async buildAndSendRequest(action: ActionType, session: Session, context: Context) {
    const factory: MessageFactory<any, any> = new RestMessageFactory();
    const apiReq: ApiGwDto = factory.message(action, session, context);

    global.logger.info({
        test: global.logger["context"].current,
        step:this.buildAndSendRequest.name,
        action: `${actionTypeToStr(action)} apiReq ======> ${JSON.stringify(apiReq)}`
    });
    const apiRes = await this.send(apiReq, session, context);
    return apiRes;
  }
}