import {forwardRef, Inject, Injectable, OnApplicationBootstrap} from "@nestjs/common";
import * as https from "https";
import * as WebSocket from 'ws';
import * as fs from "fs";

import {MculoggerService} from 'service-infrastructure/common/logs/mculogger.service';
import {WSS_PORT} from "../../common/constants";
import {WssAdmin} from "../admin/wss.admin";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {ClientMsgHandler} from "../../client.msg.handler";
import {ApiGwDto} from "../../dto/api.gw.dto";
import {WsRequestDto} from "../../dto/ws.request.dto";

const CERT_FILE = './conf/certificates/webrtcwwsocket-cert.pem';
const KEY_FILE = './conf/certificates/webrtcwwsocket-key.pem';

function heartbeat() {
    this.isAlive = true;
}

@Injectable()
export class WssController implements OnApplicationBootstrap {
    private wsServer;
    private httpsServer;

    constructor (private readonly config: ConfigurationService,
                 private readonly logger: MculoggerService,
                 private readonly wssAdmin: WssAdmin,
                 @Inject(forwardRef(() => ClientMsgHandler)) private readonly msgHandler: ClientMsgHandler) {
    }

    onApplicationBootstrap() {
        let wssEnable: boolean = this.config.get("websocket.wss.enabled", false);
        this.logger.info({service: 'WssController', enabled: wssEnable});

        if (wssEnable) {
            this.init();
        }
    }

    init() {
        this.logger.info({func: 'WssController.init()', port: WSS_PORT});

        const cert = fs.readFileSync(CERT_FILE);
        const key = fs.readFileSync(KEY_FILE);


        this.httpsServer = https.createServer({
            cert: cert,
            key: key
        });

        this.wsServer = new WebSocket.Server({ server: this.httpsServer });

        let _this = this;
        this.wsServer.on('connection', function connection(wss, req) {
            _this.logger.info({func: 'OnWssConnect'});

            wss.isAlive = true;
            wss.on('pong', heartbeat);

            _this.wssAdmin.onConnect(req, wss);

            wss.on('message', function message(data) {
                //_this.wssAdmin.onMessage(req, wss, data.toString());
                let apiMsg: ApiGwDto = JSON.parse(data.toString());

                let wsReq: WsRequestDto = {
                    connectionId: _this.wssAdmin.createConnId(req),
                    dto: apiMsg
                }

                _this.msgHandler.handleMsg(wsReq);
            });

            wss.on('close', function () {
                _this.logger.debug({func: 'OnWssClose', user: req.url});
                _this.wssAdmin.onClose(req, wss);
            });

            wss.on('error', function incoming(error) {
                _this.logger.error({func: 'OnWssError', err: error.message});
            });

        });

        this.httpsServer.listen(WSS_PORT);
    }

}
