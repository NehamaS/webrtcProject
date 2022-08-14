import express from "express";
import parser from "body-parser";
import { Request, Response } from "express";
import { Context } from "../context";
import { WsRequestDto } from "../dto/ws.request.dto";
import {ANSWER_ACTION, REGISTER_ACTION_ACK, START_ACTION,OPEN_ROOM_RESPONSE_ACTION} from "../constants";
import {RequestDTO} from "../dto/sipMessageDTO";

export class HttpClientServer {
  private app: any;
  private httpServer: any;

  private context : Context = new Context();

  constructor() {
    this.app = express();
    this.app.use(parser.json(), function (req, res, next) {
      return next();
    });
  }

  public setContext(ctx:Context){
    this.context = ctx;
  }

  public async validate(req: Request, res: Response) {
    try {
      const dto = JSON.parse(req.body.dto);
      const userId = `${dto.destination.split("@")[0]}_${this.context.currentTest}`;
      const session = this.context.getSession(userId);
      if(dto.type == REGISTER_ACTION_ACK) {
        session.wsResponse[dto.type.toLowerCase()] = <WsRequestDto>{
          connectionId: req.body.connectionId,
          dto: dto
        };
      } else if (dto.body.action == START_ACTION || dto.body.action == ANSWER_ACTION || dto.body.action==OPEN_ROOM_RESPONSE_ACTION) {
        session.wsResponse[dto.body.action.toLowerCase()] = <WsRequestDto>{
          connectionId: req.body.connectionId,
          dto: dto
        };
      } else {
        session.wsResponse[dto.body.description.toLowerCase()] = <WsRequestDto>{
          connectionId: req.body.connectionId,
          dto: dto
        };
      }
      if (res.statusCode == 200) {
        res.send("OK");
      }
      this.context.setSession(userId, session);
    } catch (e){
      global.logger.error({
        test:  global.logger["context"].current,
        step: this.validate.name,
        error: e.message
      });
      console.assert(false, `[${this.context.current}] validate error ${e.message}`);
      expect(e).handleException();
    }
  }
  
  public init() {
    this.app.get("/", function (req, res) {
      res.json({ message: "WELCOME to http client Service :-)" });
      console.info({ message: "WELCOME to http client Service :-)" });
    });

    const self = this;
    this.app.post("/actions", async (req: Request, res: Response) => {
      const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
      await self.validate(req, res);
    });
  }

  public start(hostName: string, port = 6060): Promise<boolean> {
    return new Promise((resolve) => {
      this.httpServer = this.app.listen(port,hostName, ()=> {
        global.logger.info({
          test:  global.logger["context"].current,
          step: this.start.name,
          message: `===================== HTTP server started on ${hostName}:${port} ===================`
        });
        return resolve(true);
      })
    })
  }

  public stop() {
    global.logger.info({
      test:  global.logger["context"].current,
      step: this.stop.name,
      message: `HTTP server stoped!!!`
    });
    this.httpServer.close();
  }

  public delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}