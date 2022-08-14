import WebSocket = require('ws');
import NodeTTL = require('node-ttl');
import {sleep} from "../../../test/testutils/test.utils";
import {WebRtcError} from "../errors/webRtcError";
import { Context } from "../context";
import logger from "cucumber-tsflow/dist/logger";

export class WsService {

    private clients: Map<string, WebSocket>;
    private messageQueue: NodeTTL = new NodeTTL();

    protected context : Context;

    constructor() {
        this.clients = new Map<string, WebSocket>();
    }
    public setContext(ctx: Context){
        this.context = ctx;
    }

    public getClient(clientId: string): WebSocket | undefined {
        return this.clients.get(clientId);
    }

    public getMessage(key:string) : any {
        return this.messageQueue.get(key);
    }

    public async getMessageWithin(key:string, timeOut : number = 0) : Promise<any> {
        let msg : any = undefined;
        switch (timeOut){
            case 0 : return this.getMessage(key);
            default: {
                let timer = setTimeout(() => {
                    waitForMessage = false;
                    timer.unref();
                    if (!this.getMessage(key)) {
                        expect(new WebRtcError(this.context, `Message ${key} not received`)).handleException();
                    }
                }, timeOut);

                let waitForMessage: boolean = true;
                while (waitForMessage) {
                    msg = this.getMessage(key);
                    if (!msg) {
                        await sleep(5);
                        continue;
                    }
                    clearTimeout(timer);
                    timer.unref();
                    waitForMessage = false;
                    return msg;
                }
            }
        }
        return undefined;
    }

    public createClient(clientId: string,options:WebSocket.ClientOptions,context:Context): Promise<WebSocket> {
        let client: WebSocket = new WebSocket(process.env.CPAAS_HOME,options);
        this.clients.set(clientId, client);

        let self = this;

        return new Promise<WebSocket>((resolve, reject) => {


            try {
                client.onopen = function (openEvent) {
                    return resolve(client);
                };
                client.onclose = function (closeEvent: WebSocket.CloseEvent) {

                    global.logger.debug({
                        test: global.logger["context"].current,
                        step:"createClient",
                        action:'WebSocket client CLOSE: '+ JSON.stringify({
                            code: closeEvent.code,
                            reason: closeEvent.reason,
                            clean: closeEvent.wasClean
                        })
                    });
                };

                client.onerror = function (errorEvent: WebSocket.ErrorEvent) {

                    global.logger.error({
                        test: global.logger["context"].current,
                        step:"createClient",
                        error: `WebSocket client ERROR:  ${errorEvent.message}`
                    });
                };

                client.onmessage = function (messageEvent: WebSocket.MessageEvent): void {

                    global.logger.debug({
                        test: global.logger["context"].current,
                        step:"createClient",
                        action: `WebSocket client MESSAGE: ${messageEvent.data}`
                    });
                    if (messageEvent.data){
                        let msg : any = JSON.parse(<string>messageEvent.data);
                        if (msg.body) {
                            if (msg.type == "RegisterAck" || msg.action == "Register" || msg.action == "CallStart") {
                                self.messageQueue.push(`${msg.destination}#${msg.callId}#${msg.type}`, msg, null, 50);
                            } else {
                                self.messageQueue.push(`${msg.type}#${msg.callId.split("_")[0]}#${(msg.body.description && msg.body.description !=="Normal" && msg.body.description !== "OK")? msg.body.description: msg.body.action}`, msg, null, 50)
                            }
                        }
                        else {
                            let genResponses: Array<any> = self.messageQueue.get("genRsp") ? self.messageQueue.get("genRsp") : new Array<any>();
                            genResponses.push(msg);
                            self.messageQueue.push("genRsp",genResponses);
                        }
                    }
                };

                client.on('ping', (data) => {
                    global.logger.debug({
                        test: global.logger["context"].current,
                        step:"createClient",
                        action: `PING`
                    });
                    return 'pong';
                });
                client.on('pong', (data) => {

                    global.logger.debug({
                        test: global.logger["context"].current,
                        step:"createClient",
                        action: `PONG`
                    });
                    return 'ping';
                });

                client.on('error', (data) => {

                    global.logger.error({
                        test: global.logger["context"].current,
                        step:"createClient",
                        error: "Error: "+ data
                    });
                });
            } catch (exception) {
                global.logger.error({
                    test: global.logger["context"].current,
                    step:"createClient",
                    error: "exception: "+exception.message
                });

        }
    })
}
}
