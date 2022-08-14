import {forwardRef, Inject, Injectable, OnModuleInit} from "@nestjs/common";
import {WsRequestDto} from "../../dto/ws.request.dto";
import {ApiGwDto} from "../../dto/api.gw.dto";
import {ClientMsgHandler} from "../../client.msg.handler";
import * as WebSocket from 'ws';
import * as ip from "ip";
import {WS_PORT} from "../../common/constants";

@Injectable()
export class WssAdmin {

    private wsConnMap: Map<String, any> = new Map();
    private gwConnMap: Map<String, any> = new Map();
    private readonly localIp: string;

    constructor() {
        if (process.platform == 'win32') {
            this.localIp = process.env.LOCAL_ADDRESS || ip.address();
        }
        else {
            this.localIp = process.env.LOCAL_ADDRESS || ip.address('eth0');
        }

        console.log({service: 'wssAdmin()', localIp: this.localIp});
    }

    public onConnect(req, wss: WebSocket) {
        this.wsConnMap.set(this.createConnId(req), wss);
    }

    public onClose(req, wss: WebSocket) {
        this.wsConnMap.delete(this.createConnId(req));
        wss.close();
    }

    public createConnId(req) {
        return '_ws_' + req.socket.remoteAddress + '.' + req.socket.remotePort + '_gw_' + this.localIp;
    }

    getWebRtcGwIp(connId: string) {
        let gwIp: string = connId.substring(connId.indexOf('_gw_') + 4);

        let isLocalGw: boolean =  true;
        if (this.localIp != gwIp) {
            isLocalGw = false;
        }

        let rsp = {func: 'getWebRtcGwIp', gwIp: gwIp, isLocalGw: isLocalGw};
        console.log({ip: this.localIp, gwIp: gwIp, isLocalGw: isLocalGw});

        return rsp;
    }

    private async sendMsg2RemoteGw(addr: string, msg: ApiGwDto) {
        const WebSocket = require('ws');

        let wsConn = this.gwConnMap.get(addr);
        if (wsConn != undefined) {
            if (wsConn.readyState === WebSocket.OPEN) {
                wsConn.send(JSON.stringify(msg));
                return;
            }
            else {
                console.log({func: 'sendMsg2RemoteGw()', desc: 'WS Closed'});
                this.gwConnMap.delete(addr);
            }
        }

        let host: string = 'ws://' + addr + ':' + WS_PORT;
        console.log({func: 'sendMsg2RemoteGw()', host: host, msg: msg});

        const wsClient = new WebSocket(host);

        let _this = this;
        wsClient.on('open', function open() {
            console.log({func: 'sendMsg2RemoteGw(open)'});

            _this.gwConnMap.set(addr, wsClient);
            wsClient.send(JSON.stringify(msg));
        });

        wsClient.on('message', function message(data) {
            console.log(data);
        });

        wsClient.on('close', function close() {
            console.log({func: 'sendMsg2RemoteGw(close)', addr: addr});
        });

    }

    public async sendMessage(connId: string, msg: ApiGwDto) {

        let wss = this.wsConnMap.get(connId);
        if (wss != undefined) {
            let rsp = this.getWebRtcGwIp(connId);
            if (rsp.isLocalGw) {
                // for local debug only
                //if (msg.body.action == 'JoinConference') {
                    await this.sendMsg2RemoteGw(rsp.gwIp, msg);
                    return;
                //}
            }

            if (wss.readyState === WebSocket.OPEN) {
                //console.log({func: 'wssAdmin:sendMessage', conn: connId});
                wss.send(JSON.stringify(msg));
            } else {
                console.error({func: 'wssAdmin:sendMessage()', conn: connId, desc: 'websocket closed'});
            }
        }
        else {
            console.error({func: 'wssAdmin:sendMessage()', conn: connId, desc: 'websocket not found'});
        }
    }

}