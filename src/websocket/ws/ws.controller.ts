import {forwardRef, Inject, Injectable, OnApplicationBootstrap} from "@nestjs/common";
import * as WebSocket from 'ws';

import {MculoggerService} from 'service-infrastructure/common/logs/mculogger.service';
import {WS_PORT} from "../../common/constants";
import {WssAdmin} from "../admin/wss.admin";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {ApiGwDto} from "../../dto/api.gw.dto";
import {WsRequestDto} from "../../dto/ws.request.dto";
import {ClientMsgHandler} from "../../client.msg.handler";

function heartbeat() {
    this.isAlive = true;
}

@Injectable()
export class WsController implements OnApplicationBootstrap {
    private wsServer;

    constructor (private readonly config: ConfigurationService,
                 private readonly logger: MculoggerService,
                 private readonly wssAdmin: WssAdmin,
                 @Inject(forwardRef(() => ClientMsgHandler)) private readonly msgHandler: ClientMsgHandler) {
    }

    onApplicationBootstrap() {
        let wsEnable: boolean = this.config.get("websocket.ws.enabled", false);
        this.logger.info({service: 'WsController', enabled: wsEnable});

        if (wsEnable) {
            this.init();
        }
    }

    init() {
        this.logger.info({func: 'WsController:init()', port: WS_PORT});
        this.wsServer = new WebSocket.Server({port: WS_PORT});

        let _this = this;
        this.wsServer.on('connection', function connection(ws, req) {
            _this.logger.info({func: 'OnWsConnect', req: req});

            ws.isAlive = true;
            ws.on('pong', heartbeat);

            _this.wssAdmin.onConnect(req, ws);

            ws.on('message', function message(data) {
                _this.logger.info({func: 'onMsg', msg: data.toString()});

                //_this.wssAdmin.onMessage(req, ws, data.toString());
                let apiMsg: ApiGwDto = JSON.parse(data.toString());

                let wsReq: WsRequestDto = {
                    connectionId: _this.wssAdmin.createConnId(req),
                    dto: apiMsg
                }

                _this.msgHandler.handleMsg(wsReq);
            });

            ws.on('close', function () {
                _this.logger.info({func: 'OnWsClose', conn: _this.wssAdmin.createConnId(req)});
                _this.wssAdmin.onClose(req, ws);
            });

            ws.on('error', function incoming(error) {
                _this.logger.error({func: 'OnWsError', err: error.message});
            });

        });
    }
}
